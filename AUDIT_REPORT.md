# D.I.Y.A — Portfolio-Readiness Audit Report

_Date: 2026-06-14 · Auditor: senior full-stack review · Scope: full repo + live run-through_

This report was produced **after** a full source inspection and a **live end-to-end run** of the
real backend (`server.js` + SQLite + workflow engine) with the `ANTHROPIC_API_KEY` intentionally
unset, to verify demo-safe behavior. Findings are grouped by category; fixes implemented in this pass
are tracked in `CHANGELOG_AUDIT.md` and summarized at the bottom.

---

## 0. How it was verified

| Step | Result |
|---|---|
| `npm install` (frontend) | ✅ 283 pkgs, no fatal errors |
| `npm run build` (frontend) | ✅ 2255 modules, `dist/` produced |
| `cd server && npm install` | ✅ 207 pkgs |
| `node seed.js` on a **fresh** clone | ❌ **Crashed** — `no such table: users` |
| `node server.js` | ✅ Boots, prints "AI Workflow Engine: DISABLED" |
| `GET /api/health` | ✅ `{status:"ok", ai_enabled:false, db:"connected"}` |
| Login professor / student (seeded) | ✅ JWT returned |
| Forum list / workflow queue / admin metrics | ✅ Real data returned |
| Post question (AI off) | ✅ Topic classified via keyword fallback, escalated correctly |
| **Authz probe**: student reads workflow queue | ✅ Correctly `403` (role gate works) |
| **Authz probe**: student posts to a group they never joined | ❌ **`200` — accepted** (RBAC hole) |
| **Error probe**: post to non-existent group | ❌ **Raw SQLite stack trace HTML leaked to client** |
| Self-check with no API key | ✅ Graceful `503` |

---

## 1. What is working correctly

- **Frontend builds cleanly** with Vite (no type or bundling errors).
- **Backend boots and is stable**; schema auto-creates with sensible migrations (`ALTER TABLE … ADD COLUMN` guards).
- **Auth is real and reasonable**: bcrypt (cost 12), JWT (7-day), register/login/me/profile all work.
- **Role gating works** where applied: `requireRole('professor')` correctly returns 403 for students on professor-only routes.
- **The AI workflow engine is real, not faked.** `routeQuestion` classifies topic → checks duplicates (Jaccard) → RAG retrieval → drafts answer → scores confidence → routes/escalates → records a workflow item → updates confusion clusters. With AI **disabled** it degrades gracefully (keyword topic fallback, deterministic escalation).
- **RAG is genuinely implemented** with local embeddings (`all-MiniLM-L6-v2`), real chunking + cosine similarity, and PDF/DOCX/TXT/MD extraction. No external vector DB needed.
- **Observability is real**: `ai_metrics` is written on every model call; `/api/admin/metrics` aggregates latency, tokens, error and escalation rates from actual rows.
- **The seed script is excellent** — it produces a believable CHEM 1301 class with 14 questions, verified/pending/escalated mix, approved answers, clusters, an intervention with tracked effectiveness, office-hour requests, a self-check report, and 15 metric rows.
- **Most professor pages are correctly wired**: they resolve `:groupName` → `groupId` via `api.groups.byName()` and call real endpoints (ForumPage, WorkflowQueuePage, AdminPage, KnowledgeBasePage, ApprovedAnswersPage, AnalysisPage, InterventionPage).
- **File uploads are already size-limited (20 MB) and type-checked**, and stored as text chunks — raw files are not persisted.

## 2. What is broken / likely broken (blockers)

| # | Severity | Issue |
|---|---|---|
| B1 | 🔴 Blocker | **`seed.js` crashes on a fresh clone** (`no such table: users`). The DB schema lives only inside `server.js`, so the documented "seed first" path fails until the server has run once. |
| B2 | 🟠 High | **`react` / `react-dom` are declared only as _optional_ `peerDependencies`.** The app currently builds only because `@mui/material` drags React in transitively. A dependency change could silently break a clean install. They must be explicit `dependencies`. |
| B3 | 🟠 High | **Backend `test` script intentionally fails** (`echo "Error: no test specified" && exit 1`). There are zero tests in the repo. |
| B4 | 🟠 High | **Raw SQLite errors (with absolute file paths + stack traces) are returned to the browser** for unhandled cases — Express 5's default error page. Both a security leak and a polish failure. |
| B5 | 🟡 Med | **No root run scripts** beyond `dev`/`build` — no `server`, `dev:all`, `preview`, `seed`, `check`, or `test`. Cloning + running requires reading `start.sh`. |

## 3. What is only partially implemented / fake (demo-only)

These pages render **hardcoded arrays** and never call the backend, even though a real API exists:

| Page | Status | Real backend exists? |
|---|---|---|
| `RequestsPage.tsx` (professor office-hours) | 100% mock (`Sarah Johnson`, `Michael Chen`…) | ✅ `/api/groups/:id/requests` exists and is unused |
| `EditGroupPage.tsx` | No API calls | partial (no update-group endpoint) |
| `CalendarPage.tsx` | No API calls | ❌ no calendar endpoint |
| `TopicDetailPage.tsx` | No API calls | partial (analysis exists) |
| `student/TopicAnalysisPage.tsx` | No API calls | partial |
| `/invite` route | Hardcoded `Prof. A` / `CS 1337` props | n/a (static popup) |

