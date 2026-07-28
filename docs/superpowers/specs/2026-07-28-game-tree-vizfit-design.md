# game-tree → viewBox-SVG (viz-fit-svg) + examples + random — design

- Date: 2026-07-28
- Repo: `/Users/skhuang/course/dsvisual`
- Phase 1, viz #4 of the tree-viz "trie parity" program
  (`docs/superpowers/specs/2026-07-28-tree-viz-trie-parity-roadmap.md`). **Reuses the viewBox-SVG
  pattern established by `tree-threaded`** (#169) on the vizfit **`viz-fit-svg`** path.
- One branch (`feat/game-tree-vizfit`) / one PR.

## Goal

Bring the Game Tree (Minimax / α-β) viz to full trie parity: hidden C++ (`codeDrawer`), a
bounded/drag-scrollable drawing that fits the viewport and drawing-only-zooms crisply in fullscreen
(single viewBox SVG), editable input + saveable examples + a difficulty-aware 🎲 — keeping the α-β
toggle.

## Current structure

`js/viz/viz_game_tree.js` `renderGameTree()`:
- `_gameState = { leaves, useAB }`; `GameTreeViz.SAMPLE_LEAVES = [3,5,6,9,1,2,0,-1]`;
  `buildGameTree(leaves, 2)` (branching 2, pads to a power of 2) → `root`;
  `minimaxFrames(root, useAB)` → frames.
- Recursive layout → `meta[id] = { x, y, node }` (leaves left→right by cursor; parents centered;
  `colW 60, rowH 70, padX 36, padY 30`).
- Controls `.tt-controls`: `.gt-input` (comma ints) + `.gt-build` + `.gt-ab` (α-β checkbox).
- **`.gt-stage`** (`position:relative; overflow:hidden; height:320px`): a `.gt-edges` SVG
  (`inset:0;100%×100%`, static px lines) + a `.gt-nodes` HTML overlay of `.tree-node` divs
  (`dataset.symbol` = leaf value or `▲`/`▽`); `paint(fr,i)` **mutates** those divs per-frame
  (`getElementById`, classList `active`/`visited`/`gt-pruned`, textContent `symbol=value`).
- `.gt-info` status line below. Node model: `{ id, leaf, value, isMax, children }`.
- Pure module `GameTreeViz`: `{ buildGameTree, minimaxFrames, SAMPLE_LEAVES }` (no `randomInput`; no
  `game-tree` entry in the shared `RandomInput` registry).

## Changes

### `js/app.js` — hide code

`game-tree` row (line 99) gains `codeDrawer: true`:
```js
{ id: 'game-tree', title: 'Game Tree (Minimax / α-β)', file: 'game_tree.cpp', visualizer: 'gametree', controls: 'gametree', codeDrawer: true },
```

### `js/game_tree_viz.js` — add a pure `randomInput`

Add `randomInput(difficulty) → { leaves: number[] }`, exported on `api`. Leaf count is a power of 2
(full binary game tree): **normal** 8, **special** 8, **edge** 4, **large** 16. Integer values via
`randInt` in a difficulty-scaled range: normal/edge `-5..9`, large `-9..9`. `special` biases toward a
layout that triggers α-β pruning — e.g. put a strong value early in the first (Max-favorable) subtree
so later Min subtrees prune; a simple, sufficient rule: sort the first half descending. Uses
`Math.random` (pure; browser + node). Always returns ≥4 integers.

### `js/viz/viz_game_tree.js` — viewBox-SVG rewrite (reuse threaded pattern) + examples + 🎲

- **Examples-helper trio** duplicated per convention (`loadExamples`/`saveExample`/`buildExamplesSelect`).
  Serialize an example as `leaves.join(',')`; default `GameTreeViz.SAMPLE_LEAVES.join(',')`; built-in
  **"Heavy pruning"** example (a leaf set that visibly prunes with α-β on), injected after Default.
- **Markup** — wrap in `.gt-wrap.vizfit-host` (direct child of `#dynamic-viz-host`); controls pinned
  (`.gt-input`, `.gt-build`, `.gt-random` 🎲, `.gt-ab` α-β checkbox, `.ex-select`); a
  `.gt-scroll.vizfit-scroll` whose ONLY child is `<svg class="gt-svg">`; `.gt-info` + VCR as later
  siblings of the scroll.
- **Layout unchanged** (recursive `meta`). **Bounds → viewBox** with rounded-rect node half-extents +
  a symmetric margin (no thread headroom): node is `NW=46 × NH=26` centered on `(x,y)`;
  `minX = min(x) - NW/2 - 10`, `maxX = max(x) + NW/2 + 10`, `minY = min(y) - NH/2 - 10`,
  `maxY = max(y) + NH/2 + 10`; `natW = max(maxX-minX, 120)`, `natH = max(maxY-minY, 120)`; SVG
  `viewBox="minX minY natW natH"`, `width`/`height` from `K().fitFocusSize(scrollEl, natW, natH)`.
- **`paint(fr,i)` rebuilds the single SVG's innerHTML each frame** (replaces the per-node
  `getElementById` mutation). Compute the SAME cumulative state as today (pruned Set, returned map,
  α-β text, current id) then emit:
  - edges: `<line class="gt-edge" …>` for each parent→child (static geometry, rebuilt each frame — cheap).
  - nodes: for each `meta` id, a `<rect class="gt-node[ active|visited|gt-pruned]" x=cx-23 y=cy-13
    width=46 height=26 rx=6>` + a `<text class="gt-node-label" x=cx y=cy>LABEL</text>`, where LABEL =
    leaf value, or `▲`/`▽`, or `symbol=value` once the internal node returned (same logic + `∞`/`-∞`
    formatting as today). `active`/`visited`/`gt-pruned` set exactly as the current classList logic.
  - update `.gt-info` (same text: prune / leaf / node α,β,best; + "Root value = …" when the root
    returned).
