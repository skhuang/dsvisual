# graph-closure (Transitive Closure / Warshall) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `graph-closure` in the `graphs` category: a directed graph whose boolean reachability matrix is filled by Warshall's algorithm, stepped one cell-flip at a time, with a matrix grid beside a directed node-link panel that grows the transitively-added reachability edges — on the VCR `buildFrameControls`.

**Architecture:** Pure logic `js/graph_closure_viz.js` emits per-cell frames (no DOM); renderer `js/viz/viz_graph_closure.js` draws a directed node-link SVG + boolean matrix, stepped via `K().buildFrameControls(frames, paint, opts)`. One `METHOD_GROUPS` row, two `index.html` tags, `cpp` + `desc_db` + `i18n`, Playwright specs. Mirrors graph-matrix (dual view) + graph-components/bipartite (VCR `paint`).

**Tech Stack:** Vanilla JS (IIFE dual-export), inline SVG, `VizKit`/`VizRegistry`, `ExamplesStore`, `buildFrameControls`, Playwright + `node:test`.

## Global Constraints

- Viz #4 (final Phase 1) of the chap06 graph-viz program; spec `docs/superpowers/specs/2026-07-26-graph-closure-design.md`.
- Bilingual `msg`/labels; `zh` MUST be **Traditional (zh-Hant)** — never Simplified.
- **VCR control:** step via `K().buildFrameControls(frames, paint, {runIntervalMs})` — the control owns the cursor and calls `paint(frames[idx], idx)`; NO local idx/step/reset; fold per-frame `showStatus` into `paint`.
- `codeDrawer:true`; `ExamplesStore` saveable examples + a built-in "DAG" option; `overflow:auto` scroll.
- Honest stepping: matrix cells / node-link edges / pivot all map straight from frame fields.
- Add `method.graph-closure` to BOTH i18n dicts UP FRONT.
- **Concurrent refactor sessions:** stage with targeted `git add <path>` only — NEVER `-A`/`.`/`-u`; verify `git status` before each commit.
- Never hand-edit generated `js/code_db.js` (produced by `node build_db.js`).
- `graphs` category exists ⇒ `.overview-category` count unchanged; overview-tile count self-updating (PR #142) — confirm via FULL Playwright.
- Branch `feat/graph-closure` (already created). One PR.

---

### Task 1: Pure logic module + unit tests

**Files:**
- Create: `js/graph_closure_viz.js`
- Test: `tests/unit/graph_closure_viz.test.js`

**Interfaces — Produces:**
- `GraphClosureViz.SAMPLE = { n:4, edges:[{u:0,v:1},{u:1,v:2},{u:2,v:3},{u:3,v:1}] }`
- `GraphClosureViz.parseInput(nStr, edgesStr) → {n, edges:[{u,v}]}` (directed; drops malformed/out-of-range; clamp n≤10; ignores `:w`; self-loop `u-u` kept)
- `GraphClosureViz.closureFrames({n, edges}) → {frames}`, Frame = `{R:number[][] (0/1), k:number|null, cur:{i,j}|null, phase:'init'|'pivot'|'set'|'done', reach:[{u,v}], msg:{zh,en}}`

- [ ] **Step 1: Write the failing unit tests** — create `tests/unit/graph_closure_viz.test.js`:
```javascript
const test = require('node:test'); const assert = require('node:assert');
const G = require('../../js/graph_closure_viz.js');

function finalR(cfg){ const f = G.closureFrames(cfg).frames; return f[f.length-1].R; }

test('SAMPLE closure: chain + cycle 1-2-3 (diagonal 1 for 1,2,3; column 0 all zero)', () => {
  const R = finalR(G.SAMPLE);
  assert.strictEqual(R[0][3], 1);           // 0 reaches 3
  assert.strictEqual(R[0][0], 0);           // nothing reaches 0
  for (let i=0;i<4;i++) assert.strictEqual(R[i][0], 0);   // column 0 all zero
  assert.strictEqual(R[1][1], 1);           // cycle → self-reachable
  assert.strictEqual(R[2][2], 1);
  assert.strictEqual(R[3][3], 1);
  assert.strictEqual(R[3][2], 1);
});

test('DAG chain 0->1->2->3: strict upper triangle, all-zero diagonal', () => {
  const R = finalR({ n:4, edges:[{u:0,v:1},{u:1,v:2},{u:2,v:3}] });
  assert.strictEqual(R[0][3], 1);
  for (let i=0;i<4;i++) assert.strictEqual(R[i][i], 0);   // no cycle → empty diagonal
  assert.strictEqual(R[3][0], 0);
});

test('2-cycle 0<->1: diagonal set for both', () => {
  const R = finalR({ n:2, edges:[{u:0,v:1},{u:1,v:0}] });
  assert.strictEqual(R[0][0], 1); assert.strictEqual(R[1][1], 1);
});

test('per-cell frames: one pivot per k; set frames = final ones - initial ones; each cell flips once', () => {
  const { frames } = G.closureFrames(G.SAMPLE);
  assert.strictEqual(frames.filter(f => f.phase==='pivot').length, 4);   // n pivot frames
  const init = frames[0].R, fin = frames[frames.length-1].R;
  const count = (M)=>M.flat().reduce((s,x)=>s+x,0);
  const sets = frames.filter(f => f.phase==='set').length;
  assert.strictEqual(sets, count(fin) - count(init));                    // each 0→1 once
  frames.filter(f=>f.phase==='set').forEach(f => {                       // cur cell is 1 here
    assert.strictEqual(f.R[f.cur.i][f.cur.j], 1);
  });
  assert.ok(frames.length <= 4*4 + 4 + 2);                               // ≤ n²+n+2
  frames.forEach(f => { assert.ok(f.msg.zh && f.msg.en); });
});

test('parseInput directed: 0-1 != 1-0; drops malformed/out-of-range; keeps self-loop', () => {
  const a = G.parseInput('2','0-1'); const b = G.parseInput('2','1-0');
  assert.deepStrictEqual(a.edges, [{u:0,v:1}]);
  assert.deepStrictEqual(b.edges, [{u:1,v:0}]);
  const r = G.parseInput('3', ' 0-1 , 2-2 , 9-1 , junk , 1-2:5 ');
  assert.strictEqual(r.n, 3);
  assert.deepStrictEqual(r.edges, [{u:0,v:1},{u:2,v:2},{u:1,v:2}]);      // 9-1 out of range & junk dropped, :5 ignored, self-loop kept
});
```

- [ ] **Step 2: Run to verify they fail** — `node --test tests/unit/graph_closure_viz.test.js` → FAIL (module missing).

- [ ] **Step 3: Implement the logic module** — create `js/graph_closure_viz.js`:
```javascript
(function (global) {
  'use strict';
  const SAMPLE = { n: 4, edges: [{u:0,v:1},{u:1,v:2},{u:2,v:3},{u:3,v:1}] };

  function parseInput(nStr, edgesStr) {
    let n = parseInt(nStr, 10); if (!Number.isFinite(n) || n < 1) n = 1; if (n > 10) n = 10;
    const edges = [];
    String(edgesStr || '').split(',').forEach((tok) => {
      const m = /^\s*(\d+)\s*-\s*(\d+)\s*(?::\s*\d+)?\s*$/.exec(tok);
      if (!m) return;
      const u = +m[1], v = +m[2];
      if (u < 0 || v < 0 || u >= n || v >= n) return;
      edges.push({ u, v });                 // directed
    });
    return { n, edges };
  }

  function closureFrames(cfg) {
    const n = cfg.n, edges = cfg.edges || [];
    const R = Array.from({ length: n }, () => Array(n).fill(0));
    const orig = Array.from({ length: n }, () => Array(n).fill(0));
    edges.forEach((e) => { if (e.u < n && e.v < n) { R[e.u][e.v] = 1; orig[e.u][e.v] = 1; } });
    const frames = [];
    const snap = () => R.map((r) => r.slice());
    function reachEdges() {
      const out = [];
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++)
        if (i !== j && R[i][j] && !orig[i][j]) out.push({ u: i, v: j });
      return out;
    }
    frames.push({ R: snap(), k: null, cur: null, phase: 'init', reach: [],
      msg: { zh: '從相鄰矩陣開始（R = 直接邊）。', en: 'Start from the adjacency matrix (R = direct edges).' } });
    for (let k = 0; k < n; k++) {
      frames.push({ R: snap(), k: k, cur: null, phase: 'pivot', reach: reachEdges(),
        msg: { zh: '以頂點 ' + k + ' 為中介點（pivot）：尋找 i → ' + k + ' → j 的路徑。',
               en: 'Pivot on vertex ' + k + ': look for paths i → ' + k + ' → j.' } });
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        if (!R[i][j] && R[i][k] && R[k][j]) {
          R[i][j] = 1;
          frames.push({ R: snap(), k: k, cur: { i: i, j: j }, phase: 'set', reach: reachEdges(),
            msg: { zh: 'R[' + i + '][' + j + '] ← 1：因為 R[' + i + '][' + k + '] 且 R[' + k + '][' + j + ']（' + i + ' 可經由 ' + k + ' 到達 ' + j + '）。',
                   en: 'R[' + i + '][' + j + '] ← 1: since R[' + i + '][' + k + '] and R[' + k + '][' + j + '] (' + i + ' reaches ' + j + ' via ' + k + ').' } });
        }
      }
    }
    frames.push({ R: snap(), k: null, cur: null, phase: 'done', reach: reachEdges(),
      msg: { zh: '遞移閉包完成：R[i][j]=1 表示 i 可到達 j。', en: 'Transitive closure complete: R[i][j]=1 means i can reach j.' } });
    return { frames: frames };
  }

  const api = { SAMPLE, parseInput, closureFrames };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.GraphClosureViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 4: Run to verify pass** — `node --test tests/unit/graph_closure_viz.test.js` → PASS (5 tests).
- [ ] **Step 5: Commit**
```bash
git add js/graph_closure_viz.js tests/unit/graph_closure_viz.test.js
git commit -m "feat(dsvisual): graph-closure pure logic — Warshall per-cell closure frames + unit tests"
```

---

### Task 2: Renderer (VCR) + wiring + i18n + CSS + e2e

**Files:**
- Create: `js/viz/viz_graph_closure.js`
- Modify: `index.html` (two tags), `js/app.js` (one METHOD_GROUPS row), `js/i18n.js` (two keys), `style.css` (`.gcl-*`)
- Test: `tests/graph_closure.spec.js`

**Interfaces:**
- Consumes: `GraphClosureViz.{SAMPLE,parseInput,closureFrames}`; `VizKit.{acquireDynamicVizHost,buildFrameControls,langOf,showStatus}`; `ExamplesStore`; `VizRegistry.attach`.
- Produces: registered `graph-closure`; DOM contract for e2e — `.gcl-wrap/.gcl-controls/.gcl-n/.gcl-edges/.gcl-apply/.ex-select/.gcl-scroll/.gcl-graph/.gcl-matrix/.gcl-msg`; SVG `.gcl-node`(+`.gcl-node-pivot`), `.gcl-edge`/`.gcl-edge-added`/`.gcl-edge-cur`; matrix `.gcl-cell`(+`.gcl-pivot`/`.gcl-src`/`.gcl-added`); VCR bar `.stepctl [data-action="step"]` + `.stepctl-scrubber`.

- [ ] **Step 1: Write the failing e2e spec** — create `tests/graph_closure.spec.js`:
```javascript
const { test, expect } = require('@playwright/test'); const path = require('path');
const FILE_URI = 'file://' + path.resolve(__dirname, '../index.html');

test.describe('graph-closure', () => {
  test('renders dual view + VCR bar; stepping marks pivot & added cell/edge', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=graph-closure');
    await expect(page.locator('.gcl-wrap')).toBeVisible();
    await expect(page.locator('.gcl-graph .gcl-node').first()).toBeVisible();
    await expect(page.locator('.gcl-matrix .gcl-cell').first()).toBeVisible();
    await expect(page.locator('.stepctl .stepctl-scrubber')).toBeVisible();
    // run to the end via scrubber → closure complete
    const scrub = page.locator('.stepctl .stepctl-scrubber');
    await scrub.evaluate((el) => { el.value = el.max; el.dispatchEvent(new Event('input', { bubbles: true })); });
    // default sample: R[0][3]=1 and diagonal R[1][1]=1 (cycle)
    await expect(page.locator('.gcl-matrix .gcl-cell[data-i="0"][data-j="3"]')).toHaveText('1');
    await expect(page.locator('.gcl-matrix .gcl-cell[data-i="1"][data-j="1"]')).toHaveText('1');
    await expect(page.locator('.gcl-graph .gcl-edge-added').first()).toBeVisible();  // transitively-added edges drawn
    await expect(page.locator('[data-method-section="graph-closure"] .code-drawer-toggle')).toBeVisible();
  });

  test('a pivot frame highlights the pivot vertex, a set frame highlights an added cell', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=graph-closure');
    const step = page.locator('.stepctl [data-action="step"]');
    await step.click();                                   // init -> first pivot frame
    await expect(page.locator('.gcl-graph .gcl-node-pivot')).toHaveCount(1);
    for (let i = 0; i < 40; i++) await step.click();      // reach a set frame / the end
    await expect(page.locator('.gcl-matrix .gcl-cell.gcl-added, .gcl-matrix .gcl-cell[data-i="0"][data-j="3"]').first()).toBeVisible();
  });

  test('built-in DAG example → no diagonal cell set', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=graph-closure');
    await page.selectOption('.ex-select', { label: 'DAG (chain)' });
    const scrub = page.locator('.stepctl .stepctl-scrubber');
    await scrub.evaluate((el) => { el.value = el.max; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await expect(page.locator('.gcl-matrix .gcl-cell[data-i="0"][data-j="3"]')).toHaveText('1');
    await expect(page.locator('.gcl-matrix .gcl-cell[data-i="0"][data-j="0"]')).toHaveText('0');   // DAG → empty diagonal
  });

  test('editable directed input + Apply updates graph and saves an example', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=graph-closure');
    const before = await page.locator('.ex-select option').count();
    await page.locator('.gcl-n').fill('3');
    await page.locator('.gcl-edges').fill('0-1,1-2');
    await page.locator('.gcl-apply').click();
    await expect(page.locator('.gcl-graph .gcl-node')).toHaveCount(3);
    await expect(page.locator('.ex-select option')).toHaveCount(before + 1);
    await expect(page.locator('.gcl-scroll')).toBeVisible();
  });
});
```

- [ ] **Step 2: Run to verify fail** — `npx playwright test tests/graph_closure.spec.js` → FAIL (method unregistered).

- [ ] **Step 3: i18n keys (both dicts, up front)** — in `js/i18n.js`, next to `method.graph-bipartite` add en `'method.graph-closure': 'Transitive Closure',` and zh `'method.graph-closure': '遞移閉包',` (Traditional).

- [ ] **Step 4: METHOD_GROUPS row** — in `js/app.js` `graphs` group, after the `graph-bipartite` row add:
```javascript
            { id: 'graph-closure', title: 'Transitive Closure', file: 'graph_closure.cpp', visualizer: 'graph-closure', controls: 'graph-closure', codeDrawer: true },
