import { Stack } from "expo-router";

export default function CallsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="log" />
      <Stack.Screen name="dialer" />
      <Stack.Screen name="contacts" />
      <Stack.Screen name="save-contact" />
      <Stack.Screen name="my-number" />
      <Stack.Screen name="active" />
      <Stack.Screen name="incoming" />
    </Stack>
  );
}
