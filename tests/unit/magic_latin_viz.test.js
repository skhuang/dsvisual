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
