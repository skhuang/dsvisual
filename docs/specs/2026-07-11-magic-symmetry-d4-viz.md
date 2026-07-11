# Magic Square — Symmetry / D₄ group operations viz (design / spec)

A new dsvisual visualization `magic-symmetry`: the 8 symmetries of a square form
the dihedral group **D₄** (4 rotations + 4 reflections); applying any of them to a
magic square is a **coordinate remap on the 2-D array** and the magic property
(all rows/cols/diagonals = M) is **invariant under the group action**. Realizes
the advanced-principles doc §3 (group / isomorphism). DS lesson: a group acting on
an array by index permutations; the magic sum is an invariant of the action.

## Decisions (brainstorming, approved)
- Standalone viz, category **Arrays** (with the other `magic-*` viz); id **`magic-symmetry`**. n ∈ {3,5,7}; reuses the Siamese generator.
- **8 D₄ operations** as forward coordinate remaps (all verified magic-preserving; orbit = 8 for n=3,5,7):
  `id (r,c)→(r,c)`, `r90 →(c,n−1−r)`, `r180 →(n−1−r,n−1−c)`, `r270 →(n−1−c,r)`, `flipH →(r,n−1−c)`, `flipV →(n−1−r,c)`, `transpose →(c,r)`, `antiT →(n−1−c,n−1−r)`.
- **Interaction**: pick an op → animate cells remapping to their new positions → step-verify each row/col/diagonal of the result still = M → "still magic". A running **orbit counter** shows how many distinct magic squares have been generated (max 8).
- Follows the `cache-lru`/`buildFrames` pattern (7 wiring points) + a `slides_db.js` deck + rebuild.

## Global constraints
- No backend; frame builders pure/DOM-free; frames carry bilingual `msg:{en,zh}`; render via `langOf(fr.msg)`.
- Module shape: IIFE on `global`, `module.exports`, `global.MagicSymmetryViz`.
- C++ panel (`codeMagicSymmetry`) self-contained (no undefined symbols), matches the JS remaps, ≤~50 lines.
- Slides wired via `slides_db.js` + `npm run build:slides`.
- CSS/testid prefix `sym-` (avoid clashing with `magic-`/`ml-`/`mt-`/`mf-`).

## Interfaces produced
`MagicSymmetryViz.{ OPS, applyOp, orbit, buildFrames }`
- `OPS` — the ordered list `['id','r90','r180','r270','flipH','flipV','transpose','antiT']`.
- `applyOp(square, op, n) → newSquare` (pure).
- `orbit(n) → { size, squares }` (distinct images under the 8 ops).
- `buildFrames(n, op) → { frames, original, transformed, magicSum, stillMagic }`.

