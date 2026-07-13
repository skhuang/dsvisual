// Red-black tree invariant tests, ported from the author's standalone
// visualizer's test-rb.js (trimmed: the demo-hunting sections that only
// printed interesting cascades are omitted).
const { test } = require('node:test');
const assert = require('node:assert');
const { RBTree, RED, BLACK, PRESETS } = require('../../js/tree_rb_viz.js');

// Validates the five red-black rules plus BST order and parent pointers.
// Returns the node count.
function validate(t) {
    const NIL = t.NIL;
    assert.equal(NIL.color, BLACK, 'NIL must be black');
    assert.equal(t.root.color, BLACK, 'root must be black');
    if (t.root !== NIL) assert.equal(t.root.parent, NIL, 'root parent must be NIL');
    let prev = null, count = 0;
    (function walk(n) {
        if (n === NIL) return 1;
        if (n.left !== NIL) assert.equal(n.left.parent, n, 'bad parent L at ' + n.key);
        if (n.right !== NIL) assert.equal(n.right.parent, n, 'bad parent R at ' + n.key);
        if (n.color === RED) {
            assert.notEqual(n.left.color, RED, 'red-red at ' + n.key);
            assert.notEqual(n.right.color, RED, 'red-red at ' + n.key);
        }
        const lh = walk(n.left);
        if (prev !== null) assert.ok(prev <= n.key, 'BST order at ' + n.key);
        prev = n.key; count++;
        const rh = walk(n.right);
        assert.equal(lh, rh, 'black height at ' + n.key);
        return lh + (n.color === BLACK ? 1 : 0);
    })(t.root);
    return count;
}

// deterministic PRNG
let seed = 12345;
function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

test('random insert/delete stress keeps all five RB rules', () => {
    for (let trial = 0; trial < 100; trial++) {
        const n = 1 + Math.floor(rnd() * 60);
        const keys = shuffle(Array.from({ length: n }, (_, i) => i));
        const t = new RBTree();
        for (const k of keys) { t.insert(k); validate(t); }
        assert.equal(validate(t), n, 'size after insert');
        const delOrder = shuffle(keys.slice());
        let remaining = n;
        for (const k of delOrder) {
            assert.ok(t.delete(k), 'delete miss ' + k);
            remaining--;
            assert.equal(validate(t), remaining, 'size after delete');
        }
    }
});

test('duplicate keys + deleteNode(min) stay valid (scheduler pattern)', () => {
    const t = new RBTree();
    for (let i = 0; i < 40; i++) { t.insert(Math.floor(rnd() * 5), { name: 'P' + i }); validate(t); }
    while (t.root !== t.NIL) { t.deleteNode(t.min()); validate(t); }
});

test('mixed random ops keep the tree valid', () => {
    const t = new RBTree(); const present = new Set();
    for (let i = 0; i < 2000; i++) {
        const k = Math.floor(rnd() * 80);
        if (present.has(k) && rnd() < 0.5) { t.delete(k); present.delete(k); }
        else if (!present.has(k)) { t.insert(k); present.add(k); }
        validate(t);
    }
});

test('onStep emits a snapshot-able step for every mutation', () => {
    const t = new RBTree();
    const kinds = [];
    t.onStep = (s) => {
        kinds.push(s.kind);
        assert.ok(s.title.length > 0);
        // serialize() must be callable mid-operation (History snapshots each step)
        t.serialize();
    };
    for (let k = 1; k <= 18; k++) t.insert(k);
    t.delete(1);
    t.onStep = null;
    assert.ok(kinds.includes('insert'));
    assert.ok(kinds.includes('recolor'));
    assert.ok(kinds.some((k) => k.startsWith('rotate')));
    assert.ok(kinds.includes('delete'));
    validate(t);
});

test('preset seeds produce valid trees and legal final ops', () => {
    for (const p of PRESETS) {
        const t = new RBTree();
        for (const k of p.seed()) t.insert(k);
        validate(t);
        if (p.final) {
            if (p.final.op === 'insert') assert.equal(t.find(p.final.v), null, p.name + ': final insert must be new');
            else assert.notEqual(t.find(p.final.v), null, p.name + ': final delete must exist');
        }
    }
});
