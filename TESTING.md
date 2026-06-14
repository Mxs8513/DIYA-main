# Testing

D.I.Y.A has an automated test suite for the backend and a type-check + build
gate for the frontend. Everything runs in CI on every push / PR
(`.github/workflows/ci.yml`).

## Running locally

```bash
# Backend (unit + integration), uses an isolated temp SQLite DB
cd server && npm test

# Frontend type-check and production build
npm run check      # tsc --noEmit
npm run build      # vite build
```

## What's covered

### Backend integration tests — `server/test/api.test.js`
Boots the **real Express app** against a throwaway temp database (`DB_PATH`) and
drives it over HTTP, with `ANTHROPIC_API_KEY` unset so behavior is deterministic.

- **Auth** — register, login, duplicate-email `409`, wrong-password `401`, unauthenticated `401`.
- **Groups** — professor creates a group, student joins by code, role gate blocks student creation, invalid code `404`.
- **Forum** — posting a question creates a workflow item; topic is classified by the keyword fallback; AI-disabled questions escalate.
- **Professor review** — reject sets `ai_status`; approved-answers library grows.
- **Knowledge** — empty document list for a fresh group.
- **Admin** — `/admin/metrics` and `/admin/queue-health` return the expected shapes.
- **Self-check** — graceful `503` when no API key is configured.
- **RBAC (headline security fix)**:
  - a student **not** in a group cannot read **or** post to its forum (`403`),
  - a professor cannot read **another** professor's workflow queue (`403`).
- **Error hygiene** — unknown `/api/*` route returns JSON `404`; server errors return a generic message with **no** stack trace / file path leak.

### Backend unit tests — `server/test/workflow.test.js`
Exercises the AI workflow helpers in **AI-disabled** mode against an in-memory DB:

- `classifyTopic` keyword fallback routing,
- `detectDuplicateQuestion` (Jaccard) duplicate vs. unique,
- `recommendIntervention` deterministic fallback,
- `generateProfessorAnnouncement` template fallback,
- `detectAndUpdateClusters` aggregation + severity thresholds,
- `routeQuestion` escalation path when no AI answer is available.

### Backend unit tests — `server/test/rag.test.js`
- `chunkText` overlapping-window chunking + short-input rejection,
- `cosineSimilarity` identical / orthogonal / partial alignment.

> The embedding model (`all-MiniLM-L6-v2`) is **not** downloaded in tests — only
> the pure RAG helpers are unit-tested. End-to-end retrieval is verified manually.

### Frontend
- `npm run check` — full TypeScript type-check (`tsconfig.json`).
- `npm run build` — production Vite build must succeed.

## Not yet covered (known gaps)
- Frontend component/interaction tests (no React Testing Library / Vitest yet).
- RAG end-to-end retrieval (requires the embedding model download).
- The remaining demo-only pages (see "Known Limitations" in the README).
