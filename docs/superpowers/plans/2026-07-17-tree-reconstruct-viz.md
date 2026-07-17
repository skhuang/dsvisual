# tree-reconstruct viz — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new dsvisual `tree-reconstruct` visualization that rebuilds a binary tree from two traversal sequences in three modes (preorder+inorder, postorder+inorder, preorder+postorder), animating root-selection and subrange-splitting.

**Architecture:** Pure frame-generator `js/tree_reconstruct_viz.js` (`TreeReconstructViz`); render module `js/viz/viz_tree_reconstruct.js` wired via the `VizRegistry`/`VizKit` seam; one `METHOD_GROUPS` registry row; `cpp/tree_reconstruct.cpp` → `js/code_db.js`; `js/desc_db.js` entry. Unit + e2e tests.

**Tech Stack:** Vanilla JS dual-export IIFE modules, `node --test` unit tests, Playwright e2e, C++ code drawer via `build_db.js`.

## Global Constraints

- Post-refactor layout (verified on `main` @ 43af78e): per-viz renderers live in `js/viz/viz_*.js` using `K() = global.VizKit`; a viz self-registers with `global.VizRegistry.attach(id, {render, code, layout})`; `renderAll()` (app.js ~1954) auto-dispatches to a registry-owned render. New viz needs: a `METHOD_GROUPS` row (app.js trees group), the render module, an `index.html` `<script defer>` tag, a `build_db.js` cpp→code mapping, and a `desc_db.js` entry.
- Three modes: `pre-in` (seq1=preorder, seq2=inorder), `post-in` (seq1=postorder, seq2=inorder), `pre-post` (seq1=preorder, seq2=postorder). `pre-in`/`post-in` are unique for any binary tree; `pre-post` is unique only for FULL binary trees (every node 0 or 2 children) — a single-child node → ambiguity, surfaced as an error message.
- Distinct keys assumed. Validate: equal lengths, distinct keys, same key set; else error frame.
- Bilingual zh/en for all UI text via `K().langOf`. `desc_db.js` is English-only file-wide — match that. Step/Run/Reset via `K().buildStepControls`.
- Additive only — no change to other viz/methods. Commit discipline: targeted `git add` of only each task's named files; a concurrent refactor session may touch this repo — run `git status` before committing, NEVER `git add -A`/`.`/`-u`.
- Tests: unit `npm run test:unit`; e2e `npm test`; both `npm run test:all`.

**Sample trees (used across tasks).** Full tree `A(B(D,E), C)`:
- preorder `A B D E C`, inorder `D B E A C`, postorder `D E B C A`; reconstructed inorder = `D B E A C`.
Non-full `A` with single child `B`: preorder `A B`, postorder `B A` → `pre-post` ambiguous.

---

### Task 1: Pure reconstruction logic (`TreeReconstructViz`) + unit tests

**Files:**
- Create: `js/tree_reconstruct_viz.js`
- Test: `tests/unit/tree_reconstruct_viz.test.js`

**Interfaces:**
- Produces (used by Task 2):
  - `tokenize(str) -> string[]`
  - `buildReconstructFrames(seq1, seq2, mode) -> { frames, root, error }` where each Frame = `{ root1:index|null, range2:[lo,hi]|null, splitAt:index|null, tree:<cloned partial tree {id,val,left,right}>|null, created:nodeId|null, action:'build'|'done'|'error', msg:{zh,en} }`.
  - `reconstructedInorder(root) -> string`.

- [ ] **Step 1: Write the failing unit test** — create `tests/unit/tree_reconstruct_viz.test.js`:

```js
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
```

- [ ] **Step 2: Run, verify fail**

Run: `npm run test:unit`
Expected: FAIL — cannot find module `../../js/tree_reconstruct_viz`.

- [ ] **Step 3: Create `js/tree_reconstruct_viz.js`:**

