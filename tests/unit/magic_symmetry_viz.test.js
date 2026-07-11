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
