# Linked-List Sparse Matrix Visualization — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `matrix-sparse-list` visualization (in the `arrays` group) that represents a sparse matrix as an orthogonal (row + column) linked list and animates its construction and transpose.

**Architecture:** Pure dual-export module `js/matrix_sparse_list_viz.js` (`parse`, `build` → `{rows,cols,nodes,rowChains,colChains}`, `buildFrames`, `transposeGrid`, `transpose`, unit-tested) + `renderMatrixSparseList()` in the js/app.js closure (col headers on top, row headers on left, non-zero nodes on a grid with right/down chain arrows; Build/Transpose phase toggle) using `acquireDynamicVizHost()` + `buildStepControls()`. Plus 4 wiring edits, cpp, bilingual slides, i18n, a `random_input` generator + 🎲, and E2E.

**Tech Stack:** Vanilla browser JS, `node --test`, Playwright, `node build_db.js`, `npm run build:slides`.

**Spec:** `docs/superpowers/specs/2026-06-30-matrix-sparse-list-design.md`

## Global Constraints

- Matrix input capped at ≤ 6×6 (Build clamps).
- Module pure / DOM-free, dual-export IIFE like `js/heap_models.js` (`module.exports` + `global.MatrixSparseListViz`).
- Matrix text format (same as matrix-sparse): rows separated by `;`, cells by `,`; non-numeric → 0.
- No new group (existing `arrays`), so only the overview-tile count changes: 111 → 112. Categories stay 14, nav pills stay 15.
- CRITICAL renderAll/updateLayout ordering: `matrix-sparse-list` CONTAINS the substring `matrix-sparse`. The existing branches use exact `===`, so place the new `=== 'matrix-sparse-list'` branch BEFORE the existing `=== 'matrix-sparse'` branch in both renderAll and updateLayout (defensive; exact-match means order is not strictly required, but keep the more-specific id first).
- Reuse the recursion overflow fix: `host.style.width = '100%'` after `acquireDynamicVizHost()`.
- build_db.js has a missing-file guard — a mapping's `.cpp` must exist or `node build_db.js` throws. Add the mapping only alongside the cpp file.
- Do NOT touch `js/cloud-config.js`.

---

## Task 1: Pure module `js/matrix_sparse_list_viz.js` + unit tests

**Files:** Create `js/matrix_sparse_list_viz.js`, `tests/unit/matrix_sparse_list.test.js`

**Interfaces:**
- Produces: `parse(text)` → `number[][]` grid; `build(grid)` → `{rows, cols, nodes:[{id,row,col,val}], rowChains:number[][], colChains:number[][]}`; `buildFrames(grid)` → `{frames, built}`; `transposeGrid(grid)` → `number[][]`; `transpose(built)` → built-of-transpose; `DEFAULT` (string).

