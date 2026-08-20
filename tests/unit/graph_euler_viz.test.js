const test = require('node:test');
const assert = require('node:assert');
const G = require('../../js/graph_euler_viz.js');

// A trail is a valid Euler trail when consecutive vertices can be matched to
// distinct edges that between them consume the edge multiset exactly once.
function assertEulerTrail(config, trail) {
  assert.strictEqual(trail.length, config.edges.length + 1,
    'trail must contain E+1 vertices, got ' + trail.length);
  const unused = config.edges.map((edge) => ({ u: edge.u, v: edge.v, taken: false }));
  for (let i = 0; i + 1 < trail.length; ++i) {
    const a = trail[i], b = trail[i + 1];
    const match = unused.find((edge) => !edge.taken &&
      ((edge.u === a && edge.v === b) || (edge.u === b && edge.v === a)));
    assert.ok(match, 'no unused edge for step ' + a + '->' + b);
    match.taken = true;
  }
  assert.ok(unused.every((edge) => edge.taken), 'every edge must be used exactly once');
}

test('all-even connected graph yields an Euler circuit that returns to its start', () => {
  const result = G.eulerFrames(G.SAMPLE);
  assert.strictEqual(result.verdict, 'circuit');
  assert.strictEqual(result.complete, true);
  assertEulerTrail(G.SAMPLE, result.trail);
  assert.strictEqual(result.trail[0], result.trail[result.trail.length - 1]);
  assert.deepStrictEqual(result.odd, []);
});

test('exactly two odd vertices yield an Euler path that ends at the other odd vertex', () => {
  const result = G.eulerFrames(G.CHALLENGE);
  assert.strictEqual(result.verdict, 'path');
  assert.strictEqual(result.complete, true);
  assert.deepStrictEqual(result.odd, [0, 5]);
  assertEulerTrail(G.CHALLENGE, result.trail);
  const ends = [result.trail[0], result.trail[result.trail.length - 1]].sort();
  assert.deepStrictEqual(ends, [0, 5]);
});

test('the challenge preset actually gets stuck and resumes — this is why the stack exists', () => {
  const phases = G.eulerFrames(G.CHALLENGE).frames.map((frame) => frame.phase);
  const firstBacktrack = phases.indexOf('backtrack');
  assert.ok(firstBacktrack > 0, 'expected the walk to get stuck at least once');
  assert.ok(phases.slice(firstBacktrack).indexOf('advance') > 0,
    'expected the walk to resume from the stack after getting stuck');
});

test('Konigsberg has four odd vertices, so Euler answers "no"', () => {
  const result = G.eulerFrames(G.KONIGSBERG);
  assert.deepStrictEqual(G.degreesOf(4, G.KONIGSBERG.edges), [3, 3, 5, 3]);
  assert.strictEqual(result.verdict, 'none');
  assert.strictEqual(result.reason, 'odd');
  assert.deepStrictEqual(result.odd, [0, 1, 2, 3]);
  assert.deepStrictEqual(result.trail, []);
  assert.strictEqual(result.frames[result.frames.length - 1].phase, 'verdict');
});

test('even degrees are not sufficient: a disconnected edge set has no circuit', () => {
  const result = G.eulerFrames(G.DISCONNECTED);
  assert.deepStrictEqual(result.odd, []);
  assert.strictEqual(result.verdict, 'none');
  assert.strictEqual(result.reason, 'disconnected');
  assert.strictEqual(G.edgesConnected(6, G.DISCONNECTED.edges, G.degreesOf(6, G.DISCONNECTED.edges)), false);
});

test('isolated vertices do not break connectivity', () => {
  // Vertex 3 has no edge at all, so it cannot appear in a trail and must not
  // count against the connectivity test.
  const config = { n: 4, start: 0, edges: [{ u: 0, v: 1 }, { u: 1, v: 2 }, { u: 2, v: 0 }] };
  const result = G.eulerFrames(config);
  assert.strictEqual(result.verdict, 'circuit');
  assertEulerTrail(config, result.trail);
});

test('an Euler path started at the wrong vertex is corrected to an odd vertex', () => {
  const info = G.classify(G.CHALLENGE.n, G.CHALLENGE.edges);
  assert.strictEqual(G.resolveStart(2, info), 0);       // 2 is even -> corrected
  assert.strictEqual(G.resolveStart(5, info), 5);       // 5 is odd  -> kept
  const result = G.eulerFrames(Object.assign({}, G.CHALLENGE, { start: 2 }));
  assert.strictEqual(result.start, 0);
  assert.strictEqual(result.complete, true);
  assertEulerTrail(G.CHALLENGE, result.trail);
  const verdictFrame = result.frames.find((frame) => frame.phase === 'verdict');
  assert.ok(/not odd/.test(verdictFrame.msg.en));
});

test('a circuit start with no edges falls back to a vertex that has one', () => {
  const config = { n: 4, start: 3, edges: [{ u: 0, v: 1 }, { u: 1, v: 2 }, { u: 2, v: 0 }] };
  const result = G.eulerFrames(config);
  assert.strictEqual(result.start, 0);
  assert.strictEqual(result.complete, true);
});

test('parseInput keeps parallel edges, clamps n, and reports malformed data', () => {
  const parsed = G.parseInput('99', '0-2,0-2,0-3,1-1,2-99,junk', '0');
  assert.strictEqual(parsed.n, 10);
  // The two 0-2 bridges must both survive; merging them would change the degrees.
  assert.deepStrictEqual(parsed.edges, [{ u: 0, v: 2 }, { u: 0, v: 2 }, { u: 0, v: 3 }]);
  assert.strictEqual(parsed.errors.length, 0);
  assert.ok(parsed.warnings.length >= 3);

  const badStart = G.parseInput('4', '0-1', '9');
  assert.strictEqual(badStart.start, 0);
  assert.ok(badStart.errors.some((error) => /Start vertex/.test(error.en)));

  const noEdges = G.parseInput('4', '', '0');
  assert.deepStrictEqual(noEdges.edges, []);
  assert.ok(noEdges.warnings.some((warning) => /no Euler circuit/.test(warning.en)));

  const nonInteger = G.parseInput('4.5', '0-1', '0');
  assert.strictEqual(nonInteger.n, 2);
  assert.ok(nonInteger.errors.length >= 1);
});

