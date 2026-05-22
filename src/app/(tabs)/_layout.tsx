import { Tabs } from "expo-router";
import { BottomTabBar } from "@/components/bottom-tab-bar";

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={() => <BottomTabBar />}
      screenOptions={{ headerShown: false }}
    />
  );
}
