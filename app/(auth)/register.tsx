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
import { saveDeviceIdToProfile } from "../../lib/device";
import { useSettingsStore } from "../../stores/settingsStore";
import { t } from "../../lib/i18n";

export default function RegisterScreen() {
  const { lang, theme } = useSettingsStore();
  const s = t(lang);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!fullName.trim() || !email.trim() || !password) {
      Alert.alert("", s.fillAll);
      return;
    }
    if (password.length < 6) {
      Alert.alert("", "Password min 6 characters");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim() } },
    });

    setLoading(false);

    if (error) {
      Alert.alert("Error", error.message);
      return;
    }

    if (data.user) {
      try {
        await saveDeviceIdToProfile(data.user.id);
        await supabase.rpc("ensure_my_phone_code");
      } catch {
        /* ignore */
      }
      Alert.alert(s.registerOk, "", [
        { text: "OK", onPress: () => router.replace("/(auth)/login") },
      ]);
    }
  }

  // i18n ডুপ্লিকেশন এড়ানোর লজিক
  const haveAccountText = s.haveAccount.includes(s.login)
    ? s.haveAccount.replace(s.login, "").replace("?", "").trim() + "?"
    : s.haveAccount;

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
            {s.tagline}
          </Text>
        </View>

        {/* Name Input */}
        <InputRow
          icon="👤"
          placeholder={s.name}
          value={fullName}
          onChange={setFullName}
          theme={theme}
        />

        {/* Email Input */}
        <InputRow
          icon="✉️"
          placeholder={s.email}
          value={email}
          onChange={setEmail}
          theme={theme}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        {/* Password Input */}
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

        {/* Register Button */}
        <TouchableOpacity
          onPress={handleRegister}
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
            <Text style={styles.btnText}>{s.register} →</Text>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.orRow}>
          <View style={[styles.orLine, { backgroundColor: theme.border }]} />
          <Text style={{ color: theme.textMuted, marginHorizontal: 12 }}>
            {s.or}
          </Text>
          <View style={[styles.orLine, { backgroundColor: theme.border }]} />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={{ color: theme.textMuted }}>{haveAccountText} </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text style={{ color: theme.primary, fontWeight: "700" }}>
                {s.login}
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function InputRow({
  icon,
  placeholder,
  value,
  onChange,
  theme,
  ...rest
}: any) {
  return (
    <View
      style={[
        styles.inputRow,
        { backgroundColor: theme.card, borderColor: theme.border },
      ]}
    >
      <Text style={styles.inputIcon}>{icon}</Text>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={theme.textMuted}
        value={value}
        onChangeText={onChange}
        style={[styles.input, { color: theme.text }]}
        {...rest}
      />
    </View>
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
  logoWrap: { alignItems: "center", marginBottom: 32 },
  logo: { width: 96, height: 96, borderRadius: 24 },
  brand: { fontSize: 34, fontWeight: "800", marginTop: 14 },
  tagline: {
    textAlign: "center",
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
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
  orRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 22,
  },
  orLine: { flex: 1, height: 1 },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
  },
});
                  
