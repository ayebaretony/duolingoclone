export type LanguageId = "spanish" | "french" | "japanese" | "korean" | "german" | "chinese";

export type ProficiencyLevel = "starter" | "beginner";

export type LessonMode = "vocabulary" | "phrases" | "audio" | "ai-teacher";

export type ActivityType =
  | "multiple-choice"
  | "phrase-match"
  | "translate"
  | "listen-repeat"
  | "ai-teacher";

export type PartOfSpeech =
  | "noun"
  | "verb"
  | "adjective"
  | "adverb"
  | "pronoun"
  | "phrase";

export type SupportedLanguage = {
  id: LanguageId;
  name: string;
  nativeName: string;
  flagEmoji: string;
  locale: string;
  description: string;
  themeColor: string;
  starterUnitId: string;
  learners: string;
};

export type LearningUnit = {
  id: string;
  languageId: LanguageId;
  title: string;
  subtitle: string;
  description: string;
  level: ProficiencyLevel;
  order: number;
  xpReward: number;
  lessonIds: string[];
  unitGoals: string[];
};

export type LessonGoal = {
  id: string;
  title: string;
  successCriteria: string;
};

export type VocabularyItem = {
  id: string;
  term: string;
  translation: string;
  transliteration?: string;
  phoneticHint?: string;
  partOfSpeech: PartOfSpeech;
  example: string;
  exampleTranslation: string;
  tags: string[];
};

export type PhraseItem = {
  id: string;
  phrase: string;
  translation: string;
  transliteration?: string;
  pronunciationTip?: string;
  useCase: string;
};

export type MultipleChoiceActivity = {
  id: string;
  type: "multiple-choice";
  prompt: string;
  correctAnswer: string;
  options: string[];
  vocabularyId?: string;
};

export type PhraseMatchActivity = {
  id: string;
  type: "phrase-match";
  prompt: string;
  pairs: {
    source: string;
    target: string;
  }[];
};

export type TranslateActivity = {
  id: string;
  type: "translate";
  prompt: string;
  answer: string;
  acceptedAnswers: string[];
  phraseId?: string;
};

export type ListenRepeatActivity = {
  id: string;
  type: "listen-repeat";
  prompt: string;
  targetText: string;
  pronunciationTip: string;
  phraseId?: string;
};

export type AiTeacherActivity = {
  id: string;
  type: "ai-teacher";
  prompt: string;
  expectedOutcome: string;
};

export type LearningActivity =
  | MultipleChoiceActivity
  | PhraseMatchActivity
  | TranslateActivity
  | ListenRepeatActivity
  | AiTeacherActivity;

export type AiTeacherPrompt = {
  persona: string;
  voiceStyle: string;
  lessonObjective: string;
  systemPrompt: string;
  openingMessage: string;
  correctionStyle: string;
  targetPhrases: string[];
};

export type Lesson = {
  id: string;
  unitId: string;
  languageId: LanguageId;
  title: string;
  description: string;
  order: number;
  mode: LessonMode;
  xpReward: number;
  estimatedMinutes: number;
  goals: LessonGoal[];
  vocabulary: VocabularyItem[];
  phrases: PhraseItem[];
  activities: LearningActivity[];
  aiTeacherPrompt: AiTeacherPrompt;
};
