# VCR Frame-Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the site-wide `VizKit.buildStepControls` (Step/Run/Reset+Speed) with a VCR-style `VizKit.buildFrameControls(frames, paint, opts)` transport (⏮ ◀ ▶/⏸ ▶︎ + scrubber + speed + `步 i / N`), migrate all 50 consumers, and delete the old control.

**Architecture:** A new frame-array-driven control owns the frame index, so backward and scrubbing are instant `goTo(k)` renders of `frames[k]`. Consumers hand it their precomputed `frames` array plus a `paint(frame, idx)` function. The two controls coexist during migration; `buildStepControls` is deleted in the final task.

**Tech Stack:** Vanilla JS (VizKit seam in js/app.js), inline DOM, Playwright + node:test. Spec: `docs/superpowers/specs/2026-07-26-vcr-frame-controls-design.md`.

## Global Constraints

- Bilingual tooltips/labels; `zh` = **Traditional (zh-Hant)**, never Simplified.
- **Concurrent refactor session** edits `js/app.js` — stage with targeted `git add <path>` only, never `-A`/`.`/`-u`; run `git status` before every commit; rebase if the VizKit/`buildStepControls` region collides.
- Never hand-edit generated files (`js/code_db.js`, `slides/**`, `js/slides_rendered.js`).
- **Honest tests:** never loosen/delete an existing assertion to make a migration pass — fix the migration. A spec that genuinely no longer applies (semantics deliberately changed) is flagged to the human, not silently edited.
- The FULL Playwright suite (`npm test`) is the gate at the END of EVERY task — preserved `data-action` selectors keep the existing specs valid throughout.
- Preserve selectors: forward button = `data-action="step"`, run = `data-action="run"`, to-start = `data-action="reset"`, speed = `.stepctl-speed` (+ its `dsvisual.stepSpeed.<mode>` localStorage memory). New: `data-action="back"`, `.stepctl-scrubber`, `.stepctl-count`.
- One branch (`feat/vcr-frame-controls`), one PR. ds2026 notebooks untouched (different repo).

## Migration Recipe (referenced by every CLEAN/ARRAYish task)

Every consumer currently does some variant of:
```js
let idx = 0;
function paint() { const fr = frames[idx]; /* render fr */ }
function step() { if (idx < frames.length - 1) { idx++; paint(); return idx < frames.length - 1; } return false; }
function reset() { idx = 0; paint(); }
host.appendChild(K().buildStepControls(step, reset, MS));
paint();
```

Transform to:
```js
function paint(fr, i) { /* render fr; use i where the old code used idx */ }
host.appendChild(K().buildFrameControls(frames, paint, { runIntervalMs: MS }));
```
— i.e. **(a)** give `paint` the signature `(fr, i)`; **(b)** delete the local `idx`, `step`, `reset`, and the trailing bootstrap `paint()`/`draw()` call (the control paints the initial frame itself); **(c)** replace `buildStepControls(step, reset, MS)` with `buildFrameControls(frames, paint, { runIntervalMs: MS })`.

**Shape A — single-frame painters (most consumers):** the old `paint` reads only `frames[idx]`. Use the `fr` arg; ignore `i`.
Concrete example — `js/viz/viz_lru.js` (`renderLruCache`, line 47-51):
```js
// BEFORE
function paint() { const fr = frames[idx]; /* …builds cells from fr… */ }
function step() { if (idx < frames.length - 1) { idx++; paint(); return idx < frames.length - 1; } return false; }
function reset() { idx = 0; paint(); }
host.appendChild(K().buildStepControls(step, reset, 700));
paint();
// AFTER
function paint(fr) { /* …same body, `fr` is the frame (drop `const fr = frames[idx]`)… */ }
host.appendChild(K().buildFrameControls(frames, paint, { runIntervalMs: 700 }));
```

