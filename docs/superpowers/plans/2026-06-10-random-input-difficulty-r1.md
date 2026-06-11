# Random Input Difficulty — R1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a pure difficulty-aware random-input module + a per-category difficulty selector in Settings, and wire a 🎲 button into the 8 trees/arrays visualizations.

**Architecture:** A new pure module `js/random_input.js` exposes `randomInputFor(methodId, difficulty, rng)` returning the input object each viz consumes; it is unit-tested with property assertions (no fixed seed). `js/app.js` gains `getInputDifficulty()`/`setInputDifficulty()` reading `localStorage['dsvisual.inputDifficulty.<groupId>']`, a Settings `<select>` synced to the current method's group, and a shared `.rand-btn` injected before each viz's Apply/Build button whose handler calls `RandomInput.randomInputFor(currentMode, getInputDifficulty())`, mutates the viz state, and re-renders.

**Tech Stack:** Vanilla ES5/ES6 browser JS (dual-export IIFE like `js/heap_models.js`), `node --test` unit tests, Playwright E2E, no build step for these files.

**Spec:** `docs/superpowers/specs/2026-06-10-random-input-difficulty-design.md`

**Scope of R1:** module + all generators + unit tests; Settings difficulty UI + helpers + CSS + i18n; wire trees (6) + arrays (2) viz. R2 (separate plan) wires linear/searching/sorting + old sort/search integration + E2E for those.

---

## Reference: viz wiring map (verified against js/app.js)

| methodId | group | state var | shape | input selector(s) | apply/build sel | render fn |
|---|---|---|---|---|---|---|
| tree-traversal | trees | `_ttState` | `{values,order,mode}` | `.tt-input` | `.tt-build` (+ existing `.tt-rand`) | `renderTreeTraversal` |
| huffman | trees | `_hfState` | `{text}` | `.hf-input` | `.hf-apply` | `renderHuffman` |
| tree-obst | trees | `_obstState` | `{keys,freqs}` | `.obst-keys`,`.obst-freqs` | `.obst-apply` | `renderTreeObst` |
| tree-threaded | trees | `_threadedState` | `{vals}` | `.th-input` | `.th-build` | `renderTreeThreaded` |
| tree-mway | trees | `_mwayState` | `{keys,m}` | `.mw-keys`,`.mw-m` | `.mw-apply` | `renderTreeMway` |
| tree-expression | trees | `_exprTreeState` | `{text}` | `.et-input` | `.et-apply` | `renderTreeExpression` |
| matrix-sparse | arrays | `_sparseState` | `{text}` | `.sm-input` | `.sm-apply` | `renderMatrixSparse` |
| poly-padd | arrays | `_polyState` | `{a,b}` | `.pp-a`,`.pp-b` | `.pp-apply` | `renderPolyPadd` |

`getMethodGroupForMode(mode).id` returns the group id (`'trees'`, `'arrays'`, …). Settings drawer wiring lives near `bindDensitySlider()` (js/app.js ~line 1034). `renderAll()` is the central dispatch run on every viz switch.

---

## Task 1: Create `js/random_input.js` pure module

**Files:**
- Create: `js/random_input.js`
- Create: `tests/unit/random_input.test.js`

- [ ] **Step 1: Write the failing unit test**

