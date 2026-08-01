# AVL Rotation Observatory (mirror of RB viz) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the AVL Tree viz from the generic live-BST renderer into a dedicated rotation observatory that mirrors the Red-Black viz — a stepped, rewindable insert/delete sandbox with balance factors, LL/LR/RR/RL rotations, scripted presets, step log, transport, keyboard, and a hidden C++ drawer.

**Architecture:** A new pure module `js/tree_avl_viz.js` exposes `AVLViz = { AVLTree, Stage, History, KIND_META, PRESETS }`, parallel to `RBTreeViz`. `AVLTree` is new (parent-pointer, in-place rebalancing so `this.root` is valid at every `onStep` emit — the `History.runOp` serializes the tree on each emit). `Stage`/`History`/`_pickLang` are copied from `js/tree_rb_viz.js` with a small enumerated set of edits. `renderTreeAVL()` in `js/domains/tree.js` mirrors `renderTreeRB()`. RB is untouched.

**Tech Stack:** Vanilla ES-class IIFE modules; VizRegistry/VizKit seam; Playwright (e2e) + node:test (unit).

## Global Constraints

- Targeted `git add` by explicit path only; never `-A`/`.`/`-u`; verify `git status` first.
- Never hand-edit generated files (`js/code_db.js`, `slides/**`, `js/slides_rendered.js`).
- Do NOT modify `js/tree_rb_viz.js`, `renderTreeRB`, or the `.rbviz-*` CSS. AVL is a parallel copy.
- Do NOT break `tree-bst`/`tree-splay` (still on the shared live `treeContainer`).
- A NEW pure module needs its OWN `index.html` `<script defer>` tag (before `js/domains/tree.js`).
- The AVL core MUST use parent pointers + in-place rebalancing (so `serialize()` from `this.root` is
  correct at every `_emit`). Reuse the existing `method.tree-avl` i18n. Traditional zh throughout.
- Cap at 63 nodes. Non-AVL viz UNCHANGED. e2e: counts/testids/text/classes, never SVG edge visibility.
- Full Playwright + `npm run test:unit` green before merge.

## File Structure

- **Create** `js/tree_avl_viz.js` — `AVLViz` pure module (new `AVLTree` + `KIND_META` + `PRESETS` + copied `_pickLang`/`Stage`/`History`).
- **Create** `tests/unit/tree_avl_viz.test.js` — unit tests for `AVLTree`/presets.
- **Create** `tests/avl_observatory.spec.js` — e2e (mirror `tests/tree_rb.spec.js`).
- **Modify** `js/domains/tree.js` — add `renderTreeAVL()`, `_avlState`, AVL keyboard branch; re-point the `tree-avl` attach.
- **Modify** `js/app.js` — `tree-avl` row (`codeDrawer:true`) + dedicated `updateControls` branch.
- **Modify** `index.html` — add the `js/tree_avl_viz.js` script tag.
- **Modify** `style.css` — duplicate `.rbviz-*` → `.avlviz-*` with node-state swaps.

---

### Task 1: Pure module `js/tree_avl_viz.js` + unit tests

**Files:**
- Create: `js/tree_avl_viz.js`
- Test: `tests/unit/tree_avl_viz.test.js`

**Interfaces:**
- Consumes: nothing (self-contained; `window.I18N` optionally for language in `_pickLang`; `Math.random` in one preset).
- Produces (browser global `AVLViz` + CommonJS export): `{ AVLTree, Stage, History, KIND_META, PRESETS }`.
  - `AVLTree`: `insert(key)`, `delete(key)→bool`, `find(key)`, `size()`, `min(n)`, `serialize()→{id,key,height,bf,left,right}|null`, `onStep` callback (emits `{kind,title,detail,hl,beta?}`).
  - `PRESETS`: `[{id,name:{zh,en},tip:{zh,en},seed():number[],final?:{op,v}}]`.

- [ ] **Step 1: Write the failing unit test**

Create `tests/unit/tree_avl_viz.test.js`:

```js
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/unit/tree_avl_viz.test.js`
Expected: FAIL — `Cannot find module '../../js/tree_avl_viz.js'`.

- [ ] **Step 3: Write `js/tree_avl_viz.js` — module skeleton + `AVLTree` core**

Create `js/tree_avl_viz.js` with this exact head (the copied `Stage`/`History` come in Step 4):

