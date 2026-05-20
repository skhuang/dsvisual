# UX Polish Implementation Plan: Code Density + Visualizer Zoom

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two small UI improvements: a global, persistent slider for code-panel line-height (in a new settings drawer) and per-visualizer zoom controls (buttons + mouse wheel + touch pinch, 50%–200%, reset on method switch).

**Architecture:** Density uses a CSS custom property `--code-line-height` driven by a slider stored in localStorage; applies to all `.code-panel-body` (App panels + slide-viewer). Zoom wraps the visualizer content in a `.viz-body-scaled` div via `mountActiveRuntime` and applies `transform: scale(var(--viz-zoom))`; controls sit absolutely-positioned in `.method-section-visual`; state is per-section and ephemeral.

**Tech Stack:** Vanilla browser JS, CSS custom properties, localStorage, Playwright. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-05-20-ux-polish-density-zoom-design.md`

---

## File Structure

**Modify:**
- `index.html` — header gets `<button id="settings-toggle">⚙</button>`; body gets `<aside id="settings-drawer">…</aside>`.
- `app.js` — modify `mountActiveRuntime` (around line 303) to wrap visualizer in `.viz-body-scaled` and insert `.viz-zoom-controls`; add three init functions (`bindSettingsDrawer`, `bindDensitySlider`, `applySavedDensity`) called once during app boot; add `bindZoomControls` invoked per `mountActiveRuntime` call.
- `style.css` — add `:root { --code-line-height: 1.55; }`; replace hard-coded `line-height: 1.55` in `.code-panel-body`; add styles for `.settings-toggle`, `.settings-drawer`/`.settings-drawer-panel`/`.settings-drawer-backdrop`, `.settings-row`, `.viz-body-scaled`, `.viz-zoom-controls`, `.method-section-visual { position: relative; overflow: auto; }`.

**Create:**
- `tests/ux_polish.spec.js` — 6–8 Playwright tests for density + zoom.

**Not modified:**
- Any visualizer logic, animation code, `slides_db.js`, `slides_rendered.js`, `build_slides.js`, `build_db.js`, `code_db.js`, `.cpp` sources, `vendor/`.

---

## Data Shapes

**Density:**
- CSS custom property `--code-line-height` on `:root`. Default `1.55`.
- localStorage key: `dsvisual.codeDensity`. Value is a string like `"1.35"` (the line-height value).
- Slider range: `min=1.0`, `max=1.8`, `step=0.05`, default `1.55`.

**Zoom:**
- CSS custom property `--viz-zoom` on each `.viz-body-scaled`. Default `1.0`.
- Per-section state stored in a JS Map keyed by section element (no DOM dataset to avoid string parsing).
- Range: `0.5` to `2.0`. Button step: `0.1`. Wheel step: `0.05`. Pinch: continuous ratio.
- Reset button text mirrors current %: `100%` at 1.0, `120%` at 1.2, etc.

---

## Task 1: CSS variable + settings drawer scaffolding (no JS wiring yet)

**Files:**
- Modify: `style.css`, `index.html`

- [ ] **Step 1: Add the CSS custom property and switch `.code-panel-body` to it**

In `/Users/skhuang/course/dsvisual/style.css`, add at the very top (right after any existing `@import` / before any selector):
```css
:root {
    --code-line-height: 1.55;
}
```

Find the existing rule (search for `line-height: 1.55` inside `.code-panel-body`) and change ONLY that value:
```css
.code-panel-body {
    /* …existing properties… */
    line-height: var(--code-line-height);
    /* …existing properties… */
}
```
Leave all other `.code-panel-body` properties (font-size, padding, max-height, color, etc.) untouched.

- [ ] **Step 2: Add the settings-drawer styles**

Append to the end of `/Users/skhuang/course/dsvisual/style.css`:
```css
/* ----- Settings drawer (UX polish) ----- */
.settings-toggle {
    background: transparent;
    border: 1px solid var(--border, #cbd5e1);
    color: inherit;
    border-radius: 999px;
    width: 36px;
    height: 36px;
    font-size: 18px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}
.settings-toggle:hover { background: rgba(0, 0, 0, 0.04); }

.settings-drawer {
    position: fixed;
    inset: 0;
    z-index: 200;
    display: flex;
    justify-content: flex-end;
    pointer-events: none;
}
.settings-drawer.open { pointer-events: auto; }
.settings-drawer[hidden] { display: none; }
.settings-drawer-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(15, 23, 42, 0.4);
    border: 0;
    cursor: pointer;
}
.settings-drawer-panel {
    position: relative;
    background: #ffffff;
    width: 360px;
    max-width: 90vw;
    height: 100vh;
    box-shadow: -8px 0 24px rgba(15, 23, 42, 0.18);
    display: flex;
    flex-direction: column;
    animation: slideInRight 0.25s ease;
}
@keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
.settings-drawer-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border, #e2e8f0);
}
.settings-drawer-header h2 {
    margin: 0;
    font-size: 1rem;
}
.settings-drawer-close {
    width: 32px;
    height: 32px;
    border: 0;
    background: transparent;
    font-size: 22px;
    cursor: pointer;
    color: var(--muted, #64748b);
}
.settings-drawer-body {
    flex: 1;
    overflow: auto;
    padding: 16px 20px;
}
.settings-row {
    display: flex;
    flex-direction: column;
    gap: 8px;
}
.settings-row label {
    font-weight: 600;
    font-size: 0.9rem;
}
.settings-row-controls {
    display: flex;
    align-items: center;
    gap: 10px;
}
.settings-row-controls input[type="range"] {
    flex: 1;
}
.settings-row-controls #code-density-value {
    font-family: 'Fira Code', monospace;
    font-size: 0.85rem;
    width: 3em;
    text-align: right;
}
.settings-row-controls #code-density-reset {
    border: 1px solid var(--border, #cbd5e1);
    background: #fff;
    border-radius: 999px;
    padding: 4px 10px;
    font-size: 0.75rem;
    cursor: pointer;
}

