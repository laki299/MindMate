import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../stores/authStore";
import { AppSettings } from "../../lib/types";
import { COLORS } from "../../lib/constants";

export default function AdminDashboard() {
  const { profile } = useAuthStore();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

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

  // শুধু Admin দেখতে পারবে
  if (profile?.role !== "admin") {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.background, padding: 20 }}>
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
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
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
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
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

        <Text style={{ color: COLORS.textSecondary, fontSize: 13, marginTop: 20, lineHeight: 20 }}>
          • Monetization OFF করলে সব User ফ্রিতে কথা বলতে পারবে{"\n"}
          • রেট পরিবর্তন পরে Admin থেকে করা যাবে{"\n"}
          • এই সেটিংস রিয়েল-টাইমে কাজ করবে (নতুন বিল্ড লাগবে না)
        </Text>
      </ScrollView>
    </View>
  );
