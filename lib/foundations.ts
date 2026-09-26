export type FoundationCard = {
  de: string;
  en: string;
  note: string;
  audio?: string;
  example?: { de: string; en: string };
};

export type FoundationQuestion = {
  prompt: string;
  type: "choice" | "order";
  options: string[];
  answer: string;
  explanation: string;
  audio?: string;
  writtenCue?: string;
};

export type FoundationLesson = {
  id: string;
  slug: string;
  title: string;
  group: string;
  minutes: number;
  goal: string;
  introduction: string;
  cards: FoundationCard[];
  practice: FoundationQuestion[];
  production: { prompt: string; hint: string; model: string; kind: "exact" | "name" | "introduction" | "conversation"; answers?: string[] };
  checkpoint: FoundationQuestion[];
  recap: string;
};

function choice(prompt: string, options: string[], answer: string, explanation: string, audio?: string, writtenCue?: string): FoundationQuestion {
  return { type: "choice", prompt, options, answer, explanation, audio, writtenCue };
}
function order(prompt: string, options: string[], answer: string, explanation: string): FoundationQuestion {
  return { type: "order", prompt, options, answer, explanation };
}
function card(de: string, en: string, note: string, example?: { de: string; en: string }): FoundationCard {
  return { de, en, note, example };
}

// The hints are approximate English reminders, not a phonetic transcription of words.
export const germanAlphabet = [
  ["A", "ah", "a"], ["B", "beh", "b"], ["C", "tseh", "c"],
  ["D", "deh", "d"], ["E", "eh", "e"], ["F", "eff", "f"],
  ["G", "geh", "g"], ["H", "hah", "h"], ["I", "ee", "i"],
  ["J", "yott", "j"], ["K", "kah", "k"], ["L", "ell", "l"],
  ["M", "emm", "m"], ["N", "enn", "n"], ["O", "oh", "o"],
  ["P", "peh", "p"], ["Q", "koo", "q"], ["R", "err", "r"],
  ["S", "ess", "s"], ["T", "teh", "t"], ["U", "oo", "u"],
  ["V", "fow (rhymes with how)", "v"], ["W", "veh", "w"],
  ["X", "iks", "x"], ["Y", "üpsilon", "y"], ["Z", "tsett", "z"],
] as const;

const alphabetGroups = [
  { slug: "alphabet-a-f", title: "Your first letters: A–F", start: 0, end: 6, tricky: "C", clue: "tseh", review: "B", lower: "d", sequence: ["A", "C", "F"] },
  { slug: "alphabet-g-l", title: "Meet G–L", start: 6, end: 12, tricky: "J", clue: "yott", review: "I", lower: "h", sequence: ["G", "I", "L"] },
  { slug: "alphabet-m-r", title: "Meet M–R", start: 12, end: 18, tricky: "Q", clue: "koo", review: "P", lower: "n", sequence: ["M", "O", "R"] },
  { slug: "alphabet-s-z", title: "Meet S–Z", start: 18, end: 26, tricky: "W", clue: "veh", review: "V", lower: "z", sequence: ["S", "W", "Z"] },
];

const alphabetLessons: FoundationLesson[] = alphabetGroups.map((group) => {
  const letters = germanAlphabet.slice(group.start, group.end);
  const tricky = letters.find((letter) => letter[0] === group.tricky)!;
  const review = letters.find((letter) => letter[0] === group.review)!;
  return {
    id: `foundation-${group.slug}`, slug: group.slug, title: group.title, group: "Letters", minutes: 6,
    goal: `Recognise ${letters[0][0]}–${letters[letters.length - 1][0]} and try their German letter names.`,
    introduction: group.start === 0
      ? "Welcome! You do not need to know any German. Start with six letters. German uses A–Z, plus ä, ö, ü and ß, which we will meet later. A letter has a name when we spell; its sound inside a word can be different. Today, learn the letter names."
      : "Add a small group of letters to the ones you already know. Listen, look at the capital and small letter, then repeat. The English hints are approximate; use the German audio as your model.",
    cards: letters.map(([upper, hint, lower]) => ({
      de: `${upper} ${lower}`, en: `Letter name: ${hint}`, audio: upper,
      note: upper === "Y" ? "The name starts with the rounded ü sound. We will practise ü in lesson 6. For now, recognise Y and try the audio."
        : upper === "J" ? "German J is named yott. Inside many words, it sounds like the English y in yes."
        : upper === "W" ? "German W is named veh. Inside words, it usually sounds like English v."
        : upper === "V" ? "The name of this letter is fow. Inside words, V can sound like f or v; learn each new word with audio."
        : `The capital letter is ${upper}; the small letter is ${lower}. Say the letter name once, then try it again without the hint.`,
    })),
    practice: [
      choice("Listen to the letter name. Which letter is it?", [letters[1][0], group.tricky, letters[letters.length - 1][0]], group.tricky, `${group.tricky} has the letter name ${group.clue}.`, group.tricky, `The letter name sounds approximately like “${group.clue}”.`),
      choice(`Which capital letter matches ${group.lower}?`, [letters[0][0], group.lower.toUpperCase(), letters[2][0]], group.lower.toUpperCase(), `Capital ${group.lower.toUpperCase()} and small ${group.lower} are the same letter.`),
      order(`Put these letters in alphabet order: ${group.sequence.join(", ")}.`, [group.sequence[2], group.sequence[0], group.sequence[1]], group.sequence.join(" "), `The order is ${group.sequence.join(" → ")}.`),
    ],
    production: { kind: "exact", prompt: `Type these three capital letters in order: ${group.sequence.join(" → ")}. Then try saying their German names.`, hint: "Separate the letters with spaces. You can revisit the cards above.", model: group.sequence.join(" "), answers: [group.sequence.join(" ")] },
    checkpoint: [
      choice(`Which small letter matches ${group.tricky}?`, [letters[0][2], tricky[2], letters[1][2]], tricky[2], `${group.tricky} and ${tricky[2]} are the capital and small forms.`),
      choice("Listen. Which letter do you hear?", [letters[0][0], group.review, letters[letters.length - 1][0]], group.review, `${group.review} is named ${review[1]}.`, group.review, `Its name sounds approximately like “${review[1]}”.`),
      choice(`Which letter comes first in this group?`, [group.sequence[2], group.sequence[1], group.sequence[0]], group.sequence[0], `In alphabet order: ${group.sequence.join(" → ")}.`),
    ],
    recap: `You have met ${letters.map((letter) => letter[0]).join(", ")}. Keep revisiting the audio; remembering every name immediately is not required.`,
  };
});

