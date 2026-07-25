# graph-components (Connected Components) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a `graph-components` viz in the `graphs` category: an undirected graph on which a stepped BFS flood-fill labels and colors each connected component, with a live component count, an editable graph + saveable examples, a hidden code drawer, and a scrollable panel.

**Architecture:** Pure logic module `js/graph_components_viz.js` emits bilingual frames (no DOM); renderer `js/viz/viz_graph_components.js` draws a self-contained node-link SVG (circle layout, per-component fill, current-vertex + frontier rings) and a count readout, wired via `VizRegistry.attach`. One `METHOD_GROUPS` row, two `index.html` script tags, a `cpp/` + `desc_db` + `i18n` triple, and Playwright specs. Closely mirrors viz #1 `graph-matrix` (PR #151).

**Tech Stack:** Vanilla JS (IIFE dual-export), inline SVG, `VizKit`/`VizRegistry` seam, `ExamplesStore` (localStorage), Playwright + `node:test`.

## Global Constraints

- Viz #2 of the chap06 graph-viz program (`docs/superpowers/specs/2026-07-25-chap06-graph-viz-gaps-roadmap.md`); spec `docs/superpowers/specs/2026-07-25-graph-components-design.md`.
- Bilingual `msg`/labels; `zh` MUST be **Traditional (zh-Hant)** — never Simplified.
- Honest stepping: never distort data/geometry to satisfy a test — fix the test/geometry instead.
- Program-wide UI conventions: `codeDrawer: true`; `ExamplesStore` saveable examples; `overflow:auto` scroll wrapper.
- Add the `method.graph-components` i18n key (both langs) UP FRONT (viz #1 shipped a raw-key nav gap without it).
- **Concurrent refactor session:** stage with targeted `git add <path>` only — NEVER `-A`, `.`, or `-u`. Verify `git status` before each commit.
- Never hand-edit generated files: `js/code_db.js` is produced by `node build_db.js`.
- `graphs` category already exists ⇒ `.overview-category` count unchanged; the overview-tile count assertion is self-updating (PR #142) — confirm via the FULL Playwright suite before merge.
- Branch: `feat/graph-components` (already created). One PR.

---

### Task 1: Pure logic module + unit tests

**Files:**
- Create: `js/graph_components_viz.js`
- Test: `tests/unit/graph_components_viz.test.js`

**Interfaces:**
- Produces:
  - `GraphComponentsViz.SAMPLE = { n: 5, edges: [{u:0,v:1},{u:2,v:3}] }`
  - `GraphComponentsViz.parseInput(nStr, edgesStr) → { n:number, edges:[{u,v}] }` (undirected; drops malformed/out-of-range; clamps n≤10; ignores any `:w` suffix)
  - `GraphComponentsViz.componentsFrames({n, edges}) → { frames:[Frame] }` where
    `Frame = { comp:number[] (-1=unvisited), current:number|null, frontier:number[], newly:number[], k:number, seed:boolean, done:boolean, msg:{zh,en} }`.
    `k` = number of components discovered so far (0 in the initial frame; total in the done frame).
- Consumes: nothing (dual-export IIFE; `module.exports` for node:test).

- [ ] **Step 1: Write the failing unit tests**

Create `tests/unit/graph_components_viz.test.js`:

```javascript
const test = require('node:test'); const assert = require('node:assert');
const G = require('../../js/graph_components_viz.js');

test('SAMPLE (G3): 3 components partitioning {0,1},{2,3},{4}', () => {
  const { frames } = G.componentsFrames(G.SAMPLE);
  const last = frames[frames.length - 1];
  assert.strictEqual(last.done, true);
  assert.strictEqual(last.k, 3);
  const c = last.comp;
  assert.strictEqual(c[0], c[1]);              // 0,1 same component
  assert.strictEqual(c[2], c[3]);              // 2,3 same component
  assert.notStrictEqual(c[0], c[2]);           // different components
  assert.notStrictEqual(c[4], c[0]);           // isolated vertex is its own
  assert.notStrictEqual(c[4], c[2]);
  assert.strictEqual(new Set(c).size, 3);      // exactly 3 distinct labels
});

test('single-edge graph n=2 is one component', () => {
  const { frames } = G.componentsFrames({ n: 2, edges: [{u:0,v:1}] });
  const last = frames[frames.length - 1];
  assert.strictEqual(last.k, 1);
  assert.strictEqual(last.comp[0], last.comp[1]);
});

test('all-isolated graph: every vertex its own component', () => {
  const { frames } = G.componentsFrames({ n: 3, edges: [] });
  const last = frames[frames.length - 1];
  assert.strictEqual(last.k, 3);
  assert.strictEqual(new Set(last.comp).size, 3);
});

test('frontier is empty at start/done, non-empty during a multi-vertex flood', () => {
  const { frames } = G.componentsFrames(G.SAMPLE);
  assert.deepStrictEqual(frames[0].frontier, []);            // initial
  assert.deepStrictEqual(frames[frames.length - 1].frontier, []); // done
  // the seed frame for the {0,1} component (current=0) has 1 queued in the frontier
  const seed01 = frames.find((f) => f.seed && f.current === 0);
  assert.ok(seed01 && seed01.frontier.length >= 1);
});

test('one process frame per vertex + initial + done; k is a running count', () => {
  const { frames } = G.componentsFrames(G.SAMPLE); // n=5 -> 5 process frames
  assert.strictEqual(frames.length, 5 + 2);        // initial + 5 + done
  assert.strictEqual(frames[0].k, 0);              // nothing labeled yet
  const kSeq = frames.map((f) => f.k);
  for (let i = 1; i < kSeq.length; i++) assert.ok(kSeq[i] >= kSeq[i - 1]); // non-decreasing
});

test('every frame carries a bilingual msg', () => {
  const { frames } = G.componentsFrames(G.SAMPLE);
  frames.forEach((f) => { assert.ok(f.msg && f.msg.zh && f.msg.en); });
});

test('parseInput: undirected 1-0 == 0-1; drops malformed/out-of-range; ignores :w', () => {
  const a = G.parseInput('2', '0-1');
  const b = G.parseInput('2', '1-0');
  assert.strictEqual(G.componentsFrames(a).frames.pop().k, 1);
  assert.strictEqual(G.componentsFrames(b).frames.pop().k, 1);
  const r = G.parseInput('3', ' 0-1 , 1-2:9 , 9-9 , junk , 2-0 ');
  assert.strictEqual(r.n, 3);
  assert.deepStrictEqual(r.edges, [{u:0,v:1},{u:1,v:2},{u:2,v:0}]); // 9-9 & junk dropped, :9 ignored
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test tests/unit/graph_components_viz.test.js`
Expected: FAIL — `Cannot find module '../../js/graph_components_viz.js'`.

- [ ] **Step 3: Implement the logic module**

Create `js/graph_components_viz.js`:

```javascript
(function (global) {
  'use strict';
  const SAMPLE = { n: 5, edges: [{ u: 0, v: 1 }, { u: 2, v: 3 }] };

  function parseInput(nStr, edgesStr) {
    let n = parseInt(nStr, 10); if (!Number.isFinite(n) || n < 1) n = 1; if (n > 10) n = 10;
    const edges = [];
    String(edgesStr || '').split(',').forEach((tok) => {
      const m = /^\s*(\d+)\s*-\s*(\d+)\s*(?::\s*\d+)?\s*$/.exec(tok); // :w tolerated but ignored
      if (!m) return;
      const u = +m[1], v = +m[2];
      if (u < 0 || v < 0 || u >= n || v >= n) return;
      edges.push({ u, v });
    });
    return { n, edges };
  }

  function componentsFrames(cfg) {
    const n = cfg.n, edges = cfg.edges || [];
    // Undirected adjacency; sort neighbour lists for deterministic order.
    const adj = Array.from({ length: n }, () => []);
    edges.forEach((e) => {
      if (e.u < 0 || e.v < 0 || e.u >= n || e.v >= n) return;
      adj[e.u].push(e.v);
      if (e.u !== e.v) adj[e.v].push(e.u);
    });
    adj.forEach((lst) => lst.sort((a, b) => a - b));

    const comp = Array(n).fill(-1);
    const frames = [];
    const copy = () => comp.slice();

    frames.push({ comp: copy(), current: null, frontier: [], newly: [], k: 0, seed: false, done: false,
      msg: { zh: '從所有頂點皆未標記開始（尚無連通分量）。', en: 'Start with every vertex unlabelled (no components yet).' } });

    let k = 0;
    for (let s = 0; s < n; s++) {
      if (comp[s] !== -1) continue;
      comp[s] = k;
      const queue = [s];
      let isSeed = true;
      while (queue.length) {
        const v = queue.shift();
        const newly = [];
        adj[v].forEach((w) => { if (comp[w] === -1) { comp[w] = k; queue.push(w); newly.push(w); } });
        const enLbl = newly.length ? (' Enqueue neighbour' + (newly.length > 1 ? 's ' : ' ') + newly.join(', ') + '.') : ' No new neighbours.';
        const zhLbl = newly.length ? ('，將鄰居 ' + newly.join('、') + ' 加入佇列。') : '，沒有新的鄰居。';
        const msg = isSeed
          ? { zh: '頂點 ' + v + ' 開啟新的連通分量（第 ' + (k + 1) + ' 個）' + zhLbl,
              en: 'Vertex ' + v + ' starts a new component (#' + (k + 1) + ').' + enLbl }
          : { zh: '處理頂點 ' + v + '（連通分量 ' + k + '）' + zhLbl,
              en: 'Process vertex ' + v + ' (component ' + k + ').' + enLbl };
        frames.push({ comp: copy(), current: v, frontier: queue.slice(), newly, k: k + 1, seed: isSeed, done: false, msg });
        isSeed = false;
      }
      k++;
    }

    frames.push({ comp: copy(), current: null, frontier: [], newly: [], k, seed: false, done: true,
      msg: { zh: '完成：共有 ' + k + ' 個連通分量。', en: 'Done: ' + k + ' connected component' + (k === 1 ? '' : 's') + '.' } });

    return { frames };
  }

  const api = { SAMPLE, parseInput, componentsFrames };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.GraphComponentsViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test tests/unit/graph_components_viz.test.js`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add js/graph_components_viz.js tests/unit/graph_components_viz.test.js
git commit -m "feat(dsvisual): graph-components pure logic — BFS-flood component frames + unit tests"
```

---

### Task 2: Renderer + wiring + i18n + e2e

**Files:**
- Create: `js/viz/viz_graph_components.js`
- Modify: `index.html` (two `<script defer>` tags), `js/app.js` (one `METHOD_GROUPS` row), `js/i18n.js` (two keys), `style.css` (`.gc2-*` block)
- Test: `tests/graph_components.spec.js`

**Interfaces:**
- Consumes: `GraphComponentsViz.{SAMPLE,parseInput,componentsFrames}` (Task 1); `VizKit.{acquireDynamicVizHost,buildStepControls,showStatus,langOf}`; `ExamplesStore`; `VizRegistry.attach`.
- Produces: a registered `graph-components` visualizer; DOM contract for e2e — `.gc2-wrap`, `.gc2-controls`, `.gc2-n`, `.gc2-edges`, `.gc2-apply`, `.ex-select`, `.gc2-scroll`, `.gc2-graph`, SVG `.gc2-node` (+ `.gc2-node-current`, `.gc2-node-frontier`, `.gc2-node-unvisited`), `.gc2-edge`, `.gc2-count`, `.gc2-msg`; step controls `.stepctl [data-action="step"]`.

- [ ] **Step 1: Write the failing e2e spec**

Create `tests/graph_components.spec.js`:

```javascript
const { test, expect } = require('@playwright/test'); const path = require('path');
const FILE_URI = 'file://' + path.resolve(__dirname, '../index.html');

test.describe('graph-components', () => {
  test('stepped BFS flood colours vertices, marks a frontier, drawer hidden', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=graph-components');
    await expect(page.locator('.gc2-wrap')).toBeVisible();
    await expect(page.locator('.gc2-graph .gc2-node').first()).toBeVisible();
    // one step: a current vertex + a frontier vertex appear (default seed 0 enqueues 1)
    await page.locator('.stepctl [data-action="step"]').click();
    await expect(page.locator('.gc2-graph .gc2-node-current')).toHaveCount(1);
    await expect(page.locator('.gc2-graph .gc2-node-frontier').first()).toBeVisible();
    // code hidden until drawer toggled
    await expect(page.locator('[data-method-section="graph-components"] .code-drawer-toggle')).toBeVisible();
  });

  test('running to completion reports 3 components for the default graph', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=graph-components');
    for (let i = 0; i < 8; i++) await page.locator('.stepctl [data-action="step"]').click();
    await expect(page.locator('.gc2-count')).toContainText('3');
  });

  test('editable n/edges + Apply updates the graph and saves an example', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=graph-components');
    const before = await page.locator('.ex-select option').count();
    await page.locator('.gc2-n').fill('3');
    await page.locator('.gc2-edges').fill('0-1,1-2');
    await page.locator('.gc2-apply').click();
    await expect(page.locator('.gc2-graph .gc2-node')).toHaveCount(3);
    await expect(page.locator('.gc2-graph .gc2-edge')).toHaveCount(2);
    await expect(page.locator('.ex-select option')).toHaveCount(before + 1);
  });

  test('selecting the Default example restores the 5-vertex sample', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=graph-components');
    await page.locator('.gc2-n').fill('3');
    await page.locator('.gc2-edges').fill('0-1,1-2');
    await page.locator('.gc2-apply').click();
    await expect(page.locator('.gc2-graph .gc2-node')).toHaveCount(3);
    await page.selectOption('.ex-select', { label: 'Default' });
    await expect(page.locator('.gc2-graph .gc2-node')).toHaveCount(5);
    await expect(page.locator('.gc2-scroll')).toBeVisible();
  });
});
```

- [ ] **Step 2: Run the spec to verify it fails**

Run: `npx playwright test tests/graph_components.spec.js`
Expected: FAIL — `.gc2-wrap` never appears / method not registered (nav has no `graph-components`).

- [ ] **Step 3: Add the i18n keys (both languages, up front)**

In `js/i18n.js`, next to `'method.graph-matrix'` in the **en** dict (~line 69) add:
```javascript
            'method.graph-components':      'Connected Components',
