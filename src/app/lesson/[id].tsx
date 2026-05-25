import { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "@clerk/expo";

// Type-only import — compile-time only, safe even if the native module crashes
import type {
  StreamVideoClient as StreamVideoClientType,
  Call,
} from "@stream-io/video-react-native-sdk";

import { getLessonById } from "@/data/lessons";
import { getLanguageById } from "@/data/languages";
import { images } from "@/constants/images";
import { BottomTabBar } from "@/components/bottom-tab-bar";
import { colors } from "@/theme";
import { getApiBaseUrl } from "@/lib/stream";
import type { Lesson, SupportedLanguage } from "@/types/learning";

// ─── Stream SDK — loaded at runtime ──────────────────────────────────────────
// Static imports crash in Expo Go because the native WebRTC module is absent.
// A module-level require() inside try/catch fails gracefully instead.
// To enable audio calls: npx expo run:ios  (or run:android)
type StreamSDK = typeof import("@stream-io/video-react-native-sdk");
let streamSDK: StreamSDK | null = null;
try {
  streamSDK = require("@stream-io/video-react-native-sdk") as StreamSDK;
} catch {
  // Native modules not compiled — call feature will show a dev-build prompt
}

// ─── Types ────────────────────────────────────────────────────────────────────

type FeedbackMetric = { label: string; value: string; color: string };
type ConnectStatus = "idle" | "connecting" | "error";
type AgentStatus = "idle" | "connecting" | "connected" | "failed";

type AgentSession = { callId: string; callType: string; sessionId: string };
type ActiveCallInfo = { client: StreamVideoClientType; call: Call };

// ─── Static data ─────────────────────────────────────────────────────────────

const FEEDBACK_METRICS: FeedbackMetric[] = [
  { label: "Speaking", value: "Excellent", color: colors.semantic.success },
  { label: "Pronunciation", value: "Great", color: colors.brand.blue },
  { label: "Grammar", value: "Good", color: colors.semantic.warning },
];

// ─── Active call view (must live inside <StreamCall>) ─────────────────────────

type ActiveLessonViewProps = {
  lesson: Lesson;
  language: SupportedLanguage;
  agentStatus: AgentStatus;
  onEnd: () => Promise<void>;
};

function ActiveLessonView({ lesson, language, agentStatus, onEnd }: ActiveLessonViewProps) {
  // streamSDK is guaranteed non-null here — we only render this component
  // after a successful call.join(), which requires streamSDK to be loaded.
  const { useCallStateHooks, CallingState } = streamSDK!;
  const { useCallCallingState, useMicrophoneState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const { microphone, optimisticIsMute } = useMicrophoneState();
  const [subtitlesOn, setSubtitlesOn] = useState(true);

  const isStreamConnecting =
    callingState === CallingState.JOINING ||
    callingState === CallingState.RECONNECTING;
  const themeColor = language.themeColor;

  // Header status: Stream connecting takes priority, then agent status
  const headerDotColor = isStreamConnecting
    ? colors.semantic.warning
    : agentStatus === "connecting"
    ? colors.semantic.warning
    : agentStatus === "failed"
    ? "#F97316"
    : colors.semantic.success;

  const headerStatusLabel = isStreamConnecting
    ? "Connecting..."
    : agentStatus === "connecting"
    ? "AI joining..."
    : agentStatus === "failed"
    ? "AI offline"
    : "Live";

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.flex} edges={["top"]}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <Pressable style={styles.headerIconBtn} onPress={onEnd}>
            <Ionicons name="chevron-back" size={24} color={colors.neutral.textPrimary} />
          </Pressable>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>AI Teacher</Text>
            <View style={styles.onlineRow}>
              <View style={[styles.onlineDot, { backgroundColor: headerDotColor }]} />
              <Text style={[styles.onlineText, { color: headerDotColor }]}>
                {headerStatusLabel}
              </Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <Pressable style={styles.headerIconBtn}>
              <Ionicons name="videocam-outline" size={22} color={colors.neutral.textPrimary} />
            </Pressable>
            {agentStatus === "connected" && (
              <View style={styles.liveBadge}>
                <Text style={styles.liveBadgeText}>LIVE</Text>
              </View>
            )}
            <Pressable style={styles.headerIconBtn}>
              <Ionicons name="notifications-outline" size={22} color={colors.neutral.textPrimary} />
            </Pressable>
          </View>
        </View>

        {/* ── Teacher area ── */}
        <View style={styles.teacherArea}>
          <View style={[styles.teacherBg, { backgroundColor: "#EDE8FF" }]} />

          <Image
            source={images.mascotWelcome}
            style={styles.mascotImage}
            resizeMode="contain"
          />

          {/* Student preview with muted indicator */}
          <View style={styles.studentPreview}>
            <View style={styles.studentAvatarInner}>
              <Ionicons name="person" size={26} color={colors.neutral.textSecondary} />
            </View>
            {optimisticIsMute && (
              <View style={styles.mutedBadge}>
                <Ionicons name="mic-off" size={11} color="#fff" />
              </View>
            )}
          </View>

          {/* Stream connecting overlay */}
          {isStreamConnecting && (
            <View style={styles.stateOverlay}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.stateOverlayText}>Joining lesson...</Text>
            </View>
          )}

          {/* Agent connecting overlay — shown only until agent is ready */}
          {!isStreamConnecting && agentStatus === "connecting" && (
            <View style={styles.agentJoiningBanner}>
              <ActivityIndicator size="small" color={colors.brand.purple} />
              <Text style={styles.agentJoiningText}>AI Teacher joining the room…</Text>
            </View>
          )}

          {/* Agent failed banner — non-blocking; student can still speak */}
          {agentStatus === "failed" && (
            <View style={styles.agentFailedBanner}>
              <Ionicons name="warning-outline" size={14} color="#fff" />
              <Text style={styles.agentFailedText}>AI Teacher could not join</Text>
            </View>
          )}

          {/* Speech bubble */}
          <View style={styles.speechBubble}>
            <View style={styles.speechContent}>
              <Text style={styles.speechText} numberOfLines={3}>
                {lesson.aiTeacherPrompt.openingMessage}
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

          {/* Mic — wired to Stream microphone.toggle() */}
          <Pressable
            style={[styles.controlBtn, !optimisticIsMute && styles.controlBtnActive]}
            onPress={() => microphone.toggle()}
          >
            <Ionicons
              name={optimisticIsMute ? "mic-off-outline" : "mic"}
              size={22}
              color="#fff"
            />
          </Pressable>

          <Pressable
            style={[styles.controlBtn, subtitlesOn && styles.controlBtnActive]}
            onPress={() => setSubtitlesOn((v) => !v)}
          >
            <Text style={styles.subtitlesIcon}>文</Text>
          </Pressable>

          {/* End call — leaves the Stream call and stops the agent */}
          <Pressable style={styles.endCallBtn} onPress={onEnd}>
            <Ionicons
              name="call"
              size={22}
              color="#fff"
              style={{ transform: [{ rotate: "135deg" }] }}
            />
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
      <BottomTabBar />
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useUser();

  const [connectStatus, setConnectStatus] = useState<ConnectStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [subtitlesOn, setSubtitlesOn] = useState(true);
  const [activeCall, setActiveCall] = useState<ActiveCallInfo | null>(null);
  const [agentStatus, setAgentStatus] = useState<AgentStatus>("idle");
  const [agentSession, setAgentSession] = useState<AgentSession | null>(null);

  // Refs so the unmount cleanup always sees the latest values without stale closures
  const activeCallRef = useRef<ActiveCallInfo | null>(null);
  const agentSessionRef = useRef<AgentSession | null>(null);

  useEffect(() => { activeCallRef.current = activeCall; }, [activeCall]);
  useEffect(() => { agentSessionRef.current = agentSession; }, [agentSession]);

  // Best-effort cleanup when the screen unmounts without an explicit End call press
  useEffect(() => {
    return () => {
      const session = agentSessionRef.current;
      const call = activeCallRef.current;
      if (session) {
        fetch(`${getApiBaseUrl()}/api/agent-session`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ callId: session.callId, sessionId: session.sessionId }),
        }).catch(() => {});
      }
      if (call) {
        call.call.leave().catch(() => {});
        call.client.disconnectUser().catch(() => {});
      }
    };
  }, []);

  const lesson = getLessonById(id ?? "");
  const language = lesson ? getLanguageById(lesson.languageId) : null;

  const handleStart = useCallback(async () => {
    if (!user || !lesson || !language) return;

    // Graceful fallback when running in Expo Go (no native modules)
    if (!streamSDK) {
      setConnectStatus("error");
      setErrorMsg(
        "Audio lessons need a native dev build.\nRun: npx expo run:ios"
      );
      return;
    }

    setConnectStatus("connecting");
    setErrorMsg("");
    setAgentStatus("idle");

    try {
      // ── Step 1: create/get the Stream audio_room call ────────────────────
      const res = await fetch(`${getApiBaseUrl()}/api/stream-lesson-call`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          userName: user.fullName ?? user.firstName ?? "Student",
          lessonId: lesson.id,
          languageId: lesson.languageId,
        }),
      });

      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(error ?? "Failed to start lesson");
      }

      const { token, apiKey, callId, callType } = await res.json();

      // ── Step 2: connect the Stream client and join the call ──────────────
      const client = streamSDK.StreamVideoClient.getOrCreateInstance({
        apiKey,
        user: {
          id: user.id,
          name: user.fullName ?? user.firstName ?? "Student",
          image: user.imageUrl ?? undefined,
        },
        token,
      });

      const call = client.call(callType, callId);
      await call.join({ create: false });

      setActiveCall({ client, call });
      setConnectStatus("idle");

      // ── Step 3: start the Vision Agent (non-blocking for the call UI) ────
      setAgentStatus("connecting");

      const lessonContext = {
        title: lesson.title,
        description: lesson.description,
        target_language: language.name,
        goals: lesson.goals.map((g) => ({
          title: g.title,
          success_criteria: g.successCriteria,
        })),
        vocabulary: lesson.vocabulary.map((v) => ({
          term: v.term,
          translation: v.translation,
          example: v.example,
          phonetic_hint: v.phoneticHint ?? null,
        })),
        phrases: lesson.phrases.map((p) => ({
          phrase: p.phrase,
          translation: p.translation,
          use_case: p.useCase,
          pronunciation_tip: p.pronunciationTip ?? null,
        })),
        ai_teacher_prompt: {
          persona: lesson.aiTeacherPrompt.persona,
          lesson_objective: lesson.aiTeacherPrompt.lessonObjective,
          system_prompt: lesson.aiTeacherPrompt.systemPrompt,
          opening_message: lesson.aiTeacherPrompt.openingMessage,
          correction_style: lesson.aiTeacherPrompt.correctionStyle,
          target_phrases: lesson.aiTeacherPrompt.targetPhrases,
        },
      };

      try {
        const agentRes = await fetch(`${getApiBaseUrl()}/api/agent-session`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            callId,
            callType,
            targetLanguage: language.name,
            lessonContext,
          }),
        });

        if (agentRes.ok) {
          const { sessionId } = await agentRes.json();
          setAgentSession({ callId, callType, sessionId });
          setAgentStatus("connected");
        } else {
          setAgentStatus("failed");
        }
      } catch {
        // Agent failure doesn't block the lesson — student can still use the call
        setAgentStatus("failed");
      }
    } catch (e) {
      const raw = e instanceof Error ? e.message : "Failed to connect";
      // Stream error 106 = Video service geo-blocked in this region
      const isGeoBlocked =
        raw.includes("error code 106") ||
        raw.toLowerCase().includes("not available in your region");
      setConnectStatus("error");
      setErrorMsg(
        isGeoBlocked
          ? "Stream Video is unavailable in your region.\nConnect via a VPN to test, or switch to a non-restricted Stream product."
          : raw
      );
    }
  }, [user, lesson, language]);

  const handleEnd = useCallback(async () => {
    // Stop the agent session first (best effort — don't let errors block call cleanup)
    if (agentSession) {
      try {
        await fetch(`${getApiBaseUrl()}/api/agent-session`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            callId: agentSession.callId,
            sessionId: agentSession.sessionId,
          }),
        });
      } catch {}
      setAgentSession(null);
      setAgentStatus("idle");
    }

    // Leave the Stream call
    if (activeCall) {
      try {
        await activeCall.call.leave();
        await activeCall.client.disconnectUser();
      } catch {}
      setActiveCall(null);
    }

    router.back();
  }, [activeCall, agentSession]);

  // ── Not found ──
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

  // ── Active call: wrapped in Stream providers ──
  if (activeCall && streamSDK) {
    const { StreamVideo, StreamCall } = streamSDK;
    return (
      <StreamVideo client={activeCall.client}>
        <StreamCall call={activeCall.call}>
          <ActiveLessonView
            lesson={lesson}
            language={language}
            agentStatus={agentStatus}
            onEnd={handleEnd}
          />
        </StreamCall>
      </StreamVideo>
    );
  }

  // ── Idle / connecting / error ──
  const themeColor = language.themeColor;
  const teacherMessage = lesson.aiTeacherPrompt.openingMessage;

  // Header status dot in the pre-call state
  const idleDotColor =
    connectStatus === "error"
      ? colors.semantic.error
      : connectStatus === "connecting"
      ? colors.semantic.warning
      : colors.neutral.border;

  const idleStatusLabel =
    connectStatus === "error"
      ? "Failed"
      : connectStatus === "connecting"
      ? "Connecting..."
      : "Ready";

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
              <View style={[styles.onlineDot, { backgroundColor: idleDotColor }]} />
              <Text style={[styles.onlineText, { color: idleDotColor }]}>
                {idleStatusLabel}
              </Text>
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
          <View style={[styles.teacherBg, { backgroundColor: "#EDE8FF" }]} />

          <Image
            source={images.mascotWelcome}
            style={styles.mascotImage}
            resizeMode="contain"
          />

          <View style={styles.studentPreview}>
            <View style={styles.studentAvatarInner}>
              <Ionicons name="person" size={26} color={colors.neutral.textSecondary} />
            </View>
          </View>

          {/* Connecting overlay */}
          {connectStatus === "connecting" && (
            <View style={styles.stateOverlay}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.stateOverlayText}>Connecting to lesson...</Text>
            </View>
          )}

          {/* Error overlay */}
          {connectStatus === "error" && (
            <View style={[styles.stateOverlay, styles.errorOverlay]}>
              <Ionicons name="warning-outline" size={36} color="#fff" />
              <Text style={styles.stateOverlayText}>
                {errorMsg || "Connection failed"}
              </Text>
              <Pressable style={styles.retryBtn} onPress={handleStart}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </Pressable>
            </View>
          )}

          {/* Speech bubble */}
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

        {/* ── Controls (disabled until connected) ── */}
        <View style={styles.controlsRow}>
          <Pressable style={[styles.controlBtn, styles.controlBtnDisabled]}>
            <Ionicons name="videocam" size={22} color="rgba(255,255,255,0.35)" />
          </Pressable>
          <Pressable style={[styles.controlBtn, styles.controlBtnDisabled]}>
            <Ionicons name="mic-outline" size={22} color="rgba(255,255,255,0.35)" />
          </Pressable>
          <Pressable
            style={[styles.controlBtn, subtitlesOn && styles.controlBtnActive]}
            onPress={() => setSubtitlesOn((v) => !v)}
          >
            <Text style={styles.subtitlesIcon}>文</Text>
          </Pressable>
          <Pressable style={styles.endCallBtn} onPress={() => router.back()}>
            <Ionicons
              name="call"
              size={22}
              color="#fff"
              style={{ transform: [{ rotate: "135deg" }] }}
            />
          </Pressable>
        </View>

        {/* ── Start lesson CTA ── */}
        {connectStatus !== "connecting" && (
          <Pressable
            style={[
              styles.startLessonBtn,
              connectStatus === "error" && styles.startLessonBtnError,
            ]}
            onPress={handleStart}
          >
            <Ionicons name="mic" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.startLessonBtnText}>
              {connectStatus === "error" ? "Retry Connection" : "Start Audio Lesson"}
            </Text>
          </Pressable>
        )}

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
      <BottomTabBar />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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
  },
  onlineText: {
    fontFamily: "Poppins-Regular",
    fontSize: 11,
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
  liveBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: colors.semantic.error,
    marginHorizontal: 4,
  },
  liveBadgeText: {
    fontFamily: "Poppins-Bold",
    fontSize: 10,
    color: "#fff",
    letterSpacing: 0.5,
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
  mutedBadge: {
    position: "absolute",
    bottom: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.semantic.error,
    alignItems: "center",
    justifyContent: "center",
  },
  // ── State overlays ──
  stateOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    borderRadius: 24,
    paddingHorizontal: 24,
  },
  errorOverlay: {
    backgroundColor: "rgba(220,38,38,0.88)",
  },
  stateOverlayText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
    color: "#fff",
    textAlign: "center",
  },
  retryBtn: {
    marginTop: 4,
    backgroundColor: "#fff",
    borderRadius: 99,
    paddingHorizontal: 28,
    paddingVertical: 10,
  },
  retryBtnText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 13,
    color: colors.semantic.error,
  },
  // ── Agent status banners (non-blocking) ──
  agentJoiningBanner: {
    position: "absolute",
    top: 14,
    left: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  agentJoiningText: {
    fontFamily: "Poppins-Medium",
    fontSize: 11,
    color: colors.brand.purple,
  },
  agentFailedBanner: {
    position: "absolute",
    top: 14,
    left: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F97316",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  agentFailedText: {
    fontFamily: "Poppins-Medium",
    fontSize: 11,
    color: "#fff",
  },
  // ── Speech bubble ──
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
  controlBtnDisabled: {
    opacity: 0.45,
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
  // ── Start lesson CTA ──
  startLessonBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.brand.purple,
    borderRadius: 99,
    marginHorizontal: 24,
    paddingVertical: 14,
    marginBottom: 12,
    shadowColor: colors.brand.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  startLessonBtnError: {
    backgroundColor: colors.semantic.error,
    shadowColor: colors.semantic.error,
  },
  startLessonBtnText: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 15,
    color: "#fff",
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
  // ── Error / not found ──
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
