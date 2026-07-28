# tree-threaded vizfit-svg (viewBox rewrite) + examples Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the Threaded Binary Tree stage as a single viewBox `<svg>` and adopt the vizfit `viz-fit-svg` path (crisp fit + drawing-only zoom, like the trie), plus `codeDrawer` and saveable examples; keep the existing shared-registry 🎲.

**Architecture:** Replace the `.th-stage` (SVG edge layer + HTML `.th-nodes` overlay) with one `<svg class="th-svg">` whose `viewBox` is computed from the node bounds; render edges, dashed threads, and nodes (`<circle>`+`<text>`) inside it. Wrap in `.th-wrap.vizfit-host` / `.th-scroll.vizfit-scroll`, `K().markFocusFit(host,{svg:true})`, size via `K().fitFocusSize`. Add the ExamplesStore trio + `.ex-select` + a built-in example. Sets the reusable pattern game-tree follows.

**Tech Stack:** vanilla JS (`js/viz/viz_threaded.js`), `js/app.js` row, plain CSS/SVG, Playwright e2e.

## Global Constraints

- Targeted `git add` by explicit path only; never `git add -A`/`.`/`-u`; run `git status` first.
- Never hand-edit generated files (`js/code_db.js`, `slides/**`, `js/slides_rendered.js`).
- `viz-fit-svg` path: `K().markFocusFit(host, { svg: true })` + `K().fitFocusSize(scrollEl, natW, natH)` for the single SVG.
- `.vizfit-host` a DIRECT child of `#dynamic-viz-host`; the `.th-svg` is the sole child of `.th-scroll.vizfit-scroll`; `.th-output`/`.th-phase`/VCR are later DOM siblings of `.vizfit-scroll`.
- Do NOT modify the shared `.tree-node` CSS class (other viz use it) or `computeTreeLayout` geometry. Keep the shared `RandomInput` registry for 🎲 (no per-module randomInput).
- Examples-helper trio duplicated per convention — do NOT refactor. Traditional-zh where the viz emits zh.
- Non-focus + all other viz UNCHANGED. e2e assert robust locators (counts, class presence, width attribute) — never SVG edge visibility.
- One branch (`feat/threaded-vizfit`, already created) + one PR.

---

### Task 1: viewBox-SVG rewrite + vizfit-svg + examples

**Files:**
- Modify: `js/app.js:90` (`tree-threaded` row — add `codeDrawer: true`)
- Modify: `js/viz/viz_threaded.js` (full render rewrite; keep `computeTreeLayout` + the `attach`)
- Modify: `style.css:2903-2905` (replace `.th-stage`/`.th-edges`/`.th-nodes` with `.th-wrap` + `.th-svg` SVG styling)
- Test: `tests/threaded_vizfit.spec.js` (create)

**Interfaces:**
- Consumes: `K().markFocusFit`/`fitFocusSize`, `.vizfit-host`/`.vizfit-scroll` (Phase 0); `K().getInputDifficulty`; `RandomInput.randomInputFor`; `ExamplesStore`; `ThreadedViz.{buildTreeFromValues,buildThreadedFrames,SAMPLE}`.
- Produces: `tree-threaded` as a single-SVG `viz-fit-svg` viz with examples.

- [ ] **Step 1: Write the failing e2e test**

Create `tests/threaded_vizfit.spec.js`:

