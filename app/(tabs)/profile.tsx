import { View, Text, TouchableOpacity, Image, ScrollView, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "../../stores/authStore";
import { useSettingsStore } from "../../stores/settingsStore";
import { t } from "../../lib/i18n";
import { supabase } from "../../lib/supabase";

export default function ProfileScreen() {
  const { profile, setSession, setProfile } = useAuthStore();
  const { lang, theme, darkMode, setLang, setDarkMode } = useSettingsStore();
  const s = t(lang);

  async function logout() {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    router.replace("/(auth)/login");
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bg }}
      contentContainerStyle={{ paddingBottom: 48 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.blob, { backgroundColor: theme.softPurple }]} />

      <View style={{ alignItems: "center", paddingTop: 56, paddingHorizontal: 20 }}>
        <Text style={styles.brand}>
          <Text style={{ color: theme.primaryDark }}>Mind</Text>
          <Text style={{ color: theme.primary }}>Mate</Text>
        </Text>
        <Text style={{ color: theme.textMuted, marginBottom: 22, fontSize: 13 }}>
          {s.safeSecure}
        </Text>

        <Image
          source={
            profile?.avatar_url
              ? { uri: profile.avatar_url }
              : require("../../assets/icon.png")
          }
          style={[
            styles.bigAvatar,
            { borderColor: theme.primary, backgroundColor: theme.softPurple },
          ]}
        />

        <View
          style={[
            styles.card,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <Info label={s.name} value={profile?.full_name || "—"} theme={theme} />
          <Info
            label={s.uid}
            value={profile?.phone_code || "----------"}
            theme={theme}
          />
          <Info
            label={s.bio}
            value={profile?.bio || "—"}
            theme={theme}
            last
          />
        </View>

        <TouchableOpacity
          onPress={() => router.push("/profile/edit")}
          activeOpacity={0.85}
          style={[styles.editBtn, { backgroundColor: theme.primaryDark }]}
        >
          <Text style={styles.editBtnText}>✏️  {s.edit}</Text>
        </TouchableOpacity>

        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
              marginTop: 22,
              width: "100%",
            },
          ]}
        >
          <Text style={{ fontWeight: "800", color: theme.text, marginBottom: 14 }}>
            {s.settings}
          </Text>
          <Text style={{ color: theme.textMuted, marginBottom: 8 }}>{s.language}</Text>
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 18 }}>
            <Seg
              active={lang === "bn"}
              label={s.bangla}
              onPress={() => setLang("bn")}
              theme={theme}
            />
            <Seg
              active={lang === "en"}
              label={s.english}
              onPress={() => setLang("en")}
              theme={theme}
            />
          </View>
          <Text style={{ color: theme.textMuted, marginBottom: 8 }}>{s.theme}</Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Seg
              active={!darkMode}
              label={s.light}
              onPress={() => setDarkMode(false)}
              theme={theme}
            />
            <Seg
              active={darkMode}
              label={s.night}
              onPress={() => setDarkMode(true)}
              theme={theme}
            />
          </View>
        </View>

        <TouchableOpacity onPress={logout} style={{ marginTop: 28 }}>
          <Text style={{ color: theme.danger, fontWeight: "700", fontSize: 15 }}>
            {s.logout}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function Info({
  label,
  value,
  theme,
  last,
}: {
  label: string;
  value: string;
  theme: any;
  last?: boolean;
}) {
  return (
    <View
      style={{
        paddingVertical: 14,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: theme.border,
      }}
    >
      <Text style={{ color: theme.textMuted, fontSize: 12, fontWeight: "600" }}>
        {label}
      </Text>
      <Text
        style={{
          color: theme.text,
          fontWeight: "700",
          marginTop: 4,
          fontSize: 15,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function Seg({ active, label, onPress, theme }: any) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flex: 1,
        paddingVertical: 11,
        borderRadius: 14,
        backgroundColor: active ? theme.primary : theme.inputBg,
        alignItems: "center",
      }}
    >
      <Text style={{ color: active ? "#fff" : theme.text, fontWeight: "700" }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  blob: {
    position: "absolute",
    top: -50,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    opacity: 0.4,
  },
  brand: { fontSize: 24, fontWeight: "800" },
  bigAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
  },
  card: {
    width: "100%",
    borderRadius: 20,
    padding: 18,
    marginTop: 24,
    borderWidth: 1,
  },
  editBtn: {
    marginTop: 20,
    width: "100%",
    height: 54,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4F46E5",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  editBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
