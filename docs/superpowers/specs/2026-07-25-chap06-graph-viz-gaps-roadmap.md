# chap06 graph-viz gap-closing program — roadmap

- Date: 2026-07-25
- Repo: `/Users/skhuang/course/dsvisual`
- Companion audit target: ds2026 `lectures/chap06/chap06_graphs_core.md`.
- Mirrors the completed chap05 tree-viz program ([[dsvisual-chap05-tree-viz-program]] in memory).

## Goal

Close the chap06 graph topics that lack a dsvisual interactive visualization. **Scope
(approved): Phases 1+2 — 7 core graph viz.** The §6.7 "Graphs in Software Testing"
sub-domain (CFG/coverage, data-flow, call graphs, FSM, symbolic exec, mutation, fuzzing,
attack graphs, bug bisection) is a **separate follow-on program**, not this one. Explicitly
skipped as low viz-value: inverse-adjacency-lists/multilists, K-shortest-paths, planar graphs.

## Already covered (baseline — do NOT rebuild)

`graph` (base), `graph-adjlist`, `graph-dfs`, `graph-bfs`, `graph-traversal` (BFS/DFS
dual-pane), `graph-kruskal` (+ `tree-dsu` Union-Find), `graph-prim`, `graph-dijkstra`,
`graph-bellman-ford`, `graph-floyd-warshall`, `graph-topo`, `graph-aoe`.

## Per-viz build recipe (each viz = its own brainstorm → spec → plan → subagent-driven → PR)

Follow [[dsvisual-viz-authoring]]: (1) pure `js/<name>_viz.js` dual-export IIFE emitting
frames with bilingual `msg:{zh,en}` (unit-tested), (2) `js/viz/viz_<name>.js` render module
via `VizRegistry.attach` (reuse the existing graph/`graph-step`/`matrix` render styles where
they fit), (3) ONE `METHOD_GROUPS` row in the `graphs` group, (4) TWO `index.html` `<script
defer>` tags, (5) `cpp/<name>.cpp` + `build_db.js` → `code_db.js`, (6) English `desc_db.js`
entry, (7) Playwright e2e. **Conventions:** bilingual `zh` = Traditional (zh-Hant); run the
FULL Playwright suite before merge (the overview-tile count assertion is self-updating since
PR #142; `.overview-category` unchanged — `graphs` category already exists). Optionally a
bilingual `slides_db.js` explainer deck per viz (as the tree viz got) for the Slides button +
ds2026 deck-wiring.

## Program-wide UI conventions (all 7 viz)

- **Hidden code drawer (rb-tree style):** set `codeDrawer: true` on each viz's `METHOD_GROUPS`
  row — app.js (~lines 603–670) then renders the C++ in a collapsed side drawer with a
  `.code-drawer-toggle` button (hidden by default; shown on demand). No always-on code panel.
- **Saveable examples (list-equivalence style):** where a viz takes user input (e.g. a
  user-defined graph), provide an `.ex-select` dropdown backed by `ExamplesStore`
  (`js/examples_store.js`: `load/save(localStorage, methodId, text, defaultText, cap=8)`,
  dedups, caps 8) + the `loadExamples`/`saveExample`/`buildExamplesSelect` helper trio
  (currently duplicated in `viz_list_equivalence.js`/`viz_matrix_sparse_list.js` — match the
  convention; don't refactor mid-program). Save the serialized input on apply; restore on select.
- **Scroll when oversized:** the viz host/container gets `overflow:auto` (both axes) so large
  matrices/graphs pan up/down/left/right within the panel.

## Phase 1 — cheap, high-value core (do first, in order)

1. **`graph-matrix` — Adjacency Matrix.** Represent a graph as an n×n adjacency matrix;
   toggle directed/undirected (symmetry) and unweighted/weighted (0/1 vs weights); highlight
   the matrix cell ↔ the node-link edge correspondence; row/column sums = out/in-degree.
   Reuse the `matrix` visualizer style (as Floyd-Warshall does) beside a small node-link panel.
2. **`graph-components` — Connected Components (undirected).** BFS/DFS flood from each
   unvisited vertex; label + color each component; step reveals one component at a time;
   report component count.
3. **`graph-bipartite` — Bipartite Check / 2-coloring.** BFS 2-coloring; adjacent same-color ⇒
   odd cycle ⇒ NOT bipartite (highlight the offending edge); else show the two color classes.
4. **`graph-closure` — Transitive Closure (Warshall).** Boolean reachability matrix; the
   Warshall triple loop `R[i][j] |= R[i][k] & R[k][j]`; step through each intermediate `k`,
   highlighting newly-added reachability. Reuse the `matrix` visualizer.

## Phase 2 — iconic algorithms

5. **`graph-scc` — Strongly Connected Components (Kosaraju or Tarjan).** Directed graph;
   compute SCCs (Kosaraju: DFS finish-order → transpose → DFS; or Tarjan lowlink); color each
   SCC; optionally show the condensation DAG.
6. **`graph-maxflow` — Maximum Flow (Edmonds-Karp).** Flow network with capacities; find
   augmenting paths via BFS on the residual graph; update residuals; show the value growing and
   the final min-cut. New/extended graph visualizer (edge capacity/flow labels).
7. **`graph-euler` — Eulerian Circuit (Hierholzer).** Even-degree / connectivity check
   (ties back to the Königsberg-bridges motivation); construct the circuit with Hierholzer's
   algorithm, animating edge consumption. Report Eulerian/semi-Eulerian/none.

## Execution

Build in the listed order (1→7). Each viz is a full brainstorm → spec → plan →
subagent-driven cycle with its own branch + PR, individually reviewed and merged, exactly
like the chap05 program. Confirm each viz's scope (representation, algorithm variant, step
granularity, single-graph vs comparison) at its brainstorm before implementing.

## Deferred (explicit, for later)

- §6.7 Graphs-in-Software-Testing program (CFG+coverage flagship, data-flow, call graph, FSM/
  Chinese Postman, symbolic/concolic, mutation, fuzzing, attack graphs, bug bisection).
- Niche: inverse adjacency lists & multilists, K-shortest paths, planar graphs.

## Success criteria

The 7 Phase-1+2 viz ship as independent, review-passed, bilingual dsvisual visualizations
wired into the `graphs` category, closing the core chap06 graph-topic gaps; §6.7 and the niche
topics remain explicitly deferred and documented.
