import { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../stores/authStore";
import { CallLog } from "../../lib/types";
import { displayContactName } from "../../lib/expat";
import { COLORS } from "../../lib/constants";

type Row = CallLog & { banner?: boolean };

export default function CallLogScreen() {
  const { session } = useAuthStore();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!session?.user) return;
    setLoading(true);
    const uid = session.user.id;

    const { data } = await supabase
      .from("call_logs")
      .select(
        `*,
        caller:profiles!call_logs_caller_id_fkey(id, full_name, username, phone_code),
        callee:profiles!call_logs_callee_id_fkey(id, full_name, username, phone_code)`
      )
      .or(`caller_id.eq.\( {uid},callee_id.eq. \){uid}`)
      .order("created_at", { ascending: false })
      .limit(50);

    const list: Row[] = [];
    (data || []).forEach((item, i) => {
      list.push(item as CallLog);
      if ((i + 1) % 5 === 0) {
        list.push({ id: `banner-${i}`, banner: true } as Row);
      }
    });

    setRows(list);
    setLoading(false);
  }

  useFocusEffect(
    useCallback(() => {
      load();
    }, [session?.user?.id])
  );

  function peerInfo(item: CallLog) {
    const uid = session?.user?.id;
    const isOut = item.caller_id === uid;
    const peer = isOut ? item.callee : item.caller;
    const name = displayContactName(
      null,
      peer?.full_name,
      peer?.username,
      peer?.phone_code
    );
    return { isOut, peer, name, peerId: isOut ? item.callee_id : item.caller_id };
  }

  function callback(item: CallLog, type: "audio" | "video") {
    const { peerId, name } = peerInfo(item);
    router.push({
      pathname: "/calls/active",
      params: {
        peerId,
        peerName: name,
        callType: type,
        role: "caller",
      },
    });
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Header title="কল লগ" />

      {loading && rows.length === 0 ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={COLORS.primary} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={load} />
          }
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          ListEmptyComponent={
            <Text
              style={{
                textAlign: "center",
                color: COLORS.textSecondary,
                marginTop: 40,
              }}
            >
              এখনো কোনো কল নেই
            </Text>
          }
          renderItem={({ item }) => {
            if (item.banner) {
              return (
                <View
                  style={{
                    backgroundColor: "#EDE9FE",
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: COLORS.primary, fontWeight: "600" }}>
                    📢 ব্যানার বিজ্ঞাপন
                  </Text>
                  <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>
                    AppLovin banner স্লট
                  </Text>
                </View>
              );
            }

            const { isOut, name } = peerInfo(item);
            const statusLabel =
              item.status === "missed"
                ? "মিসড"
                : item.status === "answered"
                ? "উত্তর"
                : item.status === "rejected"
                ? "কাট"
                : "ফেল";

            return (
              <View
                style={{
                  backgroundColor: COLORS.card,
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 10,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "600", color: COLORS.text }}>
                      {isOut ? "↗ " : "↙ "}
                      {name}
                    </Text>
                    <Text
                      style={{
                        color:
                          item.status === "missed"
                            ? COLORS.danger
                            : COLORS.textSecondary,
                        fontSize: 13,
                        marginTop: 4,
                      }}
                    >
                      {item.call_type === "video" ? "ভিডিও" : "অডিও"} ·{" "}
                      {statusLabel}
                      {item.duration_seconds
                        ? ` · ${item.duration_seconds}s`
                        : ""}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => callback(item, "audio")}
                      style={{
                        backgroundColor: COLORS.success,
                        borderRadius: 8,
                        paddingHorizontal: 10,
                        paddingVertical: 8,
                      }}
                    >
                      <Text style={{ color: "#fff", fontSize: 12 }}>অডিও</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => callback(item, "video")}
                      style={{
                        backgroundColor: COLORS.primary,
                        borderRadius: 8,
                        paddingHorizontal: 10,
                        paddingVertical: 8,
                      }}
                    >
                      <Text style={{ color: "#fff", fontSize: 12 }}>ভিডিও</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

function Header({ title }: { title: string }) {
  return (
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
        {title}
      </Text>
    </View>
  );
}