- [ ] **Step 1: Write the failing unit test** — create `tests/unit/matrix_sparse_list.test.js`:
```js
const test = require('node:test');
const assert = require('node:assert');
const V = require('../../js/matrix_sparse_list_viz.js');

function isAsc(a) { return a.every((v, i) => i === 0 || a[i - 1] < v); }

test('parse: rows by ;, cells by ,, non-numeric -> 0, clamps to 6x6', () => {
  assert.deepStrictEqual(V.parse('0,0,3;5,0,0'), [[0, 0, 3], [5, 0, 0]]);
  assert.deepStrictEqual(V.parse('1,x,2'), [[1, 0, 2]]);
  const big = V.parse(Array(8).fill(Array(8).fill('1').join(',')).join(';'));
  assert.ok(big.length <= 6 && big[0].length <= 6);
});

test('build: nodes are the non-zeros row-major with ascending ids', () => {
  const g = [[0, 0, 3, 0], [5, 0, 0, 0], [0, 2, 0, 4]];
  const b = V.build(g);
  assert.strictEqual(b.rows, 3);
  assert.strictEqual(b.cols, 4);
  assert.deepStrictEqual(b.nodes.map((n) => [n.row, n.col, n.val]),
    [[0, 2, 3], [1, 0, 5], [2, 1, 2], [2, 3, 4]]);
  assert.deepStrictEqual(b.nodes.map((n) => n.id), [0, 1, 2, 3]);
});

test('build: row chains sorted by col; col chains sorted by row', () => {
  const g = [[7, 0, 8], [0, 9, 0], [1, 0, 2]];
  const b = V.build(g);
  // row 0 has cols 0,2 ; row chains hold node ids in ascending col
  b.rowChains.forEach((chain, r) => {
    const cols = chain.map((id) => b.nodes[id].col);
    assert.ok(isAsc(cols), 'row ' + r + ' cols ascending');
    chain.forEach((id) => assert.strictEqual(b.nodes[id].row, r));
  });
  b.colChains.forEach((chain, c) => {
    const rows = chain.map((id) => b.nodes[id].row);
    assert.ok(isAsc(rows), 'col ' + c + ' rows ascending');
    chain.forEach((id) => assert.strictEqual(b.nodes[id].col, c));
  });
  // every node appears in exactly one row chain and one col chain
  const all = b.rowChains.flat().sort((a, z) => a - z);
  assert.deepStrictEqual(all, b.nodes.map((n) => n.id));
});

test('transposeGrid is the matrix transpose; transpose(build) matches build(gridT)', () => {
  const g = [[0, 0, 3, 0], [5, 0, 0, 0], [0, 2, 0, 4]];
  const gt = V.transposeGrid(g);
  assert.strictEqual(gt.length, 4);
  assert.strictEqual(gt[0].length, 3);
  assert.strictEqual(gt[2][0], 3); // g[0][2]=3 -> gt[2][0]
  assert.strictEqual(gt[0][1], 5); // g[1][0]=5 -> gt[0][1]
  const t = V.transpose(V.build(g));
  assert.strictEqual(t.rows, 4);
  assert.strictEqual(t.cols, 3);
  assert.deepStrictEqual(t.nodes.map((n) => [n.row, n.col, n.val]),
    V.build(gt).nodes.map((n) => [n.row, n.col, n.val]));
});

test('buildFrames: one frame per non-zero + a final done frame; built matches build', () => {
  const g = [[0, 0, 3, 0], [5, 0, 0, 0], [0, 2, 0, 4]];
  const { frames, built } = V.buildFrames(g);
  const nz = 4;
  assert.strictEqual(frames.filter((f) => f.type === 'insert').length, nz);
  assert.strictEqual(frames[frames.length - 1].type, 'done');
  assert.deepStrictEqual(built.nodes, V.build(g).nodes);
});

test('edge: all-zero (no nodes) and 1x1', () => {
  const b0 = V.build([[0, 0], [0, 0]]);
  assert.strictEqual(b0.nodes.length, 0);
  assert.ok(V.buildFrames([[0]]).frames.length >= 1);
  const b1 = V.build([[5]]);
  assert.deepStrictEqual(b1.nodes.map((n) => [n.row, n.col, n.val]), [[0, 0, 5]]);
});

test('exports DEFAULT string', () => { assert.strictEqual(typeof V.DEFAULT, 'string'); });
```
Run `node --test tests/unit/matrix_sparse_list.test.js` → FAIL (module missing).