@media (prefers-color-scheme: dark) {
    .settings-drawer-panel { background: #0f172a; color: #e2e8f0; }
    .settings-drawer-header { border-bottom-color: #1e293b; }
    .settings-row-controls #code-density-reset { background: #1e293b; border-color: #334155; color: #e2e8f0; }
}
```

- [ ] **Step 3: Add the `⚙` toggle to the header**

Read `/Users/skhuang/course/dsvisual/index.html` and find the existing header element (search for `<header` or for an element near the page title). Add the toggle button as the LAST child of the header (so it sits to the right of existing nav):
```html
<button id="settings-toggle" type="button" class="settings-toggle" aria-label="Open settings">⚙</button>
```

- [ ] **Step 4: Add the drawer markup before `</body>`**

In `/Users/skhuang/course/dsvisual/index.html`, immediately before the closing `</body>` tag (or just before the existing `<script>` block, whichever appears first), insert:
```html
<aside id="settings-drawer" class="settings-drawer" hidden>
    <button type="button" class="settings-drawer-backdrop" data-settings-close aria-label="Close settings"></button>
    <section class="settings-drawer-panel" role="dialog" aria-modal="true" aria-labelledby="settings-drawer-title" tabindex="-1">
        <header class="settings-drawer-header">
            <h2 id="settings-drawer-title">設定 / Settings</h2>
            <button type="button" class="settings-drawer-close" data-settings-close aria-label="Close">×</button>
        </header>
        <div class="settings-drawer-body">
            <section class="settings-row">
                <label for="code-density-slider">程式碼面板行距 / Code panel line-height</label>
                <div class="settings-row-controls">
                    <input id="code-density-slider" type="range" min="1.0" max="1.8" step="0.05" value="1.55">
                    <span id="code-density-value">1.55</span>
                    <button id="code-density-reset" type="button">Reset</button>
                </div>
            </section>
        </div>
    </section>
</aside>
```

- [ ] **Step 5: Verify page still loads and existing tests pass**

Run: `npm run test:all`
Expected: 44 unit + 43 Playwright = 87/87 still green. The drawer is hidden by default and the toggle button does nothing yet (Task 2 wires it).

Quick browser sanity (delete after):
```js
// /Users/skhuang/course/dsvisual/check_drawer_dom.js
const { chromium } = require('@playwright/test');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + path.resolve(process.cwd(), 'index.html'));
  await page.waitForSelector('#settings-toggle');
  console.log('toggle visible:', await page.locator('#settings-toggle').isVisible());
  console.log('drawer hidden:', await page.locator('#settings-drawer').isHidden());
  console.log('density slider in DOM:', await page.locator('#code-density-slider').count());
  const lh = await page.locator('.code-panel-body').first().evaluate((el) => getComputedStyle(el).lineHeight);
  console.log('code-panel-body line-height:', lh, '(expect ~21.08px — 13.6 * 1.55)');
  await browser.close();
})();
```
Run: `node /Users/skhuang/course/dsvisual/check_drawer_dom.js`, then `rm /Users/skhuang/course/dsvisual/check_drawer_dom.js`.
Expected: toggle visible: true, drawer hidden: true, slider count: 1, line-height ≈ 21px.

- [ ] **Step 6: Commit**

```bash
git add index.html style.css
git commit -m "feat: add settings drawer scaffolding and code-line-height CSS var"
```

---

## Task 2: Density slider JS — wire drawer open/close + slider + persistence

**Files:**
- Modify: `app.js`
- Create: `tests/ux_polish.spec.js`

- [ ] **Step 1: Add the JS functions inside the existing app IIFE**

In `/Users/skhuang/course/dsvisual/app.js`, find a logical place near the existing `bindSlideLangToggle` or similar bindings (search for `slideLangToggle.addEventListener`). Add these three functions in the same scope:

```js
    const DENSITY_STORAGE_KEY = 'dsvisual.codeDensity';

    function applySavedDensity() {
        const v = localStorage.getItem(DENSITY_STORAGE_KEY);
        if (v) document.documentElement.style.setProperty('--code-line-height', v);
    }

    function bindSettingsDrawer() {
        const toggle = document.getElementById('settings-toggle');
        const drawer = document.getElementById('settings-drawer');
        if (!toggle || !drawer) return;
        const closers = drawer.querySelectorAll('[data-settings-close]');
        const panel = drawer.querySelector('.settings-drawer-panel');
        function onKeydown(e) {
            if (e.key === 'Escape') close();
        }
        function open() {
            drawer.hidden = false;
            drawer.classList.add('open');
            panel.focus();
            document.addEventListener('keydown', onKeydown);
        }
        function close() {
            drawer.hidden = true;
            drawer.classList.remove('open');
            document.removeEventListener('keydown', onKeydown);
        }
        toggle.addEventListener('click', open);
        closers.forEach((btn) => btn.addEventListener('click', close));
    }

    function bindDensitySlider() {
        const slider = document.getElementById('code-density-slider');
        const display = document.getElementById('code-density-value');
        const resetBtn = document.getElementById('code-density-reset');
        if (!slider || !display || !resetBtn) return;
        const saved = localStorage.getItem(DENSITY_STORAGE_KEY) || '1.55';
        slider.value = saved;
        display.textContent = saved;
        slider.addEventListener('input', () => {
            document.documentElement.style.setProperty('--code-line-height', slider.value);
            display.textContent = slider.value;
            localStorage.setItem(DENSITY_STORAGE_KEY, slider.value);
        });
        resetBtn.addEventListener('click', () => {
            slider.value = '1.55';
            display.textContent = '1.55';
            document.documentElement.style.removeProperty('--code-line-height');
            localStorage.removeItem(DENSITY_STORAGE_KEY);
        });
    }
