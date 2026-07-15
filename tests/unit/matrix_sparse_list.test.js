const test = require('node:test');
const assert = require('node:assert');
const V = require('../../js/matrix_sparse_list_viz.js');

function isAsc(a) { return a.every((v, i) => i === 0 || a[i - 1] < v); }

test('parse: rows by ;, cells by ,, non-numeric -> 0, clamps to 6x6', () => {
  assert.deepStrictEqual(V.parse('0,0,3;5,0,0'), [[0, 0, 3], [5, 0, 0]]);
  assert.deepStrictEqual(V.parse('1,x,2'), [[1, 0, 2]]);
  const big = V.parse(Array(8).fill(Array(8).fill('1').join(',')).join(';'));
  assert.ok(big.length <= 6 && big[0].length <= 6);
});

test('build: nodes are the non-zeros row-major with ascending ids', () => {
  const g = [[0, 0, 3, 0], [5, 0, 0, 0], [0, 2, 0, 4]];
  const b = V.build(g);
  assert.strictEqual(b.rows, 3);
  assert.strictEqual(b.cols, 4);
  assert.deepStrictEqual(b.nodes.map((n) => [n.row, n.col, n.val]),
    [[0, 2, 3], [1, 0, 5], [2, 1, 2], [2, 3, 4]]);
  assert.deepStrictEqual(b.nodes.map((n) => n.id), [0, 1, 2, 3]);
});

test('build: row chains sorted by col; col chains sorted by row', () => {
  const g = [[7, 0, 8], [0, 9, 0], [1, 0, 2]];
  const b = V.build(g);
  b.rowChains.forEach((chain, r) => {
    const cols = chain.map((id) => b.nodes[id].col);
    assert.ok(isAsc(cols), 'row ' + r + ' cols ascending');
    chain.forEach((id) => assert.strictEqual(b.nodes[id].row, r));
  });
  b.colChains.forEach((chain, c) => {
    const rows = chain.map((id) => b.nodes[id].row);
    assert.ok(isAsc(rows), 'col ' + c + ' rows ascending');
    chain.forEach((id) => assert.strictEqual(b.nodes[id].col, c));
  });
  const all = b.rowChains.flat().sort((a, z) => a - z);
  assert.deepStrictEqual(all, b.nodes.map((n) => n.id));
});

test('transposeGrid is the matrix transpose; transpose(build) matches build(gridT)', () => {
  const g = [[0, 0, 3, 0], [5, 0, 0, 0], [0, 2, 0, 4]];
  const gt = V.transposeGrid(g);
  assert.strictEqual(gt.length, 4);
  assert.strictEqual(gt[0].length, 3);
  assert.strictEqual(gt[2][0], 3);
  assert.strictEqual(gt[0][1], 5);
  const t = V.transpose(V.build(g));
  assert.strictEqual(t.rows, 4);
  assert.strictEqual(t.cols, 3);
  assert.deepStrictEqual(t.nodes.map((n) => [n.row, n.col, n.val]),
    V.build(gt).nodes.map((n) => [n.row, n.col, n.val]));
});

test('buildFrames: one frame per non-zero + a final done frame; built matches build', () => {
  const g = [[0, 0, 3, 0], [5, 0, 0, 0], [0, 2, 0, 4]];
  const { frames, built } = V.buildFrames(g);
  const nz = 4;
  assert.strictEqual(frames.filter((f) => f.type === 'insert').length, nz);
  assert.strictEqual(frames[frames.length - 1].type, 'done');
  assert.deepStrictEqual(built.nodes, V.build(g).nodes);
});

test('edge: all-zero (no nodes) and 1x1', () => {
  const b0 = V.build([[0, 0], [0, 0]]);
  assert.strictEqual(b0.nodes.length, 0);
  assert.ok(V.buildFrames([[0]]).frames.length >= 1);
  const b1 = V.build([[5]]);
  assert.deepStrictEqual(b1.nodes.map((n) => [n.row, n.col, n.val]), [[0, 0, 5]]);
});

test('exports DEFAULT string', () => { assert.strictEqual(typeof V.DEFAULT, 'string'); });
