# Random Input for All Categories Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every visualizer that has a real data input a difficulty-aware 🎲 "random input" control, matching the existing sort/search/graph pattern.

**Architecture:** For each target methodId: add a `case` to `js/random_input.js` `randomInputFor()` returning the input shape that viz consumes (reuse existing helpers), and wire a `🎲 .rand-btn` in that viz's control bar that calls `RandomInput.randomInputFor(methodId, VizKit.getInputDifficulty())`, writes the result into the viz's input, and re-renders. Built in category batches; each batch is one task.

**Tech Stack:** Vanilla JS; `js/random_input.js` (pure generator, `node:test` unit + `window.RandomInput`), `js/domains/*.js` & `js/viz/viz_*.js` (visualizers via `VizRegistry`/`VizCore`), `window.VizKit.getInputDifficulty()`; Playwright e2e.

## Global Constraints

- Branch `feat/random-input-all-categories` (dsvisual). Tasks share `js/random_input.js`, so run them SEQUENTIALLY (no parallel implementers).
- **The pattern (pattern A), applied per methodId:**
  1. `js/random_input.js`: add `case '<methodId>': return <shape>;` inside `randomInputFor()`'s switch, reusing helpers (`valSeq`, `uniqueInts`, `randInt`, `pick`, `graphEdgeList`, `graphDagText`, etc.). Add a small helper only if no existing shape fits.
  2. In the viz's control-bar HTML string, add `'<button type="button" class="rand-btn" title="' + (t?('random'):'Random') + '">🎲</button>'` right after the input (copy `js/domains/sort.js:51`).
  3. Wire the click (copy `js/domains/sort.js:69-72`): `el.querySelector('.rand-btn').addEventListener('click', () => { const r = window.RandomInput && RandomInput.randomInputFor(methodId, window.VizKit.getInputDifficulty()); if (r) { /* write r into the viz's input field */; render(); } });`
  4. Read the actual viz module to find its input field selector and how it parses/inserts input — write `r` into that field in the format the viz already accepts (e.g. a textarea of an edge list, a number input, a comma list). Do NOT change the viz's existing parsing/rendering.
- Reuse the difficulty the framework already provides (`window.VizKit.getInputDifficulty()`); do NOT build a new difficulty control (the `.viz-difficulty` dropdown auto-injects next to any `.ex-select`; the global `#input-difficulty` always applies).
- Do NOT touch generated files (`js/code_db.js`, `js/quiz_rendered.js`, `js/labs_rendered.js`, `js/slides_rendered.js`) or the excluded static demos (`patterns-*`, `oop`, nano-LLM `bpeEncode`/`bpeTrain`/`computeGraph`/`ngramNext`).
- Verify methodIds against `METHOD_GROUPS` in `js/app.js` before coding a `case`.
- Tests each batch: unit cases in `tests/unit/random_input.test.js` (each new methodId × the four difficulties: assert non-null + shape + a difficulty invariant like `large` count > `normal`), and at least one Playwright wiring test per batch in `tests/random_input.spec.js` mirroring `expectRandomizes` (`tests/random_input.spec.js:17-22`). Run `npm run test:all` — unit is the deterministic gate; re-run a flaky Playwright spec in isolation.
- Commit trailer `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

---

### Task 1 (B1): Heap — the reference implementation

**Files:** Modify `js/random_input.js`, `js/domains/heap.js`, `index.html` (`#heap-actions`); Test `tests/unit/random_input.test.js`, `tests/random_input.spec.js` (or `tests/heap_visualizer.spec.js`).

**Interfaces:** Produces the pattern all later tasks copy. methodIds: `heap-binary`, `heap-binomial`, `heap-fibonacci`, `heap-leftist`, `heap-skew`, `heap-dary`, `heap-pairing` (all `visualizer:'heap'`, `js/app.js:146-152`).

- [ ] **Step 1: Failing unit test** — in `tests/unit/random_input.test.js`, add a heap block:

