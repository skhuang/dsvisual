# Sparse Matrix Visualization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the ragged-row out-of-bounds bug, validate input, align the C++/JS FAST_TRANSPOSE interface, and persist user-entered valid matrices as selectable examples.

**Architecture:** Add two pure functions to the browser-global/CommonJS module `js/matrix_sparse_viz.js` (`fastTranspose`, `parseMatrix`), unit-test them, then wire them into `renderMatrixSparse()` in `js/app.js` for validation, error display, and a localStorage-backed examples selector. CSS additions in `style.css`.

**Tech Stack:** Vanilla JS (IIFE module + `module.exports`), `node:test` unit tests, Playwright e2e, plain CSS.

## Global Constraints

- Module must work in both browser (`window.SparseViz`) and Node (`module.exports`) — see `js/matrix_sparse_viz.js:42-43`.
- Bilingual messages are `{ zh, en }` objects; `js/app.js` picks via `window.I18N.getCurrentLanguage()`.
- All `localStorage` access wrapped in try/catch (project convention, e.g. `js/app.js:1048`, `js/app.js:3691`).
- `cpp/matrix_sparse.cpp` is the canonical reference — **do not modify it**.
- Existing tests must keep passing: `tests/unit/matrix_sparse_viz.test.js`, `tests/matrix_sparse.spec.js`.
- Saved-example storage key: `dsvisual:sparse:examples`; cap 8; dedup by exact text; default is never saved.
- Built-in default matrix text: `0,0,3,0;5,0,0,0;0,2,0,4`.

---

### Task 1: `fastTranspose` — align JS to the C++ interface

**Files:**
- Modify: `js/matrix_sparse_viz.js` (add function, extend `api`, reuse inside `buildFastTransposeFrames`)
- Test: `tests/unit/matrix_sparse_viz.test.js`

**Interfaces:**
- Produces: `fastTranspose(triples, rows, cols)` → `Array<{r,c,v}>` — transposed triples, mirrors `cpp/matrix_sparse.cpp` (`triples` is `toTriples()` output; `rows`/`cols` are the ORIGINAL matrix dims).

- [ ] **Step 1: Write the failing test**

Add to `tests/unit/matrix_sparse_viz.test.js`:

```js
const { fastTranspose } = require('../../js/matrix_sparse_viz');

test('fastTranspose mirrors C++ FAST_TRANSPOSE triple output', () => {
  const triples = toTriples(M); // M is 3x4
  assert.deepEqual(fastTranspose(triples, 3, 4), [
    { r: 0, c: 1, v: 5 },
    { r: 1, c: 2, v: 2 },
    { r: 2, c: 0, v: 3 },
    { r: 3, c: 2, v: 4 },
  ]);
});

test('buildFastTransposeFrames final transpose matches fastTranspose', () => {
  const { transposed, triples } = buildFastTransposeFrames(M);
  const tri = fastTranspose(triples, 3, 4);
  const dense = [[0,0,0],[0,0,0],[0,0,0],[0,0,0]];
  for (const t of tri) dense[t.r][t.c] = t.v;
  assert.deepEqual(transposed, dense);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/unit/matrix_sparse_viz.test.js`
Expected: FAIL — `fastTranspose is not a function`.

- [ ] **Step 3: Add the implementation**

In `js/matrix_sparse_viz.js`, add after `toTriples` (before `buildFastTransposeFrames`):

```js
  // FAST_TRANSPOSE on a triple list, O(cols + terms). Mirrors cpp/matrix_sparse.cpp.
  function fastTranspose(triples, rows, cols) {
    const b = new Array(triples.length);
    const rowSize = new Array(cols).fill(0);
    const startPos = new Array(cols).fill(0);
    for (const t of triples) rowSize[t.c]++;
    for (let c = 1; c < cols; c++) startPos[c] = startPos[c - 1] + rowSize[c - 1];
    for (const t of triples) {
      const dst = startPos[t.c]++;
      b[dst] = { r: t.c, c: t.r, v: t.v };
    }
    void rows;
    return b;
  }
```

Then reuse it for the final dense build inside `buildFastTransposeFrames`. Replace lines 33-35:

```js
    const transposed = [];
    for (let r = 0; r < cols; r++) transposed.push(new Array(rows).fill(0));
    for (const t of placed) if (t) transposed[t.r][t.c] = t.v;
```

with:

