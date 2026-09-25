import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
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
  const [updating, setUpdating] = useState(false);

  async function fetchHost() {
    if (!session?.user) return;

    const { data } = await supabase
      .from("hosts")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (data) setHost(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchHost();
  }, [session?.user?.id]);

  async function toggleService(
    field: "text_enabled" | "voice_enabled" | "call_enabled",
    value: boolean
  ) {
    if (!host) return;

    setUpdating(true);

    const { error } = await supabase
      .from("hosts")
      .update({ [field]: value })
      .eq("id", host.id);

    setUpdating(false);

    if (error) {
      Alert.alert("Error", error.message);
      return;
    }

    setHost({ ...host, [field]: value });
  }

  if (loading || !host) {
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
          My Services
        </Text>
      </View>

      <View style={{ padding: 20 }}>
        <Text style={{ color: COLORS.textSecondary, marginBottom: 20 }}>
          কোন কোন সার্ভিস চালু রাখবে তা নিজে কন্ট্রোল করতে পারো
        </Text>

        {/* Text */}
        <View
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 14,
            padding: 18,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: COLORS.border,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View>
            <Text style={{ fontSize: 16, fontWeight: "600", color: COLORS.text }}>
              💬 Text Chat
            </Text>
            <Text style={{ color: COLORS.textSecondary, fontSize: 13, marginTop: 2 }}>
              টেক্সট মেসেজ
            </Text>
          </View>
          <Switch
            value={host.text_enabled}
            onValueChange={(v) => toggleService("text_enabled", v)}
            disabled={updating}
            trackColor={{ false: "#E2E8F0", true: COLORS.primaryLight }}
            thumbColor={host.text_enabled ? COLORS.primary : "#f4f3f4"}
          />
        </View>

        {/* Voice */}
        <View
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 14,
            padding: 18,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: COLORS.border,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View>
            <Text style={{ fontSize: 16, fontWeight: "600", color: COLORS.text }}>
              🎙️ Voice Message
            </Text>
            <Text style={{ color: COLORS.textSecondary, fontSize: 13, marginTop: 2 }}>
              ভয়েস মেসেজ
            </Text>
          </View>
          <Switch
            value={host.voice_enabled}
            onValueChange={(v) => toggleService("voice_enabled", v)}
            disabled={updating}
            trackColor={{ false: "#E2E8F0", true: COLORS.primaryLight }}
            thumbColor={host.voice_enabled ? COLORS.primary : "#f4f3f4"}
          />
        </View>

        {/* Audio Call */}
        <View
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 14,
            padding: 18,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: COLORS.border,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View>
            <Text style={{ fontSize: 16, fontWeight: "600", color: COLORS.text }}>
              📞 Audio Call
            </Text>
            <Text style={{ color: COLORS.textSecondary, fontSize: 13, marginTop: 2 }}>
              অডিও কল (Agora)
            </Text>
          </View>
          <Switch
            value={host.call_enabled}
            onValueChange={(v) => toggleService("call_enabled", v)}
            disabled={updating}
            trackColor={{ false: "#E2E8F0", true: COLORS.primaryLight }}
            thumbColor={host.call_enabled ? COLORS.primary : "#f4f3f4"}
          />
        </View>
      </View>
    </View>
  );
}
