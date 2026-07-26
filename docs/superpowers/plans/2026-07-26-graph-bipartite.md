# graph-bipartite (Bipartite Check / 2-coloring) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a `graph-bipartite` viz in the `graphs` category: an undirected graph on which a stepped BFS 2-coloring either lists two color classes (bipartite) or highlights the first odd-cycle edge (not bipartite), driven by the VCR `buildFrameControls` transport.

**Architecture:** Pure logic module `js/graph_bipartite_viz.js` emits bilingual frames (no DOM); renderer `js/viz/viz_graph_bipartite.js` draws a self-contained circle-layout node-link SVG (2-color fills, current + frontier rings, conflict-edge highlight) and a verdict readout, stepped via `K().buildFrameControls(frames, paint, opts)`. One `METHOD_GROUPS` row, two `index.html` tags, a `cpp/` + `desc_db` + `i18n` triple, and Playwright specs. Closely mirrors viz #2 `graph-components` (PR #152), now on the VCR control (PR #153).

**Tech Stack:** Vanilla JS (IIFE dual-export), inline SVG, `VizKit`/`VizRegistry` seam, `ExamplesStore` (localStorage), `buildFrameControls`, Playwright + `node:test`.

## Global Constraints

- Viz #3 of the chap06 graph-viz program; spec `docs/superpowers/specs/2026-07-26-graph-bipartite-design.md`.
- Bilingual `msg`/labels; `zh` MUST be **Traditional (zh-Hant)** — never Simplified.
- Honest stepping: the rendering maps straight from frame fields; the conflict frame reflects the real offending edge. Never distort data to satisfy a test.
- Program UI conventions: `codeDrawer:true`; `ExamplesStore` saveable examples + a built-in odd-cycle option; `overflow:auto` scroll; the **VCR control** `buildFrameControls`.
- Add `method.graph-bipartite` to BOTH i18n dicts UP FRONT (avoid the raw-key nav gap).
- **Concurrent refactor session:** stage with targeted `git add <path>` only — NEVER `-A`/`.`/`-u`. Verify `git status` before each commit.
- Never hand-edit generated `js/code_db.js` (produced by `node build_db.js`).
- `graphs` category already exists ⇒ `.overview-category` count unchanged; overview-tile count self-updating (PR #142) — confirm via FULL Playwright.
- Branch `feat/graph-bipartite` (already created). One PR.

## VCR control contract (how the renderer steps)

`K().buildFrameControls(frames, paint, { runIntervalMs })` owns the frame cursor and calls
`paint(frames[idx], idx)` on the initial render and every transport action (⏮ ◀ ▶/⏸ ▶︎ + scrubber).
The viz supplies the `frames` array + a `paint(fr, i)` function and does NOT keep a local idx/step/reset.
Fold per-frame status into `paint`. (Model: `js/viz/viz_graph_components.js`.)

---

### Task 1: Pure logic module + unit tests

**Files:**
- Create: `js/graph_bipartite_viz.js`
- Test: `tests/unit/graph_bipartite_viz.test.js`

**Interfaces:**
- Produces:
  - `GraphBipartiteViz.SAMPLE = { n:6, edges:[{u:0,v:1},{u:1,v:2},{u:2,v:3},{u:3,v:4},{u:4,v:5},{u:5,v:0}] }` (C6)
  - `GraphBipartiteViz.parseInput(nStr, edgesStr) → { n, edges:[{u,v}] }` (undirected; drops malformed/out-of-range; clamps n≤10; ignores `:w`)
  - `GraphBipartiteViz.bipartiteFrames({n, edges}) → { frames:[Frame] }` where
    `Frame = { color:number[] (-1/0/1), current:number|null, frontier:number[], newly:number[],
    seed:boolean, conflict:{u,v}|null, bipartite:boolean|null, done:boolean, classes?:{v1,v2}, msg:{zh,en} }`.
    Stops at the first same-color edge (conflict frame is last).

- [ ] **Step 1: Write the failing unit tests**

Create `tests/unit/graph_bipartite_viz.test.js`:

```javascript
const test = require('node:test'); const assert = require('node:assert');
const G = require('../../js/graph_bipartite_viz.js');

test('SAMPLE C6 is bipartite; classes {0,2,4}/{1,3,5}', () => {
  const { frames } = G.bipartiteFrames(G.SAMPLE);
  const last = frames[frames.length - 1];
  assert.strictEqual(last.done, true);
  assert.strictEqual(last.bipartite, true);
  assert.strictEqual(last.conflict, null);
  assert.deepStrictEqual(last.classes.v1, [0, 2, 4]);
  assert.deepStrictEqual(last.classes.v2, [1, 3, 5]);
});

test('C5 (odd cycle) is NOT bipartite; conflict frame is last, endpoints share a colour', () => {
  const { frames } = G.bipartiteFrames({ n: 5, edges: [{u:0,v:1},{u:1,v:2},{u:2,v:3},{u:3,v:4},{u:4,v:0}] });
  const last = frames[frames.length - 1];
  assert.strictEqual(last.done, true);
  assert.strictEqual(last.bipartite, false);
  assert.ok(last.conflict && typeof last.conflict.u === 'number' && typeof last.conflict.v === 'number');
  assert.strictEqual(last.color[last.conflict.u], last.color[last.conflict.v]); // same-colour = odd cycle
  // no frames exist after the conflict frame
  assert.strictEqual(frames.filter((f) => f.conflict).length, 1);
  assert.strictEqual(frames.indexOf(last), frames.length - 1);
});

test('triangle is not bipartite; even path is bipartite', () => {
  assert.strictEqual(G.bipartiteFrames({ n:3, edges:[{u:0,v:1},{u:1,v:2},{u:2,v:0}] }).frames.pop().bipartite, false);
  assert.strictEqual(G.bipartiteFrames({ n:4, edges:[{u:0,v:1},{u:1,v:2},{u:2,v:3}] }).frames.pop().bipartite, true);
});

test('disconnected graph: even cycle + odd cycle → not bipartite (conflict in the odd component)', () => {
  // component A = 4-cycle 0-1-2-3-0 (bipartite); component B = triangle 4-5-6 (odd)
  const { frames } = G.bipartiteFrames({ n:7, edges:[
    {u:0,v:1},{u:1,v:2},{u:2,v:3},{u:3,v:0}, {u:4,v:5},{u:5,v:6},{u:6,v:4} ] });
  const last = frames[frames.length - 1];
  assert.strictEqual(last.bipartite, false);
  assert.ok(last.conflict.u >= 4 && last.conflict.v >= 4); // conflict is in the triangle
});

test('frontier empty at start/done, non-empty mid-flood; every frame bilingual', () => {
  const { frames } = G.bipartiteFrames(G.SAMPLE);
  assert.deepStrictEqual(frames[0].frontier, []);
  assert.deepStrictEqual(frames[frames.length - 1].frontier, []);
  const seed0 = frames.find((f) => f.seed && f.current === 0);
  assert.ok(seed0 && seed0.frontier.length >= 1);
  frames.forEach((f) => { assert.ok(f.msg && f.msg.zh && f.msg.en); });
});

test('parseInput: undirected 1-0 == 0-1; drops malformed/out-of-range; ignores :w', () => {
  assert.strictEqual(G.bipartiteFrames(G.parseInput('2','0-1')).frames.pop().bipartite, true);
  assert.strictEqual(G.bipartiteFrames(G.parseInput('2','1-0')).frames.pop().bipartite, true);
  const r = G.parseInput('3', ' 0-1 , 1-2:9 , 9-9 , junk , 2-0 ');
  assert.strictEqual(r.n, 3);
  assert.deepStrictEqual(r.edges, [{u:0,v:1},{u:1,v:2},{u:2,v:0}]);
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `node --test tests/unit/graph_bipartite_viz.test.js`
Expected: FAIL — `Cannot find module '../../js/graph_bipartite_viz.js'`.

- [ ] **Step 3: Implement the logic module**

Create `js/graph_bipartite_viz.js`:

```javascript
(function (global) {
  'use strict';
  const SAMPLE = { n: 6, edges: [{u:0,v:1},{u:1,v:2},{u:2,v:3},{u:3,v:4},{u:4,v:5},{u:5,v:0}] };

  function parseInput(nStr, edgesStr) {
    let n = parseInt(nStr, 10); if (!Number.isFinite(n) || n < 1) n = 1; if (n > 10) n = 10;
    const edges = [];
    String(edgesStr || '').split(',').forEach((tok) => {
      const m = /^\s*(\d+)\s*-\s*(\d+)\s*(?::\s*\d+)?\s*$/.exec(tok);
      if (!m) return;
      const u = +m[1], v = +m[2];
      if (u < 0 || v < 0 || u >= n || v >= n) return;
      edges.push({ u, v });
    });
    return { n, edges };
  }

  function bipartiteFrames(cfg) {
    const n = cfg.n, edges = cfg.edges || [];
    const adj = Array.from({ length: n }, () => []);
    edges.forEach((e) => {
      if (e.u < 0 || e.v < 0 || e.u >= n || e.v >= n) return;
      adj[e.u].push(e.v);
      if (e.u !== e.v) adj[e.v].push(e.u);
    });
    adj.forEach((lst) => lst.sort((a, b) => a - b));

    const color = Array(n).fill(-1);
    const frames = [];
    const copy = () => color.slice();
    const COL = ['A', 'B'];

    frames.push({ color: copy(), current: null, frontier: [], newly: [], seed: false, conflict: null, bipartite: null, done: false,
      msg: { zh: '從所有頂點皆未著色開始，準備進行 BFS 二著色。', en: 'Start with every vertex uncoloured; begin BFS 2-colouring.' } });

    for (let s = 0; s < n; s++) {
      if (color[s] !== -1) continue;
      color[s] = 0;
      const queue = [s];
      let isSeed = true;
      while (queue.length) {
        const v = queue.shift();
        const newly = [];
        for (let k = 0; k < adj[v].length; k++) {
          const w = adj[v][k];
          if (color[w] === -1) { color[w] = 1 - color[v]; queue.push(w); newly.push(w); }
          else if (color[w] === color[v]) {
            frames.push({ color: copy(), current: v, frontier: queue.slice(), newly: newly.slice(), seed: isSeed,
              conflict: { u: v, v: w }, bipartite: false, done: true,
              msg: { zh: '邊 ' + v + '—' + w + ' 連接兩個同為顏色 ' + COL[color[v]] + ' 的頂點 → 出現奇環，此圖不是二分圖。',
                     en: 'Edge ' + v + '—' + w + ' joins two vertices both coloured ' + COL[color[v]] + ' → odd cycle; the graph is NOT bipartite.' } });
            return { frames: frames };
          }
        }
        const other = COL[1 - color[v]];
        const enLbl = newly.length ? (' Colour neighbour' + (newly.length > 1 ? 's ' : ' ') + newly.join(', ') + ' ' + other + '.') : ' No uncoloured neighbours.';
        const zhLbl = newly.length ? ('，將鄰居 ' + newly.join('、') + ' 著色為 ' + other + '。') : '，沒有可著色的鄰居。';
        const msg = isSeed
          ? { zh: '頂點 ' + v + ' 開啟一輪 BFS，著色為 ' + COL[color[v]] + zhLbl,
              en: 'Vertex ' + v + ' seeds a BFS, coloured ' + COL[color[v]] + '.' + enLbl }
          : { zh: '處理頂點 ' + v + '（顏色 ' + COL[color[v]] + '）' + zhLbl,
              en: 'Process vertex ' + v + ' (colour ' + COL[color[v]] + ').' + enLbl };
        frames.push({ color: copy(), current: v, frontier: queue.slice(), newly: newly, seed: isSeed, conflict: null, bipartite: null, done: false, msg: msg });
        isSeed = false;
      }
    }

    const v1 = [], v2 = [];
    for (let i = 0; i < n; i++) { if (color[i] === 0) v1.push(i); else if (color[i] === 1) v2.push(i); }
    frames.push({ color: copy(), current: null, frontier: [], newly: [], seed: false, conflict: null, bipartite: true, done: true, classes: { v1: v1, v2: v2 },
      msg: { zh: '完成：此圖是二分圖。V₁ = {' + v1.join('、') + '}、V₂ = {' + v2.join('、') + '}。',
             en: 'Done: the graph is bipartite. V1 = {' + v1.join(', ') + '}, V2 = {' + v2.join(', ') + '}.' } });
    return { frames: frames };
  }

  const api = { SAMPLE, parseInput, bipartiteFrames };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.GraphBipartiteViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 4: Run to verify they pass**

Run: `node --test tests/unit/graph_bipartite_viz.test.js`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add js/graph_bipartite_viz.js tests/unit/graph_bipartite_viz.test.js
git commit -m "feat(dsvisual): graph-bipartite pure logic — BFS 2-colouring frames (stop at first odd-cycle edge) + unit tests"
```

---

### Task 2: Renderer (VCR control) + wiring + i18n + e2e

**Files:**
- Create: `js/viz/viz_graph_bipartite.js`
- Modify: `index.html` (two tags), `js/app.js` (one METHOD_GROUPS row), `js/i18n.js` (two keys), `style.css` (`.gbp-*`)
- Test: `tests/graph_bipartite.spec.js`

**Interfaces:**
- Consumes: `GraphBipartiteViz.{SAMPLE,parseInput,bipartiteFrames}`; `VizKit.{acquireDynamicVizHost,buildFrameControls,langOf,showStatus}`; `ExamplesStore`; `VizRegistry.attach`.
- Produces: registered `graph-bipartite` viz; DOM contract for e2e — `.gbp-wrap`, `.gbp-controls`, `.gbp-n`, `.gbp-edges`, `.gbp-apply`, `.ex-select`, `.gbp-scroll`, `.gbp-graph`, SVG `.gbp-node` (+ `.gbp-node-a`/`.gbp-node-b`/`.gbp-node-uncolored`/`.gbp-node-current`/`.gbp-node-frontier`), `.gbp-edge`/`.gbp-edge-conflict`, `.gbp-verdict`, `.gbp-msg`; the VCR bar (`.stepctl [data-action="step"]`, `.stepctl-scrubber`, `.stepctl-count`).

- [ ] **Step 1: Write the failing e2e spec**

Create `tests/graph_bipartite.spec.js`:

```javascript
const { test, expect } = require('@playwright/test'); const path = require('path');
const FILE_URI = 'file://' + path.resolve(__dirname, '../index.html');

test.describe('graph-bipartite', () => {
  test('stepped 2-colouring: colours a vertex + shows a frontier; VCR bar present', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=graph-bipartite');
    await expect(page.locator('.gbp-wrap')).toBeVisible();
    await expect(page.locator('.gbp-graph .gbp-node').first()).toBeVisible();
    await expect(page.locator('.stepctl .stepctl-scrubber')).toBeVisible();
    await page.locator('.stepctl [data-action="step"]').click(); // seed 0 → colours it, enqueues neighbours
    await expect(page.locator('.gbp-graph .gbp-node-a, .gbp-graph .gbp-node-b').first()).toBeVisible();
    await expect(page.locator('.gbp-graph .gbp-node-frontier').first()).toBeVisible();
    await expect(page.locator('[data-method-section="graph-bipartite"] .code-drawer-toggle')).toBeVisible();
  });

  test('default C6 → bipartite verdict listing two classes', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=graph-bipartite');
    const scrub = page.locator('.stepctl .stepctl-scrubber');
    await scrub.evaluate((el) => { el.value = el.max; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await expect(page.locator('.gbp-verdict')).toContainText('Bipartite');
    await expect(page.locator('.gbp-verdict')).toContainText('0, 2, 4');
    await expect(page.locator('.gbp-graph .gbp-edge-conflict')).toHaveCount(0);
  });

  test('built-in Odd cycle example → conflict edge + NOT bipartite', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=graph-bipartite');
    await page.selectOption('.ex-select', { label: 'Odd cycle' });
    const scrub = page.locator('.stepctl .stepctl-scrubber');
    await scrub.evaluate((el) => { el.value = el.max; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await expect(page.locator('.gbp-graph .gbp-edge-conflict')).toHaveCount(1);
    await expect(page.locator('.gbp-verdict')).toContainText('NOT bipartite');
  });

  test('editable n/edges + Apply updates the graph and saves an example', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=graph-bipartite');
    const before = await page.locator('.ex-select option').count();
    await page.locator('.gbp-n').fill('3');
    await page.locator('.gbp-edges').fill('0-1,1-2');
    await page.locator('.gbp-apply').click();
    await expect(page.locator('.gbp-graph .gbp-node')).toHaveCount(3);
    await expect(page.locator('.gbp-graph .gbp-edge')).toHaveCount(2);
    await expect(page.locator('.ex-select option')).toHaveCount(before + 1);
    await expect(page.locator('.gbp-scroll')).toBeVisible();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx playwright test tests/graph_bipartite.spec.js`
Expected: FAIL — `.gbp-wrap` never appears (method unregistered; nav has no graph-bipartite).

- [ ] **Step 3: Add the i18n keys (both langs, up front)**

In `js/i18n.js`, next to `'method.graph-components'` in the **en** dict add:
```javascript
            'method.graph-bipartite':       'Bipartite Check',
```
and in the **zh** dict add (Traditional):
```javascript
            'method.graph-bipartite':       '二分圖判定',
```

- [ ] **Step 4: Add the `METHOD_GROUPS` row**

In `js/app.js`, in the `graphs` group's `methods` array (after the `graph-components` row) add:
```javascript
            { id: 'graph-bipartite', title: 'Bipartite Check', file: 'graph_bipartite.cpp', visualizer: 'graph-bipartite', controls: 'graph-bipartite', codeDrawer: true },
```

- [ ] **Step 5: Add the two script tags**

In `index.html`, after the two `graph_components` tags add:
```html
    <script src="js/graph_bipartite_viz.js" defer></script>
    <script src="js/viz/viz_graph_bipartite.js" defer></script>
```

- [ ] **Step 6: Write the renderer**

Create `js/viz/viz_graph_bipartite.js` (modeled on `js/viz/viz_graph_components.js`, on the VCR control):

```javascript
(function (global) {
  'use strict';
  const K = () => global.VizKit; // resolved at call time

  // Examples-helper trio — duplicated from viz_graph_components.js per program
  // convention; do NOT refactor into a shared module.
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

  function edgesToStr(edges) { return edges.map((e) => e.u + '-' + e.v).join(','); }
  function serialize(st) { return st.n + '|' + edgesToStr(st.edges); }
  function deserialize(text) {
    const parts = String(text).split('|');
    const parsed = global.GraphBipartiteViz.parseInput(parts[0], parts.slice(1).join('|'));
    return { n: parsed.n, edges: parsed.edges };
  }
  const DEFAULT_SERIALIZED = serialize(global.GraphBipartiteViz.SAMPLE);
  // Built-in odd-cycle (C5) example — always offered alongside "Default".
  const ODD_CYCLE_SERIALIZED = '5|0-1,1-2,2-3,3-4,4-0';

  const NODE_A = '#ef4444', NODE_B = '#3b82f6';
  const _st = { n: global.GraphBipartiteViz.SAMPLE.n, edges: global.GraphBipartiteViz.SAMPLE.edges.slice() };

  function gbpGraphSvg(n, edges, frame) {
    const CX = 130, CY = 130, R = 100, NR = 17;
    const frontierSet = new Set(frame.frontier || []);
    const conflict = frame.conflict;
    const pos = [];
    for (let i = 0; i < n; i++) {
      const ang = -Math.PI / 2 + (i * 2 * Math.PI) / Math.max(n, 1);
      pos.push({ x: CX + R * Math.cos(ang), y: CY + R * Math.sin(ang) });
    }
    let svg = '<svg viewBox="0 0 260 260" width="260" height="260" class="gbp-svg">';
    edges.forEach((e) => {
      const a = pos[e.u], b = pos[e.v];
      if (!a || !b) return;
      const isConflict = !!(conflict && ((conflict.u === e.u && conflict.v === e.v) || (conflict.u === e.v && conflict.v === e.u)));
      svg += '<line class="gbp-edge' + (isConflict ? ' gbp-edge-conflict' : '') + '" x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '"/>';
    });
    pos.forEach((p, i) => {
      const c = frame.color[i];
      const fill = c === 0 ? NODE_A : (c === 1 ? NODE_B : '');
      let cls = 'gbp-node';
      if (c < 0) cls += ' gbp-node-uncolored'; else cls += (c === 0 ? ' gbp-node-a' : ' gbp-node-b');
      if (i === frame.current) cls += ' gbp-node-current';
      if (frontierSet.has(i)) cls += ' gbp-node-frontier';
      svg += '<circle class="' + cls + '" data-v="' + i + '" cx="' + p.x + '" cy="' + p.y + '" r="' + NR + '"' +
             (fill ? ' style="fill:' + fill + '"' : '') + '/>' +
             '<text class="gbp-node-label" x="' + p.x + '" y="' + (p.y + 5) + '" text-anchor="middle">' + i + '</text>';
    });
    svg += '</svg>';
    return svg;
  }

  function verdictText(fr) {
    const lang = (global.I18N && I18N.getCurrentLanguage) ? I18N.getCurrentLanguage() : 'en';
    if (fr.conflict) {
      return lang === 'zh'
        ? ('不是二分圖 — 邊 ' + fr.conflict.u + '—' + fr.conflict.v + ' 形成奇環')
        : ('NOT bipartite — odd cycle at edge ' + fr.conflict.u + '—' + fr.conflict.v);
    }
    if (fr.done && fr.bipartite && fr.classes) {
      return lang === 'zh'
        ? ('是二分圖 ✓　V₁={' + fr.classes.v1.join('、') + '}　V₂={' + fr.classes.v2.join('、') + '}')
        : ('Bipartite ✓  V1={' + fr.classes.v1.join(', ') + '}  V2={' + fr.classes.v2.join(', ') + '}');
    }
    return lang === 'zh' ? '二分圖判定中…' : 'Checking…';
  }

  function renderGraphBipartite() {
    const host = K().acquireDynamicVizHost();
    host.innerHTML =
      '<div class="gbp-wrap">' +
        '<div class="gbp-controls">' +
          '<label>n <input type="text" class="gbp-n" value="' + _st.n + '"></label>' +
          '<label>edges <input type="text" class="gbp-edges" value="' + edgesToStr(_st.edges) + '"></label>' +
          '<button type="button" class="gbp-apply">套用 Apply</button>' +
          buildExamplesSelect('graph-bipartite', DEFAULT_SERIALIZED) +
        '</div>' +
        '<div class="gbp-verdict" data-testid="gbp-verdict">&nbsp;</div>' +
        '<div class="gbp-scroll"><div class="gbp-graph"></div></div>' +
        '<div class="gbp-msg" data-testid="gbp-msg">&nbsp;</div>' +
      '</div>';

    const wrap = host.querySelector('.gbp-wrap');
    const graphEl = wrap.querySelector('.gbp-graph');
    const verdictEl = wrap.querySelector('.gbp-verdict');
    const msgEl = wrap.querySelector('.gbp-msg');

    // Inject the built-in "Odd cycle" option right after "Default".
    const exSelect = wrap.querySelector('.ex-select');
    if (exSelect && !Array.from(exSelect.options).some((o) => o.value === ODD_CYCLE_SERIALIZED)) {
      const lang = (global.I18N && I18N.getCurrentLanguage) ? I18N.getCurrentLanguage() : 'en';
      const opt = document.createElement('option');
      opt.value = ODD_CYCLE_SERIALIZED;
      opt.textContent = lang === 'zh' ? '奇環' : 'Odd cycle';
      exSelect.insertBefore(opt, exSelect.options[2] || null); // after placeholder(0) + Default(1)
    }

    const frames = global.GraphBipartiteViz.bipartiteFrames(_st).frames;

    function paint(fr, i) {
      graphEl.innerHTML = gbpGraphSvg(_st.n, _st.edges, fr);
      verdictEl.textContent = verdictText(fr);
      msgEl.textContent = K().langOf(fr.msg);
      K().showStatus(K().langOf(fr.msg), fr.conflict ? '#f87171' : (fr.done ? '#34d399' : '#60a5fa'));
    }

    wrap.appendChild(K().buildFrameControls(frames, paint, { runIntervalMs: 800 }));

    wrap.querySelector('.gbp-apply').addEventListener('click', function () {
      const parsed = global.GraphBipartiteViz.parseInput(wrap.querySelector('.gbp-n').value, wrap.querySelector('.gbp-edges').value);
      _st.n = parsed.n; _st.edges = parsed.edges;
      saveExample('graph-bipartite', serialize(_st), DEFAULT_SERIALIZED);
      renderGraphBipartite();
    });
    if (exSelect) exSelect.addEventListener('change', function (ev) {
      const v = ev.target.value; if (!v) return;
      const parsed = deserialize(v);
      _st.n = parsed.n; _st.edges = parsed.edges;
      renderGraphBipartite();
    });
  }

  global.VizRegistry.attach('graph-bipartite', {
    render: renderGraphBipartite,
    code: () => (typeof codeGraphBipartite !== 'undefined' ? codeGraphBipartite : ''),
    layout: { host: 'dynamic' },
  });
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 7: Add the CSS**

In `style.css`, after the `.gc2-*` block add:
```css
.gbp-wrap { display: flex; flex-direction: column; gap: 10px; align-items: center; }
.gbp-controls { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; font-size: 13px; color: #475569; }
.gbp-controls label { display: flex; align-items: center; gap: 4px; }
.gbp-controls input[type="text"] { width: 120px; font-family: monospace; }
.gbp-verdict { font-family: monospace; font-size: 14px; font-weight: 700; color: #1e293b; text-align: center; min-height: 1.2em; }
.gbp-scroll { overflow: auto; max-height: 420px; width: 100%; display: flex; justify-content: center; }
.gbp-graph { display: flex; justify-content: center; padding: 4px 0; }
.gbp-svg { max-width: 260px; }
.gbp-edge { stroke: #94a3b8; stroke-width: 2; }
.gbp-edge-conflict { stroke: #dc2626; stroke-width: 4; }
.gbp-node { fill: #f8fafc; stroke: #1e293b; stroke-width: 2; }
.gbp-node-uncolored { fill: #e5e7eb; }
.gbp-node-current { stroke: #0f172a; stroke-width: 4; }
.gbp-node-frontier { stroke: #f59e0b; stroke-width: 3; stroke-dasharray: 4 3; }
.gbp-node-label { font-size: 12px; font-weight: 700; fill: #0f172a; }
.gbp-msg { font-family: monospace; font-size: 12px; color: #475569; min-height: 1.2em; text-align: center; }
```
(Node fill colors are set inline by the renderer; `.gbp-node-a`/`.gbp-node-b` are present as hooks/selectors for the e2e. The `.gbp-node-current`/`.gbp-node-frontier` strokes must still show over an inline fill — they set `stroke`, not `fill`, so they compose.)

- [ ] **Step 8: Run the e2e to verify it passes**

Run: `npx playwright test tests/graph_bipartite.spec.js`
Expected: PASS (4 tests). (The drawer-toggle assertion works because `codeDrawer:true`; the code is empty until Task 3 — that's fine.)

- [ ] **Step 9: Commit**

```bash
git add js/viz/viz_graph_bipartite.js tests/graph_bipartite.spec.js index.html js/app.js js/i18n.js style.css
git commit -m "feat(dsvisual): graph-bipartite renderer (VCR control) — 2-colouring, conflict edge, verdict + classes; wiring + i18n + e2e"
```

---

### Task 3: C++ source, description, smoke test, full verification

**Files:**
- Create: `cpp/graph_bipartite.cpp`
- Modify: `build_db.js` (mapping), `js/desc_db.js` (entry), `tests/smoke_modes.spec.js` (+id)
- Regenerate: `js/code_db.js` (via `node build_db.js` — do NOT hand-edit)

**Interfaces:**
- Consumes: the viz `code:()` reads global `codeGraphBipartite` (produced into `js/code_db.js` by `build_db.js`).
- Produces: `codeGraphBipartite` in `js/code_db.js`; a `graph-bipartite` `desc_db` entry; `graph-bipartite` in the smoke-mode list.

- [ ] **Step 1: Write the C++ source**

Create `cpp/graph_bipartite.cpp`:

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

    void addEdge(int u, int v) {
        adj[u].push_back(v);
        adj[v].push_back(u);
    }

    // BFS 2-colouring. Fills color[] with 0/1; returns true iff the graph is
    // bipartite (no edge joins two same-coloured vertices, i.e. no odd cycle).
    bool isBipartite(int color[]) {
        for (int i = 0; i < n; i++)
            color[i] = -1;
        for (int s = 0; s < n; s++) {
            if (color[s] != -1)
                continue;
            queue<int> q;
            q.push(s);
            color[s] = 0;
            while (!q.empty()) {
                int v = q.front();
                q.pop();
                for (int w : adj[v]) {
                    if (color[w] == -1) {
                        color[w] = 1 - color[v];
                        q.push(w);
                    } else if (color[w] == color[v]) {
                        return false; // odd cycle
                    }
                }
            }
        }
        return true;
    }
};

int main() {
    Graph g(6);          // C6: an even cycle -> bipartite
    g.addEdge(0, 1);
    g.addEdge(1, 2);
    g.addEdge(2, 3);
    g.addEdge(3, 4);
    g.addEdge(4, 5);
    g.addEdge(5, 0);

    int color[6];
    bool ok = g.isBipartite(color);
    cout << "bipartite = " << (ok ? "true" : "false") << "\n";
    if (ok)
        for (int i = 0; i < 6; i++)
            cout << "color[" << i << "] = " << color[i] << "\n";
    return 0;
}
```

- [ ] **Step 2: Register the mapping**

In `build_db.js`, next to `'graph_components.cpp': 'codeGraphComponents',` add:
```javascript
    'graph_bipartite.cpp': 'codeGraphBipartite',
```

- [ ] **Step 3: Regenerate the code DB**

Run: `node build_db.js`
Expected: `js/code_db.js` regenerated; `git diff --stat js/code_db.js` shows only the added `codeGraphBipartite` string (no unrelated churn — if there is churn from the concurrent session, STOP and report).

- [ ] **Step 4: Add the description entry**

In `js/desc_db.js`, next to the `'graph-components'` entry add:
```javascript
    'graph-bipartite': `
        <h3>Bipartite Check (2-Colouring)</h3>
        <p>A graph is <strong>bipartite</strong> if its vertices split into two disjoint sets <code>V&#8321;</code> and <code>V&#8322;</code> such that every edge joins a vertex in <code>V&#8321;</code> to one in <code>V&#8322;</code> — no edge lies within a set.</p>
        <hr>
        <ul>
            <li><strong>Odd-cycle theorem:</strong> a graph is bipartite <em>iff</em> it contains no odd-length cycle. Every tree and every even cycle is bipartite; a triangle (or any odd cycle) is not.</li>
            <li><strong>BFS 2-colouring:</strong> colour the start vertex A, then colour every neighbour the opposite colour level by level. If a vertex ever meets an already-coloured neighbour of the <em>same</em> colour, that edge closes an odd cycle → not bipartite.</li>
            <li><strong>Disconnected graphs:</strong> run the colouring from each uncoloured vertex; the whole graph is bipartite only if every component is.</li>
            <li><strong>Uses:</strong> bipartite matching (jobs&#8596;machines, students&#8596;courses), scheduling, and two-sided network models.</li>
        </ul>
        <div class="complexities">
            <span class="badge time">Time: O(n + e)</span>
            <span class="badge space">Space: O(n + e)</span>
        </div>
    `,
```

- [ ] **Step 5: Add to the smoke-mode list**

In `tests/smoke_modes.spec.js`, add `'graph-bipartite'` to `MODES` (next to `'graph-components'`).

- [ ] **Step 6: Verify the drawer shows the regenerated source**

Run: `npx playwright test tests/graph_bipartite.spec.js`
Expected: PASS (`codeGraphBipartite` now resolves; drawer toggle still green).

- [ ] **Step 7: Run the unit suite**

Run: `npm run test:unit`
Expected: PASS (incl. `graph_bipartite_viz.test.js`).

- [ ] **Step 8: Run the FULL Playwright suite**

Run: `npm test`
Expected: PASS — new `graph_bipartite.spec.js` + smoke `graph-bipartite` green; overview-tile count self-adjusts; `.overview-category` unchanged; no regressions.

- [ ] **Step 9: Commit**

```bash
git add cpp/graph_bipartite.cpp build_db.js js/code_db.js js/desc_db.js tests/smoke_modes.spec.js
git commit -m "feat(dsvisual): graph-bipartite C++ source, description, smoke mode; regen code_db; full verify"
```

---

## Self-Review

- **Spec coverage:** undirected BFS 2-coloring + default C6 (Task 1 SAMPLE + unit) ✓; stop-at-first-odd-cycle-edge with conflict frame last (Task 1 algorithm + unit) ✓; success lists V₁/V₂ (Task 1 classes + Task 2 verdict) ✓; VCR `buildFrameControls` stepping (Task 2 renderer + e2e scrubber) ✓; editable graph + ExamplesStore + built-in odd-cycle option (Task 2) ✓; codeDrawer (row flag + Task 3 code) ✓; scroll (`.gbp-scroll`) ✓; Traditional-zh msgs/labels/verdict ✓; i18n key up front (Task 2 Step 3) ✓; cpp/desc/smoke (Task 3) ✓; full Playwright (Task 3 Step 8) ✓.
- **Placeholder scan:** none — logic, renderer, CSS, both test files, cpp, desc all complete.
- **Type consistency:** `bipartiteFrames`→`{frames}`; `Frame.{color,current,frontier,newly,seed,conflict,bipartite,done,classes?,msg}` identical across logic, renderer (`gbpGraphSvg`/`verdictText`/`paint`), and unit tests; `SAMPLE`/`parseInput` signatures match; DOM `.gbp-*` contract consistent between renderer and e2e; `codeGraphBipartite` global name matches `build_db.js` mapping and the viz `code:()`; the VCR `paint(fr, i)` contract matches `buildFrameControls`.
```

