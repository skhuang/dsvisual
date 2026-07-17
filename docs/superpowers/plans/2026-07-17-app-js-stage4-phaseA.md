# app.js Stage 4 — Phase A Implementation Plan (extract remaining self-contained viz)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Extract the 25 remaining self-contained visualizers from `js/app.js` into `js/viz/*.js` self-registering modules, using the recipe already proven on 22 modules in stages 0–3. Zero behavior change; tests green at every step.

**Architecture:** Same as Stage 3 — each module is an IIFE that moves its `render*` + own `_xxxState`/helpers out of app.js, resolves host helpers via `window.VizKit` at call time, and self-registers with `window.VizRegistry.attach(id, { render, code, layout })`. No bundler.

**Tech Stack:** Vanilla JS (IIFE + globals, `<script defer>`), `node:test`, Playwright.

## Global Constraints

- No bundler; IIFE modules, `<script defer>` in `index.html`, load order: `registry.js` → each module's `*Viz` dependency → the new `viz_*.js` → `app.js` (last).
- Zero behavior/styling/feature change.
- All existing unit + Playwright suites pass after every task.
- `code:` uses the BARE code const identifier (e.g. `() => codeSearchKMP`), NEVER `global.codeX` (top-level const in `code_db.js` is a lexical global, not a window property).
- Host helpers resolved at CALL time: `const K = () => global.VizKit;` then `K().acquireDynamicVizHost()` etc. Never capture VizKit at module load.
- Ignore `updateLayout`'s `codeTitle`/`codeDisplay` branches — inert dead code (those DOM ids don't exist).
- Reference template: `js/viz/viz_sparse.js`. Recipe identical to the merged Task 7.

## The Recipe (applied per module)

For a row `(id, renderFn, codeConst, file)`:
- **A. Self-containment gate.** Read `renderFn`'s body. Extract ONLY if it uses just: `K()` helpers, its own module-scope `_<name>State`/helpers, its `window.<Name>Viz` global, `window.RandomInput`, and its code const. If it reads/writes shared cluster state (`stackData`/`qArr`/`edges`/`weightedEdges`/`bstRoot`/`mainListData`/`sortArrData`/`hash*Data`/`trieRoot`/`radixRoot`/`tstRoot`/`btreeData`/`bplusData`/`heap*`/`currentMode`), STOP: leave it in app.js and record it as SKIPPED→Phase B.
- **B. Create `js/viz/<file>`** as an IIFE (shape of `viz_sparse.js`): move `renderFn` + its own `_<name>State`/helpers verbatim; closure-helper calls → `K().<helper>`; end with `global.VizRegistry.attach('<id>', { render: <renderFn>, code: () => <codeConst>, layout: { host: 'dynamic' } });`. Duplicate any stateless shared helper (e.g. `computeTreeLayout`) privately, with a comment, leaving the original in app.js.
- **C. Remove from app.js:** the `renderFn` body, its own `_<name>State`/helpers, its `reg('<id>', ...)` line in `registerBehaviors`, and its `else if (currentMode === '<id>') <renderFn>();` arm in the `renderAll` fallback chain. After removal, `grep -n "<renderFn>\b" js/app.js` must be empty.
- **D. index.html:** add `<script src="js/viz/<file>" defer></script>` after the module's `window.<Name>Viz` dependency script and after `js/core/registry.js`, before `js/app.js`.
- **E. Verify:** `node -c js/app.js` && `node -c js/viz/<file>`; grep clean; `npx playwright test <id's e2e if any> tests/smoke_modes.spec.js` pass.
- **F. Commit:** `git commit -am "refactor: extract <id> renderer to js/viz/<file>"` (use `git add -A` for the new file).

---

### Task 1: Batch A1 — string matching (6 modules)

**Files:** create `js/viz/viz_kmp.js`, `viz_bm.js`, `viz_rk.js`, `viz_zalgo.js`, `viz_aho.js`, `viz_strcompare.js`; modify `js/app.js`, `index.html`.

Apply the Recipe to each row (one commit each). Confirm the exact `renderFn`/`codeConst` by reading each id's `reg('<id>',` line in app.js before extracting.

| id | renderFn | codeConst | file |
|----|----------|-----------|------|
| search-kmp | renderKMP | codeSearchKMP | viz_kmp.js |
| search-bm | renderBM | codeSearchBM | viz_bm.js |
| search-rk | renderRK | codeSearchRK | viz_rk.js |
| search-zalgo | renderZAlgo | codeSearchZAlgo | viz_zalgo.js |
| search-aho | renderAhoCorasick | codeSearchAho | viz_aho.js |
| search-strcompare | renderStringCompare | codeSearchStrCompare | viz_strcompare.js |

- [ ] Extract each row per the Recipe (A–F), one commit per module.
- [ ] After the batch: `npx playwright test` (full) + `node --test tests/unit/*.test.js` — report pass counts.

---

### Task 2: Batch A2 — probabilistic + tree aux (6 modules)

**Files:** create `viz_bloom.js`, `viz_skiplist.js`, `viz_cms.js`, `viz_segment.js`, `viz_fenwick.js`, `viz_dsu.js`; modify `js/app.js`, `index.html`.

