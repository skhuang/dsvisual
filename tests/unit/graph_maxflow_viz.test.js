const test = require('node:test');
const assert = require('node:assert');
const G = require('../../js/graph_maxflow_viz.js');

function finalFrame(config) {
  const frames = G.maxFlowFrames(config).frames;
  return frames[frames.length - 1];
}

test('classic network has max flow 23 and a matching min cut', () => {
  const result = G.maxFlowFrames(G.SAMPLE);
  const done = result.frames[result.frames.length - 1];
  assert.strictEqual(result.maxFlow, 23);
  assert.strictEqual(done.maxFlow, 23);
  assert.strictEqual(done.minCut.capacity, 23);
  assert.strictEqual(done.phase, 'done');
  assert.ok(done.minCut.edges.length > 0);
});

test('final flow obeys capacity constraints and conservation', () => {
  const done = finalFrame(G.SAMPLE);
  const capacity = Array.from({ length: G.SAMPLE.n }, () => Array(G.SAMPLE.n).fill(0));
  G.SAMPLE.edges.forEach((edge) => { capacity[edge.u][edge.v] += edge.capacity; });
  for (let u = 0; u < G.SAMPLE.n; ++u) {
    for (let v = 0; v < G.SAMPLE.n; ++v) {
      assert.ok(done.flow[u][v] <= capacity[u][v]);
      assert.ok(-done.flow[u][v] <= capacity[v][u]);
      assert.strictEqual(done.flow[u][v] + done.flow[v][u], 0);
    }
  }
  assert.strictEqual(done.flow[G.SAMPLE.source].reduce((sum, value) => sum + value, 0), done.maxFlow);
  assert.strictEqual(done.flow[G.SAMPLE.sink].reduce((sum, value) => sum + value, 0), -done.maxFlow);
  for (let v = 0; v < G.SAMPLE.n; ++v) {
    if (v === G.SAMPLE.source || v === G.SAMPLE.sink) continue;
    assert.strictEqual(done.flow[v].reduce((sum, value) => sum + value, 0), 0);
  }
});

test('disconnected sink finishes at zero flow and exposes the source-side cut', () => {
  const result = G.maxFlowFrames({
    n: 4, source: 0, sink: 3,
    edges: [{ u: 0, v: 1, capacity: 7 }, { u: 2, v: 3, capacity: 4 }],
  });
  const done = result.frames[result.frames.length - 1];
  assert.strictEqual(result.maxFlow, 0);
  assert.deepStrictEqual(done.minCut.sourceSide, [0, 1]);
  assert.deepStrictEqual(done.minCut.sinkSide, [2, 3]);
  assert.strictEqual(done.minCut.capacity, 0);
});

test('a later augmenting path can traverse a generated reverse residual edge', () => {
  const result = G.maxFlowFrames({
    n: 6, source: 0, sink: 5,
    edges: [
      { u: 0, v: 1, capacity: 3 }, { u: 0, v: 2, capacity: 2 },
      { u: 1, v: 3, capacity: 2 }, { u: 1, v: 4, capacity: 2 },
      { u: 2, v: 3, capacity: 2 }, { u: 3, v: 5, capacity: 2 },
      { u: 4, v: 5, capacity: 3 },
    ],
  });
  assert.strictEqual(result.maxFlow, 4);
  assert.ok(result.frames.some((frame) =>
    frame.phase === 'augment' && frame.augmentEdge.u === 3 && frame.augmentEdge.v === 1
  ));
});

test('frames include BFS, path, reverse-residual updates, bilingual text, and independent snapshots', () => {
  const { frames } = G.maxFlowFrames(G.SAMPLE);
  assert.ok(frames.some((frame) => frame.phase === 'bfs-start'));
  assert.ok(frames.some((frame) => frame.phase === 'path' && frame.path.length > 0));
  assert.ok(frames.some((frame) => frame.phase === 'augment' && frame.augmentEdge));
  frames.forEach((frame) => assert.ok(frame.msg.zh && frame.msg.en));
  assert.strictEqual(frames[0].maxFlow, 0);
  assert.ok(frames[0].flow.every((row) => row.every((value) => value === 0)));
  assert.notStrictEqual(frames[0].flow, frames[frames.length - 1].flow);
});

test('parseInput clamps boundaries, aggregates parallel edges, and reports malformed data', () => {
  const parsed = G.parseInput('99', '0-1:3,0->1:4,1-1:9,2-10:1,junk,2-3:-4', '0', '9');
  assert.strictEqual(parsed.n, 10);
  assert.deepStrictEqual(parsed.edges, [{ u: 0, v: 1, capacity: 7 }]);
  assert.ok(parsed.warnings.length >= 5);
  assert.strictEqual(parsed.errors.length, 0);
  const invalid = G.parseInput('4', '0-1:2', '2', '2');
  assert.ok(invalid.errors.some((error) => /different/.test(error.en)));
  const nonIntegers = G.parseInput('4.5', '0-1:2', '1x', '3');
  assert.strictEqual(nonIntegers.n, 2);
  assert.ok(nonIntegers.errors.length >= 2);
});

test('difficulty presets provide two distinct input levels without shared mutation', () => {
  const normal = G.presetForDifficulty('normal');
  const challenge = G.presetForDifficulty('edge');
  assert.strictEqual(normal.n, 6);
  assert.strictEqual(challenge.n, 8);
  normal.edges[0].capacity = -1;
  assert.notStrictEqual(G.SAMPLE.edges[0].capacity, -1);
});

test('difficulty-aware random input is valid, reproducible, and always has an s-to-t path', () => {
  const sequence = [0.01, 0.91, 0.25, 0.73, 0.42];
  const makeRandom = () => {
    let index = 0;
    return () => sequence[index++ % sequence.length];
  };
  const normal = G.randomConfig('normal', makeRandom());
  const repeat = G.randomConfig('normal', makeRandom());
  const challenge = G.randomConfig('edge', makeRandom());
  assert.deepStrictEqual(normal, repeat);
  assert.strictEqual(normal.n, 6);
  assert.strictEqual(challenge.n, 8);
  assert.ok(challenge.edges.length > normal.edges.length);
  [normal, challenge].forEach((config) => {
    const parsed = G.parseInput(config.n, config.edges.map((edge) => edge.u + '-' + edge.v + ':' + edge.capacity).join(','), config.source, config.sink);
    assert.strictEqual(parsed.errors.length, 0);
    assert.ok(G.maxFlowFrames(config).maxFlow > 0);
  });
});

test('equal source and sink produces one explicit invalid frame', () => {
  const result = G.maxFlowFrames({ n: 3, source: 1, sink: 1, edges: [] });
  assert.strictEqual(result.frames.length, 1);
  assert.strictEqual(result.frames[0].phase, 'invalid');
  assert.strictEqual(result.maxFlow, 0);
});
