# D.I.Y.A — AI Pipeline

> Every AI-powered function in the system: what it does, how it works, the model used, fallback behavior, and where it fits in the overall flow.

All AI functions live in `server/services/ai-workflow.js` as pure, independently callable functions. They share a single Anthropic client initialized at startup. Every call logs to the `ai_metrics` table for observability.

---

## Initialization

```js
workflow.init(db, process.env.ANTHROPIC_API_KEY)
```

Called once at server startup. If `ANTHROPIC_API_KEY` is not set:
- All Claude calls are skipped
- Every function falls back to a rule-based or template response
- The application remains fully functional — no crashes, no broken routes
- The `/api/health` endpoint reports `ai_enabled: false`

This graceful degradation means the app can be developed and demoed without an API key.

---

## `classifyTopic(questionText)`

**Purpose**: Categorize a student question into one of 12 academic topic areas so clusters can be detected and interventions can be targeted.

**Model**: `claude-haiku-4-5-20251001`
**Max tokens**: 60
**Fallback**: keyword-based rule matching (no API call)

**Prompt**:
```
Classify this academic question into exactly one of these categories.
Return only the category name, nothing else.

Categories: Recursion & Iteration, Data Structures, Algorithms,
Object-Oriented Programming, Debugging & Testing, Development Environment,
Exam Preparation, Projects & Assignments, Theory & Concepts,
Syntax & Language, Memory & Performance, Other

Question: "{questionText}"
```

**Output**: One of the 12 topic strings. If Claude returns an unrecognized value, falls back to `"Other"`.

**Keyword fallback** (used when no API key):
```
"recurs" | "loop" | "iterati"  → Recursion & Iteration
"array" | "list" | "tree"      → Data Structures
"sort" | "search" | "big o"    → Algorithms
"class" | "object" | "inherit" → Object-Oriented Programming
"debug" | "test" | "error"     → Debugging & Testing
"project" | "assignment"       → Projects & Assignments
"exam" | "midterm" | "quiz"    → Exam Preparation
"install" | "setup" | "ide"    → Development Environment
(none match)                   → Other
```

**Side effect**: `UPDATE forum_questions SET topic = ?`

---

## `detectDuplicateQuestion(questionText, groupId, threshold=0.45)`

**Purpose**: Identify if a new question is asking the same thing as an existing one. If a verified answer exists for the original, serve it immediately without professor review.

**Cost**: Zero — pure algorithm, no API call.

**Algorithm**: Jaccard similarity on tokenized word sets.

```
tokenize(text):
  lowercase → remove non-alphanumeric → split by whitespace → filter tokens < 3 chars

similarity(A, B) = |intersection(tokensA, tokensB)| / |union(tokensA, tokensB)|
```

**Comparison window**: Last 80 questions in the group (keeps it relevant and bounded — older questions are less likely to be duplicates).

**Output**:
```js
{
  isDuplicate: true,
  similarity: 0.61,
  matchedQuestionId: 42,
  matchedTitle: "How do I implement a stack?",
  hasApprovedAnswer: true,
  approvedAnswer: "A stack is a LIFO data structure..."
}
```

**Threshold**: 0.45 — chosen so that "How do I use pointers?" and "Can you explain pointer usage in C?" match (they share {pointers, usage, use}), but "How do pointers work?" and "How do arrays work?" don't (only {how, work} overlap = 0.33).

**Side effects**:
- If duplicate with approved answer: sets `ai_answer`, `ai_status = 'verified'`, increments `usage_count`
- Records routing decision `"duplicate"` on `forum_questions`

---

## `generateAnswerDraft(title, body, topic, ragChunks=[])`

**Purpose**: Generate an educational draft answer to a student question, optionally grounded in course materials retrieved via RAG.

**Model**: `claude-haiku-4-5-20251001`
**Max tokens**: 700
**Temperature**: default (Claude Haiku default ≈ 1.0)

**Prompt structure (without RAG)**:
```
You are an academic assistant helping students in a {topic} course.
Answer this student question clearly and educationally. Be concise (2-4 paragraphs).

Question: {title}
{body}
```

