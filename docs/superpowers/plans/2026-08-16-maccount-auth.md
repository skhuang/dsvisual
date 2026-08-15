# dsvisual maccount Auth (B2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace dsvisual's Firebase/Google-Drive cloud integration with a maccount SSO client (using B1's `/auth/app/start` + `/api/app/verify`), so a user logs in with their NYCU account and dsvisual holds `{student_id, providers}`.

**Architecture:** `js/cloud-integration.js` becomes a maccount client (`window.cloudClient()`): `signIn()` redirects to the maccount worker's `/auth/app/start`, an on-load `handleRedirect()` exchanges the returned `#mtoken` at `/api/app/verify` and stores `{student_id, providers}` in sessionStorage; `cloud-drawer.js` and `app.js` are updated; Firebase/Drive/private-slides are removed.

**Tech Stack:** Vanilla JS (IIFE modules on `window`), `fetch`, `sessionStorage`, `history.replaceState`, `location`; tests via `node --test` (vm sandbox, mirroring `tests/unit/cloud-integration.test.js`) + Playwright (`tests/*.spec.js`); `scripts/inject-env.mjs` for config injection.

## Global Constraints

- Auth is maccount SSO only. The client exposes `{ isConfigured, missingReason, getUser, subscribeAuthState, signIn, signOut, handleRedirect }`. NO `getAccessToken`, NO `DRIVE_SCOPES`, NO Firebase.
- `getUser()` returns `{ student_id, providers: {github, google} } | null`. Identity persists in **sessionStorage** under key `dsvisual:maccount:user`.
- `signIn()` → `location.assign(workerBaseUrl + '/auth/app/start?app=' + appId + '&return=' + encodeURIComponent(location.href))`.
- `handleRedirect()` — on load, if `location.hash` contains `mtoken=`: `POST workerBaseUrl + '/api/app/verify'` with `{token}`; on 200 store `{student_id, providers}`, **strip the fragment via `history.replaceState`**, notify subscribers; on failure leave state unchanged.
- `isConfigured` = `workerBaseUrl` present AND not a `__…__` placeholder AND `location.protocol !== 'file:'`. Otherwise a stub client (getUser→null; signIn/signOut safe no-ops).
- Config: `window.dsvisualCloudConfig = { maccount: { workerBaseUrl: '__MACCOUNT_WORKER_URL__', appId: 'dsvisual' } }`; `inject-env.mjs` fills `__MACCOUNT_WORKER_URL__` from `MACCOUNT_WORKER_URL`.
- Drop entirely: `js/app.js` `getPrivateContext()` + Drive private-slides path; the 3 Firebase CDN `<script>` tags in `index.html`; `tests/cloud-private-slides.spec.js`; the `firebase` devDep in `package.json`.
- Do NOT modify generated/guarded files: `js/code_db.js`, `js/quiz_rendered.js`, `js/labs_rendered.js`, `js/slides_rendered.js`.
- Run: `npm run test:all` (full); unit only: `node --test tests/unit/cloud-integration.test.js`; one spec: `npx playwright test tests/<name>.spec.js --reporter=line`.
- Commit trailer `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. Branch `feat/maccount-auth`.

---

### Task 1: Config → maccount (`cloud-config.js` + `inject-env.mjs`)

**Files:**
- Modify: `js/cloud-config.js` (replace firebase/drive blocks)
- Modify: `scripts/inject-env.mjs` (placeholder map)
- Test: `tests/unit/inject_env_maccount.test.js`

**Interfaces:**
- Produces: `window.dsvisualCloudConfig = { maccount: { workerBaseUrl: '__MACCOUNT_WORKER_URL__', appId: 'dsvisual' } }`; `inject-env.mjs` maps `__MACCOUNT_WORKER_URL__` → `MACCOUNT_WORKER_URL`.

- [ ] **Step 1: Write the failing test**

```js
// tests/unit/inject_env_maccount.test.js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('cloud-config exposes the maccount block, no firebase/drive', () => {
  const src = fs.readFileSync(path.join(__dirname, '../../js/cloud-config.js'), 'utf8');
  assert.match(src, /maccount:/);
  assert.match(src, /workerBaseUrl:\s*'__MACCOUNT_WORKER_URL__'/);
  assert.match(src, /appId:\s*'dsvisual'/);
  assert.doesNotMatch(src, /firebase|FIREBASE|drive|DRIVE/i);
});

