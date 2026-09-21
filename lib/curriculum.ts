import a1 from "./content/a1.json";
import a2 from "./content/a2.json";
import b1 from "./content/b1.json";
import b2 from "./content/b2.json";
import c1 from "./content/c1.json";
import { cefrDescriptors, descriptorsForLevel, skillOrder } from "./cefr";
import { moduleSpecs } from "./module-specs";
import { readingExtensions } from "./extended-content";
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

const vocabularySourceUnit: Record<string, number> = {
  "A1:introductions": 0,
  "A1:family-people": 2,
  "A1:time-appointments": 1,
  "A1:food-restaurants": 3,
  "A1:daily-routine": 4,
  "A1:home-city": 5,
  "A1:shopping-services": 3,
  "A1:travel-transport": 7,
  "A1:health": 7,
  "A1:work-study": 1,
  "A2:past-experiences": 0,
  "A2:housing-moving": 2,
  "A2:health-appointments": 3,
  "A2:travel-problems": 7,
  "A2:work-routines": 1,
  "A2:learning-education": 6,
  "A2:media-technology": 7,
  "A2:social-life": 3,
  "A2:consumer-life": 4,
  "A2:plans-future": 6,
  "B1:narrating": 0,
  "B1:career": 1,
  "B1:education": 2,
  "B1:wellbeing": 5,
  "B1:environment": 4,
  "B1:media-opinion": 7,
  "B1:travel-culture": 3,
  "B1:housing-admin": 4,
  "B1:community": 6,
  "B1:problems-solutions": 5,
  "B2:argumentation": 7,
  "B2:professional-work": 0,
  "B2:technology": 2,
  "B2:society": 1,
  "B2:climate-environment": 0,
  "B2:media-communication": 1,
  "B2:education-policy": 4,
  "B2:economy-consumer": 6,
  "B2:culture-identity": 7,
  "B2:presentations": 7,
  "C1:academic-discourse": 2,
  "C1:formal-writing": 0,
  "C1:nuanced-argument": 1,
  "C1:data-reports": 5,
  "C1:negotiation": 0,
  "C1:media-analysis": 3,
  "C1:science-ethics": 6,
  "C1:institutions-society": 4,
  "C1:presentations-debate": 7,
  "C1:synthesis-mastery": 6,
};

const grammarSourceUnit: Record<string, number> = {
  "A1:introductions": 0,
  "A1:family-people": 2,
  "A1:time-appointments": 1,
  "A1:food-restaurants": 3,
  "A1:daily-routine": 4,
  "A1:home-city": 5,
  "A1:shopping-services": 3,
  "A1:travel-transport": 7,
  "A1:health": 6,
  "A1:work-study": 1,
  "A2:past-experiences": 0,
  "A2:housing-moving": 2,
  "A2:health-appointments": 3,
  "A2:travel-problems": 5,
  "A2:work-routines": 1,
  "A2:learning-education": 6,
  "A2:media-technology": 7,
  "A2:social-life": 3,
  "A2:consumer-life": 4,
  "A2:plans-future": 6,
  "B1:narrating": 0,
  "B1:career": 1,
  "B1:education": 2,
  "B1:wellbeing": 5,
  "B1:environment": 4,
  "B1:media-opinion": 7,
  "B1:travel-culture": 6,
  "B1:housing-admin": 4,
  "B1:community": 6,
  "B1:problems-solutions": 5,
  "B2:argumentation": 4,
  "B2:professional-work": 0,
  "B2:technology": 2,
  "B2:society": 1,
  "B2:climate-environment": 0,
  "B2:media-communication": 1,
  "B2:education-policy": 4,
  "B2:economy-consumer": 6,
  "B2:culture-identity": 7,
  "B2:presentations": 3,
  "C1:academic-discourse": 2,
  "C1:formal-writing": 0,
  "C1:nuanced-argument": 1,
  "C1:data-reports": 2,
  "C1:negotiation": 1,
  "C1:media-analysis": 3,
  "C1:science-ethics": 6,
  "C1:institutions-society": 4,
  "C1:presentations-debate": 7,
  "C1:synthesis-mastery": 6,
};