**Prompt structure (with RAG chunks)**:
```
You are an academic assistant helping students in a {topic} course.
Answer this student question clearly and educationally. Be concise (2-4 paragraphs).

RELEVANT COURSE MATERIALS (retrieved from uploaded documents):
[1] (from "lecture5.pdf"): A pointer stores the memory address of another variable...
[2] (from "assignment2.pdf"): In Problem 3, you will implement a linked list...

Use the above course materials to ground your answer. Cite the source file name
when referencing them.

Question: {title}
{body}
```

**Output**: Plain text answer (2–4 paragraphs)

**Side effects**:
- `UPDATE forum_questions SET ai_answer = ?, ai_status = 'pending', rag_sources = ?`
- `rag_sources` is a JSON array of filenames, e.g. `["lecture5.pdf"]`

---

## `scoreAIConfidence(question, answer)`

**Purpose**: Have Claude self-evaluate the quality and accuracy of its own draft answer. This meta-evaluation determines whether a professor needs to review the answer or if it can be served as-is.

**Model**: `claude-haiku-4-5-20251001`
**Max tokens**: 80

**Prompt**:
```
Rate the confidence of this AI-generated answer on a scale of 0.0 to 1.0.
Consider: accuracy, completeness, clarity, and whether the question is well-defined.
Return only JSON: {"confidence": 0.85, "reason": "brief reason"}

Question: "{question}"
Answer: "{answer}"
```

**Output**: Float 0.0–1.0 (extracted from JSON response). Falls back to 0.7 if JSON parse fails.

**Escalation trigger**: score < 0.55 → `routing_decision = "low_confidence"`, question enters professor review queue

**Why 0.55?** Questions that score below this are typically:
- Ambiguous ("Can you help me?" — no specifics)
- About information Claude doesn't have (specific assignment details, syllabus dates)
- On topics where Claude lacks confidence (highly specialized domain, post-cutoff APIs)
- Questions where the answer would be "it depends on your professor's instructions"

**Side effect**: `UPDATE forum_questions SET confidence_score = ?`

---

## `detectAndUpdateClusters(groupId)`

**Purpose**: Automatically detect when many students are confused about the same topic. Runs after every question is routed.

**Cost**: Zero — pure SQL aggregation, no API call.

**Query**:
```sql
SELECT topic, COUNT(*) as count
FROM forum_questions
WHERE group_id = ? AND created_at > (7 days ago) AND topic IS NOT NULL AND topic != 'Other'
GROUP BY topic
```

**Severity thresholds**:
```
count ≥ 10 → critical
count ≥ 6  → high
count ≥ 3  → medium
count < 3  → low
```

**Storage**: UPSERT into `confusion_clusters` (unique on `group_id, topic`). Updates `question_count`, `severity`, and `last_seen` timestamp.

**Output**: `{ "Recursion & Iteration": 12, "Data Structures": 4 }` (topic → count map)

---

## `recommendIntervention(cluster)`

**Purpose**: Given a confusion cluster, suggest what type of intervention would most help students.

**Model**: `claude-haiku-4-5-20251001`
**Max tokens**: 400

**Prompt**:
```
You are helping a professor manage a class where {count} students are confused
about "{topic}" (severity: {severity}).

Suggest an intervention. Return JSON only:
{
  "type": "review_session|announcement|office_hours|resource",
  "title": "Short action title",
  "content": "2-3 sentence explanation and recommended action for the professor",
  "urgency": "low|medium|high|critical"
}
```

**Output**: `{ type, title, content, urgency }`

**Fallback** (no API key):
```js
{
  type: "review_session",
  title: `Review Session: ${cluster.topic}`,
  content: `Consider hosting a 45-minute review session focused on ${topic}. ${count} students have asked related questions in the past week.`,
  urgency: cluster.severity
}
```

---

## `generateProfessorAnnouncement(topic, insights)`

**Purpose**: Draft a class-wide announcement the professor can post to address confusion. Saves time composing it from scratch.

**Model**: `claude-haiku-4-5-20251001`
**Max tokens**: 350

**Prompt**:
```
Draft a professional professor announcement to the class about {topic}.
Context: {insights}
Keep it under 150 words, warm but professional, actionable.
```

