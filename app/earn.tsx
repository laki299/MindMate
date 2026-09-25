import { View, Text, TouchableOpacity, Alert, ScrollView } from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "../stores/authStore";
import { COLORS, COIN_RATES } from "../lib/constants";

export default function EarnScreen() {
  const { profile } = useAuthStore();

  function handleRewardedAd() {
    // পরে AppLovin MAX দিয়ে implement করব
    Alert.alert(
      "Rewarded Ad",
      `প্রতিটি Ad দেখলে পাবে ${COIN_RATES.AD_REWARD} Coins\n\n• আড়াই মিনিটে সর্বোচ্চ ১টি\n• ঘণ্টায় সর্বোচ্চ ২০টি\n\nশীঘ্রই চালু হবে।`
    );
  }

  function handleShortVideo() {
    Alert.alert(
      "Short Video",
      `প্রতিটি Short Video দেখলে পাবে ${COIN_RATES.SHORT_VIDEO} Coins\n\n• আড়াই মিনিট কুলডাউন\n• ঘণ্টায় সর্বোচ্চ ১০টি\n\nশীঘ্রই চালু হবে।`
    );
  }

  function handleOfferwall() {
    Alert.alert(
      "Offerwall",
      `প্রতি Cent-এ পাবে ${COIN_RATES.OFFERWALL_PER_CENT} Coins\n\nPostback অনুযায়ী Coin যোগ হবে।\n\nশীঘ্রই চালু হবে।`
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
              {COIN_RATES.AD_REWARD} Coins • আড়াই মিনিটে ১টা
            </Text>
          </View>
          <Text style={{ fontSize: 18, color: COLORS.primary }}>›</Text>
        </TouchableOpacity>

        {/* Short Video */}
        <TouchableOpacity
          onPress={handleShortVideo}
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
              {COIN_RATES.SHORT_VIDEO} Coins • ঘণ্টায় ১০টা
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
              {COIN_RATES.OFFERWALL_PER_CENT} Coins / Cent
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
