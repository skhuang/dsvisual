# vizfit — shared fullscreen fit/zoom + bounded-scroll mechanism — design

- Date: 2026-07-28
- Repo: `/Users/skhuang/course/dsvisual`
- Phase 0 of the tree-viz "trie parity" program
  (`docs/superpowers/specs/2026-07-28-tree-viz-trie-parity-roadmap.md`).
- Generalises the trie-only fullscreen fit/zoom + bounded-scroll into a reusable mechanism, and
  migrates the trie onto it with **zero behaviour change**. One branch
  (`feat/vizfit-shared-mechanism`) / one PR. No user-visible change ships here — this is the
  substrate the five viz consume in Phase 1.

## Current state (trie-specific)

The trie's fullscreen fit/zoom lives in `style.css` scoped to `[data-method-section="tree-trie"]`
(the flex chain through `.trie-wrap`/`.trie-scroll`, the `transform:none`) and in `js/viz/viz_trie.js`
`paint()` (host-fit sizing + `readZoom` + a `ResizeObserver`). Nothing is reusable.

## The mechanism

### Conventions a viz opts into

- Wrap the drawing root (the element inside `#dynamic-viz-host`) as `class="vizfit-host"`, and its
  single bounded scroll region as `class="vizfit-scroll"` (containing the drawing, e.g. an SVG).
- Call one VizKit setup call in `render()` (see `markFocusFit` below). It marks the active
  `.method-section-card` with `viz-fit` (and `viz-fit-svg` for single-SVG per-drawing fit) and wires
  the ResizeObserver.
- **`viz-fit`** (bounded + fullscreen-expand, wrapper zoom): tgb, dsu, catalan.
- **`viz-fit-svg`** (also per-SVG drawing-only zoom: `transform:none` + `fitFocusSize` in paint):
  trie, threaded, game-tree.

### CSS (`style.css`) — replace the trie-scoped block with generic, marker-keyed rules

Non-focus bounded scroll (opt-in default; a viz may override `--vizfit-maxh`):
```css
.vizfit-scroll { overflow: auto; max-height: var(--vizfit-maxh, 520px); }
```
Fullscreen flex-bound (keyed off the card marker `viz-fit`, not an id):
```css
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
/* Per-SVG drawing-only zoom (single-SVG viz only): neutralise the wrapper transform so --viz-zoom
   scales just the SVG via paint's layout sizing. */
body.viz-focus .method-section-card.active.viz-fit-svg .viz-body-scaled { transform: none; }
```
The header-collapse + floated `.viz-zoom-controls` rules (already generic) stay as-is.

### VizKit helpers (`js/app.js`, exported on `window.VizKit`)

- `markFocusFit(hostOrEl, opts)` — `opts = { svg?: boolean }`. Finds the enclosing
  `.method-section-card` (`el.closest('.method-section-card')`), adds `viz-fit` (+ `viz-fit-svg` when
  `opts.svg`). Then finds the `.vizfit-scroll` inside and calls `observeFocusFit` on it. Idempotent.
  Called once per `render()`.
- `observeFocusFit(scrollEl)` — disconnects any prior observer bound to this call site, creates a
  `ResizeObserver` on `scrollEl` that dispatches one rAF-coalesced `window` `resize` when the box
  size changes (so `buildFrameControls` repaints the current frame and the fit converges to the
  settled layout). Safe: box size is flex-driven, independent of SVG content → no loop. Returns the
  observer. (Internally keyed per scroll element via a `WeakMap` so re-renders replace cleanly.)
- `fitFocusSize(scrollEl, natW, natH) → {w,h}` — for `viz-fit-svg` viz, called in `paint()` to size the
  SVG:
  - If NOT `document.body.classList.contains('viz-focus')`: set `svgEl` `width=natW`, `height=natH`,
    `viewBox="0 0 natW natH"` (natural).
  - In focus: `availW = max(scrollEl.clientWidth - 6, 120)`;
    `availH = max(window.innerHeight - scrollEl.getBoundingClientRect().top - <sum of pinned siblings
    below scrollEl in the vizfit-host> - 8, 120)` (STABLE positions, not `clientHeight` — the
    first-focus-paint transient bug from [[dsvisual-fullscreen-focus-mode]]); `fit = clamp(min(availW/
    natW, availH/natH), 0.3, 3)`; `zoom = readZoom(scrollEl)`; set `width=round(natW*fit*zoom)`,
    `height=round(natH*fit*zoom)`, `viewBox="0 0 natW natH"`. Layout-based (not a transform) so the
    bounded box scrolls when zoomed.
  - `readZoom(el)` (internal): `parseFloat(getComputedStyle(el.closest('.viz-body-scaled')).getProperty
    Value('--viz-zoom'))` with a `>0/finite` guard → default 1.

