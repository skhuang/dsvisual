# graph-scc — Strongly Connected Components (Kosaraju) visualization — design

- Date: 2026-07-26
- Repo: `/Users/skhuang/course/dsvisual`
- Viz #5 (opener of **Phase 2**) of the chap06 graph-viz program
  (`docs/superpowers/specs/2026-07-25-chap06-graph-viz-gaps-roadmap.md`).
- Follows Phase 1 (graph-matrix/components/bipartite/closure) and the program conventions; built on
  the VCR stepping control `buildFrameControls` ([[dsvisual-vcr-frame-controls]] in memory).

## Goal

An interactive Strongly-Connected-Components viz for the `graphs` category: a **directed** graph whose
SCCs are found by **Kosaraju's algorithm**, stepped one DFS action at a time across its three phases,
coloring each SCC, with a live finish-order stack and a second **condensation-DAG** panel that grows a
super-node per SCC.

## Behavior (chap06 / Kosaraju)

An SCC is a maximal set of mutually-reachable vertices in a digraph. Kosaraju (O(n+e)):
1. **DFS on `G`**, pushing each vertex onto a **finish-order stack** as its DFS finishes.
2. **Transpose** `G` → `Gᵀ` (reverse every edge).
3. **Pop** the finish stack; each DFS on `Gᵀ` from a still-unassigned popped vertex paints exactly one
   SCC. Kosaraju discovers SCCs in the condensation's **topological order** (sources first).

- **Directed only.** Weights ignored. Self-loops allowed (a vertex is trivially in its own SCC).
- **Per-DFS-step stepping** (chosen): one frame per DFS **visit**, per **tree-edge** descent, per
  **finish** (phase 1), the **transpose** transition, and per phase-2 **visit** / **new-SCC seed**.
  Bounded O(n + e). Each frame snapshots `visited` / `finishStack` / `comp` (copies — no shared refs).
- **Default sample:** `n = 6`, directed edges `0→1, 1→2, 2→0, 2→3, 3→4, 4→3, 4→5`. SCCs (in Kosaraju
  discovery / topological order): `{0,1,2}` (source cycle) → `{3,4}` (cycle) → `{5}` (singleton sink);
  condensation is the chain `A → B → C`.

## Architecture (files)

- **`js/graph_scc_viz.js`** (new, dual-export IIFE):
  - `SAMPLE = { n:6, edges:[{u:0,v:1},{u:1,v:2},{u:2,v:0},{u:2,v:3},{u:3,v:4},{u:4,v:3},{u:4,v:5}] }`.
  - `parseInput(nStr, edgesStr) → {n, edges:[{u,v}]}` — **directed** (`0-1` ≠ `1-0`; whitespace-tolerant,
    malformed/out-of-range dropped, clamp n≤10, ignores `:w`, self-loop kept).
  - `sccFrames({n, edges}) → {frames}`. Frame =
    `{ phase:'init'|'p1'|'transpose'|'p2'|'done', cur:number|null, treeEdge:{u,v}|null,
    visited:boolean[], finishStack:number[], comp:number[] (-1 unassigned else scc id),
    sccCount:number, msg:{zh,en} }`.
    Algorithm (recursive DFS; n≤10 so depth is safe): build `adj` (G) and `radj` (Gᵀ), sorted neighbour
    lists for determinism. Phase 1: for `s` in `0..n-1` if `!visited[s]` run `dfs1` — a `p1` visit frame
    on entry, a `p1` tree-edge frame before descending to an unvisited `w`, a `p1` finish frame when the
    vertex finishes (pushes `s` on `finishStack`). Emit one `transpose` frame. Phase 2: `comp=-1`,
    `sccCount=0`; while `finishStack` non-empty pop `v`; if `comp[v]===-1` emit a `p2` **seed** frame
    (new SCC id `sccCount`, `cur=v`), run `dfs2(v, sccCount)` (a `p2` visit frame per vertex, tree-edge
    frames on `radj`), then `sccCount++`. Emit `done`. `init` frame first, `done` frame last.
    Unit-tested. No DOM.
