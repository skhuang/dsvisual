# tree-catalan vizfit (layout-only) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring `tree-catalan` to the trie's presentation via the Phase-0 vizfit `viz-fit` path — hidden C++ (`codeDrawer`), a bounded/drag-scrollable gallery, and a fullscreen that expands it while the n-buttons + VCR stay operable.

**Architecture:** Add `codeDrawer:true` to the method row; wrap Catalan's flat render in `.cat-wrap.vizfit-host` with a `.cat-scroll.vizfit-scroll` content region, append the VCR into the wrap (pinned below the scroll), and call `K().markFocusFit(host)` (no `svg` → wrapper zoom). No examples/random/per-SVG fit (roadmap-locked).

**Tech Stack:** vanilla JS (`js/viz/viz_tree_catalan.js`), `js/app.js` method row, plain CSS, Playwright e2e.

## Global Constraints

- Targeted `git add` by explicit path only; never `git add -A`/`.`/`-u`; run `git status` first.
- Never hand-edit generated files (`js/code_db.js`, `slides/**`, `js/slides_rendered.js`).
- `.vizfit-host` must be a DIRECT child of `#dynamic-viz-host`; the VCR strip must be a later DOM sibling of `.vizfit-scroll` (Phase-0 mechanism contract).
- `viz-fit` path only (NO `{svg:true}`, NO `fitFocusSize`) — Catalan is a gallery, keeps whole-wrapper zoom. No examples/random.
- Non-focus behaviour of every other viz UNCHANGED (the `viz-fit` CSS only fires on the marked card).
- e2e assert robust locators (counts, class presence, bounding-rect geometry) — never SVG edge visibility.
- One branch (`feat/catalan-vizfit`, already created) + one PR.

---

### Task 1: Adopt the vizfit `viz-fit` path in tree-catalan

**Files:**
- Modify: `js/app.js:96` (`tree-catalan` `METHOD_GROUPS` row — add `codeDrawer: true`)
- Modify: `js/viz/viz_tree_catalan.js` (`renderTreeCatalan` markup + VCR append + `markFocusFit`)
- Modify: `style.css` (add `.cat-wrap { width: 100%; }`)
- Test: `tests/catalan_vizfit.spec.js` (create)

**Interfaces:**
- Consumes (Phase 0): `K().markFocusFit(hostOrEl, opts?)`; CSS `viz-fit` marker + `.vizfit-host`/`.vizfit-scroll` + base `.vizfit-scroll { overflow:auto; max-height:var(--vizfit-maxh,520px) }`.
- Produces: `tree-catalan` rendered inside `.cat-wrap.vizfit-host` > pinned controls + `.cat-scroll.vizfit-scroll` > VCR.

- [ ] **Step 1: Write the failing e2e test**

Create `tests/catalan_vizfit.spec.js`:

```js
const { test, expect } = require('@playwright/test'); const path = require('path');
const FILE_URI = 'file://' + path.resolve(__dirname, '../index.html');

test.describe('tree-catalan vizfit (layout-only)', () => {
  test('bounded vizfit gallery; stepping + n-buttons intact', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=tree-catalan');
    await expect(page.locator('.cat-wrap.vizfit-host')).toHaveCount(1);
    const scroll = page.locator('.cat-scroll.vizfit-scroll');
    await expect(scroll).toHaveCount(1);
    expect(await scroll.evaluate((el) => el.clientHeight <= window.innerHeight - 120)).toBe(true);
    // existing stepping still works: scrub to end → groups shown + done verdict
    const scrub = page.locator('.stepctl .stepctl-scrubber');
    await scrub.evaluate((el) => { el.value = el.max; el.dispatchEvent(new Event('input', { bubbles: true })); });
    expect(await page.locator('.cat-groups .cat-group').count()).toBeGreaterThan(0);
    await expect(page.locator('.cat-verdict.cat-ok')).toBeVisible();
    // n-button switches n
    await page.click('.cat-nbtn[data-n="4"]');
    await expect(page.locator('.cat-nbtn.active')).toHaveText('n=4');
    // code hidden in the drawer
    await expect(page.locator('[data-method-section="tree-catalan"] .code-drawer')).toBeHidden();
  });

  test('fullscreen: card marked viz-fit, VCR operable, zoom toolbar floated', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=tree-catalan');
    await page.locator('.method-section-card.active .viz-focus-toggle').click();
    await expect(page.locator('.method-section-card.active')).toHaveClass(/viz-fit(\s|$)/);
    const inView = await page.locator('.stepctl').evaluate((el) => el.getBoundingClientRect().bottom <= window.innerHeight + 1);
    expect(inView).toBe(true);
    await expect(page.locator('.viz-zoom-controls')).toBeVisible();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx playwright test tests/catalan_vizfit.spec.js`
Expected: FAIL — `.cat-wrap.vizfit-host` / `.cat-scroll.vizfit-scroll` do not exist yet; the card is not marked `viz-fit`; the code panel is not in a drawer.

- [ ] **Step 3: Add `codeDrawer: true` to the method row (`js/app.js`)**

