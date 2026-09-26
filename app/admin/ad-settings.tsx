import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../stores/authStore";
import { AppSettings } from "../../lib/types";
import { COLORS } from "../../lib/constants";

export default function AdminAdSettings() {
  const { profile } = useAuthStore();
  const [s, setS] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("*")
        .eq("id", 1)
        .single();
      if (data) setS(data);
      setLoading(false);
    })();
  }, []);

  function setNum(key: keyof AppSettings, text: string) {
    const n = parseInt(text, 10);
    if (!s) return;
    setS({ ...s, [key]: isNaN(n) ? 0 : n } as AppSettings);
  }

  async function save() {
    if (!s) return;
    setSaving(true);
    const { error } = await supabase
      .from("app_settings")
      .update({
        ad_reward_coins: s.ad_reward_coins,
        ad_max_per_minute: s.ad_max_per_minute ?? 1,
        ad_max_consecutive: s.ad_max_consecutive ?? 5,
        ad_batch_cooldown_minutes: s.ad_batch_cooldown_minutes ?? 10,
        short_video_coins: s.short_video_coins ?? 10,
        short_video_max_per_minute: s.short_video_max_per_minute ?? 1,
        short_video_max_consecutive: s.short_video_max_consecutive ?? 5,
        short_video_batch_cooldown_minutes:
          s.short_video_batch_cooldown_minutes ?? 10,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);
    setSaving(false);
    if (error) Alert.alert("Error", error.message);
    else Alert.alert("সফল", "সেটিংস সেভ হয়েছে");
  }

  if (profile?.role !== "admin") {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>শুধু Admin</Text>
      </View>
    );
  }

  if (loading || !s) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
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
          বিজ্ঞাপন সেটিংস
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Section title="Rewarded Ad">
          <Field
            label="প্রতি অ্যাডে কয়েন"
            value={String(s.ad_reward_coins)}
            onChange={(t) => setNum("ad_reward_coins", t)}
          />
          <Field
            label="প্রতি মিনিটে সর্বোচ্চ অ্যাড"
            value={String(s.ad_max_per_minute ?? 1)}
            onChange={(t) => setNum("ad_max_per_minute", t)}
          />
          <Field
            label="টানা সর্বোচ্চ কয়টি অ্যাড"
            value={String(s.ad_max_consecutive ?? 5)}
            onChange={(t) => setNum("ad_max_consecutive", t)}
          />
          <Field
            label="টানার পর কুলডাউন (মিনিট)"
            value={String(s.ad_batch_cooldown_minutes ?? 10)}
            onChange={(t) => setNum("ad_batch_cooldown_minutes", t)}
          />
        </Section>

        <Section title="Short Video">
          <Field
            label="প্রতি ভিডিওতে কয়েন"
            value={String(s.short_video_coins ?? 10)}
            onChange={(t) => setNum("short_video_coins", t)}
          />
          <Field
            label="প্রতি মিনিটে সর্বোচ্চ"
            value={String(s.short_video_max_per_minute ?? 1)}
            onChange={(t) => setNum("short_video_max_per_minute", t)}
          />
          <Field
            label="টানা সর্বোচ্চ কয়টি"
            value={String(s.short_video_max_consecutive ?? 5)}
            onChange={(t) => setNum("short_video_max_consecutive", t)}
          />
          <Field
            label="টানার পর কুলডাউন (মিনিট)"
            value={String(s.short_video_batch_cooldown_minutes ?? 10)}
            onChange={(t) => setNum("short_video_batch_cooldown_minutes", t)}
          />
        </Section>

        <TouchableOpacity
          onPress={save}
          disabled={saving}
          style={{
            backgroundColor: COLORS.primary,
            borderRadius: 12,
            padding: 16,
            alignItems: "center",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: "#fff", fontWeight: "600" }}>সেভ করো</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 24 }}>
      <Text
        style={{
          fontSize: 16,
          fontWeight: "600",
          color: COLORS.text,
          marginBottom: 12,
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (t: string) => void;
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ color: COLORS.textSecondary, marginBottom: 6, fontSize: 13 }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType="number-pad"
        style={{
          backgroundColor: COLORS.card,
          borderRadius: 10,
          padding: 12,
          borderWidth: 1,
          borderColor: COLORS.border,
          color: COLORS.text,
        }}
      />
    </View>
  );
}
