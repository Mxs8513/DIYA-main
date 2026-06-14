# D.I.Y.A — Engineering Decisions

> Why we built it this way. Each decision documented with the tradeoffs considered and the alternative that was rejected.

---

## Backend

### Decision: Express 5 over Next.js API routes / Fastify / NestJS

**Chose**: Express 5 (plain, minimal)

**Why**: D.I.Y.A needed a backend that was fully transparent — no magic, no framework opinions on structure. The AI workflow engine is the most complex part, and it needed to be a standalone service module, not tangled into framework routing conventions. Express lets us do exactly that: `require('./services/ai-workflow')`, call `workflow.init(db, apiKey)`, done.

**Alternatives rejected**:
- **Next.js API routes**: great for co-located frontend, but forces file-based routing that would scatter the workflow logic across many files; also harder to run as a separate process
- **NestJS**: excellent for teams with Java/Spring background; the decorator-heavy DI pattern is overkill for a single-developer project and adds significant boilerplate
- **Fastify**: faster than Express but the plugin ecosystem is smaller and schema validation via JSON Schema is more verbose

---

### Decision: SQLite over PostgreSQL

**Chose**: SQLite (via better-sqlite3, WAL mode)

**Why**: For this project's scale (one class group, dozens of students, hundreds of questions), SQLite is genuinely the right database. It has zero infrastructure — no Docker container, no connection pool, no migrations runner. The database is a single file (`diya.db`) that starts instantly and requires no setup. better-sqlite3's synchronous API makes the code dramatically simpler: no `await db.query(...)` chains, just `db.prepare(...).get(...)`.

WAL (Write-Ahead Logging) mode is enabled to allow concurrent reads alongside writes — important because the workflow engine writes to the DB at the same time the HTTP server is serving reads.

**When to upgrade**: SQLite becomes a problem at ~1000 concurrent users or if we need pgvector for embedding-based similarity search. The migration path is clean: we use raw SQL with no ORM, so PostgreSQL queries are near-identical.

**Alternatives rejected**:
- **PostgreSQL**: correct choice for production, but adds local setup friction; chose simplicity for development
- **MongoDB**: document model doesn't fit relational data (users ↔ groups ↔ questions ↔ replies are deeply relational); would require manual joins in application code

---

### Decision: No ORM

**Chose**: Raw SQL via better-sqlite3

**Why**: ORMs (Sequelize, Prisma, Drizzle) add an abstraction layer between the code and the database. For a complex system like this — where queries involve multiple joins, aggregations, and conditional updates — the ORM-generated SQL is often worse than what you'd write by hand, and debugging it requires understanding both the ORM and the SQL it generates.

Raw SQL is also explicit: you can read the query and know exactly what hits the database. When debugging a slow AI metrics aggregation query, there's no ORM DSL to decode.

**Tradeoff accepted**: more verbose code, no automatic migration management, more responsibility to avoid SQL injection (all queries use parameterized statements — `db.prepare(...).run(?, ?)` — so injection is not a risk).

---

### Decision: Async AI workflow (non-blocking)

**Chose**: Fire-and-forget after HTTP response

```js
res.json(question); // respond immediately

workflow.routeQuestion(...).catch(console.error); // then process async
```

**Why**: The AI pipeline takes 2–5 seconds (topic classification + duplicate check + answer generation + confidence scoring). Making the student wait for all of that before seeing their question appear would make the app feel broken. Responding immediately and processing in the background means the forum feels snappy — the AI answer just appears a few seconds later.

**Tradeoff**: If the server crashes mid-workflow, that question's AI processing is lost and must be retried manually (or just won't have an AI answer). For a production system, this async work should go into a proper job queue (BullMQ + Redis) with retry logic and persistence. For this project, the simplicity benefit outweighs the reliability cost.

---

### Decision: Monolithic server.js over microservices

**Chose**: Single server.js file (~700 lines) with service modules

**Why**: Microservices solve problems that don't exist at this scale. Splitting into auth-service, forum-service, and ai-service would mean network calls between services, distributed tracing, service discovery, and deployment coordination — all for a system that runs on one machine. The code is structured as modules (`ai-workflow.js`, `rag.js`) for separation of concerns without the operational overhead.

**Clear upgrade path**: when scale demands it, each module can be extracted into its own service. The `ai-workflow.js` module already has no Express imports — it's pure business logic.

---

## AI Design

### Decision: Claude Haiku over GPT-4o / Llama / Mistral

**Chose**: `claude-haiku-4-5-20251001`

**Why**: Haiku hits the right point on the speed/cost/quality tradeoff for this use case. A student question arrives and needs a draft answer in under 2 seconds without costing more than a fraction of a cent. Haiku does this. GPT-4o is slower and more expensive for bulk operations. Llama/Mistral are faster and cheaper but require self-hosting infrastructure (GPU server or API provider) and produce lower-quality academic answers.

Claude's instruction-following is particularly strong for structured output tasks (confidence scoring needs clean JSON, topic classification needs exact category names). Other models require more prompt engineering to reliably return structured data.

