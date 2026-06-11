const test = require('node:test');
const assert = require('node:assert');
const V = require('../../js/game_tree_viz.js');

function bruteMinimax(node, isMax) {
  if (node.leaf) return node.value;
  const vals = node.children.map((c) => bruteMinimax(c, !isMax));
  return isMax ? Math.max(...vals) : Math.min(...vals);
}

test('buildGameTree: leaves placed left-to-right, root is MAX', () => {
  const { root, depth } = V.buildGameTree([3, 5, 6, 9], 2);
  assert.strictEqual(root.isMax, true);
  assert.ok(depth >= 2);
  const leaves = [];
  (function walk(n) { if (n.leaf) leaves.push(n.value); else n.children.forEach(walk); })(root);
  assert.deepStrictEqual(leaves.slice(0, 4), [3, 5, 6, 9]);
});

test('minimax value equals brute force, with and without alpha-beta', () => {
  const trees = [[3, 5, 6, 9, 1, 2, 0, -1], [5, 2, 8, 1], [7]];
  for (const leaves of trees) {
    const { root } = V.buildGameTree(leaves, 2);
    const brute = bruteMinimax(root, true);
    assert.strictEqual(V.minimaxFrames(root, false).value, brute, 'plain minimax');
    const { root: root2 } = V.buildGameTree(leaves, 2);
    assert.strictEqual(V.minimaxFrames(root2, true).value, brute, 'alpha-beta same value');
  }
});

test('alpha-beta produces at least one prune frame on a prunable tree', () => {
  const { root } = V.buildGameTree([3, 5, 6, 9, 1, 2, 0, -1], 2);
  const { frames } = V.minimaxFrames(root, true);
  assert.ok(frames.some((f) => f.type === 'prune' && f.pruned.length > 0));
});

test('frames are non-empty and end with a root return', () => {
  const { root } = V.buildGameTree([3, 5], 2);
  const { frames } = V.minimaxFrames(root, false);
  assert.ok(frames.length > 0);
  assert.strictEqual(frames[frames.length - 1].type, 'return');
  assert.strictEqual(frames[frames.length - 1].id, root.id);
});
