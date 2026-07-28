# Fullscreen flex-bounded drawing — design

- Date: 2026-07-28
- Repo: `/Users/skhuang/course/dsvisual`
- Follow-up to PR #161. Replaces the fixed `210px` fullscreen reserve with a flex-based bounded
  layout so the trie's VCR control stays operable at **any** viewport (not just wide desktop
  fullscreen). One branch (`fix/fullscreen-flex-bound`) / one PR.

## Problem

PR #161 bounded the trie drawing in focus mode with a fixed reserve: `.trie-scroll { max-height:
calc(100vh - 210px) }` and `paint` fitting to `window.innerHeight - FOCUS_CHROME_RESERVE(210)`. On a
narrow viewport the trie control row wraps to multiple lines, so the actual chrome (controls + banner
+ msg + VCR) exceeds 210px and the VCR strip is pushed below the fold. Verified in-browser at a
518×358 pane: `vcrBottom 405 > innerHeight 358`. The reserve is not robust to control-wrapping /
small screens.

## Design (flex-based bounded layout)

In focus mode, make the trie panel a flex column that fills the viewport, with the drawing area
(`.trie-scroll`) as the single `flex:1` bounded/scrollable region and the controls + VCR as pinned
auto-height siblings. The browser then bounds the drawing to whatever space remains after the
(possibly wrapped) controls and the VCR — no magic constant, robust to any viewport/locale. All rules
are focus + trie scoped; non-focus and other viz are untouched.

### CSS (`style.css`)

Replace the fixed-reserve rule (lines 3291–3294):
```css
/* Fullscreen: bound the trie drawing ... The 210px reserve MUST stay equal ... */
body.viz-focus .trie-scroll { max-height: calc(100vh - 210px); overflow: auto; }
```
with a flex chain that lets `.trie-scroll` fill the space left by the pinned chrome:
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
Notes:
- The DOM chain is `.method-section-visual` (fixed `inset:0`, already `display:flex; flex-direction:column`
  via `.method-section-visual-live`) → `.viz-body-scaled` → `.stack-container-wrapper` (= the
  `runtimeVisualizer`) → `#dynamic-viz-host` → `.trie-wrap` → `.trie-scroll`. Each intermediate node
  gets `flex:1; min-height:0; display:flex; flex-direction:column` so height propagates down and
  `.trie-scroll` receives the leftover space.
- `.viz-body-scaled` already has `transform: none` in focus for the trie (PR #161), so it behaves as a
  plain flex item.
- `.method-section-visual` overflow becomes `hidden` for the trie in focus (the `.active[data-method-section]`
  selector outranks the generic `body.viz-focus .method-section-card.active .method-section-visual {
  overflow:auto }` focus rule) so the panel itself never scrolls — only `.trie-scroll` does.
- The zoom-toolbar float, header collapse, and `transform:none` rules from PR #161 are unchanged.

### JS (`js/viz/viz_trie.js`)

`paint()` fits the SVG to the **actual** bounded height of the scroll box instead of the window
constant. Replace the focus branch:
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
        var availH = Math.max(scrollEl.clientHeight - 6, 120);   // flex-allocated height (bounds drawing)
        var fit = Math.min(availW / layout.width, availH / layout.height);
        fit = Math.max(0.3, Math.min(fit, 3));
        var zoom = readZoom();
        w = Math.round(layout.width * fit * zoom);
        h = Math.round(layout.height * fit * zoom);
      }
```
And remove the now-unused `FOCUS_CHROME_RESERVE` module constant (line 30). Because `.trie-scroll` is
`flex:1` with `min-height:0` + `overflow:auto`, its `clientHeight` is the flex-allocated height
(independent of content — setting the SVG size does not change it, so no feedback loop), and a zoomed
SVG (`× --viz-zoom`) larger than the box scrolls (drag). The measurement is stable because
`initVizFocus` dispatches a rAF resize on focus enter → `buildFrameControls` repaints after layout
settles.

No change to `js/app.js` (the `applyZoom` resize dispatch and `buildFrameControls` repaint from
PR #160/#161 stay).

## Tests

- **e2e** (`tests/fullscreen_layout.spec.js`, extend the existing describe block): add a test at a
  **small/narrow viewport** that would have failed the fixed reserve —
  `test.use({ viewport: { width: 560, height: 380 } })` (or `page.setViewportSize`) on `#m=tree-trie`,
  enter focus, then assert the `.stepctl` VCR strip is within the viewport
  (`getBoundingClientRect().bottom <= window.innerHeight + 1`) and `.trie-scroll` `clientHeight > 40`
  (non-collapsed, still shows the drawing). This is the regression guard the fixed reserve failed.
- The existing `tests/fullscreen_layout.spec.js` tests (VCR in-viewport at default 1280×720; drawing-
  only zoom grows SVG while VCR fixed + cursor preserved) must stay green. `tests/viz_refinements.spec.js`
  ("auto-fits"), `tests/viz_fullscreen.spec.js`, `tests/trie.spec.js`, `tests/zoom_gesture.spec.js`,
  `tests/frame_controls.spec.js` must stay green.

## Verification

`npm test` (FULL Playwright) green incl. the new small-viewport test + no regression; browser
spot-check in fullscreen at a small pane AND a large one, zh + en: the VCR is visible and operable in
both; the drawing fills the leftover space and drag-scrolls when zoomed; controls wrapping does not
push the VCR off.

## Global constraints

- Concurrent sessions — targeted `git add` by explicit path only; never `-A`/`.`/`-u`; verify
  `git status` first.
- Never hand-edit generated files (`js/code_db.js`, `slides/**`, `js/slides_rendered.js`).
- Non-focus behavior UNCHANGED (all new CSS is `body.viz-focus [tree-trie]`-scoped; `paint` focus
  branch guarded). Other viz in focus unchanged.
- e2e assert robust locators (bounding-rect positions, `clientHeight`, SVG width attr, step count) —
  never SVG edge visibility.
- One branch + PR.

## Out of scope

- Applying the flex-bounded layout to viz other than the trie (they keep their current focus
  behavior; only the trie has the bounded-scroll drawing).
- Preserving scroll position across zoom (drawing re-renders from top each paint — pre-existing).

## Success criteria

In fullscreen the trie VCR control is visible and operable at **any** viewport size (including narrow
panes where the control row wraps); the drawing flexes to fill the remaining space and drag-scrolls
when zoomed; non-focus and other viz are unchanged. A small-viewport e2e guards the regression; full
Playwright green; one review-passed PR.
