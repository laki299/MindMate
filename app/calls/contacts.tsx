import { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../stores/authStore";
import { Contact } from "../../lib/types";
import { displayContactName } from "../../lib/expat";
import { COLORS } from "../../lib/constants";
import { sendCallInvite } from "../../lib/incomingCall";

export default function ContactsScreen() {
  const { session, profile } = useAuthStore();
  const [list, setList] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!session?.user) return;
    setLoading(true);

    const { data } = await supabase
      .from("contacts")
      .select("*")
      .eq("owner_id", session.user.id)
      .order("created_at", { ascending: false });

    const contacts = data || [];
    const codes = contacts.map((c) => c.peer_phone_code);
    let peers: Record<string, any> = {};

    if (codes.length) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url, phone_code")
        .in("phone_code", codes);
      (profiles || []).forEach((p) => {
        if (p.phone_code) peers[p.phone_code] = p;
      });
    }

    setList(
      contacts.map((c) => ({
        ...c,
        peer: peers[c.peer_phone_code] || null,
      }))
    );
    setLoading(false);
  }

  useFocusEffect(
    useCallback(() => {
      load();
    }, [session?.user?.id])
  );

  async function call(c: Contact, type: "audio" | "video") {
    const peerId = c.peer_id || c.peer?.id;
    if (!peerId) {
      Alert.alert("ত্রুটি", "পিয়ার আইডি পাওয়া যায়নি");
      return;
    }

    if (!session?.user) {
      Alert.alert("ত্রুটি", "লগইন করা নেই");
      return;
    }

    const name = displayContactName(
      c.custom_name,
      c.peer?.full_name,
      c.peer?.username,
      c.peer_phone_code
    );

    const callId = `${Date.now()}`;

    try {
      await sendCallInvite({
        toUserId: peerId,
        fromId: session.user.id,
        fromName: profile?.full_name || profile?.username || profile?.phone_code || "User",
        callType: type,
        callId,
      });

      router.push({
        pathname: "/calls/active",
        params: {
          peerId,
          peerName: name,
          callType: type,
          role: "caller",
          callId,
        },
      });
    } catch {
      Alert.alert("ত্রুটি", "কল ইনভাইট পাঠানো সম্ভব হয়নি");
    }
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
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ marginRight: 12 }}
          >
            <Text style={{ fontSize: 24, color: COLORS.primary }}>‹</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: "600", color: COLORS.text }}>
            কন্টাক্টস
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/calls/save-contact")}>
          <Text style={{ color: COLORS.primary, fontWeight: "600" }}>+ সেভ</Text>
        </TouchableOpacity>
      </View>

      {loading && list.length === 0 ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={COLORS.primary} />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(i) => i.id}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={load} />
          }
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <Text
              style={{
                textAlign: "center",
                color: COLORS.textSecondary,
                marginTop: 40,
              }}
            >
              কোনো কন্টাক্ট নেই। + সেভ চাপো।
            </Text>
          }
          renderItem={({ item }) => {
            const name = displayContactName(
              item.custom_name,
              item.peer?.full_name,
              item.peer?.username,
              item.peer_phone_code
            );
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
                <Text style={{ fontWeight: "600", color: COLORS.text }}>
                  {name}
                </Text>
                <Text
                  style={{
                    color: COLORS.textSecondary,
                    fontSize: 13,
                    marginTop: 4,
                  }}
                >
                  {item.peer_phone_code}
                </Text>
                <View style={{ flexDirection: "row", marginTop: 10, gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => call(item, "audio")}
                    style={{
                      backgroundColor: COLORS.success,
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                    }}
                  >
                    <Text style={{ color: "#fff", fontSize: 13 }}>অডিও</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => call(item, "video")}
                    style={{
                      backgroundColor: COLORS.primary,
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                    }}
                  >
                    <Text style={{ color: "#fff", fontSize: 13 }}>ভিডিও</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}
