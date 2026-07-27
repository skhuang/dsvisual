# Fullscreen / Focus Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fullscreen focus toggle to the dsvisual app shell that collapses the page to only the active visualization window (hiding Title, Top Menu, Source code, and card chrome) and restores it via a floating button or Esc.

**Architecture:** A `viz-focus` class on `<body>` drives a CSS focus layer (hide chrome, expand the active `.method-section-visual` to `position:fixed; inset:0`). On enter, a real `document.documentElement.requestFullscreen()` is also requested; the two layers are kept in sync via a `fullscreenchange` handler. All logic lives in the existing `js/app.js` IIFE — no new script tags.

**Tech Stack:** Vanilla JS (no framework), plain CSS, Playwright e2e. Bilingual via `js/i18n.js` (`t()` + `data-i18n-*` attributes).

## Global Constraints

- Concurrent refactor sessions in this repo — targeted `git add` by explicit path only; never `git add -A`/`.`/`-u`; verify `git status` first.
- Never hand-edit generated files (`js/code_db.js`, `slides/**`, `js/slides_rendered.js`) — this feature touches none of them.
- Traditional Chinese (zh-Hant) for all zh copy.
- One branch (`feat/viz-fullscreen`, already created) + one PR. No new category ⇒ `.overview-category` count unchanged.
- e2e asserts ONLY the CSS-focus layer (class + visibility), NEVER OS-fullscreen state — headless Chromium fullscreen is flaky and `requestFullscreen` is wrapped so the focus layer is independent of it.

---

### Task 1: Presentation layer — i18n keys, floating exit button, CSS focus rules

Delivers the static/CSS half: the four i18n keys, the persistent floating exit button in `index.html`, and the `body.viz-focus` CSS block. Independently testable by toggling the class from a test and asserting the CSS behaviour, with no JS wiring yet.

**Files:**
- Modify: `js/i18n.js` (en dict after line 181 `'aria.viz-host'`; zh dict after line 430 `'aria.viz-host'`)
- Modify: `index.html` (insert a floating button between the `.app-container` closing `</div>` at line 355 and `<aside id="settings-drawer">` at line 357)
- Modify: `style.css` (append a new `body.viz-focus` block at end of file)
- Test: `tests/viz_fullscreen.spec.js` (create)

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces:
  - i18n keys (both dicts): `btn.fullscreen`, `btn.exit-fullscreen`, `aria.fullscreen-toggle`, `aria.exit-fullscreen`.
  - DOM: `#viz-focus-exit` button (class `.viz-focus-exit`), hidden until `body.viz-focus`.
  - CSS contract: `body.viz-focus` hides `.app-header`, `.app-category-nav`, `.method-sections-heading`, `.method-section-header`, `.code-drawer`, `.method-section-code`, `.method-section-card:not(.active)`; expands `.method-section-card.active .method-section-visual` to `position:fixed; inset:0`; shows `.viz-focus-exit`.

- [ ] **Step 1: Write the failing CSS-layer e2e test**

Create `tests/viz_fullscreen.spec.js`:

```js
const { test, expect } = require('@playwright/test'); const path = require('path');
const FILE_URI = 'file://' + path.resolve(__dirname, '../index.html');

test.describe('viz fullscreen focus mode', () => {
  test('CSS layer: toggling body.viz-focus hides chrome and reveals exit button', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=graph-scc');
    await expect(page.locator('.method-section-visual').first()).toBeVisible();

    // Baseline: chrome visible, exit button hidden.
    await expect(page.locator('.app-header')).toBeVisible();
    await expect(page.locator('.app-category-nav')).toBeVisible();
    await expect(page.locator('#viz-focus-exit')).toBeHidden();

    // Drive the CSS layer directly (no JS wiring yet).
    await page.evaluate(() => document.body.classList.add('viz-focus'));
    await expect(page.locator('.app-header')).toBeHidden();
    await expect(page.locator('.app-category-nav')).toBeHidden();
    await expect(page.locator('#viz-focus-exit')).toBeVisible();
    await expect(page.locator('.method-section-card.active .method-section-visual')).toBeVisible();

    await page.evaluate(() => document.body.classList.remove('viz-focus'));
    await expect(page.locator('.app-header')).toBeVisible();
    await expect(page.locator('#viz-focus-exit')).toBeHidden();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx playwright test tests/viz_fullscreen.spec.js`
