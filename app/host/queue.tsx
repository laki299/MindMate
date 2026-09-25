import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../stores/authStore";
import { QueueItem } from "../../lib/types";
import { COLORS } from "../../lib/constants";

export default function HostQueueScreen() {
  const { session } = useAuthStore();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<string | null>(null);

  async function fetchQueue() {
    if (!session?.user) return;

    const { data } = await supabase
      .from("queue")
      .select("*")
      .eq("host_id", session.user.id)
      .order("position", { ascending: true });

    if (data) setQueue(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchQueue();

    const channel = supabase
      .channel("host-queue")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "queue",
          filter: `host_id=eq.${session?.user.id}`,
        },
        () => fetchQueue()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  async function handleSelectUser(userId: string) {
    if (!session?.user) return;

    setSelecting(userId);

    const { data, error } = await supabase.rpc("start_conversation", {
      p_host_id: session.user.id,
      p_user_id: userId,
    });

    setSelecting(null);

    if (error) {
      Alert.alert("Error", error.message);
      return;
    }

    if (data) {
      router.push(`/conversation/${data}`);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View
        style={{
          paddingTop: 50,
          paddingHorizontal: 16,
          paddingBottom: 12,
          backgroundColor: COLORS.card,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Text style={{ fontSize: 24, color: COLORS.primary }}>‹</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: "600", color: COLORS.text }}>
          Waiting Queue
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={queue}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <View style={{ alignItems: "center", marginTop: 60 }}>
              <Text style={{ color: COLORS.textSecondary }}>কেউ অপেক্ষা করছে না</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View
              style={{
                backgroundColor: COLORS.card,
                borderRadius: 14,
                padding: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: COLORS.border,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View>
                <Text style={{ fontWeight: "600", color: COLORS.text }}>
                  #{item.position} — User {item.user_id.slice(0, 8)}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => handleSelectUser(item.user_id)}
                disabled={!!selecting}
                style={{
                  backgroundColor: COLORS.primary,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 10,
                  opacity: selecting ? 0.6 : 1,
                }}
              >
                {selecting === item.user_id ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "600" }}>Select</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}