- [ ] **Step 2: Implement `js/matrix_sparse_list_viz.js`:**
```js
(function (global) {
  'use strict';

  var MAX = 6;

  function parse(text) {
    var rows = String(text || '').split(';').map(function (r) { return r.trim(); }).filter(function (r) { return r.length; });
    var grid = rows.map(function (r) {
      return r.split(',').map(function (c) { var n = parseInt(c.trim(), 10); return Number.isFinite(n) ? n : 0; });
    });
    grid = grid.slice(0, MAX).map(function (r) { return r.slice(0, MAX); });
    return grid.length ? grid : [[0]];
  }

  function build(grid) {
    var rows = grid.length;
    var cols = grid.reduce(function (m, r) { return Math.max(m, r.length); }, 0);
    var nodes = [];
    var rowChains = []; for (var r = 0; r < rows; r++) rowChains.push([]);
    var colChains = []; for (var c = 0; c < cols; c++) colChains.push([]);
    var id = 0;
    for (var i = 0; i < rows; i++) {
      for (var j = 0; j < cols; j++) {
        var v = grid[i][j];
        if (v && v !== 0) {
          nodes.push({ id: id, row: i, col: j, val: v });
          rowChains[i].push(id);   // row-major insertion => ascending col within a row
          id++;
        }
      }
    }
    // column chains: gather by column in ascending row (nodes already row-major)
    nodes.forEach(function (n) { colChains[n.col].push(n.id); });
    return { rows: rows, cols: cols, nodes: nodes, rowChains: rowChains, colChains: colChains };
  }

  function buildFrames(grid) {
    var built = build(grid);
    var frames = [];
    var acc = [];
    built.nodes.forEach(function (n) {
      acc.push({ id: n.id, row: n.row, col: n.col, val: n.val });
      frames.push({
        type: 'insert', nodeId: n.id, row: n.row, col: n.col, val: n.val,
        nodes: acc.map(function (x) { return { id: x.id, row: x.row, col: x.col, val: x.val }; })
      });
    });
    frames.push({ type: 'done', nodes: built.nodes.map(function (x) { return { id: x.id, row: x.row, col: x.col, val: x.val }; }) });
    return { frames: frames, built: built };
  }

  function transposeGrid(grid) {
    var rows = grid.length;
    var cols = grid.reduce(function (m, r) { return Math.max(m, r.length); }, 0);
    var out = [];
    for (var c = 0; c < cols; c++) {
      var row = [];
      for (var r = 0; r < rows; r++) row.push((grid[r][c] != null) ? grid[r][c] : 0);
      out.push(row);
    }
    return out;
  }

  function transpose(built) {
    // Rebuild from the transposed grid so chains are correct for the transpose.
    var rows = built.rows, cols = built.cols;
    var grid = []; for (var r = 0; r < rows; r++) { var g = []; for (var c = 0; c < cols; c++) g.push(0); grid.push(g); }
    built.nodes.forEach(function (n) { grid[n.row][n.col] = n.val; });
    return build(transposeGrid(grid));
  }

  var DEFAULT = '0,0,3,0;5,0,0,0;0,2,0,4';

  var api = { parse: parse, build: build, buildFrames: buildFrames, transposeGrid: transposeGrid, transpose: transpose, DEFAULT: DEFAULT };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.MatrixSparseListViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
```
Run `node --test tests/unit/matrix_sparse_list.test.js` → PASS (7 tests). Also `node --test tests/unit/*.test.js` (no regressions).

- [ ] **Step 3: Commit**
```bash
git add js/matrix_sparse_list_viz.js tests/unit/matrix_sparse_list.test.js
git commit -m "feat: pure orthogonal-linked-list sparse matrix module

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: render + wiring + cpp + slides + i18n + random generator + E2E

**Files:** Create `cpp/matrix_sparse_list.cpp`, `slides/{zh,en}/matrix-sparse-list.md` (generated), `tests/matrix_sparse_list.spec.js`; Modify `js/app.js`, `index.html`, `js/i18n.js`, `slides_db.js`, `build_db.js`, `js/code_db.js` (generated), `js/slides_rendered.js` (generated), `js/random_input.js`, `style.css`.

**Interfaces:**
- Consumes: `MatrixSparseListViz.parse/build/buildFrames/transpose/DEFAULT` (Task 1); `acquireDynamicVizHost()`, `buildStepControls(onStep, onReset, runIntervalMs)`, `getInputDifficulty()`, `window.RandomInput.randomInputFor`.

- [ ] **Step 1: Create `cpp/matrix_sparse_list.cpp`** (compilable reference: node struct + build orthogonal lists + transpose):
```cpp
// Sparse matrix as an orthogonal (row + column) linked list, with transpose.
#include <iostream>
#include <vector>
using namespace std;

