# Viz Refinements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Three dsvisual refinements — make the trie's edge characters visible, add a two-tier random-input difficulty (global + per-viz override, with a trie random button), and make fullscreen (focus mode) auto-fit the visualization like the RB-tree viz.

**Architecture:** #1 is a CSS contrast fix. #2 replaces the per-group difficulty model with global + per-viz-override storage, relabels the ⚙ setting as global, injects a per-viz difficulty `<select>` next to every `.ex-select` via a MutationObserver on the runtime container, and adds a difficulty-aware 🎲 to the trie. #3 sizes the trie SVG to its host in `paint()` (viewBox + host-scaled width/height, like `tree_rb_viz.js`), makes `buildFrameControls` repaint the current frame on window resize (cursor-safe), and has `initVizFocus` dispatch a resize on focus enter/exit.

**Tech Stack:** Vanilla JS (`js/app.js` IIFE, `js/viz/viz_trie.js`, dual-export `js/trie_viz.js`), plain CSS/SVG, `node:test` unit, Playwright e2e.

## Global Constraints

- Targeted `git add` by explicit path only; never `git add -A`/`.`/`-u`; run `git status` first (concurrent sessions).
- Never hand-edit generated files (`js/code_db.js`, `slides/**`, `js/slides_rendered.js`).
- Traditional Chinese (zh-Hant) for all zh copy; trie viz labels stay inline bilingual.
- `getInputDifficulty()` keeps its no-arg signature (consumers unchanged); resolution = per-viz override for `currentMode` else global.
- e2e assert robust locators (counts, values, storage, banner, SVG width attribute) — never SVG edge visibility.
- One branch (`feat/viz-refinements`, already created) + one PR. No new category/method ⇒ overview counts unchanged.

---

### Task 1: Trie edge-char visibility (CSS contrast)

**Files:**
- Modify: `style.css:3300` (`.trie-edge-label`)
- Test: `tests/viz_refinements.spec.js` (create)

**Interfaces:**
- Consumes: nothing.
- Produces: a readable `.trie-edge-label` (dark fill + white halo).

- [ ] **Step 1: Write the failing e2e test**

Create `tests/viz_refinements.spec.js`:

