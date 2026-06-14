'use strict';

/**
 * AI Guard — defense-in-depth cost controls for LLM calls.
 *
 * This is NOT a replacement for setting a hard spend limit in the Anthropic
 * Console — it is a second layer so a public demo can never quietly drain
 * credits. Every decision and every call is recorded in `ai_usage_events`, and
 * daily/monthly spend + per-user/per-IP call counts are computed from that
 * ledger (no separate mutable counter to drift out of sync).
 *
 * All thresholds are read from env at call time so they can be tuned per-deploy
 * (and overridden in tests). If a threshold is unset we fall back to the
 * conservative defaults below — i.e. forgetting to configure them fails *safe*
 * (caps still apply), and AI is OFF unless explicitly enabled.
 */

// Conservative defaults. Pricing is intentionally an over-estimate of Anthropic
// Haiku-class list prices so the budget trips early rather than late.
const DEFAULTS = {
  AI_ENABLED: false,
  AI_PUBLIC_DEMO_MODE: true,
  AI_DAILY_BUDGET_USD: 0.5,
  AI_MONTHLY_BUDGET_USD: 5.0,
  AI_MAX_CALLS_PER_USER_PER_DAY: 10,
  AI_MAX_CALLS_PER_IP_PER_DAY: 20,
  AI_MAX_SELF_CHECKS_PER_USER_PER_DAY: 3,
  AI_MAX_ANALYSIS_CALLS_PER_USER_PER_DAY: 5,
  // USD per 1,000,000 tokens (conservative defaults; override per-deploy).
  AI_INPUT_PRICE_PER_MILLION: 1.0,
  AI_OUTPUT_PRICE_PER_MILLION: 5.0,
};

const num = (key) => {
  const v = process.env[key];
  const n = v === undefined || v === '' ? NaN : Number(v);
  return Number.isFinite(n) ? n : DEFAULTS[key];
};
const bool = (key) => {
  const v = process.env[key];
  if (v === undefined || v === '') return DEFAULTS[key];
  return String(v).toLowerCase() === 'true';
};

function config() {
  return {
    aiEnabled: bool('AI_ENABLED'),
    publicDemoMode: bool('AI_PUBLIC_DEMO_MODE'),
    hasApiKey: !!process.env.ANTHROPIC_API_KEY,
    dailyBudget: num('AI_DAILY_BUDGET_USD'),
    monthlyBudget: num('AI_MONTHLY_BUDGET_USD'),
    maxCallsUserDay: num('AI_MAX_CALLS_PER_USER_PER_DAY'),
    maxCallsIpDay: num('AI_MAX_CALLS_PER_IP_PER_DAY'),
    maxSelfChecksUserDay: num('AI_MAX_SELF_CHECKS_PER_USER_PER_DAY'),
    maxAnalysisUserDay: num('AI_MAX_ANALYSIS_CALLS_PER_USER_PER_DAY'),
    inputPrice: num('AI_INPUT_PRICE_PER_MILLION'),
    outputPrice: num('AI_OUTPUT_PRICE_PER_MILLION'),
  };
}

// Human-readable, demo-safe messages for each block reason.
const REASON_MESSAGE = {
  ai_disabled: 'Live AI is disabled for this deployment. Seeded workflow data is fully available.',
  no_api_key: 'AI is not configured on this server. Seeded workflow data is fully available.',
  daily_budget_exceeded: 'Live AI is paused for today to protect this public demo’s usage budget. Please try again tomorrow.',
  monthly_budget_exceeded: 'Live AI is paused for this month to protect this public demo’s usage budget.',
  user_daily_cap: 'You’ve reached today’s AI request limit for this demo account. Seeded data is still available.',
  ip_daily_cap: 'This network has reached today’s AI request limit for the demo.',
  selfcheck_cap: 'You’ve reached today’s Self-Check limit for this demo account.',
  analysis_cap: 'You’ve reached today’s Analytics limit for this demo account.',
};

function messageFor(reason, cfg = config()) {
  const base = REASON_MESSAGE[reason] || 'Live AI is temporarily unavailable.';
  return cfg.publicDemoMode
    ? `Public demo mode: live LLM calls are limited/disabled to protect API usage. ${base}`
    : base;
}

