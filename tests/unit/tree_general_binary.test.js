const test = require('node:test');
const assert = require('node:assert');
const V = require('../../js/tree_general_binary_viz.js');

test('parseGeneralTree builds parent→children with correct root', () => {
  const g = V.parseGeneralTree('A:B,C,D;B:E,F;C:G');
  assert.strictEqual(g.root, 'A');
  assert.deepStrictEqual(g.children['A'], ['B', 'C', 'D']);
  assert.deepStrictEqual(g.children['B'], ['E', 'F']);
  assert.deepStrictEqual(g.children['G'] || [], []);
});

test('toBinary uses left=first-child, right=next-sibling', () => {
  const g = V.parseGeneralTree('A:B,C,D;B:E,F');
  const bin = V.toBinary(g);
  assert.strictEqual(bin.id, 'A');
  assert.strictEqual(bin.left.id, 'B');
  assert.strictEqual(bin.left.left.id, 'E');
  assert.strictEqual(bin.left.right.id, 'C');
  assert.strictEqual(bin.left.left.right.id, 'F');
  assert.strictEqual(bin.left.right.right.id, 'D');
  assert.strictEqual(bin.left.left.left, null);
});

test('convertFrames is non-empty and final frame links every non-root node once', () => {
  const g = V.parseGeneralTree('A:B,C;B:D');
  const { frames } = V.convertFrames(g);
  assert.ok(frames.length >= 1);
  const last = frames[frames.length - 1];
  assert.ok(Array.isArray(last.links));
  assert.strictEqual(last.links.length, 3);
});

test('single-node tree', () => {
  const g = V.parseGeneralTree('A');
  const bin = V.toBinary(g);
  assert.strictEqual(bin.id, 'A');
  assert.strictEqual(bin.left, null);
  assert.strictEqual(bin.right, null);
});
