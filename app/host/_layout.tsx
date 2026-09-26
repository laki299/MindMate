import { Stack } from "expo-router";

export default function HostLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="queue" />
      <Stack.Screen name="earnings" />
      <Stack.Screen name="services" />
      <Stack.Screen name="gifts" />
    </Stack>
  );
}
