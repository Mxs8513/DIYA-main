'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const rag = require('../services/rag');

// Note: embed()/retrieve() require downloading the embedding model (network +
// hundreds of MB), so they are intentionally not exercised in unit tests. The
// pure, deterministic helpers below are what we cover.

test('chunkText splits long text into overlapping word chunks', () => {
  const words = Array.from({ length: 1000 }, (_, i) => `w${i}`).join(' ');
  const chunks = rag.chunkText(words, 400, 50);
  assert.ok(chunks.length >= 2);
  // each chunk should be non-trivial
  for (const c of chunks) assert.ok(c.trim().length > 30);
});

test('chunkText drops trivially short input', () => {
  assert.deepEqual(rag.chunkText('too short'), []);
});

test('cosineSimilarity is 1 for identical vectors and 0 for orthogonal', () => {
  const a = [1, 0, 0];
  assert.ok(Math.abs(rag.cosineSimilarity(a, [1, 0, 0]) - 1) < 1e-6);
  assert.ok(Math.abs(rag.cosineSimilarity(a, [0, 1, 0])) < 1e-6);
});

test('cosineSimilarity reflects partial alignment', () => {
  const sim = rag.cosineSimilarity([1, 1, 0], [1, 0, 0]);
  assert.ok(sim > 0.6 && sim < 0.8); // ~0.707
});
