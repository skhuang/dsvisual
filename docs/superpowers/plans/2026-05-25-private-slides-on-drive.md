# Private Course Slides on Google Drive — Implementation Plan (dsvisual)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Firebase Google sign-in + a Google Drive folder source for Marp `.md` private decks to dsvisual, mirroring the user-facing experience already shipped in rdvisual / stvisual but with all code adapted to dsvisual's vanilla CommonJS / single-file app.js architecture.

**Architecture:** Six new vanilla-JS top-level modules (`cloud-config.js`, `cloud-integration.js`, `cloud-drawer.js`, `slide-markdown.js`, `private-decks.js`, plus an IIFE wrapper for each) attach to `window` globals consumed by `app.js`. The existing `#slide-viewer` overlay gains a deck-picker bar when a method has both public + private decks. Firebase SDK is loaded via `<script>` tags in `index.html`. A new `inject-env.mjs` + GitHub Pages deploy workflow is added. Defensive `__…__` placeholder guard + smoke-test script + operator guide are baked in from day one (lessons from rdvisual / stvisual Plan A/B).

**Tech Stack:** Vanilla JS (CommonJS for tests, IIFE for browser globals), Firebase Auth (compat SDK 11.7.1, no Firestore use), Google Drive REST v3, `node --test` for unit, Playwright for e2e.

**Spec:** `docs/superpowers/specs/2026-05-25-private-slides-on-drive-design.md`

**Sibling implementations to consult:** `/Users/skhuang/course/rdvisual/src/framework/{cloudIntegration,privateDecks,slideMarkdown,SlideViewer}.js` — read-only reference for the algorithm/contract; do NOT `cp` blindly (rdvisual is ESM, dsvisual is vanilla — wrapper style differs).

---

## File Structure