const authoredLessons: Omit<FoundationLesson, "id">[] = [
  {
    slug: "spell-a-name", title: "Spell a name", group: "Letters", minutes: 6,
    goal: "Recognise a name spelled one letter at a time.",
    introduction: "You have met all 26 letters. Spelling means saying each letter's name separately. You can spell your own name before you can speak a full German sentence. Use the alphabet reference whenever you need it.",
    cards: [
      { de: "L A R A", en: "The name Lara, spelled letter by letter", audio: "L. A. R. A.", note: "Four letters, four letter names: ell – ah – err – ah." },
      { de: "A M I R", en: "The name Amir, spelled letter by letter", audio: "A. M. I. R.", note: "Say ah – emm – ee – err. The German letter I is named ee." },
      { de: "E / I", en: "Two different letter names", audio: "E. I.", note: "E is named eh; I is named ee. Slow down and listen to each one." },
    ],
    practice: [
      choice("Which name is spelled in the audio?", ["Amir", "Lara", "Mira"], "Lara", "L – A – R – A spells Lara.", "L. A. R. A.", "The letters are L – A – R – A."),
      order("Arrange the letters to spell Amir.", ["R", "I", "A", "M"], "A M I R", "Amir is spelled A – M – I – R."),
      choice("Which German letter has the name ee?", ["E", "I", "A"], "I", "I is named ee. E is named eh."),
    ],
    production: { kind: "name", prompt: "Type your first name with a space between each letter. Try saying the letter names aloud.", hint: "Use letters A–Z, Ä, Ö or Ü. If your name uses another script, you can practise with Lara.", model: "L A R A" },
    checkpoint: [
      choice("Which name is spelled A – M – I – R?", ["Mira", "Amir", "Lara"], "Amir", "Read the letters from left to right: Amir."),
      choice("When spelling a name, what do you say?", ["Each letter's name", "A translation of the name", "Only the first sound"], "Each letter's name", "Spelling uses the name of each individual letter."),
      choice("Which letter do you hear?", ["E", "I", "J"], "E", "E is named eh.", "E", "The letter name sounds approximately like eh."),
    ],
    recap: "You can spell a familiar name using German letter names. Keep the alphabet nearby for names you find difficult.",
  },
  {
    slug: "umlauts", title: "Meet ä, ö and ü", group: "Sounds", minutes: 7,
    goal: "Recognise the three umlauts and try their sounds.",
    introduction: "Two dots change the vowel. Ä, Ö and Ü are not decorations: they help distinguish words. Each can have a long or short sound. Today, try one example of each; the example words are for listening, not a vocabulary test.",
    cards: [
      card("Ä ä", "A with an umlaut", "In Käse, ä has a long, open e-like sound. Listen rather than treating it as ordinary a.", { de: "Käse", en: "cheese" }),
      card("Ö ö", "O with an umlaut", "Try saying eh while rounding your lips. Keep your tongue forward. English has no exact equivalent.", { de: "Öl", en: "oil" }),
      card("Ü ü", "U with an umlaut", "Try saying ee while rounding your lips as if for oo. Keep your tongue in the ee position.", { de: "Tür", en: "door" }),
    ],
    practice: [
      choice("Which letter is U with two dots?", ["Ö", "Ä", "Ü"], "Ü", "Ü is an umlaut. The dots change its sound."),
      choice("Which word contains ö?", ["Tür", "Öl", "Käse"], "Öl", "Öl (oil) starts with Ö."),
      choice("To begin practising ü, which mouth movement helps?", ["Say ee and round your lips", "Say ah with a wide mouth", "Keep your lips closed"], "Say ee and round your lips", "This is a starting cue. Listen to Tür and adjust gently."),
    ],
    production: { kind: "exact", prompt: "Type the three small umlaut letters in this order: ä, ö, ü. Try the sound of each example word.", hint: "Use the special-letter buttons below if your keyboard needs them.", model: "ä ö ü", answers: ["ä ö ü"] },
    checkpoint: [
      choice("Which word has ä?", ["Käse", "Öl", "Tür"], "Käse", "Käse (cheese) contains ä."),
      choice("Which letter is O with an umlaut?", ["Ü", "Ö", "Ä"], "Ö", "O with two dots is Ö."),
      choice("Do umlauts change the sound of a vowel?", ["Yes", "No", "Only in names"], "Yes", "Ä, ö and ü have their own sounds. Listen to each new word."),
    ],
    recap: "Recognise ä, ö and ü. Pronunciation improves with repeated listening; you do not need to perfect it today.",
  },
  {
    slug: "eszett", title: "The letter ß", group: "Sounds", minutes: 5,
    goal: "Recognise ß and distinguish it from B.",
    introduction: "ß is called Eszett or scharfes S. It is not the letter B. In words, it makes an unvoiced s sound, like s in English see. You will soon use it in heiße when saying your name.",
    cards: [
      { de: "ß", en: "Eszett / sharp S", audio: "Eszett", note: "Its letter name is Eszett. Its sound inside a word is s. You may also see the capital form ẞ." },
      card("Fuß", "foot", "Listen for the s sound at the end. The vowel is long."),
      card("heiße", "am called (with ich)", "Listen for the s sound in the middle. We will build Ich heiße … later."),
    ],
    practice: [
      choice("Which symbol is Eszett?", ["B", "ß", "Ö"], "ß", "ß is Eszett. B is a different letter."),
      choice("What sound does ß make inside Fuß?", ["b", "s", "sh"], "s", "Fuß ends with an unvoiced s sound.", "Fuß", "The ending sounds like s in see."),
      choice("Which word contains Eszett?", ["Öl", "Amir", "heiße"], "heiße", "heiße contains ß."),
    ],
    production: { kind: "exact", prompt: "Write the word for foot: Fuß. Listen and try repeating it.", hint: "Capital F, small u, then ß. German nouns begin with a capital letter.", model: "Fuß", answers: ["Fuß"] },
    checkpoint: [
      choice("Is ß the same letter as B?", ["Yes", "No"], "No", "B and ß are different letters."),
      choice("What is the letter ß called?", ["Ypsilon", "Eszett", "Umlaut"], "Eszett", "Eszett is also called scharfes S."),
      choice("Which sound ends Fuß?", ["b", "sh", "s"], "s", "ß has an unvoiced s sound.", "Fuß", "Listen for s, as in see."),
    ],
    recap: "ß looks unusual but represents a familiar s sound. Keep its letter name separate from its sound in words.",
  },
  {
    slug: "vowel-teams", title: "When vowels work together", group: "Sounds", minutes: 8,
    goal: "Distinguish ei, ie, au and eu/äu in familiar examples.",
    introduction: "Sometimes two written vowels work together. Do not say two letter names when reading these words. Listen to the whole example, then focus on its highlighted spelling pattern.",
    cards: [
      card("ei", "Usually like eye", "ei is one gliding sound. It is different from ie.", { de: "Eis", en: "ice / ice cream" }),
      card("ie", "Usually a long ee sound", "Keep the sound steady. Reversing ei to ie changes the sound.", { de: "wie", en: "how" }),
      card("au", "Like ow in English house", "Start open, then round your lips.", { de: "Haus", en: "house" }),
      card("eu / äu", "Like oy in English boy", "These two spellings commonly share the same sound.", { de: "neu. Häuser.", en: "new; houses" }),
    ],
    practice: [
      choice("Which vowel team usually sounds like eye?", ["ie", "ei", "eu"], "ei", "ei in Eis sounds like eye."),
      choice("Which vowel team do you hear in wie?", ["au", "ei", "ie"], "ie", "ie in wie is a long ee sound.", "wie", "The vowel sounds like a long ee."),
      choice("Which two spellings share the oy sound?", ["ei and ie", "eu and äu", "au and ie"], "eu and äu", "Compare neu (new) and Häuser (houses)."),
    ],
    production: { kind: "exact", prompt: "Write Eis, then wie. Say each word and notice how ei and ie differ.", hint: "The first word has ei. The second has ie. Separate the words with a space.", model: "Eis wie", answers: ["Eis wie"] },
    checkpoint: [
      choice("Which team is in Haus?", ["au", "eu", "ie"], "au", "Haus (house) contains au."),
      choice("Which spelling gives a long ee in wie?", ["ei", "ie", "äu"], "ie", "The order of the vowels matters: ie is a long ee here."),
      choice("The vowel in neu is closest to which English sound?", ["eye", "ee", "oy"], "oy", "eu in neu sounds like oy in boy.", "neu", "neu has an oy sound."),
    ],
    recap: "ei → eye, ie → ee, au → ow, eu/äu → oy. These are starting patterns; listen when meeting a new word.",
  },
  {
    slug: "sch-and-ch", title: "Meet sch and ch", group: "Sounds", minutes: 7,
    goal: "Notice sch and the two common ch sounds.",
    introduction: "Several letters can represent one sound. Sch is usually like sh in English shoe. Ch has two common sounds in the examples below. They need practice; first learn to notice the difference.",
    cards: [
      card("sch", "Like sh", "Keep the letters together: sch makes one sound.", { de: "Schuh", en: "shoe" }),
      card("ch in ich", "A light, breathy sound", "Keep your tongue forward and let air pass between it and the roof of your mouth. Avoid turning it into sh or k.", { de: "ich", en: "I" }),
      card("ch in Buch", "A sound farther back in the mouth", "After a, o, u and au, ch is commonly made farther back. Let air pass without fully blocking it.", { de: "Buch", en: "book" }),
    ],
    practice: [
      choice("Which pattern sounds like English sh?", ["ch in ich", "sch", "ch in Buch"], "sch", "sch in Schuh is like sh in shoe."),
      choice("Which word has the lighter ch sound?", ["Buch", "Schuh", "ich"], "ich", "ich has the lighter, forward ch sound."),
      choice("Which word ends with the farther-back ch sound?", ["Buch", "ich", "Schuh"], "Buch", "In Buch, ch follows u and is made farther back.", "Buch", "The word is Buch: ch follows u."),
    ],
    production: { kind: "exact", prompt: "Write ich, then Buch. Replay both examples and try saying them.", hint: "The goal is to notice and try the two ch sounds. Your pronunciation is not automatically graded.", model: "ich Buch", answers: ["ich Buch"] },
    checkpoint: [
      choice("Which word begins with sch?", ["ich", "Buch", "Schuh"], "Schuh", "Schuh begins with sch."),
      choice("Do ich and Buch use the same common ch sound?", ["Yes", "No"], "No", "The ch sound is lighter in ich and farther back in Buch."),
      choice("What does ich mean?", ["book", "I", "shoe"], "I", "ich means I. You will use it in your first sentences."),
    ],
    recap: "sch is like sh. Listen for the difference between ch in ich and ch in Buch.",
  },
  {
    slug: "sp-and-st", title: "Starting with sp and st", group: "Sounds", minutes: 6,
    goal: "Recognise the common shp and sht sounds at the start of words.",
    introduction: "At the start of many German words, sp sounds like shp and st like sht. These are useful starting patterns, not a rule for every position or borrowed word.",
    cards: [
      card("sp", "Often shp at the start", "In Sport, start with sh, then add p without a vowel between them.", { de: "Sport", en: "sport" }),
      card("st", "Often sht at the start", "In Stadt, start with sh, then add t.", { de: "Stadt", en: "city / town" }),
      card("ist", "is", "Here st is at the end. It sounds like ordinary s + t, not sht. Notice where the letters occur."),
    ],
    practice: [
      choice("How does Sport commonly begin in German?", ["shp", "sht", "ch"], "shp", "Initial sp in Sport sounds like shp.", "Sport", "The beginning sounds like shp."),
      choice("Which word begins with sht?", ["Sport", "Stadt", "ist"], "Stadt", "Initial st in Stadt sounds like sht."),
      choice("Why does ist not begin with sht?", ["Its st is at the end", "It contains sch", "It has an umlaut"], "Its st is at the end", "The starting pattern does not apply to final st in ist."),
    ],
    production: { kind: "exact", prompt: "Write Sport, then Stadt. Try saying each beginning slowly.", hint: "Sport begins shp; Stadt begins sht. These nouns start with capital letters.", model: "Sport Stadt", answers: ["Sport Stadt"] },
    checkpoint: [
      choice("Which pattern begins Sport?", ["st", "sch", "sp"], "sp", "Sport begins with sp, pronounced shp here."),
      choice("Which word means city or town?", ["Stadt", "ist", "Sport"], "Stadt", "Stadt means city or town."),
      choice("Does every st in every position sound like sht?", ["Yes", "No"], "No", "For example, st at the end of ist stays s + t."),
    ],
    recap: "Start Sport with shp and Stadt with sht. Keep noticing the position of letter combinations.",
  },
  {
    slug: "first-greetings", title: "Your first greetings", group: "First words", minutes: 6,
    goal: "Choose a greeting or goodbye for a simple situation.",
    introduction: "Now use familiar sounds in useful phrases. Learn one phrase, its meaning and when to use it. You do not need a sentence or paragraph yet.",
    cards: [
      card("Hallo!", "Hello!", "A common, friendly greeting."),
      card("Guten Morgen!", "Good morning!", "Use it when greeting someone in the morning. Learn the two words together for now."),
      card("Guten Tag!", "Good day! / Hello!", "A polite greeting during the day."),
      card("Tschüss!", "Bye!", "A friendly goodbye. The ü is short here; listen to the whole word."),
    ],
    practice: [
      choice("You meet a classmate. Choose a friendly hello.", ["Tschüss!", "Hallo!", "Guten Morgen!"], "Hallo!", "Hallo is a friendly hello at any time of day."),
      choice("Which phrase specifically greets someone in the morning?", ["Guten Tag!", "Tschüss!", "Guten Morgen!"], "Guten Morgen!", "Morgen in this phrase refers to the morning."),
      choice("You are leaving. What can you say?", ["Tschüss!", "Hallo!", "Guten Tag!"], "Tschüss!", "Tschüss is a friendly goodbye."),
    ],
    production: { kind: "exact", prompt: "Write a friendly hello, then a friendly goodbye.", hint: "Use Hallo and Tschüss. You may put them on separate lines.", model: "Hallo! Tschüss!", answers: ["Hallo Tschüss"] },
    checkpoint: [
      choice("What does Hallo mean?", ["Bye", "Hello", "Morning"], "Hello", "Hallo means hello."),
      choice("Choose the polite daytime greeting.", ["Guten Tag!", "Tschüss!", "Guten Morgen!"], "Guten Tag!", "Guten Tag is a polite daytime greeting."),
      choice("Which phrase is a goodbye?", ["Guten Morgen!", "Hallo!", "Tschüss!"], "Tschüss!", "Use Tschüss when leaving."),
    ],
    recap: "You can greet someone and say goodbye. Repeat the phrases as whole chunks.",
  },
  {
    slug: "polite-words", title: "Small words, useful answers", group: "First words", minutes: 6,
    goal: "Use yes, no, please and thank you.",
    introduction: "These four small words help in many situations. Bitte has several uses; today, learn please and the response you're welcome.",
    cards: [
      card("ja", "yes", "J sounds like English y in this word."),
      card("nein", "no", "Notice ei: it sounds like eye."),
      card("bitte", "please / you're welcome", "Use it with a request or as a reply to Danke."),
      card("danke", "thank you", "A simple way to thank someone."),
    ],
    practice: [
      choice("Choose the word for yes.", ["nein", "danke", "ja"], "ja", "ja means yes."),
      choice("Someone helps you. What can you say?", ["Danke!", "Nein!", "Tschüss!"], "Danke!", "Danke means thank you."),
      choice("Someone says Danke. Choose you're welcome.", ["Hallo!", "Bitte!", "Nein!"], "Bitte!", "Bitte can mean you're welcome as a reply to thanks."),
    ],
    production: { kind: "exact", prompt: "Write thank you, then the reply you're welcome.", hint: "Use the two words from the cards. Capital letters are fine at the start of each response.", model: "Danke! Bitte!", answers: ["Danke Bitte"] },
    checkpoint: [
      choice("What does nein mean?", ["yes", "no", "please"], "no", "nein means no."),
      choice("Which word can mean please?", ["danke", "ja", "bitte"], "bitte", "bitte can mean please or you're welcome."),
      choice("Which word do you hear?", ["nein", "ja", "danke"], "nein", "nein has the ei sound you practised.", "nein", "It means no and contains ei."),
    ],
    recap: "ja = yes; nein = no; bitte = please / you're welcome; danke = thank you.",
  },
  {
    slug: "numbers-zero-ten", title: "Count from zero to ten", group: "First words", minutes: 8,
    goal: "Connect the numbers 0–10 to their German words.",
    introduction: "Take these in small groups: 0–3, 4–6, then 7–10. Listen and say each number. You can revisit the cards during practice.",
    cards: [
      ...[["null", "0"], ["eins", "1"], ["zwei", "2"], ["drei", "3"], ["vier", "4"], ["fünf", "5"], ["sechs", "6"], ["sieben", "7"], ["acht", "8"], ["neun", "9"], ["zehn", "10"]].map(([de, en]) => card(de, en, de === "vier" ? "V sounds like f here. Learn the sound with the word." : de === "sechs" ? "chs sounds like ks in this word." : de === "sieben" ? "Notice ie: a long ee sound." : de === "zehn" ? "Z starts with a ts sound; h lengthens the vowel here." : "Listen, repeat, then look away and try to recall the number.")),
    ],
    practice: [
      choice("Which word means 3?", ["zwei", "drei", "eins"], "drei", "drei means three."),
      choice("Which number do you hear?", ["5", "7", "9"], "7", "sieben means seven.", "sieben", "The word is sieben."),
      order("Count from zero to three.", ["drei", "eins", "null", "zwei"], "null eins zwei drei", "0, 1, 2, 3 = null, eins, zwei, drei."),
    ],
    production: { kind: "exact", prompt: "Write the words for 1, 2 and 3, in that order.", hint: "Use words, with spaces between them. Try saying them after writing.", model: "eins zwei drei", answers: ["eins zwei drei"] },
    checkpoint: [
      choice("What number is fünf?", ["4", "5", "6"], "5", "fünf means five."),
      choice("Which word means 10?", ["neun", "acht", "zehn"], "zehn", "zehn means ten."),
      choice("Which number do you hear?", ["6", "4", "8"], "8", "acht means eight.", "acht", "The word is acht."),
    ],
    recap: "You have met 0–10. Return to a few numbers at a time until they feel familiar.",
  },
  {
    slug: "i-am", title: "Build your first sentence", group: "First sentences", minutes: 6,
    goal: "Understand and build Ich bin … with a name.",
    introduction: "You already know ich: I. Add bin, meaning am, and then a name. We are learning one useful form of the verb sein (to be), not the whole verb table yet.",
    cards: [
      card("ich", "I", "German ich is normally lowercase. At the start of a sentence, write Ich."),
      card("bin", "am", "Use bin with ich. Together: ich bin = I am."),
      card("Ich bin Lara.", "I am Lara.", "Ich = I; bin = am; Lara = the person's name. The verb bin comes after Ich."),
    ],
    practice: [
      choice("What does bin mean in Ich bin Lara?", ["am", "name", "you"], "am", "Ich bin means I am."),
      order("Build I am Amir.", ["Amir.", "Ich", "bin"], "Ich bin Amir.", "Put Ich first, then bin, then the name."),
      choice("Which word begins a sentence meaning I am …?", ["bin", "Ich", "Lara"], "Ich", "Begin with Ich, then add bin."),
    ],
    production: { kind: "introduction", prompt: "Introduce yourself with Ich bin and your name.", hint: "Write one sentence. You can use a practice name if you prefer.", model: "Ich bin Lara.", answers: ["Ich bin"] },
    checkpoint: [
      choice("What does Ich mean?", ["I", "you", "am"], "I", "ich means I."),
      choice("Choose the correct order.", ["Bin Lara ich.", "Ich bin Lara.", "Ich Lara bin."], "Ich bin Lara.", "Ich + bin + name."),
      choice("What does Ich bin Amir mean?", ["What is your name?", "I am Amir.", "Goodbye, Amir."], "I am Amir.", "Ich bin means I am."),
    ],
    recap: "You can build one complete sentence: Ich bin + your name.",
  },
  {
    slug: "my-name", title: "Say your name", group: "First sentences", minutes: 6,
    goal: "Use Ich heiße … to introduce yourself.",
    introduction: "Another way to introduce yourself is Ich heiße … . It literally means I am called … and naturally translates as My name is … . Notice the ei and ß you already practised.",
    cards: [
      card("heiße", "am called (with ich)", "heiße contains ei, like eye, and ß, like s. This is the form used after ich."),
      card("Ich heiße Amir.", "My name is Amir.", "Ich = I; heiße = am called; Amir = the name. Replace only the name."),
      card("Hallo! Ich heiße Lara.", "Hello! My name is Lara.", "Two short parts: a greeting, then an introduction. You already know every part."),
    ],
    practice: [
      choice("What does Ich heiße Lara tell you?", ["Lara's age", "Lara's name", "Lara's city"], "Lara's name", "Ich heiße … tells someone your name."),
      order("Build My name is Amir.", ["heiße", "Amir.", "Ich"], "Ich heiße Amir.", "Ich + heiße + name."),
      choice("Which letter appears in heiße?", ["ü", "ß", "ö"], "ß", "heiße contains Eszett, with an s sound."),
    ],
    production: { kind: "introduction", prompt: "Write Ich heiße followed by your own name or a practice name.", hint: "Use the ß button if you need it. Keep the frame, then add a name.", model: "Ich heiße Amir.", answers: ["Ich heiße"] },
    checkpoint: [
      choice("Choose My name is Lara.", ["Ich bin.", "Ich heiße Lara.", "Hallo Lara!"], "Ich heiße Lara.", "Ich heiße + name introduces the speaker."),
      choice("What does ei sound like in heiße?", ["ee", "eye", "oy"], "eye", "ei has the eye sound."),
      choice("Which part do you change for your own introduction?", ["The name", "Ich", "heiße"], "The name", "Keep Ich heiße and add your name."),
    ],
    recap: "You now have two ways to introduce yourself: Ich bin … and Ich heiße … .",
  },
  {
    slug: "ask-a-name", title: "Ask someone's name", group: "First sentences", minutes: 7,
    goal: "Ask a polite name question and recognise its answer.",
    introduction: "For a polite first meeting, use Sie for you. Learn one question slowly. Informal du comes later in A1, so you can first become comfortable with this exchange.",
    cards: [
      card("Sie", "you (polite)", "Write polite Sie with a capital S, even in the middle of a sentence. The ie sounds like ee."),
      card("Wie heißen Sie?", "What is your name? (polite)", "Wie = how; heißen = are called here; Sie = you. The natural English meaning is What is your name? Notice heißen with Sie, but heiße with ich."),
      card("Ich heiße Lara.", "My name is Lara.", "This answers the name question. The speaker uses ich and the form heiße."),
    ],
    practice: [
      choice("Which word means polite you?", ["ich", "Sie", "Wie"], "Sie", "Sie is the polite word for you."),
      order("Build the polite name question.", ["Sie?", "Wie", "heißen"], "Wie heißen Sie?", "Question word Wie, then heißen, then Sie."),
      choice("Choose an answer to Wie heißen Sie?", ["Ich heiße Amir.", "Tschüss!", "Danke!"], "Ich heiße Amir.", "Answer with Ich heiße and your name."),
    ],
    production: { kind: "exact", prompt: "Write the polite question that asks someone's name.", hint: "Three words. Begin with Wie; use heißen with Sie.", model: "Wie heißen Sie?", answers: ["Wie heißen Sie"] },
    checkpoint: [
      choice("What does Wie heißen Sie ask?", ["How old are you?", "What is your name?", "Where do you live?"], "What is your name?", "This is the polite name question."),
      choice("Choose the correct form after Ich.", ["heißen", "heiße", "Sie"], "heiße", "Ich heiße, but Wie heißen Sie?"),
      choice("Which word keeps a capital letter in the polite question?", ["heißen", "Sie", "bin"], "Sie", "Polite Sie is always capitalised."),
    ],
    recap: "You can ask Wie heißen Sie? and answer Ich heiße … .",
  },
  {
    slug: "first-conversation", title: "Your first conversation", group: "First sentences", minutes: 7,
    goal: "Put a greeting, a name question and an introduction together.",
    introduction: "One new phrase, then a tiny conversation using familiar language. Read one turn at a time. The English meaning is beside each turn.",
    cards: [
      card("Freut mich!", "Nice to meet you!", "Learn this as a whole phrase. Say it after meeting someone. You will learn its grammar later."),
      card("Hallo! Wie heißen Sie?", "Hello! What is your name?", "Lara starts with a greeting and asks Amir's name."),
      card("Ich heiße Amir.", "My name is Amir.", "Amir answers the question using the frame you know."),
      card("Freut mich! Ich heiße Lara.", "Nice to meet you! My name is Lara.", "Lara replies and gives her own name."),
      card("Tschüss!", "Bye!", "A friendly ending to the exchange."),
    ],
    practice: [
      choice("Someone introduces themselves. Choose Nice to meet you.", ["Freut mich!", "Guten Morgen!", "Nein!"], "Freut mich!", "Freut mich is a friendly response when meeting someone."),
      choice("What is the conversation about?", ["Meeting someone", "Buying food", "Asking a price"], "Meeting someone", "The speakers greet each other and share names."),
      order("Put the three turns in a natural order.", ["Ich heiße Amir.", "Freut mich!", "Wie heißen Sie?"], "Wie heißen Sie? Ich heiße Amir. Freut mich!", "Ask the name, hear the answer, then say Nice to meet you."),
    ],
    production: { kind: "conversation", prompt: "Write your side of a first meeting: say hello, introduce yourself, then say goodbye.", hint: "Use Hallo! Ich heiße [name]. Tschüss! Write your own name or a practice name.", model: "Hallo! Ich heiße Lara. Tschüss!" },
    checkpoint: [
      choice("What does Freut mich mean here?", ["No, thank you", "Nice to meet you", "Good morning"], "Nice to meet you", "Use Freut mich after meeting someone."),
      choice("Which question asks for a name?", ["Wie heißen Sie?", "Ich heiße Lara.", "Freut mich!"], "Wie heißen Sie?", "Wie heißen Sie is the polite name question."),
      choice("Which response closes the conversation?", ["Hallo!", "Ich bin Amir.", "Tschüss!"], "Tschüss!", "Tschüss is a goodbye."),
    ],
    recap: "You can take part in a tiny first meeting, one short turn at a time.",
  },
  {
    slug: "foundation-review", title: "Bring your first steps together", group: "Review", minutes: 8,
    goal: "Review letters, sounds and a short introduction before A1.",
    introduction: "This is a practice checkpoint for your foundations, not a CEFR certificate. Revisit the reminders, try the activities and notice what needs another listen. There is no new German here.",
    cards: [
      { de: "A M I R", en: "A name, spelled one letter at a time", audio: "A. M. I. R.", note: "Use German letter names: ah – emm – ee – err." },
      card("ei / ie", "eye / ee", "Remember Eis and wie. The order of the letters changes the sound.", { de: "Eis. wie.", en: "ice / ice cream; how" }),
      card("Hallo! Ich heiße Lara.", "Hello! My name is Lara.", "A greeting plus a name. Change the name to your own."),
      card("Wie heißen Sie?", "What is your name? (polite)", "Answer with Ich heiße … . Then use Freut mich and Tschüss."),
    ],
    practice: [
      choice("Which letter has the German name ee?", ["E", "I", "J"], "I", "I is ee; E is eh."),
      choice("Which number do you hear?", ["2", "3", "10"], "3", "drei means three.", "drei", "The word is drei."),
      order("Build My name is Lara.", ["Lara.", "heiße", "Ich"], "Ich heiße Lara.", "Ich + heiße + name."),
    ],
    production: { kind: "conversation", prompt: "Write a greeting, introduce yourself and say goodbye, using the German you have learned.", hint: "Use Hallo, Ich heiße and Tschüss. Try recalling them before looking at a model.", model: "Hallo! Ich heiße Amir. Tschüss!" },
    checkpoint: [
      choice("Which group contains the three umlauts?", ["a, o, u", "ä, ö, ü", "b, ß, s"], "ä, ö, ü", "The umlauts are ä, ö and ü."),
      choice("Which pattern in wie gives a long ee?", ["ei", "ie", "eu"], "ie", "ie is a long ee in wie."),
      choice("What is a suitable answer to Wie heißen Sie?", ["Ich heiße Lara.", "Guten Morgen!", "Danke!"], "Ich heiße Lara.", "Give your name with Ich heiße … ."),
    ],
    recap: "You have practised the alphabet, common sound patterns, useful words and a first conversation. A1 builds on this with people, everyday objects and longer exchanges.",
  },
];