```

- [ ] **Step 2: Call the init functions during app boot**

Find the existing app bootstrap. The pattern in this codebase is one `DOMContentLoaded` listener inside the IIFE that wires everything up. Locate it (search for `document.addEventListener('DOMContentLoaded'` or — more reliably — search for where `bindSlideLangToggle` or the slide-viewer init runs) and add three lines:
```js
        applySavedDensity();
        bindSettingsDrawer();
        bindDensitySlider();
```
Place these three calls together (order matters: `applySavedDensity` first, so by the time `bindDensitySlider` reads localStorage and sets the slider value, the page already reflects the saved line-height).

If the existing bootstrap does NOT use `DOMContentLoaded` (just inline code that runs when app.js executes after the body has fully loaded — which is the case since the `<script>` is at the bottom), just inline the three calls at the top-level of the IIFE alongside the existing initialization code.

- [ ] **Step 3: Write failing tests**

Create `/Users/skhuang/course/dsvisual/tests/ux_polish.spec.js`:
```js
const { test, expect } = require('@playwright/test');
const path = require('path');

const FILE_URL = 'file://' + path.resolve(__dirname, '..', 'index.html');

test.describe('UX polish — code density slider', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto(FILE_URL);
        await page.waitForSelector('.code-panel-body');
        // Reset localStorage so tests don't bleed state
        await page.evaluate(() => localStorage.removeItem('dsvisual.codeDensity'));
        await page.reload();
        await page.waitForSelector('.code-panel-body');
    });

    test('settings drawer opens on toggle and closes on × button', async ({ page }) => {
        const drawer = page.locator('#settings-drawer');
        await expect(drawer).toBeHidden();
        await page.locator('#settings-toggle').click();
        await expect(drawer).toBeVisible();
        await page.locator('.settings-drawer-close').click();
        await expect(drawer).toBeHidden();
    });

    test('settings drawer closes on backdrop click and Escape', async ({ page }) => {
        await page.locator('#settings-toggle').click();
        await page.locator('.settings-drawer-backdrop').click();
        await expect(page.locator('#settings-drawer')).toBeHidden();

        await page.locator('#settings-toggle').click();
        await page.keyboard.press('Escape');
        await expect(page.locator('#settings-drawer')).toBeHidden();
    });

    test('slider changes code-panel-body line-height and value display', async ({ page }) => {
        const codePanel = page.locator('.code-panel-body').first();
        const fontSize = await codePanel.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));

        await page.locator('#settings-toggle').click();
        const slider = page.locator('#code-density-slider');
        // Drag the slider to 1.30 (use fill which works for range inputs in Playwright)
        await slider.evaluate((el) => {
            el.value = '1.30';
            el.dispatchEvent(new Event('input', { bubbles: true }));
        });

        await expect(page.locator('#code-density-value')).toHaveText('1.30');
        const lh = await codePanel.evaluate((el) => parseFloat(getComputedStyle(el).lineHeight));
        expect(lh).toBeCloseTo(fontSize * 1.30, 1);
    });

    test('density persists across page reload', async ({ page }) => {
        await page.locator('#settings-toggle').click();
        await page.locator('#code-density-slider').evaluate((el) => {
            el.value = '1.20';
            el.dispatchEvent(new Event('input', { bubbles: true }));
        });
        await page.reload();
        await page.waitForSelector('.code-panel-body');
        const lh = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--code-line-height'));
        expect(lh.trim()).toBe('1.20');
    });

    test('reset button restores 1.55 and clears localStorage', async ({ page }) => {
        await page.locator('#settings-toggle').click();
        await page.locator('#code-density-slider').evaluate((el) => {
            el.value = '1.20';
            el.dispatchEvent(new Event('input', { bubbles: true }));
        });
        await page.locator('#code-density-reset').click();
        await expect(page.locator('#code-density-value')).toHaveText('1.55');
        const stored = await page.evaluate(() => localStorage.getItem('dsvisual.codeDensity'));
        expect(stored).toBeNull();
    });
});
```

- [ ] **Step 4: Run tests**

Run: `npx playwright test tests/ux_polish.spec.js --reporter=line`
Expected: 5 tests pass.

Run: `npm run test:all`
Expected: 44 unit + (43 existing + 5 new) Playwright = 48 Playwright passing. All green.

- [ ] **Step 5: Commit**

```bash
git add app.js tests/ux_polish.spec.js
git commit -m "feat: code-panel density slider with localStorage persistence"
```

---

## Task 3: Visualizer scale wrapper + zoom controls (DOM + CSS, no JS handler yet)

**Files:**
- Modify: `app.js` (`mountActiveRuntime` function, ~line 303)
- Modify: `style.css`

- [ ] **Step 1: Modify `mountActiveRuntime` to wrap visualizer content + add zoom controls**

In `/Users/skhuang/course/dsvisual/app.js`, locate `mountActiveRuntime` (around line 303). Currently:
```js
    function mountActiveRuntime(section) {
        const visualHost = section.querySelector('.method-section-visual');
        if (!visualHost) return;
        if (!runtimeControls || !runtimeVisualizer) return;
        visualHost.classList.add('method-section-visual-live');
        visualHost.setAttribute('aria-label', 'Active interactive visualization');
        visualHost.innerHTML = '';
        visualHost.appendChild(runtimeControls);
        visualHost.appendChild(runtimeVisualizer);
    }