**New at repo root** (matching dsvisual's flat layout):
- `cloud-config.js` — Firebase + Drive placeholders, exposes `window.dsvisualCloudConfig`.
- `cloud-integration.js` — Firebase auth wrapper, singleton, exposes `window.cloudClient()` + `window.DRIVE_SCOPES`.
- `cloud-drawer.js` — ☁ button click handler + drawer panel render logic, no exports (registers DOM listeners on load).
- `slide-markdown.js` — Marp markdown parser, exposes `window.slideMarkdown = { parseDeck }`.
- `private-decks.js` — Drive REST fetcher, exposes `window.privateDecksClient = { fetchPrivateDecks, _resetPrivateDecksCache }`.

**New under `scripts/`:**
- `scripts/inject-env.mjs` — replaces `__…__` placeholders in `cloud-config.js` at build time.
- `scripts/smoke-private-decks.mjs` — operator tool to dry-run the Drive fetch.

**New CI:**
- `.github/workflows/deploy-pages.yml` — test + deploy to GitHub Pages.

**New tests:**
- `tests/unit/cloud-integration.test.js`
- `tests/unit/slide-markdown.test.js`
- `tests/unit/private-decks.test.js`
- `tests/cloud-private-slides.spec.js` (Playwright e2e; lives in `tests/` per `playwright.config.js` `testDir: './tests'`)

**New docs:**
- `docs/private-slides.md` — operator guide.
- `docs/private-decks.example.json` — manifest starter template.

**New env:**
- `.env.example` — env-var template for `inject-env`.

**Modify:**
- `index.html` — Firebase SDK `<script>` tags, header ☁ button, cloud-drawer modal DOM, `<script>` tags for the 5 new JS files.
- `app.js` — extend `openSlides()` to build a deck-list (public + optional private) and render a deck-picker when multiple decks; wire the ☁ button to open the cloud drawer.
- `style.css` — `.cloud-toggle`, `.cloud-drawer*`, `.slide-deck-bar`, `.slide-deck-btn*` rules.
- `i18n.js` — add `aria.cloud-toggle`, `cloud.*`, `slide.private.*` keys to both `en` and `zh`.
- `package.json` — add `firebase` dep, add `inject-env` / `pages:prepare` scripts.

**Branch:** `feat/private-slides-on-drive` (already created from `origin/main`; `fix/tree-edges-visible` is preserved untouched).

**Method-ID note:** dsvisual method IDs come from `METHOD_GROUPS` in `app.js` (e.g. `tree-bst`, `graph-dijkstra`, `hash-chain`, `stack-array`). The manifest's `method` field must match one of these exact IDs.

---

### Task 1: cloud-config.js + .env.example + inject-env.mjs

The placeholder-replacement scaffold. Mirrors rdvisual's `inject-env` mechanism. Loads no Firebase yet — that comes in Task 2. After this task, the build pipeline can substitute env vars but nothing reads the config yet.

**Files:**
- Create: `cloud-config.js`, `.env.example`, `scripts/inject-env.mjs`

- [ ] **Step 1: Create `cloud-config.js`** at repo root with EXACTLY:

```js
// Placeholder values are replaced by scripts/inject-env.mjs at build time.
// At runtime, window.dsvisualCloudConfig is consumed by cloud-integration.js
// (Firebase) and app.js (Drive folder ID for private slides).
(function () {
  'use strict';
  const cloudConfig = {
    firebase: {
      apiKey:            '__FIREBASE_API_KEY__',
      authDomain:        '__FIREBASE_AUTH_DOMAIN__',
      projectId:         '__FIREBASE_PROJECT_ID__',
      storageBucket:     '__FIREBASE_STORAGE_BUCKET__',
      messagingSenderId: '__FIREBASE_MESSAGING_SENDER_ID__',
      appId:             '__FIREBASE_APP_ID__',
      measurementId:     '__FIREBASE_MEASUREMENT_ID__',
    },
    drive: {
      privateSlidesFolderId: '__DRIVE_PRIVATE_SLIDES_FOLDER_ID__',
    },
  };
  window.dsvisualCloudConfig = cloudConfig;
})();
```

- [ ] **Step 2: Create `.env.example`** at repo root with EXACTLY:

```
# Copy this file to .env and fill in the real values.
# These values are injected into cloud-config.js at build time by scripts/inject-env.mjs.

FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_PROJECT_ID=
FIREBASE_STORAGE_BUCKET=
FIREBASE_MESSAGING_SENDER_ID=
FIREBASE_APP_ID=
FIREBASE_MEASUREMENT_ID=
# Optional — enables the "🔒 private slides on Drive" feature. Leave empty to disable.
# See docs/private-slides.md for the Drive folder + manifest setup.
DRIVE_PRIVATE_SLIDES_FOLDER_ID=
```

- [ ] **Step 3: Create `scripts/inject-env.mjs`** with EXACTLY:

```js
// Reads environment variables (from process.env or a local .env file)
// and replaces the __PLACEHOLDER__ tokens in cloud-config.js.
//
// Usage:
//   node scripts/inject-env.mjs           # reads .env if present
//   FIREBASE_API_KEY=xxx node scripts/inject-env.mjs

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const configPath = path.join(projectRoot, 'cloud-config.js');

// Load .env file if present (does NOT override existing process.env).
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
} catch {
  // No .env file — rely on process.env (CI secrets).
}

const PLACEHOLDERS = {
  __FIREBASE_API_KEY__:              'FIREBASE_API_KEY',
  __FIREBASE_AUTH_DOMAIN__:          'FIREBASE_AUTH_DOMAIN',
  __FIREBASE_PROJECT_ID__:           'FIREBASE_PROJECT_ID',
  __FIREBASE_STORAGE_BUCKET__:       'FIREBASE_STORAGE_BUCKET',
  __FIREBASE_MESSAGING_SENDER_ID__:  'FIREBASE_MESSAGING_SENDER_ID',
  __FIREBASE_APP_ID__:               'FIREBASE_APP_ID',
  __FIREBASE_MEASUREMENT_ID__:       'FIREBASE_MEASUREMENT_ID',
  __DRIVE_PRIVATE_SLIDES_FOLDER_ID__:'DRIVE_PRIVATE_SLIDES_FOLDER_ID',
};

let source = await readFile(configPath, 'utf8');
let replaced = 0;

for (const [placeholder, envKey] of Object.entries(PLACEHOLDERS)) {
  const value = (process.env[envKey] || '').trim().replace(/[\r\n]+/g, '');
  if (source.includes(placeholder)) {
    source = source.replaceAll(placeholder, value);
    replaced += 1;
    if (!value) {
      console.warn(`  ⚠  ${envKey} is empty — placeholder ${placeholder} replaced with blank.`);
    }
  }
}

await writeFile(configPath, source, 'utf8');
console.log(`inject-env: replaced ${replaced} placeholder(s) in cloud-config.js`);
```

- [ ] **Step 4: Verify**

Run: `node --check cloud-config.js && node --check scripts/inject-env.mjs`
Expected: both silent.

Run: `node scripts/inject-env.mjs`
Expected: prints `inject-env: replaced 8 placeholder(s) in cloud-config.js` with 8 warnings about empty values (because `.env` doesn't exist or `process.env` empty).

Run: `git diff cloud-config.js`
Expected: shows all 8 `__…__` placeholders replaced with empty strings.

Run: `git checkout cloud-config.js`
Expected: file reverted back to placeholders.

- [ ] **Step 5: Commit**

```bash
git add cloud-config.js .env.example scripts/inject-env.mjs
git commit -m "feat(dsvisual): cloud-config scaffold + inject-env script"
```

Commit messages end with a trailing line `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>` — include it (use a HEREDOC).

---

### Task 2: Firebase SDK + cloud-integration.js + unit tests

Load Firebase Auth compat SDK in `index.html`, write the cloud-integration wrapper module with singleton, drive scopes, and `getAccessToken()`. Same algorithm contract as rdvisual's `cloudIntegration.js`. After this task, the app can sign in with Google + grant Drive read access, but no UI surfaces this yet.

**Files:**
- Modify: `index.html`
- Create: `cloud-integration.js`, `tests/unit/cloud-integration.test.js`

- [ ] **Step 1: Write the failing test** — create `tests/unit/cloud-integration.test.js` with EXACTLY:

```js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

// Load cloud-integration.js into a sandboxed window-like context.
function loadIntegration() {
  const code = fs.readFileSync(path.join(__dirname, '../../cloud-integration.js'), 'utf8');
  const sandbox = {
    window: {},
    globalThis: {},
    location: { protocol: 'http:' },
    firebase: undefined, // simulate Firebase SDK not loaded
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox.window;
}

test('cloud-integration: exports both drive.file and drive.readonly in DRIVE_SCOPES', () => {
  const w = loadIntegration();
  assert.ok(Array.isArray(w.DRIVE_SCOPES));
  assert.equal(w.DRIVE_SCOPES.length, 2);
  assert.ok(w.DRIVE_SCOPES.includes('https://www.googleapis.com/auth/drive.file'));
  assert.ok(w.DRIVE_SCOPES.includes('https://www.googleapis.com/auth/drive.readonly'));
});

test('cloud-integration: cloudClient() returns the same instance on repeated calls', () => {
  const w = loadIntegration();
  const a = w.cloudClient();
  const b = w.cloudClient();
  assert.equal(a, b);
});

test('cloud-integration: getAccessToken() returns null in stub mode', () => {
  const w = loadIntegration();
  const c = w.cloudClient();
  assert.equal(typeof c.getAccessToken, 'function');
  assert.equal(c.getAccessToken(), null);
});

test('cloud-integration: getUser() returns null in stub mode', () => {
  const w = loadIntegration();
  const c = w.cloudClient();
  assert.equal(typeof c.getUser, 'function');
  assert.equal(c.getUser(), null);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/unit/cloud-integration.test.js`
Expected: FAIL — `cloud-integration.js` doesn't exist.

- [ ] **Step 3: Create `cloud-integration.js`** at repo root with EXACTLY:

```js
// Firebase Auth wrapper for dsvisual. Singleton — same instance across calls.
// Exposes window.cloudClient() and window.DRIVE_SCOPES.
// When Firebase SDK is not loaded, or origin is file://, or
// dsvisualCloudConfig is missing/incomplete, returns a stub client with no-op
// methods (getUser/getAccessToken → null, sign-in → throws).
(function () {
  'use strict';

  const DRIVE_SCOPES = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.readonly',
  ];

  const REQUIRED_FIREBASE_KEYS = ['apiKey', 'authDomain', 'projectId', 'appId'];

  let cachedClient = null;

  function getMissingKeys(fb) {
    return REQUIRED_FIREBASE_KEYS.filter((k) => !fb || !fb[k] || /^__.+__$/.test(fb[k]));
  }

  function stubClient(errorMessage) {
    const reject = async () => { throw new Error(errorMessage); };
    return {
      isConfigured: false,
      missingReason: errorMessage,
      getUser()        { return null; },
      getAccessToken() { return null; },
      subscribeAuthState(cb) { cb(null); return () => {}; },
      signInWithGoogle: reject,
      signOutGoogle:    reject,
    };
  }

  function buildClient() {
    const config = (typeof window !== 'undefined' && window.dsvisualCloudConfig) || null;
    const fbCfg = config && config.firebase;

    if (typeof window !== 'undefined' && window.location && window.location.protocol === 'file:') {
      return stubClient('Google OAuth requires http:// or https:// — not file://.');
    }
    const missing = getMissingKeys(fbCfg);
    if (missing.length) {
      return stubClient('Firebase config incomplete: missing ' + missing.join(', '));
    }
    const firebase = (typeof window !== 'undefined') ? window.firebase : null;
    if (!firebase || typeof firebase.initializeApp !== 'function') {
      return stubClient('Firebase SDK not loaded.');
    }

    const app = firebase.apps && firebase.apps.length ? firebase.app() : firebase.initializeApp(fbCfg);
    const auth = firebase.auth(app);
    let driveAccessToken = null;

    return {
      isConfigured: true,
      missingReason: '',
      getUser() { return auth.currentUser; },
      getAccessToken() { return driveAccessToken; },
      subscribeAuthState(cb) { return auth.onAuthStateChanged(cb); },
      async signInWithGoogle() {
        const provider = new firebase.auth.GoogleAuthProvider();
        DRIVE_SCOPES.forEach((s) => provider.addScope(s));
        const result = await auth.signInWithPopup(provider);
        const credential = result && result.credential;
        driveAccessToken = (credential && credential.accessToken) || null;
        return { user: result.user, hasDriveToken: Boolean(driveAccessToken) };
      },
      async signOutGoogle() {
        driveAccessToken = null;
        await auth.signOut();
      },
    };
  }

  function cloudClient() {
    if (cachedClient) return cachedClient;
    cachedClient = buildClient();
    return cachedClient;
  }

  window.cloudClient = cloudClient;
  window.DRIVE_SCOPES = DRIVE_SCOPES;
})();
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test tests/unit/cloud-integration.test.js`
Expected: PASS — 4 tests.

- [ ] **Step 5: Add Firebase SDK + cloud-integration.js to `index.html`**

In `index.html`, find the existing `<head>` end (line ~12, just before `</head>`). Add EXACTLY these three Firebase SDK tags right before `</head>`:

```html
    <script src="https://www.gstatic.com/firebasejs/11.7.1/firebase-app-compat.js" defer></script>
    <script src="https://www.gstatic.com/firebasejs/11.7.1/firebase-auth-compat.js" defer></script>
    <script src="https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore-compat.js" defer></script>
```

Then find the existing `<script src="app.js"></script>` (or however app.js is loaded — search with `grep -nE 'app\.js' index.html`). Add EXACTLY these lines IMMEDIATELY BEFORE the app.js script tag (order matters — these must load before app.js so the globals exist):

```html
    <script src="cloud-config.js" defer></script>
    <script src="cloud-integration.js" defer></script>
```

(`defer` ensures execution in document order after parsing; `cloud-config.js` runs first, sets `window.dsvisualCloudConfig`; `cloud-integration.js` runs next, can read it.)

- [ ] **Step 6: Smoke check — page still loads**

Run: `npm test -- --grep 'visualizer'` (run the smallest existing Playwright spec to sanity-check).
Expected: PASS — page boots normally, existing functionality unaffected.

If this fails, the script-tag insertion order is likely wrong; verify Firebase + cloud-config + cloud-integration all load BEFORE app.js.

- [ ] **Step 7: Commit**

```bash
git add cloud-integration.js tests/unit/cloud-integration.test.js index.html
git commit -m "feat(dsvisual): Firebase SDK + cloud-integration singleton with drive scopes"
```

Include the `Co-Authored-By:` trailer.

---

### Task 3: slide-markdown.js (Marp parser) + unit tests

Port rdvisual's `slideMarkdown.js` (244 lines) into dsvisual's vanilla IIFE style. The parser is dependency-free. After this task, Marp `.md` strings can be parsed into `{ slides: [{ html, notes }] }` objects.

**Files:**
- Create: `slide-markdown.js`, `tests/unit/slide-markdown.test.js`
- Reference (read-only): `/Users/skhuang/course/rdvisual/src/framework/slideMarkdown.js`

- [ ] **Step 1: Write the failing test** — create `tests/unit/slide-markdown.test.js` with EXACTLY:

```js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function loadParser() {
  const code = fs.readFileSync(path.join(__dirname, '../../slide-markdown.js'), 'utf8');
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox.window.slideMarkdown;
}

test('slide-markdown: parseDeck splits on --- separators', () => {
  const sm = loadParser();
  const md = '---\nmarp: true\n---\n\n# Slide 1\n\n---\n\n# Slide 2\n\n---\n\n# Slide 3';
  const out = sm.parseDeck(md);
  assert.equal(out.slides.length, 3);
});

test('slide-markdown: strips front matter from first slide', () => {
  const sm = loadParser();
  const md = '---\nmarp: true\ntitle: x\n---\n\n# Hello';
  const out = sm.parseDeck(md);
  assert.equal(out.slides.length, 1);
  assert.ok(out.slides[0].html.includes('Hello'));
  assert.ok(!out.slides[0].html.includes('marp:'));
});

test('slide-markdown: renders heading as h-tag', () => {
  const sm = loadParser();
  const out = sm.parseDeck('# Hello\n\n## Sub');
  const html = out.slides[0].html;
  assert.ok(/<h1[^>]*>Hello<\/h1>/.test(html));
  assert.ok(/<h2[^>]*>Sub<\/h2>/.test(html));
});

test('slide-markdown: bullets become <ul><li>', () => {
  const sm = loadParser();
  const out = sm.parseDeck('- one\n- two');
  assert.ok(out.slides[0].html.includes('<ul>'));
  assert.ok(out.slides[0].html.includes('<li>one</li>'));
  assert.ok(out.slides[0].html.includes('<li>two</li>'));
});

test('slide-markdown: notes block captured separately', () => {
  const sm = loadParser();
  const md = '# Title\n\n<!-- speaker note line -->';
  const out = sm.parseDeck(md);
  assert.equal(out.slides.length, 1);
  assert.ok(out.slides[0].notes.includes('speaker note'));
});

test('slide-markdown: empty input returns empty slide array', () => {
  const sm = loadParser();
  const out = sm.parseDeck('');
  assert.ok(Array.isArray(out.slides));
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/unit/slide-markdown.test.js`
Expected: FAIL — `slide-markdown.js` doesn't exist.

- [ ] **Step 3: Create `slide-markdown.js`** by copying rdvisual's `slideMarkdown.js` and wrapping it

Run:
```bash
cp /Users/skhuang/course/rdvisual/src/framework/slideMarkdown.js slide-markdown.js
```

Then transform the file to vanilla IIFE form. Edit `slide-markdown.js`:

1. At the top (before line 1), prepend:
   ```js
   // Minimal, dependency-free Marp-markdown parser for dsvisual private slides.
   // Ported from rdvisual src/framework/slideMarkdown.js.
   (function () {
     'use strict';

   ```
2. Find the line `export function parseDeck` near the bottom of the file and change to `function parseDeck`.
3. At the very end of the file (after the last `}`), append:
   ```js

     window.slideMarkdown = { parseDeck };
   })();
   ```
4. Find any other `export ` keywords in the file and remove the `export ` prefix (the IIFE encapsulates everything; nothing else needs to be exported).

Verify with: `grep -nE "^export " slide-markdown.js`
Expected: NOTHING (no remaining `export` keywords).

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test tests/unit/slide-markdown.test.js`
Expected: PASS — 6 tests.

If a test fails, inspect rdvisual's `slideMarkdown.js` to ensure the function signature/behavior matches what the tests expect. The rdvisual file's `parseDeck` accepts a markdown string and returns `{ slides: [{ html, notes }] }`. The tests above assume this contract.

- [ ] **Step 5: Add slide-markdown.js to `index.html`**

In `index.html`, find the `<script src="cloud-integration.js" defer></script>` line added in Task 2. Add EXACTLY this line IMMEDIATELY AFTER it (still before app.js):

```html
    <script src="slide-markdown.js" defer></script>
```

- [ ] **Step 6: Commit**

```bash
git add slide-markdown.js tests/unit/slide-markdown.test.js index.html
git commit -m "feat(dsvisual): slide-markdown.js — Marp parser for private decks"
```

Include the `Co-Authored-By:` trailer.

---

### Task 4: private-decks.js + unit tests

Port rdvisual's `privateDecks.js` algorithm into vanilla IIFE. After this task, code can fetch a manifest + decks from a Drive folder using an OAuth access token.

**Files:**
- Create: `private-decks.js`, `tests/unit/private-decks.test.js`

- [ ] **Step 1: Write the failing test** — create `tests/unit/private-decks.test.js` with EXACTLY:

```js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function loadModule(fetchMock) {
  const code = fs.readFileSync(path.join(__dirname, '../../private-decks.js'), 'utf8');
  const sandbox = { window: {}, fetch: fetchMock, console };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox.window.privateDecksClient;
}

const FOLDER = 'FOLDER_ID_123';
const TOKEN = 'TOKEN_ABC';
const MANIFEST_ID = 'MANIFEST_FILE_ID';
const EN_ID = 'EN_FILE_ID';
const ZH_ID = 'ZH_FILE_ID';

const MANIFEST = {
  version: 1,
  decks: [{
    id: 'tree-bst-instructor',
    method: 'tree-bst',
    files: { en: 'tree-bst-instructor.en.md', zh: 'tree-bst-instructor.zh.md' },
    titleEn: 'BST — instructor notes',
    titleZh: 'BST —— 講師補充',
  }],
};
const EN_MD = '---\nmarp: true\n---\n\n# Instructor (EN)';
const ZH_MD = '---\nmarp: true\n---\n\n# 講師 (ZH)';

function makeFetch(responses) {
  let calls = 0;
  const fn = async (url) => {
    calls++;
    const matched = responses.find((r) => url.includes(r.match));
    if (!matched) throw new Error('unmocked fetch: ' + url);
    if (matched.networkError) throw new Error('network down');
    return {
      ok: matched.status === 200,
      status: matched.status,
      async json() { return matched.json; },
      async text() { return matched.text; },
    };
  };
  fn.callCount = () => calls;
  return fn;
}

function happyPath() {
  return [
    { match: "name%3D%27private-decks.json%27", status: 200, json: { files: [{ id: MANIFEST_ID, name: 'private-decks.json' }] } },
    { match: '/files/' + MANIFEST_ID + '?alt=media', status: 200, text: JSON.stringify(MANIFEST) },
    { match: "name%3D%27tree-bst-instructor.en.md%27", status: 200, json: { files: [{ id: EN_ID, name: 'tree-bst-instructor.en.md' }, { id: ZH_ID, name: 'tree-bst-instructor.zh.md' }] } },
    { match: '/files/' + EN_ID + '?alt=media', status: 200, text: EN_MD },
    { match: '/files/' + ZH_ID + '?alt=media', status: 200, text: ZH_MD },
  ];
}

test('private-decks: returns [] when folderId is empty', async () => {
  const m = loadModule(() => { throw new Error('should not fetch'); });
  m._resetPrivateDecksCache();
  const decks = await m.fetchPrivateDecks({ accessToken: TOKEN, folderId: '' });
  assert.deepEqual(decks, []);
});

test('private-decks: returns [] when accessToken is null', async () => {
  const m = loadModule(() => { throw new Error('should not fetch'); });
  m._resetPrivateDecksCache();
  const decks = await m.fetchPrivateDecks({ accessToken: null, folderId: FOLDER });
  assert.deepEqual(decks, []);
});

test('private-decks: returns [] silently on manifest 403', async () => {
  const m = loadModule(makeFetch([{ match: "name%3D%27private-decks.json%27", status: 403, json: {} }]));
  m._resetPrivateDecksCache();
  const decks = await m.fetchPrivateDecks({ accessToken: TOKEN, folderId: FOLDER });
  assert.deepEqual(decks, []);
});

test('private-decks: returns [] silently when manifest file is absent', async () => {
  const m = loadModule(makeFetch([{ match: "name%3D%27private-decks.json%27", status: 200, json: { files: [] } }]));
  m._resetPrivateDecksCache();
  const decks = await m.fetchPrivateDecks({ accessToken: TOKEN, folderId: FOLDER });
  assert.deepEqual(decks, []);
});

test('private-decks: happy path returns one parsed deck', async () => {
  const m = loadModule(makeFetch(happyPath()));
  m._resetPrivateDecksCache();
  const decks = await m.fetchPrivateDecks({ accessToken: TOKEN, folderId: FOLDER });
  assert.equal(decks.length, 1);
  const d = decks[0];
  assert.equal(d.id, 'tree-bst-instructor');
  assert.equal(d.method, 'tree-bst');
  assert.equal(d.titleEn, 'BST — instructor notes');
  assert.equal(d.titleZh, 'BST —— 講師補充');
  assert.equal(d.en, EN_MD);
  assert.equal(d.zh, ZH_MD);
  assert.equal(d.private, true);
  assert.equal(d.access, 'ok');
  assert.ok(d.num >= 1001);
});

test('private-decks: deck marked access=denied when its files 403', async () => {
  const responses = happyPath();
  const i = responses.findIndex((r) => r.match === '/files/' + EN_ID + '?alt=media');
  responses[i] = { match: '/files/' + EN_ID + '?alt=media', status: 403, json: {} };
  const m = loadModule(makeFetch(responses));
  m._resetPrivateDecksCache();
  const decks = await m.fetchPrivateDecks({ accessToken: TOKEN, folderId: FOLDER });
  assert.equal(decks.length, 1);
  assert.equal(decks[0].access, 'denied');
});

test('private-decks: caches results for same access token', async () => {
  const fetch = makeFetch(happyPath());
  const m = loadModule(fetch);
  m._resetPrivateDecksCache();
  await m.fetchPrivateDecks({ accessToken: TOKEN, folderId: FOLDER });
  const before = fetch.callCount();
  await m.fetchPrivateDecks({ accessToken: TOKEN, folderId: FOLDER });
  assert.equal(fetch.callCount(), before);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/unit/private-decks.test.js`
Expected: FAIL — `private-decks.js` doesn't exist.

- [ ] **Step 3: Create `private-decks.js`** at repo root with EXACTLY:

```js
// Fetches private Marp decks from a Google Drive folder using the user's
// own OAuth access token (drive.readonly scope). Pure function — caller
// provides token + folder ID. Per-session in-memory cache.
//
// Ported from rdvisual src/framework/privateDecks.js with two adaptations:
//   1. IIFE wrapper exposing window.privateDecksClient
//   2. Manifest entry field 'method' replaces rdvisual's 'section'
//   3. Lang key 'zh' (not 'zh-TW') matches dsvisual's i18n convention
(function () {
  'use strict';

  const PRIVATE_NUM_OFFSET = 1000;
  const DRIVE_API = 'https://www.googleapis.com/drive/v3/files';

  let cache = { token: null, decks: null };

  function _resetPrivateDecksCache() {
    cache = { token: null, decks: null };
  }

  async function fetchPrivateDecks(opts) {
    const accessToken = opts && opts.accessToken;
    const folderId = opts && opts.folderId;
    if (!folderId || !accessToken) return [];
    if (cache.token === accessToken && cache.decks !== null) return cache.decks;
    const manifest = await fetchManifest(accessToken, folderId);
    if (!manifest || !Array.isArray(manifest.decks)) {
      cache = { token: accessToken, decks: [] };
      return [];
    }
    const decks = [];
    for (let i = 0; i < manifest.decks.length; i++) {
      const entry = manifest.decks[i];
      const num = PRIVATE_NUM_OFFSET + i + 1;
      const deck = await fetchDeck(accessToken, folderId, entry, num);
      if (deck) decks.push(deck);
    }
    cache = { token: accessToken, decks };
    return decks;
  }

  async function fetchManifest(accessToken, folderId) {
    const listed = await listByName(accessToken, folderId, ['private-decks.json']);
    if (listed === null) return null;
    const file = listed.find((f) => f.name === 'private-decks.json');
    if (!file) return null;
    const text = await getFileMedia(accessToken, file.id);
    if (text === null) return null;
    try { return JSON.parse(text); } catch { return null; }
  }

  async function fetchDeck(accessToken, folderId, entry, num) {
    const enName = entry.files && entry.files.en;
    const zhName = entry.files && entry.files.zh;
    if (!entry.id || !entry.method || !enName || !zhName) return null;
    const listed = await listByName(accessToken, folderId, [enName, zhName]);
    if (listed === null) return shellDeck(entry, num, 'error', '', '');
    const enFile = listed.find((f) => f.name === enName);
    const zhFile = listed.find((f) => f.name === zhName);
    if (!enFile || !zhFile) return shellDeck(entry, num, 'denied', '', '');
    const [enResult, zhResult] = await Promise.all([
      getFileMediaWithStatus(accessToken, enFile.id),
      getFileMediaWithStatus(accessToken, zhFile.id),
    ]);
    const worst = pickWorstStatus(enResult.status, zhResult.status);
    return shellDeck(entry, num, worst, enResult.text || '', zhResult.text || '');
  }

  function shellDeck(entry, num, access, enText, zhText) {
    return {
      id: entry.id,
      method: entry.method,
      num: num,
      titleEn: entry.titleEn || entry.id,
      titleZh: entry.titleZh || entry.id,
      en: enText,
      zh: zhText,
      private: true,
      access: access,
    };
  }

  function pickWorstStatus(a, b) {
    if (a === 'error' || b === 'error') return 'error';
    if (a === 'denied' || b === 'denied') return 'denied';
    return 'ok';
  }

  async function listByName(accessToken, folderId, names) {
    const nameClauses = names.map((n) => "name='" + n.replace(/'/g, "\\'") + "'").join(' or ');
    const q = "'" + folderId + "' in parents and (" + nameClauses + ") and trashed=false";
    const params = new URLSearchParams({ q: q, fields: 'files(id,name)', pageSize: '50' });
    try {
      const resp = await fetch(DRIVE_API + '?' + params.toString(), {
        headers: { Authorization: 'Bearer ' + accessToken },
      });
      if (resp.status === 403 || resp.status === 401) return null;
      if (!resp.ok) return [];
      const payload = await resp.json();
      return Array.isArray(payload.files) ? payload.files : [];
    } catch { return null; }
  }

  async function getFileMedia(accessToken, fileId) {
    const r = await getFileMediaWithStatus(accessToken, fileId);
    return r.status === 'ok' ? r.text : null;
  }

  async function getFileMediaWithStatus(accessToken, fileId) {
    try {
      const resp = await fetch(DRIVE_API + '/' + encodeURIComponent(fileId) + '?alt=media', {
        headers: { Authorization: 'Bearer ' + accessToken },
      });
      if (resp.status === 403 || resp.status === 404 || resp.status === 401) {
        return { status: 'denied', text: null };
      }
      if (!resp.ok) return { status: 'error', text: null };
      return { status: 'ok', text: await resp.text() };
    } catch { return { status: 'error', text: null }; }
  }

  window.privateDecksClient = { fetchPrivateDecks: fetchPrivateDecks, _resetPrivateDecksCache: _resetPrivateDecksCache };
})();
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test tests/unit/private-decks.test.js`
Expected: PASS — 7 tests.

- [ ] **Step 5: Add private-decks.js to `index.html`**

In `index.html`, immediately AFTER the `<script src="slide-markdown.js" defer></script>` line (added in Task 3), add EXACTLY:

```html
    <script src="private-decks.js" defer></script>
```

- [ ] **Step 6: Commit**

```bash
git add private-decks.js tests/unit/private-decks.test.js index.html
git commit -m "feat(dsvisual): private-decks module — fetch Marp decks from Drive folder"
```

Include the `Co-Authored-By:` trailer.

---

### Task 5: i18n keys for cloud + private-slides UI

Add the 10 new translation keys to `i18n.js`'s `TRANSLATIONS` table. Tasks 6 & 7 will use these.

**Files:**
- Modify: `i18n.js`

- [ ] **Step 1: Add `en` keys**

In `i18n.js`, find the `en:` block of `TRANSLATIONS` (around line 8). At a sensible spot inside the `en:` object (after the existing `aria.lang-toggle` and `aria.settings-toggle` keys if they exist — search with `grep -n "aria.settings" i18n.js`), add EXACTLY:

```js
            'aria.cloud-toggle':            'Open cloud sign-in',
            'cloud.title':                  'Cloud sign-in',
            'cloud.signin-cta':             'Sign in with Google',
            'cloud.signin-note':            'Permission "See and download your Drive files" is required to view private slides shared with your account.',
            'cloud.current-user':           'Signed in as {name}',
            'cloud.signout':                'Sign out',
            'slide.private-chip-aria':      'Private deck',
            'slide.private-signin-row':     '🔒 Sign in to see private slides',
            'slide.private-no-access':      'no access',
            'slide.private-fetch-error':    "couldn't load — retry",
```

- [ ] **Step 2: Add `zh` keys**

Find the matching `zh:` block in the same file. Add EXACTLY this set in the same position relative to its block:

```js
            'aria.cloud-toggle':            '開啟雲端登入',
            'cloud.title':                  '雲端登入',
            'cloud.signin-cta':             '以 Google 登入',
            'cloud.signin-note':            '需要「檢視與下載您的 Google 雲端硬碟檔案」權限,才能讀取分享給您的私人投影片。',
            'cloud.current-user':           '已登入：{name}',
            'cloud.signout':                '登出',
            'slide.private-chip-aria':      '私人投影片',
            'slide.private-signin-row':     '🔒 登入以檢視私人投影片',
            'slide.private-no-access':      '無存取權',
            'slide.private-fetch-error':    '載入失敗 —— 重試',
```

- [ ] **Step 3: Verify it parses + existing i18n tests still green**

Run: `node --check i18n.js`
Expected: silent.

Run: `node --test tests/unit/i18n.test.js`
Expected: PASS (existing tests).

- [ ] **Step 4: Commit**

```bash
git add i18n.js
git commit -m "feat(dsvisual): i18n strings for cloud sign-in + private-slides UI"
```

Include the `Co-Authored-By:` trailer.

---

### Task 6: Cloud drawer UI — ☁ button + modal + cloud-drawer.js + styles

Add the header ☁ button, the cloud-drawer modal DOM in `index.html`, the `cloud-drawer.js` controller, and the CSS rules. After this task, the user can sign in with Google + see signed-in state + sign out.

**Files:**
- Modify: `index.html`, `style.css`
- Create: `cloud-drawer.js`

- [ ] **Step 1: Add the ☁ button to the header in `index.html`**

In `index.html`, find this exact block (around line ~28-30):
```html
                <button id="settings-toggle" type="button" class="settings-toggle"
                        data-i18n-aria-label="aria.settings-toggle"
                        aria-label="Open settings">⚙</button>
            </div>
```
Replace with EXACTLY:
```html
                <button id="cloud-toggle" type="button" class="cloud-toggle"
                        data-i18n-aria-label="aria.cloud-toggle"
                        aria-label="Open cloud sign-in" data-testid="cloud-toggle">☁</button>
                <button id="settings-toggle" type="button" class="settings-toggle"
                        data-i18n-aria-label="aria.settings-toggle"
                        aria-label="Open settings">⚙</button>
            </div>
```

- [ ] **Step 2: Add the cloud-drawer modal DOM to `index.html`**

In `index.html`, find the existing `<div id="slide-viewer" class="slide-viewer" data-testid="slide-viewer" hidden>` block (around line ~370). IMMEDIATELY BEFORE that `<div>`, add EXACTLY:

```html
        <div id="cloud-drawer" class="cloud-drawer" data-testid="cloud-drawer" hidden>
            <button type="button" class="cloud-drawer-backdrop" data-cloud-close aria-label="Close"></button>
            <section class="cloud-drawer-panel" role="dialog" aria-modal="true" aria-labelledby="cloud-drawer-title" tabindex="-1">
                <header class="cloud-drawer-header">
                    <h2 id="cloud-drawer-title" data-i18n-key="cloud.title">Cloud sign-in</h2>
                    <button type="button" class="cloud-drawer-close" data-cloud-close aria-label="Close">×</button>
                </header>
                <div class="cloud-drawer-body" id="cloud-drawer-body" data-testid="cloud-drawer-body"></div>
            </section>
        </div>
```

- [ ] **Step 3: Create `cloud-drawer.js`** at repo root with EXACTLY:

```js
// Cloud drawer: ☁ header button → modal with Google sign-in / sign-out.
// Reads/writes auth state via window.cloudClient(). Re-renders body on
// auth state changes. Dispatches 'cloud-auth-changed' custom event so
// other modules (app.js slide viewer) can react.
(function () {
  'use strict';

  function t(key, params) {
    const I18N = window.I18N;
    if (!I18N) return key;
    return I18N.t ? I18N.t(key, params) : key;
  }

  function render(body, client) {
    const user = client.getUser();
    if (user) {
      const name = user.displayName || user.email || 'unknown';
      body.innerHTML =
        '<p class="cloud-drawer-user">' + t('cloud.current-user', { name: name }) + '</p>' +
        '<button type="button" class="btn secondary" id="cloud-signout-btn" data-testid="cloud-signout-btn">' +
          t('cloud.signout') +
        '</button>';
      const btn = body.querySelector('#cloud-signout-btn');
      btn.addEventListener('click', async () => {
        try {
          await client.signOutGoogle();
          window.dispatchEvent(new CustomEvent('cloud-auth-changed', { detail: { signedIn: false } }));
        } catch (err) {
          body.insertAdjacentHTML('beforeend', '<p class="cloud-drawer-error">' + (err && err.message) + '</p>');
        }
      });
    } else {
      const isConfigured = client.isConfigured;
      const note = isConfigured ? t('cloud.signin-note') : (client.missingReason || 'Cloud not configured.');
      body.innerHTML =
        '<p class="cloud-drawer-note">' + note + '</p>' +
        '<button type="button" class="btn primary" id="cloud-signin-btn" data-testid="cloud-signin-btn"' +
          (isConfigured ? '' : ' disabled') + '>' +
          t('cloud.signin-cta') +
        '</button>';
      if (isConfigured) {
        body.querySelector('#cloud-signin-btn').addEventListener('click', async () => {
          try {
            await client.signInWithGoogle();
            window.dispatchEvent(new CustomEvent('cloud-auth-changed', { detail: { signedIn: true } }));
          } catch (err) {
            body.insertAdjacentHTML('beforeend', '<p class="cloud-drawer-error">' + (err && err.message) + '</p>');
          }
        });
      }
    }
  }

  function openDrawer() {
    const drawer = document.getElementById('cloud-drawer');
    const body = document.getElementById('cloud-drawer-body');
    if (!drawer || !body) return;
    const client = window.cloudClient ? window.cloudClient() : null;
    if (!client) { body.innerHTML = '<p>Cloud client not loaded.</p>'; }
    else { render(body, client); }
    drawer.hidden = false;
    drawer.classList.add('open');
    drawer.querySelector('.cloud-drawer-panel').focus();
  }

  function closeDrawer() {
    const drawer = document.getElementById('cloud-drawer');
    if (!drawer) return;
    drawer.hidden = true;
    drawer.classList.remove('open');
  }

  function bind() {
    const btn = document.getElementById('cloud-toggle');
    if (btn) btn.addEventListener('click', openDrawer);
    document.querySelectorAll('[data-cloud-close]').forEach((el) => {
      el.addEventListener('click', closeDrawer);
    });
    document.addEventListener('keydown', (e) => {
      const drawer = document.getElementById('cloud-drawer');
      if (drawer && !drawer.hidden && e.key === 'Escape') closeDrawer();
    });
    // Subscribe to auth-state changes — refresh drawer body if open.
    const client = window.cloudClient ? window.cloudClient() : null;
    if (client && client.subscribeAuthState) {
      client.subscribeAuthState(() => {
        const drawer = document.getElementById('cloud-drawer');
        if (drawer && !drawer.hidden) {
          const body = document.getElementById('cloud-drawer-body');
          render(body, client);
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }

  // Exposed for openSlides() sign-in row handler.
  window.openCloudDrawer = openDrawer;
})();
```

- [ ] **Step 4: Add `<script src="cloud-drawer.js" defer>`** to `index.html`

Immediately AFTER the `<script src="private-decks.js" defer></script>` line, add EXACTLY:
```html
    <script src="cloud-drawer.js" defer></script>
```

- [ ] **Step 5: Add CSS** for `.cloud-toggle` + `.cloud-drawer*`

Append to the end of `style.css`:

```css

/* ── Cloud sign-in drawer ── */
.cloud-toggle {
  background: none; border: 1px solid rgba(255, 255, 255, 0.35);
  color: #fff; width: 38px; height: 38px; border-radius: 8px;
  font-size: 1.1rem; cursor: pointer; transition: background 0.15s;
}
.cloud-toggle:hover, .cloud-toggle:focus-visible {
  background: rgba(255, 255, 255, 0.15); outline: none;
}

.cloud-drawer {
  position: fixed; inset: 0; z-index: 1000;
  display: flex; align-items: center; justify-content: center; padding: 1.5rem;
}
.cloud-drawer[hidden] { display: none; }
.cloud-drawer-backdrop {
  position: absolute; inset: 0; background: rgba(15, 23, 42, 0.6);
  border: 0; cursor: pointer;
}
.cloud-drawer-panel {
  position: relative; z-index: 1;
  background: var(--card-bg, #fff);
  border-radius: var(--app-radius-lg, 10px);
  width: min(420px, 100%); padding: 0;
  box-shadow: var(--app-shadow-lg, 0 14px 30px rgba(2, 6, 23, 0.28));
  outline: none;
}
.cloud-drawer-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.85rem 1rem; border-bottom: 1px solid var(--card-border, #d7e0ea);
}
.cloud-drawer-header h2 {
  margin: 0; font-size: 1rem; color: var(--text-main, #1f2937);
}
.cloud-drawer-close {
  width: 32px; height: 32px; border: 1px solid var(--card-border, #d7e0ea);
  border-radius: 6px; background: transparent; font-size: 1.1rem; cursor: pointer;
  color: var(--text-muted, #51606f);
}
.cloud-drawer-close:hover { background: var(--surface-hover, #f1f5f9); }
.cloud-drawer-body {
  padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem;
  font-size: 0.9rem; color: var(--text-main, #1f2937);
}
.cloud-drawer-note { margin: 0; color: var(--text-muted, #51606f); }
.cloud-drawer-user { margin: 0; font-weight: 600; }
.cloud-drawer-error { margin: 0; color: #b91c1c; font-size: 0.85rem; }

/* ── Slide-viewer deck picker bar (multi-deck) + private chip ── */
.slide-deck-bar {
  display: flex; gap: 0; flex-wrap: wrap; padding: 0.5rem 1rem; margin-bottom: 0.5rem;
  border-bottom: 1px solid var(--card-border, #d7e0ea);
}
.slide-deck-btn {
  padding: 0.34rem 0.7rem; border: 1px solid var(--card-border, #d7e0ea);
  border-right: 0; background: var(--card-bg, #fff);
  color: var(--text-muted, #51606f); font-size: 0.78rem; cursor: pointer;
}
.slide-deck-btn:last-child { border-right: 1px solid var(--card-border, #d7e0ea); }
.slide-deck-btn:first-child { border-radius: 6px 0 0 6px; }
.slide-deck-btn:last-child  { border-radius: 0 6px 6px 0; }
.slide-deck-btn--active { background: var(--primary-color, #3498db); color: #fff; font-weight: 600; }
.slide-deck-btn--private { background: #faf5ff; color: #6b21a8; }
.slide-deck-btn--private.slide-deck-btn--active { background: #6b21a8; color: #fff; }
.slide-deck-btn--signin { background: #fef3c7; color: #92400e; font-style: italic; font-weight: 600; }
.slide-deck-btn--signin:hover { background: #fde68a; }
.slide-deck-btn--denied, .slide-deck-btn--error {
  background: #f1f5f9; color: #94a3b8; cursor: not-allowed;
}
.slide-deck-btn__sub { font-size: 0.72rem; opacity: 0.85; margin-left: 0.25rem; }
```

- [ ] **Step 6: Manual smoke**

Run: `npm test -- --grep 'visualizer'`
Expected: PASS — page still loads; nothing broken.

(There's no automated test yet for the drawer itself — that comes via the e2e test in Task 8.)

- [ ] **Step 7: Commit**

```bash
git add index.html cloud-drawer.js style.css
git commit -m "feat(dsvisual): cloud drawer — header ☁ button + Google sign-in modal"
```

Include the `Co-Authored-By:` trailer.

---

### Task 7: Extend `openSlides()` — deck picker + private merge + sign-in row

The biggest behavioural change. Replace the single-deck rendering in app.js with a deck-list model that supports public + private decks with a picker bar. Preserves single-deck behaviour when only one deck is present (no regression).

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Find the existing block to replace**

In `app.js`, locate the existing block starting `let slideDeck = [];` and `let slideIndex = 0;` (around line ~647). The block extends through `function buildSlides(methodId) { ... }`, `function renderSlide() { ... }`, `function openSlides(methodId) { ... }`, `function closeSlides() { ... }`, `function handleSlideKeydown(e) { ... }`, and the existing button-wiring lines for `slidePrev`, `slideNext`, `slideCloseButtons`, `slideLangToggle`. Read carefully — note the exact lines to delete (use `grep -n` to map line numbers).

The next step replaces this entire block.

- [ ] **Step 2: Replace the block with the deck-list aware version**

Replace the entire block from `let slideDeck = [];` through the end of `slideLangToggle.addEventListener(...)`'s callback with EXACTLY:

```js
    // Deck list = [{ id, kind: 'public'|'private', titleEn, titleZh, slides: [{title,body}], access }]
    // Single-deck case (deckList.length === 1) hides the picker bar — behaviour
    // identical to the pre-private-slides era.
    let slideDeckList = [];
    let slideDeckIndex = 0;
    let slideIndex = 0;
    let slideMethodId = null;
    let slidePrivateSignInNeeded = false;
    const slideLangToggle = document.getElementById('slide-lang-toggle');

    function getMethodById(methodId) {
        for (const group of METHOD_GROUPS) {
            const method = group.methods.find((candidate) => candidate.id === methodId);
            if (method) return method;
        }
        return null;
    }

    function getPrivateContext() {
        const cfg = window.dsvisualCloudConfig;
        const raw = (cfg && cfg.drive && cfg.drive.privateSlidesFolderId) || '';
        // Defensive: treat literal __…__ placeholder (inject-env didn't run, or env unset)
        // as "not configured" — feature disabled, no Drive calls.
        const folderId = /^__.+__$/.test(raw) ? '' : raw;
        if (!folderId) return { folderId: '', token: null };
        const client = window.cloudClient ? window.cloudClient() : null;
        const token = client ? client.getAccessToken() : null;
        return { folderId: folderId, token: token };
    }

    function publicSlidesFor(methodId) {
        const lang = window.I18N ? window.I18N.getCurrentLanguage() : 'en';
        const entry = window.SLIDES_RENDERED && window.SLIDES_RENDERED[methodId];
        if (!entry || !entry.slides[lang] || entry.slides[lang].length === 0) {
            return [{ title: t('method.' + methodId) || methodId,
                      body: '<p>' + t('slide.no-slides') + '</p>' }];
        }
        return entry.slides[lang];
    }

    function publicDeckFor(methodId) {
        // Both titleEn/titleZh get the current-language value; openSlides()
        // re-rebuilds the deck list when language changes, so the picker
        // re-renders with the correct title for the new language.
        const title = t('method.' + methodId) || methodId;
        return {
            id: methodId + '-public',
            kind: 'public',
            titleEn: title,
            titleZh: title,
            slides: publicSlidesFor(methodId),
            access: 'ok',
        };
    }

    function privateDeckToViewerShape(d) {
        const lang = window.I18N ? window.I18N.getCurrentLanguage() : 'en';
        const md = (lang === 'zh') ? d.zh : d.en;
        const parsed = (window.slideMarkdown && md)
            ? window.slideMarkdown.parseDeck(md) : { slides: [] };
        const slides = parsed.slides.map((s) => ({ title: '', body: s.html }));
        if (slides.length === 0) {
            slides.push({ title: '', body: '<p>' + t('slide.private-no-access') + '</p>' });
        }
        return {
            id: d.id,
            kind: 'private',
            titleEn: d.titleEn,
            titleZh: d.titleZh,
            slides: slides,
            access: d.access,
        };
    }

    function deckTitle(deck) {
        const lang = window.I18N ? window.I18N.getCurrentLanguage() : 'en';
        const base = (lang === 'zh') ? deck.titleZh : deck.titleEn;
        return deck.kind === 'private' ? '🔒 ' + base : base;
    }

    function renderDeckBar() {
        if (slideDeckList.length <= 1 && !slidePrivateSignInNeeded) return '';
        const items = slideDeckList.slice();
        if (slidePrivateSignInNeeded) items.push({ __signInRow: true });
        const html = items.map((d, i) => {
            if (d.__signInRow) {
                return '<button type="button" class="slide-deck-btn slide-deck-btn--signin"' +
                       ' data-testid="slide-signin-row">' + t('slide.private-signin-row') + '</button>';
            }
            const classes = ['slide-deck-btn'];
            if (i === slideDeckIndex) classes.push('slide-deck-btn--active');
            if (d.kind === 'private') classes.push('slide-deck-btn--private');
            if (d.kind === 'private' && d.access === 'denied') classes.push('slide-deck-btn--denied');
            if (d.kind === 'private' && d.access === 'error')  classes.push('slide-deck-btn--error');
            const disabled = (d.kind === 'private' && (d.access === 'denied' || d.access === 'error'));
            const suffix =
                (d.kind === 'private' && d.access === 'denied')
                    ? ' <span class="slide-deck-btn__sub">— ' + t('slide.private-no-access') + '</span>'
                : (d.kind === 'private' && d.access === 'error')
                    ? ' <span class="slide-deck-btn__sub">— ' + t('slide.private-fetch-error') + '</span>'
                : '';
            return '<button type="button" class="' + classes.join(' ') + '"' +
                   ' data-deck-index="' + i + '" data-testid="slide-deck-' + i + '"' +
                   (disabled ? ' disabled' : '') + '>' +
                   deckTitle(d) + suffix + '</button>';
        }).join('');
        return '<div class="slide-deck-bar" role="tablist" data-testid="slide-deck-bar">' + html + '</div>';
    }

    function renderSlide() {
        if (!slideViewer || slideDeckList.length === 0) return;
        const deck = slideDeckList[slideDeckIndex];
        const slide = deck.slides[slideIndex] || { title: '', body: '' };
        slideViewerTitle.textContent = slide.title || deckTitle(deck);
        slideViewerProgress.textContent = t('slide.progress', {
            n: slideIndex + 1,
            total: deck.slides.length,
        });
        slideViewerBody.innerHTML = renderDeckBar() + slide.body;
        // Wire deck-bar clicks.
        slideViewerBody.querySelectorAll('[data-deck-index]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.getAttribute('data-deck-index'), 10);
                if (slideDeckList[idx] &&
                    !(slideDeckList[idx].kind === 'private' &&
                      (slideDeckList[idx].access === 'denied' || slideDeckList[idx].access === 'error'))) {
                    slideDeckIndex = idx;
                    slideIndex = 0;
                    renderSlide();
                }
            });
        });
        const signinRow = slideViewerBody.querySelector('[data-testid="slide-signin-row"]');
        if (signinRow) {
            signinRow.addEventListener('click', () => {
                closeSlides();
                if (typeof window.openCloudDrawer === 'function') window.openCloudDrawer();
            });
        }
        slidePrev.disabled = slideIndex === 0;
        slideNext.disabled = slideIndex >= deck.slides.length - 1;
        slideViewerBody.scrollTop = 0;
    }

    async function fetchAndMergePrivate(methodId) {
        const ctx = getPrivateContext();
        if (!ctx.folderId) { slidePrivateSignInNeeded = false; return; }
        if (!ctx.token) { slidePrivateSignInNeeded = true; return; }
        slidePrivateSignInNeeded = false;
        try {
            const all = await window.privateDecksClient.fetchPrivateDecks({
                accessToken: ctx.token, folderId: ctx.folderId,
            });
            const forThisMethod = all.filter((d) => d.method === methodId);
            if (forThisMethod.length === 0) return;
            // Append private decks (in cache order). Re-render if viewer still open.
            forThisMethod.forEach((d) => slideDeckList.push(privateDeckToViewerShape(d)));
            if (!slideViewer.hidden && slideMethodId === methodId) renderSlide();
        } catch (_) {
            // Silent — leave the picker as public-only.
        }
    }

    function openSlides(methodId) {
        slideMethodId = methodId;
        slideDeckList = [publicDeckFor(methodId)];
        slideDeckIndex = 0;
        slideIndex = 0;
        // Compute sign-in state synchronously so first paint is correct.
        const ctx = getPrivateContext();
        slidePrivateSignInNeeded = Boolean(ctx.folderId) && !ctx.token;
        renderSlide();
        slideViewer.hidden = false;
        slideViewer.classList.add('open');
        slideViewer.querySelector('.slide-viewer-panel').focus();
        slideViewer.addEventListener('keydown', handleSlideKeydown);
        // Kick off async private-deck fetch + merge.
        if (ctx.folderId && ctx.token) {
            fetchAndMergePrivate(methodId);
        }
    }

    function closeSlides() {
        if (!slideViewer) return;
        slideViewer.hidden = true;
        slideViewer.classList.remove('open');
        slideViewer.removeEventListener('keydown', handleSlideKeydown);
    }

    function handleSlideKeydown(e) {
        const deck = slideDeckList[slideDeckIndex];
        if (!deck) return;
        if (e.key === 'Escape') {
            closeSlides();
        } else if (e.key === 'ArrowRight' || e.key === ' ') {
            e.preventDefault();
            if (slideIndex < deck.slides.length - 1) { slideIndex++; renderSlide(); }
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            if (slideIndex > 0) { slideIndex--; renderSlide(); }
        }
    }

    slideCloseButtons.forEach((button) => button.addEventListener('click', closeSlides));
    slidePrev.addEventListener('click', () => {
        const deck = slideDeckList[slideDeckIndex];
        if (deck && slideIndex > 0) { slideIndex--; renderSlide(); }
    });
    slideNext.addEventListener('click', () => {
        const deck = slideDeckList[slideDeckIndex];
        if (deck && slideIndex < deck.slides.length - 1) { slideIndex++; renderSlide(); }
    });

    if (slideLangToggle) {
        slideLangToggle.addEventListener('click', () => {
            const next = window.I18N.getCurrentLanguage() === 'zh' ? 'en' : 'zh';
            window.I18N.setLanguage(next);
            if (!slideViewer.hidden && slideMethodId) {
                // Rebuild deck list with the new language.
                openSlides(slideMethodId);
            }
        });
    }

    // Refresh private decks when user signs in/out from the cloud drawer.
    window.addEventListener('cloud-auth-changed', () => {
        if (window.privateDecksClient) window.privateDecksClient._resetPrivateDecksCache();
        if (!slideViewer.hidden && slideMethodId) openSlides(slideMethodId);
    });
```

- [ ] **Step 3: Run the existing slide-viewer e2e to confirm no regression**

Run: `npm test -- --grep 'slides_viewer'`
Expected: PASS — the existing slides-viewer tests still pass.

If any existing test fails, inspect — the single-deck case must render exactly as before (no deck-bar shown, `renderSlide()` produces same HTML for `slideViewerBody.innerHTML`). The most likely regression source is `slideViewerBody.innerHTML = renderDeckBar() + slide.body;` — when `renderDeckBar()` returns `''`, this is byte-identical to the prior `slideViewerBody.innerHTML = slide.body;`.

- [ ] **Step 4: Commit**

```bash
git add app.js
git commit -m "feat(dsvisual): openSlides — deck-list + private merge + sign-in row"
```

Include the `Co-Authored-By:` trailer.

---

### Task 8: e2e — regression-safety + cloud drawer + sign-in row

A new Playwright spec covering the three highest-leverage flows: (1) no folder configured → no 🔒, no Drive calls (regression-safety); (2) ☁ button opens cloud drawer; (3) when folder configured but not signed in, sign-in row appears + click opens drawer.

**Files:**
- Create: `tests/cloud-private-slides.spec.js`

- [ ] **Step 1: Write the e2e spec** — create `tests/cloud-private-slides.spec.js` with EXACTLY:

```js
'use strict';
const { test, expect } = require('@playwright/test');

// Open index.html via file:// (matches the other dsvisual specs' pattern).
const path = require('node:path');
const HOME = 'file://' + path.resolve(__dirname, '..', 'index.html');

test.describe('cloud + private slides', () => {

  test('regression: no folder configured → no sign-in row in slide picker', async ({ page }) => {
    await page.goto(HOME);
    // Click any method's Slides button.
    const firstSlideBtn = page.locator('.method-slides-btn').first();
    await firstSlideBtn.waitFor();
    await firstSlideBtn.click();
    // Slide viewer opens.
    await expect(page.getByTestId('slide-viewer')).toBeVisible();
    // No sign-in row, no deck-picker bar (single public deck only).
    await expect(page.getByTestId('slide-signin-row')).toHaveCount(0);
    await expect(page.getByTestId('slide-deck-bar')).toHaveCount(0);
  });

  test('cloud drawer: ☁ button opens and closes the drawer', async ({ page }) => {
    await page.goto(HOME);
    await page.getByTestId('cloud-toggle').click();
    const drawer = page.getByTestId('cloud-drawer');
    await expect(drawer).toBeVisible();
    // Close button (× in drawer header).
    await drawer.locator('.cloud-drawer-close').click();
    await expect(drawer).toBeHidden();
  });

  test('sign-in row: folder configured but not signed in → row appears + clicking opens cloud drawer', async ({ page }) => {
    // Inject a fake folder ID into the cloud config BEFORE app.js initializes.
    await page.addInitScript(() => {
      // Pre-create the config object so cloud-config.js (which sets it) is overridden
      // after it runs — instead, wait for it then patch.
      Object.defineProperty(window, '__dsvisual_force_folder__', { value: 'FAKE_FOLDER_ID', writable: false });
      // Patch after dsvisualCloudConfig exists.
      const orig = Object.getOwnPropertyDescriptor(window, 'dsvisualCloudConfig');
      let stored;
      Object.defineProperty(window, 'dsvisualCloudConfig', {
        get() { return stored; },
        set(v) {
          if (v && v.drive) v.drive.privateSlidesFolderId = window.__dsvisual_force_folder__;
          stored = v;
        },
      });
    });
    await page.goto(HOME);
    // Open any method's slides.
    const firstSlideBtn = page.locator('.method-slides-btn').first();
    await firstSlideBtn.waitFor();
    await firstSlideBtn.click();
    // Sign-in row visible.
    const signinRow = page.getByTestId('slide-signin-row');
    await expect(signinRow).toBeVisible();
    // Clicking it closes slide viewer + opens cloud drawer.
    await signinRow.click();
    await expect(page.getByTestId('slide-viewer')).toBeHidden();
    await expect(page.getByTestId('cloud-drawer')).toBeVisible();
  });

});
```

- [ ] **Step 2: Run the e2e**

Run: `npx playwright test tests/cloud-private-slides.spec.js`
Expected: 3 tests pass.

If a test fails:
- Test 1 (regression): app.js `openSlides()` is rendering deck-bar even when single-deck. Re-check `renderDeckBar()` — must return `''` when `slideDeckList.length <= 1 && !slidePrivateSignInNeeded`.
- Test 2 (drawer): `cloud-drawer.js`'s `bind()` did not run. Verify the `<script src="cloud-drawer.js" defer>` tag is in `index.html` AFTER cloud-integration.js and BEFORE app.js.
- Test 3 (sign-in row): the addInitScript patch may not catch the `dsvisualCloudConfig` write — `cloud-config.js` runs deferred. If failing, simplify: in the addInitScript, just set `window.dsvisualCloudConfig = { firebase: {…}, drive: { privateSlidesFolderId: 'FAKE_FOLDER_ID' } };` AFTER `cloud-config.js` would have run. May need `await page.waitForFunction(() => window.dsvisualCloudConfig)` then `page.evaluate(() => { window.dsvisualCloudConfig.drive.privateSlidesFolderId = 'FAKE'; });` BEFORE opening slides.

- [ ] **Step 3: Run the full Playwright suite**

Run: `npm test`
Expected: ALL existing specs still green + the new spec green.

- [ ] **Step 4: Commit**

```bash
git add tests/cloud-private-slides.spec.js
git commit -m "test(dsvisual): e2e for cloud drawer + private-slides sign-in row"
```

Include the `Co-Authored-By:` trailer.

---

### Task 9: Operator guide + manifest template + smoke script

Add the three operator-facing artifacts so a course owner can self-serve. Same content as rdvisual/stvisual's `docs/private-slides.md` adapted to dsvisual's per-method model. Smoke script ports rdvisual's.

**Files:**
- Create: `docs/private-slides.md`, `docs/private-decks.example.json`, `scripts/smoke-private-decks.mjs`

- [ ] **Step 1: Create `docs/private-slides.md`** with EXACTLY this content:

````markdown
# Private course slides on Google Drive

Some course slides shouldn't be public. dsvisual can fetch them from a Google
Drive folder at runtime, gated by Drive-native per-user sharing. Each method's
existing public deck and any private Drive decks for that method appear together
in the slide-viewer's deck-picker; private decks get a 🔒 chip and require
sign-in.

## What you need

- A Google account with Drive.
- A Google Cloud project with the Drive API enabled (the same project used by
  Firebase Auth for this deployment).
- The deployment's `cloud-config.js` (filled at build time via inject-env).

## One-time setup

1. **Create a Drive folder.** Name it something memorable, e.g.
   `dsvisual — private slides`. Copy its folder ID from the URL.
2. **Share the folder** with the Google accounts (or Google Group) of the users
   who should see private decks. "Viewer" permission is enough. Revoke any time.
3. **Set the folder ID** in your deployment's environment:
   `DRIVE_PRIVATE_SLIDES_FOLDER_ID=<the folder ID>`.
   Leave it unset to disable the feature entirely.

## Writing a private deck

1. Author your Marp markdown locally (`marp: true` front-matter). Two files per
   deck — `*.en.md` and `*.zh.md` (note: dsvisual uses `zh`, not `zh-TW`).
2. Upload both files to the Drive folder.
3. Add an entry to `private-decks.json` in the same folder:

   ```json
   {
     "version": 1,
     "decks": [
       {
         "id": "tree-bst-instructor",
         "method": "tree-bst",
         "files": {
           "en": "tree-bst-instructor.en.md",
           "zh": "tree-bst-instructor.zh.md"
         },
         "titleEn": "BST — instructor notes",
         "titleZh": "BST —— 講師補充"
       }
     ]
   }
   ```

   All six fields per entry are required. **`method` must match a dsvisual
   method ID** — examples: `tree-bst`, `graph-dijkstra`, `hash-chain`,
   `stack-array`. See `app.js` `METHOD_GROUPS` for the full list.

## What users see

- **Signed-in, in the share list:** the deck appears in the slide-viewer's
  deck-picker bar as `🔒 <title>`. Clicking it renders the markdown via the
  same viewer.
- **Signed-in, not in the share list:** no 🔒 row appears at all — the deck is
  invisible (Drive returns 403 for the manifest, app falls back silently).
- **Not signed in:** the deck-picker bar shows a single
  `🔒 Sign in to see private slides` row. Clicking it opens the cloud drawer
  for Google sign-in.

## OAuth scope note

The app requests `https://www.googleapis.com/auth/drive.readonly` alongside
`drive.file`. On the Google consent screen this appears as "See and download
your Drive files". Users who decline see no 🔒 rows.

## Sanity-check from CLI (smoke script)

```bash
export DRIVE_ACCESS_TOKEN=...  # see scripts/smoke-private-decks.mjs comments
export DRIVE_PRIVATE_SLIDES_FOLDER_ID=<your folder id>
node scripts/smoke-private-decks.mjs
```

Prints the deck list the slide-viewer would receive, with per-deck
`✓ ok` / `✗ denied` / `! error` status.

## Limitations

- One Drive folder per deployment.
- No live updates — manifest fetched once per slide-viewer open.
- No editing slides from the app — author in Drive's UI.
- Per-deck sharing isn't first-class — share at the folder level.
- Images referenced from a private deck must live in repo `slides/` or be
  external URLs.
````

- [ ] **Step 2: Create `docs/private-decks.example.json`** with EXACTLY:

```json
{
  "version": 1,
  "decks": [
    {
      "id": "tree-bst-instructor",
      "method": "tree-bst",
      "files": {
        "en": "tree-bst-instructor.en.md",
        "zh": "tree-bst-instructor.zh.md"
      },
      "titleEn": "BST — instructor notes",
      "titleZh": "BST —— 講師補充"
    },
    {
      "id": "graph-dijkstra-extra",
      "method": "graph-dijkstra",
      "files": {
        "en": "graph-dijkstra-extra.en.md",
        "zh": "graph-dijkstra-extra.zh.md"
      },
      "titleEn": "Dijkstra — proof sketch",
      "titleZh": "Dijkstra —— 證明梗概"
    }
  ]
}
```

- [ ] **Step 3: Create `scripts/smoke-private-decks.mjs`** with EXACTLY:

```js
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
const sandbox = { window: {}, fetch: globalThis.fetch, console };
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
```

- [ ] **Step 4: Verify the smoke script syntax**

Run: `node --check scripts/smoke-private-decks.mjs`
Expected: silent.

Run: `node scripts/smoke-private-decks.mjs`
Expected: prints `❌ DRIVE_ACCESS_TOKEN is not set.` and exits 1 (because no env set; this proves the script loaded + validated correctly).

- [ ] **Step 5: Commit**

```bash
git add docs/private-slides.md docs/private-decks.example.json scripts/smoke-private-decks.mjs
git commit -m "docs(dsvisual): operator guide + manifest template + smoke script"
```

Include the `Co-Authored-By:` trailer.

---

### Task 10: GitHub Pages deploy workflow

dsvisual has no Pages deploy today (only a Playwright CI workflow). Add a deploy-pages.yml that runs tests, runs inject-env, builds slides (existing `npm run build:slides`), and deploys the entire repo root to GitHub Pages.

**Files:**
- Create: `.github/workflows/deploy-pages.yml`
- Modify: `package.json` (add `pages:prepare` script + `firebase` dep)

- [ ] **Step 1: Add the deploy workflow**

Create `.github/workflows/deploy-pages.yml` with EXACTLY:

```yaml
name: Deploy GitHub Pages

on:
  push:
    branches:
      - main
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Run unit tests
        run: npm run test:unit

      - name: Run Playwright tests
        run: npm test

      - name: Prepare static site
        env:
          FIREBASE_API_KEY:                ${{ secrets.FIREBASE_API_KEY }}
          FIREBASE_AUTH_DOMAIN:            ${{ secrets.FIREBASE_AUTH_DOMAIN }}
          FIREBASE_PROJECT_ID:             ${{ secrets.FIREBASE_PROJECT_ID }}
          FIREBASE_STORAGE_BUCKET:         ${{ secrets.FIREBASE_STORAGE_BUCKET }}
          FIREBASE_MESSAGING_SENDER_ID:    ${{ secrets.FIREBASE_MESSAGING_SENDER_ID }}
          FIREBASE_APP_ID:                 ${{ secrets.FIREBASE_APP_ID }}
          FIREBASE_MEASUREMENT_ID:         ${{ secrets.FIREBASE_MEASUREMENT_ID }}
          DRIVE_PRIVATE_SLIDES_FOLDER_ID:  ${{ secrets.DRIVE_PRIVATE_SLIDES_FOLDER_ID }}
        run: npm run pages:prepare

      - name: Upload pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: .

  deploy:
    needs: test
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Update `package.json`**

In `package.json`, find the `"scripts"` block. Add these two new script entries (anywhere inside the block):

```json
    "inject-env": "node scripts/inject-env.mjs",
    "pages:prepare": "npm run inject-env && npm run build:slides",
```

In the `"devDependencies"` block, add this entry:

```json
    "firebase": "^11.7.1",
```

(Firebase is loaded via CDN in `index.html` for the browser, but adding it as a devDependency keeps version pinning visible and lets future code optionally `require('firebase')` from Node tests if needed.)

Run: `npm install` to update `package-lock.json`.

- [ ] **Step 3: Verify locally**

Run: `npm run pages:prepare`
Expected: `inject-env` runs (replaces 8 placeholders with empty strings + 8 warnings); `build:slides` runs successfully (no errors).

Then run: `git checkout cloud-config.js` to revert the injected values.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/deploy-pages.yml package.json package-lock.json
git commit -m "ci(dsvisual): Pages deploy workflow + pages:prepare npm script"
```

Include the `Co-Authored-By:` trailer.

---

### Task 11: Final verification

Sanity-check the whole feature from end to end.

- [ ] **Step 1: Full test gate**

```bash
npm run test:unit
npm test
```
Expected: ALL green — unit tests cover cloud-integration, slide-markdown, private-decks; Playwright covers existing flows + the new `cloud-private-slides.spec.js`.

- [ ] **Step 2: Manual local verification (optional)**

If you have a `.env` with Firebase creds + a configured Drive folder:
```bash
npm run inject-env
python3 -m http.server 4173 &
open http://localhost:4173/
```
Click any method's [Slides] button — should show deck-picker if private decks exist for that method, otherwise single deck as before. Click ☁ → cloud drawer opens. Sign in → OAuth screen should list `drive.readonly`.

After verifying, undo the env injection: `git checkout cloud-config.js`.

- [ ] **Step 3: `git status` should be clean**

```bash
git status
```
Expected: only `.claude/` and existing untracked files (e.g. `node_modules/`, `playwright-report/`, `test-results/` if they're gitignored). NO `cloud-config.js` modifications, NO `package-lock.json` drift from Task 10.

If `cloud-config.js` shows modifications, run `git checkout cloud-config.js`.

- [ ] **Step 4: No commit needed** — this is verify-only.

---

## Self-Review

**Spec coverage** — every spec requirement is mapped to a task:

- 方案甲 (Marp `.md` format) → Tasks 3 (parser) + 4 (fetch) + 7 (render)
- Header ☁ button + cloud drawer → Task 6
- Per-method 🔒 attachment via `method` field in manifest → Tasks 4 + 7
- Pages deploy + inject-env → Tasks 1 + 10
- `__…__` placeholder guard → Task 7 (`getPrivateContext`)
- Singleton cloud client + `getAccessToken()` + both Drive scopes → Task 2
- privateDecks fetch with all 4 error states → Task 4
- i18n strings (10 keys, both locales) → Task 5
- Operator guide + manifest template + smoke script → Task 9
- Regression-safety (no folder = no UI change) → Task 8 test 1
- Cloud drawer interaction → Task 8 test 2-3
- Out-of-scope items respected (no CloudStoragePanel features, no slide-format change for public decks, no ESM/bundler migration)

**Placeholder scan:** no TBD/TODO/"implement later". Every code step shows the exact code or exact `cp` + edit instructions. The slide-markdown port (Task 3) uses `cp` from rdvisual + 4 explicit edits, verified by grep — same proven pattern as the SAILOR / ACH carry tasks. Test cases in Tasks 2/3/4 are full files.

**Type / name consistency:**

- `window.cloudClient` (function returning singleton) used in Tasks 2, 6, 7, 9
- `window.DRIVE_SCOPES` exported in Task 2, asserted in Task 2's test
- `window.slideMarkdown.parseDeck(md) → { slides: [{html, notes}] }` defined in Task 3, consumed in Task 7
- `window.privateDecksClient.fetchPrivateDecks({ accessToken, folderId })` defined in Task 4, called in Task 7
- `window.privateDecksClient._resetPrivateDecksCache()` defined in Task 4, called in Task 7 (on auth change)
- `window.openCloudDrawer` defined in Task 6, called in Task 7 (sign-in row click)
- Manifest shape (`{id, method, files: {en, zh}, titleEn, titleZh}`) defined in Task 4 test fixture + spec + operator guide (Task 9) + example JSON (Task 9) — all consistent
- Deck shape (`{id, method, num, titleEn, titleZh, en, zh, private: true, access}`) defined in Task 4 `shellDeck()`, transformed in Task 7 `privateDeckToViewerShape()`
- i18n keys defined in Task 5 are exactly the ones referenced in Tasks 6 and 7 (`aria.cloud-toggle`, `cloud.title`, `cloud.signin-cta`, `cloud.signin-note`, `cloud.current-user`, `cloud.signout`, `slide.private-chip-aria`, `slide.private-signin-row`, `slide.private-no-access`, `slide.private-fetch-error`)
- Testids defined in Tasks 6, 7, 8 all match across markup + tests: `cloud-toggle`, `cloud-drawer`, `cloud-drawer-body`, `cloud-signin-btn`, `cloud-signout-btn`, `slide-viewer`, `slide-deck-bar`, `slide-deck-${i}`, `slide-signin-row`
- `__DRIVE_PRIVATE_SLIDES_FOLDER_ID__` placeholder name matches across `cloud-config.js` (Task 1), `inject-env.mjs` PLACEHOLDERS map (Task 1), and deploy-pages.yml env (Task 10)
- Lang-key convention `en` / `zh` (not `zh-TW`) — matches dsvisual's i18n.js convention, used in manifest schema (Task 4), private-decks fetch (Task 4), slide rendering (Task 7), and operator guide (Task 9)
