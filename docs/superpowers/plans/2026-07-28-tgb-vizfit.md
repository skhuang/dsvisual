# tree-general-binary vizfit + examples + random Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring `tree-general-binary` to the trie's presentation — hidden code, bounded/fullscreen-expanding dual-panel drawing (wrapper zoom), saveable examples, and a difficulty-aware 🎲 random general-tree generator.

**Architecture:** Add a pure `TreeGeneralBinaryViz.randomInput(difficulty)`; then in the renderer add `codeDrawer:true`, the ExamplesStore trio + `.ex-select`, a 🎲 button, and wrap the dual-panel stage in the Phase-0 vizfit `viz-fit` path (`.vizfit-host`/`.vizfit-scroll` + `markFocusFit(host)` with no `{svg}`).

**Tech Stack:** vanilla JS (dual-export `js/tree_general_binary_viz.js`, renderer `js/viz/viz_tgb.js`), `js/app.js` row, plain CSS, `node:test` unit + Playwright e2e.

## Global Constraints

- Targeted `git add` by explicit path only; never `git add -A`/`.`/`-u`; run `git status` first.
- Never hand-edit generated files (`js/code_db.js`, `slides/**`, `js/slides_rendered.js`).
- `.vizfit-host` a DIRECT child of `#dynamic-viz-host`; VCR a later DOM sibling of `.vizfit-scroll`.
- `viz-fit` path ONLY — `K().markFocusFit(host)` with NO `{svg:true}`, NO `fitFocusSize` (dual-panel → whole-wrapper zoom). No per-SVG fit.
- Examples-helper trio is duplicated per convention — do NOT refactor it into a shared module.
- Traditional-zh inline labels. Non-focus + all other viz UNCHANGED.
- e2e assert robust locators (counts, class presence, value regex, bounding-rect geometry) — never SVG edge visibility.
- `randomInput` output must round-trip through `parseGeneralTree`/`toBinary`/`convertFrames` (one root; every non-root exactly one parent; unique A–Z labels).
- One branch (`feat/tgb-vizfit`, already created) + one PR.

---

### Task 1: Pure `randomInput(difficulty)` in `js/tree_general_binary_viz.js`

**Files:**
- Modify: `js/tree_general_binary_viz.js` (add `randomInput`; export on `api`)
- Test: `tests/unit/tree_general_binary_viz.test.js` (create)

**Interfaces:**
- Consumes: `parseGeneralTree`, `toBinary`, `convertFrames` (same module).
- Produces: `TreeGeneralBinaryViz.randomInput(difficulty) → string` (adjacency `P:c1,c2;…`).

- [ ] **Step 1: Write the failing unit test**

Create `tests/unit/tree_general_binary_viz.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert');
const T = require('../../js/tree_general_binary_viz.js');

function parentCounts(parsed) {
  // count how many children-lists each node appears in
  const cnt = {};
  parsed.nodes.forEach((n) => { cnt[n] = 0; });
  Object.keys(parsed.children).forEach((p) => {
    (parsed.children[p] || []).forEach((c) => { cnt[c] = (cnt[c] || 0) + 1; });
  });
  return cnt;
}

test('randomInput yields a valid rooted general tree for every difficulty', () => {
  for (const d of ['normal', 'special', 'edge', 'large']) {
    for (let i = 0; i < 8; i++) {
      const s = T.randomInput(d);
      assert.strictEqual(typeof s, 'string');
      assert.match(s, /^[A-Z:,;]+$/, d + ' chars: ' + s);
      const g = T.parseGeneralTree(s);
      assert.ok(g.root, d + ' has a root: ' + s);
      // exactly one root: every node except root appears in exactly one children list; root in zero
      const cnt = parentCounts(g);
      assert.strictEqual(cnt[g.root], 0, d + ' root has no parent: ' + s);
      g.nodes.forEach((n) => { if (n !== g.root) assert.strictEqual(cnt[n], 1, d + ' node ' + n + ' has one parent: ' + s); });
      // labels unique
      assert.strictEqual(new Set(g.nodes).size, g.nodes.length, d + ' unique labels: ' + s);
      // round-trips without throwing
      assert.doesNotThrow(() => T.convertFrames(T.parseGeneralTree(s)));
      assert.doesNotThrow(() => T.toBinary(g));
    }
  }
});

test('edge difficulty can be a single node', () => {
  const seen = new Set();
  for (let i = 0; i < 30; i++) seen.add(T.randomInput('edge'));
  assert.ok([...seen].some((s) => T.parseGeneralTree(s).nodes.length === 1), 'edge sometimes single node');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/unit/tree_general_binary_viz.test.js`
