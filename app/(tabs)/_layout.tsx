import { Tabs } from "expo-router";
import { Text, View } from "react-native";
import { useSettingsStore } from "../../stores/settingsStore";
import { t } from "../../lib/i18n";

export default function TabsLayout() {
  const { lang, theme } = useSettingsStore();
  const s = t(lang);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
          elevation: 12,
          shadowColor: "#000",
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: s.home,
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                backgroundColor: focused ? theme.softPurple : "transparent",
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 12,
              }}
            >
              <Text style={{ fontSize: 22, color }}>🏠</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: s.profile,
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                backgroundColor: focused ? theme.softPurple : "transparent",
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 12,
              }}
            >
              <Text style={{ fontSize: 22, color }}>👤</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen name="calls" options={{ href: null }} />
      <Tabs.Screen name="wallet" options={{ href: null }} />
      <Tabs.Screen name="conversations" options={{ href: null }} />
    </Tabs>
  );
}
