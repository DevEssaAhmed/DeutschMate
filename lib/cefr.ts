import type { CefrDescriptor, CoreSkill, LevelId } from "./types";

export const skillOrder: CoreSkill[] = ["reading", "listening", "speaking", "writing", "grammar", "vocabulary"];

const raw = {
  "A1": {
    "reading": [
      "understand very short everyday notices and messages",
      "identify basic personal information in simple texts",
      "recognise familiar words in menus, forms and signs"
    ],
    "listening": [
      "understand familiar words and very basic phrases spoken clearly",
      "follow simple questions about personal details",
      "identify key information in slow announcements"
    ],
    "speaking": [
      "introduce myself and answer simple personal questions",
      "use basic phrases for everyday transactions",
      "produce short rehearsed descriptions"
    ],
    "writing": [
      "write simple messages and personal details",
      "complete basic forms accurately",
      "write a short connected description using simple clauses"
    ],
    "grammar": [
      "form basic present-tense statements and questions",
      "use nominative and basic accusative patterns",
      "control common modal and separable-verb patterns"
    ],
    "vocabulary": [
      "use high-frequency everyday vocabulary",
      "recognise common noun gender with articles",
      "use memorised chunks for routine situations"
    ]
  },
  "A2": {
    "reading": [
      "understand short personal and practical texts",
      "find predictable information in everyday documents",
      "follow the main sequence of a short narrative"
    ],
    "listening": [
      "understand common everyday exchanges at normal learner speed",
      "extract key details from announcements and instructions",
      "follow a short conversation on familiar topics"
    ],
    "speaking": [
      "handle routine social and service encounters",
      "describe past experiences and simple plans",
      "sustain a short conversation with follow-up questions"
    ],
    "writing": [
      "write personal emails and simple narratives",
      "connect ideas with basic subordinate clauses",
      "write practical requests and explanations"
    ],
    "grammar": [
      "use Perfekt, dative and two-way prepositions with growing control",
      "use subordinate clauses and reflexive structures",
      "compare people and things and express future plans"
    ],
    "vocabulary": [
      "use broader everyday vocabulary and common verb-preposition pairs",
      "use frequent collocations instead of isolated words",
      "paraphrase simple unknown words"
    ]
  },
  "B1": {
    "reading": [
      "understand the main points of clear factual texts",
      "follow opinions and reasons in familiar topics",
      "infer some unknown meaning from context"
    ],
    "listening": [
      "follow clear standard speech on work, study and everyday topics",
      "understand the main points of interviews and reports",
      "take simple notes from structured spoken input"
    ],
    "speaking": [
      "narrate experiences in connected speech",
      "give reasons for opinions and plans",
      "handle most everyday situations while travelling or working"
    ],
    "writing": [
      "write connected texts on familiar subjects",
      "write formal and informal emails with appropriate structure",
      "present an opinion with reasons and examples"
    ],
    "grammar": [
      "use relative clauses, passive, Konjunktiv II and complex connectors",
      "control adjective endings in common patterns",
      "manage verb-preposition structures and word order"
    ],
    "vocabulary": [
      "use topic-specific vocabulary across work, study and society",
      "use common collocations and functional verb phrases",
      "vary wording to avoid excessive repetition"
    ]
  },
  "B2": {
    "reading": [
      "understand complex factual and argumentative texts",
      "distinguish main claims, evidence and writer stance",
      "read reports, editorials and professional texts with independence"
    ],
    "listening": [
      "follow extended speech and complex argument when structure is clear",
      "understand interviews, discussions and presentations",
      "recognise stance, emphasis and implied relationships"
    ],
    "speaking": [
      "interact fluently enough for sustained discussion",
      "present and defend a viewpoint with supporting detail",
      "adapt register in professional and academic situations"
    ],
    "writing": [
      "write clear detailed arguments, reports and formal correspondence",
      "organise longer texts with effective cohesion",
      "use a broader range of structures with good control"
    ],
    "grammar": [
      "use advanced passive, reported speech and nominalisation",
      "control complex clause architecture and information structure",
      "use participial and compressed structures appropriately"
    ],
    "vocabulary": [
      "use collocations and idiomatic chunks with increasing precision",
      "distinguish formal, neutral and informal wording",
      "use topic-specific terminology without sounding translated"
    ]
  },
  "C1": {
    "reading": [
      "understand long complex texts including implicit meaning",
      "synthesise information across demanding professional and academic texts",
      "analyse stance, rhetoric and register"
    ],
    "listening": [
      "follow extended lectures, discussions and broadcasts at natural speed",
      "identify nuanced argument and speaker attitude",
      "take structured notes from dense spoken input"
    ],
    "speaking": [
      "express ideas fluently and precisely without obvious searching",
      "give structured presentations and respond flexibly to challenge",
      "negotiate nuance, qualification and register"
    ],
    "writing": [
      "write well-structured complex texts for academic and professional purposes",
      "synthesise sources and maintain consistent register",
      "edit writing for precision, cohesion and stylistic control"
    ],
    "grammar": [
      "use advanced syntax flexibly rather than mechanically",
      "control reported speech, modality, nominal style and information packaging",
      "choose structures according to register and rhetorical purpose"
    ],
    "vocabulary": [
      "use broad lexical repertoire including collocations and idiomaticity",
      "choose precise near-synonyms and register-sensitive wording",
      "build cohesive lexical chains across long discourse"
    ]
  }
} as const;

export const cefrDescriptors: CefrDescriptor[] = (Object.keys(raw) as LevelId[]).flatMap((level) =>
  skillOrder.flatMap((skill) =>
    raw[level][skill].map((text, index) => ({
      id: `${level.toLowerCase()}-${skill}-${index + 1}`,
      level,
      skill,
      text,
    })),
  ),
);

export function descriptorsForLevel(level: LevelId) {
  return cefrDescriptors.filter((item) => item.level === level);
}

export function descriptorsForSkill(level: LevelId, skill: CoreSkill) {
  return cefrDescriptors.filter((item) => item.level === level && item.skill === skill);
}
