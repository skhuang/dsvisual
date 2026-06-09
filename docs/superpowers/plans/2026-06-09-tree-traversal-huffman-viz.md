# Tree-Traversal & Huffman Visualizations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two interactive visualizations to dsvisual — binary tree traversal (`tree-traversal`) and Huffman coding (`huffman`) — each with Step/Run/Reset stepping, editable input, bilingual UI + slides, and tests.

**Architecture:** Pure frame-generators live in standalone dual-export modules (`tree_traversal_viz.js`, `huffman_viz.js`, mirroring `heap_models.js`) so they are unit-testable under `node --test`. DOM rendering functions (`renderTreeTraversal`, `renderHuffman`) are added inside app.js's main closure, reusing existing private helpers `acquireDynamicVizHost()`, `buildStepControls(onStep,onReset,intervalMs)`, and `computeTreeLayout()`. Both methods join the `trees` group and render into `#dynamic-viz-host` like the existing segment/fenwick/bloom visualizations.

**Tech Stack:** Vanilla JS (browser globals + IIFE modules), Node test runner, Playwright, Marp slides via `build_slides.js`, Prism code panel via `build_db.js`.

**Spec:** `docs/superpowers/specs/2026-06-09-tree-traversal-huffman-viz-design.md`

---

## File Structure

- `tree_traversal_viz.js` (new) — pure: `buildTreeFromValues`, `insertBST`, `buildTraversalFrames`, `SAMPLE_VALUES`. Exposes `window.TreeTraversalViz` + `module.exports`.
- `huffman_viz.js` (new) — pure: `computeFrequencies`, `buildHuffmanFrames`. Exposes `window.HuffmanViz` + `module.exports`.
- `tree_traversal.cpp`, `huffman.cpp` (new) — C++ reference shown in code panel.
- `tests/unit/tree_traversal_viz.test.js`, `tests/unit/huffman_viz.test.js` (new) — unit tests.
- `tests/tree_traversal.spec.js`, `tests/huffman.spec.js` (new) — Playwright E2E.
- `app.js` (modify) — register methods, code lookup, updateLayout branches, renderAll dispatch, `renderTreeTraversal`/`renderHuffman`.
- `build_db.js` (modify) — `.cpp`→var mappings.
- `index.html` (modify) — load two new module scripts before app.js.
- `i18n.js` (modify) — `method.*` + UI labels (en/zh).
- `desc_db.js` (modify) — two entries.
- `slides_db.js` (modify) — two bilingual decks.
- `style.css` (modify) — new highlight/panel classes.
- Regenerated: `code_db.js`, `slides_rendered.js` (+ `slides/zh|en/{tree-traversal,huffman}.md`).

---

## Task 1: Feature branch + tree-traversal pure module (TDD)

**Files:**
- Create: `tree_traversal_viz.js`
- Test: `tests/unit/tree_traversal_viz.test.js`

- [ ] **Step 1: Create the feature branch**

Run:
```bash
cd /Users/skhuang/course/dsvisual
git checkout -b feat/tree-traversal-huffman-viz
git branch --show-current
```
Expected: `feat/tree-traversal-huffman-viz`.

- [ ] **Step 2: Write the failing unit test**

