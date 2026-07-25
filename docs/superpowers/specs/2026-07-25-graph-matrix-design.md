# graph-matrix — Adjacency Matrix visualization — design

- Date: 2026-07-25
- Repo: `/Users/skhuang/course/dsvisual`
- Viz #1 of the chap06 graph-viz program ([[roadmap]]: `docs/superpowers/specs/2026-07-25-chap06-graph-viz-gaps-roadmap.md`).
- Build recipe + program-wide UI conventions per [[dsvisual-viz-authoring]] and the roadmap.

## Goal

An interactive Adjacency Matrix representation viz for the `graphs` category: a user-editable
graph shown side-by-side as a node-link diagram and an n×n adjacency matrix, with a stepped
build that teaches the matrix↔edge correspondence, directed/undirected + weighted toggles,
and degree readouts. Pairs with the existing "Adjacency List" (`graph-adjlist`).

## Behavior

### Representation & input
- A small graph (default = a fixed sample, e.g. the 5-node graph `[[1,4],[0,2,3,4],[1,3],
  [1,2,4],[0,1,3]]` used elsewhere, adapted with a couple of weights). **User-editable**:
  a vertex-count `n` input + an **edge-list text input** (e.g. `0-1, 0-4, 1-2:3, 3-4:2` —
  `u-v` or `u-v:w`; whitespace-tolerant; malformed edges ignored, à la list-equivalence).
- **Toggles:** directed↔undirected (matrix symmetry), unweighted(0/1)↔weighted(stored value).
  Directed reads `u-v` as u→v; undirected fills both.
- **Examples store:** an `.ex-select` of saved graphs via `ExamplesStore` (localStorage,
  keyed `graph-matrix`, cap 8, dedup) + the `loadExamples`/`saveExample`/`buildExamplesSelect`
  helper trio (4th copy, matching `viz_list_equivalence.js`); apply saves the serialized
  `{n, edges, directed, weighted}` input, select restores it.

### Stepped build → free correspondence
- **Pure logic** emits **one frame per edge insertion**: each frame carries the current matrix
  (n×n), the edge added, the filled cell(s), and a bilingual `msg:{zh,en}`. Undirected fills
  `[i][j]` and `[j][i]`; directed fills `[i][j]`. Weighted stores `w`; unweighted stores `1`.
  A final frame marks completion + carries `degree` (row sums = out-degree / undirected
  degree; column sums = in-degree).
- **Render:** `buildStepControls` (Step/Run/Reset) advances insertions; each step highlights
  the new matrix cell(s) AND the corresponding edge in the node-link panel.
- **After completion:** hovering a matrix cell highlights its edge in the graph (and hovering
  an edge highlights its cell) — the free-correspondence mode.

## Architecture (files)

- **`js/graph_matrix_viz.js`** (new, dual-export IIFE): `parseInput(nStr, edgesStr) → {n, edges:[{u,v,w}]}`
  (robust, clamps n≤~10, ignores malformed); `matrixFrames({n, edges, directed, weighted}) →
  {frames}` where each frame = `{matrix, added:{i,j}|[cells], edge, done, degree?, msg:{zh,en}}`;
  a `SAMPLE` default. No DOM. Unit-tested (symmetry vs directed, weighted values, degree sums,
  parse edge cases).
- **`js/viz/viz_graph_matrix.js`** (new, `VizRegistry.attach('graph-matrix', …)`): renders a
  controls bar (n input, edge input, directed/weighted checkboxes, `.ex-select`, apply) + a
  side-by-side node-link SVG (self-contained compact drawer — `buildWeightedGraphSvg` is
  private to the graph domain, so carry a small local drawer) and a matrix grid (mirror the
  existing `floyd-grid`/`floyd-cell`/`floyd-hcell` CSS-grid, with a degree row/col). Wires
  `buildStepControls`, the toggles (re-run frames), example save/restore, and the post-build
  hover correspondence. Bilingual via `K().langOf`.
- **`js/app.js`**: ONE `graphs`-group `METHOD_GROUPS` row —
  `{ id:'graph-matrix', title:'Adjacency Matrix', file:'graph_matrix.cpp',
  visualizer:'graph-matrix', controls:'graph-matrix', codeDrawer:true }` (code hidden behind
  the drawer toggle, rb-tree style).
- **`index.html`**: two `<script defer>` tags (pure module then render module, after
  `js/code_db.js`, before `app.js`); ensure the viz host is inside a scroll container.
- **`cpp/graph_matrix.cpp`** + `build_db.js` mapping → regenerate `js/code_db.js`: adjacency-
  matrix rep (2D array, `addEdge(u,v,w,directed)`, degree from row/col sums).
- **`js/desc_db.js`**: English `graph-matrix` entry (representation, symmetry, weighted, degree,
  space O(n²) vs adjacency list).
- **`style.css`**: reuse `floyd-*` grid styles; add a scroll wrapper (`overflow:auto` both axes)
  for the matrix/graph area + minimal cell-highlight/edge-highlight classes if needed.
- **`tests/graph_matrix.spec.js`** (Playwright e2e).

## Program-wide conventions applied

- **codeDrawer:true** (hidden code + toggle button).
- **ExamplesStore** save/restore of user graphs.
- **overflow:auto** scroll for oversized matrices/graphs.
- Bilingual `zh` = **Traditional (zh-Hant)**; honest step captions; run FULL Playwright before merge.

## Tests

- Unit (`tests/unit/graph_matrix_viz.test.js`): `matrixFrames` — undirected matrix symmetric,
  directed asymmetric, weighted cells carry weights, final `degree` row/col sums correct;
  `parseInput` handles `u-v`, `u-v:w`, whitespace, and drops malformed/out-of-range edges.
- e2e (`tests/graph_matrix.spec.js`): load `#m=graph-matrix`; Step fills matrix cells + a graph
  edge highlights; toggle directed→matrix loses symmetry; toggle weighted→cells show weights;
  degree row/col visible; enter a custom edge list + apply → matrix updates and an `.ex-select`
  option is added; the code panel is hidden until the `.code-drawer-toggle` is clicked; the
  matrix/graph area is scrollable when large.

## Verification

`npm run test:unit` green; `node build_db.js` regenerates only `graph-matrix` code; `npm test`
(FULL Playwright) green incl. the new spec + smoke_modes (add `graph-matrix`) + no regression;
browser spot-check (step build, toggles, degree, hover correspondence, code drawer, scroll) in zh+en.

## Global constraints

- Concurrent refactor session — targeted `git add` only; never `-A`/`.`/`-u`.
- No new category (`graphs` exists) ⇒ `.overview-category` count unchanged; the overview-tile
  count assertion is self-updating (PR #142) — but run full Playwright to confirm.
- One branch (`feat/graph-matrix`) + PR.

## Out of scope

- The other 6 program viz; a general graph editor beyond the edge-list input; refactoring the
  duplicated examples-helper trio; a bilingual `slides_db.js` deck (optional follow-on).

## Success criteria

`graph-matrix` ships in the `graphs` category: user-editable graph ↔ adjacency matrix with a
stepped build + hover correspondence, directed/undirected + weighted toggles, degree readouts,
a hidden code drawer, saveable examples, and a scrollable panel; unit + full Playwright green;
one review-passed PR.
