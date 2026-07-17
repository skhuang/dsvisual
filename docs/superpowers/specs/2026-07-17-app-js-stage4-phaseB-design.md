# app.js Stage 4 — Phase B Design (stateful domain modules)

Date: 2026-07-17
Follows: `2026-07-17-app-js-stage4-design.md` (Phase A merged in PR #124). app.js is now 5,417 lines.

## Goal

Move the stateful visualization cluster — stack/queue/deque/list/sort, graph family, tree/advTree,
hash, heap (and `tree-rb`) — out of the `js/app.js` DOMContentLoaded closure into per-domain modules
under `js/domains/`, each owning its state, renderers, and action-handler wiring. After Phase B, app.js
is essentially the shell (nav, overview, slide viewer, `renderAll`/`switchMode` orchestration, layout).
Zero behavior change; tests green at every step. IIFE + global registration, no bundler (file://).

## The coupling to design around

Unlike Phase A's self-contained viz, this cluster is coupled three ways:
1. **Shared closure state** — `stackData`, `qArr…`, `edges`, `weightedEdges`, `dijkstra*`, `topo*`,
   `bstRoot`, `trie/radix/tst/btree/bplus`, `hash*Data`, `heap*` all live in the closure.
2. **`switchMode`** ([app.js:1779](../../../js/app.js#L1779)) resets ALL of this state on every mode
   switch, in one cross-cutting block.
3. **Action handlers** — `btnStdAdd`, graph buttons, tree buttons, `btnHashAdd`, heap actions/tutorial
   are wired once in the closure and mutate the shared state, then call `renderAll`.

## Architecture

### Domain module interface

Each domain is `js/domains/<domain>.js` (IIFE) exposing:

```js
const Domain = {
  id: 'hash',
  init(dom),           // wire this domain's action handlers ONCE at startup; dom = its DOM elements
  onModeSwitch(mode),  // reset THIS domain's state slice for the new mode (its part of the switchMode block)
};
// renderers still self-register via VizRegistry.attach(id, { render, code, layout })
window.VizCore.registerDomain(Domain);
```

### Core support (`js/core/domains.js`, or extend `registry.js`)

`window.VizCore`:
- `registerDomain(domain)` — record a domain; `domains()` returns them in registration order.
- `getMode()` / `setMode(mode)` — the single cross-cutting `currentMode`, exposed for domain renderers
  and handlers (app.js keeps the canonical variable and wires the getter/setter to it).

`window.VizKit` gains `showStatus(msg, color)` (used by most domains' handlers) so domains don't each
re-resolve `#status-message`. (Phase A duplicated `showStatus` privately; Phase B centralizes it.)

### `switchMode` after Phase B

Stays in app.js as the orchestrator, but its reset block becomes:
```js
VizCore.domains().forEach(d => d.onModeSwitch(nextMode));
```
plus the existing `renderMethodSections` / `updateLayout` / `renderAll` / status-message calls (shell
concerns). `updateLayout`'s container/action show-hide for these modes STAYS (it toggles the shell's
stateful DOM panels).

### Domain map

| module | owns state | renderers (ids) | handlers |
|--------|-----------|-----------------|----------|
| `js/domains/hash.js` | hashChData, hashOaData, hashBucketData | renderHashes (hash-chain/open/bucket) | btnHashAdd |
| `js/domains/linear.js` | stackData, qArr/qFront/qRear/qCount, mainListData, sortArrData | renderStack, renderQueue, renderDeque, renderLists, renderSortBars, renderSearchArray | std/list/sort buttons |
| `js/domains/graph.js` | edges, weightedEdges, mst*, dijkstra*, topo* | renderGraph, renderGraphDual, renderPrim, renderBellmanFord, renderFloydWarshall | graph buttons |
| `js/domains/tree.js` | bstRoot, trie/radix/tst, btree/bplus, treeDrawLoop, `_rbState` (tree-rb) | renderTree, renderAdvTrees, renderTreeRB | tree / text-tree buttons + rb keydown |
| `js/domains/heap.js` | heapIsMin, heapEventTimer, heapTutorialState, heapModels | renderHeap, renderHeapTutorialPanel | heap actions + tutorial |

(`tree-rb`, skipped in Phase A, joins the tree domain — its `switchMode`/keydown coupling is exactly
what the domain interface handles.)

## Migration strategy — template-first, one domain per PR

1. **Plan #1 — hash (template).** Smallest domain (3 state arrays, 1 button, 3 modes). Establishes
   `js/core/domains.js` (`VizCore` with `registerDomain`/`getMode`/`setMode`), adds `showStatus` to
   `VizKit`, extracts `js/domains/hash.js`, and rewires `switchMode`'s hash reset lines to the
   `onModeSwitch` hook. Prove the whole seam end-to-end, review, merge.
2. **Subsequent plans (one per domain, own PR):** linear → graph → tree(+tree-rb) → heap. Each reuses
   the proven `VizCore`/`onModeSwitch`/`init` seam; each removes its slice from `switchMode`'s reset
   block and its handlers/renderers/state from app.js.

Fallbacks: as each domain registers, remove its `renderAll` arm and its `switchMode` reset lines; keep
the rest until that domain is proven.

## Non-goals

- No bundler / ES modules; no behavior/styling/feature change.
- `renderAll`, `updateLayout` container show-hide, nav/overview/slide viewer stay in app.js (shell).
- Only the hash domain is in the first plan; other domains are separate future plans.

## Success criteria

- Phase B complete: stack/queue/graph/tree/hash/heap live under `js/domains/*`; app.js is shell +
  orchestration; `switchMode` resets via `onModeSwitch` hooks; adding any visualization (self-contained
  or stateful) is a localized single-module change.
- Every suite green after each domain.
