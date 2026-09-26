import { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../stores/authStore";
import { COLORS } from "../../lib/constants";

type StatsData = {
  totalUsers: number;
  userCoins: number;
  hostCoins: number;
  allCoins: number;
  minted: number;
  withdrawn: number;
  ads: number;
  shorts: number;
};

export default function AdminStatsScreen() {
  const { profile } = useAuthStore();
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);

    const [usersRes, profilesRes, hostsRes, statsRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("coin_balance, role"),
      supabase.from("hosts").select("id, total_earned, display_name"),
      supabase.from("app_stats").select("*").eq("id", 1).single(),
    ]);

    const profiles = profilesRes.data || [];
    const userCoins = profiles
      .filter((p) => p.role === "user")
      .reduce((s, p) => s + (p.coin_balance || 0), 0);
    const hostCoins = profiles
      .filter((p) => p.role === "host")
      .reduce((s, p) => s + (p.coin_balance || 0), 0);
    const allCoins = profiles.reduce((s, p) => s + (p.coin_balance || 0), 0);

    const st = statsRes.data;

    setData({
      totalUsers: usersRes.count || 0,
      userCoins,
      hostCoins,
      allCoins,
      minted: st?.total_coins_minted || 0,
      withdrawn: st?.total_coins_withdrawn || 0,
      ads: st?.total_ads_watched || 0,
      shorts: st?.total_short_videos_watched || 0,
    });
    setLoading(false);
  }

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  async function resetWatchCounters() {
    Alert.alert(
      "রিসেট?",
      "অ্যাড + শর্ট ভিডিও কাউন্ট জিরো হবে (মাসিক হিসাবের জন্য)।",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Zero",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase.rpc("reset_watch_counters");
            if (error) {
              Alert.alert("Error", error.message);
              return;
            }
            Alert.alert("সফল", "কাউন্ট রিসেট হয়েছে");
            load();
          },
        },
      ]
    );
  }

  if (profile?.role !== "admin") {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>শুধু Admin</Text>
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
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Text style={{ fontSize: 24, color: COLORS.primary }}>‹</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: "600", color: COLORS.text }}>
          অর্থনীতি / স্ট্যাটস
        </Text>
      </View>

      {loading && !data ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={COLORS.primary} />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20 }}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={load} />
          }
        >
          <StatCard title="মোট ইউজার" value={String(data?.totalUsers ?? 0)} />
          <StatCard
            title="ইউজারদের অব্যবহৃত কয়েন"
            value={String(data?.userCoins ?? 0)}
            hint="role = user ব্যালেন্স যোগফল"
          />
          <StatCard
            title="হোস্টদের কয়েন (ব্যালেন্স)"
            value={String(data?.hostCoins ?? 0)}
          />
          <StatCard
            title="সব মিলিয়ে সার্কুলেটিং কয়েন"
            value={String(data?.allCoins ?? 0)}
            hint="সব প্রোফাইলের coin_balance"
          />
          <StatCard
            title="মোট তৈরি কয়েন (minted)"
            value={String(data?.minted ?? 0)}
            hint="অ্যাড/ভিডিও থেকে ইস্যু"
          />
          <StatCard
            title="উইথড্র করা কয়েন"
            value={String(data?.withdrawn ?? 0)}
            hint="উইথড্র হলে বিয়োগ হিসাবে ট্র্যাক"
          />
          <StatCard
            title="নিট (minted − withdrawn)"
            value={String((data?.minted ?? 0) - (data?.withdrawn ?? 0))}
          />

          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: COLORS.text,
              marginTop: 8,
              marginBottom: 12,
            }}
          >
            ওয়াচ কাউন্টার
          </Text>
          <StatCard title="মোট Rewarded Ad" value={String(data?.ads ?? 0)} />
          <StatCard title="মোট Short Video" value={String(data?.shorts ?? 0)} />

          <TouchableOpacity
            onPress={resetWatchCounters}
            style={{
              backgroundColor: "#FEE2E2",
              borderRadius: 12,
              padding: 16,
              alignItems: "center",
              marginTop: 8,
            }}
          >
            <Text style={{ color: COLORS.danger, fontWeight: "600" }}>
              Ad + Short Video কাউন্ট জিরো করো
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

function StatCard({
  title,
  value,
  hint,
}: {
  title: string;
  value: string;
  hint?: string;
}) {
  return (
    <View
      style={{
        backgroundColor: COLORS.card,
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
      }}
    >
      <Text style={{ color: COLORS.textSecondary, fontSize: 13 }}>{title}</Text>
      <Text
        style={{
          fontSize: 26,
          fontWeight: "700",
          color: COLORS.text,
          marginTop: 6,
        }}
      >
        {value}
      </Text>
      {hint ? (
        <Text style={{ color: COLORS.textSecondary, fontSize: 11, marginTop: 4 }}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
