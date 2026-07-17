# tree-array-rep viz — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new dsvisual `tree-array-rep` visualization: map a binary tree (given as a positional level-order array with gaps) to its 1-indexed array, animating each node into its slot with the `left=2i / right=2i+1 / parent=⌊i/2⌋` arithmetic, marking wasted slots, and offering click-to-highlight of an index's parent/children.

**Architecture:** Pure frame-generator `js/tree_array_rep_viz.js` (`TreeArrayRepViz`); render module `js/viz/viz_tree_array_rep.js` via the `VizRegistry`/`VizKit` seam; one `METHOD_GROUPS` row; `cpp/tree_array_rep.cpp` → `js/code_db.js`; `js/desc_db.js` entry. Unit + e2e tests.

**Tech Stack:** Vanilla JS dual-export IIFE modules, `node --test` unit tests, Playwright e2e, C++ code drawer via `build_db.js`.

## Global Constraints

- Post-refactor layout (verified on `main` @ fedebca): per-viz renderers live in `js/viz/viz_*.js` using `K() = global.VizKit`; a viz self-registers via `global.VizRegistry.attach(id, {render, code, layout})`; `renderAll()` (app.js) auto-dispatches. A NEW viz needs: a `METHOD_GROUPS` trees-group row (app.js), the render module, **TWO** `index.html` `<script defer>` tags (pure module then render module, after `js/code_db.js`, before `js/app.js`), a `build_db.js` cpp→code mapping, and a `desc_db.js` entry.
- Input: positional 1-indexed array; space-separated tokens; `-` (also `.`/`_`) = empty. Index `i`: left `2i`, right `2i+1`, parent `⌊i/2⌋`. Array size = largest index holding a node. Validate: if any node present, index 1 present; every present `i>1` needs parent `⌊i/2⌋` present → else error.
- Bilingual zh/en for all UI text via `K().langOf`. `desc_db.js` is English-only file-wide — match it. Step/Run/Reset via `K().buildStepControls`.
- Additive only — no change to other viz/methods. Commit discipline: targeted `git add` of only each task's named files; a concurrent refactor session may touch this repo — run `git status` before committing, NEVER `git add -A`/`.`/`-u`, and when editing app.js add exactly the one registry row.
- Tests: unit `npm run test:unit`; e2e `npm test`.

**Examples (used across tasks):**
- Complete `A B C D E F G` → size 7, nodes 7, wasted 0.
- Right-skewed `A - C - - - G` → nodes at 1,3,7 → size 7, nodes 3, wasted 4.
- `A B C - D` → `array[1]=A,[2]=B,[3]=C,[4]=∅,[5]=D` → size 5, wasted 1, tree `A(B(-,D),C)`.
- Orphan `A - - D` → error (D at 4, parent 2 empty). Root-missing `- A` → error.

---

### Task 1: Pure array-representation logic (`TreeArrayRepViz`) + unit tests

**Files:**
- Create: `js/tree_array_rep_viz.js`
- Test: `tests/unit/tree_array_rep_viz.test.js`

**Interfaces:**
- Produces (used by Task 2):
  - `tokenize(str) -> string[]`
  - `parseLevelArray(tokens) -> { slots, size, error }` — `slots` 1-indexed; `slots[i] = {idx, val}` (val=null when empty); `error ∈ {null,'root-missing','orphan-child at index N'}`.
  - `buildArrayRepFrames(tokens) -> { frames, root, slots, size, nodeCount, wasted, error }`; Frame = `{ placedUpTo, current, parent, left, right, tree, wastedSoFar, action:'place'|'skip'|'done'|'error', msg:{zh,en} }`; `tree` node = `{id,val,idx,left,right}`.
  - `arrayIndexOfNode(root, id) -> index|null`.