- After building: inject the built-in example (idempotent, after Default), append the VCR into the
  wrap, then `K().markFocusFit(host, { svg: true })` (viz-fit-svg → per-SVG drawing-only zoom).
- **Wiring:**
  - `.gt-build` → try/catch parse comma ints; if any, set `_gameState.leaves`,
    `saveExample('game-tree', leaves.join(','), GameTreeViz.SAMPLE_LEAVES.join(','))`, re-render.
  - `.gt-random` → `GameTreeViz.randomInput(K().getInputDifficulty()).leaves` → set, save, re-render.
  - `.ex-select` change → parse the value's comma ints → set leaves, re-render.
  - `.gt-ab` change → `_gameState.useAB = checked; renderGameTree()` (unchanged).

### `style.css` — SVG node styling (replaces the HTML `gt-pruned` overlay rules)

Add:
```css
.gt-wrap { width: 100%; }
.gt-svg { display: block; }
.gt-edge { stroke: #94a3b8; stroke-width: 2; }
.gt-node { fill: #1e293b; stroke: #64748b; stroke-width: 2; }
.gt-node.active { fill: #f59e0b; stroke: #b45309; }
.gt-node.visited { fill: #2563eb; stroke: #1e40af; }
.gt-node.gt-pruned { fill: #cbd5e1; stroke: #94a3b8; opacity: 0.5; }
.gt-node-label { fill: #ffffff; font-size: 12px; font-weight: 700; text-anchor: middle; dominant-baseline: middle; }
```
Remove the now-unused HTML rules `.tree-node.gt-pruned` + `.tree-node.gt-pruned.active` (style.css
2534–2535); the shared `.tree-node` base class stays untouched (game-tree stops using it).

## Tests

- **Unit** (`tests/unit/game_tree_viz.test.js`, new or extend): `randomInput(d)` for each difficulty →
  `leaves` is an array whose length is a power of 2 (4/8/16 per difficulty), all integers; over several
  draws; and `buildGameTree(leaves, 2)` + `minimaxFrames(root, true)` don't throw.