function sourceKey(spec: ModuleSpec) {
  return spec.level + ":" + spec.slug;
}

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

function enrichVocabulary(item: VocabularyItem, spec: ModuleSpec): RichVocabularyItem {
  const articleMatch = item.de.match(/^(der|die|das)\s/i);
  const article = articleMatch?.[1] as RichVocabularyItem["article"] | undefined;
  const lemma = stripArticle(item.de);
  const corpus = [spec.anchorText, ...spec.dialogue.map(cleanDialogueLine)];
  const needle = lemma.toLocaleLowerCase("de-DE");
  const contextualSentence = corpus
    .flatMap((entry) => entry.split(/(?<=[.!?])\s+/))
    .find((sentence) => sentence.toLocaleLowerCase("de-DE").includes(needle));
  const matchingChunks = spec.chunks.filter((chunk) =>
    chunk.toLocaleLowerCase("de-DE").includes(needle),
  );

  return {
    ...item,
    article,
    lemma,
    partOfSpeech: inferPartOfSpeech(item),
    level: spec.level,
    contextExample:
      contextualSentence ??
      `Kurskontext: Verwende „${item.de}“ in einer eigenen Aussage zum Thema „${spec.title}“.`,
    chunks: (matchingChunks.length ? matchingChunks : spec.chunks.slice(0, 2)).slice(0, 3),
  };
}

function levelVocabulary(level: LevelId) {
  return unitsByLevel[level].flatMap((unit) => unit.vocab);
}

function levelGrammar(level: LevelId) {
  return unitsByLevel[level].flatMap((unit) => unit.grammar);
}

function sourceUnit(spec: ModuleSpec, map: Record<string, number>) {
  const units = unitsByLevel[spec.level];
  const index = map[sourceKey(spec)];
  return units[Math.max(0, Math.min(units.length - 1, index ?? 0))];
}

function moduleVocabulary(spec: ModuleSpec) {
  const unit = sourceUnit(spec, vocabularySourceUnit);
  return unit.vocab.map((item) => enrichVocabulary(item, spec));
}

function moduleGrammar(spec: ModuleSpec): GrammarTopic[] {
  const unit = sourceUnit(spec, grammarSourceUnit);
  // Preserve the source topic names. Never relabel an inherited explanation as a
  // different grammar rule merely to make the heading fit the module scenario.
  return unit.grammar.map((topic) => ({ ...topic }));
}

function vocabularyForLesson(vocab: RichVocabularyItem[], lessonIndex: number) {
  if (vocab.length <= 8) return vocab;
  const start = (lessonIndex * 4) % vocab.length;
  return Array.from({ length: 8 }, (_, offset) => vocab[(start + offset) % vocab.length]);
}

function cleanDialogueLine(line: string) {
  return line.replace(/^[A-ZÄÖÜ]:\s*/, "").trim();
}

function extendedText(spec: ModuleSpec) {
  const extension = readingExtensions[sourceKey(spec)];
  return [spec.anchorText, extension].filter(Boolean).join("\n\n");
}

function makeReading(spec: ModuleSpec, grammar: GrammarTopic[]) {
  return {
    title: `${spec.title}: ${spec.readingGenre}`,
    genre: spec.readingGenre,
    text: extendedText(spec),
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
    languageFocus: [...grammar.map((topic) => topic.name), ...spec.chunks.slice(0, 3)],
    afterReading: spec.writingTask,
  };
}