test('inject-env maps MACCOUNT_WORKER_URL, drops firebase placeholders', () => {
  const src = fs.readFileSync(path.join(__dirname, '../../scripts/inject-env.mjs'), 'utf8');
  assert.match(src, /__MACCOUNT_WORKER_URL__:\s*'MACCOUNT_WORKER_URL'/);
  assert.doesNotMatch(src, /FIREBASE|DRIVE_PRIVATE/);
});
```

- [ ] **Step 2: Run it — expect FAIL.** `node --test tests/unit/inject_env_maccount.test.js`

- [ ] **Step 3: Implement**

`js/cloud-config.js` — replace the whole config object:

```js
// Placeholder values are replaced by scripts/inject-env.mjs at build time.
// At runtime, window.dsvisualCloudConfig is consumed by cloud-integration.js
// (maccount SSO).
(function () {
  'use strict';
  window.dsvisualCloudConfig = {
    maccount: {
      workerBaseUrl: '__MACCOUNT_WORKER_URL__',
      appId: 'dsvisual',
    },
  };
})();
```

`scripts/inject-env.mjs` — replace the `PLACEHOLDERS` object with:

```js
const PLACEHOLDERS = {
  __MACCOUNT_WORKER_URL__: 'MACCOUNT_WORKER_URL',
};
```

- [ ] **Step 4: Run it — expect PASS.**

- [ ] **Step 5: Commit**

```bash
git add js/cloud-config.js scripts/inject-env.mjs tests/unit/inject_env_maccount.test.js
git commit -m "feat(auth): cloud-config + inject-env -> maccount worker URL"
```

---

### Task 2: Rewrite `cloud-integration.js` as the maccount client

**Files:**
- Modify: `js/cloud-integration.js` (full rewrite)
- Test: `tests/unit/cloud-integration.test.js` (rewrite for the new interface)

**Interfaces:**
- Consumes: `window.dsvisualCloudConfig.maccount` (Task 1).
- Produces: `window.cloudClient()` → `{ isConfigured, missingReason, getUser, subscribeAuthState, signIn, signOut, handleRedirect }`. `getUser()` → `{student_id, providers}|null`. `handleRedirect()` returns a Promise. Consumed by Task 3 (`cloud-drawer.js`).

- [ ] **Step 1: Write the failing test** (vm sandbox, mirroring the existing test's `loadIntegration` but with maccount shims)

```js
// tests/unit/cloud-integration.test.js  (REPLACE existing file)
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function load({ hash = '', configured = true, fetchImpl } = {}) {
  const store = new Map();
  const sandbox = {
    window: {},
    location: { protocol: 'http:', href: 'https://skhuang.github.io/dsvisual/', hash,
                assign(u) { this._assigned = u; } },
    history: { replaceState(_s, _t, url) { sandbox.location.href = url; } },
    sessionStorage: { getItem: (k) => (store.has(k) ? store.get(k) : null),
                      setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) },
    fetch: fetchImpl || (async () => ({ ok: true, json: async () => ({ student_id: 'S1', providers: { github: true, google: false } }) })),
    console,
  };
  sandbox.window.dsvisualCloudConfig = configured
    ? { maccount: { workerBaseUrl: 'https://maccount.example', appId: 'dsvisual' } }
    : { maccount: { workerBaseUrl: '__MACCOUNT_WORKER_URL__', appId: 'dsvisual' } };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../../js/cloud-integration.js'), 'utf8'), sandbox);
  return sandbox;
}

