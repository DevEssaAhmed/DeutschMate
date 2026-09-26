import type { GrammarTopic, VocabularyItem } from "./types";

// The retained A1 source has eight units for ten modules. These authored sets
// prevent shopping, health and work lessons from inheriting unrelated word lists.
export const a1VocabularySupplements: Record<string, VocabularyItem[]> = {
  "shopping-services": [
    { de: "die Jacke", en: "jacket" },
    { de: "der Pullover", en: "sweater" },
    { de: "das Hemd", en: "shirt" },
    { de: "die Hose", en: "trousers" },
    { de: "das Kleid", en: "dress" },
    { de: "die Größe", en: "size" },
    { de: "die Farbe", en: "colour" },
    { de: "schwarz", en: "black" },
    { de: "blau", en: "blue" },
    { de: "suchen", en: "to look for" },
    { de: "anprobieren", en: "to try on" },
    { de: "passen", en: "to fit" },
    { de: "zu groß", en: "too big" },
    { de: "zu klein", en: "too small" },
    { de: "der Preis", en: "price" },
    { de: "mit Karte bezahlen", en: "to pay by card" },
    { de: "der Kassenbon", en: "receipt" },
    { de: "die Verkäuferin", en: "shop assistant" },
  ],
  "health": [
    { de: "Mir geht es nicht gut.", en: "I don't feel well." },
    { de: "der Kopf", en: "head" },
    { de: "Kopfschmerzen", en: "headache" },
    { de: "der Husten", en: "cough" },
    { de: "das Fieber", en: "fever" },
    { de: "die Apotheke", en: "pharmacy" },
    { de: "die Tablette", en: "tablet" },
    { de: "der Arzt", en: "doctor" },
    { de: "die Ärztin", en: "doctor" },
    { de: "krank", en: "ill" },
    { de: "müde", en: "tired" },
    { de: "nehmen", en: "to take" },
    { de: "brauchen", en: "to need" },
    { de: "helfen", en: "to help" },
    { de: "der Termin", en: "appointment" },
    { de: "zweimal am Tag", en: "twice a day" },
  ],
  "work-study": [
    { de: "die Arbeit", en: "work" },
    { de: "arbeiten", en: "to work" },
    { de: "der Kollege", en: "male colleague" },
    { de: "die Kollegin", en: "female colleague" },
    { de: "der Kunde", en: "male customer" },
    { de: "die Kundin", en: "female customer" },
    { de: "der Deutschkurs", en: "German course" },
    { de: "lernen", en: "to learn" },
    { de: "üben", en: "to practise" },
    { de: "die Hausaufgabe", en: "homework" },
    { de: "die E-Mail", en: "email" },
    { de: "schreiben", en: "to write" },
    { de: "sprechen", en: "to speak" },
    { de: "die Pause", en: "break" },
    { de: "anfangen", en: "to begin" },
    { de: "morgens", en: "in the morning" },
    { de: "abends", en: "in the evening" },
  ],
};

export const a1TravelExtras: VocabularyItem[] = [
  { de: "das Gleis", en: "platform" },
  { de: "umsteigen", en: "to change trains" },
  { de: "die Fahrkarte", en: "ticket" },
  { de: "die Abfahrt", en: "departure" },
  { de: "die Ankunft", en: "arrival" },
];

export const a1ShoppingGrammar: GrammarTopic[] = [
  {
    name: "dieser / diese / dieses",
    explanation: "Use dieser with a masculine noun, diese with a feminine noun and dieses with a neuter noun when pointing to an item.",
    examples: ["Dieser Pullover ist schön.", "Diese Jacke ist zu groß.", "Dieses Hemd passt gut."],
  },
  {
    name: "simple adjective descriptions",
    explanation: "After ist, the describing word stays in its basic form. Use zu before an adjective to say something is too big or too small.",
    examples: ["Die Jacke ist blau.", "Das Hemd ist zu klein.", "Der Pullover ist günstig."],
  },
];

export const a1HealthGrammar: GrammarTopic[] = [
  {
    name: "haben + symptoms",
    explanation: "Use haben to say which symptom you have: ich habe, du hast, er/sie hat. A simple question begins with the verb.",
    examples: ["Ich habe Kopfschmerzen.", "Sie hat Fieber.", "Haben Sie Husten?"],
  },
  {
    name: "polite requests with können",
    explanation: "Use Können Sie …? to ask for help politely. Use Was kann ich …? to ask what you can do.",
    examples: ["Können Sie mir helfen?", "Was kann ich nehmen?", "Können Sie das bitte wiederholen?"],
  },
];
