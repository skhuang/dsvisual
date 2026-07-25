# graph-components — Connected Components visualization — design

- Date: 2026-07-25
- Repo: `/Users/skhuang/course/dsvisual`
- Viz #2 of the chap06 graph-viz program (`docs/superpowers/specs/2026-07-25-chap06-graph-viz-gaps-roadmap.md`).
- Follows viz #1 (`graph-matrix`, PR #151) and the program-wide UI conventions.

## Goal

An interactive Connected Components viz for the `graphs` category: an undirected graph on
which a stepped BFS flood-fill labels and colors each connected component, with a running
component count, a user-editable graph + saveable examples, a hidden code drawer, and a
scrollable panel.

## Behavior

chap06 `COMP`: for the lowest-indexed unvisited vertex, BFS/DFS-flood and assign a component
id; repeat. We animate the **BFS flood** (matching the deck's C++).

- **Undirected only** (components are an undirected notion) — no directed/weighted toggles;
  any weights in the input are ignored. Default graph = chap06 **`G3`** (n=5, edges `0-1`,
  `2-3`; vertex `4` isolated → **3 components**, including an isolated vertex).
- **User-editable:** vertex-count `n` input + edge-list text input (`u-v`, whitespace-tolerant,
  malformed dropped) + Apply; **`ExamplesStore`** `.ex-select` (keyed `graph-components`) saves/
  restores the serialized graph. Default seeds from `SAMPLE`.
- **Stepped BFS flood (Step/Run/Reset):** the outer loop picks the lowest unvisited vertex →
  a "seed component k from s" step; then one step per vertex labeled as the queue drains.
  Each step: the **current** vertex highlighted; **frontier** (enqueued-but-not-yet-processed)
  vertices marked (dashed ring); labeled vertices filled with their **component color**; a
  live **"Components: k"** readout. Final frame: done + total count. Bilingual (Traditional zh).

## Architecture (files)

- **`js/graph_components_viz.js`** (new, dual-export IIFE): `parseInput(nStr, edgesStr) →
  {n, edges:[{u,v}]}` (undirected; drops malformed/out-of-range; clamp n≤~10; ignores any
  `:w`); `componentsFrames({n, edges}) → {frames}`. Frame =
  `{comp:number[] (-1 unvisited), current:number|null, frontier:number[], k:number,
  done:boolean, msg:{zh,en}}`. Algorithm = COMP + BFS flood: build adjacency (undirected);
  for `s` in `0..n-1` if `comp[s]===-1`: seed frame (comp[s]=k, queue=[s]); while queue:
  dequeue v (current); for each neighbor w with comp[w]===-1: comp[w]=k, enqueue; push a frame
  per labeled vertex; after the component drains, `k++`. `SAMPLE = {n:5, edges:[{u:0,v:1},{u:2,v:3}]}`.
  Unit-tested. No DOM.
- **`js/viz/viz_graph_components.js`** (new, `VizRegistry.attach('graph-components', {render,
  code:()=>guarded codeGraphComponents, layout:{host:'dynamic'}})`): a `.gc2-wrap` (avoid the
  existing `gc-*` GC classes) with a controls bar (`.gc2-n`, `.gc2-edges`, Apply, `.ex-select`),
  a `.gc2-scroll` (overflow:auto) wrapping a compact self-contained node-link SVG (circle
  layout; nodes filled by `COMPONENT_PALETTE[comp % len]` when labeled, neutral when unvisited;
  current-vertex highlight; frontier dashed ring), a "Components: k" readout, and a `.gc2-msg`.
  `buildStepControls(step, reset, 800)`; example save/restore; the editable input Apply.
- **`js/app.js`**: ONE `graphs`-group `METHOD_GROUPS` row —
  `{ id:'graph-components', title:'Connected Components', file:'graph_components.cpp',
  visualizer:'graph-components', controls:'graph-components', codeDrawer:true }`.
- **`js/i18n.js`**: add `method.graph-components` to BOTH dicts up front — en `'Connected
  Components'`, zh `'連通分量'` (Traditional) — so the nav/section label isn't the raw key.
- **`index.html`**: two `<script defer>` tags (pure then render) after `js/code_db.js`, before `app.js`.
- **`cpp/graph_components.cpp`** + `build_db.js` mapping → regen `js/code_db.js`: the BFS
  flood-fill `connected_components` returning `{k, comp[]}` (mirror the deck's C++).
- **`js/desc_db.js`**: English `graph-components` entry (the COMP procedure; BFS/DFS flood;
  O(n+e) with adjacency lists; component = maximal connected subgraph; `class="complexities"`).
- **`style.css`**: `.gc2-scroll{overflow:auto;...}`, component palette classes / inline fills,
  current-vertex + frontier-ring styles.
- **`tests/graph_components.spec.js`** (Playwright e2e); `tests/smoke_modes.spec.js` (+id).

## Program-wide conventions applied

- `codeDrawer:true` (hidden code + toggle). `ExamplesStore` save/restore. `overflow:auto` scroll.
- Bilingual `zh` = **Traditional (zh-Hant)**; honest stepping (no test-driven distortion);
  add the `method.<id>` i18n key up front; run FULL Playwright before merge.

## Tests

- Unit (`tests/unit/graph_components_viz.test.js`): `componentsFrames(SAMPLE)` → final `k===3`
  and `comp` partitions `{0,1}`,`{2,3}`,`{4}`; a single-edge graph → correct 2-in-1-comp; the
  isolated vertex forms its own component; `frontier` is non-empty during a multi-vertex flood
  and empty at seed/done; one frame per labeled vertex + seed frames; every frame `msg` bilingual.
  `parseInput` undirected: `0-1` and `1-0` equivalent, drops malformed/out-of-range.
- e2e (`tests/graph_components.spec.js`): load `#m=graph-components`; Step colors a vertex and
  advances; after Run the "Components: k" readout shows 3 for the default; a frontier ring
  appears during a flood; enter a custom edge list + Apply → graph updates and an `.ex-select`
  option is added; code panel hidden until `.code-drawer-toggle`; the graph area scrolls when large.

## Verification

`npm run test:unit` green; `node build_db.js` regenerates only `graph-components` code; `npm test`
(FULL Playwright) green incl. the new spec + smoke_modes graph-components + no regression; browser
spot-check (flood + frontier + coloring + count + custom input + example + code drawer + scroll) zh+en.

## Global constraints

- Concurrent refactor session — targeted `git add` only; never `-A`/`.`/`-u`.
- No new category (`graphs` exists) ⇒ `.overview-category` count unchanged; overview-tile count
  self-updating (PR #142) — confirm via full Playwright.
- One branch (`feat/graph-components`) + PR.

## Out of scope

- Directed connectivity / strongly-connected components (that's viz #5 `graph-scc`); the other
  program viz; a `slides_db` deck (optional follow-on); refactoring the duplicated examples helpers.

## Success criteria

`graph-components` ships in `graphs`: an undirected graph with a stepped BFS flood that colors
each component + a live count, editable graph + saveable examples, hidden code drawer, scroll;
`method.graph-components` i18n present (both langs, Traditional zh); unit + full Playwright green;
one review-passed PR.
