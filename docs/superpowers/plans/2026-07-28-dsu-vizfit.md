# tree-dsu → scripted op-sequence + SVG forest (vizfit-svg) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `tree-dsu` from live union/find buttons into a scripted union/find op sequence stepped on the VCR, rendered as a single viewBox SVG forest (nodes + child→parent edges, roots + ranks) on the vizfit `viz-fit-svg` path, with hidden C++, editable op input, saveable examples, and a difficulty-aware 🎲.

**Architecture:** A new pure module `js/dsu_viz.js` (`parseOps`/`buildFrames`/`randomInput`/`SAMPLE`, dual-exported for node + browser) holds all DSU logic and frame generation (union-by-rank + path-compression, one frame per op + an init frame). The renderer `js/viz/viz_dsu.js` is rewritten to lay out the forest from each frame's `parent[]` and paint one viewBox `<svg>` per frame, reusing the game-tree/threaded viewBox-SVG + vizfit-svg pattern verbatim (examples trio, `markFocusFit(host,{svg:true})`, `fitFocusSize`, `buildFrameControls`).

**Tech Stack:** Vanilla ES5-style IIFE modules; VizKit/VizRegistry seam; ExamplesStore; Playwright (e2e) + node:test (unit).

## Global Constraints

- Targeted `git add` by explicit path only; never `-A`/`.`/`-u`; verify `git status` first.
- Never hand-edit generated files (`js/code_db.js`, `slides/**`, `js/slides_rendered.js`).
- `viz-fit-svg` path: `K().markFocusFit(host,{svg:true})` + `K().fitFocusSize(scrollEl,natW,natH)` for the single SVG. `.vizfit-host` MUST be a direct child of `#dynamic-viz-host`; `.dsu-svg` the sole child of `.vizfit-scroll`; `.dsu-info` + VCR later DOM siblings of `.vizfit-scroll`.
- Do NOT modify the shared `.tree-node` base class. Examples-helper trio duplicated per convention (do NOT refactor). `randomInput` is per-module (no shared `RandomInput` registry entry for tree-dsu).
- A NEW pure module needs its OWN `index.html` `<script defer>` tag (easy to forget).
- Traditional-zh where the viz emits zh. Non-focus mode + other viz UNCHANGED.
- e2e: assert counts / class presence / value regex / width attribute — NEVER SVG edge visibility (zero-bbox lines fail `toBeVisible`).
- Full Playwright green before merge. This is the LAST viz of the trie-parity program (6/6).

## File Structure

- **Create** `js/dsu_viz.js` — pure DSU logic + frame builder + random generator (browser global `DsuViz` + `module.exports`).
- **Create** `tests/unit/dsu_viz.test.js` — unit tests for the pure module.
- **Create** `tests/dsu_vizfit.spec.js` — e2e for the rebuilt viz.
- **Rewrite** `js/viz/viz_dsu.js` — viewBox-SVG forest renderer on the vizfit-svg path.
- **Modify** `index.html` — add the `js/dsu_viz.js` script tag before `js/viz/viz_dsu.js`.
- **Modify** `js/app.js` — add `codeDrawer: true` to the `tree-dsu` row.
- **Modify** `style.css` — replace the HTML-forest `.dsu-*` block with SVG-forest styling.

---

### Task 1: Pure module `js/dsu_viz.js` + unit tests

**Files:**
- Create: `js/dsu_viz.js`
- Test: `tests/unit/dsu_viz.test.js`

**Interfaces:**
- Consumes: nothing (self-contained; `Math.random` for `randomInput`).
- Produces (browser global `DsuViz` + CommonJS export):
  - `parseOps(text: string) → { n: number, ops: Array<{kind:'union',a,b} | {kind:'find',x}> }`
  - `buildFrames({ n, ops }) → { frames: Array<Frame> }` where
    `Frame = { kind:'init'|'union'|'find', op:{a,b}|{x}|null, parent:number[], rank:number[], highlight:number[], roots:{small,large}|null, found:number|null, msg:{zh:string,en:string} }`
  - `randomInput(difficulty: string) → string` (an op string `parseOps` accepts)
  - `SAMPLE = 'U0 1; U2 3; U0 2; U4 5; F3; U6 7'` (references indices 0..7 → `n=8`)

