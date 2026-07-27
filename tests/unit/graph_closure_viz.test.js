const test = require('node:test'); const assert = require('node:assert');
const G = require('../../js/graph_closure_viz.js');

function finalR(cfg){ const f = G.closureFrames(cfg).frames; return f[f.length-1].R; }

test('SAMPLE closure: chain + cycle 1-2-3 (diagonal 1 for 1,2,3; column 0 all zero)', () => {
  const R = finalR(G.SAMPLE);
  assert.strictEqual(R[0][3], 1);           // 0 reaches 3
  assert.strictEqual(R[0][0], 0);           // nothing reaches 0
  for (let i=0;i<4;i++) assert.strictEqual(R[i][0], 0);   // column 0 all zero
  assert.strictEqual(R[1][1], 1);           // cycle → self-reachable
  assert.strictEqual(R[2][2], 1);
  assert.strictEqual(R[3][3], 1);
  assert.strictEqual(R[3][2], 1);
});

test('DAG chain 0->1->2->3: strict upper triangle, all-zero diagonal', () => {
  const R = finalR({ n:4, edges:[{u:0,v:1},{u:1,v:2},{u:2,v:3}] });
  assert.strictEqual(R[0][3], 1);
  for (let i=0;i<4;i++) assert.strictEqual(R[i][i], 0);   // no cycle → empty diagonal
  assert.strictEqual(R[3][0], 0);
});

test('2-cycle 0<->1: diagonal set for both', () => {
  const R = finalR({ n:2, edges:[{u:0,v:1},{u:1,v:0}] });
  assert.strictEqual(R[0][0], 1); assert.strictEqual(R[1][1], 1);
});

test('per-cell frames: one pivot per k; set frames = final ones - initial ones; each cell flips once', () => {
  const { frames } = G.closureFrames(G.SAMPLE);
  assert.strictEqual(frames.filter(f => f.phase==='pivot').length, 4);   // n pivot frames
  const init = frames[0].R, fin = frames[frames.length-1].R;
  const count = (M)=>M.flat().reduce((s,x)=>s+x,0);
  const sets = frames.filter(f => f.phase==='set').length;
  assert.strictEqual(sets, count(fin) - count(init));                    // each 0→1 once
  frames.filter(f=>f.phase==='set').forEach(f => {                       // cur cell is 1 here
    assert.strictEqual(f.R[f.cur.i][f.cur.j], 1);
  });
  assert.ok(frames.length <= 4*4 + 4 + 2);                               // ≤ n²+n+2
  frames.forEach(f => { assert.ok(f.msg.zh && f.msg.en); });
});

test('parseInput directed: 0-1 != 1-0; drops malformed/out-of-range; keeps self-loop', () => {
  const a = G.parseInput('2','0-1'); const b = G.parseInput('2','1-0');
  assert.deepStrictEqual(a.edges, [{u:0,v:1}]);
  assert.deepStrictEqual(b.edges, [{u:1,v:0}]);
  const r = G.parseInput('3', ' 0-1 , 2-2 , 9-1 , junk , 1-2:5 ');
  assert.strictEqual(r.n, 3);
  assert.deepStrictEqual(r.edges, [{u:0,v:1},{u:2,v:2},{u:1,v:2}]);      // 9-1 out of range & junk dropped, :5 ignored, self-loop kept
});