Create `tests/unit/tree_traversal_viz.test.js`:
```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { buildTreeFromValues, buildTraversalFrames, SAMPLE_VALUES } = require('../../tree_traversal_viz');

const TREE = buildTreeFromValues(SAMPLE_VALUES); // BST of [50,30,70,20,40,60,80]
const finalVisited = (order, mode) => {
  const f = buildTraversalFrames(TREE, order, mode);
  return f[f.length - 1].visited;
};

test('preorder order is correct (recursive & iterative agree)', () => {
  const expected = [50, 30, 20, 40, 70, 60, 80];
  assert.deepEqual(finalVisited('preorder', 'recursive'), expected);
  assert.deepEqual(finalVisited('preorder', 'iterative'), expected);
});

test('inorder order is correct (recursive & iterative agree)', () => {
  const expected = [20, 30, 40, 50, 60, 70, 80];
  assert.deepEqual(finalVisited('inorder', 'recursive'), expected);
  assert.deepEqual(finalVisited('inorder', 'iterative'), expected);
});

test('postorder order is correct (recursive & iterative agree)', () => {
  const expected = [20, 40, 30, 60, 80, 70, 50];
  assert.deepEqual(finalVisited('postorder', 'recursive'), expected);
  assert.deepEqual(finalVisited('postorder', 'iterative'), expected);
});

test('levelorder (BFS) order is correct', () => {
  assert.deepEqual(finalVisited('levelorder', 'iterative'), [50, 30, 70, 20, 40, 60, 80]);
});

test('each node visited exactly once; frames carry msg with zh & en', () => {
  const f = buildTraversalFrames(TREE, 'inorder', 'iterative');
  const last = f[f.length - 1].visited;
  assert.equal(last.length, SAMPLE_VALUES.length);
  assert.equal(new Set(last).size, SAMPLE_VALUES.length);
  for (const fr of f) { assert.ok(fr.msg.zh && fr.msg.en); assert.ok(Array.isArray(fr.visited)); }
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `cd /Users/skhuang/course/dsvisual && node --test tests/unit/tree_traversal_viz.test.js`
Expected: FAIL — `Cannot find module '../../tree_traversal_viz'`.

- [ ] **Step 4: Implement `tree_traversal_viz.js`**

Create `tree_traversal_viz.js`:
```js
(function (global) {
  function makeNode(val) { return { val: val, left: null, right: null, id: 'tt-' + val }; }

  function insertBST(root, val) {
    if (root === null) return makeNode(val);
    if (val < root.val) root.left = insertBST(root.left, val);
    else if (val > root.val) root.right = insertBST(root.right, val);
    return root; // duplicates ignored
  }

  function buildTreeFromValues(vals) {
    let root = null;
    for (const v of vals) root = insertBST(root, v);
    return root;
  }

  const SAMPLE_VALUES = [50, 30, 70, 20, 40, 60, 80];

  function buildTraversalFrames(root, order, mode) {
    const frames = [];
    const visited = [];
    function snap(current, kind, items, msg) {
      frames.push({
        current: current ? current.id : null,
        visited: visited.slice(),
        aux: { kind: kind, items: items.slice() },
        msg: msg
      });
    }

    if (order === 'levelorder') {
      const queue = [];
      if (root) queue.push(root);
      snap(null, 'queue', queue.map(n => n.val), { zh: '初始化:根節點入佇列', en: 'Init: enqueue root' });
      while (queue.length) {
        const node = queue.shift();
        visited.push(node.val);
        if (node.left) queue.push(node.left);
        if (node.right) queue.push(node.right);
        snap(node, 'queue', queue.map(n => n.val),
          { zh: '出佇列並造訪 ' + node.val + ',子節點入佇列', en: 'Dequeue & visit ' + node.val + ', enqueue children' });
      }
      snap(null, 'queue', [], { zh: '完成,佇列已空', en: 'Done; queue empty' });
      return frames;
    }

    if (mode === 'recursive') {
      const callstack = [];
      function rec(node) {
        if (!node) return;
        callstack.push(node.val);
        if (order === 'preorder') { visited.push(node.val); snap(node, 'callstack', callstack, { zh: '造訪 ' + node.val + '(前序:訪問→左→右)', en: 'Visit ' + node.val + ' (pre: node→L→R)' }); }
        else snap(node, 'callstack', callstack, { zh: '進入 ' + node.val, en: 'Enter ' + node.val });
        rec(node.left);
        if (order === 'inorder') { visited.push(node.val); snap(node, 'callstack', callstack, { zh: '造訪 ' + node.val + '(中序:左→訪問→右)', en: 'Visit ' + node.val + ' (in: L→node→R)' }); }
        rec(node.right);
        if (order === 'postorder') { visited.push(node.val); snap(node, 'callstack', callstack, { zh: '造訪 ' + node.val + '(後序:左→右→訪問)', en: 'Visit ' + node.val + ' (post: L→R→node)' }); }
        callstack.pop();
      }
      snap(null, 'callstack', [], { zh: '開始遞迴走訪', en: 'Begin recursive traversal' });
      rec(root);
      snap(null, 'callstack', [], { zh: '完成', en: 'Done' });
      return frames;
    }

    // iterative
    const stack = [];
    if (order === 'preorder') {
      if (root) stack.push(root);
      snap(null, 'stack', stack.map(n => n.val), { zh: '根入堆疊', en: 'Push root' });
      while (stack.length) {
        const node = stack.pop();
        visited.push(node.val);
        if (node.right) stack.push(node.right);
        if (node.left) stack.push(node.left);
        snap(node, 'stack', stack.map(n => n.val), { zh: '彈出並造訪 ' + node.val + ',右、左子入堆疊', en: 'Pop & visit ' + node.val + ', push R then L' });
      }
    } else if (order === 'inorder') {
      let curr = root;
      while (curr || stack.length) {
        while (curr) { stack.push(curr); snap(curr, 'stack', stack.map(n => n.val), { zh: '沿左鏈下推 ' + curr.val, en: 'Go left, push ' + curr.val }); curr = curr.left; }
        const node = stack.pop();
        visited.push(node.val);
        snap(node, 'stack', stack.map(n => n.val), { zh: '彈出並造訪 ' + node.val + ',轉向右子', en: 'Pop & visit ' + node.val + ', go right' });
        curr = node.right;
      }
    } else { // postorder, two-stack
      const s2 = [];
      if (root) stack.push(root);
      while (stack.length) {
        const node = stack.pop();
        s2.push(node);
        if (node.left) stack.push(node.left);
        if (node.right) stack.push(node.right);
        snap(node, 'stack', stack.map(n => n.val), { zh: '搬移 ' + node.val + ' 到輸出堆疊', en: 'Move ' + node.val + ' to out-stack' });
      }
      while (s2.length) {
        const node = s2.pop();
        visited.push(node.val);
        snap(node, 'stack', s2.map(n => n.val), { zh: '從輸出堆疊彈出並造訪 ' + node.val, en: 'Pop out-stack & visit ' + node.val });
      }
    }
    snap(null, 'stack', [], { zh: '完成', en: 'Done' });
    return frames;
  }

  const api = { makeNode, insertBST, buildTreeFromValues, buildTraversalFrames, SAMPLE_VALUES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.TreeTraversalViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd /Users/skhuang/course/dsvisual && node --test tests/unit/tree_traversal_viz.test.js`
Expected: PASS — 5 tests pass.

- [ ] **Step 6: Commit**

```bash
cd /Users/skhuang/course/dsvisual
git add tree_traversal_viz.js tests/unit/tree_traversal_viz.test.js
git commit -m "feat(viz): tree-traversal pure frame generator + unit tests"
```

---

## Task 2: Huffman pure module (TDD)

**Files:**
- Create: `huffman_viz.js`
- Test: `tests/unit/huffman_viz.test.js`

- [ ] **Step 1: Write the failing unit test**

Create `tests/unit/huffman_viz.test.js`:
```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { computeFrequencies, buildHuffmanFrames } = require('../../huffman_viz');

function isPrefixFree(codes) {
  const list = Object.values(codes);
  for (let i = 0; i < list.length; i++)
    for (let j = 0; j < list.length; j++)
      if (i !== j && list[j].startsWith(list[i])) return false;
  return true;
}
function wpl(codes, freqMap) {
  return Object.entries(codes).reduce((s, [sym, code]) => s + code.length * freqMap[sym], 0);
}

test('computeFrequencies counts chars, maps space to visible glyph, sorts asc', () => {
  const f = computeFrequencies('ABRACADABRA');
  const m = Object.fromEntries(f.map(x => [x.sym, x.freq]));
  assert.deepEqual(m, { A: 5, B: 2, R: 2, C: 1, D: 1 });
  for (let i = 1; i < f.length; i++) assert.ok(f[i - 1].freq <= f[i].freq);
  const sp = computeFrequencies('a b');
  assert.ok(sp.some(x => x.sym === '␣'));
});

test('forest shrinks by one per merge; total frequency conserved', () => {
  const freqs = computeFrequencies('ABRACADABRA');
  const { frames, nodes, root } = buildHuffmanFrames(freqs);
  const merges = frames.filter(f => f.phase === 'merge');
  assert.equal(merges.length, freqs.length - 1);
  const total = freqs.reduce((s, f) => s + f.freq, 0);
  assert.equal(nodes[root].freq, total);
});

test('codes are prefix-free and WPL is optimal for {1,1,2,4}', () => {
  const freqs = [{ sym: 'a', freq: 1 }, { sym: 'b', freq: 1 }, { sym: 'c', freq: 2 }, { sym: 'd', freq: 4 }];
  const { codes } = buildHuffmanFrames(freqs);
  assert.ok(isPrefixFree(codes));
  assert.equal(wpl(codes, { a: 1, b: 1, c: 2, d: 4 }), 14);
});

test('single symbol gets a 1-bit code', () => {
  const { codes } = buildHuffmanFrames([{ sym: 'x', freq: 7 }]);
  assert.equal(codes['x'], '0');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd /Users/skhuang/course/dsvisual && node --test tests/unit/huffman_viz.test.js`
Expected: FAIL — `Cannot find module '../../huffman_viz'`.

- [ ] **Step 3: Implement `huffman_viz.js`**

Create `huffman_viz.js`:
```js
(function (global) {
  function computeFrequencies(text) {
    const map = new Map();
    for (const ch of text) {
      const key = ch === ' ' ? '␣' : ch;
      map.set(key, (map.get(key) || 0) + 1);
    }
    const arr = Array.from(map, ([sym, freq]) => ({ sym, freq }));
    arr.sort((a, b) => a.freq - b.freq || (a.sym < b.sym ? -1 : a.sym > b.sym ? 1 : 0));
    return arr;
  }

  function buildHuffmanFrames(freqs) {
    let seq = 0;
    const nodes = {};
    function node(props) {
      const id = 'hf-' + seq++;
      nodes[id] = Object.assign({ id: id, freq: 0, sym: null, left: null, right: null, seq: nodes._n = (nodes._n || 0) + 1 }, props);
      return id;
    }
    let forest = freqs.map(f => node({ freq: f.freq, sym: f.sym }));
    const frames = [];
    const orderForest = () => forest.sort((a, b) => nodes[a].freq - nodes[b].freq || nodes[a].seq - nodes[b].seq);
    const pqView = () => orderForest().map(id => ({ sym: nodes[id].sym, freq: nodes[id].freq, id }));
    function snap(picked, merged, phase, msg) {
      frames.push({ forestRoots: forest.slice(), pq: pqView().map(x => ({ sym: x.sym, freq: x.freq })), picked: picked, merged: merged, phase: phase, msg: msg });
    }

    snap(null, null, 'init', { zh: '初始化:每個符號各成一棵單節點樹', en: 'Init: each symbol is a single-node tree' });

    if (forest.length === 1) {
      const only = forest[0];
      const codes = {}; codes[nodes[only].sym] = '0';
      snap(null, null, 'done', { zh: '只有一種符號,給定 1 位元碼', en: 'Single symbol: assign 1-bit code' });
      return { frames, codes, nodes, root: only };
    }

    while (forest.length > 1) {
      orderForest();
      const a = forest[0], b = forest[1];
      snap([a, b], null, 'pick', { zh: '取出兩個最小頻率:' + nodes[a].freq + ' 與 ' + nodes[b].freq, en: 'Pick two smallest: ' + nodes[a].freq + ' and ' + nodes[b].freq });
      const m = node({ freq: nodes[a].freq + nodes[b].freq, left: a, right: b });
      forest = forest.slice(2);
      forest.push(m);
      snap([a, b], m, 'merge', { zh: '合併為頻率 ' + nodes[m].freq + ' 的新節點', en: 'Merge into new node, freq ' + nodes[m].freq });
    }

    const root = forest[0];
    const codes = {};
    (function assign(id, prefix) {
      const n = nodes[id];
      if (n.left === null && n.right === null) { codes[n.sym] = prefix || '0'; return; }
      if (n.left) assign(n.left, prefix + '0');
      if (n.right) assign(n.right, prefix + '1');
    })(root, '');
    snap(null, null, 'done', { zh: '完成 Huffman 樹,產生前綴碼', en: 'Huffman tree complete; prefix codes generated' });
    return { frames, codes, nodes, root };
  }

  const api = { computeFrequencies, buildHuffmanFrames };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.HuffmanViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd /Users/skhuang/course/dsvisual && node --test tests/unit/huffman_viz.test.js`
Expected: PASS — 4 tests pass.

- [ ] **Step 5: Commit**

```bash
cd /Users/skhuang/course/dsvisual
git add huffman_viz.js tests/unit/huffman_viz.test.js
git commit -m "feat(viz): huffman pure frame generator + unit tests"
```

---

## Task 3: C++ reference files + code_db regeneration

**Files:**
- Create: `tree_traversal.cpp`, `huffman.cpp`
- Modify: `build_db.js`
- Regenerate: `code_db.js`

- [ ] **Step 1: Create `tree_traversal.cpp`**
```cpp
#include <iostream>
#include <stack>
#include <queue>
struct Node { int val; Node* left; Node* right; Node(int v):val(v),left(nullptr),right(nullptr){} };

void inorderRecursive(Node* n) {
    if (!n) return;
    inorderRecursive(n->left);
    std::cout << n->val << ' ';
    inorderRecursive(n->right);
}

void inorderIterative(Node* root) {
    std::stack<Node*> st; Node* cur = root;
    while (cur || !st.empty()) {
        while (cur) { st.push(cur); cur = cur->left; }
        cur = st.top(); st.pop();
        std::cout << cur->val << ' ';
        cur = cur->right;
    }
}

void levelOrder(Node* root) {
    if (!root) return;
    std::queue<Node*> q; q.push(root);
    while (!q.empty()) {
        Node* n = q.front(); q.pop();
        std::cout << n->val << ' ';
        if (n->left) q.push(n->left);
        if (n->right) q.push(n->right);
    }
}
```

- [ ] **Step 2: Create `huffman.cpp`**
```cpp
#include <queue>
#include <vector>
#include <string>
#include <unordered_map>
struct HNode { int freq; char sym; HNode* l; HNode* r;
    HNode(int f, char s):freq(f),sym(s),l(nullptr),r(nullptr){} };
struct Cmp { bool operator()(HNode* a, HNode* b){ return a->freq > b->freq; } };

HNode* buildHuffman(const std::unordered_map<char,int>& freq) {
    std::priority_queue<HNode*, std::vector<HNode*>, Cmp> pq;
    for (auto& kv : freq) pq.push(new HNode(kv.second, kv.first));
    while (pq.size() > 1) {
        HNode* a = pq.top(); pq.pop();
        HNode* b = pq.top(); pq.pop();
        HNode* m = new HNode(a->freq + b->freq, '\0');
        m->l = a; m->r = b;
        pq.push(m);
    }
    return pq.empty() ? nullptr : pq.top();
}

void assignCodes(HNode* n, std::string p, std::unordered_map<char,std::string>& out) {
    if (!n) return;
    if (!n->l && !n->r) { out[n->sym] = p.empty() ? "0" : p; return; }
    assignCodes(n->l, p + "0", out);
    assignCodes(n->r, p + "1", out);
}
```

- [ ] **Step 3: Register both files in `build_db.js`**

In `build_db.js`, inside the `mappings` object, add (e.g. right after the `'tree_segment.cpp'` / `'tree_fenwick.cpp'` lines):
```js
    'tree_traversal.cpp': 'codeTreeTraversal',
    'huffman.cpp': 'codeHuffman',
```

- [ ] **Step 4: Regenerate `code_db.js`**

Run: `cd /Users/skhuang/course/dsvisual && node build_db.js`
Expected: prints a success/summary line; no error.

- [ ] **Step 5: Verify the two new code vars exist**

Run:
```bash
cd /Users/skhuang/course/dsvisual
grep -c 'const codeTreeTraversal' code_db.js
grep -c 'const codeHuffman' code_db.js
```
Expected: `1` and `1`.

- [ ] **Step 6: Commit**
```bash
cd /Users/skhuang/course/dsvisual
git add tree_traversal.cpp huffman.cpp build_db.js code_db.js
git commit -m "feat(viz): add C++ refs for tree-traversal & huffman; regen code_db"
```

---

## Task 4: app.js registration + index.html script loading

**Files:**
- Modify: `app.js` (METHOD_GROUPS ~line 110-129, getCodeForMethod ~line 283, updateLayout ~line 2222, renderAll ~line 2435)
- Modify: `index.html` (~line 453)

- [ ] **Step 1: Register both methods in `METHOD_GROUPS`**

In `app.js`, inside the `trees` group's `methods` array, after the `tree-fenwick` entry, add:
```js
            { id: 'tree-traversal', title: 'Tree Traversal', file: 'tree_traversal.cpp', visualizer: 'tree', controls: 'tree' },
            { id: 'huffman', title: 'Huffman Coding', file: 'huffman.cpp', visualizer: 'tree', controls: 'tree' },
```

- [ ] **Step 2: Add code lookup entries in `getCodeForMethod()`**

In `app.js`, in the `codeByMethod` object, after `'tree-fenwick': codeTreeFenwick,` add:
```js
        'tree-traversal': codeTreeTraversal,
        'huffman': codeHuffman,
```

- [ ] **Step 3: Add `updateLayout()` branches**

In `app.js`, after the existing `else if (currentMode === 'tree-fenwick') { ... }` block, add:
```js
        else if (currentMode === 'tree-traversal') {
            codeTitle.textContent = 'tree_traversal.cpp';
            codeDisplay.textContent = codeTreeTraversal;
        }
        else if (currentMode === 'huffman') {
            codeTitle.textContent = 'huffman.cpp';
            codeDisplay.textContent = codeHuffman;
        }
```

- [ ] **Step 4: Add `renderAll()` dispatch**

In `app.js`, in `renderAll()`, right after the line `else if (currentMode === 'tree-fenwick') renderFenwick();` and BEFORE the generic `else if (['tree-bst', ...].includes(currentMode)) renderTree();` line, add:
```js
        else if (currentMode === 'tree-traversal') renderTreeTraversal();
        else if (currentMode === 'huffman') renderHuffman();
```

- [ ] **Step 5: Load the two pure modules in `index.html`**

In `index.html`, immediately after `<script src="code_db.js"></script>` (line 453), add:
```html
    <script src="tree_traversal_viz.js"></script>
    <script src="huffman_viz.js"></script>
```

- [ ] **Step 6: Add temporary stubs so the app loads (replaced in Tasks 5-6)**

In `app.js`, near the other render functions (e.g. just before `function renderSegmentTree()`), add stubs so `renderAll` references resolve:
```js
    function renderTreeTraversal() { const host = acquireDynamicVizHost(); host.textContent = 'tree-traversal (pending)'; }
    function renderHuffman() { const host = acquireDynamicVizHost(); host.textContent = 'huffman (pending)'; }
```

- [ ] **Step 7: Smoke-test the page loads and both methods are selectable**

Run: `cd /Users/skhuang/course/dsvisual && node -e "require('./tree_traversal_viz.js'); require('./huffman_viz.js'); console.log('modules load OK')"`
Expected: `modules load OK`.
Then open `index.html` in a browser (or rely on the Task 10 E2E), confirm Trees group lists "Tree Traversal" and "Huffman Coding" and selecting each shows the stub text + correct code panel filename. (Visual confirmation; automated check in Task 10.)

- [ ] **Step 8: Commit**
```bash
cd /Users/skhuang/course/dsvisual
git add app.js index.html
git commit -m "feat(viz): register tree-traversal & huffman methods + load modules"
```

---

## Task 5: `renderTreeTraversal()` in app.js + CSS

**Files:**
- Modify: `app.js` (replace the `renderTreeTraversal` stub)
- Modify: `style.css`

- [ ] **Step 1: Implement `renderTreeTraversal()`**

In `app.js`, replace the `renderTreeTraversal` stub with:
```js
    let _ttState = null;
    function renderTreeTraversal() {
        const host = acquireDynamicVizHost();
        if (!_ttState) {
            _ttState = { values: TreeTraversalViz.SAMPLE_VALUES.slice(), order: 'inorder', mode: 'recursive' };
        }
        const st = _ttState;
        const root = TreeTraversalViz.buildTreeFromValues(st.values);
        let frames = TreeTraversalViz.buildTraversalFrames(root, st.order, st.mode);
        let idx = 0;

        host.innerHTML =
            '<div class="tt-controls">' +
              '<input type="text" class="tt-input" placeholder="50,30,70,..." value="' + st.values.join(',') + '">' +
              '<button type="button" class="tt-build">Build</button>' +
              '<button type="button" class="tt-rand">Random</button>' +
              '<select class="tt-order">' +
                '<option value="preorder">Preorder</option>' +
                '<option value="inorder">Inorder</option>' +
                '<option value="postorder">Postorder</option>' +
                '<option value="levelorder">Level-order</option>' +
              '</select>' +
              '<select class="tt-mode">' +
                '<option value="recursive">Recursive</option>' +
                '<option value="iterative">Iterative</option>' +
              '</select>' +
            '</div>' +
            '<div class="tt-stage"><svg class="tt-edges"></svg><div class="tt-nodes"></div></div>' +
            '<div class="tt-aux"></div>' +
            '<div class="tt-output"><strong>Output:</strong> <span class="tt-seq"></span></div>' +
            '<div class="tt-phase"></div>';
        host.querySelector('.tt-order').value = st.order;
        host.querySelector('.tt-mode').value = st.mode;

        const nodesMeta = [];
        computeTreeLayout(root, 200, 30, 90, nodesMeta);
        const nodesEl = host.querySelector('.tt-nodes');
        const edgesEl = host.querySelector('.tt-edges');
        const metaById = {};
        nodesMeta.forEach(m => { metaById[m.id] = m; });
        function drawEdges() {
            edgesEl.innerHTML = '';
            function walk(n) {
                if (!n) return;
                [n.left, n.right].forEach(c => {
                    if (!c) return;
                    const a = metaById[n.id], b = metaById[c.id];
                    edgesEl.innerHTML += '<line x1="' + (a.x + 20) + '" y1="' + (a.y + 20) + '" x2="' + (b.x + 20) + '" y2="' + (b.y + 20) + '" stroke="#94a3b8" stroke-width="2"/>';
                    walk(c);
                });
            }
            walk(root);
        }
        nodesMeta.forEach(m => {
            const d = document.createElement('div');
            d.className = 'tree-node'; d.id = 'tt-node-' + m.id; d.textContent = m.val;
            d.style.left = m.x + 'px'; d.style.top = m.y + 'px';
            nodesEl.appendChild(d);
        });
        drawEdges();

        function paint() {
            const fr = frames[idx];
            nodesMeta.forEach(m => {
                const el = document.getElementById('tt-node-' + m.id);
                el.classList.remove('active', 'visited');
                if (fr.visited.includes(m.val)) el.classList.add('visited');
                if (fr.current === m.id) el.classList.add('active');
            });
            host.querySelector('.tt-seq').textContent = fr.visited.join(', ');
            const auxLabel = { stack: 'Stack', queue: 'Queue', callstack: 'Call stack' }[fr.aux.kind];
            host.querySelector('.tt-aux').innerHTML =
                '<span class="tt-aux-label">' + auxLabel + ':</span> ' +
                fr.aux.items.map(v => '<span class="tt-aux-cell">' + v + '</span>').join('');
            host.querySelector('.tt-phase').textContent = (currentLang === 'zh' ? fr.msg.zh : fr.msg.en);
        }
        function step() { if (idx < frames.length - 1) { idx++; paint(); return idx < frames.length - 1; } return false; }
        function reset() { idx = 0; paint(); }

        host.appendChild(buildStepControls(step, reset, 700));
        paint();

        function rebuild() {
            st.order = host.querySelector('.tt-order').value;
            st.mode = host.querySelector('.tt-mode').value;
            renderTreeTraversal();
        }
        host.querySelector('.tt-order').onchange = rebuild;
        host.querySelector('.tt-mode').onchange = rebuild;
        host.querySelector('.tt-build').onclick = () => {
            const vals = host.querySelector('.tt-input').value.split(',').map(s => parseInt(s.trim(), 10)).filter(n => Number.isFinite(n));
            if (vals.length) { st.values = vals; renderTreeTraversal(); }
        };
        host.querySelector('.tt-rand').onclick = () => {
            const n = 6 + Math.floor(Math.random() * 3);
            const set = new Set();
            while (set.size < n) set.add(10 + Math.floor(Math.random() * 90));
            st.values = Array.from(set);
            renderTreeTraversal();
        };
    }
```
Note: `currentLang` is app.js's current language variable (used elsewhere for `t()`); if the variable has a different name in this codebase, use the same one the existing code reads when switching language. Verify by grepping `currentLang` / how `t()` resolves language before this step.

- [ ] **Step 2: Add CSS for tree-traversal**

In `style.css`, append:
```css
.tt-controls { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; align-items: center; }
.tt-stage { position: relative; height: 320px; }
.tt-stage .tt-edges { position: absolute; inset: 0; width: 100%; height: 100%; }
.tt-stage .tt-nodes { position: absolute; inset: 0; }
.tree-node.active { background: #f59e0b; border-color: #b45309; transform: scale(1.12); }
.tree-node.visited { background: #34d399; border-color: #059669; }
.tt-aux { margin: 8px 0; min-height: 28px; }
.tt-aux-label { font-weight: 700; color: #2c5282; }
.tt-aux-cell { display: inline-block; min-width: 26px; padding: 2px 6px; margin: 0 2px; background: #e2e8f0; border-radius: 4px; text-align: center; }
.tt-output { margin: 6px 0; }
.tt-phase { margin-top: 6px; color: #1e40af; font-style: italic; }
```

- [ ] **Step 3: Manual/E2E verification deferred to Task 10. Quick sanity:**

Run: `cd /Users/skhuang/course/dsvisual && node --test tests/unit/tree_traversal_viz.test.js`
Expected: still PASS (no regression to pure logic).

- [ ] **Step 4: Commit**
```bash
cd /Users/skhuang/course/dsvisual
git add app.js style.css
git commit -m "feat(viz): implement renderTreeTraversal with step controls + styles"
```

---

## Task 6: `renderHuffman()` in app.js + CSS

**Files:**
- Modify: `app.js` (replace the `renderHuffman` stub)
- Modify: `style.css`

- [ ] **Step 1: Implement `renderHuffman()`**

In `app.js`, replace the `renderHuffman` stub with:
```js
    let _hfState = null;
    function renderHuffman() {
        const host = acquireDynamicVizHost();
        if (!_hfState) _hfState = { text: 'ABRACADABRA' };
        const st = _hfState;
        const freqs = HuffmanViz.computeFrequencies(st.text);
        const result = HuffmanViz.buildHuffmanFrames(freqs);
        const frames = result.frames, nodes = result.nodes, codes = result.codes;
        let idx = 0;

        host.innerHTML =
            '<div class="hf-controls">' +
              '<input type="text" class="hf-input" value="' + st.text.replace(/"/g, '&quot;') + '">' +
              '<button type="button" class="hf-apply">Apply</button>' +
            '</div>' +
            '<div class="hf-pq"><strong>Priority queue:</strong> <span class="hf-pq-list"></span></div>' +
            '<div class="hf-stage"><svg class="hf-edges"></svg><div class="hf-nodes"></div></div>' +
            '<div class="hf-codes"></div>' +
            '<div class="hf-phase"></div>';

        const nodesEl = host.querySelector('.hf-nodes');
        const edgesEl = host.querySelector('.hf-edges');

        function layoutForest(rootIds) {
            // position each root tree; spread roots horizontally
            const meta = {};
            const width = host.querySelector('.hf-stage').clientWidth || 760;
            const slot = width / (rootIds.length + 1);
            rootIds.forEach((rid, i) => {
                place(rid, (i + 1) * slot, 30, Math.max(40, slot / 2.4), meta);
            });
            return meta;
            function place(id, x, y, dx, m) {
                const n = nodes[id];
                m[id] = { x, y, label: (n.sym !== null ? n.sym : '') + (n.sym !== null ? ':' : '') + n.freq, isLeaf: n.sym !== null };
                if (n.left) place(n.left, x - dx, y + 60, dx * 0.6, m);
                if (n.right) place(n.right, x + dx, y + 60, dx * 0.6, m);
            }
        }

        function paint() {
            const fr = frames[idx];
            // PQ list
            host.querySelector('.hf-pq-list').innerHTML = fr.pq.map(p =>
                '<span class="hf-pq-card">' + (p.sym !== null ? p.sym + ':' : '') + p.freq + '</span>').join('');
            // forest
            const meta = layoutForest(fr.forestRoots);
            nodesEl.innerHTML = ''; edgesEl.innerHTML = '';
            Object.keys(meta).forEach(id => {
                const m = meta[id];
                const d = document.createElement('div');
                d.className = 'tree-node hf-node' + (m.isLeaf ? ' leaf' : '');
                if (fr.picked && fr.picked.includes(id)) d.classList.add('picked');
                if (fr.merged === id) d.classList.add('merged');
                d.textContent = m.label;
                d.style.left = m.x + 'px'; d.style.top = m.y + 'px';
                nodesEl.appendChild(d);
                const n = nodes[id];
                [n.left, n.right].forEach(c => {
                    if (c && meta[c]) edgesEl.innerHTML += '<line x1="' + (m.x + 20) + '" y1="' + (m.y + 20) + '" x2="' + (meta[c].x + 20) + '" y2="' + (meta[c].y + 20) + '" stroke="#94a3b8" stroke-width="2"/>';
                });
            });
            // codes table on done
            if (fr.phase === 'done') {
                const totalBits = Object.entries(codes).reduce((s, [sym, c]) => {
                    const f = freqs.find(x => x.sym === sym); return s + c.length * (f ? f.freq : 0);
                }, 0);
                const fixedBits = freqs.reduce((s, f) => s + f.freq, 0) * Math.max(1, Math.ceil(Math.log2(Math.max(1, freqs.length))));
                host.querySelector('.hf-codes').innerHTML =
                    '<table class="hf-code-table"><thead><tr><th>Symbol</th><th>Freq</th><th>Code</th></tr></thead><tbody>' +
                    freqs.map(f => '<tr><td>' + f.sym + '</td><td>' + f.freq + '</td><td><code>' + codes[f.sym] + '</code></td></tr>').join('') +
                    '</tbody></table>' +
                    '<div class="hf-stats">Huffman: ' + totalBits + ' bits vs fixed-length: ' + fixedBits + ' bits</div>';
            } else {
                host.querySelector('.hf-codes').innerHTML = '';
            }
            host.querySelector('.hf-phase').textContent = (currentLang === 'zh' ? fr.msg.zh : fr.msg.en);
        }
        function step() { if (idx < frames.length - 1) { idx++; paint(); return idx < frames.length - 1; } return false; }
        function reset() { idx = 0; paint(); }

        host.appendChild(buildStepControls(step, reset, 800));
        paint();

        host.querySelector('.hf-apply').onclick = () => {
            const v = host.querySelector('.hf-input').value;
            if (v && v.length) { st.text = v; renderHuffman(); }
        };
    }
```
Note: same `currentLang` caveat as Task 5 Step 1.

- [ ] **Step 2: Add CSS for huffman**

In `style.css`, append:
```css
.hf-controls { display: flex; gap: 8px; margin-bottom: 10px; }
.hf-controls .hf-input { flex: 1; }
.hf-pq { margin: 6px 0; }
.hf-pq-card { display: inline-block; padding: 3px 8px; margin: 2px; background: #dbeafe; border: 1px solid #93c5fd; border-radius: 6px; font-weight: 600; }
.hf-stage { position: relative; height: 300px; margin: 8px 0; }
.hf-stage .hf-edges { position: absolute; inset: 0; width: 100%; height: 100%; }
.hf-stage .hf-nodes { position: absolute; inset: 0; }
.hf-node.leaf { background: #bfdbfe; }
.hf-node.picked { background: #f59e0b; border-color: #b45309; }
.hf-node.merged { background: #34d399; border-color: #059669; }
.hf-code-table { border-collapse: collapse; margin-top: 8px; }
.hf-code-table th, .hf-code-table td { border: 1px solid #cbd5e1; padding: 4px 12px; text-align: center; }
.hf-stats { margin-top: 6px; font-weight: 600; color: #2c5282; }
```

- [ ] **Step 3: Sanity check pure logic still passes**

Run: `cd /Users/skhuang/course/dsvisual && node --test tests/unit/huffman_viz.test.js`
Expected: PASS.

- [ ] **Step 4: Commit**
```bash
cd /Users/skhuang/course/dsvisual
git add app.js style.css
git commit -m "feat(viz): implement renderHuffman with step controls + styles"
```

---

## Task 7: i18n entries

**Files:**
- Modify: `i18n.js`

- [ ] **Step 1: Add method names to both locales**

In `i18n.js`, in the `en` block near the other `'method.tree-*'` keys, add:
```js
        'method.tree-traversal': 'Tree Traversal',
        'method.huffman': 'Huffman Coding',
```
In the `zh` block near the other `'method.tree-*'` keys, add:
```js
        'method.tree-traversal': '二元樹走訪',
        'method.huffman': 'Huffman 編碼',
```

- [ ] **Step 2: Verify i18n lookups resolve**

Run:
```bash
cd /Users/skhuang/course/dsvisual
node -e "global.window={}; require('./i18n.js'); const T=window.I18N||window.translations||null; console.log('tree-traversal en/zh present:', /method\.tree-traversal/.test(require('fs').readFileSync('i18n.js','utf8')) )"
```
Expected: `tree-traversal en/zh present: true`. (If i18n exposes a lookup API, prefer asserting `t('method.huffman')` in both locales; otherwise the source-presence check suffices.)

- [ ] **Step 3: Commit**
```bash
cd /Users/skhuang/course/dsvisual
git add i18n.js
git commit -m "feat(viz): i18n names for tree-traversal & huffman (en/zh)"
```

---

## Task 8: desc_db entries

**Files:**
- Modify: `desc_db.js`

- [ ] **Step 1: Add two entries**

In `desc_db.js`, before the closing `};`, add:
```js
    'tree-traversal': `
        <h3>Binary Tree Traversal</h3>
        <p>Systematic visiting of every node exactly once.</p>
        <hr>
        <ul>
            <li><strong>Preorder:</strong> node → left → right</li>
            <li><strong>Inorder:</strong> left → node → right (sorted for a BST)</li>
            <li><strong>Postorder:</strong> left → right → node</li>
            <li><strong>Level-order:</strong> breadth-first via a queue</li>
        </ul>
        <div class="complexities">
            <span class="badge time">Time: O(N)</span>
            <span class="badge space">Space: O(h) DFS / O(w) BFS</span>
        </div>
    `,
    'huffman': `
        <h3>Huffman Coding</h3>
        <p>Greedy construction of an optimal prefix-free code from symbol frequencies.</p>
        <hr>
        <ul>
            <li><strong>Core:</strong> repeatedly merge the two lowest-frequency subtrees</li>
            <li><strong>Result:</strong> prefix-free codes minimizing total encoded length</li>
        </ul>
        <div class="complexities">
            <span class="badge time">Build: O(N log N)</span>
            <span class="badge space">Space: O(N)</span>
        </div>
    `,
```

- [ ] **Step 2: Verify file still parses**

Run: `cd /Users/skhuang/course/dsvisual && node -e "global.window={}; require('./desc_db.js'); console.log('desc_db OK')"`
Expected: `desc_db OK` (no syntax error). If desc_db.js has no module.exports, instead run `node -c desc_db.js` to syntax-check.

- [ ] **Step 3: Commit**
```bash
cd /Users/skhuang/course/dsvisual
git add desc_db.js
git commit -m "docs(viz): desc_db entries for tree-traversal & huffman"
```

---

## Task 9: slides_db decks + build

**Files:**
- Modify: `slides_db.js`
- Regenerate: `slides_rendered.js`, `slides/zh|en/{tree-traversal,huffman}.md`

- [ ] **Step 1: Add two bilingual decks**

In `slides_db.js`, before the final `module.exports = SLIDES_DB;` (i.e. as new keys on the `SLIDES_DB` object), add:
```js
SLIDES_DB["tree-traversal"] = {
  "category": "Trees",
  "title": { "zh": "二元樹走訪", "en": "Binary Tree Traversal" },
  "slides": [
    { "heading": { "zh": "什麼是樹走訪", "en": "What is Tree Traversal" },
      "blocks": [
        { "type": "paragraph", "text": { "zh": "走訪是以系統化順序恰好造訪每個節點一次。", "en": "Traversal visits every node exactly once in a systematic order." } },
        { "type": "bullets", "items": [
          { "zh": "前序:節點 → 左 → 右", "en": "Preorder: node → left → right" },
          { "zh": "中序:左 → 節點 → 右(BST 得遞增序)", "en": "Inorder: left → node → right (sorted for a BST)" },
          { "zh": "後序:左 → 右 → 節點", "en": "Postorder: left → right → node" },
          { "zh": "層序:用佇列的廣度優先", "en": "Level-order: breadth-first using a queue" }
        ] }
      ] },
    { "heading": { "zh": "遞迴 vs 迭代", "en": "Recursive vs Iterative" },
      "blocks": [
        { "type": "paragraph", "text": { "zh": "遞迴隱含使用呼叫堆疊;迭代則以顯式 stack(DFS)或 queue(層序)取代。", "en": "Recursion uses the implicit call stack; iteration replaces it with an explicit stack (DFS) or queue (level-order)." } },
        { "type": "code", "lang": "cpp", "file": "tree_traversal.cpp", "code": "void inorderIterative(Node* root) {\n    std::stack<Node*> st; Node* cur = root;\n    while (cur || !st.empty()) {\n        while (cur) { st.push(cur); cur = cur->left; }\n        cur = st.top(); st.pop();\n        std::cout << cur->val << ' ';\n        cur = cur->right;\n    }\n}" }
      ] },
    { "heading": { "zh": "複雜度", "en": "Complexity" },
      "blocks": [
        { "type": "table",
          "headers": [ { "zh": "面向", "en": "Aspect" }, { "zh": "成本", "en": "Cost" } ],
          "rows": [
            [ { "zh": "時間", "en": "Time" }, { "zh": "O(N)", "en": "O(N)" } ],
            [ { "zh": "空間(DFS)", "en": "Space (DFS)" }, { "zh": "O(h)", "en": "O(h)" } ],
            [ { "zh": "空間(層序)", "en": "Space (BFS)" }, { "zh": "O(w)", "en": "O(w)" } ]
          ] }
      ] }
  ]
};
SLIDES_DB["huffman"] = {
  "category": "Trees",
  "title": { "zh": "Huffman 編碼", "en": "Huffman Coding" },
  "slides": [
    { "heading": { "zh": "問題", "en": "The Problem" },
      "blocks": [
        { "type": "paragraph", "text": { "zh": "給定符號頻率,求最小總長度的前綴碼。", "en": "Given symbol frequencies, find a prefix-free code minimizing total encoded length." } },
        { "type": "note", "text": { "zh": "前綴碼:沒有任一碼是另一碼的前綴,故可無歧義解碼。", "en": "Prefix-free: no code is a prefix of another, so decoding is unambiguous." } }
      ] },
    { "heading": { "zh": "貪婪建樹", "en": "Greedy Construction" },
      "blocks": [
        { "type": "steps", "items": [
          { "zh": "每個符號各成一棵單節點樹,放入優先佇列。", "en": "Each symbol becomes a single-node tree in a priority queue." },
          { "zh": "取出頻率最小的兩棵,合併成新節點(頻率相加)。", "en": "Remove the two lowest-frequency trees and merge them (frequencies add)." },
          { "zh": "重複直到只剩一棵樹。", "en": "Repeat until a single tree remains." },
          { "zh": "左邊記 0、右邊記 1,根到葉的路徑即為碼。", "en": "Label left 0, right 1; the root-to-leaf path is each symbol's code." }
        ] },
        { "type": "code", "lang": "cpp", "file": "huffman.cpp", "code": "while (pq.size() > 1) {\n    HNode* a = pq.top(); pq.pop();\n    HNode* b = pq.top(); pq.pop();\n    HNode* m = new HNode(a->freq + b->freq, '\\0');\n    m->l = a; m->r = b;\n    pq.push(m);\n}" }
      ] },
    { "heading": { "zh": "最優性與複雜度", "en": "Optimality & Complexity" },
      "blocks": [
        { "type": "paragraph", "text": { "zh": "貪婪每步取兩最小,可證得加權路徑長最小(最優前綴碼)。", "en": "Greedily merging the two smallest provably minimizes weighted path length (optimal prefix code)." } },
        { "type": "math", "tex": "WPL = \\sum_i f_i \\cdot \\text{depth}(i)", "caption": { "zh": "目標:最小化加權路徑長", "en": "Objective: minimize weighted path length" } },
        { "type": "bullets", "items": [
          { "zh": "建樹:O(N log N)", "en": "Build: O(N log N)" },
          { "zh": "空間:O(N)", "en": "Space: O(N)" }
        ] }
      ] }
  ]
};
```
Note: place these two assignment statements AFTER the object literal that defines `SLIDES_DB` and BEFORE `module.exports = SLIDES_DB;`. (If the file defines `const SLIDES_DB = {...}` then this works as appended statements. Confirm the variable name on line 1 / near the export.)

- [ ] **Step 2: Regenerate slides**

Run: `cd /Users/skhuang/course/dsvisual && npm run build:slides`
Expected: prints `Generated N decks for zh, en` with N increased by 2; no error.

- [ ] **Step 3: Verify the decks were generated**

Run:
```bash
cd /Users/skhuang/course/dsvisual
ls slides/zh/tree-traversal.md slides/en/tree-traversal.md slides/zh/huffman.md slides/en/huffman.md
grep -c 'tree-traversal' slides_rendered.js
grep -c '"huffman"' slides_rendered.js
```
Expected: all four md files listed; both grep counts ≥ 1.

- [ ] **Step 4: Commit**
```bash
cd /Users/skhuang/course/dsvisual
git add slides_db.js slides_rendered.js slides/zh/tree-traversal.md slides/en/tree-traversal.md slides/zh/huffman.md slides/en/huffman.md
git commit -m "feat(viz): bilingual slides decks for tree-traversal & huffman"
```

---

## Task 10: Playwright E2E tests

**Files:**
- Create: `tests/tree_traversal.spec.js`, `tests/huffman.spec.js`

- [ ] **Step 1: Inspect one existing spec to match navigation helpers**

Run: `cd /Users/skhuang/course/dsvisual && sed -n '1,60p' tests/visualizer.spec.js`
Expected: see how it loads `index.html` (file:// path) and navigates to a method (how it clicks the category pill + method button, and how it asserts the code panel filename). Mirror that exact navigation pattern in the two new specs below (adjust selectors to match).

- [ ] **Step 2: Write `tests/tree_traversal.spec.js`**

Create `tests/tree_traversal.spec.js` (adapt `gotoMethod` to the helper/pattern used by visualizer.spec.js):
```js
const { test, expect } = require('@playwright/test');
const path = require('path');
const fileUrl = 'file://' + path.resolve(__dirname, '..', 'index.html');

async function gotoMethod(page, methodId) {
  await page.goto(fileUrl);
  // Match the navigation used in visualizer.spec.js; this clicks the method button by data attribute.
  await page.click(`[data-method-id="${methodId}"], button:has-text("Tree Traversal")`).catch(async () => {
    await page.click('text=Trees');
    await page.click('text=Tree Traversal');
  });
}

test('tree-traversal: build, step inorder, output appears, code panel filename', async ({ page }) => {
  await gotoMethod(page, 'tree-traversal');
  await expect(page.locator('#code-title, .code-panel-filename')).toContainText('tree_traversal.cpp');
  await page.selectOption('.tt-order', 'inorder');
  await page.selectOption('.tt-mode', 'iterative');
  const stepBtn = page.locator('.stepctl [data-action="step"]');
  for (let i = 0; i < 12; i++) await stepBtn.click();
  await expect(page.locator('.tt-seq')).not.toHaveText('');
});
```

- [ ] **Step 3: Write `tests/huffman.spec.js`**

Create `tests/huffman.spec.js`:
```js
const { test, expect } = require('@playwright/test');
const path = require('path');
const fileUrl = 'file://' + path.resolve(__dirname, '..', 'index.html');

async function gotoMethod(page) {
  await page.goto(fileUrl);
  await page.click('[data-method-id="huffman"]').catch(async () => {
    await page.click('text=Trees');
    await page.click('text=Huffman Coding');
  });
}

test('huffman: run to completion, code table appears, code panel filename', async ({ page }) => {
  await gotoMethod(page);
  await expect(page.locator('#code-title, .code-panel-filename')).toContainText('huffman.cpp');
  const stepBtn = page.locator('.stepctl [data-action="step"]');
  for (let i = 0; i < 25; i++) await stepBtn.click();
  await expect(page.locator('.hf-code-table')).toBeVisible();
});
```

- [ ] **Step 4: Run the new E2E specs**

Run: `cd /Users/skhuang/course/dsvisual && npx playwright test tests/tree_traversal.spec.js tests/huffman.spec.js`
Expected: both specs PASS. If navigation selectors fail, fix `gotoMethod` to match visualizer.spec.js's real navigation (Step 1) and re-run.

- [ ] **Step 5: Commit**
```bash
cd /Users/skhuang/course/dsvisual
git add tests/tree_traversal.spec.js tests/huffman.spec.js
git commit -m "test(viz): E2E for tree-traversal & huffman"
```

---

## Task 11: Full suite + README + finish

**Files:**
- Modify: `README.md` (dsvisual root — add the two methods to supported list)

- [ ] **Step 1: Add the two methods to the README supported list**

In `README.md`, under "Trees" table (or the appropriate Supported Algorithms section), add rows:
```
| Tree Traversal | Pre/In/Post/Level-order, recursive & iterative |
| Huffman Coding | Greedy optimal prefix-code tree construction |
```

- [ ] **Step 2: Run the entire test suite**

Run: `cd /Users/skhuang/course/dsvisual && npm run test:all`
Expected: unit tests (including the two new files) and Playwright suite all PASS.

- [ ] **Step 3: Regenerate-from-clean check (build artifacts are current)**

Run:
```bash
cd /Users/skhuang/course/dsvisual
node build_db.js && npm run build:slides
git status --porcelain
```
Expected: `git status` shows no unexpected diffs in `code_db.js` / `slides_rendered.js` (i.e. committed artifacts match a fresh build).

- [ ] **Step 4: Commit and finish**
```bash
cd /Users/skhuang/course/dsvisual
git add README.md
git commit -m "docs(viz): list tree-traversal & huffman in README"
```
Then use the **superpowers:finishing-a-development-branch** skill to decide merge/PR for `feat/tree-traversal-huffman-viz`.

---

## Self-Review notes

- **Spec coverage:** §4 tree-traversal (Tasks 1,5,9), §5 huffman (Tasks 2,6,9), §6 wiring (Task 4), §7 pipeline (Tasks 3,9), §8 CSS (Tasks 5,6), §9 tests (Tasks 1,2,10), §10 file list (all), §11 acceptance (Task 11). All covered.
- **Known verify-at-implementation points (not placeholders — explicit checks):** (1) the language variable name (`currentLang`) — Task 5/6 instruct to confirm against how `t()` reads language; (2) Playwright navigation selectors — Task 10 Step 1 instructs to read visualizer.spec.js and mirror; (3) `SLIDES_DB` variable name + code-title selector — instructed to confirm. These are real lookups the implementer must do against the live code, with the fallback behavior specified.
- **Type/name consistency:** module APIs (`buildTreeFromValues`, `buildTraversalFrames`, `SAMPLE_VALUES`, `computeFrequencies`, `buildHuffmanFrames`) match between modules, tests, and render functions. Frame shapes match the spec. `window.TreeTraversalViz` / `window.HuffmanViz` globals match index.html load + app.js usage.