- [ ] **Step 1: Write the failing unit test**

Create `tests/unit/dsu_viz.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert');
const D = require('../../js/dsu_viz.js');

test('parseOps: compact + long forms; n = maxIndex+1 clamped [2,12]; drops malformed/out-of-range', () => {
  const a = D.parseOps('U0 1; U2 3; F3');
  assert.strictEqual(a.n, 4);
  assert.deepStrictEqual(a.ops, [
    { kind: 'union', a: 0, b: 1 }, { kind: 'union', a: 2, b: 3 }, { kind: 'find', x: 3 },
  ]);
  // long forms + newlines + case-insensitive + extra whitespace
  const b = D.parseOps('union 0 1\nFIND 1');
  assert.deepStrictEqual(b.ops, [{ kind: 'union', a: 0, b: 1 }, { kind: 'find', x: 1 }]);
  // malformed dropped; no valid index → n floor 2
  assert.deepStrictEqual(D.parseOps('hello; U; F').ops, []);
  assert.strictEqual(D.parseOps('').n, 2);
  // clamp high + drop out-of-range ops
  const c = D.parseOps('U0 20; F15');
  assert.strictEqual(c.n, 12);
  assert.strictEqual(c.ops.length, 0);
});

test('SAMPLE parses to n=8 with 6 ops', () => {
  const s = D.parseOps(D.SAMPLE);
  assert.strictEqual(s.n, 8);
  assert.strictEqual(s.ops.length, 6);
});

test('buildFrames: init frame + one frame per op; bilingual msg', () => {
  const spec = D.parseOps(D.SAMPLE);
  const { frames } = D.buildFrames(spec);
  assert.strictEqual(frames.length, spec.ops.length + 1);
  assert.strictEqual(frames[0].kind, 'init');
  frames.forEach((f) => {
    assert.ok(f.msg && typeof f.msg.zh === 'string' && typeof f.msg.en === 'string', 'bilingual msg');
    assert.strictEqual(f.parent.length, spec.n);
    assert.strictEqual(f.rank.length, spec.n);
  });
});

test('buildFrames: final parent[] groups SAMPLE sets correctly', () => {
  const { frames } = D.buildFrames(D.parseOps(D.SAMPLE));
  const p = frames[frames.length - 1].parent;
  const root = (x) => { while (p[x] !== x) x = p[x]; return x; };
  // SAMPLE: {0,1,2,3} together, {4,5} together, {6,7} together
  assert.strictEqual(root(0), root(3));
  assert.strictEqual(root(1), root(2));
  assert.strictEqual(root(4), root(5));
  assert.strictEqual(root(6), root(7));
  assert.notStrictEqual(root(0), root(4));
  assert.notStrictEqual(root(0), root(6));
  assert.notStrictEqual(root(4), root(6));
});

test('buildFrames: find compresses a depth-2 node onto its root; union-by-rank keeps larger root', () => {
  // U0 1 -> rank[0]=1,parent[1]=0 ; U2 3 -> rank[2]=1,parent[3]=2 ;
  // U0 2 -> equal rank -> 2 under 0, rank[0]=2, parent[2]=0 (so 3 is depth 2: 3->2->0) ; F3 compresses 3->0
  const { frames } = D.buildFrames(D.parseOps('U0 1; U2 3; U0 2; F3'));
  const last = frames[frames.length - 1];
  assert.strictEqual(last.kind, 'find');
  assert.strictEqual(last.found, 0);
  assert.strictEqual(last.parent[3], 0, 'node 3 repointed straight to root 0');
  assert.strictEqual(last.parent[0], 0, 'root 0 unchanged');
  // union by rank: after U0 2 the root is 0 (the taller tree), not 2
  const afterU02 = frames[3]; // init,U0 1,U2 3,U0 2
  assert.strictEqual(afterU02.parent[2], 0);
});

test('buildFrames: frame snapshots are isolated (mutating one does not affect another)', () => {
  const { frames } = D.buildFrames(D.parseOps(D.SAMPLE));
  frames[frames.length - 1].parent[0] = 999;
  assert.notStrictEqual(frames[0].parent[0], 999);
});

test('randomInput: every difficulty yields a parseable op string with in-range indices', () => {
  for (const d of ['normal', 'special', 'edge', 'large']) {
    for (let i = 0; i < 8; i++) {
      const str = D.randomInput(d);
      assert.strictEqual(typeof str, 'string', d + ' returns string');
      const spec = D.parseOps(str);
      assert.ok(spec.ops.length >= 1, d + ' has >=1 op: ' + str);
      spec.ops.forEach((o) => {
        if (o.kind === 'union') { assert.ok(o.a < spec.n && o.b < spec.n, d + ' union in range'); }
        else { assert.ok(o.x < spec.n, d + ' find in range'); }
      });
      assert.doesNotThrow(() => D.buildFrames(spec), d + ' builds frames');
    }
  }
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/unit/dsu_viz.test.js`
Expected: FAIL — `Cannot find module '../../js/dsu_viz.js'`.

