# Magic Square — O(1) getValue formula viz (design / spec)

A new dsvisual visualization `magic-formula` showing that any cell of the
Siamese/Coxeter odd magic square is computable by a **closed-form O(1) formula**
— no n×n array needed. The DS lesson: a computed formula replaces a stored table
(perfect-hash / computed property vs an array). Realizes the advanced-principles
doc's "空間複雜度優化" tip and ties back to `magic-latin` (the two Latin planes).

## Decisions (brainstorming, approved)
- Standalone viz, category **Arrays** (beside `magic-square`/`magic-latin`/`magic-torus`); id **`magic-formula`**. n ∈ {3,5,7}.
- **Verified closed form** (matches the deployed up-left Siamese square for n=3,5,7):
  `value(i,j) = n·a + b + 1`, `a = (i − j + (n−1)/2) mod n`, `b = (i − 2j + (n−1)) mod n`.
  `a` and `b` are exactly the two Latin planes of `magic-latin`.
- **Interaction**: select a cell `(i,j)` → step-animate `i,j → a → b → value`, lighting only that cell (rest blank = "not stored"); a **"Fill all by formula"** button (each cell computed independently, O(1)); a callout contrasting sequential Siamese build (O(n²), needs the array/visited) vs this formula (any cell instantly, O(1) space).
- Follows the `cache-lru`/`buildFrames` pattern (7 wiring points) + a `slides_db.js` deck + rebuild.

## Global constraints
- No backend; the frame builders are pure/DOM-free; frames carry bilingual `msg:{en,zh}`; render via `langOf(fr.msg)`.
- Module shape: IIFE on `global`, `module.exports`, `global.MagicFormulaViz`.
- C++ panel (`codeMagicFormula`) self-contained (no undefined symbols), matches the JS formula, ≤~50 lines.
- Slides wired via `slides_db.js` + `npm run build:slides`.

## Interfaces produced
`MagicFormulaViz.{ valueAt, aAt, bAt, buildFrames, fillAllFrames }`
- `valueAt(n,i,j) → value` (the O(1) formula; pure).
- `buildFrames(n,i,j) → { frames, value, a, b }` — query-one-cell story.
- `fillAllFrames(n) → { frames }` — reveal all cells via the formula.

## Frame builders (use verbatim) — `js/magic_formula_viz.js`
```js
(function (global) {
  const mod = (x, m) => ((x % m) + m) % m;
  const coeffs = (n) => ({ cA: (n - 1) / 2, cB: n - 1 });
  const aAt = (n, i, j) => { const { cA } = coeffs(n); return mod(i - j + cA, n); };
  const bAt = (n, i, j) => { const { cB } = coeffs(n); return mod(i - 2 * j + cB, n); };
  const valueAt = (n, i, j) => n * aAt(n, i, j) + bAt(n, i, j) + 1;

  function buildFrames(n, i, j) {                 // query one cell (i,j)
    const { cA, cB } = coeffs(n);
    const a = aAt(n, i, j), b = bAt(n, i, j), value = valueAt(n, i, j);
    const frames = [
      { mode: 'query', phase: 'pick', n, i, j, a: null, b: null, value: null,
        msg: { en: `Query cell (row ${i}, col ${j}) — no array stored`, zh: `查詢格 (第 ${i} 列, 第 ${j} 欄) — 未儲存任何陣列` } },
      { mode: 'query', phase: 'a', n, i, j, a, b: null, value: null, expr: `a = (${i} − ${j} + ${cA}) mod ${n} = ${a}`,
        msg: { en: `high digit a = (i − j + ${cA}) mod ${n} = ${a}`, zh: `高位 a = (i − j + ${cA}) mod ${n} = ${a}` } },
      { mode: 'query', phase: 'b', n, i, j, a, b, value: null, expr: `b = (${i} − 2·${j} + ${cB}) mod ${n} = ${b}`,
        msg: { en: `low digit b = (i − 2j + ${cB}) mod ${n} = ${b}`, zh: `低位 b = (i − 2j + ${cB}) mod ${n} = ${b}` } },
      { mode: 'query', phase: 'value', n, i, j, a, b, value, expr: `value = ${n}·${a} + ${b} + 1 = ${value}`,
        msg: { en: `value = n·a + b + 1 = ${value}  (O(1), no array)`, zh: `值 = n·a + b + 1 = ${value}(O(1),不需陣列)` } },
    ];
    return { frames, value, a, b };
  }

  function fillAllFrames(n) {
    const cells = [];
    const frames = [{ mode: 'fill', phase: 'start', n, cells: [],
      msg: { en: 'Fill every cell by the O(1) formula — independently', zh: '用 O(1) 公式逐格獨立算出' } }];
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      cells.push({ i, j, value: valueAt(n, i, j) });
      frames.push({ mode: 'fill', phase: 'cell', n, i, j, value: valueAt(n, i, j), cells: cells.slice(),
        msg: { en: `(${i},${j}) → ${valueAt(n, i, j)}`, zh: `(${i},${j}) → ${valueAt(n, i, j)}` } });
    }
    frames.push({ mode: 'fill', phase: 'done', n, cells: cells.slice(),
      msg: { en: `Filled ${n * n} cells, each O(1) — O(n²) time, O(1) extra space`,
             zh: `共 ${n * n} 格,每格 O(1) — 時間 O(n²)、額外空間 O(1)` } });
    return { frames };
  }

  const api = { valueAt, aAt, bAt, buildFrames, fillAllFrames };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.MagicFormulaViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
```

