# vizfit `availW` Container Measurement — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make fullscreen ("focus") fit enlarge any vizfit-svg drawing regardless of its natural width, by sourcing the width bound from the fullscreen container instead of the content-driven scroll region — and add a regression guard so the invariant no longer depends on `naturalWidth < viewport`.

**Architecture:** The shared helper `VizKit.fitFocusSize(scrollEl, natW, natH)` in `js/app.js` scales a drawing to fit the focus viewport. Today `availH` is a genuine viewport measurement but `availW` is content-dependent (the flex-centered `.vizfit-scroll` shrinks to the drawing's own width), so wide-short drawings can't grow. The fix makes `availW` symmetric with `availH` by measuring the fullscreen-expanded `.method-section-visual` container. One deterministic Playwright test in `tests/dsu_vizfit.spec.js` pins the now-structural invariant.

**Tech Stack:** Vanilla JS (browser globals, `VizKit` seam), Playwright (`@playwright/test`), file:// index.html.

## Global Constraints

- Work on branch `fix/vizfit-availw-container` (already created off `main`; the spec doc is already committed there). Do NOT work on `feat/dsu-vizfit`.
- No build step — `js/app.js` is loaded directly; edits take effect on reload.
- `js/app.js` is a large generated-style file; make the smallest possible edit inside `fitFocusSize` only. Do not reformat surrounding code.
- Keep all existing vizfit/fullscreen specs green: `vizfit`, `catalan_vizfit`, `tgb_vizfit`, `threaded_vizfit`, `game_tree_vizfit`, `dsu_vizfit`, `viz_fullscreen`, `fullscreen_layout`.
- Full Playwright suite must pass (the deploy-pages workflow runs it as a deploy gate).
- Run Playwright from the repo root `/Users/skhuang/course/dsvisual` using `node_modules/.bin/playwright`.
- Do NOT touch the 4 ds2026 slideshow `.ipynb` notebooks (out of scope here anyway).

---

### Task 1: Wide-state regression guard (failing test first)

Add the regression test BEFORE the fix so we watch it go red → green. tree-dsu is the only adopter that reaches a wide state via typed input; `parseOps` sets `n = clamp(maxIdx+1, 2, 12)`, so `'U0 1; U10 11'` deterministically yields n=12 → an all-singletons initial frame at natW 646 (the state that shrinks pre-fix).

**Files:**
- Test: `tests/dsu_vizfit.spec.js` (append one `test(...)` inside the existing `test.describe('tree-dsu scripted op-sequence + SVG forest (vizfit-svg)', ...)` block, after the last test at line ~50, before the block's closing `});`)

**Interfaces:**
- Consumes: existing app at `file://.../index.html#m=tree-dsu`; DOM contract — `.dsu-input` (text field), `.dsu-build` (button), `.dsu-svg` (SVG with a numeric `width` attribute), `.method-section-card.active .viz-focus-toggle`, `.method-section-visual`.
- Produces: nothing consumed by later tasks (test-only).

- [ ] **Step 1: Write the failing test**

Open `tests/dsu_vizfit.spec.js`. The file ends with the describe block closing (`});`) around line 51. Insert this test as the last test inside that describe block (i.e., immediately before the final `});` that closes `test.describe`):

```javascript
  test('fullscreen enlarges a WIDE drawing too (fit is natural-width-independent)', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=tree-dsu');
    // n = clamp(maxIdx+1, 2, 12); 'U0 1; U10 11' -> n=12 -> all-singletons initial
    // frame is ~646px wide, wider than any current default. Pre-fix this state
    // SHRINKS in fullscreen (content-driven availW); post-fix it grows.
    await page.fill('.dsu-input', 'U0 1; U10 11');
    await page.click('.dsu-build');
    const svgW = () => page.locator('.dsu-svg').getAttribute('width').then((v) => parseFloat(v));
    const before = await svgW();
    expect(before).toBeGreaterThan(600); // sanity: we are actually in the wide state
    await page.locator('.method-section-card.active .viz-focus-toggle').click();
    const card = page.locator('.method-section-card.active');
    await expect(card).toHaveClass(/viz-fit-svg(\s|$)/);
    // Grows to fill the fullscreen width (natural-width-independent) ...
    await expect.poll(async () => await svgW()).toBeGreaterThan(before);
    // ... and still fits within the fullscreen container (no cramping/overflow).
    const visW = await page.locator('.method-section-visual').first().evaluate((el) => el.clientWidth);
    expect(await svgW()).toBeLessThanOrEqual(visW);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
cd /Users/skhuang/course/dsvisual && node_modules/.bin/playwright test tests/dsu_vizfit.spec.js -g "WIDE" --reporter=list
```
Expected: FAIL — the `expect.poll(svgW).toBeGreaterThan(before)` times out because pre-fix the wide drawing shrinks (646 → ~617), so `after` never exceeds `before`.

- [ ] **Step 3: Commit the failing test**

```bash
cd /Users/skhuang/course/dsvisual && git add tests/dsu_vizfit.spec.js && git commit -m "test(dsvisual): wide-state vizfit fullscreen regression guard (red)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Fix `fitFocusSize` — container-derived `availW`

**Files:**
- Modify: `js/app.js` — function `fitFocusSize` (~line 2152), the single `availW` line only.

**Interfaces:**
- Consumes: `scrollEl` (the `.vizfit-scroll` element) — has a `.closest()` method and an ancestor `.method-section-visual` in all 7 adopters when in focus mode.
- Produces: `fitFocusSize` returns `{ w, h }` with the same shape as before; behavior differs only for the width dimension in focus mode.

- [ ] **Step 1: Read the current function to anchor the edit**

Run:
```bash
cd /Users/skhuang/course/dsvisual && sed -n '2152,2162p' js/app.js
```
Expected: shows `function fitFocusSize(...)` with the line `const availW = Math.max(scrollEl.clientWidth - 6, 120);`.

- [ ] **Step 2: Apply the minimal edit**

Replace exactly this line:
```javascript
        const availW = Math.max(scrollEl.clientWidth - 6, 120);
```
with these two lines:
```javascript
        const box = scrollEl.closest && scrollEl.closest('.method-section-visual');
        const availW = Math.max((box ? box.clientWidth : scrollEl.clientWidth) - 24, 120);
```
Leave every other line of `fitFocusSize` unchanged — `availH`, the `fit = Math.max(0.3, Math.min(fit, 3))` clamp, `const zoom = _vizfitReadZoom(scrollEl);`, and the `return { w: Math.round(natW * fit * zoom), h: Math.round(natH * fit * zoom) };`.

- [ ] **Step 3: Verify the edit reads correctly**

Run:
```bash
cd /Users/skhuang/course/dsvisual && sed -n '2152,2163p' js/app.js
```
Expected: the function now contains the two new lines (`const box = ...` then `const availW = ... clientWidth) - 24, 120);`) and nothing else changed.

- [ ] **Step 4: Run the wide-state test to verify it now passes**

Run:
```bash
cd /Users/skhuang/course/dsvisual && node_modules/.bin/playwright test tests/dsu_vizfit.spec.js -g "WIDE" --reporter=list
```
Expected: PASS — the wide drawing now grows (646 → ~1254) and stays ≤ the container width.

- [ ] **Step 5: Commit the fix**

```bash
cd /Users/skhuang/course/dsvisual && git add js/app.js && git commit -m "fix(dsvisual): vizfit fullscreen fit uses container width, not content width