Also: the entire **`client/` directory is a dead, older duplicate frontend** (its own `package.json`, `vite.config.ts`, `src/`). It is not referenced by the root app (`index.html` → `/src/main.tsx`). It doubles install surface and confuses reviewers.

## 4. Auth / role-permission issues (most important security category)

| # | Severity | Issue |
|---|---|---|
| A1 | 🔴 Critical | **No group-membership authorization.** A logged-in student who is **not** a member of a group can both **read** (`GET /groups/:id/forum` → 200) and **post** (`POST /groups/:id/forum` → 200) to it. Verified live. The same applies to group details, members, requests, clusters, interventions, approved-answers, knowledge list. |
| A2 | 🟠 High | **Professors are not checked for group ownership.** Any professor can hit `/workflow/queue/:groupId`, upload knowledge to, or resolve items for **another professor's** group. |
| A3 | 🟡 Med | **`/admin/metrics` and `/admin/queue-health` are global**, not scoped to the requesting professor's groups — one professor sees aggregate stats across all classes. |
| A4 | 🟡 Med | **`JWT_SECRET` silently falls back to a hardcoded `'diya-dev-secret'`.** Fine for dev, dangerous if deployed unchanged. Should fail loudly in production. |

## 5. Data-flow / API-frontend mismatches

- `api.ts` methods otherwise map 1:1 to backend routes — verified each. No broken URLs.
- `health()` return type omits the `db` field the server adds (harmless, ignored).
- `/api/workflow/summary/:groupId` has `requireAuth` but **no role/membership gate** (any member can read summary). Low risk once A1 is fixed.
- `recordWorkflowItem` uses `INSERT OR REPLACE` but `workflow_items` has **no `UNIQUE(question_id)`** constraint, so the "replace" never dedupes. Latent only (one call per question today).

## 6. Missing validation / error states

- Most write routes validate required fields, but unhandled DB/AI errors fall through to Express's raw error page (B4).
- Frontend uses `alert()` for some error paths (GroupPage create). Acceptable, not polished.
- No central Express error handler; no 404 JSON handler for unknown `/api/*`.

## 7. Missing tests / scripts / CI

- **No tests** (frontend or backend). No `node:test`, no Vitest, nothing.
- **No CI** (`.github/workflows` absent).
- **No `server/.env.example`** — README tells you to create `server/.env` by hand.
- **No `seed` npm script**, no `TESTING.md`, no frontend typecheck (`tsc` not installed, no `tsconfig.json`).

## 8. Security concerns

- **Error/stack-trace leakage** (B4).
- **CORS origin is hardcoded** to a `localhost` regex — cannot be configured for a real deployment via env.
- **No rate limiting** anywhere (auth endpoints included).
- `dotenv` v17 prints a promotional "tip" line on boot (noise, not a leak).
- Uploads are already type/size-checked ✅. User content is rendered as plain text (React escapes by default) ✅.

## 9. Deployment blockers

- CORS not env-configurable.
- `JWT_SECRET` not enforced.
- No production start guidance for the SPA (`dist/`) or for serving the API behind the SPA.
- 7.9 MB `D.I.Y.A Workflow Ideation.pdf` and a 108 KB GIF are committed — heavy for a portfolio clone.

## 10. Portfolio presentation gaps

- Dead `client/` directory.
- README has no **seed step**, **demo credentials**, **"what this demonstrates"**, **"known limitations"**, or **screenshots** section.
- No CI badge, no test story — recruiters can't see engineering rigor at a glance.

---

## Fix plan (priority order) — see CHANGELOG_AUDIT.md for what was actually done

- **P1 Runs cleanly:** shared schema module so `seed.js` works on a fresh clone (B1); explicit React deps (B2); real root scripts incl. `dev:all`, `seed`, `check`, `test` (B5); `server/.env.example`; backend `test` runs real tests (B3).
- **P2 Data wiring:** wire `RequestsPage` to the real office-hours API; document remaining mock pages as explicit demo views.
- **P3 Auth:** `assertGroupAccess()` helper enforcing professor-ownership / student-membership on every group-scoped route (A1/A2); global error handler hiding internals (B4); `JWT_SECRET` fails loudly in production (A4).
- **P4 AI/RAG demo-safe:** robust try/catch already present; add central error handler + keep deterministic fallbacks; surface "AI disabled" in health-driven UI.
- **P5 Tests + CI:** `node:test` suites for auth, groups, forum, workflow, RBAC, admin + unit tests for workflow/RAG helpers; GitHub Actions running backend tests + frontend build/typecheck; `TESTING.md`.
- **P6 Polish:** seed notifications; README sections (demo creds, what-it-demonstrates, limitations, screenshots).
- **P7 Security:** env-configurable CORS; validation + error handler; deployment notes; documented rate-limit decision.
