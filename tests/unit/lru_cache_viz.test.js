const test = require('node:test');
const assert = require('node:assert/strict');
const { buildFrames } = require('../../js/lru_cache_viz');

test('starts with an empty cache frame carrying the capacity', () => {
  const { frames, capacity } = buildFrames(3, []);
  assert.equal(capacity, 3);
  assert.equal(frames.length, 1);
  assert.deepEqual(frames[0].order, []);
  assert.equal(frames[0].status, 'start');
  assert.equal(frames[0].hits, 0);
  assert.equal(frames[0].misses, 0);
});

test('one frame per access, front = most-recently-used', () => {
  const { frames } = buildFrames(3, [1, 2, 3]);
  assert.equal(frames.length, 4); // start + 3 accesses
  assert.deepEqual(frames[1].order, [1]);
  assert.deepEqual(frames[2].order, [2, 1]);
  assert.deepEqual(frames[3].order, [3, 2, 1]);
  assert.ok(frames.slice(1).every((f) => f.status === 'miss'));
});

test('a hit promotes the key to the front and is counted', () => {
  const { frames } = buildFrames(3, [1, 2, 1]);
  const hit = frames[3];
  assert.equal(hit.status, 'hit');
  assert.deepEqual(hit.order, [1, 2]);
  assert.equal(hit.hits, 1);
  assert.equal(hit.misses, 2);
});

test('a full cache evicts the least-recently-used key', () => {
  // cap 2: 1,2 -> [2,1]; access 1 -> [1,2]; access 3 evicts LRU (2)
  const { frames } = buildFrames(2, [1, 2, 1, 3]);
  const evict = frames[frames.length - 1];
  assert.equal(evict.status, 'evict');
  assert.equal(evict.evicted, 2);
  assert.deepEqual(evict.order, [3, 1]);
  assert.ok(!evict.order.includes(2));
});

test('order never exceeds capacity', () => {
  const { frames } = buildFrames(3, [1, 2, 3, 4, 5, 6, 7]);
  for (const f of frames) assert.ok(f.order.length <= 3);
});

test('capacity is clamped to at least 1', () => {
  const { capacity, frames } = buildFrames(0, [1, 2]);
  assert.equal(capacity, 1);
  assert.deepEqual(frames[frames.length - 1].order, [2]);
});

test('every frame carries a bilingual message', () => {
  const { frames } = buildFrames(2, [1, 2, 1, 3]);
  for (const f of frames) {
    assert.ok(f.msg.zh && f.msg.en, 'expected zh + en message');
  }
});