```

Replace the function body with:
```js
    function mountActiveRuntime(section) {
        const visualHost = section.querySelector('.method-section-visual');
        if (!visualHost) return;
        if (!runtimeControls || !runtimeVisualizer) return;
        visualHost.classList.add('method-section-visual-live');
        visualHost.setAttribute('aria-label', 'Active interactive visualization');
        visualHost.innerHTML = '';

        // Zoom controls (sibling, NOT scaled, sits above the scaled content)
        const zoomControls = document.createElement('div');
        zoomControls.className = 'viz-zoom-controls';
        zoomControls.setAttribute('role', 'toolbar');
        zoomControls.setAttribute('aria-label', 'Zoom controls');
        zoomControls.innerHTML =
            '<button type="button" data-zoom="out" aria-label="Zoom out">−</button>' +
            '<button type="button" data-zoom="reset" aria-label="Reset zoom">100%</button>' +
            '<button type="button" data-zoom="in" aria-label="Zoom in">+</button>';
        visualHost.appendChild(zoomControls);

        // Scaled wrapper holds the runtime controls + visualizer
        const scaled = document.createElement('div');
        scaled.className = 'viz-body-scaled';
        scaled.appendChild(runtimeControls);
        scaled.appendChild(runtimeVisualizer);
        visualHost.appendChild(scaled);
    }
