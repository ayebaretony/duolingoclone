import type { LearningUnit } from "@/types/learning";

export const units: LearningUnit[] = [
  {
    id: "spanish-basics-1",
    languageId: "spanish",
    title: "Basics 1",
    subtitle: "Say hello",
    description: "Learn friendly greetings, names, and simple goodbyes.",
    level: "starter",
    order: 1,
    xpReward: 30,
    lessonIds: ["spanish-greetings", "spanish-introductions"],
    unitGoals: [
      "Greet someone in Spanish.",
      "Ask and answer a simple name question.",
      "Recognize common goodbye phrases.",
    ],
  },
  {
    id: "french-basics-1",
    languageId: "french",
    title: "Basics 1",
    subtitle: "Meet someone",
    description: "Practice hello, thank you, and basic introductions.",
    level: "starter",
    order: 1,
    xpReward: 30,
    lessonIds: ["french-greetings", "french-introductions"],
    unitGoals: [
      "Use polite French greetings.",
      "Introduce yourself with a short sentence.",
      "Respond to a simple wellbeing question.",
    ],
  },
  {
    id: "japanese-basics-1",
    languageId: "japanese",
    title: "Basics 1",
    subtitle: "First greetings",
    description: "Start with simple greetings and polite classroom phrases.",
    level: "starter",
    order: 1,
    xpReward: 30,
    lessonIds: ["japanese-greetings", "japanese-introductions"],
    unitGoals: [
      "Say hello and thank you in Japanese.",
      "Recognize romanized pronunciation hints.",
      "Practice a short self-introduction.",
    ],
  },
];

export const getUnitsByLanguage = (languageId: LearningUnit["languageId"]) => {
  return units.filter((unit) => unit.languageId === languageId);
};

export const getUnitById = (unitId: LearningUnit["id"]) => {
  return units.find((unit) => unit.id === unitId);
};