```js
    const finalTriples = fastTranspose(triples, rows, cols);
    const transposed = [];
    for (let r = 0; r < cols; r++) transposed.push(new Array(rows).fill(0));
    for (const t of finalTriples) if (t) transposed[t.r][t.c] = t.v;
```

Extend the exported api line:

```js
  const api = { toTriples, fastTranspose, buildFastTransposeFrames };
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/unit/matrix_sparse_viz.test.js`
Expected: PASS (all tests, including the pre-existing ones).

- [ ] **Step 5: Commit**

```bash
git add js/matrix_sparse_viz.js tests/unit/matrix_sparse_viz.test.js
git commit -m "Add fastTranspose to align sparse-matrix JS with C++ interface"
```

---

### Task 2: `parseMatrix` — validation + ragged-row fix

**Files:**
- Modify: `js/matrix_sparse_viz.js`
- Test: `tests/unit/matrix_sparse_viz.test.js`

**Interfaces:**
- Produces: `parseMatrix(text)` → `{ ok, matrix, rows, cols, error }` where `matrix` is `number[][]` or `null`, and `error` is `null` or `{ zh, en }`.

- [ ] **Step 1: Write the failing test**

Add to `tests/unit/matrix_sparse_viz.test.js`:

```js
const { parseMatrix } = require('../../js/matrix_sparse_viz');

test('parseMatrix accepts a valid uniform matrix', () => {
  const p = parseMatrix('0,0,3,0;5,0,0,0;0,2,0,4');
  assert.equal(p.ok, true);
  assert.equal(p.rows, 3);
  assert.equal(p.cols, 4);
  assert.deepEqual(p.matrix[1], [5, 0, 0, 0]);
  assert.equal(p.error, null);
});

test('parseMatrix rejects ragged rows with a bilingual error', () => {
  const p = parseMatrix('1,2,3;4,5');
  assert.equal(p.ok, false);
  assert.equal(p.matrix, null);
  assert.ok(p.error.zh && p.error.en);
});

test('parseMatrix rejects non-integer entries', () => {
  const p = parseMatrix('1,x,3;4,5,6');
  assert.equal(p.ok, false);
  assert.ok(p.error.zh && p.error.en);
});

test('parseMatrix rejects empty input', () => {
  const p = parseMatrix('   ');
  assert.equal(p.ok, false);
  assert.ok(p.error.zh && p.error.en);
});

test('parseMatrix accepts negative integers', () => {
  const p = parseMatrix('-1,0;0,-2');
  assert.equal(p.ok, true);
  assert.deepEqual(p.matrix, [[-1, 0], [0, -2]]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/unit/matrix_sparse_viz.test.js`
Expected: FAIL — `parseMatrix is not a function`.

- [ ] **Step 3: Add the implementation**

In `js/matrix_sparse_viz.js`, add after `fastTranspose`:

```js
  // Parse ";"-separated rows of ","-separated integers into a validated dense matrix.
  function parseMatrix(text) {
    const err = (zh, en) => ({ ok: false, matrix: null, rows: 0, cols: 0, error: { zh: zh, en: en } });
    const raw = String(text == null ? '' : text).trim();
    if (!raw) return err('請輸入矩陣', 'Enter a matrix');
    const rowStrs = raw.split(';').map((s) => s.trim()).filter((s) => s.length);
    if (!rowStrs.length) return err('請輸入矩陣', 'Enter a matrix');
    const matrix = [];
    let cols = -1;
    for (let r = 0; r < rowStrs.length; r++) {
      const cells = rowStrs[r].split(',').map((s) => s.trim());
      if (cols === -1) cols = cells.length;
      else if (cells.length !== cols)
        return err('各列長度須一致(第 ' + (r + 1) + ' 列)', 'All rows must have the same length (row ' + (r + 1) + ')');
      const nums = [];
      for (const cell of cells) {
        if (!/^-?\d+$/.test(cell))
          return err('含非整數值:「' + cell + '」', 'Non-integer value: "' + cell + '"');
        nums.push(parseInt(cell, 10));
      }
      matrix.push(nums);
    }
    return { ok: true, matrix: matrix, rows: matrix.length, cols: cols, error: null };
  }
```

Extend the exported api line:

```js
  const api = { toTriples, fastTranspose, parseMatrix, buildFastTransposeFrames };
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/unit/matrix_sparse_viz.test.js`
Expected: PASS (all tests).

- [ ] **Step 5: Commit**