availW was derived from the flex-centered .vizfit-scroll, which shrinks to the
drawing's own width, so wide-short SVGs could never enlarge in focus mode.
Source availW from the fullscreen .method-section-visual container (symmetric
with availH). Wide tree-dsu now fills the fullscreen width instead of staying
cramped; large drawings still shrink-to-fit + drag-scroll.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Regression sweep — vizfit/fullscreen specs green

**Files:** none (verification only).

**Interfaces:** none.

- [ ] **Step 1: Run all vizfit + fullscreen specs**

Run:
```bash
cd /Users/skhuang/course/dsvisual && node_modules/.bin/playwright test tests/vizfit.spec.js tests/catalan_vizfit.spec.js tests/tgb_vizfit.spec.js tests/threaded_vizfit.spec.js tests/game_tree_vizfit.spec.js tests/dsu_vizfit.spec.js tests/viz_fullscreen.spec.js tests/fullscreen_layout.spec.js --reporter=list
```
Expected: all tests PASS (was 24; now 25 with the new wide-state guard). Pay attention to the three per-viz "SVG width grows" fullscreen tests (dsu, game_tree, threaded) and the `fullscreen_layout` zoom test — they must stay green.

- [ ] **Step 2: If any spec fails, stop and diagnose**

Do not paper over a failure by weakening an assertion. Re-read the failing spec, compare against the design doc `docs/superpowers/specs/2026-08-01-vizfit-availw-container-design.md`, and confirm whether the `-24` slack or the container choice needs adjustment. Only proceed when green.

---

### Task 4: Full Playwright suite (deploy gate)

**Files:** none (verification only).

**Interfaces:** none.

- [ ] **Step 1: Run the entire suite**

Run:
```bash
cd /Users/skhuang/course/dsvisual && node_modules/.bin/playwright test --reporter=line
```
Expected: the whole suite PASSES (this is what the deploy-pages workflow gates on). Note the total pass count.

- [ ] **Step 2: Confirm the branch is clean and ahead of main**

Run:
```bash
cd /Users/skhuang/course/dsvisual && git status --porcelain && git log --oneline origin/main..HEAD
```
Expected: no uncommitted changes; log shows the spec commit + the three task commits (test-red, fix, and this plan if committed).

---

## Self-Review

**1. Spec coverage:**
- Change 1 (container-derived `availW`) → Task 2. ✓
- Change 2 (wide-state regression guard in `dsu_vizfit.spec.js`) → Task 1. ✓
- Non-goals (no `availH` change, no per-viz default-spec churn, no centering change, keep the gap workaround) → respected; Task 2 edits only the one `availW` line. ✓
- Verification (8 vizfit/fullscreen specs + new test, then full suite) → Tasks 3 & 4. ✓

**2. Placeholder scan:** No TBD/TODO/"handle edge cases"/vague steps — every code step shows exact code and the exact insertion point. ✓

**3. Type consistency:** `fitFocusSize` return shape `{ w, h }` unchanged; the test uses only real DOM selectors that exist in `js/viz/viz_dsu.js` (`.dsu-input`, `.dsu-build`, `.dsu-svg`) and the shared `.viz-focus-toggle` / `.method-section-visual` / `.viz-fit-svg` contracts asserted by the existing `dsu_vizfit` fullscreen test. ✓