Create `tests/unit/random_input.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert');
const RI = require('../../js/random_input.js');

const DIFFS = ['normal', 'special', 'edge', 'large'];
function isSortedAsc(a) { return a.every((v, i) => i === 0 || a[i - 1] <= v); }
function allEqual(a) { return a.every((v) => v === a[0]); }

test('unknown method returns null', () => {
  assert.strictEqual(RI.randomInputFor('nope', 'normal'), null);
});

test('value-seq methods: shape + per-difficulty properties', () => {
  for (const id of ['tree-traversal', 'tree-threaded', 'sort']) {
    for (const d of DIFFS) {
      for (let i = 0; i < 30; i++) {
        const out = RI.randomInputFor(id, d);
        const vals = id === 'sort' ? out.data : out.vals;
        assert.ok(Array.isArray(vals) && vals.length >= 1, `${id}/${d} non-empty`);
        assert.ok(vals.every(Number.isFinite), `${id}/${d} numbers`);
        if (d === 'normal') assert.ok(vals.length >= 6 && vals.length <= 9);
        if (d === 'edge') assert.ok(vals.length <= 4 && (vals.length === 1 || allEqual(vals)));
        if (d === 'large') assert.ok(vals.length >= 18);
        if (d === 'special') assert.ok(isSortedAsc(vals) || isSortedAsc(vals.slice().reverse()));
      }
    }
  }
});

test('list-doubly: vals + circular boolean', () => {
  for (const d of DIFFS) {
    const out = RI.randomInputFor('list-doubly', d);
    assert.ok(Array.isArray(out.vals) && out.vals.length >= 1);
    assert.strictEqual(typeof out.circular, 'boolean');
  }
});

test('search methods: sorted arr + target presence', () => {
  for (const id of ['search-fibonacci', 'search-interpolation', 'search-binary', 'search-linear']) {
    for (const d of DIFFS) {
      for (let i = 0; i < 30; i++) {
        const { arr, target } = RI.randomInputFor(id, d);
        assert.ok(Array.isArray(arr) && arr.length >= 1, `${id}/${d} arr`);
        assert.ok(isSortedAsc(arr), `${id}/${d} sorted`);
        assert.ok(Number.isFinite(target));
        if (d === 'edge') assert.ok(!arr.includes(target), `${id}/edge target absent`);
        else if (d !== 'edge') assert.ok(arr.includes(target), `${id}/${d} target present`);
        if (d === 'large') assert.ok(arr.length >= 30);
      }
    }
  }
  // interpolation special => arithmetic progression (constant diff)
  for (let i = 0; i < 10; i++) {
    const { arr } = RI.randomInputFor('search-interpolation', 'special');
    const diff = arr[1] - arr[0];
    assert.ok(arr.every((v, k) => k === 0 || v - arr[k - 1] === diff), 'interp special uniform');
  }
});

test('huffman text per difficulty', () => {
  for (let i = 0; i < 20; i++) {
    assert.strictEqual(RI.randomInputFor('huffman', 'edge').text.length, 1);
    assert.ok(RI.randomInputFor('huffman', 'large').text.length >= 30);
    const sp = RI.randomInputFor('huffman', 'special').text;
    assert.strictEqual(new Set(sp.split('')).size, 2, 'special => 2 distinct symbols');
    assert.ok(/^[A-Z]+$/.test(RI.randomInputFor('huffman', 'normal').text));
  }
});

test('expr infix + postfix validity', () => {
  for (let i = 0; i < 20; i++) {
    const inf = RI.randomInputFor('expr-infix-postfix', 'normal').text;
    assert.ok(/[+\-*/]/.test(inf), 'normal infix has operator');
    assert.ok(!/[+\-*/]/.test(RI.randomInputFor('expr-infix-postfix', 'edge').text), 'edge no operator');
    const sp = RI.randomInputFor('expr-infix-postfix', 'special').text;
    assert.strictEqual(new Set((sp.match(/[+\-*/]/g) || [])).size, 1, 'special single operator type');
    const lg = RI.randomInputFor('expr-infix-postfix', 'large').text;
    assert.ok((lg.match(/[+\-*/]/g) || []).length >= 6, 'large >=6 operators');
    const post = RI.randomInputFor('tree-expression', 'normal').text;
    assert.ok(/\d/.test(post) && /[+\-*/]/.test(post), 'postfix has number + operator');
  }
});

test('tree-obst keys sorted, lengths match, dominant special, edge single', () => {
  for (const d of DIFFS) {
    const { keys, freqs } = RI.randomInputFor('tree-obst', d);
    assert.ok(isSortedAsc(keys));
    assert.strictEqual(keys.length, freqs.length);
    if (d === 'edge') assert.strictEqual(keys.length, 1);
    if (d === 'large') assert.ok(keys.length >= 8);
    if (d === 'special') assert.ok(Math.max(...freqs) >= 3 * Math.min(...freqs));
  }
});

test('matrix-sparse text shape', () => {
  function parse(t) { return t.split(';').map((r) => r.split(',').map(Number)); }
  const edge = parse(RI.randomInputFor('matrix-sparse', 'edge').text);
  assert.ok(edge.every((r) => r.every((v) => v === 0)), 'edge all zero');
  const sp = parse(RI.randomInputFor('matrix-sparse', 'special').text);
  assert.ok(sp.every((row, r) => row.every((v, c) => v === 0 || r === c)), 'special diagonal only');
  const lg = parse(RI.randomInputFor('matrix-sparse', 'large').text);
  assert.ok(lg.length >= 8 && lg[0].length >= 8, 'large >=8x8');
});

test('poly-padd shape', () => {
  const edge = RI.randomInputFor('poly-padd', 'edge');
  assert.ok(!edge.a.includes(',') && !edge.b.includes(','), 'edge single term');
  const sp = RI.randomInputFor('poly-padd', 'special');
  const exps = (s) => s.split(',').map((t) => t.split(':')[1]).join(',');
  assert.strictEqual(exps(sp.a), exps(sp.b), 'special identical exponents');
  const lg = RI.randomInputFor('poly-padd', 'large');
  assert.ok(lg.a.split(',').length >= 6, 'large >=6 terms');
});

test('maze solvability per difficulty', () => {
  for (let i = 0; i < 15; i++) {
    assert.ok(RI.isMazeSolvable(RI.randomInputFor('maze-stack', 'normal').text), 'normal solvable');
    assert.ok(RI.isMazeSolvable(RI.randomInputFor('maze-stack', 'special').text), 'special solvable');
    assert.ok(RI.isMazeSolvable(RI.randomInputFor('maze-stack', 'large').text), 'large solvable');
    assert.ok(!RI.isMazeSolvable(RI.randomInputFor('maze-stack', 'edge').text), 'edge unsolvable');
  }
});

test('tree-mway keys + m', () => {
  for (const d of DIFFS) {
    const { keys, m } = RI.randomInputFor('tree-mway', d);
    assert.strictEqual(m, 3);
    assert.ok(keys.length >= 1);
    if (d === 'edge') assert.ok(keys.length <= 2);
    if (d === 'large') assert.ok(keys.length >= 14);
    if (d === 'special') assert.ok(isSortedAsc(keys));
  }
});

test('sort-external data + M', () => {
  const out = RI.randomInputFor('sort-external', 'normal');
  assert.ok(Array.isArray(out.data) && out.data.length >= 1);
  assert.strictEqual(out.M, 4);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/unit/random_input.test.js`
