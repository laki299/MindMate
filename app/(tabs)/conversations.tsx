import { View, Text } from "react-native";
import { COLORS } from "../../lib/constants";

export default function ConversationsScreen() {
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
          Conversations
        </Text>
      </View>

      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <Text style={{ fontSize: 16, color: COLORS.textSecondary }}>
          এখনো কোনো Conversation নেই
        </Text>
      </View>
    </View>
  );
}
