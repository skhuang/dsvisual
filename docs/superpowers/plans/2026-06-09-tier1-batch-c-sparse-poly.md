# Tier-1 Batch C: Sparse Matrix + Polynomial PADD — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the final two Tier-1 visualizations — `matrix-sparse` (sparse matrix triple representation + FAST_TRANSPOSE) and `poly-padd` (polynomial addition via two-pointer merge) — in a new `arrays` category group, each with Step/Run/Reset (inherits Pause/Resume + speed), bilingual UI + slides, and tests.

**Architecture:** Pure frame-generators in standalone dual-export modules (`matrix_sparse_viz.js`, `poly_padd_viz.js`, like `heap_models.js`), unit-tested under `node --test`. DOM renderers (`renderMatrixSparse`, `renderPolyPadd`) added in app.js using `acquireDynamicVizHost()` + `buildStepControls()`. Both are grid/cell based (no tree → no edge-alignment concerns). A new top-level `arrays` METHOD_GROUPS entry auto-creates a nav pill via `t('group.arrays')`.

**Tech Stack:** Vanilla JS (IIFE modules + browser globals), Node test runner, Playwright, Marp slides via `build_slides.js`, Prism via `build_db.js`.

**Spec:** `docs/superpowers/specs/2026-06-09-tier1-remaining-visualizations-design.md` (§3.5 matrix-sparse, §3.6 poly-padd, §2 new `arrays` group).

---

## File Structure
- `matrix_sparse_viz.js` (new) — pure: `toTriples`, `buildFastTransposeFrames`. `window.SparseViz` + `module.exports`.
- `poly_padd_viz.js` (new) — pure: `parsePoly`, `formatPoly`, `buildPaddFrames`. `window.PolyViz` + `module.exports`.
- `matrix_sparse.cpp`, `poly_padd.cpp` (new) — C++ reference.
- `tests/unit/matrix_sparse_viz.test.js`, `tests/unit/poly_padd_viz.test.js` (new).
- `tests/matrix_sparse.spec.js`, `tests/poly_padd.spec.js` (new) — Playwright E2E.
- `app.js` (modify) — new `arrays` group, register both methods, code lookup, updateLayout, renderAll, renderers.
- `build_db.js`, `index.html`, `i18n.js` (group.arrays + method names), `desc_db.js`, `slides_db.js`, `style.css` (modify).
- Regenerated: `code_db.js`, `slides_rendered.js` (+ slides md).

---

## Task 1: Feature branch + matrix-sparse pure module (TDD)

**Files:** Create `matrix_sparse_viz.js`, `tests/unit/matrix_sparse_viz.test.js`.

- [ ] **Step 1: Branch**
```bash
cd /Users/skhuang/course/dsvisual
git checkout main && git pull --ff-only
git checkout -b feat/tier1-batch-c
git branch --show-current
```
Expected: `feat/tier1-batch-c`.

- [ ] **Step 2: Write the failing unit test**

Create `tests/unit/matrix_sparse_viz.test.js`:
```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { toTriples, buildFastTransposeFrames } = require('../../matrix_sparse_viz');

const M = [
  [0, 0, 3, 0],
  [5, 0, 0, 0],
  [0, 2, 0, 4],
];

test('toTriples lists nonzeros in row-major order', () => {
  assert.deepEqual(toTriples(M), [
    { r: 0, c: 2, v: 3 },
    { r: 1, c: 0, v: 5 },
    { r: 2, c: 1, v: 2 },
    { r: 2, c: 3, v: 4 },
  ]);
});

test('FAST_TRANSPOSE produces the correct transposed dense matrix', () => {
  const { transposed, triples } = buildFastTransposeFrames(M);
  assert.deepEqual(transposed, [
    [0, 5, 0],
    [0, 0, 2],
    [3, 0, 0],
    [0, 0, 4],
  ]);
  assert.equal(triples.length, 4);
});

test('transpose invariant: T[j][i] === M[i][j] for all cells', () => {
  const { transposed } = buildFastTransposeFrames(M);
  for (let i = 0; i < M.length; i++)
    for (let j = 0; j < M[0].length; j++)
      assert.equal(transposed[j][i], M[i][j]);
});

test('frames include rowsize/startpos/place phases and bilingual msg', () => {
  const { frames } = buildFastTransposeFrames(M);
  const phases = new Set(frames.map((f) => f.phase));
  for (const p of ['rowsize', 'startpos', 'place']) assert.ok(phases.has(p), 'missing ' + p);
  for (const f of frames) assert.ok(f.msg.zh && f.msg.en);
});
```

- [ ] **Step 3: Run — expect FAIL**

Run: `cd /Users/skhuang/course/dsvisual && node --test tests/unit/matrix_sparse_viz.test.js`
Expected: FAIL — `Cannot find module '../../matrix_sparse_viz'`.

- [ ] **Step 4: Implement `matrix_sparse_viz.js`**

