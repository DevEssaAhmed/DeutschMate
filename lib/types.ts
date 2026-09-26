export type LevelId = "A1" | "A2" | "B1" | "B2" | "C1";
export type CoreSkill = "reading" | "listening" | "speaking" | "writing" | "grammar" | "vocabulary";

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
  skill?: "grammar" | "vocabulary";
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

export type LessonStage =
  | "input"
  | "grammar"
  | "lexis"
  | "reception"
  | "production"
  | "review";

export type RichVocabularyItem = VocabularyItem & {
  article?: "der" | "die" | "das";
  lemma: string;
  partOfSpeech: "noun" | "verb" | "adjective" | "adverb" | "expression" | "other";
  level: LevelId;
  contextExample: string;
  chunks: string[];
};

export type CefrDescriptor = {
  id: string;
  level: LevelId;
  skill: CoreSkill;
  text: string;
};

export type ModuleSpec = {
  level: LevelId;
  slug: string;
  title: string;
  scenario: string;
  grammarFocus: string[];
  canDos: string[];
  readingGenre: string;
  listeningGenre: string;
  writingTask: string;
  speakingTask: string;
  chunks: string[];
  anchorText: string;
  dialogue: string[];
};

export type ControlledTask = {
  id: string;
  type: "choice" | "fill" | "transform" | "order" | "short-answer";
  prompt: string;
  options?: string[];
  answer?: string;
  hint?: string;
};

export type ReadingTask = {
  title: string;
  genre: string;
  text: string;
  preReading: string[];
  gistQuestion: string;
  detailQuestions: string[];
  languageFocus: string[];
  afterReading: string;
};

export type ListeningTask = {
  title: string;
  genre: string;
  script: string;
  gistQuestion: string;
  detailQuestions: string[];
  dictationLine: string;
  shadowingLine: string;
};

export type ProductionTask = {
  writing: string;
  speaking: string;
  checklist: string[];
};

export type CourseLesson = {
  id: string;
  level: LevelId;
  moduleSlug: string;
  moduleTitle: string;
  moduleIndex: number;
  lessonIndex: number;
  slug: string;
  title: string;
  stage: LessonStage;
  durationMinutes: number;
  scenario: string;
  objectives: string[];
  vocabulary: RichVocabularyItem[];
  grammar: GrammarTopic[];
  chunks: string[];
  reading: ReadingTask;
  listening: ListeningTask;
  controlled: ControlledTask[];
  production: ProductionTask;
  checkpoint: QuizQuestion[];
  competencyIds: string[];
};

export type CourseModule = ModuleSpec & {
  index: number;
  lessons: CourseLesson[];
  vocabulary: RichVocabularyItem[];
  grammar: GrammarTopic[];
  competencyIds: string[];
};

export type LevelAssessment = {
  level: LevelId;
  title: string;
  description: string;
  reading: ReadingTask;
  listening: ListeningTask;
  writingTask: string;
  speakingTask: string;
  questions: QuizQuestion[];
  competencyIds: string[];
};
