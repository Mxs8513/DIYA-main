# D.I.Y.A — Workflow Reference

## Core Workflows

---

### 1. Question Submission & AI Routing

```
Student submits question
        │
        ▼
[API] POST /api/groups/:id/forum
        │
        ├─► Persist to DB → return to student immediately (< 50ms)
        │
        └─► [Async, non-blocking] workflow.routeQuestion()
                │
                ├── 1. classifyTopic()
                │       Model: claude-haiku-4-5-20251001 (or keyword fallback)
                │       Output: one of 12 topic categories
                │       → UPDATE forum_questions SET topic = ?
                │       Example: "Recursion & Iteration"
                │
                ├── 2. detectDuplicateQuestion() [Jaccard similarity]
                │       Tokenize question text (lowercase, strip punctuation)
                │       Compare against last 80 questions in this group
                │       similarity = |intersection| / |union| of token sets
                │       Threshold: 0.45
                │       │
                │       similarity ≥ 0.45?
                │           YES → routing_decision = "duplicate"
                │                 duplicate_of = matchedQuestionId
                │                 │
                │                 Has approved answer for original?
                │                   YES → ai_answer = approvedAnswer
                │                         ai_status = "verified"
                │                         usage_count++ on approved_answers
                │                         → student sees answer instantly
                │                   NO  → question flagged as duplicate only
                │                 → skip to recordWorkflowItem()
                │           NO  → continue
                │
                ├── 3. rag.retrieve()
                │       Embed question text → float[384]
                │       Compare against all uploaded knowledge_documents for group
                │       Cosine similarity, threshold > 0.3
                │       Returns top-4 most relevant chunks
                │       → ragChunks (empty if no documents uploaded)
                │
                ├── 4. generateAnswerDraft()
                │       Model: claude-haiku-4-5-20251001
                │       Max tokens: 700
                │       Prompt: educational tone + optional RAG context
                │       If ragChunks present: inject as "RELEVANT COURSE MATERIALS"
                │       → UPDATE forum_questions SET ai_answer = ?, rag_sources = ?
                │
                ├── 5. scoreAIConfidence()
                │       Model: claude-haiku-4-5-20251001
                │       Asks Claude to rate its own answer: 0.0–1.0
                │       Returns JSON: { "confidence": 0.82, "reason": "..." }
                │       │
                │       score < 0.55?
                │           YES → routing_decision = "low_confidence"
                │                 escalation_reason = "AI confidence 47% below threshold"
                │                 ai_status remains "pending"
                │                 → enters professor review queue
                │           NO  → routing_decision = "normal"
                │                 ai_status = "pending" (awaits optional review)
                │
                ├── 6. detectAndUpdateClusters()
                │       SQL: GROUP BY topic WHERE created_at > 7 days
                │       Count questions per topic in this group
                │       Severity thresholds:
                │           ≥ 10 questions → critical
                │           ≥ 6  questions → high
                │           ≥ 3  questions → medium
                │           < 3  questions → low
                │       UPSERT confusion_clusters (unique on group_id, topic)
                │
                └── 7. recordWorkflowItem()
                        INSERT into workflow_items:
                        status = escalated (if low_confidence or failed)
                              = auto_resolved (if duplicate with approved answer)
                              = processed (all other cases)
```

**Routing Decision Summary**

| `routing_decision` | Meaning | Status |
|---|---|---|
| `normal` | AI answered, confidence ≥ 0.55 | `processed` |
| `duplicate` | Matched an existing question | `auto_resolved` or `processed` |
| `low_confidence` | AI confidence < 0.55 | `escalated` → professor queue |
| `escalated` | AI generation failed entirely | `escalated` → professor queue |

---

### 2. Professor AI Review (Human-in-the-Loop)

```
Professor opens Workflow Queue
        │
        ▼
GET /api/workflow/queue/:groupId
Returns all workflow_items WHERE status = 'escalated'
Includes: question, AI draft, confidence score, routing reason, RAG sources used
        │
        ▼
Professor reviews each item
Shows:
  - Student's question (title + body)
  - AI-generated draft answer
  - Confidence score (visualized as a colored bar)
  - Routing decision + escalation reason
  - "📚 Based on: lecture5.pdf" badge if RAG was used
        │
        ├── Approve Answer
        │       PATCH /api/workflow/item/:id/resolve { ai_status: "verified" }
        │       ├─► workflow_items.status = "resolved"
        │       ├─► forum_questions.ai_status = "verified"
        │       └─► UPSERT approved_answers (reusable for future duplicates)
        │           Student now sees verified answer with checkmark badge
        │
        ├── Reject Answer
        │       PATCH /api/workflow/item/:id/resolve { ai_status: "rejected" }
        │       ├─► workflow_items.status = "resolved"
        │       └─► forum_questions.ai_status = "rejected"
        │           Professor should manually post a reply with correct answer
        │
        └── Mark Reviewed (no answer action)
                PATCH /api/workflow/item/:id/resolve (no ai_status)
                └─► workflow_items.status = "resolved"
                    Exits queue without changing the AI answer status
```

**What students see based on ai_status**

| `ai_status` | Student sees |
|---|---|
| `pending` | Question visible, no AI answer shown yet |
| `verified` | Answer with "✓ Verified by professor" badge |
| `rejected` | No AI answer shown, awaiting professor reply |

---

### 3. Confusion Cluster → Intervention