## Unit tests (`tests/unit/magic_formula_viz.test.js`)
```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { valueAt, aAt, bAt, buildFrames, fillAllFrames } = require('../../js/magic_formula_viz');

// Reference: the up-left Siamese generator the other magic viz use.
function siamese(n) {
  const sq = Array.from({ length: n }, () => Array(n).fill(0));
  let r = 0, c = (n / 2) | 0;
  for (let v = 1; v <= n * n; v++) {
    sq[r][c] = v; const u = (r - 1 + n) % n, l = (c - 1 + n) % n;
    if (sq[u][l] !== 0) r = (r + 1) % n; else { r = u; c = l; }
  }
  return sq;
}

test('valueAt matches the generated Siamese square for n=3,5,7', () => {
  for (const n of [3, 5, 7]) {
    const sq = siamese(n);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++)
      assert.equal(valueAt(n, i, j), sq[i][j], `n=${n} (${i},${j})`);
  }
});

test('a,b in [0,n); value in 1..n²', () => {
  const n = 5;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    assert.ok(aAt(n, i, j) >= 0 && aAt(n, i, j) < n);
    assert.ok(bAt(n, i, j) >= 0 && bAt(n, i, j) < n);
    const v = valueAt(n, i, j); assert.ok(v >= 1 && v <= n * n);
  }
});

test('query frames: pick→a→b→value; final value matches valueAt', () => {
  const { frames, value } = buildFrames(5, 2, 3);
  assert.deepEqual(frames.map((f) => f.phase), ['pick', 'a', 'b', 'value']);
  assert.equal(value, valueAt(5, 2, 3));
  assert.equal(frames[frames.length - 1].value, value);
});

test('fillAll: n² cell frames, values are a permutation of 1..n²', () => {
  const { frames } = fillAllFrames(5);
  assert.equal(frames.filter((f) => f.phase === 'cell').length, 25);
  const vals = frames[frames.length - 1].cells.map((c) => c.value).sort((a, b) => a - b);
  assert.deepEqual(vals, Array.from({ length: 25 }, (_, k) => k + 1));
});

test('n=3 formula correct', () => {
  const sq = siamese(3);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) assert.equal(valueAt(3, i, j), sq[i][j]);
});
```

## Wiring (7 points, model on `cache-lru` / `renderMagicLatin`)
1. `js/magic_formula_viz.js` (above).
2. `index.html`: `<script src="js/magic_formula_viz.js" defer></script>`.
3. `js/app.js`: Arrays-category entry near `magic-torus` — `{ id: 'magic-formula', title: 'Magic Square — O(1) getValue Formula', file: 'magic_formula.cpp', visualizer: 'magicFormula', controls: 'magicFormula' }`; code-map `'magic-formula': codeMagicFormula`; code-title `'magic_formula.cpp'`; dispatch `else if (currentMode === 'magic-formula') renderMagicFormula();`; and `renderMagicFormula()` (below).
4. `js/code_db.js`: `const codeMagicFormula` — self-contained C++ `getValue(n,i,j)` returning `n*a + b + 1` with `a=(i-j+(n-1)/2)%n`, `b=(i-2*j+(n-1))%n` (guard negative mod), + a `main` filling by formula with no 2-D array. ≤~50 lines.
5. `js/desc_db.js`: `'magic-formula'` — closed-form O(1) getValue; the two Latin planes are linear mod n; O(1) space per query.
6. `js/i18n.js`: `'method.magic-formula'` en `'Magic Square — O(1) getValue Formula'`, zh `'魔方陣 — O(1) getValue 公式'`.
7. `slides_db.js`: `'magic-formula'` deck (Arrays, bilingual) — the closed form, why a,b are linear mod n, formula-vs-stored-table (space O(1)), tie to `magic-latin`. Then `npm run build:slides`.

### `renderMagicFormula()` (model on renderMagicLatin / renderLruCache)
- An n×n grid where cells are **blank by default** ("not stored"); n selector (3/5/7) + Apply.
- **Query mode**: clicking a cell (or a row/col picker) runs `buildFrames(n,i,j)` and step-animates: show the picked `(i,j)`, then the `a` expr, then the `b` expr, then `value`, filling only that one cell; show each `fr.expr` + `langOf(fr.msg)`. Reuse `buildStepControls(step, reset, ms)`.
- **"Fill all by formula" button**: runs `fillAllFrames(n)`, revealing every cell (each labeled O(1)); ends on the space/complexity callout.
- A persistent callout: "sequential Siamese: O(n²) time + O(n²) array; this formula: O(1) per cell, O(1) space". Use `data-testid="mf-grid"`.

## Testing
- `node --test tests/unit/magic_formula_viz.test.js` (5 tests) green — the first test (formula == generated square, n=3,5,7) is the correctness gate.
- `npm test` (Playwright) green; add `tests/magic_formula.spec.js` (mirror a sibling new-mode smoke) asserting the mode selects and `data-testid="mf-grid"` renders + a cell query fills one cell; bump any hardcoded category/tile counts a spec asserts (adds 1 Arrays method, no new category).
- After `npm run build:slides`, `js/slides_rendered.js` has `magic-formula` with zh+en; the build must only touch `slides_db.js`, `js/slides_rendered.js`, `slides/{zh,en}/magic-formula.md`.

## Scope / YAGNI
- In: the frame builders + wiring + C++ + desc + i18n + slide + tests.
- Out: even orders; other construction methods; changing the other magic viz.

## Success criteria
1. Clicking a cell animates the O(1) formula (`a`, `b`, `value`) and fills only that cell; "Fill all" computes every cell by formula; the space/time contrast is shown.
2. `valueAt` provably equals the generated Siamese square (n=3,5,7); frame builders pure + unit-tested; `npm test` + Playwright green.
3. In-app Slides works for `magic-formula` (zh+en).
