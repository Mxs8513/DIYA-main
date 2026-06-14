# Deployment Guide

D.I.Y.A is two deployables: a **static frontend** and a **Node API**. They're
separate because the backend uses `better-sqlite3` (a native module needing a
real Node process + a persistent disk) — so it can't run on pure serverless.

---

## ⚠️ Provider safety first (read before enabling live AI)

**For a public portfolio link, run the demo with live AI _disabled_** (`AI_ENABLED=false`).
The app is fully usable in this mode — it falls back to deterministic logic
(keyword topic classification, template answers) and clearly shows "Live AI
disabled" states. Nothing looks broken, and **no Anthropic credits can be spent.**

If you *do* enable live AI on a public URL:

1. **Set a hard spend limit in the [Anthropic Console](https://console.anthropic.com/settings/limits) first.**
   The in-app caps are **defense-in-depth, not a replacement** for a provider-side cap.
2. Set conservative `AI_DAILY_BUDGET_USD` / `AI_MONTHLY_BUDGET_USD` and the per-user/
   per-IP caps (see below). When a budget or cap is hit, the server **stops calling
   Anthropic** and returns a polished "live AI is paused" message.
3. Never put the API key in a frontend env var or commit it — it lives only in the
   backend's environment. `server/.env` is git-ignored.

---

## Quickstart — exact clicks (live AI, capped)

> This repo's `render.yaml` ships the **live-but-capped** config (`AI_ENABLED=true`,
> daily `$0.25` / monthly `$2.00` budgets, per-user/IP caps). To run **keyless / $0**
> instead, set `AI_ENABLED=false` and skip the key step. **Always** also set a hard
> spend cap in the [Anthropic Console](https://console.anthropic.com/settings/limits).

**1. Backend → Render** (≈3 min)
1. [dashboard.render.com](https://dashboard.render.com) → **New +** → **Blueprint** → connect GitHub → pick `Mxs8513/DIYA-main`.
2. Render reads `render.yaml` and shows a `diya-api` web service (free plan, root `server/`, build `npm install`, start `npm run deploy:start`). `JWT_SECRET` auto-generates; the caps are pre-filled.
3. You'll be prompted for the `sync:false` vars: leave `CORS_ORIGIN` blank for now, and **paste your `ANTHROPIC_API_KEY`** (Render stores it encrypted — it is never in git). → **Apply**.
4. Wait for "Live", copy the URL (e.g. `https://diya-api.onrender.com`), and verify `…/api/health` → `{"status":"ok","ai_enabled":true,"public_demo_mode":true,...}`.

   _(Prefer not to use a Blueprint? New + → Web Service → repo → Root Dir `server`, Build `npm install`, Start `npm run deploy:start`, and add the env vars from the table below by hand — including `ANTHROPIC_API_KEY` as a secret.)_

**2. Frontend → Vercel** (≈2 min)
1. [vercel.com/new](https://vercel.com/new) → import `Mxs8513/DIYA-main`. Framework **Vite**, Build `npm run build`, Output `dist` (auto-detected; `vercel.json` confirms it).
2. **Environment Variables** → add `VITE_API_BASE_URL` = `https://diya-api.onrender.com/api` (your Render URL **+ `/api`**).
3. **Deploy**. Copy the URL, e.g. `https://diya-main.vercel.app`.

**3. Close the CORS loop**
1. Render → `diya-api` → **Environment** → set `CORS_ORIGIN` = your exact Vercel URL (e.g. `https://diya-main.vercel.app`, no trailing slash) → **Save** (auto-redeploys).

**4. Smoke test** — open the Vercel URL → **Enter as Professor** → dashboard, Workflow Queue, Admin (the "Live AI Spend & Caps" panel shows `LIVE AI ON` with today's spend vs. the cap) → **Enter as Student** → forum + Self-Check. Post one question to confirm real generation; watch Admin spend tick up and stop at the daily cap.

---

## Backend (Node API)

Recommended hosts: **Render**, **Railway**, or **Fly.io** (anything that runs a
persistent Node process with a writable disk).

### Build / start
```
Install:  cd server && npm install
Start:    node seed.js; node server.js      # seed is idempotent (safe every boot)
```
On Render, add a **Persistent Disk** mounted where `diya.db` lives (or set
`DB_PATH` to the mount path), otherwise the DB — and the demo login accounts —
reset on every restart.

### Environment variables
| Var | Public demo (recommended) | Live AI |
|---|---|---|
| `NODE_ENV` | `production` | `production` |
| `JWT_SECRET` | long random string | long random string |
| `CORS_ORIGIN` | `https://<your-frontend>` | same |
| `ANTHROPIC_API_KEY` | _unset_ | `sk-ant-...` |
| `AI_ENABLED` | `false` | `true` |
| `AI_PUBLIC_DEMO_MODE` | `true` | `true` |
| `AI_DAILY_BUDGET_USD` | `0.50` | your cap |
| `AI_MONTHLY_BUDGET_USD` | `5.00` | your cap |
| `AI_MAX_CALLS_PER_USER_PER_DAY` | `10` | your cap |
| `AI_MAX_CALLS_PER_IP_PER_DAY` | `20` | your cap |
| `AI_MAX_SELF_CHECKS_PER_USER_PER_DAY` | `3` | your cap |
| `AI_MAX_ANALYSIS_CALLS_PER_USER_PER_DAY` | `5` | your cap |
| `AI_INPUT_PRICE_PER_MILLION` | `1.00` | match model price |
| `AI_OUTPUT_PRICE_PER_MILLION` | `5.00` | match model price |

See `server/.env.example` for the annotated list. `JWT_SECRET` is **required** in
production — the server refuses to boot without it.

### What protects your credits (in the code)
- **Master switch** — no Anthropic call happens unless `AI_ENABLED=true` **and** a key is set.
- **Spend caps** — daily + monthly USD budgets, computed from the `ai_usage_events`
  ledger (every call records token counts + estimated cost).
- **Rate caps** — per-user and per-IP daily call limits, plus tighter per-route
  caps for Self-Check and Analytics.
- **HTTP rate limiting** (`express-rate-limit`, behind `trust proxy`): `/api/auth`
  5/10 min, `/api/ai` 20/hr, `/api/knowledge` 10/hr per IP.
- **Live visibility** — the Admin dashboard shows today's spend, monthly spend,
  remaining budget, and blocked calls (`GET /api/admin/ai-usage`).

---

## Frontend (static SPA)

Hosts: **Vercel**, **Netlify**, **Cloudflare Pages**.

```
Build:    npm run build       # outputs dist/
Publish:  dist/
```

Locally the frontend reaches the API through Vite's `/api` dev proxy. In
production there's no proxy, so point the SPA at the deployed API — either set the
API origin in `src/lib/api.ts` (`BASE`) at build time, or serve the SPA and API
behind one domain/reverse proxy so `/api/*` resolves to the backend.

---

## Smoke test after deploy
1. `GET https://<api>/api/health` → `{ "status": "ok", "ai_enabled": <bool>, "public_demo_mode": <bool> }`
2. Open the frontend → **Enter as Professor** / **Enter as Student** (seeded demo logins).
3. If live AI is on: post one forum question, then open Admin → **Live AI Spend & Caps**
   and confirm spend incremented and remaining budget decreased.
