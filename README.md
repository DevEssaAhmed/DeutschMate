# DeutschMate

**DeutschMate** is a serious German learning platform built with Next.js, designed to take a learner from absolute beginner (A1) toward advanced C1 through a structured CEFR-aligned course, explicit grammar, vocabulary, production practice, and AI-assisted feedback.

## Current learning system

- 40 structured A1 → C1 learning units
- 800 vocabulary items
- 80 grammar explanations with examples
- 200 lesson quiz questions
- Pronunciation via browser German text-to-speech
- Vocabulary and grammar reference libraries
- Local-first progress, quiz history, study streaks, and daily goals
- AI Tutor for focused German questions and grammar explanations
- Writing Studio with CEFR-aware feedback that preserves the learner's own work

## Tech stack

- Next.js 16.3.3 (App Router)
- React 19.2
- TypeScript
- Server-side Gemini integration through a Next.js Route Handler
- Browser localStorage for learning progress
- No database required

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Add your Gemini credential to `.env.local`:

```bash
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-3.8-flash
```

**Never** expose the Gemini credential through a `NEXT_PUBLIC_` variable.

## Gemini architecture

The browser calls `POST /api/gemini`. The route handler validates a controlled task type, caps input size, builds the teaching prompt server-side, and calls Google's Gemini Interactions API with `store: false`.

Supported tasks:

- `tutor`
- `grammar_explain`
- `writing_feedback`

The API key never reaches the browser.

## Course architecture

Curriculum content lives in `lib/content/` as CEFR-level JSON files (`a1.json` through `c1.json`) plus shared metadata. UI code reads this through `lib/course.ts`.

Learning progress remains local-first. This version intentionally does not require a database.

## Deployment

DeutschMate now requires a server-capable Next.js host because `/api/gemini` runs at request time. GitHub Pages is no longer the production target.

Recommended deployment:

1. Import `DevEssaAhmed/DeutschMate` into Vercel.
2. Add `GEMINI_API_KEY` as a server environment variable.
3. Optionally add `GEMINI_MODEL=gemini-3.8-flash`.
4. Deploy the `main` branch.

The previous GitHub Pages site may remain accessible as a stale static build, but it cannot provide the server-side AI features.
