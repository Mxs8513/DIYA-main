# Audit Fix Changelog

Changes made during the portfolio-readiness pass. Grouped by priority. Every
group was verified with the relevant command (results in the PR summary).

## P1 — Runs cleanly from a fresh clone
- **`server/db.js` (new)** — extracted the full schema + migrations into a shared
  module. **Fixes the fresh-clone crash** where `node seed.js` failed with
  `no such table: users` (schema previously lived only in `server.js`). Supports
  `DB_PATH` for isolated test databases.
- **`server/server.js`** — now uses `createDb()`; removed the duplicated inline schema.
- **`server/seed.js`** — uses `createDb()` so seeding works before the server has ever run.
- **`package.json`** — `react`/`react-dom` promoted from _optional peerDependencies_
  to real `dependencies`; added `typescript` + `@types/react*`; added scripts:
  `preview`, `check`, `server`, `dev:server`, `seed`, `dev:all`, `test`.
- **`server/package.json`** — `test` now runs `node --test` (was `exit 1`); added `seed`.
- **`scripts/dev-all.mjs` (new)** — zero-dependency runner for backend + frontend.
- **`tsconfig.json` (new)** — enables `npm run check` (type-check passes).
- **`server/.env.example` (new)** — documented config; copy to `.env`.

## P2 — Frontend/backend data wiring
- **`src/app/components/RequestsPage.tsx`** — was 100% hardcoded mock data; now
  resolves `groupName → id`, loads real office-hour requests, and approves/declines/
  completes via the API with optimistic updates and **loading / empty / error /
  success** states.

## P3 — Auth & role access
- **`server/server.js`**:
  - `userCanAccessGroup()` + `requireGroupAccess()` — enforce professor-ownership /
    student-membership on **every** group-scoped route (forum, requests, workflow,
    clusters, interventions, approved-answers, analysis, knowledge, members, group
    detail, by-name). Inline checks added to question- and item-level routes.
    **Closes the hole** where any logged-in user could read/write any group.
  - Central **error handler** — generic messages only (no SQLite stack traces / file
    paths); JSON `404` for unknown `/api/*`.
  - `JWT_SECRET` — refuses to boot in production on the dev fallback.
  - App is exported (`module.exports = { app, db }`) and only `listen()`s when run
    directly, so tests can drive it in-process.

## P4 — AI/RAG demo-safe
- **`src/app/components/student/StudentSelfCheckPage.tsx`** — proactively checks
  `/api/health` and shows a clear "AI grading is currently disabled" banner +
  disabled button when no key is set (instead of only erroring after submit).
- Backend already degrades deterministically; the new error handler also covers
  AI/PDF/embedding failures.

## P5 — Tests & CI
- **`server/test/helpers.js`** — boots the real app against an isolated temp DB.
- **`server/test/api.test.js`** — 20 integration tests (auth, groups, forum,
  workflow, approval/rejection, knowledge, admin, self-check 503, **RBAC 403s**,
  error hygiene).
- **`server/test/workflow.test.js`** — unit tests for AI-disabled fallbacks.
- **`server/test/rag.test.js`** — unit tests for chunking + cosine similarity.
- **`.github/workflows/ci.yml`** — backend tests + frontend type-check/build.
- **`TESTING.md`** — coverage map.

## P6 — Portfolio polish
- **`server/seed.js`** — added 4 demo notifications.
- **`README.md`** — corrected setup path (matches the code), Demo Credentials,
  Available Scripts, Testing & CI, **What This Project Demonstrates**, **Known
  Limitations / Future Work**, Security Notes, Deployment Notes, Screenshot
  checklist; updated project structure.
- **`AUDIT_REPORT.md`** (this audit) and this changelog.

## P7 — Security & production readiness
- **CORS** is env-configurable via `CORS_ORIGIN` (`server/server.js`).
- **Request validation** added to `POST /api/auth/register` (email format,
  password length, name length).
- Error handler hides internals; uploads remain size/type-limited.
- Rate limiting intentionally deferred — documented in the README.
