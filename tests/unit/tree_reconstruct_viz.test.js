const test = require('node:test');
const assert = require('node:assert/strict');
const { buildReconstructFrames, reconstructedInorder } = require('../../js/tree_reconstruct_viz');

test('pre-in rebuilds the sample tree', () => {
  const { root, error } = buildReconstructFrames('A B D E C', 'D B E A C', 'pre-in');
  assert.equal(error, null);
  assert.equal(reconstructedInorder(root), 'D B E A C');
});

test('post-in rebuilds the sample tree', () => {
  const { root, error } = buildReconstructFrames('D E B C A', 'D B E A C', 'post-in');
  assert.equal(error, null);
  assert.equal(reconstructedInorder(root), 'D B E A C');
});

test('pre-post rebuilds a full binary tree', () => {
  const { root, error } = buildReconstructFrames('A B D E C', 'D E B C A', 'pre-post');
  assert.equal(error, null);
  assert.equal(reconstructedInorder(root), 'D B E A C');
});

test('pre-post on a non-full tree is ambiguous (error)', () => {
  const { root, error } = buildReconstructFrames('A B', 'B A', 'pre-post');
  assert.equal(root, null);
  assert.match(error, /ambiguous/);
});

test('validation: length mismatch and key-set mismatch produce errors', () => {
  assert.ok(buildReconstructFrames('A B', 'A', 'pre-in').error);
  assert.ok(buildReconstructFrames('A B', 'A C', 'pre-in').error);
});

test('frames carry bilingual msg and end with a done frame on success', () => {
  const { frames } = buildReconstructFrames('A B D E C', 'D B E A C', 'pre-in');
  for (const f of frames) { assert.ok(f.msg.zh && f.msg.en); }
  assert.equal(frames[frames.length - 1].action, 'done');
});
