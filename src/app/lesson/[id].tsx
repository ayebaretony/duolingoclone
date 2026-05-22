import { useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { getLessonById } from "@/data/lessons";
import { getLanguageById } from "@/data/languages";
import { images } from "@/constants/images";
import { BottomTabBar } from "@/components/bottom-tab-bar";
import { colors } from "@/theme";

type FeedbackMetric = {
  label: string;
  value: string;
  color: string;
};

const FEEDBACK_METRICS: FeedbackMetric[] = [
  { label: "Speaking", value: "Excellent", color: colors.semantic.success },
  { label: "Pronunciation", value: "Great", color: colors.brand.blue },
  { label: "Grammar", value: "Good", color: colors.semantic.warning },
];

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [micActive, setMicActive] = useState(false);
  const [subtitlesOn, setSubtitlesOn] = useState(true);

  const lesson = getLessonById(id ?? "");
  const language = lesson ? getLanguageById(lesson.languageId) : null;

  if (!lesson || !language) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.flex} edges={["top"]}>
          <View style={styles.errorWrap}>
            <Ionicons name="alert-circle-outline" size={52} color={colors.neutral.border} />
            <Text style={styles.errorTitle}>Lesson not found</Text>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backButtonText}>Go back</Text>
            </Pressable>
          </View>
        </SafeAreaView>
        <BottomTabBar />
      </View>
    );
  }

  const teacherMessage = lesson.aiTeacherPrompt.openingMessage;
  const themeColor = language.themeColor;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.flex} edges={["top"]}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <Pressable style={styles.headerIconBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={colors.neutral.textPrimary} />
          </Pressable>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>AI Teacher</Text>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Online</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <Pressable style={styles.headerIconBtn}>
              <Ionicons name="videocam-outline" size={22} color={colors.neutral.textPrimary} />
            </Pressable>
            <View style={styles.counterBadge}>
              <Text style={styles.counterText}>12</Text>
            </View>
            <Pressable style={styles.headerIconBtn}>
              <Ionicons name="notifications-outline" size={22} color={colors.neutral.textPrimary} />
            </Pressable>
          </View>
        </View>

        {/* ── Teacher area ── */}
        <View style={styles.teacherArea}>
          {/* Soft background tint */}
          <View style={[styles.teacherBg, { backgroundColor: "#EDE8FF" }]} />

          {/* Fox mascot / AI teacher avatar */}
          <Image
            source={images.mascotWelcome}
            style={styles.mascotImage}
            resizeMode="contain"
          />

          {/* Student preview (top-right corner) */}
          <View style={styles.studentPreview}>
            <View style={styles.studentAvatarInner}>
              <Ionicons name="person" size={26} color={colors.neutral.textSecondary} />
            </View>
          </View>

          {/* Speech bubble / teacher response */}
          <View style={styles.speechBubble}>
            <View style={styles.speechContent}>
              <Text style={styles.speechText} numberOfLines={3}>
                {teacherMessage}
              </Text>
            </View>
            <Pressable style={styles.speakerBtn}>
              <Ionicons name="volume-medium" size={20} color={themeColor} />
            </Pressable>
          </View>
        </View>

        {/* ── Controls ── */}
        <View style={styles.controlsRow}>
          <Pressable style={styles.controlBtn}>
            <Ionicons name="videocam" size={22} color="#fff" />
          </Pressable>

          <Pressable
            style={[styles.controlBtn, micActive && styles.controlBtnActive]}
            onPress={() => setMicActive((v) => !v)}
          >
            <Ionicons name={micActive ? "mic" : "mic-outline"} size={22} color="#fff" />
          </Pressable>

          <Pressable
            style={[styles.controlBtn, subtitlesOn && styles.controlBtnActive]}
            onPress={() => setSubtitlesOn((v) => !v)}
          >
            <Text style={styles.subtitlesIcon}>文</Text>
          </Pressable>

          <Pressable style={styles.endCallBtn} onPress={() => router.back()}>
            <Ionicons name="call" size={22} color="#fff" style={{ transform: [{ rotate: "135deg" }] }} />
          </Pressable>
        </View>

        {/* ── Feedback metrics ── */}
        <View style={styles.feedbackRow}>
          {FEEDBACK_METRICS.map((metric) => (
            <View key={metric.label} style={styles.feedbackCard}>
              <Text style={styles.feedbackLabel}>{metric.label}</Text>
              <Text style={[styles.feedbackValue, { color: metric.color }]}>
                {metric.value}
              </Text>
            </View>
          ))}
        </View>
      </SafeAreaView>

      {/* ── Bottom tab bar ── */}
      <BottomTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.background,
  },
  flex: {
    flex: 1,
  },
  // ── Header ──
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "flex-start",
    paddingLeft: 4,
  },
  headerTitle: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 16,
    color: colors.neutral.textPrimary,
  },
  onlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 1,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.semantic.success,
  },
  onlineText: {
    fontFamily: "Poppins-Regular",
    fontSize: 11,
    color: colors.semantic.success,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  counterBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: colors.neutral.surface,
    marginHorizontal: 2,
  },
  counterText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 12,
    color: colors.neutral.textPrimary,
  },
  // ── Teacher area ──
  teacherArea: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 24,
    overflow: "hidden",
    position: "relative",
  },
  teacherBg: {
    ...StyleSheet.absoluteFillObject,
  },
  mascotImage: {
    position: "absolute",
    bottom: 80,
    alignSelf: "center",
    width: "90%",
    height: "85%",
  },
  studentPreview: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 76,
    height: 96,
    borderRadius: 16,
    backgroundColor: "#D4CCF7",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  studentAvatarInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#C3B9F0",
    alignItems: "center",
    justifyContent: "center",
  },
  speechBubble: {
    position: "absolute",
    bottom: 14,
    left: 14,
    right: 14,
    backgroundColor: "#fff",
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: "#3B2B8A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  speechContent: {
    flex: 1,
    paddingRight: 10,
  },
  speechText: {
    fontFamily: "Poppins-Medium",
    fontSize: 13,
    color: colors.neutral.textPrimary,
    lineHeight: 20,
  },
  speakerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.neutral.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  // ── Controls ──
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  controlBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2D2D3A",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  controlBtnActive: {
    backgroundColor: colors.brand.purple,
  },
  subtitlesIcon: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  endCallBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.semantic.error,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.semantic.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  // ── Feedback metrics ──
  feedbackRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  feedbackCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.neutral.border,
    shadowColor: "#0D132B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  feedbackLabel: {
    fontFamily: "Poppins-Regular",
    fontSize: 11,
    color: colors.neutral.textSecondary,
    marginBottom: 3,
  },
  feedbackValue: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 13,
  },
  // ── Error state ──
  errorWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: 18,
    color: colors.neutral.textPrimary,
  },
  backButton: {
    backgroundColor: colors.brand.purple,
    borderRadius: 99,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  backButtonText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    color: "#fff",
  },
});
