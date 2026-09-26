import a1 from "./content/a1.json";
import a2 from "./content/a2.json";
import b1 from "./content/b1.json";
import b2 from "./content/b2.json";
import c1 from "./content/c1.json";
import { a1HealthGrammar, a1ShoppingGrammar, a1TravelExtras, a1VocabularySupplements } from "./a1-module-supplements";
import { beginnerOnramp, firstLessonCheckpoint, firstLessonControlled } from "./beginner-onramp";
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
  { slug: "input", stage: "input", title: "Context & input", duration: 40 },
  { slug: "grammar", stage: "grammar", title: "Grammar workshop", duration: 35 },
  { slug: "lexis", stage: "lexis", title: "Vocabulary & chunks", duration: 30 },
  { slug: "reception", stage: "reception", title: "Reading & listening lab", duration: 45 },
  { slug: "production", stage: "production", title: "Guided production", duration: 40 },
  { slug: "review", stage: "review", title: "Review & checkpoint", duration: 35 },
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
  if (spec.level === "A1") {
    const authored = a1VocabularySupplements[spec.slug];
    if (authored) return authored.map((item) => enrichVocabulary(item, spec));
    if (spec.slug === "travel-transport") {
      const source = sourceUnit(spec, vocabularySourceUnit).vocab.filter((item) =>
        !["krank", "der Arzt", "die Hilfe"].includes(item.de));
      return [...source, ...a1TravelExtras].map((item) => enrichVocabulary(item, spec));
    }
  }
  const unit = sourceUnit(spec, vocabularySourceUnit);
  return unit.vocab.map((item) => enrichVocabulary(item, spec));
}