test('signIn redirects to /auth/app/start with app + encoded return', () => {
  const s = load();
  s.window.cloudClient().signIn();
  assert.equal(s.location._assigned,
    'https://maccount.example/auth/app/start?app=dsvisual&return=' + encodeURIComponent('https://skhuang.github.io/dsvisual/'));
});

test('handleRedirect: #mtoken -> verify -> getUser + fragment stripped', async () => {
  let posted = null;
  const s = load({ hash: '#mtoken=abc.def',
    fetchImpl: async (url, opts) => { posted = { url, body: JSON.parse(opts.body) };
      return { ok: true, json: async () => ({ student_id: 'S9', providers: { github: false, google: true } }) }; } });
  await s.window.cloudClient().handleRedirect();
  assert.equal(posted.url, 'https://maccount.example/api/app/verify');
  assert.equal(posted.body.token, 'abc.def');
  assert.deepEqual(s.window.cloudClient().getUser(), { student_id: 'S9', providers: { github: false, google: true } });
  assert.doesNotMatch(s.location.href, /mtoken/);   // fragment stripped
});

test('verify failure leaves user null', async () => {
  const s = load({ hash: '#mtoken=bad', fetchImpl: async () => ({ ok: false, json: async () => ({}) }) });
  await s.window.cloudClient().handleRedirect();
  assert.equal(s.window.cloudClient().getUser(), null);
});

test('signOut clears the user and notifies', async () => {
  const s = load({ hash: '#mtoken=abc' });
  const c = s.window.cloudClient();
  await c.handleRedirect();
  let seen = 'unset';
  c.subscribeAuthState((u) => { seen = u; });   // fires once with current, then on change
  c.signOut();
  assert.equal(c.getUser(), null);
  assert.equal(seen, null);
});

test('not configured -> stub, getUser null, signIn no-op', () => {
  const s = load({ configured: false });
  const c = s.window.cloudClient();
  assert.equal(c.isConfigured, false);
  assert.equal(c.getUser(), null);
  c.signIn();   // must not throw
  assert.equal(s.location._assigned, undefined);
});