// ── Spend / count queries (computed from the ledger) ─────────────────────────
function spendToday(db) {
  return db.prepare(
    "SELECT COALESCE(SUM(estimated_cost_usd),0) AS s FROM ai_usage_events WHERE success = 1 AND date(created_at) = date('now')"
  ).get().s;
}
function spendThisMonth(db) {
  return db.prepare(
    "SELECT COALESCE(SUM(estimated_cost_usd),0) AS s FROM ai_usage_events WHERE success = 1 AND strftime('%Y-%m', created_at) = strftime('%Y-%m','now')"
  ).get().s;
}
function userCallsToday(db, userId, requestType) {
  if (userId == null) return 0;
  const extra = requestType ? ' AND request_type = ?' : '';
  const args = requestType ? [userId, requestType] : [userId];
  return db.prepare(
    `SELECT COUNT(*) AS c FROM ai_usage_events WHERE success = 1 AND user_id = ? AND date(created_at) = date('now')${extra}`
  ).get(...args).c;
}
function ipCallsToday(db, ip) {
  if (!ip) return 0;
  return db.prepare(
    "SELECT COUNT(*) AS c FROM ai_usage_events WHERE success = 1 AND ip_address = ? AND date(created_at) = date('now')"
  ).get(ip).c;
}

/**
 * Decide whether an LLM call may proceed.
 * @returns {{allowed:boolean, reason?:string, message?:string, publicDemoMode:boolean}}
 */
function canUseAI({ db, userId = null, ip = null, route = null, requestType = null }) {
  const cfg = config();
  const deny = (reason) => ({ allowed: false, reason, message: messageFor(reason, cfg), publicDemoMode: cfg.publicDemoMode });

  if (!cfg.aiEnabled) return deny('ai_disabled');
  if (!cfg.hasApiKey) return deny('no_api_key');
  if (spendToday(db) >= cfg.dailyBudget) return deny('daily_budget_exceeded');
  if (spendThisMonth(db) >= cfg.monthlyBudget) return deny('monthly_budget_exceeded');
  if (userId != null && userCallsToday(db, userId) >= cfg.maxCallsUserDay) return deny('user_daily_cap');
  if (ip && ipCallsToday(db, ip) >= cfg.maxCallsIpDay) return deny('ip_daily_cap');
  if (requestType === 'selfCheck' && userId != null && userCallsToday(db, userId, 'selfCheck') >= cfg.maxSelfChecksUserDay) return deny('selfcheck_cap');
  if (requestType === 'analysis' && userId != null && userCallsToday(db, userId, 'analysis') >= cfg.maxAnalysisUserDay) return deny('analysis_cap');

  return { allowed: true, publicDemoMode: cfg.publicDemoMode };
}

function estimateCostUsd({ inputTokens = 0, outputTokens = 0 } = {}) {
  const cfg = config();
  return (inputTokens / 1e6) * cfg.inputPrice + (outputTokens / 1e6) * cfg.outputPrice;
}

function recordAIUsage({ db, userId = null, ip = null, route = null, requestType = null, model = null, inputTokens = 0, outputTokens = 0, estimatedCostUsd = 0, success = true, blockedReason = null }) {
  try {
    db.prepare(`
      INSERT INTO ai_usage_events
        (user_id, ip_address, route, request_type, model, input_tokens, output_tokens, estimated_cost_usd, success, blocked_reason)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, ip, route, requestType, model, inputTokens, outputTokens, estimatedCostUsd, success ? 1 : 0, blockedReason);
  } catch { /* non-fatal: never let accounting break a request */ }
}

function getAIUsageSummary(db) {
  const cfg = config();
  const today = spendToday(db);
  const month = spendThisMonth(db);
  const callsToday = db.prepare("SELECT COUNT(*) AS c FROM ai_usage_events WHERE success = 1 AND date(created_at) = date('now')").get().c;
  const blockedToday = db.prepare("SELECT COUNT(*) AS c FROM ai_usage_events WHERE success = 0 AND date(created_at) = date('now')").get().c;
  const byType = db.prepare(`
    SELECT request_type,
           SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) AS calls,
           SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) AS blocked,
           COALESCE(SUM(estimated_cost_usd),0) AS cost
    FROM ai_usage_events
    WHERE date(created_at) = date('now')
    GROUP BY request_type ORDER BY cost DESC
  `).all();
  return {
    aiEnabled: cfg.aiEnabled && cfg.hasApiKey,
    publicDemoMode: cfg.publicDemoMode,
    todayCalls: callsToday,
    todaySpendUsd: round(today),
    monthlySpendUsd: round(month),
    blockedToday,
    dailyBudgetUsd: cfg.dailyBudget,
    monthlyBudgetUsd: cfg.monthlyBudget,
    remainingDailyUsd: round(Math.max(0, cfg.dailyBudget - today)),
    remainingMonthlyUsd: round(Math.max(0, cfg.monthlyBudget - month)),
    callsByType: byType.map(r => ({ ...r, cost: round(r.cost) })),
  };
}

const round = (n) => Math.round((n + Number.EPSILON) * 1e6) / 1e6;

module.exports = {
  config,
  canUseAI,
  estimateCostUsd,
  recordAIUsage,
  getAIUsageSummary,
  messageFor,
  REASON_MESSAGE,
};
