# Fullscreen Layout Fix + Drawing-Only Zoom Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** In fullscreen (focus mode), keep the trie's VCR control and top controls always visible and operable, bound the drawing to the viewport (drag-scroll when larger), and make zoom scale only the drawing while a floated zoom toolbar stays reachable.

**Architecture:** CSS bounds `.trie-scroll` to the viewport (reserving room for chrome) and floats the zoom toolbar instead of hiding the whole header; the trie's `paint()` sizes the SVG to the bounded area × the current `--viz-zoom` (layout-based, so the bounded scroll box shows real scrollbars); the generic `applyZoom` dispatches a resize so the existing `buildFrameControls` resize→repaint re-runs `paint` at the current frame. Drawing-only zoom is achieved by neutralizing the whole-wrapper transform for the trie in focus.

**Tech Stack:** plain CSS, vanilla JS (`js/viz/viz_trie.js`, `js/app.js`), Playwright e2e.

## Global Constraints

- Targeted `git add` by explicit path only; never `git add -A`/`.`/`-u`; run `git status` first.
- Never hand-edit generated files (`js/code_db.js`, `slides/**`, `js/slides_rendered.js`).
- Non-fullscreen behavior must be UNCHANGED (the `paint` fit+zoom branch is guarded by `body.viz-focus`; all new CSS is `body.viz-focus`-scoped; the `applyZoom` resize dispatch is a no-op for viz whose `paint` ignores zoom).
- e2e assert robust locators (bounding-rect positions, `clientHeight`, SVG `width` attribute, `.stepctl-count`) — never SVG edge visibility.
- The CSS reserve `calc(100vh - 210px)` and the JS `FOCUS_CHROME_RESERVE = 210` must stay equal (note the coupling in a comment).
- One branch (`fix/fullscreen-layout-zoom`, already created) + one PR.

---

### Task 1: Fullscreen bounded layout + drawing-only zoom + floated zoom toolbar

**Files:**
- Modify: `style.css` (focus-mode block ~3245–3293)
- Modify: `js/viz/viz_trie.js` (`paint()` focus branch + a module const + a `readZoom` helper)
- Modify: `js/app.js` (`bindZoomControls.applyZoom` ~531–535)
- Test: `tests/fullscreen_layout.spec.js` (create)

**Interfaces:**
- Consumes: `body.viz-focus`; `.method-section-card[data-method-section="tree-trie"]`; `--viz-zoom` on `.viz-body-scaled`; the existing `buildFrameControls` window-resize repaint; `svgFor(nodes, fr, layout, w, h)`.
- Produces: bounded `.trie-scroll` in focus; drawing-only zoom for the trie; a floated `.viz-zoom-controls` in focus.

- [ ] **Step 1: Write the failing e2e tests**

Create `tests/fullscreen_layout.spec.js`:

```js
const { test, expect } = require('@playwright/test'); const path = require('path');
const FILE_URI = 'file://' + path.resolve(__dirname, '../index.html');

async function enterFocusOnFullTrie(page) {
  await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
  await page.goto(FILE_URI + '#m=tree-trie');
  const scrub = page.locator('.stepctl .stepctl-scrubber');
  await scrub.evaluate((el) => { el.value = el.max; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.locator('.method-section-card.active .viz-focus-toggle').click();
}

test.describe('fullscreen layout + drawing-only zoom', () => {
  test('VCR stays in-viewport, drawing is bounded, zoom toolbar is floated', async ({ page }) => {
    await enterFocusOnFullTrie(page);
    const vcr = page.locator('.stepctl');
    await expect(vcr).toBeVisible();
    expect(await vcr.evaluate((el) => el.getBoundingClientRect().bottom <= window.innerHeight + 1)).toBe(true);
    expect(await page.locator('.trie-scroll').evaluate((el) => el.clientHeight <= window.innerHeight - 150)).toBe(true);
    await expect(page.locator('.viz-zoom-controls')).toBeVisible();
  });

  test('zoom scales only the drawing; controls + VCR stay put; cursor preserved', async ({ page }) => {
    await enterFocusOnFullTrie(page);
    const svgW = () => page.locator('.trie-svg').getAttribute('width').then((v) => parseFloat(v));
    const vcrTop = () => page.locator('.stepctl').evaluate((el) => Math.round(el.getBoundingClientRect().top));
    const beforeW = await svgW();
    const beforeTop = await vcrTop();
    const beforeCount = await page.locator('.stepctl-count').textContent();

    await page.locator('.viz-zoom-controls [data-zoom="in"]').click();
    await expect.poll(async () => await svgW()).toBeGreaterThan(beforeW);           // drawing grew
    expect(Math.abs((await vcrTop()) - beforeTop)).toBeLessThanOrEqual(2);          // VCR did not move
    expect(await page.locator('.stepctl-count').textContent()).toBe(beforeCount);   // cursor preserved

    await page.locator('.viz-zoom-controls [data-zoom="reset"]').click();
    await expect.poll(async () => await svgW()).toBeLessThanOrEqual(beforeW + 1);    // back to fit size
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx playwright test tests/fullscreen_layout.spec.js`
Expected: FAIL — the VCR strip is below the viewport (auto-fit pushes it off), `.viz-zoom-controls` is hidden (header `display:none`), and zoom does not change the SVG width.