## Frame builders (use verbatim) — `js/magic_symmetry_viz.js`
```js
(function (global) {
  const OPS = ['id', 'r90', 'r180', 'r270', 'flipH', 'flipV', 'transpose', 'antiT'];
  const DEST = {              // forward map: old (r,c) → new (row,col)
    id: (r, c, n) => [r, c],
    r90: (r, c, n) => [c, n - 1 - r],
    r180: (r, c, n) => [n - 1 - r, n - 1 - c],
    r270: (r, c, n) => [n - 1 - c, r],
    flipH: (r, c, n) => [r, n - 1 - c],
    flipV: (r, c, n) => [n - 1 - r, c],
    transpose: (r, c, n) => [c, r],
    antiT: (r, c, n) => [n - 1 - c, n - 1 - r],
  };
  function siamese(n) {
    const sq = Array.from({ length: n }, () => Array(n).fill(0));
    let r = 0, c = (n / 2) | 0;
    for (let v = 1; v <= n * n; v++) {
      sq[r][c] = v; const u = (r - 1 + n) % n, l = (c - 1 + n) % n;
      if (sq[u][l] !== 0) r = (r + 1) % n; else { r = u; c = l; }
    }
    return sq;
  }
  function applyOp(square, op, n) {
    const g = Array.from({ length: n }, () => Array(n).fill(0));
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) { const [tr, tc] = DEST[op](r, c, n); g[tr][tc] = square[r][c]; }
    return g;
  }
  const sum = (a) => a.reduce((x, y) => x + y, 0);
  function lineSums(g, n) {
    const rows = g.map((row) => sum(row));
    const cols = g[0].map((_, j) => sum(g.map((row) => row[j])));
    let d = 0, a = 0; for (let i = 0; i < n; i++) { d += g[i][i]; a += g[i][n - 1 - i]; }
    return { rows, cols, diag: d, anti: a };
  }
  function isMagic(g, n) { const M = n * (n * n + 1) / 2; const s = lineSums(g, n);
    return s.rows.every((x) => x === M) && s.cols.every((x) => x === M) && s.diag === M && s.anti === M; }

  function orbit(n) {
    const base = siamese(n); const seen = new Map();
    for (const op of OPS) { const g = applyOp(base, op, n); const key = g.map((r) => r.join(',')).join(';'); if (!seen.has(key)) seen.set(key, g); }
    return { size: seen.size, squares: [...seen.values()] };
  }

  function buildFrames(n, op) {
    const original = siamese(n);
    const transformed = applyOp(original, op, n);
    const magicSum = n * (n * n + 1) / 2;
    const mapping = [];
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) { const [tr, tc] = DEST[op](r, c, n); mapping.push({ fromR: r, fromC: c, toR: tr, toC: tc, value: original[r][c] }); }
    const s = lineSums(transformed, n);
    const frames = [
      { phase: 'show', op, original, transformed, magicSum, msg: { en: `operation: ${op}`, zh: `操作:${op}` } },
      { phase: 'apply', op, original, transformed, mapping, magicSum, msg: { en: `remap every cell by ${op}`, zh: `把每格依 ${op} 重新映射` } },
    ];
    for (let i = 0; i < n; i++) frames.push({ phase: 'verify', kind: 'row', index: i, lineSum: s.rows[i], magicSum,
      msg: { en: `row ${i} → ${s.rows[i]}`, zh: `第 ${i} 列 → ${s.rows[i]}` } });
    for (let j = 0; j < n; j++) frames.push({ phase: 'verify', kind: 'col', index: j, lineSum: s.cols[j], magicSum,
      msg: { en: `col ${j} → ${s.cols[j]}`, zh: `第 ${j} 欄 → ${s.cols[j]}` } });
    frames.push({ phase: 'verify', kind: 'diag', lineSum: s.diag, magicSum, msg: { en: `main diagonal → ${s.diag}`, zh: `主對角線 → ${s.diag}` } });
    frames.push({ phase: 'verify', kind: 'anti', lineSum: s.anti, magicSum, msg: { en: `anti-diagonal → ${s.anti}`, zh: `反對角線 → ${s.anti}` } });
    const stillMagic = isMagic(transformed, n);
    frames.push({ phase: 'done', op, transformed, stillMagic, magicSum,
      msg: { en: `${stillMagic ? 'still magic' : 'NOT magic'} (all lines = ${magicSum})`, zh: `${stillMagic ? '仍是魔方陣' : '不是魔方陣'}(每條線 = ${magicSum})` } });
    return { frames, original, transformed, magicSum, stillMagic };
  }

  const api = { OPS, applyOp, orbit, buildFrames };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.MagicSymmetryViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
```

## Unit tests (`tests/unit/magic_symmetry_viz.test.js`)
```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { OPS, applyOp, orbit, buildFrames } = require('../../js/magic_symmetry_viz');

const M = (n) => n * (n * n + 1) / 2;
function isMagic(g, n) {
  for (let i = 0; i < n; i++) { let rs = 0, cs = 0; for (let j = 0; j < n; j++) { rs += g[i][j]; cs += g[j][i]; } if (rs !== M(n) || cs !== M(n)) return false; }
  let d = 0, a = 0; for (let i = 0; i < n; i++) { d += g[i][i]; a += g[i][n - 1 - i]; } return d === M(n) && a === M(n);
}

test('all 8 D4 ops preserve the magic property (n=3,5,7)', () => {
  for (const n of [3, 5, 7]) for (const op of OPS) {
    const { transformed, stillMagic } = buildFrames(n, op);
    assert.ok(isMagic(transformed, n), `${op} n=${n}`);
    assert.equal(stillMagic, true);
  }
});

test('each op image is a permutation of 1..n²', () => {
  const n = 5;
  for (const op of OPS) {
    const { transformed } = buildFrames(n, op);
    const vals = transformed.flat().sort((a, b) => a - b);
    assert.deepEqual(vals, Array.from({ length: 25 }, (_, k) => k + 1));
  }
});

test('orbit of the Siamese square has size 8 (n=3,5,7)', () => {
  for (const n of [3, 5, 7]) assert.equal(orbit(n).size, 8);
});

test('group sanity: r90^4 = id, transpose^2 = id, flipH∘flipV = r180', () => {
  const n = 5, base = buildFrames(n, 'id').original;
  let g = base; for (let k = 0; k < 4; k++) g = applyOp(g, 'r90', n);
  assert.deepEqual(g, base);
  assert.deepEqual(applyOp(applyOp(base, 'transpose', n), 'transpose', n), base);
  assert.deepEqual(applyOp(applyOp(base, 'flipH', n), 'flipV', n), applyOp(base, 'r180', n));
});

test('frames: show, apply (with n² mapping), n row + n col + 2 diag verify, done', () => {
  const n = 5, { frames } = buildFrames(n, 'r90');
  assert.equal(frames[0].phase, 'show');
  const apply = frames.find((f) => f.phase === 'apply');
  assert.equal(apply.mapping.length, 25);
  assert.equal(frames.filter((f) => f.phase === 'verify' && f.kind === 'row').length, 5);
  assert.equal(frames.filter((f) => f.phase === 'verify' && f.kind === 'col').length, 5);
  assert.equal(frames.filter((f) => f.phase === 'verify' && (f.kind === 'diag' || f.kind === 'anti')).length, 2);
  assert.equal(frames[frames.length - 1].phase, 'done');
});
```

