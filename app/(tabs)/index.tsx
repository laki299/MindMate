import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../stores/authStore";
import { Host } from "../../lib/types";
import { COLORS } from "../../lib/constants";

export default function HomeScreen() {
  const { profile } = useAuthStore();
  const [hosts, setHosts] = useState<Host[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchHosts() {
    const { data, error } = await supabase
      .from("hosts")
      .select("*")
      .eq("is_active", true)
      .order("status", { ascending: true });

    if (!error && data) {
      setHosts(data);
    }
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => {
    fetchHosts();

    // Realtime update
    const channel = supabase
      .channel("hosts-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "hosts" },
        () => {
          fetchHosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  function getStatusColor(status: string) {
    if (status === "available") return COLORS.success;
    if (status === "busy") return COLORS.warning;
    return COLORS.textSecondary;
  }

  function getStatusText(status: string) {
    if (status === "available") return "Available";
    if (status === "busy") return "Busy";
    return "Offline";
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

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* Header */}
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
          MindMate
        </Text>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 8,
          }}
        >
          <Text style={{ color: COLORS.textSecondary }}>
            কেমন অনুভব করছো আজ?
          </Text>
          <View
            style={{
              backgroundColor: "#FEF3C7",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
            }}
          >
            <Text style={{ fontWeight: "600", color: "#D97706" }}>
              🪙 {profile?.coin_balance ?? 0}
            </Text>
          </View>
        </View>

        {/* Free Coins Button - Only visible for role === "user" */}
        {profile?.role === "user" && (
          <TouchableOpacity
            onPress={() => router.push("/earn")}
            style={{
              backgroundColor: COLORS.primary,
              borderRadius: 14,
              paddingVertical: 12,
              paddingHorizontal: 20,
              marginTop: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
              🎁 ফ্রি কয়েন জমা
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Host List */}
      <FlatList
        data={hosts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchHosts();
            }}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={
          <View style={{ alignItems: "center", marginTop: 60 }}>
            <Text style={{ color: COLORS.textSecondary, fontSize: 16 }}>
              এখন কোনো Host নেই
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/cabin/${item.id}`)}
            style={{
              backgroundColor: COLORS.card,
              borderRadius: 16,
              padding: 16,
              marginBottom: 12,
              flexDirection: "row",
              alignItems: "center",
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <Image
              source={{
                uri:
                  item.photo_url ||
                  "https://ui-avatars.com/api/?name=" +
                    encodeURIComponent(item.display_name) +
                    "&background=7C3AED&color=fff",
              }}
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                marginRight: 14,
              }}
            />

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: "600",
                  color: COLORS.text,
                  marginBottom: 4,
                }}
              >
                {item.display_name}
              </Text>

              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: getStatusColor(item.status),
                    marginRight: 6,
                  }}
                />
                <Text
                  style={{
                    fontSize: 13,
                    color: getStatusColor(item.status),
                    fontWeight: "500",
                  }}
                >
                  {getStatusText(item.status)}
                </Text>
              </View>

              <View style={{ flexDirection: "row", marginTop: 6, gap: 8 }}>
                {item.text_enabled && (
                  <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>
                    💬 Text
                  </Text>
                )}
                {item.voice_enabled && (
                  <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>
                    🎙️ Voice
                  </Text>
                )}
                {item.call_enabled && (
                  <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>
                    📞 Call
                  </Text>
                )}
              </View>
            </View>

            <Text style={{ fontSize: 20, color: COLORS.primary }}>›</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