- [ ] **Step 1: Write the failing unit test** — create `tests/unit/tree_array_rep_viz.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { parseLevelArray, buildArrayRepFrames, tokenize } = require('../../js/tree_array_rep_viz');

test('parseLevelArray maps positions and finds empties', () => {
  const { slots, size, error } = parseLevelArray(tokenize('A B C - D'));
  assert.equal(error, null);
  assert.equal(size, 5);
  assert.equal(slots[1].val, 'A');
  assert.equal(slots[4].val, null);
  assert.equal(slots[5].val, 'D');
});

test('complete tree wastes nothing; skewed wastes slots', () => {
  const complete = buildArrayRepFrames(tokenize('A B C D E F G'));
  assert.equal(complete.error, null);
  assert.equal(complete.size, 7);
  assert.equal(complete.nodeCount, 7);
  assert.equal(complete.wasted, 0);

  const skew = buildArrayRepFrames(tokenize('A - C - - - G'));
  assert.equal(skew.size, 7);
  assert.equal(skew.nodeCount, 3);
  assert.equal(skew.wasted, 4);
  // tree shape: A -> right C -> right G
  assert.equal(skew.root.val, 'A');
  assert.equal(skew.root.left, null);
  assert.equal(skew.root.right.val, 'C');
  assert.equal(skew.root.right.right.val, 'G');
});

test('index arithmetic reported in a place frame', () => {
  const { frames } = buildArrayRepFrames(tokenize('A B C'));
  const f2 = frames.find((f) => f.action === 'place' && f.current === 2);
  assert.equal(f2.parent, 1);
  assert.equal(f2.left, 4);
  assert.equal(f2.right, 5);
});

test('validation: orphan child and missing root error', () => {
  assert.match(buildArrayRepFrames(tokenize('A - - D')).error, /orphan-child/);
  assert.equal(buildArrayRepFrames(tokenize('- A')).error, 'root-missing');
});

test('frames carry bilingual msg and end with done stats', () => {
  const { frames, wasted, nodeCount } = buildArrayRepFrames(tokenize('A B C - D'));
  for (const f of frames) { assert.ok(f.msg.zh && f.msg.en); }
  const done = frames[frames.length - 1];
  assert.equal(done.action, 'done');
  assert.equal(wasted, 1);
  assert.equal(nodeCount, 4);
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm run test:unit`
Expected: FAIL — cannot find module `../../js/tree_array_rep_viz`.

- [ ] **Step 3: Create `js/tree_array_rep_viz.js`:**

