import a1 from "./content/a1.json";
import a2 from "./content/a2.json";
import b1 from "./content/b1.json";
import b2 from "./content/b2.json";
import c1 from "./content/c1.json";
import { cefrDescriptors, descriptorsForLevel, skillOrder } from "./cefr";
import { moduleSpecs } from "./module-specs";
import type {
  ControlledTask,
  CourseLesson,
  CourseModule,
  CourseUnit,
  GrammarTopic,
  LevelAssessment,
  LevelId,
  ModuleSpec,
  QuizQuestion,
  RichVocabularyItem,
  VocabularyItem,
} from "./types";

export const levelOrder: LevelId[] = ["A1", "A2", "B1", "B2", "C1"];

const legacyUnits = [...a1, ...a2, ...b1, ...b2, ...c1] as unknown as CourseUnit[];
const unitsByLevel = Object.fromEntries(
  levelOrder.map((level) => [level, legacyUnits.filter((unit) => unit.level === level)]),
) as Record<LevelId, CourseUnit[]>;

const stagePlan = [
  { slug: "input", stage: "input", title: "Context & input", duration: 25 },
  { slug: "grammar", stage: "grammar", title: "Grammar workshop", duration: 35 },
  { slug: "lexis", stage: "lexis", title: "Vocabulary & chunks", duration: 30 },
  { slug: "reception", stage: "reception", title: "Reading & listening lab", duration: 40 },
  { slug: "production", stage: "production", title: "Guided production", duration: 40 },
  { slug: "review", stage: "review", title: "Review & checkpoint", duration: 30 },
] as const;

function stripArticle(term: string) {
  return term.replace(/^(der|die|das)\s+/i, "").trim();
}

function inferPartOfSpeech(item: VocabularyItem): RichVocabularyItem["partOfSpeech"] {
  if (/^(der|die|das)\s/i.test(item.de)) return "noun";
  if (/\bto\b/i.test(item.en) || /en$/.test(item.de)) return "verb";
  if (/ly$/.test(item.en)) return "adverb";
  if (/^(very |friendly|expensive|cheap|young|old|ill|open|closed|slow|quick)/i.test(item.en)) return "adjective";
  if (item.de.includes(" ") || item.en.includes("/")) return "expression";
  return "other";
}

function enrichVocabulary(item: VocabularyItem, level: LevelId, chunks: string[]): RichVocabularyItem {
  const articleMatch = item.de.match(/^(der|die|das)\s/i);
  const article = articleMatch?.[1] as RichVocabularyItem["article"] | undefined;
  const lemma = stripArticle(item.de);
  return {
    ...item,
    article,
    lemma,
    partOfSpeech: inferPartOfSpeech(item),
    level,
    contextExample: `Das Wort „${item.de}“ gehört zum Thema dieses Moduls.`,
    chunks: chunks.filter((chunk) => chunk.toLowerCase().includes(lemma.toLowerCase())).slice(0, 3),
  };
}

function levelVocabulary(level: LevelId) {
  return unitsByLevel[level].flatMap((unit) => unit.vocab);
}

function levelGrammar(level: LevelId) {
  return unitsByLevel[level].flatMap((unit) => unit.grammar);
}

function moduleVocabulary(spec: ModuleSpec, moduleIndex: number) {
  const source = levelVocabulary(spec.level);
  const size = Math.ceil(source.length / 10);
  const start = moduleIndex * size;
  const picked = source.slice(start, start + size);
  const fallback = picked.length ? picked : source.slice(0, size);
  return fallback.map((item) => enrichVocabulary(item, spec.level, spec.chunks));
}

function moduleGrammar(spec: ModuleSpec, moduleIndex: number): GrammarTopic[] {
  const source = levelGrammar(spec.level);
  if (!source.length) return [];
  const first = source[(moduleIndex * 2) % source.length];
  const second = source[(moduleIndex * 2 + 1) % source.length];
  const topics = [first, second].filter(Boolean);
  return topics.map((topic, index) => ({
    ...topic,
    name: spec.grammarFocus[index] ?? topic.name,
  }));
}

function vocabularyForLesson(vocab: RichVocabularyItem[], lessonIndex: number) {
  if (vocab.length <= 8) return vocab;
  const start = (lessonIndex * 4) % vocab.length;
  return Array.from({ length: 8 }, (_, offset) => vocab[(start + offset) % vocab.length]);
}

function cleanDialogueLine(line: string) {
  return line.replace(/^[A-ZÄÖÜ]:\s*/, "").trim();
}

