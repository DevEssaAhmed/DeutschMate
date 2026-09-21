import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AiMode = "tutor" | "grammar_explain" | "writing_feedback" | "writing_model" | "speaking_feedback" | "speaking_audio_feedback" | "vocabulary_deep_dive" | "answer_assess";
type Level = "A1" | "A2" | "B1" | "B2" | "C1";

const levels = new Set<Level>(["A1", "A2", "B1", "B2", "C1"]);
const modes = new Set<AiMode>(["tutor", "grammar_explain", "writing_feedback", "writing_model", "speaking_feedback", "speaking_audio_feedback", "vocabulary_deep_dive", "answer_assess"]);

type RateBucket = { count: number; resetAt: number };
const rateBuckets = new Map<string, RateBucket>();
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const MAX_AUDIO_BASE64 = 1_500_000;
const allowedAudioTypes = new Set(["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg", "audio/mp3", "audio/wav", "audio/aac", "audio/flac"]);

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function rateLimited(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const now = Date.now();
  const current = rateBuckets.get(ip);

  if (!current || current.resetAt <= now) {
    rateBuckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }

  current.count += 1;
  return current.count > RATE_LIMIT;
}

function tutorPrompt(level: Level, text: string, context: string) {
  return `You are DeutschMate Tutor, a rigorous but encouraging German teacher.

Learner level: ${level}
Learner question: ${text}
Optional lesson context: ${context || "None provided"}

Teach for genuine German competence, not gamification. Prefer clear explanation, idiomatic German, useful examples, and explicit grammar when relevant.

Rules:
- Match the learner's CEFR level.
- Use English for explanations unless German is clearer.
- Give German examples with English glosses when helpful.
- Correct misconceptions directly.
- When the learner asks about grammar, explain the rule, show 3-5 examples, then give one short production task.
- When the learner asks for a translation, explain important grammar/collocations rather than only returning a translation.
- Do not overwhelm an A1/A2 learner with advanced terminology.
- End with a short "Try it yourself" prompt unless the request is purely factual.
- Never claim the learner has mastered a skill based on one answer.
`;
}

function grammarPrompt(level: Level, text: string, context: string) {
  return `You are the grammar instructor inside DeutschMate.

Target level: ${level}
Topic/question: ${text}
Lesson context: ${context || "None provided"}

Give a structured German grammar explanation with:
1. What the structure means and when it is used
2. The rule or pattern
3. A compact table only if it genuinely helps
4. 4 idiomatic examples with English translations
5. Common learner mistakes
6. A 3-item mini exercise without answers first, then put answers under a clearly separated "Answers" heading

Keep the explanation accurate, practical, and appropriate to ${level}. Do not turn it into a game.
`;
}

function writingPrompt(level: Level, text: string, context: string) {
  return `You are the writing tutor inside DeutschMate. Assess the learner's German writing as a teacher, not as a ghostwriter.

Target CEFR level: ${level}
Task/prompt: ${context || "General German writing practice"}
Learner text:
---
${text}
---

Return feedback in exactly these sections:

OVERALL
Give a concise assessment of communicative success and whether the writing is broadly appropriate for ${level}. Do not invent an official exam score.

CORRECTIONS
List the important errors as:
- Original → Better version — brief reason
Prioritize grammar, word order, case, verb form, article/adjective endings, spelling, and punctuation.

VOCABULARY & NATURALNESS
Identify awkward wording and suggest more idiomatic collocations or expressions suitable for ${level}.

COHESION & REGISTER
Comment on structure, connectors, paragraphing, and whether the register fits the task.

WHAT TO PRACTISE NEXT
Give the 3 highest-value skills to practise next.

REVISED VERSION
Provide a corrected version that preserves the learner's ideas and approximate complexity. Do not substantially upgrade it beyond ${level} and do not replace the learner's voice with a model essay.
`;
}

function writingModelPrompt(level: Level, text: string, context: string) {
  return `You are providing a comparison model for a German learner only after they have already written their own draft.

Target CEFR level: ${level}
Writing task: ${context || "General German writing practice"}
Learner draft:
---
${text}
---

Write a model response that:
- fully addresses the same task,
- stays genuinely within ${level} rather than showing off advanced language,
- uses clear paragraphing and natural collocations,
- is not a rewrite of the learner's draft,
- is followed by a short section called "NOTICE" with 5 features the learner should compare against their own text.

Do not assign an official exam score.
`;
}

