import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { Alert } from "react-native";
import { useAuthStore } from "../stores/authStore";
import { supabase } from "../lib/supabase";
import { checkNetworkAndCountry } from "../lib/security";
import { subscribeIncomingCalls } from "../lib/incomingCall";

export default function RootLayout() {
  const { session, setSession, setProfile, setLoading } = useAuthStore();
  const channelRef = useRef<ReturnType<typeof subscribeIncomingCalls> | null>(null);

  // Auth Initialization & Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Global Incoming Call Listener
  useEffect(() => {
    const uid = session?.user?.id;
    if (!uid) {
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    channelRef.current = subscribeIncomingCalls(uid, {
      onIncoming: (p) => {
        router.push({
          pathname: "/calls/incoming",
          params: {
            fromId: p.fromId,
            fromName: p.fromName,
            callType: p.callType,
            callId: p.callId,
          },
        });
      },
    });

    return () => {
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [session?.user?.id]);

  async function fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (!error && data) {
      if (data.is_banned) {
        await supabase.auth.signOut();
        setSession(null);
        setProfile(null);
        setLoading(false);
        Alert.alert("ব্যান", "তোমার অ্যাকাউন্ট ব্যান করা হয়েছে।");
        return;
      }

      setProfile(data);

      try {
        const net = await checkNetworkAndCountry(userId);
        if (net.vpnSuspected) {
          Alert.alert(
            "VPN সনাক্ত",
            "অ্যাপ ব্যবহার করতে VPN বন্ধ করুন। তারপর আবার চেষ্টা করুন।"
          );
        }
        await supabase.rpc("refresh_expat_flag", { p_user_id: userId });
      } catch {
        // ignore
      }
    }

    setLoading(false);
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="host" />
        <Stack.Screen name="cabin/[hostId]" />
        <Stack.Screen name="conversation/[sessionId]" />
        <Stack.Screen name="earn" />
        <Stack.Screen name="admin" />
        <Stack.Screen name="calls" />
      </Stack>
    </>
  );
}