test('a parsed Konigsberg round-trips to the same four odd degrees', () => {
  const parsed = G.parseInput('4', '0-2,0-2,0-3,1-2,1-2,1-3,2-3', '0');
  assert.strictEqual(parsed.errors.length, 0);
  assert.strictEqual(parsed.edges.length, 7);
  assert.deepStrictEqual(G.degreesOf(4, parsed.edges), [3, 3, 5, 3]);
  assert.strictEqual(G.eulerFrames(parsed).verdict, 'none');
});

test('difficulty presets provide two distinct levels without shared mutation', () => {
  const normal = G.presetForDifficulty('normal');
  const challenge = G.presetForDifficulty('edge');
  assert.strictEqual(normal.n, 5);
  assert.strictEqual(challenge.n, 6);
  assert.strictEqual(G.eulerFrames(normal).verdict, 'circuit');
  assert.strictEqual(G.eulerFrames(challenge).verdict, 'path');
  normal.edges[0].u = 99;
  assert.strictEqual(G.SAMPLE.edges[0].u, 0);
});

test('difficulty-aware random input is reproducible and always fully walkable', () => {
  const sequence = [0.01, 0.91, 0.25, 0.73, 0.42, 0.66];
  const makeRandom = () => {
    let index = 0;
    return () => sequence[index++ % sequence.length];
  };
  const normal = G.randomConfig('normal', makeRandom());
  const repeat = G.randomConfig('normal', makeRandom());
  assert.deepStrictEqual(normal, repeat);
  const challenge = G.randomConfig('edge', makeRandom());
  assert.strictEqual(normal.n, 5);
  assert.strictEqual(challenge.n, 7);
  [normal, challenge].forEach((config) => {
    const parsed = G.parseInput(config.n, config.edges.map((edge) => edge.u + '-' + edge.v).join(','), config.start);
    assert.strictEqual(parsed.errors.length, 0);
    const result = G.eulerFrames(config);
    assert.notStrictEqual(result.verdict, 'none');
    assert.strictEqual(result.complete, true);
    assertEulerTrail(config, result.trail);
  });
});

test('random input stays walkable across many different draws', () => {
  for (let seed = 0; seed < 60; ++seed) {
    const sequence = [(seed % 10) / 10, 0.37, 0.82, 0.05, 0.6, 0.93];
    ['normal', 'edge'].forEach((difficulty) => {
      let index = 0;
      const config = G.randomConfig(difficulty, () => sequence[index++ % sequence.length]);
      const result = G.eulerFrames(config);
      assert.notStrictEqual(result.verdict, 'none', 'seed ' + seed + ' / ' + difficulty);
      assert.strictEqual(result.complete, true, 'seed ' + seed + ' / ' + difficulty);
      assertEulerTrail(config, result.trail);
    });
  }
});

test('frames are bilingual, independent snapshots that start empty and end full', () => {
  const { frames } = G.eulerFrames(G.SAMPLE);
  assert.ok(frames.some((frame) => frame.phase === 'degrees'));
  assert.ok(frames.some((frame) => frame.phase === 'verdict'));
  assert.ok(frames.some((frame) => frame.phase === 'advance' && frame.edgeTaken));
  assert.strictEqual(frames[frames.length - 1].phase, 'done');
  frames.forEach((frame) => assert.ok(frame.msg.zh && frame.msg.en));
  assert.ok(frames[0].used.every((flag) => flag === false));
  assert.ok(frames[frames.length - 1].used.every((flag) => flag === true));
  // Snapshots must not alias each other, or scrubbing backwards would lie.
  assert.notStrictEqual(frames[0].used, frames[frames.length - 1].used);
  assert.notStrictEqual(frames[0].stack, frames[1].stack);
});

test('the walk order recorded on edges differs from the final trail order', () => {
  // Reversing the output list is not cosmetic: on the challenge graph the order
  // edges were walked is genuinely not the order they appear in the answer.
  const result = G.eulerFrames(G.CHALLENGE);
  const done = result.frames[result.frames.length - 1];
  assert.ok(done.takenAt.every((order) => order >= 1));
  const walkOrder = done.takenAt.slice().sort((a, b) => a - b);
  assert.deepStrictEqual(walkOrder, G.CHALLENGE.edges.map((edge, index) => index + 1));
  assert.notDeepStrictEqual(done.takenAt, walkOrder);
});

test('invalid input produces exactly one explicit invalid frame', () => {
  const result = G.eulerFrames({ n: 1, start: 0, edges: [] });
  assert.strictEqual(result.frames.length, 1);
  assert.strictEqual(result.frames[0].phase, 'invalid');
  assert.strictEqual(result.verdict, 'none');
  const badStart = G.eulerFrames({ n: 4, start: 9, edges: [{ u: 0, v: 1 }] });
  assert.strictEqual(badStart.frames[0].phase, 'invalid');
});

test('an edgeless graph is reported as such instead of looping forever', () => {
  const result = G.eulerFrames({ n: 3, start: 0, edges: [] });
  assert.strictEqual(result.verdict, 'none');
  assert.strictEqual(result.reason, 'empty');
  assert.strictEqual(result.frames[result.frames.length - 1].phase, 'verdict');
});