function speakingPrompt(level: Level, text: string, context: string) {
  return `You are the speaking coach inside DeutschMate.

Target CEFR level: ${level}
Speaking task: ${context || "General German speaking practice"}
Speech-recognition transcript:
---
${text}
---

Treat the transcript as imperfect evidence of what the learner said. Do not claim to assess pronunciation from text alone.

Return feedback in exactly these sections:

COMMUNICATIVE SUCCESS
Explain whether the learner addressed the task clearly and appropriately for ${level}.

GRAMMAR & WORD ORDER
Identify the most important recurring grammar or sentence-structure issues. Give corrected examples.

VOCABULARY & NATURALNESS
Suggest more idiomatic chunks, collocations or reformulations at ${level}. Do not upgrade everything to advanced German.

FLUENCY & ORGANISATION
Comment only on what can reasonably be inferred from the transcript: repetition, sentence linking, organisation and range. State explicitly that pronunciation cannot be evaluated from a transcript.

NEXT SPEAKING TARGET
Give 3 specific things to practise in the next attempt.

MODEL OUTLINE
Give a short outline and useful phrases for a stronger second attempt, not a full script to memorise.
`;
}



function answerAssessmentPrompt(level: Level, text: string, context: string) {
  return `You are the inline answer assessor inside DeutschMate.

Target CEFR level: ${level}
Learner answer:
---
${text}
---

Exercise context, prompt, source text and/or expected answer:
---
${context}
---

Assess the learner's actual answer, not their general ability. Be strict enough to teach, but accept valid alternative wording and minor mistakes that do not block the target skill.

Return ONLY valid JSON with this exact shape and no markdown:
{
  "verdict": "correct" | "almost" | "needs_work",
  "score": integer from 0 to 100,
  "feedback": "1-3 concise sentences explaining what works and what needs attention",
  "correction": "a corrected or stronger German answer; empty string if no correction is needed",
  "microTip": "one short reusable grammar, vocabulary or comprehension tip"
}

Rules:
- Do not penalize an answer merely because it differs from a reference answer.
- For comprehension, judge meaning first and German accuracy second unless the task explicitly tests form.
- For grammar/lexis production, judge the target structure directly.
- For open production, judge task completion, clarity, grammar and naturalness at ${level}.
- Never claim this is an official CEFR or Goethe score.
`;
}

function speakingAudioPrompt(level: Level, context: string) {
  return `You are the speaking and pronunciation coach inside DeutschMate. Listen carefully to the attached German audio.

Target CEFR level: ${level}
Speaking task and optional transcript/context:
---
${context || "General German speaking practice"}
---

Assess only what is genuinely audible. If recording quality makes something uncertain, say so instead of guessing.

Return feedback in exactly these sections:

TASK & MEANING
How successfully the learner communicates the requested message at ${level}.

PRONUNCIATION & INTELLIGIBILITY
Comment on specific sounds, word stress, endings, consonant/vowel distinctions and intelligibility. Quote short words or phrases you actually hear when useful.

RHYTHM & FLUENCY
Comment on pausing, chunking, pace, hesitation and sentence rhythm.

GRAMMAR & VOCABULARY
Identify the highest-value spoken grammar or lexical issues you can hear, with concise corrected examples.

SECOND ATTEMPT
Give 3 concrete changes for the learner's next recording and 3 useful German chunks for the task.

Do not assign an official Goethe score and do not claim native-like pronunciation is required.
`;
}

function vocabularyPrompt(level: Level, text: string, context: string) {
  return `You are the lexical coach inside DeutschMate.

Target CEFR level: ${level}
German item: ${text}
Existing course context:
---
${context || "None provided"}
---

Build a reliable learner dictionary entry. Do not invent uncertain morphology; explicitly mark uncertainty if necessary.

Return exactly these sections:

CORE FORM
For nouns: article, singular and plural. For verbs: infinitive, 3rd-person present, Präteritum and Partizip II when useful. For adjectives: base form and common comparison if relevant.

MEANING & REGISTER
Give the main meaning(s), typical register and one important usage distinction.

COLLOCATIONS
Give 4-6 high-value collocations or chunks that a learner at ${level} should know.

WORD FAMILY
Give genuinely related German words and label their part of speech.

EXAMPLES
Give 4 idiomatic example sentences appropriate to ${level}, each with a concise English translation.

COMMON MISTAKE
Give one likely learner mistake and the corrected form.
`;
}