function moduleGrammar(spec: ModuleSpec): GrammarTopic[] {
  if (spec.level === "A1") {
    if (spec.slug === "shopping-services") return a1ShoppingGrammar.map((topic) => ({ ...topic }));
    if (spec.slug === "health") return a1HealthGrammar.map((topic) => ({ ...topic }));
    if (spec.slug === "travel-transport") {
      return [unitsByLevel.A1[6].grammar[0], unitsByLevel.A1[7].grammar[1]].map((topic) => ({ ...topic }));
    }
    if (spec.slug === "work-study") {
      return [unitsByLevel.A1[1].grammar[0], unitsByLevel.A1[7].grammar[0]].map((topic) => ({ ...topic }));
    }
  }
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

function isBeginnerInput(spec: ModuleSpec, stage: CourseLesson["stage"]) {
  return spec.level === "A1" && spec.slug === "introductions" && stage === "input";
}

function inputReadingText(spec: ModuleSpec) {
  if (spec.level !== "A1") return spec.anchorText;
  // A1 modules introduce a short extract before the fuller reception lesson.
  return spec.anchorText.split(/(?<=[.!?])\s+/).slice(0, 2).join(" ");
}

const readingQuestions: Record<LevelId, { gist: string; detail: string[] }> = {
  A1: {
    gist: "Who is involved, and what everyday situation are they in?",
    detail: ["Name two concrete details from the text.", "What does one person want or do next?", "Find one useful time or place expression."],
  },
  A2: {
    gist: "What happened or needs to happen, and why?",
    detail: ["Which two details explain the situation?", "What plan, request or decision follows?", "Find a phrase that connects a reason, time or condition."],
  },
  B1: {
    gist: "What is the main point, and which detail supports it?",
    detail: ["Which facts are essential to the writer's point?", "What is implied but not stated directly?", "How does one connector link two ideas?"],
  },
  B2: {
    gist: "What problem or position is presented, and what supports it?",
    detail: ["Which evidence or example carries the argument?", "What qualification or counterpoint appears?", "How does the wording signal the writer's stance?"],
  },
  C1: {
    gist: "What claim is advanced, with what degree of certainty and limitation?",
    detail: ["Separate the central observation from the writer's inference.", "Which assumption or alternative explanation matters?", "How do register and phrasing shape the argument?"],
  },
};

const listeningQuestions: Record<LevelId, { gist: string; detail: string[] }> = {
  A1: {
    gist: "What are the speakers talking about?",
    detail: ["What does the first speaker say or ask?", "Which name, place, time or other detail do you hear?", "How does the conversation end?"],
  },
  A2: {
    gist: "What are the speakers planning or trying to solve?",
    detail: ["What information does the first speaker give?", "What question or problem comes up?", "What do they agree to do next?"],
  },
  B1: {
    gist: "What is the main issue in this exchange?",
    detail: ["What reason or example does each speaker give?", "Does either speaker change or qualify a view?", "What conclusion or next step follows?"],
  },
  B2: {
    gist: "What are the speakers trying to resolve, and where do they differ?",
    detail: ["Which conditions or evidence matter to the discussion?", "What objection or qualification is raised?", "How is the final position framed?"],
  },
  C1: {
    gist: "What positions do the speakers take, and what remains uncertain?",
    detail: ["What is stated as fact and what is inferred?", "Which assumption or trade-off shapes the exchange?", "How does each speaker signal certainty or caution?"],
  },
};

function makeReading(spec: ModuleSpec, grammar: GrammarTopic[], stage: CourseLesson["stage"]) {
  const questions = readingQuestions[spec.level];
  const firstContact = isBeginnerInput(spec, stage);
  const prediction = spec.level === "A1" || spec.level === "A2"
    ? `Predict three words you expect in a ${spec.readingGenre} about ${spec.title.toLowerCase()}.`
    : `Before reading this ${spec.readingGenre}, predict the likely purpose, audience and one point of tension.`;
  return {
    title: `${spec.title}: ${spec.readingGenre}`,
    genre: spec.readingGenre,
    text: firstContact
      ? beginnerOnramp.microDialogue.map((line) => `${line.speaker}: ${line.de}`).join("\n")
      : stage === "input" ? inputReadingText(spec) : extendedText(spec),
    preReading: firstContact
      ? ["First listen to and say the greeting and name phrases.", "Read just three short lines. The English meaning is beside each line."]
      : [prediction, `Read the chunks first: ${spec.chunks.slice(0, 2).join(" · ")}`],
    gistQuestion: firstContact ? beginnerOnramp.gist.question : questions.gist,
    detailQuestions: firstContact
      ? ["Who says their name first?", "What is the polite name question?", "What does ‘Freut mich!’ mean?"]
      : questions.detail,
    languageFocus: firstContact
      ? beginnerOnramp.phraseCards.map((card) => card.de)
      : [...grammar.map((topic) => topic.name), ...spec.chunks.slice(0, 3)],
    afterReading: spec.writingTask,
  };
}

function makeListening(spec: ModuleSpec, stage: CourseLesson["stage"]) {
  const firstContact = isBeginnerInput(spec, stage);
  const clean = firstContact
    ? beginnerOnramp.microDialogue.map((line) => line.de)
    : spec.dialogue.map(cleanDialogueLine);
  const questions = listeningQuestions[spec.level];
  const script = firstContact
    ? beginnerOnramp.microDialogue.map((line) => `${line.speaker}: ${line.de}`).join("\n")
    : stage === "input"
    ? spec.dialogue.join("\n")
    : [spec.dialogue.join("\n"), "Sprecher/in: " + extendedText(spec)].join("\n\n");
  return {
    title: `${spec.title}: ${spec.listeningGenre}`,
    genre: spec.listeningGenre,
    script,
    gistQuestion: firstContact ? beginnerOnramp.gist.question : questions.gist,
    detailQuestions: firstContact
      ? ["What name do you hear after Lara speaks?", "Which word opens the exchange?", "Which phrase closes it?"]
      : questions.detail,
    dictationLine: clean[Math.min(1, clean.length - 1)] ?? clean[0] ?? "",
    shadowingLine: clean[clean.length - 1] ?? clean[0] ?? "",
  };
}

function controlledTasks(
  spec: ModuleSpec,
  vocab: RichVocabularyItem[],
  grammar: GrammarTopic[],
  lessonIndex: number,
  stage: CourseLesson["stage"],
): ControlledTask[] {
  const a = vocab[0];
  const b = vocab[1] ?? a;
  const focus = stage === "production" || stage === "review" ? grammar[1] ?? grammar[0] : grammar[0];
  const grammarName = focus?.name ?? spec.grammarFocus[0];
  const grammarExample = focus?.examples[0];
  const context = spec.scenario;
  const usagePrompts: Record<CourseLesson["stage"], string> = {
    input: `Add one natural line to the conversation about ${context}, using „${b?.de ?? spec.chunks[0]}“.`,
    grammar: `Write a sentence about ${context} using „${b?.de ?? spec.chunks[0]}“ and the pattern ${grammarName}.`,
    lexis: `Combine „${b?.de ?? spec.chunks[0]}“ with one useful chunk from this module in a natural sentence about ${context}.`,
    reception: `Write a plausible follow-up to the reading or listening about ${context}, using „${b?.de ?? spec.chunks[0]}“.`,
    production: `Write an opening line for your response to this task, using „${b?.de ?? spec.chunks[0]}“: ${spec.writingTask}`,
    review: `Without copying the source text, use „${b?.de ?? spec.chunks[0]}“ to say something new about ${context}.`,
  };
  const grammarPrompts: Record<CourseLesson["stage"], string> = {
    input: `Notice the pattern ${grammarName}${grammarExample ? ` in „${grammarExample}“` : ""}. Write one new German example for ${context}.`,
    grammar: `Write two different German sentences about ${context} using ${grammarName}. Change the subject, time or object between them.`,
    lexis: `Use ${grammarName} together with „${spec.chunks[0]}“ in an original sentence about ${context}.`,
    reception: `Write a new sentence about a detail in the reading or listening using ${grammarName}.`,
    production: `Write one sentence for your own response to „${spec.writingTask}“ that shows ${grammarName}.`,
    review: `Without looking back, use ${grammarName} in a new sentence about ${context}.`,
  };
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
      prompt: usagePrompts[stage],
      hint: spec.level === "A1" ? "A short complete sentence is enough." : "Make the meaning and situation clear in a complete sentence.",
    },
    {
      id: `grammar-${lessonIndex}-1`,
      type: "transform",
      prompt: grammarPrompts[stage],
      hint: "Produce your own wording. Copying a source example does not show control of the pattern.",
    },
    {
      id: `chunk-${lessonIndex}-1`,
      type: "fill",
      prompt: `Use „${spec.chunks[(lessonIndex + 1) % spec.chunks.length]}“ in a realistic response for ${context}.`,
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
      skill: "vocabulary" as const,
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
      skill: "grammar",
    },
  ];
}