**Shape B — cumulative painters:** the old draw iterates `frames[0..idx]` and/or references `idx` (current-marker, `frames[idx].total`). Use the `i` arg everywhere the old code used `idx`.
Concrete example — `js/domains/graph.js` (`renderPrim`, line 272-297):
```js
// BEFORE
function draw() { …; for (let s = 0; s <= idx; s++) { …; eEl.classList.add(s === idx ? 'wgraph-cur' : 'wgraph-in'); } weightEl.textContent = steps[idx].total; }
function step() { if (idx >= steps.length - 1) return false; idx++; draw(); return idx < steps.length - 1; }
function reset() { idx = 0; draw(); }
wrap.appendChild(K().buildStepControls(step, reset, 700));
draw();
// AFTER
function draw(_fr, i) { …; for (let s = 0; s <= i; s++) { …; eEl.classList.add(s === i ? 'wgraph-cur' : 'wgraph-in'); } weightEl.textContent = steps[i].total; }
wrap.appendChild(K().buildFrameControls(steps, draw, { runIntervalMs: 700 }));
// (delete `let idx = 0;`, step, reset, trailing draw())
```

Notes:
- Where a consumer draws **static, one-time** scaffolding (e.g. `viz_tree_traversal.js` draws edges once before stepping; `viz_graph_matrix.js` gmGraphSvg): keep that outside `paint`, drawn once at render — `paint` only updates the per-frame highlights/state. Do NOT move one-time scaffolding into `paint`.
- Where the old `step()` also called `K().showStatus(...)` (only on step, not initial): fold that call INTO `paint(fr, i)` so status shows on every frame incl. the initial one (this is an intentional, honest improvement — note it in the report).
- If a consumer keeps a persisted external cursor (OOP, pattern): pass `opts.initialIndex` and `opts.onIndexChange` instead of a local idx (see Task 9).

---

### Task 1: Core `buildFrameControls` + CSS + export + pilot migration (graph-aoe) + control specs

**Files:**
- Modify: `js/app.js` (add `buildFrameControls` near `buildStepControls` ~1916; add to VizKit export ~1411), `js/viz/viz_graph_aoe.js` (migrate, line 52), `style.css` (VCR-bar rules), `tests/step_controls.spec.js` (rewrite for the new bar)
- Create: `tests/frame_controls.spec.js`
- Keep: `buildStepControls` intact (all other consumers still use it).

**Interfaces:**
- Produces: `VizKit.buildFrameControls(frames, paint, opts)` — `frames: Array`, `paint(frame, idx)`, `opts: { runIntervalMs?, initialIndex?, onIndexChange?(idx) }`; returns the `.stepctl` element; renders the initial frame itself.
- DOM contract: `.stepctl` containing `[data-action="reset"]` (⏮ to-start), `[data-action="back"]` (◀), `[data-action="run"]` (▶/⏸), `[data-action="step"]` (▶︎ forward), `.stepctl-scrubber` (range 0..last), `.stepctl-speed` (range, persisted), `.stepctl-count` (`步 i / last`).

- [ ] **Step 1: Rewrite the control spec to describe the new bar (failing)**

