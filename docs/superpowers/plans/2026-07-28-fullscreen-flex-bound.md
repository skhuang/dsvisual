# Fullscreen Flex-Bounded Drawing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace PR #161's fixed `210px` fullscreen reserve with a flex-based bounded layout so the trie's VCR control stays operable at any viewport (including narrow panes where the control row wraps).

**Architecture:** In focus mode the trie panel becomes a flex column filling the viewport; `.trie-scroll` is the single `flex:1` bounded/scrollable region between the pinned controls and the pinned VCR. `paint()` fits the SVG to `.trie-scroll`'s actual (flex-allocated) `clientHeight` instead of a window constant. All rules are focus + trie scoped.

**Tech Stack:** plain CSS flexbox, vanilla JS (`js/viz/viz_trie.js`), Playwright e2e.

## Global Constraints

- Targeted `git add` by explicit path only; never `git add -A`/`.`/`-u`; run `git status` first.
- Never hand-edit generated files (`js/code_db.js`, `slides/**`, `js/slides_rendered.js`).
- Non-focus behavior UNCHANGED (all new CSS is `body.viz-focus […tree-trie]`-scoped; the `paint` focus branch is `body.viz-focus`-guarded). Other viz in focus unchanged.
- e2e assert robust locators (bounding-rect positions, `clientHeight`, SVG width attr, step count) — never SVG edge visibility.
- One branch (`fix/fullscreen-flex-bound`, already created) + one PR.

---

### Task 1: Flex-bounded fullscreen drawing

**Files:**
- Modify: `style.css` (focus block ~3291–3294)
- Modify: `js/viz/viz_trie.js` (remove `FOCUS_CHROME_RESERVE` ~line 30; `paint` focus branch ~131–139)
- Test: `tests/fullscreen_layout.spec.js` (extend)

**Interfaces:**
- Consumes: `body.viz-focus`; `.method-section-card.active[data-method-section="tree-trie"]`; the DOM chain `.method-section-visual → .viz-body-scaled → .stack-container-wrapper → #dynamic-viz-host → .trie-wrap → .trie-scroll`; `readZoom()`; `svgFor(nodes, fr, layout, w, h)`.
- Produces: a flex-bounded `.trie-scroll` in focus; `paint` fitting to `scrollEl.clientHeight`.

- [ ] **Step 1: Write the failing small-viewport e2e**

Append inside the existing `test.describe('fullscreen layout + drawing-only zoom', …)` block in `tests/fullscreen_layout.spec.js`:

```js
  test('VCR stays operable at a narrow viewport where controls wrap', async ({ page }) => {
    await page.setViewportSize({ width: 560, height: 380 });
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=tree-trie');
    const scrub = page.locator('.stepctl .stepctl-scrubber');
    await scrub.evaluate((el) => { el.value = el.max; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await page.locator('.method-section-card.active .viz-focus-toggle').click();
    const vcr = page.locator('.stepctl');
    await expect(vcr).toBeVisible();
    // VCR fully within the (small) viewport — the fixed-210 reserve pushed it off here
    expect(await vcr.evaluate((el) => el.getBoundingClientRect().bottom <= window.innerHeight + 1)).toBe(true);
    // drawing area still shows (flex-allocated, not collapsed)
    expect(await page.locator('.trie-scroll').evaluate((el) => el.clientHeight > 40)).toBe(true);
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx playwright test tests/fullscreen_layout.spec.js -g "narrow viewport"`
Expected: FAIL — at 560×380 the wrapped controls + fixed 210 reserve push the VCR strip below the viewport (`bottom > innerHeight`).

- [ ] **Step 3: Replace the fixed-reserve CSS with the flex chain (`style.css`)**

Find (`style.css:3291-3294`):
```css
/* Fullscreen: bound the trie drawing so the top controls/message and the bottom
   VCR stay visible; the drawing scrolls (drag) when larger. The 210px reserve
   MUST stay equal to FOCUS_CHROME_RESERVE in js/viz/viz_trie.js. */
body.viz-focus .trie-scroll { max-height: calc(100vh - 210px); overflow: auto; }
```
Replace with:
```css
/* Fullscreen: flex-bounded drawing. The panel fills the viewport as a flex column;
   .trie-scroll is the single flex:1 scroll region, so the top controls (even when
   wrapped) and the bottom VCR stay pinned and operable at any viewport size. */
body.viz-focus .method-section-card.active[data-method-section="tree-trie"] .method-section-visual { overflow: hidden; }
body.viz-focus .method-section-card[data-method-section="tree-trie"] .viz-body-scaled,
body.viz-focus .method-section-card[data-method-section="tree-trie"] .stack-container-wrapper,
body.viz-focus .method-section-card[data-method-section="tree-trie"] #dynamic-viz-host,
body.viz-focus .method-section-card[data-method-section="tree-trie"] .trie-wrap {
    flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column;
}
body.viz-focus .method-section-card[data-method-section="tree-trie"] .trie-scroll {
    flex: 1 1 auto; min-height: 0; max-height: none; overflow: auto;
}
```
(Leave the `.viz-body-scaled { transform: none }`, header-collapse, and zoom-float rules that follow at 3295–3304 unchanged.)

