'use strict';

const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const Database = require('better-sqlite3');
const { SCHEMA } = require('../db');
const guard = require('../services/ai-guard');

// Snapshot/restore the env keys the guard reads, so tests don't leak into each other.
const ENV_KEYS = [
  'AI_ENABLED', 'AI_PUBLIC_DEMO_MODE', 'ANTHROPIC_API_KEY',
  'AI_DAILY_BUDGET_USD', 'AI_MONTHLY_BUDGET_USD',
  'AI_MAX_CALLS_PER_USER_PER_DAY', 'AI_MAX_CALLS_PER_IP_PER_DAY',
  'AI_MAX_SELF_CHECKS_PER_USER_PER_DAY', 'AI_MAX_ANALYSIS_CALLS_PER_USER_PER_DAY',
  'AI_INPUT_PRICE_PER_MILLION', 'AI_OUTPUT_PRICE_PER_MILLION',
];
let saved;

function db() {
  const d = new Database(':memory:');
  d.exec(SCHEMA);
  return d;
}
// Insert a successful usage event "today" with a given cost / user / ip.
function seedEvent(d, { userId = null, ip = null, requestType = 'classifyTopic', cost = 0 } = {}) {
  guard.recordAIUsage({ db: d, userId, ip, route: '/x', requestType, model: 'm', inputTokens: 100, outputTokens: 100, estimatedCostUsd: cost, success: true });
}

// Baseline: AI fully enabled with generous limits — individual tests tighten one knob.
function enableAI() {
  process.env.AI_ENABLED = 'true';
  process.env.ANTHROPIC_API_KEY = 'sk-test';
  process.env.AI_DAILY_BUDGET_USD = '100';
  process.env.AI_MONTHLY_BUDGET_USD = '100';
  process.env.AI_MAX_CALLS_PER_USER_PER_DAY = '1000';
  process.env.AI_MAX_CALLS_PER_IP_PER_DAY = '1000';
  process.env.AI_MAX_SELF_CHECKS_PER_USER_PER_DAY = '1000';
  process.env.AI_MAX_ANALYSIS_CALLS_PER_USER_PER_DAY = '1000';
}

beforeEach(() => { saved = {}; for (const k of ENV_KEYS) saved[k] = process.env[k]; });
afterEach(() => { for (const k of ENV_KEYS) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; } });

test('AI disabled is never allowed (even with a key present)', () => {
  enableAI();
  process.env.AI_ENABLED = 'false';
  const r = guard.canUseAI({ db: db(), userId: 1, ip: 'a' });
  assert.equal(r.allowed, false);
  assert.equal(r.reason, 'ai_disabled');
});

test('missing API key is never allowed', () => {
  enableAI();
  delete process.env.ANTHROPIC_API_KEY;
  const r = guard.canUseAI({ db: db(), userId: 1, ip: 'a' });
  assert.equal(r.allowed, false);
  assert.equal(r.reason, 'no_api_key');
});

test('within all limits → allowed', () => {
  enableAI();
  const r = guard.canUseAI({ db: db(), userId: 1, ip: 'a' });
  assert.equal(r.allowed, true);
});

test('daily budget exceeded blocks the call', () => {
  enableAI();
  process.env.AI_DAILY_BUDGET_USD = '0.10';
  const d = db();
  seedEvent(d, { cost: 0.2 }); // already spent over today's budget
  const r = guard.canUseAI({ db: d, userId: 1, ip: 'a' });
  assert.equal(r.allowed, false);
  assert.equal(r.reason, 'daily_budget_exceeded');
});

test('monthly budget exceeded blocks the call', () => {
  enableAI();
  process.env.AI_DAILY_BUDGET_USD = '100';   // daily not the constraint
  process.env.AI_MONTHLY_BUDGET_USD = '0.10';
  const d = db();
  seedEvent(d, { cost: 0.2 });
  const r = guard.canUseAI({ db: d, userId: 1, ip: 'a' });
  assert.equal(r.allowed, false);
  assert.equal(r.reason, 'monthly_budget_exceeded');
});

