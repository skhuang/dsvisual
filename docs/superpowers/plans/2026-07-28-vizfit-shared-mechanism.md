# vizfit Shared Mechanism Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generalize the trie-only fullscreen fit/zoom + bounded-scroll into a reusable "vizfit" mechanism (marker classes + VizKit helpers) and migrate the trie onto it with zero behaviour change.

**Architecture:** Add `VizKit` helpers (`markFocusFit`, `observeFocusFit`, `fitFocusSize`) + generic CSS keyed off card markers `viz-fit` / `viz-fit-svg` and content classes `.vizfit-host` / `.vizfit-scroll` (replacing the `[data-method-section="tree-trie"]`-scoped rules). Repoint `js/viz/viz_trie.js` to consume them. Nothing user-visible changes; the existing trie + fullscreen tests are the parity guard.

**Tech Stack:** vanilla JS (`js/app.js` IIFE + `js/viz/viz_trie.js`), plain CSS flexbox, Playwright e2e.

## Global Constraints

- Targeted `git add` by explicit path only; never `git add -A`/`.`/`-u`; run `git status` first.
- Never hand-edit generated files (`js/code_db.js`, `slides/**`, `js/slides_rendered.js`).
- Non-focus behaviour of the trie (and every other viz) UNCHANGED; the generic CSS only activates on cards a viz marks `viz-fit`.
- e2e assert robust locators (marker classes, `clientHeight` bound, geometry, SVG width attr, step count) — never SVG edge visibility; capture any exact fit size only after it stabilises.
- `availH` from STABLE viewport-anchored positions (drawing top + summed pinned siblings below), NOT `clientHeight` (the first-focus-paint transient bug).
- One branch (`feat/vizfit-shared-mechanism`, already created) + one PR.

**Signature note:** the spec sketched `fitFocusSvg(scrollEl, svgEl, natW, natH)` mutating an element; this plan implements it as `fitFocusSize(scrollEl, natW, natH) → {w, h}` (returns the fitted pixel size) because the trie builds its SVG string with `w/h` inline via `svgFor(...,w,h)` — same mechanism, cleaner for all adopters (caller applies `w/h` to `width`/`height`/`viewBox`).

---

### Task 1: vizfit helpers + generic CSS + trie migration

**Files:**
- Modify: `js/app.js` (add helpers near `buildFrameControls`; export on the `window.VizKit = {…}` object ~line 1412)
- Modify: `style.css` (replace the `[data-method-section="tree-trie"]` fit block ~3291–3307; add base `.vizfit-scroll`; adjust `.trie-scroll`)
- Modify: `js/viz/viz_trie.js` (markup classes; replace inline ResizeObserver with `markFocusFit`; paint uses `fitFocusSize`; delete `readZoom` + `_fitObs`)
- Test: `tests/vizfit.spec.js` (create)

**Interfaces:**
- Consumes: `window.VizKit` (`K()`), `.method-section-card`, `#dynamic-viz-host`, `.viz-body-scaled`, `.stack-container-wrapper`, `--viz-zoom`.
- Produces (on `window.VizKit`): `markFocusFit(hostOrEl, opts?)`, `observeFocusFit(scrollEl)`, `fitFocusSize(scrollEl, natW, natH) → {w,h}`; CSS contract: card markers `viz-fit`/`viz-fit-svg` + content classes `.vizfit-host`/`.vizfit-scroll`.

- [ ] **Step 1: Write the failing contract test**

Create `tests/vizfit.spec.js`:

```js
const { test, expect } = require('@playwright/test'); const path = require('path');
const FILE_URI = 'file://' + path.resolve(__dirname, '../index.html');

test.describe('vizfit shared mechanism (trie is the first adopter)', () => {
  test('focus marks the card viz-fit viz-fit-svg; .vizfit-scroll is the bounded region; zoom toolbar floats', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=tree-trie');
    const scrub = page.locator('.stepctl .stepctl-scrubber');
    await scrub.evaluate((el) => { el.value = el.max; el.dispatchEvent(new Event('input', { bubbles: true })); });
    // the trie's scroll region carries the shared class
    await expect(page.locator('.method-section-card.active .vizfit-scroll')).toHaveCount(1);
    await page.locator('.method-section-card.active .viz-focus-toggle').click();
    const card = page.locator('.method-section-card.active');
    await expect(card).toHaveClass(/viz-fit(\s|$)/);
    await expect(card).toHaveClass(/viz-fit-svg(\s|$)/);
    // bounded: the scroll region leaves room for chrome + VCR
    expect(await page.locator('.vizfit-scroll').evaluate((el) => el.clientHeight <= window.innerHeight - 120)).toBe(true);
    await expect(page.locator('.viz-zoom-controls')).toBeVisible();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx playwright test tests/vizfit.spec.js`