function makeReading(spec: ModuleSpec) {
  return {
    title: `${spec.title}: ${spec.readingGenre}`,
    genre: spec.readingGenre,
    text: spec.anchorText,
    preReading: [
      `Predict three words you expect in a ${spec.readingGenre} about ${spec.title.toLowerCase()}.`,
      `Read the chunks first: ${spec.chunks.slice(0, 2).join(" · ")}`,
    ],
    gistQuestion: "What is the main situation, problem or purpose of the text?",
    detailQuestions: [
      "Which two concrete details are important?",
      "What does the writer or speaker want, decide or conclude?",
      "Which expression shows time, reason, contrast or attitude?",
    ],
    languageFocus: [...spec.grammarFocus, ...spec.chunks.slice(0, 3)],
    afterReading: spec.writingTask,
  };
}

function makeListening(spec: ModuleSpec) {
  const script = spec.dialogue.join("\n");
  const clean = spec.dialogue.map(cleanDialogueLine);
  return {
    title: `${spec.title}: ${spec.listeningGenre}`,
    genre: spec.listeningGenre,
    script,
    gistQuestion: "What are the speakers trying to achieve or resolve?",
    detailQuestions: [
      "What key information does the first speaker give?",
      "What question, condition or problem appears?",
      "What is the final decision, answer or next step?",
    ],
    dictationLine: clean[Math.min(1, clean.length - 1)] ?? clean[0] ?? "",
    shadowingLine: clean[clean.length - 1] ?? clean[0] ?? "",
  };
}

function controlledTasks(
  spec: ModuleSpec,
  vocab: RichVocabularyItem[],
  lessonIndex: number,
): ControlledTask[] {
  const a = vocab[0];
  const b = vocab[1] ?? a;
  return [
    {
      id: `vocab-${lessonIndex}-1`,
      type: "short-answer",
      prompt: a ? `Write the German expression for: ${a.en}` : "Write one useful expression from this module.",
      answer: a?.de,
      hint: "Include the article when the item is a noun.",
    },
    {
      id: `vocab-${lessonIndex}-2`,
      type: "short-answer",
      prompt: b ? `Use „${b.de}“ in a sentence that fits the module context.` : "Write one context sentence.",
      hint: "Prefer a complete sentence rather than an isolated phrase.",
    },
    {
      id: `grammar-${lessonIndex}-1`,
      type: "transform",
      prompt: `Create one new sentence using: ${spec.grammarFocus[0]}.`,
      hint: "Change the subject, time expression or object so you are producing rather than copying.",
    },
    {
      id: `chunk-${lessonIndex}-1`,
      type: "fill",
      prompt: `Complete a realistic sentence with this chunk: ${spec.chunks[0]}.`,
      hint: "Keep the sentence appropriate to the stated CEFR level.",
    },
  ];
}

function checkpoint(vocab: RichVocabularyItem[]): QuizQuestion[] {
  return vocab.slice(0, 3).map((item, index) => {
    const pool = vocab.filter((other) => other.en !== item.en).slice(index, index + 3).map((other) => other.en);
    const options = [item.en, ...pool];
    while (options.length < 4) options.push("another meaning");
    return {
      q: `What does “${item.de}” mean in this course context?`,
      options,
      answer: item.en,
    };
  });
}

function moduleCompetencies(level: LevelId, moduleIndex: number) {
  const targetNumber = (moduleIndex % 3) + 1;
  return descriptorsForLevel(level)
    .filter((descriptor) => descriptor.id.endsWith(`-${targetNumber}`))
    .map((descriptor) => descriptor.id);
}

function lessonObjectives(spec: ModuleSpec, stage: CourseLesson["stage"]) {
  const stageGoals: Record<CourseLesson["stage"], string> = {
    input: "understand the situation and notice the core language before analysing it",
    grammar: "understand and deliberately manipulate the grammar needed in the module",
    lexis: "build usable vocabulary, chunks and collocations for the situation",
    reception: "extract gist, detail and language from connected reading and listening",
    production: "use the language in guided and freer writing and speaking",
    review: "retrieve the module language and demonstrate integrated control",
  };
  return [...spec.canDos, stageGoals[stage]];
}

