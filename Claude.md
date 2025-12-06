# Videotrack Project Overview

## Project Overview

**Project Name:** Videotrack

**Description:** A physics video analysis program that allows users to upload
videos or input YouTube video URLs to perform video tracking for data
collection. Users can set scale parameters and generate graphs based on physics
concepts.

**Primary User / Use Case:** Physics students and educators who need to analyze
motion in videos, track objects over time, collect position/time data, and
visualize physics relationships through graphing.

## Tech Stack

- **Framework:** React Router v7 (Epic Stack / Remix-style full-stack framework)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (utility-first)
- **UI Components:** shadcn/ui (Radix UI components)
- **Database ORM:** Prisma
- **Database:** SQLite (local development)
- **Build Tool:** Vite
- **Testing:**
  - Unit/Integration: Vitest + React Testing Library
  - E2E/Browser: Playwright
- **Deployment:** Fly.io (configured)
- **Future Consideration:** Python backend/API for YouTube video processing (not
  yet implemented)

## Non-negotiable Workflow

**MUST follow `.cursor/rules/ai-workflow.mdc`.**

**MUST always read at the start of each session:**

- `Claude.md` (this file)
- `features.json`
- `progress.md`

**MUST work feature-by-feature, in order**, implementing features sequentially
as defined in `features.json`. Only one feature per iteration.

## Testing

**Unit Tests:**

- Command: `npm test`
- Tool: Vitest with React Testing Library
- Location: Files matching `**/*.{test,spec}.{ts,tsx}`

**E2E/Browser Tests:**

- Command: `npm run test:e2e`
- Tool: Playwright
- Location: `tests/e2e/**/*.test.ts`

**Test Requirements:**

- A feature may only be marked complete (`implemented=true`,
  `tests_passed=true`) when:
  1. Implementation is complete
  2. All automated tests pass (`npm test` and `npm run test:e2e`)
  3. Any manual interaction checks described in the feature tests are verified

**Manual Checks:**

- Some features may require manual browser interaction checks
- These should be documented in the feature's `tests` array
- Manual checks must be performed and noted in `progress.md` before marking
  complete

## Git & Commits

**Conventional Commit Style:**

- Feature commits: `feat: F001 short description`
- Bug fixes: `fix: F001 test adjustments`
- Chores: `chore: initialize project and AI workflow`

**Commit Guidelines:**

- Always commit in a working, mergeable state
- One commit per feature completion
- Include feature ID in commit message

## Current State

This project is built on the Epic Stack template, which includes:

- User authentication (login, signup, password reset, passkeys)
- User profiles and settings
- Notes functionality (example feature)
- Basic admin features

**Development Approach:**

- Existing authentication and user management code should be preserved
- New video tracking features should be added alongside existing functionality
- Respect existing code patterns and conventions
