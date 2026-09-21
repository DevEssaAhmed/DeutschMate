# DeutschMate agent guide

Read `.github/copilot-instructions.md` before making substantial changes.

Primary product surfaces:
- `/` product/dashboard landing page
- `/learn` full A1→C1 course map
- `/learn/[level]/[lesson]` lesson experience
- `/practice` flashcards and mixed quiz practice
- `/vocabulary` 800-item searchable vocabulary library
- `/grammar` searchable grammar reference
- `/progress` local progress analytics and study settings

Curriculum source of truth: `lib/course-content.json`.
Production target: GitHub Pages via static Next.js export.
