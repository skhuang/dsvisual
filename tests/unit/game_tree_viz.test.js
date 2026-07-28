const test = require('node:test');
const assert = require('node:assert');
const G = require('../../js/game_tree_viz.js');

const EXPECT = { normal: 8, special: 8, edge: 4, large: 16 };

test('randomInput returns a power-of-2 integer leaf set per difficulty; builds without throwing', () => {
  for (const d of Object.keys(EXPECT)) {
    for (let i = 0; i < 8; i++) {
      const r = G.randomInput(d);
      assert.ok(r && Array.isArray(r.leaves), d + ' has leaves');
      assert.strictEqual(r.leaves.length, EXPECT[d], d + ' leaf count');
      r.leaves.forEach((v) => assert.ok(Number.isInteger(v), d + ' integer leaf: ' + v));
      assert.doesNotThrow(() => {
        const { root } = G.buildGameTree(r.leaves, 2);
        G.minimaxFrames(root, true);
        G.minimaxFrames(root, false);
      }, d + ' builds + frames');
    }
  }
});
