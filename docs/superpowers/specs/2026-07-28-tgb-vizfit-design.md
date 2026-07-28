# tree-general-binary → vizfit + examples + random — design

- Date: 2026-07-28
- Repo: `/Users/skhuang/course/dsvisual`
- Phase 1, viz #2 of the tree-viz "trie parity" program
  (`docs/superpowers/specs/2026-07-28-tree-viz-trie-parity-roadmap.md`). Consumes the Phase-0 vizfit
  mechanism (`.vizfit-host`/`.vizfit-scroll`, `K().markFocusFit`) via the **`viz-fit`** (wrapper-zoom)
  path.
- One branch (`feat/tgb-vizfit`) / one PR.

## Goal

Bring the General ↔ Binary Tree viz to the trie's presentation: hidden C++ (`codeDrawer`), a
bounded/drag-scrollable drawing area that expands in fullscreen with the controls + VCR operable,
editable input + **saveable examples**, and a **difficulty-aware 🎲 random** general-tree generator.
It is **dual-panel** (general tree + binary tree), so it uses `viz-fit` (whole-wrapper zoom), NOT the
per-SVG `viz-fit-svg` path.

## Current structure

`js/viz/viz_tgb.js` `renderTreeGeneralBinary()`:
- `_tgbState = { text }`, default `TreeGeneralBinaryViz.SAMPLE` = `'A:B,C,D;B:E,F;C:G'`.
- Input format (`parseGeneralTree`): `parent:c1,c2,c3;parent2:cA,cB` (adjacency list; root = the node
  that is never listed as a child).
- Controls `.tt-controls`: `.tgb-input` (text) + `.tgb-build` (Build).
- A `.tgb-stage` (`display:flex;gap:16px;flex-wrap:wrap`) with two fixed panels: `.tgb-general` and
  `.tgb-binary` (each `position:relative;overflow:hidden;height:300px`, an SVG `inset:0;100%×100%`, and
  a nodes div). Layout is computed in px (leaf-order × colW, depth × rowH); nodes are absolutely
  positioned `.tree-node` divs.
- `host.appendChild(buildFrameControls(frames, paint, …))`; `.tgb-build` re-renders from the input.
- Pure module `TreeGeneralBinaryViz`: `{ parseGeneralTree, toBinary, convertFrames, SAMPLE }`.

## Changes

### `js/app.js` — hide code

`tree-general-binary` row (line 93) gains `codeDrawer: true`:
```js
{ id: 'tree-general-binary', title: 'General ↔ Binary Tree', file: 'tree_general_binary.cpp', visualizer: 'tgb', controls: 'tgb', codeDrawer: true },
```

### `js/tree_general_binary_viz.js` — add a pure `randomInput`

Add `randomInput(difficulty) → string` and export it on the `api` object (so it becomes
`TreeGeneralBinaryViz.randomInput`). It builds a **valid rooted general tree** and emits the
`P:c1,c2;…` adjacency string that `parseGeneralTree` accepts. Node labels are unique single tokens
`A,B,C,…` (uppercase A–Z; cap at 20 nodes so labels stay single-letter for `large`; if a level would
exceed `Z`, stop adding). Difficulty shapes it:
- `normal`: `n` = 5–7 nodes; each non-root node attaches to a random already-placed node; branching
  modest (a node gets ≤ 3 children).
- `special`: prefix-heavy left-child/right-sibling stressors — with ~50% chance a **wide fan** (root
  with 4–6 direct children, each possibly one child), else a **deep chain** (each node exactly one
  child, depth 5–7).
- `edge`: extremes — uniformly pick one of: a single node `A`; a pure chain of 4; a star (`A` with
  5 children).
- `large`: `n` = 10–14 nodes, attaching to random placed nodes, branching ≤ 4, deeper.
Implementation: maintain a `placed` list starting `['A']`; for each new label attach it as a child of
a random `placed` node (respecting the per-node child cap and the shape rule); accumulate
`children[parent]`; emit only parents with ≥1 child as `P:c1,c2` segments joined by `;`. Guarantees:
exactly one root (`A`), every non-root has exactly one parent, round-trips through
`parseGeneralTree`/`toBinary`/`convertFrames` without error. Uses `Math.random` (pure, browser+node).

### `js/viz/viz_tgb.js` — vizfit `viz-fit` + examples + random

- **Examples-helper trio** duplicated per convention (`loadExamples`/`saveExample`/
  `buildExamplesSelect`) — do NOT refactor.
- **Markup** — wrap the render in a `.tgb-wrap.vizfit-host` root (direct child of `#dynamic-viz-host`),
  controls pinned on top, the dual-panel stage inside a `.vizfit-scroll`:
  ```
  '<div class="tgb-wrap vizfit-host">' +
    '<div class="tt-controls">' +
      '<input type="text" class="tgb-input" placeholder="A:B,C,D;B:E,F" value="…">' +
      '<button type="button" class="tgb-build">建立 Build</button>' +
      '<button type="button" class="tgb-random" title="隨機輸入 Random input">🎲</button>' +
      buildExamplesSelect('tree-general-binary', TreeGeneralBinaryViz.SAMPLE) +
    '</div>' +
    '<div class="tgb-scroll vizfit-scroll">' +
      '<div class="tgb-stage" style="display:flex;gap:16px;flex-wrap:wrap"> …two panels unchanged… </div>' +
    '</div>' +
  '</div>'
  ```
  (The two panels keep their inline styles / fixed `height:300px` — no per-SVG fit.)
