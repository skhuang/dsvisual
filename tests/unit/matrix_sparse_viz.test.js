const test = require('node:test');
const assert = require('node:assert/strict');
const { toTriples, fastTranspose, buildFastTransposeFrames } = require('../../js/matrix_sparse_viz');

const M = [
  [0, 0, 3, 0],
  [5, 0, 0, 0],
  [0, 2, 0, 4],
];

test('toTriples lists nonzeros in row-major order', () => {
  assert.deepEqual(toTriples(M), [
    { r: 0, c: 2, v: 3 },
    { r: 1, c: 0, v: 5 },
    { r: 2, c: 1, v: 2 },
    { r: 2, c: 3, v: 4 },
  ]);
});

test('FAST_TRANSPOSE produces the correct transposed dense matrix', () => {
  const { transposed, triples } = buildFastTransposeFrames(M);
  assert.deepEqual(transposed, [
    [0, 5, 0],
    [0, 0, 2],
    [3, 0, 0],
    [0, 0, 4],
  ]);
  assert.equal(triples.length, 4);
});

test('transpose invariant: T[j][i] === M[i][j] for all cells', () => {
  const { transposed } = buildFastTransposeFrames(M);
  for (let i = 0; i < M.length; i++)
    for (let j = 0; j < M[0].length; j++)
      assert.equal(transposed[j][i], M[i][j]);
});

test('frames include rowsize/startpos/place phases and bilingual msg', () => {
  const { frames } = buildFastTransposeFrames(M);
  const phases = new Set(frames.map((f) => f.phase));
  for (const p of ['rowsize', 'startpos', 'place']) assert.ok(phases.has(p), 'missing ' + p);
  for (const f of frames) assert.ok(f.msg.zh && f.msg.en);
});

test('fastTranspose mirrors C++ FAST_TRANSPOSE triple output', () => {
  const triples = toTriples(M); // M is 3x4
  assert.deepEqual(fastTranspose(triples, 3, 4), [
    { r: 0, c: 1, v: 5 },
    { r: 1, c: 2, v: 2 },
    { r: 2, c: 0, v: 3 },
    { r: 3, c: 2, v: 4 },
  ]);
});

test('buildFastTransposeFrames final transpose matches fastTranspose', () => {
  const { transposed, triples } = buildFastTransposeFrames(M);
  const tri = fastTranspose(triples, 3, 4);
  const dense = [[0,0,0],[0,0,0],[0,0,0],[0,0,0]];
  for (const t of tri) dense[t.r][t.c] = t.v;
  assert.deepEqual(transposed, dense);
});
