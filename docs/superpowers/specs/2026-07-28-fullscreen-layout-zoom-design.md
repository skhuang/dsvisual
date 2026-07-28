# Fullscreen layout fix + drawing-only zoom — design

- Date: 2026-07-28
- Repo: `/Users/skhuang/course/dsvisual`
- Fixes a regression from PR #160 (fullscreen auto-fit) and adds drawing-only zoom in fullscreen.
  One branch (`fix/fullscreen-layout-zoom`) / one PR.

## Problem

PR #160's trie auto-fit set `availH = window.innerHeight − scrollEl.top` and removed `.trie-scroll`'s
height cap (`body.viz-focus .trie-scroll { max-height: none }`). The SVG — and thus the scroll box —
grew to consume all remaining viewport height, and because `.trie-msg` + the VCR transport strip sit
*after* the scroll box in `.trie-wrap`, they were pushed below the fold: the **VCR control became
unreachable** in fullscreen. Additionally, the zoom toolbar (`.viz-zoom-controls`) lives in
`.method-section-header`, which focus mode `display:none`s, so **zoom is unavailable in fullscreen**.

## Requirements (user)

1. The visualization must not grow unbounded and push the VCR control off-screen.
2. Constrain the drawing to the visible viewport so the VCR stays operable; a drawing larger than the
   visible area scrolls (drag up/down/side).
3. Keep zoom in/out available in fullscreen. Zoom affects **only the drawing** — the top controls/
   message row and the bottom VCR row do not move or scale.

## Design

### A. Bounded drawing + operable VCR (#1, #2) — trie, focus mode

- `style.css`: replace `body.viz-focus .trie-scroll { max-height: none; }` (PR #160) with
  `body.viz-focus .trie-scroll { max-height: calc(100vh - 210px); overflow: auto; }`. The ~210px
  reserve covers the controls row + banner + msg + VCR strip + margins, so the whole `.trie-wrap`
  (controls, banner, bounded scroll, msg, VCR) totals ≈ viewport height and the VCR stays visible and
  operable. Overflow `auto` gives drag-scroll for a taller/wider drawing.
- `js/viz/viz_trie.js` `paint()`: change the focus-mode available height from
  `window.innerHeight - rect.top - 12` to `window.innerHeight - 210` (matching the CSS reserve), so
  the SVG fits the bounded drawing area, not the whole window. Define one shared constant
  `FOCUS_CHROME_RESERVE = 210` in the module and use it (the CSS value stays in sync by convention;
  note the coupling in a comment).

### B. Drawing-only zoom (#3)

- `style.css`: neutralize the whole-wrapper transform for the trie in focus so `--viz-zoom` no longer
  scales the controls/VCR:
  `body.viz-focus .method-section-card[data-method-section="tree-trie"] .viz-body-scaled { transform: none; }`.
  (`.method-section-card` carries `data-method-section="tree-trie"` — set at
  `js/app.js:606` `section.dataset.methodSection = method.id`.) Non-trie viz keep their wrapper zoom.
- `js/viz/viz_trie.js` `paint()`: inside the `body.viz-focus` branch, read the current zoom from the
  `.viz-body-scaled` ancestor and multiply the SVG **layout** size by it:
  - `readZoom()` → `var el = scrollEl.closest('.viz-body-scaled'); var v = el ? parseFloat(getComputedStyle(el).getPropertyValue('--viz-zoom')) : 1; return (v && isFinite(v) && v > 0) ? v : 1;`
  - `fit = clamp(min(availW/natW, availH/natH), 0.3, 3)`; `zoom = readZoom()`;
    `w = round(natW * fit * zoom)`, `h = round(natH * fit * zoom)`.
  Because `paint` sets the SVG's `width`/`height` **attributes** (layout size — the existing
  `svgFor(nodes, fr, layout, w, h)` signature), a zoomed drawing enlarges the layout box and
  `.trie-scroll` shows real scrollbars (drag to scroll). Controls/VCR are unaffected. Non-focus is
  unchanged (natural `layout.width`/`layout.height`; the wrapper transform still scales as before).
