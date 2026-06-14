'use strict';

let pipeline = null;
let pipelineLoading = null;

async function getEmbedder() {
  if (pipeline) return pipeline;
  if (pipelineLoading) return pipelineLoading;

  pipelineLoading = (async () => {
    const { pipeline: createPipeline } = await import('@xenova/transformers');
    pipeline = await createPipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', { quantized: true });
    console.log('[RAG] Embedding model loaded (Xenova/all-MiniLM-L6-v2)');
    return pipeline;
  })();

  return pipelineLoading;
}

async function embed(text) {
  const embedder = await getEmbedder();
  const output = await embedder(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

function cosineSimilarity(a, b) {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB) + 1e-8);
}

function chunkText(text, chunkSize = 400, overlap = 50) {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks = [];
  let i = 0;
  while (i < words.length) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    if (chunk.trim().length > 30) chunks.push(chunk);
    i += chunkSize - overlap;
  }
  return chunks;
}

async function extractText(buffer, mimetype, filename) {
  const ext = (filename || '').toLowerCase().split('.').pop();

  if (mimetype === 'application/pdf' || ext === 'pdf') {
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    ext === 'docx'
  ) {
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  // plain text / markdown / code
  return buffer.toString('utf8');
}

async function processDocument(db, groupId, filename, buffer, mimetype, uploadedBy) {
  const rawText = await extractText(buffer, mimetype, filename);
  if (!rawText || rawText.trim().length < 10) throw new Error('Could not extract text from document');

  const chunks = chunkText(rawText);
  if (chunks.length === 0) throw new Error('Document produced no text chunks');

  const docIds = [];
  for (let i = 0; i < chunks.length; i++) {
    const vec = await embed(chunks[i]);
    const row = db.prepare(
      `INSERT INTO knowledge_documents (group_id, filename, content_type, chunk_text, chunk_index, embedding, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(groupId, filename, mimetype, chunks[i], i, JSON.stringify(vec), uploadedBy);
    docIds.push(row.lastInsertRowid);
  }

  return { filename, chunks: chunks.length, docIds };
}

async function retrieve(db, groupId, query, topK = 4) {
  const rows = db.prepare(
    'SELECT id, filename, chunk_text, chunk_index, embedding FROM knowledge_documents WHERE group_id = ? AND embedding IS NOT NULL'
  ).all(groupId);

  if (rows.length === 0) return [];

  const queryVec = await embed(query);

  const scored = rows.map(row => {
    const vec = JSON.parse(row.embedding);
    const score = cosineSimilarity(queryVec, vec);
    return { id: row.id, filename: row.filename, chunk_index: row.chunk_index, text: row.chunk_text, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK).filter(r => r.score > 0.3);
}

module.exports = { embed, cosineSimilarity, chunkText, extractText, processDocument, retrieve };