```js
'use strict';
/*
 * AVL Tree 旋轉觀測站 — parallel to tree_rb_viz.js (RB observatory).
 * Exposes window.AVLViz = { AVLTree, Stage, History, KIND_META, PRESETS }.
 * AVLTree uses parent pointers + in-place rebalancing so this.root is valid at
 * every onStep emit (History.runOp serializes the tree on each step). The DOM
 * wiring (toolbar, presets, keyboard) lives in js/domains/tree.js renderTreeAVL().
 */
(function (global) {
    /* ================= AVL 樹核心（含 parent 指標，原地旋轉） ================= */
    class AVLTree {
        constructor() { this.root = null; this._id = 1; this.onStep = null; }
        _lbl(n) { return n ? String(n.key) : '·'; }
        _emit(kind, title, detail, nodes, extra) {
            if (!this.onStep) return;
            const hl = (nodes || []).filter((n) => n).map((n) => n.id);
            this.onStep(Object.assign({ kind, title, detail, hl }, extra || {}));
        }
        _h(n) { return n ? n.height : 0; }
        _bf(n) { return n ? this._h(n.left) - this._h(n.right) : 0; }
        _fix(n) { n.height = 1 + Math.max(this._h(n.left), this._h(n.right)); }
        _sbf(n) { const b = this._bf(n); return (b > 0 ? '+' : '') + b; }

        serialize() {
            const s = (n) => n ? { id: n.id, key: n.key, height: n.height, bf: this._bf(n), left: s(n.left), right: s(n.right) } : null;
            return s(this.root);
        }
        size() { let c = 0; const w = (n) => { if (n) { c++; w(n.left); w(n.right); } }; w(this.root); return c; }
        find(key) { let x = this.root; while (x) { if (key === x.key) return x; x = key < x.key ? x.left : x.right; } return null; }
        min(x) { x = x || this.root; if (!x) return null; while (x.left) x = x.left; return x; }

        leftRotate(x) {
            const y = x.right, beta = y.left;
            x.right = beta; if (beta) beta.parent = x;
            y.parent = x.parent;
            if (!x.parent) this.root = y;
            else if (x === x.parent.left) x.parent.left = y; else x.parent.right = y;
            y.left = x; x.parent = y;
            this._fix(x); this._fix(y);
            const b = beta || null;
            this._emit('rotate-left',
                { zh: `左旋 @ ${this._lbl(x)}`, en: `Left-rotate @ ${this._lbl(x)}` },
                { zh: `${this._lbl(y)} 升上來當這棵小樹的根，${this._lbl(x)} 下沉成左子` + (b ? `；β 子樹（根 ${this._lbl(b)}）換邊，改掛到 ${this._lbl(x)} 右側` : `；β 子樹是空的，不用搬`),
                  en: `${this._lbl(y)} rises to the subtree root and ${this._lbl(x)} sinks to its left child` + (b ? `; the β subtree (root ${this._lbl(b)}) switches sides to ${this._lbl(x)}'s right` : `; the β subtree is empty`) },
                [x, y], { beta: b ? b.id : null });
        }
        rightRotate(x) {
            const y = x.left, beta = y.right;
            x.left = beta; if (beta) beta.parent = x;
            y.parent = x.parent;
            if (!x.parent) this.root = y;
            else if (x === x.parent.right) x.parent.right = y; else x.parent.left = y;
            y.right = x; x.parent = y;
            this._fix(x); this._fix(y);
            const b = beta || null;
            this._emit('rotate-right',
                { zh: `右旋 @ ${this._lbl(x)}`, en: `Right-rotate @ ${this._lbl(x)}` },
                { zh: `${this._lbl(y)} 升上來當這棵小樹的根，${this._lbl(x)} 下沉成右子` + (b ? `；β 子樹（根 ${this._lbl(b)}）換邊，改掛到 ${this._lbl(x)} 左側` : `；β 子樹是空的，不用搬`),
                  en: `${this._lbl(y)} rises to the subtree root and ${this._lbl(x)} sinks to its right child` + (b ? `; the β subtree (root ${this._lbl(b)}) switches sides to ${this._lbl(x)}'s left` : `; the β subtree is empty`) },
                [x, y], { beta: b ? b.id : null });
        }

        // Walk up from n to the root: recompute height/bf, emit an update step,
        // and rotate wherever |bf|==2. stopAfterRotate=true for insert (a single
        // rotation suffices); false for delete (may rotate repeatedly to the root).
        _rebalance(n, stopAfterRotate) {
            while (n) {
                this._fix(n);
                const bf = this._bf(n);
                this._emit('update',
                    { zh: `更新 ${this._lbl(n)}：高度 ${n.height}、平衡因子 ${this._sbf(n)}`, en: `Update ${this._lbl(n)}: height ${n.height}, balance factor ${this._sbf(n)}` },
                    { zh: `重新計算 ${this._lbl(n)} 的高度與平衡因子`, en: `Recompute ${this._lbl(n)}'s height and balance factor` },
                    [n]);
                if (bf === 2) {
                    const L = n.left;
                    if (this._bf(L) >= 0) {
                        this._emit('note', { zh: `失衡 @ ${this._lbl(n)}（bf=+2）→ LL`, en: `Imbalance @ ${this._lbl(n)} (bf=+2) → LL` },
                            { zh: `左子樹過高、且左子 ${this._lbl(L)} 也偏左（LL 形）→ 對 ${this._lbl(n)} 右旋`, en: `Left-heavy and left child ${this._lbl(L)} also leans left (LL) → right-rotate ${this._lbl(n)}` }, [n, L]);
                        this.rightRotate(n);
                    } else {
                        this._emit('note', { zh: `失衡 @ ${this._lbl(n)}（bf=+2）→ LR`, en: `Imbalance @ ${this._lbl(n)} (bf=+2) → LR` },
                            { zh: `左子 ${this._lbl(L)} 偏右（LR 形）→ 先左旋 ${this._lbl(L)}，再右旋 ${this._lbl(n)}`, en: `Left child ${this._lbl(L)} leans right (LR) → left-rotate ${this._lbl(L)}, then right-rotate ${this._lbl(n)}` }, [n, L]);
                        this.leftRotate(L); this.rightRotate(n);
                    }
                    n = n.parent; if (stopAfterRotate) break; continue;
                }
                if (bf === -2) {
                    const R = n.right;
                    if (this._bf(R) <= 0) {
                        this._emit('note', { zh: `失衡 @ ${this._lbl(n)}（bf=−2）→ RR`, en: `Imbalance @ ${this._lbl(n)} (bf=-2) → RR` },
                            { zh: `右子樹過高、且右子 ${this._lbl(R)} 也偏右（RR 形）→ 對 ${this._lbl(n)} 左旋`, en: `Right-heavy and right child ${this._lbl(R)} also leans right (RR) → left-rotate ${this._lbl(n)}` }, [n, R]);
                        this.leftRotate(n);
                    } else {
                        this._emit('note', { zh: `失衡 @ ${this._lbl(n)}（bf=−2）→ RL`, en: `Imbalance @ ${this._lbl(n)} (bf=-2) → RL` },
                            { zh: `右子 ${this._lbl(R)} 偏左（RL 形）→ 先右旋 ${this._lbl(R)}，再左旋 ${this._lbl(n)}`, en: `Right child ${this._lbl(R)} leans left (RL) → right-rotate ${this._lbl(R)}, then left-rotate ${this._lbl(n)}` }, [n, R]);
                        this.rightRotate(R); this.leftRotate(n);
                    }
                    n = n.parent; if (stopAfterRotate) break; continue;
                }
                n = n.parent;
            }
        }

        insert(key) {
            if (this.find(key)) return null;
            const z = { id: this._id++, key, height: 1, left: null, right: null, parent: null };
            if (!this.root) {
                this.root = z;
                this._emit('insert', { zh: `插入 ${key}`, en: `Insert ${key}` }, { zh: `樹是空的，${key} 直接當根`, en: `The tree is empty, so ${key} becomes the root` }, [z]);
                return z;
            }
            let y = null, x = this.root;
            while (x) { y = x; x = key < x.key ? x.left : x.right; }
            z.parent = y; if (key < y.key) y.left = z; else y.right = z;
            this._emit('insert', { zh: `插入 ${key}`, en: `Insert ${key}` },
                { zh: `照 BST 規則走到底，掛在 ${this._lbl(y)} 的${key < y.key ? '左' : '右'}邊`, en: `Follow the BST rule down; attach as ${this._lbl(y)}'s ${key < y.key ? 'left' : 'right'} child` }, [z, y]);
            this._rebalance(y, true);
            return z;
        }

        delete(key) {
            const z = this.find(key);
            if (!z) return false;
            this._emit('delete', { zh: `刪除 ${key}`, en: `Delete ${key}` }, { zh: `找到 ${this._lbl(z)}，準備刪除`, en: `Found ${this._lbl(z)}, preparing to delete` }, [z]);
            let target = z;
            if (z.left && z.right) {
                const succ = this.min(z.right);
                this._emit('note', { zh: `${this._lbl(z)} 有兩個子節點 → 用中序後繼 ${this._lbl(succ)} 的鍵取代`, en: `${this._lbl(z)} has two children → replace its key with in-order successor ${this._lbl(succ)}` },
                    { zh: `把後繼 ${this._lbl(succ)} 的鍵搬到 ${this._lbl(z)}，改刪那顆（至多一個子節點的）後繼節點`, en: `Copy successor ${this._lbl(succ)}'s key into ${this._lbl(z)}, then remove the successor node (which has at most one child)` }, [z, succ]);
                z.key = succ.key; target = succ;
            }
            const child = target.left || target.right;
            const parent = target.parent;
            if (child) child.parent = parent;
            if (!parent) this.root = child;
            else if (target === parent.left) parent.left = child; else parent.right = child;
            this._rebalance(parent, false);
            return true;
        }
    }

    function _pickLang(m) { /* <-- Step 4 pastes the copied helper here */ }
    const KIND_META = { /* <-- Step 3b */ };
    /* Stage + History classes: Step 4. PRESETS: Step 3c. */

    const api = { AVLTree, Stage, History, KIND_META, PRESETS };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    global.AVLViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 3b: Add `KIND_META`** (replace the `KIND_META` placeholder):

