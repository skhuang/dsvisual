const test = require('node:test'); const assert = require('node:assert');
const G = require('../../js/graph_bipartite_viz.js');

test('SAMPLE C6 is bipartite; classes {0,2,4}/{1,3,5}', () => {
  const { frames } = G.bipartiteFrames(G.SAMPLE);
  const last = frames[frames.length - 1];
  assert.strictEqual(last.done, true);
  assert.strictEqual(last.bipartite, true);
  assert.strictEqual(last.conflict, null);
  assert.deepStrictEqual(last.classes.v1, [0, 2, 4]);
  assert.deepStrictEqual(last.classes.v2, [1, 3, 5]);
});

test('C5 (odd cycle) is NOT bipartite; conflict frame is last, endpoints share a colour', () => {
  const { frames } = G.bipartiteFrames({ n: 5, edges: [{u:0,v:1},{u:1,v:2},{u:2,v:3},{u:3,v:4},{u:4,v:0}] });
  const last = frames[frames.length - 1];
  assert.strictEqual(last.done, true);
  assert.strictEqual(last.bipartite, false);
  assert.ok(last.conflict && typeof last.conflict.u === 'number' && typeof last.conflict.v === 'number');
  assert.strictEqual(last.color[last.conflict.u], last.color[last.conflict.v]); // same-colour = odd cycle
  // no frames exist after the conflict frame
  assert.strictEqual(frames.filter((f) => f.conflict).length, 1);
  assert.strictEqual(frames.indexOf(last), frames.length - 1);
});

test('triangle is not bipartite; even path is bipartite', () => {
  assert.strictEqual(G.bipartiteFrames({ n:3, edges:[{u:0,v:1},{u:1,v:2},{u:2,v:0}] }).frames.pop().bipartite, false);
  assert.strictEqual(G.bipartiteFrames({ n:4, edges:[{u:0,v:1},{u:1,v:2},{u:2,v:3}] }).frames.pop().bipartite, true);
});

test('disconnected graph: even cycle + odd cycle → not bipartite (conflict in the odd component)', () => {
  // component A = 4-cycle 0-1-2-3-0 (bipartite); component B = triangle 4-5-6 (odd)
  const { frames } = G.bipartiteFrames({ n:7, edges:[
    {u:0,v:1},{u:1,v:2},{u:2,v:3},{u:3,v:0}, {u:4,v:5},{u:5,v:6},{u:6,v:4} ] });
  const last = frames[frames.length - 1];
  assert.strictEqual(last.bipartite, false);
  assert.ok(last.conflict.u >= 4 && last.conflict.v >= 4); // conflict is in the triangle
});

test('frontier empty at start/done, non-empty mid-flood; every frame bilingual', () => {
  const { frames } = G.bipartiteFrames(G.SAMPLE);
  assert.deepStrictEqual(frames[0].frontier, []);
  assert.deepStrictEqual(frames[frames.length - 1].frontier, []);
  const seed0 = frames.find((f) => f.seed && f.current === 0);
  assert.ok(seed0 && seed0.frontier.length >= 1);
  frames.forEach((f) => { assert.ok(f.msg && f.msg.zh && f.msg.en); });
});

test('parseInput: undirected 1-0 == 0-1; drops malformed/out-of-range; ignores :w', () => {
  assert.strictEqual(G.bipartiteFrames(G.parseInput('2','0-1')).frames.pop().bipartite, true);
  assert.strictEqual(G.bipartiteFrames(G.parseInput('2','1-0')).frames.pop().bipartite, true);
  const r = G.parseInput('3', ' 0-1 , 1-2:9 , 9-9 , junk , 2-0 ');
  assert.strictEqual(r.n, 3);
  assert.deepStrictEqual(r.edges, [{u:0,v:1},{u:1,v:2},{u:2,v:0}]);
});
