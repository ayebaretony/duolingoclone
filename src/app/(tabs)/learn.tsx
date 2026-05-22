import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { getLanguageById } from "@/data/languages";
import { getUnitsByLanguage } from "@/data/units";
import { getLessonsByUnit } from "@/data/lessons";
import { images } from "@/constants/images";
import { useLanguageStore } from "@/store/languageStore";
import { useProgressStore } from "@/store/progressStore";
import { colors } from "@/theme";
import type { Lesson } from "@/types/learning";

type LessonStatus = "completed" | "in-progress" | "available";

function getLessonStatus(
  lessonId: string,
  completedIds: string[],
  firstIncompleteId: string | null,
): LessonStatus {
  if (completedIds.includes(lessonId)) return "completed";
  if (lessonId === firstIncompleteId) return "in-progress";
  return "available";
}

type LessonRowProps = {
  lesson: Lesson;
  status: LessonStatus;
  themeColor: string;
  isLast: boolean;
};

function LessonRow({ lesson, status, themeColor, isLast }: LessonRowProps) {
  return (
    <Pressable
      style={[styles.lessonRow, !isLast && styles.lessonRowBorder]}
      onPress={() => router.push({ pathname: "/lesson/[id]", params: { id: lesson.id } })}
    >
      <View className="flex-1 gap-0.5 justify-center">
        <Text className="font-poppins text-[11px] text-text-secondary">
          Lesson {lesson.order}
        </Text>
        <Text
          className="font-poppins-semibold text-[14px] text-text-primary"
          numberOfLines={1}
        >
          {lesson.title}
        </Text>
        <Text className="font-poppins text-[11px] text-text-secondary">
          {lesson.xpReward} XP · {lesson.estimatedMinutes} min
        </Text>
      </View>

      {status === "completed" && (
        <View style={styles.completedBadge}>
          <Ionicons name="checkmark" size={16} color="#fff" />
        </View>
      )}

      {status === "in-progress" && (
        <View className="items-center gap-1">
          <Image
            source={{ uri: `https://picsum.photos/seed/${lesson.id}/72/52` }}
            style={styles.lessonThumb}
          />
          <View style={[styles.inProgressBadge, { backgroundColor: themeColor }]}>
            <Text style={styles.inProgressText}>In progress</Text>
          </View>
        </View>
      )}

      {status === "available" && (
        <View style={styles.availableBadge}>
          <Ionicons
            name="chevron-forward"
            size={14}
            color={colors.neutral.textSecondary}
          />
        </View>
      )}
    </Pressable>
  );
}