```js
(function (global) {
  function tokenize(str) { return String(str).trim().split(/\s+/).filter((s) => s.length); }

  function reconstructedInorder(root) {
    const out = [];
    (function go(n) { if (!n) return; go(n.left); out.push(n.val); go(n.right); })(root);
    return out.join(' ');
  }

  function allDistinct(a) { return new Set(a).size === a.length; }
  function sameKeySet(a, b) {
    if (a.length !== b.length) return false;
    const s = {}; a.forEach((k) => { s[k] = (s[k] || 0) + 1; });
    for (const k of b) { if (!s[k]) return false; s[k]--; }
    return true;
  }

  function buildReconstructFrames(s1, s2, mode) {
    const seq1 = tokenize(s1), seq2 = tokenize(s2);
    const frames = [];
    const fail = (zh, en) => {
      frames.push({ root1: null, range2: null, splitAt: null, tree: null, created: null, action: 'error', msg: { zh, en } });
      return { frames, root: null, error: en };
    };
    if (!seq1.length || !seq2.length) return fail('輸入不可為空', 'inputs must be non-empty');
    if (seq1.length !== seq2.length) return fail('兩序列長度不同', 'the two sequences have different lengths');
    if (!allDistinct(seq1) || !allDistinct(seq2)) return fail('鍵值須相異', 'keys must be distinct');
    if (!sameKeySet(seq1, seq2)) return fail('兩序列的鍵值集合不同', 'the two sequences have different key sets');

    let idc = 0;
    const node = (val) => ({ id: 'rc-' + (idc++), val, left: null, right: null });
    const clone = (n) => n ? { id: n.id, val: n.val, left: clone(n.left), right: clone(n.right) } : null;
    let root = null;
    let ambiguous = false;
    const snap = (created, root1, range2, splitAt, msg) =>
      frames.push({ root1, range2, splitAt, tree: clone(root), created: created.id, action: 'build', msg });

    if (mode === 'pre-in' || mode === 'post-in') {
      const inorder = seq2;
      const posIn = {}; inorder.forEach((k, i) => { posIn[k] = i; });
      if (mode === 'pre-in') {
        const pre = seq1; let preIdx = 0;
        (function build(lo, hi, link) {
          if (lo > hi) return;
          const rootVal = pre[preIdx]; const r1 = preIdx; preIdx++;
          const n = node(rootVal); if (!root) root = n; link(n);
          const m = posIn[rootVal];
          snap(n, r1, [lo, hi], m, { zh: '前序頭 ' + rootVal + ' 為根;於中序 [' + lo + ',' + hi + '] 定位並切分左右', en: 'preorder head ' + rootVal + ' is the root; locate it in inorder [' + lo + ',' + hi + '] to split L/R' });
          build(lo, m - 1, (c) => { n.left = c; });
          build(m + 1, hi, (c) => { n.right = c; });
        })(0, inorder.length - 1, () => {});
      } else {
        const post = seq1; let postIdx = post.length - 1;
        (function build(lo, hi, link) {
          if (lo > hi) return;
          const rootVal = post[postIdx]; const r1 = postIdx; postIdx--;
          const n = node(rootVal); if (!root) root = n; link(n);
          const m = posIn[rootVal];
          snap(n, r1, [lo, hi], m, { zh: '後序尾 ' + rootVal + ' 為根;於中序 [' + lo + ',' + hi + '] 定位並切分左右', en: 'postorder tail ' + rootVal + ' is the root; locate it in inorder [' + lo + ',' + hi + '] to split L/R' });
          build(m + 1, hi, (c) => { n.right = c; });   // right first (postorder back-to-front)
          build(lo, m - 1, (c) => { n.left = c; });
        })(0, inorder.length - 1, () => {});
      }
    } else if (mode === 'pre-post') {
      const pre = seq1, post = seq2; let preIdx = 0;
      const posPost = {}; post.forEach((k, i) => { posPost[k] = i; });
      (function build(lo, hi, link) {   // lo..hi is a postorder subrange
        if (lo > hi) return;
        const rootVal = pre[preIdx]; const r1 = preIdx; preIdx++;
        const n = node(rootVal); if (!root) root = n; link(n);
        if (lo === hi) { snap(n, r1, [lo, hi], lo, { zh: '前序 ' + rootVal + ':後序子範圍僅一元素 → 葉節點', en: 'preorder ' + rootVal + ': postorder subrange has one element → leaf' }); return; }
        const leftRootVal = pre[preIdx];
        const j = posPost[leftRootVal];
        const leftSize = j - lo + 1;
        snap(n, r1, [lo, hi], j, { zh: '前序 ' + rootVal + ' 為根;下一前序 ' + leftRootVal + ' 於後序位置 ' + j + ' → 左子樹大小 ' + leftSize, en: 'preorder ' + rootVal + ' is root; next preorder ' + leftRootVal + ' at postorder ' + j + ' → left-subtree size ' + leftSize });
        build(lo, j, (c) => { n.left = c; });
        if (j + 1 <= hi - 1) build(j + 1, hi - 1, (c) => { n.right = c; });
        else ambiguous = true;   // single child → not a full binary tree
      })(0, post.length - 1, () => {});
      if (ambiguous) {
        frames.push({ root1: null, range2: null, splitAt: null, tree: clone(root), created: null, action: 'error', msg: { zh: '前序+後序僅對「完全二元樹(每節點 0 或 2 子)」唯一;此輸入含單子節點 → 不唯一', en: 'preorder+postorder is unique only for FULL binary trees (0 or 2 children); this input has a single-child node → ambiguous' } });
        return { frames, root: null, error: 'ambiguous (needs full binary tree)' };
      }
    } else {
      return fail('未知模式', 'unknown mode');
    }

    frames.push({ root1: null, range2: null, splitAt: null, tree: clone(root), created: null, action: 'done', msg: { zh: '完成;重建中序 = ' + reconstructedInorder(root), en: 'done; reconstructed inorder = ' + reconstructedInorder(root) } });
    return { frames, root, error: null };
  }

  const api = { tokenize, buildReconstructFrames, reconstructedInorder };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.TreeReconstructViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 4: Run, verify pass**

Run: `npm run test:unit`
Expected: PASS (all existing unit tests + the 6 new `tree_reconstruct` tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/skhuang/course/dsvisual
git add js/tree_reconstruct_viz.js tests/unit/tree_reconstruct_viz.test.js
git commit -m "feat(dsvisual): tree-reconstruct pure logic (pre-in/post-in/pre-post + validation)"
```