```bash
git add js/matrix_sparse_viz.js tests/unit/matrix_sparse_viz.test.js
git commit -m "Add parseMatrix validation for sparse-matrix input"
```

---

### Task 3: Renderer — validate on Apply, show error, fix OOB

**Files:**
- Modify: `js/app.js` (`renderMatrixSparse`, lines 5457-5517)
- Modify: `style.css` (add `.sm-error`)
- Test: manual + `tests/matrix_sparse.spec.js` (e2e regression)

**Interfaces:**
- Consumes: `SparseViz.parseMatrix` (Task 2), `SparseViz.buildFastTransposeFrames`.

- [ ] **Step 1: Replace the matrix parse + control markup**

In `js/app.js`, replace line 5462:

```js
        const matrix = st.text.split(';').map((row) => row.split(',').map((s) => parseInt(s.trim(), 10) || 0));
        const rows = matrix.length, cols = matrix[0] ? matrix[0].length : 0;
```

with (st.text is always a validated string by the time it is rendered):

```js
        const parsed = SparseViz.parseMatrix(st.text);
        const matrix = parsed.matrix;
        const rows = parsed.rows, cols = parsed.cols;
```

- [ ] **Step 2: Add the error line to the controls markup**

In `js/app.js`, in the `host.innerHTML` assignment (lines 5468-5473), change the `.sm-controls` block to append an error line right after it. Replace line 5470:

```js
            '<span class="sm-hint">rows separated by ; , entries by ,</span></div>' +
```

with:

```js
            '<span class="sm-hint">rows separated by ; , entries by ,</span></div>' +
            '<div class="sm-error" style="display:none"></div>' +
```

- [ ] **Step 3: Gate the Apply handler on validation**

In `js/app.js`, replace the Apply handler (lines 5507-5510):

```js
        host.querySelector('.sm-apply').onclick = () => {
            const v = host.querySelector('.sm-input').value.trim();
            if (v) { st.text = v; renderMatrixSparse(); }
        };
```

with:

```js
        host.querySelector('.sm-apply').onclick = () => {
            const v = host.querySelector('.sm-input').value.trim();
            const p = SparseViz.parseMatrix(v);
            const errEl = host.querySelector('.sm-error');
            if (!p.ok) { errEl.textContent = langOf(p.error); errEl.style.display = ''; return; }
            errEl.textContent = ''; errEl.style.display = 'none';
            st.text = v; renderMatrixSparse();
        };
```

- [ ] **Step 4: Add CSS for the error line**

In `style.css`, add after the `.sm-acell` rule (line 2575):

```css
.sm-error { color: #dc2626; font-size: 0.85rem; margin: 4px 0; }
```

- [ ] **Step 5: Verify existing e2e still passes and the fix works**

Run: `npx playwright test tests/matrix_sparse.spec.js`
Expected: PASS.

Manual check (open `index.html`, select "Sparse Matrix (Transpose)"):
- Enter `1,2,3;4,5` → Apply → red bilingual error shown, previous render unchanged.
- Enter `1,2;3,4;5,6` → Apply → renders correctly (no crash / no out-of-bounds).

- [ ] **Step 6: Commit**

```bash
git add js/app.js style.css
git commit -m "Validate sparse-matrix input and fix ragged-row out-of-bounds"
```

---

### Task 4: Saved examples (localStorage) + selector

**Files:**
- Modify: `js/app.js` (`renderMatrixSparse` + helpers just above it)
- Modify: `style.css` (add `.sm-examples`)
- Test: manual

**Interfaces:**
- Consumes: `st.text`, `SPARSE_DEFAULT_TEXT`.
- Produces: `loadSparseExamples()` → `Array<{text}>`; `saveSparseExample(text)` (void).

- [ ] **Step 1: Add storage helpers above `renderMatrixSparse`**

In `js/app.js`, replace line 5456:

```js
    let _sparseState = null;
```

with:

```js
    let _sparseState = null;
    const SPARSE_EXAMPLES_KEY = 'dsvisual:sparse:examples';
    const SPARSE_DEFAULT_TEXT = '0,0,3,0;5,0,0,0;0,2,0,4';
    function loadSparseExamples() {
        try {
            const raw = localStorage.getItem(SPARSE_EXAMPLES_KEY);
            const arr = raw ? JSON.parse(raw) : [];
            return Array.isArray(arr) ? arr.filter((e) => e && typeof e.text === 'string') : [];
        } catch (e) { return []; }
    }
    function saveSparseExample(text) {
        try {
            if (text === SPARSE_DEFAULT_TEXT) return;
            let arr = loadSparseExamples().filter((e) => e.text !== text);
            arr.unshift({ text: text });
            arr = arr.slice(0, 8);
            localStorage.setItem(SPARSE_EXAMPLES_KEY, JSON.stringify(arr));
        } catch (e) { /* ignore */ }
    }
```

