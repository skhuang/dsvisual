const test = require('node:test');
const assert = require('node:assert/strict');
const { parseLevelArray, buildArrayRepFrames, tokenize } = require('../../js/tree_array_rep_viz');

test('parseLevelArray maps positions and finds empties', () => {
  const { slots, size, error } = parseLevelArray(tokenize('A B C - D'));
  assert.equal(error, null);
  assert.equal(size, 5);
  assert.equal(slots[1].val, 'A');
  assert.equal(slots[4].val, null);
  assert.equal(slots[5].val, 'D');
});

test('complete tree wastes nothing; skewed wastes slots', () => {
  const complete = buildArrayRepFrames(tokenize('A B C D E F G'));
  assert.equal(complete.error, null);
  assert.equal(complete.size, 7);
  assert.equal(complete.nodeCount, 7);
  assert.equal(complete.wasted, 0);

  const skew = buildArrayRepFrames(tokenize('A - C - - - G'));
  assert.equal(skew.size, 7);
  assert.equal(skew.nodeCount, 3);
  assert.equal(skew.wasted, 4);
  // tree shape: A -> right C -> right G
  assert.equal(skew.root.val, 'A');
  assert.equal(skew.root.left, null);
  assert.equal(skew.root.right.val, 'C');
  assert.equal(skew.root.right.right.val, 'G');
});

test('index arithmetic reported in a place frame', () => {
  const { frames } = buildArrayRepFrames(tokenize('A B C'));
  const f2 = frames.find((f) => f.action === 'place' && f.current === 2);
  assert.equal(f2.parent, 1);
  assert.equal(f2.left, 4);
  assert.equal(f2.right, 5);
});

test('validation: orphan child and missing root error', () => {
  assert.match(buildArrayRepFrames(tokenize('A - - D')).error, /orphan-child/);
  assert.equal(buildArrayRepFrames(tokenize('- A')).error, 'root-missing');
});

test('frames carry bilingual msg and end with done stats', () => {
  const { frames, wasted, nodeCount } = buildArrayRepFrames(tokenize('A B C - D'));
  for (const f of frames) { assert.ok(f.msg.zh && f.msg.en); }
  const done = frames[frames.length - 1];
  assert.equal(done.action, 'done');
  assert.equal(wasted, 1);
  assert.equal(nodeCount, 4);
});