function buildLesson(spec: ModuleSpec, moduleIndex: number, lessonIndex: number, vocabulary: RichVocabularyItem[], grammar: GrammarTopic[]): CourseLesson {
  const plan = stagePlan[lessonIndex];
  const lessonVocab = vocabularyForLesson(vocabulary, lessonIndex);
  const lessonGrammar = plan.stage === "grammar" ? grammar : grammar.slice(0, 1);
  const moduleNumber = moduleIndex + 1;
  const lessonNumber = lessonIndex + 1;
  const id = `${spec.level.toLowerCase()}-${String(moduleNumber).padStart(2, "0")}-${String(lessonNumber).padStart(2, "0")}`;

  return {
    id,
    level: spec.level,
    moduleSlug: spec.slug,
    moduleTitle: spec.title,
    moduleIndex: moduleNumber,
    lessonIndex: lessonNumber,
    slug: plan.slug,
    title: `${plan.title}: ${spec.title}`,
    stage: plan.stage,
    durationMinutes: plan.duration + (["B2", "C1"].includes(spec.level) ? 5 : 0),
    scenario: spec.scenario,
    objectives: lessonObjectives(spec, plan.stage),
    vocabulary: lessonVocab,
    grammar: lessonGrammar,
    chunks: spec.chunks,
    reading: makeReading(spec),
    listening: makeListening(spec),
    controlled: controlledTasks(spec, lessonVocab, lessonIndex),
    production: {
      writing: spec.writingTask,
      speaking: spec.speakingTask,
      checklist: [
        "Use language from this module rather than translating word-for-word.",
        `Include at least one example of ${spec.grammarFocus[0]}.`,
        "Check verb position, noun articles and endings before finishing.",
        "Make your meaning clear even if you need to simplify.",
      ],
    },
    checkpoint: checkpoint(lessonVocab),
    competencyIds: moduleCompetencies(spec.level, moduleIndex),
  };
}

export const courseModules: CourseModule[] = levelOrder.flatMap((level) =>
  moduleSpecs
    .filter((spec) => spec.level === level)
    .map((spec, index) => {
      const vocabulary = moduleVocabulary(spec, index);
      const grammar = moduleGrammar(spec, index);
      const lessons = stagePlan.map((_, lessonIndex) => buildLesson(spec, index, lessonIndex, vocabulary, grammar));
      return {
        ...spec,
        index: index + 1,
        lessons,
        vocabulary,
        grammar,
        competencyIds: moduleCompetencies(level, index),
      };
    }),
);

export const courseLessons = courseModules.flatMap((module) => module.lessons);

export const allRichVocabulary = Array.from(
  new Map(
    courseModules
      .flatMap((module) => module.vocabulary)
      .map((item) => [`${item.level}:${item.de.toLowerCase()}`, item] as const),
  ).values(),
);

export const allCurriculumGrammar = levelOrder.flatMap((level) =>
  levelGrammar(level).map((topic) => ({ ...topic, level })),
);

export function getModulesByLevel(level: LevelId) {
  return courseModules.filter((module) => module.level === level);
}

export function getModule(level: string, moduleSlug: string) {
  return courseModules.find(
    (module) => module.level.toLowerCase() === level.toLowerCase() && module.slug === moduleSlug,
  );
}

export function getLesson(level: string, moduleSlug: string, lessonSlug: string) {
  return getModule(level, moduleSlug)?.lessons.find((lesson) => lesson.slug === lessonSlug);
}

export function getAdjacentLessons(lesson: CourseLesson) {
  const index = courseLessons.findIndex((item) => item.id === lesson.id);
  return {
    previous: index > 0 ? courseLessons[index - 1] : undefined,
    next: index < courseLessons.length - 1 ? courseLessons[index + 1] : undefined,
  };
}

export function lessonsForSkill(skill: "reading" | "listening" | "speaking" | "writing") {
  const stageBySkill = {
    reading: "reception",
    listening: "reception",
    speaking: "production",
    writing: "production",
  } as const;
  return courseLessons.filter((lesson) => lesson.stage === stageBySkill[skill]);
}

export function competencyById(id: string) {
  return cefrDescriptors.find((descriptor) => descriptor.id === id);
}

export const levelAssessments: LevelAssessment[] = levelOrder.map((level) => {
  const modules = getModulesByLevel(level);
  const finalModule = modules[modules.length - 1];
  const levelLessons = courseLessons.filter((lesson) => lesson.level === level);
  const questions = levelLessons
    .filter((lesson) => lesson.stage === "review")
    .flatMap((lesson) => lesson.checkpoint)
    .slice(0, 12);

  return {
    level,
    title: `${level} integrated assessment`,
    description: "A multi-skill checkpoint covering reading, listening, vocabulary/grammar, writing and speaking.",
    reading: finalModule.lessons[3].reading,
    listening: finalModule.lessons[3].listening,
    writingTask: finalModule.writingTask,
    speakingTask: finalModule.speakingTask,
    questions,
    competencyIds: descriptorsForLevel(level).map((item) => item.id),
  };
});

export const curriculumStats = {
  levels: levelOrder.length,
  modules: courseModules.length,
  lessons: courseLessons.length,
  vocabulary: allRichVocabulary.length,
  grammarTopics: allCurriculumGrammar.length,
  descriptors: cefrDescriptors.length,
  skills: skillOrder.length,
};
