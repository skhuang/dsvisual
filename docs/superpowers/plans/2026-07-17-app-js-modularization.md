# app.js Modularization — Implementation Plan (Stages 0–3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Break `js/app.js` (9,611 lines) into self-registering modules so adding a visualization means one new file + one `register` call, not editing five `switch` sites — with zero behavior change and tests green at every step.

**Architecture:** Keep the project's IIFE + global-registration pattern loaded via `<script defer>` (no bundler — `file://` blocks ES modules). Introduce `window.VizRegistry` holding per-method behavior descriptors, and `window.VizKit` exposing the in-closure host helpers extracted modules need. Convert the `renderAll` and code-panel dispatch chains to registry lookups; move pure algorithms and self-contained visualizers into their own files.

**Tech Stack:** Vanilla JS (IIFE modules + globals), `node:test` unit tests, Playwright E2E. No new dependencies.

## Global Constraints

- No bundler, no ES modules — modules are IIFEs registering onto a global, loaded via `<script defer>` in `index.html` (Chrome blocks `import` over `file://`).
- Zero behavior/styling/feature change — pure structural refactor.
- Every existing unit + Playwright suite must pass unchanged after every task.
- Script load order in `index.html`: core (`registry.js`) → algos → existing `*_viz.js` → `app.js`. `app.js` stays last; extracted modules load before it.
- Do not modify the already-clean external `*Viz` frame-generator files; only the DOM-owning `render*` glue moves.
- Stage 4 (shared-state cluster: stack/queue/graph/tree/hash/heap) is OUT OF SCOPE.

---

### Task 1: Stage 0 — Console-error smoke net

**Files:**
- Test: `tests/smoke_modes.spec.js` (create)

**Interfaces:**
- Produces: a regression net asserting representative modes load without console errors. No production code.

- [ ] **Step 1: Write the test**

Create `tests/smoke_modes.spec.js`:

```js
const { test, expect } = require('@playwright/test');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, '../index.html');

// One representative method per group — the load+dispatch path we must not regress.
const MODES = [
  'stack-array', 'list-array', 'matrix-sparse', 'tree-bst', 'tree-trie',
  'graph', 'graph-prim', 'hash-chain', 'cache-lru', 'heap-binary',
  'sort-bubble', 'search-binary', 'file-isam', 'gc-memory', 'recursion',
  'oop-inheritance', 'pattern-singleton',
];

async function loadMethod(page, id) {
  const nav = page.locator(`.category-nav-item:has(.category-nav-method[data-method-id="${id}"])`);
  await nav.locator('.category-nav-btn').click();
  await nav.locator(`.category-nav-method[data-method-id="${id}"]`).click();
  await expect(page.locator(`[data-method-section="${id}"]`)).toHaveAttribute('data-runtime-state', 'active');
}

for (const id of MODES) {
  test(`mode ${id} loads with no console errors`, async ({ page }) => {
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE);
    await loadMethod(page, id);
    expect(errors, errors.join('\n')).toEqual([]);
  });
}
```

- [ ] **Step 2: Run it, confirm it passes on current code**

Run: `npx playwright test tests/smoke_modes.spec.js`
Expected: all pass (baseline green). If any mode already logs an error, note it — that mode is excluded from the net, not "fixed" here.

- [ ] **Step 3: Commit**

```bash
git add tests/smoke_modes.spec.js
git commit -m "test: add mode-load console-error smoke net for refactor"
```

---

### Task 2: Stage 1 — Extract tree algorithms to a module

**Files:**
- Create: `js/algos/tree_algos.js`
- Modify: `js/app.js:14-95` (remove the moved block), `index.html` (add `<script>`)
- Test: `tests/unit/tree_algos.test.js` (create)

**Interfaces:**
- Produces: `window.TreeAlgos = { TreeNode, insertBST, getHeight, getBalance, rightRotate, leftRotate, insertAVL, splayRightRotate, splayLeftRotate, splayNode, insertSplay, insertRB_Mock, assignRBColors }`.
- Consumed by: `app.js` renderers that currently call these as closure-free module functions.

