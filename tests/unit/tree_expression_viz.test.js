const test = require('node:test');
const assert = require('node:assert/strict');
const { tokenizePostfix, buildExprTreeFrames, evalExprTree } = require('../../js/tree_expression_viz');

function countNodes(n) { return n ? 1 + countNodes(n.left) + countNodes(n.right) : 0; }
function eachNode(n, fn) { if (!n) return; fn(n); eachNode(n.left, fn); eachNode(n.right, fn); }

test('tokenizePostfix splits on whitespace', () => {
  assert.deepEqual(tokenizePostfix('3 4 + 5 *'), ['3', '4', '+', '5', '*']);
  assert.deepEqual(tokenizePostfix('  A B C +  *  '), ['A', 'B', 'C', '+', '*']);
});

test('numeric postfix builds a tree that evaluates correctly', () => {
  const { root } = buildExprTreeFrames(tokenizePostfix('3 4 + 5 *'));
  assert.equal(evalExprTree(root), 35);
  const { root: r2 } = buildExprTreeFrames(tokenizePostfix('6 2 / 1 -'));
  assert.equal(evalExprTree(r2), 2);
});

test('operators are internal (2 children), operands are leaves; node count = token count', () => {
  const tokens = tokenizePostfix('3 4 + 5 *');
  const { root } = buildExprTreeFrames(tokens);
  assert.equal(countNodes(root), tokens.length);
  eachNode(root, (n) => {
    const op = ['+', '-', '*', '/'].includes(n.val);
    if (op) { assert.ok(n.left && n.right, 'operator must have 2 children'); }
    else { assert.equal(n.left, null); assert.equal(n.right, null); }
  });
});

test('frames build up to a single-root forest and carry bilingual msg', () => {
  const { frames } = buildExprTreeFrames(tokenizePostfix('A B C + * D *'));
  const last = frames[frames.length - 1];
  assert.equal(last.forest.length, 1);
  for (const f of frames) { assert.ok(f.msg.zh && f.msg.en); assert.ok(Array.isArray(f.forest)); }
});