Replace `tests/step_controls.spec.js` with behavior-based assertions (no button-text assertions — the bar uses glyphs). Target `graph-aoe` (migrated in this task):
```js
const { test, expect } = require('@playwright/test');
const { loadMethod } = require('./helpers');
const path = require('path');
const FILE_URL = 'file://' + path.resolve(__dirname, '../index.html');

test.describe('VCR frame controls', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
        await page.goto(FILE_URL);
        await loadMethod(page, 'graph-aoe');
    });

    test('forward/back/reset/scrubber move the position counter; back reproduces a prior frame', async ({ page }) => {
        const sec = page.locator('[data-method-section="graph-aoe"]');
        const cnt = sec.locator('.stepctl .stepctl-count');
        const step = sec.locator('.stepctl [data-action="step"]');
        const back = sec.locator('.stepctl [data-action="back"]');
        await expect(cnt).toContainText('0 /');
        const phase0 = await sec.locator('.aoe-phase').textContent();
        await step.click();
        await expect(cnt).toContainText('1 /');
        const phase1 = await sec.locator('.aoe-phase').textContent();
        expect(phase1).not.toBe(phase0);
        await back.click();                         // instant backward
        await expect(cnt).toContainText('0 /');
        await expect(sec.locator('.aoe-phase')).toHaveText(phase0);   // exact prior frame reproduced
        // scrubber jumps to the end
        const scrub = sec.locator('.stepctl .stepctl-scrubber');
        const last = await scrub.getAttribute('max');
        await scrub.evaluate((el) => { el.value = el.max; el.dispatchEvent(new Event('input', { bubbles: true })); });
        await expect(cnt).toContainText(last + ' / ' + last);
        // reset returns to start
        await sec.locator('.stepctl [data-action="reset"]').click();
        await expect(cnt).toContainText('0 /');
    });

    test('Run auto-advances then pauses; toggling run stops progress', async ({ page }) => {
        const sec = page.locator('[data-method-section="graph-aoe"]');
        const runBtn = sec.locator('.stepctl [data-action="run"]');
        const cnt = sec.locator('.stepctl .stepctl-count');
        await sec.locator('.stepctl .stepctl-speed').evaluate((el) => { el.value = '510'; el.dispatchEvent(new Event('input', { bubbles: true })); });
        await runBtn.click();
        const a = await cnt.textContent();
        await page.waitForTimeout(400);
        const b = await cnt.textContent();
        expect(b).not.toBe(a);                      // advanced while running
        await runBtn.click();                       // pause
        const c = await cnt.textContent();
        await page.waitForTimeout(400);
        expect(await cnt.textContent()).toBe(c);    // stopped
    });

    test('Speed slider value persists per visualization across reload', async ({ page }) => {
        const sec = page.locator('[data-method-section="graph-aoe"]');
        await sec.locator('.stepctl .stepctl-speed').evaluate((el) => { el.value = '123'; el.dispatchEvent(new Event('input', { bubbles: true })); });
        await expect.poll(() => page.evaluate(() => localStorage.getItem('dsvisual.stepSpeed.graph-aoe'))).toBe('123');
        await page.reload();
        await loadMethod(page, 'graph-aoe');
        await expect(page.locator('[data-method-section="graph-aoe"] .stepctl .stepctl-speed')).toHaveValue('123');
    });
});
```

- [ ] **Step 2: Add `tests/frame_controls.spec.js` (failing) — richer transport on graph-components**

graph-components is migrated in Task 2, so gate this file's expectations there is fine; but to keep Task 1 self-contained, target graph-aoe here too OR mark it to pass once Task 2 lands. Simplest: target `graph-aoe` (Task-1 migrated). Assert the counter format precisely and the back/scrubber round-trip:
```js
const { test, expect } = require('@playwright/test');
const { loadMethod } = require('./helpers');
const path = require('path');
const FILE_URL = 'file://' + path.resolve(__dirname, '../index.html');

test('frame-controls counter shows 步/Step i / last and clamps at ends', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URL);
    await loadMethod(page, 'graph-aoe');
    const sec = page.locator('[data-method-section="graph-aoe"]');
    const cnt = sec.locator('.stepctl .stepctl-count');
    const step = sec.locator('.stepctl [data-action="step"]');
    const back = sec.locator('.stepctl [data-action="back"]');
    await expect(cnt).toContainText('Step 0 /');
    await back.click();                              // clamp at 0
    await expect(cnt).toContainText('Step 0 /');
    for (let i = 0; i < 40; i++) await step.click(); // clamp at last
    const scrub = sec.locator('.stepctl .stepctl-scrubber');
    const last = await scrub.getAttribute('max');
    await expect(cnt).toContainText('Step ' + last + ' / ' + last);
});
```

- [ ] **Step 3: Run both specs to verify they fail**

Run: `npx playwright test tests/step_controls.spec.js tests/frame_controls.spec.js`
Expected: FAIL — `.stepctl-count`/`.stepctl-scrubber`/`data-action="back"` don't exist yet; graph-aoe still on the old control.

- [ ] **Step 4: Implement `buildFrameControls` in VizKit**

