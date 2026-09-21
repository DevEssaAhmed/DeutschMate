export type LevelId = "A1" | "A2" | "B1" | "B2" | "C1";

export type GrammarTopic = {
  name: string;
  explanation: string;
  examples: string[];
};

export type VocabularyItem = {
  de: string;
  en: string;
};

export type PracticeTask = {
  label: string;
  text: string;
};

export type QuizQuestion = {
  q: string;
  options: string[];
  answer: string;
};

export type CourseUnit = {
  id: number;
  level: LevelId;
  title: string;
  slug: string;
  goals: string[];
  grammar: GrammarTopic[];
  vocab: VocabularyItem[];
  practice: PracticeTask[];
  quiz: QuizQuestion[];
};

export type CourseData = {
  levels: Record<LevelId, { goal: string }>;
  units: CourseUnit[];
  survival: VocabularyItem[];
  irregular: Array<{
    inf: string;
    present: string;
    preterite: string;
    perfect: string;
    en: string;
  }>;
};
