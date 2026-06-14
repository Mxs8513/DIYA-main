'use strict';

/**
 * Shared database module.
 *
 * The schema lives here (not inside server.js) so that BOTH the server and the
 * seed script can create the tables. This is what makes `node seed.js` work on a
 * completely fresh clone — previously the schema only existed in server.js, so
 * seeding before the server had ever run crashed with "no such table: users".
 *
 * Pass a custom path (or set DB_PATH) to run against an isolated database — the
 * test suite uses this to avoid touching the real diya.db.
 */

const Database = require('better-sqlite3');
const path = require('path');

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('student','professor')),
    avatar TEXT,
    bio TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    professor_id INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (professor_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS group_members (
    user_id INTEGER NOT NULL,
    group_id INTEGER NOT NULL,
    joined_at TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, group_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (group_id) REFERENCES groups(id)
  );

  CREATE TABLE IF NOT EXISTS forum_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    tags TEXT,
    topic TEXT,
    ai_answer TEXT,
    ai_status TEXT DEFAULT 'pending' CHECK(ai_status IN ('pending','generating','verified','rejected')),
    confidence_score REAL,
    routing_decision TEXT DEFAULT 'normal',
    duplicate_of INTEGER,
    escalation_reason TEXT,
    upvotes INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (group_id) REFERENCES groups(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS forum_replies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    body TEXT NOT NULL,
    upvotes INTEGER DEFAULT 0,
    is_accepted INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (question_id) REFERENCES forum_questions(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS office_hour_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    subject TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','completed')),
    preferred_time TEXT,
    scheduled_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (group_id) REFERENCES groups(id),
    FOREIGN KEY (student_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS self_check_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    assignment_name TEXT NOT NULL,
    rubric_name TEXT NOT NULL,
    letter_grade TEXT,
    score_text TEXT,
    improvements_json TEXT,
    raw_analysis TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  -- ── Workflow Engine Tables ────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS workflow_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER NOT NULL,
    group_id INTEGER NOT NULL,
    status TEXT DEFAULT 'processed' CHECK(status IN ('processed','escalated','resolved','auto_resolved')),
    routing_decision TEXT DEFAULT 'normal',
    duplicate_of INTEGER,
    confidence_score REAL,
    topic TEXT,
    escalation_reason TEXT,
    resolved_by INTEGER,
    resolved_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (question_id) REFERENCES forum_questions(id),
    FOREIGN KEY (group_id) REFERENCES groups(id)
  );

  CREATE TABLE IF NOT EXISTS confusion_clusters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL,
    topic TEXT NOT NULL,
    question_count INTEGER DEFAULT 0,
    severity TEXT DEFAULT 'low' CHECK(severity IN ('low','medium','high','critical')),
    status TEXT DEFAULT 'open' CHECK(status IN ('open','intervention_sent','resolved')),
    first_seen TEXT DEFAULT (datetime('now')),
    last_seen TEXT DEFAULT (datetime('now')),
    UNIQUE(group_id, topic)
  );

  CREATE TABLE IF NOT EXISTS interventions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL,
    cluster_id INTEGER,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_by INTEGER NOT NULL,
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft','sent','tracked')),
    outcome_before INTEGER,
    outcome_after INTEGER,
    effectiveness REAL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (group_id) REFERENCES groups(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS approved_answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL,
    source_question_id INTEGER,
    topic TEXT,
    question_pattern TEXT NOT NULL,
    answer TEXT NOT NULL,
    usage_count INTEGER DEFAULT 0,
    created_by INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (group_id) REFERENCES groups(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS ai_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_type TEXT NOT NULL,
    model TEXT,
    latency_ms INTEGER,
    success INTEGER DEFAULT 1,
    error_message TEXT,
    tokens_used INTEGER DEFAULT 0,
    group_id INTEGER,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS knowledge_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    content_type TEXT,
    chunk_text TEXT NOT NULL,
    chunk_index INTEGER DEFAULT 0,
    embedding TEXT,
    uploaded_by INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (group_id) REFERENCES groups(id)
  );
`;

// Columns added after the original schema shipped. Wrapped individually so a
// re-run on an already-migrated DB is a no-op.
const MIGRATIONS = [
  "ALTER TABLE forum_questions ADD COLUMN topic TEXT",
  "ALTER TABLE forum_questions ADD COLUMN confidence_score REAL",
  "ALTER TABLE forum_questions ADD COLUMN routing_decision TEXT DEFAULT 'normal'",
  "ALTER TABLE forum_questions ADD COLUMN duplicate_of INTEGER",
  "ALTER TABLE forum_questions ADD COLUMN escalation_reason TEXT",
  "ALTER TABLE forum_questions ADD COLUMN rag_sources TEXT",
  "ALTER TABLE knowledge_documents ADD COLUMN embedding TEXT",
];

/**
 * Open (creating if needed) the SQLite database, apply schema + migrations,
 * and return the better-sqlite3 instance.
 * @param {string} [dbPath] absolute path; defaults to DB_PATH env or ./diya.db
 */
function createDb(dbPath) {
  const file = dbPath || process.env.DB_PATH || path.join(__dirname, 'diya.db');
  const db = new Database(file);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA);
  for (const stmt of MIGRATIONS) {
    try { db.exec(stmt); } catch { /* column already exists */ }
  }
  return db;
}

module.exports = { createDb, SCHEMA, MIGRATIONS };
