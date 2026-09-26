# DeutschMate agent guide

Read `.github/copilot-instructions.md` before making substantial changes.

## Current product architecture

DeutschMate v2 is a serious A1→C1 digital German course, not the old 40-unit flashcard/quiz app.

Primary surfaces:
- `/` — Today dashboard
- `/learn` — 50-module / 300-lesson A1→C1 course
- `/learn/[level]/[module]/[lesson]` — evidence-based lesson workspace
- `/reading` — Reading Lab
- `/listening` — Listening Lab
- `/speaking` — Speaking Studio
- `/writing` — Writing Studio
- `/grammar` — explicit grammar reference and production prompts
- `/vocabulary` — richer A1→C1 lexicon
- `/practice` — spaced vocabulary review
- `/assessments` — integrated CEFR checkpoints
- `/progress` — can-do competency profile
- `/tutor` — Gemini German tutor

## Source of truth

- `lib/module-specs.ts`: authored 50-module course plan.
- `lib/curriculum.ts`: generates 300 lesson records, labs, assessments, vocabulary distribution and lesson helpers.
- `lib/cefr.ts`: competency descriptors.
- `lib/content/*.json`: retained vocabulary/grammar/question source corpus.
- `components/progress-provider.tsx`: local-first progress, competency evidence and spaced review.

Do not reintroduce the deleted v1 lesson/practice/progress components.

## Required verification

Run:
1. `npm run audit:curriculum`
2. `npm run typecheck`
3. `npm run build`

Production target: server-capable Next.js hosting on Vercel. Gemini credentials are server-only.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
