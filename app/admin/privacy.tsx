import { useEffect, useState } from "react";
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../stores/authStore";
import { COLORS } from "../../lib/constants";

export default function AdminPrivacyScreen() {
  const { profile } = useAuthStore();
  const [block, setBlock] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("screenshot_block_enabled")
        .eq("id", 1)
        .single();
      setBlock(data?.screenshot_block_enabled !== false);
      setLoading(false);
    })();
  }, []);

  async function toggle(next: boolean) {
    setSaving(true);
    const { error } = await supabase
      .from("app_settings")
      .update({ screenshot_block_enabled: next })
      .eq("id", 1);
    setSaving(false);
    if (error) {
      Alert.alert("Error", error.message);
      return;
    }
    setBlock(next);
    Alert.alert(
      "সফল",
      next
        ? "চ্যাট ও কলে স্ক্রিনশট/রেকর্ড ব্লক চালু"
        : "ব্লক বন্ধ — টিউটোরিয়াল স্ক্রিনশট নেওয়া যাবে"
    );
  }

  if (profile?.role !== "admin") {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>শুধু Admin</Text>
      </View>
    );
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
        <ActivityIndicator color={COLORS.primary} />
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
          প্রাইভেসি / স্ক্রিন
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 14,
            padding: 18,
            borderWidth: 1,
            borderColor: COLORS.border,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={{ fontWeight: "600", color: COLORS.text }}>
              স্ক্রিনশট ও রেকর্ড ব্লক
            </Text>
            <Text
              style={{
                color: COLORS.textSecondary,
                fontSize: 13,
                marginTop: 6,
                lineHeight: 18,
              }}
            >
              ON = চ্যাটিং ও কলিং স্ক্রিনে ব্লক (Android শক্তিশালী)। OFF =
              টিউটোরিয়াল/মার্কেটিং স্ক্রিনশট।
            </Text>
          </View>
          <Switch
            value={block}
            disabled={saving}
            onValueChange={toggle}
            trackColor={{ false: "#E2E8F0", true: COLORS.primaryLight }}
            thumbColor={block ? COLORS.primary : "#f4f3f4"}
          />
        </View>

        <Text
          style={{
            color: COLORS.textSecondary,
            fontSize: 12,
            marginTop: 16,
            lineHeight: 18,
          }}
        >
          • iOS এ সিস্টেম স্ক্রিনশট ১০০% বন্ধ হয় না; রেকর্ড ডিটেকশন বেস্ট-এফোর্ট।{"\n"}
          • নেটিভ মডিউল: expo-screen-capture (EAS Build)।{"\n"}
          • প্রযোজ্য স্ক্রিন: Conversation, Active Call, Incoming Call।
        </Text>
      </ScrollView>
    </View>
  );
}
