# app.js Modularization — Stage 4 Design (remaining viz + stateful domains)

Date: 2026-07-17
Follows: `2026-07-17-app-js-modularization-design.md` (stages 0–3, merged in PR #123).

## Context

After stages 0–3, `js/app.js` is 7,807 lines. The remaining render functions fall into three groups:

1. **Infrastructure (stays in app.js):** `renderOverview`, `renderMethodSections`, `renderCategoryNav`,
   `renderDeckBar`, `renderSlide`, `renderAll`, plus startup/registration glue. This is the app shell,
   nav, slide viewer, and dispatch — not visualizers.
2. **Phase A — remaining self-contained visualizers (~25):** methods that already have their own
   `_xxxState` and use a `window.XxxViz` frame generator + `VizKit` host helpers, but weren't in the
   Stage 3 batches. Same shape as the 22 already extracted.
3. **Phase B — stateful domains (~6 renderers' worth):** stack/queue/deque/list/sort, graph family,
   tree/advTree, hash, heap — coupled to shared mutable state AND their action-button handlers.

## Goal

Reduce `js/app.js` to essentially the shell + dispatch, with every visualizer in its own module.
Zero behavior change; tests green at every step. Keep the IIFE + global-registration pattern
(`<script defer>`, no bundler — `file://` constraint from the prior spec still holds).

## Sequencing decision

**Phase A first, then Phase B.** Phase A is mechanical (proven Stage 3 recipe), low-risk, and shrinks
app.js substantially — which de-risks Phase B by leaving a cleaner file. Phase B's detailed plan is
written *after* Phase A merges, against the reduced app.js.

## Phase A — finish self-contained extractions

Apply the **exact Stage 3 recipe** (template: `js/viz/viz_sparse.js`) to each method below: move the
render fn + its own `_xxxState`/helpers into `js/viz/viz_<name>.js` as an IIFE; swap closure-helper
calls to `K().<helper>` (`const K = () => global.VizKit`, call-time); register via
`VizRegistry.attach(id, { render, code: () => <bareCodeConst>, layout: { host: 'dynamic' } })`; remove
the old copy + its `reg()` line + `renderAll` fallback arm from app.js; add the `<script defer>` after
its `*Viz` dependency and `registry.js`, before `app.js`.

**Per-module Step-A gate (unchanged):** before extracting, confirm the render body uses only VizKit,
its own state, its `window.XxxViz`, `RandomInput`, and its code const. If it reads shared cluster state
(`stackData`/`qArr`/`edges`/`weightedEdges`/`bstRoot`/`mainListData`/`sortArrData`/`hash*Data`/
`trieRoot`/`radixRoot`/`tstRoot`/`btreeData`/`bplusData`/`heap*`/`currentMode`), it is NOT Phase A —
leave it for Phase B and record it. Duplicate any stateless shared helper (e.g. `computeTreeLayout`)
per the Stage 3 precedent.

The 25 candidates (id → render fn → code const):

- String matching: `search-kmp`→renderKMP/codeSearchKMP, `search-bm`→renderBM/codeSearchBM,
  `search-rk`→renderRK/codeSearchRK, `search-zalgo`→renderZAlgo/codeSearchZAlgo,
  `search-aho`→renderAhoCorasick/codeSearchAho, `search-strcompare`→renderStringCompare/codeSearchStrCompare
- Probabilistic: `bloom-filter`→renderBloomFilter/codeBloomFilter, `skip-list`→renderSkipList/codeSkipList,
  `count-min-sketch`→renderCountMinSketch/codeCountMinSketch
- Trees/aux: `tree-segment`→renderSegmentTree/codeTreeSegment, `tree-fenwick`→renderFenwick/codeTreeFenwick,
  `tree-dsu`→renderDSU/codeTreeDSU, `tree-traversal`→renderTreeTraversal/codeTreeTraversal,
  `tree-rb`→renderTreeRB/codeTreeRB, `huffman`→renderHuffman/codeHuffman
- Arrays/lists: `matrix-sparse-list`→renderMatrixSparseList/codeMatrixSparseList,
  `list-equivalence`→renderListEquivalence/codeListEquivalence
- Magic variants: `magic-latin`→renderMagicLatin/codeMagicLatin, `magic-torus`→renderMagicTorus/codeMagicTorus,
  `magic-formula`→renderMagicFormula/codeMagicFormula, `magic-symmetry`→renderMagicSymmetry/codeMagicSymmetry
- Nano/ML: `nano-bpe-encode`→renderNanoBpeEncode/codeNanoBpeEncode,
  `nano-bpe-train`→renderNanoBpeTrain/codeNanoBpeTrain,
  `nano-compute-graph`→renderNanoComputeGraph/codeNanoComputeGraph,
  `nano-ngram-next`→renderNanoNgramNext/codeNanoNgramNext

## Phase B — stateful domain modules (design; planned after Phase A)

Each domain becomes a module under `js/domains/` that **owns its state, renderers, and action-handler
wiring**, exposing `init(dom)` called once from app.js startup. Only `currentMode` is cross-cutting
(exposed via a getter/setter, or passed in). Each domain still registers its renderers/`code` via
`VizRegistry.attach`.

| module | owns state | renderers | action handlers |
|--------|-----------|-----------|-----------------|
| `js/domains/linear.js` | stackData, qArr/qFront/qRear/qCount, mainListData, sortArrData | renderStack, renderQueue, renderDeque, renderLists, renderSortBars, renderSearchArray | std/list/sort buttons |
| `js/domains/graph.js` | edges, weightedEdges, mstEdgeKeys, graphCandidateEdgeKey, dijkstra*, topo* | renderGraph, renderGraphDual, renderPrim, renderBellmanFord, renderFloydWarshall | graph buttons |
| `js/domains/tree.js` | bstRoot, trieRoot, radixRoot, tstRoot, btreeData, bplusData, treeDrawLoop | renderTree, renderAdvTrees | tree / text-tree buttons |
| `js/domains/hash.js` | hashChData, hashOaData, hashBucketData | renderHashes | hash button |
| `js/domains/heap.js` | heapIsMin, heapEventTimer, heapTutorialState, heapModels | renderHeap, renderHeapTutorialPanel | heap actions + tutorial |

Design points:
- **State ownership:** each state var moves inside its domain module. Cross-domain reads (rare) go
  through a small shared core (`currentMode` getter, `renderAll`).
- **Handler wiring:** the per-domain `addEventListener` blocks currently in the DOMContentLoaded closure
  move into that domain's `init(dom)`. `dom` is the set of already-looked-up elements the domain needs.
- **updateLayout:** the container/action show/hide for these stateful modes stays where it is (it's the
  legitimate place that toggles the stateful DOM panels); only the render/state/handlers move.
- **Template-first:** implement ONE domain end-to-end (recommend `hash` — smallest, most cohesive, or
  `graph` — most self-contained cluster) as the proven template, review, then the rest one per PR.
- **`renderAll` fallback:** as each domain registers via the registry, remove its fallback arm; keep the
  chain until the domain is proven registry-driven.

## Non-goals

- No bundler / ES modules.
- No behavior/styling/feature change.
- Infrastructure renderers (overview/nav/slide/methodSections/renderAll) stay in app.js.
- Phase B detailed task plan is deferred until Phase A merges (its steps depend on the reduced file).

## Success criteria

- Phase A: all 25 self-contained viz moved to `js/viz/`; app.js materially smaller; all suites green.
- Phase B: stack/queue/graph/tree/hash/heap live in `js/domains/*`; app.js is essentially shell +
  dispatch; adding any visualization (self-contained or stateful) is a localized, single-module change.