Expected: FAIL — `Cannot find module '../../js/random_input.js'`.

- [ ] **Step 3: Implement `js/random_input.js`**

Create `js/random_input.js`:

```js
(function (global) {
  'use strict';

  function randInt(rng, lo, hi) { return lo + Math.floor(rng() * (hi - lo + 1)); }
  function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }
  function uniqueInts(rng, n, lo, hi) {
    const set = new Set();
    let guard = 0;
    while (set.size < n && guard++ < n * 80) set.add(randInt(rng, lo, hi));
    return Array.from(set);
  }

  // ---- value sequences: never empty (safe for trees/lists/sorts) ----
  function valSeq(rng, difficulty) {
    switch (difficulty) {
      case 'special': {
        const base = uniqueInts(rng, randInt(rng, 6, 8), 10, 99).sort((a, b) => a - b);
        return rng() < 0.5 ? base : base.slice().reverse();
      }
      case 'edge': {
        if (rng() < 0.5) return [randInt(rng, 10, 99)];
        const v = randInt(rng, 10, 99);
        return [v, v, v, v];
      }
      case 'large':
        return uniqueInts(rng, randInt(rng, 18, 24), 10, 99);
      default:
        return uniqueInts(rng, randInt(rng, 6, 9), 10, 99);
    }
  }

  // ---- search: sorted arr + target ----
  function searchInput(rng, difficulty, uniform) {
    let n;
    if (difficulty === 'large') n = randInt(rng, 30, 40);
    else if (difficulty === 'edge') n = rng() < 0.5 ? 1 : randInt(rng, 6, 10);
    else n = randInt(rng, 8, 12);
    let arr;
    if (uniform && difficulty === 'special') {
      const start = randInt(rng, 1, 9), step = randInt(rng, 3, 9);
      arr = Array.from({ length: n }, (_, i) => start + i * step);
    } else {
      arr = uniqueInts(rng, n, 1, 200).sort((a, b) => a - b);
      while (arr.length < n) arr.push(arr[arr.length - 1] + 1);
    }
    let target;
    if (difficulty === 'edge') target = arr[arr.length - 1] + randInt(rng, 1, 9);
    else target = arr[randInt(rng, 0, arr.length - 1)];
    return { arr, target };
  }

  // ---- huffman ----
  function huffmanText(rng, difficulty) {
    const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const ch = () => A[Math.floor(rng() * 26)];
    if (difficulty === 'edge') return ch();
    if (difficulty === 'special') {
      const a = ch(); let b = ch(); while (b === a) b = ch();
      return (a + b).repeat(randInt(rng, 4, 6));
    }
    const len = difficulty === 'large' ? randInt(rng, 30, 40) : randInt(rng, 8, 14);
    let s = '';
    for (let i = 0; i < len; i++) s += ch();
    return s;
  }

  // ---- expression trees ----
  function buildExprTree(rng, n, operandFn, singleOp) {
    const ops = ['+', '-', '*', '/'];
    let nodes = [];
    for (let i = 0; i < n; i++) nodes.push({ v: operandFn(rng, i) });
    while (nodes.length > 1) {
      const i = Math.floor(rng() * (nodes.length - 1));
      const op = singleOp || pick(rng, ops);
      nodes.splice(i, 2, { op, l: nodes[i], r: nodes[i + 1] });
    }
    return nodes[0];
  }
  function toInfix(node) {
    if (node.v != null) return String(node.v);
    return '(' + toInfix(node.l) + node.op + toInfix(node.r) + ')';
  }
  function toPostfix(node) {
    if (node.v != null) return String(node.v);
    return toPostfix(node.l) + ' ' + toPostfix(node.r) + ' ' + node.op;
  }
  function exprConfig(difficulty) {
    if (difficulty === 'edge') return { n: 1, singleOp: null };
    if (difficulty === 'special') return { n: 4, singleOp: '+' };
    if (difficulty === 'large') return { n: randInt2(7, 8), singleOp: null };
    return { n: 4, singleOp: null };
  }
  // exprConfig needs an rng-free helper for 'large'; inline below instead.
  function randInt2(lo, hi) { return lo; } // placeholder, replaced in exprInfix/Postfix

  function exprInfix(rng, difficulty) {
    const letter = (r, i) => 'ABCDEFGHIJ'[i % 10];
    let n, singleOp = null;
    if (difficulty === 'edge') { n = 1; }
    else if (difficulty === 'special') { n = 4; singleOp = '+'; }
    else if (difficulty === 'large') { n = randInt(rng, 7, 8); }
    else { n = 4; }
    return toInfix(buildExprTree(rng, n, letter, singleOp));
  }
  function exprPostfix(rng, difficulty) {
    const num = (r) => randInt(r, 1, 9);
    let n, singleOp = null;
    if (difficulty === 'edge') { n = 1; }
    else if (difficulty === 'special') { n = 4; singleOp = '+'; }
    else if (difficulty === 'large') { n = randInt(rng, 7, 8); }
    else { n = 4; }
    return toPostfix(buildExprTree(rng, n, num, singleOp));
  }

  // ---- obst ----
  function obstInput(rng, difficulty) {
    let nk;
    if (difficulty === 'edge') nk = 1;
    else if (difficulty === 'large') nk = randInt(rng, 8, 10);
    else nk = randInt(rng, 4, 6);
    const keys = uniqueInts(rng, nk, 10, 99).sort((a, b) => a - b);
    let freqs;
    if (difficulty === 'special' && keys.length > 1) {
      freqs = keys.map(() => randInt(rng, 1, 2));
      freqs[Math.floor(rng() * freqs.length)] = randInt(rng, 20, 30);
    } else {
      freqs = keys.map(() => randInt(rng, 1, 9));
    }
    return { keys, freqs };
  }

  // ---- matrix-sparse ----
  function matrixText(rng, difficulty) {
    let rows, cols;
    if (difficulty === 'edge') { rows = randInt(rng, 2, 3); cols = randInt(rng, 2, 3); }
    else if (difficulty === 'large') { rows = 8; cols = 8; }
    else { rows = randInt(rng, 4, 5); cols = randInt(rng, 4, 5); }
    const grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0));
    if (difficulty === 'edge') {
      // all zeros — leave grid as-is
    } else if (difficulty === 'special') {
      for (let i = 0; i < Math.min(rows, cols); i++) grid[i][i] = randInt(rng, 1, 9);
    } else {
      const nz = Math.max(2, Math.floor(rows * cols * 0.2));
      for (let k = 0; k < nz; k++) grid[randInt(rng, 0, rows - 1)][randInt(rng, 0, cols - 1)] = randInt(rng, 1, 9);
    }
    return grid.map((r) => r.join(',')).join(';');
  }

  // ---- poly ----
  function polyInput(rng, difficulty) {
    const term = (e) => randInt(rng, 1, 9) + ':' + e;
    if (difficulty === 'edge') return { a: term(randInt(rng, 0, 3)), b: term(randInt(rng, 0, 3)) };
    if (difficulty === 'special') {
      const exps = [3, 2, 1];
      return { a: exps.map(term).join(','), b: exps.map(term).join(',') };
    }
    if (difficulty === 'large') {
      return { a: [6, 5, 4, 3, 2, 1].map(term).join(','), b: [5, 4, 3, 2, 1, 0].map(term).join(',') };
    }
    return { a: [2, 1, 0].map(term).join(','), b: [3, 1].map(term).join(',') };
  }

  // ---- maze ----
  function parseMaze(text) { return text.split(';').map((r) => r.split('')); }
  function findCell(g, ch) {
    for (let r = 0; r < g.length; r++) for (let c = 0; c < g[r].length; c++) if (g[r][c] === ch) return [r, c];
    return null;
  }
  function isMazeSolvable(text) {
    const g = parseMaze(text);
    const s = findCell(g, 'S'), e = findCell(g, 'E');
    if (!s || !e) return false;
    const R = g.length, C = g[0].length;
    const seen = Array.from({ length: R }, () => Array(C).fill(false));
    const q = [s]; seen[s[0]][s[1]] = true;
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    while (q.length) {
      const [r, c] = q.shift();
      if (r === e[0] && c === e[1]) return true;
      for (const [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < R && nc >= 0 && nc < C && !seen[nr][nc] && g[nr][nc] !== '#') {
          seen[nr][nc] = true; q.push([nr, nc]);
        }
      }
    }
    return false;
  }
  function makeMaze(rng, R, C, wallP) {
    const g = Array.from({ length: R }, () => Array.from({ length: C }, () => (rng() < wallP ? '#' : '.')));
    g[0][0] = 'S'; g[R - 1][C - 1] = 'E';
    return g.map((r) => r.join('')).join(';');
  }
  function mazeText(rng, difficulty) {
    if (difficulty === 'edge') {
      // unsolvable: wall off the exit on a 5x5
      const R = 5, C = 5;
      const g = Array.from({ length: R }, () => Array.from({ length: C }, () => '.'));
      g[0][0] = 'S'; g[R - 1][C - 1] = 'E';
      g[R - 2][C - 1] = '#'; g[R - 1][C - 2] = '#'; // seal E's two neighbours
      return g.map((r) => r.join('')).join(';');
    }
    const R = difficulty === 'large' ? randInt(rng, 8, 9) : 5;
    const C = R;
    const wallP = difficulty === 'special' ? 0.32 : 0.25;
    for (let t = 0; t < 60; t++) {
      const m = makeMaze(rng, R, C, wallP);
      if (isMazeSolvable(m)) return m;
    }
    // fallback: open maze (guaranteed solvable)
    return makeMaze(rng, R, C, 0);
  }

  // ---- mway ----
  function mwayInput(rng, difficulty) {
    let nk;
    if (difficulty === 'edge') nk = randInt(rng, 1, 2);
    else if (difficulty === 'large') nk = randInt(rng, 14, 18);
    else nk = randInt(rng, 6, 8);
    let keys = uniqueInts(rng, nk, 10, 99);
    if (difficulty === 'special') keys = keys.sort((a, b) => a - b);
    return { keys, m: 3 };
  }

  function randomInputFor(methodId, difficulty, rng) {
    rng = rng || Math.random;
    if (['normal', 'special', 'edge', 'large'].indexOf(difficulty) === -1) difficulty = 'normal';
    switch (methodId) {
      case 'tree-traversal':
      case 'tree-threaded': return { vals: valSeq(rng, difficulty) };
      case 'list-doubly': return { vals: valSeq(rng, difficulty), circular: rng() < 0.5 };
      case 'sort': return { data: valSeq(rng, difficulty) };
      case 'sort-external': return { data: valSeq(rng, difficulty), M: 4 };
      case 'huffman': return { text: huffmanText(rng, difficulty) };
      case 'expr-infix-postfix': return { text: exprInfix(rng, difficulty) };
      case 'tree-expression': return { text: exprPostfix(rng, difficulty) };
      case 'tree-obst': return obstInput(rng, difficulty);
      case 'matrix-sparse': return { text: matrixText(rng, difficulty) };
      case 'poly-padd': return polyInput(rng, difficulty);
      case 'maze-stack': return { text: mazeText(rng, difficulty) };
      case 'tree-mway': return mwayInput(rng, difficulty);
      case 'search-fibonacci': return searchInput(rng, difficulty, false);
      case 'search-interpolation': return searchInput(rng, difficulty, true);
      case 'search-binary':
      case 'search-linear': return searchInput(rng, difficulty, false);
      default: return null;
    }
  }

  const api = { randomInputFor: randomInputFor, isMazeSolvable: isMazeSolvable };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.RandomInput = api;
})(typeof window !== 'undefined' ? window : globalThis);
```

