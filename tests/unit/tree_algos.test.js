const test = require('node:test');
const assert = require('node:assert/strict');
const { insertBST, insertAVL, getHeight } = require('../../js/algos/tree_algos');

test('insertBST builds an ordered binary tree', () => {
  let root = null;
  for (const v of [5, 3, 8, 1]) root = insertBST(root, v);
  assert.equal(root.val, 5);
  assert.equal(root.left.val, 3);
  assert.equal(root.left.left.val, 1);
  assert.equal(root.right.val, 8);
});

test('insertAVL keeps the tree balanced (height stays minimal)', () => {
  let root = null;
  for (const v of [1, 2, 3]) root = insertAVL(root, v); // would be a chain without balancing
  assert.equal(root.val, 2);          // rotated to the middle key
  assert.equal(getHeight(root), 2);
});
