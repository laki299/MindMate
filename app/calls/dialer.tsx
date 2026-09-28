import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "../../lib/supabase";
import { COLORS } from "../../lib/constants";

export default function DialerScreen() {
  const [number, setNumber] = useState("");
  const [busy, setBusy] = useState(false);

  async function startCall(type: "audio" | "video") {
    const code = number.replace(/\D/g, "");
    if (code.length !== 10) {
      Alert.alert("নম্বর", "ঠিক ১০ ডিজিট দাও");
      return;
    }

    setBusy(true);
    // পরে: interstitial ad → তারপর কল
    const { data: peer, error } = await supabase
      .from("profiles")
      .select("id, full_name, username, phone_code")
      .eq("phone_code", code)
      .maybeSingle();

    setBusy(false);

    if (error || !peer) {
      Alert.alert("পাওয়া যায়নি", "এই নম্বরে কোনো অ্যাকাউন্ট নেই");
      return;
    }

    router.push({
      pathname: "/calls/active",
      params: {
        peerId: peer.id,
        peerName: peer.full_name || peer.username || code,
        callType: type,
        role: "caller",
      },
    });
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
          ডায়ালার
        </Text>
      </View>

      <View style={{ padding: 24 }}>
        <Text style={{ color: COLORS.textSecondary, marginBottom: 8 }}>
          ১০ ডিজিট MindMate নম্বর
        </Text>
        <TextInput
          value={number}
          onChangeText={setNumber}
          keyboardType="number-pad"
          maxLength={10}
          placeholder="01XXXXXXXX"
          placeholderTextColor={COLORS.textSecondary}
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 12,
            padding: 16,
            fontSize: 22,
            letterSpacing: 2,
            borderWidth: 1,
            borderColor: COLORS.border,
            color: COLORS.text,
            marginBottom: 24,
          }}
        />

        <TouchableOpacity
          disabled={busy}
          onPress={() => startCall("audio")}
          style={{
            backgroundColor: COLORS.success,
            borderRadius: 12,
            padding: 16,
            alignItems: "center",
            marginBottom: 12,
            opacity: busy ? 0.6 : 1,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>অডিও কল</Text>
        </TouchableOpacity>

        <TouchableOpacity
          disabled={busy}
          onPress={() => startCall("video")}
          style={{
            backgroundColor: COLORS.primary,
            borderRadius: 12,
            padding: 16,
            alignItems: "center",
            opacity: busy ? 0.6 : 1,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>ভিডিও কল</Text>
        </TouchableOpacity>

        <Text
          style={{
            color: COLORS.textSecondary,
            fontSize: 12,
            marginTop: 16,
            textAlign: "center",
          }}
        >
          কল বাটনে পরে Interstitial অ্যাড দেখাবে (AppLovin)
        </Text>
      </View>
    </View>
  );
 }
