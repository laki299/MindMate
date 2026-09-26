import { Stack } from "expo-router";

export default function AdminLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="stats" />
      <Stack.Screen name="ad-settings" />
      <Stack.Screen name="reports" />
      <Stack.Screen name="hosts" />
    </Stack>
  );
}