```js
const { test, expect } = require('@playwright/test'); const path = require('path');
const FILE_URI = 'file://' + path.resolve(__dirname, '../index.html');

test.describe('tree-threaded vizfit-svg + examples', () => {
  test('single-SVG nodes, bounded, examples + 🎲, stepping', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=tree-threaded');
    await expect(page.locator('.th-wrap.vizfit-host')).toHaveCount(1);
    const scroll = page.locator('.th-scroll.vizfit-scroll');
    await expect(scroll.locator('> svg.th-svg')).toHaveCount(1);
    expect(await scroll.evaluate((el) => el.clientHeight <= window.innerHeight - 120)).toBe(true);
    await expect(page.locator('.ex-select')).toBeVisible();
    await expect(page.locator('.rand-btn')).toBeVisible();
    // nodes are SVG circles (7 default values); NO HTML overlay left
    await expect(page.locator('.th-svg .th-node')).toHaveCount(7);
    await expect(page.locator('.th-svg .th-node-label')).toHaveCount(7);
    expect(await page.locator('.th-nodes .tree-node').count()).toBe(0);
    // stepping: scrub to end → inorder populated + threads present
    const scrub = page.locator('.stepctl .stepctl-scrubber');
    await scrub.evaluate((el) => { el.value = el.max; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await expect(page.locator('.th-seq')).not.toHaveText('');
    expect(await page.locator('.th-svg .th-thread').count()).toBeGreaterThan(0);
  });

  test('Build a custom tree saves an example; 🎲 re-renders', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=tree-threaded');
    await page.fill('.th-input', '10,20,30');
    await page.click('.th-build');
    await expect(page.locator('.th-svg .th-node')).toHaveCount(3);
    expect(await page.locator('.ex-select option').count()).toBeGreaterThan(2);
    await page.click('.rand-btn');
    expect(await page.locator('.th-input').inputValue()).toMatch(/^\d+(,\d+)*$/);
    expect(await page.locator('.th-svg .th-node').count()).toBeGreaterThan(0);
  });

  test('fullscreen: viz-fit-svg, SVG width grows, VCR operable, code drawer hidden', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=tree-threaded');
    const svgW = () => page.locator('.th-svg').getAttribute('width').then((v) => parseFloat(v));
    const before = await svgW();
    await page.locator('.method-section-card.active .viz-focus-toggle').click();
    const card = page.locator('.method-section-card.active');
    await expect(card).toHaveClass(/viz-fit(\s|$)/);
    await expect(card).toHaveClass(/viz-fit-svg(\s|$)/);
    await expect.poll(async () => await svgW()).toBeGreaterThan(before);
    expect(await page.locator('.stepctl').evaluate((el) => el.getBoundingClientRect().bottom <= window.innerHeight + 1)).toBe(true);
    await expect(page.locator('.viz-zoom-controls')).toBeVisible();
    await expect(page.locator('[data-method-section="tree-threaded"] .code-drawer')).toBeHidden();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx playwright test tests/threaded_vizfit.spec.js`
Expected: FAIL — `.th-wrap.vizfit-host` / `svg.th-svg` / `.ex-select` don't exist; nodes are still HTML `.tree-node`; code not drawered.

- [ ] **Step 3: Add `codeDrawer: true` to the method row (`js/app.js:90`)**

Change:
```js
            { id: 'tree-threaded', title: 'Threaded Binary Tree', file: 'tree_threaded.cpp', visualizer: 'threaded', controls: 'threaded' },
```
to:
```js
            { id: 'tree-threaded', title: 'Threaded Binary Tree', file: 'tree_threaded.cpp', visualizer: 'threaded', controls: 'threaded', codeDrawer: true },
```

