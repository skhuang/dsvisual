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

const {
  buildBoolExprTreeFrames, evalBoolExprTree, buildTruthTableFrames, OP_GLYPH,
} = require('../../js/tree_expression_viz');

test('boolean: ! is unary (one child), binary ops have two; vars sorted & exclude consts', () => {
  const { root, vars } = buildBoolExprTreeFrames(tokenizePostfix('a b & c ! |'));
  assert.deepEqual(vars, ['a', 'b', 'c']);
  // root is OR; right child is NOT (unary)
  assert.equal(root.val, '|');
  const notNode = root.right;
  assert.equal(notNode.val, '!');
  assert.ok(notNode.left && notNode.right === null, '! has exactly one (left) child');
  // constants are not collected as vars
  assert.deepEqual(buildBoolExprTreeFrames(tokenizePostfix('a 1 |')).vars, ['a']);
});

test('boolean: eval truth values for & | ! ^ >', () => {
  const t = (s) => buildBoolExprTreeFrames(tokenizePostfix(s)).root;
  assert.equal(evalBoolExprTree(t('a b &'), { a: 1, b: 1 }), 1);
  assert.equal(evalBoolExprTree(t('a b &'), { a: 1, b: 0 }), 0);
  assert.equal(evalBoolExprTree(t('a b |'), { a: 0, b: 0 }), 0);
  assert.equal(evalBoolExprTree(t('a !'), { a: 0 }), 1);
  assert.equal(evalBoolExprTree(t('a b ^'), { a: 1, b: 0 }), 1);
  assert.equal(evalBoolExprTree(t('a b ^'), { a: 1, b: 1 }), 0);
  assert.equal(evalBoolExprTree(t('a b >'), { a: 1, b: 0 }), 0); // 1→0 = false
  assert.equal(evalBoolExprTree(t('a b >'), { a: 0, b: 0 }), 1); // 0→0 = true
  assert.equal(evalBoolExprTree(t('1 0 &'), {}), 0);             // constants
});

test('boolean: truth table has 2^k rows and correct verdict', () => {
  const sweep = (s) => { const { root, vars } = buildBoolExprTreeFrames(tokenizePostfix(s)); return buildTruthTableFrames(root, vars); };
  const contingent = sweep('a b &');
  assert.equal(contingent.rows.length, 4);           // 2^2
  assert.equal(contingent.verdict, 'contingent');
  assert.equal(contingent.satisfiable, true);
  const taut = sweep('a a ! |');
  assert.equal(taut.rows.length, 2);                 // 2^1
  assert.equal(taut.verdict, 'tautology');
  const contra = sweep('a a ! &');
  assert.equal(contra.verdict, 'contradiction');
  assert.equal(contra.satisfiable, false);
  // last frame is the verdict frame
  assert.equal(taut.frames[taut.frames.length - 1].action, 'verdict');
});
