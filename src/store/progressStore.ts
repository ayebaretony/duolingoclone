import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

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
    const next = {
      ...get(),
      currentDailyXP: get().currentDailyXP + amount,
    };
    set({ currentDailyXP: next.currentDailyXP });
    await save({ currentDailyXP: next.currentDailyXP, streakCount: get().streakCount, completedLessonIds: get().completedLessonIds });
  },
  completeLesson: async (lessonId) => {
    const ids = get().completedLessonIds;
    if (ids.includes(lessonId)) return;
    const next = [...ids, lessonId];
    set({ completedLessonIds: next });
    await save({ currentDailyXP: get().currentDailyXP, streakCount: get().streakCount, completedLessonIds: next });
  },
  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(PROGRESS_STORAGE_KEY);
      if (raw) {
        const parsed: Partial<PersistedProgress> = JSON.parse(raw);
        set({
          currentDailyXP: parsed.currentDailyXP ?? DEFAULT_STATE.currentDailyXP,
          streakCount: parsed.streakCount ?? DEFAULT_STATE.streakCount,
          completedLessonIds: parsed.completedLessonIds ?? DEFAULT_STATE.completedLessonIds,
          hasHydrated: true,
        });
      } else {
        set({ hasHydrated: true });
      }
    } catch {
      set({ hasHydrated: true });
    }
  },
}));
