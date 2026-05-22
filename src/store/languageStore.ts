import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import type { LanguageId } from "@/types/learning";

const LANGUAGE_STORAGE_KEY = "language-storage";

const isAsyncStorageReady = () =>
  AsyncStorage != null &&
  typeof AsyncStorage.getItem === "function" &&
  typeof AsyncStorage.setItem === "function" &&
  typeof AsyncStorage.removeItem === "function";

const storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (isAsyncStorageReady()) {
      return AsyncStorage.getItem(key);
    }

    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (isAsyncStorageReady()) {
      return AsyncStorage.setItem(key, value);
    }

    return SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (isAsyncStorageReady()) {
      return AsyncStorage.removeItem(key);
    }

    return SecureStore.deleteItemAsync(key);
  },
};

interface LanguageStore {
  selectedLanguageId: LanguageId | null;
  setSelectedLanguage: (languageId: LanguageId) => Promise<void>;
  clearSelectedLanguage: () => Promise<void>;
  hasHydrated: boolean;
  setHasHydrated: (hydrated: boolean) => void;
  hydrate: () => Promise<void>;
}

export const useLanguageStore = create<LanguageStore>((set) => ({
  selectedLanguageId: null,
  hasHydrated: false,
  setSelectedLanguage: async (languageId: LanguageId) => {
    try {
      await storage.setItem(LANGUAGE_STORAGE_KEY, languageId);
    } catch {
      // Fallback to in-memory state if storage fails.
    }
    set({ selectedLanguageId: languageId });
  },
  clearSelectedLanguage: async () => {
    try {
      await storage.removeItem(LANGUAGE_STORAGE_KEY);
    } catch {
      // Ignore missing storage.
    }
    set({ selectedLanguageId: null });
  },
  setHasHydrated: (hydrated: boolean) => set({ hasHydrated: hydrated }),
  hydrate: async () => {
    try {
      const storedLanguageId = await storage.getItem(LANGUAGE_STORAGE_KEY);
      set({ selectedLanguageId: storedLanguageId as LanguageId | null, hasHydrated: true });
    } catch {
      set({ hasHydrated: true });
    }
  },
}));
