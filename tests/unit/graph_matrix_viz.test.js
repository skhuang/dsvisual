const test = require('node:test'); const assert = require('node:assert');
const G = require('../../js/graph_matrix_viz.js');
test('undirected fills symmetric cells; degree = neighbor count', () => {
  const { frames } = G.matrixFrames({ n: 3, edges: [{u:0,v:1,w:5}], directed:false, weighted:false });
  const last = frames[frames.length - 1];
  assert.strictEqual(last.matrix[0][1], 1); assert.strictEqual(last.matrix[1][0], 1); // symmetric, unweighted
  assert.strictEqual(last.done, true);
  assert.deepStrictEqual(last.degree.out, [1,1,0]);
});
test('directed is asymmetric; weighted stores weights', () => {
  const { frames } = G.matrixFrames({ n: 3, edges: [{u:0,v:1,w:5}], directed:true, weighted:true });
  const last = frames[frames.length - 1];
  assert.strictEqual(last.matrix[0][1], 5); assert.strictEqual(last.matrix[1][0], 0);
  assert.deepStrictEqual(last.degree.out, [1,0,0]); assert.deepStrictEqual(last.degree.in, [0,1,0]);
});
test('one frame per edge + start + done; each edge frame highlights cells', () => {
  const { frames } = G.matrixFrames({ n: 2, edges: [{u:0,v:1,w:1}], directed:false, weighted:false });
  assert.strictEqual(frames.length, 3); // start, edge, done
  assert.ok(frames[1].added.length === 2 && frames[1].edge);
  frames.forEach(f => { assert.ok(f.msg.zh && f.msg.en); });
});
test('parseInput handles u-v, u-v:w, whitespace, drops malformed/out-of-range', () => {
  const r = G.parseInput('3', ' 0-1 , 1-2:4 , 9-9 , junk , 2-0 ');
  assert.strictEqual(r.n, 3);
  assert.deepStrictEqual(r.edges, [{u:0,v:1,w:1},{u:1,v:2,w:4},{u:2,v:0,w:1}]); // 9-9 out of range, junk dropped
});