Change `js/app.js:96`:
```js
            { id: 'tree-catalan', title: 'Counting Trees (Catalan)', file: 'tree_catalan.cpp', visualizer: 'catalan', controls: 'catalan' },
```
to:
```js
            { id: 'tree-catalan', title: 'Counting Trees (Catalan)', file: 'tree_catalan.cpp', visualizer: 'catalan', controls: 'catalan', codeDrawer: true },
```

- [ ] **Step 4: Restructure the render markup + VCR append + markFocusFit (`js/viz/viz_tree_catalan.js`)**

In `renderTreeCatalan()`, replace the `host.innerHTML = …` assignment (currently the flat block spanning the `.cat-controls` … `.et-phase` divs) with the wrapped version:
```js
        host.innerHTML =
            '<div class="cat-wrap vizfit-host">' +
              '<div class="cat-controls"><span class="sm-hint">' + langOf({ zh: '選 n,枚舉全部 Cₙ 種二元樹形狀(依左子樹大小分組)', en: 'pick n; enumerate all Cₙ binary-tree shapes (grouped by left-subtree size)' }) + '</span></div>' +
              '<div class="cat-ns">' + nBtns + '</div>' +
              '<div class="cat-scroll vizfit-scroll">' +
                '<div class="cat-groups"></div>' +
                '<div class="cat-total"></div>' +
                '<div class="cat-verdict"></div>' +
                '<div class="cat-seqwrap"><div class="cat-seqtitle">' + langOf({ zh: 'Catalan 數 C₀…C₁₀(遞迴 vs 封閉形)', en: 'Catalan numbers C₀…C₁₀ (recurrence vs closed form)' }) + '</div>' +
                  '<table class="cat-seq"><thead><tr><th>n</th><th>' + langOf({ zh: '遞迴', en: 'recur.' }) + '</th><th>' + langOf({ zh: '封閉形', en: 'closed' }) + '</th><th>=</th></tr></thead><tbody>' + seqRows + '</tbody></table></div>' +
                '<div class="et-phase"></div>' +
              '</div>' +
            '</div>';
        var wrap = host.querySelector('.cat-wrap');
```
Then change the VCR append line (currently `host.appendChild(K().buildFrameControls(...))`) to append into `wrap` and mark focus-fit:
```js
        wrap.appendChild(K().buildFrameControls(frames, paint, { runIntervalMs: 800 }));
        K().markFocusFit(host);   // vizfit viz-fit path (bounded + fullscreen-expand + wrapper zoom); no {svg}
```
Leave `paint(fr, i)` and the `.cat-nbtn` `forEach` wiring UNCHANGED — they query `host.querySelector(...)` / `host.querySelectorAll(...)`, and every referenced element (`.cat-groups`, `.cat-total`, `.cat-verdict`, `.et-phase`, `.cat-nbtn`) still lives inside `host`.

- [ ] **Step 5: Add the minimal CSS (`style.css`)**

Append at the end of `style.css`:
```css

/* tree-catalan vizfit wrap (Phase-1 vizfit adopter) */
.cat-wrap { width: 100%; }
```

- [ ] **Step 6: Run the new e2e to verify it passes**

Run: `npx playwright test tests/catalan_vizfit.spec.js`
Expected: PASS — bounded `.cat-scroll.vizfit-scroll`; stepping + n-buttons intact; fullscreen marks the card `viz-fit`, keeps the VCR in-viewport, and shows the floated zoom toolbar; code in the drawer.

- [ ] **Step 7: Run the full suites (no regression)**

Run: `npm run test:unit && npm test`
Expected: unit green; full Playwright green — including `tests/vizfit.spec.js` (trie contract, unaffected), `tests/fullscreen_layout.spec.js`, `tests/trie.spec.js`, and any existing catalan test. No regressions.

- [ ] **Step 8: Commit**

```bash
git add js/app.js js/viz/viz_tree_catalan.js style.css tests/catalan_vizfit.spec.js
git commit -m "feat(dsvisual): tree-catalan adopts vizfit (viz-fit path) — bounded gallery + fullscreen + codeDrawer"
```

---

## Self-Review

**1. Spec coverage:**
- `codeDrawer:true` → Step 3. ✓
- `.cat-wrap.vizfit-host` + `.cat-scroll.vizfit-scroll` gallery region; VCR pinned into the wrap; `markFocusFit(host)` (no svg) → Step 4. ✓
- `.cat-wrap { width:100% }` minimal CSS → Step 5. ✓
- Tests: bounded region, stepping/n-buttons intact, fullscreen viz-fit + VCR operable + zoom toolbar, code drawer → Step 1. ✓
- Out of scope (examples/random/per-SVG fit) honoured — none added. ✓

**2. Placeholder scan:** No TBD/TODO; complete code in each step; commands have expected results. ✓

**3. Type/name consistency:** `markFocusFit(host)` (Phase-0 signature, no `svg` opt) called in Step 4; class names `.cat-wrap`/`.vizfit-host`/`.cat-scroll`/`.vizfit-scroll` identical across markup (Step 4), CSS (Step 5), and the test (Step 1); `paint`/`.cat-nbtn` selectors unchanged and still resolve inside `host`; `data-method-section="tree-catalan"` matches `section.dataset.methodSection`. ✓