Expected: FAIL — `.vizfit-scroll` does not exist yet (the trie still uses `.trie-scroll` only) and the card has no `viz-fit` class.

- [ ] **Step 3: Add the vizfit helpers to `js/app.js`**

Immediately AFTER the `buildFrameControls` function's closing `}` (the line `    }` right after `return strip;`, ~line 2081), insert:

```js
    // --- vizfit: shared fullscreen fit/zoom + bounded-scroll mechanism (see docs vizfit spec) ---
    let _vizfitObs = null;
    function _vizfitReadZoom(scrollEl) {
        const el = scrollEl && scrollEl.closest ? scrollEl.closest('.viz-body-scaled') : null;
        const v = el ? parseFloat(getComputedStyle(el).getPropertyValue('--viz-zoom')) : 1;
        return (v && isFinite(v) && v > 0) ? v : 1;
    }
    function fitFocusSize(scrollEl, natW, natH) {
        if (!scrollEl || !document.body.classList.contains('viz-focus')) return { w: natW, h: natH };
        const availW = Math.max(scrollEl.clientWidth - 6, 120);
        let below = 0;
        for (let sib = scrollEl.nextElementSibling; sib; sib = sib.nextElementSibling) below += sib.getBoundingClientRect().height;
        const availH = Math.max(window.innerHeight - scrollEl.getBoundingClientRect().top - below - 8, 120);
        let fit = Math.min(availW / natW, availH / natH);
        fit = Math.max(0.3, Math.min(fit, 3));
        const zoom = _vizfitReadZoom(scrollEl);
        return { w: Math.round(natW * fit * zoom), h: Math.round(natH * fit * zoom) };
    }
    function observeFocusFit(scrollEl) {
        if (_vizfitObs) { try { _vizfitObs.disconnect(); } catch (e) { /* ignore */ } _vizfitObs = null; }
        if (!scrollEl || typeof ResizeObserver === 'undefined') return;
        let raf = 0;
        _vizfitObs = new ResizeObserver(function () {
            if (raf) cancelAnimationFrame(raf);
            raf = requestAnimationFrame(function () { raf = 0; window.dispatchEvent(new Event('resize')); });
        });
        _vizfitObs.observe(scrollEl);
    }
    function markFocusFit(hostOrEl, opts) {
        opts = opts || {};
        const card = hostOrEl && hostOrEl.closest ? hostOrEl.closest('.method-section-card') : null;
        if (card) { card.classList.add('viz-fit'); if (opts.svg) card.classList.add('viz-fit-svg'); }
        const scrollEl = hostOrEl && hostOrEl.querySelector ? hostOrEl.querySelector('.vizfit-scroll') : null;
        observeFocusFit(scrollEl);
    }
```

- [ ] **Step 4: Export the helpers on `window.VizKit`**

In `js/app.js`, find the `window.VizKit = {` object (~line 1412) and add the three helpers. Change:
```js
    window.VizKit = {
        acquireDynamicVizHost,
        buildFrameControls,
        getInputDifficulty,
        langOf: (m) => (window.I18N && window.I18N.getCurrentLanguage() === 'zh') ? m.zh : m.en,
        t,
        showStatus,
        executeAnimWrapper,
        getDelay,
    };
```
to:
```js
    window.VizKit = {
        acquireDynamicVizHost,
        buildFrameControls,
        getInputDifficulty,
        langOf: (m) => (window.I18N && window.I18N.getCurrentLanguage() === 'zh') ? m.zh : m.en,
        t,
        showStatus,
        executeAnimWrapper,
        getDelay,
        markFocusFit,
        observeFocusFit,
        fitFocusSize,
    };
```

- [ ] **Step 5: Replace the trie-scoped fit CSS with generic marker-keyed rules (`style.css`)**

Replace the block at `style.css:3291–3307` (from the comment `/* Fullscreen: flex-bounded drawing...` through the `body.viz-focus .method-section-card[data-method-section="tree-trie"] .viz-body-scaled { transform: none; }` line) with:

