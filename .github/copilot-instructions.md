# GitHub Copilot instructions for DeutschMate

DeutschMate is a Next.js 16 App Router learning product, not a marketing-only website.

## Product goal
Keep the platform focused on taking a learner from absolute beginner German to C1 through structured lessons, active recall, deliberate output, and visible progress.

## Architecture rules
- Use TypeScript and the Next.js App Router.
- Keep curriculum content data-driven. Do not hardcode course content into React pages when it belongs in `lib/course-content.json`.
- Use helpers in `lib/course.ts` to query units, vocabulary, grammar, and adjacent lessons.
- Keep interactive state in focused client components; default to server components for static pages.
- Preserve static-export compatibility unless a deliberate backend migration is being implemented.
- Do not introduce Server Actions, middleware/proxy, dynamic API routes, or runtime-only Next.js features while GitHub Pages remains the production target.
- Avoid large UI dependencies unless they provide clear value. The existing CSS design system is intentional.
- Preserve accessibility: semantic landmarks, keyboard-operable controls, labels, sufficient contrast, and reduced ambiguity in button text.

## Learning UX rules
- A lesson should always make the learning outcome explicit.
- Prefer active recall and learner output over passive content.
- New lesson content should include vocabulary, grammar, examples, a quiz, and at least one production task.
- Keep German examples idiomatic and appropriate to the stated CEFR level.
- Do not inflate CEFR difficulty by merely using longer sentences; use the grammatical, lexical, register, and discourse skills appropriate to the level.
- Pronunciation buttons should use `de-DE` speech synthesis.

## Progress model
- v1 state is local-first via `ProgressProvider` and localStorage.
- Any future cloud-sync implementation must migrate or preserve local progress rather than silently discarding it.
- Unit completion and quiz attempts should remain independently tracked.

## Design language
- Calm editorial learning product: warm neutral background, deep green primary, yellow accent.
- Keep layouts spacious and information-dense without feeling dashboard-heavy.
- Reuse existing classes and tokens in `app/globals.css` before adding new one-off styles.

## Quality bar
Before merging a feature, check:
1. `npm run typecheck`
2. `npm run build`
3. mobile layout
4. static-export compatibility
5. no regression to existing curriculum routes
