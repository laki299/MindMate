import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../stores/authStore";
import { Host } from "../../lib/types";
import { COLORS } from "../../lib/constants";

export default function HostEarningsScreen() {
  const { session } = useAuthStore();
  const [host, setHost] = useState<Host | null>(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function fetchHost() {
    if (!session?.user) return;

    const { data } = await supabase
      .from("hosts")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (data) setHost(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchHost();
  }, [session?.user?.id]);

  async function handleWithdraw() {
    if (!host || !session?.user) return;

    const numAmount = parseInt(amount, 10);

    if (!numAmount || numAmount <= 0) {
      Alert.alert("Error", "সঠিক পরিমাণ লিখো");
      return;
    }

    if (numAmount > host.total_earned - host.total_withdrawn) {
      Alert.alert("Error", "তোমার Available Balance এর বেশি Withdraw করতে পারবে না");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from("withdrawals").insert({
      host_id: session.user.id,
      amount: numAmount,
      status: "pending",
    });

    setSubmitting(false);

    if (error) {
      Alert.alert("Error", error.message);
      return;
    }

    Alert.alert("সফল!", "Withdrawal Request পাঠানো হয়েছে। Admin চেক করে পেমেন্ট করবে।");
    setAmount("");
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const available = (host?.total_earned || 0) - (host?.total_withdrawn || 0);

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
          Earnings & Withdrawal
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View
          style={{
            backgroundColor: COLORS.primary,
            borderRadius: 20,
            padding: 24,
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <Text style={{ color: "#E9D5FF", fontSize: 14 }}>Available Balance</Text>
          <Text style={{ color: "#fff", fontSize: 36, fontWeight: "700", marginTop: 6 }}>
            🪙 {available}
          </Text>
        </View>

        <View
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 16,
            padding: 16,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
            <Text style={{ color: COLORS.textSecondary }}>Total Earned</Text>
            <Text style={{ fontWeight: "600", color: COLORS.text }}>{host?.total_earned || 0}</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: COLORS.textSecondary }}>Total Withdrawn</Text>
            <Text style={{ fontWeight: "600", color: COLORS.text }}>{host?.total_withdrawn || 0}</Text>
          </View>
        </View>

        <Text style={{ fontSize: 16, fontWeight: "600", color: COLORS.text, marginBottom: 10 }}>
          Withdraw Request
        </Text>

        <TextInput
          placeholder="Amount (Coins)"
          placeholderTextColor={COLORS.textSecondary}
          value={amount}
          onChangeText={setAmount}
          keyboardType="number-pad"
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 12,
            padding: 16,
            fontSize: 16,
            borderWidth: 1,
            borderColor: COLORS.border,
            color: COLORS.text,
            marginBottom: 16,
          }}
        />

        <TouchableOpacity
          onPress={handleWithdraw}
          disabled={submitting}
          style={{
            backgroundColor: COLORS.primary,
            borderRadius: 14,
            padding: 16,
            alignItems: "center",
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>
              Submit Withdrawal Request
            </Text>
          )}
        </TouchableOpacity>

        <Text style={{ color: COLORS.textSecondary, fontSize: 13, marginTop: 16, lineHeight: 20 }}>
          • Admin ম্যানুয়ালি পেমেন্ট করবে{"\n"}
          • Request পাঠানোর পর Status “Pending” থাকবে{"\n"}
          • পেমেন্ট হলে Status “Paid” হবে
        </Text>
      </ScrollView>
    </View>
  );
}
