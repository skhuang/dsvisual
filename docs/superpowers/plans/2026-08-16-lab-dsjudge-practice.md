# Lab "Practice on dsjudge" login gating (C) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire dsvisual's reserved "Practice on dsjudge" lab button to the dsjudge public bank (`/bank/<slug>`), gated on maccount login, as a reusable three-state control.

**Architecture:** In `js/lab.js` `render()`, the `dsjudge` control becomes three states driven by `lab.dsjudgeUrl` + `window.cloudClient().getUser()`: no-URL → disabled "coming soon"; URL + logged-out → a "Sign in to practice" button calling `client.signIn()`; URL + logged-in (or client unconfigured) → an enabled bank link. The lab viewer subscribes to auth changes while open so the button flips live, and unsubscribes on close. Two i18n keys are added (en+zh). No data change (dijkstra's `dsjudgeUrl` stays null until the 2026-08-19 go-live); the mechanism is proven with a test fixture.

**Tech Stack:** Vanilla JS (IIFE on `window`), the maccount client `window.cloudClient()` from `js/cloud-integration.js`, `js/i18n.js`; tests via Playwright (`tests/*.spec.js`).

## Global Constraints

- The control has exactly three states, keyed by `lab.dsjudgeUrl` (from `LAB_RENDERED`) and `client.getUser()`:
  - **A. no `dsjudgeUrl`** → `<button data-testid="lab-dsjudge" disabled aria-disabled="true">` with `t('lab.dsjudgeSoon')` (unchanged behavior).
  - **B. `dsjudgeUrl` present, client configured, logged OUT** (`client && client.isConfigured && !user`) → `<button data-testid="lab-dsjudge-signin">` with `t('lab.dsjudgeSignin')`; clicking calls `client.signIn()`.
  - **C. `dsjudgeUrl` present, logged IN OR client not configured** (`user` truthy, OR `!client || !client.isConfigured`) → `<a data-testid="lab-dsjudge" href="<dsjudgeUrl>" target="_blank" rel="noopener">` with `t('lab.dsjudgePractice')`.
- The lab viewer subscribes via `client.subscribeAuthState(() => { if (state) render(); })` on open, stores the unsubscribe on `state.unsub`, and calls it on close. Subscribe only when a client exists.
- `client` is read lazily at render time via `window.cloudClient && window.cloudClient()` — never cached across renders.
- i18n keys added to BOTH the en and zh blocks of `js/i18n.js`: `lab.dsjudgePractice` (en "Practice on dsjudge" / zh "到 dsjudge 練習") and `lab.dsjudgeSignin` (en "Sign in to practice on dsjudge" / zh "登入後到 dsjudge 練習"). Keep `lab.dsjudgeSoon`.
- Do NOT modify `labs/labs.json` or the generated `js/labs_rendered.js` (dijkstra `dsjudgeUrl` stays null — the 08-19 go-live handles data). Do NOT modify other generated files (`js/code_db.js`, `js/quiz_rendered.js`, `js/slides_rendered.js`).
- Run: `npm run test:all` (full). One spec: `npx playwright test tests/lab-dsjudge.spec.js --reporter=line`. Playwright may show transient machine-load flakes — re-run a failing spec in isolation to confirm it's a flake, not a regression.
- Commit trailer `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. Branch `feat/lab-dsjudge-practice`.

---

### Task 1: Three-state Practice-on-dsjudge control + auth subscription + i18n

**Files:**
- Modify: `js/lab.js` (render 3-state control, sign-in click, subscribe/unsubscribe)
- Modify: `js/i18n.js` (two keys × en/zh)
- Test: `tests/lab-dsjudge.spec.js`

**Interfaces:**
- Consumes: `window.LAB_RENDERED[methodId]` (array of labs; each has `dsjudgeUrl`, `repoUrl`, `slug`, `titleZh/En`, `statementHtml{zh,en}`, `samples[]`, `difficulty`, `week`); `window.cloudClient()` → `{ isConfigured, getUser()→{student_id,providers}|null, subscribeAuthState(cb)→unsub, signIn() }`.
- Produces: no new global surface (mutates the existing `window.LabViewer.open/close` behavior).

- [ ] **Step 1: Write the failing test**

```js
// tests/lab-dsjudge.spec.js
const { test, expect } = require('@playwright/test');
const path = require('path');

const FILE_URL = 'file://' + path.resolve(__dirname, '../index.html');

const FIXTURE = {
  'has-url': [{
    slug: 'fixture', titleZh: '測試', titleEn: 'Fixture', difficulty: 1, week: 1,
    tags: [], repoUrl: 'https://example.com/repo',
    dsjudgeUrl: 'https://ds2026summer.cs.nycu.edu.tw/bank/fixture',
    statementHtml: { zh: '<p>敘述</p>', en: '<p>stmt</p>' }, samples: [{ in: '1', out: '2' }],
  }],
  'no-url': [{
    slug: 'nofix', titleZh: '無', titleEn: 'NoUrl', difficulty: 1, week: 1,
    tags: [], repoUrl: 'https://example.com/repo', dsjudgeUrl: null,
    statementHtml: { zh: '<p>x</p>', en: '<p>x</p>' }, samples: [{ in: '1', out: '2' }],
  }],
};

// Install fixtures AFTER load. lab.js reads window.LAB_RENDERED and
// window.cloudClient LAZILY at render time, so overwriting the real globals
// post-load is sufficient (no pre-load locked-getter trick needed — unlike
// the cloud-drawer which binds its client at load).
async function setup(page, { loggedIn = false, configured = true, hasClient = true } = {}) {
  await page.goto(FILE_URL);
  await page.evaluate(({ fixture, loggedIn, configured, hasClient }) => {
    window.LAB_RENDERED = fixture;
    if (!hasClient) { try { delete window.cloudClient; } catch (e) { window.cloudClient = undefined; } return; }
    const st = { user: loggedIn ? { student_id: 'B1', providers: { github: true, google: false } } : null, cbs: [], signInCalls: 0 };
    window.__labAuth = st;
    const client = {
      isConfigured: configured,
      getUser: () => st.user,
      subscribeAuthState: (cb) => { st.cbs.push(cb); cb(st.user); return () => { st.cbs = st.cbs.filter((x) => x !== cb); }; },
      signIn: () => { st.signInCalls += 1; },
      signOut: () => {},
    };
    window.cloudClient = () => client;
    window.__setUser = (u) => { st.user = u; st.cbs.slice().forEach((cb) => cb(u)); };
  }, { fixture: FIXTURE, loggedIn, configured, hasClient });
}

test('A: no dsjudgeUrl -> disabled coming-soon button', async ({ page }) => {
  await setup(page, { loggedIn: false });
  await page.evaluate(() => window.LabViewer.open('no-url'));
  const el = page.locator('[data-testid="lab-dsjudge"]');
  await expect(el).toBeVisible();
  await expect(el).toBeDisabled();
  await expect(page.locator('[data-testid="lab-dsjudge-signin"]')).toHaveCount(0);
});

test('B: dsjudgeUrl + logged out -> sign-in button calls signIn()', async ({ page }) => {
  await setup(page, { loggedIn: false });
  await page.evaluate(() => window.LabViewer.open('has-url'));
  const btn = page.locator('[data-testid="lab-dsjudge-signin"]');
  await expect(btn).toBeVisible();
  await expect(page.locator('a[data-testid="lab-dsjudge"]')).toHaveCount(0);
  await btn.click();
  expect(await page.evaluate(() => window.__labAuth.signInCalls)).toBe(1);
});

test('C: dsjudgeUrl + logged in -> enabled bank link', async ({ page }) => {
  await setup(page, { loggedIn: true });
  await page.evaluate(() => window.LabViewer.open('has-url'));
  const link = page.locator('a[data-testid="lab-dsjudge"]');
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('href', 'https://ds2026summer.cs.nycu.edu.tw/bank/fixture');
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(page.locator('[data-testid="lab-dsjudge-signin"]')).toHaveCount(0);
});

test('D: logging in while open flips sign-in button to bank link', async ({ page }) => {
  await setup(page, { loggedIn: false });
  await page.evaluate(() => window.LabViewer.open('has-url'));
  await expect(page.locator('[data-testid="lab-dsjudge-signin"]')).toBeVisible();
  await page.evaluate(() => window.__setUser({ student_id: 'B2', providers: { github: false, google: true } }));
  await expect(page.locator('a[data-testid="lab-dsjudge"]')).toBeVisible();
  await expect(page.locator('[data-testid="lab-dsjudge-signin"]')).toHaveCount(0);
});

test('E: client not configured -> enabled link fallback', async ({ page }) => {
  await setup(page, { configured: false });
  await page.evaluate(() => window.LabViewer.open('has-url'));
  await expect(page.locator('a[data-testid="lab-dsjudge"]')).toBeVisible();
  await expect(page.locator('[data-testid="lab-dsjudge-signin"]')).toHaveCount(0);
});

test('F: close unsubscribes (later auth change does not throw / re-render)', async ({ page }) => {
  await setup(page, { loggedIn: false });
  await page.evaluate(() => window.LabViewer.open('has-url'));
  await page.evaluate(() => window.LabViewer.close());
  // subscriber count should be back to 0 after close
  expect(await page.evaluate(() => window.__labAuth.cbs.length)).toBe(0);
  // firing an auth change after close must not throw and must not repopulate the hidden body
  await page.evaluate(() => window.__setUser({ student_id: 'B3', providers: { github: true, google: false } }));
  await expect(page.locator('#lab-viewer')).toBeHidden();
});
```

- [ ] **Step 2: Run the test — expect FAIL** (`lab-dsjudge-signin` testid doesn't exist yet; subscription/unsub not implemented).

Run: `npx playwright test tests/lab-dsjudge.spec.js --reporter=line`

- [ ] **Step 3: Implement — `js/lab.js`**

Add a client helper and a control-builder, and use them in `render()`; wire the sign-in click after `innerHTML`; subscribe in `open()`; unsubscribe in `close()`.

Add near the top (after `esc`):

```js
  function getClient() { return (global.cloudClient) ? global.cloudClient() : null; }

  function dsjudgeControlHtml(lab, client, user) {
    if (!lab.dsjudgeUrl) {
      return '<button type="button" class="btn secondary" data-testid="lab-dsjudge" aria-disabled="true" disabled>'
        + t('lab.dsjudgeSoon', 'Practice on dsjudge (coming soon)') + '</button>';
    }
    if (client && client.isConfigured && !user) {
      return '<button type="button" class="btn secondary" data-testid="lab-dsjudge-signin">'
        + t('lab.dsjudgeSignin', 'Sign in to practice on dsjudge') + '</button>';
    }
    return '<a class="btn secondary" data-testid="lab-dsjudge" href="' + lab.dsjudgeUrl + '" target="_blank" rel="noopener">'
      + t('lab.dsjudgePractice', 'Practice on dsjudge') + '</a>';
  }
```

In `render()`, replace the existing two-state `dsjudgeControl` (lines 37-39) with:

```js
    var client = getClient();
    var user = (client && client.getUser) ? client.getUser() : null;
    var dsjudgeControl = dsjudgeControlHtml(lab, client, user);
```

Then, immediately AFTER the `body.innerHTML = ...` assignment (before the `lab-lang-toggle` line), add the sign-in click binding:

```js
    var signinBtn = body.querySelector('[data-testid="lab-dsjudge-signin"]');
    if (signinBtn) signinBtn.addEventListener('click', function () { var c = getClient(); if (c && c.signIn) c.signIn(); });
```

In `open()`, after `overlay.hidden = false; document.body.style.overflow = 'hidden';`, add the subscription:

```js
    var client = getClient();
    if (client && client.subscribeAuthState) {
      state.unsub = client.subscribeAuthState(function () { if (state) render(); });
    }
```

Replace `close()` with:

```js
  function close() {
    if (state && state.unsub) { try { state.unsub(); } catch (e) { /* ignore */ } state.unsub = null; }
    if (overlay) { overlay.hidden = true; document.body.style.overflow = ''; }
    state = null;
  }
```

- [ ] **Step 4: Implement — `js/i18n.js`**

In the en block, right after the `'lab.dsjudgeSoon':` line (~188), add:

```js
            'lab.dsjudgePractice':          'Practice on dsjudge',
            'lab.dsjudgeSignin':            'Sign in to practice on dsjudge',
```

In the zh block, right after the `'lab.dsjudgeSoon':` line (~453), add:

```js
            'lab.dsjudgePractice':          '到 dsjudge 練習',
            'lab.dsjudgeSignin':            '登入後到 dsjudge 練習',
```

- [ ] **Step 5: Run the test — expect PASS**, then the full suite.

Run: `npx playwright test tests/lab-dsjudge.spec.js --reporter=line` then `npm run test:all`
Expected: the 6 new tests pass; full suite green (existing lab specs unchanged; if a Playwright spec flakes under load, re-run it in isolation to confirm).

- [ ] **Step 6: Commit**

```bash
git add js/lab.js js/i18n.js tests/lab-dsjudge.spec.js
git commit -m "feat(lab): login-gated Practice-on-dsjudge control (C)"
```

---

## Final gate (after the task)

- [ ] `npm run test:all` — full suite green.
- [ ] Grep confirms the three states use `data-testid="lab-dsjudge"` (A disabled button / C link) and `data-testid="lab-dsjudge-signin"` (B), and `close()` clears `state.unsub`.
- [ ] `labs/labs.json` and generated files untouched (dijkstra `dsjudgeUrl` still null).
- [ ] Open a PR to `main`.

## Post-2026-08-19 go-live (NOT part of this build — documented for the coordinated launch)
- dsjudge: flip `problems/dijkstra/meta.yaml` `bank.public` → `true` and reindex/deploy.
- dsvisual: set the dijkstra lab's `dsjudgeUrl` to `https://ds2026summer.cs.nycu.edu.tw/bank/dijkstra` in `labs/labs.json`, run `npm run build:labs`, deploy. Ship both together so the link resolves.