- [ ] **Step 3: Write `js/dsu_viz.js`**

Create `js/dsu_viz.js`:

```js
(function (global) {
  'use strict';

  // Parse a scripted op string into { n, ops }.
  // Segments split on ';' or newlines. Each segment:
  //   union: "U a b" | "U0 1" | "union 0 1"   find: "F x" | "F3" | "find 3"  (case-insensitive)
  function parseOps(text) {
    var ops = [], maxIdx = -1;
    String(text == null ? '' : text).split(/[;\n]+/).forEach(function (raw) {
      var seg = raw.trim();
      if (!seg) return;
      var m = seg.match(/^u(?:nion)?\s*(\d+)\s+(\d+)$/i);
      if (m) { var a = +m[1], b = +m[2]; ops.push({ kind: 'union', a: a, b: b }); if (a > maxIdx) maxIdx = a; if (b > maxIdx) maxIdx = b; return; }
      m = seg.match(/^f(?:ind)?\s*(\d+)$/i);
      if (m) { var x = +m[1]; ops.push({ kind: 'find', x: x }); if (x > maxIdx) maxIdx = x; return; }
      // malformed → dropped
    });
    var n = Math.min(Math.max(maxIdx + 1, 2), 12);
    ops = ops.filter(function (o) {
      return o.kind === 'union' ? (o.a < n && o.b < n) : (o.x < n);
    });
    return { n: n, ops: ops };
  }

  // Replay the ops (union by rank + path compression), one frame per op plus an init frame.
  function buildFrames(spec) {
    var n = spec.n, ops = spec.ops;
    var parent = [], rank = [];
    for (var i = 0; i < n; i++) { parent.push(i); rank.push(0); }
    function rootOf(x) { while (parent[x] !== x) x = parent[x]; return x; }
    function pathTo(x) { var p = [x]; while (parent[p[p.length - 1]] !== p[p.length - 1]) p.push(parent[p[p.length - 1]]); return p; }
    function compress(x, root) { while (parent[x] !== root) { var nx = parent[x]; parent[x] = root; x = nx; } }
    var frames = [];
    function snap(kind, op, highlight, roots, found, msg) {
      frames.push({ kind: kind, op: op || null, parent: parent.slice(), rank: rank.slice(),
        highlight: (highlight || []).slice(), roots: roots || null,
        found: (found == null ? null : found), msg: msg });
    }
    snap('init', null, [], null, null,
      { zh: '初始：' + n + ' 個單節點集合', en: 'Init: ' + n + ' singleton sets' });
    ops.forEach(function (op) {
      if (op.kind === 'union') {
        var ra = rootOf(op.a), rb = rootOf(op.b);
        if (ra === rb) {
          snap('union', { a: op.a, b: op.b }, [ra], { small: ra, large: rb }, null,
            { zh: 'Union(' + op.a + ',' + op.b + ')：已在同一集合', en: 'Union(' + op.a + ',' + op.b + '): already in the same set' });
          return;
        }
        var small, large;
        if (rank[ra] < rank[rb]) { small = ra; large = rb; }
        else if (rank[ra] > rank[rb]) { small = rb; large = ra; }
        else { small = rb; large = ra; rank[large]++; }
        parent[small] = large;
        snap('union', { a: op.a, b: op.b }, [small, large], { small: small, large: large }, null,
          { zh: 'Union(' + op.a + ',' + op.b + ')：將根 ' + small + ' 接到根 ' + large + ' 之下（按秩）',
            en: 'Union(' + op.a + ',' + op.b + '): link root ' + small + ' under root ' + large + ' (by rank)' });
      } else {
        var path = pathTo(op.x);
        var root = path[path.length - 1];
        compress(op.x, root);
        snap('find', { x: op.x }, path, null, root,
          { zh: 'Find(' + op.x + ') = ' + root + '，路徑壓縮', en: 'Find(' + op.x + ') = ' + root + ', path compressed' });
      }
    });
    return { frames: frames };
  }

  // A difficulty-aware op string. normal/large are random; special is a curated
  // path-compression showcase; edge is an extreme.
  function randomInput(difficulty) {
    var d = difficulty || 'normal';
    function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
    if (d === 'special') return 'U0 1; U2 3; U0 2; U4 5; U4 0; F5';
    if (d === 'edge') return Math.random() < 0.5 ? 'F0' : 'U0 1; U2 3';
    var n, numOps;
    if (d === 'large') { n = ri(10, 12); numOps = 10; } else { n = 6; numOps = 6; }
    var out = [];
    for (var i = 0; i < numOps; i++) {
      if (Math.random() < 0.7) out.push('U' + ri(0, n - 1) + ' ' + ri(0, n - 1));
      else out.push('F' + ri(0, n - 1));
    }
    return out.join('; ');
  }

  var api = { parseOps: parseOps, buildFrames: buildFrames, randomInput: randomInput,
    SAMPLE: 'U0 1; U2 3; U0 2; U4 5; F3; U6 7' };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.DsuViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test tests/unit/dsu_viz.test.js`
