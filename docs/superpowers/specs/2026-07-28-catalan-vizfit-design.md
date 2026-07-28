# tree-catalan → vizfit (layout-only) — design

- Date: 2026-07-28
- Repo: `/Users/skhuang/course/dsvisual`
- Phase 1, viz #1 of the tree-viz "trie parity" program
  (`docs/superpowers/specs/2026-07-28-tree-viz-trie-parity-roadmap.md`). First consumer of the
  Phase-0 vizfit mechanism (`docs/superpowers/specs/2026-07-28-vizfit-shared-mechanism-design.md`).
- One branch (`feat/catalan-vizfit`) / one PR.

## Goal

Bring the Counting-Trees (Catalan) viz to the trie's presentation to the extent its structure allows
(**layout only**, per the roadmap): hidden C++ code (`codeDrawer`), a bounded/drag-scrollable content
region in normal view, and a fullscreen that expands the drawing while keeping the n-buttons and VCR
operable — all via the `viz-fit` path (wrapper zoom; NO per-SVG fit, NO examples/random — Catalan's
only input is `n∈{0..4}`, so those don't apply).

## Current structure

`js/viz/viz_tree_catalan.js` `renderTreeCatalan()` builds everything flat into `host.innerHTML`
(`.cat-controls` hint, `.cat-ns` n-buttons, `.cat-groups` shape gallery, `.cat-total`, `.cat-verdict`,
`.cat-seqwrap` C₀…C₁₀ table, `.et-phase`), then `host.appendChild(buildFrameControls(...))` and wires
the `.cat-nbtn` buttons. `paint(fr,i)` queries `host.querySelector('.cat-groups'|'.cat-total'|
'.cat-verdict'|'.et-phase')`.

## Changes

### `js/app.js` — hide code

Add `codeDrawer: true` to the `tree-catalan` `METHOD_GROUPS` row (line 96):
```js
{ id: 'tree-catalan', title: 'Counting Trees (Catalan)', file: 'tree_catalan.cpp', visualizer: 'catalan', controls: 'catalan', codeDrawer: true },
```

### `js/viz/viz_tree_catalan.js` — adopt the vizfit convention

Restructure `host.innerHTML` into a `.cat-wrap.vizfit-host` root (direct child of `#dynamic-viz-host`,
per the mechanism contract), with the n-controls pinned on top and the scrollable content in a
`.cat-scroll.vizfit-scroll`:
```
host.innerHTML =
  '<div class="cat-wrap vizfit-host">' +
    '<div class="cat-controls">…hint…</div>' +
    '<div class="cat-ns">…nBtns…</div>' +
    '<div class="cat-scroll vizfit-scroll">' +
      '<div class="cat-groups"></div>' +
      '<div class="cat-total"></div>' +
      '<div class="cat-verdict"></div>' +
      '<div class="cat-seqwrap">…title + table…</div>' +
      '<div class="et-phase"></div>' +
    '</div>' +
  '</div>';
const wrap = host.querySelector('.cat-wrap');
```
- `paint()` and the `.cat-nbtn` wiring keep using `host.querySelector(...)`/`host.querySelectorAll(...)`
  — unchanged, since all those elements still live inside `host`.
- Append the VCR strip into `wrap` (NOT `host`): `wrap.appendChild(K().buildFrameControls(frames,
  paint, { runIntervalMs: 800 }))` — so the VCR is a pinned later sibling of `.vizfit-scroll`.
- After building, call `K().markFocusFit(host)` — no `{ svg: true }` (this is the `viz-fit` path:
  bounded + fullscreen-expand + wrapper zoom; Catalan is a gallery, not a single scalable SVG). This
  marks the active card `viz-fit` and wires the ResizeObserver.

### `style.css` — minimal

Add:
```css
.cat-wrap { width: 100%; }
```
The generic `viz-fit` focus rules + the base `.vizfit-scroll { overflow:auto; max-height:var(--vizfit-maxh,520px) }`
(both from Phase 0) do the bounding/expansion. No `--vizfit-maxh` override needed (520px default is
fine for the gallery + table).

## Tests

- **e2e** (`tests/catalan_vizfit.spec.js`, new): load `#m=tree-catalan`;
  1. `.cat-wrap.vizfit-host` and `.cat-scroll.vizfit-scroll` exist; `.vizfit-scroll` is bounded
     (`clientHeight <= window.innerHeight - 120`).
  2. Existing stepping still works: scrub to `max` → `.cat-groups .cat-group` count > 0 and
     `.cat-verdict.cat-ok` shows (the "done" verdict); n-buttons switch n (click `[data-n="4"]` →
     `.cat-nbtn.active` is n=4).
  3. Enter focus via `.viz-focus-toggle` → active card has class `viz-fit`; the VCR strip (`.stepctl`)
     is within the viewport (`getBoundingClientRect().bottom <= window.innerHeight + 1`); the floated
     `.viz-zoom-controls` is visible.
  4. Code drawer hidden until `.code-drawer-toggle` (codeDrawer:true).
  Assert robust locators (counts, class presence, bounding-rect geometry) — never SVG edge visibility.
- Existing suites stay green — especially `tests/vizfit.spec.js` (the trie contract, unaffected) and
  the fullscreen specs.
- Full Playwright before merge.

## Verification

`npm test` green (+ new spec); browser spot-check `#m=tree-catalan` zh + en: gallery bounded +
drag-scrolls in normal view; fullscreen expands the gallery with n-buttons + VCR operable; zoom
`−/100%/+` scales the content; code tucked in the drawer; catalan stepping (group reveal, C₀…C₁₀
table, verdict) unchanged.

## Global constraints

- Targeted `git add` by explicit path only; never `-A`/`.`/`-u`; verify `git status` first.
- Never hand-edit generated files (`js/code_db.js`, `slides/**`, `js/slides_rendered.js`).
- `.vizfit-host` must be a DIRECT child of `#dynamic-viz-host`; the VCR must be a later DOM sibling of
  `.vizfit-scroll` (mechanism contract).
- Non-focus behaviour of every other viz UNCHANGED (the `viz-fit` CSS only fires on the marked card).
- One branch + PR.

## Out of scope

- Examples, random input, per-SVG drawing-only zoom (`viz-fit-svg`/`fitFocusSize`) — none for Catalan
  (roadmap-locked: layout-only). Catalan keeps whole-wrapper zoom.
- Changing the Catalan algorithm, frames, or the n-selector semantics.

## Success criteria

`tree-catalan` adopts the shared vizfit `viz-fit` path: C++ in the code drawer; a bounded,
drag-scrollable gallery in normal view; a fullscreen that expands the gallery while the n-buttons and
VCR stay operable, with a working floated zoom toolbar; all existing catalan stepping intact; new e2e
+ full Playwright green; one review-passed PR. Validates the Phase-0 mechanism on its first real
consumer.
