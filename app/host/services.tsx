import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../stores/authStore";
import { Host } from "../../lib/types";
import { COLORS } from "../../lib/constants";

export default function HostServicesScreen() {
  const { session } = useAuthStore();
  const [host, setHost] = useState<Host | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [textRate, setTextRate] = useState("2");
  const [callRate, setCallRate] = useState("2");

  async function load() {
    if (!session?.user) return;
    const { data } = await supabase
      .from("hosts")
      .select("*")
      .eq("id", session.user.id)
      .single();
    if (data) {
      setHost(data);
      setTextRate(String(data.text_rate ?? 2));
      setCallRate(String(data.call_rate ?? 2));
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [session?.user?.id]);

  async function toggleService(
    key: "text_enabled" | "voice_enabled" | "call_enabled",
    value: boolean
  ) {
    if (!host) return;
    const { error } = await supabase
      .from("hosts")
      .update({ [key]: value })
      .eq("id", host.id);
    if (error) {
      Alert.alert("Error", error.message);
      return;
    }
    setHost({ ...host, [key]: value });
  }

  async function saveRates() {
    if (!host) return;
    const tr = parseInt(textRate, 10);
    const cr = parseInt(callRate, 10);
    if (!tr || tr < 1 || !cr || cr < 1) {
      Alert.alert("Error", "রেট কমপক্ষে ১ কয়েন হতে হবে");
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("hosts")
      .update({ text_rate: tr, call_rate: cr })
      .eq("id", host.id);
    setSaving(false);

    if (error) {
      Alert.alert("Error", error.message);
      return;
    }
    setHost({ ...host, text_rate: tr, call_rate: cr });
    Alert.alert("সফল", "রেট আপডেট হয়েছে");
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
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!host) {
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
        <Text style={{ color: COLORS.textSecondary }}>Host প্রোফাইল নেই</Text>
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
          My Services & Rates
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            color: COLORS.text,
            marginBottom: 12,
          }}
        >
          সার্ভিস চালু/বন্ধ
        </Text>

        <ServiceRow
          label="Text Chat"
          value={host.text_enabled}
          onChange={(v) => toggleService("text_enabled", v)}
        />
        <ServiceRow
          label="Voice Message"
          value={host.voice_enabled}
          onChange={(v) => toggleService("voice_enabled", v)}
        />
        <ServiceRow
          label="Audio Call"
          value={host.call_enabled}
          onChange={(v) => toggleService("call_enabled", v)}
        />

        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            color: COLORS.text,
            marginTop: 24,
            marginBottom: 12,
          }}
        >
          তোমার রেট (কয়েন)
        </Text>

        <Text style={{ color: COLORS.textSecondary, marginBottom: 6 }}>
          Text — প্রতি মেসেজ
        </Text>
        <TextInput
          value={textRate}
          onChangeText={setTextRate}
          keyboardType="number-pad"
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 12,
            padding: 14,
            borderWidth: 1,
            borderColor: COLORS.border,
            color: COLORS.text,
            marginBottom: 14,
          }}
        />

        <Text style={{ color: COLORS.textSecondary, marginBottom: 6 }}>
          Audio Call — প্রতি সেকেন্ড
        </Text>
        <TextInput
          value={callRate}
          onChangeText={setCallRate}
          keyboardType="number-pad"
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 12,
            padding: 14,
            borderWidth: 1,
            borderColor: COLORS.border,
            color: COLORS.text,
            marginBottom: 20,
          }}
        />

        <TouchableOpacity
          onPress={saveRates}
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
            <Text style={{ color: "#fff", fontWeight: "600" }}>
              রেট সেভ করো
            </Text>
          )}
        </TouchableOpacity>

        <Text
          style={{
            color: COLORS.textSecondary,
            fontSize: 12,
            marginTop: 16,
            lineHeight: 18,
          }}
        >
          • ইউজার Cabin ও চ্যাটে তোমার রেট দেখবে{"\n"}
          • Monetization OFF থাকলে রেট কাটা হবে না{"\n"}
          • অ্যাড/কয়েন আয় রেট শুধু Admin বদলায়
        </Text>
      </ScrollView>
    </View>
  );
}

function ServiceRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View
      style={{
        backgroundColor: COLORS.card,
        borderRadius: 12,
        padding: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Text style={{ fontWeight: "600", color: COLORS.text }}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: "#E2E8F0", true: COLORS.primaryLight }}
        thumbColor={value ? COLORS.primary : "#f4f3f4"}
      />
    </View>
  );
}