- [ ] **Step 1: Create the module (verbatim move of `app.js:14-95`)**

Create `js/algos/tree_algos.js`. Copy the exact bodies of `TreeNode`, `insertBST`, `getHeight`, `getBalance`, `rightRotate`, `leftRotate`, `insertAVL`, `splayRightRotate`, `splayLeftRotate`, `splayNode`, `insertSplay`, `insertRB_Mock`, `assignRBColors` from `js/app.js:14-95` into this IIFE, then export them:

```js
(function (global) {
  // <-- paste the exact TreeNode class + the 12 functions from app.js:14-95 here, unchanged -->

  const api = { TreeNode, insertBST, getHeight, getBalance, rightRotate, leftRotate,
    insertAVL, splayRightRotate, splayLeftRotate, splayNode, insertSplay,
    insertRB_Mock, assignRBColors };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.TreeAlgos = api;
  // Also expose as bare globals so existing app.js call sites keep working unchanged.
  Object.assign(global, api);
})(typeof window !== 'undefined' ? window : globalThis);
```

Note: `Object.assign(global, api)` preserves the current bare-name call sites (`insertBST(...)`) in app.js, so no app.js call site changes — only the definitions move.

- [ ] **Step 2: Write the unit test**

Create `tests/unit/tree_algos.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { insertBST, insertAVL, getHeight } = require('../../js/algos/tree_algos');

test('insertBST builds an ordered binary tree', () => {
  let root = null;
  for (const v of [5, 3, 8, 1]) root = insertBST(root, v);
  assert.equal(root.val, 5);
  assert.equal(root.left.val, 3);
  assert.equal(root.left.left.val, 1);
  assert.equal(root.right.val, 8);
});

test('insertAVL keeps the tree balanced (height stays minimal)', () => {
  let root = null;
  for (const v of [1, 2, 3]) root = insertAVL(root, v); // would be a chain without balancing
  assert.equal(root.val, 2);          // rotated to the middle key
  assert.equal(getHeight(root), 2);
});
```

- [ ] **Step 3: Run test — verify it fails (module not created yet if run first) then passes**

Run: `node --test tests/unit/tree_algos.test.js`
Expected: PASS once `js/algos/tree_algos.js` exists.

- [ ] **Step 4: Remove the moved block from app.js and add the script tag**

In `js/app.js`, delete lines 14-95 (the `TreeNode` class through `assignRBColors`) — they now live in the module.

In `index.html`, add before the other viz scripts (and before `app.js`), right after the prism scripts:

```html
    <script src="js/algos/tree_algos.js" defer></script>
```

- [ ] **Step 5: Verify no regression**

Run: `node --test tests/unit/*.test.js` (expect all pass) and
`npx playwright test tests/smoke_modes.spec.js tests/tree_threaded.spec.js` (expect all pass — trees still render).

- [ ] **Step 6: Commit**

```bash
git add js/algos/tree_algos.js tests/unit/tree_algos.test.js js/app.js index.html
git commit -m "refactor: extract tree algorithms to js/algos/tree_algos.js"
```

---

### Task 3: Stage 2a — Add the VizRegistry core module

**Files:**
- Create: `js/core/registry.js`
- Modify: `index.html` (add `<script>` before `app.js`)
- Test: `tests/unit/registry.test.js` (create)

**Interfaces:**
- Produces: `window.VizRegistry` with:
  - `attach(id, behavior)` — record `{ render, code, layout }` for a method id (later call wins; warns on unknown shape in dev but never throws).
  - `behavior(id) -> { render, code, layout } | null`
  - `has(id) -> boolean`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/registry.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { VizRegistry } = require('../../js/core/registry');

test('attach then behavior returns the descriptor; last attach wins', () => {
  VizRegistry.attach('x', { render: () => 1, code: () => 'a', layout: { host: 'dynamic' } });
  assert.equal(VizRegistry.has('x'), true);
  assert.equal(VizRegistry.behavior('x').render(), 1);
  assert.equal(VizRegistry.behavior('x').code(), 'a');
  VizRegistry.attach('x', { render: () => 2 });
  assert.equal(VizRegistry.behavior('x').render(), 2);
  assert.equal(VizRegistry.behavior('x').code(), 'a'); // partial attach merges
});

