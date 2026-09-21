# GitHub Copilot instructions for DeutschMate

DeutschMate is a Next.js 16 App Router German-learning product designed for genuine CEFR competence, not a gamified tapping loop.

## Product model
The course has 5 CEFR levels, 50 modules and 300 lessons. Every module follows:
**context/input → explicit grammar → vocabulary & chunks → reading/listening → guided production → review**

The learner should spend meaningful time reading, listening, writing and speaking. Do not optimise the product around XP, hearts, gems, streak anxiety, leagues, endless multiple choice or one-click completion.

## Source of truth
- `lib/module-specs.ts` — 50 authored module briefs.
- `lib/curriculum.ts` — lesson generation, reading/listening tasks, assessments and curriculum helpers.
- `lib/cefr.ts` — can-do descriptors used for progress evidence.
- `lib/content/*.json` — retained A1→C1 vocabulary/grammar/question source corpus.
- `components/progress-provider.tsx` — local-first progress, spaced review and competency evidence.

Do not revive the removed v1 40-unit UI. The legacy two-segment lesson route only redirects old bookmarks to `/learn`.

## Architecture rules
- TypeScript + Next.js App Router.
- Prefer server components for static content and focused client components for interaction.
- No database is required at this stage.
- Progress, review and drafts stay local-first in `localStorage`.
- Private third-party credentials belong only in server Route Handlers or server environment variables.
- Never expose Gemini credentials using `NEXT_PUBLIC_`.
- Extend `app/api/gemini/route.ts` with controlled task modes; never build an arbitrary public prompt proxy.
- Keep input caps and failure handling on AI routes.
- Preserve accessibility and keyboard operation.

## Learning rules
- Explicit grammar is intentional.
- Vocabulary should move toward chunks, collocations, word families and register as level rises.
- Listening should delay transcript access; use gist → detail → dictation → transcript → shadowing.
- Reading should use prediction → gist → detail/inference → language analysis → production.
- Writing should require learner drafting before AI feedback or a comparison model.
- Speaking feedback based on transcripts must never pretend to evaluate pronunciation.
- AI explains, diagnoses, corrects and coaches; it should not routinely do the learner's work.
- Internal assessments are not official Goethe scores.

## Completion and progress
A lesson is completed only after:
- at least 3 controlled-practice attempts,
- a writing or speaking production attempt,
- the checkpoint is answered,
- at least two-thirds of checkpoint items are correct.

Progress should communicate CEFR can-do evidence across reading, listening, speaking, writing, grammar and vocabulary, not just raw lesson counts.

## Design language
Calm editorial coursebook/workspace. Warm neutrals, deep green primary, yellow accent. Long-form text must be comfortable to read. Avoid noisy gamification.

## Required quality gates
Before merging:
1. `npm run audit:curriculum`
2. `npm run typecheck`
3. `npm run build`
4. check responsive layouts
5. verify no secret reaches tracked source or client bundles
6. verify course/lab/assessment routes remain accessible