```js
    const KIND_META = {
        'insert': { cls: 'k-insert', label: { zh: '插入', en: 'Insert' } },
        'update': { cls: 'k-recolor', label: { zh: '更新', en: 'Update' } },
        'rotate-left': { cls: 'k-rotate', label: { zh: '左旋', en: 'Left-rot' } },
        'rotate-right': { cls: 'k-rotate', label: { zh: '右旋', en: 'Right-rot' } },
        'delete': { cls: 'k-delete', label: { zh: '刪除', en: 'Delete' } },
        'note': { cls: 'k-note', label: { zh: '說明', en: 'Note' } },
        'init': { cls: 'k-note', label: { zh: '起點', en: 'Start' } },
    };
```

- [ ] **Step 3c: Add `PRESETS`** (place just before `const api = ...`):

```js
    const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
    const PRESETS = [
        { id: 'll', name: { zh: 'LL：單右旋', en: 'LL: single right-rotation' },
          tip: { zh: '左左失衡，插入 1 後對根右旋一次', en: 'Left-left imbalance; inserting 1 triggers one right-rotation at the root' },
          seed: () => [3, 2], final: { op: 'insert', v: 1 } },
        { id: 'rr', name: { zh: 'RR：單左旋', en: 'RR: single left-rotation' },
          tip: { zh: '右右失衡，插入 3 後對根左旋一次', en: 'Right-right imbalance; inserting 3 triggers one left-rotation at the root' },
          seed: () => [1, 2], final: { op: 'insert', v: 3 } },
        { id: 'lr', name: { zh: 'LR：左右雙旋', en: 'LR: left-right double rotation' },
          tip: { zh: '左子偏右，插入 2 後先左旋子、再右旋根', en: 'Left child leans right; inserting 2 left-rotates the child then right-rotates the root' },
          seed: () => [3, 1], final: { op: 'insert', v: 2 } },
        { id: 'rl', name: { zh: 'RL：右左雙旋', en: 'RL: right-left double rotation' },
          tip: { zh: '右子偏左，插入 2 後先右旋子、再左旋根', en: 'Right child leans left; inserting 2 right-rotates the child then left-rotates the root' },
          seed: () => [1, 3], final: { op: 'insert', v: 2 } },
        { id: 'grow-1-15', name: { zh: '成長：依序插入 1–15', en: 'Growth: insert 1–15 in order' },
          tip: { zh: '從空樹看 AVL 靠一路旋轉維持平衡', en: 'Watch an AVL stay balanced through repeated rotations from empty' },
          seed: () => range(1, 15) },
        { id: 'delete-rot', name: { zh: '刪除觸發旋轉', en: 'Delete triggers a rotation' },
          tip: { zh: '刪一個節點造成失衡，靠旋轉修復', en: 'Deleting a node unbalances the tree; a rotation repairs it' },
          seed: () => range(1, 12), final: { op: 'delete', v: 1 } },
        { id: 'random-15', name: { zh: '隨機 15 顆', en: 'Random 15 nodes' }, tip: { zh: '', en: '' },
          seed: () => { const pool = range(1, 99); for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; } return pool.slice(0, 15); } },
    ];
```

