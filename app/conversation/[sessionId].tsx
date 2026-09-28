import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../stores/authStore";
import { Message, Session, AppSettings } from "../../lib/types";
import { COLORS, COIN_RATES } from "../../lib/constants";
import { CallService } from "../../services/callService";
import { startCallBilling } from "../../services/callBilling";
import {
  fetchScreenshotBlockEnabled,
  useSecureScreen,
} from "../../lib/screenSecurity";

export default function ConversationScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { session: authSession, profile, setProfile } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  // Screen Security
  const [secure, setSecure] = useState<boolean | null>(null);
  useEffect(() => {
    fetchScreenshotBlockEnabled().then(setSecure);
  }, []);
  useSecureScreen(secure);

  // Host Rates & Media settings
  const [hostMedia, setHostMedia] = useState<{
    text_rate: number;
    call_rate: number;
    video_rate: number;
    video_enabled: boolean;
    call_enabled: boolean;
  } | null>(null);

  const [giftVisible, setGiftVisible] = useState(false);
  const [giftAmount, setGiftAmount] = useState("");
  const [reportVisible, setReportVisible] = useState(false);
  const [reportText, setReportText] = useState("");

  // Voice & Video Call States
  const [inCall, setInCall] = useState(false);
  const [muted, setMuted] = useState(false);
  const callRef = useRef<CallService | null>(null);
  const stopBillingRef = useRef<(() => void) | null>(null);

  const flatListRef = useRef<FlatList>(null);

  const isMonetizationOn = settings?.monetization_enabled ?? true;
  const textCost = isMonetizationOn
    ? hostMedia?.text_rate ?? settings?.text_coin_cost ?? COIN_RATES.TEXT
    : 0;

  const callRate = isMonetizationOn
    ? hostMedia?.call_rate ?? settings?.call_coin_per_second ?? COIN_RATES.CALL_PER_SEC ?? 2
    : 0;

  const videoRate = isMonetizationOn
    ? hostMedia?.video_rate ?? 5
    : 0;

  const isHost =
    !!authSession?.user &&
    !!currentSession &&
    authSession.user.id === currentSession.host_id;

  const otherUserId = currentSession
    ? isHost
      ? currentSession.user_id
      : currentSession.host_id
    : null;

  async function fetchData() {
    if (!sessionId) return;

    const [sessionRes, messagesRes, settingsRes] = await Promise.all([
      supabase.from("sessions").select("*").eq("id", sessionId).single(),
      supabase
        .from("messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true }),
      supabase.from("app_settings").select("*").eq("id", 1).single(),
    ]);

    if (sessionRes.data) {
      setCurrentSession(sessionRes.data);
      const { data: hostData } = await supabase
        .from("hosts")
        .select("text_rate, call_rate, video_rate, video_enabled, call_enabled")
        .eq("id", sessionRes.data.host_id)
        .single();

      if (hostData) {
        setHostMedia({
          text_rate: hostData.text_rate ?? 5,
          call_rate: hostData.call_rate ?? 2,
          video_rate: hostData.video_rate ?? 5,
          video_enabled: hostData.video_enabled ?? true,
          call_enabled: hostData.call_enabled ?? true,
        });
      }
    }

    if (messagesRes.data) setMessages(messagesRes.data);
    if (settingsRes.data) setSettings(settingsRes.data);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel(`conversation-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  useEffect(() => {
    return () => {
      stopBillingRef.current?.();
      callRef.current?.end("unmount");
    };
  }, []);

  async function startCall() {
    if (!authSession?.user || !currentSession) return;
    if (!hostMedia && isMonetizationOn) {
      Alert.alert("অপেক্ষা", "রেট লোড হচ্ছে");
      return;
    }

    if (hostMedia && hostMedia.call_enabled === false) {
      Alert.alert("অনুপলব্ধ", "হোস্ট এই মুহূর্তে ভয়েস কল সুবিধা বন্ধ রেখেছেন");
      return;
    }

    const isCaller = authSession.user.id === currentSession.user_id;

    const svc = new CallService(
      sessionId!,
      authSession.user.id,
      isCaller,
      {
        onEnded: () => {
          stopBillingRef.current?.();
          stopBillingRef.current = null;
          setInCall(false);
          callRef.current = null;
        },
        onError: (e) => Alert.alert("কল এরর", e.message),
      }
    );

    callRef.current = svc;
    setInCall(true);
    await svc.start();

    if (authSession.user.id === currentSession.user_id) {
      stopBillingRef.current = startCallBilling({
        userId: authSession.user.id,
        hostId: currentSession.host_id,
        sessionId: sessionId!,
        ratePerSecond: callRate,
        monetizationOn: isMonetizationOn,
        getBalance: () => profile?.coin_balance ?? 0,
        onBalanceUpdate: (next) => {
          if (profile) setProfile({ ...profile, coin_balance: next });
        },
        onBroke: () => {
          Alert.alert("কয়েন শেষ", "কল শেষ করা হচ্ছে");
          callRef.current?.end("no_coins");
        },
      });
    }
  }

  async function endCall() {
    stopBillingRef.current?.();
    stopBillingRef.current = null;
    await callRef.current?.end("hangup");
    setInCall(false);
  }

  async function handleSend() {
    if (!text.trim() || !authSession?.user || !sessionId || !currentSession)
      return;

    const content = text.trim();

    if (isMonetizationOn && textCost > 0) {
      if ((profile?.coin_balance ?? 0) < textCost) {
        Alert.alert(
          "কম Coin",
          `মেসেজ পাঠাতে ${textCost} Coin লাগবে। আগে Coin সংগ্রহ করো।`
        );
        return;
      }
    }

    setText("");
    setSending(true);

    try {
      const { error: msgError } = await supabase.from("messages").insert({
        session_id: sessionId,
        sender_id: authSession.user.id,
        content,
        coin_charged: textCost,
      });

      if (msgError) throw msgError;

      if (
        isMonetizationOn &&
        textCost > 0 &&
        authSession.user.id === currentSession.user_id
      ) {
        await supabase.rpc("transfer_coins", {
          p_from_user_id: authSession.user.id,
          p_to_host_id: currentSession.host_id,
          p_amount: textCost,
          p_type: "text",
          p_service_type: "text",
          p_session_id: sessionId,
          p_description: "Text message",
        });

        if (profile) {
          setProfile({
            ...profile,
            coin_balance: profile.coin_balance - textCost,
          });
        }
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "মেসেজ পাঠানো যায়নি");
      setText(content);
    }

    setSending(false);
  }

  async function handleGift() {
    if (!authSession?.user || !currentSession || !profile) return;

    const amount = parseInt(giftAmount, 10);
    if (!amount || amount <= 0) {
      Alert.alert("Error", "সঠিক পরিমাণ লিখো");
      return;
    }

    if (profile.coin_balance < amount) {
      Alert.alert("কম Coin", "তোমার ব্যালেন্সে পর্যাপ্ত Coin নেই");
      return;
    }

    try {
      await supabase.rpc("transfer_coins", {
        p_from_user_id: authSession.user.id,
        p_to_host_id: currentSession.host_id,
        p_amount: amount,
        p_type: "gift",
        p_session_id: sessionId,
        p_description: `Gift ${amount} coins`,
      });

      setProfile({
        ...profile,
        coin_balance: profile.coin_balance - amount,
      });

      setGiftVisible(false);
      setGiftAmount("");
      Alert.alert("সফল!", `${amount} Coin Host-কে গিফট করা হয়েছে`);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Gift করা যায়নি");
    }
  }

  async function handleBlock() {
    if (!authSession?.user || !otherUserId || !isHost) return;

    Alert.alert("ব্লক করবে?", "এই ইউজারকে ব্লক করলে আর কথা বলতে পারবে না।", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Block",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase.from("user_blocks").insert({
            host_id: authSession.user.id,
            user_id: otherUserId,
            reason: "Blocked by host in conversation",
          });

          if (error && error.code !== "23505") {
            Alert.alert("Error", error.message);
            return;
          }

          await supabase.rpc("end_conversation", { p_session_id: sessionId });
          Alert.alert("সফল", "ইউজার ব্লক করা হয়েছে");
          router.replace("/host");
        },
      },
    ]);
  }

  async function handleReport() {
    if (!authSession?.user || !otherUserId || !reportText.trim()) {
      Alert.alert("Error", "রিপোর্টের কারণ লিখো");
      return;
    }

    const { error } = await supabase.from("reports").insert({
      reporter_id: authSession.user.id,
      reported_user_id: otherUserId,
      reason: reportText.trim(),
    });

    if (error) {
      Alert.alert("Error", error.message);
      return;
    }

    setReportVisible(false);
    setReportText("");
    Alert.alert("সফল", "রিপোর্ট পাঠানো হয়েছে। Admin দেখবে।");
  }

  async function handleEndConversation() {
    Alert.alert(
      "Conversation শেষ করবে?",
      "এটা শেষ হয়ে গেলে আর চালিয়ে যাওয়া যাবে না।",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "End",
          style: "destructive",
          onPress: async () => {
            if (inCall) {
              await endCall();
            }
            await supabase.rpc("end_conversation", {
              p_session_id: sessionId,
            });
            router.replace(isHost ? "/host" : "/(tabs)");
          },
        },
      ]
    );
  }
      if (loading) {
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
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {/* Header Bar */}
      <View
        style={{
          paddingTop: 50,
          paddingHorizontal: 12,
          paddingBottom: 12,
          backgroundColor: COLORS.card,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ fontSize: 24, color: COLORS.primary }}>‹</Text>
        </TouchableOpacity>

        <View style={{ alignItems: "center", flex: 1 }}>
          <Text
            style={{ fontSize: 16, fontWeight: "600", color: COLORS.text }}
          >
            Conversation
          </Text>
          {!isMonetizationOn && (
            <Text style={{ fontSize: 11, color: COLORS.success }}>
              ফ্রি মোড
            </Text>
          )}
        </View>

        <View
          style={{
            flexDirection: "row",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
            justifyContent: "flex-end",
            maxWidth: 220,
          }}
        >
          {/* Voice Call Controls */}
          {!inCall ? (
            <TouchableOpacity onPress={startCall}>
              <Text style={{ color: COLORS.success, fontWeight: "600", fontSize: 13 }}>
                Call
              </Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                onPress={() => {
                  const next = !muted;
                  setMuted(next);
                  callRef.current?.mute(next);
                }}
              >
                <Text style={{ color: COLORS.text, fontWeight: "600", fontSize: 13 }}>
                  {muted ? "Unmute" : "Mute"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={endCall}>
                <Text style={{ color: COLORS.danger, fontWeight: "600", fontSize: 13 }}>
                  Hangup
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* Video Call Button */}
          {hostMedia && hostMedia.video_enabled !== false ? (
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  "ভিডিও কল",
                  `রেট: ${videoRate} coin/sec · WebRTC বিল্ডে পূর্ণ সুবিধা মিলবে`
                );
              }}
            >
              <Text style={{ color: COLORS.primary, fontWeight: "600", fontSize: 13 }}>
                Video
              </Text>
            </TouchableOpacity>
          ) : null}

          {!isHost && (
            <TouchableOpacity onPress={() => setGiftVisible(true)}>
              <Text style={{ color: COLORS.primary, fontWeight: "600", fontSize: 13 }}>
                Gift
              </Text>
            </TouchableOpacity>
          )}

          {isHost && (
            <>
              <TouchableOpacity onPress={handleBlock}>
                <Text style={{ color: COLORS.danger, fontWeight: "600", fontSize: 13 }}>
                  Block
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setReportVisible(true)}>
                <Text style={{ color: COLORS.warning, fontWeight: "600", fontSize: 13 }}>
                  Report
                </Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity onPress={handleEndConversation}>
            <Text style={{ color: COLORS.danger, fontWeight: "600", fontSize: 13 }}>
              End
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        renderItem={({ item }) => {
          const isMe = item.sender_id === authSession?.user.id;
          return (
            <View
              style={{
                alignSelf: isMe ? "flex-end" : "flex-start",
                backgroundColor: isMe ? COLORS.primary : COLORS.card,
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 16,
                marginBottom: 10,
                maxWidth: "80%",
                borderWidth: isMe ? 0 : 1,
                borderColor: COLORS.border,
              }}
            >
              <Text
                style={{ color: isMe ? "#fff" : COLORS.text, fontSize: 15 }}
              >
                {item.content}
              </Text>
            </View>
          );
        }}
      />

      {/* Input Footer Bar */}
      <View
        style={{
          flexDirection: "row",
          padding: 12,
          backgroundColor: COLORS.card,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          alignItems: "center",
        }}
      >
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={
            isMonetizationOn
              ? `মেসেজ লিখো (${textCost} Coin)`
              : "মেসেজ লিখো (ফ্রি)"
          }
          placeholderTextColor={COLORS.textSecondary}
          style={{
            flex: 1,
            backgroundColor: COLORS.background,
            borderRadius: 24,
            paddingHorizontal: 16,
            paddingVertical: 10,
            fontSize: 15,
            color: COLORS.text,
            marginRight: 10,
          }}
          multiline
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={sending || !text.trim()}
          style={{
            backgroundColor: COLORS.primary,
            width: 44,
            height: 44,
            borderRadius: 22,
            justifyContent: "center",
            alignItems: "center",
            opacity: sending || !text.trim() ? 0.5 : 1,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 18 }}>➤</Text>
        </TouchableOpacity>
      </View>

      {/* Gift Modal */}
      <Modal visible={giftVisible} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: COLORS.card,
              borderRadius: 20,
              padding: 24,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: COLORS.text,
                marginBottom: 8,
              }}
            >
              Host-কে Gift করো
            </Text>
            <Text style={{ color: COLORS.textSecondary, marginBottom: 16 }}>
              তোমার ব্যালেন্স: 🪙 {profile?.coin_balance ?? 0}
            </Text>
            <TextInput
              placeholder="কত Coin Gift করবে?"
              placeholderTextColor={COLORS.textSecondary}
              value={giftAmount}
              onChangeText={setGiftAmount}
              keyboardType="number-pad"
              style={{
                backgroundColor: COLORS.background,
                borderRadius: 12,
                padding: 14,
                fontSize: 16,
                borderWidth: 1,
                borderColor: COLORS.border,
                color: COLORS.text,
                marginBottom: 16,
              }}
            />
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={() => {
                  setGiftVisible(false);
                  setGiftAmount("");
                }}
                style={{
                  flex: 1,
                  backgroundColor: "#F1F5F9",
                  borderRadius: 12,
                  padding: 14,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontWeight: "600", color: COLORS.text }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleGift}
                style={{
                  flex: 1,
                  backgroundColor: COLORS.primary,
                  borderRadius: 12,
                  padding: 14,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontWeight: "600", color: "#fff" }}>
                  Gift করো
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Report Modal */}
      <Modal visible={reportVisible} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: COLORS.card,
              borderRadius: 20,
              padding: 24,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: COLORS.text,
                marginBottom: 8,
              }}
            >
              রিপোর্ট করো
            </Text>
            <Text style={{ color: COLORS.textSecondary, marginBottom: 12 }}>
              কয়েক লাইনে সমস্যা লিখো
            </Text>
            <TextInput
              placeholder="রিপোর্টের কারণ..."
              placeholderTextColor={COLORS.textSecondary}
              value={reportText}
              onChangeText={setReportText}
              multiline
              numberOfLines={4}
              style={{
                backgroundColor: COLORS.background,
                borderRadius: 12,
                padding: 14,
                fontSize: 15,
                borderWidth: 1,
                borderColor: COLORS.border,
                color: COLORS.text,
                marginBottom: 16,
                minHeight: 100,
                textAlignVertical: "top",
              }}
            />
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={() => {
                  setReportVisible(false);
                  setReportText("");
                }}
                style={{
                  flex: 1,
                  backgroundColor: "#F1F5F9",
                  borderRadius: 12,
                  padding: 14,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontWeight: "600", color: COLORS.text }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleReport}
                style={{
                  flex: 1,
                  backgroundColor: COLORS.danger,
                  borderRadius: 12,
                  padding: 14,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontWeight: "600", color: "#fff" }}>
                  পাঠাও
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
        }
          
