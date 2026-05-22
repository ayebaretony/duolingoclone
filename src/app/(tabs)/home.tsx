import { useEffect } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "@clerk/expo";

import { getLanguageById } from "@/data/languages";
import { getUnitsByLanguage } from "@/data/units";
import { images } from "@/constants/images";
import { useLanguageStore } from "@/store/languageStore";
import { useProgressStore } from "@/store/progressStore";
import { colors } from "@/theme";
import type { LanguageId } from "@/types/learning";

const LANGUAGE_GREETINGS: Record<LanguageId, string> = {
  spanish: "Hola",
  french: "Bonjour",
  japanese: "こんにちは",
  korean: "안녕",
  german: "Hallo",
  chinese: "你好",
};

const LEVEL_LABELS: Record<string, string> = {
  starter: "A1",
  beginner: "A2",
};

type PlanItem = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  title: string;
  subtitle: string;
  completed: boolean;
};

const TODAY_PLAN: PlanItem[] = [
  {
    id: "1",
    icon: "book-outline",
    iconBg: colors.brand.purple,
    title: "Lesson",
    subtitle: "At the café",
    completed: true,
  },
  {
    id: "2",
    icon: "headset-outline",
    iconBg: colors.brand.blue,
    title: "AI Conversation",
    subtitle: "Talk about your day",
    completed: false,
  },
  {
    id: "3",
    icon: "sparkles-outline",
    iconBg: "#FF6B84",
    title: "New words",
    subtitle: "10 words",
    completed: false,
  },
];