function extractText(payload: any): string {
  if (typeof payload?.output_text === "string") return payload.output_text;
  if (typeof payload?.outputText === "string") return payload.outputText;

  const steps = Array.isArray(payload?.steps) ? payload.steps : [];
  for (let i = steps.length - 1; i >= 0; i -= 1) {
    const content = steps[i]?.content;
    if (!Array.isArray(content)) continue;
    const parts = content
      .map((item: any) => (typeof item?.text === "string" ? item.text : ""))
      .filter(Boolean);
    if (parts.length) return parts.join("\n");
  }

  return "";
}

export async function POST(request: Request) {
  if (rateLimited(request)) {
    return NextResponse.json(
      { error: "Too many AI requests. Please try again shortly." },
      { status: 429, headers: { "Cache-Control": "no-store" } },
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Gemini is not configured on this deployment yet." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const mode = clean(body.mode, 40) as AiMode;
  const level = clean(body.level, 4).toUpperCase() as Level;
  const text = clean(body.text, 12000);
  const context = clean(body.context, 5000);
  const rawAudio = typeof body.audio === "string" ? body.audio : "";
  const rawMime = clean(body.mimeType, 80).toLowerCase();
  const mimeType = rawMime.split(";")[0];
  const audioMode = mode === "speaking_audio_feedback";

  if (!modes.has(mode) || !levels.has(level)) {
    return NextResponse.json({ error: "Invalid AI task." }, { status: 400 });
  }

  if (audioMode) {
    if (!rawAudio || rawAudio.length > MAX_AUDIO_BASE64 || !allowedAudioTypes.has(mimeType)) {
      return NextResponse.json({ error: "Invalid or oversized audio recording." }, { status: 400 });
    }
  } else if (!text) {
    return NextResponse.json({ error: "This AI task needs text input." }, { status: 400 });
  }

  const prompt =
    mode === "answer_assess"
      ? answerAssessmentPrompt(level, text, context)
      : mode === "writing_feedback"
      ? writingPrompt(level, text, context)
      : mode === "writing_model"
        ? writingModelPrompt(level, text, context)
        : mode === "speaking_feedback"
          ? speakingPrompt(level, text, context)
          : mode === "speaking_audio_feedback"
            ? speakingAudioPrompt(level, context)
            : mode === "vocabulary_deep_dive"
              ? vocabularyPrompt(level, text, context)
              : mode === "grammar_explain"
                ? grammarPrompt(level, text, context)
                : tutorPrompt(level, text, context);

  const input = audioMode
    ? [
        { type: "text", text: prompt },
        { type: "audio", data: rawAudio, mime_type: mimeType },
      ]
    : prompt;

  const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";

  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        model,
        input,
        store: false,
      }),
      cache: "no-store",
    });

    const payload = await response.json();

    if (!response.ok) {
      const upstreamMessage =
        typeof payload?.error?.message === "string"
          ? payload.error.message
          : "Gemini request failed.";
      return NextResponse.json(
        { error: upstreamMessage },
        { status: response.status, headers: { "Cache-Control": "no-store" } },
      );
    }

    const reply = extractText(payload);
    if (!reply) {
      return NextResponse.json(
        { error: "Gemini returned an empty response." },
        { status: 502, headers: { "Cache-Control": "no-store" } },
      );
    }

    if (mode === "answer_assess") {
      try {
        const cleaned = reply.replace(/^\`\`\`(?:json)?\s*/i, "").replace(/\s*\`\`\`$/i, "").trim();
        const assessment = JSON.parse(cleaned);
        const verdicts = new Set(["correct", "almost", "needs_work"]);
        if (
          !verdicts.has(assessment?.verdict) ||
          typeof assessment?.score !== "number" ||
          typeof assessment?.feedback !== "string" ||
          typeof assessment?.correction !== "string" ||
          typeof assessment?.microTip !== "string"
        ) throw new Error("Bad assessment payload");
        return NextResponse.json(
          { assessment: { ...assessment, score: Math.max(0, Math.min(100, Math.round(assessment.score))) }, model },
          { headers: { "Cache-Control": "no-store" } },
        );
      } catch {
        return NextResponse.json({ error: "Gemini returned an invalid assessment." }, { status: 502 });
      }
    }

    return NextResponse.json(
      { reply, model },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Could not reach Gemini." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
