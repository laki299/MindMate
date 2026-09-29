import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
  StyleSheet,
} from "react-native";
import { Link, router } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useSettingsStore } from "../../stores/settingsStore";
import { t } from "../../lib/i18n";

export default function LoginScreen() {
  const { lang, theme } = useSettingsStore();
  const s = t(lang);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert("", s.fillAll);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) {
      Alert.alert(s.loginFailed, error.message);
      return;
    }
    router.replace("/(tabs)");
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.root, { backgroundColor: theme.bg }]}
    >
      <View style={[styles.blobTop, { backgroundColor: theme.softPurple }]} />
      <View style={[styles.blobBottom, { backgroundColor: theme.softPurple }]} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoWrap}>
          <Image
            source={require("../../assets/icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.brand}>
            <Text style={{ color: theme.primaryDark }}>Mind</Text>
            <Text style={{ color: theme.primary }}>Mate</Text>
          </Text>
          <Text style={[styles.tagline, { color: theme.textMuted }]}>
            {s.taglineAlt}
          </Text>
        </View>

        <View
          style={[
            styles.inputRow,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <Text style={styles.inputIcon}>📱</Text>
          <TextInput
            placeholder={s.mobileOrEmail}
            placeholderTextColor={theme.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={[styles.input, { color: theme.text }]}
          />
        </View>

        <View
          style={[
            styles.inputRow,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <Text style={styles.inputIcon}>🔒</Text>
          <TextInput
            placeholder={s.password}
            placeholderTextColor={theme.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPass}
            style={[styles.input, { color: theme.text }]}
          />
          <TouchableOpacity onPress={() => setShowPass((v) => !v)} hitSlop={12}>
            <Text style={{ fontSize: 16, opacity: 0.7 }}>
              {showPass ? "🙈" : "👁"}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
          style={[
            styles.btn,
            { backgroundColor: theme.primaryDark, opacity: loading ? 0.7 : 1 },
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>{s.login} →</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={{ color: theme.textMuted }}>{s.noAccount} </Text>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity>
              <Text style={{ color: theme.primary, fontWeight: "700" }}>
                {s.register}
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  blobTop: {
    position: "absolute",
    top: -80,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.45,
  },
  blobBottom: {
    position: "absolute",
    bottom: -40,
    left: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    opacity: 0.35,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingVertical: 48,
  },
  logoWrap: { alignItems: "center", marginBottom: 36 },
  logo: { width: 96, height: 96, borderRadius: 24 },
  brand: { fontSize: 34, fontWeight: "800", marginTop: 14, letterSpacing: -0.5 },
  tagline: {
    textAlign: "center",
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    paddingHorizontal: 12,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 28,
    borderWidth: 1.5,
    paddingHorizontal: 18,
    height: 56,
    marginBottom: 14,
  },
  inputIcon: { fontSize: 18, marginRight: 12 },
  input: { flex: 1, fontSize: 15 },
  btn: {
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  btnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 28,
    flexWrap: "wrap",
  },
});
