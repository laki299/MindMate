import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../stores/authStore";
import { AppSettings, Profile } from "../../lib/types";
import { COLORS } from "../../lib/constants";

export default function AdminDashboard() {
  const { profile } = useAuthStore();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [searchId, setSearchId] = useState("");
  const [foundUser, setFoundUser] = useState<Profile | null>(null);
  const [searching, setSearching] = useState(false);

  async function fetchSettings() {
    const { data } = await supabase
      .from("app_settings")
      .select("*")
      .eq("id", 1)
      .single();
    if (data) setSettings(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchSettings();
  }, []);

  async function toggleMonetization(value: boolean) {
    setUpdating(true);
    const { error } = await supabase
      .from("app_settings")
      .update({
        monetization_enabled: value,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);
    setUpdating(false);

    if (error) {
      Alert.alert("Error", error.message);
      return;
    }

    setSettings((prev) =>
      prev ? { ...prev, monetization_enabled: value } : prev
    );
    Alert.alert(
      "সফল",
      value ? "Monetization চালু" : "Monetization বন্ধ — সব ফ্রি"
    );
  }

  async function searchUser() {
    const id = searchId.trim();
    if (!id) {
      Alert.alert("Error", "UUID লিখো");
      return;
    }
    setSearching(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();
    setSearching(false);

    if (error || !data) {
      setFoundUser(null);
      Alert.alert("পাওয়া যায়নি", "এই UUID এর ইউজার নেই");
      return;
    }
    setFoundUser(data);
  }

  async function banUser(id: string) {
    Alert.alert("Ban?", "এই ইউজারকে ব্যান করবে?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Ban",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase
            .from("profiles")
            .update({ is_banned: true })
            .eq("id", id);
          if (error) {
            Alert.alert("Error", error.message);
            return;
          }
          setFoundUser((u) => (u ? { ...u, is_banned: true } : u));
          Alert.alert("সফল", "ইউজার ব্যান করা হয়েছে");
        },
      },
    ]);
  }

  async function unbanUser(id: string) {
    const { error } = await supabase
      .from("profiles")
      .update({ is_banned: false })
      .eq("id", id);
    if (error) {
      Alert.alert("Error", error.message);
      return;
    }
    setFoundUser((u) => (u ? { ...u, is_banned: false } : u));
    Alert.alert("সফল", "Ban তুলে নেওয়া হয়েছে");
  }

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
        <Text style={{ color: COLORS.textSecondary, textAlign: "center" }}>
          শুধুমাত্র Admin
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginTop: 20 }}
        >
          <Text style={{ color: COLORS.primary, fontWeight: "600" }}>
            ফিরে যাও
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading || !settings) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: COLORS.background,
        }}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
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
        <View
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text
                style={{ fontSize: 16, fontWeight: "600", color: COLORS.text }}
              >
                Monetization
              </Text>
              <Text
                style={{
                  color: COLORS.textSecondary,
                  fontSize: 13,
                  marginTop: 4,
                }}
              >
                {settings.monetization_enabled
                  ? "চালু — Coin কাটা হচ্ছে"
                  : "বন্ধ — সব ফ্রি"}
              </Text>
            </View>
            <Switch
              value={settings.monetization_enabled}
              onValueChange={toggleMonetization}
              disabled={updating}
              trackColor={{ false: "#E2E8F0", true: COLORS.primaryLight }}
              thumbColor={
                settings.monetization_enabled ? COLORS.primary : "#f4f3f4"
              }
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={() => router.push("/admin/reports")}
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 14,
            padding: 18,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: COLORS.border,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "600", color: COLORS.text }}>
            Reports লিস্ট
          </Text>
          <Text style={{ fontSize: 18, color: COLORS.primary }}>›</Text>
        </TouchableOpacity>

        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            color: COLORS.text,
            marginBottom: 12,
          }}
        >
          বর্তমান রেট
        </Text>
        <View
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: COLORS.border,
            marginBottom: 24,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <Text style={{ color: COLORS.textSecondary }}>Text</Text>
            <Text style={{ fontWeight: "600", color: COLORS.text }}>
              {settings.text_coin_cost} Coin
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <Text style={{ color: COLORS.textSecondary }}>Voice / sec</Text>
            <Text style={{ fontWeight: "600", color: COLORS.text }}>
              {settings.voice_coin_per_second} Coin
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <Text style={{ color: COLORS.textSecondary }}>Call / sec</Text>
            <Text style={{ fontWeight: "600", color: COLORS.text }}>
              {settings.call_coin_per_second} Coin
            </Text>
          </View>
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <Text style={{ color: COLORS.textSecondary }}>Rewarded Ad</Text>
            <Text style={{ fontWeight: "600", color: COLORS.text }}>
              {settings.ad_reward_coins} Coin
            </Text>
          </View>
        </View>

        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            color: COLORS.text,
            marginBottom: 12,
          }}
        >
          ইউজার খুঁজো (UUID)
        </Text>
        <TextInput
          placeholder="UUID পেস্ট করো"
          placeholderTextColor={COLORS.textSecondary}
          value={searchId}
          onChangeText={setSearchId}
          autoCapitalize="none"
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 12,
            padding: 14,
            fontSize: 14,
            borderWidth: 1,
            borderColor: COLORS.border,
            color: COLORS.text,
            marginBottom: 12,
          }}
        />
        <TouchableOpacity
          onPress={searchUser}
          disabled={searching}
          style={{
            backgroundColor: COLORS.primary,
            borderRadius: 12,
            padding: 14,
            alignItems: "center",
            marginBottom: 16,
            opacity: searching ? 0.7 : 1,
          }}
        >
          {searching ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: "#fff", fontWeight: "600" }}>সার্চ</Text>
          )}
        </TouchableOpacity>

        {foundUser && (
          <View
            style={{
              backgroundColor: COLORS.card,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: COLORS.border,
              marginBottom: 20,
            }}
          >
            <Text
              style={{ fontWeight: "700", color: COLORS.text, fontSize: 16 }}
            >
              {foundUser.full_name || "No name"}
            </Text>
            <Text style={{ color: COLORS.textSecondary, marginTop: 6 }}>
              Role: {foundUser.role}
            </Text>
            <Text style={{ color: COLORS.textSecondary, marginTop: 4 }}>
              Coins: {foundUser.coin_balance}
            </Text>
            <Text style={{ color: COLORS.textSecondary, marginTop: 4 }}>
              Country: {foundUser.country_name || "N/A"}
            </Text>
            <Text style={{ color: COLORS.textSecondary, marginTop: 4 }}>
              Device: {foundUser.device_id?.slice(0, 14) || "N/A"}
            </Text>
            <Text
              style={{
                color: foundUser.is_banned ? COLORS.danger : COLORS.success,
                marginTop: 4,
                fontWeight: "600",
              }}
            >
              {foundUser.is_banned ? "BANNED" : "Active"}
            </Text>

            <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
              {foundUser.is_banned ? (
                <TouchableOpacity
                  onPress={() => unbanUser(foundUser.id)}
                  style={{
                    flex: 1,
                    backgroundColor: "#D1FAE5",
                    borderRadius: 10,
                    padding: 12,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: COLORS.success, fontWeight: "600" }}>
                    Unban
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => banUser(foundUser.id)}
                  style={{
                    flex: 1,
                    backgroundColor: "#FEE2E2",
                    borderRadius: 10,
                    padding: 12,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: COLORS.danger, fontWeight: "600" }}>
                    Ban
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        <Text
          style={{ color: COLORS.textSecondary, fontSize: 12, lineHeight: 18 }}
        >
          • দেশ শুধু Admin দেখে — ইউজার UI তে নেই{"\n"}
          • VPN বেস্ট-এফোর্ট + ১০ মিনিট ক্যাশ
        </Text>
      </ScrollView>
    </View>
  );
}
