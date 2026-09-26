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

export default function AdminMonetizationScreen() {
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
        ? "Monetization চালু — এখন থেকে Coin কাটা হবে।"
        : "Monetization বন্ধ — সব কথাবার্তা ফ্রি।"
    );
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
        <Text style={{ color: COLORS.textSecondary, textAlign: "center" }}>
          শুধুমাত্র Admin
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginTop: 20 }}
        >
          <Text style={{ color: COLORS.primary, fontWeight: "600" }}>
            ফিরে যাও
          </Text>
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
          Monetization
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
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
              <Text
                style={{ fontSize: 16, fontWeight: "600", color: COLORS.text }}
              >
                Monetization
              </Text>
              <Text
                style={{
                  color: COLORS.textSecondary,
                  fontSize: 13,
                  marginTop: 4,
                }}
              >
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
              thumbColor={
                settings.monetization_enabled ? COLORS.primary : "#f4f3f4"
              }
            />
          </View>
        </View>

        <View
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: COLORS.border,
            marginBottom: 20,
          }}
        >
          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: COLORS.text,
              marginBottom: 12,
            }}
          >
            বর্তমান গ্লোবাল রেট (রেফারেন্স)
          </Text>
          <Row label="Text Message" value={`${settings.text_coin_cost} Coin`} />
          <Row
            label="Voice / sec"
            value={`${settings.voice_coin_per_second} Coin`}
          />
          <Row
            label="Audio Call / sec"
            value={`${settings.call_coin_per_second} Coin`}
          />
          <Row
            label="Rewarded Ad"
            value={`${settings.ad_reward_coins} Coin`}
          />
        </View>

        <Text
          style={{
            color: COLORS.textSecondary,
            fontSize: 13,
            lineHeight: 20,
          }}
        >
          • OFF করলে User ফ্রিতে কথা বলতে পারবে{"\n"}
          • হোস্ট কাস্টম রেট থাকলে সেগুলো ON অবস্থায় কাজে লাগে{"\n"}
          • নতুন বিল্ড লাগবে না — সাথে সাথে কাজ করবে
        </Text>
      </ScrollView>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 10,
      }}
    >
      <Text style={{ color: COLORS.textSecondary }}>{label}</Text>
      <Text style={{ fontWeight: "600", color: COLORS.text }}>{value}</Text>
    </View>
  );
  }