Create `matrix_sparse_viz.js`:
```js
(function (global) {
  function toTriples(matrix) {
    const out = [];
    for (let r = 0; r < matrix.length; r++)
      for (let c = 0; c < matrix[r].length; c++)
        if (matrix[r][c] !== 0) out.push({ r, c, v: matrix[r][c] });
    return out;
  }

  function buildFastTransposeFrames(matrix) {
    const rows = matrix.length;
    const cols = rows ? matrix[0].length : 0;
    const triples = toTriples(matrix);
    const frames = [];

    // 1) rowSize[c] = number of nonzeros in column c (→ row count in the transpose)
    const rowSize = new Array(cols).fill(0);
    for (const t of triples) rowSize[t.c]++;
    frames.push({ phase: 'rowsize', rowSize: rowSize.slice(), startPos: [], placed: [], scan: -1, msg: { zh: '計算每欄非零數 rowSize[]', en: 'Count nonzeros per column: rowSize[]' } });

    // 2) startPos[c] = starting index of column c's entries in the result
    const startPos = new Array(cols).fill(0);
    for (let c = 1; c < cols; c++) startPos[c] = startPos[c - 1] + rowSize[c - 1];
    frames.push({ phase: 'startpos', rowSize: rowSize.slice(), startPos: startPos.slice(), placed: [], scan: -1, msg: { zh: '前綴和求每欄起始位置 startPos[]', en: 'Prefix sums give each column start: startPos[]' } });

    // 3) place each triple into the transposed result
    const pos = startPos.slice();
    const placed = new Array(triples.length);
    for (let s = 0; s < triples.length; s++) {
      const t = triples[s];
      const dst = pos[t.c]++;
      placed[dst] = { r: t.c, c: t.r, v: t.v };
      frames.push({ phase: 'place', rowSize: rowSize.slice(), startPos: startPos.slice(), placed: placed.slice(), scan: s, msg: { zh: '放入 (' + t.r + ',' + t.c + ',' + t.v + ') → 轉置位置 ' + dst, en: 'Place (' + t.r + ',' + t.c + ',' + t.v + ') → transposed slot ' + dst } });
    }

    const transposed = [];
    for (let r = 0; r < cols; r++) transposed.push(new Array(rows).fill(0));
    for (const t of placed) if (t) transposed[t.r][t.c] = t.v;
    frames.push({ phase: 'done', rowSize: rowSize.slice(), startPos: startPos.slice(), placed: placed.slice(), scan: -1, msg: { zh: '完成轉置', en: 'Transpose complete' } });

    return { frames, triples, transposed };
  }

  const api = { toTriples, buildFastTransposeFrames };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.SparseViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 5: Run — expect PASS**

Run: `cd /Users/skhuang/course/dsvisual && node --test tests/unit/matrix_sparse_viz.test.js`
Expected: PASS — 4 tests (`# pass 4`, `# fail 0`).

- [ ] **Step 6: Commit**
```bash
cd /Users/skhuang/course/dsvisual
git add matrix_sparse_viz.js tests/unit/matrix_sparse_viz.test.js
git commit -m "feat(viz): sparse-matrix FAST_TRANSPOSE pure frame generator + unit tests"
```

---

## Task 2: poly-padd pure module (TDD)

**Files:** Create `poly_padd_viz.js`, `tests/unit/poly_padd_viz.test.js`.

- [ ] **Step 1: Write the failing unit test**

