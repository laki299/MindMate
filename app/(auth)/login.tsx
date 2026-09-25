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
} from "react-native";
import { Link, router } from "expo-router";
import { supabase } from "../../lib/supabase";
import { COLORS } from "../../lib/constants";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert("Error", "Email এবং Password দিন");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (error) {
      Alert.alert("Login Failed", error.message);
      return;
    }

    router.replace("/");
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: COLORS.background }}
    >
      <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 24 }}>
        <Text
          style={{
            fontSize: 32,
            fontWeight: "700",
            color: COLORS.primary,
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          MindMate
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: COLORS.textSecondary,
            textAlign: "center",
            marginBottom: 40,
          }}
        >
          আপনার মানসিক সাথী
        </Text>

        <TextInput
          placeholder="Email"
          placeholderTextColor={COLORS.textSecondary}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 12,
            padding: 16,
            fontSize: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: COLORS.border,
            color: COLORS.text,
          }}
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor={COLORS.textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 12,
            padding: 16,
            fontSize: 16,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: COLORS.border,
            color: COLORS.text,
          }}
        />

        <TouchableOpacity
          onPress={handleLogin}
          disabled={loading}
          style={{
            backgroundColor: COLORS.primary,
            borderRadius: 12,
            padding: 16,
            alignItems: "center",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
              Login
            </Text>
          )}
        </TouchableOpacity>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            marginTop: 24,
          }}
        >
          <Text style={{ color: COLORS.textSecondary }}>অ্যাকাউন্ট নেই? </Text>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity>
              <Text style={{ color: COLORS.primary, fontWeight: "600" }}>
                Register
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
