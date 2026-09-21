# GitHub Copilot instructions for DeutschMate

DeutschMate is a Next.js 16 App Router learning product, not a marketing-only website or a gamified language app.

## Product goal
Take a learner from absolute beginner German toward genuine C1 competence through a structured digital course: explicit teaching, authentic input, controlled practice, guided production, free production, feedback, and cumulative review.

## Architecture rules
- Use TypeScript and the Next.js App Router.
- Curriculum lives in `lib/content/` as CEFR-level JSON files (`a1.json` through `c1.json`) plus shared metadata.
- Use helpers in `lib/course.ts` to query units, vocabulary, grammar, and adjacent lessons.
- Default to server components for static content and focused client components for interaction.
- Server Route Handlers are allowed and are the correct place for private third-party credentials.
- Never expose Gemini or other secret credentials through `NEXT_PUBLIC_` variables or client components.
- `app/api/gemini/route.ts` is the controlled Gemini gateway. Extend its task model rather than building arbitrary client-controlled prompts.
- Progress remains local-first via `ProgressProvider` and localStorage unless a deliberate migration is designed.
- No database is required for the current product.
- Avoid large UI dependencies unless they provide clear learning value.
- Preserve accessibility: semantic landmarks, keyboard-operable controls, labels, sufficient contrast, and clear feedback.

## Learning UX rules
- DeutschMate is a serious digital course, not a Duolingo clone.
- Use the sequence: teach → demonstrate → controlled practice → guided production → free production → feedback → review.
- Explicit grammar is a feature, not something to hide.
- Vocabulary should increasingly use collocations, chunks, word families, register, and examples rather than isolated translations.
- Reading and listening tasks should become longer and more authentic as CEFR level rises.
- Writing and speaking are first-class skills.
- AI should explain, diagnose, correct, and coach. It should not routinely do the learner's work for them.
- Keep German examples idiomatic and genuinely appropriate to the stated CEFR level.

## AI integration
- Gemini calls are server-side only.
- Use stateless Gemini interactions (`store: false`) unless product requirements explicitly change.
- Keep task prompts controlled on the server.
- Cap user input sizes and fail safely when Gemini is unavailable.
- Writing feedback should preserve the learner's ideas and level rather than silently upgrading everything to C1 prose.

## Design language
- Calm editorial learning product: warm neutral background, deep green primary, yellow accent.
- Serious but welcoming. Avoid cartoon rewards, hearts, gems, leagues, and noisy gamification.
- Information-dense screens are fine when they serve deliberate study.

## Quality bar
Before merging a feature:
1. `npm run typecheck`
2. `npm run build`
3. check mobile layout
4. verify no secret reaches client bundles
5. verify existing curriculum routes still work