test('no getAccessToken / DRIVE_SCOPES / firebase', () => {
  const s = load();
  assert.equal(typeof s.window.cloudClient().getAccessToken, 'undefined');
  assert.equal(s.window.DRIVE_SCOPES, undefined);
  assert.doesNotMatch(fs.readFileSync(path.join(__dirname, '../../js/cloud-integration.js'), 'utf8'), /firebase/i);
});
```

- [ ] **Step 2: Run it — expect FAIL.** `node --test tests/unit/cloud-integration.test.js`

- [ ] **Step 3: Implement** — replace `js/cloud-integration.js` entirely:

```js
// maccount SSO client for dsvisual. Singleton on window.cloudClient().
// Replaces the former Firebase/Drive integration. See B2 spec.
(function () {
  'use strict';

  const USER_KEY = 'dsvisual:maccount:user';
  let cachedClient = null;

  function isPlaceholder(v) { return !v || /^__.+__$/.test(v); }

  function stubClient(reason) {
    return {
      isConfigured: false, missingReason: reason,
      getUser() { return null; },
      subscribeAuthState(cb) { cb(null); return function () {}; },
      signIn() { /* no-op when unconfigured */ },
      signOut() { /* no-op */ },
      handleRedirect() { return Promise.resolve(); },
    };
  }

  function buildClient() {
    const cfg = (typeof window !== 'undefined' && window.dsvisualCloudConfig
                 && window.dsvisualCloudConfig.maccount) || null;
    if (typeof window !== 'undefined' && window.location && window.location.protocol === 'file:') {
      return stubClient('Sign-in requires http:// or https:// — not file://.');
    }
    if (!cfg || isPlaceholder(cfg.workerBaseUrl)) {
      return stubClient('maccount worker URL not configured.');
    }
    const base = cfg.workerBaseUrl.replace(/\/$/, '');
    const appId = cfg.appId || 'dsvisual';
    const subs = [];
    let user = readUser();

    function readUser() {
      try { const raw = sessionStorage.getItem(USER_KEY); return raw ? JSON.parse(raw) : null; }
      catch (e) { return null; }
    }
    function setUser(u) {
      user = u;
      try { if (u) sessionStorage.setItem(USER_KEY, JSON.stringify(u)); else sessionStorage.removeItem(USER_KEY); }
      catch (e) { /* ignore quota/availability */ }
      subs.forEach(function (cb) { try { cb(user); } catch (e) { /* ignore */ } });
    }

    return {
      isConfigured: true, missingReason: '',
      getUser() { return user; },
      subscribeAuthState(cb) {
        subs.push(cb); try { cb(user); } catch (e) { /* ignore */ }
        return function () { const i = subs.indexOf(cb); if (i >= 0) subs.splice(i, 1); };
      },
      signIn() {
        window.location.assign(base + '/auth/app/start?app=' + encodeURIComponent(appId)
          + '&return=' + encodeURIComponent(window.location.href));
      },
      signOut() { setUser(null); },
      async handleRedirect() {
        const hash = (window.location.hash || '');
        const m = hash.match(/[#&]mtoken=([^&]+)/);
        if (!m) return;
        const token = decodeURIComponent(m[1]);
        let res;
        try {
          res = await fetch(base + '/api/app/verify', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: token }),
          });
        } catch (e) { return; }
        if (!res || !res.ok) return;
        let data; try { data = await res.json(); } catch (e) { return; }
        if (!data || !data.student_id) return;
        // strip the fragment so the token doesn't linger in the URL/history
        try { window.history.replaceState(null, '', window.location.pathname + window.location.search); } catch (e) { /* ignore */ }
        setUser({ student_id: data.student_id, providers: data.providers || { github: false, google: false } });
      },
    };
  }

  function cloudClient() {
    if (cachedClient) return cachedClient;
    cachedClient = buildClient();
    return cachedClient;
  }

  window.cloudClient = cloudClient;
  // Kick off token exchange on load (safe no-op when there's no #mtoken).
  try { cloudClient().handleRedirect(); } catch (e) { /* ignore */ }
})();
```

- [ ] **Step 4: Run it — expect PASS.**

- [ ] **Step 5: Commit**

```bash
git add js/cloud-integration.js tests/unit/cloud-integration.test.js
git commit -m "feat(auth): rewrite cloud-integration as the maccount SSO client"
```

---

### Task 3: Update `cloud-drawer.js` + i18n

**Files:**
- Modify: `js/cloud-drawer.js` (use signIn/signOut; show student_id + providers)
- Modify: `js/i18n.js` (cloud.* copy, en + zh)
- Test: `tests/cloud-drawer.spec.js`

**Interfaces:**
- Consumes: `window.cloudClient()` (`getUser`→`{student_id,providers}`, `subscribeAuthState`, `signIn`, `signOut`, `isConfigured`, `missingReason`).

- [ ] **Step 1: Write the failing test** (Playwright; stub the client before scripts run)

```js
// tests/cloud-drawer.spec.js
const { test, expect } = require('@playwright/test');
const path = require('path');

async function withClient(page, user) {
  // Install a fake cloudClient BEFORE app scripts run.
  await page.addInitScript((u) => {
    let cur = u; const subs = [];
    window.cloudClient = () => ({
      isConfigured: true, missingReason: '',
      getUser: () => cur,
      subscribeAuthState: (cb) => { subs.push(cb); cb(cur); return () => {}; },
      signIn: () => { window.__signInCalled = true; },
      signOut: () => { cur = null; subs.forEach((cb) => cb(null)); },
      handleRedirect: () => Promise.resolve(),
    });
  }, user);
  await page.goto('file://' + path.resolve(__dirname, '../index.html'));
}