function makeListening(spec: ModuleSpec) {
  const clean = spec.dialogue.map(cleanDialogueLine);
  const script = [
    spec.dialogue.join("\n"),
    "Sprecher/in: " + extendedText(spec),
  ].join("\n\n");
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
  grammar: GrammarTopic[],
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
      prompt: `Create one new sentence using: ${grammar[0]?.name ?? "the module grammar"}.`,
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

function rotateOptions(options: string[], shift: number) {
  const unique = [...new Set(options)];
  const normalised = unique.length ? shift % unique.length : 0;
  return [...unique.slice(normalised), ...unique.slice(0, normalised)];
}

function checkpoint(vocab: RichVocabularyItem[], grammar: GrammarTopic[]): QuizQuestion[] {
  const vocabQuestions = vocab.slice(0, 2).map((item, index) => {
    const pool = vocab
      .filter((other) => other.en !== item.en)
      .slice(index, index + 3)
      .map((other) => other.en);
    const options = rotateOptions([item.en, ...pool], index + 1);
    return {
      q: `What does “${item.de}” mean in this course context?`,
      options,
      answer: item.en,
    };
  });

  const grammarTopic = grammar[0];
  if (!grammarTopic?.examples?.length) return vocabQuestions;

  const correct = grammarTopic.examples[0];
  const distractors = grammar
    .flatMap((topic) => topic.examples)
    .filter((example) => example !== correct)
    .slice(0, 3);
  const fallback = vocab
    .slice(0, 3)
    .map((item) => item.de)
    .filter((item) => item !== correct);
  const options = rotateOptions(
    [correct, ...distractors, ...fallback].slice(0, 4),
    2,
  );

  return [
    ...vocabQuestions,
    {
      q: `Which sentence is an example used to teach “${grammarTopic.name}” in this module?`,
      options,
      answer: correct,
    },
  ];
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
    reading: makeReading(spec, grammar),
    listening: makeListening(spec),
    controlled: controlledTasks(spec, lessonVocab, grammar, lessonIndex),
    production: {
      writing: spec.writingTask,
      speaking: spec.speakingTask,
      checklist: [
        "Use language from this module rather than translating word-for-word.",
        `Include at least one example of ${grammar[0]?.name ?? "the module grammar"}.`,
        "Check verb position, noun articles and endings before finishing.",
        "Make your meaning clear even if you need to simplify.",
      ],
    },
    checkpoint: checkpoint(lessonVocab, grammar),
    competencyIds: moduleCompetencies(spec.level, moduleIndex),
  };
}

export const courseModules: CourseModule[] = levelOrder.flatMap((level) =>
  moduleSpecs
    .filter((spec) => spec.level === level)
    .map((spec, index) => {
      const vocabulary = moduleVocabulary(spec);
      const grammar = moduleGrammar(spec);
      const lessons = stagePlan.map((_, lessonIndex) => buildLesson(spec, index, lessonIndex, vocabulary, grammar));
      return {
        ...spec,
        grammarFocus: grammar.map((topic) => topic.name),
        index: index + 1,
        lessons,
        vocabulary,
        grammar,
        competencyIds: moduleCompetencies(level, index),
      };
    }),
);

export const courseLessons = courseModules.flatMap((module) => module.lessons);

function vocabularySpecForSource(level: LevelId, sourceUnitIndex: number) {
  return (
    moduleSpecs.find(
      (spec) =>
        spec.level === level &&
        vocabularySourceUnit[sourceKey(spec)] === sourceUnitIndex,
    ) ??
    moduleSpecs.find((spec) => spec.level === level)!
  );
}

const completeVocabularyCorpus = levelOrder.flatMap((level) =>
  unitsByLevel[level].flatMap((unit, sourceUnitIndex) => {
    const spec = vocabularySpecForSource(level, sourceUnitIndex);
    return unit.vocab.map((item) => enrichVocabulary(item, spec));
  }),
);

export const allRichVocabulary = Array.from(
  new Map(
    completeVocabularyCorpus.map(
      (item) => [`${item.level}:${item.de.toLowerCase()}`, item] as const,
    ),
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
