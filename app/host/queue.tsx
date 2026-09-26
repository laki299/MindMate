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
  const [blocking, setBlocking] = useState<string | null>(null);

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
          filter: `host_id=eq.${session?.user?.id}`,
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

  async function handleBlockUser(userId: string) {
    if (!session?.user) return;

    Alert.alert(
      "ব্লক করবে?",
      "এই ইউজার queue থেকে সরবে এবং ব্লক লিস্টে যাবে।",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: async () => {
            setBlocking(userId);

            const { error: blockError } = await supabase
              .from("user_blocks")
              .insert({
                host_id: session.user.id,
                user_id: userId,
                reason: "Blocked from queue by host",
              });

            if (blockError && blockError.code !== "23505") {
              setBlocking(null);
              Alert.alert("Error", blockError.message);
              return;
            }

            await supabase
              .from("queue")
              .delete()
              .eq("host_id", session.user.id)
              .eq("user_id", userId);

            setBlocking(null);
            setQueue((prev) => prev.filter((q) => q.user_id !== userId));
            Alert.alert("সফল", "ইউজার ব্লক করা হয়েছে");
          },
        },
      ]
    );
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
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginRight: 12 }}
        >
          <Text style={{ fontSize: 24, color: COLORS.primary }}>‹</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: "600", color: COLORS.text }}>
          Waiting Queue
        </Text>
      </View>

      {loading ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={queue}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <View style={{ alignItems: "center", marginTop: 60 }}>
              <Text style={{ color: COLORS.textSecondary }}>
                কেউ অপেক্ষা করছে না
              </Text>
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
              }}
            >
              <Text
                style={{
                  fontWeight: "600",
                  color: COLORS.text,
                  marginBottom: 12,
                }}
              >
                #{item.position} — User {item.user_id.slice(0, 8)}...
              </Text>

              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  onPress={() => handleSelectUser(item.user_id)}
                  disabled={!!selecting || !!blocking}
                  style={{
                    flex: 1,
                    backgroundColor: COLORS.primary,
                    paddingVertical: 10,
                    borderRadius: 10,
                    alignItems: "center",
                    opacity: selecting || blocking ? 0.6 : 1,
                  }}
                >
                  {selecting === item.user_id ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={{ color: "#fff", fontWeight: "600" }}>
                      Select
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleBlockUser(item.user_id)}
                  disabled={!!selecting || !!blocking}
                  style={{
                    flex: 1,
                    backgroundColor: "#FEE2E2",
                    paddingVertical: 10,
                    borderRadius: 10,
                    alignItems: "center",
                    opacity: selecting || blocking ? 0.6 : 1,
                  }}
                >
                  {blocking === item.user_id ? (
                    <ActivityIndicator color={COLORS.danger} size="small" />
                  ) : (
                    <Text style={{ color: COLORS.danger, fontWeight: "600" }}>
                      Block
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}
