# tree-copy-equal viz — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new dsvisual `tree-copy-equal` visualization with two modes: COPY (animate a deep copy of a tree top-down, then verify the copy EQUALs the original) and EQUAL (compare two trees in lockstep, stopping at the first structural or value mismatch).

**Architecture:** Pure `js/tree_copy_equal_viz.js` (`TreeCopyEqualViz`) parses positional level-order arrays and produces copy/compare frames; render module `js/viz/viz_tree_copy_equal.js` (VizRegistry/VizKit seam) draws a two-panel tree stage with node highlights; `cpp/tree_copy_equal.cpp` → `js/code_db.js`; `js/desc_db.js` entry. Unit + e2e.

**Tech Stack:** Vanilla JS dual-export IIFE modules, `node --test` unit tests, Playwright e2e, C++ code drawer via `build_db.js`.

## Global Constraints

- Post-refactor layout (verified on `main` @ 4dbcb5a): per-viz renderers live in `js/viz/viz_*.js` using `K() = global.VizKit`; a viz self-registers via `global.VizRegistry.attach(id, {render, code, layout})`. A NEW viz needs: a `METHOD_GROUPS` trees-group row (app.js), the render module, **TWO** `index.html` `<script defer>` tags (pure then render, after `js/code_db.js`, before `js/app.js`), a `build_db.js` cpp→code mapping, and a `desc_db.js` entry.
- Input: positional 1-indexed level-order array; space-separated tokens; `-` (also `.`/`_`) = empty; token position `k` = array index `k`; node `i` → left `2i`, right `2i+1`, even idx → parent.left, odd → parent.right. Validate: root present (index 1) if any node; each present `i>1` needs parent `⌊i/2⌋` → else error.
- `equal(s,t)`: both null → equal; one null → structural mismatch; `s.val≠t.val` → value mismatch; else recurse (first failing reason wins). `copyTree`: create node, then copy left/right (top-down).
- Bilingual zh/en for all UI text via `K().langOf`. `desc_db.js` English-only file-wide; styled `class="complexities"`. Step/Run/Reset via `K().buildStepControls`.
- Additive only — no change to other viz/methods. Commit discipline: targeted `git add` of only each task's named files; a concurrent refactor session may touch this repo — run `git status` before committing, NEVER `git add -A`/`.`/`-u`; add exactly the one registry row.
- Tests: unit `npm run test:unit`; e2e `npm test`.