NOTE: when implementing, delete the dead `exprConfig`/`randInt2` placeholder helpers shown earlier in the draft — `exprInfix`/`exprPostfix` inline their own `n`/`singleOp` and do not call them. The final file must NOT contain `exprConfig` or `randInt2`.

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test tests/unit/random_input.test.js`
Expected: PASS (all tests). If `huffman special` occasionally fails because `(a+b).repeat(k)` — it always yields exactly 2 distinct symbols, so it passes. If maze `edge` ever reports solvable, verify both E-neighbours are walled.

- [ ] **Step 5: Commit**

```bash
git add js/random_input.js tests/unit/random_input.test.js
git commit -m "feat: pure difficulty-aware random input generator module

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Settings difficulty selector + app.js helpers + CSS + i18n

**Files:**
- Modify: `index.html` (Settings drawer body + load `js/random_input.js`)
- Modify: `js/app.js` (helpers + bind + `renderAll` sync)
- Modify: `js/i18n.js` (`settings.difficulty` + `difficulty.*`)
- Modify: `style.css` (`.rand-btn`)
- Test: `tests/random_input.spec.js` (persistence E2E)

- [ ] **Step 1: Load the module in `index.html`**

In `index.html`, find the line `<script src="js/heap_models.js"></script>` (or any existing `js/*_viz.js` include block before `<script src="js/app.js">`). Add immediately before `<script src="js/app.js"></script>`:

```html
    <script src="js/random_input.js"></script>
```

- [ ] **Step 2: Add the difficulty row to the Settings drawer**

In `index.html`, locate the existing density row inside `.settings-drawer-body`:

```html
                <section class="settings-row">
                    <label for="code-density-slider" data-i18n-key="settings.density">Code panel line-height</label>
```

Insert a new `<section>` immediately before that density `<section class="settings-row">`:

```html
                <section class="settings-row">
                    <label for="input-difficulty" data-i18n-key="settings.difficulty">Random input difficulty</label>
                    <div class="settings-row-controls">
                        <select id="input-difficulty">
                            <option value="normal" data-i18n-key="difficulty.normal">Normal</option>
                            <option value="special" data-i18n-key="difficulty.special">Special</option>
                            <option value="edge" data-i18n-key="difficulty.edge">Edge case</option>
                            <option value="large" data-i18n-key="difficulty.large">Large</option>
                        </select>
                    </div>
                    <small id="input-difficulty-cat" style="color:#94a3b8;font-size:0.75rem;"></small>
                </section>
```

- [ ] **Step 3: Add i18n keys**

In `js/i18n.js`, inside `TRANSLATIONS.en` add (next to the existing `settings.density` key):

```js
        'settings.difficulty': 'Random input difficulty',
        'difficulty.normal': 'Normal',
        'difficulty.special': 'Special',
        'difficulty.edge': 'Edge case',
        'difficulty.large': 'Large',
```