Expected: FAIL — `T.randomInput is not a function`.

- [ ] **Step 3: Implement `randomInput` in `js/tree_general_binary_viz.js`**

Add this function just before the `const api = {…}` line:

```js
  function randomInput(difficulty) {
    var d = difficulty || 'normal';
    var LETTERS = 'ABCDEFGHIJKLMNOPQRST';   // cap 20 → single-letter labels
    function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
    function emit(children, order) {
      return order.filter(function (p) { return (children[p] || []).length; })
                  .map(function (p) { return p + ':' + children[p].join(','); })
                  .join(';');
    }
    if (d === 'edge') {
      var pick = randInt(0, 2);
      if (pick === 0) return 'A';                 // single node
      if (pick === 1) return 'A:B;B:C;C:D';       // pure chain
      return 'A:B,C,D,E,F';                       // star
    }
    if (d === 'special') {
      if (Math.random() < 0.5) {                  // wide fan
        var k = randInt(4, 6), order = ['A'], children = { A: [] }, next = 1;
        for (var i = 0; i < k && next < LETTERS.length; i++) { var lab = LETTERS[next++]; children.A.push(lab); order.push(lab); children[lab] = []; }
        children.A.slice().forEach(function (c) { if (Math.random() < 0.5 && next < LETTERS.length) { var gl = LETTERS[next++]; children[c] = [gl]; order.push(gl); children[gl] = []; } });
        return emit(children, order);
      }
      var depth = randInt(5, 7), parts = [];      // deep chain
      for (var j = 0; j < depth && j + 1 < LETTERS.length; j++) parts.push(LETTERS[j] + ':' + LETTERS[j + 1]);
      return parts.join(';');
    }
    var n, cap;
    if (d === 'large') { n = randInt(10, 14); cap = 4; } else { n = randInt(5, 7); cap = 3; }
    var placed = ['A'], childMap = { A: [] }, ord = ['A'];
    for (var idx = 1; idx < n && idx < LETTERS.length; idx++) {
      var label = LETTERS[idx];
      var candidates = placed.filter(function (p) { return childMap[p].length < cap; });
      var parent = candidates[randInt(0, candidates.length - 1)];
      childMap[parent].push(label); childMap[label] = []; placed.push(label); ord.push(label);
    }
    return emit(childMap, ord);
  }
```
Then add `randomInput` to the exported `api`:
```js
  const api = { parseGeneralTree: parseGeneralTree, toBinary: toBinary, convertFrames: convertFrames, SAMPLE: 'A:B,C,D;B:E,F;C:G', randomInput: randomInput };
```

- [ ] **Step 4: Run the unit test to verify it passes**

Run: `node --test tests/unit/tree_general_binary_viz.test.js`
Expected: PASS (both tests).

- [ ] **Step 5: Run the full unit suite**