- **`js/viz/viz_graph_scc.js`** (new, `VizRegistry.attach('graph-scc', {render, code, layout})`):
  a `.gsc-wrap` (unique prefix) with a controls bar (`.gsc-n`, `.gsc-edges`, Apply, `.ex-select`),
  a `.gsc-scroll` (overflow:auto) wrapping **two panels**:
  1. **Main graph** `.gsc-graph`: directed circle-layout SVG with arrowheads. Draws `G` during
     `init`/`p1`, `Gᵀ` (reversed arrows) during `p2`/`done` (renderer reverses `_st.edges`). Node fill:
     unassigned/unvisited neutral, **visited (p1)** shaded, **SCC-colored** once `comp[i] >= 0` (palette
     cycled by comp id); `.gsc-node-cur` ring on `frame.cur`; the current `frame.treeEdge` highlighted
     `.gsc-edge-tree`.
  2. **Finish-order stack** `.gsc-stack`: the `finishStack` rendered bottom→top (fills in p1, drains in
     p2 — the popped/top item marked).
  3. **Condensation DAG** `.gsc-cond`: derived from `frame.comp` + the original edges — one super-node
     per SCC id present (label = SCC id + member list, colored to match), laid out left→right in
     **discovery order** (= topological order), with deduped inter-SCC edges (`comp[u]→comp[v]`,
     `comp[u]≠comp[v]`, both assigned) drawn between them. Grows as SCCs complete in p2; a caption
     notes it is a DAG.
  Plus a `.gsc-banner` (phase label + "SCCs: k" count) and `.gsc-msg`.
  Stepping via `K().buildFrameControls(frames, paint, {runIntervalMs:700})` (Shape A: `paint(fr,i)`
  renders everything from `fr` + folds `showStatus`; NO local cursor). Examples-helper trio duplicated
  per convention; a built-in **"Single cycle (1 SCC)"** example (`4|0-1,1-2,2-3,3-0`) injected alongside
  "Default". Apply/example-select rebuild via `renderGraphScc()`.
- **`js/app.js`**: ONE `graphs`-group `METHOD_GROUPS` row —
  `{ id:'graph-scc', title:'Strongly Connected Components', file:'graph_scc.cpp',
  visualizer:'graph-scc', controls:'graph-scc', codeDrawer:true }`.
- **`js/i18n.js`**: add `method.graph-scc` to BOTH dicts up front — en `'Strongly Connected Components'`,
  zh `'強連通分量'` (Traditional).
- **`index.html`**: two `<script defer>` tags (pure then render) after `js/code_db.js`, before `app.js`.
- **`cpp/graph_scc.cpp`** + `build_db.js` → regen `js/code_db.js`: Kosaraju (DFS finish-order →
  transpose → DFS), default `main` = SAMPLE; prints each SCC (members). Mirror the deck.
- **`js/desc_db.js`**: English `graph-scc` entry (SCC definition; Kosaraju's 3 steps; transpose; SCCs
  in topological order; O(n+e); condensation DAG; applications: 2-SAT / deadlock detection).
- **`style.css`**: `.gsc-*` block (scroll, directed edges + tree/cur, node states + SCC palette,
  finish stack, condensation super-nodes/edges, banner, msg).
- **`tests/graph_scc.spec.js`** (Playwright e2e); **`tests/unit/graph_scc_viz.test.js`** (node:test);
  `tests/smoke_modes.spec.js` (+id).

## Program-wide conventions applied

- **VCR control** `buildFrameControls` (⏮ ◀ ▶/⏸ ▶︎ + scrubber + `步 i / N`). `codeDrawer:true`.
  `ExamplesStore` + a built-in single-cycle example. `overflow:auto` scroll. Bilingual `zh` =
  **Traditional (zh-Hant)**. Honest stepping (node colors / edges / stack / condensation map straight
  from frame fields; SCC palette by comp id). Add `method.graph-scc` i18n up front. Full Playwright
  before merge.