```js
(function (global) {
  const EMPTY = new Set(['-', '.', '_']);
  function tokenize(str) { return String(str).trim().split(/\s+/).filter((s) => s.length); }
  const isEmpty = (t) => EMPTY.has(t);

  function parseLevelArray(tokens) {
    const slots = [null];               // index 0 unused
    let size = 0;
    for (let k = 0; k < tokens.length; k++) {
      const i = k + 1;
      if (isEmpty(tokens[k])) slots[i] = { idx: i, val: null };
      else { slots[i] = { idx: i, val: tokens[k] }; size = i; }
    }
    if (size === 0) return { slots, size: 0, error: null };
    if (!slots[1] || slots[1].val === null) return { slots, size, error: 'root-missing' };
    for (let i = 2; i <= size; i++) {
      if (slots[i] && slots[i].val !== null) {
        const p = Math.floor(i / 2);
        if (!slots[p] || slots[p].val === null) return { slots, size, error: 'orphan-child at index ' + i };
      }
    }
    return { slots, size, error: null };
  }

  function buildArrayRepFrames(tokens) {
    const { slots, size, error } = parseLevelArray(tokens);
    const frames = [];
    const clone = (n) => n ? { id: n.id, val: n.val, idx: n.idx, left: clone(n.left), right: clone(n.right) } : null;

    if (error) {
      const msg = error === 'root-missing'
        ? { zh: '輸入不合法:根(索引 1)不可為空', en: 'invalid: root (index 1) must be present' }
        : { zh: '輸入不合法:' + error + '(子節點需要父節點 ⌊i/2⌋ 存在)', en: 'invalid: ' + error + ' (a child requires its parent ⌊i/2⌋)' };
      frames.push({ placedUpTo: 0, current: null, parent: null, left: null, right: null, tree: null, wastedSoFar: 0, action: 'error', msg });
      return { frames, root: null, slots, size, nodeCount: 0, wasted: 0, error };
    }
    if (size === 0) {
      frames.push({ placedUpTo: 0, current: null, parent: null, left: null, right: null, tree: null, wastedSoFar: 0, action: 'done', msg: { zh: '空樹', en: 'empty tree' } });
      return { frames, root: null, slots, size: 0, nodeCount: 0, wasted: 0, error: null };
    }

    const nodeAt = {};
    let root = null, wasted = 0;
    for (let i = 1; i <= size; i++) {
      const s = slots[i];
      if (s && s.val !== null) {
        const n = { id: 'ar-' + i, val: s.val, idx: i, left: null, right: null };
        nodeAt[i] = n;
        if (i === 1) root = n;
        else { const p = Math.floor(i / 2); if (i % 2 === 0) nodeAt[p].left = n; else nodeAt[p].right = n; }
        frames.push({
          placedUpTo: i, current: i, parent: i === 1 ? null : Math.floor(i / 2), left: 2 * i, right: 2 * i + 1,
          tree: clone(root), wastedSoFar: wasted, action: 'place',
          msg: {
            zh: '索引 ' + i + ' 放入 ' + s.val + (i === 1 ? '(根)' : ';父 ⌊' + i + '/2⌋=' + Math.floor(i / 2)) + ',左 2·' + i + '=' + (2 * i) + ',右 2·' + i + '+1=' + (2 * i + 1),
            en: 'index ' + i + ' ← ' + s.val + (i === 1 ? ' (root)' : '; parent ⌊' + i + '/2⌋=' + Math.floor(i / 2)) + ', left 2·' + i + '=' + (2 * i) + ', right 2·' + i + '+1=' + (2 * i + 1),
          },
        });
      } else {
        wasted++;
        frames.push({ placedUpTo: i, current: i, parent: null, left: null, right: null, tree: clone(root), wastedSoFar: wasted, action: 'skip', msg: { zh: '索引 ' + i + ' 為空 → 浪費的槽', en: 'index ' + i + ' empty → wasted slot' } });
      }
    }
    const nodeCount = size - wasted;
    frames.push({ placedUpTo: size, current: null, parent: null, left: null, right: null, tree: clone(root), wastedSoFar: wasted, action: 'done', msg: { zh: '完成;節點 ' + nodeCount + ',槽 ' + size + ',浪費 ' + wasted, en: 'done; nodes ' + nodeCount + ', slots ' + size + ', wasted ' + wasted } });
    return { frames, root, slots, size, nodeCount, wasted, error: null };
  }

  function arrayIndexOfNode(root, id) {
    let found = null;
    (function go(n) { if (!n || found !== null) return; if (n.id === id) { found = n.idx; return; } go(n.left); go(n.right); })(root);
    return found;
  }

  const api = { tokenize, parseLevelArray, buildArrayRepFrames, arrayIndexOfNode };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.TreeArrayRepViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 4: Run, verify pass**

Run: `npm run test:unit`
Expected: PASS (existing unit tests + the 5 new `tree_array_rep` tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/skhuang/course/dsvisual
git add js/tree_array_rep_viz.js tests/unit/tree_array_rep_viz.test.js
git commit -m "feat(dsvisual): tree-array-rep pure logic (level-array parse, index arithmetic, waste)"
```

---

### Task 2: Render module + registry + index.html + CSS + e2e

**Files:**
- Create: `js/viz/viz_tree_array_rep.js`
- Modify: `js/app.js` (one `METHOD_GROUPS` trees-group row)
- Modify: `index.html` (two `<script defer>` tags)
- Modify: `style.css` (append array-rep CSS)
- Test: `tests/tree_array_rep.spec.js`

**Interfaces:**
- Consumes (Task 1): `TreeArrayRepViz.buildArrayRepFrames`, `.tokenize`, `.parseLevelArray` (via the returned `slots`).

- [ ] **Step 1: Add the registry row** in `js/app.js`, in the `METHOD_GROUPS` trees group, immediately after the `tree-general-binary` row:

```js
            { id: 'tree-array-rep', title: 'Array Representation', file: 'tree_array_rep.cpp', visualizer: 'arrayrep', controls: 'arrayrep' },
```

- [ ] **Step 2: Add BOTH script tags** in `index.html`, immediately after the existing `<script src="js/viz/viz_expr_tree.js" defer></script>` line (pure module first, then render module):

```html
    <script src="js/tree_array_rep_viz.js" defer></script>
    <script src="js/viz/viz_tree_array_rep.js" defer></script>
```

