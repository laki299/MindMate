import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../stores/authStore";
import { Host } from "../../lib/types";
import { COLORS } from "../../lib/constants";

export default function HostHomeScreen() {
  const { session } = useAuthStore();
  const [host, setHost] = useState<Host | null>(null);
  const [queueCount, setQueueCount] = useState(0);
  const [loading, setLoading] = useState(true);

  async function fetchHostData() {
    if (!session?.user) return;

    const { data: hostData } = await supabase
      .from("hosts")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (hostData) {
      setHost(hostData);

      const { count } = await supabase
        .from("queue")
        .select("*", { count: "exact", head: true })
        .eq("host_id", session.user.id);

      setQueueCount(count || 0);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchHostData();

    const channel = supabase
      .channel("host-home")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "queue" },
        () => fetchHostData()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "hosts",
          filter: `id=eq.${session?.user?.id}`,
        },
        () => fetchHostData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  async function toggleStatus() {
    if (!host) return;

    const newStatus = host.status === "available" ? "offline" : "available";

    const { error } = await supabase
      .from("hosts")
      .update({ status: newStatus })
      .eq("id", host.id);

    if (error) {
      Alert.alert("Error", error.message);
      return;
    }

    setHost({ ...host, status: newStatus });
  }

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: COLORS.background,
        }}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!host) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: COLORS.background,
          padding: 20,
        }}
      >
        <Text
          style={{
            color: COLORS.textSecondary,
            textAlign: "center",
            marginBottom: 16,
          }}
        >
          তুমি এখনো Host হিসেবে রেজিস্টারড নও।
        </Text>
        <Text style={{ color: COLORS.textSecondary, textAlign: "center" }}>
          Admin তোমাকে Host বানালে এখানে ড্যাশবোর্ড দেখা যাবে।
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View
        style={{
          paddingTop: 60,
          paddingHorizontal: 20,
          paddingBottom: 16,
          backgroundColor: COLORS.card,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: "700", color: COLORS.text }}>
          Host Dashboard
        </Text>
        <Text style={{ color: COLORS.textSecondary, marginTop: 4 }}>
          Welcome, {host.display_name}
        </Text>
      </View>

      <View style={{ padding: 20 }}>
        <View
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        >
          <Text style={{ color: COLORS.textSecondary, marginBottom: 8 }}>
            Current Status
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor:
                    host.status === "available"
                      ? COLORS.success
                      : host.status === "busy"
                      ? COLORS.warning
                      : COLORS.textSecondary,
                  marginRight: 8,
                }}
              />
              <Text
                style={{ fontSize: 18, fontWeight: "600", color: COLORS.text }}
              >
                {host.status === "available"
                  ? "Available"
                  : host.status === "busy"
                  ? "Busy"
                  : "Offline"}
              </Text>
            </View>

            {host.status !== "busy" && (
              <TouchableOpacity
                onPress={toggleStatus}
                style={{
                  backgroundColor:
                    host.status === "available" ? "#FEE2E2" : "#D1FAE5",
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 20,
                }}
              >
                <Text
                  style={{
                    fontWeight: "600",
                    color:
                      host.status === "available"
                        ? COLORS.danger
                        : COLORS.success,
                  }}
                >
                  {host.status === "available" ? "Go Offline" : "Go Online"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
          <View
            style={{
              flex: 1,
              backgroundColor: COLORS.card,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <Text style={{ color: COLORS.textSecondary, fontSize: 13 }}>
              Waiting
            </Text>
            <Text
              style={{
                fontSize: 28,
                fontWeight: "700",
                color: COLORS.primary,
                marginTop: 4,
              }}
            >
              {queueCount}
            </Text>
          </View>

          <View
            style={{
              flex: 1,
              backgroundColor: COLORS.card,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <Text style={{ color: COLORS.textSecondary, fontSize: 13 }}>
              Total Earned
            </Text>
            <Text
              style={{
                fontSize: 28,
                fontWeight: "700",
                color: COLORS.success,
                marginTop: 4,
              }}
            >
              {host.total_earned}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => router.push("/host/queue")}
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 14,
            padding: 18,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: COLORS.border,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "600", color: COLORS.text }}>
            View Queue
          </Text>
          <Text style={{ fontSize: 18, color: COLORS.primary }}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/host/gifts")}
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 14,
            padding: 18,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: COLORS.border,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "600", color: COLORS.text }}>
            Gift List
          </Text>
          <Text style={{ fontSize: 18, color: COLORS.primary }}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/host/earnings")}
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 14,
            padding: 18,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: COLORS.border,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "600", color: COLORS.text }}>
            Earnings & Withdrawal
          </Text>
          <Text style={{ fontSize: 18, color: COLORS.primary }}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/host/services")}
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 14,
            padding: 18,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: COLORS.border,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "600", color: COLORS.text }}>
            My Services
          </Text>
          <Text style={{ fontSize: 18, color: COLORS.primary }}>›</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