Expected: PASS (all tests).

- [ ] **Step 5: Commit**

```bash
git add js/dsu_viz.js tests/unit/dsu_viz.test.js
git commit -m "feat(dsvisual): tree-dsu pure module — parseOps/buildFrames/randomInput"
```

---

### Task 2: Renderer rewrite + wiring + styling + e2e

**Files:**
- Rewrite: `js/viz/viz_dsu.js`
- Modify: `index.html` (add `<script src="js/dsu_viz.js" defer></script>` before `js/viz/viz_dsu.js` at line 529)
- Modify: `js/app.js:84` (add `codeDrawer: true`)
- Modify: `style.css:1543-1602` (replace the HTML-forest `.dsu-*` block)
- Test: `tests/dsu_vizfit.spec.js`

**Interfaces:**
- Consumes: `DsuViz.{parseOps,buildFrames,randomInput,SAMPLE}` (Task 1); `K().{acquireDynamicVizHost,fitFocusSize,markFocusFit,buildFrameControls,getInputDifficulty}`; `ExamplesStore`; `I18N`.
- Produces: the `tree-dsu` viz on the vizfit-svg path (DOM: `.dsu-wrap.vizfit-host > .tt-controls + .dsu-scroll.vizfit-scroll > svg.dsu-svg + .dsu-info`, VCR appended to wrap).

- [ ] **Step 1: Add the pure-module script tag to `index.html`**

Modify `index.html` — insert immediately before the existing line 529 (`    <script src="js/viz/viz_dsu.js" defer></script>`):

```html
    <script src="js/dsu_viz.js" defer></script>
```

