# app.js Modularization — Design

Date: 2026-07-17

## Goal

`js/app.js` has grown to **9,611 lines (~435 KB)**: a single file whose entire body lives
inside one `DOMContentLoaded` closure. Break it into focused, self-registering modules so that
adding a new visualization means **adding one file + one registry entry**, not editing five
scattered `switch` sites. Do this incrementally, with zero behavior change and tests green at
every step.

## Current state (measured)

| Metric | Value |
|--------|-------|
| Lines | 9,611 (~435 KB) |
| `render*` functions | 88 (all inside the `DOMContentLoaded` closure) |
| Mutable state `let`s in that closure | ~171 |
| `currentMode ===` branches | 253 |

**Root problem.** From [`app.js:448`](../../../js/app.js#L448) (`document.addEventListener('DOMContentLoaded', …)`)
to ~line 9,600, almost everything is one closure. The 88 renderers and every action handler
close over ~171 shared mutable state variables (`currentMode`, `stackData`, `edges`, `bstRoot`,
`heapTutorialState`, plus ~150 per-viz `_xxxState` singletons), so no piece can be extracted in
isolation.

**A single method's behavior is smeared across three parallel `switch` chains**, so a new
visualization must touch five places:
1. [`METHOD_GROUPS`](../../../js/app.js#L96) — registration
2. [`getCodeForMethod`](../../../js/app.js#L329) — code-string mapping
3. [`updateLayout`](../../../js/app.js#L2343) — code panel + container/action show/hide
4. `renderAll`'s `currentMode ===` dispatch — which renderer to call
5. per-action handlers (`btnStdAdd`, …) branching on `currentMode`

**Existing good pattern to build on.** Newer visualizations already split their pure
frame-generator into its own file (`window.SparseViz`, `LruViz`, `PolyViz`, …) and keep only a
DOM-owning `render*` in app.js, each with an isolated `_xxxState` singleton. The target
architecture already exists in fragments; this work generalizes it.

## Constraint that shapes the whole approach

The app is designed to run from `file://` (README: "open index.html directly"). Chrome blocks
native ES-module `import` over `file://` via CORS. **Decision: no bundler, no ES modules.**
Continue the established pattern — IIFE modules that register onto a global, loaded via
`<script defer>` in `index.html`. This preserves "open index.html directly" and matches every
existing `*Viz` module.

## Target architecture

### A method descriptor registry

Each method becomes one self-contained descriptor, folding in the behavior currently hardcoded in
the three switches:

```js
VizRegistry.register({
  id: 'matrix-sparse',
  group: 'arrays',
  title: 'Sparse Matrix (Transpose)',
  code: () => codeMatrixSparse,       // replaces getCodeForMethod switch
  render: (ctx) => renderMatrixSparse(ctx), // replaces renderAll switch
  layout: { host: 'dynamic' },        // replaces updateLayout container/action switch
});
```

`renderAll`, `updateLayout`, and the code-panel update become **table lookups** keyed by method
id, eliminating the bulk of the 253 branches. `METHOD_GROUPS` is regenerated from (or replaced
by) the registry so the nav/overview keep working.

### Registry API (in `js/core/registry.js`)

```
VizRegistry.register(descriptor)   // called by each viz module at load
VizRegistry.get(methodId) -> descriptor | null
VizRegistry.all() -> descriptor[]  // in registration order
VizRegistry.groups() -> the METHOD_GROUPS-shaped structure the nav consumes
```

Descriptor shape:
- `id` (string, required), `group` (string), `title` (string)
- `code` (`() => string`, optional) — C++ source for the code panel
- `render` (`(ctx) => void`, required) — owns its DOM
- `layout` (`{ host: 'dynamic' } | { container, actions }`) — how `updateLayout` shows it

### Shared context (`ctx`)

The shared mutable state (`currentMode`, `stackData`, `edges`, `bstRoot`, …) is collected into a
single `ctx` object that renderers **receive as a parameter** instead of capturing from the
closure. In stages 0–3 `ctx` is a thin wrapper over the existing closure variables (so behavior
is identical); fully untangling it is stage 4 (separate spec).

### Target file layout

```
js/
  core/
    registry.js      # VizRegistry
    anim.js          # sleep(), animState
    layout.js        # updateLayout via registry table
    code_panel.js    # code-panel update via registry table
  algos/
    tree_algos.js    # insertBST/insertAVL/splay/... (pure, unit-testable)
  viz/
    viz_sparse.js, viz_lru.js, viz_poly.js, ...  # self-contained: register()
  app.js             # startup + registry assembly + event wiring (target: a few hundred lines)
```

Load order stays driven by `<script defer>` tags in `index.html` (core → algos → viz → app).

## Migration strategy — strangler-fig, incremental

No rewrite. Each stage is its own PR, tests green, **zero behavior change**.

- **Stage 0 — Lock behavior.** Add thin smoke tests over load + every group's mode switch as a
  regression net (existing Playwright/unit suites are the base).
- **Stage 1 — Extract pure algorithms.** Move the module-scope tree algorithms at
  [`app.js:14-95`](../../../js/app.js#L14-L95) (`insertBST`, `insertAVL`, `splayNode`, RB
  helpers, `TreeNode`) into `js/algos/tree_algos.js` (IIFE global + unit tests). Zero-risk warm-up.
- **Stage 2 — Introduce the registry; switches become lookups.** Add `js/core/registry.js`,
  fold `code`/`render`/`layout` into descriptors, convert `getCodeForMethod`, `renderAll`, and the
  `updateLayout` code-panel/container switches to table lookups. Highest leverage — removes most
  of the 253 branches. Behavior identical.
- **Stage 3 — Extract self-contained visualizations.** For every method that already has an
  isolated `*Viz` frame-generator and its own `_xxxState` (sparse, lru, poly, huffman, maze,
  doubly-list, obst, external/polyphase sort, threaded, mway, expr-tree, game-tree, search-fib/
  interp, isam, inverted, gc, recursion, …), move its `render*` into `js/viz/viz_<name>.js` that
  calls `VizRegistry.register(...)`. Start with the newest/cleanest; one small PR per few modules.

**Deferred to a follow-up spec — Stage 4 (shared-state cluster).** stack/queue/graph/tree/hash/
heap share `stackData`/`edges`/`bstRoot`/… ; extracting them requires turning closure capture
into an explicit `ctx` parameter and splitting into `viz_linear/graph/tree/heap.js`. Larger and
riskier — its own spec once stages 0–3 have proven the registry and `ctx` seams.

## Non-goals

- No bundler / no ES modules (file:// constraint).
- No behavior, styling, or feature change — pure structure.
- No touching the already-clean external `*Viz` frame-generator files (only the `render*` glue
  moves).
- Stage 4 (shared-state cluster) is out of scope for the first plan.

## Success criteria

- Adding a new visualization touches **one new file + one `register()` call** — no edits to
  `renderAll`/`updateLayout`/`getCodeForMethod` switches.
- `js/app.js` shrinks substantially (self-contained viz and pure algos moved out).
- All existing unit + Playwright suites pass unchanged at every stage.