```js
const { test, expect } = require('@playwright/test'); const path = require('path');
const FILE_URI = 'file://' + path.resolve(__dirname, '../index.html');

test.describe('viz refinements', () => {
  test('trie edge labels are a dark, visible color', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=tree-trie');
    const step = page.locator('.stepctl [data-action="step"]');
    await step.click(); await step.click();                 // reveal an edge + its label
    const label = page.locator('.trie-edge-label').first();
    await expect(label).toHaveCount(1);
    const fill = await label.evaluate((el) => getComputedStyle(el).fill);
    expect(fill).toBe('rgb(30, 41, 59)');                    // #1e293b, not the old light #cbd5e1
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx playwright test tests/viz_refinements.spec.js -g "edge labels"`
Expected: FAIL — computed fill is `rgb(203, 213, 225)` (#cbd5e1), not `rgb(30, 41, 59)`.

- [ ] **Step 3: Darken the edge label + add a legibility halo**

In `style.css:3300`, replace:
```css
.trie-edge-label { fill: #cbd5e1; font-size: 12px; font-weight: 700; text-anchor: middle; dominant-baseline: middle; }
```
with:
```css
.trie-edge-label { fill: #1e293b; font-size: 12px; font-weight: 800; text-anchor: middle; dominant-baseline: middle; paint-order: stroke; stroke: #ffffff; stroke-width: 3px; stroke-linejoin: round; }
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx playwright test tests/viz_refinements.spec.js -g "edge labels"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add style.css tests/viz_refinements.spec.js
git commit -m "fix(dsvisual): trie edge-char labels — dark fill + white halo for legibility"
```

---

### Task 2: Two-tier difficulty (global + per-viz inline override)

**Files:**
- Modify: `js/app.js` (difficulty constants/helpers ~1040–1073; add inline-injection init; call it at init ~1428)
- Modify: `js/i18n.js` (`settings.difficulty` both dicts ~193/446; add `difficulty.follow-global`)
- Modify: `style.css` (add `.viz-difficulty` styling)
- Test: `tests/viz_refinements.spec.js` (extend)

**Interfaces:**
- Consumes: `currentMode`, `runtimeVisualizer`, `DIFFICULTY_VALUES`, `t`.
- Produces: `getGlobalDifficulty()`, `getVizOverride(methodId)`, `getInputDifficulty()` (override ?? global), `setGlobalDifficulty(v)`, `setVizOverride(methodId, v)`; a `.viz-difficulty` `<select>` injected after every `.ex-select`.

- [ ] **Step 1: Write the failing e2e test**

Append inside the `test.describe('viz refinements', …)` block in `tests/viz_refinements.spec.js`:

```js
  test('two-tier difficulty: inline per-viz override is independent of the global setting', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=tree-trie');
    const inline = page.locator('.viz-difficulty').first();
    await expect(inline).toBeVisible();
    // it sits right after the examples select
    const isSibling = await page.evaluate(() => {
      const ex = document.querySelector('.ex-select');
      return !!(ex && ex.nextElementSibling && ex.nextElementSibling.classList.contains('viz-difficulty'));
    });
    expect(isSibling).toBe(true);
    await expect(inline).toHaveValue('');                    // follows global by default

    // set the GLOBAL difficulty via the settings drawer
    await page.click('#settings-toggle');
    await page.selectOption('#input-difficulty', 'large');
    await page.click('[data-settings-close]');
    await expect(inline).toHaveValue('');                    // still follows global (no per-viz override yet)

    // set the inline PER-VIZ override
    await inline.selectOption('edge');
    const store = await page.evaluate(() => ({
      g: localStorage.getItem('dsvisual.inputDifficulty.global'),
      v: localStorage.getItem('dsvisual.inputDifficulty.viz.tree-trie'),
    }));
    expect(store.g).toBe('large');                           // global unchanged
    expect(store.v).toBe('edge');                            // per-viz override independent
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx playwright test tests/viz_refinements.spec.js -g "two-tier"`
Expected: FAIL — `.viz-difficulty` does not exist.

- [ ] **Step 3: Replace the difficulty model in `js/app.js`**

Find (starting at `js/app.js:1040`):
```js
    const DIFFICULTY_KEY_PREFIX = 'dsvisual.inputDifficulty.';
    const DIFFICULTY_VALUES = ['normal', 'special', 'edge', 'large'];
```
Change to (keep `DIFFICULTY_VALUES`; the old prefix constant is no longer used — remove it and add the two new keys):
```js
    const DIFFICULTY_VALUES = ['normal', 'special', 'edge', 'large'];
    const DIFFICULTY_GLOBAL_KEY = 'dsvisual.inputDifficulty.global';
    const DIFFICULTY_VIZ_PREFIX = 'dsvisual.inputDifficulty.viz.';
```

Then replace the whole block `getInputDifficulty`/`setInputDifficulty`/`syncDifficultySelect`/`bindDifficultySelect` (`js/app.js:1043-1073`) with:
```js
    function getGlobalDifficulty() {
        let v = null;
        try { v = localStorage.getItem(DIFFICULTY_GLOBAL_KEY); } catch (e) { v = null; }
        return DIFFICULTY_VALUES.indexOf(v) === -1 ? 'normal' : v;
    }
    function getVizOverride(methodId) {
        let v = null;
        try { v = localStorage.getItem(DIFFICULTY_VIZ_PREFIX + methodId); } catch (e) { v = null; }
        return DIFFICULTY_VALUES.indexOf(v) === -1 ? null : v;
    }
    function getInputDifficulty() {
        return getVizOverride(currentMode) || getGlobalDifficulty();
    }
    function setGlobalDifficulty(value) {
        if (DIFFICULTY_VALUES.indexOf(value) === -1) return;
        try { localStorage.setItem(DIFFICULTY_GLOBAL_KEY, value); } catch (e) { /* ignore */ }
    }
    function setVizOverride(methodId, value) {
        try {
            if (value && DIFFICULTY_VALUES.indexOf(value) !== -1) localStorage.setItem(DIFFICULTY_VIZ_PREFIX + methodId, value);
            else localStorage.removeItem(DIFFICULTY_VIZ_PREFIX + methodId);
        } catch (e) { /* ignore */ }
    }

    function syncDifficultySelect() {
        const sel = document.getElementById('input-difficulty');
        if (!sel) return;
        sel.value = getGlobalDifficulty();
        const cap = document.getElementById('input-difficulty-cat');
        if (cap) cap.textContent = (typeof t === 'function' ? t('difficulty.follow-global') : '') || '';
    }

    function bindDifficultySelect() {
        const sel = document.getElementById('input-difficulty');
        if (!sel) return;
        sel.addEventListener('change', () => { setGlobalDifficulty(sel.value); });
        syncDifficultySelect();
    }

    function buildInlineDifficultySelect() {
        const sel = document.createElement('select');
        sel.className = 'viz-difficulty';
        sel.setAttribute('data-testid', 'viz-difficulty');
        sel.setAttribute('aria-label', (typeof t === 'function' ? t('settings.difficulty') : 'Random input difficulty'));
        const follow = document.createElement('option');
        follow.value = '';
        follow.textContent = (typeof t === 'function' ? t('difficulty.follow-global') : 'Follow global');
        sel.appendChild(follow);
        DIFFICULTY_VALUES.forEach((v) => {
            const o = document.createElement('option');
            o.value = v;
            o.textContent = (typeof t === 'function' ? t('difficulty.' + v) : v);
            sel.appendChild(o);
        });
        sel.value = getVizOverride(currentMode) || '';
        sel.addEventListener('change', () => { setVizOverride(currentMode, sel.value); });
        return sel;
    }

    function injectInlineDifficulty(root) {
        const scope = root || document;
        scope.querySelectorAll('.ex-select').forEach((ex) => {
            const next = ex.nextElementSibling;
            if (next && next.classList.contains('viz-difficulty')) return;
            ex.insertAdjacentElement('afterend', buildInlineDifficultySelect());
        });
    }

    function initInlineDifficulty() {
        if (!runtimeVisualizer) return;
        injectInlineDifficulty(runtimeVisualizer);
        const obs = new MutationObserver(() => injectInlineDifficulty(runtimeVisualizer));
        obs.observe(runtimeVisualizer, { childList: true, subtree: true });
    }
```
(The injected select has class `viz-difficulty` only — NOT `ex-select` — so the `.ex-select` query never matches it, and the `nextElementSibling` guard makes re-injection idempotent, so the MutationObserver does not loop.)

- [ ] **Step 4: Call the inline-difficulty init at startup**

In `js/app.js`, find (near `js/app.js:1428`):
```js
    bindDifficultySelect();
    initVizFocus();
```
Change to:
```js
    bindDifficultySelect();
    initInlineDifficulty();
    initVizFocus();
```

- [ ] **Step 5: Update i18n (`js/i18n.js`)**

In the `en` dict, change `settings.difficulty` (`js/i18n.js:193`) and add `difficulty.follow-global` right after `difficulty.large` (`js/i18n.js:197`):
```js
            'settings.difficulty':          'Random input difficulty (all visualizers)',
```
```js
            'difficulty.follow-global':     'Follow global',
```
In the `zh` dict, change `settings.difficulty` (`js/i18n.js:446`) and add `difficulty.follow-global` after `difficulty.large` (`js/i18n.js:450`):
```js
            'settings.difficulty':          '隨機輸入難度（全部視覺化）',
```
```js
            'difficulty.follow-global':     '跟隨全域',
```

- [ ] **Step 6: Style the inline select (`style.css`)**

At the end of `style.css`, append:
```css

/* Inline per-viz difficulty override — mirrors the examples select look. */
.viz-difficulty { max-width: 160px; padding: 2px 4px; border: 1px solid var(--card-border, #cbd5e1); border-radius: 6px; background: var(--card-bg, #fff); font-size: 0.85rem; color: var(--text-main, #1e293b); }
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `npx playwright test tests/viz_refinements.spec.js -g "two-tier"`
Expected: PASS — inline `.viz-difficulty` appears after `.ex-select`, defaults to `''`, global set to `large` leaves it `''`, and setting it to `edge` writes the per-viz key while the global key stays `large`.

- [ ] **Step 8: Commit**

```bash
git add js/app.js js/i18n.js style.css tests/viz_refinements.spec.js
git commit -m "feat(dsvisual): two-tier input difficulty — global setting + per-viz inline override"
```

---

### Task 3: Trie difficulty-aware random input

**Files:**
- Modify: `js/trie_viz.js` (add `randomInput`, export it)
- Modify: `js/viz/viz_trie.js` (🎲 button + handler)
- Test: `tests/unit/trie_viz.test.js` (extend), `tests/viz_refinements.spec.js` (extend)

**Interfaces:**
- Consumes: `global.TrieViz.{parseWords,parseQuery}`; `K().getInputDifficulty()`.
- Produces: `TrieViz.randomInput(difficulty) → { words: string[], query: string }`; a `.trie-random` button in the trie controls.

- [ ] **Step 1: Write the failing unit test**

Append to `tests/unit/trie_viz.test.js`:

```js
test('randomInput respects bounds and round-trips through parse', () => {
  for (const d of ['normal', 'special', 'edge', 'large']) {
    for (let i = 0; i < 5; i++) {
      const r = T.randomInput(d);
      assert.ok(Array.isArray(r.words) && r.words.length >= 1 && r.words.length <= 12, d + ' word count');
      for (const w of r.words) assert.ok(/^[A-Z]{1,8}$/.test(w), d + ' word "' + w + '"');
      assert.strictEqual(typeof r.query, 'string');
      assert.deepStrictEqual(T.parseWords(r.words.join(',')), r.words);   // clamps already applied
      assert.strictEqual(T.parseQuery(r.query), r.query);
    }
  }
});

test('special difficulty words share a common prefix', () => {
  const r = T.randomInput('special');
  const p = r.words[0].slice(0, 2);
  for (const w of r.words) assert.ok(w.startsWith(p), 'word "' + w + '" starts with "' + p + '"');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/unit/trie_viz.test.js`
Expected: FAIL — `T.randomInput is not a function`.

- [ ] **Step 3: Implement `randomInput` in `js/trie_viz.js`**

In `js/trie_viz.js`, add these functions just before the `var api = {…}` export line:
```js
  function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function randWord(minL, maxL, alphabet) {
    var n = randInt(minL, maxL), w = '';
    for (var i = 0; i < n; i++) w += alphabet.charAt(randInt(0, alphabet.length - 1));
    return w;
  }
  function randomInput(difficulty) {
    var d = difficulty || 'normal';
    var words = [];
    if (d === 'large') {
      var nL = randInt(10, 12);
      for (var i = 0; i < nL; i++) words.push(randWord(4, 8, 'ABCDEFGH'));
    } else if (d === 'edge') {
      words.push(randWord(1, 1, 'ABCDE'));
      words.push(randWord(1, 1, 'ABCDE'));
      words.push(randWord(8, 8, 'ABCDE'));
      var dup = randWord(3, 4, 'ABCDE'); words.push(dup); words.push(dup);   // duplicate insert
    } else if (d === 'special') {
      var stem = randWord(2, 3, 'ABCDEF'), nS = randInt(4, 6);
      for (var j = 0; j < nS; j++) words.push((stem + randWord(1, 3, 'ABCDEF')).slice(0, 8));
    } else {
      var nN = randInt(4, 6);
      for (var k = 0; k < nN; k++) words.push(randWord(3, 5, 'ABCDEF'));
    }
    words = words.slice(0, 12).map(function (w) { return w.slice(0, 8); });
    var r = Math.random(), query;
    if (r < 0.34 && words.length) { query = words[randInt(0, words.length - 1)]; }
    else if (r < 0.67 && words.length) { var w0 = words[randInt(0, words.length - 1)]; query = w0.slice(0, Math.max(1, w0.length - 1)); }
    else { query = randWord(2, 4, 'ABCDEFGH'); }
    return { words: words, query: query };
  }
```
Then add `randomInput` to the exported `api` object (the `var api = { … }` line):
```js
  var api = { SAMPLE: SAMPLE, parseWords: parseWords, parseQuery: parseQuery, buildTrie: buildTrie, buildFrames: buildFrames, randomInput: randomInput };
```

- [ ] **Step 4: Run the unit test to verify it passes**

Run: `node --test tests/unit/trie_viz.test.js`
Expected: PASS (all trie unit tests, incl. the two new ones).

- [ ] **Step 5: Add the 🎲 button + handler in `js/viz/viz_trie.js`**

In `js/viz/viz_trie.js`, in the controls markup, add the random button right after the Apply button. Find (`js/viz/viz_trie.js:89`):
```js
          '<button type="button" class="trie-apply">' + (lang === 'zh' ? '套用 Apply' : 'Apply') + '</button>' +
```
Change to:
```js
          '<button type="button" class="trie-apply">' + (lang === 'zh' ? '套用 Apply' : 'Apply') + '</button>' +
          '<button type="button" class="trie-random" title="' + (lang === 'zh' ? '隨機輸入' : 'Random input') + '">🎲</button>' +
```
Then add the click handler right after the `.trie-apply` click handler (which ends at `js/viz/viz_trie.js:139`, the `});` after `render();`):
```js
    wrap.querySelector('.trie-random').addEventListener('click', function () {
      var d = (K().getInputDifficulty && K().getInputDifficulty()) || 'normal';
      var r = global.TrieViz.randomInput(d);
      _st.words = r.words; _st.query = r.query;
      saveExample('tree-trie', serialize(_st), DEFAULT_SERIALIZED);
      render();
    });
```

- [ ] **Step 6: Write the failing e2e test**

Append inside the `test.describe('viz refinements', …)` block in `tests/viz_refinements.spec.js`:
```js
  test('trie random button generates a valid word set', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=tree-trie');
    await page.click('.trie-random');
    const words = await page.locator('.trie-words').inputValue();
    expect(words).toMatch(/^[A-Z]+(,[A-Z]+)*$/);             // valid A–Z word list
    const scrub = page.locator('.stepctl .stepctl-scrubber');
    await scrub.evaluate((el) => { el.value = el.max; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await expect(page.locator('.trie-svg .trie-node').first()).toBeVisible();
    const n = await page.locator('.trie-svg .trie-node').count();
    expect(n).toBeGreaterThan(1);                            // a trie was built
  });
```

- [ ] **Step 7: Run the e2e to verify it passes**

Run: `npx playwright test tests/viz_refinements.spec.js -g "random button"`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add js/trie_viz.js js/viz/viz_trie.js tests/unit/trie_viz.test.js tests/viz_refinements.spec.js
git commit -m "feat(dsvisual): trie difficulty-aware random-input button"
```

---

### Task 4: Fullscreen auto-fit (RB-tree host-fit pattern)

**Files:**
- Modify: `js/viz/viz_trie.js` (`svgFor` signature + `paint` host-fit)
- Modify: `js/app.js` (`buildFrameControls` resize-repaint ~2079; `initVizFocus` resize dispatch on enter/exit)
- Modify: `style.css` (`body.viz-focus .trie-scroll { max-height: none }`)
- Test: `tests/viz_refinements.spec.js` (extend)

**Interfaces:**
- Consumes: `body.viz-focus` class; `.trie-scroll` host; `buildFrameControls` internal `render()`/`idx`.
- Produces: focus-mode SVG that fits the window; a cursor-safe resize→repaint in `buildFrameControls`; a resize dispatch on focus enter/exit.

- [ ] **Step 1: Write the failing e2e test**

Append inside the `test.describe('viz refinements', …)` block in `tests/viz_refinements.spec.js`:
```js
  test('fullscreen auto-fits the trie SVG and preserves the VCR cursor', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=tree-trie');
    const step = page.locator('.stepctl [data-action="step"]');
    await step.click(); await step.click(); await step.click();   // land on a mid frame
    const svgW = () => page.locator('.trie-svg').getAttribute('width').then((v) => parseFloat(v));
    const beforeW = await svgW();
    const beforeCount = await page.locator('.stepctl-count').textContent();

    await page.locator('.method-section-card.active .viz-focus-toggle').click();
    await expect.poll(async () => await svgW()).toBeGreaterThan(beforeW);   // SVG grew to fit the window
    expect(await page.locator('.stepctl-count').textContent()).toBe(beforeCount);   // cursor unchanged

    await page.locator('#viz-focus-exit').click();
    await expect.poll(async () => await svgW()).toBeLessThanOrEqual(beforeW + 1);    // back to natural size
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx playwright test tests/viz_refinements.spec.js -g "auto-fits"`
Expected: FAIL — the SVG width is fixed (`layout.width`) and does not grow on entering focus.

- [ ] **Step 3: Make the trie SVG size to its host in `paint()`**

In `js/viz/viz_trie.js`, change the `svgFor` signature to accept the pixel width/height. Find (`js/viz/viz_trie.js:61`):
```js
    var s = '<svg class="trie-svg" width="' + layout.width + '" height="' + layout.height + '" viewBox="0 0 ' + layout.width + ' ' + layout.height + '">';
```
Change the surrounding function header + this line. The function starts:
```js
  function svgFor(nodes, fr, layout) {
```
Change it to:
```js
  function svgFor(nodes, fr, layout, w, h) {
```
and the `<svg …>` line to:
```js
    var s = '<svg class="trie-svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + layout.width + ' ' + layout.height + '">';
```

Then in `paint` (`js/viz/viz_trie.js:122`), replace:
```js
    function paint(fr) {
      scrollEl.innerHTML = svgFor(fullTrie.nodes, fr, layout);
```
with:
```js
    function paint(fr) {
      var w = layout.width, h = layout.height;
      if (document.body.classList.contains('viz-focus')) {
        var rect = scrollEl.getBoundingClientRect();
        var availW = Math.max(scrollEl.clientWidth - 6, 120);
        var availH = Math.max(window.innerHeight - rect.top - 12, 120);
        var scale = Math.min(availW / layout.width, availH / layout.height);
        scale = Math.max(0.5, Math.min(scale, 3));
        w = Math.round(layout.width * scale);
        h = Math.round(layout.height * scale);
      }
      scrollEl.innerHTML = svgFor(fullTrie.nodes, fr, layout, w, h);
```
(Non-focus keeps the natural `layout.width`/`layout.height` — unchanged behavior with `.trie-scroll` scrolling. Focus mode fits width and height to the window.)

- [ ] **Step 4: Let `.trie-scroll` grow in focus mode (`style.css`)**

At the end of `style.css`, append:
```css

/* In focus mode the trie scroll host fills the window so the SVG can fit-to-window. */
body.viz-focus .trie-scroll { max-height: none; }
```

- [ ] **Step 5: Repaint the current frame on window resize in `buildFrameControls`**

In `js/app.js`, find the end of `buildFrameControls` (`js/app.js:2079`):
```js
        render();
        return strip;
    }
```
Change to (add a cursor-safe, self-cleaning resize→repaint before the final `render()`):
```js
        const onResize = () => {
            if (!strip.isConnected) { window.removeEventListener('resize', onResize); return; } // orphaned — detach
            if (strip._fcRaf) cancelAnimationFrame(strip._fcRaf);
            strip._fcRaf = requestAnimationFrame(() => { strip._fcRaf = 0; render(); });        // repaint current frame; idx unchanged
        };
        window.addEventListener('resize', onResize);

        render();
        return strip;
    }
```
(`render()` repaints `frames[idx]` at the current `idx` — no cursor change. The `isConnected` guard self-removes the listener once a detached control's resize fires, mirroring the existing play-timer guard.)

- [ ] **Step 6: Dispatch a resize on focus enter/exit in `initVizFocus`**

In `js/app.js` `initVizFocus`, in `enterFocus()` — after `body.classList.add('viz-focus'); setPressed(true);` and the position-reset line — add a resize dispatch. Find (in `enterFocus`):
```js
            if (exitBtn) { exitBtn.style.left = ''; exitBtn.style.top = ''; exitBtn.style.right = ''; exitBtn.style.bottom = ''; }
            document.addEventListener('keydown', onKeydown);
```
Change to:
```js
            if (exitBtn) { exitBtn.style.left = ''; exitBtn.style.top = ''; exitBtn.style.right = ''; exitBtn.style.bottom = ''; }
            document.addEventListener('keydown', onKeydown);
            requestAnimationFrame(function () { window.dispatchEvent(new Event('resize')); });   // re-fit host-fitting viz to the enlarged window
```
And in `exitFocus()` — after `body.classList.remove('viz-focus'); setPressed(false);` — add the same dispatch. Find (in `exitFocus`):
```js
            body.classList.remove('viz-focus');
            setPressed(false);
            document.removeEventListener('keydown', onKeydown);
```
Change to:
```js
            body.classList.remove('viz-focus');
            setPressed(false);
            document.removeEventListener('keydown', onKeydown);
            requestAnimationFrame(function () { window.dispatchEvent(new Event('resize')); });   // restore natural size
```

- [ ] **Step 7: Run the e2e to verify it passes**

Run: `npx playwright test tests/viz_refinements.spec.js -g "auto-fits"`
Expected: PASS — entering focus grows the `.trie-svg` width, the step count is unchanged, exiting restores the width.

- [ ] **Step 8: Run the full suites (no regression)**

Run: `npm run test:unit && npm test`
Expected: unit green; full Playwright green — including `tests/trie.spec.js`, `tests/viz_fullscreen.spec.js`, `tests/zoom_gesture.spec.js`, `tests/frame_controls.spec.js`, and the difficulty-consuming viz specs (search/sort/etc.). No regressions.

- [ ] **Step 9: Commit**

```bash
git add js/viz/viz_trie.js js/app.js style.css tests/viz_refinements.spec.js
git commit -m "feat(dsvisual): fullscreen auto-fit — trie SVG host-fit + resize-repaint (RB-tree pattern)"
```

---

## Self-Review

**1. Spec coverage:**
- §1 trie edge-char visibility → Task 1 (dark fill + halo, e2e on computed fill). ✓
- §2 global difficulty (settings) → Task 2 `getGlobalDifficulty`/`setGlobalDifficulty` + relabel. ✓
- §2 per-viz override + generic inline injection → Task 2 `getVizOverride`/`setVizOverride`, `injectInlineDifficulty` + MutationObserver, `getInputDifficulty = override ?? global`. ✓
- §2 i18n (settings.difficulty, difficulty.follow-global) → Task 2 Step 5. ✓
- §2 trie random input (pure + button) → Task 3 `randomInput` + `.trie-random`. ✓
- §3 RB-style host-fit + resize-repaint + focus resize-dispatch → Task 4. ✓
- Tests: unit (randomInput bounds/round-trip/prefix) + e2e (edge fill, two-tier independence, random, fullscreen fit+cursor) → Tasks 1–4. ✓

**2. Placeholder scan:** No TBD/TODO; every code step shows complete code; every command has an expected result. ✓

**3. Type/name consistency:** `getInputDifficulty()` no-arg preserved (Task 2) and consumed by Task 3's button via `K().getInputDifficulty()`; storage keys `dsvisual.inputDifficulty.global` / `dsvisual.inputDifficulty.viz.<id>` identical between Task 2 helpers and the Task 2 e2e; `.viz-difficulty` class consistent across app.js/CSS/e2e; `TrieViz.randomInput` produced in Task 3 Step 3 and consumed in Step 5; `svgFor(nodes, fr, layout, w, h)` new signature updated at its definition and its sole call site (Task 4 Step 3). ✓