```

Note: Task 4 adds the click/wheel/pinch handlers; for now the buttons exist visually but do nothing.

- [ ] **Step 2: Add the CSS for the scale wrapper, controls, and visual host**

Append to `/Users/skhuang/course/dsvisual/style.css`:
```css
/* ----- Visualizer zoom (UX polish) ----- */
.method-section-visual {
    position: relative;
    overflow: auto;
}
.viz-body-scaled {
    transform: scale(var(--viz-zoom, 1));
    transform-origin: top left;
    transition: transform 0.2s ease;
}
.viz-zoom-controls {
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 10;
    display: inline-flex;
    gap: 2px;
    background: rgba(255, 255, 255, 0.92);
    border: 1px solid var(--border, #cbd5e1);
    border-radius: 999px;
    padding: 2px;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
}
.viz-zoom-controls button {
    border: 0;
    background: transparent;
    color: var(--text, #0f172a);
    width: 28px;
    height: 24px;
    border-radius: 999px;
    cursor: pointer;
    font-size: 0.85rem;
    font-family: inherit;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}
.viz-zoom-controls button[data-zoom="reset"] {
    width: auto;
    padding: 0 8px;
    font-variant-numeric: tabular-nums;
}
.viz-zoom-controls button:hover { background: rgba(15, 23, 42, 0.06); }
@media (prefers-color-scheme: dark) {
    .viz-zoom-controls { background: rgba(15, 23, 42, 0.85); border-color: #334155; }
    .viz-zoom-controls button { color: #e2e8f0; }
    .viz-zoom-controls button:hover { background: rgba(226, 232, 240, 0.1); }
}
```

- [ ] **Step 3: Verify no regression**

Run: `npm run test:all`
Expected: all 92 tests (44 unit + 48 Playwright after Task 2) still pass.

Quick browser sanity (delete after):
```js
// /Users/skhuang/course/dsvisual/check_zoom_dom.js
const { chromium } = require('@playwright/test');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + path.resolve(process.cwd(), 'index.html'));
  await page.waitForSelector('.viz-body-scaled');
  const hasScaled = await page.locator('.viz-body-scaled').count();
  const hasControls = await page.locator('.viz-zoom-controls').count();
  const resetText = await page.locator('.viz-zoom-controls button[data-zoom="reset"]').first().textContent();
  console.log('viz-body-scaled count:', hasScaled, '(expect 1)');
  console.log('viz-zoom-controls count:', hasControls, '(expect 1)');
  console.log('reset button text:', resetText, '(expect 100%)');
  await browser.close();
})();
```
Run: `node /Users/skhuang/course/dsvisual/check_zoom_dom.js`, then `rm /Users/skhuang/course/dsvisual/check_zoom_dom.js`.
Expected counts: 1, 1; reset text `100%`.

- [ ] **Step 4: Commit**

```bash
git add app.js style.css
git commit -m "feat: wrap visualizer in scale wrapper and add zoom controls UI"
```

---

## Task 4: Zoom button handlers + per-section state + lifecycle reset

**Files:**
- Modify: `app.js`
- Modify: `tests/ux_polish.spec.js` (append zoom tests)

- [ ] **Step 1: Add `bindZoomControls` and call it from `mountActiveRuntime`**

In `/Users/skhuang/course/dsvisual/app.js`, immediately before `mountActiveRuntime` (around line 303), add:
```js
    function bindZoomControls(visualHost) {
        const scaled = visualHost.querySelector('.viz-body-scaled');
        const controls = visualHost.querySelector('.viz-zoom-controls');
        if (!scaled || !controls) return;
        const resetBtn = controls.querySelector('[data-zoom="reset"]');
        const inBtn = controls.querySelector('[data-zoom="in"]');
        const outBtn = controls.querySelector('[data-zoom="out"]');
        let zoom = 1.0;
        function applyZoom(z) {
            zoom = Math.max(0.5, Math.min(2.0, Math.round(z * 100) / 100));
            scaled.style.setProperty('--viz-zoom', String(zoom));
            resetBtn.textContent = Math.round(zoom * 100) + '%';
        }
        inBtn.addEventListener('click', () => applyZoom(zoom + 0.1));
        outBtn.addEventListener('click', () => applyZoom(zoom - 0.1));
        resetBtn.addEventListener('click', () => applyZoom(1.0));
        applyZoom(1.0);
    }
```

Then add a single line at the END of `mountActiveRuntime` (after the new wrapper + controls insertion from Task 3):
```js
        bindZoomControls(visualHost);
```

`mountActiveRuntime` is called every time a new method is selected, so each new section gets fresh `zoom = 1.0` state — that satisfies the "switch method resets" requirement without any extra plumbing.

- [ ] **Step 2: Append zoom tests to `tests/ux_polish.spec.js`**

In `/Users/skhuang/course/dsvisual/tests/ux_polish.spec.js`, append:
```js
test.describe('UX polish — visualizer zoom', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto(FILE_URL);
        await page.waitForSelector('.viz-body-scaled');
    });

    test('zoom in raises percentage and scale to 110%', async ({ page }) => {
        const scaled = page.locator('.viz-body-scaled').first();
        const reset = page.locator('.viz-zoom-controls button[data-zoom="reset"]').first();
        await expect(reset).toHaveText('100%');
        await page.locator('.viz-zoom-controls button[data-zoom="in"]').first().click();
        await expect(reset).toHaveText('110%');
        const t = await scaled.evaluate((el) => getComputedStyle(el).getPropertyValue('--viz-zoom'));
        expect(parseFloat(t)).toBeCloseTo(1.1, 2);
    });

    test('zoom out drops to 90% and reset returns to 100%', async ({ page }) => {
        const reset = page.locator('.viz-zoom-controls button[data-zoom="reset"]').first();
        await page.locator('.viz-zoom-controls button[data-zoom="out"]').first().click();
        await expect(reset).toHaveText('90%');
        await reset.click();
        await expect(reset).toHaveText('100%');
    });

    test('zoom in clamps at 200%', async ({ page }) => {
        const reset = page.locator('.viz-zoom-controls button[data-zoom="reset"]').first();
        const inBtn = page.locator('.viz-zoom-controls button[data-zoom="in"]').first();
        for (let i = 0; i < 20; i++) await inBtn.click();
        await expect(reset).toHaveText('200%');
    });

    test('zoom out clamps at 50%', async ({ page }) => {
        const reset = page.locator('.viz-zoom-controls button[data-zoom="reset"]').first();
        const outBtn = page.locator('.viz-zoom-controls button[data-zoom="out"]').first();
        for (let i = 0; i < 20; i++) await outBtn.click();
        await expect(reset).toHaveText('50%');
    });

    test('switching method resets zoom to 100%', async ({ page }) => {
        const reset = page.locator('.viz-zoom-controls button[data-zoom="reset"]').first();
        // First, set the current method's zoom to 150%
        const inBtn = page.locator('.viz-zoom-controls button[data-zoom="in"]').first();
        for (let i = 0; i < 5; i++) await inBtn.click();
        await expect(reset).toHaveText('150%');

        // Switch to a different method via the method-select dropdown
        const methodSelect = page.locator('[data-testid="method-select"]').first();
        await methodSelect.selectOption('queue');
        await page.waitForSelector('[data-method-section="queue"][data-runtime-state="active"]');
        const newReset = page.locator('[data-method-section="queue"] .viz-zoom-controls button[data-zoom="reset"]');
        await expect(newReset).toHaveText('100%');
    });
});
```

- [ ] **Step 3: Run tests**

Run: `npx playwright test tests/ux_polish.spec.js --reporter=line`
Expected: 10 tests pass (5 density + 5 zoom).

Run: `npm run test:all`
Expected: 44 unit + (43 existing + 10 new) = 53 Playwright passing. All green.

- [ ] **Step 4: Commit**

```bash
git add app.js tests/ux_polish.spec.js
git commit -m "feat: zoom button handlers with per-section state and clamp"
```

---

## Task 5: Wheel + pinch zoom interactions

**Files:**
- Modify: `app.js` (`bindZoomControls`)
- Modify: `tests/ux_polish.spec.js` (append wheel test)

- [ ] **Step 1: Extend `bindZoomControls` with wheel and pinch handlers**

In `/Users/skhuang/course/dsvisual/app.js`, find `bindZoomControls` (added in Task 4). Replace the entire function body with:
```js
    function bindZoomControls(visualHost) {
        const scaled = visualHost.querySelector('.viz-body-scaled');
        const controls = visualHost.querySelector('.viz-zoom-controls');
        if (!scaled || !controls) return;
        const resetBtn = controls.querySelector('[data-zoom="reset"]');
        const inBtn = controls.querySelector('[data-zoom="in"]');
        const outBtn = controls.querySelector('[data-zoom="out"]');
        let zoom = 1.0;
        function applyZoom(z) {
            zoom = Math.max(0.5, Math.min(2.0, Math.round(z * 100) / 100));
            scaled.style.setProperty('--viz-zoom', String(zoom));
            resetBtn.textContent = Math.round(zoom * 100) + '%';
        }
        inBtn.addEventListener('click', () => applyZoom(zoom + 0.1));
        outBtn.addEventListener('click', () => applyZoom(zoom - 0.1));
        resetBtn.addEventListener('click', () => applyZoom(1.0));

        // Wheel zoom (intercepted inside the visual host so page scroll isn't affected)
        visualHost.addEventListener('wheel', (e) => {
            e.preventDefault();
            applyZoom(zoom + (e.deltaY < 0 ? 0.05 : -0.05));
        }, { passive: false });

        // Pinch zoom via two-pointer events
        const pointers = new Map();
        let pinchStart = null;
        visualHost.addEventListener('pointerdown', (e) => {
            pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
            if (pointers.size === 2) {
                const [a, b] = Array.from(pointers.values());
                pinchStart = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom };
            }
        });
        visualHost.addEventListener('pointermove', (e) => {
            if (!pointers.has(e.pointerId)) return;
            pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
            if (pointers.size === 2 && pinchStart && pinchStart.dist > 0) {
                const [a, b] = Array.from(pointers.values());
                const dist = Math.hypot(a.x - b.x, a.y - b.y);
                applyZoom(pinchStart.zoom * (dist / pinchStart.dist));
            }
        });
        function endPointer(e) {
            pointers.delete(e.pointerId);
            if (pointers.size < 2) pinchStart = null;
        }
        visualHost.addEventListener('pointerup', endPointer);
        visualHost.addEventListener('pointercancel', endPointer);

        applyZoom(1.0);
    }
