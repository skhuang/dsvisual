# game-tree vizfit-svg (viewBox rewrite) + examples + random Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the Game Tree drawing as a single viewBox `<svg>` with rounded-rect nodes (reusing the threaded pattern), adopt the vizfit `viz-fit-svg` path, and add `codeDrawer` + saveable examples + a difficulty-aware 🎲 — keeping the α-β toggle.

**Architecture:** Task 1 adds a pure `GameTreeViz.randomInput(difficulty)`. Task 2 replaces the `.gt-stage` (SVG edges + HTML `.gt-nodes` overlay) with one `<svg class="gt-svg">` whose `viewBox` is computed from node bounds; `paint` rebuilds its innerHTML each frame (rect nodes + labels + prune/α-β state); wraps in `.gt-wrap.vizfit-host`/`.gt-scroll.vizfit-scroll`; `markFocusFit(host,{svg:true})` + `fitFocusSize`; adds the examples trio + `.ex-select` + 🎲.

**Tech Stack:** vanilla JS (dual-export `js/game_tree_viz.js`, renderer `js/viz/viz_game_tree.js`), `js/app.js` row, plain CSS/SVG, `node:test` unit + Playwright e2e.

## Global Constraints

- Targeted `git add` by explicit path only; never `git add -A`/`.`/`-u`; run `git status` first.
- Never hand-edit generated files (`js/code_db.js`, `slides/**`, `js/slides_rendered.js`).
- `viz-fit-svg` path: `K().markFocusFit(host, { svg: true })` + `K().fitFocusSize(scrollEl, natW, natH)` for the single SVG.
- `.vizfit-host` a DIRECT child of `#dynamic-viz-host`; `.gt-svg` the sole child of `.gt-scroll.vizfit-scroll`; `.gt-info`/VCR later DOM siblings.
- Do NOT modify the shared `.tree-node` base class or the layout `colW/rowH/padX/padY`. Examples trio duplicated per convention (do NOT refactor). `randomInput` is per-module (no shared `RandomInput` registry entry for game-tree).
- Keep the α-β checkbox behaviour. Traditional-zh inline labels. Non-focus + all other viz UNCHANGED.
- e2e assert robust locators (counts, class presence, value regex, width attribute) — never SVG edge visibility.
- One branch (`feat/game-tree-vizfit`, already created) + one PR.

---

### Task 1: Pure `randomInput(difficulty)` in `js/game_tree_viz.js`

**Files:**
- Modify: `js/game_tree_viz.js` (add `randomInput`; export on `api`)
- Test: `tests/unit/game_tree_viz.test.js` (create)

**Interfaces:**
- Consumes: `buildGameTree`, `minimaxFrames` (same module).
- Produces: `GameTreeViz.randomInput(difficulty) → { leaves: number[] }`.

- [ ] **Step 1: Write the failing unit test**

Create `tests/unit/game_tree_viz.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert');
const G = require('../../js/game_tree_viz.js');

const EXPECT = { normal: 8, special: 8, edge: 4, large: 16 };

test('randomInput returns a power-of-2 integer leaf set per difficulty; builds without throwing', () => {
  for (const d of Object.keys(EXPECT)) {
    for (let i = 0; i < 8; i++) {
      const r = G.randomInput(d);
      assert.ok(r && Array.isArray(r.leaves), d + ' has leaves');
      assert.strictEqual(r.leaves.length, EXPECT[d], d + ' leaf count');
      r.leaves.forEach((v) => assert.ok(Number.isInteger(v), d + ' integer leaf: ' + v));
      assert.doesNotThrow(() => {
        const { root } = G.buildGameTree(r.leaves, 2);
        G.minimaxFrames(root, true);
        G.minimaxFrames(root, false);
      }, d + ' builds + frames');
    }
  }
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/unit/game_tree_viz.test.js`
Expected: FAIL — `G.randomInput is not a function`.

- [ ] **Step 3: Implement `randomInput` in `js/game_tree_viz.js`**

Add this function just before the `const api = {…}` line:
```js
  function randomInput(difficulty) {
    var d = difficulty || 'normal';
    function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
    var n, lo, hi;
    if (d === 'large') { n = 16; lo = -9; hi = 9; }
    else if (d === 'edge') { n = 4; lo = -5; hi = 9; }
    else { n = 8; lo = -5; hi = 9; }   // normal, special
    var leaves = [];
    for (var i = 0; i < n; i++) leaves.push(randInt(lo, hi));
    if (d === 'special') {   // bias toward alpha-beta pruning: strong values first
      var head = leaves.slice(0, n / 2).sort(function (a, b) { return b - a; });
      leaves = head.concat(leaves.slice(n / 2));
    }
    return { leaves: leaves };
  }
```
Then add `randomInput` to the exported `api`:
```js
  const api = { buildGameTree: buildGameTree, minimaxFrames: minimaxFrames, SAMPLE_LEAVES: [3, 5, 6, 9, 1, 2, 0, -1], randomInput: randomInput };
```

