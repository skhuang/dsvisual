#!/usr/bin/env node
// Smoke-test the private-slides Drive integration without browser.
// Reads DRIVE_ACCESS_TOKEN + DRIVE_PRIVATE_SLIDES_FOLDER_ID (env or .env),
// calls the same fetch logic the browser uses, pretty-prints decks.
//
// Get a token via the Google OAuth 2.0 Playground:
//   https://developers.google.com/oauthplayground/
//   Authorize Drive API v3 → drive.readonly → Exchange code for tokens
//   → copy "Access token" value
// Or via gcloud:
//   gcloud auth print-access-token --scopes=https://www.googleapis.com/auth/drive.readonly

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

try {
  const dotenv = await readFile(path.join(projectRoot, '.env'), 'utf8');
  for (const line of dotenv.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^(['"])(.*)\1$/, '$2');
    if (!(key in process.env)) process.env[key] = value;
  }
} catch {}

const accessToken = (process.env.DRIVE_ACCESS_TOKEN || '').trim();
const folderId = (process.env.DRIVE_PRIVATE_SLIDES_FOLDER_ID || '').trim();

if (!accessToken) {
  console.error('❌ DRIVE_ACCESS_TOKEN is not set.');
  console.error('   See script comments for ways to get one.');
  process.exit(1);
}
if (!folderId) {
  console.error('❌ DRIVE_PRIVATE_SLIDES_FOLDER_ID is not set.');
  process.exit(1);
}
if (/^__.+__$/.test(folderId)) {
  console.error(`❌ DRIVE_PRIVATE_SLIDES_FOLDER_ID is a placeholder: ${folderId}`);
  process.exit(1);
}

// Load private-decks.js in a Node-friendly way (it's an IIFE attaching to window).
const fs = await import('node:fs');
const vm = await import('node:vm');
const code = fs.readFileSync(path.join(projectRoot, 'private-decks.js'), 'utf8');
const sandbox = { window: {}, fetch: globalThis.fetch, console, URLSearchParams, encodeURIComponent, Array, Promise, JSON };
vm.createContext(sandbox);
vm.runInContext(code, sandbox);

console.log(`[smoke] Fetching manifest from folder ${folderId.slice(0, 8)}…`);
const decks = await sandbox.window.privateDecksClient.fetchPrivateDecks({ accessToken, folderId });

if (decks.length === 0) {
  console.log('[smoke] No decks returned. Possible causes:');
  console.log('         • The folder is not shared with this Google account.');
  console.log('         • private-decks.json is missing from the folder.');
  console.log('         • The access token lacks the drive.readonly scope.');
  process.exit(0);
}

console.log(`[smoke] Found ${decks.length} deck entr${decks.length === 1 ? 'y' : 'ies'}:`);
for (const d of decks) {
  const icon = d.access === 'ok' ? '✓' : d.access === 'denied' ? '✗' : '!';
  const pad = (s, n) => String(s).padEnd(n).slice(0, n);
  const meta = `EN ${d.en.length}c · ZH ${d.zh.length}c`;
  console.log(`  ${icon} ${pad(d.id, 30)} method=${pad(d.method, 18)} access=${pad(d.access, 7)} ${meta}`);
  if (d.access === 'denied') console.log('     → file(s) missing from folder, or one file unshared');
  else if (d.access === 'error') console.log('     → network error during fetch — retry');
}
console.log('[smoke] Done.');