- [ ] **Step 4: Fit the SVG to the flex-allocated height (`js/viz/viz_trie.js`)**

(a) Remove the now-unused constant. Find (`js/viz/viz_trie.js:30`):
```js
  var FOCUS_CHROME_RESERVE = 210;   // px reserved for controls+banner+msg+VCR in focus; keep == the CSS calc(100vh - 210px)
```
Delete that line.

(b) In `paint`, replace the focus branch. Find:
```js
      if (document.body.classList.contains('viz-focus')) {
        var availW = Math.max(scrollEl.clientWidth - 6, 120);
        var availH = Math.max(window.innerHeight - FOCUS_CHROME_RESERVE, 140);
        var fit = Math.min(availW / layout.width, availH / layout.height);
        fit = Math.max(0.3, Math.min(fit, 3));
        var zoom = readZoom();
        w = Math.round(layout.width * fit * zoom);
        h = Math.round(layout.height * fit * zoom);
      }
```
with:
```js
      if (document.body.classList.contains('viz-focus')) {
        var availW = Math.max(scrollEl.clientWidth - 6, 120);
        var availH = Math.max(scrollEl.clientHeight - 6, 120);   // flex-allocated height (bounds the drawing)
        var fit = Math.min(availW / layout.width, availH / layout.height);
        fit = Math.max(0.3, Math.min(fit, 3));
        var zoom = readZoom();
        w = Math.round(layout.width * fit * zoom);
        h = Math.round(layout.height * fit * zoom);
      }
```

- [ ] **Step 5: Run the new e2e to verify it passes**

Run: `npx playwright test tests/fullscreen_layout.spec.js -g "narrow viewport"`
Expected: PASS — the drawing flexes to the leftover space, the VCR is within the viewport, `.trie-scroll` is non-collapsed.

- [ ] **Step 6: Run the whole fullscreen spec + full suite**

Run: `npx playwright test tests/fullscreen_layout.spec.js && npm test`
Expected: the 3 fullscreen tests green (default-viewport VCR-in-view, drawing-only zoom, narrow-viewport); full Playwright green — including `tests/viz_refinements.spec.js` ("auto-fits"), `tests/viz_fullscreen.spec.js`, `tests/trie.spec.js`, `tests/zoom_gesture.spec.js`, `tests/frame_controls.spec.js`. No regressions.

- [ ] **Step 7: Commit**

```bash
git add style.css js/viz/viz_trie.js tests/fullscreen_layout.spec.js
git commit -m "fix(dsvisual): fullscreen — flex-bound the trie drawing so the VCR stays operable at any viewport"
```

---

## Self-Review

**1. Spec coverage:**
- Flex chain (`.method-section-visual` overflow:hidden + `.viz-body-scaled/.stack-container-wrapper/#dynamic-viz-host/.trie-wrap` flex:1 + `.trie-scroll` flex:1) → Step 3. ✓
- `paint` fits to `scrollEl.clientHeight` + remove `FOCUS_CHROME_RESERVE` → Step 4. ✓
- Small-viewport regression guard + existing tests stay green → Steps 1/6. ✓

**2. Placeholder scan:** No TBD/TODO; complete code in each step; commands have expected results. ✓

**3. Type/name consistency:** The flex selectors target the real DOM chain (`.stack-container-wrapper` = `runtimeVisualizer` from `js/app.js:399`; `#dynamic-viz-host` from `acquireDynamicVizHost`; `.trie-wrap`/`.trie-scroll` from `viz_trie.js`); `readZoom` and `svgFor(nodes, fr, layout, w, h)` reused unchanged; `data-method-section="tree-trie"` matches `section.dataset.methodSection`; `FOCUS_CHROME_RESERVE` removed from its only two uses (the const + the paint line). ✓
