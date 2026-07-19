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

test('pointer reversal marks all reachable nodes and restores every link', () => {
  const { frames } = V.pointerReversalFrames();
  const last = frames[frames.length - 1];
  const byId = {}; last.nodes.forEach((n) => { byId[n.id] = n; });
  // all four reachable nodes marked
  ['R', 'S', 'n1', 'n2'].forEach((id) => assert.strictEqual(byId[id].mark, true, id + ' marked'));
  // every link restored to its home target (no link left reversed)
  last.nodes.forEach((n) => {
    assert.strictEqual(n.dRev, false, n.id + ' dlink restored');
    assert.strictEqual(n.rRev, false, n.id + ' rlink restored');
  });
  assert.strictEqual(byId['R'].dlink, 'n1');
  assert.strictEqual(byId['R'].rlink, 'S');
  assert.strictEqual(byId['n1'].rlink, 'n2');
  // the intermediate walk actually reversed something (proves it's not a no-op)
  assert.ok(frames.some((f) => f.nodes.some((n) => n.dRev || n.rRev)), 'some frame shows a reversed link');
});

test('gcMemoryFrames dispatches pointer-reversal', () => {
  assert.ok(V.gcMemoryFrames('pointer-reversal').frames.length > 0);
});

test('compaction slides live blocks contiguous and rewrites links to new addresses', () => {
  const { frames } = V.compactFrames();
  const last = frames[frames.length - 1];
  const byId = {}; last.blocks.forEach((b) => { byId[b.id] = b; });
  // live blocks relocated to contiguous addresses 1,3,5 in order
  assert.strictEqual(byId['A'].addr, 1);
  assert.strictEqual(byId['C'].addr, 3);
  assert.strictEqual(byId['D'].addr, 5);
  // links rewritten to targets' new addresses: A->D(5), D->A(1)
  assert.strictEqual(byId['A'].link, 5);
  assert.strictEqual(byId['D'].link, 1);
  // all three passes represented
  [1, 2, 3].forEach((p) => assert.ok(frames.some((f) => f.pass === p), 'pass ' + p + ' present'));
});

test('gcMemoryFrames dispatches compact', () => {
  assert.ok(V.gcMemoryFrames('compact').frames.length > 0);
});
