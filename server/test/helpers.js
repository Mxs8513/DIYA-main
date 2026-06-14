'use strict';

// Boots the real Express app against an isolated temp SQLite DB so tests never
// touch the dev database. Must be required BEFORE ./server.js (it sets DB_PATH).
const os = require('os');
const path = require('path');
const fs = require('fs');

const tmpDb = path.join(os.tmpdir(), `diya-test-${process.pid}-${Date.now()}.db`);
process.env.DB_PATH = tmpDb;
process.env.JWT_SECRET = 'test-secret';
delete process.env.ANTHROPIC_API_KEY; // force AI-disabled, deterministic behavior
delete process.env.NODE_ENV;

const { app } = require('../server');

let server, base;

async function start() {
  if (base) return base;
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      base = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
  return base;
}

function stop() {
  if (server) server.close();
  for (const ext of ['', '-shm', '-wal']) {
    try { fs.unlinkSync(tmpDb + ext); } catch { /* ignore */ }
  }
}

// Tiny fetch wrapper that returns { status, body }.
async function api(method, pathname, { token, body } = {}) {
  const res = await fetch(base + pathname, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { /* no body */ }
  return { status: res.status, body: json };
}

async function register(name, email, password, role) {
  const { body } = await api('POST', '/api/auth/register', { body: { name, email, password, role } });
  return body; // { token, user }
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

module.exports = { start, stop, api, register, delay };