Expected: FAIL — `#viz-focus-exit` does not exist yet (locator not found / not visible after adding class), and `.app-header` stays visible because the CSS block is absent.

- [ ] **Step 3: Add the four i18n keys to the `en` dict**

In `js/i18n.js`, immediately after line 181 (`'aria.viz-host': 'Active interactive visualization',`) insert:

```js
            'btn.fullscreen':               'Fullscreen',
            'btn.exit-fullscreen':          '✕ Exit fullscreen',
            'aria.fullscreen-toggle':       'Toggle fullscreen focus mode',
            'aria.exit-fullscreen':         'Exit fullscreen',
```

- [ ] **Step 4: Add the four i18n keys to the `zh` dict**

In `js/i18n.js`, immediately after line 430 (`'aria.viz-host': '互動式視覺化區域',`) insert:

```js
            'btn.fullscreen':               '全螢幕',
            'btn.exit-fullscreen':          '✕ 離開全螢幕',
            'aria.fullscreen-toggle':       '切換全螢幕專注模式',
            'aria.exit-fullscreen':         '離開全螢幕',
```

- [ ] **Step 5: Add the floating exit button to `index.html`**

In `index.html`, between the `.app-container` closing `</div>` (line 355) and `<aside id="settings-drawer" ...>` (line 357), insert:

```html
    <button type="button" id="viz-focus-exit" class="viz-focus-exit" hidden
            data-i18n-key="btn.exit-fullscreen"
            data-i18n-aria-label="aria.exit-fullscreen"
            aria-label="Exit fullscreen">✕ Exit fullscreen</button>
```

Note: the `hidden` attribute is only the pre-focus default; CSS (`body.viz-focus .viz-focus-exit { display:inline-flex }`) overrides it in focus mode. Because the CSS uses `display`, the `hidden` attribute must NOT gate visibility in focus mode — the CSS `display:none`/`display:inline-flex` pair below is authoritative, so add `.viz-focus-exit[hidden] { display:none }` is unnecessary (the attribute default already yields `display:none` via the base rule). Keep the base rule specific (see Step 6).

- [ ] **Step 6: Append the `body.viz-focus` CSS block to `style.css`**

At the very end of `style.css`, append:

```css

/* ---- Fullscreen / focus mode ---------------------------------------- */
/* Toggled by body.viz-focus (js/app.js). Hides all chrome, expands the   */
/* active visualization window to fill the viewport. Paired with a real   */
/* requestFullscreen() at the JS layer, but this layer stands alone.      */
body.viz-focus .app-header,
body.viz-focus .app-category-nav,
body.viz-focus .method-sections-heading,
body.viz-focus .method-section-header,
body.viz-focus .code-drawer,
body.viz-focus .method-section-code,
body.viz-focus .method-section-card:not(.active) {
    display: none !important;
}
body.viz-focus .method-section-card.active .method-section-visual {
    position: fixed;
    inset: 0;
    z-index: 2000;
    margin: 0;
    border-radius: 0;
    max-height: none;
    overflow: auto;
}
.viz-focus-exit {
    display: none;
    align-items: center;
    gap: 6px;
    padding: 0.55rem 0.85rem;
    border: 1px solid var(--card-border);
    border-radius: var(--app-radius-md);
    background: rgba(15, 23, 42, 0.85);
    color: #e2e8f0;
    font-weight: 800;
    font-size: 0.86rem;
    cursor: pointer;
}
.viz-focus-exit:hover { background: rgba(30, 41, 59, 0.95); }
body.viz-focus .viz-focus-exit {
    display: inline-flex;
    position: fixed;
    top: 12px;
    right: 12px;
    z-index: 2100;
}
```

Note: `.viz-focus-exit { display:none }` overrides the `hidden` attribute's default (both resolve to not-shown), and `body.viz-focus .viz-focus-exit { display:inline-flex }` wins by higher specificity in focus mode — so the button shows even though the `hidden` attribute is still present. This is intentional: visibility is CSS-driven, the attribute is never mutated at runtime.

- [ ] **Step 7: Run the test to verify it passes**

Run: `npx playwright test tests/viz_fullscreen.spec.js`
Expected: PASS — adding `body.viz-focus` hides `.app-header`/`.app-category-nav`, shows `#viz-focus-exit`, keeps the active visual visible; removing it restores.