## Wiring (7 points, model on `cache-lru` / `renderMagicLatin`)
1. `js/magic_symmetry_viz.js` (above).
2. `index.html`: `<script src="js/magic_symmetry_viz.js" defer></script>`.
3. `js/app.js`: Arrays-category entry near `magic-formula` — `{ id: 'magic-symmetry', title: 'Magic Square — Symmetry (D₄)', file: 'magic_symmetry.cpp', visualizer: 'magicSymmetry', controls: 'magicSymmetry' }`; code-map `'magic-symmetry': codeMagicSymmetry`; code-title `'magic_symmetry.cpp'`; dispatch `else if (currentMode === 'magic-symmetry') renderMagicSymmetry();`; and `renderMagicSymmetry()` (below).
4. `js/code_db.js`: `const codeMagicSymmetry` — self-contained C++: build the Siamese square, `applyOp` (a switch over the 8 remaps), and an `isMagic` check; a `main` applying an op and asserting the result is still magic. ≤~50 lines, no undefined symbols; remaps match the JS `DEST`.
5. `js/desc_db.js`: `'magic-symmetry'` — D₄ (8 symmetries); each op is an index remap; magic sum invariant under the group action; orbit size ≤ 8.
6. `js/i18n.js`: `'method.magic-symmetry'` en `'Magic Square — Symmetry (D₄)'`, zh `'魔方陣 — 對稱 (D₄ 群)'`.
7. `slides_db.js`: `'magic-symmetry'` deck (Arrays, bilingual) — D₄ = 4 rotations + 4 reflections; ops as coordinate remaps; magic property invariant under the group; orbit of the Siamese square = 8. Then `npm run build:slides`.

### `renderMagicSymmetry()` (model on renderMagicLatin / renderLruCache)
- Two grids side by side: **original** (left) and **result** (right), or one grid that animates the remap. n selector (3/5/7) + Apply.
- **Op picker**: 8 buttons/menu for the D₄ ops (`id, r90, r180, r270, flipH, flipV, transpose, antiT`). Selecting one runs `buildFrames(n, op)`.
- Step through with `buildStepControls(step, reset, ms)`: `show` (highlight the chosen op), `apply` (animate each `mapping` entry's value moving `from→to`), `verify` (highlight the current row/col/diagonal of the result and show `lineSum` vs `magicSum`), `done` (`stillMagic`).
- **Orbit counter**: maintain a `Set` of serialized result squares seen this session; show "orbit: k / 8 distinct" (uses `orbit(n).size` as the max). `data-testid="sym-grid"`.

## Testing
- `node --test tests/unit/magic_symmetry_viz.test.js` (5 tests) green — the magic-preservation + orbit=8 + group-sanity tests are the correctness gates.
- `npm test` (Playwright) green; add `tests/magic_symmetry.spec.js` (mirror a sibling new-mode smoke) asserting the mode selects, `data-testid="sym-grid"` renders, and applying an op keeps a "still magic" readout; bump any hardcoded category/tile counts a spec asserts (adds 1 Arrays method, no new category).
- After `npm run build:slides`, `js/slides_rendered.js` has `magic-symmetry` with zh+en; the build must only touch `slides_db.js`, `js/slides_rendered.js`, `slides/{zh,en}/magic-symmetry.md`.

## Scope / YAGNI
- In: the frame builders + wiring + C++ + desc + i18n + slide + tests.
- Out: full Cayley table / composition UI (orbit counter only); even orders; changing the other magic viz.

## Success criteria
1. Picking a D₄ op animates the cell remap and re-verifies all lines = M ("still magic"); the orbit counter tracks distinct squares (≤ 8).
2. `applyOp`/`buildFrames`/`orbit` pure + unit-tested (all 8 ops magic-preserving n=3,5,7; orbit=8; group sanity); `npm test` + Playwright green.
3. In-app Slides works for `magic-symmetry` (zh+en).
