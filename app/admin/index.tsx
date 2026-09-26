import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../stores/authStore";
import { AppSettings, Profile } from "../../lib/types";
import { COLORS } from "../../lib/constants";

export default function AdminDashboard() {
  const { profile } = useAuthStore();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // User Search & Action States
  const [searchId, setSearchId] = useState("");
  const [foundUser, setFoundUser] = useState<Profile | null>(null);
  const [searching, setSearching] = useState(false);

  async function fetchSettings() {
    const { data } = await supabase
      .from("app_settings")
      .select("*")
      .eq("id", 1)
      .single();

    if (data) setSettings(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchSettings();
  }, []);

  async function toggleMonetization(value: boolean) {
    setUpdating(true);

    const { error } = await supabase
      .from("app_settings")
      .update({
        monetization_enabled: value,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);

    setUpdating(false);

    if (error) {
      Alert.alert("Error", error.message);
      return;
    }

    setSettings((prev) =>
      prev ? { ...prev, monetization_enabled: value } : prev
    );

    Alert.alert(
      "সফল",
      value
        ? "Monetization চালু করা হয়েছে। এখন থেকে Coin কাটা হবে।"
        : "Monetization বন্ধ করা হয়েছে। এখন সব কথাবার্তা ফ্রি।"
    );
  }

  // User Search Functionality
  async function searchUser() {
    if (!searchId.trim()) {
      Alert.alert("ত্রুটি", "দয়া করে একটি UUID লিখুন");
      return;
    }

    setSearching(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", searchId.trim())
      .single();

    setSearching(false);

    if (error || !data) {
      setFoundUser(null);
      Alert.alert("পাওয়া যায়নি", "এই UUID এর কোনো ইউজার পাওয়া যায়নি");
      return;
    }

    setFoundUser(data as Profile);
  }

  // Ban / Unban User
  async function toggleBanUser(userId: string, currentBanState?: boolean) {
    const newBanState = !currentBanState;
    const { error } = await supabase
      .from("profiles")
      .update({ is_banned: newBanState })
      .eq("id", userId);

    if (error) {
      Alert.alert("Error", error.message);
      return;
    }

    Alert.alert(
      "সফল",
      newBanState ? "ইউজার ব্যান করা হয়েছে" : "ইউজারের ব্যান তুলে নেওয়া হয়েছে"
    );
    setFoundUser((prev) => (prev ? { ...prev, is_banned: newBanState } : prev));
  }

  // Soft Delete / Block User
  async function deleteUser(userId: string) {
    Alert.alert("নিশ্চিত?", "অ্যাকাউন্ট নিষ্ক্রিয় এবং ব্লক করা হবে", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete & Block",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase
            .from("profiles")
            .update({ is_banned: true, is_blocked: true })
            .eq("id", userId);

          if (error) {
            Alert.alert("Error", error.message);
            return;
          }

          Alert.alert("সফল", "অ্যাকাউন্ট সম্পূর্ণ নিষ্ক্রিয় ও ব্লক করা হয়েছে");
          setFoundUser((prev) =>
            prev ? { ...prev, is_banned: true, is_blocked: true } : prev
          );
        },
      },
    ]);
  }

  // Admin Verification Access
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
        <Text style={{ color: COLORS.textSecondary, textAlign: "center" }}>
          শুধুমাত্র Admin এই পেজ দেখতে পারবে
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: COLORS.primary, fontWeight: "600" }}>ফিরে যাও</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading || !settings) {
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
          Admin Panel
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Monetization Toggle */}
        <View
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: "600", color: COLORS.text }}>
                Monetization
              </Text>
              <Text style={{ color: COLORS.textSecondary, fontSize: 13, marginTop: 4 }}>
                {settings.monetization_enabled
                  ? "চালু আছে — Coin কাটা হচ্ছে"
                  : "বন্ধ আছে — সব কথাবার্তা ফ্রি"}
              </Text>
            </View>

            <Switch
              value={settings.monetization_enabled}
              onValueChange={toggleMonetization}
              disabled={updating}
              trackColor={{ false: "#E2E8F0", true: COLORS.primaryLight }}
              thumbColor={settings.monetization_enabled ? COLORS.primary : "#f4f3f4"}
            />
          </View>
        </View>

        {/* Current Rates */}
        <Text style={{ fontSize: 16, fontWeight: "600", color: COLORS.text, marginBottom: 12 }}>
          বর্তমান রেট
        </Text>

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
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
            <Text style={{ color: COLORS.textSecondary }}>Text Message</Text>
            <Text style={{ fontWeight: "600", color: COLORS.text }}>
              {settings.text_coin_cost} Coin
            </Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
            <Text style={{ color: COLORS.textSecondary }}>Voice / sec</Text>
            <Text style={{ fontWeight: "600", color: COLORS.text }}>
              {settings.voice_coin_per_second} Coin
            </Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
            <Text style={{ color: COLORS.textSecondary }}>Audio Call / sec</Text>
            <Text style={{ fontWeight: "600", color: COLORS.text }}>
              {settings.call_coin_per_second} Coin
            </Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
            <Text style={{ color: COLORS.textSecondary }}>Rewarded Ad</Text>
            <Text style={{ fontWeight: "600", color: COLORS.text }}>
              {settings.ad_reward_coins} Coin
            </Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: COLORS.textSecondary }}>Ad Limit / hour</Text>
            <Text style={{ fontWeight: "600", color: COLORS.text }}>
              {settings.ad_limit_per_hour}
            </Text>
          </View>
        </View>

        {/* User Search & Management Section */}
        <Text style={{ fontSize: 16, fontWeight: "600", color: COLORS.text, marginBottom: 12 }}>
          ইউজার ম্যানেজমেন্ট (UUID সার্চ)
        </Text>

        <View
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 16,
            padding: 16,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        >
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
            <TextInput
              placeholder="UUID দিয়ে সার্চ করুন..."
              placeholderTextColor={COLORS.textSecondary}
              value={searchId}
              onChangeText={setSearchId}
              style={{
                flex: 1,
                backgroundColor: COLORS.background,
                borderWidth: 1,
                borderColor: COLORS.border,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                color: COLORS.text,
                fontSize: 14,
              }}
            />
            <TouchableOpacity
              onPress={searchUser}
              disabled={searching}
              style={{
                backgroundColor: COLORS.primary,
                borderRadius: 10,
                paddingHorizontal: 16,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {searching ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={{ color: "#FFF", fontWeight: "600" }}>সার্চ</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Searched User Details */}
          {foundUser && (
            <View
              style={{
                marginTop: 12,
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: COLORS.border,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "700", color: COLORS.text, marginBottom: 4 }}>
                {foundUser.full_name || "Un-named User"}
              </Text>
              <Text style={{ color: COLORS.textSecondary, fontSize: 13, marginBottom: 2 }}>
                দেশ: {foundUser.country_name || "N/A"} ({foundUser.country_code || "N/A"})
              </Text>
              <Text style={{ color: COLORS.textSecondary, fontSize: 13, marginBottom: 2 }}>
                Role: {foundUser.role} | Balance: 🪙 {foundUser.coin_balance}
              </Text>
              <Text style={{ color: COLORS.textSecondary, fontSize: 13, marginBottom: 12 }}>
                Status: {foundUser.is_banned ? "🔴 Banned" : "🟢 Active"}
                {foundUser.is_blocked ? " (Blocked)" : ""}
              </Text>

              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  onPress={() => toggleBanUser(foundUser.id, foundUser.is_banned)}
                  style={{
                    flex: 1,
                    backgroundColor: foundUser.is_banned ? "#DC2626" : "#E11D48",
                    paddingVertical: 10,
                    borderRadius: 8,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#FFF", fontWeight: "600", fontSize: 13 }}>
                    {foundUser.is_banned ? "Unban User" : "Ban User"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => deleteUser(foundUser.id)}
                  style={{
                    flex: 1,
                    backgroundColor: "#FEE2E2",
                    paddingVertical: 10,
                    borderRadius: 8,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: COLORS.danger,
                  }}
                >
                  <Text style={{ color: COLORS.danger, fontWeight: "600", fontSize: 13 }}>
                    Delete Account
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <Text style={{ color: COLORS.textSecondary, fontSize: 13, lineHeight: 20 }}>
          • Monetization OFF করলে সব User ফ্রিতে কথা বলতে পারবে{"\n"}
          • রেট পরিবর্তন পরে Admin থেকে করা যাবে{"\n"}
          • এই সেটিংস রিয়েল-টাইমে কাজ করবে (নতুন বিল্ড লাগবে না)
        </Text>
      </ScrollView>
    </View>
  );
}