test('drawer shows sign-in when logged out; calls signIn', async ({ page }) => {
  await withClient(page, null);
  await page.locator('[data-testid="cloud-toggle"], #cloud-toggle, [data-cloud-open]').first().click().catch(() => {});
  // open the drawer via whatever control exists, then:
  await page.evaluate(() => document.getElementById('cloud-drawer')?.removeAttribute('hidden'));
  await page.evaluate(() => window.cloudDrawerOpen && window.cloudDrawerOpen());
  const signin = page.locator('[data-testid="cloud-signin-btn"]');
  await expect(signin).toBeVisible();
  await signin.click();
  expect(await page.evaluate(() => window.__signInCalled)).toBe(true);
});

test('drawer shows student_id + providers when logged in', async ({ page }) => {
  await withClient(page, { student_id: 'B10901', providers: { github: true, google: false } });
  await page.evaluate(() => window.cloudDrawerOpen && window.cloudDrawerOpen());
  const body = page.locator('#cloud-drawer-body');
  await expect(body).toContainText('B10901');
  await expect(body).toContainText(/GitHub/i);
});
```

> Note: this test needs a way to open the drawer. Read `js/cloud-drawer.js` for the existing open trigger/testid and use it (the fake `withClient` + `cloudDrawerOpen` calls above are placeholders for whatever the drawer actually exposes — adapt to the real open mechanism, e.g. a toolbar button `data-testid`). If the drawer exposes no programmatic open, add a minimal `window.cloudDrawerOpen` export or use the real toggle control.

- [ ] **Step 2: Run it — expect FAIL.** `npx playwright test tests/cloud-drawer.spec.js --reporter=line`

- [ ] **Step 3: Implement** — in `js/cloud-drawer.js` `render(body, client)`, replace the user branch to use maccount identity and `signIn/signOut`:

```js
  function render(body, client) {
    const user = client.getUser();
    if (user) {
      const provs = [];
      if (user.providers && user.providers.github) provs.push('GitHub');
      if (user.providers && user.providers.google) provs.push('Google');
      body.innerHTML =
        '<p class="cloud-drawer-user">' + t('cloud.current-user', { name: user.student_id }) + '</p>' +
        (provs.length ? '<p class="cloud-drawer-providers muted">' + t('cloud.linked') + ' ' + provs.join(', ') + '</p>' : '') +
        '<button type="button" class="btn secondary" id="cloud-signout-btn" data-testid="cloud-signout-btn">' + t('cloud.signout') + '</button>';
      body.querySelector('#cloud-signout-btn').addEventListener('click', function () {
        client.signOut();
        window.dispatchEvent(new CustomEvent('cloud-auth-changed', { detail: { signedIn: false } }));
      });
    } else {
      const isConfigured = client.isConfigured;
      const note = isConfigured ? t('cloud.signin-note') : (client.missingReason || 'Cloud not configured.');
      body.innerHTML =
        '<p class="cloud-drawer-note">' + note + '</p>' +
        '<button type="button" class="btn primary" id="cloud-signin-btn" data-testid="cloud-signin-btn"' + (isConfigured ? '' : ' disabled') + '>' + t('cloud.signin-cta') + '</button>';
      if (isConfigured) {
        body.querySelector('#cloud-signin-btn').addEventListener('click', function () {
          client.signIn();   // redirects; no await
        });
      }
    }
  }