- **Playwright edge caveat** (learned in graph-closure): a perfectly vertical/horizontal SVG `<line>`
  has a zero-width/height bbox and Playwright `toBeVisible()` reports it hidden. The e2e MUST assert on
  robust locators (node fill/`comp` class, the "SCCs: k" count text, finish-stack entries, condensation
  super-node count) — NOT on the visibility of a specific graph edge.

## Tests

- Unit (`tests/unit/graph_scc_viz.test.js`): `sccFrames(SAMPLE)` → final `comp` groups `{0,1,2}`,`{3,4}`,
  `{5}` (assert same-comp within each group, different across, exactly 3 distinct ids), `sccCount===3`;
  a **single cycle** `0→1→2→3→0` → 1 SCC (all same comp); a **DAG** `0→1,1→2` → 3 singleton SCCs
  (`sccCount===3`); Kosaraju **topological discovery order** (SAMPLE: comp id of `{0,1,2}` < `{3,4}` <
  `{5}` — sources get lower ids); phase invariants (one `transpose` frame; `finishStack` reaches length
  `n` at the end of p1 then drains to empty in p2; a `p2` seed frame's `cur` had `comp===-1` in the
  previous frame; each frame snapshots — a later mutation isn't visible in earlier frames); every frame
  `msg` bilingual. `parseInput` directed (`0-1`≠`1-0`; drops malformed/out-of-range; keeps self-loop).
- e2e (`tests/graph_scc.spec.js`): load `#m=graph-scc`; the VCR bar present
  (`.stepctl [data-action="step"]`, `.stepctl-scrubber`); the main graph + finish-stack render;
  stepping shows a current-node ring (`.gsc-node-cur`); scrubber to `max` on the default → the
  **"SCCs: k"** banner reads **3**, three distinct SCC colors appear (assert 6 nodes carry a `comp`
  class / colored), and the **condensation panel** shows **3 super-nodes**; selecting the built-in
  "Single cycle" example then scrubbing to `max` → banner reads **1** and the condensation shows **1**
  super-node; custom directed input + Apply → graph updates + an `.ex-select` option added; code panel
  hidden until `.code-drawer-toggle`; `.gsc-scroll` scrolls.

## Verification

`npm run test:unit` green; `node build_db.js` regenerates only `graph-scc` code (no churn);
`npm test` (FULL Playwright) green incl. the new spec + smoke_modes graph-scc + no regression;
browser spot-check (Kosaraju p1 finish stack + transpose + p2 SCC coloring + condensation DAG +
single-cycle example + custom input + code drawer + scroll + VCR back/scrubber) zh + en.

## Global constraints

- Concurrent refactor sessions in these repos — targeted `git add` only; never `-A`/`.`/`-u`;
  verify `git status` first.
- No new category (`graphs` exists) ⇒ `.overview-category` count unchanged; overview-tile count
  self-updating (PR #142) — confirm via full Playwright.
- Never hand-edit generated `js/code_db.js`. One branch (`feat/graph-scc`) + PR.

## Out of scope

- Tarjan's algorithm (Kosaraju chosen); the other Phase-2 viz (maxflow / euler); a `slides_db` deck
  (optional follow-on); refactoring the duplicated examples helpers; drawing node-link self-loops
  (a self-loop just makes a singleton SCC; shown via coloring, not a drawn loop).

## Success criteria

`graph-scc` ships in `graphs`: a directed graph whose SCCs are found by Kosaraju, stepped per DFS
action with a finish-order stack, edge-reversal transpose, per-SCC coloring, and a growing condensation
DAG; editable graph + saveable examples (incl. a built-in single-cycle case); hidden code drawer;
scroll; on the VCR control; `method.graph-scc` i18n present (both langs, Traditional zh); unit + full
Playwright green; one review-passed PR. Opens Phase 2 of the chap06 graph-viz program.
