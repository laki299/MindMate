import "react-native-gesture-handler";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { Alert } from "react-native";
import { useAuthStore } from "../stores/authStore";
import { useSettingsStore } from "../stores/settingsStore";
import { supabase } from "../lib/supabase";
import { subscribeIncomingCalls } from "../lib/incomingCall";

export default function RootLayout() {
  const { session, setSession, setProfile, setLoading } = useAuthStore();
  const { hydrate, darkMode } = useSettingsStore();
  const channelRef = useRef<ReturnType<typeof subscribeIncomingCalls> | null>(
    null
  );

  useEffect(() => {
    hydrate().catch(() => {});
  }, []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        const s = data.session;
        setSession(s);
        if (s?.user) {
          await fetchProfile(s.user.id);
        } else {
          setLoading(false);
        }
      } catch (e) {
        console.warn("auth init", e);
        setLoading(false);
      }
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s);
      if (s?.user) {
        await fetchProfile(s.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const uid = session?.user?.id;
    if (!uid) {
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

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
    } catch (e) {
      console.warn("incoming sub", e);
    }

    return () => {
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [session?.user?.id]);

  async function fetchProfile(userId: string) {
    try {
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
          Alert.alert("Banned", "Account banned");
          return;
        }

        let updatedProfile = { ...data };
        try {
          if (!data.phone_code) {
            const { data: code } = await supabase.rpc("ensure_my_phone_code");
            if (code) {
              updatedProfile.phone_code = code as string;
            }
          }
        } catch {
          /* optional */
        }

        setProfile(updatedProfile);
      }
    } catch (e) {
      console.warn("profile", e);
    }
    setLoading(false);
  }

  // Stack সবসময় রেন্ডার — loading শুধু app/index.tsx এ
  return (
    <>
      <StatusBar style={darkMode ? "light" : "dark"} />
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
