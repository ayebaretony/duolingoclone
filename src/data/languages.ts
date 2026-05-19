import type { SupportedLanguage } from "@/types/learning";

export const languages: SupportedLanguage[] = [
  {
    id: "spanish",
    name: "Spanish",
    nativeName: "Español",
    flagEmoji: "🇪🇸",
    locale: "es-ES",
    description: "Start with friendly greetings and everyday classroom phrases.",
    themeColor: "#FF6B4A",
    starterUnitId: "spanish-basics-1",
    learners: "28.4M",
  },
  {
    id: "french",
    name: "French",
    nativeName: "Français",
    flagEmoji: "🇫🇷",
    locale: "fr-FR",
    description: "Practice simple introductions, greetings, and polite phrases.",
    themeColor: "#4D8BFF",
    starterUnitId: "french-basics-1",
    learners: "19.4M",
  },
  {
    id: "japanese",
    name: "Japanese",
    nativeName: "日本語",
    flagEmoji: "🇯🇵",
    locale: "ja-JP",
    description: "Learn short, useful phrases with simple pronunciation support.",
    themeColor: "#FF5C8A",
    starterUnitId: "japanese-basics-1",
    learners: "12.7M",
  },
  {
    id: "korean",
    name: "Korean",
    nativeName: "한국어",
    flagEmoji: "🇰🇷",
    locale: "ko-KR",
    description: "Learn basic Korean phrases and greetings.",
    themeColor: "#FF6B6B",
    starterUnitId: "korean-basics-1",
    learners: "9.3M",
  },
  {
    id: "german",
    name: "German",
    nativeName: "Deutsch",
    flagEmoji: "🇩🇪",
    locale: "de-DE",
    description: "Start with simple German greetings and phrases.",
    themeColor: "#FFD700",
    starterUnitId: "german-basics-1",
    learners: "8.1M",
  },
  {
    id: "chinese",
    name: "Chinese",
    nativeName: "中文",
    flagEmoji: "🇨🇳",
    locale: "zh-CN",
    description: "Learn basic Mandarin Chinese phrases.",
    themeColor: "#FF0000",
    starterUnitId: "chinese-basics-1",
    learners: "7.4M",
  },
];

export const getLanguageById = (languageId: SupportedLanguage["id"]) => {
  return languages.find((language) => language.id === languageId);
};
