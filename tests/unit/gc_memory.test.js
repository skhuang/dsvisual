const test = require('node:test');
const assert = require('node:assert');
const V = require('../../js/gc_memory_viz.js');

test('mark-sweep frees only unreachable objects', () => {
  const { frames } = V.markSweepFrames();
  const last = frames[frames.length - 1];
  const byId = {}; last.heap.forEach((o) => { byId[o.id] = o; });
  assert.strictEqual(byId[6].free, true);
  [0, 1, 2, 3, 4, 5].forEach((id) => assert.strictEqual(byId[id].free, false, 'id ' + id + ' kept'));
  assert.ok(frames.some((f) => f.phase === 'mark'));
  assert.ok(frames.some((f) => f.phase && f.phase.indexOf('sweep') === 0));
});

test('reference counting frees acyclic garbage but leaks a cycle', () => {
  const { frames } = V.refCountFrames();
  const last = frames[frames.length - 1];
  const byId = {}; last.objs.forEach((o) => { byId[o.id] = o; });
  assert.strictEqual(byId['A'].free, true);
  assert.strictEqual(byId['B'].free, true);
  assert.strictEqual(byId['D'].free, false);
  assert.strictEqual(byId['E'].free, false);
});

test('buddy system conserves total space and coalesces', () => {
  const { frames } = V.buddyFrames();
  const last = frames[frames.length - 1];
  const totalCovered = last.blocks.reduce((s, b) => s + b.size, 0);
  assert.strictEqual(totalCovered, last.total);
  const allocated = last.blocks.filter((b) => !b.free).reduce((s, b) => s + b.size, 0);
  assert.strictEqual(allocated, 48);
  assert.ok(frames.some((f) => /coalesce/.test(f.action || '')));
});

test('gcMemoryFrames dispatches by mode', () => {
  assert.ok(V.gcMemoryFrames('mark-sweep').frames.length > 0);
  assert.ok(V.gcMemoryFrames('refcount').frames.length > 0);
  assert.ok(V.gcMemoryFrames('buddy').frames.length > 0);
  assert.ok(V.gcMemoryFrames('unknown').frames.length > 0);
});
