import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { COLORS } from "../../lib/constants";

export default function IncomingCallScreen() {
  const { fromId, fromName, callType, callId } = useLocalSearchParams<{
    fromId: string;
    fromName: string;
    callType: "audio" | "video";
    callId: string;
  }>();

  function accept() {
    router.replace({
      pathname: "/calls/active",
      params: {
        peerId: fromId,
        peerName: fromName || "কলার",
        callType: callType || "audio",
        role: "callee",
      },
    });
  }

  function reject() {
    router.back();
  }

  return (
    <View style={styles.root}>
      <Text style={styles.label}>ইনকামিং কল</Text>
      <Text style={styles.name}>{fromName || "Unknown"}</Text>
      <Text style={styles.sub}>
        {callType === "video" ? "ভিডিও কল" : "অডিও কল"}
      </Text>

      <View style={styles.row}>
        <TouchableOpacity
          onPress={reject}
          style={[styles.btn, { backgroundColor: COLORS.danger }]}
        >
          <Text style={styles.btnText}>কাট</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={accept}
          style={[styles.btn, { backgroundColor: COLORS.success }]}
        >
          <Text style={styles.btnText}>রিসিভ</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0A0A5C",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  label: { color: "#C4B5FD", marginBottom: 8 },
  name: { fontSize: 28, fontWeight: "700", color: "#fff" },
  sub: { color: "#A78BFA", marginTop: 8 },
  row: { flexDirection: "row", marginTop: 48, gap: 20 },
  btn: {
    borderRadius: 40,
    paddingVertical: 16,
    paddingHorizontal: 28,
  },
  btnText: { color: "#fff", fontWeight: "700" },
});