Run: `npm run test:unit`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add js/tree_general_binary_viz.js tests/unit/tree_general_binary_viz.test.js
git commit -m "feat(dsvisual): tree-general-binary randomInput (difficulty-aware valid rooted tree)"
```

---

### Task 2: vizfit `viz-fit` + examples + 🎲 in `js/viz/viz_tgb.js`

**Files:**
- Modify: `js/app.js:93` (`tree-general-binary` row — add `codeDrawer: true`)
- Modify: `js/viz/viz_tgb.js` (examples trio; wrapped markup; VCR into wrap + `markFocusFit`; 🎲/examples wiring)
- Modify: `style.css` (add `.tgb-wrap { width: 100%; }`)
- Test: `tests/tgb_vizfit.spec.js` (create)

**Interfaces:**
- Consumes (Task 1): `TreeGeneralBinaryViz.randomInput(difficulty)`. Consumes (Phase 0): `K().markFocusFit`, `.vizfit-host`/`.vizfit-scroll`, base `.vizfit-scroll` CSS. Consumes: `K().getInputDifficulty`, `ExamplesStore`.
- Produces: `tree-general-binary` on the vizfit `viz-fit` path with examples + a 🎲.

- [ ] **Step 1: Write the failing e2e test**

Create `tests/tgb_vizfit.spec.js`:

```js
const { test, expect } = require('@playwright/test'); const path = require('path');
const FILE_URI = 'file://' + path.resolve(__dirname, '../index.html');

