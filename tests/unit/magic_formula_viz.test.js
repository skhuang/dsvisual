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
