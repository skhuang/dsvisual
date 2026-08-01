# vizfit fullscreen fit: make `availW` a genuine container measurement

**Date:** 2026-08-01
**Branch:** `fix/vizfit-availw-container` (off `main`)
**Scope:** shared vizfit-svg fullscreen/fit mechanism + its e2e invariant

## Problem

`VizKit.fitFocusSize(scrollEl, natW, natH)` in `js/app.js` (~line 2152) scales a
drawing to fit the fullscreen ("focus") viewport. It computes two available bounds
**asymmetrically**:

- `availH = window.innerHeight − scrollEl.top − below − 8` — a genuine viewport
  measurement, independent of the drawing.
- `availW = scrollEl.clientWidth − 6` — **content-dependent**. The flex
  `align-items:center` on `.stack-container-wrapper` / the vizfit host lets the
  `.vizfit-scroll` region shrink to the drawing's own width, so `availW ≈ the
  drawing's current width`.

Consequence: a **tall** drawing grows in fullscreen (height is a real bound), but a
**wide + short** drawing cannot — `availW ≈ natW ⟹ fit ≈ 1`, so it never enlarges.

The shared e2e invariant several specs rely on — "entering fullscreen widens the
drawing SVG" (`await expect.poll(svgW).toBeGreaterThan(before)` in
`tests/*_vizfit.spec.js`) — therefore only holds while a viz's natural width is
**smaller than the fit viewport**. Every current adopter's *default* state happens to
satisfy that, so the suite is green; the guarantee is coincidental, not structural.

Reproduced: tree-dsu reaches a wide state (n up to 12 singleton roots ≈ 646px, via
`🎲 large` or typed input). At n=12, `natH` is a single short row (~120px), so width
is the binding dimension. Entering fullscreen at a 1280×720 viewport, the drawing
**shrinks 646 → 617** instead of growing — which would fail the "width grows"
assertion. The tree-dsu implementation worked around this viz-locally by removing an
inter-tree gap to keep the *default* frame narrow (430px); that is not a shared guard,
and any future wide vizfit-svg adopter hits the same trap.

## Root cause

The width bound is derived from the scroll region, whose width is content-driven under
the flex centering. The height bound is derived from the viewport. Width can never be
a growth driver because it measures the drawing against itself.

## Fix (chosen: root-cause + tightened invariant)

### Change 1 — `js/app.js`, `fitFocusSize` (~line 2152)

Source `availW` from the fullscreen-expanded container (`.method-section-visual`,
common to all adopters) instead of the scroll's own width:

```js
// before
const availW = Math.max(scrollEl.clientWidth - 6, 120);
// after
const box = scrollEl.closest && scrollEl.closest('.method-section-visual');
const availW = Math.max((box ? box.clientWidth : scrollEl.clientWidth) - 24, 120);
```

Unchanged: `availH` and the height-bounding logic; the `[0.3, 3]` fit clamp; the
`* zoom` drawing-only-zoom multiply; the non-focus early return.

Rationale:
- Makes `availW` symmetric with `availH` — a genuine container bound — so width
  becomes a real growth dimension. Wide-short drawings now fill the fullscreen width.
- `.method-section-visual` is the fullscreen-expanded container present for all 7
  adopters (trie, dsu, game-tree, threaded, catalan, tgb). `scrollEl.clientWidth`
  remains as a defensive fallback, preserving today's behavior if that ancestor is
  ever absent.
- `-24` leaves slack so the centered drawing plus any vertical scrollbar does not
  trigger a horizontal scrollbar that would then steal height.
- Genuinely large drawings still shrink-to-fit (fit floors at 0.3) with bounded
  drag-scroll intact — no regression to that path.

Validated by monkeypatch probe: wide DSU (natW 646) grows 646 → 1254 in a 1278px
fullscreen container; scroll height stays 549 (no horizontal scrollbar); all 24
vizfit/fullscreen specs stay green.

### Change 2 — `tests/dsu_vizfit.spec.js`: wide-state regression guard

Add one deterministic test that pins the invariant to *natural-width-independence*.
tree-dsu is the only adopter that reaches a wide state via typed input, and its `n` is
`clamp(maxIdx+1, 2, 12)`, so a fixed input yields a fixed width:

- Build `'U0 1; U10 11'` → n=12 → all-singletons initial frame, natW 646.
- Capture `before` = SVG width, enter focus.
- Assert the drawing **grew** (`svgW > before`) **and fits within the fullscreen
  container** (`svgW ≤ .method-section-visual clientWidth`).

Pre-fix this fails (drawing shrinks 646 → 617); post-fix it passes. This is the shared
guard the per-viz workaround lacked: a future wide adopter can no longer silently
depend on `naturalWidth < viewport`.

## Non-goals

- No change to `availH` / height bounding.
- No change to the existing per-viz "width grows" default-state specs — they stay
  green and become robustly (not coincidentally) true.
- No change to the `align-items:center` centering — Fix 1 makes it no longer
  load-bearing rather than fighting it.
- The tree-dsu inter-tree-gap workaround stays as-is (harmless; keeps the default
  compact).

## Verification

- Targeted: the 8 vizfit/fullscreen specs (`vizfit`, `catalan_vizfit`, `tgb_vizfit`,
  `threaded_vizfit`, `game_tree_vizfit`, `dsu_vizfit`, `viz_fullscreen`,
  `fullscreen_layout`) + the new wide-state test — all green.
- Full Playwright suite green (the deploy-pages workflow runs it as a deploy gate).
- Manual sanity: wide tree-dsu (`#m=tree-dsu`, typed many-singleton input) toggled to
  fullscreen now fills the width instead of staying cramped.
```
