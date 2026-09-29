import { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Image,
  Alert,
  StyleSheet,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../stores/authStore";
import { useSettingsStore } from "../../stores/settingsStore";
import { t } from "../../lib/i18n";
import { CallLog, Contact } from "../../lib/types";
import { resolveContactDisplay } from "../../lib/displayName";
import { sendCallInvite } from "../../lib/incomingCall";

type TabMain = "calls" | "contacts";
type CallFilter = "all" | "missed" | "outgoing" | "incoming";

type LogRow = CallLog & {
  peerName?: string;
  peerAvatar?: string | null;
  peerPhone?: string | null;
};

export default function HomeScreen() {
  const { session, profile } = useAuthStore();
  const { lang, theme } = useSettingsStore();
  const s = t(lang);

  const [main, setMain] = useState<TabMain>("calls");
  const [filter, setFilter] = useState<CallFilter>("all");
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    if (!session?.user) {
      setLoading(false);
      return;
    }
    const uid = session.user.id;

    const { data: callData } = await supabase
      .from("call_logs")
      .select("*")
      .or(`caller_id.eq.${uid},callee_id.eq.${uid}`)
      .order("created_at", { ascending: false })
      .limit(80);

    const raw = (callData as CallLog[]) || [];
    const otherIds = [
      ...new Set(
        raw.map((c) => (c.caller_id === uid ? c.callee_id : c.caller_id))
      ),
    ];

    let profileMap: Record<
      string,
      { full_name: string | null; username: string | null; avatar_url: string | null; phone_code: string | null }
    > = {};

    if (otherIds.length) {
      const { data: peers } = await supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url, phone_code")
        .in("id", otherIds);
      (peers || []).forEach((p: any) => {
        profileMap[p.id] = p;
      });
    }

    const { data: myContacts } = await supabase
      .from("contacts")
      .select("*")
      .eq("owner_id", uid);

    const contactByPeer: Record<string, any> = {};
    const contactByPhone: Record<string, any> = {};
    (myContacts || []).forEach((c: any) => {
      if (c.peer_id) contactByPeer[c.peer_id] = c;
      if (c.peer_phone_code) contactByPhone[c.peer_phone_code] = c;
    });

    const enriched: LogRow[] = raw.map((c) => {
      const otherId = c.caller_id === uid ? c.callee_id : c.caller_id;
      const p = profileMap[otherId];
      const saved =
        contactByPeer[otherId] ||
        (p?.phone_code ? contactByPhone[p.phone_code] : null);
      const disp = resolveContactDisplay({
        customName: saved?.custom_name,
        contactAvatar: saved?.contact_avatar,
        profileName: p?.full_name,
        profileUsername: p?.username,
        profileAvatar: p?.avatar_url,
        phoneCode: p?.phone_code,
        unknownLabel: s.unknownCaller,
      });
      return {
        ...c,
        peerName: disp.name,
        peerAvatar: disp.avatarUrl,
        peerPhone: p?.phone_code || saved?.peer_phone_code,
      };
    });

    setLogs(enriched);

    const contactRows = await Promise.all(
      ((myContacts as Contact[]) || []).map(async (c) => {
        let peer: any = null;
        if (c.peer_id) {
          const { data } = await supabase
            .from("profiles")
            .select("id, full_name, username, avatar_url, phone_code")
            .eq("id", c.peer_id)
            .maybeSingle();
          peer = data;
        } else if (c.peer_phone_code) {
          const { data } = await supabase
            .from("profiles")
            .select("id, full_name, username, avatar_url, phone_code")
            .eq("phone_code", c.peer_phone_code)
            .maybeSingle();
          peer = data;
        }
        const disp = resolveContactDisplay({
          customName: c.custom_name,
          contactAvatar: (c as any).contact_avatar,
          profileName: peer?.full_name,
          profileUsername: peer?.username,
          profileAvatar: peer?.avatar_url,
          phoneCode: c.peer_phone_code,
          unknownLabel: s.unknownCaller,
        });
        return {
          ...c,
          peer,
          displayName: disp.name,
          displayAvatar: disp.avatarUrl,
        };
      })
    );

    setContacts(contactRows);
    setLoading(false);
    setRefreshing(false);
  }

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [session?.user?.id, lang])
  );

  async function startCall(
    peerId: string | null | undefined,
    peerPhone: string | null | undefined,
    peerName: string,
    type: "audio" | "video"
  ) {
    if (!session?.user) return;

    let targetId = peerId || null;
    let name = peerName;

    if (!targetId && peerPhone) {
      const code = peerPhone.replace(/\D/g, "");
      const { data: peer } = await supabase
        .from("profiles")
        .select("id, full_name, username, phone_code")
        .eq("phone_code", code)
        .maybeSingle();
      if (!peer) {
        Alert.alert("", s.notFound);
        return;
      }
      targetId = peer.id;
      name = peer.full_name || peer.username || code;
    }

    if (!targetId) {
      Alert.alert("", s.notFound);
      return;
    }

    const callId = `${Date.now()}`;
    try {
      await sendCallInvite({
        toUserId: targetId,
        fromId: session.user.id,
        fromName:
          profile?.full_name ||
          profile?.username ||
          profile?.phone_code ||
          "User",
        callType: type,
        callId,
      });
    } catch {
      /* peer offline */
    }

    router.push({
      pathname: "/calls/active",
      params: {
        peerId: targetId,
        peerName: name,
        callType: type,
        role: "caller",
        callId,
      },
    });
  }

  const uid = session?.user?.id;

  const filteredLogs = logs.filter((c) => {
    if (!uid) return true;
    if (filter === "missed") return c.status === "missed";
    if (filter === "outgoing") return c.caller_id === uid;
    if (filter === "incoming") return c.callee_id === uid;
    return true;
  });

  const filteredContacts = contacts.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (c.displayName || "").toLowerCase().includes(q) ||
      (c.peer_phone_code || "").includes(q)
    );
  });

  if (loading && logs.length === 0 && contacts.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator color={theme.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: theme.card, borderBottomColor: theme.border },
        ]}
      >
        <View style={styles.headerRow}>
          <Image
            source={
              profile?.avatar_url
                ? { uri: profile.avatar_url }
                : require("../../assets/icon.png")
            }
            style={[styles.avatar, { backgroundColor: theme.softPurple }]}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.brand}>
              <Text style={{ color: theme.primaryDark }}>Mind</Text>
              <Text style={{ color: theme.primary }}>Mate</Text>
            </Text>
            <Text style={{ color: theme.textMuted, fontSize: 12 }}>
              {s.safeSecure}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/calls/save-contact")}
            activeOpacity={0.85}
            style={[styles.addBtn, { backgroundColor: theme.primary }]}
          >
            <Text style={styles.addBtnText}>+ {s.addContact}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.mainTabs}>
          <MainChip
            active={main === "calls"}
            label={`📞  ${s.callList}`}
            onPress={() => setMain("calls")}
            theme={theme}
          />
          <MainChip
            active={main === "contacts"}
            label={`👥  ${s.contactList}`}
            onPress={() => setMain("contacts")}
            theme={theme}
          />
        </View>

        {main === "calls" && (
          <View style={styles.filterRow}>
            {(
              [
                ["all", s.all],
                ["missed", s.missed],
                ["outgoing", s.outgoing],
                ["incoming", s.incoming],
              ] as const
            ).map(([k, label]) => (
              <FilterChip
                key={k}
                active={filter === k}
                label={label}
                onPress={() => setFilter(k)}
                theme={theme}
              />
            ))}
          </View>
        )}

        {main === "contacts" && (
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={s.searchContact}
            placeholderTextColor={theme.textMuted}
            style={[
              styles.search,
              {
                backgroundColor: theme.inputBg,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
          />
        )}
      </View>
                {main === "calls" ? (
        <FlatList
          data={filteredLogs}
          keyExtractor={(i) => i.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              colors={[theme.primary]}
            />
          }
          contentContainerStyle={{ padding: 14, paddingBottom: 48 }}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: theme.textMuted }]}>
              {s.emptyCalls}
            </Text>
          }
          renderItem={({ item }) => {
            const isOut = item.caller_id === uid;
            const otherId = isOut ? item.callee_id : item.caller_id;
            const statusLabel =
              item.status === "missed"
                ? s.missed
                : isOut
                ? s.outgoing
                : s.incoming;
            const statusColor =
              item.status === "missed"
                ? theme.danger
                : isOut
                ? theme.success
                : theme.primaryDark;

            return (
              <View
                style={[
                  styles.card,
                  { backgroundColor: theme.card, borderColor: theme.border },
                ]}
              >
                <TouchableOpacity
                  style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
                  onPress={() =>
                    startCall(
                      otherId,
                      item.peerPhone,
                      item.peerName || s.unknownCaller,
                      "audio"
                    )
                  }
                  activeOpacity={0.75}
                >
                  {item.peerAvatar ? (
                    <Image
                      source={{ uri: item.peerAvatar }}
                      style={styles.rowAvatar}
                    />
                  ) : (
                    <View
                      style={[
                        styles.rowAvatar,
                        {
                          backgroundColor: theme.softPurple,
                          alignItems: "center",
                          justifyContent: "center",
                        },
                      ]}
                    >
                      <Text
                        style={{
                          fontWeight: "800",
                          color: theme.primary,
                          fontSize: 18,
                        }}
                      >
                        {(item.peerName || "?").charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowName, { color: theme.text }]}>
                      {item.peerName}
                    </Text>
                    <Text style={{ color: statusColor, fontSize: 12, marginTop: 2 }}>
                      {statusLabel}
                      {item.peerPhone ? ` · ${item.peerPhone}` : ""}
                    </Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.callActions}>
                  <TouchableOpacity
                    onPress={() =>
                      startCall(
                        otherId,
                        item.peerPhone,
                        item.peerName || s.unknownCaller,
                        "audio"
                      )
                    }
                    style={[styles.roundBtn, { backgroundColor: theme.success }]}
                  >
                    <Text style={{ fontSize: 16 }}>📞</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() =>
                      startCall(
                        otherId,
                        item.peerPhone,
                        item.peerName || s.unknownCaller,
                        "video"
                      )
                    }
                    style={[styles.roundBtn, { backgroundColor: theme.primary }]}
                  >
                    <Text style={{ fontSize: 16 }}>📹</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      ) : (
        <FlatList
          data={filteredContacts}
          keyExtractor={(i) => i.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              colors={[theme.primary]}
            />
          }
          contentContainerStyle={{ padding: 14, paddingBottom: 48 }}
          ListHeaderComponent={
            <Text style={{ color: theme.textMuted, marginBottom: 10, marginLeft: 4 }}>
              {s.totalContacts}: {contacts.length}
            </Text>
          }
          ListEmptyComponent={
            <Text style={[styles.empty, { color: theme.textMuted }]}>
              {s.emptyContacts}
            </Text>
          }
          renderItem={({ item }) => (
            <View
              style={[
                styles.card,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              {item.displayAvatar ? (
                <Image
                  source={{ uri: item.displayAvatar }}
                  style={styles.rowAvatar}
                />
              ) : (
                <View
                  style={[
                    styles.rowAvatar,
                    {
                      backgroundColor: theme.softPurple,
                      alignItems: "center",
                      justifyContent: "center",
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontWeight: "800",
                      color: theme.primary,
                      fontSize: 18,
                    }}
                  >
                    {(item.displayName || "?").charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowName, { color: theme.text }]}>
                  {item.displayName}
                </Text>
                <Text style={{ color: theme.textMuted, fontSize: 13 }}>
                  {item.peer_phone_code}
                </Text>
              </View>
              <View style={styles.callActions}>
                <TouchableOpacity
                  onPress={() =>
                    startCall(
                      item.peer_id || item.peer?.id,
                      item.peer_phone_code,
                      item.displayName,
                      "audio"
                    )
                  }
                  style={[styles.roundBtn, { backgroundColor: theme.success }]}
                >
                  <Text style={{ fontSize: 16 }}>📞</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() =>
                    startCall(
                      item.peer_id || item.peer?.id,
                      item.peer_phone_code,
                      item.displayName,
                      "video"
                    )
                  }
                  style={[styles.roundBtn, { backgroundColor: theme.primary }]}
                >
                  <Text style={{ fontSize: 16 }}>📹</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

function MainChip({ active, label, onPress, theme }: any) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        flex: 1,
        backgroundColor: active ? theme.primary : theme.inputBg,
        borderRadius: 22,
        paddingVertical: 11,
        alignItems: "center",
        borderWidth: 1,
        borderColor: active ? theme.primary : theme.border,
      }}
    >
      <Text
        style={{
          color: active ? "#fff" : theme.text,
          fontWeight: "700",
          fontSize: 13,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function FilterChip({ active, label, onPress, theme }: any) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: active ? theme.primary : theme.inputBg,
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderWidth: 1,
        borderColor: active ? theme.primary : theme.border,
      }}
    >
      <Text
        style={{
          color: active ? "#fff" : theme.text,
          fontWeight: "600",
          fontSize: 12,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerRow: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 46, height: 46, borderRadius: 23, marginRight: 12 },
  brand: { fontSize: 20, fontWeight: "800" },
  addBtn: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 11 },
  mainTabs: { flexDirection: "row", marginTop: 14, gap: 10 },
  filterRow: {
    flexDirection: "row",
    marginTop: 12,
    gap: 8,
    flexWrap: "wrap",
  },
  search: {
    marginTop: 12,
    borderRadius: 22,
    paddingHorizontal: 16,
    height: 44,
    borderWidth: 1,
    fontSize: 14,
  },
  card: {
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
  },
  rowAvatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  rowName: { fontWeight: "700", fontSize: 15 },
  callActions: { flexDirection: "row", gap: 8, marginLeft: 8 },
  roundBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: { textAlign: "center", marginTop: 48, fontSize: 15 },
});