`bindZoomControls.applyZoom` and `initVizFocus`'s focus enter/exit already dispatch a rAF `resize`
(unchanged) — they drive the shared repaint.

### Trie migration (prove the generalization)

Refactor `js/viz/viz_trie.js` + `style.css` so the trie uses the new mechanism instead of its private
copy:
- Markup: `.trie-wrap` also gets class `vizfit-host`; `.trie-scroll` also gets class `vizfit-scroll`
  (keep the `.trie-*` classes for the trie's own styling; add the shared ones). Set
  `--vizfit-maxh: 520px` if needed (trie's current cap).
- `render()`: call `K().markFocusFit(host, { svg: true })` (replaces the trie's inline ResizeObserver
  block — delete that block).
- `paint()`: replace the trie's inline focus-fit math with `K().fitFocusSize(scrollEl,
  layout.width, layout.height)` (the SVG element is the `.trie-svg` written into `.trie-scroll`; the
  helper sizes it). Delete `readZoom` from the trie (now in VizKit).
- `style.css`: delete the `[data-method-section="tree-trie"]`-scoped fit block (superseded by the
  generic `viz-fit`/`viz-fit-svg` rules) and the trie's private ResizeObserver-related CSS if any.
  The `.trie-scroll { max-height:520px }` base rule becomes `--vizfit-maxh` driven or stays (both fine).

Net: identical trie behaviour, now via the shared path.

## Tests

- Existing trie tests are the parity guard: `tests/trie.spec.js`, `tests/fullscreen_layout.spec.js`
  (VCR in-viewport, bounded, drawing-only zoom grows SVG + reset, narrow-viewport 560×380), and the
  fullscreen/viz-refinements fit tests MUST stay green unchanged (proves the migration is behaviour-
  preserving). Run with `--repeat-each=6` on the fullscreen spec to confirm no new flakiness from the
  refactor.
- Add a tiny unit-ish e2e (`tests/vizfit.spec.js`) asserting the generic contract on the trie (the
  first adopter): in focus the active card has classes `viz-fit viz-fit-svg`, `.vizfit-scroll` exists
  and is the flex-bounded region (its `clientHeight <= window.innerHeight - 120`), and the floated
  `.viz-zoom-controls` is visible. (This is what Phase-1 viz will reuse.)
- Full Playwright green.

## Verification

`npm test` green; fullscreen spec `--repeat-each=6` green; browser spot-check the trie in fullscreen
(fit, drawing-only zoom, VCR operable, narrow viewport) — must be indistinguishable from pre-refactor.

## Global constraints

- Targeted `git add` by explicit path only; never `-A`/`.`/`-u`; verify `git status` first.
- Never hand-edit generated files (`js/code_db.js`, `slides/**`, `js/slides_rendered.js`).
- Non-focus behaviour of the trie (and every other viz) UNCHANGED; the generic CSS only activates on
  cards a viz explicitly marks `viz-fit`, so no other viz is affected until Phase 1 opts it in.
- One branch + PR.

## Out of scope

- Applying the mechanism to any of the five viz (that's Phase 1 — each its own PR).
- Multi-SVG per-panel fit (tgb) or HTML-forest fit (dsu) — those use `viz-fit` (bounded + wrapper
  zoom), not `viz-fit-svg`.

## Success criteria

The trie's fullscreen fit/zoom + bounded-scroll are provided by a reusable, marker-class mechanism
(`.vizfit-host`/`.vizfit-scroll`, card markers `viz-fit`/`viz-fit-svg`, VizKit `markFocusFit`/
`observeFocusFit`/`fitFocusSize`); the trie is migrated onto it with identical behaviour (all existing
trie + fullscreen tests green, incl. `--repeat-each=6`); a `tests/vizfit.spec.js` locks the generic
contract. Ready for Phase-1 viz to opt in with a markup class + one setup call.
