'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const Database = require('better-sqlite3');
const { SCHEMA } = require('../db');
const workflow = require('../services/ai-workflow');

// In-memory DB with the real schema; no API key → AI-disabled deterministic mode.
function freshDb() {
  const db = new Database(':memory:');
  db.exec(SCHEMA);
  return db;
}

test('classifyTopic falls back to keyword classification when AI is disabled', async () => {
  workflow.init(freshDb(), null);
  assert.equal(await workflow.classifyTopic('How do recursion and loops work?'), 'Recursion & Iteration');
  assert.equal(await workflow.classifyTopic('Trouble with my array and linked list'), 'Data Structures');
  assert.equal(await workflow.classifyTopic('How do I install the IDE and set up my environment?'), 'Development Environment');
  assert.equal(await workflow.classifyTopic('completely unrelated gibberish xyz'), 'Other');
});

test('detectDuplicateQuestion flags near-identical questions', async () => {
  const db = freshDb();
  workflow.init(db, null);
  db.prepare("INSERT INTO users (name,email,password_hash,role) VALUES ('U','u@x.com','h','student')").run();
  db.prepare("INSERT INTO groups (name,code,professor_id) VALUES ('G','C1',1)").run();
  db.prepare(`INSERT INTO forum_questions (group_id,user_id,title,body)
              VALUES (1,1,'How do I balance chemical equations','I make arithmetic mistakes balancing equations')`).run();

  const dup = await workflow.detectDuplicateQuestion('How do I balance chemical equations', 1);
  assert.equal(dup.isDuplicate, true);
  assert.ok(dup.similarity >= 0.45);

  const unique = await workflow.detectDuplicateQuestion('What is the boiling point of nitrogen at altitude', 1);
  assert.equal(unique.isDuplicate, false);
});

test('recommendIntervention returns a deterministic fallback when AI is disabled', async () => {
  workflow.init(freshDb(), null);
  const rec = await workflow.recommendIntervention({ topic: 'Stoichiometry', question_count: 7, severity: 'high' });
  assert.equal(rec.type, 'review_session');
  assert.match(rec.title, /Stoichiometry/);
  assert.equal(rec.urgency, 'high');
});

test('generateProfessorAnnouncement returns template text when AI is disabled', async () => {
  workflow.init(freshDb(), null);
  const text = await workflow.generateProfessorAnnouncement('Titration', 'many questions');
  assert.match(text, /Titration/);
});

test('detectAndUpdateClusters aggregates recent questions by topic with severity', async () => {
  const db = freshDb();
  workflow.init(db, null);
  db.prepare("INSERT INTO users (name,email,password_hash,role) VALUES ('U','u@x.com','h','student')").run();
  db.prepare("INSERT INTO groups (name,code,professor_id) VALUES ('G','C1',1)").run();
  for (let i = 0; i < 4; i++) {
    db.prepare("INSERT INTO forum_questions (group_id,user_id,title,body,topic) VALUES (1,1,?,?,'Algorithms')")
      .run(`q${i}`, 'body');
  }
  await workflow.detectAndUpdateClusters(1);
  const cluster = db.prepare("SELECT * FROM confusion_clusters WHERE topic='Algorithms'").get();
  assert.equal(cluster.question_count, 4);
  assert.equal(cluster.severity, 'medium'); // 3..5 → medium
});

test('routeQuestion escalates when no AI answer can be generated', async () => {
  const db = freshDb();
  workflow.init(db, null);
  db.prepare("INSERT INTO users (name,email,password_hash,role) VALUES ('U','u@x.com','h','student')").run();
  db.prepare("INSERT INTO groups (name,code,professor_id) VALUES ('G','C1',1)").run();
  const qid = db.prepare("INSERT INTO forum_questions (group_id,user_id,title,body) VALUES (1,1,'Sorting','How does quicksort work')")
    .run().lastInsertRowid;

  const result = await workflow.routeQuestion(qid, 1, 'Sorting', 'How does quicksort work');
  assert.equal(result.routing_decision, 'escalated');
  assert.equal(result.topic, 'Algorithms');
  const item = db.prepare('SELECT * FROM workflow_items WHERE question_id = ?').get(qid);
  assert.equal(item.status, 'escalated');
});
