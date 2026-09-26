import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "../../stores/authStore";
import { COLORS } from "../../lib/constants";

const MENUS = [
  {
    title: "অর্থনীতি / স্ট্যাটস",
    path: "/admin/stats",
    desc: "ইউজার, কয়েন, অ্যাড কাউন্ট",
  },
  {
    title: "বিজ্ঞাপন সেটিংস",
    path: "/admin/ad-settings",
    desc: "কুলডাউন, লিমিট, কয়েন রেট",
  },
  {
    title: "Monetization ON/OFF",
    path: "/admin/monetization",
    desc: "ফ্রি মোড টগল",
  },
  {
    title: "Reports",
    path: "/admin/reports",
    desc: "ইউজার রিপোর্ট",
  },
  {
    title: "Hosts আয়",
    path: "/admin/hosts",
    desc: "প্রতি হোস্টের কয়েন",
  },
];

export default function AdminHome() {
  const { profile } = useAuthStore();

  if (profile?.role !== "admin") {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: COLORS.background,
          padding: 20,
        }}
      >
        <Text style={{ color: COLORS.textSecondary }}>শুধু Admin</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginTop: 16 }}
        >
          <Text style={{ color: COLORS.primary }}>ফিরে যাও</Text>
        </TouchableOpacity>
      </View>
    );
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
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginRight: 12 }}
        >
          <Text style={{ fontSize: 24, color: COLORS.primary }}>‹</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: "600", color: COLORS.text }}>
          Admin Panel
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {MENUS.map((m) => (
          <TouchableOpacity
            key={m.path}
            onPress={() => router.push(m.path as any)}
            style={{
              backgroundColor: COLORS.card,
              borderRadius: 14,
              padding: 18,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <Text
              style={{ fontSize: 16, fontWeight: "600", color: COLORS.text }}
            >
              {m.title}
            </Text>
            <Text
              style={{
                color: COLORS.textSecondary,
                marginTop: 4,
                fontSize: 13,
              }}
            >
              {m.desc}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
