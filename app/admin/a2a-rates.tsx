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
import { COLORS, COIN_RATES } from "../../lib/constants";

export default function AdminA2ARatesScreen() {
  const { profile } = useAuthStore();
  const [audio, setAudio] = useState(String(COIN_RATES.A2A_AUDIO_PER_MIN));
  const [video, setVideo] = useState(String(COIN_RATES.A2A_VIDEO_PER_MIN));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("a2a_audio_coins_per_min, a2a_video_coins_per_min")
        .eq("id", 1)
        .single();
      if (data) {
        setAudio(
          String(data.a2a_audio_coins_per_min ?? COIN_RATES.A2A_AUDIO_PER_MIN)
        );
        setVideo(
          String(data.a2a_video_coins_per_min ?? COIN_RATES.A2A_VIDEO_PER_MIN)
        );
      }
      setLoading(false);
    })();
  }, []);

  async function save() {
    const a = parseInt(audio, 10);
    const v = parseInt(video, 10);
    if (!a || a < 1 || !v || v < 1) {
      Alert.alert("Error", "রেট কমপক্ষে ১ হতে হবে");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("app_settings")
      .update({
        a2a_audio_coins_per_min: a,
        a2a_video_coins_per_min: v,
        updated_at: new Date().toISOString(),
      } as Partial<AppSettings>)
      .eq("id", 1);
    setSaving(false);
    if (error) Alert.alert("Error", error.message);
    else Alert.alert("সফল", "A2A রেট সেভ হয়েছে");
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
          A2A কল রেট
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ color: COLORS.textSecondary, marginBottom: 16, lineHeight: 20 }}>
          অ্যাকাউন্ট-টু-অ্যাকাউন্ট কলে কলারের কাছ থেকে{" "}
          <Text style={{ fontWeight: "600" }}>প্রতি মিনিটের শুরুতে</Text> কাটা
          হবে। হোস্ট রেট এখানে লাগে না।
        </Text>

        <Text style={{ color: COLORS.textSecondary, marginBottom: 6 }}>
          অডিও — কয়েন / মিনিট
        </Text>
        <TextInput
          value={audio}
          onChangeText={setAudio}
          keyboardType="number-pad"
          style={inputStyle}
        />

        <Text style={{ color: COLORS.textSecondary, marginBottom: 6 }}>
          ভিডিও — কয়েন / মিনিট
        </Text>
        <TextInput
          value={video}
          onChangeText={setVideo}
          keyboardType="number-pad"
          style={inputStyle}
        />

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

const inputStyle = {
  backgroundColor: COLORS.card,
  borderRadius: 12,
  padding: 14,
  borderWidth: 1,
  borderColor: COLORS.border,
  color: COLORS.text,
  marginBottom: 16,
} as const;
