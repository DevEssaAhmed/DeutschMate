# DeutschMate

**DeutschMate** is a serious, coursebook-style German learning platform built with Next.js. The goal is genuine A1 → C1 competence rather than a short-game loop.

## What is implemented

- **50 CEFR modules** — 10 each for A1, A2, B1, B2 and C1
- **300 structured lessons** — 6 stages per module
- Learning sequence: **context/input → explicit grammar → vocabulary & chunks → reading/listening → guided production → review**
- Existing corpus retained and redistributed through the new course engine:
  - 800 vocabulary source items
  - 80 grammar explanations
  - 200 source checkpoint questions
- Reading Lab with prediction, gist, detail, language analysis and post-reading production
- Listening Lab with transcript delay, repeated listening, dictation, transcript reveal and shadowing
- Speaking Studio with CEFR tasks, browser speech recognition where supported, and Gemini transcript feedback
- Writing Studio with planning, level-appropriate chunks, autosaved local drafts, teacher feedback and post-feedback comparison models
- Explicit Grammar reference integrated with transformation/production
- Richer Vocabulary reference with lemma/type/article where source data supports it
- Spaced vocabulary review stored locally in the browser
- Integrated A1/A2/B1/B2/C1 internal assessments
- CEFR can-do progress across reading, listening, speaking, writing, grammar and vocabulary
- Server-side Gemini Tutor and feedback routes
- No database required; learning state is local-first

## Lesson completion

Lessons are not completed with a manual "mark done" toggle. The lesson engine requires:

1. at least three controlled-practice attempts,
2. a writing or speaking production attempt,
3. completion of the checkpoint,
4. at least two-thirds of checkpoint items correct.

The resulting lesson and competency evidence are stored in `localStorage`.

## Tech stack

- Next.js 16.3.3 App Router
- React 19.2
- TypeScript
- Server-side Gemini integration
- Browser speech synthesis and optional speech recognition
- localStorage for progress, drafts and review scheduling
- GitHub Actions CI

## AI configuration

Create `.env.local` from `.env.example`:

```bash
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-3.8-flash
```

The credential is read only in `app/api/gemini/route.ts`. Never use a `NEXT_PUBLIC_` Gemini variable.

Supported AI tasks currently include:

- focused German tutor
- grammar deep dives
- writing feedback
- post-feedback writing comparison model
- transcript-based speaking feedback

## Development

```bash
npm ci
npm run audit:curriculum
npm run typecheck
npm run build
npm run dev
```

## Curriculum architecture

- `lib/module-specs.ts` — 50 authored module briefs: context, can-do outcomes, grammar focus, genres, production tasks, chunks and German anchor material.
- `lib/curriculum.ts` — generates the six-stage lesson sequence, distributes the existing vocabulary/grammar corpus, creates reading/listening tasks, checkpoints and level assessments.
- `lib/cefr.ts` — can-do descriptors used by the competency dashboard.
- `lib/content/*.json` — original vocabulary/grammar/quiz corpus retained as source material.

## Quality gates

CI runs `scripts/audit-curriculum.mjs` before TypeScript/build validation. The audit checks module counts per level, required module content, duplicate keys, minimum vocabulary/grammar/question corpus sizes, expected 300-lesson generation, and accidental Gemini secret exposure.

## Deployment

DeutschMate requires a server-capable Next.js host because Gemini calls are handled by `/api/gemini`. Vercel is the intended production host.

Set `GEMINI_API_KEY` in Vercel as a server environment variable and deploy the `main` branch.
