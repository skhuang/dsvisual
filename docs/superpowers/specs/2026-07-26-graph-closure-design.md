# graph-closure — Transitive Closure (Warshall) visualization — design

- Date: 2026-07-26
- Repo: `/Users/skhuang/course/dsvisual`
- Viz #4 (final of Phase 1) of the chap06 graph-viz program
  (`docs/superpowers/specs/2026-07-25-chap06-graph-viz-gaps-roadmap.md`).
- Follows graph-matrix (#1), graph-components (#2), graph-bipartite (#3) and the program-wide
  conventions. Built on the VCR stepping control `buildFrameControls`
  (see [[dsvisual-vcr-frame-controls]] in memory).

## Goal

An interactive Transitive-Closure viz for the `graphs` category: a **directed** graph whose boolean
reachability matrix `R` is filled by **Warshall's algorithm**, stepped one cell-flip at a time, with a
matrix grid beside a directed node-link panel that grows the transitively-added reachability edges.

## Behavior (chap06 / Warshall)

Transitive closure R⁺: `R[i][j] = 1` iff `j` is reachable from `i` via a path of **≥ 1 edge**.
Warshall computes it in place from the adjacency matrix:
```
R = adjacency
for k in 0..n-1:
  for i in 0..n-1:
    for j in 0..n-1:
      R[i][j] = R[i][j] OR (R[i][k] AND R[k][j])
```
- **Directed only** (closure is a directed-reachability notion). Weights ignored.
- `R` is initialized to the adjacency matrix (no reflexive diagonal). A diagonal cell `R[i][i]`
  becomes 1 **only if vertex `i` lies on a cycle** (an instructive case the default sample exercises).
- **Per-cell stepping** (chosen): for each pivot `k`, emit a "pivot k" frame (no change, highlights
  row `k`/col `k`), then **one frame per cell that actually flips `0 → 1`** during that `k`. Because a
  cell flips at most once over the whole run, total frames ≤ `n² + n + 2` (bounded, scrubs smoothly).
- **Default sample:** `n = 4`, directed edges `0→1, 1→2, 2→3, 3→1`. The chain fills the upper part
  and the cycle `1→2→3→1` makes `1,2,3` mutually reachable **including the diagonal** (`R[1][1]=R[2][2]=R[3][3]=1`).

## Architecture (files)

- **`js/graph_closure_viz.js`** (new, dual-export IIFE):
  - `SAMPLE = { n:4, edges:[{u:0,v:1},{u:1,v:2},{u:2,v:3},{u:3,v:1}] }` (directed).
  - `parseInput(nStr, edgesStr) → {n, edges:[{u,v}]}` — **directed** edge list `u-v` (whitespace-tolerant,
    malformed/out-of-range dropped, clamp n≤10, ignores any `:w`; self-loops `u-u` allowed since they
    just pre-set a diagonal cell).
  - `closureFrames({n, edges}) → {frames}`. Frame =
    `{ R:number[][] (0/1), k:number|null, cur:{i,j}|null, phase:'init'|'pivot'|'set'|'done',
    reach:[{u,v}] (accumulated closure edges, i≠j, for the node-link), msg:{zh,en} }`.
    Algorithm: build adjacency `R` (directed; `R[u][v]=1`; self-loop sets `R[u][u]=1`); push `init`
    frame; for `k`: push a `pivot` frame (`k` set, `cur:null`); then scan `i,j`; when
    `!R[i][j] && R[i][k] && R[k][j]` set `R[i][j]=1`, push a `set` frame (`k`, `cur:{i,j}`, updated
    `reach`); after all `k`, push a `done` frame. `reach` lists the closure edges with `i≠j` that are
    NOT in the original adjacency (i.e. the transitively-added ones), for dashed rendering.
    Unit-tested. No DOM.
- **`js/viz/viz_graph_closure.js`** (new, `VizRegistry.attach('graph-closure', {render, code, layout})`):
  a `.gcl-wrap` (avoid `gc-*`/`gc2-*`/`gm-*`/`gbp-*` prefixes) with a controls bar (`.gcl-n`,
  `.gcl-edges`, Apply, `.ex-select`), a `.gcl-scroll` (overflow:auto) wrapping a directed node-link
  SVG (`.gcl-graph`, circle layout, arrowheads; original edges solid `.gcl-edge`, added closure edges
  dashed `.gcl-edge-added`, the current `cur` edge highlighted `.gcl-edge-cur`, pivot vertex
  `.gcl-node-pivot`) + the `R` matrix grid (`.gcl-matrix`, floyd-grid style: pivot row `k`/col `k`
  tinted `.gcl-pivot`, source cells `R[i][k]`/`R[k][j]` marked `.gcl-src`, the just-set cell
  `.gcl-added`) + a `.gcl-msg`. Stepping via `K().buildFrameControls(frames, paint, {runIntervalMs:700})`
  (Shape A: `paint(fr, i)` renders the whole view from `fr` and folds `showStatus`; NO local cursor).
  Examples-helper trio duplicated per convention; a built-in **"DAG (chain)"** example option
  (`4|0-1,1-2,2-3`, no cycle → clean upper-triangle closure, diagonal stays 0) injected alongside
  "Default". Apply/example-select rebuild via `renderGraphClosure()`.
  Self-reachability (diagonal) is shown on the **matrix** only; the node-link draws `i→j` for `i≠j`
  (avoids self-loop rendering) — a caption notes this.
- **`js/app.js`**: ONE `graphs`-group `METHOD_GROUPS` row —
  `{ id:'graph-closure', title:'Transitive Closure', file:'graph_closure.cpp',
  visualizer:'graph-closure', controls:'graph-closure', codeDrawer:true }`.
- **`js/i18n.js`**: add `method.graph-closure` to BOTH dicts up front — en `'Transitive Closure'`,
  zh `'遞移閉包'` (Traditional).
- **`index.html`**: two `<script defer>` tags (pure then render) after `js/code_db.js`, before `app.js`.
- **`cpp/graph_closure.cpp`** + `build_db.js` → regen `js/code_db.js`: Warshall transitive closure
  (`R` from adjacency, triple loop), default `main` = the SAMPLE graph; prints the closure matrix.
- **`js/desc_db.js`**: English `graph-closure` entry (reachability matrix; Warshall triple loop
  `R[i][j] |= R[i][k] & R[k][j]`; `O(n³)`; relation to Floyd-Warshall; cycle ⇒ diagonal).
- **`style.css`**: `.gcl-*` block (scroll, node-link solid/dashed/cur edges + pivot node, matrix
  grid pivot/src/added tints, msg). Reuse floyd-grid / gm-matrix styling patterns.
- **`tests/graph_closure.spec.js`** (Playwright e2e); **`tests/unit/graph_closure_viz.test.js`**
  (node:test); `tests/smoke_modes.spec.js` (+id).

## Program-wide conventions applied

- **VCR control** `buildFrameControls` (⏮ ◀ ▶/⏸ ▶︎ + scrubber + `步 i / N` counter).
- `codeDrawer:true` (hidden code). `ExamplesStore` save/restore + a built-in DAG example. `overflow:auto`
  scroll. Bilingual `zh` = **Traditional (zh-Hant)**. Honest stepping (matrix/edges/pivot map straight
  from frame fields). Add `method.graph-closure` i18n up front. Run FULL Playwright before merge.

## Tests

- Unit (`tests/unit/graph_closure_viz.test.js`): `closureFrames(SAMPLE)` → final `R` equals the correct
  closure (0 reaches 1,2,3; 1,2,3 mutually reachable incl. diagonal; nothing reaches 0) — assert
  specific cells; a **DAG chain** `0→1→2→3` → strict upper-triangle closure with **all-zero diagonal**;
  a **2-cycle** `0→1,1→0` → `R[0][0]=R[1][1]=1`; per-cell frame invariant (a `set` frame's `cur` cell
  is 0 in the previous frame and 1 in this frame; each cell flips at most once → total `set` frames =
  final-ones − initial-ones); one `pivot` frame per `k`; frame count ≤ `n²+n+2`; every frame `msg`
  bilingual. `parseInput` directed (`0-1` ≠ `1-0`; drops malformed/out-of-range; self-loop kept).
- e2e (`tests/graph_closure.spec.js`): load `#m=graph-closure`; the VCR bar present
  (`.stepctl [data-action="step"]`, `.stepctl-scrubber`); the directed node-link + matrix render;
  stepping marks a pivot (`.gcl-node-pivot`) and, on a `set` frame, an added cell (`.gcl-added`) and a
  dashed added edge (`.gcl-edge-added`); scrubber to `max` on the default → the closure matrix is
  complete (assert a known cell e.g. `R[0][3]=1` and a diagonal `R[1][1]=1`); selecting the built-in
  "DAG" example then scrubbing to `max` → no diagonal cell set; custom directed input + Apply → graph
  updates + an `.ex-select` option added; code panel hidden until `.code-drawer-toggle`; `.gcl-scroll` scrolls.

## Verification

`npm run test:unit` green; `node build_db.js` regenerates only `graph-closure` code (no churn);
`npm test` (FULL Playwright) green incl. the new spec + smoke_modes graph-closure + no regression;
browser spot-check (per-cell Warshall fill + pivot highlight + dashed added edges + cycle diagonal +
DAG example + custom input + code drawer + scroll + VCR back/scrubber) zh + en.

## Global constraints

- Concurrent refactor sessions in these repos — targeted `git add` only; never `-A`/`.`/`-u`;
  verify `git status` first.
- No new category (`graphs` exists) ⇒ `.overview-category` count unchanged; overview-tile count
  self-updating (PR #142) — confirm via full Playwright.
- Never hand-edit generated `js/code_db.js`. One branch (`feat/graph-closure`) + PR.

## Out of scope

- Weighted shortest paths (that's the existing Floyd-Warshall viz); the other Phase-2 program viz
  (scc / maxflow / euler); a `slides_db` deck (optional follow-on); refactoring the duplicated
  examples helpers; drawing node-link self-loops (diagonal shown in the matrix only).

## Success criteria

`graph-closure` ships in `graphs`: a directed graph whose boolean reachability matrix is filled by
Warshall, stepped per cell-flip with pivot highlighting and a growing dashed reachability node-link,
editable graph + saveable examples (incl. a built-in DAG case), hidden code drawer, scroll, on the VCR
control; `method.graph-closure` i18n present (both langs, Traditional zh); unit + full Playwright
green; one review-passed PR. Completes Phase 1 of the chap06 graph-viz program.