```

In `js/i18n.js`, update the `cloud.*` keys (both en block ~200 and zh block ~468) and add `cloud.linked`:

```js
// en
'cloud.title': 'Sign in', 'cloud.signin-cta': 'Sign in with NYCU',
'cloud.signin-note': 'Sign in with your NYCU account (via maccount) to enable practice on dsjudge.',
'cloud.current-user': 'Signed in as {name}', 'cloud.linked': 'Linked:', 'cloud.signout': 'Sign out',
// zh
'cloud.title': '登入', 'cloud.signin-cta': '以 NYCU 帳號登入',
'cloud.signin-note': '以你的 NYCU 帳號登入(透過 maccount),即可在 dsjudge 練習。',
'cloud.current-user': '已登入：{name}', 'cloud.linked': '已綁定:', 'cloud.signout': '登出',
```

- [ ] **Step 4: Run it — expect PASS.**

- [ ] **Step 5: Commit**

```bash
git add js/cloud-drawer.js js/i18n.js tests/cloud-drawer.spec.js
git commit -m "feat(auth): cloud drawer uses maccount signIn/signOut + shows student_id/providers"
```

---

### Task 4: Remove Firebase/Drive/private-slides

**Files:**
- Modify: `js/app.js` (remove `getPrivateContext()` + Drive private-slides path)
- Modify: `index.html` (remove the 3 Firebase CDN `<script>` tags)
- Modify: `package.json` (remove `firebase` devDep)
- Delete: `tests/cloud-private-slides.spec.js`
- Test: `tests/unit/no_firebase_drive.test.js`

**Interfaces:** none produced; removes the dead Drive/Firebase surface.

- [ ] **Step 1: Write the failing test**

```js
// tests/unit/no_firebase_drive.test.js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'); const path = require('node:path');
const R = (p) => fs.readFileSync(path.join(__dirname, '../../', p), 'utf8');

test('no firebase/drive references remain', () => {
  assert.doesNotMatch(R('index.html'), /firebasejs|firebase-app|firebase-auth/i);
  assert.doesNotMatch(R('js/app.js'), /getPrivateContext|getAccessToken|privateSlidesFolderId|cfg\.drive/);
  assert.doesNotMatch(R('package.json'), /"firebase"/);
  assert.ok(!fs.existsSync(path.join(__dirname, '../../tests/cloud-private-slides.spec.js')));
});
```

- [ ] **Step 2: Run it — expect FAIL.**

- [ ] **Step 3: Implement**
- In `js/app.js`: delete `getPrivateContext()` and every call to it / use of its `token`/`folderId` (the private-slides Drive fetch path). Keep `publicSlidesFor()` and the public slides flow. If a caller merged public+private, reduce it to public only.
- In `index.html`: delete the three `https://www.gstatic.com/firebasejs/...` `<script>` lines.
- In `package.json`: remove the `"firebase": "^11.7.1",` devDependency line.
- `git rm tests/cloud-private-slides.spec.js`.

- [ ] **Step 4: Run it — expect PASS**, then the full suite: `npm run test:all`.

- [ ] **Step 5: Commit**

```bash
git add js/app.js index.html package.json tests/unit/no_firebase_drive.test.js
git commit -m "refactor(auth): remove Firebase SDK + Drive private-slides (maccount replaces them)"
```

---

## Final gate (after all tasks)

- [ ] `npm run test:all` — full suite green (quiz/lab/slides/viz unchanged; Docker-independent).
- [ ] Grep confirms: no `firebase`, `DRIVE_SCOPES`, `getAccessToken`, `getPrivateContext` anywhere; `js/cloud-integration.js` exposes `signIn/signOut/getUser/subscribeAuthState/handleRedirect`.
- [ ] Guarded generated files untouched: `js/code_db.js`, `js/quiz_rendered.js`, `js/labs_rendered.js`, `js/slides_rendered.js`.
- [ ] Open a PR to `main`. Deploy note: set `MACCOUNT_WORKER_URL` (dsvisual build env) to the maccount worker base URL, and ensure dsvisual's origin is in maccount's `APP_ALLOWLIST` (B1 deploy).

## Notes for sub-project C
- With `getUser()` now returning `{student_id, providers}`, wire the reserved "Practice on dsjudge" control in `js/lab.js` to be enabled only when `window.cloudClient().getUser()` is non-null, and point it at `dsjudgeUrl` (`ds2026summer.cs.nycu.edu.tw/bank/<slug>`) once that's filled in `labs/labs.json`.