Create `tests/unit/poly_padd_viz.test.js`:
```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { parsePoly, formatPoly, buildPaddFrames } = require('../../poly_padd_viz');

test('parsePoly reads "coef:exp" terms sorted by descending exponent', () => {
  assert.deepEqual(parsePoly('2:1,3:2,1:0'), [
    { coef: 3, exp: 2 }, { coef: 2, exp: 1 }, { coef: 1, exp: 0 },
  ]);
});

test('PADD merges two polynomials by exponent', () => {
  const A = parsePoly('3:2,2:1,1:0'); // 3x^2 + 2x + 1
  const B = parsePoly('5:3,4:1');     // 5x^3 + 4x
  const { result } = buildPaddFrames(A, B);
  assert.deepEqual(result, [
    { coef: 5, exp: 3 }, { coef: 3, exp: 2 }, { coef: 6, exp: 1 }, { coef: 1, exp: 0 },
  ]);
});

test('PADD drops terms whose coefficients cancel to zero', () => {
  const { result } = buildPaddFrames(parsePoly('3:2'), parsePoly('-3:2'));
  assert.deepEqual(result, []);
});

test('formatPoly renders a readable polynomial string', () => {
  assert.equal(formatPoly([{ coef: 5, exp: 3 }, { coef: 6, exp: 1 }, { coef: 1, exp: 0 }]), '5x^3 + 6x + 1');
});

test('frames carry pointer indices and bilingual msg', () => {
  const { frames } = buildPaddFrames(parsePoly('3:2,2:1'), parsePoly('4:1'));
  for (const f of frames) { assert.ok(f.msg.zh && f.msg.en); assert.ok('i' in f && 'j' in f); }
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `cd /Users/skhuang/course/dsvisual && node --test tests/unit/poly_padd_viz.test.js`
Expected: FAIL — `Cannot find module '../../poly_padd_viz'`.

- [ ] **Step 3: Implement `poly_padd_viz.js`**

Create `poly_padd_viz.js`:
```js
(function (global) {
  function parsePoly(str) {
    const terms = String(str).split(',').map((s) => s.trim()).filter((s) => s.length).map((s) => {
      const parts = s.split(':');
      return { coef: parseInt(parts[0], 10), exp: parseInt(parts[1], 10) };
    }).filter((t) => Number.isFinite(t.coef) && Number.isFinite(t.exp));
    terms.sort((a, b) => b.exp - a.exp);
    return terms;
  }

  function formatPoly(poly) {
    if (!poly.length) return '0';
    return poly.map((t, idx) => {
      const sign = t.coef < 0 ? '- ' : (idx === 0 ? '' : '+ ');
      const mag = Math.abs(t.coef);
      let body;
      if (t.exp === 0) body = String(mag);
      else if (t.exp === 1) body = (mag === 1 ? 'x' : mag + 'x');
      else body = (mag === 1 ? 'x^' + t.exp : mag + 'x^' + t.exp);
      return sign + body;
    }).join(' ');
  }

  function buildPaddFrames(A, B) {
    const frames = [];
    const result = [];
    let i = 0, j = 0;
    const snap = (action, msg) => frames.push({ i, j, action, result: result.map((t) => ({ coef: t.coef, exp: t.exp })), msg });
    snap('start', { zh: '開始合併兩多項式(依指數遞減)', en: 'Begin merging by descending exponent' });
    while (i < A.length && j < B.length) {
      if (A[i].exp > B[j].exp) { result.push({ coef: A[i].coef, exp: A[i].exp }); snap('takeA', { zh: 'A 指數較大,取 A 項', en: 'A has higher exponent — take A term' }); i++; }
      else if (A[i].exp < B[j].exp) { result.push({ coef: B[j].coef, exp: B[j].exp }); snap('takeB', { zh: 'B 指數較大,取 B 項', en: 'B has higher exponent — take B term' }); j++; }
      else {
        const sum = A[i].coef + B[j].coef;
        if (sum !== 0) result.push({ coef: sum, exp: A[i].exp });
        snap('add', { zh: '指數相同,係數相加 = ' + sum + (sum === 0 ? '(為 0,捨去)' : ''), en: 'Same exponent — add coefficients = ' + sum + (sum === 0 ? ' (zero, dropped)' : '') });
        i++; j++;
      }
    }
    while (i < A.length) { result.push({ coef: A[i].coef, exp: A[i].exp }); snap('takeA', { zh: '附加 A 剩餘項', en: 'Append remaining A term' }); i++; }
    while (j < B.length) { result.push({ coef: B[j].coef, exp: B[j].exp }); snap('takeB', { zh: '附加 B 剩餘項', en: 'Append remaining B term' }); j++; }
    snap('done', { zh: '完成,結果 = ' + formatPoly(result), en: 'Done; result = ' + formatPoly(result) });
    return { frames, result };
  }

  const api = { parsePoly, formatPoly, buildPaddFrames };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.PolyViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 4: Run — expect PASS**

Run: `cd /Users/skhuang/course/dsvisual && node --test tests/unit/poly_padd_viz.test.js`
Expected: PASS — 5 tests (`# pass 5`, `# fail 0`).

- [ ] **Step 5: Commit**
```bash
cd /Users/skhuang/course/dsvisual
git add poly_padd_viz.js tests/unit/poly_padd_viz.test.js
git commit -m "feat(viz): polynomial-addition pure frame generator + unit tests"
```

---

## Task 3: C++ references + code_db regeneration

**Files:** Create `matrix_sparse.cpp`, `poly_padd.cpp`; modify `build_db.js`; regenerate `code_db.js`.

- [ ] **Step 1: Create `matrix_sparse.cpp`**
```cpp
#include <vector>

// Sparse matrix as (row, col, value) triples, then FAST_TRANSPOSE in O(cols + terms).
struct Triple { int r, c, v; };

std::vector<Triple> fastTranspose(const std::vector<Triple>& a, int rows, int cols) {
    std::vector<Triple> b(a.size());
    std::vector<int> rowSize(cols, 0), startPos(cols, 0);
    for (const auto& t : a) rowSize[t.c]++;
    for (int c = 1; c < cols; c++) startPos[c] = startPos[c - 1] + rowSize[c - 1];
    for (const auto& t : a) {
        int dst = startPos[t.c]++;
        b[dst] = { t.c, t.r, t.v };
    }
    (void)rows;
    return b;
}
```

- [ ] **Step 2: Create `poly_padd.cpp`**
```cpp
#include <vector>

// Polynomial addition by merging two exponent-descending term lists.
struct Term { int coef, exp; };

std::vector<Term> padd(const std::vector<Term>& A, const std::vector<Term>& B) {
    std::vector<Term> C;
    size_t i = 0, j = 0;
    while (i < A.size() && j < B.size()) {
        if (A[i].exp > B[j].exp) C.push_back(A[i++]);
        else if (A[i].exp < B[j].exp) C.push_back(B[j++]);
        else {
            int sum = A[i].coef + B[j].coef;
            if (sum != 0) C.push_back({ sum, A[i].exp });
            i++; j++;
        }
    }
    while (i < A.size()) C.push_back(A[i++]);
    while (j < B.size()) C.push_back(B[j++]);
    return C;
}
```

- [ ] **Step 3: Register in `build_db.js`**

In `build_db.js` `mappings`, add:
```js
    'matrix_sparse.cpp': 'codeMatrixSparse',
    'poly_padd.cpp': 'codePolyPadd',
```

- [ ] **Step 4: Regenerate + verify**
```bash
cd /Users/skhuang/course/dsvisual
node build_db.js
grep -c 'const codeMatrixSparse' code_db.js
grep -c 'const codePolyPadd' code_db.js
```
Expected: build no error; both counts `1`.

- [ ] **Step 5: Commit**
```bash
cd /Users/skhuang/course/dsvisual
git add matrix_sparse.cpp poly_padd.cpp build_db.js code_db.js
git commit -m "feat(viz): C++ refs for sparse matrix & polynomial add; regen code_db"
```

---

## Task 4: New `arrays` group + app.js registration + index.html + group i18n

**Files:** Modify `app.js`, `index.html`, `i18n.js`.

- [ ] **Step 1: Add the `arrays` METHOD_GROUPS entry**

In `app.js`, the `METHOD_GROUPS` array's `linear` group object ends with its `methods: [ ... ],` then `},`. Immediately AFTER the `linear` group's closing `},` (and before the `{ id: 'trees', ... }` object), insert a new group:
```js
    {
        id: 'arrays',
        title: 'Arrays',
        methods: [
            { id: 'matrix-sparse', title: 'Sparse Matrix (Transpose)', file: 'matrix_sparse.cpp', visualizer: 'sparse', controls: 'sparse' },
            { id: 'poly-padd', title: 'Polynomial Addition', file: 'poly_padd.cpp', visualizer: 'poly', controls: 'poly' },
        ],
    },
```

- [ ] **Step 2: code lookup in getCodeForMethod()**

In `app.js` `codeByMethod`, add:
```js
        'matrix-sparse': codeMatrixSparse,
        'poly-padd': codePolyPadd,
```

- [ ] **Step 3: updateLayout() branches**

After the existing `else if (currentMode === 'huffman') { ... }` block, add:
```js
        else if (currentMode === 'matrix-sparse') {
            codeTitle.textContent = 'matrix_sparse.cpp';
            codeDisplay.textContent = codeMatrixSparse;
        }
        else if (currentMode === 'poly-padd') {
            codeTitle.textContent = 'poly_padd.cpp';
            codeDisplay.textContent = codePolyPadd;
        }
```

- [ ] **Step 4: renderAll() dispatch**

After the existing `else if (currentMode === 'huffman') renderHuffman();` line, add:
```js
        else if (currentMode === 'matrix-sparse') renderMatrixSparse();
        else if (currentMode === 'poly-padd') renderPolyPadd();
```

- [ ] **Step 5: stubs**

Before `function renderSegmentTree()`, add:
```js
    function renderMatrixSparse() { const host = acquireDynamicVizHost(); host.textContent = 'matrix-sparse (pending)'; }
    function renderPolyPadd() { const host = acquireDynamicVizHost(); host.textContent = 'poly-padd (pending)'; }
```

- [ ] **Step 6: index.html — load modules**

After `<script src="sort_external_viz.js"></script>`, add:
```html
    <script src="matrix_sparse_viz.js"></script>
    <script src="poly_padd_viz.js"></script>
```

- [ ] **Step 7: i18n group label (REQUIRED for the nav pill)**

In `i18n.js`, in the `en` block near other `group.*` keys add:
```js
            'group.arrays':                 'Arrays',
```
In the `zh` block near other `group.*` keys add:
```js
            'group.arrays':                 '陣列',
```

- [ ] **Step 8: Verify**
```bash
cd /Users/skhuang/course/dsvisual
node -c app.js && echo "app.js OK"
node -c i18n.js && echo "i18n OK"
node -e "require('./matrix_sparse_viz.js'); require('./poly_padd_viz.js'); console.log('modules load OK')"
grep -c "id: 'arrays'" app.js
grep -c "id: 'matrix-sparse'" app.js
grep -c "id: 'poly-padd'" app.js
grep -c "function renderMatrixSparse" app.js
grep -c "function renderPolyPadd" app.js
grep -c 'matrix_sparse_viz.js' index.html
grep -c 'poly_padd_viz.js' index.html
grep -c "group.arrays" i18n.js
```
Expected: `app.js OK`, `i18n OK`, `modules load OK`, then `1 1 1 1 1 1 1 2`. If `node -c` fails, STOP/BLOCKED.

- [ ] **Step 9: Commit**
```bash
cd /Users/skhuang/course/dsvisual
git add app.js index.html i18n.js
git commit -m "feat(viz): new arrays group; register matrix-sparse & poly-padd; load modules"
```

---

## Task 5: `renderMatrixSparse()` + CSS

**Files:** Modify `app.js` (replace stub), `style.css`.

- [ ] **Step 1: Replace the `renderMatrixSparse` stub**

In `app.js`, replace the `renderMatrixSparse` stub line with:
```js
    let _sparseState = null;
    function renderMatrixSparse() {
        const host = acquireDynamicVizHost();
        if (!_sparseState) _sparseState = { text: '0,0,3,0;5,0,0,0;0,2,0,4' };
        const st = _sparseState;
        const langOf = (m) => (window.I18N && window.I18N.getCurrentLanguage() === 'zh') ? m.zh : m.en;
        const matrix = st.text.split(';').map((row) => row.split(',').map((s) => parseInt(s.trim(), 10) || 0));
        const rows = matrix.length, cols = matrix[0] ? matrix[0].length : 0;
        const res = SparseViz.buildFastTransposeFrames(matrix);
        const frames = res.frames;
        let idx = 0;

        host.innerHTML =
            '<div class="sm-controls"><input type="text" class="sm-input" value="' + st.text + '"><button type="button" class="sm-apply">Apply</button>' +
            '<span class="sm-hint">rows separated by ; , entries by ,</span></div>' +
            '<div class="sm-cols"><div class="sm-dense"></div><div class="sm-triples"></div></div>' +
            '<div class="sm-arrays"></div>' +
            '<div class="sm-phase"></div>';

        function gridHtml(mat, title) {
            let h = '<div class="sm-grid-title">' + title + '</div><table class="sm-grid">';
            for (let r = 0; r < mat.length; r++) { h += '<tr>'; for (let c = 0; c < mat[r].length; c++) { const v = mat[r][c]; h += '<td class="' + (v !== 0 ? 'nz' : 'z') + '">' + v + '</td>'; } h += '</tr>'; }
            return h + '</table>';
        }
        function transposedSoFar(placed) {
            const T = [];
            for (let r = 0; r < cols; r++) T.push(new Array(rows).fill(0));
            placed.forEach((t) => { if (t) T[t.r][t.c] = t.v; });
            return T;
        }

        function paint() {
            const fr = frames[idx];
            if (!host.querySelector('.sm-dense')) return;
            host.querySelector('.sm-dense').innerHTML = gridHtml(matrix, langOf({ zh: '原矩陣', en: 'Original' }));
            // triples table (source)
            let tr = '<div class="sm-grid-title">' + langOf({ zh: '三元組 (列,欄,值)', en: 'Triples (r,c,v)' }) + '</div><table class="sm-triple-tbl"><tr><th>r</th><th>c</th><th>v</th></tr>';
            res.triples.forEach((t, s) => { tr += '<tr class="' + (fr.phase === 'place' && fr.scan === s ? 'sm-cur' : '') + '"><td>' + t.r + '</td><td>' + t.c + '</td><td>' + t.v + '</td></tr>'; });
            tr += '</table>';
            host.querySelector('.sm-triples').innerHTML = tr;
            // rowSize / startPos arrays + transposed-so-far grid
            let a = '';
            if (fr.rowSize && fr.rowSize.length) a += '<div class="sm-arr"><span class="sm-arr-label">rowSize</span> ' + fr.rowSize.map((v) => '<span class="sm-acell">' + v + '</span>').join('') + '</div>';
            if (fr.startPos && fr.startPos.length) a += '<div class="sm-arr"><span class="sm-arr-label">startPos</span> ' + fr.startPos.map((v) => '<span class="sm-acell">' + v + '</span>').join('') + '</div>';
            a += gridHtml(transposedSoFar(fr.placed || []), langOf({ zh: '轉置結果', en: 'Transposed' }));
            host.querySelector('.sm-arrays').innerHTML = a;
            host.querySelector('.sm-phase').textContent = langOf(fr.msg);
        }
        function step() { if (idx < frames.length - 1) { idx++; paint(); return idx < frames.length - 1; } return false; }
        function reset() { idx = 0; paint(); }

        host.appendChild(buildStepControls(step, reset, 700));
        paint();
        host.querySelector('.sm-apply').onclick = () => {
            const v = host.querySelector('.sm-input').value.trim();
            if (v) { st.text = v; renderMatrixSparse(); }
        };
    }
```

- [ ] **Step 2: Append CSS**

Append to `style.css`:
```css
.sm-controls { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-bottom: 10px; }
.sm-controls .sm-input { flex: 1; min-width: 200px; }
.sm-hint { font-size: 12px; color: #94a3b8; }
.sm-cols { display: flex; gap: 24px; flex-wrap: wrap; align-items: flex-start; }
.sm-grid-title { font-weight: 700; color: #2c5282; margin: 6px 0 3px; }
.sm-grid { border-collapse: collapse; }
.sm-grid td { border: 1px solid #cbd5e1; width: 30px; height: 30px; text-align: center; }
.sm-grid td.nz { background: #bfdbfe; font-weight: 700; }
.sm-grid td.z { color: #cbd5e1; }
.sm-triple-tbl { border-collapse: collapse; }
.sm-triple-tbl th, .sm-triple-tbl td { border: 1px solid #cbd5e1; padding: 2px 10px; text-align: center; }
.sm-triple-tbl tr.sm-cur td { background: #fde68a; font-weight: 700; }
.sm-arrays { margin-top: 10px; }
.sm-arr { margin: 4px 0; }
.sm-arr-label { display: inline-block; min-width: 64px; font-weight: 600; color: #475569; }
.sm-acell { display: inline-block; min-width: 24px; padding: 2px 6px; margin: 1px; background: #e2e8f0; border: 1px solid #cbd5e1; border-radius: 4px; text-align: center; }
.sm-phase { margin-top: 6px; color: #1e40af; font-style: italic; }
```

- [ ] **Step 3: Verify**
```bash
cd /Users/skhuang/course/dsvisual
node -c app.js && echo "app.js OK"
grep -c "matrix-sparse (pending)" app.js
node --test tests/unit/matrix_sparse_viz.test.js 2>&1 | grep -E 'pass [0-9]|fail [0-9]'
```
Expected: `app.js OK`; stub count `0`; unit pass 4 / fail 0.

- [ ] **Step 4: Commit**
```bash
cd /Users/skhuang/course/dsvisual
git add app.js style.css
git commit -m "feat(viz): implement renderMatrixSparse (triples + FAST_TRANSPOSE) + styles"
```

---

## Task 6: `renderPolyPadd()` + CSS

**Files:** Modify `app.js` (replace stub), `style.css`.

- [ ] **Step 1: Replace the `renderPolyPadd` stub**

In `app.js`, replace the `renderPolyPadd` stub line with:
```js
    let _polyState = null;
    function renderPolyPadd() {
        const host = acquireDynamicVizHost();
        if (!_polyState) _polyState = { a: '3:2,2:1,1:0', b: '5:3,4:1' };
        const st = _polyState;
        const langOf = (m) => (window.I18N && window.I18N.getCurrentLanguage() === 'zh') ? m.zh : m.en;
        const A = PolyViz.parsePoly(st.a);
        const B = PolyViz.parsePoly(st.b);
        const res = PolyViz.buildPaddFrames(A, B);
        const frames = res.frames;
        let idx = 0;

        host.innerHTML =
            '<div class="pp-controls">' +
              'A <input type="text" class="pp-a" value="' + st.a + '"> ' +
              'B <input type="text" class="pp-b" value="' + st.b + '"> ' +
              '<button type="button" class="pp-apply">Apply</button>' +
              '<span class="sm-hint">terms as coef:exp, comma-separated</span>' +
            '</div>' +
            '<div class="pp-row"><span class="pp-label">A =</span> <span class="pp-a-terms"></span></div>' +
            '<div class="pp-row"><span class="pp-label">B =</span> <span class="pp-b-terms"></span></div>' +
            '<div class="pp-row"><span class="pp-label">A+B =</span> <span class="pp-result"></span></div>' +
            '<div class="pp-phase"></div>';

        function termCells(poly, ptr) {
            return poly.map((t, k) => '<span class="pp-term' + (k === ptr ? ' pp-cur' : '') + '">' + PolyViz.formatPoly([t]) + '</span>').join('');
        }

        function paint() {
            const fr = frames[idx];
            if (!host.querySelector('.pp-a-terms')) return;
            host.querySelector('.pp-a-terms').innerHTML = termCells(A, fr.i);
            host.querySelector('.pp-b-terms').innerHTML = termCells(B, fr.j);
            host.querySelector('.pp-result').innerHTML = (fr.result || []).map((t) => '<span class="pp-term out">' + PolyViz.formatPoly([t]) + '</span>').join('') || '<span class="pp-term out">0</span>';
            host.querySelector('.pp-phase').textContent = langOf(fr.msg);
        }
        function step() { if (idx < frames.length - 1) { idx++; paint(); return idx < frames.length - 1; } return false; }
        function reset() { idx = 0; paint(); }

        host.appendChild(buildStepControls(step, reset, 700));
        paint();
        host.querySelector('.pp-apply').onclick = () => {
            const a = host.querySelector('.pp-a').value.trim();
            const b = host.querySelector('.pp-b').value.trim();
            if (a && b) { st.a = a; st.b = b; renderPolyPadd(); }
        };
    }
```

- [ ] **Step 2: Append CSS**

Append to `style.css`:
```css
.pp-controls { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; margin-bottom: 12px; }
.pp-controls .pp-a, .pp-controls .pp-b { width: 130px; }
.pp-row { margin: 6px 0; min-height: 30px; }
.pp-label { display: inline-block; min-width: 56px; font-weight: 700; color: #2c5282; }
.pp-term { display: inline-block; padding: 3px 8px; margin: 2px; background: #e2e8f0; border: 1px solid #cbd5e1; border-radius: 5px; font-weight: 600; }
.pp-term.pp-cur { background: #fde68a; border-color: #f59e0b; }
.pp-term.out { background: #dcfce7; border-color: #86efac; }
.pp-phase { margin-top: 6px; color: #1e40af; font-style: italic; }
```

- [ ] **Step 3: Verify**
```bash
cd /Users/skhuang/course/dsvisual
node -c app.js && echo "app.js OK"
grep -c "poly-padd (pending)" app.js
node --test tests/unit/poly_padd_viz.test.js 2>&1 | grep -E 'pass [0-9]|fail [0-9]'
```
Expected: `app.js OK`; stub count `0`; unit pass 5 / fail 0.

- [ ] **Step 4: Commit**
```bash
cd /Users/skhuang/course/dsvisual
git add app.js style.css
git commit -m "feat(viz): implement renderPolyPadd (two-pointer merge) + styles"
```

---

## Task 7: i18n method names + desc_db

**Files:** Modify `i18n.js`, `desc_db.js`.

- [ ] **Step 1: i18n method names (both locales)**

In `i18n.js` `en` block:
```js
        'method.matrix-sparse': 'Sparse Matrix (Transpose)',
        'method.poly-padd': 'Polynomial Addition',
```
In the `zh` block:
```js
        'method.matrix-sparse': '稀疏矩陣(轉置)',
        'method.poly-padd': '多項式相加',
```

- [ ] **Step 2: desc_db entries**

In `desc_db.js`, before the closing `};` add:
```js
    'matrix-sparse': `
        <h3>Sparse Matrix &amp; Fast Transpose</h3>
        <p>Store only nonzero entries as (row, col, value) triples; transpose in O(cols + terms).</p>
        <hr>
        <ul>
            <li><strong>rowSize[c]:</strong> nonzeros per column → row counts of the transpose</li>
            <li><strong>startPos[c]:</strong> prefix sums give each column's start slot</li>
            <li><strong>Place:</strong> scatter each triple to its transposed position</li>
        </ul>
        <div class="complexities">
            <span class="badge time">Transpose: O(cols + terms)</span>
            <span class="badge space">Space: O(terms)</span>
        </div>
    `,
    'poly-padd': `
        <h3>Polynomial Addition</h3>
        <p>Add two polynomials by merging exponent-descending term lists.</p>
        <hr>
        <ul>
            <li><strong>Two pointers:</strong> compare leading exponents</li>
            <li><strong>Equal exponents:</strong> add coefficients; drop zero results</li>
        </ul>
        <div class="complexities">
            <span class="badge time">Time: O(m + n)</span>
            <span class="badge space">Space: O(m + n)</span>
        </div>
    `,
```

- [ ] **Step 3: Verify**
```bash
cd /Users/skhuang/course/dsvisual
node -c i18n.js && echo "i18n OK"
node -c desc_db.js && echo "desc OK"
grep -c 'method.matrix-sparse' i18n.js
grep -c 'method.poly-padd' i18n.js
```
Expected: both OK; both counts `2`.

- [ ] **Step 4: Commit**
```bash
cd /Users/skhuang/course/dsvisual
git add i18n.js desc_db.js
git commit -m "feat(viz): i18n names + desc_db for matrix-sparse & poly-padd"
```

---

## Task 8: slides decks + build

**Files:** Modify `slides_db.js`; regenerate.

- [ ] **Step 1: Append two decks**

In `slides_db.js`, before `module.exports = SLIDES_DB;`, add:
```js
SLIDES_DB["matrix-sparse"] = {
  "category": "Arrays",
  "title": { "zh": "稀疏矩陣與快速轉置", "en": "Sparse Matrix & Fast Transpose" },
  "slides": [
    { "heading": { "zh": "三元組表示法", "en": "Triple Representation" },
      "blocks": [
        { "type": "paragraph", "text": { "zh": "只儲存非零元素為 (列, 欄, 值) 三元組,節省大量空間。", "en": "Store only nonzero entries as (row, col, value) triples to save space." } },
        { "type": "note", "text": { "zh": "三元組以列為主序排列。", "en": "Triples are kept in row-major order." } }
      ] },
    { "heading": { "zh": "FAST_TRANSPOSE", "en": "FAST_TRANSPOSE" },
      "blocks": [
        { "type": "steps", "items": [
          { "zh": "rowSize[c]:每欄非零數(轉置後的每列數)。", "en": "rowSize[c]: nonzeros per column (row counts of the transpose)." },
          { "zh": "startPos[c]:前綴和求每欄在結果中的起始位置。", "en": "startPos[c]: prefix sums give each column's start in the result." },
          { "zh": "掃描原三元組,將每個放到轉置位置。", "en": "Scan the triples and scatter each to its transposed slot." }
        ] },
        { "type": "code", "lang": "cpp", "file": "matrix_sparse.cpp", "code": "for (const auto& t : a) {\n    int dst = startPos[t.c]++;\n    b[dst] = { t.c, t.r, t.v };\n}" }
      ] },
    { "heading": { "zh": "複雜度", "en": "Complexity" },
      "blocks": [
        { "type": "bullets", "items": [
          { "zh": "轉置 O(cols + terms),優於密集 O(rows×cols)", "en": "Transpose O(cols + terms), better than dense O(rows×cols)" },
          { "zh": "空間 O(terms)", "en": "Space O(terms)" }
        ] }
      ] }
  ]
};
SLIDES_DB["poly-padd"] = {
  "category": "Arrays",
  "title": { "zh": "多項式相加", "en": "Polynomial Addition" },
  "slides": [
    { "heading": { "zh": "表示法", "en": "Representation" },
      "blocks": [
        { "type": "paragraph", "text": { "zh": "多項式以「係數,指數」項列表示,依指數遞減排列。", "en": "A polynomial is a list of (coefficient, exponent) terms in descending exponent order." } }
      ] },
    { "heading": { "zh": "雙指標合併", "en": "Two-Pointer Merge" },
      "blocks": [
        { "type": "steps", "items": [
          { "zh": "比較兩列開頭項的指數。", "en": "Compare the leading exponents of both lists." },
          { "zh": "指數較大者直接取用。", "en": "Take the term with the larger exponent." },
          { "zh": "指數相同則係數相加;和為 0 則捨去該項。", "en": "Equal exponents: add coefficients; drop the term if the sum is zero." }
        ] },
        { "type": "code", "lang": "cpp", "file": "poly_padd.cpp", "code": "else {\n    int sum = A[i].coef + B[j].coef;\n    if (sum != 0) C.push_back({ sum, A[i].exp });\n    i++; j++;\n}" }
      ] },
    { "heading": { "zh": "複雜度", "en": "Complexity" },
      "blocks": [
        { "type": "bullets", "items": [
          { "zh": "時間 O(m + n)(各項僅處理一次)", "en": "Time O(m + n) — each term processed once" },
          { "zh": "空間 O(m + n)", "en": "Space O(m + n)" }
        ] }
      ] }
  ]
};
```

- [ ] **Step 2: Build + verify**
```bash
cd /Users/skhuang/course/dsvisual
node -c slides_db.js && echo "slides_db OK"
npm run build:slides
ls slides/zh/matrix-sparse.md slides/en/matrix-sparse.md slides/zh/poly-padd.md slides/en/poly-padd.md
```
Expected: `slides_db OK`; build prints `Generated N decks` (+2); all four md exist.

- [ ] **Step 3: Commit**
```bash
cd /Users/skhuang/course/dsvisual
git add slides_db.js slides_rendered.js slides/zh/matrix-sparse.md slides/en/matrix-sparse.md slides/zh/poly-padd.md slides/en/poly-padd.md
git commit -m "feat(viz): bilingual slides decks for matrix-sparse & poly-padd"
```

---

## Task 9: Playwright E2E

**Files:** Create `tests/matrix_sparse.spec.js`, `tests/poly_padd.spec.js`.

- [ ] **Step 1: Create `tests/matrix_sparse.spec.js`**
```js
const { test, expect } = require('@playwright/test');
const path = require('path');

async function loadMethod(page, methodId) {
    const navItem = page.locator(`.category-nav-item:has(.category-nav-method[data-method-id="${methodId}"])`);
    await navItem.locator('.category-nav-btn').click();
    await navItem.locator(`.category-nav-method[data-method-id="${methodId}"]`).click();
    await expect(page.locator(`[data-method-section="${methodId}"]`)).toHaveAttribute('data-runtime-state', 'active');
}

test.describe('Sparse Matrix', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
        await page.goto('file://' + path.resolve(__dirname, '../index.html'));
        await loadMethod(page, 'matrix-sparse');
    });

    test('renders grids/triples, steps through transpose; code filename', async ({ page }) => {
        const sec = page.locator('[data-method-section="matrix-sparse"]');
        await expect(sec.locator('.code-panel-filename')).toContainText('matrix_sparse.cpp');
        await expect(sec.locator('.sm-grid').first()).toBeVisible();
        const step = sec.locator('.stepctl [data-action="step"]');
        for (let i = 0; i < 12; i++) await step.click();
        await expect(sec.locator('.sm-triple-tbl')).toBeVisible();
        await expect(sec.locator('.sm-phase')).toContainText('complete');
    });
});
```

- [ ] **Step 2: Create `tests/poly_padd.spec.js`**
```js
const { test, expect } = require('@playwright/test');
const path = require('path');

async function loadMethod(page, methodId) {
    const navItem = page.locator(`.category-nav-item:has(.category-nav-method[data-method-id="${methodId}"])`);
    await navItem.locator('.category-nav-btn').click();
    await navItem.locator(`.category-nav-method[data-method-id="${methodId}"]`).click();
    await expect(page.locator(`[data-method-section="${methodId}"]`)).toHaveAttribute('data-runtime-state', 'active');
}

test.describe('Polynomial Addition', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
        await page.goto('file://' + path.resolve(__dirname, '../index.html'));
        await loadMethod(page, 'poly-padd');
    });

    test('merges two polynomials into the result; code filename', async ({ page }) => {
        const sec = page.locator('[data-method-section="poly-padd"]');
        await expect(sec.locator('.code-panel-filename')).toContainText('poly_padd.cpp');
        const step = sec.locator('.stepctl [data-action="step"]');
        for (let i = 0; i < 12; i++) await step.click();
        // default A=3x^2+2x+1, B=5x^3+4x → result 5x^3 + 3x^2 + 6x + 1
        await expect(sec.locator('.pp-result')).toContainText('6x');
        await expect(sec.locator('.pp-result')).toContainText('5x^3');
    });
});
```

- [ ] **Step 3: Run**
```bash
cd /Users/skhuang/course/dsvisual
npx playwright test tests/matrix_sparse.spec.js tests/poly_padd.spec.js --reporter=line
```
Expected: both PASS. If a step count is too low to reach the final frame, increase the loop count and re-run. Do NOT commit failing tests; if stuck, report BLOCKED with details.

- [ ] **Step 4: Commit**
```bash
cd /Users/skhuang/course/dsvisual
git add tests/matrix_sparse.spec.js tests/poly_padd.spec.js
git commit -m "test(viz): E2E for matrix-sparse & poly-padd"
```

---

## Task 10: Full suite + README + finish

**Files:** Modify `README.md`.

- [ ] **Step 1: README rows**

In `README.md`, add a new "Arrays" section/rows to the Supported Algorithms area:
```
### Arrays
| Sparse Matrix | Triple representation + FAST_TRANSPOSE |
| Polynomial Addition | Two-pointer merge of term lists |
```

- [ ] **Step 2: Full suite**

Run: `cd /Users/skhuang/course/dsvisual && npm run test:all`
Expected: unit (incl. 2 new files) + Playwright all PASS. If a hardcoded method/tile COUNT test fails (e.g. tests/i18n.spec.js), update it to the new count (+2) and include it in the Step 4 commit; report old→new. If anything else FAILS (e.g. an existing test that hovers a method card and is now overlapped by a new/changed nav dropdown), STOP and report BLOCKED with details.

- [ ] **Step 3: Clean-build check**
```bash
cd /Users/skhuang/course/dsvisual
node build_db.js && npm run build:slides
git status --porcelain
```
Expected: no diffs to `code_db.js` / `slides_rendered.js` / `slides/`.

- [ ] **Step 4: Commit and finish**
```bash
cd /Users/skhuang/course/dsvisual
git add README.md
git commit -m "docs(viz): list matrix-sparse & poly-padd (Arrays group) in README"
```
Then use **superpowers:finishing-a-development-branch** for `feat/tier1-batch-c`.

---

## Self-Review notes
- **Spec coverage (Batch C):** matrix-sparse (Tasks 1,5,8) per §3.5; poly-padd (Tasks 2,6,8) per §3.6; new `arrays` group (Task 4 Step 1 + i18n Step 7) per §2; shared pattern (Tasks 3,4,7,9); acceptance §5 (Task 10).
- **New group label:** `group.arrays` i18n added in Task 4 Step 7 (REQUIRED — the nav pill label comes from `t('group.arrays')`; without it the pill shows the raw key).
- **Known verify-at-implementation points (explicit):** Task 10 Step 2 anticipates the hardcoded count test (+2) and the possibility (as seen in Batch B) that an existing hover-based test is overlapped by a nav dropdown — flagged to STOP/report if a non-count test fails.
- **Type/name consistency:** module APIs (`toTriples`, `buildFastTransposeFrames`; `parsePoly`, `formatPoly`, `buildPaddFrames`) match across modules, tests, renderers. Globals `window.SparseViz` / `window.PolyViz` match index.html load + renderer usage. Method ids `matrix-sparse` / `poly-padd` and group id `arrays` consistent across all integration points.
- **Fixtures verified by hand:** sparse M (3×4) transposes to the asserted 4×3 dense matrix (4 nonzeros); PADD of 3x²+2x+1 and 5x³+4x = 5x³+3x²+6x+1; cancel case 3x²+(−3x²)=∅.
- **No tree → no alignment caveat:** both renderers are grid/cell based.
```