**Output**: A ready-to-post message (professor can edit before sending)

---

## `summarizeDiscussionThread(question, replies)`

**Purpose**: Condense a long discussion thread for quick professor overview.

**Model**: `claude-haiku-4-5-20251001`
**Max tokens**: 200
**Trigger condition**: Only runs if replies ≥ 2 (no point summarizing a single reply)

---

## `trackInterventionOutcome(interventionId, groupId, topic)`

**Purpose**: Measure whether an intervention actually reduced confusion about a topic.

**Cost**: Zero — SQL query only.

**Formula**:
```
effectiveness = ((outcome_before - outcome_after) / outcome_before) × 100
```

Where `outcome_before` = question count when the intervention was created, `outcome_after` = question count in the same topic after the intervention was marked "tracked".

**Output**: `{ before, after, effectiveness }`

**Side effect**: `UPDATE interventions SET outcome_after = ?, effectiveness = ?`

---

## RAG Service (`server/services/rag.js`)

### `embed(text)`
Converts text to a 384-dimensional float vector using `Xenova/all-MiniLM-L6-v2`.
- Lazy-loads the model on first call (~15–30s for model download, then cached)
- Uses mean pooling + L2 normalization (matches how the model was trained)
- Returns `float[]` of length 384

### `cosineSimilarity(vecA, vecB)`
```
dot(A, B) / (||A|| × ||B||)
```
Pure JS, no dependencies. Returns -1 to 1.

### `chunkText(text, chunkSize=400, overlap=50)`
Splits text by whitespace, sliding window of 400 words, 50-word overlap between adjacent chunks. Filters chunks < 30 characters.

### `extractText(buffer, mimetype, filename)`
- `.pdf` / `application/pdf` → `pdf-parse` → raw text
- `.docx` / DOCX MIME type → `mammoth.extractRawText()` → plain text
- Everything else → `buffer.toString('utf8')`

### `processDocument(db, groupId, filename, buffer, mimetype, uploadedBy)`
Full ingestion: extract → chunk → embed each chunk → INSERT into `knowledge_documents`. Returns `{ filename, chunks, docIds }`.

### `retrieve(db, groupId, query, topK=4)`
Embeds the query, computes cosine similarity against all group chunks, returns top-k above 0.3 threshold sorted by score descending.

---

## AI Metrics Logging

Every Claude API call (success or failure) is logged:

```js
logMetric(requestType, model, latencyMs, success, errorMessage, tokensUsed, groupId)
```

Writes to `ai_metrics`:

| Field | Description |
|---|---|
| `request_type` | Function name (classifyTopic, generateAnswerDraft, etc.) |
| `model` | Claude model ID |
| `latency_ms` | Wall-clock time start → response |
| `success` | 1 (ok) or 0 (threw) |
| `error_message` | Exception message if failed |
| `tokens_used` | `input_tokens + output_tokens` from Anthropic usage object |
| `group_id` | Which class group triggered this (nullable) |

Queryable via `GET /api/admin/metrics` — renders on AdminPage as total requests, error rate, avg latency, daily bar chart.

---

## Routing Decision Logic

```
routing_decision | When set                        | Workflow status
─────────────────|─────────────────────────────────|─────────────────
"normal"         | confidence ≥ 0.55, no duplicate | processed
"duplicate"      | Jaccard ≥ 0.45 vs existing Q    | auto_resolved
"low_confidence" | confidence < 0.55               | escalated
"escalated"      | AI generation failed entirely   | escalated
```

## Cost Estimate (Claude Haiku, per question)

| Step | Tokens (approx) | Cost (approx) |
|---|---|---|
| classifyTopic | ~100 in + 10 out | < $0.00002 |
| generateAnswerDraft | ~300 in + 500 out | ~$0.0001 |
| scoreAIConfidence | ~200 in + 30 out | < $0.00004 |
| **Total per question** | **~1,140 tokens** | **~$0.00016** |

At 1,000 questions/month: **~$0.16/month** in AI costs for the core routing pipeline.

RAG embeddings: $0 (local model, no API).
