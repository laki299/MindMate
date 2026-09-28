import { View, Text, TouchableOpacity, Alert, Share } from "react-native";
import { router } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../stores/authStore";
import { COLORS } from "../../lib/constants";

export default function ProfileScreen() {
  const { profile, setSession, setProfile } = useAuthStore();

  async function handleCopyUUID() {
    if (!profile?.id) return;
    try {
      await Share.share({ message: profile.id, title: "My UUID" });
    } catch {
      Alert.alert("Your UUID", profile.id);
    }
  }

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
        {/* User Card */}
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
          <Text style={{ color: COLORS.textSecondary, marginBottom: 4 }}>
            Role: {profile?.role}
          </Text>
          <Text style={{ color: COLORS.textSecondary, marginBottom: 12 }}>
            Coin Balance: 🪙 {profile?.coin_balance ?? 0}
          </Text>

          {/* MindMate Phone Code */}
          {profile?.phone_code ? (
            <TouchableOpacity
              onPress={() => router.push("/calls/my-number")}
              style={{
                marginTop: 4,
                marginBottom: 12,
                backgroundColor: COLORS.background,
                padding: 10,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            >
              <Text style={{ color: COLORS.primary, fontWeight: "600", fontSize: 16 }}>
                📞 {profile.phone_code}
              </Text>
              <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginTop: 2 }}>
                MindMate নম্বর · ট্যাপ করে শেয়ার
              </Text>
            </TouchableOpacity>
          ) : null}

          {/* Coin Debt */}
          {(profile?.coin_debt || 0) > 0 ? (
            <Text style={{ color: COLORS.warning, marginBottom: 8, fontWeight: "600" }}>
              বকেয়া কয়েন: {profile?.coin_debt}
            </Text>
          ) : null}

          {/* Expat Status */}
          {profile?.is_expat ? (
            <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 12 }}>
              প্রবাসী অ্যাকাউন্ট · হোস্ট ক্যাবিন চালু
            </Text>
          ) : (
            <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 12 }}>
              স্থানীয় · হোস্ট ক্যাবিন নেই · A2A কল ব্যবহার করো
            </Text>
          )}

          {/* UUID Copy */}
          <TouchableOpacity
            onPress={handleCopyUUID}
            style={{
              backgroundColor: COLORS.background,
              borderRadius: 10,
              padding: 12,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>
              UUID (ট্যাপ করে শেয়ার/কপি)
            </Text>
            <Text
              style={{
                color: COLORS.primary,
                fontSize: 13,
                marginTop: 4,
                fontWeight: "600",
              }}
              numberOfLines={1}
            >
              {profile?.id}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/calls")}
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
            📞 কল / কন্টাক্টস
          </Text>
        </TouchableOpacity>

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
            <Text
              style={{
                color: COLORS.primary,
                fontWeight: "600",
                fontSize: 16,
              }}
            >
              Admin Panel
            </Text>
          </TouchableOpacity>
        )}

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
            <Text
              style={{
                color: COLORS.primary,
                fontWeight: "600",
                fontSize: 16,
              }}
            >
              Host Dashboard
            </Text>
          </TouchableOpacity>
        )}

        {/* Logout */}
        <TouchableOpacity
          onPress={handleLogout}
          style={{
            backgroundColor: "#FEE2E2",
            borderRadius: 12,
            padding: 16,
            alignItems: "center",
            marginTop: 8,
          }}
        >
          <Text
            style={{ color: COLORS.danger, fontWeight: "600", fontSize: 16 }}
          >
            Logout
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