In `TRANSLATIONS.zh` add:

```js
        'settings.difficulty': '隨機輸入難度',
        'difficulty.normal': '一般',
        'difficulty.special': '特殊',
        'difficulty.edge': 'Edge case',
        'difficulty.large': '大型',
```

- [ ] **Step 4: Add helpers + bind in `js/app.js`**

In `js/app.js`, immediately after the `DENSITY_STORAGE_KEY` line (`const DENSITY_STORAGE_KEY = 'dsvisual.codeDensity';`, ~line 1003), add:

```js
    const DIFFICULTY_KEY_PREFIX = 'dsvisual.inputDifficulty.';
    const DIFFICULTY_VALUES = ['normal', 'special', 'edge', 'large'];

    function getInputDifficulty() {
        const gid = getMethodGroupForMode(currentMode).id;
        let v = null;
        try { v = localStorage.getItem(DIFFICULTY_KEY_PREFIX + gid); } catch (e) { v = null; }
        return DIFFICULTY_VALUES.indexOf(v) === -1 ? 'normal' : v;
    }

    function setInputDifficulty(groupId, value) {
        if (DIFFICULTY_VALUES.indexOf(value) === -1) return;
        try { localStorage.setItem(DIFFICULTY_KEY_PREFIX + groupId, value); } catch (e) { /* ignore */ }
    }

    function syncDifficultySelect() {
        const sel = document.getElementById('input-difficulty');
        if (!sel) return;
        sel.value = getInputDifficulty();
        const cap = document.getElementById('input-difficulty-cat');
        if (cap) {
            const g = getMethodGroupForMode(currentMode);
            cap.textContent = (typeof t === 'function' ? t('group.' + g.id) : g.id) || g.id;
        }
    }

    function bindDifficultySelect() {
        const sel = document.getElementById('input-difficulty');
        if (!sel) return;
        sel.addEventListener('change', () => {
            setInputDifficulty(getMethodGroupForMode(currentMode).id, sel.value);
        });
        syncDifficultySelect();
    }
```

NOTE: `currentMode` is declared at js/app.js ~line 1318 (after this block) but is in the same closure, so these functions reference it fine at call time. `t` and `getMethodGroupForMode` are in scope.

- [ ] **Step 5: Call `bindDifficultySelect()` at init**

In `js/app.js`, find where `bindDensitySlider()` is invoked during init (search for `bindDensitySlider(`). Add right after it:

```js
        bindDifficultySelect();
```

- [ ] **Step 6: Sync the select on every viz switch**

In `js/app.js`, find the `function renderAll()` declaration. Add as the FIRST statement inside its body:

```js
        syncDifficultySelect();
```

- [ ] **Step 7: Add `.rand-btn` CSS**

In `style.css`, append:

```css
.rand-btn {
    cursor: pointer;
    border: 1px solid #475569;
    background: #1e293b;
    color: #e2e8f0;
    border-radius: 6px;
    padding: 2px 8px;
    font-size: 0.95rem;
    line-height: 1.4;
}
.rand-btn:hover { background: #334155; }
```

- [ ] **Step 8: Write the persistence E2E test**

Create `tests/random_input.spec.js`:

```js
const { test, expect } = require('@playwright/test');

async function openSettings(page) {
  await page.click('#settings-toggle');
  await expect(page.locator('#settings-drawer')).toBeVisible();
}

test('difficulty is remembered per category and persists across reload', async ({ page }) => {
  await page.goto('/');
  // Land on a trees method
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await openSettings(page);
  const sel = page.locator('#input-difficulty');
  await expect(sel).toHaveValue('normal');
  await sel.selectOption('large');
  // close settings
  await page.click('#settings-drawer [data-settings-close]');

  // Reload -> still large for the initial (stack-array's "linear" group)
  await page.reload();
  await openSettings(page);
  await expect(page.locator('#input-difficulty')).toHaveValue('large');

  // The stored key is namespaced by group
  const stored = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('dsvisual.inputDifficulty.')));
  expect(stored.length).toBeGreaterThanOrEqual(1);
});
```

- [ ] **Step 9: Run the E2E test**

Run: `npx playwright test tests/random_input.spec.js`
Expected: PASS. (If `#settings-toggle` selector differs, confirm via `index.html`.)

- [ ] **Step 10: Commit**