Note: the `delete-rot` seed/final MUST yield ≥1 rotation (the unit test asserts it). `seed range(1,12)` + `delete 1` is the starting candidate — if the unit test's `delete-rot` assertion fails, adjust `final.v` (e.g. try `2` or a different deleted key) until a rotation is emitted. Do NOT weaken the test.

- [ ] **Step 4: Copy `_pickLang` + `Stage` + `History` from `js/tree_rb_viz.js` with edits**

Copy these exact ranges from `js/tree_rb_viz.js` into `js/tree_avl_viz.js` (replace the `_pickLang` placeholder and the `Stage`/`History` comment):
- `_pickLang` — lines 346–351 — **verbatim, no edits**.
- `const SVGNS = ...` line + `class Stage { ... }` — lines 364–569 — with the FOUR edits below.
- `class History { ... }` — lines 572–713 — with the ONE edit below.

**Stage edits (4):**
1. `this.empty.className = 'rbviz-empty';` → `this.empty.className = 'avlviz-empty';`
2. In `_layout`, the node push `nodes.push({ id: n.id, key: n.key, color: n.color, data: n.data, d, i: idx++, parentId });`
   → `nodes.push({ id: n.id, key: n.key, bf: n.bf, height: n.height, d, i: idx++, parentId });`
3. Replace the node-content block (the 4 lines that read `el.g.dataset.key = n.key;` … through the
   `el.g.setAttribute('class', 'nd ' + n.color + ...)` line):
   ```js
   el.g.dataset.key = n.key;
   el.key.textContent = n.key;
   if (el.sub) el.sub.textContent = (n.bf > 0 ? '+' : '') + n.bf;
   el.g.setAttribute('class', 'nd' + (Math.abs(n.bf) >= 2 ? ' imbalanced' : '') +
       (hlIds.has(n.id) ? ' hl' : betaIds.has(n.id) ? ' beta' : ''));
   ```
   (Removes the `n.data`/`n.color` paths; sub-label = signed balance factor; `imbalanced` when |bf|≥2.)
