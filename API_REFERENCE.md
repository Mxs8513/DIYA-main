# D.I.Y.A — API Reference

All endpoints are prefixed with `/api`. Authentication uses `Authorization: Bearer <token>` headers. Roles: `student` or `professor`.

---

## Authentication

### `POST /api/auth/register`
Create a new account.

**Body**
```json
{ "name": "Jane Smith", "email": "jane@uni.edu", "password": "secret", "role": "student" }
```

**Response `200`**
```json
{
  "token": "eyJ...",
  "user": { "id": 1, "name": "Jane Smith", "email": "jane@uni.edu", "role": "student" }
}
```

**Errors**: `400` missing fields, `409` email already registered

---

### `POST /api/auth/login`
**Body** `{ "email": "...", "password": "..." }`

**Response `200`** — same shape as register

**Errors**: `401` invalid credentials

---

### `GET /api/auth/me`
🔒 Auth required. Returns the current user's profile.

**Response** `{ id, name, email, role, avatar, bio, created_at }`

---

### `PATCH /api/auth/profile`
🔒 Auth required. Update name, bio, or avatar.

**Body** `{ "name": "...", "bio": "...", "avatar": "..." }` (all optional)

**Response** — updated user object

---

## Groups

### `GET /api/groups`
🔒 Auth required. Returns groups for the current user.
- Professors: groups they own
- Students: groups they've joined

**Response** `Group[]` — includes `professor_name`, `member_count`

---

### `POST /api/groups`
🔒 Professor only. Create a new group.

**Body** `{ "name": "CS 101", "description": "..." }`

**Response** — the created group with a random 6-char `code`

---

### `GET /api/groups/:id`
🔒 Auth required. Get a single group by ID.

---

### `GET /api/groups/by-name/:name`
🔒 Auth required. Resolve a group by URL-encoded name.

---

### `POST /api/groups/join`
🔒 Student only. Join a group via invite code.

**Body** `{ "code": "AB12CD" }`

**Response** `{ "message": "Joined successfully", "group": {...} }`

**Errors**: `404` invalid code, `409` already a member

---

### `GET /api/groups/:id/members`
🔒 Auth required. List all members of a group.

---

## Forum

### `GET /api/groups/:groupId/forum`
🔒 Auth required. Get all questions for a group, newest first.

**Response** `Question[]` — includes `author_name`, `reply_count`, AI fields

---

### `POST /api/groups/:groupId/forum`
🔒 Auth required. Post a new question.

**Body** `{ "title": "...", "body": "...", "tags": "optional" }`

**Response** — the created question (immediate, before AI processing)

**Side effect**: triggers `workflow.routeQuestion()` asynchronously

---

### `GET /api/forum/question/:id`
🔒 Auth required. Get a single question with all replies.

**Response** `{ ...question, replies: Reply[] }`

---

### `POST /api/forum/question/:id/reply`
🔒 Auth required. Post a reply.

**Body** `{ "body": "..." }`

**Response** — the created reply with `author_name`

---

### `PATCH /api/forum/question/:id/ai-status`
🔒 Professor only. Manually update a question's AI answer status.

**Body** `{ "status": "verified" | "rejected" }`

**Side effects**:
- If `verified`: upserts into `approved_answers`, marks workflow item resolved
- If `rejected`: marks workflow item resolved

---

## Office Hours

### `GET /api/groups/:groupId/requests`
🔒 Auth required.
- Professors: see all requests for the group
- Students: see only their own

---

### `POST /api/groups/:groupId/requests`
🔒 Student only.

**Body** `{ "subject": "...", "description": "...", "preferred_time": "..." }`

---

### `PATCH /api/requests/:id`
🔒 Professor only.

**Body** `{ "status": "approved" | "rejected" | "completed", "scheduled_at": "ISO date" }`

---

## AI — Self Check

### `POST /api/ai/self-check`
🔒 Student only. Grade a submission against a rubric.

**Body**
```json
{
  "assignment_name": "Assignment 2",
  "rubric_name": "Grading Rubric v1",
  "rubric_text": "..full rubric text..",
  "work_text": "..student work text.."
}
```

**Response**
```json
{
  "id": 7,
  "letter_grade": "B+",
  "score": "87/100",
  "summary": "Strong understanding demonstrated with minor gaps in edge case handling.",
  "strengths": ["Clear problem decomposition", "Good variable naming"],
  "improvements": [
    { "section": "Error Handling", "suggestion": "Add null checks before dereferencing" }
  ],
  "assignment_name": "Assignment 2",
  "rubric_name": "Grading Rubric v1"
}
```

**Errors**: `503` if ANTHROPIC_API_KEY not configured

---

### `GET /api/self-check/history`
🔒 Auth required. Returns the current user's last 20 self-check reports.

---

## AI — Analysis

### `GET /api/ai/analysis/:groupId`
🔒 Auth required. Generate live AI topic analysis for a group's recent questions.

**Response**
```json
{
  "topics": [
    {
      "id": "recursion-iteration",
      "name": "Recursion & Iteration",
      "count": 12,
      "trend": "rising",
      "status": "needs-attention",
      "insight": "Students are struggling with base case identification",
      "recommendation": "Dedicate 20 min in next class to worked examples"
    }
  ],
  "overall_summary": "...",
  "total_questions": 47
}
```

---

## Workflow

### `GET /api/workflow/queue/:groupId`
🔒 Professor only. Get escalated questions awaiting review.

