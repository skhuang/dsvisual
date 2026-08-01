const test = require('node:test');
const assert = require('node:assert');
const A = require('../../js/tree_avl_viz.js');

function build(keys) { const t = new A.AVLTree(); for (const k of keys) t.insert(k); return t; }
function inorder(t) { const out = []; (function w(n){ if(!n) return; w(n.left); out.push(n.key); w(n.right); })(t.root); return out; }
function bfOf(t, n) { const h = m => m ? m.height : 0; return h(n.left) - h(n.right); }
function assertBalanced(t) { (function w(n){ if(!n) return; assert.ok(Math.abs(bfOf(t,n)) <= 1, 'balanced at ' + n.key + ' bf=' + bfOf(t,n)); w(n.left); w(n.right); })(t.root); }

test('the four rotation cases produce the expected root', () => {
  assert.strictEqual(build([3,2,1]).root.key, 2, 'LL');
  assert.strictEqual(build([1,2,3]).root.key, 2, 'RR');
  assert.strictEqual(build([3,1,2]).root.key, 2, 'LR');
  assert.strictEqual(build([1,3,2]).root.key, 2, 'RL');
});

test('random insert permutations stay balanced and BST-ordered', () => {
  for (let trial = 0; trial < 20; trial++) {
    const keys = []; for (let i = 1; i <= 20; i++) keys.push(i);
    for (let i = keys.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [keys[i], keys[j]] = [keys[j], keys[i]]; }
    const t = build(keys);
    assertBalanced(t);
    assert.deepStrictEqual(inorder(t), Array.from({ length: 20 }, (_, i) => i + 1));
  }
});

test('delete keeps the tree balanced and ordered', () => {
  const t = build(Array.from({ length: 15 }, (_, i) => i + 1));
  for (const k of [1, 8, 15, 4, 12, 2]) {
    assert.strictEqual(t.delete(k), true, 'deleted ' + k);
    assertBalanced(t);
  }
  assert.deepStrictEqual(inorder(t), [3, 5, 6, 7, 9, 10, 11, 13, 14]);
  assert.strictEqual(t.delete(999), false, 'delete missing key returns false');
});

test('onStep emits rotation steps for the four cases; serialize shape + bilingual', () => {
  for (const seq of [[3,2,1], [1,2,3], [3,1,2], [1,3,2]]) {
    const t = new A.AVLTree(); const kinds = [];
    t.onStep = (s) => { kinds.push(s.kind); assert.ok(s.title && typeof s.title.zh === 'string' && typeof s.title.en === 'string', 'bilingual title'); };
    for (const k of seq) t.insert(k);
    assert.ok(kinds.some(k => k === 'rotate-left' || k === 'rotate-right'), seq + ' emits a rotation');
  }
  const snap = build([2, 1, 3]).serialize();
  assert.deepStrictEqual(Object.keys(snap).sort(), ['bf', 'height', 'id', 'key', 'left', 'right']);
  assert.strictEqual(snap.bf, 0);
});

test('every preset builds without throwing; delete-rot yields a rotation', () => {
  for (const p of A.PRESETS) {
    const seed = p.seed();
    assert.ok(Array.isArray(seed) && new Set(seed).size === seed.length, p.id + ' distinct seed');
    const t = new A.AVLTree(); let rotated = false;
    t.onStep = (s) => { if (s.kind === 'rotate-left' || s.kind === 'rotate-right') rotated = true; };
    assert.doesNotThrow(() => {
      for (const k of seed) t.insert(k);
      if (p.final) { if (p.final.op === 'insert') t.insert(p.final.v); else t.delete(p.final.v); }
    }, p.id + ' builds');
    if (p.id === 'delete-rot') assert.ok(rotated, 'delete-rot triggers >=1 rotation');
  }
});
