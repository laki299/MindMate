import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../stores/authStore";
import { AppSettings } from "../lib/types";
import { COLORS, COIN_RATES } from "../lib/constants";
import {
  canWatchAd,
  recordAdWatch,
  canWatchShortVideo,
  recordShortVideoWatch,
} from "../lib/adLimits";

export default function EarnScreen() {
  const { profile, setProfile } = useAuthStore();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("*")
        .eq("id", 1)
        .single();
      if (data) setSettings(data);
      setLoading(false);
    })();
  }, []);

  if (profile?.role === "host" || profile?.role === "admin") {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: COLORS.background,
          padding: 24,
        }}
      >
        <Text style={{ color: COLORS.textSecondary, textAlign: "center" }}>
          হোস্ট/অ্যাডমিন অ্যাড দিয়ে কয়েন জমা করতে পারে না।{"\n"}
          হোস্ট শুধু ইউজার থেকে আয় করে।
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: COLORS.primary, fontWeight: "600" }}>
            ফিরে যাও
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const adCoins = settings?.ad_reward_coins ?? COIN_RATES.AD_REWARD;
  const svCoins = settings?.short_video_coins ?? COIN_RATES.SHORT_VIDEO;

  const adCfg = {
    maxPerMinute: settings?.ad_max_per_minute ?? 1,
    maxConsecutive: settings?.ad_max_consecutive ?? 5,
    batchCooldownMinutes: settings?.ad_batch_cooldown_minutes ?? 10,
  };

  const svCfg = {
    maxPerMinute: settings?.short_video_max_per_minute ?? 1,
    maxConsecutive: settings?.short_video_max_consecutive ?? 5,
    batchCooldownMinutes: settings?.short_video_batch_cooldown_minutes ?? 10,
  };

  async function grantCoins(amount: number, type: "ad_reward" | "short_video") {
    if (!profile) return;

    const { error } = await supabase
      .from("profiles")
      .update({ coin_balance: profile.coin_balance + amount })
      .eq("id", profile.id);

    if (error) throw error;

    setProfile({ ...profile, coin_balance: profile.coin_balance + amount });

    if (type === "ad_reward") {
      await supabase.rpc("increment_ad_watch");
    } else {
      await supabase.rpc("increment_short_video_watch");
    }
  }

  async function onRewardedAd() {
    const check = await canWatchAd(adCfg);
    if (!check.ok) {
      Alert.alert("অপেক্ষা করো", check.reason);
      return;
    }

    setBusy(true);
    try {
      // পরে AppLovin MAX এখানে বসবে — এখন সিমুলেশন
      await grantCoins(adCoins, "ad_reward");
      await recordAdWatch(adCfg);
      Alert.alert("সফল", `${adCoins} Coin যোগ হয়েছে`);
    } catch (e: any) {
      Alert.alert("Error", e.message || "ব্যর্থ");
    }
    setBusy(false);
  }

  async function onShortVideo() {
    const check = await canWatchShortVideo(svCfg);
    if (!check.ok) {
      Alert.alert("অপেক্ষা করো", check.reason);
      return;
    }

    setBusy(true);
    try {
      await grantCoins(svCoins, "short_video");
      await recordShortVideoWatch(svCfg);
      Alert.alert("সফল", `${svCoins} Coin যোগ হয়েছে`);
    } catch (e: any) {
      Alert.alert("Error", e.message || "ব্যর্থ");
    }
    setBusy(false);
  }

  function onOfferwall() {
    Alert.alert(
      "শীঘ্রই",
      "Offerwall অ্যাপ রিলিজের পর চালু হবে। রেট Admin নির্ধারণ করে।"
    );
  }

  if (loading) {
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
          ফ্রি কয়েন জমা
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ color: COLORS.textSecondary, marginBottom: 16 }}>
          ব্যালেন্স: 🪙 {profile?.coin_balance ?? 0}
        </Text>

        <EarnCard
          title="রিওয়ার্ডেড বিজ্ঞাপন"
          subtitle={`${adCoins} Coin · মিনিটে ${adCfg.maxPerMinute}টি · টানা ${adCfg.maxConsecutive}টির পর ${adCfg.batchCooldownMinutes} মিনিট কুলডাউন`}
          onPress={onRewardedAd}
          disabled={busy}
        />

        <EarnCard
          title="শর্ট ভিডিও"
          subtitle={`${svCoins} Coin · মিনিটে ${svCfg.maxPerMinute}টি · টানা ${svCfg.maxConsecutive}টির পর ${svCfg.batchCooldownMinutes} মিনিট কুলডাউন`}
          onPress={onShortVideo}
          disabled={busy}
        />

        <EarnCard
          title="অফার ওয়াল"
          subtitle="পোস্টব্যাক অনুযায়ী · শীঘ্রই"
          onPress={onOfferwall}
          disabled={busy}
        />

        <Text
          style={{
            color: COLORS.textSecondary,
            fontSize: 12,
            marginTop: 12,
            lineHeight: 18,
          }}
        >
          • লিমিট Admin প্যানেল থেকে বদলাতে পারবে{"\n"}
          • আসল অ্যাড SDK ল্যাপটপ বিল্ডে যোগ হবে{"\n"}
          • এখন টেস্ট মোডে কয়েন সিমুলেট হয়
        </Text>
      </ScrollView>
    </View>
  );
}

function EarnCard({
  title,
  subtitle,
  onPress,
  disabled,
}: {
  title: string;
  subtitle: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={{
        backgroundColor: COLORS.card,
        borderRadius: 14,
        padding: 18,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <Text style={{ fontSize: 16, fontWeight: "600", color: COLORS.text }}>
        {title}
      </Text>
      <Text
        style={{ color: COLORS.textSecondary, marginTop: 6, fontSize: 13 }}
      >
        {subtitle}
      </Text>
    </TouchableOpacity>
  );
}
