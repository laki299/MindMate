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

export default function HostGiftsScreen() {
  const { session } = useAuthStore();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) return;

    (async () => {
      const { data } = await supabase
        .from("transactions")
        .select("id, amount, from_user_id, created_at, description")
        .eq("to_host_id", session.user.id)
        .eq("type", "gift")
        .order("created_at", { ascending: false })
        .limit(100);

      setList(data || []);
      setLoading(false);
    })();
  }, [session?.user?.id]);

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
          Gift List
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator
          style={{ marginTop: 40 }}
          size="large"
          color={COLORS.primary}
        />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <Text
              style={{
                textAlign: "center",
                color: COLORS.textSecondary,
                marginTop: 40,
              }}
            >
              এখনো কোনো Gift নেই
            </Text>
          }
          renderItem={({ item }) => (
            <View
              style={{
                backgroundColor: COLORS.card,
                padding: 14,
                borderRadius: 12,
                marginBottom: 10,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            >
              <Text style={{ fontWeight: "600", color: COLORS.text }}>
                🪙 {item.amount} Coins
              </Text>
              <Text
                style={{
                  color: COLORS.textSecondary,
                  fontSize: 12,
                  marginTop: 4,
                }}
              >
                From: {item.from_user_id?.slice(0, 8)}...
              </Text>
              {item.created_at && (
                <Text
                  style={{
                    color: COLORS.textSecondary,
                    fontSize: 11,
                    marginTop: 2,
                  }}
                >
                  {new Date(item.created_at).toLocaleString()}
                </Text>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}