- `js/app.js` `bindZoomControls.applyZoom`: after `scaled.style.setProperty('--viz-zoom', …)`,
  dispatch a resize so host-fitting viz repaint at the new zoom:
  `requestAnimationFrame(function () { window.dispatchEvent(new Event('resize')); });`. The existing
  `buildFrameControls` resize→repaint (PR #160) re-runs `paint` at the current frame index — no cursor
  change. Harmless for non-host-fitting viz (their `paint` ignores zoom).

### C. Keep the zoom toolbar visible in fullscreen (#3) — generic

- `style.css`: stop hiding the whole `.method-section-header` in focus. Remove
  `body.viz-focus .method-section-header` from the `display:none` group (`style.css:3248`). Instead:
  - Collapse the header so it occupies no space:
    `body.viz-focus .method-section-header { padding: 0; margin: 0; border: 0; background: none; min-height: 0; }`.
  - Hide the header's non-zoom content:
    `body.viz-focus .method-section-header > :first-child,
     body.viz-focus .method-section-actions > :not(.viz-zoom-controls) { display: none; }`
    (hides the title/kicker group, the code-drawer toggle, the Slides button, and the fullscreen
    toggle; exit stays via the floating exit button / Esc).
  - Float the zoom toolbar (mirrors the exit button on the right):
    `body.viz-focus .viz-zoom-controls { position: fixed; top: 12px; left: 12px; z-index: 2100; margin: 0; }`.

## Tests

- **e2e** (`tests/fullscreen_layout.spec.js`, new): load `#m=tree-trie`; enter focus via
  `.viz-focus-toggle`; then:
  1. The `.stepctl` VCR strip is visible and within the viewport (its `getBoundingClientRect().bottom
     <= window.innerHeight`) — i.e. not pushed off-screen.
  2. `.trie-scroll` is height-capped: its `clientHeight <= window.innerHeight - 150` (bounded, room
     for chrome).
  3. The floated `.viz-zoom-controls` is visible; capture the VCR strip's `getBoundingClientRect().top`
     and the `.trie-svg` `width` attribute, click zoom `+` (`[data-zoom="in"]`), then after a rAF the
     `.trie-svg` `width` **increases** (drawing scaled) while the VCR strip's `top` is **unchanged**
     (chrome fixed); the `.stepctl-count` (VCR step counter) is unchanged (cursor preserved).
  4. Click zoom reset (`[data-zoom="reset"]`) → the `.trie-svg` width returns to its pre-zoom value.
- Existing `tests/viz_refinements.spec.js` ("auto-fits" — SVG grows on focus enter, cursor
  preserved), `tests/viz_fullscreen.spec.js`, `tests/trie.spec.js`, `tests/zoom_gesture.spec.js`
  (non-focus zoom unchanged), and `tests/frame_controls.spec.js` must stay green.

## Verification

`npm test` (FULL Playwright) green incl. the new spec + no regression; browser spot-check in
fullscreen (zh + en): the VCR bar is reachable and operable; the drawing area is bounded and
drag-scrolls when large; the floated zoom `−/100%/+` scales only the drawing (controls + VCR stay
put) and the drawing scrolls when zoomed in; exit restores normal view; non-fullscreen zoom + layout
unchanged.

## Global constraints

- Concurrent sessions — targeted `git add` by explicit path only; never `-A`/`.`/`-u`; verify
  `git status` first.
- Never hand-edit generated files (`js/code_db.js`, `slides/**`, `js/slides_rendered.js`).
- Traditional Chinese for any zh copy (this change adds no user-facing text).
- e2e assert robust locators (bounding-rect positions, `clientHeight`, SVG `width` attribute, step
  count) — never SVG edge visibility.
- One branch + PR.

## Out of scope

- Drawing-only zoom for viz other than the trie (they keep whole-wrapper zoom in fullscreen; the
  floated toolbar + `applyZoom` resize dispatch are generic, but only host-fitting viz — currently
  the trie — get drawing-only behavior).
- Converting the reserve to a measured value (a tuned constant is sufficient for wide fullscreen where
  controls occupy one row).
- Pinch/wheel zoom (buttons only, per the existing gesture-off decision in `bindZoomControls`).

## Success criteria

In fullscreen the trie's VCR control is always visible and operable; the drawing area is bounded to
the viewport and drag-scrolls when larger; a floated zoom `−/100%/+` toolbar scales only the drawing
(top controls/message and bottom VCR are unaffected) with the drawing scrolling when zoomed in; the
VCR cursor is preserved across zoom/resize; non-fullscreen behavior is unchanged. Full Playwright
green; one review-passed PR.
