# D.I.Y.A — RAG Implementation Deep Dive

> Retrieval-Augmented Generation: how D.I.Y.A grounds AI answers in real course materials instead of relying purely on Claude's training data.

---

## The Problem RAG Solves

Without RAG, when a student asks "How should I implement the linked list in Problem 3?", Claude answers from its general knowledge. That answer might be:
- Correct in general but misaligned with the professor's specific instructions
- Unaware of the class's coding style requirements
- Missing references to the lecture where this was taught
- Potentially contradicting what's in the assignment rubric

With RAG, Claude is shown the actual relevant section of `assignment3.pdf` before it answers. It now says: *"Based on the assignment spec (assignment3.pdf), you should use a sentinel node approach as described on page 2..."*

---

## Architecture

```
                    INGESTION PHASE (professor uploads doc)
                    ─────────────────────────────────────────

  [PDF / DOCX / TXT]
         │
         ▼
  extractText()
  ├── pdf-parse   → reads text from PDF binary
  ├── mammoth     → strips DOCX XML, returns plain text
  └── UTF-8 decode → for .txt and .md files
         │
         ▼
  chunkText(text, chunkSize=400, overlap=50)
  ├── Split by whitespace into words
  ├── Sliding window: take 400 words, advance by 350
  ├── Each chunk shares 50 words with the next (overlap preserves context)
  └── Filter out chunks shorter than 30 chars
         │
         ▼
  embed(chunk)  [for each chunk]
  └── Xenova/all-MiniLM-L6-v2
      ├── mean pooling over token embeddings
      ├── L2 normalized
      └── returns float[384]
         │
         ▼
  INSERT INTO knowledge_documents
  (group_id, filename, chunk_text, chunk_index, embedding JSON)


                    RETRIEVAL PHASE (student posts question)
                    ─────────────────────────────────────────

  [Student Question Text]
         │
         ▼
  embed(question)  → float[384]
         │
         ▼
  SELECT all chunks for this group_id WHERE embedding IS NOT NULL
         │
         ▼
  cosineSimilarity(questionVec, chunkVec)  for every chunk
  ├── dot product / (|A| × |B|)
  └── pure JS, no native dependencies
         │
         ▼
  Sort by score DESC → take top 4 chunks WHERE score > 0.3
         │
         ▼
  [ragChunks]  →  generateAnswerDraft(title, body, topic, ragChunks)
         │
         ▼
  Inject into Claude prompt:
  ┌──────────────────────────────────────────────────────┐
  │ RELEVANT COURSE MATERIALS:                           │
  │ [1] (from "lecture5.pdf"): A pointer stores the...  │
  │ [2] (from "assignment3.pdf"): In Problem 3, use...  │
  │                                                      │
  │ Use the above materials to ground your answer.       │
  │ Cite the source file name when referencing them.     │
  └──────────────────────────────────────────────────────┘
         │
         ▼
  Claude answer with citations
  forum_questions.rag_sources = ["lecture5.pdf", "assignment3.pdf"]
```

---

## The Embedding Model

**Model**: `Xenova/all-MiniLM-L6-v2`

This is a sentence-transformer model optimized for semantic similarity. Key properties:
- **384-dimensional** output vectors (compact, fast)
- **Trained on** 1B+ sentence pairs for semantic similarity tasks
- **Local execution** via `@xenova/transformers` — no API call, no cost, no latency added to uploads
- **Quantized** (int8) weights for ~4x smaller model size
- **First load**: ~25MB model download, cached afterward. Subsequent uses are instant.

The Xenova package is a JavaScript port of HuggingFace Transformers, using ONNX Runtime under the hood. It runs the full transformer inference in Node.js without Python.

---

## Chunking Strategy

### Why 400 words?

- Too small (< 100 words): chunks lose context, a sentence about "pointers" without the surrounding paragraph is ambiguous
- Too large (> 800 words): the similarity score gets diluted by off-topic content in the same chunk; Claude's prompt grows large
- 400 words is roughly one lecture slide or one problem statement — the natural unit of meaning in academic documents

### Why 50-word overlap?

Without overlap, a concept that spans a chunk boundary gets split and potentially lost. A 50-word overlap means that any key sentence within 50 words of a chunk boundary will appear in both adjacent chunks, ensuring it can be retrieved regardless of where the query falls in the similarity space.

### Example

Given a document with text: `[A B C D E F G H I J K L]` (words, simplified), with chunkSize=5, overlap=2:

```
Chunk 0: [A B C D E]
Chunk 1: [D E F G H]   ← D, E repeated from chunk 0
Chunk 2: [G H I J K]   ← G, H repeated from chunk 1
Chunk 3: [J K L]       ← J, K repeated from chunk 2
```