- [ ] **Step 3: Update the focus-mode CSS (`style.css`)**

First, remove `.method-section-header` from the focus `display:none` group. Find (`style.css:3245-3253`):
```css
body.viz-focus .app-header,
body.viz-focus .app-category-nav,
body.viz-focus .method-sections-heading,
body.viz-focus .method-section-header,
body.viz-focus .code-drawer,
body.viz-focus .method-section-code,
body.viz-focus .method-section-card.active .code-panel,
body.viz-focus .method-section-card:not(.active) {
    display: none !important;
}
```
Change to (drop the `.method-section-header` line):
```css
body.viz-focus .app-header,
body.viz-focus .app-category-nav,
body.viz-focus .method-sections-heading,
body.viz-focus .code-drawer,
body.viz-focus .method-section-code,
body.viz-focus .method-section-card.active .code-panel,
body.viz-focus .method-section-card:not(.active) {
    display: none !important;
}
```

Then replace the PR #160 line (`style.css:3293`):
```css
body.viz-focus .trie-scroll { max-height: none; }
```
with the new fullscreen layout block:
```css
/* Fullscreen: bound the trie drawing so the top controls/message and the bottom
   VCR stay visible; the drawing scrolls (drag) when larger. The 210px reserve
   MUST stay equal to FOCUS_CHROME_RESERVE in js/viz/viz_trie.js. */
body.viz-focus .trie-scroll { max-height: calc(100vh - 210px); overflow: auto; }
/* Drawing-only zoom: neutralize the whole-wrapper zoom transform for the trie in
   focus, so --viz-zoom scales only the SVG (via paint's layout sizing), not the
   controls/VCR. */
body.viz-focus .method-section-card[data-method-section="tree-trie"] .viz-body-scaled { transform: none; }
/* Keep the zoom toolbar reachable in fullscreen: collapse the header, hide its
   non-zoom parts, and float the zoom controls (mirrors the exit button, right). */
body.viz-focus .method-section-header { padding: 0; margin: 0; border: 0; background: none; min-height: 0; }
body.viz-focus .method-section-header > :first-child,
body.viz-focus .method-section-actions > :not(.viz-zoom-controls) { display: none; }
body.viz-focus .viz-zoom-controls { position: fixed; top: 12px; left: 12px; z-index: 2100; margin: 0; }
```

- [ ] **Step 4: Bounded fit + drawing-only zoom in `paint()` (`js/viz/viz_trie.js`)**

Add the reserve constant. Find the module state line (`js/viz/viz_trie.js`, the `var _st = { … }` line):
```js
  var _st = { words: global.TrieViz.SAMPLE.words.slice(), query: global.TrieViz.SAMPLE.query, mode: 'build' };
```
Add right after it:
```js
  var FOCUS_CHROME_RESERVE = 210;   // px reserved for controls+banner+msg+VCR in focus; keep == the CSS calc(100vh - 210px)
```

Then in `render()`, add a `readZoom` helper just before `function paint(fr) {` (it uses the closure `scrollEl`):
```js
    function readZoom() {
      var el = scrollEl.closest ? scrollEl.closest('.viz-body-scaled') : null;
      var v = el ? parseFloat(getComputedStyle(el).getPropertyValue('--viz-zoom')) : 1;
      return (v && isFinite(v) && v > 0) ? v : 1;
    }
```

