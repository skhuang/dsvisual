const test = require('node:test');
const assert = require('node:assert');
const V = require('../../js/recursion_viz.js');
function fact(n) { let f = 1; for (let i = 2; i <= n; i++) f *= i; return f; }

test('unknown example returns null', () => {
  assert.strictEqual(V.recursionTrace('nope', {}), null);
});

test('fibonacci result + trace consistency', () => {
  const { result, nodes, frames } = V.recursionTrace('fibonacci', { n: 6 });
  assert.strictEqual(result, 8);
  assert.strictEqual(V.recursionTrace('fibonacci', { n: 5 }).result, 5);
  assert.ok(frames.length > 0);
  assert.ok(nodes.every((n) => n.returned === true));
  assert.strictEqual(nodes[0].parentId, null);
  assert.strictEqual(frames.filter((f) => f.event === 'call').length, nodes.length);
  assert.strictEqual(frames.filter((f) => f.event === 'return').length, nodes.length);
});

test('reverse string', () => {
  assert.strictEqual(V.recursionTrace('reverse', { text: 'ABCDE' }).result, 'EDCBA');
  assert.strictEqual(V.recursionTrace('reverse', { text: '' }).result, '');
});

test('permutations produce n! unique valid perms; leaves == n!', () => {
  const { result, nodes } = V.recursionTrace('permutations', { text: 'ABC' });
  assert.strictEqual(result.length, fact(3));
  assert.strictEqual(new Set(result).size, fact(3));
  result.forEach((p) => assert.strictEqual(p.split('').sort().join(''), 'ABC'));
  const parents = new Set(nodes.map((n) => n.parentId));
  const leaves = nodes.filter((n) => !parents.has(n.id));
  assert.strictEqual(leaves.length, fact(3));
});

test('binary search hit + miss + sorts unsorted input', () => {
  const arr = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];
  assert.strictEqual(V.recursionTrace('binary-search', { arr, target: 23 }).result, 5);
  assert.strictEqual(V.recursionTrace('binary-search', { arr, target: 99 }).result, -1);
  assert.strictEqual(V.recursionTrace('binary-search', { arr: [5, 1, 3], target: 3 }).result, 1);
});

test('quicksort returns sorted', () => {
  const { result, nodes } = V.recursionTrace('quicksort', { arr: [5, 3, 8, 1, 9, 2, 7, 4] });
  assert.deepStrictEqual(result, [1, 2, 3, 4, 5, 7, 8, 9]);
  assert.ok(nodes.every((n) => n.returned === true));
});

test('all examples: root parentId null, all returned, root returns last', () => {
  const inputs = { fibonacci: { n: 4 }, reverse: { text: 'abc' }, permutations: { text: 'ab' }, 'binary-search': { arr: [1, 2, 3], target: 2 }, quicksort: { arr: [3, 1, 2] } };
  for (const ex of V.EXAMPLES) {
    const { frames, nodes } = V.recursionTrace(ex, inputs[ex]);
    assert.ok(nodes.length > 0, ex);
    assert.strictEqual(nodes[0].parentId, null, ex);
    assert.ok(nodes.every((n) => n.returned), ex);
    const last = frames[frames.length - 1];
    assert.strictEqual(last.event, 'return', ex);
    assert.strictEqual(last.stack.length, 1, ex);
    assert.strictEqual(last.stack[0], 0, ex);
  }
});

test('EXAMPLES and DEFAULTS exported and aligned', () => {
  assert.deepStrictEqual(V.EXAMPLES, ['fibonacci', 'reverse', 'permutations', 'binary-search', 'quicksort']);
  V.EXAMPLES.forEach((ex) => assert.ok(V.DEFAULTS[ex], ex));
});
