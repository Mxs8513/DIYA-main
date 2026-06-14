# D.I.Y.A — System Design

> **Digital Intake Yielding Answers** — AI-powered academic workflow automation and operational intelligence platform.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Component Breakdown](#component-breakdown)
3. [Database Schema](#database-schema)
4. [Request Lifecycle](#request-lifecycle)
5. [AI Subsystem](#ai-subsystem)
6. [RAG Pipeline](#rag-pipeline)
7. [Authentication & Authorization](#authentication--authorization)
8. [Observability](#observability)
9. [Role Permissions](#role-permissions)
10. [Scaling Path](#scaling-path)

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────────────────┐
│                         Browser (SPA)                              │
│                                                                    │
│  React 18 · Vite · React Router 7 · Tailwind CSS 4 · shadcn/ui   │
│                                                                    │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────────────┐   │
│  │  Student UI  │  │ Professor UI  │  │ AI Operations UI     │   │
│  │              │  │               │  │                      │   │
│  │ forum        │  │ forum mgmt    │  │ Workflow Queue       │   │
│  │ office hours │  │ group admin   │  │ Confusion Clusters   │   │
│  │ self-check   │  │ analytics     │  │ Interventions        │   │
│  │ group join   │  │ calendar      │  │ Knowledge Base       │   │
│  └──────────────┘  └───────────────┘  │ Observability        │   │
│                                       └──────────────────────┘   │
│                      ↕  /api proxy (Vite dev) / direct (prod)     │
└────────────────────────────────────────────────────────────────────┘
                             ↕ HTTP REST (JSON)
┌────────────────────────────────────────────────────────────────────┐
│                    Express 5 API Server                            │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │               AI Workflow Engine (services/ai-workflow.js)  │  │
│  │                                                             │  │
│  │  classifyTopic()         detectDuplicateQuestion()          │  │
│  │  generateAnswerDraft()   scoreAIConfidence()                │  │
│  │  detectClusters()        recommendIntervention()            │  │
│  │  generateAnnouncement()  trackInterventionOutcome()         │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │               RAG Service (services/rag.js)                 │  │
│  │                                                             │  │
│  │  extractText()   chunkText()   embed()                      │  │
│  │  processDocument()             retrieve()                   │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌──────────────────────┐   ┌───────────────────────────────────┐ │
│  │   SQLite (WAL mode)  │   │  Anthropic Claude API             │ │
│  │   better-sqlite3     │   │  claude-haiku-4-5-20251001        │ │
│  │   12 tables          │   │  (classify, answer, score, rec)   │ │
│  └──────────────────────┘   └───────────────────────────────────┘ │
│                                                                    │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  Local Embedding Model (@xenova/transformers)                 │ │
│  │  Xenova/all-MiniLM-L6-v2 · 384-dim · no API cost             │ │
│  └───────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### Frontend

**`src/lib/api.ts`** — Single API client file. All fetch calls go through a typed `request<T>()` wrapper that attaches the JWT from localStorage and throws on non-2xx responses. No Axios, no React Query — intentionally minimal.

**Student UI** (`src/app/components/student/`)
- Forum with real-time question posting, AI answer badges, verified/pending/rejected status
- Self-Check: FileReader API extracts text from rubric + work files, sends to `/api/ai/self-check`, renders structured feedback
- Office Hours: form submission with preferred time, tracks request status

**Professor UI** (`src/app/components/`)
- `WorkflowQueuePage` — escalated questions with confidence score bars, routing decision badges, approve/reject/review actions
- `InterventionPage` — cluster cards with AI recommendation generator, intervention create modal with announcement AI draft
- `KnowledgeBasePage` — drag-and-drop document upload, chunk count display, delete by filename
- `AdminPage` — AI metrics, daily activity SVG bar chart, queue health alerts
- `AnalysisPage` — topic distribution, live AI analysis button, trend indicators

**`ProfessorSidebar`** — collapsible, 3 nav groups (Class / AI Workflow / Intelligence), active indicator, "NEW" badge on queue

---

### Backend

**`server/server.js`** — Monolithic Express app (~700 lines). Handles: DB init + migrations, JWT middleware, all route handlers. All AI is called asynchronously after the HTTP response is sent — students never wait for Claude.

**`server/services/ai-workflow.js`** — Pure functions, independently testable. Initialized once with `init(db, apiKey)`. Uses a shared Anthropic client. Every Claude call logs to `ai_metrics` for observability.

**`server/services/rag.js`** — Uses dynamic ESM import for `@xenova/transformers` (lazy loads the 25MB model on first use). Cosine similarity computed in pure JS — no native dependencies.

---

## Database Schema

### Core Tables

```sql
users (
  id              INTEGER PRIMARY KEY,
  name            TEXT NOT NULL,
  email           TEXT UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,             -- bcrypt, cost factor 12
  role            TEXT CHECK(role IN ('student','professor')),
  avatar          TEXT,
  bio             TEXT,
  created_at      TEXT DEFAULT datetime('now')
)

groups (
  id              INTEGER PRIMARY KEY,
  name            TEXT NOT NULL,
  code            TEXT UNIQUE NOT NULL,      -- 6-char invite code (random base36)
  description     TEXT,
  professor_id    INTEGER → users(id),
  created_at      TEXT
)

group_members (
  user_id         INTEGER → users(id),
  group_id        INTEGER → groups(id),
  PRIMARY KEY (user_id, group_id)            -- no duplicate memberships
)

forum_questions (
  id              INTEGER PRIMARY KEY,
  group_id        INTEGER → groups(id),
  user_id         INTEGER → users(id),
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  tags            TEXT,
  topic           TEXT,                      -- AI-classified (12 categories)
  ai_answer       TEXT,                      -- Claude-generated draft
  ai_status       TEXT DEFAULT 'pending'
                  CHECK(IN 'pending','generating','verified','rejected'),
  confidence_score REAL,                     -- 0.0–1.0, Claude self-rated
  routing_decision TEXT DEFAULT 'normal',    -- normal|duplicate|low_confidence|escalated
  duplicate_of    INTEGER,                   -- question_id of the matched original
  escalation_reason TEXT,
  rag_sources     TEXT,                      -- JSON array of source filenames used
  upvotes         INTEGER DEFAULT 0,
  created_at      TEXT
)

forum_replies (
  id              INTEGER PRIMARY KEY,
  question_id     INTEGER → forum_questions(id),
  user_id         INTEGER → users(id),
  body            TEXT NOT NULL,
  upvotes         INTEGER DEFAULT 0,
  is_accepted     INTEGER DEFAULT 0,
  created_at      TEXT
)

office_hour_requests (
  id              INTEGER PRIMARY KEY,
  group_id        INTEGER → groups(id),
  student_id      INTEGER → users(id),
  subject         TEXT NOT NULL,
  description     TEXT,
  status          TEXT DEFAULT 'pending'
                  CHECK(IN 'pending','approved','rejected','completed'),
  preferred_time  TEXT,
  scheduled_at    TEXT,
  created_at      TEXT
)

self_check_reports (
  id              INTEGER PRIMARY KEY,
  user_id         INTEGER → users(id),
  assignment_name TEXT NOT NULL,
  rubric_name     TEXT NOT NULL,
  letter_grade    TEXT,                      -- A, B+, etc.
  score_text      TEXT,                      -- "87/100"
  improvements_json TEXT,                    -- JSON array of {section, suggestion}
  raw_analysis    TEXT,                      -- full Claude response JSON
  created_at      TEXT
)
```

### Workflow Engine Tables

```sql
workflow_items (
  id              INTEGER PRIMARY KEY,
  question_id     INTEGER → forum_questions(id),
  group_id        INTEGER → groups(id),
  status          TEXT CHECK(IN 'processed','escalated','resolved','auto_resolved'),
  routing_decision TEXT,
  duplicate_of    INTEGER,
  confidence_score REAL,
  topic           TEXT,
  escalation_reason TEXT,
  resolved_by     INTEGER → users(id),
  resolved_at     TEXT,
  created_at      TEXT
)

confusion_clusters (
  id              INTEGER PRIMARY KEY,
  group_id        INTEGER → groups(id),
  topic           TEXT NOT NULL,
  question_count  INTEGER DEFAULT 0,
  severity        TEXT CHECK(IN 'low','medium','high','critical'),
  status          TEXT CHECK(IN 'open','intervention_sent','resolved'),
  first_seen      TEXT,
  last_seen       TEXT,
  UNIQUE(group_id, topic)                    -- upserted, not duplicated
)

interventions (
  id              INTEGER PRIMARY KEY,
  group_id        INTEGER → groups(id),
  cluster_id      INTEGER → confusion_clusters(id),
  type            TEXT,                      -- announcement|review_session|office_hours|resource
  title           TEXT NOT NULL,
  content         TEXT NOT NULL,
  created_by      INTEGER → users(id),
  status          TEXT CHECK(IN 'draft','sent','tracked'),
  outcome_before  INTEGER,                   -- question count when created
  outcome_after   INTEGER,                   -- question count measured later
  effectiveness   REAL,                      -- (before-after)/before × 100
  created_at      TEXT
)

approved_answers (
  id              INTEGER PRIMARY KEY,
  group_id        INTEGER → groups(id),
  source_question_id INTEGER,
  topic           TEXT,
  question_pattern TEXT NOT NULL,            -- original question title
  answer          TEXT NOT NULL,
  usage_count     INTEGER DEFAULT 0,         -- times reused for duplicates
  created_by      INTEGER → users(id),
  created_at      TEXT
)

ai_metrics (
  id              INTEGER PRIMARY KEY,
  request_type    TEXT NOT NULL,             -- classifyTopic|generateAnswerDraft|etc
  model           TEXT,
  latency_ms      INTEGER,
  success         INTEGER DEFAULT 1,
  error_message   TEXT,
  tokens_used     INTEGER DEFAULT 0,
  group_id        INTEGER,
  created_at      TEXT
)

knowledge_documents (
  id              INTEGER PRIMARY KEY,
  group_id        INTEGER → groups(id),
  filename        TEXT NOT NULL,
  content_type    TEXT,
  chunk_text      TEXT NOT NULL,             -- 400-word text segment
  chunk_index     INTEGER DEFAULT 0,         -- position within original doc
  embedding       TEXT,                      -- JSON float array (384-dim)
  uploaded_by     INTEGER → users(id),
  created_at      TEXT
)
```

---

## Request Lifecycle

### Standard Question Post

```
Student → POST /api/groups/:id/forum
                │
                ▼
        Persist to forum_questions
        (topic=null, ai_answer=null, ai_status='pending')
                │
                ▼
        Return question to student  ← HTTP 200 immediately
                │
                │  [async, non-blocking — student never waits for this]
                ▼
        workflow.routeQuestion(questionId, groupId, title, body)
                │
                ├── 1. classifyTopic()
                │         AI: categorize into 12 topics
                │         Fallback: keyword matching (no API call)
                │         → UPDATE forum_questions SET topic = ?
                │
                ├── 2. detectDuplicateQuestion()
                │         Jaccard similarity on tokenized word sets
                │         Compare against last 80 questions in group
                │         similarity ≥ 0.45?
                │           YES → routing_decision = "duplicate"
                │                 if approved_answer exists → attach it
                │                 → skip to recordWorkflowItem()
                │           NO  → continue
                │
                ├── 3. rag.retrieve()
                │         Embed question text (384-dim vector)
                │         Cosine similarity vs all group knowledge_documents
                │         Returns top-4 chunks with score > 0.3
                │         → ragChunks (may be empty if no docs uploaded)
                │
                ├── 4. generateAnswerDraft()
                │         Build prompt with optional RAG context injected
                │         Claude Haiku → 700 token answer
                │         → UPDATE forum_questions SET ai_answer = ?
                │
                ├── 5. scoreAIConfidence()
                │         Claude self-rates its own answer 0.0–1.0
                │         score < 0.55?
                │           YES → routing_decision = "low_confidence"
                │                 → status = "escalated"
                │                 → enters professor review queue
                │           NO  → routing_decision = "normal"
                │
                ├── 6. detectAndUpdateClusters()
                │         SQL: GROUP BY topic WHERE created_at > 7 days ago
                │         Upsert confusion_clusters with severity:
                │           ≥ 10 questions → critical
                │           ≥ 6            → high
                │           ≥ 3            → medium
                │           < 3            → low
                │
                └── 7. recordWorkflowItem()
                          Write to workflow_items table
                          status = escalated | processed | auto_resolved
```

### RAG Document Upload

```
Professor → POST /api/knowledge/:groupId (multipart/form-data)
                │
                ▼
        multer → req.file.buffer (in memory, max 20MB)
                │
                ▼
        rag.processDocument()
                │
                ├── extractText()
                │     PDF  → pdf-parse  → raw text
                │     DOCX → mammoth    → raw text
                │     TXT/MD → UTF-8 decode
                │
                ├── chunkText(text, chunkSize=400, overlap=50)
                │     Split by words, sliding window
                │     Filter chunks < 30 chars
                │
                └── for each chunk:
                        embed(chunk) → Xenova/all-MiniLM-L6-v2 → float[384]
                        INSERT knowledge_documents (chunk_text, embedding JSON)
                │
                ▼
        Return { filename, chunks: N }
```

---

## AI Subsystem

The AI workflow engine is a **pure service module** — it has no Express imports, no HTTP knowledge. It receives data, calls Claude, updates the database, logs metrics, and returns results. This separation makes it independently testable.

### Initialization

```js
workflow.init(db, process.env.ANTHROPIC_API_KEY)
```

Called once at server startup. If no API key is provided, all Claude calls degrade gracefully to rule-based fallbacks — the app still works, just without AI.

### Confidence Scoring

The confidence score (0–1) is generated by asking Claude to rate its own answer:

```
"Rate the confidence of this AI-generated answer on a scale of 0.0 to 1.0.
 Consider: accuracy, completeness, clarity, and whether the question is well-defined.
 Return only JSON: {"confidence": 0.85, "reason": "brief reason"}"
```

Threshold of 0.55 was chosen as the escalation boundary — below this, the answer is likely to be vague, incorrect, or addressing a question that was ambiguous to begin with. Questions scoring below 0.55 are routed to the professor's review queue automatically.

### Duplicate Detection

Uses Jaccard similarity on tokenized word sets (lowercase, punctuation stripped, tokens > 2 chars):

```
similarity = |intersection(tokens_A, tokens_B)| / |union(tokens_A, tokens_B)|
```

Threshold: 0.45. At this threshold, questions with the same core vocabulary (e.g., "how do I use pointers" and "can you explain pointer usage") will match even if phrased differently. The last 80 questions in the group are checked to keep the comparison window relevant and bounded.

When a duplicate is detected AND the original has a professor-verified answer, that answer is served immediately as `ai_status = 'verified'` — bypassing the queue entirely. The approved answer's `usage_count` is incremented.

---

## RAG Pipeline

See [RAG_DEEP_DIVE.md](RAG_DEEP_DIVE.md) for full details.

**Summary**: Professor uploads course materials → text extracted → chunked into 400-word segments with 50-word overlap → each chunk embedded via `Xenova/all-MiniLM-L6-v2` → embeddings stored as JSON in SQLite. When a student asks a question: question is embedded → cosine similarity computed against all group chunks → top-4 relevant chunks injected into the Claude prompt → Claude answers citing the source file. The `forum_questions.rag_sources` column records which files were used.

---

## Authentication & Authorization

### JWT Structure

Tokens are signed with HS256. Payload:

```json
{ "id": 42, "email": "student@uni.edu", "role": "student", "name": "Jane Smith" }
```

Expiry: 7 days. Stored in `localStorage` (dev convenience — production should use httpOnly cookies).

### Middleware Chain

```
requireAuth       → verifies Bearer token, attaches req.user
requireRole(role) → checks req.user.role === role, returns 403 if not
```

All professor-only routes (workflow, clusters, interventions, knowledge upload, admin) are gated by `requireAuth + requireRole('professor')`. Student routes are gated by `requireAuth` only, with some also adding `requireRole('student')`.

### Password Storage

Passwords are hashed with bcrypt at cost factor 12 (~250ms on modern hardware). Never stored in plaintext. The `password_hash` column is never returned in API responses — the select statements explicitly list non-sensitive fields.

---

## Observability

Every Claude API call writes a row to `ai_metrics`:

```
request_type  → which function made the call (classifyTopic, generateAnswerDraft, etc.)
model         → which Claude model was used
latency_ms    → wall-clock time from request to response
success       → 1 (ok) or 0 (threw an exception)
error_message → exception message if failed
tokens_used   → input + output tokens from the usage object
group_id      → which class group triggered this (nullable)
created_at    → timestamp
```

Queryable via `GET /api/admin/metrics` (professor role). The AdminPage renders:
- Total requests (all time / last 24h)
- Average latency (last 7 days)
- Error count and error rate
- Daily activity bar chart (SVG, last 7 days)
- Per-request-type breakdown table

---

## Role Permissions

| Action | Student | Professor |
|---|---|---|
| Register / login | ✓ | ✓ |
| Join group via code | ✓ | ✗ |
| Create group | ✗ | ✓ |
| Post forum question | ✓ | ✗ |
| Reply to question | ✓ | ✓ |
| Request office hours | ✓ | ✗ |
| AI self-check grading | ✓ | ✗ |
| View verified AI answers | ✓ | ✓ |
| View pending/rejected AI answers | ✗ | ✓ |
| Approve / reject AI answers | ✗ | ✓ |
| View workflow queue | ✗ | ✓ |
| View confusion clusters | ✗ | ✓ |
| Create interventions | ✗ | ✓ |
| Upload knowledge documents | ✗ | ✓ |
| Delete knowledge documents | ✗ | ✓ |
| View AI metrics / observability | ✗ | ✓ |
| Manage group members | ✗ | ✓ |

---

## Scaling Path

The current stack is optimized for rapid development and local operation. Each component has a clear upgrade path:

| Current | Production Upgrade | Reason |
|---|---|---|
| SQLite | PostgreSQL + pgvector | Concurrent writes, vector index for embeddings |
| Jaccard duplicate detection | Cosine similarity on embeddings | Semantic matching across paraphrases |
| In-process async workflow | BullMQ + Redis | Retry logic, visibility, dead letter queues |
| In-memory multer upload | S3 / R2 + async processing | Large files, persistence, CDN delivery |
| JWT in localStorage | httpOnly cookies + refresh tokens | XSS resistance |
| No rate limiting | express-rate-limit on AI routes | API cost control at scale |
| claude-haiku-4-5-20251001 | claude-sonnet-4-6 on escalated items | Higher accuracy where it matters |
| Single server | Containerized + load balanced | Horizontal scaling |
