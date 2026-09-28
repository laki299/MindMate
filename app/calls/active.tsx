import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../stores/authStore";
import { COLORS, COIN_RATES } from "../../lib/constants";

export default function ActiveCallScreen() {
  const { peerId, peerName, callType, role } = useLocalSearchParams<{
    peerId: string;
    peerName: string;
    callType: "audio" | "video";
    role: "caller" | "callee";
  }>();

  const { session, profile, setProfile } = useAuthStore();
  const [mode, setMode] = useState<"audio" | "video">(callType || "audio");
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [connected, setConnected] = useState(false);
  const logIdRef = useRef<string | null>(null);
  const billingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isCaller = role === "caller";
  const isExpat = !!profile?.is_expat;

  useEffect(() => {
    startSession();
    return () => cleanup(false);
  }, []);

  async function startSession() {
    if (!session?.user || !peerId) return;

    // call_log তৈরি (caller)
    if (isCaller) {
      const { data } = await supabase
        .from("call_logs")
        .insert({
          caller_id: session.user.id,
          callee_id: peerId,
          call_type: mode,
          status: "answered",
          started_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      if (data) logIdRef.current = data.id;
    }

    // WebRTC: পরে CallService — এখন UI কানেক্টেড সিমুলেশন
    setConnected(true);

    timerRef.current = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);

    if (isCaller) {
      chargeMinute();
      billingRef.current = setInterval(chargeMinute, 60_000);
    }
  }

  async function chargeMinute() {
    if (!session?.user || !profile) return;

    const { data: settings } = await supabase
      .from("app_settings")
      .select(
        "monetization_enabled, a2a_audio_coins_per_min, a2a_video_coins_per_min"
      )
      .eq("id", 1)
      .single();

    if (settings && settings.monetization_enabled === false) return;

    const rate =
      mode === "video"
        ? settings?.a2a_video_coins_per_min ?? COIN_RATES.A2A_VIDEO_PER_MIN
        : settings?.a2a_audio_coins_per_min ?? COIN_RATES.A2A_AUDIO_PER_MIN;

    if (profile.coin_balance >= rate) {
      const next = profile.coin_balance - rate;
      await supabase
        .from("profiles")
        .update({ coin_balance: next })
        .eq("id", profile.id);
      setProfile({ ...profile, coin_balance: next });
      return;
    }

    // কয়েন কম
    if (isExpat) {
      const debt = (profile.coin_debt || 0) + rate;
      await supabase
        .from("profiles")
        .update({ coin_debt: debt })
        .eq("id", profile.id);
      setProfile({ ...profile, coin_debt: debt });
      // কল চলতে থাকবে
      return;
    }

    Alert.alert("কয়েন শেষ", "কল শেষ হচ্ছে");
    cleanup(true);
  }

  function toggleMode() {
    setMode((m) => (m === "audio" ? "video" : "audio"));
    // পরে: WebRTC replaceTrack / renegotiate
  }

  async function cleanup(leaveScreen: boolean) {
    if (billingRef.current) clearInterval(billingRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    billingRef.current = null;
    timerRef.current = null;

    if (logIdRef.current) {
      await supabase
        .from("call_logs")
        .update({
          ended_at: new Date().toISOString(),
          duration_seconds: seconds,
          call_type: mode,
        })
        .eq("id", logIdRef.current);
    }

    // WebRTC end() পরে

    if (leaveScreen) {
      router.back();
    }
  }

  function hangup() {
    cleanup(true);
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <View style={styles.root}>
      <Text style={styles.name}>{peerName || "কল"}</Text>
      <Text style={styles.sub}>
        {connected ? `${mode === "video" ? "ভিডিও" : "অডিও"} · \( {mm}: \){ss}` : "সংযোগ হচ্ছে..."}
      </Text>
      {isExpat && (profile?.coin_debt || 0) > 0 ? (
        <Text style={styles.debt}>বকেয়া: {profile?.coin_debt} কয়েন</Text>
      ) : null}

      <View style={styles.actions}>
        <Action
          label={muted ? "Unmute" : "Mute"}
          onPress={() => setMuted((m) => !m)}
        />
        <Action
          label={mode === "video" ? "অডিওতে যাও" : "ভিডিও চালু"}
          onPress={toggleMode}
        />
        <Action label="কাট" danger onPress={hangup} />
      </View>

      <Text style={styles.hint}>
        P2P WebRTC ল্যাপটপ বিল্ডে পূর্ণ কানেক্ট হবে। কানেক্টের পর Supabase
        conversation লাগবে না।
      </Text>
    </View>
  );
}

function Action({
  label,
  onPress,
  danger,
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.btn,
        { backgroundColor: danger ? COLORS.danger : COLORS.card },
      ]}
    >
      <Text
        style={{
          color: danger ? "#fff" : COLORS.text,
          fontWeight: "600",
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0A0A5C",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  name: { fontSize: 28, fontWeight: "700", color: "#fff" },
  sub: { color: "#C4B5FD", marginTop: 8, fontSize: 16 },
  debt: { color: COLORS.warning, marginTop: 12 },
  actions: { marginTop: 48, width: "100%", gap: 12 },
  btn: {
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  hint: {
    color: "#A78BFA",
    fontSize: 11,
    textAlign: "center",
    marginTop: 32,
    lineHeight: 16,
  },
});
