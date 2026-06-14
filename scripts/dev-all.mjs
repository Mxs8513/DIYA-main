#!/usr/bin/env node
// Starts the backend (with --watch) and the Vite dev server together, streaming
// both logs, and shuts both down on Ctrl-C. Zero dependencies on purpose so a
// fresh clone needs nothing extra installed.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const procs = [
  { name: 'server', cmd: npm, args: ['--prefix', 'server', 'run', 'dev'] },
  { name: 'web', cmd: npm, args: ['run', 'dev'] },
].map(({ name, cmd, args }) => {
  const child = spawn(cmd, args, { cwd: root, stdio: 'inherit' });
  child.on('exit', (code) => {
    console.log(`\n[dev:all] "${name}" exited (${code}); stopping the other process.`);
    shutdown();
  });
  return child;
});

let shuttingDown = false;
function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const p of procs) { try { p.kill('SIGTERM'); } catch { /* already gone */ } }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