In `js/app.js`, add next to `buildStepControls` (~line 1916):
```js
    function buildFrameControls(frames, paint, opts) {
        opts = opts || {};
        const last = Math.max(0, frames.length - 1);
        const mode = (typeof currentMode !== 'undefined' && currentMode) ? currentMode : 'default';
        const storeKey = 'dsvisual.stepSpeed.' + mode;
        const clampV = (v) => Math.max(10, Math.min(600, v));
        let sliderVal = clampV(610 - (opts.runIntervalMs || 500));
        try { const s = localStorage.getItem(storeKey); if (s !== null && s !== '') { const n = parseInt(s, 10); if (Number.isFinite(n)) sliderVal = clampV(n); } } catch (e) { /* ignore */ }
        const L = (zh, en) => { try { return (typeof I18N !== 'undefined' && I18N.getCurrentLanguage && I18N.getCurrentLanguage() === 'zh') ? zh : en; } catch (e) { return en; } };

        let idx = Math.max(0, Math.min(opts.initialIndex || 0, last));
        let timer = null, playing = false;

        const strip = document.createElement('div');
        strip.className = 'stepctl';
        strip.innerHTML =
            '<button type="button" class="tbtn" data-action="reset" title="' + L('回到開頭', 'To start') + '">⏮</button>' +
            '<button type="button" class="tbtn" data-action="back" title="' + L('上一步', 'Previous step') + '">◀</button>' +
            '<button type="button" class="tbtn play" data-action="run" title="' + L('播放 / 暫停', 'Play / Pause') + '">▶</button>' +
            '<button type="button" class="tbtn" data-action="step" title="' + L('下一步', 'Next step') + '">▶︎</button>' +
            '<input type="range" class="stepctl-scrubber" min="0" max="' + last + '" value="' + idx + '" title="' + L('步驟位置', 'Step position') + '">' +
            '<label class="stepctl-speed-wrap">' + L('速度', 'Speed') + ' <input type="range" class="stepctl-speed" min="10" max="600" value="' + sliderVal + '"></label>' +
            '<span class="stepctl-count"></span>';

        const runBtn = strip.querySelector('[data-action="run"]');
        const scrub = strip.querySelector('.stepctl-scrubber');
        const speed = strip.querySelector('.stepctl-speed');
        const cnt = strip.querySelector('.stepctl-count');
        const delay = () => 610 - parseInt(speed.value, 10);

        function render() {
            paint(frames[idx], idx);
            scrub.value = idx;
            cnt.textContent = L('步 ', 'Step ') + idx + ' / ' + last;
            runBtn.textContent = playing ? '⏸' : '▶';
            if (opts.onIndexChange) opts.onIndexChange(idx);
        }
        function goTo(i) { idx = Math.max(0, Math.min(i, last)); render(); }
        function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }
        function pause() { stopTimer(); playing = false; runBtn.textContent = '▶'; }
        function play() {
            if (idx >= last) goTo(0);
            playing = true; runBtn.textContent = '⏸';
            stopTimer();
            timer = setInterval(() => { if (idx >= last) { pause(); return; } goTo(idx + 1); }, delay());
        }

        strip.querySelector('[data-action="reset"]').onclick = () => { pause(); goTo(0); };
        strip.querySelector('[data-action="back"]').onclick = () => { pause(); goTo(idx - 1); };
        strip.querySelector('[data-action="step"]').onclick = () => { pause(); goTo(idx + 1); };
        runBtn.onclick = () => { if (playing) pause(); else play(); };
        scrub.addEventListener('input', () => { pause(); goTo(+scrub.value); });
        speed.addEventListener('input', () => {
            try { localStorage.setItem(storeKey, String(speed.value)); } catch (e) { /* ignore */ }
            if (playing) play(); // re-apply new speed live
        });

        render();
        return strip;
    }
```
Add `buildFrameControls,` to the VizKit object returned/exposed (~line 1411, next to `buildStepControls,`).

- [ ] **Step 5: Add the CSS**