Then update the default assignment at (now-shifted) `if (!_sparseState)` to reuse the constant:

```js
        if (!_sparseState) _sparseState = { text: SPARSE_DEFAULT_TEXT };
```

- [ ] **Step 2: Add the examples `<select>` to the controls markup**

In `js/app.js`, in the `.sm-controls` markup, insert the select before the `<button class="rand-btn">`. Replace:

```js
            '<div class="sm-controls"><input type="text" class="sm-input" value="' + st.text + '"><button type="button" class="rand-btn" title="Random">🎲</button><button type="button" class="sm-apply">Apply</button>' +
```

with:

```js
            '<div class="sm-controls"><input type="text" class="sm-input" value="' + st.text + '">' +
            (function () {
                const trunc = (s) => s.length > 24 ? s.slice(0, 24) + '…' : s;
                const esc = (s) => s.replace(/"/g, '&quot;');
                let h = '<select class="sm-examples"><option value="">' + langOf({ zh: '範例…', en: 'Examples…' }) + '</option>';
                h += '<option value="' + SPARSE_DEFAULT_TEXT + '">' + langOf({ zh: '預設', en: 'Default' }) + '</option>';
                loadSparseExamples().forEach((e) => { h += '<option value="' + esc(e.text) + '">' + trunc(e.text) + '</option>'; });
                return h + '</select>';
            })() +
            '<button type="button" class="rand-btn" title="Random">🎲</button><button type="button" class="sm-apply">Apply</button>' +
```

- [ ] **Step 3: Save on valid Apply**

In the Apply handler from Task 3, add `saveSparseExample(v);` right before `renderMatrixSparse();`:

```js
            errEl.textContent = ''; errEl.style.display = 'none';
            st.text = v; saveSparseExample(v); renderMatrixSparse();
```

- [ ] **Step 4: Wire the select change handler**

In `js/app.js`, add after the rand-btn handler (after line ~5516):

```js
        host.querySelector('.sm-examples').onchange = (ev) => {
            const v = ev.target.value;
            if (!v) return;
            host.querySelector('.sm-input').value = v;
            const errEl = host.querySelector('.sm-error');
            errEl.textContent = ''; errEl.style.display = 'none';
            st.text = v; renderMatrixSparse();
        };
```

(Selecting an example does not re-save: the default is excluded by `saveSparseExample`, and saved entries are already stored.)

- [ ] **Step 5: Add CSS for the select**

In `style.css`, add after the `.sm-error` rule:

```css
.sm-examples { margin: 0 4px; padding: 2px 4px; border: 1px solid #cbd5e1; border-radius: 4px; }
```

- [ ] **Step 6: Manual verification**

Open `index.html` → Sparse Matrix:
- Enter `1,0;0,2` → Apply → appears in the Examples dropdown on next render.
- Reload page → the example persists in the dropdown; selecting it loads and renders it.
- 🎲 random input → does NOT get added to the dropdown.

- [ ] **Step 7: Commit**

```bash
git add js/app.js style.css
git commit -m "Persist user-entered sparse matrices as selectable examples"
```

---

## Self-Review

- **Spec coverage:** §1 interface alignment → Task 1; §2 validation + ragged fix → Task 2 + Task 3; §3 renderer behavior → Task 3; §4 saved examples → Task 4; §5 tests → Tasks 1-2 (unit) + Task 3 (e2e/manual). All covered.
- **Placeholder scan:** No TBD/TODO; every code step shows full code.
- **Type consistency:** `fastTranspose(triples, rows, cols)`, `parseMatrix(text)→{ok,matrix,rows,cols,error}`, `loadSparseExamples()→[{text}]`, `saveSparseExample(text)` used consistently across tasks. `SPARSE_DEFAULT_TEXT` defined in Task 4 Step 1 before use.
- **Note:** Task 4 Step 1 references `SPARSE_DEFAULT_TEXT` in the markup added in Task 3-era code; ensure Task 4 (which defines it) is applied — tasks are ordered so the constant exists before the select markup uses it.
