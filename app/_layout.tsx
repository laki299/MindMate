import "react-native-gesture-handler";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { Alert } from "react-native";
import { useAuthStore } from "../stores/authStore";
import { supabase } from "../lib/supabase";
import { subscribeIncomingCalls } from "../lib/incomingCall";

export default function RootLayout() {
  const { session, setSession, setProfile, setLoading } = useAuthStore();
  const channelRef = useRef<ReturnType<typeof subscribeIncomingCalls> | null>(
    null
  );

  useEffect(() => {
    let alive = true;

    supabase.auth
      .getSession()
      .then(({ data: { session: s } }) => {
        if (!alive) return;
        setSession(s);
        if (s?.user) {
          void loadProfile(s.user.id);
        } else {
          setLoading(false);
        }
      })
      .catch(() => {
        setLoading(false);
      });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s?.user) {
        void loadProfile(s.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const uid = session?.user?.id;
    if (!uid) return;

    try {
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
    } catch {
      /* ignore */
    }

    return () => {
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [session?.user?.id]);

  async function loadProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (!error && data) {
        if (data.is_banned) {
          await supabase.auth.signOut();
          setSession(null);
          setProfile(null);
          Alert.alert("Banned", "Account banned");
        } else {
          setProfile(data);
        }
      }
    } catch {
      /* ignore */
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
        <Stack.Screen name="calls" />
        <Stack.Screen name="profile/edit" />
      </Stack>
    </>
  );
}
