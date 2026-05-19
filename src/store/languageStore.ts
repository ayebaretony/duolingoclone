import { create } from "zustand";

interface LanguageStore {
  selectedLanguageId: string | null;
  setSelectedLanguage: (languageId: string) => void;
}

export const useLanguageStore = create<LanguageStore>((set) => ({
  selectedLanguageId: null,
  setSelectedLanguage: (languageId: string) =>
    set({ selectedLanguageId: languageId }),
}));
