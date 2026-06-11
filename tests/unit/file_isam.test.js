const test = require('node:test');
const assert = require('node:assert');
const V = require('../../js/file_isam_viz.js');

test('buildIsam partitions sorted keys into blocks with an index', () => {
  const isam = V.buildIsam([30, 10, 50, 20, 40, 70, 60], 3);
  assert.strictEqual(isam.blocks.length, 3);
  assert.deepStrictEqual(isam.blocks[0].keys, [10, 20, 30]);
  assert.deepStrictEqual(isam.index.map((e) => e.minKey), [10, 40, 70]);
});

test('searchFrames finds a present key in the right block', () => {
  const isam = V.buildIsam([10, 20, 30, 40, 50, 60, 70], 3);
  const r = V.searchFrames(isam, 50);
  assert.strictEqual(r.found, true);
  assert.strictEqual(r.block, 1);
  assert.ok(r.frames.some((f) => f.phase === 'found'));
});

test('searchFrames reports not-found for an absent key', () => {
  const isam = V.buildIsam([10, 20, 30, 40, 50, 60, 70], 3);
  const r = V.searchFrames(isam, 55);
  assert.strictEqual(r.found, false);
  assert.ok(r.frames.some((f) => f.phase === 'notfound'));
});

test('empty key set builds one empty block', () => {
  const isam = V.buildIsam([], 3);
  assert.strictEqual(isam.blocks.length, 1);
  assert.deepStrictEqual(isam.blocks[0].keys, []);
});