- [ ] **Step 4: Run the unit test to verify it passes**

Run: `node --test tests/unit/game_tree_viz.test.js`
Expected: PASS.

- [ ] **Step 5: Run the full unit suite**

Run: `npm run test:unit`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add js/game_tree_viz.js tests/unit/game_tree_viz.test.js
git commit -m "feat(dsvisual): game-tree randomInput (difficulty-aware power-of-2 leaf set)"
```

---

### Task 2: viewBox-SVG rewrite + vizfit-svg + examples + 🎲

**Files:**
- Modify: `js/app.js:99` (`game-tree` row — add `codeDrawer: true`)
- Modify: `js/viz/viz_game_tree.js` (full render rewrite; keep the `attach`)
- Modify: `style.css` (remove `.tree-node.gt-pruned`* at 2534–2535; add `.gt-wrap`/`.gt-svg`/`.gt-node`/`.gt-node-label` SVG styling)
- Test: `tests/game_tree_vizfit.spec.js` (create)

**Interfaces:**
- Consumes (Task 1): `GameTreeViz.randomInput(difficulty)`. Consumes (Phase 0): `K().markFocusFit`/`fitFocusSize`, `.vizfit-host`/`.vizfit-scroll`. Consumes: `K().getInputDifficulty`, `ExamplesStore`, `GameTreeViz.{buildGameTree,minimaxFrames,SAMPLE_LEAVES}`.
- Produces: `game-tree` as a single-SVG `viz-fit-svg` viz with examples + 🎲.

- [ ] **Step 1: Write the failing e2e test**

Create `tests/game_tree_vizfit.spec.js`:

```js
const { test, expect } = require('@playwright/test'); const path = require('path');
const FILE_URI = 'file://' + path.resolve(__dirname, '../index.html');