**Examples:** `A B C` → root A, left B, right C. equal(`A B C`, `A B C`) → equal; equal(`A B C`, `A B D`) → value mismatch; equal(`A B C`, `A B`) → structural mismatch (A's right child missing in B).

---

### Task 1: Pure copy/equal logic (`TreeCopyEqualViz`) + unit tests

**Files:**
- Create: `js/tree_copy_equal_viz.js`
- Test: `tests/unit/tree_copy_equal_viz.test.js`

**Interfaces:**
- Produces (used by Task 2):
  - `tokenize(str)->string[]`, `parseTree(tokens)->{root,error}` (node `{id,val,idx,left,right}`)
  - `deepCopy(node)->node`, `equal(s,t)->{equal,reason:null|'structural'|'value'}`
  - `buildCopyFrames(tokens)->{frames,root,copyRoot,error}`; Frame = `{mode:'copy',srcTree,copyTree,srcId,copyId,action:'copy'|'done'|'error',verdict,msg}`
  - `buildEqualFrames(tokensA,tokensB)->{frames,equal,reason,error}`; Frame = `{mode:'equal',treeA,treeB,aId,bId,status:'compare'|'mismatch'|'equal'|'error',reason,verdict,msg}`

- [ ] **Step 1: Write the failing unit test** — create `tests/unit/tree_copy_equal_viz.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { tokenize, parseTree, deepCopy, equal, buildCopyFrames, buildEqualFrames } = require('../../js/tree_copy_equal_viz');

test('parseTree builds positional tree', () => {
  const { root, error } = parseTree(tokenize('A B C'));
  assert.equal(error, null);
  assert.equal(root.val, 'A');
  assert.equal(root.left.val, 'B');
  assert.equal(root.right.val, 'C');
});

test('deepCopy round-trips to equal', () => {
  const { root } = parseTree(tokenize('A B C D E'));
  assert.deepEqual(equal(root, deepCopy(root)), { equal: true, reason: null });
});

test('equal detects value and structural mismatches', () => {
  const a = parseTree(tokenize('A B C')).root;
  const bVal = parseTree(tokenize('A B D')).root;
  const bStruct = parseTree(tokenize('A B')).root;      // A has no right child
  assert.deepEqual(equal(a, bVal), { equal: false, reason: 'value' });
  assert.deepEqual(equal(a, bStruct), { equal: false, reason: 'structural' });
});

test('buildCopyFrames ends with a done frame, verdict true', () => {
  const { frames } = buildCopyFrames(tokenize('A B C D E'));
  const done = frames[frames.length - 1];
  assert.equal(done.action, 'done');
  assert.equal(done.verdict, true);
  for (const f of frames) assert.ok(f.msg.zh && f.msg.en);
});

test('buildEqualFrames: equal pair vs differing pair', () => {
  const eq = buildEqualFrames(tokenize('A B C'), tokenize('A B C'));
  assert.equal(eq.equal, true);
  assert.equal(eq.frames[eq.frames.length - 1].status, 'equal');
  const diff = buildEqualFrames(tokenize('A B C'), tokenize('A B D'));
  assert.equal(diff.equal, false);
  assert.equal(diff.reason, 'value');
  assert.equal(diff.frames[diff.frames.length - 1].status, 'mismatch');
});

test('parse error surfaces as an error frame', () => {
  const { frames, error } = buildCopyFrames(tokenize('- A'));
  assert.equal(error, 'root-missing');
  assert.equal(frames[0].action, 'error');
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm run test:unit`
Expected: FAIL — cannot find module `../../js/tree_copy_equal_viz`.

- [ ] **Step 3: Create `js/tree_copy_equal_viz.js`:**

```js
(function (global) {
  const EMPTY = new Set(['-', '.', '_']);
  function tokenize(str) { return String(str).trim().split(/\s+/).filter((s) => s.length); }
  const isEmpty = (t) => EMPTY.has(t);

  function parseTree(tokens) {
    const slots = [null]; let size = 0;
    for (let k = 0; k < tokens.length; k++) {
      const i = k + 1;
      if (isEmpty(tokens[k])) slots[i] = null;
      else { slots[i] = tokens[k]; size = i; }
    }
    if (size === 0) return { root: null, error: null };
    if (slots[1] == null) return { root: null, error: 'root-missing' };
    for (let i = 2; i <= size; i++) if (slots[i] != null && slots[Math.floor(i / 2)] == null) return { root: null, error: 'orphan-child at index ' + i };
    let idc = 0; const nodeAt = {}; let root = null;
    for (let i = 1; i <= size; i++) {
      if (slots[i] != null) {
        const n = { id: 'n-' + (idc++), val: slots[i], idx: i, left: null, right: null };
        nodeAt[i] = n;
        if (i === 1) root = n;
        else { const p = Math.floor(i / 2); if (i % 2 === 0) nodeAt[p].left = n; else nodeAt[p].right = n; }
      }
    }
    return { root, error: null };
  }

  function deepCopy(n) {
    if (!n) return null;
    return { id: 'c-' + n.idx + '-' + n.val, val: n.val, idx: n.idx, left: deepCopy(n.left), right: deepCopy(n.right) };
  }

  function equal(s, t) {
    if (!s && !t) return { equal: true, reason: null };
    if (!s || !t) return { equal: false, reason: 'structural' };
    if (s.val !== t.val) return { equal: false, reason: 'value' };
    const L = equal(s.left, t.left); if (!L.equal) return L;
    return equal(s.right, t.right);
  }

  function errFrameMsg(error) {
    return error === 'root-missing'
      ? { zh: '輸入不合法:根(索引 1)不可為空', en: 'invalid: root (index 1) must be present' }
      : { zh: '輸入不合法:' + error, en: 'invalid: ' + error };
  }

  function buildCopyFrames(tokens) {
    const { root, error } = parseTree(tokens);
    const frames = [];
    const cloneSrc = (n) => n ? { id: n.id, val: n.val, idx: n.idx, left: cloneSrc(n.left), right: cloneSrc(n.right) } : null;
    const cloneCopy = (n) => n ? { id: n.id, val: n.val, left: cloneCopy(n.left), right: cloneCopy(n.right) } : null;
    if (error) {
      frames.push({ mode: 'copy', srcTree: null, copyTree: null, srcId: null, copyId: null, action: 'error', verdict: null, msg: errFrameMsg(error) });
      return { frames, root: null, copyRoot: null, error };
    }
    let copyRoot = null; let idc = 0;
    (function copy(src, link) {
      if (!src) return;
      const c = { id: 'cp-' + (idc++), val: src.val, left: null, right: null };
      if (!copyRoot) copyRoot = c;
      link(c);
      frames.push({ mode: 'copy', srcTree: cloneSrc(root), copyTree: cloneCopy(copyRoot), srcId: src.id, copyId: c.id, action: 'copy', verdict: null, msg: { zh: '複製節點 ' + src.val, en: 'copy node ' + src.val } });
      copy(src.left, (x) => { c.left = x; });
      copy(src.right, (x) => { c.right = x; });
    })(root, () => {});
    const eq = equal(root, copyRoot).equal;
    frames.push({ mode: 'copy', srcTree: cloneSrc(root), copyTree: cloneCopy(copyRoot), srcId: null, copyId: null, action: 'done', verdict: eq, msg: { zh: '複製完成;equal(原樹, 副本) = ' + (eq ? '相等 ✓' : '不相等 ✗'), en: 'copy complete; equal(original, copy) = ' + (eq ? 'yes ✓' : 'no ✗') } });
    return { frames, root, copyRoot, error: null };
  }

  function buildEqualFrames(tokensA, tokensB) {
    const ra = parseTree(tokensA), rb = parseTree(tokensB);
    const frames = [];
    if (ra.error || rb.error) {
      const which = ra.error ? 'A' : 'B';
      frames.push({ mode: 'equal', treeA: null, treeB: null, aId: null, bId: null, status: 'error', reason: null, verdict: null, msg: { zh: '樹 ' + which + ' 輸入不合法', en: 'tree ' + which + ' invalid input' } });
      return { frames, equal: false, reason: null, error: ra.error || rb.error };
    }
    const cloneT = (n) => n ? { id: n.id, val: n.val, idx: n.idx, left: cloneT(n.left), right: cloneT(n.right) } : null;
    const A = cloneT(ra.root), B = cloneT(rb.root);
    let mismatch = null;
    (function cmp(a, b) {
      if (mismatch) return;
      if (!a && !b) return;
      frames.push({ mode: 'equal', treeA: A, treeB: B, aId: a ? a.id : null, bId: b ? b.id : null, status: 'compare', reason: null, verdict: null, msg: { zh: '比較 ' + (a ? a.val : '∅') + ' 與 ' + (b ? b.val : '∅'), en: 'compare ' + (a ? a.val : '∅') + ' vs ' + (b ? b.val : '∅') } });
      if (!a || !b) { mismatch = { reason: 'structural', aId: a ? a.id : null, bId: b ? b.id : null }; return; }
      if (a.val !== b.val) { mismatch = { reason: 'value', aId: a.id, bId: b.id }; return; }
      cmp(a.left, b.left); cmp(a.right, b.right);
    })(ra.root, rb.root);
    const isEqual = !mismatch;
    if (isEqual) {
      frames.push({ mode: 'equal', treeA: A, treeB: B, aId: null, bId: null, status: 'equal', reason: null, verdict: true, msg: { zh: '兩棵樹相等 ✓', en: 'trees are equal ✓' } });
    } else {
      frames.push({ mode: 'equal', treeA: A, treeB: B, aId: mismatch.aId, bId: mismatch.bId, status: 'mismatch', reason: mismatch.reason, verdict: false, msg: { zh: '不相等 — ' + (mismatch.reason === 'value' ? '節點值不同' : '結構不同') + ' ✗', en: 'differ — ' + mismatch.reason + ' mismatch ✗' } });
    }
    return { frames, equal: isEqual, reason: mismatch ? mismatch.reason : null, error: null };
  }

  const api = { tokenize, parseTree, deepCopy, equal, buildCopyFrames, buildEqualFrames };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.TreeCopyEqualViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 4: Run, verify pass**

Run: `npm run test:unit`
Expected: PASS (existing unit tests + the 6 new `tree_copy_equal` tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/skhuang/course/dsvisual
git add js/tree_copy_equal_viz.js tests/unit/tree_copy_equal_viz.test.js
git commit -m "feat(dsvisual): tree copy/equal pure logic (deepCopy, equal, copy/compare frames)"
```

---

### Task 2: Render module + registry + index.html + CSS + e2e

**Files:**
- Create: `js/viz/viz_tree_copy_equal.js`
- Modify: `js/app.js` (one `METHOD_GROUPS` trees-group row)
- Modify: `index.html` (two `<script defer>` tags)
- Modify: `style.css` (append copy-equal CSS)
- Test: `tests/tree_copy_equal.spec.js`

**Interfaces:**
- Consumes (Task 1): `TreeCopyEqualViz.buildCopyFrames`, `.buildEqualFrames`, `.tokenize`.

- [ ] **Step 1: Add the registry row** in `js/app.js`, in the `METHOD_GROUPS` trees group, immediately after the `tree-general-binary` row:

```js
            { id: 'tree-copy-equal', title: 'Tree COPY & EQUAL', file: 'tree_copy_equal.cpp', visualizer: 'copyequal', controls: 'copyequal' },
```

- [ ] **Step 2: Add BOTH script tags** in `index.html`, immediately after the existing `<script src="js/viz/viz_expr_tree.js" defer></script>` line (pure first, then render):

```html
    <script src="js/tree_copy_equal_viz.js" defer></script>
    <script src="js/viz/viz_tree_copy_equal.js" defer></script>
```

- [ ] **Step 3: Create `js/viz/viz_tree_copy_equal.js`:**

```js
(function (global) {
    const K = () => global.VizKit;
    const V = () => global.TreeCopyEqualViz;

    function computeTreeLayout(node, x, y, dx, meta) {
        if (!node) return;
        meta.push({ id: node.id, val: node.val, x: x, y: y });
        if (node.left) computeTreeLayout(node.left, x - dx, y + 56, dx * 0.55, meta);
        if (node.right) computeTreeLayout(node.right, x + dx, y + 56, dx * 0.55, meta);
    }

    const PRESETS = { copy: 'A B C D E', equalA: 'A B C D E', equalB: 'A B C D E', diffA: 'A B C', diffB: 'A B D' };

    let _state = null;
    function renderTreeCopyEqual() {
        const host = K().acquireDynamicVizHost();
        if (!_state) _state = { mode: 'copy', src: PRESETS.copy, a: PRESETS.equalA, b: PRESETS.equalB };
        const st = _state;
        const langOf = K().langOf;
        const copy = st.mode === 'copy';
        const frames = copy ? V().buildCopyFrames(V().tokenize(st.src)).frames
                            : V().buildEqualFrames(V().tokenize(st.a), V().tokenize(st.b)).frames;
        let idx = 0;

        const modeBtn = (m, label) => '<button type="button" class="ce-mode-btn' + (st.mode === m ? ' active' : '') + '" data-mode="' + m + '">' + label + '</button>';
        const inputs = copy
            ? '<label>' + langOf({ zh: '樹', en: 'Tree' }) + ' <input type="text" class="ce-src" value="' + st.src.replace(/"/g, '&quot;') + '"></label>'
            : '<label>A <input type="text" class="ce-a" value="' + st.a.replace(/"/g, '&quot;') + '"></label><label>B <input type="text" class="ce-b" value="' + st.b.replace(/"/g, '&quot;') + '"></label>';
        const presetBtns = copy ? '' :
            '<button type="button" class="ce-preset" data-p="equal">' + langOf({ zh: '相等範例', en: 'equal' }) + '</button>' +
            '<button type="button" class="ce-preset" data-p="diff">' + langOf({ zh: '相異範例', en: 'differ' }) + '</button>';

        host.innerHTML =
            '<div class="ce-mode">' + modeBtn('copy', 'COPY') + modeBtn('equal', 'EQUAL') + '</div>' +
            '<div class="ce-controls">' + inputs + '<button type="button" class="ce-apply">Apply</button>' + presetBtns +
              '<span class="sm-hint">' + langOf({ zh: '層序陣列;- 表空位', en: 'level-order array; - = empty' }) + '</span></div>' +
            '<div class="ce-panels">' +
              '<div class="ce-panel"><div class="ce-ptitle">' + (copy ? langOf({ zh: '原樹', en: 'source' }) : 'A') + '</div><div class="ce-stage ce-left"><svg class="ce-edges"></svg><div class="ce-nodes"></div></div></div>' +
              '<div class="ce-panel"><div class="ce-ptitle">' + (copy ? langOf({ zh: '副本', en: 'copy' }) : 'B') + '</div><div class="ce-stage ce-right"><svg class="ce-edges"></svg><div class="ce-nodes"></div></div></div>' +
            '</div>' +
            '<div class="ce-verdict"></div><div class="et-phase"></div>';

        function paintPanel(sel, tree, hlIds, mmIds) {
            const stage = host.querySelector(sel); if (!stage) return;
            const W = stage.clientWidth || 340;
            const meta = []; let svg = '';
            if (tree) {
                computeTreeLayout(tree, W / 2, 26, Math.max(38, W / 5), meta);
                const byId = {}; meta.forEach((m) => { byId[m.id] = m; });
                (function walk(n) { if (!n) return; [n.left, n.right].forEach((c) => { if (!c) return; const x = byId[n.id], y = byId[c.id]; svg += '<line x1="' + x.x + '" y1="' + x.y + '" x2="' + y.x + '" y2="' + y.y + '" stroke="#94a3b8" stroke-width="2"/>'; walk(c); }); })(tree);
            }
            stage.querySelector('.ce-edges').innerHTML = svg;
            stage.querySelector('.ce-nodes').innerHTML = meta.map((m) => {
                let cls = 'tree-node';
                if (mmIds && mmIds.has(m.id)) cls += ' ce-mismatch';
                else if (hlIds && hlIds.has(m.id)) cls += ' ce-active';
                return '<div class="' + cls + '" style="left:' + m.x + 'px;top:' + m.y + 'px">' + m.val + '</div>';
            }).join('');
        }

        function paint() {
            const fr = frames[idx];
            if (!host.querySelector('.ce-panels')) return;
            const verdictEl = host.querySelector('.ce-verdict');
            if (copy) {
                paintPanel('.ce-left', fr.srcTree, new Set(fr.srcId ? [fr.srcId] : []), null);
                paintPanel('.ce-right', fr.copyTree, new Set(fr.copyId ? [fr.copyId] : []), null);
                if (fr.action === 'done') { verdictEl.className = 'ce-verdict ' + (fr.verdict ? 'ce-ok' : 'ce-err'); verdictEl.textContent = langOf(fr.msg); }
                else if (fr.action === 'error') { verdictEl.className = 'ce-verdict ce-err'; verdictEl.textContent = langOf(fr.msg); }
                else { verdictEl.className = 'ce-verdict'; verdictEl.textContent = ''; }
            } else {
                const mmA = new Set(), mmB = new Set(), hlA = new Set(), hlB = new Set();
                if (fr.status === 'mismatch') { if (fr.aId) mmA.add(fr.aId); if (fr.bId) mmB.add(fr.bId); }
                else { if (fr.aId) hlA.add(fr.aId); if (fr.bId) hlB.add(fr.bId); }
                paintPanel('.ce-left', fr.treeA, hlA, mmA);
                paintPanel('.ce-right', fr.treeB, hlB, mmB);
                if (fr.status === 'equal') { verdictEl.className = 'ce-verdict ce-ok'; verdictEl.textContent = langOf(fr.msg); }
                else if (fr.status === 'mismatch' || fr.status === 'error') { verdictEl.className = 'ce-verdict ce-err'; verdictEl.textContent = langOf(fr.msg); }
                else { verdictEl.className = 'ce-verdict'; verdictEl.textContent = ''; }
            }
            host.querySelector('.et-phase').textContent = langOf(fr.msg);
        }
        function step() { if (idx < frames.length - 1) { idx++; paint(); return idx < frames.length - 1; } return false; }
        function reset() { idx = 0; paint(); }

        host.appendChild(K().buildStepControls(step, reset, 800));
        paint();

        host.querySelectorAll('.ce-mode-btn').forEach((b) => { b.onclick = () => { const m = b.getAttribute('data-mode'); if (m !== st.mode) { st.mode = m; renderTreeCopyEqual(); } }; });
        host.querySelector('.ce-apply').onclick = () => {
            if (copy) { const v = host.querySelector('.ce-src').value.trim(); if (v) st.src = v; }
            else { const va = host.querySelector('.ce-a').value.trim(), vb = host.querySelector('.ce-b').value.trim(); if (va) st.a = va; if (vb) st.b = vb; }
            renderTreeCopyEqual();
        };
        host.querySelectorAll('.ce-preset').forEach((b) => { b.onclick = () => { const p = b.getAttribute('data-p'); if (p === 'equal') { st.a = PRESETS.equalA; st.b = PRESETS.equalB; } else { st.a = PRESETS.diffA; st.b = PRESETS.diffB; } renderTreeCopyEqual(); }; });
    }

    global.VizRegistry.attach('tree-copy-equal', {
        render: renderTreeCopyEqual,
        code: () => (typeof codeTreeCopyEqual !== 'undefined' ? codeTreeCopyEqual : ''),
        layout: { host: 'dynamic' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 4: Append CSS** to `style.css`:

```css
/* tree-copy-equal */
.ce-mode { display: flex; gap: 6px; margin-bottom: 8px; }
.ce-mode-btn { padding: 4px 14px; border: 1px solid #cbd5e1; background: #f8fafc; border-radius: 999px; cursor: pointer; font-size: 13px; }
.ce-mode-btn.active { background: #1a4d8f; color: #fff; border-color: #1a4d8f; }
.ce-controls { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-bottom: 8px; }
.ce-controls label { font-size: 13px; }
.ce-controls input { font-family: 'Fira Code', monospace; margin-left: 4px; }
.ce-preset { padding: 3px 10px; border: 1px solid #cbd5e1; background: #f8fafc; border-radius: 999px; cursor: pointer; font-size: 12px; }
.ce-panels { display: flex; gap: 12px; flex-wrap: wrap; }
.ce-panel { flex: 1 1 300px; min-width: 260px; }
.ce-ptitle { font-weight: 700; font-size: 13px; margin-bottom: 4px; color: #1a4d8f; }
.ce-stage { position: relative; min-height: 200px; }
.ce-stage .ce-edges { position: absolute; inset: 0; width: 100%; height: 100%; }
.tree-node.ce-active { background: #16a34a; color: #fff; border-color: #16a34a; }
.tree-node.ce-mismatch { background: #dc2626; color: #fff; border-color: #dc2626; }
.ce-verdict { margin-top: 8px; font-weight: bold; }
.ce-verdict.ce-ok { color: #16a34a; }
.ce-verdict.ce-err { color: #dc2626; }
```

- [ ] **Step 5: Create the e2e test** `tests/tree_copy_equal.spec.js`:

```js
const { test, expect } = require('@playwright/test');
const { loadMethod } = require('./helpers');
const path = require('path');

test.describe('Tree COPY & EQUAL', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
        await page.goto('file://' + path.resolve(__dirname, '../index.html'));
        await loadMethod(page, 'tree-copy-equal');
    });

    test('COPY verifies the copy equals the original', async ({ page }) => {
        const sec = page.locator('[data-method-section="tree-copy-equal"]');
        await sec.locator('.stepctl [data-action="run"]').click();
        await expect(sec.locator('.ce-verdict.ce-ok')).toContainText('yes', { timeout: 15000 });
    });

    test('EQUAL of two equal trees reports equal', async ({ page }) => {
        const sec = page.locator('[data-method-section="tree-copy-equal"]');
        await sec.locator('.ce-mode-btn[data-mode="equal"]').click();
        await sec.locator('.ce-preset[data-p="equal"]').click();
        await sec.locator('.stepctl [data-action="run"]').click();
        await expect(sec.locator('.ce-verdict.ce-ok')).toContainText('equal', { timeout: 15000 });
    });

    test('EQUAL of a differing pair marks a mismatch', async ({ page }) => {
        const sec = page.locator('[data-method-section="tree-copy-equal"]');
        await sec.locator('.ce-mode-btn[data-mode="equal"]').click();
        await sec.locator('.ce-preset[data-p="diff"]').click();
        await sec.locator('.stepctl [data-action="run"]').click();
        await expect(sec.locator('.ce-verdict.ce-err')).toContainText('differ', { timeout: 15000 });
        await expect(sec.locator('.tree-node.ce-mismatch').first()).toBeVisible();
    });
});
```

- [ ] **Step 6: Run e2e; verify pass**

Run: `npm test -- tree_copy_equal`
Expected: 3 tests pass. If the `[data-action="run"]` step-control selector differs, mirror `tests/tree_expression.spec.js` and re-run.

- [ ] **Step 7: Commit**

```bash
cd /Users/skhuang/course/dsvisual
git add js/viz/viz_tree_copy_equal.js js/app.js index.html style.css tests/tree_copy_equal.spec.js
git commit -m "feat(dsvisual): tree-copy-equal render UI + registry + e2e (COPY + EQUAL modes)"
```

---

### Task 3: C++ code drawer + description

**Files:**
- Create: `cpp/tree_copy_equal.cpp`
- Modify: `build_db.js` (add cpp→code mapping)
- Modify: `js/code_db.js` (regenerated)
- Modify: `js/desc_db.js` (add `tree-copy-equal` entry)

- [ ] **Step 1: Create `cpp/tree_copy_equal.cpp`:**

```cpp
#include <iostream>
#include <string>

struct TreeNode {
    std::string val;
    TreeNode* left = nullptr;
    TreeNode* right = nullptr;
};

// Deep copy: create the node, then copy each subtree (a top-down build).
TreeNode* copyTree(TreeNode* t) {
    if (!t) return nullptr;
    TreeNode* c = new TreeNode{ t->val, nullptr, nullptr };
    c->left = copyTree(t->left);
    c->right = copyTree(t->right);
    return c;
}

// Structural + content equality.
bool equal(TreeNode* s, TreeNode* t) {
    if (!s && !t) return true;                 // both empty
    if (!s || !t) return false;                // one empty -> shapes differ
    if (s->val != t->val) return false;        // values differ
    return equal(s->left, t->left) && equal(s->right, t->right);
}
```

- [ ] **Step 2: Add the cpp→code mapping** in `build_db.js` — add to the `mappings` object near the other `tree_*.cpp` entries:

```js
    'tree_copy_equal.cpp': 'codeTreeCopyEqual',
```

- [ ] **Step 3: Regenerate the code drawer string**

Run: `node build_db.js`
Expected: `js/code_db.js` gains `const codeTreeCopyEqual = \`...\`;`. `git diff --stat js/code_db.js` shows only that addition. If `build_db.js` rewrites unrelated `codeXxx` entries with spurious diffs, STOP and report.

- [ ] **Step 4: Add the description entry** in `js/desc_db.js` — add a `'tree-copy-equal'` key (English, matching the flat `key: \`<html>\`` shape; place near other tree entries):

```js
    'tree-copy-equal': `
        <h3>Tree COPY and EQUAL</h3>
        <p><strong>COPY</strong> makes a deep copy of a binary tree: create a new node, then recursively copy the left and right subtrees. The result is a fully independent tree with the same shape and values — <code>equal(original, copy)</code> is always true.</p>
        <p><strong>EQUAL</strong> tests whether two trees are identical by structure and content: both empty is equal; if one node is present where the other is null the shapes differ (<em>structural</em> mismatch); if two present nodes hold different values that is a <em>value</em> mismatch; otherwise recurse on both subtrees. The viz stops at the first mismatch and marks it.</p>
        <div class="complexities">
            <span class="badge time">COPY / EQUAL: O(n)</span>
            <span class="badge space">Space: O(h) recursion</span>
        </div>
    `,
```

- [ ] **Step 5: Sanity-check**

Run: `npm test -- tree_copy_equal` and `npm run test:unit`
Expected: still green. Optionally open `index.html`, select "Tree COPY & EQUAL", confirm the code drawer shows `tree_copy_equal.cpp` and the info panel shows the description.

- [ ] **Step 6: Commit**

```bash
cd /Users/skhuang/course/dsvisual
git add cpp/tree_copy_equal.cpp build_db.js js/code_db.js js/desc_db.js
git commit -m "feat(dsvisual): C++ code drawer + description for tree-copy-equal"
```

---

## Notes for the executor

- **Concurrent refactor session:** before each commit run `git status` and stage ONLY the task's named files. Never `git add -A`/`.`/`-u`.
- Task ordering: Task 1 (pure) → Task 2 (render, consumes Task 1; needs BOTH index.html tags — pure before render) → Task 3 (code drawer; the render's `code:` callback tolerates `codeTreeCopyEqual` undefined until Task 3).
- `.et-phase`/`.tree-node`/`.sm-hint` are reused from existing tree viz (shared CSS exists); all `.ce-*` classes are new (Task 2 Step 4). This viz renders TWO side-by-side tree panels (its own `.ce-stage`/`.ce-edges`/`.ce-nodes`, not the single shared `.et-stage`).
- `desc_db` uses `class="complexities"` (plural, styled) — not the unstyled singular `complexity`.
- e2e step-control selectors: if `[data-action="run"]` is wrong, mirror `tests/tree_expression.spec.js`.
