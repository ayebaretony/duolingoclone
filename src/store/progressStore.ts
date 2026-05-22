import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { posthog } from "@/lib/posthog";

const PROGRESS_STORAGE_KEY = "progress-storage";

interface PersistedProgress {
  currentDailyXP: number;
  streakCount: number;
  completedLessonIds: string[];
}

interface ProgressStore extends PersistedProgress {
  dailyGoalXP: number;
  hasHydrated: boolean;
  addXP: (amount: number) => Promise<void>;
  completeLesson: (lessonId: string) => Promise<void>;
  hydrate: () => Promise<void>;
}

const DEFAULT_STATE: PersistedProgress = {
  currentDailyXP: 15,
  streakCount: 12,
  completedLessonIds: [],
};

async function save(data: PersistedProgress) {
  try {
    await AsyncStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore write failures
  }
}

export const useProgressStore = create<ProgressStore>((set, get) => ({
  ...DEFAULT_STATE,
  dailyGoalXP: 20,
  hasHydrated: false,
  addXP: async (amount) => {
    if (!Number.isFinite(amount) || amount < 0) return;
    const { currentDailyXP, streakCount, completedLessonIds } = get();
    const newXP = currentDailyXP + amount;
    set({ currentDailyXP: newXP });
    posthog.capture("xp_earned", { amount, total_xp: newXP });
    await save({ currentDailyXP: newXP, streakCount, completedLessonIds });
  },
  completeLesson: async (lessonId) => {
    const ids = get().completedLessonIds;
    if (ids.includes(lessonId)) return;
    const next = [...ids, lessonId];
    set({ completedLessonIds: next });
    posthog.capture("lesson_completed", { lesson_id: lessonId, total_completed: next.length });
    await save({ currentDailyXP: get().currentDailyXP, streakCount: get().streakCount, completedLessonIds: next });
  },
  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(PROGRESS_STORAGE_KEY);
      if (raw) {
        const parsed: Partial<PersistedProgress> = JSON.parse(raw);
        const currentDailyXP = typeof parsed.currentDailyXP === "number" ? parsed.currentDailyXP : DEFAULT_STATE.currentDailyXP;
        const streakCount = typeof parsed.streakCount === "number" ? parsed.streakCount : DEFAULT_STATE.streakCount;
        const completedLessonIds =
          Array.isArray(parsed.completedLessonIds) && parsed.completedLessonIds.every((id) => typeof id === "string")
            ? parsed.completedLessonIds
            : DEFAULT_STATE.completedLessonIds;
        set({ currentDailyXP, streakCount, completedLessonIds, hasHydrated: true });
      } else {
        set({ hasHydrated: true });
      }
    } catch {
      set({ hasHydrated: true });
    }
  },
}));