---

## Cosine Similarity

The similarity metric used:

```
cosine(A, B) = (A · B) / (||A|| × ||B||)
```

Since `all-MiniLM-L6-v2` outputs L2-normalized vectors (`||v|| = 1`), this simplifies to a dot product. Values range from -1 (opposite) to 1 (identical). In practice, relevant matches score 0.5–0.85, loosely related content 0.3–0.5, and unrelated content < 0.3.

The retrieval threshold of **0.3** was chosen to:
- Exclude truly unrelated chunks (score 0.0–0.2)
- Allow topically related content even when phrased differently
- Avoid injecting irrelevant context that could confuse Claude

If no chunks score above 0.3 (e.g., the professor hasn't uploaded anything, or the question is about something not in any document), the RAG context is empty and the answer proceeds without it — the system degrades gracefully.

---

## Storage

Embeddings are stored as JSON text in SQLite:

```sql
embedding TEXT  -- e.g., "[0.023, -0.114, 0.087, ...]"  (384 floats)
```

This is simple and requires no extensions. The tradeoff: full-table scan on retrieval (cosine similarity computed in JS for every chunk). For a typical class with 50 documents × 20 chunks each = 1000 chunks, this takes ~10ms — negligible.

**At scale** (10,000+ chunks), this should be replaced with `pgvector` (Postgres) or a dedicated vector database like Pinecone or Chroma, which provide approximate nearest-neighbor (ANN) indexes that return top-k in O(log n) rather than O(n).

---

## Context Injection Format

The RAG context is injected into the system prompt as a clearly labeled section:

```
RELEVANT COURSE MATERIALS (retrieved from uploaded documents):
[1] (from "lecture5_pointers.pdf"): A pointer stores the memory address of another 
variable. To access the value, dereference with *. Example: int *p = &x; 
printf("%d", *p); The & operator takes the address of a variable...

[2] (from "assignment2_spec.pdf"): In Problem 3, you will implement a singly-linked 
list using pointer arithmetic. Do not use built-in containers. Each node should 
contain an int value and a next pointer...

Use the above course materials to ground your answer. Cite the source file name 
when referencing them.
```

This approach:
- Clearly delineates retrieved content from the question
- Tells Claude which file each chunk came from (for citation)
- Explicitly instructs Claude to use and cite the materials
- Keeps Claude focused on the professor's specific content rather than drifting to general knowledge

---

## Provenance Tracking

When RAG context is used, the source filenames are saved:

```sql
forum_questions.rag_sources = '["lecture5_pointers.pdf", "assignment2_spec.pdf"]'
```

This enables:
- **Workflow Queue badge**: professors see `📚 Based on: lecture5.pdf` when reviewing an AI draft
- **Future audit trail**: trace exactly which documents contributed to each answer
- **Analytics**: which documents are being referenced most (not yet implemented but the data is there)

---

## Limitations and Known Tradeoffs

**1. No incremental re-chunking**
Uploading the same filename again adds new chunks without deleting old ones. The `DELETE /api/knowledge/:groupId/:filename` endpoint removes all chunks for a filename first if you want to re-upload. This is intentional — simple and predictable.

**2. Text-only extraction**
Equations in PDFs (rendered as images) are not captured. Diagrams, figures, and LaTeX math in compiled PDFs will be missing or garbled. Future improvement: use a vision model or MathPix for mathematical content.

**3. Exact-match citation**
The filename stored in `rag_sources` is the upload filename. If a professor uploads `Lecture 5 - Pointers (FINAL v3).pdf`, that's what gets cited. Encourage clean filenames.

**4. 20MB file limit**
Set in multer configuration. A typical 50-slide PDF is 2–5MB. This limit handles most real-world academic documents but would need increasing for video transcripts or entire textbooks.

**5. First-request model load**
The `Xenova/all-MiniLM-L6-v2` model is downloaded and cached on first use. The first upload after a server restart takes ~15–30 seconds while the model loads. Subsequent requests are fast (~100ms per chunk). A production deployment would pre-warm the model at startup.

---

## Comparison: With vs. Without RAG

| Aspect | Without RAG | With RAG |
|---|---|---|
| Answer source | Claude's training data (cutoff: Aug 2025) | Professor's actual course materials |
| Specificity | Generic CS knowledge | Specific to this class's terminology and requirements |
| Citation | None | "Based on lecture5.pdf, section 3..." |
| Hallucination risk | Higher for class-specific details | Lower — grounded in real documents |
| Cost | Same (Claude API call) | Same (local embeddings add no API cost) |
| Latency | +0ms | +~100ms for embedding + similarity (negligible) |
| Setup | Nothing required | Professor must upload documents |