- [ ] **Step 3: Create `js/viz/viz_tree_array_rep.js`:**

```js
(function (global) {
    const K = () => global.VizKit;

    function computeTreeLayout(node, x, y, dx, meta) {
        if (!node) return;
        meta.push({ id: node.id, val: node.val, idx: node.idx, x: x, y: y });
        if (node.left) computeTreeLayout(node.left, x - dx, y + 60, dx * 0.55, meta);
        if (node.right) computeTreeLayout(node.right, x + dx, y + 60, dx * 0.55, meta);
    }

    const PRESETS = { complete: 'A B C D E F G', 'left-skewed': 'A B - D - - - H', 'right-skewed': 'A - C - - - G' };

    function randomLevelArray() {
        const labels = 'ABCDEFGHIJKLMNO'.split('');
        const present = {}; let li = 0;
        (function grow(i, depth) {
            if (i > 15 || li >= labels.length) return;
            present[i] = labels[li++];
            if (depth < 3) { if (Math.random() < 0.7) grow(2 * i, depth + 1); if (Math.random() < 0.7) grow(2 * i + 1, depth + 1); }
        })(1, 0);
        const maxIdx = Math.max.apply(null, Object.keys(present).map(Number));
        const toks = [];
        for (let i = 1; i <= maxIdx; i++) toks.push(present[i] || '-');
        return toks.join(' ');
    }

    let _state = null;
    function renderTreeArrayRep() {
        const host = K().acquireDynamicVizHost();
        if (!_state) _state = { text: PRESETS.complete };
        const st = _state;
        const langOf = K().langOf;
        const res = TreeArrayRepViz.buildArrayRepFrames(TreeArrayRepViz.tokenize(st.text));
        const frames = res.frames;
        const size = res.size;
        const slots = res.slots;
        let idx = 0;

        host.innerHTML =
            '<div class="ar-controls">' +
              '<input type="text" class="ar-input" value="' + st.text.replace(/"/g, '&quot;') + '">' +
              '<button type="button" class="rand-btn" title="Random">🎲</button>' +
              '<button type="button" class="ar-apply">Apply</button>' +
              '<span class="sm-hint">' + langOf({ zh: '層序陣列;- 表空位;左=2i 右=2i+1 父=⌊i/2⌋', en: 'level-order array; - = empty; left=2i right=2i+1 parent=⌊i/2⌋' }) + '</span>' +
            '</div>' +
            '<div class="ar-presets">' +
              ['complete', 'left-skewed', 'right-skewed'].map((p) => '<button type="button" class="ar-preset" data-p="' + p + '">' + p + '</button>').join('') +
            '</div>' +
            '<div class="et-stage"><svg class="et-edges"></svg><div class="et-nodes"></div></div>' +
            '<div class="ar-array"></div>' +
            '<div class="ar-stats"></div>' +
            '<div class="et-phase"></div>';

        function highlightArithmetic(i) {
            host.querySelectorAll('.ar-cell,.tree-node').forEach((c) => c.classList.remove('ar-hl-self', 'ar-hl-parent', 'ar-hl-child'));
            if (!i) return;
            const mark = (j, cls) => { const c = host.querySelector('.ar-cell[data-i="' + j + '"]'); if (c) c.classList.add(cls); const tn = host.querySelector('.tree-node[data-i="' + j + '"]'); if (tn) tn.classList.add(cls); };
            mark(i, 'ar-hl-self');
            if (i > 1) mark(Math.floor(i / 2), 'ar-hl-parent');
            mark(2 * i, 'ar-hl-child'); mark(2 * i + 1, 'ar-hl-child');
        }

        function paint() {
            const fr = frames[idx];
            if (!host.querySelector('.et-stage')) return;
            const stageEl = host.querySelector('.et-stage'); const W = stageEl.clientWidth || 720;
            const meta = []; let svg = '';
            if (fr.tree) {
                computeTreeLayout(fr.tree, W / 2, 30, Math.max(44, W / 6), meta);
                const byId = {}; meta.forEach((mm) => { byId[mm.id] = mm; });
                (function walk(n) { if (!n) return; [n.left, n.right].forEach((c) => { if (!c) return; const a = byId[n.id], b = byId[c.id]; svg += '<line x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '" stroke="#94a3b8" stroke-width="2"/>'; walk(c); }); })(fr.tree);
            }
            host.querySelector('.et-edges').innerHTML = svg;
            host.querySelector('.et-nodes').innerHTML = meta.map((mm) =>
                '<div class="tree-node' + (fr.current === mm.idx ? ' ar-placing' : '') + '" data-i="' + mm.idx + '" style="left:' + mm.x + 'px;top:' + mm.y + 'px">' + mm.val + '</div>').join('');

            let cells = '';
            for (let i = 1; i <= size; i++) {
                const revealed = i <= fr.placedUpTo;
                const s = slots[i];
                const empty = !s || s.val === null;
                let cls = 'ar-cell';
                if (!revealed) cls += ' ar-hidden';
                else if (empty) cls += ' ar-wasted';
                if (revealed && fr.current === i) cls += ' ar-current';
                if (revealed && fr.parent === i) cls += ' ar-parent';
                if (revealed && (fr.left === i || fr.right === i)) cls += ' ar-childidx';
                cells += '<div class="ar-cellwrap"><div class="ar-idx">' + i + '</div><div class="' + cls + '" data-i="' + i + '">' + (revealed ? (empty ? '·' : s.val) : '') + '</div></div>';
            }
            host.querySelector('.ar-array').innerHTML = cells;

            const statsEl = host.querySelector('.ar-stats');
            if (fr.action === 'done' && size > 0) { statsEl.className = 'ar-stats ar-ok'; statsEl.textContent = langOf(fr.msg) + ' — ' + langOf({ zh: '(偏斜樹最壞需 2^(h+1)−1 槽)', en: '(a skewed tree needs up to 2^(h+1)−1 slots)' }); }
            else if (fr.action === 'error') { statsEl.className = 'ar-stats ar-err'; statsEl.textContent = langOf(fr.msg); }
            else { statsEl.className = 'ar-stats'; statsEl.textContent = langOf({ zh: '目前浪費槽 = ', en: 'wasted so far = ' }) + fr.wastedSoFar; }
            host.querySelector('.et-phase').textContent = langOf(fr.msg);

            host.querySelectorAll('.ar-cell:not(.ar-hidden),.tree-node').forEach((el) => {
                el.onclick = () => highlightArithmetic(parseInt(el.getAttribute('data-i'), 10));
            });
        }
        function step() { if (idx < frames.length - 1) { idx++; paint(); return idx < frames.length - 1; } return false; }
        function reset() { idx = 0; paint(); }

        host.appendChild(K().buildStepControls(step, reset, 700));
        paint();

        host.querySelector('.ar-apply').onclick = () => { const v = host.querySelector('.ar-input').value.trim(); if (v) { st.text = v; renderTreeArrayRep(); } };
        host.querySelectorAll('.ar-preset').forEach((b) => { b.onclick = () => { st.text = PRESETS[b.getAttribute('data-p')]; renderTreeArrayRep(); }; });
        host.querySelector('.rand-btn').onclick = () => { st.text = randomLevelArray(); renderTreeArrayRep(); };
    }

    global.VizRegistry.attach('tree-array-rep', {
        render: renderTreeArrayRep,
        code: () => (typeof codeTreeArrayRep !== 'undefined' ? codeTreeArrayRep : ''),
        layout: { host: 'dynamic' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 4: Append CSS** to `style.css`:

```css
/* tree-array-rep */
.ar-controls { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 6px; }
.ar-controls .ar-input { font-family: 'Fira Code', monospace; min-width: 220px; }
.ar-presets { display: flex; gap: 6px; margin-bottom: 8px; }
.ar-preset { padding: 3px 10px; border: 1px solid #cbd5e1; background: #f8fafc; border-radius: 999px; cursor: pointer; font-size: 12px; }
.ar-array { display: flex; flex-wrap: wrap; gap: 4px; margin: 10px 0; }
.ar-cellwrap { display: flex; flex-direction: column; align-items: center; }
.ar-idx { font-size: 11px; color: #64748b; font-family: 'Fira Code', monospace; }
.ar-cell { min-width: 26px; height: 26px; line-height: 26px; text-align: center; border: 1px solid #cbd5e1; border-radius: 4px; font-family: 'Fira Code', monospace; background: #fff; }
.ar-cell.ar-hidden { visibility: hidden; }
.ar-cell.ar-wasted { background: repeating-linear-gradient(45deg, #f1f5f9, #f1f5f9 4px, #e2e8f0 4px, #e2e8f0 8px); color: #94a3b8; }
.ar-cell.ar-current, .tree-node.ar-placing { outline: 2px solid #16a34a; }
.ar-cell.ar-parent { outline: 2px solid #1a4d8f; }
.ar-cell.ar-childidx { outline: 2px dashed #f59e0b; }
.ar-cell.ar-hl-self, .tree-node.ar-hl-self { outline: 3px solid #16a34a; }
.ar-cell.ar-hl-parent, .tree-node.ar-hl-parent { outline: 3px solid #1a4d8f; }
.ar-cell.ar-hl-child, .tree-node.ar-hl-child { outline: 3px dashed #f59e0b; }
.ar-stats { margin-top: 6px; font-weight: bold; }
.ar-stats.ar-ok { color: #16a34a; }
.ar-stats.ar-err { color: #dc2626; }
```

- [ ] **Step 5: Create the e2e test** `tests/tree_array_rep.spec.js`:

```js
const { test, expect } = require('@playwright/test');
const { loadMethod } = require('./helpers');
const path = require('path');

test.describe('Array Representation', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
        await page.goto('file://' + path.resolve(__dirname, '../index.html'));
        await loadMethod(page, 'tree-array-rep');
    });

    test('right-skewed preset shows wasted slots', async ({ page }) => {
        const sec = page.locator('[data-method-section="tree-array-rep"]');
        await sec.locator('.ar-preset[data-p="right-skewed"]').click();
        await sec.locator('.stepctl [data-action="run"]').click();
        await expect(sec.locator('.ar-stats.ar-ok')).toContainText('wasted 4', { timeout: 15000 });
        await expect(sec.locator('.ar-cell.ar-wasted').first()).toBeVisible();
    });

    test('complete preset wastes nothing', async ({ page }) => {
        const sec = page.locator('[data-method-section="tree-array-rep"]');
        await sec.locator('.ar-preset[data-p="complete"]').click();
        await sec.locator('.stepctl [data-action="run"]').click();
        await expect(sec.locator('.ar-stats.ar-ok')).toContainText('wasted 0', { timeout: 15000 });
    });

    test('clicking a node highlights its parent cell', async ({ page }) => {
        const sec = page.locator('[data-method-section="tree-array-rep"]');
        await sec.locator('.ar-preset[data-p="right-skewed"]').click();
        await sec.locator('.stepctl [data-action="run"]').click();
        await expect(sec.locator('.ar-stats.ar-ok')).toBeVisible({ timeout: 15000 });
        await sec.locator('.tree-node[data-i="3"]').click();          // node C at index 3
        await expect(sec.locator('.ar-cell[data-i="1"].ar-hl-parent')).toBeVisible();
    });
});
```

- [ ] **Step 6: Run e2e; verify pass**

Run: `npm test -- tree_array_rep`
Expected: 3 tests pass. If the `[data-action="run"]` step-control selector differs, mirror `tests/tree_expression.spec.js` (confirmed pattern) and re-run.

- [ ] **Step 7: Commit**

```bash
cd /Users/skhuang/course/dsvisual
git add js/viz/viz_tree_array_rep.js js/app.js index.html style.css tests/tree_array_rep.spec.js
git commit -m "feat(dsvisual): tree-array-rep render UI + registry + e2e (presets, waste, click-highlight)"
```

---

### Task 3: C++ code drawer + description

**Files:**
- Create: `cpp/tree_array_rep.cpp`
- Modify: `build_db.js` (add cpp→code mapping)
- Modify: `js/code_db.js` (regenerated)
- Modify: `js/desc_db.js` (add `tree-array-rep` entry)

- [ ] **Step 1: Create `cpp/tree_array_rep.cpp`:**

```cpp
#include <iostream>
#include <vector>
#include <string>
#include <sstream>

// Sequential (array) representation of a binary tree.
// 1-indexed: node i has left child 2i, right child 2i+1, parent i/2.
// Empty slots hold "-"; a skewed tree wastes many slots.
struct ArrayTree {
    std::vector<std::string> a;             // a[0] unused
    static const std::string EMPTY;

    int left(int i)   const { return 2 * i; }
    int right(int i)  const { return 2 * i + 1; }
    int parent(int i) const { return i / 2; }

    // Parse a level-order description ("A B C - D"); position k -> index k.
    void fromLevel(const std::string& s) {
        a.assign(1, EMPTY);                 // index 0 placeholder
        std::istringstream in(s);
        std::string tok;
        while (in >> tok) a.push_back(tok);
    }

    int size() const { return (int)a.size() - 1; }
    bool present(int i) const { return i >= 1 && i < (int)a.size() && a[i] != EMPTY; }

    int nodeCount() const {
        int c = 0;
        for (int i = 1; i <= size(); ++i) if (present(i)) ++c;
        return c;
    }
    int wastedSlots() const { return size() - nodeCount(); }

    // Inorder traversal over the array layout.
    void inorder(int i) const {
        if (i > size() || !present(i)) return;
        inorder(left(i));
        std::cout << a[i] << ' ';
        inorder(right(i));
    }
};
const std::string ArrayTree::EMPTY = "-";
```

- [ ] **Step 2: Add the cpp→code mapping** in `build_db.js` — add to the `mappings` object near the other `tree_*.cpp` entries:

```js
    'tree_array_rep.cpp': 'codeTreeArrayRep',
```

- [ ] **Step 3: Regenerate the code drawer string**

Run: `node build_db.js`
Expected: `js/code_db.js` gains `const codeTreeArrayRep = \`...\`;`. `git diff --stat js/code_db.js` shows only that addition. If `build_db.js` rewrites unrelated `codeXxx` entries with spurious diffs, STOP and report instead of committing noise.

- [ ] **Step 4: Add the description entry** in `js/desc_db.js` — add a `'tree-array-rep'` key (English, matching the flat `key: \`<html>\`` shape; place near other tree entries):

```js
    'tree-array-rep': `
        <h3>Sequential (Array) Representation of a Binary Tree</h3>
        <p>A binary tree can be stored in a 1-indexed array where the node at index <code>i</code> has its left child at <code>2i</code>, right child at <code>2i+1</code>, and parent at <code>⌊i/2⌋</code>. No pointers are needed — the position encodes the structure.</p>
        <p>This is compact for a <strong>complete</strong> tree (no gaps) but wasteful for a <strong>skewed</strong> tree: a tree of height <code>h</code> may need up to <code>2<sup>h+1</sup>−1</code> slots while holding as few as <code>h+1</code> nodes. The viz marks the wasted slots so the space cost is visible.</p>
        <div class="complexities">
            <span class="badge time">Index ops: O(1)</span>
            <span class="badge space">Space: O(2^h) worst case</span>
        </div>
    `,
```

- [ ] **Step 5: Sanity-check**

Run: `npm test -- tree_array_rep` and `npm run test:unit`
Expected: still green. Optionally open `index.html`, select "Array Representation", confirm the code drawer shows `tree_array_rep.cpp` and the info panel shows the description.

- [ ] **Step 6: Commit**

```bash
cd /Users/skhuang/course/dsvisual
git add cpp/tree_array_rep.cpp build_db.js js/code_db.js js/desc_db.js
git commit -m "feat(dsvisual): C++ code drawer + description for tree-array-rep"
```

---

## Notes for the executor

- **Concurrent refactor session:** before each commit run `git status` and stage ONLY the task's named files. Never `git add -A`/`.`/`-u`.
- Task ordering: Task 1 (pure) → Task 2 (render, consumes Task 1; needs BOTH index.html script tags — pure before render) → Task 3 (code drawer; the render's `code:` callback tolerates `codeTreeArrayRep` undefined until Task 3).
- `.et-stage`/`.et-edges`/`.et-nodes`/`.et-phase`/`.tree-node` classes are reused from existing tree viz (shared CSS exists); the `.ar-*` classes are new (Task 2 Step 4).
- The `desc_db` entry uses `class="complexities"` (plural — the styled class; note several existing entries use the unstyled singular `complexity`, avoid copying that).
- e2e step-control selectors: if `[data-action="run"]` is wrong, mirror `tests/tree_expression.spec.js`.
