import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../stores/authStore";
import { useSettingsStore } from "../../stores/settingsStore";
import { t } from "../../lib/i18n";

export default function SaveContactScreen() {
  const { session } = useAuthStore();
  const { lang, theme } = useSettingsStore();
  const s = t(lang);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    const code = phone.replace(/\D/g, "");
    if (code.length !== 10) {
      Alert.alert("", s.need10);
      return;
    }
    if (!session?.user) return;
    setBusy(true);

    const { data: peer } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .eq("phone_code", code)
      .maybeSingle();

    const { error } = await supabase.from("contacts").insert({
      owner_id: session.user.id,
      peer_id: peer?.id || null,
      peer_phone_code: code,
      custom_name: name.trim() || null,
      contact_avatar: null,
    });

    setBusy(false);
    if (error) {
      Alert.alert("Error", error.message);
      return;
    }
    router.back();
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={[styles.blob, { backgroundColor: theme.softPurple }]} />

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
            <Text style={{ fontSize: 28, color: theme.primary }}>‹</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: "center", marginRight: 28 }}>
            <Text style={styles.brand}>
              <Text style={{ color: theme.primaryDark }}>Mind</Text>
              <Text style={{ color: theme.primary }}>Mate</Text>
            </Text>
            <Text style={{ color: theme.textMuted, fontSize: 12 }}>
              {s.safeSecure}
            </Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 22, marginTop: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: theme.softPurple,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <Text style={{ fontSize: 22 }}>👤</Text>
            </View>
            <View>
              <Text style={{ fontSize: 18, fontWeight: "800", color: theme.text }}>
                {s.addContact}
              </Text>
              <Text style={{ color: theme.textMuted, fontSize: 13, marginTop: 2 }}>
                {s.addContactSub}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.formCard,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.label, { color: theme.textMuted }]}>{s.name}</Text>
            <View
              style={[
                styles.field,
                { backgroundColor: theme.inputBg, borderColor: theme.border },
              ]}
            >
              <Text style={{ marginRight: 10 }}>👤</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder={s.namePlaceholder}
                placeholderTextColor={theme.textMuted}
                style={{ flex: 1, color: theme.text, fontSize: 15 }}
              />
            </View>

            <Text style={[styles.label, { color: theme.textMuted, marginTop: 16 }]}>
              {s.phonePlaceholder}
            </Text>
            <View
              style={[
                styles.field,
                { backgroundColor: theme.inputBg, borderColor: theme.border },
              ]}
            >
              <Text style={{ marginRight: 10 }}>📞</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                keyboardType="number-pad"
                maxLength={10}
                placeholder={s.phonePlaceholder}
                placeholderTextColor={theme.textMuted}
                style={{
                  flex: 1,
                  color: theme.text,
                  fontSize: 16,
                  letterSpacing: 1,
                }}
              />
            </View>

            <View
              style={[
                styles.photoBox,
                { borderColor: theme.border, backgroundColor: theme.inputBg },
              ]}
            >
              <Text style={{ fontSize: 28, marginBottom: 6 }}>📷</Text>
              <Text style={{ color: theme.textMuted, fontWeight: "600" }}>
                {s.photoOptional}
              </Text>
              <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 4 }}>
                {s.selectPhoto}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={save}
            disabled={busy}
            activeOpacity={0.85}
            style={[
              styles.primaryBtn,
              {
                backgroundColor: theme.primaryDark,
                opacity: busy ? 0.7 : 1,
              },
            ]}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>+  {s.add}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.back()}
            style={[
              styles.secondaryBtn,
              { borderColor: theme.border, backgroundColor: theme.card },
            ]}
          >
            <Text style={{ color: theme.text, fontWeight: "600", fontSize: 16 }}>
              {s.cancel}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  blob: {
    position: "absolute",
    top: -60,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    opacity: 0.4,
  },
  topBar: {
    paddingTop: 52,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  brand: { fontSize: 20, fontWeight: "800" },
  formCard: {
    marginTop: 20,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
  },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 8 },
  field: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 50,
  },
  photoBox: {
    marginTop: 18,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: "dashed",
    paddingVertical: 22,
    alignItems: "center",
  },
  primaryBtn: {
    marginTop: 24,
    height: 54,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4F46E5",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  secondaryBtn: {
    marginTop: 12,
    height: 54,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
});
