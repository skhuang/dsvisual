const test = require('node:test');
const assert = require('node:assert/strict');
const H = require('../../js/viz/viz_hyperloglog.js');

test('HyperLogLog updates one register and ignores a duplicate for true cardinality', () => {
  const first = H.addItem('cat', H.makeState());
  const info = H.bucketAndRank('cat');
  assert.equal(first.items.size, 1);
  assert.equal(first.registers[info.bucket], info.rank);

  const duplicate = H.addItem('cat', first);
  assert.equal(duplicate.items.size, 1);
  assert.equal(duplicate.last.duplicate, true);
  assert.equal(duplicate.registers[info.bucket], info.rank);
});

test('HyperLogLog estimate is zero for untouched registers and grows with distinct values', () => {
  let state = H.makeState();
  assert.equal(H.estimate(state.registers), 0);
  for (const word of ['cat', 'dog', 'bird', 'fish', 'otter', 'fox']) state = H.addItem(word, state);
  assert.ok(H.estimate(state.registers) > 0);
});
