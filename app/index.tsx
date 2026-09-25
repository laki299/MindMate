import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { useAuthStore } from "../stores/authStore";
import { COLORS } from "../lib/constants";

export default function Index() {
  const { session, profile, loading } = useAuthStore();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  // Role based redirect
  if (profile?.role === "host") {
    return <Redirect href="/host" />;
  }

  if (profile?.role === "admin") {
    return <Redirect href="/(tabs)" />; // পরে admin panel বানাব
  }

  return <Redirect href="/(tabs)" />;
}
