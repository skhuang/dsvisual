const test = require('node:test'); const assert = require('node:assert');
const G = require('../../js/graph_components_viz.js');

test('SAMPLE (G3): 3 components partitioning {0,1},{2,3},{4}', () => {
  const { frames } = G.componentsFrames(G.SAMPLE);
  const last = frames[frames.length - 1];
  assert.strictEqual(last.done, true);
  assert.strictEqual(last.k, 3);
  const c = last.comp;
  assert.strictEqual(c[0], c[1]);              // 0,1 same component
  assert.strictEqual(c[2], c[3]);              // 2,3 same component
  assert.notStrictEqual(c[0], c[2]);           // different components
  assert.notStrictEqual(c[4], c[0]);           // isolated vertex is its own
  assert.notStrictEqual(c[4], c[2]);
  assert.strictEqual(new Set(c).size, 3);      // exactly 3 distinct labels
});

test('single-edge graph n=2 is one component', () => {
  const { frames } = G.componentsFrames({ n: 2, edges: [{u:0,v:1}] });
  const last = frames[frames.length - 1];
  assert.strictEqual(last.k, 1);
  assert.strictEqual(last.comp[0], last.comp[1]);
});

test('all-isolated graph: every vertex its own component', () => {
  const { frames } = G.componentsFrames({ n: 3, edges: [] });
  const last = frames[frames.length - 1];
  assert.strictEqual(last.k, 3);
  assert.strictEqual(new Set(last.comp).size, 3);
});

test('frontier is empty at start/done, non-empty during a multi-vertex flood', () => {
  const { frames } = G.componentsFrames(G.SAMPLE);
  assert.deepStrictEqual(frames[0].frontier, []);            // initial
  assert.deepStrictEqual(frames[frames.length - 1].frontier, []); // done
  // the seed frame for the {0,1} component (current=0) has 1 queued in the frontier
  const seed01 = frames.find((f) => f.seed && f.current === 0);
  assert.ok(seed01 && seed01.frontier.length >= 1);
});

test('one process frame per vertex + initial + done; k is a running count', () => {
  const { frames } = G.componentsFrames(G.SAMPLE); // n=5 -> 5 process frames
  assert.strictEqual(frames.length, 5 + 2);        // initial + 5 + done
  assert.strictEqual(frames[0].k, 0);              // nothing labeled yet
  const kSeq = frames.map((f) => f.k);
  for (let i = 1; i < kSeq.length; i++) assert.ok(kSeq[i] >= kSeq[i - 1]); // non-decreasing
});

test('every frame carries a bilingual msg', () => {
  const { frames } = G.componentsFrames(G.SAMPLE);
  frames.forEach((f) => { assert.ok(f.msg && f.msg.zh && f.msg.en); });
});

test('parseInput: undirected 1-0 == 0-1; drops malformed/out-of-range; ignores :w', () => {
  const a = G.parseInput('2', '0-1');
  const b = G.parseInput('2', '1-0');
  assert.strictEqual(G.componentsFrames(a).frames.pop().k, 1);
  assert.strictEqual(G.componentsFrames(b).frames.pop().k, 1);
  const r = G.parseInput('3', ' 0-1 , 1-2:9 , 9-9 , junk , 2-0 ');
  assert.strictEqual(r.n, 3);
  assert.deepStrictEqual(r.edges, [{u:0,v:1},{u:1,v:2},{u:2,v:0}]); // 9-9 & junk dropped, :9 ignored
});