```
Many students ask about "Recursion"
        │
        ▼
detectAndUpdateClusters() runs after each question is routed
        │
        ▼
confusion_clusters:
  topic = "Recursion & Iteration"
  question_count = 12
  severity = "critical"
  status = "open"
        │
        ▼
Professor sees cluster card in Interventions page
Card shows: topic, question count, severity badge, time range
        │
        ├── Get AI Recommendation
        │       POST /api/clusters/:id/refresh-clusters
        │       → recommendIntervention(cluster) [Claude]
        │       Returns: {
        │           type: "review_session",
        │           title: "Targeted Recursion Review",
        │           content: "Schedule 45-min session, focus on base cases...",
        │           urgency: "critical"
        │       }
        │
        ├── Generate AI Announcement Draft
        │       POST /api/interventions/:id/generate-announcement
        │       → generateProfessorAnnouncement(topic, insights) [Claude]
        │       Returns ready-to-post class message (~150 words)
        │       Professor edits if needed
        │
        ├── Create Intervention
        │       POST /api/interventions/:groupId { type, title, content, cluster_id }
        │       ├─► Creates interventions record
        │       ├─► Records outcome_before (current question count for topic)
        │       └─► Sets confusion_clusters.status = "intervention_sent"
        │
        └── Track Outcome (later)
                Intervention marked as "tracked"
                trackInterventionOutcome() measures question volume after
                effectiveness = ((before - after) / before) × 100
                Example: 12 questions before, 4 after = 67% effectiveness
```

---

### 4. Self-Check AI Grading

```
Student navigates to Self-Check page
        │
        ▼
Uploads rubric file + work file (PDF, DOCX, or TXT)
        │
        ▼
Frontend: FileReader API reads files as text
(browser-side extraction, no server upload needed for text files)
        │
        ▼
POST /api/ai/self-check {
  assignment_name, rubric_name,
  rubric_text (up to 4000 chars),
  work_text (up to 6000 chars)
}
        │
        ▼
Claude prompt:
  "You are an academic grading assistant. Analyze the student's work
   against the rubric and provide detailed feedback.
   Return ONLY valid JSON:
   {
     letter_grade, score, summary,
     strengths: [...],
     improvements: [{ section, suggestion }]
   }"
        │
        ▼
Response stored in self_check_reports
Rendered to student:
  ┌─────────────────────────────────────────┐
  │  Grade: B+    Score: 87/100             │
  │                                         │
  │  Summary: Strong understanding with    │
  │  minor gaps in edge case handling.      │
  │                                         │
  │  Strengths:                             │
  │    ✓ Clear problem decomposition        │
  │    ✓ Good variable naming               │
  │                                         │
  │  Improvements:                          │
  │    ⚠ Error Handling: Add null checks... │
  └─────────────────────────────────────────┘
```

---

### 5. Approved Answer Reuse

```
Professor approves AI answer in Workflow Queue
        │
        ▼
ai_status = "verified"
        │
        ▼
UPSERT into approved_answers:
{
  group_id,
  source_question_id,
  topic,
  question_pattern: original title,
  answer: the AI answer text
}
        │
        ▼
New student posts similar question later
        │
        ▼
detectDuplicateQuestion()
Jaccard similarity ≥ 0.45 vs. approved_answers.question_pattern
hasApprovedAnswer = true
        │
        ▼
Auto-serve:
  forum_questions.ai_answer = approved_answers.answer
  forum_questions.ai_status = "verified"
  forum_questions.routing_decision = "duplicate"
  approved_answers.usage_count++
        │
        ▼
Student sees professor-verified answer immediately
Professor review queue is NOT notified
```

---

### 6. RAG Knowledge Base Setup

```
Professor uploads course materials
        │
        ▼
POST /api/knowledge/:groupId (multipart/form-data, file field)
        │
        ▼
rag.processDocument()
  ├── extractText()    (pdf-parse / mammoth / UTF-8)
  ├── chunkText()      (400 words, 50-word overlap)
  └── embed() × N     (Xenova/all-MiniLM-L6-v2, 384-dim)
        │
        ▼
N rows inserted into knowledge_documents
Each row: filename, chunk_text, chunk_index, embedding JSON
        │
        ▼
Next time any student in this group posts a question:
  workflow.routeQuestion() calls rag.retrieve()
  → Top-4 relevant chunks injected into Claude's answer prompt
  → Answer now cites the professor's actual course materials
  → rag_sources saved on the question record
```

---

## Intervention Types

| Type | When to Use | Professor Action |
|---|---|---|
| `announcement` | General confusion, info gap, common misconception | Post class-wide announcement |
| `review_session` | High-severity cluster (≥6 questions on same topic) | Schedule targeted 30–45 min session |
| `office_hours` | Many personal / project-specific questions | Announce extra office hours slot |
| `resource` | Setup / environment / tooling issues | Share guide, tutorial link, or reference doc |

---

## Outcome Metrics Tracked

| Metric | Source | Formula |
|---|---|---|
| AI Acceptance Rate | `forum_questions` | verified / (verified + rejected) × 100 |
| Avg Confidence Score | `forum_questions` | AVG(confidence_score) × 100 |
| Duplicate Reduction Rate | `workflow_items` | duplicates / total × 100 |
| Escalation Rate | `workflow_items` | escalated / total × 100 |
| Intervention Effectiveness | `interventions` | (outcome_before − outcome_after) / outcome_before × 100 |
| Queue Resolution Time | `workflow_items` | AVG(resolved_at − created_at) |
| Topic Distribution | `forum_questions` | COUNT(*) GROUP BY topic |
| AI API Error Rate | `ai_metrics` | SUM(success=0) / COUNT(*) × 100 |
| Avg AI Latency | `ai_metrics` | AVG(latency_ms) WHERE success=1 |
| RAG Usage Rate | `forum_questions` | COUNT(rag_sources IS NOT NULL) / total × 100 |