```bash
git add index.html js/app.js js/i18n.js style.css tests/random_input.spec.js
git commit -m "feat: per-category difficulty selector in settings drawer

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Wire 🎲 random button into the 6 trees-group visualizations

**Files:**
- Modify: `js/app.js` (renderTreeTraversal, renderHuffman, renderTreeObst, renderTreeThreaded, renderTreeMway, renderTreeExpression)

For EACH viz below: (a) add the 🎲 button to `host.innerHTML` immediately before its Build/Apply button; (b) add an onclick handler that calls `RandomInput.randomInputFor`, mutates state, and re-renders. The button uses the shared class `.rand-btn`; there is exactly one per host, so `host.querySelector('.rand-btn')` is unambiguous.

- [ ] **Step 1: tree-traversal — replace existing `.tt-rand` with `.rand-btn`**

In `renderTreeTraversal()`, change the button markup:

Find: `'<button type="button" class="tt-rand">Random</button>' +`
Replace with: `'<button type="button" class="rand-btn" title="Random">🎲</button>' +`

Then replace the existing `.tt-rand` handler block:

Find:
```js
        host.querySelector('.tt-rand').onclick = () => {
            const n = 6 + Math.floor(Math.random() * 3);
            const set = new Set();
            while (set.size < n) set.add(10 + Math.floor(Math.random() * 90));
            st.values = Array.from(set);
            renderTreeTraversal();
        };
```
Replace with:
```js
        host.querySelector('.rand-btn').onclick = () => {
            const inp = window.RandomInput && RandomInput.randomInputFor('tree-traversal', getInputDifficulty());
            if (!inp) return;
            st.values = inp.vals;
            renderTreeTraversal();
        };
```

- [ ] **Step 2: huffman**

In `renderHuffman()`, find the Apply button markup (`class="hf-apply"`) and insert before it:
```js
              '<button type="button" class="rand-btn" title="Random">🎲</button>' +
```
After the `.hf-apply` onclick handler, add:
```js
        host.querySelector('.rand-btn').onclick = () => {
            const inp = window.RandomInput && RandomInput.randomInputFor('huffman', getInputDifficulty());
            if (!inp) return;
            _hfState.text = inp.text;
            renderHuffman();
        };
```

- [ ] **Step 3: tree-obst**

In `renderTreeObst()`, insert before the `class="obst-apply"` button markup:
```js
              '<button type="button" class="rand-btn" title="Random">🎲</button>' +
```
After the `.obst-apply` handler, add:
```js
        host.querySelector('.rand-btn').onclick = () => {
            const inp = window.RandomInput && RandomInput.randomInputFor('tree-obst', getInputDifficulty());
            if (!inp) return;
            _obstState.keys = inp.keys;
            _obstState.freqs = inp.freqs;
            renderTreeObst();
        };
```

- [ ] **Step 4: tree-threaded**

In `renderTreeThreaded()`, insert before the `class="th-build"` button markup:
```js
              '<button type="button" class="rand-btn" title="Random">🎲</button>' +
```
After the `.th-build` handler, add:
```js
        host.querySelector('.rand-btn').onclick = () => {
            const inp = window.RandomInput && RandomInput.randomInputFor('tree-threaded', getInputDifficulty());
            if (!inp) return;
            _threadedState.vals = inp.vals;
            renderTreeThreaded();
        };
```

- [ ] **Step 5: tree-mway**

In `renderTreeMway()`, insert before the `class="mw-apply"` button markup:
```js
              '<button type="button" class="rand-btn" title="Random">🎲</button>' +
```
After the `.mw-apply` handler, add:
```js
        host.querySelector('.rand-btn').onclick = () => {
            const inp = window.RandomInput && RandomInput.randomInputFor('tree-mway', getInputDifficulty());
            if (!inp) return;
            _mwayState.keys = inp.keys;
            _mwayState.m = inp.m;
            renderTreeMway();
        };
```

- [ ] **Step 6: tree-expression**

In `renderTreeExpression()`, insert before the `class="et-apply"` button markup:
```js
              '<button type="button" class="rand-btn" title="Random">🎲</button>' +
```
After the `.et-apply` handler, add:
```js
        host.querySelector('.rand-btn').onclick = () => {
            const inp = window.RandomInput && RandomInput.randomInputFor('tree-expression', getInputDifficulty());
            if (!inp) return;
            _exprTreeState.text = inp.text;
            renderTreeExpression();
        };
```

- [ ] **Step 7: Manual sanity via a quick Playwright probe**

Add to `tests/random_input.spec.js`:

```js
const { loadMethod } = require('./helpers');

test('random button on tree-traversal changes the input field', async ({ page }) => {
  await page.goto('/');
  await loadMethod(page, 'tree-traversal');
  const input = page.locator('.tt-input');
  const before = await input.inputValue();
  await page.click('.rand-btn');
  // value should change (overwhelmingly likely for random unique sets)
  await expect(input).not.toHaveValue(before);
});
```

VERIFY first that `tests/helpers.js` exports `loadMethod` (it is used by other specs). If the export name/path differs, match the existing specs' import exactly.

- [ ] **Step 8: Run the E2E test**

Run: `npx playwright test tests/random_input.spec.js`
Expected: PASS (both tests).

- [ ] **Step 9: Commit**

```bash
git add js/app.js tests/random_input.spec.js
git commit -m "feat: wire random button into trees-group visualizations

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Wire 🎲 random button into the 2 arrays-group visualizations

