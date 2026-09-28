import { useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../stores/authStore";
import { COLORS } from "../../lib/constants";

export default function WalletScreen() {
  const { profile, setProfile, session } = useAuthStore();
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  async function refreshProfile() {
    if (!session?.user) return;
    setRefreshing(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();
    if (data) setProfile(data);
    setRefreshing(false);
  }

  useFocusEffect(
    useCallback(() => {
      refreshProfile();
    }, [session?.user?.id])
  );

  async function payDebt() {
    if (!profile || (profile.coin_debt || 0) <= 0) {
      Alert.alert("বকেয়া নেই", "কোনো unpaid debt নেই");
      return;
    }
    if (profile.coin_balance <= 0) {
      Alert.alert("কয়েন নেই", "আগে Earn থেকে কয়েন জমা করো");
      return;
    }

    setBusy(true);
    const { data, error } = await supabase.rpc("pay_coin_debt");
    setBusy(false);

    if (error) {
      Alert.alert("Error", error.message);
      return;
    }

    const res = data as {
      paid: number;
      balance: number;
      debt: number;
      message: string;
    };

    setProfile({
      ...profile,
      coin_balance: res.balance,
      coin_debt: res.debt,
    });

    if (res.message === "insufficient_balance") {
      Alert.alert("আংশিক/অসম্ভব", "ব্যালেন্স দিয়ে debt শোধ করা যায়নি");
    } else {
      Alert.alert("সফল", `${res.paid} কয়েন debt শোধ হয়েছে`);
    }
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
        }}
      >
        <Text style={{ fontSize: 20, fontWeight: "700", color: COLORS.text }}>
          ওয়ালেট
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshProfile} />
        }
      >
        <View
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 16,
            padding: 24,
            borderWidth: 1,
            borderColor: COLORS.border,
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Text style={{ color: COLORS.textSecondary }}>ব্যালেন্স</Text>
          <Text
            style={{
              fontSize: 40,
              fontWeight: "700",
              color: COLORS.text,
              marginTop: 8,
            }}
          >
            🪙 {profile?.coin_balance ?? 0}
          </Text>
        </View>

        {(profile?.coin_debt || 0) > 0 ? (
          <View
            style={{
              backgroundColor: "#FEF3C7",
              borderRadius: 14,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <Text style={{ fontWeight: "600", color: COLORS.text }}>
              বকেয়া (প্রবাসী কল)
            </Text>
            <Text style={{ color: COLORS.warning, fontSize: 22, marginTop: 6 }}>
              {profile?.coin_debt} কয়েন
            </Text>
            <Text
              style={{
                color: COLORS.textSecondary,
                fontSize: 12,
                marginTop: 6,
                lineHeight: 18,
              }}
            >
              কয়েন শেষেও কল চালিয়ে গেলে debt জমে। ব্যালেন্স থেকে শোধ করো।
            </Text>
            <TouchableOpacity
              onPress={payDebt}
              disabled={busy}
              style={{
                marginTop: 12,
                backgroundColor: COLORS.primary,
                borderRadius: 10,
                padding: 12,
                alignItems: "center",
                opacity: busy ? 0.7 : 1,
              }}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: "#fff", fontWeight: "600" }}>
                  বকেয়া শোধ করো
                </Text>
              )}
            </TouchableOpacity>
          </View>
        ) : null}

        {profile?.role === "user" ? (
          <TouchableOpacity
            onPress={() => router.push("/earn")}
            style={{
              backgroundColor: COLORS.primary,
              borderRadius: 12,
              padding: 16,
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>
              ফ্রি কয়েন জমা
            </Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          onPress={() => router.push("/(tabs)/calls")}
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: COLORS.border,
            alignItems: "center",
          }}
        >
          <Text style={{ color: COLORS.text, fontWeight: "600" }}>
            কল ট্যাব →
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
                }