```

- [ ] **Step 5: Two script tags** — in `index.html`, after the two `graph_bipartite` tags:
```html
    <script src="js/graph_closure_viz.js" defer></script>
    <script src="js/viz/viz_graph_closure.js" defer></script>
```

- [ ] **Step 6: Write the renderer** — create `js/viz/viz_graph_closure.js` (modeled on `js/viz/viz_graph_matrix.js` for the directed SVG + matrix grid, and `js/viz/viz_graph_components.js` for the VCR `paint`):
```javascript
(function (global) {
  'use strict';
  const K = () => global.VizKit;

  // Examples-helper trio — duplicated from viz_graph_matrix.js per program convention; do NOT refactor.
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
    loadExamples(methodId).forEach((e) => { if (e.text === defaultText) return;
      h += '<option value="' + escAttr(e.text) + '">' + escText(trunc(e.text)) + '</option>'; });
    h += '</select>';
    return h;
  }

  function edgesToStr(edges) { return edges.map((e) => e.u + '-' + e.v).join(','); }
  function serialize(st) { return st.n + '|' + edgesToStr(st.edges); }
  function deserialize(text) {
    const parts = String(text).split('|');
    const parsed = global.GraphClosureViz.parseInput(parts[0], parts.slice(1).join('|'));
    return { n: parsed.n, edges: parsed.edges };
  }
  const DEFAULT_SERIALIZED = serialize(global.GraphClosureViz.SAMPLE);
  const DAG_SERIALIZED = '4|0-1,1-2,2-3';                    // built-in acyclic example (empty diagonal)

  const _st = { n: global.GraphClosureViz.SAMPLE.n, edges: global.GraphClosureViz.SAMPLE.edges.slice() };

  // Directed node-link SVG: n nodes on a circle, arrowheads; original edges solid, added closure
  // edges (frame.reach, i≠j) dashed, the current set edge highlighted, pivot vertex ringed.
  function gclGraphSvg(n, origEdges, frame) {
    const CX = 130, CY = 130, R = 100, NR = 16;
    const pos = [];
    for (let i = 0; i < n; i++) { const a = -Math.PI/2 + i*2*Math.PI/Math.max(n,1); pos.push({ x: CX + R*Math.cos(a), y: CY + R*Math.sin(a) }); }
    const origSet = new Set(origEdges.map((e) => e.u + '>' + e.v));
    const cur = frame.cur;
    let svg = '<svg viewBox="0 0 260 260" width="260" height="260" class="gcl-svg">' +
      '<defs><marker id="gcl-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#64748b"/></marker>' +
      '<marker id="gcl-arrow-add" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#a855f7"/></marker></defs>';
    function line(u, v, cls, marker) {
      const a = pos[u], b = pos[v]; if (!a || !b || u === v) return '';   // self-loops shown in matrix only
      const dx = b.x-a.x, dy = b.y-a.y, len = Math.hypot(dx,dy)||1, ux = dx/len, uy = dy/len;
      const x1 = a.x+ux*NR, y1 = a.y+uy*NR, x2 = b.x-ux*(NR+6), y2 = b.y-uy*(NR+6);
      return '<line class="' + cls + '" x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" marker-end="url(#'+marker+')"/>';
    }
    // added (dashed) first, then original (solid) on top
    (frame.reach || []).forEach((e) => {
      const isCur = cur && cur.i === e.u && cur.j === e.v;
      svg += line(e.u, e.v, 'gcl-edge-added' + (isCur ? ' gcl-edge-cur' : ''), 'gcl-arrow-add');
    });
    origEdges.forEach((e) => { svg += line(e.u, e.v, 'gcl-edge', 'gcl-arrow'); });
    pos.forEach((p, i) => {
      const cls = 'gcl-node' + (frame.k === i ? ' gcl-node-pivot' : '');
      svg += '<circle class="' + cls + '" cx="'+p.x+'" cy="'+p.y+'" r="'+NR+'"/>' +
             '<text class="gcl-node-label" x="'+p.x+'" y="'+(p.y+5)+'" text-anchor="middle">'+i+'</text>';
    });
    return svg + '</svg>';
  }

  // Matrix grid (floyd-grid style): pivot row k / col k tinted; for a set frame, the two source cells
  // R[i][k] & R[k][j] marked, and the just-set cell R[i][j] marked.
  function gclMatrixHtml(frame, n) {
    const M = frame.R, k = frame.k, cur = frame.cur;
    let html = '<div class="gcl-grid" style="grid-template-columns: repeat(' + (n+1) + ', 34px);">';
    html += '<div class="gcl-hcell"></div>';
    for (let j = 0; j < n; j++) html += '<div class="gcl-hcell' + (k === j ? ' gcl-pivot' : '') + '">' + j + '</div>';
    for (let i = 0; i < n; i++) {
      html += '<div class="gcl-hcell' + (k === i ? ' gcl-pivot' : '') + '">' + i + '</div>';
      for (let j = 0; j < n; j++) {
        let cls = 'gcl-cell' + (M[i][j] ? '' : ' gcl-zero');
        if (k === i || k === j) cls += ' gcl-pivot';
        if (cur) {
          if (i === cur.i && j === cur.j) cls += ' gcl-added';
          else if ((i === cur.i && j === k) || (i === k && j === cur.j)) cls += ' gcl-src';
        }
        html += '<div class="' + cls + '" data-i="'+i+'" data-j="'+j+'">' + (M[i][j] || 0) + '</div>';
      }
    }
    return html + '</div>';
  }

  function renderGraphClosure() {
    const host = K().acquireDynamicVizHost();
    host.innerHTML =
      '<div class="gcl-wrap">' +
        '<div class="gcl-controls">' +
          '<label>n <input type="text" class="gcl-n" value="' + _st.n + '"></label>' +
          '<label>edges (u-v, directed) <input type="text" class="gcl-edges" value="' + edgesToStr(_st.edges) + '"></label>' +
          '<button type="button" class="gcl-apply">套用 Apply</button>' +
          buildExamplesSelect('graph-closure', DEFAULT_SERIALIZED) +
        '</div>' +
        '<div class="gcl-scroll"><div class="gcl-graph"></div><div class="gcl-matrix"></div></div>' +
        '<div class="gcl-msg" data-testid="gcl-msg">&nbsp;</div>' +
      '</div>';

    const wrap = host.querySelector('.gcl-wrap');
    const graphEl = wrap.querySelector('.gcl-graph');
    const matrixEl = wrap.querySelector('.gcl-matrix');
    const msgEl = wrap.querySelector('.gcl-msg');

    // built-in DAG example option after Default
    const exSelect = wrap.querySelector('.ex-select');
    if (exSelect && !Array.from(exSelect.options).some((o) => o.value === DAG_SERIALIZED)) {
      const lang = (global.I18N && I18N.getCurrentLanguage) ? I18N.getCurrentLanguage() : 'en';
      const opt = document.createElement('option');
      opt.value = DAG_SERIALIZED; opt.textContent = lang === 'zh' ? '有向無環圖 (鏈)' : 'DAG (chain)';
      exSelect.insertBefore(opt, exSelect.options[2] || null);
    }

    const frames = global.GraphClosureViz.closureFrames(_st).frames;
    function paint(fr, i) {
      graphEl.innerHTML = gclGraphSvg(_st.n, _st.edges, fr);
      matrixEl.innerHTML = gclMatrixHtml(fr, _st.n);
      msgEl.textContent = K().langOf(fr.msg);
      K().showStatus(K().langOf(fr.msg), fr.phase === 'done' ? '#34d399' : (fr.phase === 'set' ? '#a855f7' : '#60a5fa'));
    }
    wrap.appendChild(K().buildFrameControls(frames, paint, { runIntervalMs: 700 }));

    wrap.querySelector('.gcl-apply').addEventListener('click', function () {
      const parsed = global.GraphClosureViz.parseInput(wrap.querySelector('.gcl-n').value, wrap.querySelector('.gcl-edges').value);
      _st.n = parsed.n; _st.edges = parsed.edges;
      saveExample('graph-closure', serialize(_st), DEFAULT_SERIALIZED);
      renderGraphClosure();
    });
    if (exSelect) exSelect.addEventListener('change', function (ev) {
      const v = ev.target.value; if (!v) return;
      const parsed = deserialize(v); _st.n = parsed.n; _st.edges = parsed.edges;
      renderGraphClosure();
    });
  }

  global.VizRegistry.attach('graph-closure', {
    render: renderGraphClosure,
    code: () => (typeof codeGraphClosure !== 'undefined' ? codeGraphClosure : ''),
    layout: { host: 'dynamic' },
  });
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 7: CSS** — in `style.css`, after the `.gbp-*` block add:
```css
.gcl-wrap { display: flex; flex-direction: column; gap: 10px; align-items: center; }
.gcl-controls { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; font-size: 13px; color: #475569; }
.gcl-controls label { display: flex; align-items: center; gap: 4px; }
.gcl-controls input[type="text"] { width: 120px; font-family: monospace; }
.gcl-scroll { overflow: auto; max-height: 440px; width: 100%; display: flex; flex-wrap: wrap; gap: 16px; justify-content: center; align-items: flex-start; }
.gcl-graph { display: flex; justify-content: center; padding: 4px 0; }
.gcl-svg { max-width: 260px; }
.gcl-edge { stroke: #64748b; stroke-width: 2; }
.gcl-edge-added { stroke: #a855f7; stroke-width: 2; stroke-dasharray: 5 3; }
.gcl-edge-cur { stroke-width: 3.5; }
.gcl-node { fill: #f8fafc; stroke: #1e293b; stroke-width: 2; }
.gcl-node-pivot { fill: #fde68a; stroke: #b45309; stroke-width: 3; }
.gcl-node-label { font-size: 12px; font-weight: 700; fill: #0f172a; }
.gcl-grid { display: grid; gap: 3px; }
.gcl-hcell { height: 30px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: #64748b; }
.gcl-cell { height: 30px; display: flex; align-items: center; justify-content: center; font-family: monospace; font-size: 13px; border: 1px solid #e2e8f0; border-radius: 4px; }
.gcl-cell.gcl-zero { color: #cbd5e1; }
.gcl-cell.gcl-pivot, .gcl-hcell.gcl-pivot { background: #fef3c7; }
.gcl-cell.gcl-src { box-shadow: inset 0 0 0 2px #60a5fa; }
.gcl-cell.gcl-added { background: #f3e8ff; border-color: #a855f7; font-weight: 700; }
.gcl-msg { font-family: monospace; font-size: 12px; color: #475569; min-height: 1.2em; text-align: center; }
```

- [ ] **Step 8: Run e2e to verify pass** — `npx playwright test tests/graph_closure.spec.js` → PASS (4 tests). (Drawer body empty until Task 3 — the e2e only checks the toggle exists.)

- [ ] **Step 9: Commit**
```bash
git add js/viz/viz_graph_closure.js tests/graph_closure.spec.js index.html js/app.js js/i18n.js style.css
git commit -m "feat(dsvisual): graph-closure renderer (VCR) — Warshall dual view, pivot + dashed reachability; wiring + i18n + e2e"
```

---

### Task 3: C++ source, description, smoke test, full verification

**Files:**
- Create: `cpp/graph_closure.cpp`
- Modify: `build_db.js` (mapping), `js/desc_db.js` (entry), `tests/smoke_modes.spec.js` (+id)
- Regenerate: `js/code_db.js` (via `node build_db.js` — do NOT hand-edit)

**Interfaces:** the viz `code:()` reads global `codeGraphClosure` (produced into `js/code_db.js` by `build_db.js`).

- [ ] **Step 1: C++ source** — create `cpp/graph_closure.cpp`:
```cpp
#include <iostream>
using namespace std;

const int MAXN = 10;

// Warshall's transitive closure: R[i][j] = 1 iff j is reachable from i via >= 1 edge.
// R is initialized to the adjacency matrix; R[i][i] becomes 1 only if i lies on a cycle.
void warshall(int R[MAXN][MAXN], int n) {
    for (int k = 0; k < n; k++)
        for (int i = 0; i < n; i++)
            for (int j = 0; j < n; j++)
                if (R[i][k] && R[k][j])
                    R[i][j] = 1;
}

int main() {
    int n = 4;                    // SAMPLE: 0->1, 1->2, 2->3, 3->1 (chain + cycle 1-2-3)
    int R[MAXN][MAXN] = {};
    R[0][1] = R[1][2] = R[2][3] = R[3][1] = 1;

    warshall(R, n);

    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++)
            cout << R[i][j] << (j + 1 < n ? " " : "");
        cout << "\n";
    }
    return 0;
}
```

- [ ] **Step 2: build_db mapping** — in `build_db.js`, next to `'graph_bipartite.cpp': 'codeGraphBipartite',` add:
```javascript
    'graph_closure.cpp': 'codeGraphClosure',
```

- [ ] **Step 3: Regenerate** — `node build_db.js`; `git diff --stat js/code_db.js` shows only the added `codeGraphClosure` string (no churn — if churn from a concurrent session, STOP and report).

- [ ] **Step 4: desc_db entry** — in `js/desc_db.js`, next to `'graph-bipartite'` add:
```javascript
    'graph-closure': `
        <h3>Transitive Closure (Warshall)</h3>
        <p>The <strong>transitive closure</strong> R&#8314; of a directed graph records reachability: <code>R[i][j] = 1</code> iff vertex <code>j</code> is reachable from vertex <code>i</code> via a path of one or more edges.</p>
        <hr>
        <ul>
            <li><strong>Warshall's algorithm:</strong> start with <code>R</code> = the adjacency matrix, then for each intermediate vertex <code>k</code> set <code>R[i][j] |= R[i][k] &amp; R[k][j]</code> — if <code>i</code> reaches <code>k</code> and <code>k</code> reaches <code>j</code>, then <code>i</code> reaches <code>j</code>.</li>
            <li><strong>Pivot order matters not:</strong> after all <code>n</code> pivots, <code>R</code> is the full closure regardless of order.</li>
            <li><strong>Diagonal &amp; cycles:</strong> <code>R[i][i]</code> becomes 1 exactly when vertex <code>i</code> lies on a directed cycle.</li>
            <li><strong>Relation to Floyd-Warshall:</strong> the same triple loop; Floyd-Warshall replaces boolean OR/AND with min/＋ over edge weights to get shortest paths.</li>
        </ul>
        <div class="complexities">
            <span class="badge time">Time: O(n&sup3;)</span>
            <span class="badge space">Space: O(n&sup2;)</span>
        </div>
    `,
```

- [ ] **Step 5: smoke mode** — in `tests/smoke_modes.spec.js`, add `'graph-closure'` to `MODES` (next to `'graph-bipartite'`).

- [ ] **Step 6: Drawer shows source** — `npx playwright test tests/graph_closure.spec.js` → PASS (`codeGraphClosure` now resolves).
- [ ] **Step 7: Unit suite** — `npm run test:unit` → green (incl. graph_closure_viz).
- [ ] **Step 8: FULL Playwright** — `npm test` → green incl. new spec + smoke `graph-closure`; overview-tile count self-adjusts; `.overview-category` unchanged; no regressions.
- [ ] **Step 9: Commit**
```bash
git add cpp/graph_closure.cpp build_db.js js/code_db.js js/desc_db.js tests/smoke_modes.spec.js
git commit -m "feat(dsvisual): graph-closure C++ (Warshall), description, smoke mode; regen code_db; full verify"
```

---

## Self-Review

- **Spec coverage:** directed graph + Warshall R⁺ (Task 1 SAMPLE + unit) ✓; per-cell stepping with pivot frames + bound n²+n+2 (Task 1 frames + unit) ✓; matrix + directed node-link dual view with pivot / added-dashed / cur (Task 2 renderer + e2e) ✓; cycle→diagonal & DAG→empty-diagonal (unit + e2e DAG example) ✓; VCR `buildFrameControls` (Task 2 + e2e scrubber) ✓; editable directed graph + ExamplesStore + built-in DAG (Task 2) ✓; codeDrawer (row flag + Task 3 code) ✓; scroll (`.gcl-scroll`) ✓; Traditional-zh (`遞移閉包`) ✓; i18n up front (Task 2 Step 3) ✓; cpp/desc/smoke (Task 3) ✓; full Playwright (Task 3 Step 8) ✓.
- **Placeholder scan:** none — logic, renderer, CSS, both test files, cpp, desc all complete.
- **Type consistency:** `closureFrames`→`{frames}`; Frame `{R,k,cur,phase,reach,msg}` identical across logic, renderer (`gclGraphSvg`/`gclMatrixHtml`/`paint`), and unit tests; `SAMPLE`/`parseInput` signatures match; DOM `.gcl-*` contract consistent between renderer and e2e; `codeGraphClosure` global name matches `build_db.js` mapping and the viz `code:()`; the VCR `paint(fr, i)` contract matches `buildFrameControls`.
```

