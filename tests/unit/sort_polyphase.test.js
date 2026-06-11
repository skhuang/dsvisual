const test = require('node:test');
const assert = require('node:assert');
const V = require('../../js/sort_polyphase_viz.js');

function isSorted(a) { return a.every((v, i) => i === 0 || a[i - 1] <= v); }

test('naturalRuns splits ascending runs', () => {
  assert.deepStrictEqual(V.naturalRuns([1, 3, 2, 4, 0]), [[1, 3], [2, 4], [0]]);
  assert.deepStrictEqual(V.naturalRuns([5]), [[5]]);
});

test('polyphase merge produces a single fully sorted run', () => {
  const datasets = [[5, 3, 8, 1, 9, 2, 7, 4, 6, 0], [3, 1, 2], [9, 8, 7, 6, 5], [1, 2, 3, 4, 5], [4, 4, 4, 1]];
  for (const data of datasets) {
    const { sorted, frames } = V.polyphaseFrames(data);
    assert.deepStrictEqual(sorted, data.slice().sort((a, b) => a - b), JSON.stringify(data));
    assert.ok(isSorted(sorted));
    assert.ok(frames.length >= 1);
    const last = frames[frames.length - 1];
    const nonEmpty = last.tapes.filter((t) => t.length > 0);
    assert.strictEqual(nonEmpty.length, 1);
    assert.strictEqual(nonEmpty[0].length, 1);
  }
});

test('initial distribution frame uses 3 tapes with output empty', () => {
  const { frames } = V.polyphaseFrames([5, 3, 8, 1, 9, 2]);
  const first = frames[0];
  assert.strictEqual(first.tapes.length, 3);
  assert.strictEqual(first.phase, 'distribute');
});

test('empty input is handled', () => {
  const { sorted, frames } = V.polyphaseFrames([]);
  assert.deepStrictEqual(sorted, []);
  assert.ok(frames.length >= 1);
});