test.describe('tree-general-binary vizfit + examples + random', () => {
  test('vizfit wrap + examples + 🎲; both panels render + step', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=tree-general-binary');
    await expect(page.locator('.tgb-wrap.vizfit-host')).toHaveCount(1);
    const scroll = page.locator('.tgb-scroll.vizfit-scroll');
    await expect(scroll).toHaveCount(1);
    expect(await scroll.evaluate((el) => el.clientHeight <= window.innerHeight - 120)).toBe(true);
    await expect(page.locator('.ex-select')).toBeVisible();
    await expect(page.locator('.tgb-random')).toBeVisible();
    expect(await page.locator('.tgb-general .tree-node').count()).toBeGreaterThan(0);
    expect(await page.locator('.tgb-binary .tree-node').count()).toBeGreaterThan(0);
    const scrub = page.locator('.stepctl .stepctl-scrubber');
    await scrub.evaluate((el) => { el.value = el.max; el.dispatchEvent(new Event('input', { bubbles: true })); });
    expect(await page.locator('.tgb-binary-edges line').count()).toBeGreaterThan(0);
  });

  test('🎲 generates a valid tree; Build saves an example', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=tree-general-binary');
    await page.click('.tgb-random');
    const v = await page.locator('.tgb-input').inputValue();
    expect(v).toMatch(/^[A-Z:,;]+$/);
    expect(await page.locator('.tgb-general .tree-node').count()).toBeGreaterThan(0);
    await page.fill('.tgb-input', 'A:B,C');
    await page.click('.tgb-build');
    expect(await page.locator('.tgb-general .tree-node').count()).toBe(3);
    const opts = await page.locator('.ex-select option').count();
    expect(opts).toBeGreaterThan(2);   // placeholder + default + built-in/saved
  });

  test('fullscreen: card viz-fit, VCR operable, zoom toolbar; code drawer hidden', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=tree-general-binary');
    await page.locator('.method-section-card.active .viz-focus-toggle').click();
    await expect(page.locator('.method-section-card.active')).toHaveClass(/viz-fit(\s|$)/);
    const inView = await page.locator('.stepctl').evaluate((el) => el.getBoundingClientRect().bottom <= window.innerHeight + 1);
    expect(inView).toBe(true);
    await expect(page.locator('.viz-zoom-controls')).toBeVisible();
    await expect(page.locator('[data-method-section="tree-general-binary"] .code-drawer')).toBeHidden();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx playwright test tests/tgb_vizfit.spec.js`
Expected: FAIL — `.tgb-wrap.vizfit-host` / `.ex-select` / `.tgb-random` do not exist; code panel not drawered.

- [ ] **Step 3: Add `codeDrawer: true` to the method row (`js/app.js:93`)**

Change:
```js
            { id: 'tree-general-binary', title: 'General ↔ Binary Tree', file: 'tree_general_binary.cpp', visualizer: 'tgb', controls: 'tgb' },
```
to:
```js
            { id: 'tree-general-binary', title: 'General ↔ Binary Tree', file: 'tree_general_binary.cpp', visualizer: 'tgb', controls: 'tgb', codeDrawer: true },
```

- [ ] **Step 4: Add the examples-helper trio to `js/viz/viz_tgb.js`**

At the top of the IIFE, right after `const K = () => global.VizKit;` (line 2), insert (duplicated per convention — do NOT refactor):
```js
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
    var TGB_MISS = 'A:B;B:C;C:D;D:E';   // built-in "Deep chain" example
```

- [ ] **Step 5: Wrap the render markup + examples/random controls (`js/viz/viz_tgb.js`)**

Replace the `host.innerHTML = …` assignment (the `.tt-controls` + `.tgb-stage` block, lines 12–32) with:
```js
        const lang = (global.I18N && I18N.getCurrentLanguage) ? I18N.getCurrentLanguage() : 'en';
        host.innerHTML =
            '<div class="tgb-wrap vizfit-host">' +
              '<div class="tt-controls">' +
                '<input type="text" class="tgb-input" placeholder="A:B,C,D;B:E,F" value="' + String(_tgbState.text).replace(/"/g, '&quot;') + '">' +
                '<button type="button" class="tgb-build">' + (lang === 'zh' ? '建立 Build' : 'Build') + '</button>' +
                '<button type="button" class="tgb-random" title="' + (lang === 'zh' ? '隨機輸入' : 'Random input') + '">🎲</button>' +
                buildExamplesSelect('tree-general-binary', TreeGeneralBinaryViz.SAMPLE) +
              '</div>' +
              '<div class="tgb-scroll vizfit-scroll">' +
                '<div class="tgb-stage" style="display:flex;gap:16px;flex-wrap:wrap">' +
                  '<div style="flex:1 1 280px;min-width:260px">' +
                    '<div class="tgb-col-head" style="font-weight:700;margin-bottom:4px">General tree</div>' +
                    '<div class="tgb-general" style="position:relative;overflow:hidden;height:300px;border:1px solid #e2e8f0;border-radius:8px">' +
                      '<svg class="tgb-general-edges" style="position:absolute;inset:0;width:100%;height:100%"></svg>' +
                      '<div class="tgb-general-nodes"></div>' +
                    '</div>' +
                  '</div>' +
                  '<div style="flex:1 1 280px;min-width:260px">' +
                    '<div class="tgb-col-head" style="font-weight:700;margin-bottom:4px">Binary tree (left-child / right-sibling)</div>' +
                    '<div class="tgb-binary" style="position:relative;overflow:hidden;height:300px;border:1px solid #e2e8f0;border-radius:8px">' +
                      '<svg class="tgb-binary-edges" style="position:absolute;inset:0;width:100%;height:100%"></svg>' +
                      '<div class="tgb-binary-nodes"></div>' +
                    '</div>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>';
```
(The `genMeta`/`binMeta` layout code, the `host.querySelector('.tgb-general-nodes' | …)` lookups, and `paint` remain UNCHANGED — every element still lives inside `host`.)

- [ ] **Step 6: Inject the built-in example, append the VCR into the wrap, and markFocusFit**

Replace the current `host.appendChild(K().buildFrameControls(frames, paint, { runIntervalMs: 700 }));` (line 138) with:
```js
        const wrap = host.querySelector('.tgb-wrap');
        const exSelect = wrap.querySelector('.ex-select');
        if (exSelect && !Array.from(exSelect.options).some(function (o) { return o.value === TGB_MISS; })) {
            const opt = document.createElement('option');
            opt.value = TGB_MISS; opt.textContent = (lang === 'zh' ? '深鏈' : 'Deep chain');
            exSelect.insertBefore(opt, exSelect.options[2] || null);
        }
        wrap.appendChild(K().buildFrameControls(frames, paint, { runIntervalMs: 700 }));
        K().markFocusFit(host);   // viz-fit path (no {svg}) — bounded + fullscreen-expand + wrapper zoom
```

- [ ] **Step 7: Wire Build (with save), 🎲, and the examples select (`js/viz/viz_tgb.js`)**

Replace the current `.tgb-build` handler (lines 140–145) with the three handlers:
```js
        host.querySelector('.tgb-build').onclick = () => {
            _tgbState.text = host.querySelector('.tgb-input').value;
            saveExample('tree-general-binary', _tgbState.text, TreeGeneralBinaryViz.SAMPLE);
            renderTreeGeneralBinary();
        };
        host.querySelector('.tgb-random').onclick = () => {
            const dfc = (K().getInputDifficulty && K().getInputDifficulty()) || 'normal';
            _tgbState.text = TreeGeneralBinaryViz.randomInput(dfc);
            saveExample('tree-general-binary', _tgbState.text, TreeGeneralBinaryViz.SAMPLE);
            renderTreeGeneralBinary();
        };
        if (exSelect) exSelect.onchange = (ev) => {
            const v = ev.target.value; if (!v) return;
            _tgbState.text = v; renderTreeGeneralBinary();
        };
```

- [ ] **Step 8: Add the minimal CSS (`style.css`)**

Append at the end of `style.css`:
```css

/* tree-general-binary vizfit wrap (Phase-1 vizfit adopter) */
.tgb-wrap { width: 100%; }
```

- [ ] **Step 9: Run the e2e to verify it passes**

Run: `npx playwright test tests/tgb_vizfit.spec.js`
Expected: PASS (all 3 tests).

- [ ] **Step 10: Run the full suites (no regression)**

Run: `npm run test:unit && npm test`
Expected: unit green; full Playwright green — including `tests/vizfit.spec.js`, `tests/catalan_vizfit.spec.js`, fullscreen specs, any existing tgb test. No regressions.

- [ ] **Step 11: Commit**

```bash
git add js/app.js js/viz/viz_tgb.js style.css tests/tgb_vizfit.spec.js
git commit -m "feat(dsvisual): tree-general-binary adopts vizfit + examples + difficulty-aware random"
```

---

## Self-Review

**1. Spec coverage:**
- `codeDrawer:true` → Task 2 Step 3. ✓
- pure `randomInput` (difficulty shapes; valid rooted tree; round-trips) → Task 1. ✓
- ExamplesStore trio + `.ex-select` + built-in "Deep chain" + save on Build/🎲 → Task 2 Steps 4/6/7. ✓
- 🎲 uses `getInputDifficulty` + `randomInput` → Task 2 Step 7. ✓
- vizfit `viz-fit` wrap (`.tgb-wrap.vizfit-host` + `.tgb-scroll.vizfit-scroll` + VCR-into-wrap + `markFocusFit(host)` no svg) → Task 2 Steps 5/6. ✓
- `.tgb-wrap { width:100% }` → Task 2 Step 8. ✓
- Tests: unit (randomInput validity) + e2e (vizfit wrap, examples/🎲, both panels+step, fullscreen viz-fit+VCR+zoom, code drawer) → Task 1 Step 1 + Task 2 Step 1. ✓

**2. Placeholder scan:** No TBD/TODO; complete code each step; commands have expected results. ✓

**3. Type/name consistency:** `randomInput(difficulty)→string` defined Task 1, consumed Task 2 Step 7; examples trio + `saveExample('tree-general-binary', text, TreeGeneralBinaryViz.SAMPLE)` consistent; classes `.tgb-wrap`/`.vizfit-host`/`.tgb-scroll`/`.vizfit-scroll`/`.tgb-random`/`.ex-select` identical across markup, CSS, and tests; `markFocusFit(host)` no-svg (viz-fit); `TGB_MISS` defined Step 4, used Step 6; `data-method-section="tree-general-binary"` matches the row id; `paint`/layout/`host.querySelector` lookups unchanged and still resolve inside `host`. ✓
