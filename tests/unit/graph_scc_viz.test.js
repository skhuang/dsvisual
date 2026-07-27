const test = require('node:test'); const assert = require('node:assert');
const G = require('../../js/graph_scc_viz.js');
function last(cfg){ const f = G.sccFrames(cfg).frames; return f[f.length-1]; }

test('SAMPLE: 3 SCCs {0,1,2},{3,4},{5}; source gets lower comp id (topological order)', () => {
  const d = last(G.SAMPLE); const c = d.comp;
  assert.strictEqual(d.sccCount, 3);
  assert.strictEqual(c[0], c[1]); assert.strictEqual(c[1], c[2]);   // {0,1,2}
  assert.strictEqual(c[3], c[4]);                                    // {3,4}
  assert.notStrictEqual(c[0], c[3]); assert.notStrictEqual(c[3], c[5]); assert.notStrictEqual(c[0], c[5]);
  assert.strictEqual(new Set(c).size, 3);
  assert.ok(c[0] < c[3] && c[3] < c[5]);                             // source {0,1,2} lowest, sink {5} highest
});

test('single cycle 0->1->2->3->0 is one SCC', () => {
  const d = last({ n:4, edges:[{u:0,v:1},{u:1,v:2},{u:2,v:3},{u:3,v:0}] });
  assert.strictEqual(d.sccCount, 1);
  assert.strictEqual(new Set(d.comp).size, 1);
});

test('DAG 0->1,1->2 → 3 singleton SCCs', () => {
  const d = last({ n:3, edges:[{u:0,v:1},{u:1,v:2}] });
  assert.strictEqual(d.sccCount, 3);
  assert.strictEqual(new Set(d.comp).size, 3);
});

test('phase invariants: one transpose frame; finishStack reaches n at end of p1 then drains; seed cur unassigned; snapshots independent', () => {
  const { frames } = G.sccFrames(G.SAMPLE);
  assert.strictEqual(frames.filter(f => f.phase === 'transpose').length, 1);
  const p1 = frames.filter(f => f.phase === 'p1');
  assert.strictEqual(Math.max(...p1.map(f => f.finishStack.length)), 6);   // all n pushed by end of p1
  assert.strictEqual(frames.find(f => f.phase === 'transpose').finishStack.length, 6);
  assert.strictEqual(frames[frames.length-1].finishStack.length, 0);       // drained in p2
  frames.filter(f => f.seed).forEach(f => { assert.strictEqual(f.comp[f.cur], -1); });  // seed: cur not yet assigned
  // snapshot independence: init frame comp is all -1 even though final is assigned
  assert.ok(frames[0].comp.every(x => x === -1));
  frames.forEach(f => { assert.ok(f.msg.zh && f.msg.en); });
});

test('parseInput directed: 0-1 != 1-0; drops malformed/out-of-range; keeps self-loop', () => {
  assert.deepStrictEqual(G.parseInput('2','0-1').edges, [{u:0,v:1}]);
  assert.deepStrictEqual(G.parseInput('2','1-0').edges, [{u:1,v:0}]);
  const r = G.parseInput('3', ' 0-1 , 2-2 , 9-0 , junk , 1-2:7 ');
  assert.strictEqual(r.n, 3);
  assert.deepStrictEqual(r.edges, [{u:0,v:1},{u:2,v:2},{u:1,v:2}]);
});