**Files:**
- Modify: `js/app.js` (renderMatrixSparse, renderPolyPadd)

- [ ] **Step 1: matrix-sparse**

In `renderMatrixSparse()`, insert before the `class="sm-apply"` button markup:
```js
              '<button type="button" class="rand-btn" title="Random">🎲</button>' +
```
After the `.sm-apply` handler, add:
```js
        host.querySelector('.rand-btn').onclick = () => {
            const inp = window.RandomInput && RandomInput.randomInputFor('matrix-sparse', getInputDifficulty());
            if (!inp) return;
            _sparseState.text = inp.text;
            renderMatrixSparse();
        };
```

- [ ] **Step 2: poly-padd**

In `renderPolyPadd()`, insert before the `class="pp-apply"` button markup:
```js
              '<button type="button" class="rand-btn" title="Random">🎲</button>' +
```
After the `.pp-apply` handler, add:
```js
        host.querySelector('.rand-btn').onclick = () => {
            const inp = window.RandomInput && RandomInput.randomInputFor('poly-padd', getInputDifficulty());
            if (!inp) return;
            _polyState.a = inp.a;
            _polyState.b = inp.b;
            renderPolyPadd();
        };
```

- [ ] **Step 3: Add E2E coverage for an arrays viz**

Add to `tests/random_input.spec.js`:

```js
test('random button on matrix-sparse changes the input field', async ({ page }) => {
  await page.goto('/');
  await loadMethod(page, 'matrix-sparse');
  const input = page.locator('.sm-input');
  const before = await input.inputValue();
  await page.click('.rand-btn');
  await expect(input).not.toHaveValue(before);
});
```

- [ ] **Step 4: Run the E2E test**

Run: `npx playwright test tests/random_input.spec.js`
Expected: PASS (all three viz tests + persistence test).

- [ ] **Step 5: Commit**

```bash
git add js/app.js tests/random_input.spec.js
git commit -m "feat: wire random button into arrays-group visualizations

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Full suite green + count-test reconciliation

**Files:**
- Modify (only if counts changed): `tests/i18n.spec.js`, `tests/visualizer.spec.js`

- [ ] **Step 1: Run the full unit + E2E suite**

Run: `npm run test:all`
Expected: all unit tests pass (including `random_input.test.js`) and all Playwright specs pass.

- [ ] **Step 2: Reconcile any count assertions**

This feature adds NO new methods or nav groups, so overview-tile / nav-button counts in `tests/i18n.spec.js` and `tests/visualizer.spec.js` should be UNCHANGED. If either fails on a count, investigate — a changed count means something unintended was added; do not blindly bump the number. Only adjust if the change is a legitimate, intended consequence and explain why in the commit.

- [ ] **Step 3: Confirm no secrets touched**

Run: `git status --porcelain js/cloud-config.js`
Expected: empty (cloud-config.js must NOT be modified). If it shows as modified, run `git checkout js/cloud-config.js`.

- [ ] **Step 4: Commit any test reconciliation**

```bash
git add tests/i18n.spec.js tests/visualizer.spec.js
git commit -m "test: reconcile counts for random-input feature

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```
(Skip this commit if no count files changed.)

---

## Self-Review (completed by plan author)

**Spec coverage:**
- §3.1 pure module → Task 1 ✓ (`js/random_input.js` + `isMazeSolvable` export).
- §3.2 per-category difficulty + Settings select + helpers + i18n → Task 2 ✓.
- §3.3 per-viz 🎲 before Apply, generate+apply → Tasks 3–4 (trees+arrays); R2 covers the rest ✓.
- §3.4 old sort/search integration → DEFERRED to R2 (explicitly out of R1 scope) ✓.
- §4 input shapes → matched exactly to verified state vars (`_ttState.values`, `_hfState.text`, `_obstState.{keys,freqs}`, `_threadedState.vals`, `_mwayState.{keys,m}`, `_exprTreeState.text`, `_sparseState.text`, `_polyState.{a,b}`) ✓.
- §5 difficulty semantics → encoded in generators + asserted in unit tests ✓.
- §8 testing (property-based unit + E2E persistence + 🎲) → Tasks 1, 2, 3, 4 ✓.

**Placeholder scan:** The module draft intentionally flags dead `exprConfig`/`randInt2` for deletion (Task 1 Step 3 NOTE). No other placeholders.

**Type consistency:** `randomInputFor(methodId, difficulty, rng)` signature and return shapes are consistent across module, unit tests, and every render handler. `getInputDifficulty()` / `setInputDifficulty(groupId, value)` / `syncDifficultySelect()` / `bindDifficultySelect()` names consistent across Task 2 steps. `.rand-btn` shared class used uniformly in Tasks 3–4.
