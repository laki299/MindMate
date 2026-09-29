import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../stores/authStore";
import { useSettingsStore } from "../../stores/settingsStore";
import { t } from "../../lib/i18n";

export default function EditProfileScreen() {
  const { profile, setProfile, session } = useAuthStore();
  const { lang, theme } = useSettingsStore();
  const s = t(lang);
  const [name, setName] = useState(profile?.full_name || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!session?.user) return;
    setBusy(true);
    const { data, error } = await supabase
      .from("profiles")
      .update({
        full_name: name.trim(),
        bio: bio.trim().slice(0, 300),
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.user.id)
      .select("*")
      .single();
    setBusy(false);
    if (error) {
      Alert.alert("Error", error.message);
      return;
    }
    if (data) setProfile(data);
    router.back();
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bg }}
      contentContainerStyle={{ padding: 20, paddingTop: 52, paddingBottom: 40 }}
    >
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={{ fontSize: 24, color: theme.primary }}>‹</Text>
      </TouchableOpacity>
      <Text
        style={{
          textAlign: "center",
          fontSize: 20,
          fontWeight: "800",
          color: theme.text,
          marginTop: -28,
        }}
      >
        <Text style={{ color: theme.primaryDark }}>Mind</Text>
        <Text style={{ color: theme.primary }}>Mate</Text>
      </Text>
      <Text
        style={{
          textAlign: "center",
          color: theme.textMuted,
          marginBottom: 20,
        }}
      >
        {s.editProfile}
      </Text>

      <View style={{ alignItems: "center", marginBottom: 20 }}>
        <Image
          source={
            profile?.avatar_url
              ? { uri: profile.avatar_url }
              : require("../../assets/icon.png")
          }
          style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            borderWidth: 3,
            borderColor: theme.primary,
            backgroundColor: theme.softPurple,
          }}
        />
        <Text style={{ color: theme.primary, marginTop: 10 }}>
          {s.changePhoto}
        </Text>
      </View>

      <Text style={{ color: theme.textMuted }}>{s.name}</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        style={{
          backgroundColor: theme.card,
          borderRadius: 14,
          padding: 14,
          marginTop: 6,
          marginBottom: 6,
          borderWidth: 1,
          borderColor: theme.border,
          color: theme.text,
        }}
      />
      <Text style={{ color: theme.textMuted, fontSize: 12, marginBottom: 16 }}>
        {s.nameHint}
      </Text>

      <Text style={{ color: theme.textMuted }}>{s.bio}</Text>
      <TextInput
        value={bio}
        onChangeText={setBio}
        multiline
        maxLength={300}
        style={{
          backgroundColor: theme.card,
          borderRadius: 14,
          padding: 14,
          marginTop: 6,
          minHeight: 100,
          textAlignVertical: "top",
          borderWidth: 1,
          borderColor: theme.border,
          color: theme.text,
        }}
      />
      <Text
        style={{
          color: theme.textMuted,
          fontSize: 12,
          textAlign: "right",
          marginTop: 4,
        }}
      >
        {bio.length}/300
      </Text>

      <TouchableOpacity
        onPress={save}
        disabled={busy}
        style={{
          marginTop: 24,
          height: 52,
          borderRadius: 28,
          backgroundColor: theme.primaryDark,
          alignItems: "center",
          justifyContent: "center",
          opacity: busy ? 0.7 : 1,
        }}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: "#fff", fontWeight: "700" }}>💾 {s.save}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.back()}
        style={{
          marginTop: 12,
          height: 52,
          borderRadius: 28,
          borderWidth: 1,
          borderColor: theme.border,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.card,
        }}
      >
        <Text style={{ color: theme.text, fontWeight: "600" }}>{s.cancel}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
  }