**Upgrade path**: escalated items (those in the professor's review queue) could be re-processed with Claude Sonnet for higher quality answers before the professor sees them — using the better model only where it matters.

---

### Decision: AI confidence self-scoring

**Chose**: Ask Claude to rate its own answer (meta-evaluation)

**Why**: The most accurate signal of whether an AI answer needs human review is whether the AI itself is uncertain. Instead of building a separate classifier, we ask Claude directly: *"How confident are you in this answer? Rate 0–1."*

This works better than expected because Claude is well-calibrated — it genuinely signals lower confidence on ambiguous questions ("Is there a study guide?" depends on information Claude doesn't have) versus factual CS questions ("What is recursion?" gets a high confidence score every time).

**Threshold**: 0.55 was chosen empirically. Below this score, the answer is typically vague, hedges heavily, or addresses the wrong interpretation of the question. Above 0.55, professor approval rate in testing was >85%.

**Known limitation**: Claude can be overconfident on factually wrong answers. A question about a specific API that changed after the training cutoff might get a confident-sounding but outdated answer. This is a fundamental limitation of LLM self-evaluation, not solvable without ground-truth validation.

---

### Decision: Jaccard similarity for duplicate detection

**Chose**: Jaccard on tokenized word sets

**Why**: Fast, zero API cost, and surprisingly effective for academic questions. The intuition: two questions asking the same thing will share most of the same vocabulary. "How do I implement a stack in Java?" and "Can you explain implementing stacks in Java?" share {implement, stack, java} — enough overlap to score above the 0.45 threshold.

Implemented in pure JS:
```js
tokenize("Can you explain implementing stacks in Java?")
// → Set { 'can', 'you', 'explain', 'implementing', 'stacks', 'java' }

similarity = |intersection| / |union|
```

**Tradeoff**: Fails on semantic paraphrases without vocabulary overlap. "How do arrays work?" and "Explain contiguous memory allocation?" are semantically equivalent but share zero tokens. This is the primary motivation for the RAG embeddings — the same embedding model used for RAG could replace Jaccard for duplicate detection at a future stage.

---

### Decision: Local embeddings over OpenAI text-embedding-3-small

**Chose**: `Xenova/all-MiniLM-L6-v2` running locally in Node.js

**Why**: The embedding model runs on every document upload and every question that has knowledge documents. At scale, this could be thousands of calls per day. OpenAI's embedding API costs ~$0.02/1M tokens — not expensive individually, but it adds another external API dependency, another API key to manage, another failure mode, and API call latency (100–300ms) on every embedding.

Running locally via `@xenova/transformers` means:
- Zero marginal cost per embedding
- No network dependency (works offline)
- No API key needed
- ~50ms per chunk once the model is warm

The quality difference between `all-MiniLM-L6-v2` (384-dim) and OpenAI's 3-small (1536-dim) is real but acceptable for this use case — course material retrieval doesn't require state-of-the-art semantic understanding, it requires matching topic keywords and conceptual overlap.

---

## Frontend

### Decision: Vite proxy over CORS configuration

**Chose**: Proxy `/api` → `http://localhost:3001` in `vite.config.ts`

**Why**: During development, the frontend runs on port 5173 and the backend on 3001. Without a proxy, every API call is cross-origin and requires CORS headers on the server, plus the `Authorization` header must be explicitly allowed. The Vite proxy makes all API calls same-origin from the browser's perspective — cleaner, simpler, and more production-like (in production, the backend would sit behind the same domain).

The `api.ts` base URL is just `'/api'` — it works in dev (proxied) and production (same origin) without any environment-specific configuration.

---

### Decision: TypeScript types in api.ts only

**Chose**: All types defined in `src/lib/api.ts`, imported from there

**Why**: In a project this size, scattering type definitions across component files creates import spaghetti. Centralizing all interface definitions in the API client file means: (a) types are defined once where the data shapes are canonical (the API boundary), (b) components import what they need from one place, (c) when the API changes, the type change and all the components that use it get TypeScript errors simultaneously.

---

### Decision: CSS-in-JS (inline styles) for professor components

**Chose**: Mix of Tailwind (student pages) and inline styles (professor pages)

**Why**: The professor UI has complex, theme-consistent dark sidebar styling that uses CSS variables, gradients, and fine-grained hover states. Inline styles give precise control without fighting Tailwind's utility-first constraints for edge cases. The student pages are simpler and more static, making Tailwind's rapid utility composition ideal.

This inconsistency is a known debt — unifying on Tailwind + CSS variables is the right long-term move.

---

## Security Decisions

### JWT in localStorage

**Chose**: localStorage for development, acknowledged as insecure for production

**Why**: The simplest working auth for a frontend SPA. The downside is XSS vulnerability — a script injection attack could read the token. In production, tokens should be in httpOnly cookies (inaccessible to JavaScript) with CSRF protection.

This is a documented tradeoff, not an oversight.

### bcrypt cost factor 12

**Chose**: `bcrypt.hash(password, 12)`

**Why**: Cost factor 12 produces a ~250ms hash on a modern CPU. This is slow enough to make brute-force password attacks infeasible (250ms per attempt × millions of guesses = years) but fast enough to not meaningfully delay login for real users. Cost factor 10 is the common minimum; 12 provides an extra margin for cheaper hardware.

### No rate limiting (current)

**Known gap**: AI endpoints (`/api/ai/self-check`, question posting that triggers Claude) have no rate limiting. A single authenticated user could spam requests and run up API costs.

**Mitigation**: Add `express-rate-limit` per user ID on AI routes. Not yet implemented — acceptable for a development/demo deployment.