test('per-user daily cap blocks the call (and only that user)', () => {
  enableAI();
  process.env.AI_MAX_CALLS_PER_USER_PER_DAY = '2';
  const d = db();
  seedEvent(d, { userId: 7, ip: 'a' });
  seedEvent(d, { userId: 7, ip: 'a' });
  assert.equal(guard.canUseAI({ db: d, userId: 7, ip: 'a' }).reason, 'user_daily_cap');
  assert.equal(guard.canUseAI({ db: d, userId: 8, ip: 'b' }).allowed, true);
});

test('per-IP daily cap blocks the call', () => {
  enableAI();
  process.env.AI_MAX_CALLS_PER_USER_PER_DAY = '1000'; // user cap not the constraint
  process.env.AI_MAX_CALLS_PER_IP_PER_DAY = '2';
  const d = db();
  // distinct users, same IP → trips IP cap, not user cap
  seedEvent(d, { userId: 1, ip: 'shared' });
  seedEvent(d, { userId: 2, ip: 'shared' });
  const r = guard.canUseAI({ db: d, userId: 3, ip: 'shared' });
  assert.equal(r.allowed, false);
  assert.equal(r.reason, 'ip_daily_cap');
});

test('self-check route cap is enforced independently', () => {
  enableAI();
  process.env.AI_MAX_SELF_CHECKS_PER_USER_PER_DAY = '1';
  const d = db();
  seedEvent(d, { userId: 5, ip: 'a', requestType: 'selfCheck' });
  const r = guard.canUseAI({ db: d, userId: 5, ip: 'a', requestType: 'selfCheck' });
  assert.equal(r.allowed, false);
  assert.equal(r.reason, 'selfcheck_cap');
});

test('recordAIUsage writes a ledger row', () => {
  const d = db();
  guard.recordAIUsage({ db: d, userId: 1, ip: 'a', route: '/r', requestType: 'classifyTopic', model: 'm', inputTokens: 10, outputTokens: 20, estimatedCostUsd: 0.001, success: true });
  const row = d.prepare('SELECT * FROM ai_usage_events').get();
  assert.equal(row.user_id, 1);
  assert.equal(row.success, 1);
  assert.equal(row.input_tokens, 10);
});

test('estimateCostUsd uses env pricing', () => {
  process.env.AI_INPUT_PRICE_PER_MILLION = '2';
  process.env.AI_OUTPUT_PRICE_PER_MILLION = '10';
  // 1,000,000 input @ $2/M + 1,000,000 output @ $10/M = $12
  assert.equal(guard.estimateCostUsd({ inputTokens: 1e6, outputTokens: 1e6 }), 12);
});

test('getAIUsageSummary aggregates today/month + blocked + remaining', () => {
  enableAI();
  process.env.AI_DAILY_BUDGET_USD = '1.00';
  process.env.AI_MONTHLY_BUDGET_USD = '5.00';
  const d = db();
  seedEvent(d, { userId: 1, ip: 'a', cost: 0.25 });
  seedEvent(d, { userId: 1, ip: 'a', cost: 0.25 });
  guard.recordAIUsage({ db: d, userId: 1, ip: 'a', requestType: 'selfCheck', model: 'm', success: false, blockedReason: 'user_daily_cap' });

  const s = guard.getAIUsageSummary(d);
  assert.equal(s.aiEnabled, true);
  assert.equal(s.todayCalls, 2);
  assert.equal(s.blockedToday, 1);
  assert.ok(Math.abs(s.todaySpendUsd - 0.5) < 1e-6);
  assert.ok(Math.abs(s.remainingDailyUsd - 0.5) < 1e-6);
  assert.ok(Math.abs(s.remainingMonthlyUsd - 4.5) < 1e-6);
});
