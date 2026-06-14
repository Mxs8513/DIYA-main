# D.I.Y.A — Digital Intake Yielding Answers

> An AI-powered academic workflow automation platform that routes student questions through an intelligent pipeline, surfaces confusion patterns, and enables professor-in-the-loop review — all backed by RAG-grounded answers from real course materials.

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
│   ├── server.js                 # Main server, all routes, DB schema
│   ├── services/
│   │   ├── ai-workflow.js        # Full AI routing pipeline
│   │   └── rag.js                # RAG: embed, chunk, retrieve
│   ├── diya.db                   # SQLite database (auto-created)
│   └── .env                      # API keys (never commit)
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
- Node.js v18+
- An Anthropic API key (get one at [console.anthropic.com](https://console.anthropic.com))

### Installation

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server && npm install && cd ..
```

### Environment Setup

Create `server/.env`:

```
PORT=3001
JWT_SECRET=your-secret-key-here
ANTHROPIC_API_KEY=sk-ant-...
```

### Running

```bash
# Option 1: Start both at once
./start.sh

# Option 2: Separately
npm run dev               # Frontend → http://localhost:5173
cd server && node server.js  # Backend → http://localhost:3001
```

### First Run

1. Go to `http://localhost:5173`
2. Sign up as a **professor**
3. Create a class group — you'll get an invite code
4. Sign up as a **student**, join with the code
5. Post a forum question as the student
6. Watch the AI routing engine process it (check the Workflow Queue as professor)

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

## Documentation Index

| File | What It Covers |
|---|---|
| [SYSTEM_DESIGN.md](SYSTEM_DESIGN.md) | Full architecture, schema, data flow, security model |
| [AI_PIPELINE.md](AI_PIPELINE.md) | Every AI function: model, inputs, outputs, fallbacks |
| [WORKFLOWS.md](WORKFLOWS.md) | Step-by-step user flow diagrams |
| [API_REFERENCE.md](API_REFERENCE.md) | All REST endpoints with request/response shapes |
| [RAG_DEEP_DIVE.md](RAG_DEEP_DIVE.md) | RAG implementation: chunking, embedding, retrieval |
| [ENGINEERING_DECISIONS.md](ENGINEERING_DECISIONS.md) | Why we chose each technology and approach |