- [ ] **Step 4: Rewrite `js/viz/viz_threaded.js`**

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
    var TH_SKEW = '10,20,30,40,50';   // built-in "Left-skewed" example

    // Pure geometry helper (also duplicated in app.js for other tree renderers; unchanged).
    function computeTreeLayout(node, x, y, dx, nodesMeta) {
        if (!node) return;
        nodesMeta.push({ id: node.id, val: node.val, x: x, y: y, color: node.color });
        if (node.left) computeTreeLayout(node.left, x - dx, y + 60, dx * 0.55, nodesMeta);
        if (node.right) computeTreeLayout(node.right, x + dx, y + 60, dx * 0.55, nodesMeta);
    }

    let _threadedState = null;
    function renderTreeThreaded() {
        const host = K().acquireDynamicVizHost();
        if (!_threadedState) _threadedState = { vals: ThreadedViz.SAMPLE.slice() };
        const st = _threadedState;
        const langOf = K().langOf;
        const lang = (global.I18N && I18N.getCurrentLanguage) ? I18N.getCurrentLanguage() : 'en';
        const root = ThreadedViz.buildTreeFromValues(st.vals);
        const res = ThreadedViz.buildThreadedFrames(root);
        const frames = res.frames;

        host.innerHTML =
            '<div class="th-wrap vizfit-host">' +
              '<div class="th-controls">' +
                '<input type="text" class="th-input" value="' + st.vals.join(',') + '">' +
                '<button type="button" class="rand-btn" title="' + (lang === 'zh' ? '隨機' : 'Random') + '">🎲</button>' +
                '<button type="button" class="th-build">' + (lang === 'zh' ? '建立 Build' : 'Build') + '</button>' +
                buildExamplesSelect('tree-threaded', ThreadedViz.SAMPLE.join(',')) +
                '<span class="sm-hint">' + (lang === 'zh' ? '數值建成 BST；虛線 = 中序線索' : 'values build a BST; dashed = inorder thread') + '</span>' +
              '</div>' +
              '<div class="th-scroll vizfit-scroll"><svg class="th-svg"></svg></div>' +
              '<div class="th-output"><strong>Inorder:</strong> <span class="th-seq"></span></div>' +
              '<div class="th-phase"></div>' +
            '</div>';

        const wrap = host.querySelector('.th-wrap');
        const scrollEl = wrap.querySelector('.th-scroll');
        const svgEl = scrollEl.querySelector('.th-svg');

        const meta = [];
        computeTreeLayout(root, 200, 30, 90, meta);
        const byId = {}; meta.forEach((m) => { byId[m.id] = m; });
        const R = 16;
        const xs = meta.map((m) => m.x), ys = meta.map((m) => m.y);
        const minX = Math.min.apply(null, xs) - R - 12;
        const maxX = Math.max.apply(null, xs) + R + 12;
        const minY = Math.min.apply(null, ys) - 46;   // threads arc ~30 above a node
        const maxY = Math.max.apply(null, ys) + R + 12;
        const natW = Math.max(maxX - minX, 120), natH = Math.max(maxY - minY, 120);

        function paint(fr) {
            if (!svgEl.isConnected) return;
            const sz = K().fitFocusSize(scrollEl, natW, natH);
            let inner = '';
            (function walk(n) { if (!n) return; [n.left, n.right].forEach((c) => { if (!c) return; const a = byId[n.id], b = byId[c.id]; inner += '<line class="th-edge" x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '"/>'; walk(c); }); })(root);
            (fr.threads || []).forEach((t) => { const a = byId[t.fromId], b = byId[t.toId]; if (!a || !b) return; const midY = Math.min(a.y, b.y) - 30; inner += '<path class="th-thread" d="M' + a.x + ',' + a.y + ' Q' + ((a.x + b.x) / 2) + ',' + midY + ' ' + b.x + ',' + b.y + '"/>'; });
            meta.forEach((m) => { const cls = 'th-node' + (fr.current === m.id ? ' active' : (fr.visited.includes(m.val) ? ' visited' : '')); inner += '<circle class="' + cls + '" cx="' + m.x + '" cy="' + m.y + '" r="' + R + '"/><text class="th-node-label" x="' + m.x + '" y="' + m.y + '">' + m.val + '</text>'; });
            svgEl.setAttribute('viewBox', minX + ' ' + minY + ' ' + natW + ' ' + natH);
            svgEl.setAttribute('width', sz.w);
            svgEl.setAttribute('height', sz.h);
            svgEl.innerHTML = inner;
            host.querySelector('.th-seq').textContent = fr.visited.join(', ');
            host.querySelector('.th-phase').textContent = langOf(fr.msg);
        }

        const exSelect = wrap.querySelector('.ex-select');
        if (exSelect && !Array.from(exSelect.options).some((o) => o.value === TH_SKEW)) {
            const opt = document.createElement('option');
            opt.value = TH_SKEW; opt.textContent = (lang === 'zh' ? '左斜樹' : 'Left-skewed');
            exSelect.insertBefore(opt, exSelect.options[2] || null);
        }
        wrap.appendChild(K().buildFrameControls(frames, paint, { runIntervalMs: 700 }));
        K().markFocusFit(host, { svg: true });   // viz-fit-svg: per-SVG drawing-only zoom

        host.querySelector('.th-build').onclick = () => {
            const vals = host.querySelector('.th-input').value.split(',').map((s) => parseInt(s.trim(), 10)).filter(Number.isFinite);
            if (vals.length) { st.vals = vals; saveExample('tree-threaded', st.vals.join(','), ThreadedViz.SAMPLE.join(',')); renderTreeThreaded(); }
        };
        host.querySelector('.rand-btn').onclick = () => {
            const inp = window.RandomInput && RandomInput.randomInputFor('tree-threaded', K().getInputDifficulty());
            if (!inp) return;
            _threadedState.vals = inp.vals;
            saveExample('tree-threaded', _threadedState.vals.join(','), ThreadedViz.SAMPLE.join(','));
            renderTreeThreaded();
        };
        if (exSelect) exSelect.onchange = (ev) => {
            const v = ev.target.value; if (!v) return;
            const vals = v.split(',').map((s) => parseInt(s.trim(), 10)).filter(Number.isFinite);
            if (vals.length) { _threadedState.vals = vals; renderTreeThreaded(); }
        };
    }

    global.VizRegistry.attach('tree-threaded', {
        render: renderTreeThreaded,
        code: () => codeTreeThreaded,
        layout: { host: 'dynamic' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 5: Replace the threaded stage CSS (`style.css`)**

Replace lines 2903–2905:
```css
.th-stage { position: relative; height: 320px; overflow: hidden; }
.th-stage .th-edges { position: absolute; inset: 0; width: 100%; height: 100%; }
.th-stage .th-nodes { position: absolute; inset: 0; }
```
with:
```css
.th-wrap { width: 100%; }
.th-svg { display: block; }
.th-edge { stroke: #94a3b8; stroke-width: 2; }
.th-thread { fill: none; stroke: #a855f7; stroke-width: 2; stroke-dasharray: 5 4; }
.th-node { fill: #1e293b; stroke: #64748b; stroke-width: 2; }
.th-node.active { fill: #f59e0b; stroke: #b45309; }
.th-node.visited { fill: #2563eb; stroke: #1e40af; }
.th-node-label { fill: #ffffff; font-size: 13px; font-weight: 700; text-anchor: middle; dominant-baseline: middle; }
```
(Leave `.th-controls` / `.th-controls .th-input` at 2901–2902 untouched. Do NOT touch the shared `.tree-node` class.)

- [ ] **Step 6: Run the new e2e to verify it passes**

Run: `npx playwright test tests/threaded_vizfit.spec.js`
Expected: PASS (all 3) — SVG nodes (7, no HTML overlay), bounded scroll, examples + 🎲, stepping/threads, fullscreen viz-fit-svg + SVG width grows + VCR operable + code drawer hidden.

- [ ] **Step 7: Run the full suites (no regression)**

Run: `npm run test:unit && npm test`
Expected: unit green; full Playwright green — including `tests/vizfit.spec.js`, `tests/catalan_vizfit.spec.js`, `tests/tgb_vizfit.spec.js`, fullscreen specs. If a pre-existing threaded test asserted the old HTML `.tree-node` overlay, update it to the SVG `.th-node` (note it in the report).

- [ ] **Step 8: Commit**

```bash
git add js/app.js js/viz/viz_threaded.js style.css tests/threaded_vizfit.spec.js
git commit -m "feat(dsvisual): tree-threaded — viewBox-SVG rewrite + vizfit-svg + examples + codeDrawer"
```

---

## Self-Review

**1. Spec coverage:**
- `codeDrawer:true` → Step 3. ✓
- viewBox-SVG rewrite (edges + threads + nodes as `<circle>`+`<text>`; viewBox from bounds; `fitFocusSize` sizing) → Step 4 `paint` + bounds. ✓
- vizfit-svg wrap (`.th-wrap.vizfit-host`/`.th-scroll.vizfit-scroll`, VCR + output/phase later siblings, `markFocusFit(host,{svg:true})`) → Step 4. ✓
- Examples (trio + `.ex-select` + built-in "Left-skewed" + save on Build/🎲) → Step 4. ✓
- Keep shared `RandomInput` 🎲 → Step 4 `.rand-btn` handler. ✓
- SVG CSS replaces stage CSS; `.tree-node` + `computeTreeLayout` untouched → Steps 4/5. ✓
- Tests: SVG nodes (no HTML overlay), stepping/threads, examples/🎲/Build, fullscreen viz-fit-svg + width-grows + VCR + drawer → Step 1. ✓

**2. Placeholder scan:** No TBD/TODO; the full file is provided in Step 4; commands have expected results. ✓

**3. Type/name consistency:** `fitFocusSize(scrollEl, natW, natH)` + `markFocusFit(host,{svg:true})` (Phase-0 signatures); classes `.th-wrap`/`.vizfit-host`/`.th-scroll`/`.vizfit-scroll`/`.th-svg`/`.th-node`/`.th-node-label`/`.th-edge`/`.th-thread`/`.rand-btn`/`.ex-select` identical across the renderer (Step 4), CSS (Step 5), and tests (Step 1); `saveExample('tree-threaded', vals.join(','), ThreadedViz.SAMPLE.join(','))` consistent; `TH_SKEW` defined + injected; `RandomInput.randomInputFor('tree-threaded', …)` unchanged; `data-method-section="tree-threaded"` matches the row id. ✓
