import { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../stores/authStore";
import { CallLog, Host } from "../../lib/types";
import { displayContactName } from "../../lib/expat";
import { COLORS } from "../../lib/constants";

type HomeRow =
  | { kind: "call"; item: CallLog }
  | { kind: "host"; item: Host };

export default function HomeScreen() {
  const { profile, session } = useAuthStore();
  const isExpat = !!profile?.is_expat;
  const [rows, setRows] = useState<HomeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    if (!session?.user) {
      setLoading(false);
      return;
    }
    const uid = session.user.id;
    const list: HomeRow[] = [];

    // সবার জন্য: সাম্প্রতিক কল (Imo-র মতো লিস্ট)
    const { data: logs } = await supabase
      .from("call_logs")
      .select("*")
      .or(`caller_id.eq.${uid},callee_id.eq.${uid}`)
      .order("created_at", { ascending: false })
      .limit(40);

    (logs || []).forEach((item) => {
      list.push({ kind: "call", item: item as CallLog });
    });

    // শুধু প্রবাসী: হোস্ট ক্যাবিন সেকশন
    if (isExpat) {
      const { data: hosts } = await supabase
        .from("hosts")
        .select("*")
        .eq("is_active", true)
        .order("status", { ascending: true })
        .limit(20);
      (hosts || []).forEach((h) => list.push({ kind: "host", item: h as Host }));
    }

    setRows(list);
    setLoading(false);
    setRefreshing(false);
  }

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [session?.user?.id, isExpat])
  );

  function peerLabel(item: CallLog) {
    const uid = session?.user?.id;
    const isOut = item.caller_id === uid;
    const otherId = isOut ? item.callee_id : item.caller_id;
    return {
      isOut,
      otherId,
      title: isOut ? "আউটগোয়িং" : "ইনকামিং",
    };
  }

  if (loading && rows.length === 0) {
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
      {/* Header — Imo স্টাইল */}
      <View
        style={{
          paddingTop: 56,
          paddingHorizontal: 16,
          paddingBottom: 12,
          backgroundColor: COLORS.card,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: "700", color: COLORS.text }}>
            MindMate
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View
              style={{
                backgroundColor: "#FEF3C7",
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 16,
              }}
            >
              <Text style={{ fontWeight: "600", color: "#D97706" }}>
                🪙 {profile?.coin_balance ?? 0}
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/calls/dialer")}>
              <Text style={{ fontSize: 22 }}>⌨️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {profile?.phone_code ? (
          <TouchableOpacity
            onPress={() => router.push("/calls/my-number")}
            style={{ marginTop: 8 }}
          >
            <Text style={{ color: COLORS.primary, fontWeight: "600" }}>
              আমার নম্বর: {profile.phone_code}
            </Text>
          </TouchableOpacity>
        ) : (
          <Text style={{ color: COLORS.warning, marginTop: 8, fontSize: 13 }}>
            নম্বর তৈরি হচ্ছে… একবার অ্যাপ বন্ধ-খোলো বা পুল-টু-রিফ্রেশ
          </Text>
        )}

        {profile?.role === "user" && (
          <TouchableOpacity
            onPress={() => router.push("/earn")}
            style={{
              marginTop: 12,
              backgroundColor: COLORS.primary,
              borderRadius: 12,
              paddingVertical: 10,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>
              🎁 ফ্রি কয়েন জমা
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={rows}
        keyExtractor={(r, i) =>
          r.kind === "call" ? `c-${r.item.id}` : `h-${r.item.id}-${i}`
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            colors={[COLORS.primary]}
          />
        }
        contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
        ListHeaderComponent={
          isExpat ? (
            <Text
              style={{
                color: COLORS.textSecondary,
                marginBottom: 8,
                marginLeft: 4,
                fontSize: 13,
              }}
            >
              সাম্প্রতিক কল · নিচে হোস্ট ক্যাবিন (প্রবাসী)
            </Text>
          ) : (
            <Text
              style={{
                color: COLORS.textSecondary,
                marginBottom: 8,
                marginLeft: 4,
                fontSize: 13,
              }}
            >
              সাম্প্রতিক কল · ডায়ালার থেকে নতুন কল
            </Text>
          )
        }
        ListEmptyComponent={
          <View style={{ alignItems: "center", marginTop: 48, padding: 20 }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>📞</Text>
            <Text
              style={{
                color: COLORS.text,
                fontWeight: "600",
                fontSize: 16,
                marginBottom: 8,
              }}
            >
              এখনো কোনো কল নেই
            </Text>
            <Text
              style={{
                color: COLORS.textSecondary,
                textAlign: "center",
                lineHeight: 20,
                marginBottom: 16,
              }}
            >
              Imo-র মতো ১০ ডিজিট নম্বর দিয়ে কল করো। কন্টাক্ট সেভ করতে Calls ট্যাব
              ব্যবহার করো।
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/calls/dialer")}
              style={{
                backgroundColor: COLORS.primary,
                borderRadius: 12,
                paddingVertical: 12,
                paddingHorizontal: 24,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>
                ডায়ালার খুলো
              </Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => {
          if (item.kind === "host") {
            const h = item.item;
            return (
              <TouchableOpacity
                onPress={() => router.push(`/cabin/${h.id}`)}
                style={cardStyle}
              >
                <Image
                  source={{
                    uri:
                      h.photo_url ||
                      "https://ui-avatars.com/api/?name=" +
                        encodeURIComponent(h.display_name) +
                        "&background=7C3AED&color=fff",
                  }}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    marginRight: 12,
                  }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "600", color: COLORS.text }}>
                    🏠 {h.display_name}
                  </Text>
                  <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>
                    হোস্ট ক্যাবিন · {h.status}
                  </Text>
                </View>
                <Text style={{ color: COLORS.primary }}>›</Text>
              </TouchableOpacity>
            );
          }

          const c = item.item;
          const { isOut, otherId } = peerLabel(c);
          const name = displayContactName(
            null,
            null,
            null,
            isOut ? "কল করা" : "কল এসেছিল"
          );

          return (
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/calls/active",
                  params: {
                    peerId: otherId,
                    peerName: name,
                    callType: c.call_type || "audio",
                    role: "caller",
                  },
                })
              }
              style={cardStyle}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: "#EDE9FE",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <Text style={{ fontSize: 20 }}>{isOut ? "↗" : "↙"}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "600", color: COLORS.text }}>
                  {isOut ? "আউটগোয়িং" : "ইনকামিং"} ·{" "}
                  {c.call_type === "video" ? "ভিডিও" : "অডিও"}
                </Text>
                <Text
                  style={{
                    color:
                      c.status === "missed"
                        ? COLORS.danger
                        : COLORS.textSecondary,
                    fontSize: 12,
                    marginTop: 2,
                  }}
                >
                  {c.status}
                  {c.duration_seconds ? ` · ${c.duration_seconds}s` : ""}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/calls/active",
                    params: {
                      peerId: otherId,
                      peerName: "Callback",
                      callType: "audio",
                      role: "caller",
                    },
                  })
                }
                style={{
                  backgroundColor: COLORS.success,
                  borderRadius: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                }}
              >
                <Text style={{ color: "#fff", fontSize: 12 }}>কল</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const cardStyle = {
  backgroundColor: COLORS.card,
  borderRadius: 14,
  padding: 14,
  marginBottom: 10,
  flexDirection: "row" as const,
  alignItems: "center" as const,
  borderWidth: 1,
  borderColor: COLORS.border,
};
  
