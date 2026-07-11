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
