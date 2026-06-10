# Unified Step Controls (Run/Pause/Resume + Speed) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance the shared `buildStepControls` factory so every step-based visualization gains a single Run↔Pause↔Resume toggle, a live Speed slider, and per-visualization speed persistence (localStorage) — with no change to its call signature.

**Architecture:** Rewrite one function (`buildStepControls` in app.js) in place. It reads `currentMode` from the app.js closure for the per-viz localStorage key. The `data-action` attributes (`step`/`run`/`reset`) are preserved so existing tests keep working; a new `.stepctl-speed` range input is added. All 12 current callers and future ones inherit the behavior automatically.

**Tech Stack:** Vanilla JS, localStorage, Playwright. No build/data-file changes.

**Spec:** `docs/superpowers/specs/2026-06-09-step-controls-run-pause-speed-design.md`

---

## File Structure
- `app.js` (modify) — rewrite `function buildStepControls(onStep, onReset, runIntervalMs)`.
- `style.css` (modify) — `.stepctl-speed` slider styling.
- `tests/step_controls.spec.js` (new) — Playwright E2E for the new controls.

---

## Task 1: Failing E2E for new controls (TDD)

**Files:** Create `tests/step_controls.spec.js`.

- [ ] **Step 1: Branch**
```bash
cd /Users/skhuang/course/dsvisual
git checkout main && git pull --ff-only
git checkout -b feat/step-controls-run-pause-speed
git branch --show-current
```
Expected: `feat/step-controls-run-pause-speed`.

- [ ] **Step 2: Write the failing E2E**

Create `tests/step_controls.spec.js`:
```js
const { test, expect } = require('@playwright/test');
const path = require('path');
const FILE_URL = 'file://' + path.resolve(__dirname, '../index.html');

async function loadMethod(page, methodId) {
    const navItem = page.locator(`.category-nav-item:has(.category-nav-method[data-method-id="${methodId}"])`);
    await navItem.locator('.category-nav-btn').click();
    await navItem.locator(`.category-nav-method[data-method-id="${methodId}"]`).click();
    await expect(page.locator(`[data-method-section="${methodId}"]`)).toHaveAttribute('data-runtime-state', 'active');
}

test.describe('Unified step controls — Run/Pause/Resume + Speed', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); localStorage.removeItem('dsvisual.stepSpeed.graph-aoe'); } catch (e) {} });
        await page.goto(FILE_URL);
        await loadMethod(page, 'graph-aoe');
    });

    test('Run toggles to Pause then Resume; progress advances only while running', async ({ page }) => {
        const sec = page.locator('[data-method-section="graph-aoe"]');
        const runBtn = sec.locator('.stepctl [data-action="run"]');
        const slider = sec.locator('.stepctl .stepctl-speed');
        const phase = sec.locator('.aoe-phase');

        await expect(runBtn).toHaveText('Run');
        await expect(slider).toHaveCount(1);

        // ~100ms/step: fast enough to advance within 400ms, slow enough that the
        // ~19-frame animation does NOT finish before we pause it.
        await slider.evaluate((el) => { el.value = '510'; el.dispatchEvent(new Event('input', { bubbles: true })); });

        await runBtn.click();
        await expect(runBtn).toHaveText('Pause');
        const t1 = await phase.textContent();
        await page.waitForTimeout(400);
        const t2 = await phase.textContent();
        expect(t2).not.toBe(t1); // advanced while running

        await runBtn.click(); // pause
        await expect(runBtn).toHaveText('Resume');
        const p1 = await phase.textContent();
        await page.waitForTimeout(400);
        const p2 = await phase.textContent();
        expect(p2).toBe(p1); // frozen while paused

        await runBtn.click(); // resume
        await expect(runBtn).toHaveText('Pause');
    });

    test('Step from paused advances; Reset returns to Run state', async ({ page }) => {
        const sec = page.locator('[data-method-section="graph-aoe"]');
        const runBtn = sec.locator('.stepctl [data-action="run"]');
        const stepBtn = sec.locator('.stepctl [data-action="step"]');
        const phase = sec.locator('.aoe-phase');

        const before = await phase.textContent();
        await stepBtn.click();
        const after = await phase.textContent();
        expect(after).not.toBe(before); // one step advanced the phase text

        await sec.locator('.stepctl [data-action="reset"]').click();
        await expect(runBtn).toHaveText('Run');
    });

    test('Speed slider value persists per visualization across reload', async ({ page }) => {
        const sec = page.locator('[data-method-section="graph-aoe"]');
        await sec.locator('.stepctl .stepctl-speed').evaluate((el) => { el.value = '123'; el.dispatchEvent(new Event('input', { bubbles: true })); });
        await page.reload();
        await loadMethod(page, 'graph-aoe');
        await expect(page.locator('[data-method-section="graph-aoe"] .stepctl .stepctl-speed')).toHaveValue('123');
    });
});
```

- [ ] **Step 3: Run — expect FAIL**

Run: `cd /Users/skhuang/course/dsvisual && npx playwright test tests/step_controls.spec.js --reporter=line`
Expected: FAIL — there is no `.stepctl-speed` slider and the run button does not toggle to "Pause"/"Resume" yet.

- [ ] **Step 4: Commit the failing test**
```bash
cd /Users/skhuang/course/dsvisual
git add tests/step_controls.spec.js
git commit -m "test(stepctl): failing E2E for Run/Pause/Resume + speed slider"
```

---

## Task 2: Rewrite `buildStepControls` + CSS