---

### Task 2: Render module + registry + index.html + CSS + e2e

**Files:**
- Create: `js/viz/viz_tree_reconstruct.js`
- Modify: `js/app.js` (one `METHOD_GROUPS` trees-group row)
- Modify: `index.html` (one `<script defer>` tag)
- Modify: `style.css` (append reconstruct CSS)
- Test: `tests/tree_reconstruct.spec.js`

**Interfaces:**
- Consumes (Task 1): `TreeReconstructViz.buildReconstructFrames`, `.reconstructedInorder`, `.tokenize`.
- Consumes (Task 3, forward): the global `codeTreeReconstruct` string (from `js/code_db.js`); until Task 3 regenerates it, the `code:` callback returns `undefined` — harmless for rendering. (Load order in index.html puts `code_db.js` before this module.)

- [ ] **Step 1: Add the registry row** in `js/app.js`, in the `METHOD_GROUPS` trees group, immediately after the `tree-general-binary` row:

```js
            { id: 'tree-reconstruct', title: 'Reconstruct Tree', file: 'tree_reconstruct.cpp', visualizer: 'reconstruct', controls: 'reconstruct' },
```

- [ ] **Step 2: Add the script tag** in `index.html`, immediately after the existing `<script src="js/viz/viz_expr_tree.js" defer></script>` line:

```html
    <script src="js/viz/viz_tree_reconstruct.js" defer></script>
```

- [ ] **Step 3: Create `js/viz/viz_tree_reconstruct.js`:**

