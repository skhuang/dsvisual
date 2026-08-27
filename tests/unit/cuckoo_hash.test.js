const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../../js/viz/viz_cuckoo.js');

test('cuckoo insert relocates a colliding key to its other table', () => {
  const tables = [new Array(C.SIZE).fill(null), new Array(C.SIZE).fill(null)];
  const first = C.insert(1, tables);
  const second = C.insert(12, first.tables); // h1(1) === h1(12) === 1

  assert.equal(second.ok, true);
  assert.equal(second.tables[0][C.h1(12)], 12);
  assert.equal(second.tables[1][C.h2(1)], 1);
  assert.equal(second.path.length, 2);
  assert.equal(C.find(1, second.tables).found, true);
  assert.equal(C.find(12, second.tables).found, true);
  assert.equal(C.find(99, second.tables).found, false);
});