```css
/* vizfit: generic fullscreen flex-bound + drawing-only zoom. A viz opts in by rendering its
   drawing root as .vizfit-host containing one .vizfit-scroll, and calling K().markFocusFit(host,
   {svg}) — which marks the active card viz-fit (+ viz-fit-svg for per-SVG drawing-only zoom). */
body.viz-focus .method-section-card.active.viz-fit .method-section-visual { overflow: hidden; min-height: 0; }
body.viz-focus .method-section-card.active.viz-fit .viz-body-scaled,
body.viz-focus .method-section-card.active.viz-fit .stack-container-wrapper,
body.viz-focus .method-section-card.active.viz-fit #dynamic-viz-host,
body.viz-focus .method-section-card.active.viz-fit .vizfit-host {
    flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column;
}
body.viz-focus .method-section-card.active.viz-fit .vizfit-scroll {
    flex: 1 1 auto; min-height: 0; max-height: none; overflow: auto;
}
/* Per-SVG drawing-only zoom (single-SVG viz): neutralise the wrapper transform so --viz-zoom
   scales just the SVG via the caller's fitFocusSize layout sizing, not the controls/VCR. */
body.viz-focus .method-section-card.active.viz-fit-svg .viz-body-scaled { transform: none; }
```

Then add a base bounded-scroll rule (non-focus) once, right after that block:
```css
.vizfit-scroll { overflow: auto; max-height: var(--vizfit-maxh, 520px); }
```

Finally, in the `.trie-scroll` base rule (`style.css:3319`) remove the now-duplicated `overflow: auto; max-height: 520px;` (the `.vizfit-scroll` class the element also carries now supplies them). Change:
```css
.trie-scroll { overflow: auto; max-height: 520px; border: 1px solid var(--card-border); border-radius: 8px; background: var(--surface-muted); }
```
to:
```css
.trie-scroll { border: 1px solid var(--card-border); border-radius: 8px; background: var(--surface-muted); }
```

- [ ] **Step 6: Migrate `js/viz/viz_trie.js` markup onto the vizfit classes**

In `render()`, add the shared classes to the wrap and scroll elements. Change:
```js
      '<div class="trie-wrap">' +
```
to:
```js
      '<div class="trie-wrap vizfit-host">' +
```
and change:
```js
        '<div class="trie-scroll"></div>' +
```
to:
```js
        '<div class="trie-scroll vizfit-scroll"></div>' +
```

- [ ] **Step 7: Replace the trie's inline ResizeObserver with `markFocusFit`**

In `js/viz/viz_trie.js` `render()`, delete the inline observer block (the comment `// Repaint when the drawing box changes size …` through the `}` that closes `if (typeof ResizeObserver !== 'undefined') { … }`) and replace it with a single call. The block to delete:
```js
    // Repaint when the drawing box changes size — so the focus fit converges to the SETTLED
    // fullscreen/flex layout instead of a transient first-paint measurement (deterministic; also
    // kills the focus-enter jitter). Box size is flex-driven (independent of the SVG content we
    // write), so this never feedback-loops. One coalesced window 'resize' → buildFrameControls
    // repaints the current frame (cursor-safe). Re-created per render; disconnect the prior one.
    if (_fitObs) { try { _fitObs.disconnect(); } catch (e) {} _fitObs = null; }
    if (typeof ResizeObserver !== 'undefined') {
      var _fitRaf = 0;
      _fitObs = new ResizeObserver(function () {
        if (_fitRaf) cancelAnimationFrame(_fitRaf);
        _fitRaf = requestAnimationFrame(function () { _fitRaf = 0; window.dispatchEvent(new Event('resize')); });
      });
      _fitObs.observe(scrollEl);
    }
```
Replace with:
```js
    K().markFocusFit(host, { svg: true });   // vizfit: mark card viz-fit viz-fit-svg + observe box for re-fit
```
Then delete the now-unused module var declaration `var _fitObs = null;` (near the top of the IIFE, the `// ResizeObserver on the drawing box …` line).

- [ ] **Step 8: Point `paint()` at `fitFocusSize` and delete the local `readZoom`**