```js
const RI = require('../../js/random_input.js'); // if not already required at top
for (const id of ['heap-binary','heap-binomial','heap-fibonacci','heap-leftist','heap-skew','heap-dary','heap-pairing']) {
  test(`randomInputFor ${id}: value sequence per difficulty`, () => {
    for (const d of ['normal','special','edge','large']) {
      const r = RI.randomInputFor(id, d, Math.random);
      assert.ok(r && Array.isArray(r.vals) && r.vals.length >= 1, `${id}/${d} shape`);
    }
    const n = RI.randomInputFor(id, 'normal', Math.random).vals.length;
    const big = RI.randomInputFor(id, 'large', Math.random).vals.length;
    assert.ok(big > n, `${id}: large (${big}) > normal (${n})`);
  });
}
```

- [ ] **Step 2: Run — expect FAIL** (`randomInputFor('heap-binary',…)` returns null). `node --test tests/unit/random_input.test.js`

- [ ] **Step 3: Add the heap case** in `js/random_input.js` (near the other `valSeq` cases, before `default`):

```js
      case 'heap-binary':
      case 'heap-binomial':
      case 'heap-fibonacci':
      case 'heap-leftist':
      case 'heap-skew':
      case 'heap-dary':
      case 'heap-pairing':
        return { vals: valSeq(rng, difficulty) };
```

- [ ] **Step 4: Wire the 🎲 in heap** — add a rand button to `#heap-actions` in `index.html` right after `#heap-val` (line ~97): `<button type="button" class="rand-btn" id="btn-heap-random" title="Random" data-testid="heap-random">🎲</button>`. In `js/domains/heap.js`, on click: read `methodId` (the current heap method), `const r = window.RandomInput.randomInputFor(methodId, window.VizKit.getInputDifficulty()); if (r) { resetHeap(); r.vals.forEach(v => insertValue(v)); }` — use the module's real reset + insert functions (read `heap.js` for their names; insertion is the `action:'insert'` path around `js/domains/heap.js:117-136`). Fall back to the global difficulty if `VizKit` is absent.

- [ ] **Step 5: Failing→passing e2e** — in `tests/random_input.spec.js` (or `tests/heap_visualizer.spec.js`), add: load `heap-binary`, capture the current `.heap-node` count/text, click `[data-testid="heap-random"]`, assert the rendered heap changed (use an `expectRandomizes`-style retry). Set `#input-difficulty` to `large` and assert more nodes than `normal`.

- [ ] **Step 6: Run** `node --test tests/unit/random_input.test.js` then `npm run test:all`. Expected: green.

- [ ] **Step 7: Commit** `git commit -m "feat(viz): random input for heap (🎲, difficulty-aware)"`

---

### Task 2 (B2): Trees — key/word structures

**Files:** `js/random_input.js`; the radix/ternary + B-tree/B+ viz modules (find via `METHOD_GROUPS` `visualizer:'text-tree'`/`'advanced-tree'` and `VizRegistry`); tests.
**methodIds:** `tree-radix`, `tree-ternary` (word/string set), `tree-btree`, `tree-bplus` (int key sequence).

- [ ] Step 1: unit tests for the four ids (radix/ternary → `{ words: [...] }` or the shape those viz consume; btree/bplus → `{ vals: valSeq(...) }`). Confirm each viz's input format by reading its module first.
- [ ] Step 2: run → FAIL. Step 3: add cases in `random_input.js` (add a `wordSet(rng, difficulty)` helper for radix/ternary if none fits — lowercase words, count/length scaling with difficulty). Step 4: wire 🎲 in each viz module per the pattern. Step 5: one Playwright wiring test (e.g. `tree-radix`). Step 6: `npm run test:all`. Step 7: commit `feat(viz): random input for radix/ternary/B-tree/B+ trees`.

---

### Task 3 (B3): Trees — array/union structures

**methodIds:** `tree-dsu` (union pairs from a node set), `tree-segment`, `tree-fenwick` (int array via `valSeq`/`uniqueInts`).

- [ ] Steps mirror Task 2. For `tree-dsu` add a helper producing `{ n, unions: [[a,b],…] }` (or the shape the DSU viz parses — read `viz_dsu.js`). segment/fenwick → `{ vals: valSeq(...) }`. Unit (shape + difficulty invariant) + one e2e (e.g. `tree-fenwick`). Commit `feat(viz): random input for DSU / segment / Fenwick`.

