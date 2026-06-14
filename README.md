# D.I.Y.A — Digital Intake Yielding Answers

> An AI-powered academic workflow automation platform that routes student questions through an intelligent pipeline, surfaces confusion patterns, and enables professor-in-the-loop review — all backed by RAG-grounded answers from real course materials.

## 🔗 Live Demo

- **Live app:** _<!-- TODO: paste Vercel URL, e.g. https://diya-main.vercel.app -->_
- **API health:** _<!-- TODO: paste Render URL + /api/health -->_
- **Source:** https://github.com/Mxs8513/DIYA-main
- **Walkthrough (Loom):** _<!-- TODO: optional Loom link -->_

No signup needed — on the login page click **Enter as Professor** or **Enter as Student** to explore a seeded CHEM 1301 class.

> **Demo mode:** the public demo runs **live AI, strictly capped** to protect API usage — a tight daily/monthly spend budget plus per-user and per-IP rate limits ([details](#security-notes)). Post a question or run Self-Check to see real generation; once the demo's small budget is reached, the app shows a polished "live AI paused" message and the seeded AI workflow data (answers, confidence scores, escalations, clusters, interventions, metrics) remains fully explorable. The Admin dashboard shows live spend vs. the cap.

---

## What Is This?

D.I.Y.A started as a class forum tool and evolved into a full operational intelligence platform for academic environments. The core idea: instead of professors manually answering hundreds of repetitive student questions, D.I.Y.A intercepts each question, runs it through an AI routing engine, generates a draft answer grounded in the professor's own course materials, scores its own confidence, and only escalates to the professor when it's uncertain.

The result is a system where professors spend time on the questions that actually need them — not the ones Claude can handle in 500ms.

---

## Feature Summary

### For Students
- **Forum** — post questions to your class group, see AI-generated answers verified by your professor
- **Office Hours** — request 1-on-1 time with subject and preferred schedule
- **Self-Check** — upload your rubric + your work, get an AI grade with specific improvement suggestions before you submit
- **Group Join** — join classes via invite code

### For Professors
- **Workflow Queue** — review every AI-generated answer before it goes live; approve, reject, or override
- **Confusion Clusters** — automatic detection when ≥3/6/10 students ask about the same topic (medium/high/critical severity)
- **Interventions** — create targeted announcements, review sessions, or office hours in response to clusters; track whether they worked
- **Answer Library** — approved answers get stored and auto-served to future duplicate questions
- **Knowledge Base** — upload PDFs, DOCX, or notes; answers are grounded in your actual course material via RAG
- **Analytics** — AI-generated topic breakdown, question trends, engagement insights
- **Observability** — real-time AI metrics: latency, token usage, escalation rate, duplicate reduction rate, error tracking

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router 7, Tailwind CSS 4, shadcn/ui |
| Backend | Node.js, Express 5 |
| Database | SQLite (better-sqlite3, WAL mode) |
| Auth | JWT (jsonwebtoken), bcryptjs |
| AI | Anthropic Claude (`claude-haiku-4-5-20251001`) |
| Embeddings | `@xenova/transformers` — `Xenova/all-MiniLM-L6-v2` (local, 384-dim) |
| Document Parsing | `pdf-parse`, `mammoth` |
| File Uploads | `multer` (memory storage) |

---

## Project Structure

```
D.I.Y.A/
├── src/                          # Frontend (React + Vite)
│   ├── app/
│   │   ├── components/
│   │   │   ├── student/          # All student-facing pages
│   │   │   │   ├── LandingPage.tsx
│   │   │   │   ├── LoginPage.tsx / SignUpPage.tsx
│   │   │   │   ├── StudentForumPage.tsx
│   │   │   │   ├── StudentSelfCheckPage.tsx
│   │   │   │   └── ...
│   │   │   ├── ForumPage.tsx           # Professor forum view
│   │   │   ├── WorkflowQueuePage.tsx   # AI review queue
│   │   │   ├── InterventionPage.tsx    # Cluster → intervention
│   │   │   ├── KnowledgeBasePage.tsx   # RAG document upload
│   │   │   ├── AdminPage.tsx           # Observability dashboard
│   │   │   ├── AnalysisPage.tsx        # AI engagement analysis
│   │   │   └── ProfessorSidebar.tsx
│   │   ├── routes.tsx
│   │   └── App.tsx
│   └── lib/
│       └── api.ts                # All API calls + TypeScript types
│
├── server/                       # Backend (Node.js + Express)
│   ├── server.js                 # All routes, auth, RBAC, error handler
│   ├── db.js                     # Shared schema + migrations (server + seed)
│   ├── seed.js                   # Demo data generator (npm run seed)
│   ├── services/
│   │   ├── ai-workflow.js        # Full AI routing pipeline
│   │   └── rag.js                # RAG: embed, chunk, retrieve
│   ├── test/                     # node:test suites (api / workflow / rag)
│   ├── .env.example              # Copy to .env (keys never committed)
│   └── diya.db                   # SQLite database (git-ignored, auto-created)
│
├── scripts/dev-all.mjs           # Runs backend + frontend together
├── tsconfig.json                 # Type-check config (npm run check)
├── .github/workflows/ci.yml      # CI: backend tests + frontend build/check
│
├── AI_PIPELINE.md                # Every AI function documented
├── SYSTEM_DESIGN.md              # Architecture + schema deep dive
├── WORKFLOWS.md                  # End-to-end user flow diagrams
├── API_REFERENCE.md              # All REST endpoints
├── ENGINEERING_DECISIONS.md      # Why we built it this way
├── RAG_DEEP_DIVE.md              # RAG implementation explained
└── start.sh                      # Start both servers at once
```

---

## Getting Started

### Prerequisites
- Node.js v18+ (tested on v20 in CI; works on v26)
- An Anthropic API key is **optional** — without one, the app runs in a
  deterministic demo mode (keyword topic classification, template answers,
  graceful "AI disabled" states). Add a key to enable real AI answers,
  confidence scoring, analysis, and self-check grading.

### Installation

```bash
# 1. Install frontend dependencies
npm install

# 2. Install backend dependencies
cd server && npm install && cd ..
```

### Environment Setup

```bash
cp server/.env.example server/.env
# then edit server/.env (ANTHROPIC_API_KEY is optional for the demo)
```

### Seed the demo database (recommended)

```bash
npm run seed          # → creates server/diya.db with a full CHEM 1301 demo class
```

This populates a believable class: 1 professor, 4 students, 14 forum questions
(verified / pending / escalated), approved answers, confusion clusters, an
intervention with tracked effectiveness, office-hour requests, a self-check
report, AI metrics, and notifications. Safe to run on a fresh clone (the schema
lives in `server/db.js`, shared by the server and the seed script).

### Running

```bash
npm run dev:all       # backend + frontend together (recommended)

# …or run them separately:
npm run server        # Backend → http://localhost:3001
npm run dev           # Frontend → http://localhost:5173
```

### Demo Credentials

After `npm run seed`, log in with (all passwords are `demo1234`, **local demo only**):

| Role | Email | Notes |
|---|---|---|
| Professor | `dr.chen@university.edu` | Owns CHEM 1301, sees the workflow queue, clusters, metrics |
| Student | `alex.r@uni.edu` | Member of CHEM 1301 |
| Student | `priya.p@uni.edu` | Member of CHEM 1301 |
| — | Group invite code | `CHEM01` |

### Try it from scratch (the real flow)

1. Sign up as a **professor** → create a class group (you get an invite code).
2. Sign up as a **student** → join with the code.
3. Post a forum question as the student.
4. Watch the AI routing engine process it: open the **Workflow Queue** as the professor.
5. Approve an AI answer → it appears verified to the student and lands in the **Answer Library**.

### Available scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server (frontend) |
| `npm run server` | Express API |
| `npm run dev:all` | both, together (Ctrl-C stops both) |
| `npm run seed` | (re)build the demo database |
| `npm run build` | production frontend build |
| `npm run preview` | preview the production build |
| `npm run check` | TypeScript type-check (`tsc --noEmit`) |
| `npm test` | backend test suite (delegates to `server`) |

---

## Route Reference

| Path | Description | Role |
|---|---|---|
| `/` | Landing page | All |
| `/login` | Login | All |
| `/signup` | Sign up | All |
| `/groups` | Group dashboard | Student |
| `/groups/:id/forum` | Class forum | Student |
| `/office-hours` | Office hour requests | Student |
| `/self-check` | AI grading tool | Student |
| `/profile` | Profile management | Student |
| `/professor` | Group management | Professor |
| `/forum/:groupName` | Forum management | Professor |
| `/workflow/:groupName` | AI review queue | Professor |
| `/interventions/:groupName` | Cluster interventions | Professor |
| `/knowledge/:groupName` | RAG document upload | Professor |
| `/analysis/:groupName` | Engagement analytics | Professor |
| `/admin/:groupName` | AI observability | Professor |
| `/calendar/:groupName` | Class calendar | Professor |
| `/requests/:groupName` | Office hour requests | Professor |

---

## Testing & CI

Automated tests run in GitHub Actions on every push/PR (`.github/workflows/ci.yml`):
the backend suite (`cd server && npm test`) plus a frontend type-check and build.

- **30 backend tests** (`node:test`) covering auth, group create/join, forum posting,
  workflow record creation, professor approval/rejection, knowledge-doc listing,
  admin health/metrics, and **RBAC** (non-members and non-owners get `403`), plus
  unit tests for the AI-workflow fallbacks (topic classification, duplicate
  detection, intervention/announcement fallbacks, routing when AI is disabled) and
  RAG helpers (chunking, cosine similarity).
- See [TESTING.md](TESTING.md) for the full coverage map.

```bash
npm test          # backend unit + integration tests (isolated temp DB)
npm run check     # frontend type-check
```

---

## What This Project Demonstrates (for reviewers)

| Area | Where to look |
|---|---|
| **Full-stack architecture** | React/Vite SPA ↔ Express API ↔ SQLite, with a Vite dev proxy |
| **Role-based access control** | `requireAuth` / `requireRole` / `requireGroupAccess` in `server/server.js` — professors are scoped to groups they own, students to groups they joined |
| **AI workflow orchestration** | `server/services/ai-workflow.js`: classify → dedupe → RAG → draft → confidence-score → route/escalate → record |
| **RAG document retrieval** | `server/services/rag.js`: local embeddings (`all-MiniLM-L6-v2`), chunking, cosine similarity, PDF/DOCX/TXT/MD ingestion |
| **Async, job-style processing** | questions are routed asynchronously after the POST returns; results land in the workflow queue |
| **Observability** | `ai_metrics` table + `/api/admin/metrics` (latency, tokens, error/escalation/duplicate rates) |
| **Human-in-the-loop review** | every AI answer is "pending professor review" until approved; approvals feed the reusable answer library |
| **SQLite schema design** | `server/db.js` — 13 tables, foreign keys, WAL mode, additive migrations |
| **API design** | consistent REST surface, typed client in `src/lib/api.ts` |
| **Testing / CI** | `server/test/*`, GitHub Actions, type-check + build gate |
| **Graceful degradation** | the app is fully usable with **no** API key (deterministic fallbacks + clear "AI disabled" UI) |

---

## Known Limitations / Future Work

Honest tradeoffs made to keep the project focused:

- **Demo-only pages.** A few professor/student screens render representative
  static data rather than live API calls: `EditGroupPage`, `CalendarPage`,
  `TopicDetailPage`, and `student/TopicAnalysisPage`. The data flow they depict is
  real; wiring them to endpoints is future work. (`RequestsPage` **was** mock and
  is now fully wired to the office-hours API.)
- **Duplicate detection uses lexical Jaccard similarity**, not embeddings —
  cheap and dependency-free, but it misses paraphrases. Embedding-based dedupe
  (the RAG model is already loaded) is the natural upgrade.
- **Single-node SQLite.** Fine for a demo; horizontal scaling would mean moving
  the `server/db.js` schema (including the `ai_usage_events` ledger) to Postgres
  and the budget counters to a shared store.
- **No frontend component tests** (only type-check + build). React Testing
  Library / Vitest is the planned addition.
- **RAG retrieval isn't unit-tested end-to-end** because it requires downloading
  the embedding model; only the pure helpers are tested.
- **AI answer quality depends on the configured model**; without an API key the
  app uses deterministic template fallbacks (clearly surfaced in the UI).

---

## Security Notes

- **Auth**: bcrypt (cost 12) password hashing; JWT (7-day). `JWT_SECRET` is
  required in production — the server refuses to boot on the dev fallback when
  `NODE_ENV=production`.
- **Authorization**: every group-scoped route enforces ownership/membership, so a
  logged-in user cannot read or mutate another class's data.
- **Error hygiene**: a central error handler returns generic messages — no stack
  traces or file paths leak to clients; unknown `/api/*` routes return JSON `404`.
- **Uploads**: 20 MB limit, type-checked (PDF/DOCX/TXT/MD), stored as text chunks
  (raw files are never persisted).
- **CORS** is env-configurable via `CORS_ORIGIN` (defaults to any localhost port
  for development).
- **Rate limiting** (`express-rate-limit`, behind `trust proxy`): `/api/auth` 5 per
  10 min, `/api/ai` 20 per hour, `/api/knowledge` 10 per hour, per IP.
- **AI cost controls** (defense-in-depth, so a public demo can't drain credits):
  - **Master switch** `AI_ENABLED` — no Anthropic call is made unless it's `true`
    **and** a key is set. A public demo should normally run with it **off**
    (deterministic fallbacks + clear "AI disabled" UI).
  - **Spend caps** — daily + monthly USD budgets, computed from an `ai_usage_events`
    ledger that records token counts + estimated cost on every call.
  - **Per-user / per-IP daily call caps**, with tighter caps for Self-Check and Analytics.
  - When blocked, the server **stops calling Anthropic** and returns a polished
    "live AI is paused" message; the Admin dashboard shows today's/month's spend,
    remaining budget, and blocked calls (`GET /api/admin/ai-usage`).
  - These code-level limits are **not a replacement** for a provider-side spend
    cap — set a hard limit in the Anthropic Console too. See [DEPLOYMENT.md](DEPLOYMENT.md).

---

## Deployment Notes

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for the full guide (Render/Railway/Fly +
Vercel, env tables, and the credit-safety checklist). In short:

- **Backend**: any Node host (Render/Railway/Fly/VM). Set `NODE_ENV=production`,
  a strong `JWT_SECRET`, `CORS_ORIGIN=https://<your-frontend>`. For a public link,
  leave `ANTHROPIC_API_KEY` unset / `AI_ENABLED=false` so it can't spend credits;
  enable live AI only with budgets + a provider-side spend cap. SQLite (`DB_PATH`)
  needs a persistent disk; for higher scale, migrate `server/db.js` to Postgres.
- **Frontend**: `npm run build` → deploy the static `dist/` to any static host
  (Vercel/Netlify/S3). Point the SPA's `/api` calls at the deployed backend
  (replace the dev proxy with the API origin, or serve both behind one domain).

---

## Screenshots

> _Add screenshots/GIFs here for recruiters._ Suggested capture checklist (after
> `npm run seed`):
>
> - [ ] Professor dashboard (`/professor`) — class cards
> - [ ] Workflow Queue (`/workflow/CHEM%201301%20—%20General%20Chemistry`) — escalated questions with confidence scores
> - [ ] Confusion clusters + an intervention with tracked effectiveness
> - [ ] Knowledge Base upload (`/knowledge/...`) — document with chunk count
> - [ ] Admin observability (`/admin/...`) — latency / tokens / escalation rate
> - [ ] Student forum thread — "AI Answer — Awaiting Review" vs "Verified by Professor"
> - [ ] Self-Check report (or the "AI disabled" state if running keyless)

---

## Documentation Index

| File | What It Covers |
|---|---|
| [SYSTEM_DESIGN.md](SYSTEM_DESIGN.md) | Full architecture, schema, data flow, security model |
| [AI_PIPELINE.md](AI_PIPELINE.md) | Every AI function: model, inputs, outputs, fallbacks |
| [WORKFLOWS.md](WORKFLOWS.md) | Step-by-step user flow diagrams |
| [API_REFERENCE.md](API_REFERENCE.md) | All REST endpoints with request/response shapes |
| [RAG_DEEP_DIVE.md](RAG_DEEP_DIVE.md) | RAG implementation: chunking, embedding, retrieval |
| [ENGINEERING_DECISIONS.md](ENGINEERING_DECISIONS.md) | Why we chose each technology and approach |
