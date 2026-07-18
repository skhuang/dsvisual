const test = require('node:test');
const assert = require('node:assert/strict');
const { tokenize, parseTree, deepCopy, equal, buildCopyFrames, buildEqualFrames } = require('../../js/tree_copy_equal_viz');

test('parseTree builds positional tree', () => {
  const { root, error } = parseTree(tokenize('A B C'));
  assert.equal(error, null);
  assert.equal(root.val, 'A');
  assert.equal(root.left.val, 'B');
  assert.equal(root.right.val, 'C');
});

test('deepCopy round-trips to equal', () => {
  const { root } = parseTree(tokenize('A B C D E'));
  assert.deepEqual(equal(root, deepCopy(root)), { equal: true, reason: null });
});

test('equal detects value and structural mismatches', () => {
  const a = parseTree(tokenize('A B C')).root;
  const bVal = parseTree(tokenize('A B D')).root;
  const bStruct = parseTree(tokenize('A B')).root;      // A has no right child
  assert.deepEqual(equal(a, bVal), { equal: false, reason: 'value' });
  assert.deepEqual(equal(a, bStruct), { equal: false, reason: 'structural' });
});

test('buildCopyFrames ends with a done frame, verdict true', () => {
  const { frames } = buildCopyFrames(tokenize('A B C D E'));
  const done = frames[frames.length - 1];
  assert.equal(done.action, 'done');
  assert.equal(done.verdict, true);
  for (const f of frames) assert.ok(f.msg.zh && f.msg.en);
});

test('buildEqualFrames: equal pair vs differing pair', () => {
  const eq = buildEqualFrames(tokenize('A B C'), tokenize('A B C'));
  assert.equal(eq.equal, true);
  assert.equal(eq.frames[eq.frames.length - 1].status, 'equal');
  const diff = buildEqualFrames(tokenize('A B C'), tokenize('A B D'));
  assert.equal(diff.equal, false);
  assert.equal(diff.reason, 'value');
  assert.equal(diff.frames[diff.frames.length - 1].status, 'mismatch');
});

test('parse error surfaces as an error frame', () => {
  const { frames, error } = buildCopyFrames(tokenize('- A'));
  assert.equal(error, 'root-missing');
  assert.equal(frames[0].action, 'error');
});