export const foundationLessons: FoundationLesson[] = [
  ...alphabetLessons,
  ...authoredLessons.map((lesson) => ({ ...lesson, id: `foundation-${lesson.slug}` })),
];

export function foundationHref(lesson: Pick<FoundationLesson, "slug">) {
  return `/learn/foundations/${lesson.slug}`;
}

export function nextFoundation(completed: string[]) {
  return foundationLessons.find((lesson) => !completed.includes(lesson.id));
}

export function recommendedFoundation(completedFoundations: string[], completedLessons: string[], lastLessonId?: string) {
  if (completedLessons.length > 0 && !lastLessonId?.startsWith("foundation-")) return undefined;
  const current = foundationLessons.find((lesson) => lesson.id === lastLessonId && !completedFoundations.includes(lesson.id));
  return current ?? nextFoundation(completedFoundations);
}

export function normalizeFoundationAnswer(value: string) {
  return value.normalize("NFC").toLocaleLowerCase("de").replace(/[.!?,;:]/g, " ").replace(/\s+/g, " ").trim();
}

export function validateFoundationProduction(lesson: FoundationLesson, value: string): boolean {
  const answer = normalizeFoundationAnswer(value);
  const name = "[a-zäöüß]+(?:[-'’ ][a-zäöüß]+)*";
  if (lesson.production.kind === "exact") return (lesson.production.answers ?? []).some((item) => normalizeFoundationAnswer(item) === answer);
  if (lesson.production.kind === "name") return /^[a-zäöüß](?: [a-zäöüß]){1,39}$/iu.test(answer);
  if (lesson.production.kind === "introduction") {
    return (lesson.production.answers ?? []).some((prefix) => new RegExp(`^${normalizeFoundationAnswer(prefix)} ${name}$`, "u").test(answer));
  }
  return new RegExp(`^hallo ich heiße ${name} tschüss$`, "u").test(answer);
}

export type FoundationEvidence = { practice: string[]; production: string; checkpoint: string[] };

export function foundationCompletion(lesson: FoundationLesson, evidence: FoundationEvidence) {
  const score = lesson.checkpoint.filter((question, index) => normalizeFoundationAnswer(evidence.checkpoint[index] ?? "") === normalizeFoundationAnswer(question.answer)).length;
  const answered = lesson.checkpoint.every((question, index) => question.options.includes(evidence.checkpoint[index]));
  const practised = lesson.practice.every((question, index) => normalizeFoundationAnswer(evidence.practice[index] ?? "") === normalizeFoundationAnswer(question.answer));
  return { score, total: lesson.checkpoint.length, complete: practised && validateFoundationProduction(lesson, evidence.production) && answered && score >= Math.ceil(lesson.checkpoint.length * 2 / 3) };
}
