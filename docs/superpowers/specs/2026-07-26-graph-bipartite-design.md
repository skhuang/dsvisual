# graph-bipartite — Bipartite Check (2-coloring) visualization — design

- Date: 2026-07-26
- Repo: `/Users/skhuang/course/dsvisual`
- Viz #3 of the chap06 graph-viz program (`docs/superpowers/specs/2026-07-25-chap06-graph-viz-gaps-roadmap.md`).
- Follows viz #1 (`graph-matrix`, PR #151) and viz #2 (`graph-components`, PR #152) and the program-wide UI conventions.
- **Uses the new VCR transport** `VizKit.buildFrameControls(frames, paint, opts)` (shipped in PR #153) — the first graph-program viz built on it from the start.

## Goal

An interactive Bipartite-Check viz for the `graphs` category: an undirected graph on which a
stepped **BFS 2-coloring** either succeeds (the graph splits into two color classes → bipartite) or
hits an edge joining two same-colored vertices (an **odd cycle** → NOT bipartite). It has a
user-editable graph + saveable examples, a hidden code drawer, and a scrollable panel, and steps
through the new VCR control (⏮ ◀ ▶/⏸ ▶︎ + scrubber + counter).

## Behavior (chap06)

chap06: *a graph is bipartite iff it has no odd cycle*; detection = BFS/DFS **2-coloring**, alternate
colors level by level, O(n + e). On failure, highlight the offending edge.

- **Undirected only** — no directed/weighted toggles; weights ignored. **BFS 2-coloring** from each
  uncolored vertex (so disconnected graphs are colored per component). Same stepped **per-vertex
  flood-with-frontier** as `graph-components`: seed a vertex with color A, then each dequeued vertex
  colors its uncolored neighbors with the opposite color.
- **Conflict = stop at the first offending edge:** the first time a dequeued vertex meets an
  already-colored neighbor of the **same** color, the viz emits a final conflict frame that
  highlights **that single edge**, declares **NOT bipartite**, and stops — no frames after it.
- **Success:** all vertices colored with no conflict → **bipartite**; the final frame lists the two
  classes **V₁ = {…}, V₂ = {…}**.
- **Default = C6** (6-cycle `0-1-2-3-4-5-0` → bipartite; classes `{0,2,4}` / `{1,3,5}`). A **built-in
  "Odd cycle (C5)"** option in the examples dropdown loads `0-1-2-3-4-0` → NOT bipartite (odd cycle).
  User-editable graph + `ExamplesStore` saved examples on top.

## Architecture (files)

- **`js/graph_bipartite_viz.js`** (new, dual-export IIFE): `parseInput(nStr, edgesStr) →
  {n, edges:[{u,v}]}` (undirected; drops malformed/out-of-range; clamp n≤10; ignores `:w`);
  `bipartiteFrames({n, edges}) → {frames}`. Frame =
  `{color:number[] (-1 uncolored / 0 / 1), current:number|null, frontier:number[], newly:number[],
  seed:boolean, conflict:{u,v}|null, bipartite:boolean|null, done:boolean, classes:{v1:number[],
  v2:number[]}|null, msg:{zh,en}}`. Algorithm: build undirected adjacency (sorted neighbours for
  determinism); for `s` in `0..n-1` if `color[s]===-1`: color[s]=0, queue=[s], seed frame; while
  queue: dequeue `v` (current); for each neighbour `w`: if `color[w]===-1` → color[w]=1-color[v],
  enqueue, add to `newly`; else if `color[w]===color[v]` → emit a conflict frame
  (`conflict:{u:v,v:w}`, `bipartite:false`, `done:true`) and RETURN (stop). Push one frame per
  dequeued vertex. If all done with no conflict → final frame `bipartite:true`, `done:true`,
  `classes` = the two color sets. `SAMPLE = { n:6, edges:[{0,1},{1,2},{2,3},{3,4},{4,5},{5,0}] }`.
  Unit-tested. No DOM.
- **`js/viz/viz_graph_bipartite.js`** (new, `VizRegistry.attach('graph-bipartite', {render,
  code:()=>guarded codeGraphBipartite, layout:{host:'dynamic'}})`): a `.gbp-wrap` with a controls
  bar (`.gbp-n`, `.gbp-edges`, Apply, `.ex-select`), a `.gbp-scroll` (overflow:auto) wrapping a
  compact self-contained node-link SVG (circle layout; nodes `.gbp-node` filled `.gbp-node-a`
  (red) / `.gbp-node-b` (blue) once colored, `.gbp-node-uncolored` neutral otherwise;
  `.gbp-node-current` highlight; `.gbp-node-frontier` dashed ring; the conflict edge gets
  `.gbp-edge-conflict`), a `.gbp-verdict` readout (bipartite ✓ with V₁/V₂ lists, or "NOT bipartite —
  odd cycle at edge u—v"), and a `.gbp-msg`. **Stepping via `K().buildFrameControls(frames,
  paint, { runIntervalMs: 800 })`** — `paint(fr, i)` (Shape A) renders the graph + verdict + msg from
  `fr` and calls `K().showStatus(K().langOf(fr.msg), fr.conflict ? '#f87171' : (fr.done ? '#34d399'
  : '#60a5fa'))`. The control owns the cursor; the viz does NOT keep a local idx/step/reset. Examples
  helper trio duplicated from `viz_graph_components.js` per program convention; a built-in
  **"奇環 Odd cycle" / "Odd cycle"** `<option>` (the C5 serialized string) is injected into the
  `.ex-select` alongside "Default". Apply/example-select rebuild via `renderGraphBipartite()`.
- **`js/app.js`**: ONE `graphs`-group `METHOD_GROUPS` row —
  `{ id:'graph-bipartite', title:'Bipartite Check', file:'graph_bipartite.cpp',
  visualizer:'graph-bipartite', controls:'graph-bipartite', codeDrawer:true }`.
- **`js/i18n.js`**: add `method.graph-bipartite` to BOTH dicts up front — en `'Bipartite Check'`,
  zh `'二分圖判定'` (Traditional).
- **`index.html`**: two `<script defer>` tags (pure then render) after `js/code_db.js`, before `app.js`.
- **`cpp/graph_bipartite.cpp`** + `build_db.js` → regen `js/code_db.js`: BFS 2-coloring
  `isBipartite` returning `{bipartite, color[]}`; default `main` = C6 (bipartite). Mirror the deck.
- **`js/desc_db.js`**: English `graph-bipartite` entry (definition V=V₁∪V₂ no same-side edges; the
  odd-cycle theorem; BFS 2-coloring; O(n+e); `class="complexities"`).
- **`style.css`**: `.gbp-scroll{overflow:auto;…}`, `.gbp-node-a`/`.gbp-node-b` (red/blue),
  `.gbp-node-uncolored`, `.gbp-node-current`, `.gbp-node-frontier` (dashed ring),
  `.gbp-edge`/`.gbp-edge-conflict`, `.gbp-verdict`, `.gbp-msg`.
- **`tests/graph_bipartite.spec.js`** (Playwright e2e); **`tests/unit/graph_bipartite_viz.test.js`**
  (node:test); `tests/smoke_modes.spec.js` (+id).

## Program-wide conventions applied

- **VCR control** `buildFrameControls` (⏮ ◀ ▶/⏸ ▶︎ + scrubber + `步 i / N` counter) — the viz just
  supplies `frames` + `paint(fr, i)`.
- `codeDrawer:true` (hidden code + toggle). `ExamplesStore` save/restore + a built-in odd-cycle
  option. `overflow:auto` scroll. Bilingual `zh` = **Traditional (zh-Hant)**. Honest stepping (the
  rendering maps straight from frame fields; the conflict frame reflects the real offending edge).
  Add the `method.<id>` i18n key up front. Run FULL Playwright before merge.

## Tests

- Unit (`tests/unit/graph_bipartite_viz.test.js`): `bipartiteFrames(SAMPLE=C6)` → final
  `bipartite===true`, `conflict===null`, `classes` partitions `{0,2,4}`/`{1,3,5}`; a **C5** (odd cycle)
  → final frame `bipartite===false` with a `conflict` edge whose two endpoints share a color, and
  **no frames after the conflict** (the conflict frame is last); a **triangle** (n=3, 0-1,1-2,2-0) →
  not bipartite; a **path/tree** → bipartite; a **disconnected** graph (two components, one an even
  cycle + one odd) → not bipartite, conflict in the odd component; `frontier` non-empty during a
  multi-vertex flood and empty at seed/done; every frame `msg` bilingual. `parseInput` undirected:
  `0-1` ≡ `1-0`, drops malformed/out-of-range.
- e2e (`tests/graph_bipartite.spec.js`): load `#m=graph-bipartite`; the VCR bar is present
  (`.stepctl [data-action="step"]`, `.stepctl-scrubber`, `.stepctl-count`); stepping colors a vertex
  (`.gbp-node-a`/`.gbp-node-b` appears) and a frontier ring shows during a flood; scrubber to `max`
  on the default C6 → `.gbp-verdict` says bipartite and lists two classes; selecting the built-in
  **Odd cycle** example then scrubbing to `max` → `.gbp-edge-conflict` highlighted and `.gbp-verdict`
  says NOT bipartite; enter a custom edge list + Apply → graph updates and an `.ex-select` option is
  added; code panel hidden until `.code-drawer-toggle`; the graph area scrolls (`.gbp-scroll`).

## Verification

`npm run test:unit` green; `node build_db.js` regenerates only `graph-bipartite` code (no churn);
`npm test` (FULL Playwright) green incl. the new spec + smoke_modes graph-bipartite + no regression;
browser spot-check (2-coloring flood + frontier + success classes + odd-cycle conflict edge + custom
input + built-in odd-cycle example + code drawer + scroll + VCR back/scrubber) in zh + en.

## Global constraints

- Concurrent refactor session — targeted `git add` only; never `-A`/`.`/`-u`.
- No new category (`graphs` exists) ⇒ `.overview-category` count unchanged; overview-tile count
  self-updating (PR #142) — confirm via full Playwright.
- One branch (`feat/graph-bipartite`) + PR.

## Out of scope

- Bipartite **matching** (Hungarian / Hopcroft-Karp) — mentioned in the deck but a separate topic.
- Directed / weighted variants; the other program viz; a `slides_db` deck (optional follow-on);
  refactoring the duplicated examples helpers.

## Success criteria

`graph-bipartite` ships in `graphs`: an undirected graph with a stepped BFS 2-coloring that either
lists two color classes (bipartite) or highlights the first odd-cycle edge (not bipartite), editable
graph + saveable examples incl. a built-in odd-cycle case, hidden code drawer, scroll, driven by the
VCR `buildFrameControls`; `method.graph-bipartite` i18n present (both langs, Traditional zh); unit +
full Playwright green; one review-passed PR.