- **e2e** (`tests/game_tree_vizfit.spec.js`, new): load `#m=game-tree`;
  1. `.gt-wrap.vizfit-host` + `.gt-scroll.vizfit-scroll > svg.gt-svg`; `.vizfit-scroll` bounded
     (`clientHeight <= window.innerHeight - 120`); `.ex-select` + `.gt-random` + `.gt-ab` present;
     nodes are SVG rects (`.gt-svg .gt-node` count > 0), and there are NO HTML `.gt-nodes .tree-node`.
  2. Stepping: scrub to `max` → `.gt-info` shows "Root value = …"; with α-β ON, at least one
     `.gt-svg .gt-node.gt-pruned` appears (default leaves prune).
  3. 🎲 → `.gt-input` becomes a comma int list (`/^-?\d+(,-?\d+)*$/`) and re-renders (`.gt-node` > 0);
     Build `1,2,3,4` → re-renders + an `.ex-select` option added.
  4. Fullscreen via `.viz-focus-toggle` → card has `viz-fit` AND `viz-fit-svg`; `.gt-svg` `width`
     grows after a rAF; VCR (`.stepctl`) within viewport; zoom toolbar visible.
  5. Code drawer hidden until `.code-drawer-toggle`.
  Assert robust locators (counts, class presence, value regex, width attribute) — never SVG edge
  visibility.
- Existing suites stay green (esp. the vizfit adopters + fullscreen specs; update any pre-existing
  game-tree test that asserted the old HTML overlay to the SVG `.gt-node`).
- Full Playwright before merge.

## Verification

`npm run test:unit` + `npm test` green; browser spot-check zh + en: minimax/α-β tree renders crisply
as one SVG (rect nodes with `symbol=value` labels legible); bounded + drag-scroll in normal view;
fullscreen fits + drawing-only-zoom; α-β toggle prunes; 🎲/examples work; code in the drawer; stepping
(enter/leaf/return/prune) intact.

## Global constraints

- Targeted `git add` by explicit path only; never `-A`/`.`/`-u`; verify `git status` first.
- Never hand-edit generated files (`js/code_db.js`, `slides/**`, `js/slides_rendered.js`).
- `viz-fit-svg` path: `markFocusFit(host,{svg:true})` + `fitFocusSize` for the single SVG.
- `.vizfit-host` a DIRECT child of `#dynamic-viz-host`; `.gt-svg` the sole child of `.vizfit-scroll`;
  `.gt-info`/VCR later DOM siblings.
- Do NOT modify the shared `.tree-node` base class or the layout `colW/rowH/padX/padY`. Examples trio
  duplicated (do NOT refactor). `randomInput` is per-module (no `RandomInput` registry entry for
  game-tree).
- Traditional-zh where the viz emits zh. Non-focus + other viz UNCHANGED.
- One branch + PR.

## Out of scope

- `tree-dsu` (last sub-project). Changing the minimax/α-β algorithm, `minimaxFrames`, `buildGameTree`,
  or the layout geometry. Hoisting the bounds→viewBox math into a shared `VizKit` helper (threaded
  inlines it too; a later DRY cleanup, not this PR). Node-overlap on very large trees (pre-existing,
  program-wide).

## Success criteria

`game-tree` renders as a single viewBox SVG (rounded-rect nodes) on the vizfit **`viz-fit-svg`** path:
C++ in the drawer; bounded drawing that fits the window + drawing-only-zooms in fullscreen (VCR +
controls + α-β toggle operable); editable input + saveable examples + a difficulty-aware 🎲;
minimax/α-β stepping (labels, pruning, root value) intact. Reuses the threaded viewBox-SVG pattern.
Unit + full Playwright green; one review-passed PR. (Leaves only `tree-dsu` in the program.)
