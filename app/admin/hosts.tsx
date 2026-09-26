import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../stores/authStore";
import { COLORS } from "../../lib/constants";

export default function AdminHostsScreen() {
  const { profile } = useAuthStore();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("hosts")
        .select("id, display_name, total_earned, total_withdrawn")
        .order("total_earned", { ascending: false });

      const ids = (data || []).map((h) => h.id);
      let balances: Record<string, number> = {};
      if (ids.length) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, coin_balance")
          .in("id", ids);
        (profiles || []).forEach((p) => {
          balances[p.id] = p.coin_balance;
        });
      }

      setRows(
        (data || []).map((h) => ({
          ...h,
          coin_balance: balances[h.id] ?? 0,
        }))
      );
      setLoading(false);
    })();
  }, []);

  if (profile?.role !== "admin") {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>শুধু Admin</Text>
      </View>
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
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Text style={{ fontSize: 24, color: COLORS.primary }}>‹</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: "600", color: COLORS.text }}>
          Hosts আয়
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={COLORS.primary} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <Text style={{ textAlign: "center", color: COLORS.textSecondary }}>
              কোনো হোস্ট নেই
            </Text>
          }
          renderItem={({ item }) => (
            <View
              style={{
                backgroundColor: COLORS.card,
                borderRadius: 12,
                padding: 14,
                marginBottom: 10,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            >
              <Text style={{ fontWeight: "600", color: COLORS.text }}>
                {item.display_name}
              </Text>
              <Text style={{ color: COLORS.textSecondary, marginTop: 4 }}>
                ব্যালেন্স: {item.coin_balance} · আয়: {item.total_earned} ·
                উইথড্র: {item.total_withdrawn}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
 }