function moduleCompetencies(level: LevelId, moduleIndex: number) {
  const targetNumber = (moduleIndex % 3) + 1;
  return descriptorsForLevel(level)
    .filter((descriptor) => descriptor.id.endsWith(`-${targetNumber}`))
    .map((descriptor) => descriptor.id);
}

function lessonCompetencies(level: LevelId, moduleIndex: number, stage: CourseLesson["stage"]) {
  const relevantSkills = stage === "input" || stage === "reception"
    ? ["reading", "writing", "grammar", "vocabulary"]
    : ["writing", "grammar", "vocabulary"];
  return moduleCompetencies(level, moduleIndex).filter((id) => relevantSkills.some((skill) => id.includes(`-${skill}-`)));
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

const outputGuidance: Record<LevelId, { short: string; full: string; transfer: string; check: string }> = {
  A1: {
    short: "Write 2–3 short German sentences.",
    full: "Aim for about 40–60 words.",
    transfer: "Make one clear statement or request and add a concrete detail.",
    check: "Check that your verb and noun article fit each sentence.",
  },
  A2: {
    short: "Write 4 connected German sentences.",
    full: "Aim for about 70–100 words.",
    transfer: "Give a reason and explain the next step.",
    check: "Connect ideas clearly and check verb position after your connectors.",
  },
  B1: {
    short: "Write one coherent German paragraph.",
    full: "Aim for about 110–150 words.",
    transfer: "Support your point with a reason and a concrete example.",
    check: "Organise the paragraph and check tense and reference across sentences.",
  },
  B2: {
    short: "Write one developed German paragraph.",
    full: "Aim for about 160–220 words in connected paragraphs.",
    transfer: "Acknowledge a contrasting view or practical constraint.",
    check: "Check argument flow, register and the precision of your connectors.",
  },
  C1: {
    short: "Write one precise analytical paragraph in German.",
    full: "Aim for about 220–300 words in a structured response.",
    transfer: "Qualify a claim and distinguish observation from inference.",
    check: "Check nuance, register and whether each conclusion is supported.",
  },
};

function writingForStage(spec: ModuleSpec, stage: CourseLesson["stage"], grammar: GrammarTopic[]) {
  const guide = outputGuidance[spec.level];
  const chunkPair = spec.chunks.slice(0, 2).map((chunk) => `„${chunk}“`).join(" and ");
  const inputGoal = spec.level === "A1" || spec.level === "A2"
    ? `Say who or what the text is about and what happens in ${spec.scenario}.`
    : `Summarise the central issue and communicative purpose in ${spec.scenario}.`;
  const prompts: Record<CourseLesson["stage"], string> = {
    input: `${guide.short} ${inputGoal} Use „${spec.chunks[0]}“ naturally.`,
    grammar: `${guide.short} Respond to ${spec.scenario} using ${grammar[0]?.name ?? spec.grammarFocus[0]} in your own words.`,
    lexis: `${guide.short} Write a useful response for ${spec.scenario}. Work in ${chunkPair} naturally.`,
    reception: `${guide.short} Explain one important detail from the reading and another from the listening. Show how they fit together.`,
    production: `${spec.writingTask} ${guide.full} ${guide.transfer}`,
    review: `${guide.short} Return to ${spec.scenario}, but change one important detail such as the person, constraint or audience. Respond afresh using two module chunks. ${guide.transfer}`,
  };
  return prompts[stage];
}

const speakingGuidance: Record<LevelId, { short: string; full: string; review: string }> = {
  A1: {
    short: "Use two or three short, complete German sentences.",
    full: "Speak clearly in short sentences and ask or answer one follow-up question.",
    review: "Add one new personal detail without reading a script.",
  },
  A2: {
    short: "Give a short connected response with a time, place or reason.",
    full: "Connect your ideas, explain a reason and state a next step.",
    review: "Adjust your response when one plan or detail changes.",
  },
  B1: {
    short: "State your point, then add a reason and a concrete example.",
    full: "Organise your response with an opening, a reason, an example and a conclusion.",
    review: "Answer a follow-up question without starting your prepared response again.",
  },
  B2: {
    short: "Develop a point and acknowledge a contrasting view or constraint.",
    full: "Present a position, support it and respond to a plausible objection.",
    review: "Reframe your position for a different audience and address one challenge.",
  },
  C1: {
    short: "Make a precise claim, qualify it and identify what remains uncertain.",
    full: "Present a nuanced argument, weigh evidence and respond to a strong counterpoint.",
    review: "Defend or revise your conclusion after a challenge while keeping your register appropriate.",
  },
};

function speakingForStage(spec: ModuleSpec, stage: CourseLesson["stage"], grammar: GrammarTopic[]) {
  const guide = speakingGuidance[spec.level];
  const grammarName = grammar[0]?.name ?? spec.grammarFocus[0];
  const grammarPractice = spec.level === "A1" || spec.level === "A2"
    ? `Speak about ${spec.scenario} using ${grammarName} in two original examples.`
    : `Make a point about ${spec.scenario}, then reformulate or qualify it using ${grammarName}.`;
  const prompts: Record<CourseLesson["stage"], string> = {
    input: `After the short dialogue, explain the situation in your own words: ${spec.scenario}. ${guide.short}`,
    grammar: `${grammarPractice} ${guide.short}`,
    lexis: `Make a short spoken exchange for ${spec.scenario}. Use „${spec.chunks[0]}“ and „${spec.chunks[1]}“ naturally. ${guide.short}`,
    reception: `Retell the main point of the listening and one important detail from the reading about ${spec.scenario}. ${guide.short}`,
    production: `${spec.speakingTask} ${guide.full}`,
    review: `Without reading a script, revisit ${spec.scenario} after changing one important detail. ${guide.review}`,
  };
  return prompts[stage];
}

function productionChecklist(spec: ModuleSpec, grammar: GrammarTopic[]) {
  const guide = outputGuidance[spec.level];
  return [
    "Answer the communicative task with your own details.",
    `Use ${grammar[0]?.name ?? spec.grammarFocus[0]} where it helps your meaning.`,
    guide.transfer,
    guide.check,
  ];
}

function buildLesson(spec: ModuleSpec, moduleIndex: number, lessonIndex: number, vocabulary: RichVocabularyItem[], grammar: GrammarTopic[]): CourseLesson {
  const plan = stagePlan[lessonIndex];
  const firstContact = isBeginnerInput(spec, plan.stage);
  const lessonVocab = firstContact
    ? ["hallo", "der Name", "heißen", "kommen", "wohnen", "sprechen", "wer", "wo"]
      .map((term) => vocabulary.find((item) => item.de === term))
      .filter((item): item is RichVocabularyItem => Boolean(item))
    : vocabularyForLesson(vocabulary, lessonIndex);
  const lessonGrammar = firstContact ? [] : plan.stage === "grammar" ? grammar : grammar.slice(0, 1);
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
    objectives: firstContact
      ? ["recognise and say a greeting", "give your name with Ich heiße …", "understand a three-line introduction"]
      : lessonObjectives(spec, plan.stage),
    vocabulary: lessonVocab,
    grammar: lessonGrammar,
    chunks: spec.chunks,
    reading: makeReading(spec, grammar, plan.stage),
    listening: makeListening(spec, plan.stage),
    controlled: firstContact
      ? firstLessonControlled
      : controlledTasks(spec, lessonVocab, grammar, lessonIndex, plan.stage),
    production: {
      writing: firstContact
        ? "Write a two-line greeting with your own name. Start with ‘Hallo! Ich heiße …’ and end with ‘Freut mich!’"
        : writingForStage(spec, plan.stage, grammar),
      speaking: firstContact
        ? "Say ‘Hallo! Ich heiße …’ with your own name. Then say ‘Freut mich!’ Speak at your own pace."
        : speakingForStage(spec, plan.stage, grammar),
      checklist: firstContact
        ? ["Say hello.", "Use your own name after Ich heiße.", "End with Freut mich."]
        : productionChecklist(spec, grammar),
    },
    checkpoint: firstContact ? firstLessonCheckpoint : checkpoint(lessonVocab, grammar),
    competencyIds: lessonCompetencies(spec.level, moduleIndex, plan.stage),
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
    [...completeVocabularyCorpus, ...courseModules.flatMap((module) => module.vocabulary)].map(
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
