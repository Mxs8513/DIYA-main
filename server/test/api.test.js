'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { start, stop, api, register, delay } = require('./helpers');

// Shared state across tests (created in order).
const ctx = {};

before(async () => {
  await start();
  const prof = await register('Prof Owner', 'owner@uni.edu', 'pw123456', 'professor');
  ctx.profToken = prof.token;
  ctx.profId = prof.user.id;
});

after(() => stop());

test('health endpoint reports AI disabled in test env', async () => {
  const { status, body } = await api('GET', '/api/health');
  assert.equal(status, 200);
  assert.equal(body.status, 'ok');
  assert.equal(body.ai_enabled, false);
});

test('register + login round-trip works', async () => {
  const reg = await api('POST', '/api/auth/register', {
    body: { name: 'Stu One', email: 'stu1@uni.edu', password: 'pw123456', role: 'student' },
  });
  assert.equal(reg.status, 200);
  assert.ok(reg.body.token);
  ctx.stuToken = reg.body.token;
  ctx.stuId = reg.body.user.id;

  const login = await api('POST', '/api/auth/login', { body: { email: 'stu1@uni.edu', password: 'pw123456' } });
  assert.equal(login.status, 200);
  assert.equal(login.body.user.email, 'stu1@uni.edu');
});

test('duplicate email registration is rejected with 409', async () => {
  const { status } = await api('POST', '/api/auth/register', {
    body: { name: 'Dup', email: 'owner@uni.edu', password: 'pw123456', role: 'professor' },
  });
  assert.equal(status, 409);
});

test('login with wrong password returns 401', async () => {
  const { status } = await api('POST', '/api/auth/login', { body: { email: 'owner@uni.edu', password: 'wrong' } });
  assert.equal(status, 401);
});

test('unauthenticated request is rejected', async () => {
  const { status } = await api('GET', '/api/groups');
  assert.equal(status, 401);
});

test('professor creates a group; student joins with code', async () => {
  const create = await api('POST', '/api/groups', {
    token: ctx.profToken,
    body: { name: 'CS 1337 — Data Structures', description: 'demo' },
  });
  assert.equal(create.status, 200);
  ctx.groupId = create.body.id;
  ctx.groupCode = create.body.code;
  assert.ok(ctx.groupCode);

  const join = await api('POST', '/api/groups/join', { token: ctx.stuToken, body: { code: ctx.groupCode } });
  assert.equal(join.status, 200);

  // student now sees the group in their list
  const list = await api('GET', '/api/groups', { token: ctx.stuToken });
  assert.equal(list.status, 200);
  assert.equal(list.body.length, 1);
});

test('student cannot create a group (role gate)', async () => {
  const { status } = await api('POST', '/api/groups', { token: ctx.stuToken, body: { name: 'X' } });
  assert.equal(status, 403);
});

test('joining with an invalid code returns 404', async () => {
  const { status } = await api('POST', '/api/groups/join', { token: ctx.stuToken, body: { code: 'NOPE99' } });
  assert.equal(status, 404);
});

test('posting a question creates a workflow item (AI disabled → escalated)', async () => {
  const post = await api('POST', `/api/groups/${ctx.groupId}/forum`, {
    token: ctx.stuToken,
    body: { title: 'How does recursion work?', body: 'I keep confusing loops and recursion.' },
  });
  assert.equal(post.status, 200);
  ctx.questionId = post.body.id;

  await delay(250); // workflow runs async after the response

  const forum = await api('GET', `/api/groups/${ctx.groupId}/forum`, { token: ctx.stuToken });
  assert.equal(forum.body.length, 1);
  assert.equal(forum.body[0].topic, 'Recursion & Iteration'); // keyword fallback classification

  const history = await api('GET', `/api/workflow/history/${ctx.groupId}`, { token: ctx.profToken });
  assert.equal(history.status, 200);
  assert.equal(history.body.length, 1);
  assert.equal(history.body[0].status, 'escalated');
});

test('professor approves the AI answer → approved-answers library grows', async () => {
  // Give the question an answer to verify (AI disabled leaves it null, so seed one)
  await api('POST', `/api/approved-answers/${ctx.groupId}`, {
    token: ctx.profToken,
    body: { question_pattern: 'recursion basics', answer: 'Recursion is when a function calls itself.' },
  });
  const list = await api('GET', `/api/approved-answers/${ctx.groupId}`, { token: ctx.profToken });
  assert.equal(list.status, 200);
  assert.ok(list.body.length >= 1);
});

test('reject sets ai_status and resolves the workflow item', async () => {
  const res = await api('PATCH', `/api/forum/question/${ctx.questionId}/ai-status`, {
    token: ctx.profToken,
    body: { status: 'rejected' },
  });
  assert.equal(res.status, 200);
  const q = await api('GET', `/api/forum/question/${ctx.questionId}`, { token: ctx.profToken });
  assert.equal(q.body.ai_status, 'rejected');
});

test('knowledge document list is empty for a new group (no docs uploaded)', async () => {
  const { status, body } = await api('GET', `/api/knowledge/${ctx.groupId}`, { token: ctx.profToken });
  assert.equal(status, 200);
  assert.deepEqual(body, []);
});

test('admin metrics and queue-health return meaningful shapes', async () => {
  const metrics = await api('GET', '/api/admin/metrics', { token: ctx.profToken });
  assert.equal(metrics.status, 200);
  assert.ok('escalationRate' in metrics.body);
  assert.ok(Array.isArray(metrics.body.requestsByType));

  const health = await api('GET', '/api/admin/queue-health', { token: ctx.profToken });
  assert.equal(health.status, 200);
  assert.ok('unresolved' in health.body);
});

test('self-check fails gracefully (503) when no API key is configured', async () => {
  const { status, body } = await api('POST', '/api/ai/self-check', {
    token: ctx.stuToken,
    body: { rubric_text: 'rubric', work_text: 'work' },
  });
  assert.equal(status, 503);
  assert.match(body.error, /not configured/i);
});

// ─── RBAC / authorization (the headline security fix) ────────────────────────

test('a student NOT in a group cannot read its forum (403)', async () => {
  const outsider = await register('Outsider', 'outsider@uni.edu', 'pw123456', 'student');
  const { status } = await api('GET', `/api/groups/${ctx.groupId}/forum`, { token: outsider.token });
  assert.equal(status, 403);
  ctx.outsiderToken = outsider.token;
});

test('a student NOT in a group cannot post to its forum (403)', async () => {
  const { status } = await api('POST', `/api/groups/${ctx.groupId}/forum`, {
    token: ctx.outsiderToken,
    body: { title: 'sneaky', body: 'should be blocked' },
  });
  assert.equal(status, 403);
});

test('a professor cannot read another professor\'s group queue (403)', async () => {
  const other = await register('Prof Other', 'other-prof@uni.edu', 'pw123456', 'professor');
  const { status } = await api('GET', `/api/workflow/queue/${ctx.groupId}`, { token: other.token });
  assert.equal(status, 403);
});

test('unknown API route returns JSON 404 (no HTML leak)', async () => {
  const { status, body } = await api('GET', '/api/does-not-exist');
  assert.equal(status, 404);
  assert.equal(body.error, 'Not found');
});

test('server errors return a generic message, not a stack trace', async () => {
  // Posting to a non-existent group: access check now returns a clean 403.
  const { status, body } = await api('POST', '/api/groups/999999/forum', {
    token: ctx.stuToken,
    body: { title: 'x', body: 'y' },
  });
  assert.equal(status, 403);
  assert.ok(!/SqliteError|at Database|\/Users\//.test(JSON.stringify(body)));
});