In `js/viz/viz_trie.js`, delete the `readZoom` function:
```js
    function readZoom() {
      var el = scrollEl.closest ? scrollEl.closest('.viz-body-scaled') : null;
      var v = el ? parseFloat(getComputedStyle(el).getPropertyValue('--viz-zoom')) : 1;
      return (v && isFinite(v) && v > 0) ? v : 1;
    }
```
Then replace the `paint` focus-fit computation. Change:
```js
    function paint(fr) {
      var w = layout.width, h = layout.height;
      if (document.body.classList.contains('viz-focus')) {
        var availW = Math.max(scrollEl.clientWidth - 6, 120);
        var below = 0;
        for (var sib = scrollEl.nextElementSibling; sib; sib = sib.nextElementSibling) below += sib.getBoundingClientRect().height;
        var availH = Math.max(window.innerHeight - scrollEl.getBoundingClientRect().top - below - 8, 120);
        var fit = Math.min(availW / layout.width, availH / layout.height);
        fit = Math.max(0.3, Math.min(fit, 3));
        var zoom = readZoom();
        w = Math.round(layout.width * fit * zoom);
        h = Math.round(layout.height * fit * zoom);
      }
      scrollEl.innerHTML = svgFor(fullTrie.nodes, fr, layout, w, h);
```
to:
```js
    function paint(fr) {
      var sz = K().fitFocusSize(scrollEl, layout.width, layout.height);
      var w = sz.w, h = sz.h;
      scrollEl.innerHTML = svgFor(fullTrie.nodes, fr, layout, w, h);
```
(If the exact whitespace/comments inside the `if (viz-focus)` block differ from above, match the actual block: it spans `var w = layout.width, h = layout.height;` through the closing `}` of the `if (document.body.classList.contains('viz-focus')) { … }`, immediately before `scrollEl.innerHTML = svgFor(...)`. Replace that whole span with the two `var sz`/`var w` lines.)

- [ ] **Step 9: Run the contract test + trie/fullscreen specs**

Run: `npx playwright test tests/vizfit.spec.js tests/trie.spec.js tests/fullscreen_layout.spec.js`
Expected: PASS — vizfit contract holds; trie build/search + node counts unchanged; fullscreen VCR-in-viewport + drawing-only zoom + narrow-viewport all still pass (behaviour-preserving migration).

- [ ] **Step 10: Confirm the fullscreen spec is not flaky under the refactor**

Run: `npx playwright test tests/fullscreen_layout.spec.js --repeat-each=6`
Expected: all green (the ResizeObserver convergence still holds via `observeFocusFit`).

- [ ] **Step 11: Run the full suites**

Run: `npm run test:unit && npm test`
Expected: unit green; full Playwright green — including `tests/viz_refinements.spec.js`, `tests/viz_fullscreen.spec.js`, `tests/zoom_gesture.spec.js`, `tests/frame_controls.spec.js`. No regressions.

- [ ] **Step 12: Commit**

```bash
git add js/app.js style.css js/viz/viz_trie.js tests/vizfit.spec.js
git commit -m "refactor(dsvisual): extract vizfit shared fullscreen fit/zoom mechanism; migrate trie onto it"
```

---

## Self-Review

**1. Spec coverage:**
- Marker-class convention (`.vizfit-host`/`.vizfit-scroll`, `viz-fit`/`viz-fit-svg`) → Steps 5–6. ✓
- VizKit helpers `markFocusFit`/`observeFocusFit`/`fitFocusSize` → Steps 3–4 (with the `fitFocusSize` signature refinement noted up top). ✓
- Generic CSS replacing the trie-scoped block; base `.vizfit-scroll` non-focus bound → Step 5. ✓
- Trie migration (markup classes, `markFocusFit`, `paint` via `fitFocusSize`, delete inline observer + `readZoom` + `_fitObs`) → Steps 6–8. ✓
- `availH` from stable positions (not clientHeight) → Step 3 `fitFocusSize`. ✓
- Parity guard = existing trie/fullscreen tests green + new `tests/vizfit.spec.js` + `--repeat-each=6` → Steps 9–11. ✓

**2. Placeholder scan:** No TBD/TODO; complete code in each step; commands have expected results. The one soft anchor (Step 8's whitespace caveat) names the exact span to replace, not a vague "handle it." ✓

**3. Type/name consistency:** `fitFocusSize(scrollEl, natW, natH) → {w,h}` defined in Step 3, exported Step 4, consumed in Step 8; `markFocusFit(host, {svg:true})` defined Step 3, called Step 7; marker classes `viz-fit`/`viz-fit-svg`/`.vizfit-host`/`.vizfit-scroll` identical across CSS (Step 5), markup (Step 6), the helper (Step 3), and the test (Step 1); `_vizfitObs` single-observer disconnect matches the trie's original `_fitObs` semantics. ✓