struct Node { int row, col, val; Node* right; Node* down; };

int main() {
    // 3x4 example (0 = empty); non-zeros linked by row (right) and column (down).
    int R = 3, C = 4;
    int g[3][4] = {{0,0,3,0},{5,0,0,0},{0,2,0,4}};
    vector<Node*> rowHead(R, nullptr), rowTail(R, nullptr);
    vector<Node*> colHead(C, nullptr), colTail(C, nullptr);

    for (int i = 0; i < R; ++i)
        for (int j = 0; j < C; ++j)
            if (g[i][j] != 0) {
                Node* n = new Node{i, j, g[i][j], nullptr, nullptr};
                if (!rowHead[i]) rowHead[i] = n; else rowTail[i]->right = n; rowTail[i] = n;
                if (!colHead[j]) colHead[j] = n; else colTail[j]->down = n;  colTail[j] = n;
            }

    cout << "Row lists:\n";
    for (int i = 0; i < R; ++i) {
        cout << "  r" << i << ":";
        for (Node* p = rowHead[i]; p; p = p->right) cout << " (" << p->col << "," << p->val << ")";
        cout << "\n";
    }
    // Transpose: same nodes with row/col swapped, relinked by the (old) column order.
    cout << "Transpose row lists (former columns):\n";
    for (int j = 0; j < C; ++j) {
        cout << "  r" << j << ":";
        for (Node* p = colHead[j]; p; p = p->down) cout << " (" << p->row << "," << p->val << ")";
        cout << "\n";
    }
    return 0;
}
```

- [ ] **Step 2: build_db** — add `'matrix_sparse_list.cpp': 'codeMatrixSparseList'` to build_db.js `mappings`; run `node build_db.js`; verify `grep -c codeMatrixSparseList js/code_db.js` ≥1. (The cpp file from Step 1 must exist first or the guard throws.)

- [ ] **Step 3: index.html** — add `<script src="js/matrix_sparse_list_viz.js" defer></script>` near the other `js/*_viz.js` includes (before `js/app.js`).

- [ ] **Step 4: METHOD_GROUPS** — in the `arrays` group's methods array, add immediately after the `matrix-sparse` entry:
```js
            { id: 'matrix-sparse-list', title: 'Sparse Matrix (Linked List)', file: 'matrix_sparse_list.cpp', visualizer: 'msl', controls: 'msl' },
```

- [ ] **Step 5: Implement `renderMatrixSparseList()` in js/app.js.** READ `renderMatrixSparse()` (the existing triple-array sparse matrix render) and `renderRecursion()` (host width + buildStepControls + paint pattern) first. Structure:
  - `let _mslState = null;`
  - `if (!_mslState) _mslState = { text: MatrixSparseListViz.DEFAULT, phase: 'build' };`
  - `const host = acquireDynamicVizHost(); host.style.width = '100%';`
  - `const grid = MatrixSparseListViz.parse(_mslState.text);`
  - `const src = _mslState.phase === 'transpose' ? MatrixSparseListViz.transposeGrid(grid) : grid;`
  - `const { frames, built } = MatrixSparseListViz.buildFrames(src);`
  - `host.innerHTML`: controls row = `<input type="text" class="msl-input" value="${_mslState.text}">` + `<button type="button" class="msl-build">Build</button>` + `<button type="button" class="rand-btn" title="Random">🎲</button>` + `<button type="button" class="msl-phase-btn">${_mslState.phase === 'build' ? 'Show Transpose' : 'Show Original'}</button>` + a phase/label line + a `<div class="msl-stage" style="position:relative;overflow:auto"></div>`.
  - `paint()`: render, using `built` for layout and revealing nodes up to `frames[idx]`:
    - A grid of `built.rows`×`built.cols` cells; column headers across the top (`C0..`), row headers down the left (`R0..`).
    - For each node revealed so far (ids in `frames[idx].nodes`), place a `.msl-node` (show `val`, dataset row/col) at its (row,col) cell.
    - Draw SVG arrows: within each row chain, `right` arrows between consecutive revealed nodes (and a faint arrow from the row header to the first, and circular back from last to header); similarly `down` arrows for column chains. Highlight `frames[idx].nodeId` and its two new links.
    - Show a label: current phase ("Original" / "Transpose (rows↔cols)").
  - `step()` returns `idx < frames.length - 1`; `reset()` idx=0; `host.appendChild(buildStepControls(step, reset, 700));`
  - `.msl-build` onclick (try/catch): `_mslState.text = host.querySelector('.msl-input').value; renderMatrixSparseList();`
  - `.rand-btn` onclick: `const inp = window.RandomInput && RandomInput.randomInputFor('matrix-sparse-list', getInputDifficulty()); if (inp) { _mslState.text = inp.text; renderMatrixSparseList(); }`
  - `.msl-phase-btn` onclick: `_mslState.phase = _mslState.phase === 'build' ? 'transpose' : 'build'; renderMatrixSparseList();`
  - Add `.msl-*` CSS to style.css (grid cells, headers, nodes, arrow strokes, highlight). Commit it.

- [ ] **Step 6: 3 remaining wiring edits in js/app.js:**
  - codeByMethod (getCodeForMethod): `'matrix-sparse-list': codeMatrixSparseList,`
  - updateLayout: add `else if (currentMode === 'matrix-sparse-list') { codeTitle.textContent = 'matrix_sparse_list.cpp'; codeDisplay.textContent = codeMatrixSparseList; }` BEFORE the existing `else if (currentMode === 'matrix-sparse')` branch.
  - renderAll: add `else if (currentMode === 'matrix-sparse-list') renderMatrixSparseList();` BEFORE the existing `else if (currentMode === 'matrix-sparse') renderMatrixSparse();` branch.

- [ ] **Step 7: i18n** — en: `'method.matrix-sparse-list': 'Sparse Matrix (Linked List)',`; zh: `'method.matrix-sparse-list': '稀疏矩陣(鏈結串列)',`. (No group key.)

- [ ] **Step 8: random_input generator** — in `js/random_input.js`, add a `matrix-sparse-list` case to `randomInputFor`. Reuse the existing matrix-sparse text generator if one exists; otherwise return `{ text }` with a small grid by difficulty (read the file for the `matrix-sparse` case and the `randInt` helper, then mirror it):
```js
      case 'matrix-sparse-list':
        return { text: RandomInput.randomInputFor('matrix-sparse', difficulty).text };
```
If `matrix-sparse` returns a `{text}` grid (it does — it feeds renderMatrixSparse's `.sm-input`), delegate to it as above; if that delegation isn't possible (helper is not on the exported object at that point), inline the same small-grid generator producing a `;`/`,` matrix string capped 6×6. Verify by reading the file.

- [ ] **Step 9: slides** — add a `matrix-sparse-list` deck to `slides_db.js` (mirror an existing entry; zh+en). Cover: why linked representation (dynamic non-zeros, easy insert/delete vs the fixed triple array); the orthogonal row/column lists + headers; construction; transpose via row↔col; contrast with `matrix-sparse` (triple array). Run `npm run build:slides`. Confirm `slides/{zh,en}/matrix-sparse-list.md` created.

- [ ] **Step 10: E2E** — create `tests/matrix_sparse_list.spec.js`. Import the shared helper: `const { loadMethod } = require('./helpers');` plus the `file://` fileUri (copy the two-line preamble from `tests/matrix_sparse.spec.js` or `tests/recursion.spec.js`). Then:
```js
test('matrix-sparse-list loads, builds, steps, toggles transpose, randomizes', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'matrix-sparse-list');
  const card = page.locator('[data-method-section="matrix-sparse-list"]');
  await expect(card).toHaveAttribute('data-runtime-state', 'active');
  await expect(card.locator('.msl-stage').first()).toBeVisible();
  await expect(card.locator('.msl-node').first()).toBeVisible();
  await card.locator('[data-action="step"]').click();
  await card.locator('.msl-phase-btn').click();     // to transpose
  await expect(card.locator('.msl-node').first()).toBeVisible();
  await card.locator('.rand-btn').click();
});
```
Confirm `[data-action="step"]` matches what `buildStepControls` produces (same as sibling specs). Use the shared `loadMethod` from `tests/helpers.js` (do NOT inline a copy — that's the #118 convention).

- [ ] **Step 11: Verify + commit**
Run: `node --test tests/unit/*.test.js` (still all pass) and `npx playwright test tests/matrix_sparse_list.spec.js` (PASS). Also confirm the pre-existing `matrix-sparse` still works: `npx playwright test tests/matrix_sparse.spec.js` (PASS — proves the substring branch didn't break it).
NOTE: the overview-tile COUNT test in tests/i18n.spec.js will FAIL now (new method) — EXPECTED, fixed in Task 3. Do NOT edit it here.
```bash
git add cpp/matrix_sparse_list.cpp js/code_db.js build_db.js index.html js/app.js js/i18n.js slides_db.js js/slides_rendered.js slides/zh/matrix-sparse-list.md slides/en/matrix-sparse-list.md js/random_input.js tests/matrix_sparse_list.spec.js style.css
git commit -m "feat: orthogonal linked-list sparse matrix visualization (arrays group)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Full suite green + count reconciliation

**Files:** Modify `tests/i18n.spec.js`.

- [ ] **Step 1: Run** `npm run test:all`. Expect a failure only on the overview-tile count.

- [ ] **Step 2: Update count** — 1 method added to existing `arrays` group:
  - `tests/i18n.spec.js`: overview-tile `111` → **112** (and the nearby comment "… 111 tiles" → "… 112 tiles").
  - overview-category stays **14**; `tests/visualizer.spec.js` `.category-nav-btn` stays **15** — do NOT change. Verify 112 matches reality.

- [ ] **Step 3: Secret check** — `git status --porcelain js/cloud-config.js` empty (else `git checkout js/cloud-config.js`).

- [ ] **Step 4: Re-run + commit**
Run: `npm run test:all` → fully green.
```bash
git add tests/i18n.spec.js
git commit -m "test: update overview-tile count to 112 for matrix-sparse-list

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review (completed by plan author)

**Spec coverage:** §2 data structure + §3.1 module (parse/build/buildFrames/transposeGrid/transpose/DEFAULT) → Task 1 ✓. §3.2 render (orthogonal-list stage, build+transpose phase toggle, host width, step controls, Build/🎲) → Task 2 Step 5 ✓. §3.3 4 wiring edits with the matrix-sparse substring ordering guard → Task 2 Steps 4/6 ✓. §3.4 cpp/slides/i18n/index/random_input → Task 2 Steps 1/2/3/7/8/9 ✓. §5 counts (111→112) → Task 3 ✓. §6 unit + E2E (incl. the "matrix-sparse still works" regression) → Tasks 1 + 2 Step 10/11 ✓.

**Placeholder scan:** Module + unit test are complete verbatim code. Render is structured against named templates (`renderMatrixSparse`, `renderRecursion`) with explicit state var, selectors, frame contract, and clamps. cpp complete. The random_input step gives a concrete delegation with a documented fallback. No TODO/TBD.

**Type/name consistency:** `build(grid)` → `{rows,cols,nodes,rowChains,colChains}` and `buildFrames` → `{frames, built}` consistent across module, tests, render. `_mslState`, `.msl-input`/`.msl-build`/`.msl-phase-btn`/`.msl-stage`/`.msl-node`, `codeMatrixSparseList`, `renderMatrixSparseList`, method id `matrix-sparse-list` all consistent. `_mslState` is new (no collision). Count 111→112 (1 method, no group). The `matrix-sparse-list`-before-`matrix-sparse` ordering is called out in both renderAll and updateLayout edits; E2E re-runs matrix_sparse.spec.js to prove no shadowing.
