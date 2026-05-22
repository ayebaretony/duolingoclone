import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/theme";

type TabHref = "/home" | "/learn" | "/ai-teacher" | "/chat" | "/profile";

type TabItem = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  href: TabHref;
};

const TABS: TabItem[] = [
  { key: "home", label: "Home", icon: "home-outline", activeIcon: "home", href: "/home" },
  { key: "learn", label: "Learn", icon: "book-outline", activeIcon: "book", href: "/learn" },
  { key: "ai-teacher", label: "AI Teacher", icon: "sparkles-outline", activeIcon: "sparkles", href: "/ai-teacher" },
  { key: "chat", label: "Chat", icon: "chatbubble-ellipses-outline", activeIcon: "chatbubble-ellipses", href: "/chat" },
  { key: "profile", label: "Profile", icon: "person-outline", activeIcon: "person", href: "/profile" },
];

const CIRCLE_SIZE = 48;
const ICON_SIZE = 22;
// Vertical distance from the top of the wrapper to where the icon area starts.
// Both the circle (position: absolute) and each tabItem (paddingTop) use this
// value so the circle stays perfectly centered on every icon regardless of
// whether the tab has a label or not.
const ICON_TOP = 12;

export function BottomTabBar() {
  const router = useRouter();
  const pathname = usePathname() ?? "/home";
  const insets = useSafeAreaInsets();

  const normalizedPath = pathname.startsWith("/lesson/") ? "/learn" : pathname.replace(/\?.*$/, "");
  const activeIndex = Math.max(
    0,
    TABS.findIndex((tab) => tab.href === normalizedPath)
  );

  const [containerWidth, setContainerWidth] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!containerWidth) return;
    const itemWidth = containerWidth / TABS.length;
    Animated.timing(translateX, {
      toValue: activeIndex * itemWidth,
      duration: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [activeIndex, containerWidth, translateX]);

  const handleLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  const itemWidth = containerWidth / TABS.length;
  // Horizontal offset to centre the circle within one tab column
  const circleLeft = itemWidth ? (itemWidth - CIRCLE_SIZE) / 2 : 0;

  return (
    <View
      style={[styles.wrapper, { paddingBottom: insets.bottom }]}
      onLayout={handleLayout}
    >
      {containerWidth > 0 && (
        <Animated.View
          style={[
            styles.activeCircle,
            { left: circleLeft, transform: [{ translateX }] },
          ]}
        />
      )}

      <View style={styles.tabList}>
        {TABS.map((tab, index) => {
          const isActive = index === activeIndex;
          return (
            <View key={tab.key} style={styles.tabItem}>
              <Pressable
                onPress={() => router.push(tab.href)}
                style={styles.tabButton}
              >
                <View style={styles.iconWrap}>
                  <Ionicons
                    name={isActive ? tab.activeIcon : tab.icon}
                    size={ICON_SIZE}
                    color={
                      isActive
                        ? colors.neutral.background
                        : colors.neutral.textSecondary
                    }
                  />
                </View>
                {!isActive && <Text style={styles.label}>{tab.label}</Text>}
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.neutral.background,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
    shadowColor: "#0d132b",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 12,
  },
  tabList: {
    flexDirection: "row",
    // flex-start keeps all items top-aligned so every icon sits at the same
    // Y position (ICON_TOP) whether or not the tab has a label.
    alignItems: "flex-start",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingTop: ICON_TOP,
    paddingBottom: 8,
  },
  tabButton: {
    alignItems: "center",
    width: "100%",
    gap: 4,
  },
  iconWrap: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  activeCircle: {
    position: "absolute",
    top: ICON_TOP,
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: colors.brand.purple,
    shadowColor: colors.brand.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  label: {
    fontSize: 11,
    fontFamily: "Poppins-Medium",
    color: colors.neutral.textSecondary,
    textAlign: "center",
  },
});
