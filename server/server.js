require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');
const path = require('path');
const multer = require('multer');
const workflow = require('./services/ai-workflow');
const rag = require('./services/rag');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'diya-dev-secret';

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: /^http:\/\/localhost:\d+$/, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// ─── Database ─────────────────────────────────────────────────────────────────
const db = new Database(path.join(__dirname, 'diya.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
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
`);

// Migrate: add missing columns to existing tables
try { db.exec("ALTER TABLE forum_questions ADD COLUMN topic TEXT"); } catch {}
try { db.exec("ALTER TABLE forum_questions ADD COLUMN confidence_score REAL"); } catch {}
try { db.exec("ALTER TABLE forum_questions ADD COLUMN routing_decision TEXT DEFAULT 'normal'"); } catch {}
try { db.exec("ALTER TABLE forum_questions ADD COLUMN duplicate_of INTEGER"); } catch {}
try { db.exec("ALTER TABLE forum_questions ADD COLUMN escalation_reason TEXT"); } catch {}
try { db.exec("ALTER TABLE forum_questions ADD COLUMN rag_sources TEXT"); } catch {}
try { db.exec("ALTER TABLE knowledge_documents ADD COLUMN embedding TEXT"); } catch {}

// ─── Notification helper ──────────────────────────────────────────────────────
function notify(userId, type, title, message, link = null) {
  try {
    db.prepare('INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)').run(userId, type, title, message, link);
  } catch { /* ignore */ }
}

// ─── Init workflow service ────────────────────────────────────────────────────
workflow.init(db, process.env.ANTHROPIC_API_KEY);

// ─── Auth Middleware ──────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token provided' });
  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

// ─── AUTH ROUTES ──────────────────────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) return res.status(400).json({ error: 'All fields required' });
  if (!['student', 'professor'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  try {
    const hash = await bcrypt.hash(password, 12);
    const result = db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)').run(name, email.toLowerCase(), hash, role);
    const token = jwt.sign({ id: result.lastInsertRowid, email, role, name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: result.lastInsertRowid, name, email, role } });
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'Email already in use' });
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, bio: user.bio } });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, name, email, role, avatar, bio, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

app.patch('/api/auth/profile', requireAuth, (req, res) => {
  const { name, bio, avatar } = req.body;
  db.prepare('UPDATE users SET name = COALESCE(?, name), bio = COALESCE(?, bio), avatar = COALESCE(?, avatar) WHERE id = ?')
    .run(name ?? null, bio ?? null, avatar ?? null, req.user.id);
  res.json(db.prepare('SELECT id, name, email, role, avatar, bio FROM users WHERE id = ?').get(req.user.id));
});

// ─── GROUPS ROUTES ────────────────────────────────────────────────────────────
app.get('/api/groups', requireAuth, (req, res) => {
  let groups;
  if (req.user.role === 'professor') {
    groups = db.prepare(`SELECT g.*, u.name as professor_name, (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count FROM groups g JOIN users u ON g.professor_id = u.id WHERE g.professor_id = ?`).all(req.user.id);
  } else {
    groups = db.prepare(`SELECT g.*, u.name as professor_name, (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count FROM groups g JOIN group_members gm ON g.id = gm.group_id JOIN users u ON g.professor_id = u.id WHERE gm.user_id = ?`).all(req.user.id);
  }
  res.json(groups);
});

app.post('/api/groups', requireAuth, requireRole('professor'), (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const code = Math.random().toString(36).slice(2, 8).toUpperCase();
  const result = db.prepare('INSERT INTO groups (name, code, description, professor_id) VALUES (?, ?, ?, ?)').run(name, code, description || '', req.user.id);
  res.json(db.prepare('SELECT * FROM groups WHERE id = ?').get(result.lastInsertRowid));
});

app.get('/api/groups/:id', requireAuth, (req, res) => {
  const group = db.prepare(`SELECT g.*, u.name as professor_name, (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count FROM groups g JOIN users u ON g.professor_id = u.id WHERE g.id = ?`).get(req.params.id);
  if (!group) return res.status(404).json({ error: 'Group not found' });
  res.json(group);
});

app.get('/api/groups/by-name/:name', requireAuth, (req, res) => {
  const group = db.prepare(`SELECT g.*, u.name as professor_name FROM groups g JOIN users u ON g.professor_id = u.id WHERE g.name = ?`).get(decodeURIComponent(req.params.name));
  if (!group) return res.status(404).json({ error: 'Group not found' });
  res.json(group);
});

app.post('/api/groups/join', requireAuth, requireRole('student'), (req, res) => {
  const { code } = req.body;
  const group = db.prepare('SELECT * FROM groups WHERE code = ?').get(code?.toUpperCase());
  if (!group) return res.status(404).json({ error: 'Invalid group code' });
  try {
    db.prepare('INSERT INTO group_members (user_id, group_id) VALUES (?, ?)').run(req.user.id, group.id);
    res.json({ message: 'Joined successfully', group });
  } catch {
    res.status(409).json({ error: 'Already a member' });
  }
});

app.get('/api/groups/:id/members', requireAuth, (req, res) => {
  res.json(db.prepare(`SELECT u.id, u.name, u.email, u.avatar, gm.joined_at FROM group_members gm JOIN users u ON gm.user_id = u.id WHERE gm.group_id = ?`).all(req.params.id));
});

// ─── FORUM ROUTES ─────────────────────────────────────────────────────────────
app.get('/api/groups/:groupId/forum', requireAuth, (req, res) => {
  const questions = db.prepare(`
    SELECT q.*, u.name as author_name,
      (SELECT COUNT(*) FROM forum_replies WHERE question_id = q.id) as reply_count
    FROM forum_questions q JOIN users u ON q.user_id = u.id
    WHERE q.group_id = ? ORDER BY q.created_at DESC
  `).all(req.params.groupId);
  res.json(questions);
});

app.post('/api/groups/:groupId/forum', requireAuth, async (req, res) => {
  const { title, body, tags } = req.body;
  if (!title || !body) return res.status(400).json({ error: 'Title and body required' });

  const result = db.prepare(
    'INSERT INTO forum_questions (group_id, user_id, title, body, tags) VALUES (?, ?, ?, ?, ?)'
  ).run(req.params.groupId, req.user.id, title, body, tags || '');

  const question = db.prepare('SELECT q.*, u.name as author_name FROM forum_questions q JOIN users u ON q.user_id = u.id WHERE q.id = ?').get(result.lastInsertRowid);
  res.json(question);

  // Notify professor of new question
  const grp = db.prepare('SELECT professor_id, name FROM groups WHERE id = ?').get(req.params.groupId);
  if (grp && grp.professor_id !== req.user.id) notify(grp.professor_id, 'new_question', 'New question in your class', `${req.user.name}: "${title.slice(0, 70)}"`, `/forum/${encodeURIComponent(grp.name)}`);

  // Run workflow engine async (don't block response)
  workflow.routeQuestion(result.lastInsertRowid, req.params.groupId, title, body).catch(console.error);
});

app.get('/api/forum/question/:id', requireAuth, (req, res) => {
  const question = db.prepare(`SELECT q.*, u.name as author_name FROM forum_questions q JOIN users u ON q.user_id = u.id WHERE q.id = ?`).get(req.params.id);
  if (!question) return res.status(404).json({ error: 'Question not found' });
  const replies = db.prepare(`SELECT r.*, u.name as author_name, u.role as author_role FROM forum_replies r JOIN users u ON r.user_id = u.id WHERE r.question_id = ? ORDER BY r.created_at ASC`).all(req.params.id);
  res.json({ ...question, replies });
});

app.post('/api/forum/question/:id/reply', requireAuth, (req, res) => {
  const { body } = req.body;
  if (!body) return res.status(400).json({ error: 'Reply body required' });
  const result = db.prepare('INSERT INTO forum_replies (question_id, user_id, body) VALUES (?, ?, ?)').run(req.params.id, req.user.id, body);
  const newReply = db.prepare(`SELECT r.*, u.name as author_name, u.role as author_role FROM forum_replies r JOIN users u ON r.user_id = u.id WHERE r.id = ?`).get(result.lastInsertRowid);
  res.json(newReply);
  // Notify question author if someone else replied
  const q2 = db.prepare('SELECT user_id, title, group_id FROM forum_questions WHERE id = ?').get(req.params.id);
  if (q2 && q2.user_id !== req.user.id) {
    const sender = req.user.role === 'professor' ? `Prof. ${req.user.name.split(' ').pop()}` : req.user.name;
    notify(q2.user_id, 'reply', `${sender} replied to your question`, `"${q2.title.slice(0, 70)}"`, `/groups/${q2.group_id}/forum/${req.params.id}`);
  }
});

app.patch('/api/forum/question/:id/ai-status', requireAuth, requireRole('professor'), (req, res) => {
  const { status } = req.body;
  if (!['verified', 'rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  db.prepare('UPDATE forum_questions SET ai_status = ? WHERE id = ?').run(status, req.params.id);

  // If verified, offer as approved answer
  if (status === 'verified') {
    const q = db.prepare('SELECT * FROM forum_questions WHERE id = ?').get(req.params.id);
    if (q?.ai_answer) {
      try {
        db.prepare(`INSERT OR REPLACE INTO approved_answers (group_id, source_question_id, topic, question_pattern, answer, created_by)
                    VALUES (?, ?, ?, ?, ?, ?)`).run(q.group_id, q.id, q.topic, q.title, q.ai_answer, req.user.id);
      } catch { /* ignore dup */ }
    }
  }

  // Update workflow item
  if (status === 'verified' || status === 'rejected') {
    db.prepare(`UPDATE workflow_items SET status = 'resolved', resolved_by = ?, resolved_at = datetime('now') WHERE question_id = ?`).run(req.user.id, req.params.id);
  }
  // Notify question author
  const qn = db.prepare('SELECT user_id, title, group_id FROM forum_questions WHERE id = ?').get(req.params.id);
  if (qn) {
    if (status === 'verified') notify(qn.user_id, 'verified', 'Your question got a verified answer!', `"${qn.title.slice(0, 70)}"`, `/groups/${qn.group_id}/forum/${req.params.id}`);
    else notify(qn.user_id, 'rejected', 'Professor reviewed your question', `"${qn.title.slice(0, 70)}" — the AI answer was updated.`, `/groups/${qn.group_id}/forum/${req.params.id}`);
  }
  res.json({ success: true });
});

// ─── OFFICE HOURS ROUTES ──────────────────────────────────────────────────────
app.get('/api/groups/:groupId/requests', requireAuth, (req, res) => {
  if (req.user.role === 'professor') {
    res.json(db.prepare(`SELECT r.*, u.name as student_name, u.email as student_email FROM office_hour_requests r JOIN users u ON r.student_id = u.id WHERE r.group_id = ? ORDER BY r.created_at DESC`).all(req.params.groupId));
  } else {
    res.json(db.prepare(`SELECT r.*, u.name as student_name FROM office_hour_requests r JOIN users u ON r.student_id = u.id WHERE r.group_id = ? AND r.student_id = ? ORDER BY r.created_at DESC`).all(req.params.groupId, req.user.id));
  }
});

app.post('/api/groups/:groupId/requests', requireAuth, requireRole('student'), (req, res) => {
  const { subject, description, preferred_time } = req.body;
  if (!subject) return res.status(400).json({ error: 'Subject required' });
  const result = db.prepare('INSERT INTO office_hour_requests (group_id, student_id, subject, description, preferred_time) VALUES (?, ?, ?, ?, ?)').run(req.params.groupId, req.user.id, subject, description || '', preferred_time || '');
  const newReq = db.prepare(`SELECT r.*, u.name as student_name FROM office_hour_requests r JOIN users u ON r.student_id = u.id WHERE r.id = ?`).get(result.lastInsertRowid);
  res.json(newReq);
  // Notify professor
  const grp2 = db.prepare('SELECT professor_id, name FROM groups WHERE id = ?').get(req.params.groupId);
  if (grp2) notify(grp2.professor_id, 'oh_request', 'New office hours request', `${req.user.name} wants to meet — "${subject.slice(0, 60)}"`, `/requests/${encodeURIComponent(grp2.name)}`);
});

app.patch('/api/requests/:id', requireAuth, requireRole('professor'), (req, res) => {
  const { status, scheduled_at } = req.body;
  if (!['approved', 'rejected', 'completed'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  db.prepare('UPDATE office_hour_requests SET status = ?, scheduled_at = COALESCE(?, scheduled_at) WHERE id = ?').run(status, scheduled_at ?? null, req.params.id);
  res.json({ success: true });
  // Notify student
  const ohr = db.prepare('SELECT student_id, subject, group_id FROM office_hour_requests WHERE id = ?').get(req.params.id);
  if (ohr) {
    const grp3 = db.prepare('SELECT name FROM groups WHERE id = ?').get(ohr.group_id);
    const link = grp3 ? `/requests-student` : null;
    if (status === 'approved') notify(ohr.student_id, 'oh_approved', 'Office hours request approved!', `Your request "${ohr.subject.slice(0, 60)}" has been approved.`, link);
    else if (status === 'rejected') notify(ohr.student_id, 'oh_rejected', 'Office hours request update', `Your request "${ohr.subject.slice(0, 60)}" could not be scheduled.`, link);
    else if (status === 'completed') notify(ohr.student_id, 'oh_completed', 'Office hours session completed', `Your meeting "${ohr.subject.slice(0, 60)}" has been marked complete.`, link);
  }
});

// ─── AI SELF-CHECK ROUTE ──────────────────────────────────────────────────────
app.post('/api/ai/self-check', requireAuth, requireRole('student'), async (req, res) => {
  const { assignment_name, rubric_name, rubric_text, work_text } = req.body;
  if (!rubric_text || !work_text) return res.status(400).json({ error: 'Rubric and work text required' });

  const Anthropic = require('@anthropic-ai/sdk');
  const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null;
  if (!anthropic) return res.status(503).json({ error: 'AI service not configured. Set ANTHROPIC_API_KEY in server/.env' });

  const start = Date.now();
  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1100,
      messages: [{ role: 'user', content: `You are an academic grading assistant. Analyze the student's work against the rubric and provide detailed feedback.

RUBRIC:\n${rubric_text.slice(0, 4000)}

STUDENT'S WORK:\n${work_text.slice(0, 6000)}

Return ONLY valid JSON:
{"letter_grade":"B+","score":"87/100","summary":"One sentence overall assessment","strengths":["Strength 1","Strength 2"],"improvements":[{"section":"Section","suggestion":"Specific suggestion"}]}` }],
    });

    workflow.logMetric('selfCheck', 'claude-haiku-4-5-20251001', Date.now() - start, true, null, message.usage?.input_tokens + message.usage?.output_tokens);

    let analysis;
    try {
      const text = message.content[0].text.trim();
      analysis = JSON.parse(text.startsWith('{') ? text : text.slice(text.indexOf('{')));
    } catch {
      analysis = { letter_grade: 'N/A', score: 'N/A', summary: message.content[0].text, strengths: [], improvements: [{ section: 'General', suggestion: message.content[0].text }] };
    }

    const result = db.prepare('INSERT INTO self_check_reports (user_id, assignment_name, rubric_name, letter_grade, score_text, improvements_json, raw_analysis) VALUES (?, ?, ?, ?, ?, ?, ?)').run(req.user.id, assignment_name || 'Assignment', rubric_name || 'Rubric', analysis.letter_grade, analysis.score, JSON.stringify(analysis.improvements), JSON.stringify(analysis));
    res.json({ id: result.lastInsertRowid, ...analysis, assignment_name: assignment_name || 'Assignment', rubric_name: rubric_name || 'Rubric' });
  } catch (err) {
    workflow.logMetric('selfCheck', 'claude-haiku-4-5-20251001', Date.now() - start, false, err.message, 0);
    res.status(500).json({ error: 'AI analysis failed: ' + err.message });
  }
});

app.get('/api/self-check/history', requireAuth, (req, res) => {
  const reports = db.prepare('SELECT id, assignment_name, rubric_name, letter_grade, score_text, improvements_json, created_at FROM self_check_reports WHERE user_id = ? ORDER BY created_at DESC LIMIT 20').all(req.user.id);
  res.json(reports.map(r => ({ ...r, improvements: r.improvements_json ? JSON.parse(r.improvements_json) : [] })));
});

// ─── WORKFLOW ROUTES ──────────────────────────────────────────────────────────

// Get escalation queue for professor
app.get('/api/workflow/queue/:groupId', requireAuth, requireRole('professor'), (req, res) => {
  const items = db.prepare(`
    SELECT wi.*, fq.title, fq.body, fq.ai_answer, fq.ai_status, fq.confidence_score, fq.rag_sources,
           u.name as student_name, fq.created_at as question_created_at
    FROM workflow_items wi
    JOIN forum_questions fq ON wi.question_id = fq.id
    JOIN users u ON fq.user_id = u.id
    WHERE wi.group_id = ? AND wi.status = 'escalated'
    ORDER BY wi.created_at DESC LIMIT 50
  `).all(req.params.groupId);
  res.json(items);
});

// Get all workflow items (full history)
app.get('/api/workflow/history/:groupId', requireAuth, requireRole('professor'), (req, res) => {
  const items = db.prepare(`
    SELECT wi.*, fq.title, fq.body, fq.ai_answer, fq.ai_status, fq.confidence_score,
           u.name as student_name
    FROM workflow_items wi
    JOIN forum_questions fq ON wi.question_id = fq.id
    JOIN users u ON fq.user_id = u.id
    WHERE wi.group_id = ?
    ORDER BY wi.created_at DESC LIMIT 100
  `).all(req.params.groupId);
  res.json(items);
});

// Resolve a workflow escalation
app.patch('/api/workflow/item/:id/resolve', requireAuth, requireRole('professor'), (req, res) => {
  const { action, ai_status } = req.body; // action: 'approve' | 'reject' | 'override'
  const item = db.prepare('SELECT * FROM workflow_items WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });

  db.prepare(`UPDATE workflow_items SET status = 'resolved', resolved_by = ?, resolved_at = datetime('now') WHERE id = ?`)
    .run(req.user.id, req.params.id);

  if (ai_status) {
    db.prepare('UPDATE forum_questions SET ai_status = ? WHERE id = ?').run(ai_status, item.question_id);
    if (ai_status === 'verified') {
      const q = db.prepare('SELECT * FROM forum_questions WHERE id = ?').get(item.question_id);
      if (q?.ai_answer) {
        try {
          db.prepare(`INSERT OR REPLACE INTO approved_answers (group_id, source_question_id, topic, question_pattern, answer, created_by) VALUES (?, ?, ?, ?, ?, ?)`)
            .run(item.group_id, item.question_id, q.topic, q.title, q.ai_answer, req.user.id);
        } catch {}
      }
    }
  }

  res.json({ success: true });
});

// Get workflow analytics summary
app.get('/api/workflow/summary/:groupId', requireAuth, (req, res) => {
  const gid = req.params.groupId;
  const cutoff7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const totalQuestions = db.prepare('SELECT COUNT(*) as c FROM forum_questions WHERE group_id = ?').get(gid)?.c || 0;
  const questionsThisWeek = db.prepare('SELECT COUNT(*) as c FROM forum_questions WHERE group_id = ? AND created_at > ?').get(gid, cutoff7d)?.c || 0;
  const escalated = db.prepare("SELECT COUNT(*) as c FROM workflow_items WHERE group_id = ? AND status = 'escalated'").get(gid)?.c || 0;
  const resolved = db.prepare("SELECT COUNT(*) as c FROM workflow_items WHERE group_id = ? AND status = 'resolved'").get(gid)?.c || 0;
  const duplicates = db.prepare("SELECT COUNT(*) as c FROM workflow_items WHERE group_id = ? AND routing_decision = 'duplicate'").get(gid)?.c || 0;
  const verified = db.prepare("SELECT COUNT(*) as c FROM forum_questions WHERE group_id = ? AND ai_status = 'verified'").get(gid)?.c || 0;
  const rejected = db.prepare("SELECT COUNT(*) as c FROM forum_questions WHERE group_id = ? AND ai_status = 'rejected'").get(gid)?.c || 0;
  const totalAI = verified + rejected;
  const acceptanceRate = totalAI > 0 ? Math.round((verified / totalAI) * 100) : null;

  const clusters = db.prepare("SELECT * FROM confusion_clusters WHERE group_id = ? AND status != 'resolved' ORDER BY question_count DESC").all(gid);
  const approvedAnswers = db.prepare('SELECT COUNT(*) as c FROM approved_answers WHERE group_id = ?').get(gid)?.c || 0;
  const avgConfidence = db.prepare('SELECT AVG(confidence_score) as avg FROM forum_questions WHERE group_id = ? AND confidence_score IS NOT NULL').get(gid)?.avg;

  res.json({
    totalQuestions,
    questionsThisWeek,
    escalated,
    resolved,
    duplicates,
    verified,
    rejected,
    acceptanceRate,
    avgConfidence: avgConfidence ? Math.round(avgConfidence * 100) : null,
    activeClusters: clusters.length,
    criticalClusters: clusters.filter(c => c.severity === 'critical').length,
    approvedAnswers,
    clusters,
  });
});

// ─── CONFUSION CLUSTERS ───────────────────────────────────────────────────────
app.get('/api/clusters/:groupId', requireAuth, (req, res) => {
  const clusters = db.prepare("SELECT * FROM confusion_clusters WHERE group_id = ? ORDER BY question_count DESC").all(req.params.groupId);
  res.json(clusters);
});

app.post('/api/clusters/:clusterId/refresh-clusters', requireAuth, requireRole('professor'), async (req, res) => {
  const cluster = db.prepare('SELECT * FROM confusion_clusters WHERE id = ?').get(req.params.clusterId);
  if (!cluster) return res.status(404).json({ error: 'Cluster not found' });
  const rec = await workflow.recommendIntervention(cluster);
  res.json({ recommendation: rec, cluster });
});

app.patch('/api/clusters/:clusterId/status', requireAuth, requireRole('professor'), (req, res) => {
  const { status } = req.body;
  if (!['open', 'intervention_sent', 'resolved'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  db.prepare('UPDATE confusion_clusters SET status = ? WHERE id = ?').run(status, req.params.clusterId);
  res.json({ success: true });
});

// ─── INTERVENTIONS ────────────────────────────────────────────────────────────
app.get('/api/interventions/:groupId', requireAuth, (req, res) => {
  res.json(db.prepare('SELECT * FROM interventions WHERE group_id = ? ORDER BY created_at DESC').all(req.params.groupId));
});

app.post('/api/interventions/:groupId', requireAuth, requireRole('professor'), async (req, res) => {
  const { type, title, content, cluster_id, topic } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Title and content required' });

  const currentCount = topic
    ? db.prepare('SELECT COUNT(*) as c FROM forum_questions WHERE group_id = ? AND topic = ?').get(req.params.groupId, topic)?.c
    : null;

  const result = db.prepare('INSERT INTO interventions (group_id, cluster_id, type, title, content, created_by, outcome_before) VALUES (?, ?, ?, ?, ?, ?, ?)').run(req.params.groupId, cluster_id || null, type || 'announcement', title, content, req.user.id, currentCount);

  if (cluster_id) {
    db.prepare("UPDATE confusion_clusters SET status = 'intervention_sent' WHERE id = ?").run(cluster_id);
  }

  res.json(db.prepare('SELECT * FROM interventions WHERE id = ?').get(result.lastInsertRowid));
});

app.post('/api/interventions/:id/generate-announcement', requireAuth, requireRole('professor'), async (req, res) => {
  const { topic, insights } = req.body;
  if (!topic) return res.status(400).json({ error: 'Topic required' });
  const text = await workflow.generateProfessorAnnouncement(topic, insights || `Students have been asking many questions about ${topic}.`);
  res.json({ announcement: text });
});

app.patch('/api/interventions/:id', requireAuth, requireRole('professor'), (req, res) => {
  const { status } = req.body;
  if (!['draft', 'sent', 'tracked'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  db.prepare('UPDATE interventions SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ success: true });
});

// ─── APPROVED ANSWERS ─────────────────────────────────────────────────────────
app.get('/api/approved-answers/:groupId', requireAuth, (req, res) => {
  res.json(db.prepare('SELECT aa.*, u.name as created_by_name FROM approved_answers aa JOIN users u ON aa.created_by = u.id WHERE aa.group_id = ? ORDER BY aa.usage_count DESC').all(req.params.groupId));
});

app.post('/api/approved-answers/:groupId', requireAuth, requireRole('professor'), (req, res) => {
  const { question_pattern, answer, topic, source_question_id } = req.body;
  if (!question_pattern || !answer) return res.status(400).json({ error: 'Pattern and answer required' });
  const result = db.prepare('INSERT INTO approved_answers (group_id, source_question_id, topic, question_pattern, answer, created_by) VALUES (?, ?, ?, ?, ?, ?)').run(req.params.groupId, source_question_id || null, topic || null, question_pattern, answer, req.user.id);
  res.json(db.prepare('SELECT * FROM approved_answers WHERE id = ?').get(result.lastInsertRowid));
});

// ─── AI ANALYSIS ──────────────────────────────────────────────────────────────
app.get('/api/ai/analysis/:groupId', requireAuth, async (req, res) => {
  const questions = db.prepare('SELECT q.title, q.body, q.tags, q.created_at FROM forum_questions q WHERE q.group_id = ? ORDER BY q.created_at DESC LIMIT 50').all(req.params.groupId);
  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ error: 'AI service not configured' });
  if (questions.length === 0) return res.json({ topics: [], insights: [], total_questions: 0 });

  const Anthropic = require('@anthropic-ai/sdk');
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  try {
    const qText = questions.map((q, i) => `${i + 1}. "${q.title}": ${q.body.slice(0, 200)}`).join('\n');
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1200,
      messages: [{ role: 'user', content: `Analyze these student questions and identify confusion clusters. Return only JSON:\n{"topics":[{"id":"slug","name":"Topic","count":5,"trend":"rising","status":"needs-attention","insight":"...","recommendation":"..."}],"overall_summary":"..."}\n\nRules: trend: rising/steady/declining, status: needs-attention/proficient, sort by count, 4-7 topics.\n\nQUESTIONS:\n${qText}` }],
    });
    const text = message.content[0].text.trim();
    const analysis = JSON.parse(text.startsWith('{') ? text : text.slice(text.indexOf('{')));
    res.json({ ...analysis, total_questions: questions.length });
  } catch (err) {
    res.status(500).json({ error: 'Analysis failed: ' + err.message });
  }
});

// ─── OBSERVABILITY / ADMIN ────────────────────────────────────────────────────
app.get('/api/admin/metrics', requireAuth, requireRole('professor'), (req, res) => {
  const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const cutoff7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const totalRequests = db.prepare('SELECT COUNT(*) as c FROM ai_metrics').get()?.c || 0;
  const requests24h = db.prepare('SELECT COUNT(*) as c FROM ai_metrics WHERE created_at > ?').get(cutoff24h)?.c || 0;
  const failedRequests = db.prepare("SELECT COUNT(*) as c FROM ai_metrics WHERE success = 0 AND created_at > ?").get(cutoff7d)?.c || 0;
  const avgLatency = db.prepare("SELECT AVG(latency_ms) as avg FROM ai_metrics WHERE success = 1 AND created_at > ? AND latency_ms > 0").get(cutoff7d)?.avg;
  const totalTokens = db.prepare("SELECT SUM(tokens_used) as t FROM ai_metrics WHERE created_at > ?").get(cutoff7d)?.t || 0;

  const requestsByType = db.prepare(`
    SELECT request_type, COUNT(*) as count, AVG(latency_ms) as avg_latency,
           SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as errors
    FROM ai_metrics WHERE created_at > ?
    GROUP BY request_type ORDER BY count DESC
  `).all(cutoff7d);

  const dailyActivity = db.prepare(`
    SELECT DATE(created_at) as date, COUNT(*) as requests,
           SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as errors
    FROM ai_metrics WHERE created_at > ?
    GROUP BY DATE(created_at) ORDER BY date ASC
  `).all(cutoff7d);

  const escalationRate = (() => {
    const total = db.prepare('SELECT COUNT(*) as c FROM workflow_items').get()?.c || 0;
    const escalated = db.prepare("SELECT COUNT(*) as c FROM workflow_items WHERE status = 'escalated'").get()?.c || 0;
    return total > 0 ? Math.round((escalated / total) * 100) : 0;
  })();

  const duplicateRate = (() => {
    const total = db.prepare('SELECT COUNT(*) as c FROM workflow_items').get()?.c || 0;
    const dupes = db.prepare("SELECT COUNT(*) as c FROM workflow_items WHERE routing_decision = 'duplicate'").get()?.c || 0;
    return total > 0 ? Math.round((dupes / total) * 100) : 0;
  })();

  res.json({
    totalRequests,
    requests24h,
    failedRequests,
    avgLatency: avgLatency ? Math.round(avgLatency) : null,
    totalTokens,
    escalationRate,
    duplicateRate,
    requestsByType,
    dailyActivity,
  });
});

app.get('/api/admin/queue-health', requireAuth, requireRole('professor'), (req, res) => {
  const unresolved = db.prepare("SELECT COUNT(*) as c FROM workflow_items WHERE status = 'escalated'").get()?.c || 0;
  const criticalClusters = db.prepare("SELECT COUNT(*) as c FROM confusion_clusters WHERE severity = 'critical' AND status = 'open'").get()?.c || 0;
  const pendingReview = db.prepare("SELECT COUNT(*) as c FROM forum_questions WHERE ai_status = 'pending' AND ai_answer IS NOT NULL").get()?.c || 0;
  const draftInterventions = db.prepare("SELECT COUNT(*) as c FROM interventions WHERE status = 'draft'").get()?.c || 0;
  res.json({ unresolved, criticalClusters, pendingReview, draftInterventions });
});

// ─── RAG / KNOWLEDGE BASE ─────────────────────────────────────────────────────

// Upload document — professor only
app.post('/api/knowledge/:groupId', requireAuth, requireRole('professor'), upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/markdown'];
  if (!allowed.includes(req.file.mimetype) && !req.file.originalname.match(/\.(pdf|docx|txt|md)$/i)) {
    return res.status(400).json({ error: 'Unsupported file type. Upload PDF, DOCX, TXT, or MD.' });
  }

  try {
    const info = await rag.processDocument(
      db,
      req.params.groupId,
      req.file.originalname,
      req.file.buffer,
      req.file.mimetype,
      req.user.id
    );
    res.json({ message: 'Document processed', ...info });
  } catch (err) {
    console.error('[RAG] processDocument error:', err);
    res.status(500).json({ error: 'Failed to process document: ' + err.message });
  }
});

// List uploaded documents for a group (deduplicated by filename)
app.get('/api/knowledge/:groupId', requireAuth, (req, res) => {
  const docs = db.prepare(`
    SELECT filename, COUNT(*) as chunks, MIN(created_at) as uploaded_at, MAX(id) as id
    FROM knowledge_documents
    WHERE group_id = ?
    GROUP BY filename
    ORDER BY uploaded_at DESC
  `).all(req.params.groupId);
  res.json(docs);
});

// Delete all chunks for a document by filename
app.delete('/api/knowledge/:groupId/:filename', requireAuth, requireRole('professor'), (req, res) => {
  const filename = decodeURIComponent(req.params.filename);
  const result = db.prepare('DELETE FROM knowledge_documents WHERE group_id = ? AND filename = ?').run(req.params.groupId, filename);
  res.json({ deleted: result.changes });
});

// ─── HEALTH ───────────────────────────────────────────────────────────────────
// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
app.get('/api/notifications', requireAuth, (req, res) => {
  const items = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 30').all(req.user.id);
  res.json(items);
});

app.patch('/api/notifications/read-all', requireAuth, (req, res) => {
  db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?').run(req.user.id);
  res.json({ success: true });
});

app.patch('/api/notifications/:id/read', requireAuth, (req, res) => {
  db.prepare('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ success: true });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', ai_enabled: !!process.env.ANTHROPIC_API_KEY, db: 'connected', version: '2.1.0-rag' });
});

app.listen(PORT, () => {
  console.log(`D.I.Y.A v2 backend running on http://localhost:${PORT}`);
  console.log(`AI Workflow Engine: ${process.env.ANTHROPIC_API_KEY ? 'ENABLED' : 'DISABLED (set ANTHROPIC_API_KEY)'}`);
});
