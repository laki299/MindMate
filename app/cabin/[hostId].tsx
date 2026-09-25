import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../stores/authStore";
import { Host, QueueItem } from "../../lib/types";
import { COLORS } from "../../lib/constants";

export default function CabinScreen() {
  const { hostId } = useLocalSearchParams<{ hostId: string }>();
  const { session, profile } = useAuthStore();
  const [host, setHost] = useState<Host | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [inQueue, setInQueue] = useState(false);

  async function fetchData() {
    if (!hostId) return;

    const [hostRes, queueRes] = await Promise.all([
      supabase.from("hosts").select("*").eq("id", hostId).single(),
      supabase
        .from("queue")
        .select("*")
        .eq("host_id", hostId)
        .order("position", { ascending: true }),
    ]);

    if (hostRes.data) setHost(hostRes.data);
    if (queueRes.data) {
      setQueue(queueRes.data);
      const isIn = queueRes.data.some((q) => q.user_id === session?.user.id);
      setInQueue(isIn);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel(`cabin-${hostId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "queue", filter: `host_id=eq.${hostId}` },
        () => fetchData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "hosts", filter: `id=eq.${hostId}` },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [hostId]);

  async function handleTakeSeat() {
    if (!session?.user || !hostId) return;

    if (profile && profile.coin_balance < 10) {
      Alert.alert("কম Coin", "কথা বলতে কমপক্ষে কিছু Coin লাগবে। আগে Ad দেখে Coin সংগ্রহ করো।");
      return;
    }

    setJoining(true);

    // Get current max position
    const { data: existing } = await supabase
      .from("queue")
      .select("position")
      .eq("host_id", hostId)
      .order("position", { ascending: false })
      .limit(1);

    const nextPosition = existing && existing.length > 0 ? existing[0].position + 1 : 1;

    const { error } = await supabase.from("queue").insert({
      host_id: hostId,
      user_id: session.user.id,
      position: nextPosition,
    });

    setJoining(false);

    if (error) {
      if (error.code === "23505") {
        Alert.alert("Already in Queue", "তুমি ইতিমধ্যে Queue-তে আছো");
      } else {
        Alert.alert("Error", error.message);
      }
      return;
    }

    setInQueue(true);
    Alert.alert("সফল!", "তুমি Queue-তে যোগ দিয়েছো। Host তোমাকে সিলেক্ট করলে Conversation শুরু হবে।");
  }

  async function handleLeaveQueue() {
    if (!session?.user || !hostId) return;

    await supabase
      .from("queue")
      .delete()
      .eq("host_id", hostId)
      .eq("user_id", session.user.id);

    setInQueue(false);
  }

  if (loading || !host) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* Header */}
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
          {host.display_name}'s Cabin
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Host Info */}
        <View style={{ alignItems: "center", marginBottom: 24 }}>
          <Image
            source={{
              uri:
                host.photo_url ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(host.display_name)}&background=7C3AED&color=fff&size=128`,
            }}
            style={{ width: 90, height: 90, borderRadius: 45, marginBottom: 12 }}
          />
          <Text style={{ fontSize: 22, fontWeight: "700", color: COLORS.text }}>
            {host.display_name}
          </Text>
          {host.bio && (
            <Text style={{ color: COLORS.textSecondary, textAlign: "center", marginTop: 6 }}>
              {host.bio}
            </Text>
          )}

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 10,
              backgroundColor: host.status === "available" ? "#D1FAE5" : "#FEF3C7",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
            }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: host.status === "available" ? COLORS.success : COLORS.warning,
                marginRight: 6,
              }}
            />
            <Text
              style={{
                fontWeight: "600",
                color: host.status === "available" ? COLORS.success : COLORS.warning,
              }}
            >
              {host.status === "available" ? "Available" : host.status === "busy" ? "Busy" : "Offline"}
            </Text>
          </View>
        </View>

        {/* Services */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            gap: 16,
            marginBottom: 24,
          }}
        >
          {host.text_enabled && (
            <Text style={{ color: COLORS.textSecondary }}>💬 Text</Text>
          )}
          {host.voice_enabled && (
            <Text style={{ color: COLORS.textSecondary }}>🎙️ Voice</Text>
          )}
          {host.call_enabled && (
            <Text style={{ color: COLORS.textSecondary }}>📞 Call</Text>
          )}
        </View>

        {/* Queue */}
        <View
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: COLORS.border,
            marginBottom: 24,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "600", color: COLORS.text, marginBottom: 12 }}>
            Waiting Queue ({queue.length})
          </Text>

          {queue.length === 0 ? (
            <Text style={{ color: COLORS.textSecondary }}>এখন কেউ অপেক্ষা করছে না</Text>
          ) : (
            queue.map((item, index) => (
              <View
                key={item.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 8,
                  borderBottomWidth: index === queue.length - 1 ? 0 : 1,
                  borderBottomColor: COLORS.border,
                }}
              >
                <Text style={{ width: 28, fontWeight: "600", color: COLORS.primary }}>
                  #{item.position}
                </Text>
                <Text style={{ color: COLORS.text }}>
                  {item.user_id === session?.user.id ? "তুমি" : `User ${item.user_id.slice(0, 6)}`}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Action Button */}
        {inQueue ? (
          <TouchableOpacity
            onPress={handleLeaveQueue}
            style={{
              backgroundColor: "#FEE2E2",
              borderRadius: 14,
              padding: 16,
              alignItems: "center",
            }}
          >
            <Text style={{ color: COLORS.danger, fontWeight: "600", fontSize: 16 }}>
              Leave Queue
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleTakeSeat}
            disabled={joining || host.status === "offline"}
            style={{
              backgroundColor: COLORS.primary,
              borderRadius: 14,
              padding: 16,
              alignItems: "center",
              opacity: joining || host.status === "offline" ? 0.6 : 1,
            }}
          >
            {joining ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>
                Take a Seat
              </Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
  
