const test = require('node:test');
const assert = require('node:assert');
const P = require('../../js/persistent_segment_tree_viz.js');

function sumOf(arr, l, r) {
  let s = 0;
  for (let i = l; i <= r; i++) s += arr[i];
  return s;
}

test('v0 root sum equals the original array sum', () => {
  const config = P.presetForDifficulty('normal');
  const result = P.buildFrames(config);
  assert.strictEqual(result.versions[0].rootSum, config.arr.reduce((a, b) => a + b, 0));
});

test('old versions stay queryable and unchanged after later updates (persistence invariant)', () => {
  const config = P.presetForDifficulty('normal');
  const result = P.buildFrames(config);
  const arr = config.arr.slice();
  assert.strictEqual(result.resultV0, sumOf(arr, result.query.l, result.query.r));
  assert.ok(result.invariantHolds);
});

test('each update allocates only O(log n) new nodes and shares the rest', () => {
  const config = P.presetForDifficulty('normal'); // n = 8, so a path has 4 nodes (1 leaf + 3 internal)
  const result = P.buildFrames(config);
  assert.strictEqual(result.versions[0].newNodes, 15); // full initial build: all 15 nodes are new
  assert.strictEqual(result.versions[0].sharedNodes, 0);
  assert.strictEqual(result.versions[1].newNodes, 4);
  assert.strictEqual(result.versions[1].sharedNodes, 11);
  assert.strictEqual(result.versions[2].newNodes, 4);
  assert.strictEqual(result.versions[2].sharedNodes, 11);
  // total distinct nodes across all versions is far below 3 full copies (45)
  const distinctIds = new Set();
  result.versions.forEach((v) => v.posToId.forEach((id) => { if (id) distinctIds.add(id); }));
  assert.ok(distinctIds.size < 45);
});

test('updating the same index twice (edge preset) still preserves every earlier version', () => {
  const config = P.presetForDifficulty('edge');
  const result = P.buildFrames(config);
  assert.ok(result.invariantHolds);
  assert.notStrictEqual(result.versions[0].rootSum, result.versions[1].rootSum);
  assert.notStrictEqual(result.versions[1].rootSum, result.versions[2].rootSum);
});

test('full-range query matches the true array sum for every version', () => {
  const config = { arr: [1, 2, 3, 4], u1: { idx: 0, val: 10 }, u2: { idx: 3, val: 40 }, q: { l: 0, r: 3 } };
  const result = P.buildFrames(config);
  assert.strictEqual(result.resultV0, 1 + 2 + 3 + 4);
  assert.strictEqual(result.resultV2, 10 + 2 + 3 + 40);
});

test('frames include descend, shared-reuse, rebuild, and result phases with bilingual messages', () => {
  const result = P.buildFrames(P.presetForDifficulty('normal'));
  const phases = new Set(result.frames.map((f) => f.phase));
  ['build-v0', 'descend', 'leaf', 'shared', 'rebuild', 'version-ready', 'result'].forEach((phase) => {
    assert.ok(phases.has(phase), 'missing phase: ' + phase);
  });
  result.frames.forEach((frame) => assert.ok(frame.msg.zh && frame.msg.en));
});

test('parseInput clamps out-of-range indices/values and reports warnings', () => {
  const parsed = P.parseInput('1,2,3,4,5,6,7,8,9,10', '0:5000', '99:2', '0,100');
  assert.strictEqual(parsed.arr.length, 8); // clamped to MAX_N
  assert.strictEqual(parsed.u1.val, 999);
  assert.strictEqual(parsed.u2.idx, 7);
  assert.ok(parsed.warnings.length >= 2);
  assert.strictEqual(parsed.errors.length, 0);
});

test('parseInput falls back to defaults on malformed update fields and empty array', () => {
  const parsed = P.parseInput('', 'nonsense', '3:9', '0,2');
  assert.deepStrictEqual(parsed.arr, P.DEFAULT_ARR);
  assert.deepStrictEqual(parsed.u1, { idx: 0, val: 0 });
  assert.ok(parsed.warnings.some((w) => /idx:val/.test(w.en)));
});

test('parseInput swaps a reversed query range instead of erroring', () => {
  const parsed = P.parseInput('1,2,3,4', '0:1', '1:2', '3,0');
  assert.deepStrictEqual(parsed.q, { l: 0, r: 3 });
});

test('randomConfig is reproducible with an injected RNG and always yields a valid, checkable config', () => {
  const sequence = [0.1, 0.5, 0.9, 0.2, 0.4, 0.6, 0.8, 0.05];
  const makeRandom = () => { let i = 0; return () => sequence[i++ % sequence.length]; };
  const a = P.randomConfig('normal', makeRandom());
  const b = P.randomConfig('normal', makeRandom());
  assert.deepStrictEqual(a, b);
  const result = P.buildFrames(a);
  assert.ok(result.invariantHolds);
  assert.ok(a.arr.length >= 1 && a.arr.length <= P.MAX_N);
});

test('difficulty presets are independent objects (no shared mutation across calls)', () => {
  const normal1 = P.presetForDifficulty('normal');
  normal1.arr[0] = 999;
  const normal2 = P.presetForDifficulty('normal');
  assert.notStrictEqual(normal2.arr[0], 999);
});
