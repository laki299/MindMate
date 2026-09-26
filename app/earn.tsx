import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore } from "../stores/authStore";
import { COLORS, COIN_RATES } from "../lib/constants";
import { supabase } from "../lib/supabase";
import { AppSettings } from "../lib/types";

// AsyncStorage Keys
const STORAGE_KEYS = {
  LAST_AD_AT: "last_ad_at",
  AD_STREAK: "ad_streak",
  AD_BLOCKED_UNTIL: "ad_batch_blocked_until",
};

export default function EarnScreen() {
  const { profile, fetchProfile } = useAuthStore();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  // ডাটাবেজ থেকে সেটিং লোড করা
  async function loadSettings() {
    const { data } = await supabase.from("app_settings").select("*").eq("id", 1).single();
    if (data) {
      setSettings(data);
    }
  }

  // হোস্ট বা অ্যাডমিন হলে স্ক্রিন ব্লক
  if (profile?.role === "host" || profile?.role === "admin") {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
          backgroundColor: COLORS.background,
        }}
      >
        <Text style={{ color: COLORS.textSecondary, textAlign: "center", fontSize: 15, lineHeight: 22 }}>
          হোস্ট/অ্যাডমিন কয়েন জমা (অ্যাড) করতে পারে না।{"\n"}
          হোস্ট শুধু ইউজার থেকে আয় করে।
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: COLORS.primary, fontWeight: "600", fontSize: 16 }}>ফিরে যাও</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // কুলডাউন চেক ফাংশন
  async function checkAdCooldown(): Promise<boolean> {
    const now = Date.now();
    const blockedUntilStr = await AsyncStorage.getItem(STORAGE_KEYS.AD_BLOCKED_UNTIL);

    if (blockedUntilStr) {
      const blockedUntil = parseInt(blockedUntilStr, 10);
      if (now < blockedUntil) {
        const remainingMinutes = Math.ceil((blockedUntil - now) / (1000 * 60));
        Alert.alert(
          "কুলডাউন চলছে",
          `আপনি পরপর বেশ কয়েকটি এড দেখেছেন। অনুগ্রহ করে ${remainingMinutes} মিনিট পর আবার চেষ্টা করুন।`
        );
        return false;
      } else {
        // কুলডাউন সময় শেষ হলে ক্লিয়ার
        await AsyncStorage.removeItem(STORAGE_KEYS.AD_BLOCKED_UNTIL);
        await AsyncStorage.setItem(STORAGE_KEYS.AD_STREAK, "0");
      }
    }
    return true;
  }

  // এড দেখার পর লোকাল স্টোরেজ আপডেট
  async function registerAdWatch() {
    const now = Date.now();
    const streakStr = (await AsyncStorage.getItem(STORAGE_KEYS.AD_STREAK)) || "0";
    const currentStreak = parseInt(streakStr, 10) + 1;

    const maxConsecutive = settings?.ad_max_consecutive ?? 5;
    const cooldownMinutes = settings?.ad_batch_cooldown_minutes ?? 10;

    if (currentStreak >= maxConsecutive) {
      const blockedUntil = now + cooldownMinutes * 60 * 1000;
      await AsyncStorage.setItem(STORAGE_KEYS.AD_BLOCKED_UNTIL, blockedUntil.toString());
      await AsyncStorage.setItem(STORAGE_KEYS.AD_STREAK, "0");
    } else {
      await AsyncStorage.setItem(STORAGE_KEYS.AD_STREAK, currentStreak.toString());
    }

    await AsyncStorage.setItem(STORAGE_KEYS.LAST_AD_AT, now.toString());
  }

  // Rewarded Ad হ্যান্ডলার
  async function handleRewardedAd() {
    const canWatch = await checkAdCooldown();
    if (!canWatch) return;

    setLoading(true);

    try {
      // TODO: AppLovin MAX / AdMob SDK Implementation
      // এড সফলভাবে দেখা সম্পন্ন হলে:
      const { error } = await supabase.rpc("increment_ad_watch");

      if (error) throw error;

      await registerAdWatch();
      await fetchProfile(); // প্রোফাইলের রিফ্রেশ করে নতুন কয়েন ব্যালেন্স আনা

      Alert.alert("অভিনন্দন!", `আপনি ${settings?.ad_reward_coins ?? COIN_RATES.AD_REWARD} Coins অর্জন করেছেন!`);
    } catch (err: any) {
      Alert.alert("ত্রুটি", err.message || "কয়েন যোগ করতে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  }

  // Short Video হ্যান্ডলার
  async function handleShortVideo() {
    setLoading(true);
    try {
      const { error } = await supabase.rpc("increment_short_video_watch");
      if (error) throw error;

      await fetchProfile();
      Alert.alert("অভিনন্দন!", `আপনি ${settings?.short_video_coins ?? COIN_RATES.SHORT_VIDEO} Coins অর্জন করেছেন!`);
    } catch (err: any) {
      Alert.alert("ত্রুটি", err.message || "ভিডিও পয়েন্ট যোগ হতে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  }

  function handleOfferwall() {
    Alert.alert(
      "Offerwall",
      `প্রতি Cent-এ পাবে ${settings?.offerwall_coins_per_cent ?? COIN_RATES.OFFERWALL_PER_CENT} Coins\n\nPostback অনুযায়ী Coin যোগ হবে।\n\nশীঘ্রই চালু হবে।`
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* Header */}
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
          ফ্রি কয়েন জমা
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Balance Card */}
        <View
          style={{
            backgroundColor: COLORS.primary,
            borderRadius: 20,
            padding: 24,
            alignItems: "center",
            marginBottom: 28,
          }}
        >
          <Text style={{ color: "#E9D5FF", fontSize: 14 }}>বর্তমান ব্যালেন্স</Text>
          <Text style={{ color: "#fff", fontSize: 36, fontWeight: "700", marginTop: 6 }}>
            🪙 {profile?.coin_balance ?? 0}
          </Text>
        </View>

        <Text style={{ fontSize: 16, fontWeight: "600", color: COLORS.text, marginBottom: 16 }}>
          কয়েন সংগ্রহের উপায়
        </Text>

        {/* Rewarded Ad */}
        <TouchableOpacity
          onPress={handleRewardedAd}
          disabled={loading}
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 16,
            padding: 18,
            marginBottom: 14,
            borderWidth: 1,
            borderColor: COLORS.border,
            flexDirection: "row",
            alignItems: "center",
            opacity: loading ? 0.6 : 1,
          }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              backgroundColor: "#EDE9FE",
              justifyContent: "center",
              alignItems: "center",
              marginRight: 14,
            }}
          >
            <Text style={{ fontSize: 24 }}>🎬</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: "600", color: COLORS.text }}>
              Rewarded বিজ্ঞাপন দেখুন
            </Text>
            <Text style={{ color: COLORS.textSecondary, fontSize: 13, marginTop: 2 }}>
              {settings?.ad_reward_coins ?? COIN_RATES.AD_REWARD} Coins • আড়াই মিনিটে ১টা
            </Text>
          </View>
          {loading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <Text style={{ fontSize: 18, color: COLORS.primary }}>›</Text>
          )}
        </TouchableOpacity>

        {/* Short Video */}
        <TouchableOpacity
          onPress={handleShortVideo}
          disabled={loading}
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 16,
            padding: 18,
            marginBottom: 14,
            borderWidth: 1,
            borderColor: COLORS.border,
            flexDirection: "row",
            alignItems: "center",
            opacity: loading ? 0.6 : 1,
          }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              backgroundColor: "#FEF3C7",
              justifyContent: "center",
              alignItems: "center",
              marginRight: 14,
            }}
          >
            <Text style={{ fontSize: 24 }}>📱</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: "600", color: COLORS.text }}>
              Short Video দেখুন
            </Text>
            <Text style={{ color: COLORS.textSecondary, fontSize: 13, marginTop: 2 }}>
              {settings?.short_video_coins ?? COIN_RATES.SHORT_VIDEO} Coins • ঘণ্টায় ১০টা
            </Text>
          </View>
          <Text style={{ fontSize: 18, color: COLORS.primary }}>›</Text>
        </TouchableOpacity>

        {/* Offerwall */}
        <TouchableOpacity
          onPress={handleOfferwall}
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 16,
            padding: 18,
            marginBottom: 14,
            borderWidth: 1,
            borderColor: COLORS.border,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              backgroundColor: "#D1FAE5",
              justifyContent: "center",
              alignItems: "center",
              marginRight: 14,
            }}
          >
            <Text style={{ fontSize: 24 }}>🎁</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: "600", color: COLORS.text }}>
              Offerwall
            </Text>
            <Text style={{ color: COLORS.textSecondary, fontSize: 13, marginTop: 2 }}>
              {settings?.offerwall_coins_per_cent ?? COIN_RATES.OFFERWALL_PER_CENT} Coins / Cent
            </Text>
          </View>
          <Text style={{ fontSize: 18, color: COLORS.primary }}>›</Text>
        </TouchableOpacity>

        <View
          style={{
            backgroundColor: "#F1F5F9",
            borderRadius: 12,
            padding: 14,
            marginTop: 10,
          }}
        >
          <Text style={{ color: COLORS.textSecondary, fontSize: 13, lineHeight: 20 }}>
            • সব রেট Admin পরিবর্তন করতে পারবে{"\n"}
            • Coin রিয়েল-টাইমে যোগ হবে{"\n"}
            • অ্যাপ প্রকাশের পর Ad ও Offerwall চালু করা হবে
          </Text>
        </View>
      </ScrollView>
    </View>
  );
 }
