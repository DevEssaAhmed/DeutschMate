import type { ControlledTask, QuizQuestion, VocabularyItem } from "./types";

// The first contact with German is deliberately smaller than a normal A1 reading.
// Learners meet these forms before the full introductions text in the reception lesson.
export const beginnerOnramp = {
  soundNotes: [
    { pattern: "ei", example: "heiße", en: "Sounds like the English word ‘eye’." },
    { pattern: "ie", example: "Wie", en: "Sounds like a long ‘ee’." },
    { pattern: "ß", example: "heiße", en: "Sounds like ‘ss’." },
  ],
  phraseCards: [
    { de: "Hallo!", en: "Hello!", note: "A simple greeting." },
    { de: "Ich heiße …", en: "My name is …", note: "Put your name after heiße." },
    { de: "Wie heißen Sie?", en: "What is your name?", note: "A polite way to ask a new person." },
    { de: "Freut mich!", en: "Nice to meet you!", note: "Say this after someone tells you their name." },
  ],
  microDialogue: [
    { speaker: "Lara", de: "Hallo! Ich heiße Lara. Wie heißen Sie?", en: "Hello! My name is Lara. What is your name?" },
    { speaker: "Amir", de: "Ich heiße Amir.", en: "My name is Amir." },
    { speaker: "Lara", de: "Freut mich!", en: "Nice to meet you!" },
  ],
  gist: {
    question: "What are Lara and Amir doing?",
    choices: ["Introducing themselves", "Ordering food", "Buying train tickets"],
    answer: "Introducing themselves",
    explanation: "They greet each other and say their names.",
  },
} as const;

export const beginnerVocabulary: VocabularyItem[] = [
  { de: "hallo", en: "hello" },
  { de: "ich", en: "I" },
  { de: "heißen", en: "to be called" },
  { de: "der Name", en: "name" },
  { de: "Ich heiße …", en: "My name is …" },
  { de: "Wie heißen Sie?", en: "What is your name? (polite)" },
  { de: "Freut mich!", en: "Nice to meet you!" },
  { de: "Sie", en: "you (polite)" },
];

export const firstLessonControlled: ControlledTask[] = [
  {
    id: "vocab-0-1",
    type: "choice",
    prompt: "Which German word means ‘hello’?",
    options: ["Hallo!", "Danke.", "Tschüss."],
    answer: "Hallo!",
    hint: "Look at the first phrase card.",
  },
  {
    id: "vocab-0-2",
    type: "order",
    prompt: "Put these words in order to say ‘My name is Lara.’",
    options: ["heiße", "Ich", "Lara."],
    answer: "Ich heiße Lara.",
    hint: "Start with Ich.",
  },
  {
    id: "vocab-0-3",
    type: "fill",
    prompt: "Complete the polite question: Wie ___ Sie?",
    answer: "heißen",
    hint: "The full phrase is on a phrase card.",
  },
];

export const firstLessonCheckpoint: QuizQuestion[] = [
  {
    q: "What does ‘Hallo!’ mean?",
    options: ["Hello!", "Goodbye!", "Thank you!"],
    answer: "Hello!",
    skill: "vocabulary",
  },
  {
    q: "Which phrase tells someone your name?",
    options: ["Wie heißen Sie?", "Ich heiße Lara.", "Freut mich!"],
    answer: "Ich heiße Lara.",
    skill: "vocabulary",
  },
  {
    q: "What does ‘Wie heißen Sie?’ ask?",
    options: ["Where do you live?", "What is your name?", "Which languages do you speak?"],
    answer: "What is your name?",
    skill: "vocabulary",
  },
];