export default function LearnScreen() {
  const [activeTab, setActiveTab] = useState<"lessons" | "practice">("lessons");

  const { selectedLanguageId } = useLanguageStore();
  const { completedLessonIds, hydrate } = useProgressStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const language = selectedLanguageId ? getLanguageById(selectedLanguageId) : null;
  const units = selectedLanguageId ? getUnitsByLanguage(selectedLanguageId) : [];
  const currentUnit = units[0] ?? null;
  const lessons = currentUnit ? getLessonsByUnit(currentUnit.id) : [];

  const completedCount = lessons.filter((l) =>
    completedLessonIds.includes(l.id),
  ).length;
  const firstIncompleteId =
    lessons.find((l) => !completedLessonIds.includes(l.id))?.id ?? null;

  if (!language || !currentUnit) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View className="flex-1 items-center justify-center gap-4 px-8">
          <Ionicons
            name="earth-outline"
            size={56}
            color={colors.neutral.border}
          />
          <Text className="font-poppins-bold text-xl text-text-primary text-center">
            No language selected
          </Text>
          <Text className="font-poppins text-sm text-text-secondary text-center">
            Choose a language to see your lessons and start learning.
          </Text>
          <Pressable
            style={[styles.ctaButton, { backgroundColor: colors.brand.purple }]}
            onPress={() => router.push("/language-selection")}
          >
            <Text className="font-poppins-semibold text-sm text-white">
              Select a language
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const themeColor = language.themeColor;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── Header ── */}
      <View className="flex-row items-center px-4 py-2">
        <Pressable hitSlop={8} style={styles.iconBtn}>
          <Ionicons
            name="chevron-back"
            size={24}
            color={colors.neutral.textPrimary}
          />
        </Pressable>

        <View className="flex-1 items-center gap-0.5">
          <Text className="font-poppins-bold text-[15px] text-text-primary">
            {currentUnit.title}
          </Text>
          <Text className="font-poppins text-[11px] text-text-secondary">
            Unit {currentUnit.order} · {completedCount}/{lessons.length} lessons
          </Text>
        </View>

        <Pressable hitSlop={8} style={styles.iconBtn}>
          <Ionicons
            name="bookmark-outline"
            size={22}
            color={colors.neutral.textPrimary}
          />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── Unit illustration card ── */}
        <View style={[styles.unitCard, { backgroundColor: themeColor }]}>
          {/* Text */}
          <View className="flex-1 pl-5 py-5 justify-center gap-1.5">
            <Text
              className="font-poppins text-[11px]"
              style={{ color: "rgba(255,255,255,0.75)" }}
            >
              {language.name} · {language.flagEmoji}
            </Text>
            <Text className="font-poppins-bold text-[22px] text-white leading-7">
              {currentUnit.subtitle}
            </Text>
            <Text
              className="font-poppins text-[12px]"
              style={{ color: "rgba(255,255,255,0.8)" }}
              numberOfLines={2}
            >
              {currentUnit.description}
            </Text>
          </View>

          {/* Illustration (mascot + palace) */}
          <View style={styles.illustrationWrap}>
            <Image
              source={images.palace}
              style={styles.palaceBg}
              resizeMode="cover"
            />
            <Image
              source={images.mascotWelcome}
              style={styles.mascot}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* ── Tab switcher ── */}
        <View style={styles.tabBar}>
          {(["lessons", "practice"] as const).map((tab) => (
            <Pressable
              key={tab}
              style={[
                styles.tabItem,
                activeTab === tab && {
                  borderBottomWidth: 2,
                  borderBottomColor: themeColor,
                },
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === tab
                    ? { color: themeColor, fontFamily: "Poppins-SemiBold" }
                    : {},
                ]}
              >
                {tab === "lessons" ? "Lessons" : "Practice"}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ── Lesson list ── */}
        {activeTab === "lessons" ? (
          <View style={styles.lessonCard}>
            {lessons.map((lesson, index) => (
              <LessonRow
                key={lesson.id}
                lesson={lesson}
                status={getLessonStatus(
                  lesson.id,
                  completedLessonIds,
                  firstIncompleteId,
                )}
                themeColor={themeColor}
                isLast={index === lessons.length - 1}
              />
            ))}
          </View>
        ) : (
          <View className="items-center justify-center mt-16 gap-3 px-8">
            <Ionicons
              name="extension-puzzle-outline"
              size={52}
              color={colors.neutral.border}
            />
            <Text className="font-poppins-bold text-base text-text-primary">
              Practice coming soon
            </Text>
            <Text className="font-poppins text-sm text-text-secondary text-center">
              Vocabulary drills and practice exercises will appear here.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.neutral.background,
  },
  scroll: {
    paddingBottom: 40,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaButton: {
    borderRadius: 99,
    paddingHorizontal: 28,
    paddingVertical: 13,
  },
  // Unit card
  unitCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 24,
    flexDirection: "row",
    overflow: "hidden",
    height: 160,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 7,
  },
  illustrationWrap: {
    width: 148,
    height: 160,
  },
  palaceBg: {
    position: "absolute",
    width: 148,
    height: 160,
    opacity: 0.45,
  },
  mascot: {
    position: "absolute",
    bottom: 0,
    right: -4,
    width: 128,
    height: 148,
  },
  // Tab bar
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 11,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabLabel: {
    fontFamily: "Poppins-Regular",
    fontSize: 14,
    color: colors.neutral.textSecondary,
  },
  // Lesson list card
  lessonCard: {
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.neutral.border,
    shadowColor: "#0D132B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  lessonRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    minHeight: 72,
  },
  lessonRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
  },
  // Status badges
  completedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#58CC02",
    alignItems: "center",
    justifyContent: "center",
  },
  inProgressBadge: {
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  inProgressText: {
    fontFamily: "Poppins-Medium",
    fontSize: 10,
    color: "#fff",
  },
  lessonThumb: {
    width: 72,
    height: 52,
    borderRadius: 10,
  },
  availableBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.neutral.border,
    alignItems: "center",
    justifyContent: "center",
  },
});
