const test = require('node:test');
const assert = require('node:assert/strict');
const { buildFibSearchFrames } = require('../../js/search_fibonacci_viz');

const ARR = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19];

test('finds an existing target (matches indexOf)', () => {
  for (const t of ARR) {
    const { foundIndex } = buildFibSearchFrames(ARR, t);
    assert.equal(foundIndex, ARR.indexOf(t), 'target ' + t);
  }
});

test('returns -1 for an absent target', () => {
  assert.equal(buildFibSearchFrames(ARR, 8).foundIndex, -1);
  assert.equal(buildFibSearchFrames(ARR, 100).foundIndex, -1);
  assert.equal(buildFibSearchFrames(ARR, 0).foundIndex, -1);
});

test('every probe index is within array bounds; frames carry bilingual msg', () => {
  const { frames } = buildFibSearchFrames(ARR, 11);
  for (const f of frames) {
    assert.ok(f.msg.zh && f.msg.en);
    if (f.probe >= 0) assert.ok(f.probe < ARR.length);
  }
});