| id | renderFn | codeConst | file |
|----|----------|-----------|------|
| bloom-filter | renderBloomFilter | codeBloomFilter | viz_bloom.js |
| skip-list | renderSkipList | codeSkipList | viz_skiplist.js |
| count-min-sketch | renderCountMinSketch | codeCountMinSketch | viz_cms.js |
| tree-segment | renderSegmentTree | codeTreeSegment | viz_segment.js |
| tree-fenwick | renderFenwick | codeTreeFenwick | viz_fenwick.js |
| tree-dsu | renderDSU | codeTreeDSU | viz_dsu.js |

- [ ] Extract each row per the Recipe (A–F), one commit per module.
- [ ] After the batch: full `npx playwright test` + unit — report pass counts.

---

### Task 3: Batch A3 — trees / lists / first magic (6 modules)

**Files:** create `viz_tree_traversal.js`, `viz_tree_rb.js`, `viz_huffman.js`, `viz_matrix_sparse_list.js`, `viz_list_equivalence.js`, `viz_magic_latin.js`; modify `js/app.js`, `index.html`.

| id | renderFn | codeConst | file |
|----|----------|-----------|------|
| tree-traversal | renderTreeTraversal | codeTreeTraversal | viz_tree_traversal.js |
| tree-rb | renderTreeRB | codeTreeRB | viz_tree_rb.js |
| huffman | renderHuffman | codeHuffman | viz_huffman.js |
| matrix-sparse-list | renderMatrixSparseList | codeMatrixSparseList | viz_matrix_sparse_list.js |
| list-equivalence | renderListEquivalence | codeListEquivalence | viz_list_equivalence.js |
| magic-latin | renderMagicLatin | codeMagicLatin | viz_magic_latin.js |

Note: `tree-traversal`, `tree-rb`, `huffman` may use the stateless `computeTreeLayout` helper — duplicate it privately per the Recipe if so (Step-A gate confirms they don't touch `bstRoot`/shared state; if any does, SKIP it to Phase B).

- [ ] Extract each row per the Recipe (A–F), one commit per module.
- [ ] After the batch: full `npx playwright test` + unit — report pass counts.

---

### Task 4: Batch A4 — magic variants + nano/ML (7 modules)

**Files:** create `viz_magic_torus.js`, `viz_magic_formula.js`, `viz_magic_symmetry.js`, `viz_nano_bpe_encode.js`, `viz_nano_bpe_train.js`, `viz_nano_compute_graph.js`, `viz_nano_ngram.js`; modify `js/app.js`, `index.html`.

| id | renderFn | codeConst | file |
|----|----------|-----------|------|
| magic-torus | renderMagicTorus | codeMagicTorus | viz_magic_torus.js |
| magic-formula | renderMagicFormula | codeMagicFormula | viz_magic_formula.js |
| magic-symmetry | renderMagicSymmetry | codeMagicSymmetry | viz_magic_symmetry.js |
| nano-bpe-encode | renderNanoBpeEncode | codeNanoBpeEncode | viz_nano_bpe_encode.js |
| nano-bpe-train | renderNanoBpeTrain | codeNanoBpeTrain | viz_nano_bpe_train.js |
| nano-compute-graph | renderNanoComputeGraph | codeNanoComputeGraph | viz_nano_compute_graph.js |
| nano-ngram-next | renderNanoNgramNext | codeNanoNgramNext | viz_nano_ngram.js |

- [ ] Extract each row per the Recipe (A–F), one commit per module.
- [ ] After the batch: full `npx playwright test` + unit — report pass counts.

---

### Task 5: Verify + record

**Files:** none (or `docs/` note).

- [ ] **Step 1:** Full suite: `npm run test:all` (or unit + `npx playwright test` separately). Expected: all pass. If anything fails, STOP and report verbatim — do not force green.
- [ ] **Step 2:** Report `wc -l js/app.js` (was 7,807 after stage 3). Confirm no `render*` remaining except the infrastructure set (`renderOverview`, `renderMethodSections`, `renderCategoryNav`, `renderDeckBar`, `renderSlide`, `renderAll`, `renderHeapTutorialPanel`) and the Phase B stateful cluster (`renderStack`, `renderQueue`, `renderDeque`, `renderLists`, `renderSortBars`, `renderSearchArray`, `renderGraph`, `renderGraphDual`, `renderPrim`, `renderBellmanFord`, `renderFloydWarshall`, `renderTree`, `renderAdvTrees`, `renderHashes`, `renderHeap`, `renderOOP*`, `renderPattern*`).
- [ ] **Step 3:** List any modules SKIPPED to Phase B (from Step-A gates) in the PR description.

Note: `renderOOP*` and `renderPattern*` are self-contained too but render static concept panels (no `*Viz`/state); they may be extracted here if trivial, or left — implementer's call, recorded in the report. They are NOT part of the Phase B stateful cluster.

---

## Self-Review

- **Spec coverage:** Phase A of the Stage 4 spec = all 25 self-contained candidates → Tasks 1–4 (batched), verify → Task 5. Phase B is explicitly a separate future plan.
- **Placeholder scan:** The per-module code is intentionally the shared Recipe (proven & merged in stages 0–3, template `js/viz/viz_sparse.js`) plus exact per-row identifiers — DRY, not a placeholder; every id/renderFn/codeConst/file is spelled out.
- **Consistency:** `K()` call-time pattern, bare `code` const, `VizRegistry.attach`, Step-A gate, per-module commit — identical to the merged Task 7. `renderFn`/`codeConst` names verified against `registerBehaviors()` in app.js.
- **Risk:** each module is independent, guarded by the Step-A gate and per-module tests; the `renderAll` fallback chain stays until each id is registry-driven; anything touching shared state is deferred to Phase B, not forced.
