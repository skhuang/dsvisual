# Magic Square — Toroidal Tiling viz (design / spec)

A new dsvisual visualization `magic-torus` that makes the Siamese/Coxeter magic
square's **toroidal topology** intuitive: the board is tiled 3×3 on the plane, and
the up-left fill path — a zig-zag with wrap-around on one board — becomes **n
straight diagonal lines** across the tiled plane, joined by "break" jumps. Shows
docx §1 (toroidal / modular indexing) + §3 (Hamiltonian path, step/break vectors).

## Decisions (brainstorming, approved)
- Standalone viz, category **Arrays** (beside `magic-square` / `magic-latin`); id **`magic-torus`**.
- Reuse the Siamese up-left generator (matches the other magic viz). Odd n ∈ {3,5,7} (3×3 tiling of 9 gets too dense).
- Core mechanic: **3×3 ghost tiling + straight-line path**. Center tile = real board; 8 faint ghost copies. Consecutive up-left steps draw one straight diagonal that crosses tile borders; a break step (down) is a distinct dashed jump. Current cell lit in the center + all 8 ghosts.
- Annotate the step vector `(−1,−1)` and break vector `(+1,0)` on screen.
- Follows the `cache-lru`/`buildFrames` pattern (7 wiring points) + a `slides_db.js` deck + rebuild.

## Global constraints
- No backend; `buildFrames` pure/DOM-free; frames carry bilingual `msg:{en,zh}`; render via `langOf(fr.msg)`.
- Module shape: IIFE on `global`, `const api={buildFrames}`, `module.exports`, `global.MagicTorusViz=api`.
- C++ panel excerpt in `code_db.js` must be self-contained (no undefined symbols) and behaviorally match the JS.
- Slides wired via `slides_db.js` + `npm run build:slides` (a raw .md alone won't show).

## Interface produced
`MagicTorusViz.buildFrames(n) → { frames, square, path, runs, n }`

Each `path[i]` (for value `i+1`) = `{ v, row, col, runIndex, stepType, planeX, planeY }`:
- `row,col` — cell on the real n×n board.
- `stepType` — `'start'` (v=1), `'run'` (arrived via up-left), or `'break'` (arrived via down).
- `runIndex` — which straight diagonal (0..n−1).
- `planeX,planeY` — **cell coordinates on the 3n×3n tiled plane** (center tile offset by `n`). Within a run they decrease by `(1,1)` each step → a straight diagonal; a break re-anchors to the center tile. Torus identity holds: `planeY mod n === row` and `planeX mod n === col`.

## buildFrames (use verbatim) — `js/magic_torus_viz.js`
```js
(function (global) {
  function buildFrames(n) {
    const sq = Array.from({ length: n }, () => Array(n).fill(0));
    let row = 0, col = (n / 2) | 0;
    const cells = [], steps = [];        // cells in fill order (v = index+1); steps[i] = i→i+1 transition
    for (let v = 1; v <= n * n; v++) {
      sq[row][col] = v; cells.push({ row, col });
      if (v < n * n) {
        const up = (row - 1 + n) % n, left = (col - 1 + n) % n;
        if (sq[up][left] !== 0) { row = (row + 1) % n; steps.push('break'); }
        else { row = up; col = left; steps.push('run'); }
      }
    }
    const path = []; let runIndex = 0, px = 0, py = 0;
    for (let i = 0; i < cells.length; i++) {
      const { row: r, col: c } = cells[i];
      const prev = i > 0 ? steps[i - 1] : 'start';
      if (prev === 'run') { px -= 1; py -= 1; }          // straight up-left on the plane
      else { if (prev === 'break') runIndex += 1; px = c + n; py = r + n; } // start/break: anchor to center tile
      path.push({ v: i + 1, row: r, col: c, runIndex, stepType: prev, planeX: px, planeY: py });
    }
    const runs = runIndex + 1;
    const frames = [{ phase: 'start', index: -1, runs, n,
      msg: { en: `${n}×${n} board tiled 3×3 — fill starts`, zh: `${n}×${n} 方陣 3×3 拼貼 — 開始填數` } }];
    for (let i = 0; i < path.length; i++) {
      const p = path[i];
      const tag = p.stepType === 'break' ? 'break ↓' : (p.stepType === 'run' ? 'up-left ↖' : 'start');
      frames.push({ phase: 'fill', index: i, cell: p, runs, n,
        msg: { en: `#${p.v} → (${p.row},${p.col})  [${tag}]  run ${p.runIndex + 1}/${runs}`,
               zh: `#${p.v} → (${p.row},${p.col})  [${tag}]  第 ${p.runIndex + 1}/${runs} 條斜線` } });
    }
    frames.push({ phase: 'done', runs, n,
      msg: { en: `${runs} straight diagonals (broken diagonals of the torus) + ${runs - 1} break jumps`,
             zh: `${runs} 條直斜線(環面的斷裂對角線)+ ${runs - 1} 次 break 跳躍` } });
    return { frames, square: sq, path, runs, n };
  }
  const api = { buildFrames };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.MagicTorusViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
```

## Unit tests (`tests/unit/magic_torus_viz.test.js`)
```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { buildFrames } = require('../../js/magic_torus_viz');

test('n=5: path fills a valid magic square, 25 unique cells', () => {
  const { square, path } = buildFrames(5);
  assert.equal(path.length, 25);
  const seen = new Set(path.map((p) => p.row * 5 + p.col));
  assert.equal(seen.size, 25);
  for (let i = 0; i < 5; i++) {
    assert.equal(square[i].reduce((a, b) => a + b, 0), 65);
    assert.equal(square.reduce((s, r) => s + r[i], 0), 65);
  }
});

