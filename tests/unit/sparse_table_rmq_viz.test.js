const test = require('node:test');
const assert = require('node:assert/strict');
const { buildSparseTableFrames, parseInput } = require('../../js/viz/viz_sparse_table_rmq');

test('answer matches min() for random ranges (brute-force cross-check)', () => {
  const arr = [7, 2, 3, 9, 4, 6, 1, 8];
  for (let l = 0; l < arr.length; l++) {
    for (let r = l; r < arr.length; r++) {
      const { answer } = buildSparseTableFrames(arr, l, r);
      const expected = Math.min(...arr.slice(l, r + 1));
      assert.equal(answer, expected, `range [${l}, ${r}]`);
    }
  }
});

test('single-element array: query(0, 0) returns that element', () => {
  const { answer, frames } = buildSparseTableFrames([42], 0, 0);
  assert.equal(answer, 42);
  assert.ok(frames.length > 0);
});

test('duplicate values (ties): min is correct regardless of which copy wins', () => {
  const { answer } = buildSparseTableFrames([9, 1, 9, 1, 9], 1, 3);
  assert.equal(answer, 1);
});

test('empty array: no crash, answer is undefined', () => {
  const { answer, table } = buildSparseTableFrames([], 0, 0);
  assert.equal(answer, undefined);
  assert.deepEqual(table, []);
});

test('non-power-of-two range length still covers [l, r] via two overlapping windows', () => {
  // length 5 (not a power of two) forces the two RMQ windows to overlap.
  const arr = [5, 3, 8, 1, 9, 2, 7];
  const { answer } = buildSparseTableFrames(arr, 0, 4);
  assert.equal(answer, Math.min(...arr.slice(0, 5)));
});

test('parseInput clamps out-of-range and swapped l/r, and falls back on empty array text', () => {
  assert.deepEqual(parseInput('1,2,3 | 0,5'), { arr: [1, 2, 3], l: 0, r: 2 });
  assert.deepEqual(parseInput('1,2,3 | 2,0'), { arr: [1, 2, 3], l: 0, r: 2 });
  const fallback = parseInput('not,numbers | x,y');
  assert.ok(fallback.arr.length > 0);
  assert.ok(fallback.l <= fallback.r);
});

test('parseInput caps the array length so the grid stays readable', () => {
  const long = Array.from({ length: 40 }, (_, i) => i).join(',');
  const { arr } = parseInput(long + ' | 0,3');
  assert.ok(arr.length <= 16);
});
