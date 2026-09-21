# DeutschMate

**DeutschMate** is an interactive German learning platform built with Next.js, designed to take a learner from absolute beginner (A1) to advanced C1 through a structured CEFR-aligned path.

## What is included

- 40 structured A1 → C1 learning units
- 800 vocabulary items
- 80 grammar explanations with examples
- 200 lesson quiz questions
- Pronunciation via browser German text-to-speech
- Vocabulary flashcards and mixed review quizzes
- Searchable vocabulary and grammar libraries
- Unit completion, quiz history, study streaks, and daily goals
- Responsive light/dark UI
- Static Next.js export for zero-cost GitHub Pages hosting

## Tech stack

- Next.js 16.3.3 (App Router)
- React 19.2
- TypeScript
- CSS design system (no component-framework dependency)
- Browser localStorage for v1 progress persistence
- GitHub Actions + GitHub Pages

## Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Run a production build:

```bash
npm run build
```

The app uses `output: "export"`; static production files are emitted to `out/`.

## Course architecture

Curriculum content lives in `lib/course-content.json`. UI code reads this through `lib/course.ts`, which exposes level, lesson, vocabulary and grammar helpers. New units can therefore be added without changing lesson-page UI code.

Progress is intentionally local-first in v1. The next backend milestone can add authentication and cloud sync without changing the curriculum model.

## Deployment

`.github/workflows/deploy-pages.yml` builds the Next.js static export and deploys it to GitHub Pages on every push to `main`.

Expected site URL after Pages is enabled:

`https://devessaahmed.github.io/DeutschMate/`