```

- [ ] **Step 2: Append a wheel test**

In `/Users/skhuang/course/dsvisual/tests/ux_polish.spec.js`, inside the `UX polish — visualizer zoom` describe block, append:
```js
    test('wheel scroll inside visualizer zooms by ±5%', async ({ page }) => {
        const visual = page.locator('.method-section-visual').first();
        const reset = page.locator('.viz-zoom-controls button[data-zoom="reset"]').first();
        // Simulate wheel up (zoom in 5%)
        await visual.evaluate((el) => {
            el.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, bubbles: true, cancelable: true }));
        });
        await expect(reset).toHaveText('105%');
        // Wheel down (zoom out 5%)
        await visual.evaluate((el) => {
            el.dispatchEvent(new WheelEvent('wheel', { deltaY: 100, bubbles: true, cancelable: true }));
        });
        await expect(reset).toHaveText('100%');
    });
```

Pinch is not tested in headless (touch pointer events are awkward to simulate reliably); code review covers it.

- [ ] **Step 3: Run tests**

Run: `npx playwright test tests/ux_polish.spec.js --reporter=line`
Expected: 11 tests pass.

Run: `npm run test:all`
Expected: 44 unit + 54 Playwright = 98 passing. All green.

- [ ] **Step 4: Commit**

```bash
git add app.js tests/ux_polish.spec.js
git commit -m "feat: zoom via mouse wheel and touch pinch"
```

---

## Task 6: Final verification + idempotency

**Files:**
- No expected modifications; commit only if a fix is needed.

- [ ] **Step 1: Run the full test suite**

Run: `npm run test:all`
Expected: 44 unit + 54 Playwright = 98 passing. All green.

- [ ] **Step 2: Browser smoke check — density + zoom + slide-viewer code panel**

Write at the repo root (delete after):
```js
// /Users/skhuang/course/dsvisual/check_final.js
const { chromium } = require('@playwright/test');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('file://' + path.resolve(process.cwd(), 'index.html'));
  await page.waitForSelector('.code-panel-body');

  // Density slider affects slide-viewer code panel too
  await page.locator('#settings-toggle').click();
  await page.locator('#code-density-slider').evaluate((el) => { el.value = '1.20'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.locator('.settings-drawer-close').click();
  // Open a slide deck and navigate to a code page
  await page.locator('.method-slides-btn[data-method="stack-array"]').click();
  await page.waitForSelector('[data-testid="slide-viewer"]:not([hidden])');
  for (let i = 0; i < 5; i++) await page.locator('#slide-next').click();
  await page.waitForTimeout(150);
  const slideCodeLH = await page.locator('#slide-viewer-body .code-panel-body').evaluate((el) => parseFloat(getComputedStyle(el).lineHeight));
  const slideCodeFS = await page.locator('#slide-viewer-body .code-panel-body').evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  console.log('slide code-panel line-height:', slideCodeLH.toFixed(2), 'fontSize:', slideCodeFS.toFixed(2), 'ratio:', (slideCodeLH / slideCodeFS).toFixed(2), '(expect ~1.20)');
  await page.locator('[data-testid="slide-viewer"] .slide-viewer-close').first().click();

  // Zoom across 3 different methods, each independent
  for (const id of ['stack-array', 'sort-quick', 'pattern-singleton']) {
    const cats = page.locator('[data-testid="category-nav"] .category-nav-btn');
    const count = await cats.count();
    for (let i = 0; i < count; i++) {
      await cats.nth(i).click();
      const sel = page.locator('[data-testid="method-select"]');
      if (await sel.locator('option[value="' + id + '"]').count()) {
        await sel.selectOption(id);
        break;
      }
    }
    await page.waitForSelector('[data-method-section="' + id + '"][data-runtime-state="active"]');
    const reset = page.locator('[data-method-section="' + id + '"] .viz-zoom-controls button[data-zoom="reset"]');
    const inBtn = page.locator('[data-method-section="' + id + '"] .viz-zoom-controls button[data-zoom="in"]');
    await inBtn.click();
    await expect_text(reset, '110%');
    console.log(id, ': zoom in to 110%');
  }
  console.log('errors:', errors);
  await browser.close();

  function expect_text(loc, text) { return loc.textContent().then((t) => { if (t !== text) throw new Error('expected ' + text + ' got ' + t); }); }
})();
```
Run: `node /Users/skhuang/course/dsvisual/check_final.js`, then `rm /Users/skhuang/course/dsvisual/check_final.js`.
Expected: slide code line-height ratio ≈ 1.20; each method's zoom in goes 100% → 110% independently; `errors: []`.

- [ ] **Step 3: Idempotency — pipelines still produce no drift**

Run: `npm run format:code && git status --short`
Expected: only `?? .claude/`.

Run: `npm run build:slides && git status --short`
Expected: only `?? .claude/`.

- [ ] **Step 4: No commit needed if everything is clean**

If Steps 1–3 pass with no diffs, the branch is ready for PR. If any regression surfaces, fix it and commit with a descriptive message.

---

## Notes for the executor

- **Density persists across pages/decks** because the CSS variable lives on `:root` and every `.code-panel-body` (App + slide-viewer) inherits it.
- **Zoom is per-section and ephemeral.** When `mountActiveRuntime` runs on a new method switch, the new `.viz-body-scaled` element gets a fresh closure-scoped `zoom = 1.0`. No global state to clean.
- **wheel preventDefault is intentional.** Inside `.method-section-visual`, the user expects the wheel to zoom, not scroll the page. Outside the visual area, normal page scroll continues.
- **Pinch tested manually.** Headless Playwright can't easily simulate `pointerdown` × 2 with realistic distance math; code review of the handler is the verification path.
- **The settings drawer is extensible.** Future settings (theme, animation speed, default language) drop into the `<div class="settings-drawer-body">` as additional `.settings-row` sections. The skeleton is intentional.
