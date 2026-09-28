import { View, Text, TouchableOpacity, Share, Alert } from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "../../stores/authStore";
import { COLORS } from "../../lib/constants";

export default function MyNumberScreen() {
  const { profile } = useAuthStore();
  const code = profile?.phone_code || "";

  async function copyShare() {
    if (!code) {
      Alert.alert("নাম্বর নেই", "প্রোফাইল আপডেট অপেক্ষা করো বা সাপোর্টে যোগাযোগ করো।");
      return;
    }
    try {
      await Share.share({
        message: `MindMate নম্বর: ${code}`,
      });
    } catch {
      Alert.alert("নম্বর", code);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Header title="আমার নম্বর" />
      <View style={{ padding: 24, alignItems: "center", marginTop: 40 }}>
        <Text style={{ color: COLORS.textSecondary, marginBottom: 8 }}>
          তোমার MindMate নম্বর
        </Text>
        <Text
          style={{
            fontSize: 32,
            fontWeight: "700",
            color: COLORS.text,
            letterSpacing: 2,
          }}
        >
          {code || "----------"}
        </Text>
        <TouchableOpacity
          onPress={copyShare}
          style={{
            marginTop: 28,
            backgroundColor: COLORS.primary,
            borderRadius: 12,
            paddingVertical: 14,
            paddingHorizontal: 28,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>কপি / শেয়ার</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Header({ title }: { title: string }) {
  return (
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
        {title}
      </Text>
    </View>
  );
}
