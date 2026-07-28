const test = require('node:test');
const assert = require('node:assert');
const T = require('../../js/tree_general_binary_viz.js');

function parentCounts(parsed) {
  // count how many children-lists each node appears in
  const cnt = {};
  parsed.nodes.forEach((n) => { cnt[n] = 0; });
  Object.keys(parsed.children).forEach((p) => {
    (parsed.children[p] || []).forEach((c) => { cnt[c] = (cnt[c] || 0) + 1; });
  });
  return cnt;
}

test('randomInput yields a valid rooted general tree for every difficulty', () => {
  for (const d of ['normal', 'special', 'edge', 'large']) {
    for (let i = 0; i < 8; i++) {
      const s = T.randomInput(d);
      assert.strictEqual(typeof s, 'string');
      assert.match(s, /^[A-Z:,;]+$/, d + ' chars: ' + s);
      const g = T.parseGeneralTree(s);
      assert.ok(g.root, d + ' has a root: ' + s);
      // exactly one root: every node except root appears in exactly one children list; root in zero
      const cnt = parentCounts(g);
      assert.strictEqual(cnt[g.root], 0, d + ' root has no parent: ' + s);
      g.nodes.forEach((n) => { if (n !== g.root) assert.strictEqual(cnt[n], 1, d + ' node ' + n + ' has one parent: ' + s); });
      // labels unique
      assert.strictEqual(new Set(g.nodes).size, g.nodes.length, d + ' unique labels: ' + s);
      // round-trips without throwing
      assert.doesNotThrow(() => T.convertFrames(T.parseGeneralTree(s)));
      assert.doesNotThrow(() => T.toBinary(g));
    }
  }
});

test('edge difficulty can be a single node', () => {
  const seen = new Set();
  for (let i = 0; i < 30; i++) seen.add(T.randomInput('edge'));
  assert.ok([...seen].some((s) => T.parseGeneralTree(s).nodes.length === 1), 'edge sometimes single node');
});