export default function HomeScreen() {
  const { user } = useUser();
  const { selectedLanguageId } = useLanguageStore();
  const { currentDailyXP, dailyGoalXP, streakCount, hydrate } = useProgressStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const firstName = user?.firstName ?? "Learner";
  const language = selectedLanguageId ? getLanguageById(selectedLanguageId) : null;
  const units = selectedLanguageId ? getUnitsByLanguage(selectedLanguageId) : [];
  const currentUnit = units[0];

  const greeting = selectedLanguageId ? LANGUAGE_GREETINGS[selectedLanguageId] : "Hello";
  const unitLevel = currentUnit ? (LEVEL_LABELS[currentUnit.level] ?? "A1") : "A1";
  const unitNumber = currentUnit?.order ?? 1;
  const xpProgress = Math.min(currentDailyXP / dailyGoalXP, 1);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Header ── */}
        <View className="flex-row items-center justify-between px-5 pt-2 pb-4">
          <View className="flex-row items-center gap-2">
            <Text className="text-[26px]">{language?.flagEmoji ?? "🌐"}</Text>
            <Text className="font-poppins-semibold text-base text-text-primary">
              {greeting}, {firstName}! 👋
            </Text>
          </View>
          <View className="flex-row items-center gap-4">
            <View className="flex-row items-center gap-1">
              <Image source={images.streakFire} style={styles.fireIcon} />
              <Text className="font-poppins-semibold text-[15px] text-text-primary">
                {streakCount}
              </Text>
            </View>
            <Pressable hitSlop={8}>
              <Ionicons
                name="notifications-outline"
                size={24}
                color={colors.neutral.textPrimary}
              />
            </Pressable>
          </View>
        </View>

        {/* ── Daily Goal Card ── */}
        <View
          style={styles.cardShadow}
          className="flex-row items-center bg-[#FFF8EC] rounded-[20px] border border-[#FDEAC8] mx-5 mb-3.5 pl-5 py-5 overflow-hidden"
        >
          <View className="flex-1 gap-1.5">
            <Text className="font-poppins-medium text-[13px] text-text-secondary">
              Daily goal
            </Text>
            <View className="flex-row items-baseline">
              <Text className="font-poppins-bold text-[30px] text-text-primary leading-9">
                {currentDailyXP}
              </Text>
              <Text className="font-poppins-medium text-[15px] text-text-secondary">
                {" / "}{dailyGoalXP} XP
              </Text>
            </View>
            <View className="h-2 rounded-full bg-[#FDDBA8] overflow-hidden w-4/5">
              <View
                className="h-full rounded-full bg-[#FF8A00]"
                style={{ width: `${xpProgress * 100}%` as `${number}%` }}
              />
            </View>
          </View>
          <Image source={images.treasure} style={styles.treasureImage} />
        </View>

        {/* ── Continue Learning Card ── */}
        <View
          style={styles.cardShadow}
          className="flex-row items-stretch bg-[#3E2197] rounded-[20px] border border-[#3E2197] mx-5 mb-5 overflow-hidden h-[168px]"
        >
          <View className="flex-1 pl-5 py-5 justify-center gap-1">
            <Text className="font-poppins text-xs text-white/65">Continue learning</Text>
            <Text className="font-poppins-bold text-[26px] text-white leading-8">
              {language?.name ?? "Spanish"}
            </Text>
            <Text className="font-poppins text-[13px] text-white/70 mb-1">
              {unitLevel} · Unit {unitNumber}
            </Text>
            <Pressable style={styles.continueButton}>
              <Text className="font-poppins-semibold text-sm text-[#3E2197]">Continue</Text>
            </Pressable>
          </View>
          <View style={styles.palaceContainer}>
            <Image source={images.palace} style={styles.palaceImage} resizeMode="cover" />
          </View>
        </View>

        {/* ── Today's Plan ── */}
        <View className="mb-4">
          <View className="flex-row items-center justify-between px-5 mb-3">
            <Text className="font-poppins-semibold text-lg text-text-primary">
              {"Today's plan"}
            </Text>
            <Pressable hitSlop={8}>
              <Text className="font-poppins-medium text-sm text-lingua-purple">View all</Text>
            </Pressable>
          </View>

          <View
            style={styles.cardShadow}
            className="bg-white rounded-[20px] border border-border mx-5 overflow-hidden"
          >
            {TODAY_PLAN.map((item, index) => (
              <View
                key={item.id}
                className="flex-row items-center px-4 py-3.5 gap-3.5"
                style={index < TODAY_PLAN.length - 1 ? styles.planItemBorder : undefined}
              >
                <View
                  style={{ backgroundColor: item.iconBg }}
                  className="w-11 h-11 rounded-xl items-center justify-center"
                >
                  <Ionicons name={item.icon} size={18} color="#fff" />
                </View>
                <View className="flex-1 gap-0.5">
                  <Text className="font-poppins-semibold text-sm text-text-primary">
                    {item.title}
                  </Text>
                  <Text className="font-poppins text-xs text-text-secondary">
                    {item.subtitle}
                  </Text>
                </View>
                {item.completed ? (
                  <View className="w-[26px] h-[26px] rounded-full bg-lingua-blue items-center justify-center">
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  </View>
                ) : (
                  <View className="w-[26px] h-[26px] rounded-full border-2 border-border" />
                )}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // SafeAreaView — no className support
  safeArea: {
    flex: 1,
    backgroundColor: colors.neutral.background,
  },
  // ScrollView contentContainerStyle — special prop, not className
  scrollContent: {
    paddingBottom: 32,
  },
  // Shadows — platform-specific, must stay in StyleSheet
  cardShadow: {
    shadowColor: "#0D132B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
  },
  // Image — resizeMode and fixed dimensions
  fireIcon: {
    width: 22,
    height: 22,
    resizeMode: "contain",
  },
  treasureImage: {
    width: 96,
    height: 96,
    resizeMode: "contain",
  },
  // Conditional border — dynamic style prop, can't use template-literal className
  planItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
  },
  // Pressable.style — per project exception rule
  continueButton: {
    backgroundColor: "#fff",
    borderRadius: 99,
    paddingHorizontal: 20,
    paddingVertical: 8,
    alignSelf: "flex-start",
  },
  // Image with fixed dimensions
  palaceContainer: {
    width: 148,
    height: 168,
  },
  palaceImage: {
    width: 148,
    height: 168,
  },
});