test.describe('game-tree vizfit-svg + examples + random', () => {
  test('single-SVG rect nodes; bounded; controls; stepping prunes', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=game-tree');
    await expect(page.locator('.gt-wrap.vizfit-host')).toHaveCount(1);
    const scroll = page.locator('.gt-scroll.vizfit-scroll');
    await expect(scroll.locator('> svg.gt-svg')).toHaveCount(1);
    expect(await scroll.evaluate((el) => el.clientHeight <= window.innerHeight - 120)).toBe(true);
    await expect(page.locator('.ex-select')).toBeVisible();
    await expect(page.locator('.gt-random')).toBeVisible();
    await expect(page.locator('.gt-ab')).toBeVisible();
    expect(await page.locator('.gt-svg .gt-node').count()).toBeGreaterThan(0);
    expect(await page.locator('.gt-nodes .tree-node').count()).toBe(0);   // no HTML overlay
    // step to end (α-β on by default) → root value shown + at least one pruned node
    const scrub = page.locator('.stepctl .stepctl-scrubber');
    await scrub.evaluate((el) => { el.value = el.max; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await expect(page.locator('.gt-info')).toContainText('Root value');
    expect(await page.locator('.gt-svg .gt-node.gt-pruned').count()).toBeGreaterThan(0);
  });

  test('🎲 valid leaves; Build saves example', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=game-tree');
    await page.click('.gt-random');
    expect(await page.locator('.gt-input').inputValue()).toMatch(/^-?\d+(,-?\d+)*$/);
    expect(await page.locator('.gt-svg .gt-node').count()).toBeGreaterThan(0);
    await page.fill('.gt-input', '1,2,3,4');
    await page.click('.gt-build');
    expect(await page.locator('.gt-svg .gt-node').count()).toBeGreaterThan(0);
    expect(await page.locator('.ex-select option').count()).toBeGreaterThan(2);
  });

  test('fullscreen: viz-fit-svg, SVG width grows, VCR operable, code drawer hidden', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=game-tree');
    const svgW = () => page.locator('.gt-svg').getAttribute('width').then((v) => parseFloat(v));
    const before = await svgW();
    await page.locator('.method-section-card.active .viz-focus-toggle').click();
    const card = page.locator('.method-section-card.active');
    await expect(card).toHaveClass(/viz-fit(\s|$)/);
    await expect(card).toHaveClass(/viz-fit-svg(\s|$)/);
    await expect.poll(async () => await svgW()).toBeGreaterThan(before);
    expect(await page.locator('.stepctl').evaluate((el) => el.getBoundingClientRect().bottom <= window.innerHeight + 1)).toBe(true);
    await expect(page.locator('.viz-zoom-controls')).toBeVisible();
    await expect(page.locator('[data-method-section="game-tree"] .code-drawer')).toBeHidden();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx playwright test tests/game_tree_vizfit.spec.js`
Expected: FAIL — `.gt-wrap.vizfit-host` / `svg.gt-svg` / `.ex-select` / `.gt-random` don't exist; nodes are HTML `.tree-node`; code not drawered.

- [ ] **Step 3: Add `codeDrawer: true` to the method row (`js/app.js:99`)**

Change:
```js
            { id: 'game-tree', title: 'Game Tree (Minimax / α-β)', file: 'game_tree.cpp', visualizer: 'gametree', controls: 'gametree' },
```
to:
```js
            { id: 'game-tree', title: 'Game Tree (Minimax / α-β)', file: 'game_tree.cpp', visualizer: 'gametree', controls: 'gametree', codeDrawer: true },
```

- [ ] **Step 4: Rewrite `js/viz/viz_game_tree.js`**

Replace the ENTIRE file with:
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
    var GT_PRUNE = '9,8,7,6,1,2,3,4';   // built-in "Heavy pruning" example
    var NW = 46, NH = 26;               // rounded-rect node size (fits symbol=value labels)
    function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
    function fmt(v) { return v === Infinity ? '∞' : v === -Infinity ? '-∞' : String(v); }

    let _gameState = null;
    function renderGameTree() {
        if (!_gameState) _gameState = { leaves: GameTreeViz.SAMPLE_LEAVES.slice(), useAB: true };
        const host = K().acquireDynamicVizHost();
        const lang = (global.I18N && I18N.getCurrentLanguage) ? I18N.getCurrentLanguage() : 'en';
        const { root } = GameTreeViz.buildGameTree(_gameState.leaves, 2);
        const { frames } = GameTreeViz.minimaxFrames(root, _gameState.useAB);

        // ---- Layout: leaves left-to-right, parents centered over children (unchanged geometry) ----
        const meta = {};
        (function () {
            let leafCursor = 0;
            const colW = 60, rowH = 70, padX = 36, padY = 30;
            function layout(node, depth) {
                let x;
                if (node.leaf || !node.children.length) { x = padX + (leafCursor++) * colW; }
                else { const xs = node.children.map((c) => layout(c, depth + 1)); x = (xs[0] + xs[xs.length - 1]) / 2; }
                meta[node.id] = { x: x, y: padY + depth * rowH, node: node };
                return x;
            }
            layout(root, 0);
        })();

        host.innerHTML =
            '<div class="gt-wrap vizfit-host">' +
              '<div class="tt-controls">' +
                '<input type="text" class="gt-input" value="' + _gameState.leaves.join(',') + '">' +
                '<button type="button" class="gt-build">' + (lang === 'zh' ? '建立 Build' : 'Build') + '</button>' +
                '<button type="button" class="gt-random" title="' + (lang === 'zh' ? '隨機輸入' : 'Random input') + '">🎲</button>' +
                '<label style="margin-left:8px"><input type="checkbox" class="gt-ab" ' + (_gameState.useAB ? 'checked' : '') + '> &alpha;-&beta;</label>' +
                buildExamplesSelect('game-tree', GameTreeViz.SAMPLE_LEAVES.join(',')) +
              '</div>' +
              '<div class="gt-scroll vizfit-scroll"><svg class="gt-svg"></svg></div>' +
              '<div class="gt-info" style="margin-top:6px;font-weight:700"></div>' +
            '</div>';

        const wrap = host.querySelector('.gt-wrap');
        const scrollEl = wrap.querySelector('.gt-scroll');
        const svgEl = scrollEl.querySelector('.gt-svg');
        const ids = Object.keys(meta);
        const xs = ids.map((id) => meta[id].x), ys = ids.map((id) => meta[id].y);
        const minX = Math.min.apply(null, xs) - NW / 2 - 10, maxX = Math.max.apply(null, xs) + NW / 2 + 10;
        const minY = Math.min.apply(null, ys) - NH / 2 - 10, maxY = Math.max.apply(null, ys) + NH / 2 + 10;
        const natW = Math.max(maxX - minX, 120), natH = Math.max(maxY - minY, 120);

        function paint(fr, i) {
            if (!svgEl.isConnected) return;
            const sz = K().fitFocusSize(scrollEl, natW, natH);
            const pruned = new Set(); const returned = {}; const abText = {}; let current = null;
            for (let s = 0; s <= i && s < frames.length; s++) {
                const f = frames[s];
                if (f.type === 'prune') (f.pruned || []).forEach((p) => pruned.add(p));
                if (f.type === 'return' || f.type === 'leaf') returned[f.id] = f.value;
                if (f.type === 'enter' || f.type === 'update') abText[f.id] = { alpha: f.alpha, beta: f.beta, value: f.type === 'update' ? f.value : undefined };
                if (f.type === 'enter' || f.type === 'update' || f.type === 'leaf' || f.type === 'return') current = f.id;
            }
            let out = '';
            ids.forEach((id) => { const m = meta[id]; (m.node.children || []).forEach((c) => { const b = meta[c.id]; if (b) out += '<line class="gt-edge" x1="' + m.x + '" y1="' + m.y + '" x2="' + b.x + '" y2="' + b.y + '"/>'; }); });
            ids.forEach((id) => {
                const m = meta[id], node = m.node, nid = node.id;
                const symbol = node.leaf ? String(node.value) : (node.isMax ? '▲' : '▽');
                let label = symbol, cls = 'gt-node';
                if (Object.prototype.hasOwnProperty.call(returned, nid) && !node.leaf) { label = symbol + '=' + fmt(returned[nid]); cls += ' visited'; }
                if (pruned.has(nid)) cls += ' gt-pruned';
                if (nid === current) cls += ' active';
                out += '<rect class="' + cls + '" x="' + (m.x - NW / 2) + '" y="' + (m.y - NH / 2) + '" width="' + NW + '" height="' + NH + '" rx="6"/>';
                out += '<text class="gt-node-label" x="' + m.x + '" y="' + m.y + '">' + esc(label) + '</text>';
            });
            svgEl.setAttribute('viewBox', minX + ' ' + minY + ' ' + natW + ' ' + natH);
            svgEl.setAttribute('width', sz.w);
            svgEl.setAttribute('height', sz.h);
            svgEl.innerHTML = out;

            let info = '';
            if (fr) {
                const ab = abText[fr.id];
                if (fr.type === 'prune') info = 'Prune at node ' + fr.id + ': α=' + fmt(fr.alpha) + ' ≥ β=' + fmt(fr.beta);
                else if (fr.type === 'leaf') info = 'Leaf node ' + fr.id + ' = ' + fmt(fr.value);
                else if (ab) info = 'Node ' + fr.id + ': α=' + fmt(ab.alpha) + ', β=' + fmt(ab.beta) + (ab.value !== undefined ? ', best=' + fmt(ab.value) : '');
            }
            if (Object.prototype.hasOwnProperty.call(returned, root.id)) info += (info ? '  |  ' : '') + 'Root value = ' + fmt(returned[root.id]);
            host.querySelector('.gt-info').textContent = info;
        }

        const exSelect = wrap.querySelector('.ex-select');
        if (exSelect && !Array.from(exSelect.options).some((o) => o.value === GT_PRUNE)) {
            const opt = document.createElement('option');
            opt.value = GT_PRUNE; opt.textContent = (lang === 'zh' ? '大量剪枝' : 'Heavy pruning');
            exSelect.insertBefore(opt, exSelect.options[2] || null);
        }
        wrap.appendChild(K().buildFrameControls(frames, paint, { runIntervalMs: 700 }));
        K().markFocusFit(host, { svg: true });   // viz-fit-svg: per-SVG drawing-only zoom

        host.querySelector('.gt-build').onclick = () => {
            try {
                const vals = host.querySelector('.gt-input').value.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => Number.isFinite(n));
                if (vals.length) { _gameState.leaves = vals; saveExample('game-tree', vals.join(','), GameTreeViz.SAMPLE_LEAVES.join(',')); renderGameTree(); }
            } catch (e) { /* ignore malformed input */ }
        };
        host.querySelector('.gt-random').onclick = () => {
            const r = GameTreeViz.randomInput(K().getInputDifficulty());
            _gameState.leaves = r.leaves;
            saveExample('game-tree', r.leaves.join(','), GameTreeViz.SAMPLE_LEAVES.join(','));
            renderGameTree();
        };
        if (exSelect) exSelect.onchange = (ev) => {
            const v = ev.target.value; if (!v) return;
            const vals = v.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => Number.isFinite(n));
            if (vals.length) { _gameState.leaves = vals; renderGameTree(); }
        };
        host.querySelector('.gt-ab').onchange = (e) => {
            _gameState.useAB = e.target.checked;
            renderGameTree();
        };
    }

    global.VizRegistry.attach('game-tree', {
        render: renderGameTree,
        code: () => codeGameTree,
        layout: { host: 'dynamic' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 5: Update CSS (`style.css`)**

Remove the now-unused HTML overlay rules at lines 2534–2535:
```css
.tree-node.gt-pruned { background: #cbd5e1; border-color: #94a3b8; opacity: 0.45; }
.tree-node.gt-pruned.active { background: #cbd5e1; border-color: #94a3b8; }
```
Then append at the end of `style.css`:
```css

/* game-tree vizfit-svg (Phase-1 vizfit adopter — rounded-rect nodes) */
.gt-wrap { width: 100%; }
.gt-svg { display: block; }
.gt-edge { stroke: #94a3b8; stroke-width: 2; }
.gt-node { fill: #1e293b; stroke: #64748b; stroke-width: 2; }
.gt-node.active { fill: #f59e0b; stroke: #b45309; }
.gt-node.visited { fill: #2563eb; stroke: #1e40af; }
.gt-node.gt-pruned { fill: #cbd5e1; stroke: #94a3b8; opacity: 0.5; }
.gt-node-label { fill: #ffffff; font-size: 12px; font-weight: 700; text-anchor: middle; dominant-baseline: middle; }
```
(Do NOT touch the shared `.tree-node` base class.)

- [ ] **Step 6: Run the new e2e to verify it passes**

Run: `npx playwright test tests/game_tree_vizfit.spec.js`
Expected: PASS (all 3) — SVG rect nodes (no HTML overlay), bounded scroll, controls, stepping shows Root value + a pruned node; 🎲/Build/examples; fullscreen viz-fit-svg + SVG width grows + VCR operable + code drawer hidden.

- [ ] **Step 7: Run the full suites (no regression)**

Run: `npm run test:unit && npm test`
Expected: unit green; full Playwright green — including the other vizfit adopters + fullscreen specs. If a pre-existing game-tree test asserted the old HTML `.tree-node`/`.gt-nodes` overlay, update it to the SVG `.gt-node` and note it in the report.

- [ ] **Step 8: Commit**

```bash
git add js/app.js js/viz/viz_game_tree.js style.css tests/game_tree_vizfit.spec.js
git commit -m "feat(dsvisual): game-tree — viewBox-SVG rewrite (rounded-rect) + vizfit-svg + examples + random"
```

---

## Self-Review

**1. Spec coverage:**
- `codeDrawer:true` → Task 2 Step 3. ✓
- pure `randomInput` (power-of-2 leaves per difficulty, special biases pruning) → Task 1. ✓
- viewBox-SVG rewrite (rect nodes + labels + prune/α-β state; paint rebuilds innerHTML; viewBox from bounds w/ symmetric margin; `fitFocusSize` sizing) → Task 2 Step 4. ✓
- vizfit-svg wrap (`.gt-wrap.vizfit-host`/`.gt-scroll.vizfit-scroll`, `.gt-info`/VCR later siblings, `markFocusFit(host,{svg:true})`) → Task 2 Step 4. ✓
- Examples (trio + `.ex-select` + built-in "Heavy pruning" + save on Build/🎲) + 🎲 (getInputDifficulty→randomInput) + α-β kept → Task 2 Step 4. ✓
- CSS swap (remove HTML gt-pruned; add `.gt-*` SVG) → Task 2 Step 5. ✓
- Tests: unit (leaf counts) + e2e (SVG nodes/no overlay, prune, 🎲/Build/examples, fullscreen viz-fit-svg + width-grows + VCR + drawer) → Task 1/Task 2 Step 1. ✓

**2. Placeholder scan:** No TBD/TODO; full file in Step 4; commands have expected results. ✓

**3. Type/name consistency:** `randomInput(difficulty)→{leaves}` (Task 1) consumed in Task 2 Step 4; `fitFocusSize`/`markFocusFit(host,{svg:true})` (Phase-0 signatures); classes `.gt-wrap`/`.vizfit-host`/`.gt-scroll`/`.vizfit-scroll`/`.gt-svg`/`.gt-node`(+`.active`/`.visited`/`.gt-pruned`)/`.gt-node-label`/`.gt-edge`/`.gt-random`/`.ex-select`/`.gt-ab` identical across renderer, CSS, and tests; `NW`/`NH` used in both bounds and rect emission; `saveExample('game-tree', leaves.join(','), GameTreeViz.SAMPLE_LEAVES.join(','))` consistent; `GT_PRUNE` defined + injected; `data-method-section="game-tree"` matches the row id; layout geometry + shared `.tree-node` untouched. ✓