Result (two adjacent lines):
```html
    <script src="js/dsu_viz.js" defer></script>
    <script src="js/viz/viz_dsu.js" defer></script>
```

- [ ] **Step 2: Add `codeDrawer: true` to the tree-dsu row**

Modify `js/app.js:84` — replace:
```js
            { id: 'tree-dsu', title: 'Disjoint Set (Union-Find)', file: 'tree_dsu.cpp', visualizer: 'dsu', controls: 'dsu' },
```
with:
```js
            { id: 'tree-dsu', title: 'Disjoint Set (Union-Find)', file: 'tree_dsu.cpp', visualizer: 'dsu', controls: 'dsu', codeDrawer: true },
```

- [ ] **Step 3: Replace the DSU CSS block**

Modify `style.css` — replace the entire old `.dsu-*` block (lines 1543–1602: `.dsu-wrap` through `.dsu-controls input[type="number"]`) with:

```css
.dsu-wrap { width: 100%; }
.dsu-hint { font-size: 0.82rem; color: var(--muted, #64748b); margin-left: 6px; }
.dsu-svg { display: block; }
.dsu-edge { stroke: #94a3b8; stroke-width: 2; }
.dsu-node { fill: #1e293b; stroke: #64748b; stroke-width: 2; }
.dsu-node.dsu-root { stroke: #16a34a; stroke-width: 3; }
.dsu-node.dsu-hl { fill: #f59e0b; stroke: #b45309; }
.dsu-node-label { fill: #ffffff; font-size: 13px; font-weight: 700; text-anchor: middle; dominant-baseline: middle; }
.dsu-rank-label { fill: #16a34a; font-size: 10px; font-weight: 700; text-anchor: middle; }
```

(The controls now use the shared `.tt-controls` class, so the old `.dsu-controls`/`.dsu-forest`/`.dsu-tree`/`.dsu-tree-node`/`.dsu-rank-table` rules are removed. Do NOT touch `.tt-controls` or the shared `.tree-node` class.)

- [ ] **Step 4: Rewrite `js/viz/viz_dsu.js`**

Replace the ENTIRE contents of `js/viz/viz_dsu.js` with:

```js
(function (global) {
    const K = () => global.VizKit; // resolved at call time (VizKit set at startup)

    // Examples-helper trio — duplicated per program convention; do NOT refactor.
    function loadExamples(methodId) { try { return ExamplesStore.load(localStorage, methodId); } catch (e) { return []; } }
    function saveExample(methodId, text, defaultText) { try { ExamplesStore.save(localStorage, methodId, text, defaultText); } catch (e) {} }
    function buildExamplesSelect(methodId, defaultText) {
        var lang = (global.I18N && I18N.getCurrentLanguage) ? I18N.getCurrentLanguage() : 'en';
        var escA = function (s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;'); };
        var escT = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); };
        var trunc = function (s) { s = String(s); return s.length > 24 ? s.slice(0, 24) + '…' : s; };
        var h = '<select class="ex-select" data-method="' + escA(methodId) + '">';
        h += '<option value="">' + (lang === 'zh' ? '範例…' : 'Examples…') + '</option>';
        h += '<option value="' + escA(defaultText) + '">' + (lang === 'zh' ? '預設' : 'Default') + '</option>';
        loadExamples(methodId).forEach(function (e) { if (e.text === defaultText) return; h += '<option value="' + escA(e.text) + '">' + escT(trunc(e.text)) + '</option>'; });
        return h + '</select>';
    }
    var DSU_DEEP = 'U0 1; U2 3; U0 2; U4 5; U4 0; F5';   // built-in "Deep chain" example
    var NR = 16, COLW = 54, ROWH = 64, PADX = 30, PADY = 30;

    let _dsuState = null;
    function renderDSU() {
        if (!_dsuState) _dsuState = { opStr: DsuViz.SAMPLE };
        const host = K().acquireDynamicVizHost();
        const lang = (global.I18N && I18N.getCurrentLanguage) ? I18N.getCurrentLanguage() : 'en';
        const spec = DsuViz.parseOps(_dsuState.opStr);
        const { frames } = DsuViz.buildFrames(spec);
        const n = spec.n;
        const ids = []; for (let i = 0; i < n; i++) ids.push(i);

        host.innerHTML =
            '<div class="dsu-wrap vizfit-host">' +
              '<div class="tt-controls">' +
                '<input type="text" class="dsu-input">' +
                '<button type="button" class="dsu-build">' + (lang === 'zh' ? '建立 Build' : 'Build') + '</button>' +
                '<button type="button" class="dsu-random" title="' + (lang === 'zh' ? '隨機輸入' : 'Random input') + '">🎲</button>' +
                buildExamplesSelect('tree-dsu', DsuViz.SAMPLE) +
                '<span class="dsu-hint">' + (lang === 'zh' ? 'U a b = 聯集，F x = 查找' : 'U a b = union, F x = find') + '</span>' +
              '</div>' +
              '<div class="dsu-scroll vizfit-scroll"><svg class="dsu-svg"></svg></div>' +
              '<div class="dsu-info" style="margin-top:6px;font-weight:700"></div>' +
            '</div>';

        const wrap = host.querySelector('.dsu-wrap');
        const scrollEl = wrap.querySelector('.dsu-scroll');
        const svgEl = scrollEl.querySelector('.dsu-svg');
        const infoEl = wrap.querySelector('.dsu-info');
        wrap.querySelector('.dsu-input').value = _dsuState.opStr;

        function paint(fr) {
            if (!svgEl.isConnected || !fr) return;
            const parent = fr.parent;
            // Build children + roots from this frame's parent[].
            const children = {}; const roots = [];
            for (let i = 0; i < n; i++) children[i] = [];
            for (let i = 0; i < n; i++) { if (parent[i] === i) roots.push(i); else children[parent[i]].push(i); }
            roots.sort((a, b) => a - b);
            for (let i = 0; i < n; i++) children[i].sort((a, b) => a - b);
            // n-ary layout: leaves get sequential columns, parents centered; trees placed left→right.
            const pos = {}; let col = 0;
            function layout(node, depth) {
                const kids = children[node];
                let c;
                if (!kids.length) { c = col++; }
                else { const cs = kids.map((k) => layout(k, depth + 1)); c = (cs[0] + cs[cs.length - 1]) / 2; }
                pos[node] = { x: PADX + c * COLW, y: PADY + depth * ROWH };
                return c;
            }
            roots.forEach((r) => { layout(r, 0); col++; /* gap between trees */ });

            const xs = ids.map((i) => pos[i].x), ys = ids.map((i) => pos[i].y);
            const minX = Math.min.apply(null, xs) - NR - 10, maxX = Math.max.apply(null, xs) + NR + 10;
            const minY = Math.min.apply(null, ys) - NR - 20, maxY = Math.max.apply(null, ys) + NR + 10;
            const natW = Math.max(maxX - minX, 120), natH = Math.max(maxY - minY, 120);
            const sz = K().fitFocusSize(scrollEl, natW, natH);

            const hl = fr.highlight || [];
            let out = '';
            for (let i = 0; i < n; i++) {
                if (parent[i] !== i) {
                    const a = pos[i], b = pos[parent[i]];
                    out += '<line class="dsu-edge" x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '"/>';
                }
            }
            for (let i = 0; i < n; i++) {
                const p = pos[i]; const isRoot = parent[i] === i;
                let cls = 'dsu-node'; if (isRoot) cls += ' dsu-root'; if (hl.indexOf(i) >= 0) cls += ' dsu-hl';
                out += '<circle class="' + cls + '" cx="' + p.x + '" cy="' + p.y + '" r="' + NR + '"/>';
                out += '<text class="dsu-node-label" x="' + p.x + '" y="' + p.y + '">' + i + '</text>';
                if (isRoot) out += '<text class="dsu-rank-label" x="' + p.x + '" y="' + (p.y - NR - 6) + '">r=' + fr.rank[i] + '</text>';
            }
            svgEl.setAttribute('viewBox', minX + ' ' + minY + ' ' + natW + ' ' + natH);
            svgEl.setAttribute('width', sz.w);
            svgEl.setAttribute('height', sz.h);
            svgEl.innerHTML = out;
            infoEl.textContent = (lang === 'zh' ? fr.msg.zh : fr.msg.en);
        }

        const exSelect = wrap.querySelector('.ex-select');
        if (exSelect && !Array.from(exSelect.options).some((o) => o.value === DSU_DEEP)) {
            const opt = document.createElement('option');
            opt.value = DSU_DEEP; opt.textContent = (lang === 'zh' ? '深鏈 Deep chain' : 'Deep chain');
            exSelect.insertBefore(opt, exSelect.options[2] || null);
        }
        wrap.appendChild(K().buildFrameControls(frames, paint, { runIntervalMs: 700 }));
        K().markFocusFit(host, { svg: true });   // viz-fit-svg: per-SVG drawing-only zoom

        wrap.querySelector('.dsu-build').onclick = () => {
            const txt = wrap.querySelector('.dsu-input').value;
            const parsed = DsuViz.parseOps(txt);
            if (parsed.ops.length) { _dsuState.opStr = txt; saveExample('tree-dsu', txt, DsuViz.SAMPLE); renderDSU(); }
        };
        wrap.querySelector('.dsu-random').onclick = () => {
            const str = DsuViz.randomInput(K().getInputDifficulty());
            _dsuState.opStr = str; saveExample('tree-dsu', str, DsuViz.SAMPLE); renderDSU();
        };
        if (exSelect) exSelect.onchange = (ev) => {
            const v = ev.target.value; if (!v) return;
            if (DsuViz.parseOps(v).ops.length) { _dsuState.opStr = v; renderDSU(); }
        };
    }

    global.VizRegistry.attach('tree-dsu', {
        render: renderDSU,
        code: () => codeTreeDSU,
        layout: { host: 'dynamic' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 5: Write the e2e spec**

Create `tests/dsu_vizfit.spec.js`:

```js
const { test, expect } = require('@playwright/test'); const path = require('path');
const FILE_URI = 'file://' + path.resolve(__dirname, '../index.html');