- After building the DOM, **inject a built-in example** (a "Deep chain" `A:B;B:C;C:D;D:E`) into
  `.ex-select` after the Default option (mirroring the trie's built-in-example injection), then append
  the VCR into the wrap and mark focus-fit:
  ```js
  const wrap = host.querySelector('.tgb-wrap');
  wrap.appendChild(K().buildFrameControls(frames, paint, { runIntervalMs: 700 }));
  K().markFocusFit(host);   // viz-fit path (no {svg}) — bounded + fullscreen-expand + wrapper zoom
  ```
- **Wiring**:
  - `.tgb-build` → `_tgbState.text = host.querySelector('.tgb-input').value; saveExample('tree-general-binary', _tgbState.text, TreeGeneralBinaryViz.SAMPLE); renderTreeGeneralBinary();`
  - `.tgb-random` → `const d = (K().getInputDifficulty && K().getInputDifficulty()) || 'normal'; _tgbState.text = TreeGeneralBinaryViz.randomInput(d); saveExample(...); renderTreeGeneralBinary();`
  - `.ex-select` change → `const v = ev.target.value; if (!v) return; _tgbState.text = v; renderTreeGeneralBinary();`
  - `paint` and the layout code keep using `host.querySelector(...)` — every panel/node element still
    lives inside `host`; leave them otherwise UNCHANGED.

### `style.css` — minimal

Add `.tgb-wrap { width: 100%; }`. Base `.vizfit-scroll` (from Phase 0) supplies the bounded scroll +
fullscreen expansion. No per-SVG fit CSS.

## Tests

- **e2e** (`tests/tgb_vizfit.spec.js`, new): load `#m=tree-general-binary`;
  1. `.tgb-wrap.vizfit-host` + `.tgb-scroll.vizfit-scroll` exist; `.vizfit-scroll` bounded
     (`clientHeight <= window.innerHeight - 120`); `.ex-select` + `.tgb-random` present.
  2. Default renders both panels (`.tgb-general .tree-node` count > 0 and `.tgb-binary .tree-node`
     count > 0) and stepping works (scrub to `max` → binary edges present: `.tgb-binary-edges line`
     count > 0).
  3. 🎲: capture `.tgb-input` value; click `.tgb-random`; the value changes to a valid adjacency
     string (`/^[A-Z](:[A-Z,]+)?(;[A-Z]:[A-Z,]+)*$/`-ish — assert it matches
     `/^[A-Z:,;]+$/` and re-parses: `.tgb-general .tree-node` count > 0 after).
  4. Build a custom tree via `.tgb-input` + `.tgb-build` → re-renders + an `.ex-select` option added.
  5. Fullscreen via `.viz-focus-toggle` → active card `viz-fit`; VCR (`.stepctl`)
     `getBoundingClientRect().bottom <= window.innerHeight + 1`; `.viz-zoom-controls` visible.
  6. Code drawer hidden until `.code-drawer-toggle`.
  Assert robust locators (counts, class presence, value regex, geometry) — never SVG edge visibility.
- **Unit** (`tests/unit/tree_general_binary_viz.test.js`, new or extend): `randomInput(d)` for each of
  `normal|special|edge|large` returns a string that (a) `parseGeneralTree` gives exactly one root and
  every non-root has one parent, (b) round-trips through `toBinary`/`convertFrames` without throwing,
  (c) labels are unique A–Z; over several draws.
- Existing suites stay green (esp. `tests/vizfit.spec.js`, fullscreen specs, any existing tgb test).
- Full Playwright before merge.

## Verification

`npm run test:unit` + `npm test` green; browser spot-check zh + en: both panels bounded + fullscreen
expands with controls/VCR operable + wrapper zoom; 🎲 across difficulties yields valid trees; examples
save/restore; code in the drawer; conversion stepping intact.

## Global constraints

- Targeted `git add` by explicit path only; never `-A`/`.`/`-u`; verify `git status` first.
- Never hand-edit generated files (`js/code_db.js`, `slides/**`, `js/slides_rendered.js`).
- `.vizfit-host` a DIRECT child of `#dynamic-viz-host`; VCR a later sibling of `.vizfit-scroll`.
- `viz-fit` path only (NO `{svg:true}`/`fitFocusSize`) — dual-panel keeps wrapper zoom.
- Traditional-zh inline labels. Non-focus + other viz UNCHANGED.
- One branch + PR.

## Out of scope

- Per-SVG drawing-only zoom (`viz-fit-svg`) — dual-panel; wrapper zoom only.
- Changing the general→binary conversion algorithm, `convertFrames`, or the panel layouts.
- Making the panels grow/rescale in fullscreen (they stay `height:300px`; enlargement is via wrapper
  zoom).

## Success criteria

`tree-general-binary` adopts vizfit `viz-fit`: C++ in the drawer; bounded drawing that expands in
fullscreen with operable controls + VCR + working wrapper zoom; editable input + saveable examples +
a difficulty-aware 🎲 producing valid general trees; conversion stepping intact. Unit + full Playwright
green; one review-passed PR.