- [ ] **Step 8: Commit**

```bash
git add js/i18n.js index.html style.css tests/viz_fullscreen.spec.js
git commit -m "feat(dsvisual): fullscreen focus mode — i18n + exit button + CSS layer"
```

---

### Task 2: Interaction layer — toggle button + focus module wiring

Delivers the JS half: the per-card toggle button and the focus module (`enterFocus`/`exitFocus`/`fullscreenchange` sync/Esc). Makes the toggle actually work end-to-end.

**Files:**
- Modify: `js/app.js` (button markup at line 633–634; new `initVizFocus()` module + its call near init at line 1427)
- Test: `tests/viz_fullscreen.spec.js` (extend with interaction tests)

**Interfaces:**
- Consumes (from Task 1): the `body.viz-focus` CSS contract, `#viz-focus-exit` button, i18n keys `btn.fullscreen` / `aria.fullscreen-toggle`.
- Produces: a `.viz-focus-toggle` button (`data-testid="viz-focus-toggle"`, `aria-pressed`) inside each active card's `.method-section-actions`; an `initVizFocus()` function wired once at init that owns enter/exit/sync.

- [ ] **Step 1: Write the failing interaction e2e tests**

Append to `tests/viz_fullscreen.spec.js`, inside the existing `test.describe(...)` block (before its closing `});`):

```js
  test('toggle button enters focus mode; exit button restores', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=graph-scc');
    const toggle = page.locator('.method-section-card.active .viz-focus-toggle');
    await expect(toggle).toBeVisible();
    await expect(page.locator('body')).not.toHaveClass(/viz-focus/);

    await toggle.click();
    await expect(page.locator('body')).toHaveClass(/viz-focus/);
    await expect(page.locator('.app-header')).toBeHidden();
    await expect(page.locator('#viz-focus-exit')).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');

    await page.locator('#viz-focus-exit').click();
    await expect(page.locator('body')).not.toHaveClass(/viz-focus/);
    await expect(page.locator('.app-header')).toBeVisible();
    await expect(page.locator('#viz-focus-exit')).toBeHidden();
  });

  test('Escape exits focus mode', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=graph-scc');
    const toggle = page.locator('.method-section-card.active .viz-focus-toggle');
    await toggle.click();
    await expect(page.locator('body')).toHaveClass(/viz-focus/);
    await page.keyboard.press('Escape');
    await expect(page.locator('body')).not.toHaveClass(/viz-focus/);
    await expect(page.locator('.app-header')).toBeVisible();
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx playwright test tests/viz_fullscreen.spec.js`
Expected: the two new tests FAIL — `.viz-focus-toggle` does not exist, so `toggle.click()` times out; body never gets `viz-focus`. (The Task 1 CSS-layer test still passes.)

- [ ] **Step 3: Add the toggle button to the card actions markup**

In `js/app.js`, in `renderMethodSections`, find (around line 633–634):

```js
                    ${useCodeDrawer ? `<button type="button" class="btn secondary code-drawer-toggle" data-testid="code-drawer-toggle" aria-expanded="false" aria-haspopup="dialog">&lt;/&gt; ${method.file}</button>` : ''}
                    <button type="button" class="btn secondary method-slides-btn" data-method="${method.id}">Slides</button>
```

Insert the toggle button between those two lines:

```js
                    ${useCodeDrawer ? `<button type="button" class="btn secondary code-drawer-toggle" data-testid="code-drawer-toggle" aria-expanded="false" aria-haspopup="dialog">&lt;/&gt; ${method.file}</button>` : ''}
                    <button type="button" class="btn secondary viz-focus-toggle" data-testid="viz-focus-toggle" aria-pressed="false" data-i18n-aria-label="aria.fullscreen-toggle" aria-label="Toggle fullscreen focus mode" title="${t('btn.fullscreen')}">⛶ ${t('btn.fullscreen')}</button>
                    <button type="button" class="btn secondary method-slides-btn" data-method="${method.id}">Slides</button>
```

- [ ] **Step 4: Add the `initVizFocus()` module and call it at init**

In `js/app.js`, immediately after `bindDifficultySelect();` (line 1427), insert the call:

```js
    bindDifficultySelect();
    initVizFocus();
```

Then, still inside the app IIFE (place it just below the `switchMode` function that ends at line 1455, so it is in scope; function declarations hoist so the earlier call is fine), add:

```js
    function initVizFocus() {
        const body = document.body;
        const exitBtn = document.getElementById('viz-focus-exit');
        const fsElement = () => document.fullscreenElement || document.webkitFullscreenElement || null;
        const fsRequest = (el) => {
            const fn = el.requestFullscreen || el.webkitRequestFullscreen;
            return fn ? fn.call(el) : null;
        };
        const fsExit = () => {
            const fn = document.exitFullscreen || document.webkitExitFullscreen;
            if (fn) fn.call(document);
        };
        const setPressed = (on) => {
            const btn = document.querySelector('.method-section-card.active .viz-focus-toggle');
            if (btn) btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        };
        const onKeydown = (e) => { if (e.key === 'Escape') exitFocus(); };
        function enterFocus() {
            if (body.classList.contains('viz-focus')) return;
            body.classList.add('viz-focus');
            setPressed(true);
            document.addEventListener('keydown', onKeydown);
            try { const p = fsRequest(document.documentElement); if (p && p.catch) p.catch(() => {}); } catch (_) {}
        }
        function exitFocus() {
            if (!body.classList.contains('viz-focus')) return;
            body.classList.remove('viz-focus');
            setPressed(false);
            document.removeEventListener('keydown', onKeydown);
            if (fsElement()) { try { fsExit(); } catch (_) {} }
        }
        const onFsChange = () => {
            if (!fsElement() && body.classList.contains('viz-focus')) exitFocus();
        };
        document.addEventListener('click', (e) => {
            if (e.target && e.target.closest && e.target.closest('.viz-focus-toggle')) {
                if (body.classList.contains('viz-focus')) exitFocus(); else enterFocus();
            }
        });
        if (exitBtn) exitBtn.addEventListener('click', exitFocus);
        document.addEventListener('fullscreenchange', onFsChange);
        document.addEventListener('webkitfullscreenchange', onFsChange);
    }
```

Design notes for the reviewer: the toggle uses ONE delegated `document` click listener (survives every `renderMethodSections` re-render — no per-render re-wiring). `requestFullscreen` is wrapped so a rejection/absence never breaks the CSS layer. `onFsChange` drops the class when OS fullscreen ends by any means (native Esc/F11), keeping the two layers in sync without recursion (`fsElement()` is already null there, so `exitFocus` won't call `fsExit`).

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx playwright test tests/viz_fullscreen.spec.js`
Expected: PASS — all three tests green (CSS layer + toggle enter/exit + Escape).

- [ ] **Step 6: Run the full Playwright suite (no regression)**

Run: `npm test`
Expected: all specs green, including `smoke_modes`, `frame_controls`, `graph_scc`, code-drawer, category-nav, overview — the new delegated click listener and CSS must not interfere.

- [ ] **Step 7: Commit**

```bash
git add js/app.js tests/viz_fullscreen.spec.js
git commit -m "feat(dsvisual): fullscreen focus mode — toggle button + focus module (enter/exit/Esc/sync)"
```

---

## Self-Review

**1. Spec coverage:**
- Enter/hide chrome + expand visual → Task 1 CSS block + Task 2 toggle. ✓
- Both-combined mechanism (CSS + requestFullscreen) → Task 2 `enterFocus` requests fullscreen on `documentElement`. ✓
- Floating exit button + Esc → Task 1 button markup/CSS; Task 2 `exitBtn` click + `onKeydown`. ✓
- Layer sync (exit either exits both) → Task 2 `onFsChange`. ✓
- Toggle only when a live viz is active → button rendered inside the active card only. ✓
- Bilingual, localises live → Task 1 keys + `t()` at render (re-rendered on `languagechange`) + `data-i18n-*` on the static exit button. ✓
- e2e asserts CSS layer only, never OS-fullscreen → both test tasks assert class/visibility/aria only. ✓

**2. Placeholder scan:** No TBD/TODO; every code step shows full code; every command has expected output. ✓

**3. Type/name consistency:** `.viz-focus-toggle`, `#viz-focus-exit`/`.viz-focus-exit`, `body.viz-focus`, `data-testid="viz-focus-toggle"`, `aria-pressed`, i18n keys `btn.fullscreen`/`btn.exit-fullscreen`/`aria.fullscreen-toggle`/`aria.exit-fullscreen` — used identically across index.html, style.css, app.js, and both test tasks. ✓
