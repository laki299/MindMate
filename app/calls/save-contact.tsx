import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../stores/authStore";
import { COLORS } from "../../lib/constants";

export default function SaveContactScreen() {
  const { session } = useAuthStore();
  const [phone, setPhone] = useState("");
  const [customName, setCustomName] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!session?.user) return;
    const code = phone.replace(/\D/g, "");
    if (code.length !== 10) {
      Alert.alert("নম্বর", "ঠিক ১০ ডিজিট দাও");
      return;
    }

    setBusy(true);
    const { data: peer } = await supabase
      .from("profiles")
      .select("id, phone_code")
      .eq("phone_code", code)
      .maybeSingle();

    if (!peer) {
      setBusy(false);
      Alert.alert("পাওয়া যায়নি", "এই নম্বরে অ্যাকাউন্ট নেই");
      return;
    }

    if (peer.id === session.user.id) {
      setBusy(false);
      Alert.alert("এরর", "নিজের নম্বর সেভ করা যাবে না");
      return;
    }

    const { error } = await supabase.from("contacts").upsert(
      {
        owner_id: session.user.id,
        peer_id: peer.id,
        peer_phone_code: code,
        custom_name: customName.trim() || null,
      },
      { onConflict: "owner_id,peer_phone_code" }
    );

    setBusy(false);
    if (error) {
      Alert.alert("Error", error.message);
      return;
    }
    Alert.alert("সফল", "কন্টাক্ট সেভ হয়েছে");
    router.back();
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
          কন্টাক্ট সেভ
        </Text>
      </View>

      <View style={{ padding: 20 }}>
        <Text style={{ color: COLORS.textSecondary, marginBottom: 6 }}>
          ১০ ডিজিট নম্বর *
        </Text>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          keyboardType="number-pad"
          maxLength={10}
          style={inputStyle}
        />

        <Text style={{ color: COLORS.textSecondary, marginBottom: 6 }}>
          নিজের দেওয়া নাম (ঐচ্ছিক)
        </Text>
        <Text
          style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 6 }}
        >
          খালি রাখলে প্রোফাইলের নাম দেখাবে
        </Text>
        <TextInput
          value={customName}
          onChangeText={setCustomName}
          placeholder="যেমন: রাহিম ভাই"
          placeholderTextColor={COLORS.textSecondary}
          style={inputStyle}
        />

        <TouchableOpacity
          onPress={save}
          disabled={busy}
          style={{
            backgroundColor: COLORS.primary,
            borderRadius: 12,
            padding: 16,
            alignItems: "center",
            opacity: busy ? 0.7 : 1,
          }}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: "#fff", fontWeight: "600" }}>সেভ করো</Text>
          )}
        </TouchableOpacity>
      </View>
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
