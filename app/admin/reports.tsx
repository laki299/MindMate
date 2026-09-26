import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../stores/authStore";
import { COLORS } from "../../lib/constants";

type ReportRow = {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  reason: string;
  status: string;
  created_at: string;
};

export default function AdminReportsScreen() {
  const { profile } = useAuthStore();
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchReports() {
    const { data } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    setReports(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchReports();
  }, []);

  async function markResolved(id: string) {
    const { error } = await supabase
      .from("reports")
      .update({ status: "resolved" })
      .eq("id", id);

    if (error) {
      Alert.alert("Error", error.message);
      return;
    }

    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "resolved" } : r))
    );
  }

  async function banReported(userId: string) {
    Alert.alert("Ban?", "রিপোর্ট করা ইউজারকে ব্যান করবে?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Ban",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase
            .from("profiles")
            .update({ is_banned: true })
            .eq("id", userId);

          if (error) {
            Alert.alert("Error", error.message);
            return;
          }
          Alert.alert("সফল", "ইউজার ব্যান করা হয়েছে");
        },
      },
    ]);
  }

  if (profile?.role !== "admin") {
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
        <Text style={{ color: COLORS.textSecondary }}>শুধু Admin</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: COLORS.primary }}>ফিরে যাও</Text>
        </TouchableOpacity>
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
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginRight: 12 }}
        >
          <Text style={{ fontSize: 24, color: COLORS.primary }}>‹</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: "600", color: COLORS.text }}>
          Reports
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
          data={reports}
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
              কোনো রিপোর্ট নেই
            </Text>
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
                  fontWeight: "700",
                  color:
                    item.status === "pending" ? COLORS.warning : COLORS.success,
                  marginBottom: 6,
                }}
              >
                {item.status.toUpperCase()}
              </Text>
              <Text style={{ color: COLORS.text, marginBottom: 8 }}>
                {item.reason}
              </Text>
              <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>
                Reporter: {item.reporter_id.slice(0, 8)}...
              </Text>
              <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>
                Reported: {item.reported_user_id.slice(0, 8)}...
              </Text>
              <Text
                style={{
                  color: COLORS.textSecondary,
                  fontSize: 11,
                  marginTop: 4,
                }}
              >
                {new Date(item.created_at).toLocaleString()}
              </Text>

              <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                {item.status === "pending" && (
                  <TouchableOpacity
                    onPress={() => markResolved(item.id)}
                    style={{
                      flex: 1,
                      backgroundColor: "#D1FAE5",
                      borderRadius: 10,
                      padding: 10,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: COLORS.success, fontWeight: "600" }}>
                      Resolve
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => banReported(item.reported_user_id)}
                  style={{
                    flex: 1,
                    backgroundColor: "#FEE2E2",
                    borderRadius: 10,
                    padding: 10,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: COLORS.danger, fontWeight: "600" }}>
                    Ban User
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
          }
