import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Alert } from "react-native";
import { useAuthStore } from "../stores/authStore";
import { supabase } from "../lib/supabase";
import { checkNetworkAndCountry } from "../lib/security";

export default function RootLayout() {
  const { setSession, setProfile, setLoading } = useAuthStore();

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
      } catch {
        // ignore network errors
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
      </Stack>
    </>
  );
}
