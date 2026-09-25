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
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../stores/authStore";
import { Message, Session } from "../../lib/types";
import { COLORS } from "../../lib/constants";

export default function ConversationScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { session: authSession, profile } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const flatListRef = useRef<FlatList>(null);

  async function fetchData() {
    if (!sessionId) return;

    const [sessionRes, messagesRes] = await Promise.all([
      supabase.from("sessions").select("*").eq("id", sessionId).single(),
      supabase
        .from("messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true }),
    ]);

    if (sessionRes.data) setCurrentSession(sessionRes.data);
    if (messagesRes.data) setMessages(messagesRes.data);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();

    // Realtime messages
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

  async function handleSend() {
    if (!text.trim() || !authSession?.user || !sessionId) return;

    const content = text.trim();
    setText("");
    setSending(true);

    // এখানে পরে coin charge করা হবে (transfer_coins function দিয়ে)
    const { error } = await supabase.from("messages").insert({
      session_id: sessionId,
      sender_id: authSession.user.id,
      content,
      coin_charged: 2, // temporary, পরে settings থেকে নেব
    });

    setSending(false);

    if (error) {
      Alert.alert("Error", error.message);
      setText(content); // restore text
    }
  }

  async function handleEndConversation() {
    Alert.alert("Conversation শেষ করবে?", "এটা শেষ হয়ে গেলে আর চালিয়ে যাওয়া যাবে না।", [
      { text: "Cancel", style: "cancel" },
      {
        text: "End",
        style: "destructive",
        onPress: async () => {
          await supabase.rpc("end_conversation", { p_session_id: sessionId });
          router.replace("/(tabs)");
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.background }}>
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
      {/* Header */}
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
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ fontSize: 24, color: COLORS.primary }}>‹</Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 17, fontWeight: "600", color: COLORS.text }}>
          Conversation
        </Text>

        <TouchableOpacity onPress={handleEndConversation}>
          <Text style={{ color: COLORS.danger, fontWeight: "600" }}>End</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
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
              <Text style={{ color: isMe ? "#fff" : COLORS.text, fontSize: 15 }}>
                {item.content}
              </Text>
            </View>
          );
        }}
      />

      {/* Input */}
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
          placeholder="মেসেজ লিখো..."
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
    </KeyboardAvoidingView>
  );
}
