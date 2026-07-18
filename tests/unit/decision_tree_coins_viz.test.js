const test = require('node:test');
const assert = require('node:assert/strict');
const { weigh, decide, buildDecisionTree, allScenariosCorrect, allScenarios, buildCoinsFrames } = require('../../js/decision_tree_coins_viz');

test('weigh compares index-set totals with a ±1 fake', () => {
  const s = { fake: 2, heavy: true };            // c heavy
  assert.equal(weigh(s, [0, 1, 2], [3, 4, 5]), 1);
  assert.equal(weigh(s, [0], [1]), 0);
  const t = { fake: 6, heavy: false };           // g light
  assert.equal(weigh(t, [6], [7]), -1);
});

test('decide identifies all 16 scenarios; each outcome matches weigh', () => {
  assert.equal(allScenariosCorrect(), true);
  for (const s of allScenarios()) {
    const { path, verdict } = decide(s);
    assert.deepEqual(verdict, { coin: s.fake, heavy: s.heavy });
    assert.ok(path.length >= 2 && path.length <= 3);
    for (const w of path) assert.equal(w.outcome, weigh(s, w.left, w.right));
  }
});

test('pinned scenarios: c heavy and g light', () => {
  assert.deepEqual(decide({ fake: 2, heavy: true }).verdict, { coin: 2, heavy: true });
  assert.deepEqual(decide({ fake: 6, heavy: false }).verdict, { coin: 6, heavy: false });
});

test('decision tree has 16 leaves', () => {
  let leaves = 0;
  (function count(n) { if (!n) return; if (n.leaf) { leaves++; return; } for (const o of ['-1', '0', '1']) if (n.children[o]) count(n.children[o]); })(buildDecisionTree());
  assert.equal(leaves, 16);
});

test('buildCoinsFrames ends in a done verdict; frames bilingual', () => {
  const { frames, verdict } = buildCoinsFrames({ fake: 2, heavy: true });
  assert.deepEqual(verdict, { coin: 2, heavy: true });
  assert.equal(frames[frames.length - 1].action, 'done');
  for (const f of frames) assert.ok(f.msg.zh && f.msg.en);
});