```
and next to `'method.graph-matrix'` in the **zh** dict (~line 314) add (Traditional):
```javascript
            'method.graph-components':      '連通分量',
```

- [ ] **Step 4: Add the `METHOD_GROUPS` row**

In `js/app.js`, in the `graphs` group's `methods` array (after the `graph-matrix` row, ~line 118) add:
```javascript
            { id: 'graph-components', title: 'Connected Components', file: 'graph_components.cpp', visualizer: 'graph-components', controls: 'graph-components', codeDrawer: true },
```

- [ ] **Step 5: Add the two script tags**

In `index.html`, after the two `graph_matrix` tags (~line 407) add:
```html
    <script src="js/graph_components_viz.js" defer></script>
    <script src="js/viz/viz_graph_components.js" defer></script>
```

- [ ] **Step 6: Write the renderer**

Create `js/viz/viz_graph_components.js`:

```javascript
(function (global) {
  'use strict';
  const K = () => global.VizKit; // resolved at call time (VizKit set at startup)

  // Distinct per-component fills (cycled by component index).
  const PALETTE = ['#3b82f6', '#f59e0b', '#10b981', '#a855f7', '#ec4899', '#14b8a6'];

  // loadExamples/saveExample/buildExamplesSelect — stateless wrappers around the
  // global ExamplesStore, keyed by methodId. Duplicated from viz_graph_matrix.js
  // per the extraction recipe (also in viz_list_equivalence.js) — do NOT refactor
  // into a shared module.
  function loadExamples(methodId) { try { return ExamplesStore.load(localStorage, methodId); } catch (e) { return []; } }
  function saveExample(methodId, text, defaultText) { try { ExamplesStore.save(localStorage, methodId, text, defaultText); } catch (e) { /* ignore */ } }
  function buildExamplesSelect(methodId, defaultText) {
    const lang = (global.I18N && I18N.getCurrentLanguage) ? I18N.getCurrentLanguage() : 'en';
    const escAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
    const escText = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const trunc = (s) => { s = String(s); return s.length > 24 ? s.slice(0, 24) + '…' : s; };
    const placeholder = lang === 'zh' ? '範例…' : 'Examples…';
    const defLabel = lang === 'zh' ? '預設' : 'Default';
    let h = '<select class="ex-select" data-method="' + escAttr(methodId) + '">';
    h += '<option value="">' + placeholder + '</option>';
    h += '<option value="' + escAttr(defaultText) + '">' + defLabel + '</option>';
    loadExamples(methodId).forEach((e) => {
      if (e.text === defaultText) return;
      h += '<option value="' + escAttr(e.text) + '">' + escText(trunc(e.text)) + '</option>';
    });
    h += '</select>';
    return h;
  }

  // Serialize/deserialize _st as `n|u-v,u-v,...` for the examples select.
  function edgesToStr(edges) { return edges.map((e) => e.u + '-' + e.v).join(','); }
  function serialize(st) { return st.n + '|' + edgesToStr(st.edges); }
  function deserialize(text) {
    const parts = String(text).split('|');
    const parsed = global.GraphComponentsViz.parseInput(parts[0], parts.slice(1).join('|'));
    return { n: parsed.n, edges: parsed.edges };
  }
  const DEFAULT_SERIALIZED = serialize(global.GraphComponentsViz.SAMPLE);

  const _st = {
    n: global.GraphComponentsViz.SAMPLE.n,
    edges: global.GraphComponentsViz.SAMPLE.edges.slice(),
    idx: 0,
  };

  // Compact self-contained node-link SVG: n nodes on a circle, undirected edges
  // as plain lines. Each node is filled by its component colour once labelled,
  // neutral while unvisited; the current vertex and the frontier get rings.
  function gcGraphSvg(n, edges, frame) {
    const CX = 130, CY = 130, R = 100, NR = 17;
    const frontierSet = new Set(frame.frontier || []);
    const pos = [];
    for (let i = 0; i < n; i++) {
      const ang = -Math.PI / 2 + (i * 2 * Math.PI) / Math.max(n, 1);
      pos.push({ x: CX + R * Math.cos(ang), y: CY + R * Math.sin(ang) });
    }
    let svg = '<svg viewBox="0 0 260 260" width="260" height="260" class="gc2-svg">';
    edges.forEach((e) => {
      const a = pos[e.u], b = pos[e.v];
      if (!a || !b) return;
      svg += '<line class="gc2-edge" x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '"/>';
    });
    pos.forEach((p, i) => {
      const c = frame.comp[i];
      const fill = c >= 0 ? PALETTE[c % PALETTE.length] : '';
      let cls = 'gc2-node';
      if (c < 0) cls += ' gc2-node-unvisited';
      if (i === frame.current) cls += ' gc2-node-current';
      if (frontierSet.has(i)) cls += ' gc2-node-frontier';
      svg += '<circle class="' + cls + '" data-v="' + i + '" cx="' + p.x + '" cy="' + p.y + '" r="' + NR + '"' +
             (fill ? ' style="fill:' + fill + '"' : '') + '/>' +
             '<text class="gc2-node-label" x="' + p.x + '" y="' + (p.y + 5) + '" text-anchor="middle">' + i + '</text>';
    });
    svg += '</svg>';
    return svg;
  }

  function renderGraphComponents() {
    const host = K().acquireDynamicVizHost();
    host.innerHTML =
      '<div class="gc2-wrap">' +
        '<div class="gc2-controls">' +
          '<label>n <input type="text" class="gc2-n" value="' + _st.n + '"></label>' +
          '<label>edges <input type="text" class="gc2-edges" value="' + edgesToStr(_st.edges) + '"></label>' +
          '<button type="button" class="gc2-apply">套用 Apply</button>' +
          buildExamplesSelect('graph-components', DEFAULT_SERIALIZED) +
        '</div>' +
        '<div class="gc2-count" data-testid="gc2-count">&nbsp;</div>' +
        '<div class="gc2-scroll"><div class="gc2-graph"></div></div>' +
        '<div class="gc2-msg" data-testid="gc2-msg">&nbsp;</div>' +
      '</div>';

    const wrap = host.querySelector('.gc2-wrap');
    const graphEl = wrap.querySelector('.gc2-graph');
    const countEl = wrap.querySelector('.gc2-count');
    const msgEl = wrap.querySelector('.gc2-msg');

    const frames = global.GraphComponentsViz.componentsFrames(_st).frames;
    if (_st.idx >= frames.length) _st.idx = frames.length - 1;

    function countText(k) {
      const lang = (global.I18N && I18N.getCurrentLanguage) ? I18N.getCurrentLanguage() : 'en';
      return lang === 'zh' ? ('連通分量：' + k) : ('Components: ' + k);
    }
    function paint() {
      const f = frames[_st.idx];
      graphEl.innerHTML = gcGraphSvg(_st.n, _st.edges, f);
      countEl.textContent = countText(f.k);
      msgEl.textContent = K().langOf(f.msg);
    }
    function step() {
      if (_st.idx >= frames.length - 1) return false;
      _st.idx++;
      paint();
      K().showStatus(K().langOf(frames[_st.idx].msg), frames[_st.idx].done ? '#34d399' : '#60a5fa');
      return _st.idx < frames.length - 1;
    }
    function reset() { _st.idx = 0; paint(); }

    wrap.appendChild(K().buildStepControls(step, reset, 800));
    paint();

    wrap.querySelector('.gc2-apply').addEventListener('click', function () {
      const parsed = global.GraphComponentsViz.parseInput(wrap.querySelector('.gc2-n').value, wrap.querySelector('.gc2-edges').value);
      _st.n = parsed.n; _st.edges = parsed.edges; _st.idx = 0;
      saveExample('graph-components', serialize(_st), DEFAULT_SERIALIZED);
      renderGraphComponents();
    });
    const exSelect = wrap.querySelector('.ex-select');
    if (exSelect) exSelect.addEventListener('change', function (ev) {
      const v = ev.target.value; if (!v) return;
      const parsed = deserialize(v);
      _st.n = parsed.n; _st.edges = parsed.edges; _st.idx = 0;
      renderGraphComponents();
    });
  }

  global.VizRegistry.attach('graph-components', {
    render: renderGraphComponents,
    code: () => (typeof codeGraphComponents !== 'undefined' ? codeGraphComponents : ''),
    layout: { host: 'dynamic' },
  });
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 7: Add the CSS**

In `style.css`, after the `.gm-msg` rule (~line 1967) add:
```css
.gc2-wrap { display: flex; flex-direction: column; gap: 10px; align-items: center; }
.gc2-controls { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; font-size: 13px; color: #475569; }
.gc2-controls label { display: flex; align-items: center; gap: 4px; }
.gc2-controls input[type="text"] { width: 120px; font-family: monospace; }
.gc2-count { font-family: monospace; font-size: 14px; font-weight: 700; color: #1e293b; }
.gc2-scroll { overflow: auto; max-height: 420px; width: 100%; display: flex; justify-content: center; }
.gc2-graph { display: flex; justify-content: center; padding: 4px 0; }
.gc2-svg { max-width: 260px; }
.gc2-edge { stroke: #94a3b8; stroke-width: 2; }
.gc2-node { fill: #f8fafc; stroke: #1e293b; stroke-width: 2; }
.gc2-node-unvisited { fill: #e5e7eb; }
.gc2-node-current { stroke: #1e293b; stroke-width: 4; }
.gc2-node-frontier { stroke: #f59e0b; stroke-width: 3; stroke-dasharray: 4 3; }
.gc2-node-label { font-size: 12px; font-weight: 700; fill: #0f172a; }
.gc2-msg { font-family: monospace; font-size: 12px; color: #475569; min-height: 1.2em; text-align: center; }
```

- [ ] **Step 8: Run the e2e spec to verify it passes**

Run: `npx playwright test tests/graph_components.spec.js`
Expected: PASS (4 tests).

- [ ] **Step 9: Commit**

```bash
git add js/viz/viz_graph_components.js tests/graph_components.spec.js index.html js/app.js js/i18n.js style.css
git commit -m "feat(dsvisual): graph-components renderer — stepped BFS flood, component colours + frontier, count, examples; wiring + i18n + e2e"
```

---

### Task 3: C++ source, description, smoke test, full verification

**Files:**
- Create: `cpp/graph_components.cpp`
- Modify: `build_db.js` (mapping), `js/desc_db.js` (entry), `tests/smoke_modes.spec.js` (+id)
- Regenerate: `js/code_db.js` (via `node build_db.js` — do NOT hand-edit)

**Interfaces:**
- Consumes: the `graph-components` viz `code:()` reads global `codeGraphComponents` (produced into `js/code_db.js` by `build_db.js`).
- Produces: `codeGraphComponents` in `js/code_db.js`; a `graph-components` entry in `desc_db`; `graph-components` in the smoke-mode list.

- [ ] **Step 1: Write the C++ source**

Create `cpp/graph_components.cpp`:

```cpp
#include <iostream>
#include <queue>
#include <vector>
using namespace std;

const int MAXN = 10;

class Graph {
    int n;
    vector<int> adj[MAXN];

public:
    Graph(int v) : n(v) {}

    // Undirected edge.
    void addEdge(int u, int v) {
        adj[u].push_back(v);
        adj[v].push_back(u);
    }

    // BFS flood-fill (COMP): from the lowest unlabelled vertex, label its whole
    // connected component, then repeat. Fills comp[] and returns the count.
    int connectedComponents(int comp[]) {
        for (int i = 0; i < n; i++)
            comp[i] = -1;
        int k = 0;
        for (int s = 0; s < n; s++) {
            if (comp[s] != -1)
                continue;
            queue<int> q;
            q.push(s);
            comp[s] = k;
            while (!q.empty()) {
                int v = q.front();
                q.pop();
                for (int w : adj[v])
                    if (comp[w] == -1) {
                        comp[w] = k;
                        q.push(w);
                    }
            }
            k++;
        }
        return k;
    }
};

int main() {
    Graph g(5);          // G3: two edges, one isolated vertex -> 3 components
    g.addEdge(0, 1);
    g.addEdge(2, 3);

    int comp[5];
    int k = g.connectedComponents(comp);

    cout << "components = " << k << "\n";
    for (int i = 0; i < 5; i++)
        cout << "comp[" << i << "] = " << comp[i] << "\n";
    return 0;
}
```

- [ ] **Step 2: Register the mapping**

In `build_db.js`, next to `'graph_matrix.cpp': 'codeGraphMatrix',` (~line 33) add:
```javascript
    'graph_components.cpp': 'codeGraphComponents',
```

- [ ] **Step 3: Regenerate the code DB**

Run: `node build_db.js`
Expected: `js/code_db.js` regenerated; `git diff --stat js/code_db.js` shows only the added `codeGraphComponents` string (no unrelated churn).

- [ ] **Step 4: Add the description entry**

In `js/desc_db.js`, next to the `'graph-matrix'` entry (~line 226) add:
```javascript
    'graph-components': `
        <h3>Connected Components</h3>
        <p>A <strong>connected component</strong> of an undirected graph is a maximal set of vertices that can all reach one another. The whole graph splits uniquely into such components; an isolated vertex is a component by itself.</p>
        <hr>
        <ul>
            <li><strong>COMP procedure:</strong> scan vertices in order; at the first <em>unlabelled</em> vertex, start a new component and flood-fill everything reachable from it, then continue scanning for the next unlabelled vertex.</li>
            <li><strong>BFS flood-fill:</strong> seed a queue with the starting vertex; repeatedly dequeue a vertex and enqueue its still-unlabelled neighbours, tagging each with the current component id. (DFS works identically.)</li>
            <li><strong>Frontier:</strong> the vertices already enqueued but not yet processed — the flood's advancing edge.</li>
            <li><strong>Count &amp; uses:</strong> the number of components tells you whether the graph is connected (exactly 1) and underlies percolation, image region-labelling, and network-partition checks.</li>
        </ul>
        <div class="complexities">
            <span class="badge time">Time: O(n + e)</span>
            <span class="badge space">Space: O(n + e)</span>
        </div>
    `,
```

- [ ] **Step 5: Add to the smoke-mode list**

In `tests/smoke_modes.spec.js`, add `'graph-components'` to the `MODES` array (next to `'graph-matrix'`):
```javascript
  'graph', 'graph-prim', 'graph-matrix', 'graph-components', 'hash-chain', 'cache-lru', 'heap-binary',
```

- [ ] **Step 6: Verify the code drawer shows the regenerated source**

Run: `npx playwright test tests/graph_components.spec.js`
Expected: PASS (the drawer-toggle assertion still green; `codeGraphComponents` now resolves).

- [ ] **Step 7: Run the unit suite**

Run: `npm run test:unit`
Expected: PASS (incl. `graph_components_viz.test.js`).

- [ ] **Step 8: Run the FULL Playwright suite**

Run: `npm test`
Expected: PASS — new `graph_components.spec.js` + smoke `graph-components` green; overview-tile count self-adjusts; `.overview-category` unchanged; no regressions.

- [ ] **Step 9: Commit**

```bash
git add cpp/graph_components.cpp build_db.js js/code_db.js js/desc_db.js tests/smoke_modes.spec.js
git commit -m "feat(dsvisual): graph-components C++ source, description, smoke mode; regen code_db; full verify"
```

---

## Self-Review

- **Spec coverage:** undirected-only default G3 (Task 1 SAMPLE + unit) ✓; stepped BFS flood + seed/frontier/coloring + count (Task 1 frames + Task 2 renderer/e2e) ✓; editable graph + ExamplesStore (Task 2) ✓; codeDrawer (Task 2 row `codeDrawer:true` + Task 3 code) ✓; scroll (`.gc2-scroll` overflow:auto, Task 2 CSS) ✓; Traditional-zh msgs/labels ✓; i18n key up front (Task 2 Step 3) ✓; C++/desc/smoke (Task 3) ✓; full Playwright (Task 3 Step 8) ✓.
- **Placeholder scan:** none — every step has concrete code/commands.
- **Type consistency:** `componentsFrames`→`{frames}`, `Frame.{comp,current,frontier,newly,k,seed,done,msg}` used identically in logic, renderer, and tests; `SAMPLE`/`parseInput` signatures match across tasks; DOM class contract (`.gc2-*`) consistent between renderer and e2e; `codeGraphComponents` global name matches `build_db.js` mapping and the viz `code:()`.
```

