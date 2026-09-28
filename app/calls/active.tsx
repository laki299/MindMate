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
import { COLORS } from "../../lib/constants";

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
  const secondsRef = useRef(0);
  const modeRef = useRef(mode);

  const isCaller = role === "caller";

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    startSession();
    return () => {
      void cleanup(false);
    };
  }, []);

  async function startSession() {
    if (!session?.user || !peerId) return;

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

    // পরে: CallService.start() — এখন UI
    setConnected(true);

    timerRef.current = setInterval(() => {
      secondsRef.current += 1;
      setSeconds(secondsRef.current);
    }, 1000);

    if (isCaller) {
      await chargeMinute();
      billingRef.current = setInterval(() => {
        void chargeMinute();
      }, 60_000);
    }
  }

  async function chargeMinute() {
    if (!session?.user || !profile) return;

    const { data, error } = await supabase.rpc("charge_a2a_minute", {
      p_mode: modeRef.current,
    });

    if (error) {
      console.warn(error.message);
      return;
    }

    const res = data as {
      charged: number;
      balance: number;
      debt: number;
      continue: boolean;
      reason: string;
    };

    setProfile({
      ...profile,
      coin_balance: res.balance,
      coin_debt: res.debt,
    });

    if (!res.continue) {
      Alert.alert("কয়েন শেষ", "কল শেষ হচ্ছে");
      await cleanup(true);
    }
  }

  function toggleMode() {
    setMode((m) => (m === "audio" ? "video" : "audio"));
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
          duration_seconds: secondsRef.current,
          call_type: modeRef.current,
        })
        .eq("id", logIdRef.current);
    }

    if (leaveScreen) router.back();
  }

  function hangup() {
    void cleanup(true);
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <View style={styles.root}>
      <Text style={styles.name}>{peerName || "কল"}</Text>
      <Text style={styles.sub}>
        {connected
          ? `${mode === "video" ? "ভিডিও" : "অডিও"} · \( {mm}: \){ss}`
          : "সংযোগ হচ্ছে..."}
      </Text>
      {(profile?.coin_debt || 0) > 0 ? (
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
        বিলিং RPC · WebRTC ল্যাপটপ বিল্ডে পূর্ণ কানেক্ট
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
      <Text style={{ color: danger ? "#fff" : COLORS.text, fontWeight: "600" }}>
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
  btn: { borderRadius: 12, padding: 16, alignItems: "center" },
  hint: {
    color: "#A78BFA",
    fontSize: 11,
    textAlign: "center",
    marginTop: 32,
  },
});