In `style.css`, extend the `.stepctl` block (near line 1779) so the new bar renders like the RB-tree transport (scope to `.stepctl`, mirror `.rbviz-transport .tbtn/.cnt` at lines 2967-2972):
```css
.stepctl .tbtn { border: 1px solid var(--card-border, #cbd5e1); background: var(--surface-muted, #f1f5f9); color: var(--text-main, #1e293b); cursor: pointer; width: 38px; height: 34px; border-radius: 6px; font-size: 15px; display: inline-flex; align-items: center; justify-content: center; }
.stepctl .tbtn:hover { border-color: var(--primary-color, #2563eb); }
.stepctl .tbtn.play { background: var(--primary-color, #2563eb); border-color: var(--primary-color, #2563eb); color: #fff; width: 44px; }
.stepctl .stepctl-scrubber { flex: 1; min-width: 120px; max-width: 240px; accent-color: var(--primary-color, #2563eb); vertical-align: middle; }
.stepctl .stepctl-count { font-size: 12px; color: var(--text-subtle, #64748b); min-width: 86px; text-align: right; font-variant-numeric: tabular-nums; }
```
(Keep the existing `.stepctl`, `.stepctl-speed-wrap`, `.stepctl-speed` rules. Remove the now-irrelevant `.stepctl [data-action="run"] { min-width: 64px; }` at line 2512, since the run button is now a fixed-width `.tbtn.play`.)

- [ ] **Step 6: Migrate the pilot viz — `js/viz/viz_graph_aoe.js`**

Apply the Recipe (Shape A) at line 52. `renderGraphAoe` uses `AoeViz.buildAoeFrames().frames` with an idx and a `paint()` that renders `.aoe-phase` etc. from `frames[idx]`. Convert `paint` to `paint(fr)`, drop `idx`/`step`/`reset`/trailing `paint()`, and call `buildFrameControls(frames, paint, { runIntervalMs: 800 })`.

- [ ] **Step 7: Run the control specs to verify they pass**

Run: `npx playwright test tests/step_controls.spec.js tests/frame_controls.spec.js`
Expected: PASS.

- [ ] **Step 8: Run the FULL suite (all other viz still on `buildStepControls`)**

Run: `npm test`
Expected: PASS — graph-aoe on the new control (+ its updated specs), everything else unchanged.

- [ ] **Step 9: Commit**

```bash
git add js/app.js js/viz/viz_graph_aoe.js style.css tests/step_controls.spec.js tests/frame_controls.spec.js
git commit -m "feat(dsvisual): buildFrameControls VCR transport (back/run/forward/scrubber/counter) + graph-aoe pilot"
```

---

### Task 2: Migrate the graph-program viz (graph-matrix, graph-components) — ARRAYish

**Files:** Modify `js/viz/viz_graph_matrix.js` (line 215), `js/viz/viz_graph_components.js` (line 122). Existing specs `tests/graph_matrix.spec.js`, `tests/graph_components.spec.js` must stay green.

- [ ] **Step 1: Migrate `viz_graph_components.js`** — Recipe Shape A. Its `step()` calls `K().showStatus(langOf(frames[idx].msg), frames[idx].done ? '#34d399' : '#60a5fa')`. Fold that into `paint(fr, i)`: after rendering, `K().showStatus(K().langOf(fr.msg), fr.done ? '#34d399' : '#60a5fa')`. Replace with `buildFrameControls(frames, paint, { runIntervalMs: 800 })`; drop `_st.idx`-driven step/reset and trailing `paint()`. (Keep `_st` for n/edges; the control now owns the cursor. If example/apply handlers call `renderGraphComponents()` to rebuild, that still works — a fresh control is built each render.)

- [ ] **Step 2: Migrate `viz_graph_matrix.js`** — Recipe Shape A with one-time scaffolding. Its `paint()` already does `if (f.done) wireHover()`, and `step()` adds `showStatus`. Fold both into `paint(fr, i)`: render `gmGraphSvg`/`gmMatrixHtml` from `fr`, `K().showStatus(...)`, and `if (fr.done) wireHover()`. Replace with `buildFrameControls(frames, paint, { runIntervalMs: 800 })`; drop `_st.idx` step/reset and trailing `paint()`.

- [ ] **Step 3: Run the graph specs**

Run: `npx playwright test tests/graph_matrix.spec.js tests/graph_components.spec.js`
Expected: PASS — including the graph-matrix hover-after-full-build test (hover wiring still fires on the done frame, reachable via the scrubber/step).