Then replace the focus branch of `paint`. Find:
```js
    function paint(fr) {
      var w = layout.width, h = layout.height;
      if (document.body.classList.contains('viz-focus')) {
        var rect = scrollEl.getBoundingClientRect();
        var availW = Math.max(scrollEl.clientWidth - 6, 120);
        var availH = Math.max(window.innerHeight - rect.top - 12, 120);
        var scale = Math.min(availW / layout.width, availH / layout.height);
        scale = Math.max(0.5, Math.min(scale, 3));
        w = Math.round(layout.width * scale);
        h = Math.round(layout.height * scale);
      }
      scrollEl.innerHTML = svgFor(fullTrie.nodes, fr, layout, w, h);
```
with:
```js
    function paint(fr) {
      var w = layout.width, h = layout.height;
      if (document.body.classList.contains('viz-focus')) {
        var availW = Math.max(scrollEl.clientWidth - 6, 120);
        var availH = Math.max(window.innerHeight - FOCUS_CHROME_RESERVE, 140);
        var fit = Math.min(availW / layout.width, availH / layout.height);
        fit = Math.max(0.3, Math.min(fit, 3));
        var zoom = readZoom();
        w = Math.round(layout.width * fit * zoom);
        h = Math.round(layout.height * fit * zoom);
      }
      scrollEl.innerHTML = svgFor(fullTrie.nodes, fr, layout, w, h);
```

- [ ] **Step 5: Dispatch a resize on zoom (`js/app.js`)**

In `bindZoomControls`, find `applyZoom` (`js/app.js:531-535`):
```js
        function applyZoom(z) {
            zoom = Math.max(0.5, Math.min(2.0, Math.round(z * 100) / 100));
            scaled.style.setProperty('--viz-zoom', String(zoom));
            resetBtn.textContent = Math.round(zoom * 100) + '%';
        }
```
Change to:
```js
        function applyZoom(z) {
            zoom = Math.max(0.5, Math.min(2.0, Math.round(z * 100) / 100));
            scaled.style.setProperty('--viz-zoom', String(zoom));
            resetBtn.textContent = Math.round(zoom * 100) + '%';
            requestAnimationFrame(function () { window.dispatchEvent(new Event('resize')); }); // host-fitting viz repaint at new zoom
        }
```

- [ ] **Step 6: Run the new e2e to verify it passes**

Run: `npx playwright test tests/fullscreen_layout.spec.js`
Expected: PASS — VCR in-viewport, `.trie-scroll` bounded, zoom toolbar visible; zoom `+` grows the `.trie-svg` width while the VCR strip stays put and the step count is unchanged; reset returns the width.

- [ ] **Step 7: Run the full suite (no regression)**

Run: `npm test`
Expected: all green — including `tests/viz_refinements.spec.js` (the "auto-fits" test: focus still grows the SVG vs non-focus, cursor preserved), `tests/viz_fullscreen.spec.js`, `tests/trie.spec.js`, `tests/zoom_gesture.spec.js` (non-focus zoom unchanged), `tests/frame_controls.spec.js`. No regressions.

- [ ] **Step 8: Commit**

```bash
git add style.css js/viz/viz_trie.js js/app.js tests/fullscreen_layout.spec.js
git commit -m "fix(dsvisual): fullscreen — bound drawing, keep VCR operable, drawing-only zoom + floated zoom toolbar"
```

---

## Self-Review

**1. Spec coverage:**
- §A bounded drawing + operable VCR (#1/#2) → Step 3 `.trie-scroll` max-height cap + Step 4 `availH = innerHeight − FOCUS_CHROME_RESERVE`. ✓
- §B drawing-only zoom (#3) → Step 3 `.viz-body-scaled { transform:none }` for the trie + Step 4 `readZoom` × fit (layout size → scroll) + Step 5 `applyZoom` resize dispatch. ✓
- §C floated zoom toolbar (#3) → Step 3 remove header from hide-group, collapse header, hide non-zoom children, float `.viz-zoom-controls`. ✓
- Tests: VCR in-viewport + bounded scroll + toolbar visible; zoom grows drawing while VCR fixed + cursor preserved + reset restores → Step 1. ✓

**2. Placeholder scan:** No TBD/TODO; every code step has complete code; every command has an expected result. ✓

**3. Type/name consistency:** `FOCUS_CHROME_RESERVE = 210` (Step 4) equals the CSS `calc(100vh - 210px)` (Step 3); `readZoom` reads `--viz-zoom` set by `applyZoom` on the same `.viz-body-scaled` (`scaled` in `bindZoomControls`); `svgFor(nodes, fr, layout, w, h)` signature reused unchanged; `data-method-section="tree-trie"` matches `section.dataset.methodSection = method.id`. ✓