**Response** `WorkflowItem[]` — includes question title/body, AI answer, confidence score, RAG sources, student name

---

### `GET /api/workflow/history/:groupId`
🔒 Professor only. Full workflow history (last 100 items).

---

### `PATCH /api/workflow/item/:id/resolve`
🔒 Professor only. Resolve a workflow item.

**Body** `{ "action": "approve" | "reject" | "override", "ai_status": "verified" | "rejected" }`

**Side effect**: if `verified`, creates an `approved_answers` record

---

### `GET /api/workflow/summary/:groupId`
🔒 Auth required. Aggregated workflow stats for a group.

**Response**
```json
{
  "totalQuestions": 83,
  "questionsThisWeek": 12,
  "escalated": 4,
  "resolved": 31,
  "duplicates": 8,
  "verified": 22,
  "rejected": 3,
  "acceptanceRate": 88,
  "avgConfidence": 74,
  "activeClusters": 2,
  "criticalClusters": 1,
  "approvedAnswers": 19,
  "clusters": [...]
}
```

---

## Confusion Clusters

### `GET /api/clusters/:groupId`
🔒 Auth required. All clusters for a group, ordered by question count.

**Response** `ConfusionCluster[]`
```json
[{
  "id": 3,
  "group_id": 1,
  "topic": "Recursion & Iteration",
  "question_count": 12,
  "severity": "critical",
  "status": "open",
  "first_seen": "...",
  "last_seen": "..."
}]
```

---

### `POST /api/clusters/:clusterId/refresh-clusters`
🔒 Professor only. Get an AI intervention recommendation for a cluster.

**Response** `{ recommendation: { type, title, content, urgency }, cluster }`

---

### `PATCH /api/clusters/:clusterId/status`
🔒 Professor only.

**Body** `{ "status": "open" | "intervention_sent" | "resolved" }`

---

## Interventions

### `GET /api/interventions/:groupId`
🔒 Auth required. All interventions for a group.

---

### `POST /api/interventions/:groupId`
🔒 Professor only. Create a new intervention.

**Body**
```json
{
  "type": "review_session",
  "title": "Recursion Review",
  "content": "We will hold a 45-minute session on Thursday...",
  "cluster_id": 3,
  "topic": "Recursion & Iteration"
}
```

**Side effect**: if `cluster_id` provided, sets cluster status to `intervention_sent`

---

### `POST /api/interventions/:id/generate-announcement`
🔒 Professor only. Draft an AI class announcement.

**Body** `{ "topic": "Recursion", "insights": "12 students have asked about this..." }`

**Response** `{ "announcement": "Dear class, I've noticed many questions about..." }`

---

### `PATCH /api/interventions/:id`
🔒 Professor only.

**Body** `{ "status": "draft" | "sent" | "tracked" }`

---

## Approved Answers

### `GET /api/approved-answers/:groupId`
🔒 Auth required. Returns the reusable answer library, ordered by usage count.

---

### `POST /api/approved-answers/:groupId`
🔒 Professor only. Manually add an approved answer.

**Body** `{ "question_pattern": "...", "answer": "...", "topic": "...", "source_question_id": 12 }`

---

## Knowledge Base (RAG)

### `POST /api/knowledge/:groupId`
🔒 Professor only. Upload a course document.

**Content-Type**: `multipart/form-data`
**Field**: `file` — PDF, DOCX, TXT, or MD (max 20MB)

**Response**
```json
{ "message": "Document processed", "filename": "lecture5.pdf", "chunks": 23 }
```

**Process**: text extraction → 400-word chunking → local embedding → stored in SQLite

**Errors**: `400` unsupported file type, `500` parsing failed

---

### `GET /api/knowledge/:groupId`
🔒 Auth required. List uploaded documents (deduplicated by filename).

**Response**
```json
[{
  "id": 14,
  "filename": "lecture5.pdf",
  "chunks": 23,
  "uploaded_at": "2026-05-18T14:00:00"
}]
```

---

### `DELETE /api/knowledge/:groupId/:filename`
🔒 Professor only. Delete all chunks for a document.

**Response** `{ "deleted": 23 }`

---

## Admin / Observability

### `GET /api/admin/metrics`
🔒 Professor only. AI system metrics.

**Response**
```json
{
  "totalRequests": 412,
  "requests24h": 38,
  "failedRequests": 3,
  "avgLatency": 847,
  "totalTokens": 184200,
  "escalationRate": 12,
  "duplicateRate": 9,
  "requestsByType": [
    { "request_type": "generateAnswerDraft", "count": 147, "avg_latency": 1240, "errors": 1 }
  ],
  "dailyActivity": [
    { "date": "2026-05-18", "requests": 38, "errors": 0 }
  ]
}
```

---

### `GET /api/admin/queue-health`
🔒 Professor only. Quick health snapshot.

**Response**
```json
{
  "unresolved": 4,
  "criticalClusters": 1,
  "pendingReview": 7,
  "draftInterventions": 2
}
```

---

### `GET /api/health`
Public. Server health check.

**Response** `{ "status": "ok", "ai_enabled": true, "db": "connected", "version": "2.1.0-rag" }`

---

## Error Format

All errors return:
```json
{ "error": "Human-readable message" }
```

Common status codes:
- `400` — missing/invalid fields
- `401` — no token or invalid token
- `403` — wrong role
- `404` — resource not found
- `409` — conflict (duplicate email, already a member)
- `500` — server or AI error
- `503` — AI service not configured (no API key)
