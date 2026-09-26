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
} from "react-native";
import { Link, router } from "expo-router";
import { supabase } from "../../lib/supabase";
import { saveDeviceIdToProfile } from "../../lib/device";
import { COLORS } from "../../lib/constants";

export default function RegisterScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!fullName || !email || !password) {
      Alert.alert("Error", "সব ঘর পূরণ করুন");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password কমপক্ষে ৬ অক্ষরের হতে হবে");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
        },
      },
    });

    setLoading(false);

    if (error) {
      Alert.alert("Registration Failed", error.message);
      return;
    }

    if (data.user) {
      await saveDeviceIdToProfile(data.user.id);
      Alert.alert("সফল!", "অ্যাকাউন্ট তৈরি হয়েছে। এখন Login করুন।", [
        { text: "OK", onPress: () => router.replace("/(auth)/login") },
      ]);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: COLORS.background }}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingHorizontal: 24,
          paddingVertical: 40,
        }}
      >
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
          নতুন অ্যাকাউন্ট তৈরি করুন
        </Text>

        <TextInput
          placeholder="পূর্ণ নাম"
          placeholderTextColor={COLORS.textSecondary}
          value={fullName}
          onChangeText={setFullName}
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
          placeholder="Password (কমপক্ষে ৬ অক্ষর)"
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
          onPress={handleRegister}
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
              Register
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
          <Text style={{ color: COLORS.textSecondary }}>
            আগে থেকেই অ্যাকাউন্ট আছে?{" "}
          </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text style={{ color: COLORS.primary, fontWeight: "600" }}>
                Login
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