test.describe('tree-dsu scripted op-sequence + SVG forest (vizfit-svg)', () => {
  test('single-SVG forest; bounded; controls; stepping shows edges + op info', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=tree-dsu');
    await expect(page.locator('.dsu-wrap.vizfit-host')).toHaveCount(1);
    const scroll = page.locator('.dsu-scroll.vizfit-scroll');
    await expect(scroll.locator('> svg.dsu-svg')).toHaveCount(1);
    expect(await scroll.evaluate((el) => el.clientHeight <= window.innerHeight - 120)).toBe(true);
    await expect(page.locator('.ex-select')).toBeVisible();
    await expect(page.locator('.dsu-random')).toBeVisible();
    // no legacy HTML forest
    expect(await page.locator('.dsu-forest, .dsu-tree-node').count()).toBe(0);
    // SAMPLE → n=8 SVG nodes
    expect(await page.locator('.dsu-svg .dsu-node').count()).toBe(8);
    // step to end → edges present + op info shown
    const scrub = page.locator('.stepctl .stepctl-scrubber');
    await scrub.evaluate((el) => { el.value = el.max; el.dispatchEvent(new Event('input', { bubbles: true })); });
    expect(await page.locator('.dsu-svg .dsu-edge').count()).toBeGreaterThan(0);
    expect((await page.locator('.dsu-info').textContent()).trim().length).toBeGreaterThan(0);
  });

  test('🎲 valid op string; Build re-renders + saves example', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=tree-dsu');
    await page.click('.dsu-random');
    expect(await page.locator('.dsu-input').inputValue()).toMatch(/^[UFuf0-9;\s]+$/);
    expect(await page.locator('.dsu-svg .dsu-node').count()).toBeGreaterThan(0);
    await page.fill('.dsu-input', 'U0 1; U2 3');
    await page.click('.dsu-build');
    expect(await page.locator('.dsu-svg .dsu-node').count()).toBe(4); // maxIdx 3 → n=4
    expect(await page.locator('.ex-select option').count()).toBeGreaterThan(2);
  });

  test('fullscreen: viz-fit-svg, SVG width grows, VCR operable, code drawer hidden', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=tree-dsu');
    const svgW = () => page.locator('.dsu-svg').getAttribute('width').then((v) => parseFloat(v));
    const before = await svgW();
    await page.locator('.method-section-card.active .viz-focus-toggle').click();
    const card = page.locator('.method-section-card.active');
    await expect(card).toHaveClass(/viz-fit(\s|$)/);
    await expect(card).toHaveClass(/viz-fit-svg(\s|$)/);
    await expect.poll(async () => await svgW()).toBeGreaterThan(before);
    expect(await page.locator('.stepctl').evaluate((el) => el.getBoundingClientRect().bottom <= window.innerHeight + 1)).toBe(true);
    await expect(page.locator('.viz-zoom-controls')).toBeVisible();
    await expect(page.locator('[data-method-section="tree-dsu"] .code-drawer')).toBeHidden();
  });
});
```

- [ ] **Step 6: Run the DSU e2e + unit + affected suites**

Run:
```bash
node --test tests/unit/dsu_viz.test.js
npx playwright test tests/dsu_vizfit.spec.js
```
Expected: all PASS. If the fullscreen width-grow poll is flaky, confirm `.dsu-svg` gets `width`/`height` set inside `paint` (it does) — the ResizeObserver in `markFocusFit`/`buildFrameControls` drives convergence; do NOT add sleeps.

- [ ] **Step 7: Run the guard suites (no regressions)**

Run:
```bash
npx playwright test tests/vizfit.spec.js tests/catalan_vizfit.spec.js tests/tgb_vizfit.spec.js tests/threaded_vizfit.spec.js tests/game_tree_vizfit.spec.js
```
Expected: all PASS (other vizfit adopters + the shared mechanism unaffected). Also grep for any pre-existing DSU test that drove the old buttons / asserted `.dsu-tree-node`:
```bash
grep -rln "dsu-tree-node\|data-action=\"union\"\|tree-dsu" tests/
```
If one exists and asserts the removed HTML forest, update it to the SVG `.dsu-node` / new markup (or fold its intent into `tests/dsu_vizfit.spec.js`).

- [ ] **Step 8: Commit**

```bash
git add js/viz/viz_dsu.js index.html js/app.js style.css tests/dsu_vizfit.spec.js
git commit -m "feat(dsvisual): tree-dsu — scripted op-sequence + SVG forest on vizfit-svg"
```

---

## Self-Review

- **Spec coverage:** scripted op sequence + `n` derived clamped [2,12] (Task 1 parseOps); union-by-rank + path-compression, one frame per op + init (Task 1 buildFrames); `randomInput` per difficulty (Task 1); SVG forest with edges/roots/ranks/highlight on viz-fit-svg (Task 2 paint + markFocusFit svg); codeDrawer (Task 2 app.js); examples trio + built-in Deep chain + 🎲 (Task 2); bounded/fullscreen/VCR/code-hidden (Task 2 e2e); CSS swap (Task 2). All spec sections mapped. ✓
- **Placeholder scan:** none — every step has full code/commands. ✓
- **Type consistency:** `DsuViz.{parseOps,buildFrames,randomInput,SAMPLE}` used identically in Task 2 as defined in Task 1; frame fields (`parent`,`rank`,`highlight`,`msg`,`op`,`roots`,`found`,`kind`) match between builder and painter; `code: () => codeTreeDSU` matches the existing global (`js/code_db.js:887`). ✓

## Full-suite gate (before finishing)

Run the entire Playwright suite (`npx playwright test`) + `node --test tests/unit/` — all green — before the whole-branch review, per the program's CI (deploy-pages runs the full suite; a flake blocks the Pages deploy).