test('behavior/has are null/false for unknown ids', () => {
  assert.equal(VizRegistry.behavior('nope'), null);
  assert.equal(VizRegistry.has('nope'), false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/unit/registry.test.js`
Expected: FAIL — cannot find module `../../js/core/registry`.

- [ ] **Step 3: Implement the module**

Create `js/core/registry.js`:

```js
(function (global) {
  const behaviors = new Map(); // id -> { render, code, layout }

  function attach(id, behavior) {
    if (!id || !behavior) return;
    const prev = behaviors.get(id) || {};
    behaviors.set(id, Object.assign({}, prev, behavior)); // partial-merge; last wins
  }
  function behavior(id) { return behaviors.get(id) || null; }
  function has(id) { return behaviors.has(id); }

  const api = { attach, behavior, has };
  if (typeof module !== 'undefined' && module.exports) module.exports = { VizRegistry: api };
  global.VizRegistry = api;
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/unit/registry.test.js`
Expected: PASS.

- [ ] **Step 5: Add the script tag (load before app.js, before other viz scripts)**

In `index.html`, add right after the prism scripts (before `tree_algos.js`):

```html
    <script src="js/core/registry.js" defer></script>
```

- [ ] **Step 6: Commit**

```bash
git add js/core/registry.js tests/unit/registry.test.js index.html
git commit -m "feat: add VizRegistry core for method behavior descriptors"
```

---

### Task 4: Stage 2b — Route render + code dispatch through the registry

**Files:**
- Modify: `js/app.js` (`renderAll` at 2771, `getCodeForMethod` at 329, code-panel branch, and add a startup registration block)

**Interfaces:**
- Consumes: `VizRegistry.attach/behavior` (Task 3).
- Produces: a startup block that attaches every in-closure `render*` + code const to the registry; `renderAll`/code dispatch become lookups with the old `if/else` chains kept as fallback.

- [ ] **Step 1: Add a startup registration block inside the DOMContentLoaded closure**

In `js/app.js`, immediately before the `renderAll` definition (line ~2771), add a function that maps each method id to its renderer + code, and call it once during startup (right after `renderMethodSections(...)` in the init sequence). Include ONE entry per method id. Example (fill in all ids from `METHOD_GROUPS`):

```js
    function registerBehaviors() {
        const R = window.VizRegistry;
        if (!R) return;
        const reg = (id, render, code, layout) => R.attach(id, { render, code, layout });
        // Linear
        reg('stack-array', renderStack, () => codeArray, { container: 'array' });
        reg('queue', renderQueue, () => codeQueue, { container: 'queue' });
        reg('matrix-sparse', renderMatrixSparse, () => codeMatrixSparse, { host: 'dynamic' });
        reg('cache-lru', renderLruCache, () => codeLruCache, { host: 'dynamic' });
        // ... one reg(...) per id in METHOD_GROUPS ...
    }
```

(The full `reg(...)` list is mechanical — one line per method id, mapping to the render function used in the current `renderAll` chain and the code const used in `getCodeForMethod`. Group-shared renderers, e.g. all `graph*` → `renderGraph`, get one `reg` line each pointing at the same function.)

- [ ] **Step 2: Convert `renderAll` to a registry lookup with fallback**

Change the top of `renderAll` (line 2771) so it prefers the registry and falls back to the existing chain:

```js
    function renderAll() {
        syncDifficultySelect();
        const b = window.VizRegistry && window.VizRegistry.behavior(currentMode);
        if (b && b.render) { b.render(); return; }
        // ---- existing if/else chain remains below as fallback ----
        if(currentMode === 'maze-stack') renderMazeStack();
        else if(currentMode.includes('stack')) renderStack();
        // ... unchanged ...
    }
```

- [ ] **Step 3: Convert `getCodeForMethod` to consult the registry first**

At the top of `getCodeForMethod` (line 329) — note this is module scope, so guard on the global:

```js
function getCodeForMethod(methodId) {
    const b = (typeof window !== 'undefined' && window.VizRegistry) ? window.VizRegistry.behavior(methodId) : null;
    if (b && b.code) return b.code();
    const codeByMethod = { /* ...existing map unchanged as fallback... */ };
    return codeByMethod[methodId];
}
```

- [ ] **Step 4: Run the full suite — behavior must be identical**

Run: `npx playwright test` and `node --test tests/unit/*.test.js`
Expected: all pass. The registry now drives dispatch; the old chains are dead-but-present fallbacks.

- [ ] **Step 5: Commit**

```bash
git add js/app.js
git commit -m "refactor: route render/code dispatch through VizRegistry (fallback retained)"
```

---

### Task 5: Stage 3a — Expose host helpers as VizKit

**Files:**
- Modify: `js/app.js` (expose helpers on `window.VizKit` during startup)

**Interfaces:**
- Produces: `window.VizKit = { acquireDynamicVizHost, buildStepControls, getInputDifficulty, langOf, t }` — the closure helpers that extracted self-contained viz modules call. Set once during DOMContentLoaded startup, before `registerBehaviors()`.

- [ ] **Step 1: Add the exposure block**

In `js/app.js`, during startup (before `registerBehaviors()`), add:

```js
    window.VizKit = {
        acquireDynamicVizHost,
        buildStepControls,
        getInputDifficulty,
        langOf: (m) => (window.I18N && window.I18N.getCurrentLanguage() === 'zh') ? m.zh : m.en,
        t,
    };
```

(These names already exist as closure functions; `langOf` is the inline helper duplicated across renderers — centralize it here.)

- [ ] **Step 2: Verify nothing changed**

Run: `npx playwright test tests/smoke_modes.spec.js tests/matrix_sparse.spec.js tests/lru_cache.spec.js`
Expected: all pass (no call sites use VizKit yet; this only publishes the surface).

- [ ] **Step 3: Commit**

```bash
git add js/app.js
git commit -m "refactor: expose in-closure host helpers as window.VizKit"
```

---

### Task 6: Stage 3b — Extract one self-contained visualizer (template: matrix-sparse)

**Files:**
- Create: `js/viz/viz_sparse.js`
- Modify: `js/app.js` (remove `renderMatrixSparse` body + its `reg(...)` line + code-panel/`renderAll` fallback entries for `matrix-sparse`), `index.html` (add `<script>`)

**Interfaces:**
- Consumes: `window.VizKit`, `window.SparseViz`, `window.RandomInput`, `window.VizRegistry`, `codeMatrixSparse` (still a global const in `code_db.js`).
- Produces: `js/viz/viz_sparse.js` self-registers `matrix-sparse` via `VizRegistry.attach`.

This task establishes the exact recipe reused by Task 7.

- [ ] **Step 1: Create the module by moving `renderMatrixSparse` verbatim**

Create `js/viz/viz_sparse.js`. Move the entire `renderMatrixSparse` function (currently at `js/app.js` ~5470) and its module-scope `_sparseState`/`SPARSE_*` helpers into this IIFE. Replace closure-helper references with `VizKit`:

```js
(function (global) {
  const K = () => global.VizKit;               // resolved at call time (VizKit set at startup)
  let _sparseState = null;
  // ...SPARSE_EXAMPLES_KEY / loadSparseExamples / saveSparseExample (moved verbatim)...

  function renderMatrixSparse() {
    const host = K().acquireDynamicVizHost();
    const langOf = K().langOf;
    // ...rest of the body verbatim, with:
    //   acquireDynamicVizHost() -> K().acquireDynamicVizHost()
    //   buildStepControls(...)  -> K().buildStepControls(...)
    //   getInputDifficulty()    -> K().getInputDifficulty()
    //   window.RandomInput / window.SparseViz stay as-is (already globals)
  }

  global.VizRegistry.attach('matrix-sparse', {
    render: renderMatrixSparse,
    code: () => global.codeMatrixSparse,
    layout: { host: 'dynamic' },
  });
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 2: Remove the old copy from app.js**

In `js/app.js`: delete the `renderMatrixSparse` function body, its `_sparseState`/`SPARSE_*` helpers, its `reg('matrix-sparse', …)` line in `registerBehaviors`, and the `matrix-sparse` arms in the `renderAll` fallback chain and the code-panel `updateLayout` branch (the registry now supplies them).

- [ ] **Step 3: Add the script tag (after registry/kit deps, before app.js)**

In `index.html`, add (grouped with the other viz scripts):

```html
    <script src="js/viz/viz_sparse.js" defer></script>
```

Ensure it loads after `js/matrix_sparse_viz.js` (its `SparseViz` dependency) and after `js/core/registry.js`, and before `js/app.js`. Note: `viz_sparse.js` calls `VizRegistry.attach` at load, but `render` runs only on user action (after `VizKit` is set at startup), so the load-order requirement is only registry-before-this-file.

- [ ] **Step 4: Verify**

Run: `npx playwright test tests/matrix_sparse.spec.js tests/smoke_modes.spec.js` and `node --test tests/unit/matrix_sparse_viz.test.js`
Expected: all pass — sparse matrix renders/steps/validates/saves exactly as before.

- [ ] **Step 5: Commit**

```bash
git add js/viz/viz_sparse.js js/app.js index.html
git commit -m "refactor: extract matrix-sparse renderer to js/viz/viz_sparse.js"
```

---

### Task 7: Stage 3c — Extract the remaining self-contained visualizers

**Files:**
- Create: one `js/viz/viz_<name>.js` per row below
- Modify: `js/app.js` (remove each moved renderer + its dispatch/code entries), `index.html` (one `<script>` per new file)

**Interfaces:**
- Same recipe as Task 6, per module. Each self-registers via `VizRegistry.attach(id, { render, code, layout: { host: 'dynamic' } })` and uses `VizKit` for host helpers.

Apply the **Task 6 recipe** to each of these self-contained (dynamic-host, isolated-state) methods, **one module + one commit + one test run each**:

| method id | render fn | new file | E2E to run |
|-----------|-----------|----------|------------|
| `cache-lru` | `renderLruCache` | `viz_lru.js` | `tests/lru_cache.spec.js` |
| `poly-padd` | `renderPolyPadd` | `viz_poly.js` | `tests/poly_padd*` / smoke |
| `expr-infix-postfix` | `renderExprInfixPostfix` | `viz_expr.js` | smoke |
| `maze-stack` | `renderMazeStack` | `viz_maze.js` | `tests/maze*` / smoke |
| `list-doubly` | `renderListDoubly` | `viz_list_doubly.js` | `tests/list_doubly.spec.js` |
| `tree-obst` | `renderObst` | `viz_obst.js` | `tests/tree_obst*` / smoke |
| `tree-threaded` | `renderThreaded` | `viz_threaded.js` | `tests/tree_threaded.spec.js` |
| `tree-mway` | `renderMway` | `viz_mway.js` | `tests/tree_mway*` / smoke |
| `tree-expression` | `renderExprTree` | `viz_expr_tree.js` | smoke |
| `tree-general-binary` | `renderTreeGeneralBinary` | `viz_tgb.js` | `tests/tree_general_binary*` / smoke |
| `game-tree` | `renderGameTree` | `viz_game_tree.js` | `tests/game_tree*` / smoke |
| `sort-external` | `renderExternalSort` | `viz_sort_external.js` | `tests/sort_external*` / smoke |
| `sort-polyphase` | `renderPolyphase` | `viz_polyphase.js` | `tests/sort_polyphase*` / smoke |
| `search-fibonacci` | `renderSearchFibonacci` | `viz_search_fib.js` | `tests/search_fibonacci*` / smoke |
| `search-interpolation` | `renderSearchInterpolation` | `viz_search_interp.js` | `tests/search_interpolation*` / smoke |
| `graph-aoe` | `renderGraphAoe` | `viz_graph_aoe.js` | `tests/graph_aoe*` / smoke |
| `file-isam` | `renderFileIsam` | `viz_file_isam.js` | `tests/file_isam*` / smoke |
| `file-inverted` | `renderFileInverted` | `viz_file_inverted.js` | `tests/file_inverted*` / smoke |
| `gc-memory` | `renderGcMemory` | `viz_gc.js` | `tests/gc_memory*` / smoke |
| `recursion` | `renderRecursion` | `viz_recursion.js` | `tests/recursion*` / smoke |
| `magic-square` | `renderMagicSquare` | `viz_magic.js` | `tests/magic_square.spec.js` |

For EACH row, the exact steps are:

- [ ] **Step A: Verify the renderer is self-contained.** Confirm its body uses only: `VizKit` helpers, its own `_<name>State`, its `window.<Name>Viz` global, `window.RandomInput`, and its code const. If it reads shared closure state (`stackData`, `edges`, `bstRoot`, `currentMode`, hash/heap globals), STOP — it belongs to Stage 4; skip this row and note it.
- [ ] **Step B:** Move the renderer + its `_<name>State`/helpers into `js/viz/<file>` following the Task 6 template (closure-helper calls → `K().<helper>`; register via `VizRegistry.attach`).
- [ ] **Step C:** Remove the old copy + its `reg(...)` line + `renderAll`/code-panel fallback arms from `js/app.js`.
- [ ] **Step D:** Add the `<script defer>` in `index.html` after its `*Viz` dependency and `registry.js`, before `app.js`.
- [ ] **Step E:** Run that row's E2E + `tests/smoke_modes.spec.js`; expect green.
- [ ] **Step F:** Commit: `git commit -m "refactor: extract <id> renderer to js/viz/<file>"`.

Skip (leave in app.js for Stage 4) any renderer that Step A shows touches shared state — record which were skipped in the PR description.

---

### Task 8: Verify + document

**Files:**
- Modify: `README.md` (Project Structure section)

- [ ] **Step 1: Full suite**

Run: `npm run test:all` (unit + Playwright). Expected: all pass.

- [ ] **Step 2: Confirm the payoff**

Verify adding a hypothetical method now needs only a new `js/viz/*.js` + its `<script>` tag + `METHOD_GROUPS` entry — no edits to `renderAll`/`getCodeForMethod`. Note the new `js/app.js` line count in the PR description (should be materially smaller).

- [ ] **Step 3: Update README Project Structure**

Document the new `js/core/`, `js/algos/`, `js/viz/` layout and the "add a viz = one file + `VizRegistry.attach`" workflow.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: document modular viz layout and registry workflow"
```

---

## Self-Review

- **Spec coverage:** Stage 0 → Task 1; Stage 1 → Task 2; Stage 2 (registry + switch→lookup) → Tasks 3–4; Stage 3 (VizKit + extract self-contained viz) → Tasks 5–7; verification/docs → Task 8. Stage 4 explicitly deferred. Covered.
- **Placeholder scan:** Task 4 Step 1 and Task 7 are intentionally recipe+table (the moves are mechanical and identical modulo identifiers) rather than repeating full code 20×; the recipe is given once in full (Task 6) with exact per-row identifiers — this is DRY, not a placeholder. Every novel mechanism (registry.js, VizKit, tree_algos, dispatch conversion) has complete code.
- **Type/name consistency:** `VizRegistry.attach/behavior/has`, `VizKit.{acquireDynamicVizHost,buildStepControls,getInputDifficulty,langOf,t}`, `TreeAlgos` used consistently. `attach` partial-merges (Task 3 test asserts it), which Task 6/7 rely on when a module supplies `render`+`code`+`layout` in one call.
- **Risk ordering:** pure-algo move (safe) → registry with fallback retained (behavior-identical) → VizKit publish (no call sites) → one template extraction → repeat. Fallback chains stay until each id is proven registry-driven; the shared-state cluster is untouched.
