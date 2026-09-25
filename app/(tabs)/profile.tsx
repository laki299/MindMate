import { View, Text, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../stores/authStore";
import { COLORS } from "../../lib/constants";

export default function ProfileScreen() {
  const { profile, setSession, setProfile } = useAuthStore();

  async function handleLogout() {
    Alert.alert("Logout", "তুমি কি লগআউট করতে চাও?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut();
          setSession(null);
          setProfile(null);
          router.replace("/(auth)/login");
        },
      },
    ]);
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
          Profile
        </Text>
      </View>

      <View style={{ padding: 20 }}>
        {/* User Info Card */}
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
          <Text
            style={{
              fontSize: 20,
              fontWeight: "600",
              color: COLORS.text,
              marginBottom: 4,
            }}
          >
            {profile?.full_name || "User"}
          </Text>
          <Text style={{ color: COLORS.textSecondary, marginBottom: 12 }}>
            Role: {profile?.role}
          </Text>
          <Text style={{ color: COLORS.textSecondary }}>
            Coin Balance: 🪙 {profile?.coin_balance ?? 0}
          </Text>
        </View>

        {/* Admin Panel Link */}
        {profile?.role === "admin" && (
          <TouchableOpacity
            onPress={() => router.push("/admin")}
            style={{
              backgroundColor: COLORS.card,
              borderRadius: 12,
              padding: 16,
              alignItems: "center",
              marginBottom: 12,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <Text style={{ color: COLORS.primary, fontWeight: "600", fontSize: 16 }}>
              Admin Panel
            </Text>
          </TouchableOpacity>
        )}

        {/* Host Dashboard Link */}
        {profile?.role === "host" && (
          <TouchableOpacity
            onPress={() => router.push("/host")}
            style={{
              backgroundColor: COLORS.card,
              borderRadius: 12,
              padding: 16,
              alignItems: "center",
              marginBottom: 12,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <Text style={{ color: COLORS.primary, fontWeight: "600", fontSize: 16 }}>
              Host Dashboard
            </Text>
          </TouchableOpacity>
        )}

        {/* Logout Button */}
        <TouchableOpacity
          onPress={handleLogout}
          style={{
            backgroundColor: "#FEE2E2",
            borderRadius: 12,
            padding: 16,
            alignItems: "center",
          }}
        >
          <Text style={{ color: COLORS.danger, fontWeight: "600", fontSize: 16 }}>
            Logout
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