4. No other Stage change. (The click handler's `g.dataset.name || null` stays — `dataset.name` is simply never set now, yielding `null`, which is fine.)

**History edit (1):**
- The badge line `badge.className = 'rbviz-badge ' + m.cls;` → `badge.className = 'avlviz-badge ' + m.cls;`
- Everything else in `History` is class-name-generic (`tbtn`/`cnt`/`op-h`/`row`/`dot`) and resolves
  `KIND_META`/`_pickLang` from THIS module — no other edits.

- [ ] **Step 5: Run the unit test to verify it passes**

Run: `node --test tests/unit/tree_avl_viz.test.js`
Expected: PASS (all tests). If `delete-rot` fails, adjust its preset `final.v` per Step 3c's note and re-run.

- [ ] **Step 6: Commit**

```bash
git add js/tree_avl_viz.js tests/unit/tree_avl_viz.test.js
git commit -m "feat(dsvisual): AVLViz pure module — AVLTree core + Stage/History (mirror of RB)"
```

---

### Task 2: Renderer + wiring + styling + e2e

**Files:**
- Modify: `js/domains/tree.js` (add `renderTreeAVL`, `_avlState`, AVL keyboard branch; re-point attach at line 358)
- Modify: `js/app.js` (`tree-avl` row line 76 + `updateControls` branch)
- Modify: `index.html` (script tag next to `js/tree_rb_viz.js`, line 481)
- Modify: `style.css` (duplicate `.rbviz-*` block 2932–3009 → `.avlviz-*`)
- Test: `tests/avl_observatory.spec.js`

**Interfaces:**
- Consumes: `AVLViz.{AVLTree,Stage,History,KIND_META,PRESETS}` (Task 1); `K().acquireDynamicVizHost/langOf/showStatus`; `C().getMode`.
- Produces: `tree-avl` on the dynamic host with `.avlviz` markup (data-testids `avlviz-input/insert/delete/clear/stage/transport/log/desc/presets`), `_avlState` persisted.

- [ ] **Step 1: Add the pure-module script tag to `index.html`**

Insert immediately AFTER the existing `<script src="js/tree_rb_viz.js" defer></script>` (line 481):
```html
    <script src="js/tree_avl_viz.js" defer></script>
```

- [ ] **Step 2: `tree-avl` row + `updateControls` branch in `js/app.js`**

Row (`js/app.js:76`) →
```js
            { id: 'tree-avl', title: 'AVL Tree', file: 'tree_avl.cpp', visualizer: 'avltree', controls: 'avltree', codeDrawer: true },
```
In `updateControls`, REMOVE `'tree-avl'` from the shared branch condition
`['tree-bst', 'tree-avl', 'tree-splay'].includes(currentMode)` (→ `['tree-bst', 'tree-splay']`) and delete
its inner `if(currentMode === 'tree-avl') {...}` line. Then ADD a dedicated branch mirroring `tree-rb`
(place it right after that shared `else if` block):
```js
        else if (currentMode === 'tree-avl') {
            // Rendered by renderTreeAVL() into the dynamic viz host.
            codeTitle.textContent = 'tree_avl.cpp'; codeDisplay.textContent = codeTreeAVL;
        }
```
(Do NOT unhide `treeContainer`/`treeActions` for AVL — the viz owns the dynamic host.)

- [ ] **Step 3: `renderTreeAVL()` + `_avlState` + attach + keyboard in `js/domains/tree.js`**

3a. Add `let _avlState = null;` next to `let _rbState = null;` (`js/domains/tree.js:171`).

3b. Add `renderTreeAVL()` (place right after `renderTreeRB()` ends, before `onModeSwitch`):
```js
  function renderTreeAVL() {
      const host = K().acquireDynamicVizHost();
      const langOf = K().langOf;
      const showStatus = K().showStatus;
      host.innerHTML =
          '<div class="avlviz" data-testid="avlviz">' +
              '<div class="avlviz-toolbar">' +
                  '<div class="avlviz-field">' +
                      '<input type="number" class="avlviz-input" data-testid="avlviz-input" placeholder="' + langOf({ zh: '鍵值', en: 'Key' }) + '" aria-label="' + langOf({ zh: '鍵值', en: 'Key' }) + '">' +
                      '<button type="button" class="btn primary avlviz-insert" data-testid="avlviz-insert">' + langOf({ zh: '插入', en: 'Insert' }) + '</button>' +
                      '<button type="button" class="btn secondary avlviz-delete" data-testid="avlviz-delete">' + langOf({ zh: '刪除', en: 'Delete' }) + '</button>' +
                      '<button type="button" class="btn exception avlviz-clear" data-testid="avlviz-clear">' + langOf({ zh: '清空', en: 'Clear' }) + '</button>' +
                  '</div>' +
                  '<div class="avlviz-presets" data-testid="avlviz-presets"><span class="lbl">' + langOf({ zh: '劇本', en: 'Scenarios' }) + '</span></div>' +
                  '<span class="avlviz-hint">' + langOf({ zh: '點節點可把鍵值帶入輸入框；← → 鍵逐步前進 / 倒帶，空白鍵播放 / 暫停', en: 'Click a node to load its key; ← → step forward / back, Space to play / pause' }) + '</span>' +
              '</div>' +
              '<div class="avlviz-workbench">' +
                  '<div class="avlviz-stagecol">' +
                      '<div class="avlviz-stepdesc" data-testid="avlviz-desc"></div>' +
                      '<div class="avlviz-stage" data-testid="avlviz-stage"></div>' +
                      '<div class="avlviz-transport" data-testid="avlviz-transport"></div>' +
                      '<div class="avlviz-legend">' +
                          '<span><i class="lbf"></i>' + langOf({ zh: '節點下方＝平衡因子 bf', en: 'Number below node = balance factor bf' }) + '</span>' +
                          '<span><i class="lh"></i>' + langOf({ zh: '本步驟主角（旋轉樞紐）', en: "This step's focus (rotation pivot)" }) + '</span>' +
                          '<span><i class="lim"></i>' + langOf({ zh: '失衡節點（|bf|=2）', en: 'Imbalanced node (|bf|=2)' }) + '</span>' +
                          '<span><i class="lbe"></i>' + langOf({ zh: 'β 子樹（旋轉時換邊的那包）', en: 'β subtree (the bundle that switches sides on rotation)' }) + '</span>' +
                      '</div>' +
                  '</div>' +
                  '<aside class="avlviz-logcol">' +
                      '<h4>' + langOf({ zh: '步驟紀錄', en: 'Step Log' }) + '</h4>' +
                      '<div class="avlviz-steplog" data-testid="avlviz-log"></div>' +
                  '</aside>' +
              '</div>' +
          '</div>';

      const input = host.querySelector('.avlviz-input');
      const stage = new AVLViz.Stage(host.querySelector('.avlviz-stage'), {
          emptyText: { zh: '空樹 —— 插入一個值，或載入一個劇本', en: 'Empty tree — insert a value, or load a scenario' },
          sub: true,
      });
      stage.onNodeClick = (key) => { input.value = key; };

      const attachCfg = {
          stage,
          descEl: host.querySelector('[data-testid="avlviz-desc"]'),
          logEl: host.querySelector('[data-testid="avlviz-log"]'),
          transportEl: host.querySelector('[data-testid="avlviz-transport"]'),
      };
      if (!_avlState) {
          const tree = new AVLViz.AVLTree();
          _avlState = { tree, hist: new AVLViz.History(Object.assign({ tree }, attachCfg)) };
      } else {
          _avlState.hist.attach(attachCfg);
      }

      function avlReset() {
          _avlState.tree = new AVLViz.AVLTree();
          _avlState.hist.tree = _avlState.tree;
          _avlState.hist.reset();
      }
      function avlInsert(v, opt) {
          if (!Number.isFinite(v)) { showStatus(langOf({ zh: '先輸入一個整數', en: 'Enter an integer first' }), '#fbbf24'); return false; }
          v = Math.round(v);
          if (_avlState.tree.size() >= 63) { showStatus(langOf({ zh: '節點太多了（上限 63），先刪一些吧', en: 'Too many nodes (max 63) — delete some first' }), '#fbbf24'); return false; }
          if (_avlState.tree.find(v)) { showStatus(langOf({ zh: v + ' 已經在樹裡了', en: v + ' is already in the tree' }), '#fbbf24'); return false; }
          _avlState.hist.runOp({ zh: '插入 ' + v, en: 'Insert ' + v }, () => _avlState.tree.insert(v), opt);
          return true;
      }
      function avlDelete(v, opt) {
          if (!Number.isFinite(v)) { showStatus(langOf({ zh: '先輸入一個整數', en: 'Enter an integer first' }), '#fbbf24'); return false; }
          v = Math.round(v);
          if (!_avlState.tree.find(v)) { showStatus(langOf({ zh: '樹裡沒有 ' + v, en: v + " isn't in the tree" }), '#fbbf24'); return false; }
          _avlState.hist.runOp({ zh: '刪除 ' + v, en: 'Delete ' + v }, () => _avlState.tree.delete(v), opt);
          return true;
      }

      host.querySelector('.avlviz-insert').addEventListener('click', () => { if (avlInsert(+input.value)) input.value = ''; });
      host.querySelector('.avlviz-delete').addEventListener('click', () => { if (avlDelete(+input.value)) input.value = ''; });
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { if (avlInsert(+input.value)) input.value = ''; } });
      host.querySelector('.avlviz-clear').addEventListener('click', () => { avlReset(); showStatus(langOf({ zh: '清空了', en: 'Cleared' }), '#94a3b8'); });

      const presetsEl = host.querySelector('[data-testid="avlviz-presets"]');
      AVLViz.PRESETS.forEach((p) => {
          const b = document.createElement('button');
          b.type = 'button'; b.className = 'avlviz-preset'; b.dataset.preset = p.id;
          b.textContent = langOf(p.name);
          const tip = langOf(p.tip || { zh: '', en: '' });
          if (tip) b.title = tip;
          b.addEventListener('click', () => {
              avlReset();
              for (const k of p.seed()) avlInsert(k, { play: false });
              if (p.final) {
                  const ready = _avlState.hist.steps.length - 1;
                  if (p.final.op === 'insert') avlInsert(p.final.v, { play: false });
                  else avlDelete(p.final.v, { play: false });
                  _avlState.hist.goTo(ready, false);
              } else {
                  _avlState.hist.goTo(0, false);
              }
              const zhTip = (p.tip && p.tip.zh) || '', enTip = (p.tip && p.tip.en) || '';
              showStatus(langOf({ zh: (zhTip ? zhTip + '。' : '') + '劇本已載入，按 ▶ 開始播放', en: (enTip ? enTip + '. ' : '') + 'Scenario loaded — press ▶ to play' }), '#94a3b8');
          });
          presetsEl.appendChild(b);
      });
  }
```

3c. In `onModeSwitch(mode)` add AVL playback-stop next to the RB one: at the top where it does
`if (_rbState) _rbState.hist.pause();`, add `if (_avlState) _avlState.hist.pause();`.

3d. In the `init()` keyboard handler (the `document.addEventListener('keydown', ...)` gated to
`tree-rb`), add a parallel AVL branch. Replace the guard so it handles both, e.g. add after the RB
block a second listener OR extend: the simplest safe edit is a SECOND `document.addEventListener`:
```js
      document.addEventListener('keydown', (e) => {
          if (C().getMode() !== 'tree-avl' || !_avlState) return;
          if (/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
          const h = _avlState.hist;
          if (e.key === 'ArrowRight') { e.preventDefault(); h.pause(); h.goTo(h.cursor + 1); }
          else if (e.key === 'ArrowLeft') { e.preventDefault(); h.pause(); h.goTo(h.cursor - 1); }
          else if (e.key === ' ') { e.preventDefault(); h.playing ? h.pause() : h.play(); }
      });
```

3e. Re-point the attach (`js/domains/tree.js:358`):
```js
  R().attach('tree-avl', { render: renderTreeAVL, code: () => codeTreeAVL, layout: { host: 'dynamic' } });
```
(Leave the dead `tree-avl` branches in `init()`'s `btnTreeAdd`/`btnTreeSearch` handlers and `insertAVL`
untouched — harmless; the legacy tree container is never shown for AVL now.)

- [ ] **Step 4: Duplicate the RB CSS block to `.avlviz-*` in `style.css`**

Copy the entire `.rbviz*` block (`style.css:2932–3009`, `.rbviz { ... }` through the media query and
`.rbviz .k-insert`) and paste it immediately after, then in the PASTED copy replace every `rbviz`
token with `avlviz` (so `.rbviz`→`.avlviz`, `.rbviz-toolbar`→`.avlviz-toolbar`, `.rbviz-empty`→
`.avlviz-empty`, `.rbviz-badge`→`.avlviz-badge`, `--rb-*` custom-prop NAMES may stay as `--rb-*` since
they're only referenced within this pasted block — keep them consistent within the copy). Then apply
the AVL node-state swaps in the PASTED copy only (RB block untouched):
- Remove the red/black node fills: any `.avlviz .nd.R { ... }` / `.avlviz .nd.B { ... }` rules — replace
  with a single neutral node fill: `.avlviz .nd .body { fill: var(--rb-node-black); stroke: var(--rb-node-stroke); }`
  (match whatever selector the copied block uses for the node body).
- Add AVL states: `.avlviz .nd.imbalanced .body { stroke: var(--rb-delred); stroke-width: 3px; }` (red
  ring), keep the existing `.avlviz .nd.hl .hlring` (amber focus) and `.avlviz .nd.beta` (violet) rules
  from the copy as-is.
- Ensure the `sub` label is visible: `.avlviz .nd .sub { fill: var(--rb-edge); font-size: 10px; }` (the
  RB copy may not style `.sub` since RB set no sub — add it).
Adjust selectors to match the exact structure of the copied block; the goal is: neutral nodes, bf
sub-label shown, `hl`/`beta`/`imbalanced` states styled, and all transport/log/legend chrome identical
to RB.

- [ ] **Step 5: Write the e2e spec** — create `tests/avl_observatory.spec.js`:

```js
const { test, expect } = require('@playwright/test');
const { loadMethod } = require('./helpers');
const path = require('path');

test.describe('tree-avl (AVL 旋轉觀測站)', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'zh'); } catch (e) {} });
        await page.goto('file://' + path.resolve(__dirname, '../index.html'));
        await loadMethod(page, 'tree-avl');
    });

    test('renders the sandbox with toolbar, 7 presets, transport and step log', async ({ page }) => {
        const sec = page.locator('[data-method-section="tree-avl"]');
        await expect(sec.locator('[data-testid="avlviz-input"]')).toBeVisible();
        await expect(sec.locator('.avlviz-preset')).toHaveCount(7);
        await expect(sec.locator('[data-testid="avlviz-transport"] .tbtn')).toHaveCount(5);
        await expect(sec.locator('.avlviz-logcol h4')).toHaveText('步驟紀錄');
    });

    test('code panel is a collapsed drawer, opened via the header toggle', async ({ page }) => {
        const sec = page.locator('[data-method-section="tree-avl"]');
        await expect(sec.locator('.method-section-grid .code-panel')).toHaveCount(0);
        const drawer = sec.locator('[data-testid="code-drawer"]');
        await expect(drawer).toBeHidden();
        await sec.locator('[data-testid="code-drawer-toggle"]').click();
        await expect(drawer).toBeVisible();
        await expect(drawer.locator('.code-panel-filename')).toContainText('tree_avl.cpp');
        await expect(drawer.locator('code')).toContainText('Rotate');
    });

    test('inserting an LL sequence grows the tree and logs a rotation', async ({ page }) => {
        const sec = page.locator('[data-method-section="tree-avl"]');
        const input = sec.locator('[data-testid="avlviz-input"]');
        for (const v of ['3', '2', '1']) { await input.fill(v); await sec.locator('[data-testid="avlviz-insert"]').click(); }
        await expect(sec.locator('[data-testid="avlviz-stage"] .nd')).toHaveCount(3, { timeout: 15000 });
        await expect(sec.locator('[data-testid="avlviz-log"] .dot.k-rotate').first()).toBeAttached();
        const cnt0 = await sec.locator('[data-testid="avlviz-transport"] .cnt').textContent();
        await page.keyboard.press('ArrowLeft');
        await expect(sec.locator('[data-testid="avlviz-transport"] .cnt')).not.toHaveText(cnt0);
    });

    test('LR preset loads parked; slider to the end shows a rotation', async ({ page }) => {
        const sec = page.locator('[data-method-section="tree-avl"]');
        await sec.locator('.avlviz-preset[data-preset="lr"]').click();
        await expect(sec.locator('[data-testid="avlviz-transport"] .tbtn.play')).toHaveText('▶');
        await sec.locator('[data-testid="avlviz-transport"] input[type=range]')
            .evaluate((el) => { el.value = el.max; el.dispatchEvent(new Event('input', { bubbles: true })); });
        await expect(sec.locator('[data-testid="avlviz-stage"] .nd')).toHaveCount(3);
        await expect(sec.locator('[data-testid="avlviz-log"] .dot.k-rotate').first()).toBeAttached();
    });

    test('delete-rot preset reaches a rotation at the end', async ({ page }) => {
        const sec = page.locator('[data-method-section="tree-avl"]');
        await sec.locator('.avlviz-preset[data-preset="delete-rot"]').click();
        await sec.locator('[data-testid="avlviz-transport"] input[type=range]')
            .evaluate((el) => { el.value = el.max; el.dispatchEvent(new Event('input', { bubbles: true })); });
        await expect(sec.locator('[data-testid="avlviz-log"] .dot.k-rotate').first()).toBeAttached();
    });

    test('duplicate insert rejected; clear empties the tree', async ({ page }) => {
        const sec = page.locator('[data-method-section="tree-avl"]');
        const input = sec.locator('[data-testid="avlviz-input"]');
        await input.fill('7'); await sec.locator('[data-testid="avlviz-insert"]').click();
        await input.fill('7'); await sec.locator('[data-testid="avlviz-insert"]').click();
        await expect(page.locator('#status-message')).toContainText('已經在樹裡了');
        await sec.locator('[data-testid="avlviz-clear"]').click();
        await expect(sec.locator('[data-testid="avlviz-stage"] .nd')).toHaveCount(0);
        await expect(sec.locator('.avlviz-empty')).toBeVisible();
    });

    test('other tree methods keep the side-by-side code panel', async ({ page }) => {
        await loadMethod(page, 'tree-bst');
        const sec = page.locator('[data-method-section="tree-bst"]');
        await expect(sec.locator('.method-section-grid .code-panel')).toHaveCount(1);
    });
});

test.describe('tree-avl (English)', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
        await page.goto('file://' + path.resolve(__dirname, '../index.html'));
        await loadMethod(page, 'tree-avl');
    });
    test('renders English UI and step log', async ({ page }) => {
        const sec = page.locator('[data-method-section="tree-avl"]');
        await expect(sec.locator('[data-testid="avlviz-insert"]')).toHaveText('Insert');
        await expect(sec.locator('.avlviz-logcol h4')).toHaveText('Step Log');
        const input = sec.locator('[data-testid="avlviz-input"]');
        await input.fill('1'); await sec.locator('[data-testid="avlviz-insert"]').click();
        await input.fill('2'); await sec.locator('[data-testid="avlviz-insert"]').click();
        await input.fill('3'); await sec.locator('[data-testid="avlviz-insert"]').click();
        await expect(sec.locator('[data-testid="avlviz-log"] .op-h').first()).toContainText('Insert');
    });
});
```

- [ ] **Step 6: Run the AVL e2e + unit + affected suites**

Run:
```bash
node --test tests/unit/tree_avl_viz.test.js
npx playwright test tests/avl_observatory.spec.js tests/tree_rb.spec.js
```
Expected: all PASS. `tests/tree_rb.spec.js` MUST stay green (RB untouched). If a legacy test drove the
old live-BST AVL, find it and update it:
```bash
grep -rln "tree-avl" tests/
```
(If a test asserted AVL in the shared `#tree-container`/`treeActions`, update it to the new `.avlviz`
markup or remove that AVL-specific assertion; leave `tree-bst`/`tree-splay` cases alone.)

- [ ] **Step 7: Commit**

```bash
git add js/domains/tree.js js/app.js index.html style.css tests/avl_observatory.spec.js
git commit -m "feat(dsvisual): tree-avl rotation observatory — renderer + wiring + styling + e2e"
```

---

## Self-Review

- **Spec coverage:** parallel `AVLViz` module (T1); AVLTree parent-pointer in-place rebalance with
  step-per-descent/update/imbalance/rotation + insert & delete (T1 core); balance-factor sub-label +
  imbalanced/hl/beta states (T1 Stage edits + T2 CSS); 7 presets (T1); renderer mirroring RB + attach +
  keyboard + `_avlState` (T2); app.js row/branch + index.html tag (T2); CSS duplication (T2); unit +
  e2e (T1/T2). RB untouched (constraints). All spec sections mapped. ✓
- **Placeholder scan:** none — every step has full code or an exact copy-range + enumerated edits. The
  `delete-rot` preset value is gated by a unit assertion (not a placeholder). ✓
- **Type consistency:** `AVLViz.{AVLTree,Stage,History,KIND_META,PRESETS}` used identically in T2 as
  defined in T1; frame/step fields (`kind,title,detail,hl,beta`) match `_emit` ↔ Stage; `serialize()`
  keys (`id,key,height,bf,left,right`) match Stage edit #2/#3; `code: () => codeTreeAVL` matches the
  existing global. History `runOp/goTo/attach/reset/steps/cursor/playing` match the RB copy. ✓

## Full-suite gate (before finishing)

Run the entire Playwright suite (`npx playwright test`) + `node --test tests/unit/` — all green — before
the whole-branch review (the deploy-pages workflow runs the full suite as a gate).
