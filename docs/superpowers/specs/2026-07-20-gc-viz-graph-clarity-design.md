# GC viz clarity — object-graph view for mark-sweep & reference-counting — design

- Date: 2026-07-20
- Repo: `/Users/skhuang/course/dsvisual`
- Viz: `gc-memory` (category Memory / GC), modes `mark-sweep` and `refcount`.

## Problem

Feedback: in the Dynamic Storage / GC visualizer's **mark-sweep** mode you "看不出來每一塊
記憶體的狀況" — can't tell each block's status. Cause: the renderer draws a flat
`gc-grid` of cells (`#id` + a small word `marked`/`freed`/`·`). The objects' `refs`
(who-points-to-who) and the scenario `roots` exist in the data but are **never drawn**,
and `roots` never even reach the frames. So reachability — the whole point of mark-sweep —
is invisible: you can't see which blocks are roots, which references make a block
reachable, or why a block is garbage. Reference-counting has the same flat-grid limitation
(its inter-object references and the leaked cycle are hidden).

## Decisions (approved)

- Convert BOTH graph-shaped modes (`mark-sweep`, `refcount`) from flat grids to
  **object-graph views**: nodes + directed reference edges, roots flagged, clear per-block
  state, and a legend. (Buddy stays the address-bar; pointer-reversal/compact unchanged.)
- **Enrich `MS_SCENARIO` with a garbage cycle** so all states are visible and mark-sweep's
  signature advantage (reclaims unreachable cycles that refcount leaks) shows. Updates one
  unit test.
- Build via spec → plan → subagent-driven, one branch + PR.

## Logic — `js/gc_memory_viz.js`

- **`markSweepFrames`**: add `roots: scenario.roots.slice()` to every `snap()` return so the
  renderer can flag roots. No change to the marking algorithm (it already emits one frame
  per marked object — that sequence IS the propagation wave).
- **`MS_SCENARIO`**: keep objects 0–6 and roots `[0,1]`; append an unreachable 2-cycle
  `{id:7, refs:[8]}, {id:8, refs:[7]}`. Reachable set stays `{0,1,2,3,4,5}`; garbage becomes
  `{6,7,8}` (with 7↔8 a cycle). This makes root / reachable / isolated-garbage / cyclic-
  garbage all visible in one picture.
- **`refCountFrames`**: no data change — it already carries per-object `refs` and the leaked
  `D↔E` cycle in `RC_OPS`.

## Renderer — `js/viz/viz_gc.js`

Replace the `mark-sweep` and `refcount` branches in `paint()` with calls to a shared
helper. New helper (module-local to viz_gc.js):

```
renderObjectGraph(stage, { mode, nodes, roots, activeId })
```
- `nodes`: for mark-sweep `[{id, refs, mark, free}]` (from `fr.heap`); for refcount
  `[{id, refs, count, free}]` (from `fr.objs`).
- Builds a **container** with an **SVG edge layer** (absolutely positioned, behind) and
  **HTML node cells** (absolutely positioned, reusing `gc-cell` styling) + a **legend row**.
- **Layout:**
  - mark-sweep: BFS from `roots` assigns each reachable node a depth (roots = column 0,
    targets = column 1, …); nodes are placed by (column x, row y within column). Nodes not
    reached by the BFS are laid out in a separate **"unreachable" band** below the reachable
    layers, so garbage is visually separated even before the sweep runs.
  - refcount: single horizontal row in `order`; ref edges drawn as arcs.
- **Edges:** one directed arrow per `ref` (source-center → target-center) drawn in the SVG
  layer, using a `<marker>` arrowhead in `<defs>`. Self/duplicate refs tolerated.
- **Node cell** shows: `#id`; a state label; for refcount an `rc=<count>` badge. Classes:
  - `gc-node` base; `gc-root` (roots — ring + "root" tag); `gc-mark` (reachable/marked,
    green); `gc-free` (swept/collected, faded); `gc-active` (current step).
  - mark-sweep state label: `root` / `reachable` / `unmarked` / `freed`.
  - refcount state label: `rc=N` (alive) / `freed`.
- **Legend row** under the graph: color swatch → meaning. mark-sweep: Root, Reachable
  (marked), Unmarked, Freed. refcount: Alive (rc>0), Freed, and a note that a leaked
  cycle stays Alive.
- The badge text (`fr.phase` / `fr.action`) and the step controls are unchanged.

## CSS — `style.css`

Add: `.gc-graph` container (position: relative; sized), `.gc-edge-layer` (absolute SVG),
`.gc-node` positioning, `.gc-root` (ring + tag), `.gc-legend` / `.gc-legend-item` /
swatch classes, and an arrowhead marker style. Reuse existing `.gc-cell`, `.gc-mark`,
`.gc-free`, `.gc-active`.

## Tests

- **Unit** (`tests/unit/gc_memory.test.js`):
  - mark-sweep: every frame's snap now includes `roots` equal to the scenario roots; the
    enriched end state frees `{6,7,8}` and keeps `{0,1,2,3,4,5}` (update the existing
    assertion that currently expects only `6` free).
  - refcount: unchanged (still frees A,B; leaks D,E).
- **e2e** (`tests/tier3.spec.js`, extend the gc-memory test): for `mark-sweep` and
  `refcount` assert the stage renders an SVG edge layer (`.gc-edge-layer`), at least one
  node flagged `.gc-root` (mark-sweep), a `.gc-legend` is present, and stepping advances
  (badge changes / active node moves).

## Global constraints

- Concurrent refactor session — targeted `git add` of only the touched files; never
  `-A`/`.`/`-u`; verify `git status`.
- Run the FULL Playwright suite (`npm test`) before merge. Adding no METHOD_GROUPS row and
  no category ⇒ no overview-tile/category-count change (i18n count assertions untouched).
- Do not touch the other three modes' rendering (mark-sweep and refcount branches only),
  the frame builders for buddy/pointer-reversal/compact, or any generated file.

## Out of scope

- Changing buddy / pointer-reversal / compact modes; a general graph-layout engine (the
  small fixed scenarios only need a deterministic layered/row layout); editable scenarios;
  wiring up the inert `descDB`.

## Success criteria

Mark-sweep and reference-counting render as object graphs — reference edges drawn, roots
flagged, each block's state legible with a legend, and (mark-sweep) reachable vs garbage
visually separated with the garbage cycle shown being reclaimed. Unit + full Playwright
green; no count-assertion or unrelated churn; one review-passed PR.
