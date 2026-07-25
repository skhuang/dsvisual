# graph-matrix (Adjacency Matrix viz) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `graph-matrix` — a user-editable graph ↔ n×n adjacency-matrix viz in the `graphs` category, with a stepped build (cell↔edge), directed/undirected + weighted toggles, degree readouts, a hidden code drawer, saveable examples, and a scrollable panel.

**Architecture:** Pure logic `js/graph_matrix_viz.js` (parse + frames) → renderer `js/viz/viz_graph_matrix.js` (node-link SVG + `floyd-grid`-style matrix + controls) registered via `VizRegistry`; one `graphs` METHOD_GROUPS row (`codeDrawer:true`).

**Tech Stack:** Vanilla JS dual-export IIFE; `VizRegistry`/`VizKit` (`buildStepControls`, `langOf`, `acquireDynamicVizHost`); `ExamplesStore`; `node --test`; Playwright.

## Global Constraints

- Concurrent refactor session — `git add` only each task's files by path; never `-A`/`.`/`-u`; `git status` first.
- Bilingual `zh` = **Traditional (zh-Hant)**, never Simplified. Run FULL Playwright before merge.
- No new category (`graphs` exists) ⇒ `.overview-category` count unchanged; overview-tile count self-updating (PR #142).
- Reuse the existing `floyd-grid`/`floyd-cell`/`floyd-hcell` matrix CSS. The examples helper trio (`loadExamples`/`saveExample`/`buildExamplesSelect`) is duplicated in `viz_list_equivalence.js`/`viz_matrix_sparse_list.js` — carry a matching 4th copy; do NOT refactor.

---

### Task 1: Pure logic — parse + matrix frames

**Files:** Create `js/graph_matrix_viz.js`; Test `tests/unit/graph_matrix_viz.test.js`.

**Interfaces:** Produces `GraphMatrixViz = { SAMPLE, parseInput(nStr, edgesStr), matrixFrames({n,edges,directed,weighted}) }`. Frame = `{matrix:number[][], added:[{i,j}], edge:{u,v,w}|null, done:bool, msg:{zh,en}, degree?}`.

- [ ] **Step 1: Failing unit test** — `tests/unit/graph_matrix_viz.test.js`:
```js
const test = require('node:test'); const assert = require('node:assert');
const G = require('../../js/graph_matrix_viz.js');
test('undirected fills symmetric cells; degree = neighbor count', () => {
  const { frames } = G.matrixFrames({ n: 3, edges: [{u:0,v:1,w:5}], directed:false, weighted:false });
  const last = frames[frames.length - 1];
  assert.strictEqual(last.matrix[0][1], 1); assert.strictEqual(last.matrix[1][0], 1); // symmetric, unweighted
  assert.strictEqual(last.done, true);
  assert.deepStrictEqual(last.degree.out, [1,1,0]);
});
test('directed is asymmetric; weighted stores weights', () => {
  const { frames } = G.matrixFrames({ n: 3, edges: [{u:0,v:1,w:5}], directed:true, weighted:true });
  const last = frames[frames.length - 1];
  assert.strictEqual(last.matrix[0][1], 5); assert.strictEqual(last.matrix[1][0], 0);
  assert.deepStrictEqual(last.degree.out, [1,0,0]); assert.deepStrictEqual(last.degree.in, [0,1,0]);
});
test('one frame per edge + start + done; each edge frame highlights cells', () => {
  const { frames } = G.matrixFrames({ n: 2, edges: [{u:0,v:1,w:1}], directed:false, weighted:false });
  assert.strictEqual(frames.length, 3); // start, edge, done
  assert.ok(frames[1].added.length === 2 && frames[1].edge);
  frames.forEach(f => { assert.ok(f.msg.zh && f.msg.en); });
});
test('parseInput handles u-v, u-v:w, whitespace, drops malformed/out-of-range', () => {
  const r = G.parseInput('3', ' 0-1 , 1-2:4 , 9-9 , junk , 2-0 ');
  assert.strictEqual(r.n, 3);
  assert.deepStrictEqual(r.edges, [{u:0,v:1,w:1},{u:1,v:2,w:4},{u:2,v:0,w:1}]); // 9-9 out of range, junk dropped
});
```

- [ ] **Step 2: Run → fails** (`node --test tests/unit/graph_matrix_viz.test.js` — module missing).

- [ ] **Step 3: Implement `js/graph_matrix_viz.js`:**
```js
(function (global) {
  'use strict';
  const SAMPLE = { n: 5, directed: false, weighted: false, edges: [
    {u:0,v:1,w:4},{u:0,v:4,w:1},{u:1,v:2,w:3},{u:1,v:3,w:2},{u:1,v:4,w:5},{u:2,v:3,w:6},{u:3,v:4,w:7}
  ] };
  function parseInput(nStr, edgesStr) {
    let n = parseInt(nStr, 10); if (!Number.isFinite(n) || n < 1) n = 1; if (n > 10) n = 10;
    const edges = [];
    String(edgesStr || '').split(',').forEach((tok) => {
      const m = /^\s*(\d+)\s*-\s*(\d+)\s*(?::\s*(\d+))?\s*$/.exec(tok);
      if (!m) return;
      const u = +m[1], v = +m[2], w = m[3] != null ? +m[3] : 1;
      if (u < 0 || v < 0 || u >= n || v >= n) return;
      edges.push({ u, v, w });
    });
    return { n, edges };
  }
  function matrixFrames(cfg) {
    const n = cfg.n, directed = !!cfg.directed, weighted = !!cfg.weighted, edges = cfg.edges || [];
    const M = Array.from({ length: n }, () => Array(n).fill(0));
    const frames = [];
    function msgFor(edge, added, done) {
      if (done) return { zh: '矩陣建立完成；每列之和為出分支度、每行之和為入分支度。', en: 'Matrix complete; row sums = out-degree, column sums = in-degree.' };
      if (!edge) return { zh: '從空的相鄰矩陣開始（全部為 0）。', en: 'Start from an empty adjacency matrix (all zeros).' };
      const val = weighted ? edge.w : 1;
      const cells = added.map((c) => '[' + c.i + '][' + c.j + ']=' + val).join('、');
      return { zh: '加入邊 ' + edge.u + (directed ? '→' : '—') + edge.v + '，填入 ' + cells + (directed ? '' : '（對稱）') + '。',
               en: 'Add edge ' + edge.u + (directed ? '→' : '—') + edge.v + ' → set ' + cells + (directed ? '' : ' (symmetric)') + '.' };
    }
    function snap(added, edge, done) { return { matrix: M.map((r) => r.slice()), added: added, edge: edge, done: !!done, msg: msgFor(edge, added, done) }; }
    frames.push(snap([], null, false));
    edges.forEach((e) => {
      const val = weighted ? e.w : 1, added = [{ i: e.u, j: e.v }];
      M[e.u][e.v] = val;
      if (!directed && e.u !== e.v) { M[e.v][e.u] = val; added.push({ i: e.v, j: e.u }); }
      frames.push(snap(added, e, false));
    });
    const out = M.map((r) => r.reduce((s, x) => s + (x ? 1 : 0), 0));
    const inn = Array.from({ length: n }, (_, j) => M.reduce((s, r) => s + (r[j] ? 1 : 0), 0));
    const last = snap([], null, true); last.degree = { out: out, in: inn, undirected: !directed };
    frames.push(last);
    return { frames: frames };
  }
  const api = { SAMPLE, parseInput, matrixFrames };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.GraphMatrixViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 4: Run → pass.** **Step 5: Commit** (`git add js/graph_matrix_viz.js tests/unit/graph_matrix_viz.test.js`; `feat(dsvisual): graph-matrix pure logic (parse + adjacency-matrix frames)`).

---

### Task 2: Renderer core + wiring + stepped build + toggles + degree

**Files:** Create `js/viz/viz_graph_matrix.js`; Modify `js/app.js` (METHOD_GROUPS row), `index.html` (2 script tags + scroll), `style.css` (scroll wrapper + cell/edge highlight); Test `tests/graph_matrix.spec.js`.

**Interfaces:** Consumes `GraphMatrixViz`. Registers `VizRegistry.attach('graph-matrix', { render, code:()=>codeGraphMatrix, layout:{host:'dynamic'} })`.

- [ ] **Step 1: METHOD_GROUPS row** — add to the `graphs` group in `js/app.js`:
`{ id: 'graph-matrix', title: 'Adjacency Matrix', file: 'graph_matrix.cpp', visualizer: 'graph-matrix', controls: 'graph-matrix', codeDrawer: true },`

- [ ] **Step 2: index.html** — add `<script defer src="js/graph_matrix_viz.js"></script>` then `<script defer src="js/viz/viz_graph_matrix.js"></script>` after `js/code_db.js`, before `js/app.js`.

- [ ] **Step 3: Failing e2e** — `tests/graph_matrix.spec.js`:
```js
const { test, expect } = require('@playwright/test'); const path = require('path');
const FILE_URI = 'file://' + path.resolve(__dirname, '../index.html');
test.describe('graph-matrix', () => {
  test('stepped build fills matrix + highlights edge; toggles + degree', async ({ page }) => {
    await page.goto(FILE_URI + '#m=graph-matrix');
    const host = page.locator('.gm-wrap');
    await expect(host).toBeVisible();
    await expect(page.locator('.gm-matrix .gm-cell').first()).toBeVisible();
    // step advances and lights a cell
    await page.locator('.stepctl [data-action="step"]').click();
    await expect(page.locator('.gm-matrix .gm-cell.gm-added').first()).toBeVisible();
    // directed toggle → asymmetry class/marker present; degree row visible
    await page.locator('.gm-directed').check();
    await expect(page.locator('.gm-degree').first()).toBeVisible();
    // code hidden until drawer toggled
    await expect(page.locator('[data-method-section="graph-matrix"] .code-drawer-toggle')).toBeVisible();
  });
});
```

- [ ] **Step 4: Run → fails** (`npx playwright test tests/graph_matrix.spec.js`).

- [ ] **Step 5: Implement `js/viz/viz_graph_matrix.js`.** Structure (`K = () => global.VizKit`):
  - Module state `_st = { n, edges, directed, weighted, idx }` seeded from `GraphMatrixViz.SAMPLE`.
  - `render()`: `const host = K().acquireDynamicVizHost();` build `host.innerHTML` = a `.gm-wrap` containing: a controls bar (`n` `<input class="gm-n">`, edge `<input class="gm-edges">`, `<input type="checkbox" class="gm-directed">`/`gm-weighted` labels, `.ex-select`, an Apply button), a `.gm-scroll` (overflow:auto) wrapping `.gm-graph` (node-link SVG) + `.gm-matrix` (grid), and a `.gm-msg`. Compute `frames = GraphMatrixViz.matrixFrames(_st)`; `paint(idx)` renders the matrix grid + node-link at that frame.
  - **Matrix grid** (`paint`): mirror `floyd-grid` — a header row (col indices) + `n` rows each with a header cell (row index) + `n` `.gm-cell`s showing the value (0 shown faint); the current frame's `added` cells get `.gm-added`; on the `done` frame append a degree row/col (`.gm-degree`) from `frame.degree`.
  - **Node-link** (`gmGraphSvg(n, edges, directed, activeEdge)`): a compact self-contained SVG — place `n` nodes on a circle, draw each edge (`<line>` + optional weight label + arrowhead marker if directed); the current frame's `edge` gets a highlight class `.gm-edge-active`.
  - **Step controls**: append `K().buildStepControls(stepFn, resetFn, 800)` where `stepFn` advances `_st.idx` and `paint`s + `showStatus(langOf(frame.msg))`, returns has-more; `resetFn` → idx 0.
  - **Toggles**: `.gm-directed`/`.gm-weighted` `change` → update `_st`, recompute frames, `render()` (or re-paint from idx 0).
  - `global.VizRegistry.attach('graph-matrix', { render, code: () => codeGraphMatrix, layout: { host: 'dynamic' } });`

- [ ] **Step 6: CSS** — append to `style.css`: `.gm-scroll{overflow:auto;max-height:420px;}` `.gm-wrap{...}` `.gm-cell.gm-added{background:#dcfce7;border-color:#4ade80;}` `.gm-edge-active{stroke:#f59e0b;stroke-width:3;}` `.gm-degree{color:#2563eb;font-weight:600;}` (+ reuse floyd cell sizing).

- [ ] **Step 7: Run e2e → pass.** **Step 8: Commit** (`git add js/viz/viz_graph_matrix.js js/app.js index.html style.css tests/graph_matrix.spec.js`; `feat(dsvisual): graph-matrix renderer — stepped matrix↔graph, toggles, degree`).

---

### Task 3: Editable input + saveable examples + hover correspondence

**Files:** Modify `js/viz/viz_graph_matrix.js`; Test `tests/graph_matrix.spec.js`.

- [ ] **Step 1: Extend e2e** — add: enter `0-1,1-2` in `.gm-edges`, set `.gm-n` = 3, click Apply → the matrix reflects it and an option appears in `.ex-select`; selecting an `.ex-select` option re-applies; hovering `.gm-cell.gm-added` (after full Run) adds `.gm-edge-hover` to an edge (and vice versa).

- [ ] **Step 2: Implement.** Add the examples helper trio (copy from `viz_list_equivalence.js`: `loadExamples`/`saveExample`/`buildExamplesSelect` over `ExamplesStore` + `localStorage`, keyed `'graph-matrix'`). Apply button: `GraphMatrixViz.parseInput(nVal, edgesVal)` → `_st.edges/n`, recompute frames, `render()`, and `saveExample('graph-matrix', serialize(_st), serialize(SAMPLE))`. Populate `.ex-select` from `loadExamples`; on change, deserialize + apply. Serialize `_st` as `n|directed|weighted|u-v:w,u-v:w`. After the build completes (idx at last frame), wire hover: `.gm-cell` mouseenter → find the matching edge, add `.gm-edge-hover`; edge mouseenter → add `.gm-cell-hover` to `[i][j]` (and `[j][i]` if undirected); mouseleave clears.

- [ ] **Step 3: Run e2e → pass.** **Step 4: Commit** (`git add js/viz/viz_graph_matrix.js tests/graph_matrix.spec.js`; `feat(dsvisual): graph-matrix editable input, examples store, hover correspondence`).

---

### Task 4: Code drawer content + description + full verification

**Files:** Create `cpp/graph_matrix.cpp`; Modify `build_db.js` (mapping) → regen `js/code_db.js`; Modify `js/desc_db.js`, `tests/smoke_modes.spec.js`.

- [ ] **Step 1: `cpp/graph_matrix.cpp`** — adjacency-matrix rep: `int adj[N][N]`, `addEdge(u,v,w,directed)` (`adj[u][v]=w; if(!directed) adj[v][u]=w;`), out/in-degree from row/col sums, a small `main` demo. Match existing `cpp/graph_*.cpp` style.
- [ ] **Step 2: build_db.js** — add `'graph_matrix.cpp': 'codeGraphMatrix'` mapping; `node build_db.js`; confirm `git diff --stat js/code_db.js` shows only the added var (+ `CODE_DB` entry).
- [ ] **Step 3: `js/desc_db.js`** — English `graph-matrix` entry (representation; symmetry for undirected; weighted values; degree = row/col sums; space `O(n²)` vs adjacency list's `O(n+e)`; styled `class="complexities"`).
- [ ] **Step 4: smoke_modes** — add `'graph-matrix'` to the `MODES` array in `tests/smoke_modes.spec.js`.
- [ ] **Step 5: Full verification.** `npm run test:unit` → green. `node build_db.js` clean. `npm test` (FULL Playwright) → green incl. `graph_matrix.spec.js` + smoke_modes graph-matrix (no console errors) + no regression. Browser spot-check (note in report): step build, directed/weighted toggles, degree, custom input + example save, hover correspondence, code-drawer hidden-until-clicked, scroll — in zh + en.
- [ ] **Step 6: Commit** (`git add cpp/graph_matrix.cpp build_db.js js/code_db.js js/desc_db.js tests/smoke_modes.spec.js`; `feat(dsvisual): graph-matrix code drawer, description; verify`).

---

## Self-Review

- **Spec coverage:** logic (T1); renderer core + wiring + stepped + toggles + degree + codeDrawer + scroll (T2); editable input + examples + hover (T3); cpp/desc + smoke + full verify (T4). All spec sections mapped.
- **Placeholder scan:** T1 is complete code; T2/T3 give the renderer structure + key rendering/wiring snippets + exact e2e (DOM boilerplate completed at implementation, reviewers verify); T4 is content + exact commands.
- **Type consistency:** renderer reads `frame.matrix/added/edge/done/degree/msg` exactly as T1 emits; `parseInput`/`matrixFrames` signatures match; `codeGraphMatrix` produced in T4 consumed by the T2 `code:()=>codeGraphMatrix`; e2e selectors (`.gm-wrap/.gm-cell/.gm-added/.gm-degree/.gm-directed/.ex-select/.stepctl [data-action="step"]/.code-drawer-toggle`) match what T2/T3 emit.
