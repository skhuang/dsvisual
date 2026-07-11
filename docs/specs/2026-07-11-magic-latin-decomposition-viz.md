# Magic Square — Latin-square decomposition viz (spec + implementer brief)

A new dsvisual visualization `magic-latin` that explains **why** the Coxeter/Siamese
odd-order magic square works: every value `v = n·a + b + 1`, and the two digit
planes `a = ⌊(v−1)/n⌋` and `b = (v−1) mod n` are each **Latin squares** (every
row/col is a permutation of `0..n−1`), so every line sums to the same magic constant.

## Decisions (brainstorming)
- Standalone viz, category **Arrays** (beside `magic-square`); id **`magic-latin`**.
- Reuse the Siamese generator (dsvisual up-left variant) so it works for any odd n and matches the existing `magic-square` viz.
- Two-phase animation: **Phase 1 split** (reveal each cell's `v→(a,b)`), **Phase 2 verify** (each row/col is a permutation → line sum = M; then the two diagonals).
- Follows the `cache-lru`/`buildFrames` pattern exactly (7 wiring points), plus a `slides_db.js` entry + rebuild so the in-app Slides button works.

## Global constraints
- No backend; `buildFrames` pure/DOM-free; frames carry bilingual `msg:{en,zh}`; render via `langOf(fr.msg)`.
- Odd `n` only; controls offer n ∈ {3,5,7,9}.
- Module shape: IIFE on `global`, `const api={buildFrames}`, `module.exports`, `global.MagicLatinViz=api`.
- C++ panel excerpt in `code_db.js` must be **self-contained** (no undefined symbols) and behaviorally match the JS.

## Interface produced
`MagicLatinViz.buildFrames(n) → { frames, square, a, b, magicSum }`

## buildFrames (use verbatim) — `js/magic_latin_viz.js`
```js
(function (global) {
  // Odd-order magic square via the Siamese/Coxeter rule (dsvisual up-left variant).
  function siamese(n) {
    const sq = Array.from({ length: n }, () => Array(n).fill(0));
    let row = 0, col = (n / 2) | 0;
    for (let v = 1; v <= n * n; v++) {
      sq[row][col] = v;
      const up = (row - 1 + n) % n, left = (col - 1 + n) % n;
      if (sq[up][left] !== 0) row = (row + 1) % n; else { row = up; col = left; }
    }
    return sq;
  }
  const sum = (arr) => arr.reduce((x, y) => x + y, 0);
  const isPerm = (arr) => { const s = [...arr].sort((x, y) => x - y); return s.every((x, i) => x === i); };

  function buildFrames(n) {
    const square = siamese(n);
    const magicSum = n * (n * n + 1) / 2;
    const a = square.map((r) => r.map((v) => Math.floor((v - 1) / n)));
    const b = square.map((r) => r.map((v) => (v - 1) % n));
    const frames = [];
    frames.push({ phase: 'split', r: -1, c: -1, count: 0, magicSum,
      msg: { en: 'Split each value: v = n·a + b + 1', zh: '把每格拆解:v = n·a + b + 1' } });
    let count = 0;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      count++;
      const v = square[r][c];
      frames.push({ phase: 'split', r, c, count, v, a: a[r][c], b: b[r][c], magicSum,
        msg: { en: `${v} = ${n}·${a[r][c]} + ${b[r][c]} + 1`, zh: `${v} = ${n}·${a[r][c]} + ${b[r][c]} + 1` } });
    }
    for (let i = 0; i < n; i++) {
      frames.push({ phase: 'verify', kind: 'row', index: i, aSum: sum(a[i]), bSum: sum(b[i]),
        lineSum: sum(square[i]), isPerm: isPerm(a[i]) && isPerm(b[i]), magicSum,
        msg: { en: `row ${i}: n·${sum(a[i])} + ${sum(b[i])} + ${n} = ${sum(square[i])}`,
               zh: `第 ${i} 列:n·${sum(a[i])} + ${sum(b[i])} + ${n} = ${sum(square[i])}` } });
    }
    for (let j = 0; j < n; j++) {
      const col = square.map((r) => r[j]), aC = a.map((r) => r[j]), bC = b.map((r) => r[j]);
      frames.push({ phase: 'verify', kind: 'col', index: j, aSum: sum(aC), bSum: sum(bC),
        lineSum: sum(col), isPerm: isPerm(aC) && isPerm(bC), magicSum,
        msg: { en: `col ${j} → ${sum(col)}`, zh: `第 ${j} 欄 → ${sum(col)}` } });
    }
    const diag = [], anti = [];
    for (let i = 0; i < n; i++) { diag.push(square[i][i]); anti.push(square[i][n - 1 - i]); }
    frames.push({ phase: 'verify', kind: 'diag', index: 0, lineSum: sum(diag), magicSum,
      msg: { en: `main diagonal → ${sum(diag)}`, zh: `主對角線 → ${sum(diag)}` } });
    frames.push({ phase: 'verify', kind: 'anti', index: 0, lineSum: sum(anti), magicSum,
      msg: { en: `anti-diagonal → ${sum(anti)}`, zh: `反對角線 → ${sum(anti)}` } });
    frames.push({ phase: 'done', magicSum,
      msg: { en: `every row/col/diagonal = ${magicSum}`, zh: `每列/欄/對角線都 = ${magicSum}` } });
    return { frames, square, a, b, magicSum };
  }
  const api = { buildFrames };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.MagicLatinViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
```

## Unit tests (`tests/unit/magic_latin_viz.test.js`)
```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { buildFrames } = require('../../js/magic_latin_viz');

test('n=5: valid magic square, all lines sum to 65', () => {
  const { square, magicSum } = buildFrames(5);
  assert.equal(magicSum, 65);
  const vals = square.flat().slice().sort((x, y) => x - y);
  assert.deepEqual(vals, Array.from({ length: 25 }, (_, i) => i + 1)); // 1..25 once
  for (let i = 0; i < 5; i++) {
    assert.equal(square[i].reduce((x, y) => x + y, 0), 65);          // rows
    assert.equal(square.reduce((s, r) => s + r[i], 0), 65);          // cols
  }
  let d = 0, ad = 0; for (let i = 0; i < 5; i++) { d += square[i][i]; ad += square[i][4 - i]; }
  assert.equal(d, 65); assert.equal(ad, 65);                          // diagonals
});

test('decomposition identity v = n·a + b + 1', () => {
  const { square, a, b } = buildFrames(5);
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++)
    assert.equal(square[r][c], 5 * a[r][c] + b[r][c] + 1);
});

test('a-plane and b-plane are Latin squares (rows & cols are 0..n-1 permutations)', () => {
  const { a, b } = buildFrames(5);
  const perm = (arr) => { const s = [...arr].sort((x, y) => x - y); return s.every((x, i) => x === i); };
  for (let i = 0; i < 5; i++) {
    assert.ok(perm(a[i]) && perm(b[i]), `row ${i}`);
    assert.ok(perm(a.map((r) => r[i])) && perm(b.map((r) => r[i])), `col ${i}`);
  }
});

test('frames: split reveals all n² cells, verify covers rows+cols+2 diagonals, ends done', () => {
  const { frames } = buildFrames(5);
  const split = frames.filter((f) => f.phase === 'split');
  assert.equal(split[split.length - 1].count, 25);
  assert.equal(frames.filter((f) => f.phase === 'verify' && f.kind === 'row').length, 5);
  assert.equal(frames.filter((f) => f.phase === 'verify' && f.kind === 'col').length, 5);
  assert.equal(frames.filter((f) => f.phase === 'verify' && (f.kind === 'diag' || f.kind === 'anti')).length, 2);
  assert.equal(frames[frames.length - 1].phase, 'done');
});

test('n=3 also works (magic sum 15)', () => {
  const { magicSum, a, b } = buildFrames(3);
  assert.equal(magicSum, 15);
  const perm = (arr) => { const s = [...arr].sort((x, y) => x - y); return s.every((x, i) => x === i); };
  for (let i = 0; i < 3; i++) assert.ok(perm(a[i]) && perm(b[i]));
});
```

## Wiring (the 7 points, model on `cache-lru` / `renderNanoBpeEncode`)
1. `js/magic_latin_viz.js` (above).
2. `index.html`: `<script src="js/magic_latin_viz.js" defer></script>`.
3. `js/app.js`: menu entry in the **Arrays** category near `magic-square` — `{ id: 'magic-latin', title: 'Magic Square — Latin Decomposition', file: 'magic_latin.cpp', visualizer: 'magicLatin', controls: 'magicLatin' }`; code-map `'magic-latin': codeMagicLatin`; code-title `'magic_latin.cpp'`; dispatch `else if (currentMode === 'magic-latin') renderMagicLatin();`; and `renderMagicLatin()` (below).
4. `js/code_db.js`: `const codeMagicLatin` — self-contained C++ that generates the Siamese square, computes `a`,`b`, and asserts each is a Latin square / line sums = M (mirror the JS; ≤~50 lines).
5. `js/desc_db.js`: `'magic-latin'` entry — Latin-square (digit) decomposition; complexity O(n²).
6. `js/i18n.js`: `'method.magic-latin'` en `'Magic Square — Latin Decomposition'`, zh `'魔方陣 — 拉丁方陣分解'`.
7. `slides_db.js`: add a `'magic-latin'` deck (category `Arrays`, bilingual) covering: v=n·a+b+1, the two Latin squares, why line sum is constant, link back to the Siamese rule. Then run `npm run build:slides` to regenerate `js/slides_rendered.js` + `slides/{zh,en}/magic-latin.md`.

### `renderMagicLatin()` (model on renderLruCache)
Three grids side by side (magic square plain, a-plane colored by digit 0..n−1, b-plane colored), an n selector (3/5/7/9) + Apply, a phase line (`langOf(fr.msg)`), and a line-sum readout. In the split phase, highlight the current cell in all three grids and reveal a/b up to `count`. In the verify phase, highlight the current row/col/diagonal across the grids and show `aSum`, `bSum`, `lineSum` vs `magicSum`. Use `acquireDynamicVizHost()`, `buildStepControls(step, reset, ms)`, `data-testid="ml-grid-a"` etc. Digit colors: reuse a small categorical palette (0..n−1); it is the whole point that each row/col shows every color once.

## Testing
- `node --test tests/unit/magic_latin_viz.test.js` (5 tests) green.
- `npm test` (Playwright) green; add `tests/magic_latin.spec.js` (mirror a sibling new-mode smoke) asserting the mode selects and `data-testid="ml-grid-a"` renders; bump any hardcoded category/tile counts a spec asserts.
- After `npm run build:slides`, confirm `js/slides_rendered.js` has `magic-latin` with zh+en slides; the build must only touch `slides_db.js`, `js/slides_rendered.js`, and `slides/{zh,en}/magic-latin.md` (flag any other regenerated .md).

## Scope / YAGNI
- In: the viz + wiring + C++ + desc + i18n + slide + tests.
- Out: even-order squares, other construction methods, changes to the existing `magic-square` viz.
