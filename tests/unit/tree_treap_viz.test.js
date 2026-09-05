const test = require('node:test');
const assert = require('node:assert');
const T = require('../../js/tree_treap_viz.js');

function build(items) {
  // items: array of numbers (random priority) or {key, priority} (deterministic)
  const t = new T.TreapTree();
  for (const it of items) {
    if (typeof it === 'object') t.insert(it.key, it.priority);
    else t.insert(it);
  }
  return t;
}
function inorder(t) { const out = []; (function w(n){ if(!n) return; w(n.left); out.push(n.key); w(n.right); })(t.root); return out; }
function assertBST(t, expectedSortedKeys) { assert.deepStrictEqual(inorder(t), expectedSortedKeys); }
function assertHeap(t) {
  (function w(n) {
    if (!n) return;
    if (n.left) assert.ok(n.priority >= n.left.priority, 'heap @ ' + n.key + ' vs left ' + n.left.key);
    if (n.right) assert.ok(n.priority >= n.right.priority, 'heap @ ' + n.key + ' vs right ' + n.right.key);
    w(n.left); w(n.right);
  })(t.root);
}

test('a newly inserted higher-priority node rotates up to become the root', () => {
  // right-rotation case: 1 (priority .9) is inserted as a left descendant and bubbles up
  const tR = build([{ key: 5, priority: 0.5 }, { key: 3, priority: 0.3 }, { key: 1, priority: 0.9 }]);
  assert.strictEqual(tR.root.key, 1);
  assertBST(tR, [1, 3, 5]);
  assertHeap(tR);

  // left-rotation case: 5 (priority .9) is inserted as a right descendant and bubbles up
  const tL = build([{ key: 1, priority: 0.5 }, { key: 3, priority: 0.3 }, { key: 5, priority: 0.9 }]);
  assert.strictEqual(tL.root.key, 5);
  assertBST(tL, [1, 3, 5]);
  assertHeap(tL);
});

test('a node can rotate multiple times up to the root in one insert', () => {
  const t = build([{ key: 5, priority: 0.5 }, { key: 3, priority: 0.4 }, { key: 1, priority: 0.3 }, { key: 4, priority: 0.99 }]);
  assert.strictEqual(t.root.key, 4);
  assertBST(t, [1, 3, 4, 5]);
  assertHeap(t);
});

test('random insert permutations stay a valid BST + heap', () => {
  for (let trial = 0; trial < 20; trial++) {
    const keys = []; for (let i = 1; i <= 20; i++) keys.push(i);
    for (let i = keys.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [keys[i], keys[j]] = [keys[j], keys[i]]; }
    const t = build(keys); // random priorities
    assertBST(t, Array.from({ length: 20 }, (_, i) => i + 1));
    assertHeap(t);
  }
});

test('delete keeps the tree a valid BST + heap', () => {
  const t = build(Array.from({ length: 15 }, (_, i) => i + 1));
  for (const k of [1, 8, 15, 4, 12, 2]) {
    assert.strictEqual(t.delete(k), true, 'deleted ' + k);
    assertHeap(t);
  }
  assertBST(t, [3, 5, 6, 7, 9, 10, 11, 13, 14]);
  assert.strictEqual(t.delete(999), false, 'delete missing key returns false');
  assert.strictEqual(t.find(1), null, 'deleted key no longer found');
});

test('onStep emits rotation steps; serialize shape + bilingual titles', () => {
  const kinds = [];
  const t = new T.TreapTree();
  t.onStep = (s) => { kinds.push(s.kind); assert.ok(s.title && typeof s.title.zh === 'string' && typeof s.title.en === 'string', 'bilingual title'); };
  t.insert(5, 0.5); t.insert(3, 0.3); t.insert(1, 0.9); // forces a right-rotation
  assert.ok(kinds.some(k => k === 'rotate-left' || k === 'rotate-right'), 'emits a rotation');

  const snap = build([{ key: 2, priority: 0.5 }, { key: 1, priority: 0.3 }, { key: 3, priority: 0.2 }]).serialize();
  assert.deepStrictEqual(Object.keys(snap).sort(), ['id', 'key', 'left', 'priority', 'right']);
  assert.strictEqual(snap.key, 2);
});

test('split partitions by key; merge recombines preserving BST + heap', () => {
  const t = build([5, 2, 8, 1, 3, 7, 9]);
  const { left, right } = t.split(5);
  assertBST(left, [1, 2, 3]);
  assertBST(right, [5, 7, 8, 9]);
  assertHeap(left); assertHeap(right);

  const merged = T.TreapTree.merge(left, right);
  assertBST(merged, [1, 2, 3, 5, 7, 8, 9]);
  assertHeap(merged);
});

test('every preset builds without throwing; delete-rot yields a rotation', () => {
  for (const p of T.PRESETS) {
    const seed = p.seed();
    const seedKeys = seed.map((s) => (typeof s === 'object' ? s.key : s));
    assert.strictEqual(new Set(seedKeys).size, seedKeys.length, p.id + ' distinct seed keys');
    const t = new T.TreapTree(); let rotated = false;
    t.onStep = (s) => { if (s.kind === 'rotate-left' || s.kind === 'rotate-right') rotated = true; };
    assert.doesNotThrow(() => {
      for (const s of seed) { if (typeof s === 'object') t.insert(s.key, s.priority); else t.insert(s); }
      if (p.final) { if (p.final.op === 'insert') t.insert(p.final.v, p.final.priority); else t.delete(p.final.v); }
    }, p.id + ' builds');
    assertHeap(t);
    if (p.id === 'delete-rot' || p.id.startsWith('single-') || p.id === 'bubble-to-root') {
      assert.ok(rotated, p.id + ' triggers >=1 rotation');
    }
  }
});