**Files:** Modify `app.js`, `style.css`.

- [ ] **Step 1: Replace `buildStepControls`**

In `app.js`, find the existing function (starts `function buildStepControls(onStep, onReset, runIntervalMs) {` and ends at its closing `}` before `function renderBloomFilter()`). Replace the ENTIRE function with:
```js
    function buildStepControls(onStep, onReset, runIntervalMs) {
        const mode = (typeof currentMode !== 'undefined' && currentMode) ? currentMode : 'default';
        const storeKey = 'dsvisual.stepSpeed.' + mode;
        const clampV = (v) => Math.max(10, Math.min(600, v));
        let sliderVal = clampV(610 - (runIntervalMs || 500));
        try {
            const saved = localStorage.getItem(storeKey);
            if (saved !== null && saved !== '') { const n = parseInt(saved, 10); if (Number.isFinite(n)) sliderVal = clampV(n); }
        } catch (e) { /* localStorage unavailable — use default */ }

        const strip = document.createElement('div');
        strip.className = 'stepctl';
        strip.innerHTML =
            '<button type="button" data-action="step">Step</button>' +
            '<button type="button" data-action="run">Run</button>' +
            '<button type="button" data-action="reset">Reset</button>' +
            '<label class="stepctl-speed-wrap">Speed <input type="range" class="stepctl-speed" min="10" max="600" value="' + sliderVal + '"></label>';

        const runBtn = strip.querySelector('[data-action="run"]');
        const slider = strip.querySelector('.stepctl-speed');
        let timer = null;
        let state = 'idle'; // 'idle' | 'running' | 'paused'
        const delay = () => 610 - parseInt(slider.value, 10);

        function setBtn() { runBtn.textContent = (state === 'running') ? 'Pause' : (state === 'paused' ? 'Resume' : 'Run'); }
        function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }
        function startTimer() {
            stopTimer();
            timer = setInterval(() => { const more = onStep(); if (more === false) { stopTimer(); state = 'idle'; setBtn(); } }, delay());
        }
        function run() { state = 'running'; setBtn(); startTimer(); }
        function pause() { stopTimer(); state = 'paused'; setBtn(); }

        strip.querySelector('[data-action="step"]').onclick = () => { if (state === 'running') pause(); onStep(); };
        runBtn.onclick = () => { if (state === 'running') pause(); else run(); };
        strip.querySelector('[data-action="reset"]').onclick = () => { stopTimer(); state = 'idle'; setBtn(); onReset(); };
        slider.addEventListener('input', () => {
            try { localStorage.setItem(storeKey, String(slider.value)); } catch (e) { /* ignore */ }
            if (state === 'running') startTimer(); // live re-apply new speed
        });
        setBtn();
        return strip;
    }
```

- [ ] **Step 2: Append CSS**

Append to `style.css`:
```css
.stepctl-speed-wrap { display: inline-flex; align-items: center; gap: 6px; margin-left: 10px; font-size: 13px; color: #475569; }
.stepctl-speed { width: 110px; vertical-align: middle; }
.stepctl [data-action="run"] { min-width: 64px; }
```

- [ ] **Step 3: Syntax + run the new E2E (expect PASS)**
```bash
cd /Users/skhuang/course/dsvisual
node -c app.js && echo "app.js OK"
npx playwright test tests/step_controls.spec.js --reporter=line
```
Expected: `app.js OK`; all 3 step-control tests PASS. If `node -c` fails, STOP/BLOCKED.

- [ ] **Step 4: Commit**
```bash
cd /Users/skhuang/course/dsvisual
git add app.js style.css
git commit -m "feat(stepctl): Run/Pause/Resume toggle + live speed slider + per-viz persistence"
```

---

## Task 3: Full suite + finish

- [ ] **Step 1: Run the entire suite (regression)**

Run: `cd /Users/skhuang/course/dsvisual && npm run test:all`
Expected: ALL pass — the new step-control E2E plus every existing test (their `.stepctl [data-action="step"]` / `run` / `reset` selectors are unchanged). If any existing test fails, STOP and report BLOCKED with the failure (do not weaken the new feature to paper over it).

- [ ] **Step 2: Clean-tree confirmation**
```bash
cd /Users/skhuang/course/dsvisual
git status --porcelain
git log --oneline origin/main..HEAD
```
Expected: no unexpected tracked changes; 3 commits on the branch.

- [ ] **Step 3: Finish**

Use **superpowers:finishing-a-development-branch** for `feat/step-controls-run-pause-speed`.

---

## Self-Review notes
- **Spec coverage:** control strip spec §2 (Task 2 Step 1), persistence §2 (Task 2 Step 1 localStorage), live speed §2 (slider input handler), compatibility §3 (data-action preserved; Task 3 regression), tests §4 (Task 1 E2E + Task 3 full suite), acceptance §6 (Task 3).
- **Placeholder scan:** none — full replacement code provided; localStorage failures handled with try/catch (explicit, not a vague "handle errors").
- **Type/name consistency:** `state` values `idle`/`running`/`paused`; helpers `stopTimer`/`startTimer`/`run`/`pause`/`setBtn`; selectors `[data-action="step|run|reset"]` + `.stepctl-speed` consistent between the function and the E2E.
- **Key design point honored:** `currentMode` is read from the app.js closure (guarded by `typeof`), giving per-visualization storage keys without changing the call signature.
- **Note for reviewers:** the pre-existing "leaked interval on method switch" risk is unchanged; render `paint()` guards already make stale ticks harmless. Not in scope for this change.
```