---

### Task 4 (B4): Trees — structural / integer

**methodIds:** `tree-general-binary`, `tree-copy-equal`, `tree-catalan`, `game-tree` (verify exact ids in `METHOD_GROUPS`).

- [ ] Steps mirror Task 2. Read each viz for its input: catalan → a small `n`; game-tree → leaf values (`valSeq`); tgb/copy-equal → a tree spec the viz parses. Add cases + a helper per shape as needed. Unit + one e2e (e.g. `tree-catalan`). Commit `feat(viz): random input for general-binary / copy-equal / catalan / game-tree`.

---

### Task 5 (B5): Graphs — weighted / DAG

**methodIds:** `graph-floyd`, `graph-aoe`, `graph-matrix` (verify ids). Reuse `graphEdgeList(rng, difficulty, true)` (weighted) and/or `graphDagText(rng, difficulty, true)` — match what each viz's textarea parses (read the modules).

- [ ] Steps mirror Task 2 (no new helper needed — reuse graph helpers). Unit asserts a valid edge list per difficulty; one e2e (e.g. `graph-floyd`). Commit `feat(viz): random input for Floyd / AOE / graph-matrix`.

---

### Task 6 (B6): Graphs — connectivity

**methodIds:** `graph-components`, `graph-bipartite` (undirected), `graph-closure`, `graph-scc`, `graph-maxflow` (directed; maxflow weighted). Reuse `graphEdgeList` with the right directed/weighted flags (extend the helper with a `directed` option if it lacks one — read it first).

- [ ] Steps mirror Task 5. Unit + one e2e (e.g. `graph-scc`). Commit `feat(viz): random input for components / bipartite / closure / SCC / max-flow`.

---

### Task 7 (B7): Hash family

**methodIds:** `hash` (chain/open/bucket — confirm the actual ids), `bloom`, `skiplist`, `cms`. Shape: `{ vals: uniqueInts(rng, n, lo, hi) }` with `n` scaling by difficulty (or the key format each viz parses — read `js/domains/hash.js`, `viz_bloom.js`, `viz_skiplist.js`, `viz_cms.js`).

- [ ] Steps mirror Task 2. Add a `keySet(rng, difficulty)` helper if needed. Unit + one e2e (e.g. the main `hash`). Commit `feat(viz): random input for hash / bloom / skip-list / CMS`.

---

### Task 8 (B8): Misc data structures

**methodIds:** `deque` (`js/domains/linear.js`), `sort-polyphase`, `isam`, `inverted`, `gcmem`, `recursion` (verify ids). Each gets the most sensible shape (int sequence / document terms / a small `n`) by reading its module.

- [ ] Steps mirror Task 2, per viz. Deque: reuse the linear insert path + `valSeq`. Unit for each id + one representative e2e (e.g. `deque`). Commit `feat(viz): random input for deque / polyphase / ISAM / inverted-index / GC / recursion`.

---

### Task 9 (B9): Magic squares

**methodIds:** `magic-square`, `magicLatin`, `magicTorus`, `magicFormula`, `magicSymmetry` (verify ids). Shape: a random **order n** valid for each viz's construction (odd / doubly-even / singly-even constraints differ — read each module for the accepted range) — e.g. `{ n: <valid> }`.

- [ ] Steps mirror Task 2. CRITICAL: the random `n` MUST be one the viz can actually construct (respect each viz's parity/range constraint) — the unit test asserts the produced `n` is in the accepted set, and the e2e asserts the square renders (no error) after 🎲. Commit `feat(viz): random input for magic-square family`.

---

## Final gate (after all tasks)

- [ ] `npm run test:all` green (unit deterministic; Playwright flakes re-checked in isolation).
- [ ] Grep: every methodId in the spec's §2 list has a non-`default` `case` in `js/random_input.js`, and its viz renders a `.rand-btn`. Excluded demos (`patterns-*`, `oop`, nano-LLM) have NO `.rand-btn`.
- [ ] Generated files untouched.
- [ ] Open ONE PR to `main` and merge on green.
