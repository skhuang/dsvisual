# Tier-1 Batch B: Optimal BST + External Merge Sort — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two dsvisual visualizations — `tree-obst` (Optimal BST: DP table fill → reconstructed optimal tree) and `sort-external` (external merge sort: run generation → k-way merge via a winner/selection tournament tree) — each with Step/Run/Reset, bilingual UI + slides, and tests.

**Architecture:** Pure frame-generators in standalone dual-export modules (`tree_obst_viz.js`, `sort_external_viz.js`, like `heap_models.js`), unit-tested under `node --test`. DOM renderers (`renderTreeObst`, `renderSortExternal`) added inside app.js using `acquireDynamicVizHost()` + `buildStepControls()`. `tree-obst` reuses `computeTreeLayout()` for the reconstructed tree (following the node-drawing rules: nodes centered via translate, edges at (x,y) with no offset, stage `overflow:hidden`). `sort-external` uses a single-pass tournament (winner) merge of all runs.

**Tech Stack:** Vanilla JS (IIFE modules + browser globals), Node test runner, Playwright, Marp slides via `build_slides.js`, Prism via `build_db.js`.

**Spec:** `docs/superpowers/specs/2026-06-09-tier1-remaining-visualizations-design.md` (§3.3 tree-obst, §3.4 sort-external; the spec's flagged loser-vs-winner choice is resolved here as **winner/selection tree, single merge pass**).

---

## File Structure

- `tree_obst_viz.js` (new) — pure: `sumFreq`, `buildObstFrames`. `window.ObstViz` + `module.exports`.
- `sort_external_viz.js` (new) — pure: `buildWinnerTree`, `buildExternalSortFrames`. `window.ExtSortViz` + `module.exports`.
- `tree_obst.cpp`, `sort_external.cpp` (new) — C++ reference for the code panel.
- `tests/unit/tree_obst_viz.test.js`, `tests/unit/sort_external_viz.test.js` (new).
- `tests/tree_obst.spec.js`, `tests/sort_external.spec.js` (new) — Playwright E2E.
- `app.js` (modify) — register both methods, code lookup, updateLayout branches, renderAll dispatch, `renderTreeObst` + `renderSortExternal`.
- `build_db.js`, `index.html`, `i18n.js`, `desc_db.js`, `slides_db.js`, `style.css` (modify).
- Regenerated: `code_db.js`, `slides_rendered.js` (+ slides md).

---

## Task 1: Feature branch + tree-obst pure module (TDD)

**Files:** Create `tree_obst_viz.js`, `tests/unit/tree_obst_viz.test.js`.

- [ ] **Step 1: Branch**
```bash
cd /Users/skhuang/course/dsvisual
git checkout main && git pull --ff-only
git checkout -b feat/tier1-batch-b
git branch --show-current
```
Expected: `feat/tier1-batch-b`.

- [ ] **Step 2: Write the failing unit test**

Create `tests/unit/tree_obst_viz.test.js`:
```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { buildObstFrames } = require('../../tree_obst_viz');

function inorder(node, out) { if (!node) return out; inorder(node.left, out); out.push(node.val); inorder(node.right, out); return out; }

test('OBST cost/root tables are correct for keys [10,20,30,40] freq [4,2,6,3]', () => {
  const { cost, root } = buildObstFrames([10, 20, 30, 40], [4, 2, 6, 3]);
  assert.equal(cost['0,3'], 26);      // minimal weighted path length
  assert.equal(root['0,3'], 2);       // optimal root index = key 30
  assert.equal(cost['0,1'], 8);
  assert.equal(cost['1,3'], 16);
});

test('reconstructed tree is a BST (inorder = sorted keys) rooted at the optimal key', () => {
  const { tree } = buildObstFrames([10, 20, 30, 40], [4, 2, 6, 3]);
  assert.equal(tree.val, 30);
  assert.deepEqual(inorder(tree, []), [10, 20, 30, 40]);
});

test('single key: cost = its frequency; tree is that key', () => {
  const { cost, tree } = buildObstFrames([5], [7]);
  assert.equal(cost['0,0'], 7);
  assert.equal(tree.val, 5);
  assert.equal(tree.left, null);
});

test('frames fill cells by increasing length and carry bilingual msg', () => {
  const { frames } = buildObstFrames([10, 20, 30, 40], [4, 2, 6, 3]);
  const cellFrames = frames.filter((f) => f.phase === 'fill');
  assert.ok(cellFrames.length >= 10); // n(n+1)/2 = 10 cells
  for (const f of frames) assert.ok(f.msg.zh && f.msg.en);
  assert.ok(frames.some((f) => f.phase === 'tree'));
});
```

- [ ] **Step 3: Run — expect FAIL**

Run: `cd /Users/skhuang/course/dsvisual && node --test tests/unit/tree_obst_viz.test.js`
Expected: FAIL — `Cannot find module '../../tree_obst_viz'`.

- [ ] **Step 4: Implement `tree_obst_viz.js`**

Create `tree_obst_viz.js`:
```js
(function (global) {
  function sumFreq(freqs, i, j) { let s = 0; for (let k = i; k <= j; k++) s += freqs[k]; return s; }

  function buildObstFrames(keys, freqs) {
    const n = keys.length;
    const cost = {}, root = {};
    const frames = [];
    const key = (i, j) => i + ',' + j;
    const snap = (phase, i, j, tryRoot, msg) => frames.push({
      phase, i, j, tryRoot,
      cost: Object.assign({}, cost), root: Object.assign({}, root), msg
    });

    // length-1 cells
    for (let i = 0; i < n; i++) { cost[key(i, i)] = freqs[i]; root[key(i, i)] = i; snap('fill', i, i, i, { zh: 'cost[' + i + ',' + i + '] = ' + freqs[i], en: 'cost[' + i + ',' + i + '] = ' + freqs[i] }); }

    for (let len = 2; len <= n; len++) {
      for (let i = 0; i + len - 1 < n; i++) {
        const j = i + len - 1;
        const w = sumFreq(freqs, i, j);
        let best = Infinity, bestR = i;
        for (let r = i; r <= j; r++) {
          const left = r > i ? cost[key(i, r - 1)] : 0;
          const right = r < j ? cost[key(r + 1, j)] : 0;
          const c = left + right + w;
          if (c < best) { best = c; bestR = r; }
        }
        cost[key(i, j)] = best; root[key(i, j)] = bestR;
        snap('fill', i, j, bestR, { zh: 'cost[' + i + ',' + j + '] = ' + best + '(root=' + keys[bestR] + ')', en: 'cost[' + i + ',' + j + '] = ' + best + ' (root=' + keys[bestR] + ')' });
      }
    }

    // reconstruct optimal tree
    let idCounter = 0;
    function build(i, j) {
      if (i > j) return null;
      const r = root[key(i, j)];
      const node = { val: keys[r], left: null, right: null, id: 'obst-' + (idCounter++) };
      node.left = build(i, r - 1);
      node.right = build(r + 1, j);
      return node;
    }
    const tree = build(0, n - 1);
    snap('tree', 0, n - 1, root[key(0, n - 1)], { zh: '重建最佳 BST,最小加權路徑長 = ' + cost[key(0, n - 1)], en: 'Reconstruct optimal BST; min weighted path length = ' + cost[key(0, n - 1)] });

    return { frames, cost, root, tree };
  }

  const api = { sumFreq, buildObstFrames };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.ObstViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 5: Run — expect PASS**

Run: `cd /Users/skhuang/course/dsvisual && node --test tests/unit/tree_obst_viz.test.js`
Expected: PASS — 4 tests (`# pass 4`, `# fail 0`).

- [ ] **Step 6: Commit**
```bash
cd /Users/skhuang/course/dsvisual
git add tree_obst_viz.js tests/unit/tree_obst_viz.test.js
git commit -m "feat(viz): optimal-BST pure frame generator + unit tests"
```

---

## Task 2: sort-external pure module (TDD)

**Files:** Create `sort_external_viz.js`, `tests/unit/sort_external_viz.test.js`.

- [ ] **Step 1: Write the failing unit test**

Create `tests/unit/sort_external_viz.test.js`:
```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { buildWinnerTree, buildExternalSortFrames } = require('../../sort_external_viz');

test('buildWinnerTree puts the overall minimum at index 1', () => {
  const tree = buildWinnerTree([5, 2, 8, 1]);
  assert.equal(tree[1].val, 1);
  assert.equal(tree[1].run, 3);
});

test('external sort output equals the fully sorted input', () => {
  const data = [5, 3, 8, 1, 9, 2, 7, 4, 6, 0];
  const { output } = buildExternalSortFrames(data, 4);
  assert.deepEqual(output, [...data].sort((a, b) => a - b));
});

test('run generation produces ceil(n/M) sorted runs', () => {
  const data = [5, 3, 8, 1, 9, 2, 7];
  const { runs } = buildExternalSortFrames(data, 3);
  assert.equal(runs.length, Math.ceil(data.length / 3));
  for (const r of runs) assert.deepEqual(r, [...r].sort((a, b) => a - b));
});

test('frames cover runs then merge, and carry bilingual msg', () => {
  const { frames } = buildExternalSortFrames([5, 3, 8, 1, 9], 2);
  const phases = new Set(frames.map((f) => f.phase));
  assert.ok(phases.has('runs'));
  assert.ok(phases.has('merge'));
  for (const f of frames) assert.ok(f.msg.zh && f.msg.en);
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `cd /Users/skhuang/course/dsvisual && node --test tests/unit/sort_external_viz.test.js`
Expected: FAIL — `Cannot find module '../../sort_external_viz'`.

- [ ] **Step 3: Implement `sort_external_viz.js`**

Create `sort_external_viz.js`:
```js
(function (global) {
  const INF = Infinity;

  // Tournament/winner tree over per-run head values. tree[1] is the overall min.
  // Each entry: { val, run } (run = source run index, -1 for padding).
  function buildWinnerTree(headVals) {
    let L = 1;
    while (L < headVals.length) L *= 2;
    if (L < 1) L = 1;
    const tree = new Array(2 * L).fill(null);
    for (let i = 0; i < L; i++) {
      const has = i < headVals.length;
      tree[L + i] = { val: has ? headVals[i] : INF, run: has ? i : -1 };
    }
    for (let i = L - 1; i >= 1; i--) {
      const a = tree[2 * i], b = tree[2 * i + 1];
      tree[i] = (a.val <= b.val) ? a : b;
    }
    return tree;
  }

  function buildExternalSortFrames(data, M) {
    const frames = [];
    // Phase 1: run generation
    const runs = [];
    for (let i = 0; i < data.length; i += M) {
      const run = data.slice(i, i + M).sort((a, b) => a - b);
      runs.push(run);
      frames.push({ phase: 'runs', runs: runs.map((r) => r.slice()), current: runs.length - 1, heads: [], tree: [], winnerRun: -1, output: [], msg: { zh: '產生第 ' + runs.length + ' 個 run(內排序)', en: 'Generate run ' + runs.length + ' (internal sort)' } });
    }

    // Phase 2: single-pass tournament k-way merge
    const ptr = runs.map(() => 0);
    const output = [];
    const headVals = () => runs.map((r, i) => (ptr[i] < r.length ? r[ptr[i]] : INF));
    const remaining = () => runs.map((r, i) => r.slice(ptr[i]));
    let guard = 0;
    while (true) {
      const heads = headVals();
      if (heads.every((v) => v === INF)) break;
      const tree = buildWinnerTree(heads);
      const win = tree[1];
      output.push(win.val);
      ptr[win.run]++;
      frames.push({
        phase: 'merge',
        runs: remaining(),
        heads: heads.map((v) => (v === INF ? null : v)),
        tree: tree.map((t) => (t ? { val: (t.val === INF ? null : t.val), run: t.run } : null)),
        winnerRun: win.run,
        output: output.slice(),
        current: -1,
        msg: { zh: '取出最小值 ' + win.val + '(來自 run ' + (win.run + 1) + ')', en: 'Emit minimum ' + win.val + ' (from run ' + (win.run + 1) + ')' }
      });
      if (++guard > data.length + 5) break; // safety
    }
    frames.push({ phase: 'merge', runs: remaining(), heads: [], tree: [], winnerRun: -1, output: output.slice(), current: -1, msg: { zh: '合併完成,輸出已排序', en: 'Merge complete; output is sorted' } });

    return { frames, runs, output };
  }

  const api = { buildWinnerTree, buildExternalSortFrames };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.ExtSortViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 4: Run — expect PASS**

Run: `cd /Users/skhuang/course/dsvisual && node --test tests/unit/sort_external_viz.test.js`
Expected: PASS — 4 tests (`# pass 4`, `# fail 0`).

- [ ] **Step 5: Commit**
```bash
cd /Users/skhuang/course/dsvisual
git add sort_external_viz.js tests/unit/sort_external_viz.test.js
git commit -m "feat(viz): external-sort (winner-tree merge) pure frame generator + unit tests"
```

---

## Task 3: C++ references + code_db regeneration

**Files:** Create `tree_obst.cpp`, `sort_external.cpp`; modify `build_db.js`; regenerate `code_db.js`.

- [ ] **Step 1: Create `tree_obst.cpp`**
```cpp
#include <vector>
#include <limits>

// Optimal Binary Search Tree via dynamic programming.
// keys sorted ascending; freq[i] = access frequency of keys[i].
// cost[i][j] = min weighted path length for the subrange keys[i..j].
int optimalBST(const std::vector<int>& freq) {
    int n = (int)freq.size();
    std::vector<std::vector<int>> cost(n, std::vector<int>(n, 0));
    std::vector<std::vector<int>> w(n, std::vector<int>(n, 0));
    for (int i = 0; i < n; i++) { cost[i][i] = freq[i]; w[i][i] = freq[i]; }
    for (int len = 2; len <= n; len++) {
        for (int i = 0; i + len - 1 < n; i++) {
            int j = i + len - 1;
            w[i][j] = w[i][j - 1] + freq[j];
            cost[i][j] = std::numeric_limits<int>::max();
            for (int r = i; r <= j; r++) {
                int left = (r > i) ? cost[i][r - 1] : 0;
                int right = (r < j) ? cost[r + 1][j] : 0;
                int c = left + right + w[i][j];
                if (c < cost[i][j]) cost[i][j] = c;
            }
        }
    }
    return n ? cost[0][n - 1] : 0;
}
```

- [ ] **Step 2: Create `sort_external.cpp`**
```cpp
#include <vector>
#include <queue>
#include <algorithm>

// External merge sort (in-memory model): generate sorted runs of size M,
// then k-way merge them with a min-heap (a practical stand-in for a
// selection/loser tree).
std::vector<int> externalSort(std::vector<int> data, int M) {
    std::vector<std::vector<int>> runs;
    for (size_t i = 0; i < data.size(); i += M) {
        std::vector<int> run(data.begin() + i, data.begin() + std::min(data.size(), i + (size_t)M));
        std::sort(run.begin(), run.end());
        runs.push_back(run);
    }
    // (value, run index, position within run)
    using Item = std::tuple<int, int, int>;
    std::priority_queue<Item, std::vector<Item>, std::greater<Item>> pq;
    for (int r = 0; r < (int)runs.size(); r++) if (!runs[r].empty()) pq.push({runs[r][0], r, 0});

    std::vector<int> out;
    while (!pq.empty()) {
        auto [val, r, pos] = pq.top(); pq.pop();
        out.push_back(val);
        if (pos + 1 < (int)runs[r].size()) pq.push({runs[r][pos + 1], r, pos + 1});
    }
    return out;
}
```

- [ ] **Step 3: Register in `build_db.js`**

In `build_db.js` `mappings`, add:
```js
    'tree_obst.cpp': 'codeTreeObst',
    'sort_external.cpp': 'codeSortExternal',
```

- [ ] **Step 4: Regenerate + verify**
```bash
cd /Users/skhuang/course/dsvisual
node build_db.js
grep -c 'const codeTreeObst' code_db.js
grep -c 'const codeSortExternal' code_db.js
```
Expected: build no error; both counts `1`.

- [ ] **Step 5: Commit**
```bash
cd /Users/skhuang/course/dsvisual
git add tree_obst.cpp sort_external.cpp build_db.js code_db.js
git commit -m "feat(viz): C++ refs for optimal-BST & external sort; regen code_db"
```

---

## Task 4: app.js registration + index.html

**Files:** Modify `app.js`, `index.html`.

- [ ] **Step 1: Register methods in METHOD_GROUPS**

In `app.js`, in the `trees` group's `methods`, after the `huffman` entry (`{ id: 'huffman', ... }`) add:
```js
            { id: 'tree-obst', title: 'Optimal BST', file: 'tree_obst.cpp', visualizer: 'obst', controls: 'obst' },
```
In the `sorting` group's `methods`, after the `sort-shaker` entry add:
```js
            { id: 'sort-external', title: 'External Merge Sort', file: 'sort_external.cpp', visualizer: 'extsort', controls: 'extsort' },
```

- [ ] **Step 2: code lookup in getCodeForMethod()**

In `app.js` `codeByMethod`, add (near other tree / sort entries):
```js
        'tree-obst': codeTreeObst,
        'sort-external': codeSortExternal,
```

- [ ] **Step 3: updateLayout() branches**

After the existing `else if (currentMode === 'huffman') { ... }` block, add:
```js
        else if (currentMode === 'tree-obst') {
            codeTitle.textContent = 'tree_obst.cpp';
            codeDisplay.textContent = codeTreeObst;
        }
        else if (currentMode === 'sort-external') {
            codeTitle.textContent = 'sort_external.cpp';
            codeDisplay.textContent = codeSortExternal;
        }
```

- [ ] **Step 4: renderAll() dispatch**

After the existing `else if (currentMode === 'huffman') renderHuffman();` line, add:
```js
        else if (currentMode === 'tree-obst') renderTreeObst();
        else if (currentMode === 'sort-external') renderSortExternal();
```
IMPORTANT: place these BEFORE the generic `currentMode.includes('sort-')` catch-all (otherwise `sort-external` would be captured by `renderSortBars`). Verify by reading the surrounding lines; if `else if (currentMode.includes('sort-')) renderSortBars();` appears earlier than your new line, move the `sort-external` branch above it.

- [ ] **Step 5: stubs**

Before `function renderSegmentTree()`, add:
```js
    function renderTreeObst() { const host = acquireDynamicVizHost(); host.textContent = 'tree-obst (pending)'; }
    function renderSortExternal() { const host = acquireDynamicVizHost(); host.textContent = 'sort-external (pending)'; }
```

- [ ] **Step 6: index.html — load modules**

After `<script src="expr_infix_postfix_viz.js"></script>`, add:
```html
    <script src="tree_obst_viz.js"></script>
    <script src="sort_external_viz.js"></script>
```

- [ ] **Step 7: Verify**
```bash
cd /Users/skhuang/course/dsvisual
node -c app.js && echo "app.js OK"
node -e "require('./tree_obst_viz.js'); require('./sort_external_viz.js'); console.log('modules load OK')"
grep -c "id: 'tree-obst'" app.js
grep -c "id: 'sort-external'" app.js
grep -c "function renderTreeObst" app.js
grep -c "function renderSortExternal" app.js
grep -c 'tree_obst_viz.js' index.html
grep -c 'sort_external_viz.js' index.html
# Confirm sort-external dispatch precedes the generic sort catch-all:
awk '/currentMode === .sort-external./{a=NR} /includes\(.sort-./{b=NR} END{ if(a&&b&&a<b) print "ORDER OK"; else print "ORDER CHECK: sort-external="a" generic="b }' app.js
```
Expected: `app.js OK`, `modules load OK`, six `1`s, and `ORDER OK`. If not `ORDER OK`, move the `sort-external` branch above the generic sort catch-all and re-check.

- [ ] **Step 8: Commit**
```bash
cd /Users/skhuang/course/dsvisual
git add app.js index.html
git commit -m "feat(viz): register tree-obst & sort-external; load modules"
```

---

## Task 5: `renderTreeObst()` + CSS

**Files:** Modify `app.js` (replace stub), `style.css`.

- [ ] **Step 1: Replace the `renderTreeObst` stub**

In `app.js`, replace the `renderTreeObst` stub line with:
```js
    let _obstState = null;
    function renderTreeObst() {
        const host = acquireDynamicVizHost();
        if (!_obstState) _obstState = { keys: [10, 20, 30, 40], freqs: [4, 2, 6, 3] };
        const st = _obstState;
        const langOf = (m) => (window.I18N && window.I18N.getCurrentLanguage() === 'zh') ? m.zh : m.en;
        const n = st.keys.length;
        const res = ObstViz.buildObstFrames(st.keys, st.freqs);
        const frames = res.frames;
        let idx = 0;

        host.innerHTML =
            '<div class="obst-controls">' +
              '<input type="text" class="obst-keys" value="' + st.keys.join(',') + '" placeholder="keys e.g. 10,20,30">' +
              '<input type="text" class="obst-freqs" value="' + st.freqs.join(',') + '" placeholder="freqs e.g. 4,2,6">' +
              '<button type="button" class="obst-apply">Apply</button>' +
            '</div>' +
            '<div class="obst-grid"></div>' +
            '<div class="obst-tree-stage"><svg class="obst-edges"></svg><div class="obst-nodes"></div></div>' +
            '<div class="obst-phase"></div>';

        function paint() {
            const fr = frames[idx];
            if (!host.querySelector('.obst-grid')) return;
            // DP triangular table
            let html = '<table class="obst-tbl"><tr><th>i\\j</th>';
            for (let j = 0; j < n; j++) html += '<th>' + st.keys[j] + '</th>';
            html += '</tr>';
            for (let i = 0; i < n; i++) {
                html += '<tr><th>' + st.keys[i] + '</th>';
                for (let j = 0; j < n; j++) {
                    if (j < i) { html += '<td class="obst-empty"></td>'; continue; }
                    const v = fr.cost[i + ',' + j];
                    const cur = (fr.phase === 'fill' && fr.i === i && fr.j === j) ? ' obst-cur' : '';
                    html += '<td class="obst-cell' + cur + '">' + (v != null ? v : '') + '</td>';
                }
                html += '</tr>';
            }
            html += '</table>';
            host.querySelector('.obst-grid').innerHTML = html;
            // reconstructed tree (only on the final 'tree' phase)
            const nodesEl = host.querySelector('.obst-nodes');
            const edgesEl = host.querySelector('.obst-edges');
            if (fr.phase === 'tree') {
                const meta = [];
                computeTreeLayout(res.tree, 200, 30, 90, meta);
                const byId = {}; meta.forEach((m) => { byId[m.id] = m; });
                edgesEl.innerHTML = '';
                (function walk(nd) { if (!nd) return; [nd.left, nd.right].forEach((c) => { if (!c) return; const a = byId[nd.id], b = byId[c.id]; edgesEl.innerHTML += '<line x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '" stroke="#94a3b8" stroke-width="2"/>'; walk(c); }); })(res.tree);
                nodesEl.innerHTML = '';
                meta.forEach((m) => { const d = document.createElement('div'); d.className = 'tree-node'; d.textContent = m.val; d.style.left = m.x + 'px'; d.style.top = m.y + 'px'; nodesEl.appendChild(d); });
            } else { nodesEl.innerHTML = ''; edgesEl.innerHTML = ''; }
            host.querySelector('.obst-phase').textContent = langOf(fr.msg);
        }
        function step() { if (idx < frames.length - 1) { idx++; paint(); return idx < frames.length - 1; } return false; }
        function reset() { idx = 0; paint(); }

        host.appendChild(buildStepControls(step, reset, 600));
        paint();
        host.querySelector('.obst-apply').onclick = () => {
            const ks = host.querySelector('.obst-keys').value.split(',').map((s) => parseInt(s.trim(), 10)).filter(Number.isFinite);
            const fs = host.querySelector('.obst-freqs').value.split(',').map((s) => parseInt(s.trim(), 10)).filter(Number.isFinite);
            if (ks.length && ks.length === fs.length) { ks.sort((a, b) => a - b); st.keys = ks; st.freqs = fs; renderTreeObst(); }
        };
    }
```

- [ ] **Step 2: Append CSS**

Append to `style.css`:
```css
.obst-controls { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }
.obst-tbl { border-collapse: collapse; margin: 6px 0; }
.obst-tbl th, .obst-tbl td { border: 1px solid #cbd5e1; padding: 4px 12px; text-align: center; min-width: 36px; }
.obst-tbl th { background: #eef2f7; }
.obst-empty { background: #f8fafc; }
.obst-cur { background: #fde68a; font-weight: 700; }
.obst-tree-stage { position: relative; height: 240px; overflow: hidden; }
.obst-tree-stage .obst-edges { position: absolute; inset: 0; width: 100%; height: 100%; }
.obst-tree-stage .obst-nodes { position: absolute; inset: 0; }
.obst-phase { margin-top: 6px; color: #1e40af; font-style: italic; }
```

- [ ] **Step 3: Verify**
```bash
cd /Users/skhuang/course/dsvisual
node -c app.js && echo "app.js OK"
grep -c "tree-obst (pending)" app.js
node --test tests/unit/tree_obst_viz.test.js 2>&1 | grep -E 'pass [0-9]|fail [0-9]'
```
Expected: `app.js OK`; stub count `0`; unit pass 4 / fail 0.

- [ ] **Step 4: Commit**
```bash
cd /Users/skhuang/course/dsvisual
git add app.js style.css
git commit -m "feat(viz): implement renderTreeObst (DP table + reconstructed tree) + styles"
```

---

## Task 6: `renderSortExternal()` + CSS

**Files:** Modify `app.js` (replace stub), `style.css`.

- [ ] **Step 1: Replace the `renderSortExternal` stub**

In `app.js`, replace the `renderSortExternal` stub line with:
```js
    let _extState = null;
    function renderSortExternal() {
        const host = acquireDynamicVizHost();
        if (!_extState) _extState = { data: [5, 3, 8, 1, 9, 2, 7, 4, 6, 0], M: 4 };
        const st = _extState;
        const langOf = (m) => (window.I18N && window.I18N.getCurrentLanguage() === 'zh') ? m.zh : m.en;
        const res = ExtSortViz.buildExternalSortFrames(st.data, st.M);
        const frames = res.frames;
        let idx = 0;

        host.innerHTML =
            '<div class="ext-controls">' +
              '<input type="text" class="ext-data" value="' + st.data.join(',') + '">' +
              '<label>M <input type="number" class="ext-m" min="1" max="20" value="' + st.M + '" style="width:54px"></label>' +
              '<button type="button" class="ext-apply">Apply</button>' +
            '</div>' +
            '<div class="ext-runs"></div>' +
            '<div class="ext-tree-stage"><div class="ext-tree-nodes"></div></div>' +
            '<div class="ext-out"><strong>Output:</strong> <span class="ext-out-cells"></span></div>' +
            '<div class="ext-phase"></div>';

        function cells(arr, cls) { return arr.map((v) => '<span class="ext-cell ' + (cls || '') + '">' + v + '</span>').join(''); }

        function paint() {
            const fr = frames[idx];
            if (!host.querySelector('.ext-runs')) return;
            // runs
            host.querySelector('.ext-runs').innerHTML = fr.runs.map((r, i) =>
                '<div class="ext-run"><span class="ext-run-label">run ' + (i + 1) + (i === fr.current ? ' ★' : '') + '</span> ' + cells(r) + '</div>').join('');
            // winner tree (heap-indexed array) drawn as a small complete tree
            const nodesEl = host.querySelector('.ext-tree-nodes');
            nodesEl.innerHTML = '';
            const tree = fr.tree || [];
            if (tree.length > 1) {
                const W = host.querySelector('.ext-tree-stage').clientWidth || 700;
                for (let i = 1; i < tree.length; i++) {
                    if (!tree[i]) continue;
                    const level = Math.floor(Math.log2(i));
                    const posInLevel = i - Math.pow(2, level);
                    const count = Math.pow(2, level);
                    const x = (posInLevel + 0.5) / count * W;
                    const y = level * 52 + 20;
                    const d = document.createElement('div');
                    const isWinner = (i === 1 && fr.winnerRun >= 0);
                    d.className = 'ext-tnode' + (isWinner ? ' winner' : '') + (tree[i].run < 0 ? ' pad' : '');
                    d.textContent = tree[i].val == null ? '∞' : tree[i].val;
                    d.style.left = x + 'px'; d.style.top = y + 'px';
                    nodesEl.appendChild(d);
                }
            }
            host.querySelector('.ext-out-cells').innerHTML = cells(fr.output, 'out');
            host.querySelector('.ext-phase').textContent = langOf(fr.msg);
        }
        function step() { if (idx < frames.length - 1) { idx++; paint(); return idx < frames.length - 1; } return false; }
        function reset() { idx = 0; paint(); }

        host.appendChild(buildStepControls(step, reset, 600));
        paint();
        host.querySelector('.ext-apply').onclick = () => {
            const d = host.querySelector('.ext-data').value.split(',').map((s) => parseInt(s.trim(), 10)).filter(Number.isFinite);
            const m = parseInt(host.querySelector('.ext-m').value, 10);
            if (d.length && m >= 1) { st.data = d; st.M = m; renderSortExternal(); }
        };
    }
```

- [ ] **Step 2: Append CSS**

Append to `style.css`:
```css
.ext-controls { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-bottom: 10px; }
.ext-controls .ext-data { flex: 1; min-width: 180px; }
.ext-run { margin: 3px 0; }
.ext-run-label { display: inline-block; min-width: 64px; font-weight: 600; color: #2c5282; }
.ext-cell { display: inline-block; min-width: 24px; padding: 2px 6px; margin: 1px; background: #e2e8f0; border: 1px solid #cbd5e1; border-radius: 4px; text-align: center; }
.ext-cell.out { background: #dcfce7; border-color: #86efac; }
.ext-tree-stage { position: relative; height: 180px; overflow: hidden; margin: 8px 0; }
.ext-tree-nodes { position: absolute; inset: 0; }
.ext-tnode { position: absolute; transform: translate(-50%, -50%); min-width: 30px; height: 26px; line-height: 22px; padding: 0 4px; background: #fff; border: 2px solid #1e40af; border-radius: 6px; text-align: center; font-weight: 700; font-size: 13px; }
.ext-tnode.winner { background: #f59e0b; border-color: #b45309; }
.ext-tnode.pad { color: #94a3b8; border-color: #cbd5e1; }
.ext-phase { margin-top: 6px; color: #1e40af; font-style: italic; }
```

- [ ] **Step 3: Verify**
```bash
cd /Users/skhuang/course/dsvisual
node -c app.js && echo "app.js OK"
grep -c "sort-external (pending)" app.js
node --test tests/unit/sort_external_viz.test.js 2>&1 | grep -E 'pass [0-9]|fail [0-9]'
```
Expected: `app.js OK`; stub count `0`; unit pass 4 / fail 0.

- [ ] **Step 4: Commit**
```bash
cd /Users/skhuang/course/dsvisual
git add app.js style.css
git commit -m "feat(viz): implement renderSortExternal (runs + winner-tree merge) + styles"
```

---

## Task 7: i18n + desc_db

**Files:** Modify `i18n.js`, `desc_db.js`.

- [ ] **Step 1: i18n method names (both locales)**

In `i18n.js` `en` block:
```js
        'method.tree-obst': 'Optimal BST',
        'method.sort-external': 'External Merge Sort',
```
In the `zh` block:
```js
        'method.tree-obst': '最佳二元搜尋樹',
        'method.sort-external': '外部合併排序',
```

- [ ] **Step 2: desc_db entries**

In `desc_db.js`, before the closing `};` add:
```js
    'tree-obst': `
        <h3>Optimal Binary Search Tree</h3>
        <p>Given keys with access frequencies, build the BST with minimum weighted path length.</p>
        <hr>
        <ul>
            <li><strong>DP:</strong> cost[i][j] = min over root r of cost[i][r-1]+cost[r+1][j] + W(i,j)</li>
            <li><strong>Fill order:</strong> by increasing subrange length</li>
        </ul>
        <div class="complexities">
            <span class="badge time">Time: O(N³) (O(N²) with Knuth)</span>
            <span class="badge space">Space: O(N²)</span>
        </div>
    `,
    'sort-external': `
        <h3>External Merge Sort</h3>
        <p>Sort data too large for memory: make sorted runs, then k-way merge.</p>
        <hr>
        <ul>
            <li><strong>Phase 1:</strong> read M records, sort in memory, write a run</li>
            <li><strong>Phase 2:</strong> k-way merge runs using a selection/winner tree</li>
        </ul>
        <div class="complexities">
            <span class="badge time">Passes: 1 + ⌈log_k(runs)⌉</span>
            <span class="badge space">Memory: O(M)</span>
        </div>
    `,
```

- [ ] **Step 3: Verify**
```bash
cd /Users/skhuang/course/dsvisual
node -c i18n.js && echo "i18n OK"
node -c desc_db.js && echo "desc OK"
grep -c 'method.tree-obst' i18n.js
grep -c 'method.sort-external' i18n.js
```
Expected: both OK; both counts `2`.

- [ ] **Step 4: Commit**
```bash
cd /Users/skhuang/course/dsvisual
git add i18n.js desc_db.js
git commit -m "feat(viz): i18n names + desc_db for tree-obst & sort-external"
```

---

## Task 8: slides decks + build

**Files:** Modify `slides_db.js`; regenerate.

- [ ] **Step 1: Append two decks**

In `slides_db.js`, before `module.exports = SLIDES_DB;`, add:
```js
SLIDES_DB["tree-obst"] = {
  "category": "Trees",
  "title": { "zh": "最佳二元搜尋樹", "en": "Optimal Binary Search Tree" },
  "slides": [
    { "heading": { "zh": "問題", "en": "The Problem" },
      "blocks": [
        { "type": "paragraph", "text": { "zh": "已知各 key 的存取頻率,求加權路徑長最小的 BST。", "en": "Given each key's access frequency, find the BST with minimum weighted path length." } },
        { "type": "note", "text": { "zh": "常存取的 key 應靠近根,以降低平均比較次數。", "en": "Frequently accessed keys should sit near the root to reduce average comparisons." } }
      ] },
    { "heading": { "zh": "動態規劃", "en": "Dynamic Programming" },
      "blocks": [
        { "type": "math", "tex": "cost[i][j] = \\min_{i\\le r\\le j}\\big(cost[i][r-1]+cost[r+1][j]\\big) + W(i,j)", "caption": { "zh": "對每個子區間試所有可能的根 r", "en": "Try every possible root r for each subrange" } },
        { "type": "bullets", "items": [
          { "zh": "依子區間長度由小到大填表", "en": "Fill the table by increasing subrange length" },
          { "zh": "W(i,j) = 區間頻率總和", "en": "W(i,j) = sum of frequencies in the range" },
          { "zh": "記錄最佳根以便重建樹", "en": "Record the best root to reconstruct the tree" }
        ] }
      ] },
    { "heading": { "zh": "複雜度", "en": "Complexity" },
      "blocks": [
        { "type": "bullets", "items": [
          { "zh": "時間 O(N³);Knuth 優化可達 O(N²)", "en": "Time O(N³); O(N²) with Knuth's optimization" },
          { "zh": "空間 O(N²)", "en": "Space O(N²)" }
        ] }
      ] }
  ]
};
SLIDES_DB["sort-external"] = {
  "category": "Sorting",
  "title": { "zh": "外部合併排序", "en": "External Merge Sort" },
  "slides": [
    { "heading": { "zh": "為何需要外部排序", "en": "Why External Sorting" },
      "blocks": [
        { "type": "paragraph", "text": { "zh": "資料量大於記憶體時,無法一次內排序,需分段處理並控制 I/O。", "en": "When data exceeds memory, we cannot sort it all at once — we process it in pieces and manage I/O." } }
      ] },
    { "heading": { "zh": "兩階段", "en": "Two Phases" },
      "blocks": [
        { "type": "steps", "items": [
          { "zh": "Run generation:讀入 M 筆、內排序、寫出一個 run。", "en": "Run generation: read M records, sort in memory, write a run." },
          { "zh": "k-way merge:用選擇樹(winner tree)每步取 k 個 run head 的最小值。", "en": "k-way merge: a selection (winner) tree picks the minimum of the k run heads each step." }
        ] },
        { "type": "code", "lang": "cpp", "file": "sort_external.cpp", "code": "while (!pq.empty()) {\n    auto [val, r, pos] = pq.top(); pq.pop();\n    out.push_back(val);\n    if (pos + 1 < (int)runs[r].size())\n        pq.push({runs[r][pos + 1], r, pos + 1});\n}" }
      ] },
    { "heading": { "zh": "成本", "en": "Cost" },
      "blocks": [
        { "type": "bullets", "items": [
          { "zh": "Pass 數 = 1 + ⌈log_k(run 數)⌉", "en": "Number of passes = 1 + ⌈log_k(#runs)⌉" },
          { "zh": "選擇樹讓每次取最小僅需 O(log k)", "en": "The selection tree makes each minimum extraction O(log k)" }
        ] }
      ] }
  ]
};
```

- [ ] **Step 2: Build + verify**
```bash
cd /Users/skhuang/course/dsvisual
node -c slides_db.js && echo "slides_db OK"
npm run build:slides
ls slides/zh/tree-obst.md slides/en/tree-obst.md slides/zh/sort-external.md slides/en/sort-external.md
```
Expected: `slides_db OK`; build prints `Generated N decks` (+2); all four md exist.

- [ ] **Step 3: Commit**
```bash
cd /Users/skhuang/course/dsvisual
git add slides_db.js slides_rendered.js slides/zh/tree-obst.md slides/en/tree-obst.md slides/zh/sort-external.md slides/en/sort-external.md
git commit -m "feat(viz): bilingual slides decks for tree-obst & sort-external"
```

---

## Task 9: Playwright E2E

**Files:** Create `tests/tree_obst.spec.js`, `tests/sort_external.spec.js`.

- [ ] **Step 1: Create `tests/tree_obst.spec.js`**
```js
const { test, expect } = require('@playwright/test');
const path = require('path');

async function loadMethod(page, methodId) {
    const navItem = page.locator(`.category-nav-item:has(.category-nav-method[data-method-id="${methodId}"])`);
    await navItem.locator('.category-nav-btn').click();
    await navItem.locator(`.category-nav-method[data-method-id="${methodId}"]`).click();
    await expect(page.locator(`[data-method-section="${methodId}"]`)).toHaveAttribute('data-runtime-state', 'active');
}

test.describe('Optimal BST', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
        await page.goto('file://' + path.resolve(__dirname, '../index.html'));
        await loadMethod(page, 'tree-obst');
    });

    test('fills DP table then shows reconstructed tree; code filename', async ({ page }) => {
        const sec = page.locator('[data-method-section="tree-obst"]');
        await expect(sec.locator('.code-panel-filename')).toContainText('tree_obst.cpp');
        await expect(sec.locator('.obst-tbl')).toBeVisible();
        const step = sec.locator('.stepctl [data-action="step"]');
        for (let i = 0; i < 15; i++) await step.click();
        // After all steps the reconstructed tree shows the optimal root key 30.
        await expect(sec.locator('.obst-nodes')).toContainText('30');
    });
});
```

- [ ] **Step 2: Create `tests/sort_external.spec.js`**
```js
const { test, expect } = require('@playwright/test');
const path = require('path');

async function loadMethod(page, methodId) {
    const navItem = page.locator(`.category-nav-item:has(.category-nav-method[data-method-id="${methodId}"])`);
    await navItem.locator('.category-nav-btn').click();
    await navItem.locator(`.category-nav-method[data-method-id="${methodId}"]`).click();
    await expect(page.locator(`[data-method-section="${methodId}"]`)).toHaveAttribute('data-runtime-state', 'active');
}

test.describe('External Merge Sort', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
        await page.goto('file://' + path.resolve(__dirname, '../index.html'));
        await loadMethod(page, 'sort-external');
    });

    test('generates runs, merges, output sorted; code filename', async ({ page }) => {
        const sec = page.locator('[data-method-section="sort-external"]');
        await expect(sec.locator('.code-panel-filename')).toContainText('sort_external.cpp');
        await expect(sec.locator('.ext-runs')).toBeVisible();
        const step = sec.locator('.stepctl [data-action="step"]');
        for (let i = 0; i < 30; i++) await step.click();
        // After all steps the output buffer is fully sorted: starts with 0 1 2 ...
        const out = await sec.locator('.ext-out-cells').innerText();
        const nums = out.split(/\s+/).filter((s) => s.length).map(Number);
        const sorted = [...nums].sort((a, b) => a - b);
        expect(nums).toEqual(sorted);
        expect(nums.length).toBe(10);
    });
});
```

- [ ] **Step 3: Run**
```bash
cd /Users/skhuang/course/dsvisual
npx playwright test tests/tree_obst.spec.js tests/sort_external.spec.js --reporter=line
```
Expected: both PASS. If a step count is off (the assertion lands before completion), increase the click loop count so the final frame is reached, and re-run. Do NOT commit failing tests; if stuck, report BLOCKED with details.

- [ ] **Step 4: Commit**
```bash
cd /Users/skhuang/course/dsvisual
git add tests/tree_obst.spec.js tests/sort_external.spec.js
git commit -m "test(viz): E2E for tree-obst & sort-external"
```

---

## Task 10: Full suite + README + finish

**Files:** Modify `README.md`.

- [ ] **Step 1: README rows**

In `README.md`, add to the relevant Supported Algorithms tables:
```
| Optimal BST | DP table → reconstructed minimum-cost tree |
| External Merge Sort | Run generation + winner-tree k-way merge |
```

- [ ] **Step 2: Full suite**

Run: `cd /Users/skhuang/course/dsvisual && npm run test:all`
Expected: unit (incl. 2 new files) + Playwright all PASS. If a hardcoded method/tile COUNT test fails (e.g. tests/i18n.spec.js), update it to the new count (+2) and include it in the Step 4 commit; report old→new. If anything else FAILS, STOP and report BLOCKED.

- [ ] **Step 3: Clean-build check**
```bash
cd /Users/skhuang/course/dsvisual
node build_db.js && npm run build:slides
git status --porcelain
```
Expected: no diffs to `code_db.js` / `slides_rendered.js` / `slides/`.

- [ ] **Step 4: Commit and finish**
```bash
cd /Users/skhuang/course/dsvisual
git add README.md
git commit -m "docs(viz): list tree-obst & sort-external in README"
```
Then use **superpowers:finishing-a-development-branch** for `feat/tier1-batch-b`.

---

## Self-Review notes

- **Spec coverage (Batch B):** tree-obst (Tasks 1,5,8) per spec §3.3; sort-external (Tasks 2,6,8) per spec §3.4 — resolved to winner/selection tree, single merge pass (documented in header). Shared pattern §2 (Tasks 3,4,7,9); acceptance §5 (Task 10).
- **Resolved spec decision:** sort-external uses a winner (tournament/selection) tree merging all runs in one pass — simpler and clearer than a loser tree, same teaching point (pick the min of k run heads each step). The `k` parameter from the spec is effectively the number of runs (single pass); only `M` is exposed as input.
- **Known verify-at-implementation points (explicit, not placeholders):** Task 4 Step 4/7 — the `sort-external` dispatch MUST precede the generic `includes('sort-')` catch-all (guarded by the ORDER OK check). Task 10 Step 2 — anticipated hardcoded count test (+2).
- **Node-drawing rules honored:** tree-obst reconstructed tree uses `.tree-node` (translate-centered) with edges drawn at `(x,y)` (no +offset) and `overflow:hidden` stage; sort-external's `.ext-tnode` also uses `transform: translate(-50%,-50%)` and is positioned by center, with no separate edge lines (winner tree shown as positioned nodes only).
- **Type/name consistency:** module APIs (`buildObstFrames`; `buildWinnerTree`, `buildExternalSortFrames`) match across modules, tests, renderers. Globals `window.ObstViz` / `window.ExtSortViz` match index.html load + renderer usage. Method ids consistent across all integration points.
- **OBST fixture verified by hand:** keys [10,20,30,40] freq [4,2,6,3] → cost[0,3]=26, root[0,3]=2 (key 30), inorder 10,20,30,40.
```
