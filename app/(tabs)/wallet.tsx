import { View, Text, TouchableOpacity, Alert } from "react-native";
import { useAuthStore } from "../../stores/authStore";
import { COLORS } from "../../lib/constants";

export default function WalletScreen() {
  const { profile } = useAuthStore();

  function handleEarnCoins() {
    // পরে AppLovin MAX দিয়ে implement করব
    Alert.alert(
      "Coming Soon",
      "Rewarded Ad শীঘ্রই যোগ করা হবে।\nএখনকার জন্য Admin থেকে Coin অ্যাড করা যাবে।"
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View
        style={{
          paddingTop: 60,
          paddingHorizontal: 20,
          paddingBottom: 16,
          backgroundColor: COLORS.card,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: "700", color: COLORS.text }}>
          Wallet
        </Text>
      </View>

      <View style={{ padding: 20 }}>
        <View
          style={{
            backgroundColor: COLORS.primary,
            borderRadius: 20,
            padding: 28,
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <Text style={{ color: "#E9D5FF", fontSize: 14, marginBottom: 8 }}>
            Current Balance
          </Text>
          <Text
            style={{
              color: "#fff",
              fontSize: 42,
              fontWeight: "700",
            }}
          >
            🪙 {profile?.coin_balance ?? 0}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleEarnCoins}
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 14,
            padding: 18,
            alignItems: "center",
            borderWidth: 1,
            borderColor: COLORS.border,
            marginBottom: 12,
          }}
        >
          <Text
            style={{ fontSize: 16, fontWeight: "600", color: COLORS.primary }}
          >
            🎁 Earn Free Coins (Watch Ad)
          </Text>
        </TouchableOpacity>

        <View
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 14,
            padding: 16,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              color: COLORS.textSecondary,
              lineHeight: 22,
            }}
          >
            • ১টি Rewarded Ad = ১২ Coins{"\n"}
            • প্রতি মিনিটে সর্বোচ্চ ১টি Ad{"\n"}
            • প্রতি ঘণ্টায় সর্বোচ্চ ১৫টি Ad{"\n"}
            • Voice = ১ Coin/sec{"\n"}
            • Audio Call = ২ Coin/sec
          </Text>
        </View>
      </View>
    </View>
  );
}