```js
(function (global) {
    const K = () => global.VizKit;

    function computeTreeLayout(node, x, y, dx, meta) {
        if (!node) return;
        meta.push({ id: node.id, val: node.val, x: x, y: y });
        if (node.left) computeTreeLayout(node.left, x - dx, y + 60, dx * 0.55, meta);
        if (node.right) computeTreeLayout(node.right, x + dx, y + 60, dx * 0.55, meta);
    }

    const MODES = {
        'pre-in':   { s1: { zh: '前序', en: 'Preorder' },  s2: { zh: '中序', en: 'Inorder' },   d1: 'A B D E C', d2: 'D B E A C' },
        'post-in':  { s1: { zh: '後序', en: 'Postorder' }, s2: { zh: '中序', en: 'Inorder' },   d1: 'D E B C A', d2: 'D B E A C' },
        'pre-post': { s1: { zh: '前序', en: 'Preorder' },  s2: { zh: '後序', en: 'Postorder' }, d1: 'A B D E C', d2: 'D E B C A' },
    };

    // Build a random FULL binary tree (every node 0 or 2 children) with `leaves`
    // leaves, then derive its three traversals — so pre-post stays unambiguous.
    function randomTraversals() {
        const labels = 'ABCDEFGHIJKLMNO'.split('');
        let li = 0;
        function grow(depthBudget) {
            const n = { val: labels[li++], left: null, right: null };
            if (depthBudget > 0 && li < labels.length - 1 && Math.random() < 0.6) {
                n.left = grow(depthBudget - 1);
                n.right = grow(depthBudget - 1);
            }
            return n;
        }
        const root = grow(3);
        const pre = [], ino = [], post = [];
        (function walk(n) { if (!n) return; pre.push(n.val); walk(n.left); ino.push(n.val); walk(n.right); post.push(n.val); })(root);
        return { pre: pre.join(' '), in: ino.join(' '), post: post.join(' ') };
    }

    let _state = null;
    function renderTreeReconstruct() {
        const host = K().acquireDynamicVizHost();
        if (!_state) _state = { mode: 'pre-in', seq1: MODES['pre-in'].d1, seq2: MODES['pre-in'].d2 };
        const st = _state;
        const langOf = K().langOf;
        const m = MODES[st.mode];
        const res = TreeReconstructViz.buildReconstructFrames(st.seq1, st.seq2, st.mode);
        const frames = res.frames;
        let idx = 0;

        const modeBtn = (id, label) => '<button type="button" class="rc-mode-btn' + (st.mode === id ? ' active' : '') + '" data-mode="' + id + '">' + label + '</button>';
        host.innerHTML =
            '<div class="rc-mode">' +
              modeBtn('pre-in', langOf({ zh: '前序+中序', en: 'Pre+In' })) +
              modeBtn('post-in', langOf({ zh: '後序+中序', en: 'Post+In' })) +
              modeBtn('pre-post', langOf({ zh: '前序+後序', en: 'Pre+Post' })) +
            '</div>' +
            '<div class="rc-controls">' +
              '<label>' + langOf(m.s1) + ' <input type="text" class="rc-seq1" value="' + st.seq1.replace(/"/g, '&quot;') + '"></label>' +
              '<label>' + langOf(m.s2) + ' <input type="text" class="rc-seq2" value="' + st.seq2.replace(/"/g, '&quot;') + '"></label>' +
              '<button type="button" class="rand-btn" title="Random">🎲</button><button type="button" class="rc-apply">Apply</button>' +
            '</div>' +
            '<div class="et-stage"><svg class="et-edges"></svg><div class="et-nodes"></div></div>' +
            '<div class="rc-seqs"><div class="rc-strip rc-strip1"></div><div class="rc-strip rc-strip2"></div></div>' +
            '<div class="rc-verdict"></div>' +
            '<div class="et-phase"></div>';

        function paintTree(tree, createdId) {
            const stageEl = host.querySelector('.et-stage'); if (!stageEl) return;
            const W = stageEl.clientWidth || 720;
            const meta = []; let svg = '';
            if (tree) {
                computeTreeLayout(tree, W / 2, 30, Math.max(48, W / 5), meta);
                const byId = {}; meta.forEach((mm) => { byId[mm.id] = mm; });
                (function walk(n) { if (!n) return; [n.left, n.right].forEach((c) => { if (!c) return; const a = byId[n.id], b = byId[c.id]; svg += '<line x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '" stroke="#94a3b8" stroke-width="2"/>'; walk(c); }); })(tree);
            }
            host.querySelector('.et-edges').innerHTML = svg;
            host.querySelector('.et-nodes').innerHTML = meta.map((mm) =>
                '<div class="tree-node' + (mm.id === createdId ? ' rc-created' : '') + '" style="left:' + mm.x + 'px;top:' + mm.y + 'px">' + mm.val + '</div>').join('');
        }
        function paintStrip(el, tokens, hi, range, split) {
            el.innerHTML = '<span class="rc-label">' + el.getAttribute('data-label') + '</span>' + tokens.map((t, i) => {
                let cls = 'rc-cell';
                if (range && i >= range[0] && i <= range[1]) cls += ' rc-inrange';
                if (i === hi) cls += ' rc-root';
                if (i === split) cls += ' rc-split';
                return '<span class="' + cls + '">' + t + '</span>';
            }).join('');
        }
        const seq1toks = TreeReconstructViz.tokenize(st.seq1);
        const seq2toks = TreeReconstructViz.tokenize(st.seq2);
        host.querySelector('.rc-strip1').setAttribute('data-label', langOf(m.s1));
        host.querySelector('.rc-strip2').setAttribute('data-label', langOf(m.s2));

        function paint() {
            const fr = frames[idx];
            if (!host.querySelector('.et-stage')) return;
            paintTree(fr.tree, fr.created);
            // seq1 shows the driving-sequence root highlight; seq2 shows the split subrange
            paintStrip(host.querySelector('.rc-strip1'), seq1toks, fr.root1, null, null);
            paintStrip(host.querySelector('.rc-strip2'), seq2toks, null, fr.range2, fr.splitAt);
            const verdictEl = host.querySelector('.rc-verdict');
            if (fr.action === 'done') { verdictEl.className = 'rc-verdict rc-ok'; verdictEl.textContent = langOf(fr.msg); }
            else if (fr.action === 'error') { verdictEl.className = 'rc-verdict rc-err'; verdictEl.textContent = langOf(fr.msg); }
            else { verdictEl.className = 'rc-verdict'; verdictEl.textContent = ''; }
            host.querySelector('.et-phase').textContent = langOf(fr.msg);
        }
        function step() { if (idx < frames.length - 1) { idx++; paint(); return idx < frames.length - 1; } return false; }
        function reset() { idx = 0; paint(); }

        host.appendChild(K().buildStepControls(step, reset, 700));
        paint();

        host.querySelectorAll('.rc-mode-btn').forEach((b) => {
            b.onclick = () => { const mm = b.getAttribute('data-mode'); if (mm !== st.mode) { st.mode = mm; st.seq1 = MODES[mm].d1; st.seq2 = MODES[mm].d2; renderTreeReconstruct(); } };
        });
        host.querySelector('.rc-apply').onclick = () => {
            st.seq1 = host.querySelector('.rc-seq1').value.trim();
            st.seq2 = host.querySelector('.rc-seq2').value.trim();
            renderTreeReconstruct();
        };
        host.querySelector('.rand-btn').onclick = () => {
            const t = randomTraversals();
            if (st.mode === 'pre-in') { st.seq1 = t.pre; st.seq2 = t.in; }
            else if (st.mode === 'post-in') { st.seq1 = t.post; st.seq2 = t.in; }
            else { st.seq1 = t.pre; st.seq2 = t.post; }
            renderTreeReconstruct();
        };
    }

    global.VizRegistry.attach('tree-reconstruct', {
        render: renderTreeReconstruct,
        code: () => (typeof codeTreeReconstruct !== 'undefined' ? codeTreeReconstruct : ''),
        layout: { host: 'dynamic' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 4: Append CSS** to `style.css`:

```css
/* tree-reconstruct */
.rc-mode { display: flex; gap: 6px; margin-bottom: 8px; }
.rc-mode-btn { padding: 4px 12px; border: 1px solid #cbd5e1; background: #f8fafc; border-radius: 999px; cursor: pointer; font-size: 13px; }
.rc-mode-btn.active { background: #1a4d8f; color: #fff; border-color: #1a4d8f; }
.rc-controls { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-bottom: 8px; }
.rc-controls label { font-size: 13px; }
.rc-controls input { font-family: 'Fira Code', monospace; margin-left: 4px; }
.rc-seqs { margin: 10px 0; display: flex; flex-direction: column; gap: 6px; }
.rc-strip { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; }
.rc-label { font-weight: 700; margin-right: 6px; min-width: 70px; }
.rc-cell { display: inline-block; min-width: 22px; text-align: center; padding: 2px 6px; border: 1px solid #cbd5e1; border-radius: 4px; font-family: 'Fira Code', monospace; }
.rc-cell.rc-inrange { background: #eef6ff; }
.rc-cell.rc-root { background: #1a4d8f; color: #fff; border-color: #1a4d8f; }
.rc-cell.rc-split { outline: 2px solid #f59e0b; }
.tree-node.rc-created { background: #16a34a; color: #fff; border-color: #16a34a; }
.rc-verdict { margin-top: 6px; font-weight: bold; }
.rc-verdict.rc-ok { color: #16a34a; }
.rc-verdict.rc-err { color: #dc2626; }
```

- [ ] **Step 5: Create the e2e test** `tests/tree_reconstruct.spec.js`:

```js
const { test, expect } = require('@playwright/test');
const { loadMethod } = require('./helpers');
const path = require('path');

test.describe('Reconstruct Tree', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
        await page.goto('file://' + path.resolve(__dirname, '../index.html'));
        await loadMethod(page, 'tree-reconstruct');
    });

    for (const mode of ['pre-in', 'post-in', 'pre-post']) {
        test('mode ' + mode + ' reconstructs to inorder D B E A C', async ({ page }) => {
            const sec = page.locator('[data-method-section="tree-reconstruct"]');
            await sec.locator('.rc-mode-btn[data-mode="' + mode + '"]').click();
            await sec.locator('.rc-apply').click();               // apply the mode's default sample
            await sec.locator('.stepctl [data-action="run"]').click();
            await expect(sec.locator('.rc-verdict.rc-ok')).toContainText('D B E A C', { timeout: 15000 });
        });
    }

    test('pre-post with a non-full tree reports ambiguity', async ({ page }) => {
        const sec = page.locator('[data-method-section="tree-reconstruct"]');
        await sec.locator('.rc-mode-btn[data-mode="pre-post"]').click();
        await sec.locator('.rc-seq1').fill('A B');
        await sec.locator('.rc-seq2').fill('B A');
        await sec.locator('.rc-apply').click();
        await sec.locator('.stepctl [data-action="run"]').click();
        await expect(sec.locator('.rc-verdict.rc-err')).toContainText('ambiguous', { timeout: 15000 });
    });
});
```

- [ ] **Step 6: Run e2e; verify pass**

Run: `npm test -- tree_reconstruct`
Expected: 4 tests pass (3 modes + ambiguity). If the `[data-action="run"]` step-control selector differs from the real markup, match the selector used by `tests/tree_expression.spec.js` (the confirmed pattern is `.stepctl [data-action="step"]`/`[data-action="run"]`) and re-run.

- [ ] **Step 7: Commit**

```bash
cd /Users/skhuang/course/dsvisual
git add js/viz/viz_tree_reconstruct.js js/app.js index.html style.css tests/tree_reconstruct.spec.js
git commit -m "feat(dsvisual): tree-reconstruct render UI + registry + e2e (3 modes)"
```

---

### Task 3: C++ code drawer + description

**Files:**
- Create: `cpp/tree_reconstruct.cpp`
- Modify: `build_db.js` (add cpp→code mapping)
- Modify: `js/code_db.js` (regenerated)
- Modify: `js/desc_db.js` (add `tree-reconstruct` entry)

- [ ] **Step 1: Create `cpp/tree_reconstruct.cpp`:**

```cpp
#include <iostream>
#include <vector>
#include <string>
#include <unordered_map>
#include <functional>

// Rebuild a binary tree from two traversals. Keys are distinct.
struct TNode {
    std::string val;
    TNode* left = nullptr;
    TNode* right = nullptr;
};

// --- preorder + inorder (unique for any binary tree) ---
TNode* buildFromPreIn(const std::vector<std::string>& pre,
                      const std::vector<std::string>& in) {
    std::unordered_map<std::string, int> pos;
    for (int i = 0; i < (int)in.size(); ++i) pos[in[i]] = i;
    int p = 0;
    std::function<TNode*(int, int)> go = [&](int lo, int hi) -> TNode* {
        if (lo > hi) return nullptr;
        TNode* n = new TNode{ pre[p++], nullptr, nullptr };
        int m = pos[n->val];
        n->left = go(lo, m - 1);
        n->right = go(m + 1, hi);
        return n;
    };
    return go(0, (int)in.size() - 1);
}

// --- postorder + inorder (unique for any binary tree) ---
TNode* buildFromPostIn(const std::vector<std::string>& post,
                       const std::vector<std::string>& in) {
    std::unordered_map<std::string, int> pos;
    for (int i = 0; i < (int)in.size(); ++i) pos[in[i]] = i;
    int p = (int)post.size() - 1;
    std::function<TNode*(int, int)> go = [&](int lo, int hi) -> TNode* {
        if (lo > hi) return nullptr;
        TNode* n = new TNode{ post[p--], nullptr, nullptr };
        int m = pos[n->val];
        n->right = go(m + 1, hi);   // right before left (postorder back-to-front)
        n->left = go(lo, m - 1);
        return n;
    };
    return go(0, (int)in.size() - 1);
}

// --- preorder + postorder (unique ONLY for full binary trees) ---
// Sets `ambiguous` if a single-child node is encountered.
TNode* buildFromPrePost(const std::vector<std::string>& pre,
                        const std::vector<std::string>& post, bool& ambiguous) {
    std::unordered_map<std::string, int> pos;
    for (int i = 0; i < (int)post.size(); ++i) pos[post[i]] = i;
    int p = 0;
    std::function<TNode*(int, int)> go = [&](int lo, int hi) -> TNode* {
        if (lo > hi) return nullptr;
        TNode* n = new TNode{ pre[p++], nullptr, nullptr };
        if (lo == hi) return n;                       // leaf
        int j = pos[pre[p]];                          // next preorder = left child's root
        n->left = go(lo, j);
        if (j + 1 <= hi - 1) n->right = go(j + 1, hi - 1);
        else ambiguous = true;                        // single child -> not full -> ambiguous
        return n;
    };
    return go(0, (int)post.size() - 1);
}

void inorderPrint(TNode* n) {
    if (!n) return;
    inorderPrint(n->left);
    std::cout << n->val << ' ';
    inorderPrint(n->right);
}
```

- [ ] **Step 2: Add the cpp→code mapping** in `build_db.js` — add to the `mappings` object (near the other `tree_*.cpp` entries):

```js
    'tree_reconstruct.cpp': 'codeTreeReconstruct',
```

- [ ] **Step 3: Regenerate the code drawer string**

Run: `node build_db.js`
Expected: `js/code_db.js` gains a `const codeTreeReconstruct = \`...\`;`. `git diff --stat js/code_db.js` shows only that addition (plus any deterministic re-emit). If `build_db.js` rewrites unrelated `codeXxx` entries with spurious diffs, STOP and report instead of committing noise.

- [ ] **Step 4: Add the description entry** in `js/desc_db.js` — add a `'tree-reconstruct'` key (English, matching the flat `key: \`<html>\`` shape of the file; place it near other tree entries):

```js
    'tree-reconstruct': `
        <h3>Reconstruct a Binary Tree from Two Traversals</h3>
        <p>Given two traversal sequences of a tree with distinct keys, rebuild the tree. In <strong>preorder+inorder</strong> and <strong>postorder+inorder</strong> the first (or last) element of pre/post is the root; its position in inorder splits the remaining keys into the left and right subtrees, and the construction recurses — unique for any binary tree.</p>
        <p><strong>Preorder+postorder</strong> is different: it determines the tree uniquely <em>only for full binary trees</em> (every node has 0 or 2 children). A single-child node cannot be placed unambiguously, so this viz reports such input as ambiguous — the teaching point that not every pair of traversals fixes the tree.</p>
        <div class="complexity">
            <span class="badge time">Build: O(N)</span>
            <span class="badge space">Space: O(N)</span>
        </div>
    `,
```

- [ ] **Step 5: Sanity-check**

Run: `npm test -- tree_reconstruct` and `npm run test:unit`
Expected: still green (adding the code string + description does not change viz behavior). Optionally open `index.html`, select "Reconstruct Tree", confirm the code drawer shows `tree_reconstruct.cpp` and the info panel shows the description.

- [ ] **Step 6: Commit**

```bash
cd /Users/skhuang/course/dsvisual
git add cpp/tree_reconstruct.cpp build_db.js js/code_db.js js/desc_db.js
git commit -m "feat(dsvisual): C++ code drawer + description for tree-reconstruct"
```

---

## Notes for the executor

- **Concurrent refactor session:** before each commit run `git status` and stage ONLY the task's named files. Never `git add -A`/`.`/`-u`.
- Task ordering matters: Task 1 (pure) → Task 2 (render, consumes Task 1) → Task 3 (code drawer; the render's `code:` callback tolerates `codeTreeReconstruct` being undefined until Task 3 regenerates code_db, so Tasks 1–2 are testable on their own).
- The `.et-stage`/`.et-edges`/`.et-nodes` class names are reused from the expression-tree viz for the tree canvas (shared CSS already exists); the `.rc-*` classes are new (added in Task 2 Step 4).
- e2e step-control selectors: if `[data-action="run"]` is wrong, mirror `tests/tree_expression.spec.js` which is the confirmed source of truth.
