const test = require('node:test');
const assert = require('node:assert/strict');
const { buildInterpFrames } = require('../../js/search_interpolation_viz');

const ARR = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

test('finds an existing target (matches indexOf)', () => {
  for (const t of ARR) {
    const { foundIndex } = buildInterpFrames(ARR, t);
    assert.equal(foundIndex, ARR.indexOf(t), 'target ' + t);
  }
});

test('returns -1 for an absent target', () => {
  assert.equal(buildInterpFrames(ARR, 35).foundIndex, -1);
  assert.equal(buildInterpFrames(ARR, 5).foundIndex, -1);
  assert.equal(buildInterpFrames(ARR, 999).foundIndex, -1);
});

test('equal-valued range does not divide by zero', () => {
  const flat = [7, 7, 7, 7];
  assert.equal(buildInterpFrames(flat, 7).foundIndex, 0);
  assert.equal(buildInterpFrames(flat, 9).foundIndex, -1);
});

test('probe positions stay within [lo,hi]; frames carry bilingual msg', () => {
  const { frames } = buildInterpFrames(ARR, 70);
  for (const f of frames) {
    assert.ok(f.msg.zh && f.msg.en);
    if (f.pos >= 0) assert.ok(f.pos >= f.lo && f.pos <= f.hi);
  }
});