test('exactly n straight runs; step-type counts', () => {
  const { path, runs } = buildFrames(5);
  assert.equal(runs, 5);
  assert.equal(path.filter((p) => p.stepType === 'start').length, 1);
  assert.equal(path.filter((p) => p.stepType === 'break').length, 4);   // n-1
  assert.equal(path.filter((p) => p.stepType === 'run').length, 20);    // n(n-1)
  assert.equal(Math.max(...path.map((p) => p.runIndex)), 4);            // runIndex 0..n-1
});

test('torus identity: (planeY mod n, planeX mod n) === (row, col)', () => {
  const n = 5, { path } = buildFrames(n);
  for (const p of path) {
    assert.equal(((p.planeY % n) + n) % n, p.row);
    assert.equal(((p.planeX % n) + n) % n, p.col);
  }
});

test('within a run, consecutive plane coords differ by (-1,-1) (straight diagonal)', () => {
  const { path } = buildFrames(5);
  for (let i = 1; i < path.length; i++) {
    if (path[i].stepType === 'run') {
      assert.equal(path[i].planeX, path[i - 1].planeX - 1);
      assert.equal(path[i].planeY, path[i - 1].planeY - 1);
    }
  }
});

test('frames: start + n² fill + done', () => {
  const { frames } = buildFrames(5);
  assert.equal(frames[0].phase, 'start');
  assert.equal(frames.filter((f) => f.phase === 'fill').length, 25);
  assert.equal(frames[frames.length - 1].phase, 'done');
});

test('n=3 works (3 runs)', () => {
  const { runs, path } = buildFrames(3);
  assert.equal(runs, 3);
  assert.equal(path.length, 9);
});
```

## Wiring (7 points, model on `cache-lru` / `renderMagicLatin`)
1. `js/magic_torus_viz.js` (above).
2. `index.html`: `<script src="js/magic_torus_viz.js" defer></script>`.
3. `js/app.js`: menu entry in the **Arrays** category near `magic-latin` — `{ id: 'magic-torus', title: 'Magic Square — Toroidal Tiling', file: 'magic_torus.cpp', visualizer: 'magicTorus', controls: 'magicTorus' }`; code-map `'magic-torus': codeMagicTorus`; code-title `'magic_torus.cpp'`; dispatch `else if (currentMode === 'magic-torus') renderMagicTorus();`; and `renderMagicTorus()` (below).
4. `js/code_db.js`: `const codeMagicTorus` — self-contained C++: the Siamese step loop with modular wrap, commented to show the step vector `(−1,−1)` + break `(+1,0)` and the toroidal wrap. ≤~50 lines, no undefined symbols.
5. `js/desc_db.js`: `'magic-torus'` entry — toroidal topology; the fill is a Hamiltonian path; broken diagonals become straight; complexity O(n²).
6. `js/i18n.js`: `'method.magic-torus'` en `'Magic Square — Toroidal Tiling'`, zh `'魔方陣 — 環面拼貼'`.
7. `slides_db.js`: add a `'magic-torus'` deck (category `Arrays`, bilingual) — torus topology, `%` wrap ↔ circular queue, step/break vectors, broken-diagonal→straight-line, Hamiltonian path. Then `npm run build:slides`.

### `renderMagicTorus()` (model on renderMagicLatin / renderLruCache)
- Build an SVG (or CSS-grid) **3n×3n plane**: 9 copies of the board with numbers; center tile solid, the 8 ghost tiles faint (lower opacity). Tile borders drawn.
- Controls: n selector (3/5/7) + Apply; a "show ghost tiles" toggle; Step/Run/Reset via `buildStepControls(step, reset, ms)`; phase line via `langOf(fr.msg)`; a small legend for step `(−1,−1)` / break `(+1,0)`.
- On each `fill` frame `index=i`: highlight `path[i]`'s cell in the center tile **and its 8 ghost copies** (`(row+kn, col+jn)` for k,j∈{0,1,2}); draw the path polyline through `path[0..i]` using `(planeX,planeY)` — segments where `path[k].stepType==='run'` solid, `'break'` dashed (a jump). The solid segments of one `runIndex` form one straight diagonal crossing tile borders.
- Use `data-testid="mt-plane"` on the plane container.

## Testing
- `node --test tests/unit/magic_torus_viz.test.js` (6 tests) green.
- `npm test` (Playwright) green; add `tests/magic_torus.spec.js` (mirror a sibling new-mode smoke) asserting the mode selects and `data-testid="mt-plane"` renders; bump any hardcoded category/tile counts a spec asserts (adds 1 Arrays method, no new category).
- After `npm run build:slides`, `js/slides_rendered.js` has `magic-torus` with zh+en slides; the build must only touch `slides_db.js`, `js/slides_rendered.js`, `slides/{zh,en}/magic-torus.md`.

## Scope / YAGNI
- In: the viz + wiring + C++ + desc + i18n + slide + tests.
- Out: 3D torus rendering; even orders; other construction methods; changes to `magic-square`/`magic-latin`.

## Success criteria
1. Stepping fills the 3×3-tiled plane; each run's up-left steps render as one straight diagonal crossing tile borders; breaks are dashed jumps; current cell lit in all 9 tiles.
2. `buildFrames` pure + unit-tested (torus identity + straight-run + n-runs verified); `npm test` + Playwright green.
3. In-app Slides works for `magic-torus` (zh+en).
