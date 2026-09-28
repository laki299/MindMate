import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "../../stores/authStore";
import { COLORS } from "../../lib/constants";

export default function CallsHubScreen() {
  const { profile } = useAuthStore();

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
          কল
        </Text>
        <Text style={{ color: COLORS.textSecondary, marginTop: 4, fontSize: 13 }}>
          আমার নম্বর: {profile?.phone_code || "— — —"}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <HubItem
          title="কল লগ"
          desc="ইনকামিং, আউটগোয়িং, মিসড · ব্যাক কল"
          onPress={() => router.push("/calls/log")}
        />
        <HubItem
          title="ডায়ালার"
          desc="১০ ডিজিট নম্বর দিয়ে অডিও / ভিডিও কল"
          onPress={() => router.push("/calls/dialer")}
        />
        <HubItem
          title="কন্টাক্টস"
          desc="নম্বর সেভ, কাস্টম নাম (Imo স্টাইল)"
          onPress={() => router.push("/calls/contacts")}
        />
        <HubItem
          title="আমার নম্বর"
          desc="কপি ও শেয়ার"
          onPress={() => router.push("/calls/my-number")}
        />
      </ScrollView>
    </View>
  );
}

function HubItem({
  title,
  desc,
  onPress,
}: {
  title: string;
  desc: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: COLORS.card,
        borderRadius: 14,
        padding: 18,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
      }}
    >
      <Text style={{ fontSize: 16, fontWeight: "600", color: COLORS.text }}>
        {title}
      </Text>
      <Text style={{ color: COLORS.textSecondary, marginTop: 4, fontSize: 13 }}>
        {desc}
      </Text>
    </TouchableOpacity>
  );
 }