- [ ] **Step 4: Full suite**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/viz/viz_graph_matrix.js js/viz/viz_graph_components.js
git commit -m "refactor(dsvisual): migrate graph-matrix & graph-components to buildFrameControls"
```

---

> **Tasks 3–7 shared method (CLEAN batches):** apply the Migration Recipe to every `buildStepControls` call in the task's listed files (Shape A unless marked **B**), carrying each file's existing `runIntervalMs` verbatim; then run the FULL suite and commit. No new tests — the existing per-viz specs (which click `data-action="step"/"run"/"reset"`) are the coverage and must stay green. Keep any one-time static scaffolding OUTSIDE `paint` (esp. `viz_tree_traversal.js` draws edges once). For **B** files use the `i` arg throughout (Recipe Shape B).

### Task 3: CLEAN batch 1 — trees & structures (8 files)

**Files (Shape A):** `js/viz/viz_tree_array_rep.js:105` (runIntervalMs 700), `js/viz/viz_tree_catalan.js:63` (800), `js/viz/viz_tree_copy_equal.js:86` (800), `js/viz/viz_tree_reconstruct.js:107` (700), `js/viz/viz_tree_traversal.js:96` (700, **static edges drawn one-time — keep outside paint**), `js/viz/viz_threaded.js:59` (700), `js/viz/viz_mway.js:66` (700), `js/viz/viz_tgb.js:142` (700).

- [ ] Apply the Recipe (Shape A) to all 8. Run `npm test` (FULL) → green. Commit `refactor(dsvisual): migrate tree/structure viz to buildFrameControls (batch 1)` staging ONLY these 8 files.

### Task 4: CLEAN batch 2 — expr / search / sort (8 files)

**Files (Shape A):** `js/viz/viz_expr_tree.js:158` (700), `js/viz/viz_expr.js:50` (700), `js/viz/viz_search_fib.js:40` (600), `js/viz/viz_search_interp.js:43` (700), `js/viz/viz_sort_external.js:59` (600), `js/viz/viz_polyphase.js:44` (700), `js/viz/viz_fenwick.js:79` (600, frames built inline via snapshot()), `js/viz/viz_segment.js:131` (600, frames built inline via snapshot()).

- [ ] Apply the Recipe (Shape A) to all 8. Run `npm test` → green. Commit `refactor(dsvisual): migrate expr/search/sort viz to buildFrameControls (batch 2)` staging ONLY these 8 files.

### Task 5: CLEAN batch 3 — lists / matrix / cache / maze (8 files)

**Files (Shape A):** `js/viz/viz_list_doubly.js:39` (600), `js/viz/viz_list_equivalence.js:145` (700), `js/viz/viz_lru.js:50` (700), `js/viz/viz_gc.js:192` (700), `js/viz/viz_matrix_sparse_list.js:155` (700), `js/viz/viz_sparse.js:103` (700), `js/viz/viz_maze.js:55` (500), `js/viz/viz_obst.js:72` (600).

- [ ] Apply the Recipe (Shape A) to all 8. Run `npm test` → green. Commit `refactor(dsvisual): migrate list/matrix/cache/maze viz to buildFrameControls (batch 3)` staging ONLY these 8 files.

### Task 6: CLEAN batch 4 — magic squares & nano (9 files)

**Files (Shape A):** `js/viz/viz_magic.js:139` (500), `js/viz/viz_magic_latin.js:115` (500), `js/viz/viz_magic_symmetry.js:111` (500), `js/viz/viz_magic_torus.js:142` (400), `js/viz/viz_nano_bpe_encode.js:35` (600), `js/viz/viz_nano_bpe_train.js:31` (800), `js/viz/viz_nano_compute_graph.js:34` (700), `js/viz/viz_nano_ngram.js:37` (700), `js/viz/viz_decision_tree_coins.js:83` (900).

- [ ] Apply the Recipe (Shape A) to all 9. Run `npm test` → green. Commit `refactor(dsvisual): migrate magic/nano viz to buildFrameControls (batch 4)` staging ONLY these 9 files.

### Task 7: CLEAN batch 5 — cumulative painters & files (8 sites)

**Files — Shape B (use the `i` arg; draw iterates `frames[0..i]` / references `frames[i]`):** `js/domains/graph.js:296` `renderPrim` (700), `js/domains/graph.js:372` `renderBellmanFord` (400), `js/domains/graph.js:445` `renderFloydWarshall` (800), `js/viz/viz_recursion.js:200` (700).
**Files — Shape A:** `js/viz/viz_game_tree.js:116` (700), `js/viz/viz_huffman.js:98` (800), `js/viz/viz_file_inverted.js:68` (700), `js/viz/viz_file_isam.js:93` (700).

- [ ] Apply the Recipe (Shape B for the 3 graph.js sites + recursion; Shape A for the 4 viz). Run `npm test` → green. Commit `refactor(dsvisual): migrate cumulative-painter viz to buildFrameControls (batch 5)` staging ONLY `js/domains/graph.js` + the 4 viz files.

---

### Task 8: ARRAYish — aho & zalgo (materialize a frames array)

**Files:** Modify `js/viz/viz_aho.js` (line 111), `js/viz/viz_zalgo.js` (line 67). Specs: any aho/zalgo e2e must stay green.

- [ ] **Step 1: `viz_zalgo.js`** — it holds `z[]`+`trace[]` with a `cur` starting at 1. Build a materialized `frames` array (one entry per trace position, index 0 = the initial pre-scan state so the control has a valid start), each frame carrying what the old `draw(cur)` needed. Convert `draw` → `paint(fr, i)` and call `buildFrameControls(frames, paint, { runIntervalMs: 350 })`.

- [ ] **Step 2: `viz_aho.js`** — it has two arrays (`failSteps`, `scanSteps`) with one composite cursor and a cumulative draw. Concatenate into one `frames` array (phase-tagged), keep the cumulative draw as `paint(fr, i)` using `i` over the unified array, and call `buildFrameControls(frames, paint, { runIntervalMs: 500 })`.

- [ ] **Step 3: Verify + commit**

Run: `npm test` → PASS. Commit `refactor(dsvisual): migrate aho & zalgo to buildFrameControls (materialize frames)` staging the 2 files.

---

### Task 9: ARRAYish — pattern steps & OOP steps (persisted cursor)

**Files:** Modify `js/viz/viz_pattern.js` (line 72), `js/app.js` (`syncOopStepControls` ~line 2092). Specs `tests/pattern_step.spec.js`, `tests/oop_visualization.spec.js` must stay green.

- [ ] **Step 1: `viz_pattern.js` `renderStepped`** — it steps `descriptor.diagram.steps` with a module-level `_step` (per-descriptor) and `showStatus(caption)`. Use `buildFrameControls(steps, paint, { runIntervalMs: 900, initialIndex: savedStep, onIndexChange: (i) => { _stepFor[id] = i; } })`, where `paint(step, i)` draws the diagram at index `i` and calls `K().showStatus(K().langOf(step.caption))`. Preserve the existing per-descriptor cursor seeding.

- [ ] **Step 2: OOP `syncOopStepControls` (js/app.js ~2092)** — cursor is external (`oopStep(mode)`/`setOopStep(mode, i)`), array is `OOP_STEPS[mode]`, both callbacks `renderOOP()` + `showStatus`. Use `buildFrameControls(OOP_STEPS[mode], (_, i) => { renderOOP(i); /* + showStatus */ }, { runIntervalMs: <existing>, initialIndex: oopStep(mode), onIndexChange: (i) => setOopStep(mode, i) })`. Preserve the "rebuild the strip when the mode `<select>` changes" behaviour (call `buildFrameControls` again with the new mode's array + `initialIndex`).

- [ ] **Step 3: Verify + commit**

Run: `npx playwright test tests/pattern_step.spec.js tests/oop_visualization.spec.js` then `npm test` → PASS. Commit `refactor(dsvisual): migrate pattern & OOP step controls to buildFrameControls (persisted cursor)` staging `js/viz/viz_pattern.js js/app.js`.

---

### Task 10: IMPERATIVE — skiplist & magic_formula (rebuild control on frames change)

**Files:** Modify `js/viz/viz_skiplist.js` (line 146), `js/viz/viz_magic_formula.js` (line 115). Specs `tests/magic_formula.spec.js` (and any skiplist e2e) must stay green.

- [ ] **Step 1: `viz_magic_formula.js`** — `story.frames` is swapped at runtime (idle→query on a cell click via `startQuery`; →fill on "Fill all"). Factor a helper that, given the current `story.frames`, builds a fresh `buildFrameControls(story.frames, paint, { runIntervalMs: 500 })` and replaces the existing strip in the DOM. Call it on initial render and after each frames swap.

- [ ] **Step 2: `viz_skiplist.js`** — `searchPath` is computed lazily on the first search from the `[data-skiplist-search]` input. Change the flow so entering a search key computes the path and (re)builds a `buildFrameControls(searchPath, paint, { runIntervalMs: 500 })` strip (replacing the old `stepSearch`/`resetSearch`). Insert/Delete already call `renderSkipList` (full rebuild) — unchanged.

- [ ] **Step 3: Verify + commit**

Run: `npx playwright test tests/magic_formula.spec.js` then `npm test` → PASS. Commit `refactor(dsvisual): migrate skiplist & magic_formula to buildFrameControls (rebuild on frames change)` staging the 2 files.

---

### Task 11: Delete `buildStepControls`; prove zero references; final full verification

**Files:** Modify `js/app.js` (remove `buildStepControls` function + its VizKit export line). Update `js/domains/README.md` if it names `buildStepControls`.

- [ ] **Step 1: Prove every consumer migrated**

Run: `grep -rn "buildStepControls" js/ tests/`
Expected: only the definition (js/app.js) + the export line remain; NO call sites in `js/viz/`, `js/domains/`, or `js/app.js` OOP. If any call site remains, STOP — migrate it (apply the Recipe) before deleting.

- [ ] **Step 2: Delete the function + export**

Remove the `function buildStepControls(...) {...}` block and its `buildStepControls,` entry in the VizKit export object. Update `js/domains/README.md` line ~25 to name `buildFrameControls` instead.

- [ ] **Step 3: Prove it's gone**

Run: `grep -rn "buildStepControls" js/ tests/`
Expected: no matches (0 lines).

- [ ] **Step 4: Full suite + unit**

Run: `npm run test:unit` (green) then `npm test` (green — every stepped viz now on the VCR bar; all preserved-selector specs pass; new control specs pass).

- [ ] **Step 5: Commit**

```bash
git add js/app.js js/domains/README.md
git commit -m "refactor(dsvisual): remove buildStepControls — all stepped viz on buildFrameControls"
```

---

## Self-Review

- **Spec coverage:** new `buildFrameControls` API + DOM contract + speed memory (Task 1) ✓; VCR bar ⏮◀▶/⏸▶︎ + scrubber + counter (Task 1 impl + specs) ✓; preserved selectors so existing suite passes (all tasks' `npm test` gate) ✓; all 50 consumers migrated — 42 CLEAN (Tasks 1,3–7), 6 ARRAYish (Tasks 2,8,9), 2 IMPERATIVE (Task 10) ✓; `buildStepControls` deleted with grep-zero proof (Task 11) ✓; Traditional-zh tooltips ✓; idx passed to paint for cumulative painters (Recipe Shape B, Task 7) ✓.
- **Placeholder scan:** none — the control impl, CSS, both control specs, and the Recipe (with two concrete before/afters) are complete; batch tasks give exact files/lines/ms/shape.
- **Consistency:** the `(frames, paint(frame, idx), opts{runIntervalMs,initialIndex,onIndexChange})` signature is identical across Task 1 (def), Tasks 2–10 (consumers), and the specs; DOM contract (`data-action` step/run/reset/back, `.stepctl-scrubber`, `.stepctl-count`, `.stepctl-speed`) identical between impl and specs; counter format `步/Step i / last` consistent between impl and both specs.
- **Completeness backstop:** Task 11's grep-for-zero catches any consumer missed by the hand-listed batches (the inventory is 42+6+2=50; if a batch hand-count is off, Task 11 fails loudly rather than silently shipping a mixed UI).
