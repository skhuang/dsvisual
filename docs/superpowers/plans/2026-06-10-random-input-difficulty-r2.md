# Random Input Difficulty — R2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the difficulty-aware random-input feature by wiring the 🎲 button into the remaining 6 dynamic-host visualizations and integrating the old sleep-based sort & search visualizers.

**Architecture:** Reuse the R1 infrastructure verbatim — `window.RandomInput.randomInputFor(methodId, getInputDifficulty())` plus the shared `.rand-btn` class. Each dynamic-host render gets a 🎲 button before its Apply button whose handler mutates the viz state and re-renders. The old sort visualizer reuses its existing `#btn-sort-random` (only `generateSortArray()`'s body changes). The old search visualizer gets one new 🎲 button (`#btn-search-random`) in `index.html`; its handler mutates the `const` arrays `arrBinary`/`arrLinear` IN PLACE (they cannot be reassigned), sets the target field, and re-renders.

**Tech Stack:** Vanilla browser JS, Playwright E2E, `node --test`. No build step for these files.

**Spec:** `docs/superpowers/specs/2026-06-10-random-input-difficulty-design.md` (§3.3 per-viz wiring, §3.4 old sort/search integration). R1 (module + settings + trees/arrays viz) is already merged.

---

## Reference: R2 wiring map (verified against js/app.js on main after R1 merge)

| methodId | group | state var | shape | apply selector | render fn |
|---|---|---|---|---|---|
| expr-infix-postfix | linear | `_exprState` | `{text}` | `.expr-apply` | `renderExprInfixPostfix` |
| maze-stack | linear | `_mazeState` | `{text}` | `.mz-apply` | `renderMazeStack` |
| list-doubly | linear | `_doublyState` | `{vals, circular}` | `.dl-apply` | `renderListDoubly` |
| search-fibonacci | searching | `_fibState` | `{arr, target}` | `.ss-apply` | `renderSearchFibonacci` |
| search-interpolation | searching | `_interpState` | `{arr, target}` | `.ss-apply` | `renderSearchInterpolation` |
| sort-external | sorting | `_extState` | `{data, M}` | `.ext-apply` | `renderSortExternal` |

Old visualizers (sleep-based, not dynamic-host):
- **Sorts** share `let sortArrData` (js/app.js ~line 1388); `function generateSortArray()` (~line 1705) is triggered by `#btn-sort-random`'s existing click handler (~line 2151). Only the function body changes.
- **Searches** use `const arrLinear` and `const arrBinary` (js/app.js ~lines 1369–1370) — these are `const`, mutate in place. `searchVal` = `#search-val` input. `renderSearchArray(arr)` re-renders. The search controls live in `#search-actions` in `index.html` (~line 95).

`getInputDifficulty()` resolves to the current method's group difficulty (`localStorage['dsvisual.inputDifficulty.<groupId>']`). All `*_viz` generators already exist and are unit-tested (R1).

The shared `.rand-btn` button markup string (used everywhere): `'<button type="button" class="rand-btn" title="Random">🎲</button>'`. There is exactly one `.rand-btn` per dynamic host, so `host.querySelector('.rand-btn')` is unambiguous.

---

## Task 1: Wire 🎲 into the 6 remaining dynamic-host visualizations

**Files:**
- Modify: `js/app.js` (renderExprInfixPostfix, renderMazeStack, renderListDoubly, renderSearchFibonacci, renderSearchInterpolation, renderSortExternal)

For each render function: read it first to find the exact `host` variable name it uses and the Apply-button markup substring; insert the 🎲 button markup immediately before the Apply button in the innerHTML string; add the onclick handler next to the existing Apply handler.

- [ ] **Step 1: expr-infix-postfix**

Insert before the `class="expr-apply"` button markup:
```js
              '<button type="button" class="rand-btn" title="Random">🎲</button>' +
```
After the `.expr-apply` onclick handler, add:
```js
        host.querySelector('.rand-btn').onclick = () => {
            const inp = window.RandomInput && RandomInput.randomInputFor('expr-infix-postfix', getInputDifficulty());
            if (!inp) return;
            _exprState.text = inp.text;
            renderExprInfixPostfix();
        };
```

- [ ] **Step 2: maze-stack**

Insert before the `class="mz-apply"` button markup:
```js
              '<button type="button" class="rand-btn" title="Random">🎲</button>' +
```
After the `.mz-apply` handler, add:
```js
        host.querySelector('.rand-btn').onclick = () => {
            const inp = window.RandomInput && RandomInput.randomInputFor('maze-stack', getInputDifficulty());
            if (!inp) return;
            _mazeState.text = inp.text;
            renderMazeStack();
        };
```

- [ ] **Step 3: list-doubly**

Insert before the `class="dl-apply"` button markup:
```js
              '<button type="button" class="rand-btn" title="Random">🎲</button>' +
```
After the `.dl-apply` handler, add:
```js
        host.querySelector('.rand-btn').onclick = () => {
            const inp = window.RandomInput && RandomInput.randomInputFor('list-doubly', getInputDifficulty());
            if (!inp) return;
            _doublyState.vals = inp.vals;
            _doublyState.circular = inp.circular;
            renderListDoubly();
        };
```

- [ ] **Step 4: search-fibonacci**

Insert before the `class="ss-apply"` button markup (inside `renderSearchFibonacci`):
```js
              '<button type="button" class="rand-btn" title="Random">🎲</button>' +
```
After the `.ss-apply` handler in `renderSearchFibonacci`, add:
```js
        host.querySelector('.rand-btn').onclick = () => {
            const inp = window.RandomInput && RandomInput.randomInputFor('search-fibonacci', getInputDifficulty());
            if (!inp) return;
            _fibState.arr = inp.arr;
            _fibState.target = inp.target;
            renderSearchFibonacci();
        };
```

- [ ] **Step 5: search-interpolation**

Insert before the `class="ss-apply"` button markup (inside `renderSearchInterpolation`):
```js
              '<button type="button" class="rand-btn" title="Random">🎲</button>' +
```
After the `.ss-apply` handler in `renderSearchInterpolation`, add:
```js
        host.querySelector('.rand-btn').onclick = () => {
            const inp = window.RandomInput && RandomInput.randomInputFor('search-interpolation', getInputDifficulty());
            if (!inp) return;
            _interpState.arr = inp.arr;
            _interpState.target = inp.target;
            renderSearchInterpolation();
        };
```
NOTE: both search render functions use the `ss-` selector prefix. Edit each function's OWN block — do not cross-wire. Confirm each `.rand-btn` handler is added inside the correct function body.

- [ ] **Step 6: sort-external**

Insert before the `class="ext-apply"` button markup:
```js
              '<button type="button" class="rand-btn" title="Random">🎲</button>' +
```
After the `.ext-apply` handler, add:
```js
        host.querySelector('.rand-btn').onclick = () => {
            const inp = window.RandomInput && RandomInput.randomInputFor('sort-external', getInputDifficulty());
            if (!inp) return;
            _extState.data = inp.data;
            _extState.M = inp.M;
            renderSortExternal();
        };
```

- [ ] **Step 7: Add E2E coverage for the new dynamic viz**

Append to `tests/random_input.spec.js` (reuse the file's existing `loadMethod`-style navigation + the same `file://` goto the other tests in the file already use — read the file first and copy its exact helper/pattern):

```js
test('random button on list-doubly changes the input field', async ({ page }) => {
  await page.goto(fileUrl); // same pattern as the existing tests in this file
  await loadMethod(page, 'list-doubly');
  const input = page.locator('.dl-input');
  const before = await input.inputValue();
  await page.click('.rand-btn');
  await expect(input).not.toHaveValue(before);
});

test('random button on search-fibonacci changes the array field', async ({ page }) => {
  await page.goto(fileUrl);
  await loadMethod(page, 'search-fibonacci');
  const input = page.locator('.ss-arr');
  const before = await input.inputValue();
  await page.click('.rand-btn');
  await expect(input).not.toHaveValue(before);
});
```
If `loadMethod`/`fileUrl` are named differently in the existing spec, match the existing names exactly. If `.dl-input` would not change because the same random values happened to repeat, that's astronomically unlikely; no retry needed. (If the search-fibonacci edge difficulty default ever produced an identical array, note that default difficulty is `normal`, which yields 8–12 random sorted ints — collision negligible.)

- [ ] **Step 8: Run the E2E + unit suites**

Run: `npx playwright test tests/random_input.spec.js`
Expected: PASS (all tests — the R1 ones plus the 2 new).
Run: `node --test tests/unit/*.test.js`
Expected: 142 pass (unchanged — no module change).

- [ ] **Step 9: Commit**

```bash
git add js/app.js tests/random_input.spec.js
git commit -m "feat: wire random button into linear/searching/sort-external visualizations

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Integrate the old sort visualizer (difficulty-aware Randomize)

**Files:**
- Modify: `js/app.js` (`generateSortArray`, ~line 1705)

The old sort visualizer already has a `#btn-sort-random` button whose click handler (~line 2151) calls `generateSortArray()`. We only change what `generateSortArray()` produces so it honors the current difficulty. `sortArrData` is the shared sort array; `renderSortBars()` redraws; `showStatus(...)` reports.

- [ ] **Step 1: Replace `generateSortArray()` body**

Current:
```js
    function generateSortArray() { sortArrData = []; for(let i=0; i<15; i++) sortArrData.push(Math.floor(Math.random() * 95) + 5); renderSortBars(); showStatus("Generated Random Array.", "#94a3b8"); }
```
Replace with:
```js
    function generateSortArray() {
        const inp = window.RandomInput && RandomInput.randomInputFor('sort', getInputDifficulty());
        if (inp && Array.isArray(inp.data) && inp.data.length) {
            sortArrData = inp.data.slice();
        } else {
            sortArrData = [];
            for (let i = 0; i < 15; i++) sortArrData.push(Math.floor(Math.random() * 95) + 5);
        }
        renderSortBars();
        showStatus("Generated Random Array.", "#94a3b8");
    }
```
The fallback preserves the original behavior if `RandomInput` is unavailable. `getInputDifficulty()` resolves to the `sorting` group's difficulty because the active method is a `sort-*` method.

- [ ] **Step 2: Add E2E coverage for the difficulty-aware sort randomize**

Append to `tests/random_input.spec.js` (match the file's navigation pattern). This test sets difficulty to `large` for the sorting category, then verifies the Randomize button produces more than the default 15 bars (large => 18–24):

```js
test('sort Randomize honors large difficulty (more bars)', async ({ page }) => {
  await page.goto(fileUrl);
  await loadMethod(page, 'sort-bubble'); // any sort-* method (sorting group)
  // set difficulty = large via settings
  await page.click('#settings-toggle');
  await page.locator('#input-difficulty').selectOption('large');
  await page.click('#settings-drawer .settings-drawer-close');
  // click the existing Randomize button
  await page.click('#btn-sort-random');
  // large => 18..24 bars; default normal/old was 15. Assert > 15.
  const bars = page.locator('#sort-container .sort-bar, .sort-bar');
  await expect.poll(async () => await bars.count()).toBeGreaterThan(15);
});
```
IMPORTANT: before writing this test, inspect `renderSortBars()` / the sort container in `index.html` to find the ACTUAL bar element selector and the sort method id (`sort-bubble` or whatever the first sorting method is). Use the real selectors. If the bar element/class differs, fix the locator to match. If `loadMethod` for a sort method requires a different nav path, replicate what existing sort specs do (check `tests/` for any sort spec).

- [ ] **Step 3: Run the tests**

Run: `npx playwright test tests/random_input.spec.js`
Expected: PASS (all). If the bar-count test is flaky because `large` can be as low as 18 (still > 15), it remains valid; if it fails because the selector is wrong, fix the selector (not the threshold).

- [ ] **Step 4: Commit**

```bash
git add js/app.js tests/random_input.spec.js
git commit -m "feat: difficulty-aware Randomize for the sort visualizer

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Integrate the old search visualizer (new 🎲 button)

**Files:**
- Modify: `index.html` (`#search-actions` — add a 🎲 button)
- Modify: `js/app.js` (cache the button element near the other search element lookups ~line 1291; add its click handler near the other search bindings ~line 2121)

The old search visualizer's `arrLinear`/`arrBinary` are declared `const` — DO NOT reassign them. Mutate their contents in place: `arr.length = 0; inp.arr.forEach((v) => arr.push(v));`. The target lives in the `#search-val` input (cached as `searchVal`). `renderSearchArray(arr)` redraws.

- [ ] **Step 1: Add the 🎲 button to `#search-actions` in index.html**

Find (index.html ~line 95):
```html
                    <div class="actions hidden" id="search-actions">
                        <input type="number" id="search-val" data-i18n-placeholder="ph.target" placeholder="Target" value="38">
                        <button id="btn-search-go" class="btn primary" data-i18n-key="btn.find">Find()</button>
```
Insert a new button immediately AFTER the `#search-val` input and BEFORE `#btn-search-go`:
```html
                        <button id="btn-search-random" class="btn secondary" title="Random">🎲</button>
```

- [ ] **Step 2: Cache the button element in js/app.js**

Find (~line 1291) the line that caches `searchVal`:
```js
    const btnSearchGo = document.getElementById('btn-search-go'); const btnSearchPause = document.getElementById('btn-search-pause'); const btnSearchStop = document.getElementById('btn-search-stop'); const searchVal = document.getElementById('search-val');
```
Add immediately after it (new line):
```js
    const btnSearchRandom = document.getElementById('btn-search-random');
```

- [ ] **Step 3: Add the click handler in js/app.js**

Find the search-go binding (~line 2121):
```js
    btnSearchGo.addEventListener('click', () => { const target = parseInt(searchVal.value); if(isNaN(target)) return showStatus('Enter valid target.', '#f87171'); if (currentMode === 'search-linear') executeAnimWrapper(async () => await runLinearSearch(target)); else if (currentMode === 'search-binary') executeAnimWrapper(async () => await runBinarySearch(target)); });
```
Add immediately after it:
```js
    btnSearchRandom.addEventListener('click', () => {
        if (animState === 'playing' || animState === 'paused') return;
        const inp = window.RandomInput && RandomInput.randomInputFor(currentMode, getInputDifficulty());
        if (!inp) return;
        const arr = currentMode === 'search-binary' ? arrBinary : arrLinear;
        arr.length = 0;
        inp.arr.forEach((v) => arr.push(v));
        searchVal.value = inp.target;
        renderSearchArray(arr);
    });
```
`currentMode` is `'search-binary'` or `'search-linear'` for these methods; `RandomInput.randomInputFor` handles both and returns a sorted `arr` (correct for binary; harmless for linear). `getInputDifficulty()` resolves to the `searching` group difficulty.

- [ ] **Step 4: Add E2E coverage for old search 🎲**

Append to `tests/random_input.spec.js` (match navigation pattern; inspect how to select `search-binary`):
```js
test('random button on old binary search updates target + array', async ({ page }) => {
  await page.goto(fileUrl);
  await loadMethod(page, 'search-binary');
  const target = page.locator('#search-val');
  const before = await target.inputValue();
  await page.click('#btn-search-random');
  await expect(target).not.toHaveValue(before);
  // array slots should be present after re-render
  await expect(page.locator('.search-slot, [id^="ss-"]').first()).toBeVisible();
});
```
IMPORTANT: confirm the real search-slot selector by reading `renderSearchArray()` / the search container markup before finalizing the locator. (`renderSearchArray` builds slots with ids like `ss-0`; confirm.) Fix the locator to match reality. `#search-val` default is `38`; binary `normal` target is a random present value — collision with `38` is unlikely but possible; if you want determinism, set difficulty to `edge` first (target guaranteed absent and ≠ 38 because edge target is `max + 1..9` of a fresh array).

- [ ] **Step 5: Run the tests**

Run: `npx playwright test tests/random_input.spec.js`
Expected: PASS (all).

- [ ] **Step 6: Commit**

```bash
git add index.html js/app.js tests/random_input.spec.js
git commit -m "feat: difficulty-aware random button for the search visualizer

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Full suite green + count reconciliation + secret check

**Files:**
- Modify (only if counts legitimately changed): `tests/i18n.spec.js`, `tests/visualizer.spec.js`

- [ ] **Step 1: Run the full suite**

Run: `npm run test:all`
Expected: unit 142/0; Playwright all pass (R1's 138 + the R2 additions).

- [ ] **Step 2: Reconcile counts**

This feature adds NO methods/groups. The only new DOM element is `#btn-search-random` (one button inside `#search-actions`). Verify this does NOT change any hardcoded count in `tests/i18n.spec.js` (overview-tile = 93, overview-category = 10) or `tests/visualizer.spec.js` (nav `.category-nav-btn` = 11). It should not — that button is not a nav pill, overview tile, or category. If a count fails, investigate; only adjust if provably a legitimate, intended consequence (it should not be here).

- [ ] **Step 3: Secret check**

Run: `git status --porcelain js/cloud-config.js`
Expected: empty. If modified, run `git checkout js/cloud-config.js`.

- [ ] **Step 4: Commit any reconciliation**

```bash
git add tests/i18n.spec.js tests/visualizer.spec.js
git commit -m "test: reconcile counts for R2 random-input integration

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```
(Skip if no count files changed.)

---

## Self-Review (completed by plan author)

**Spec coverage:**
- §3.3 per-viz 🎲 before Apply, generate+apply → Task 1 covers the 6 remaining dynamic viz (linear 3 + searching 2 + sort-external 1) ✓. Combined with R1's 8, all 14 dynamic viz are now wired.
- §3.4 old sort integration via `generateSortArray` → Task 2 ✓.
- §3.4 old search integration (new 🎲, mutate arrBinary/arrLinear in place, set target, re-render) → Task 3 ✓.
- §4 input shapes → matched to verified state vars: `_exprState.text`, `_mazeState.text`, `_doublyState.{vals,circular}`, `_fibState.{arr,target}`, `_interpState.{arr,target}`, `_extState.{data,M}`, old `sortArrData` from `{data}`, old `arrBinary/arrLinear`+target from `{arr,target}` ✓.
- §8 testing → E2E added in each task; unit unchanged ✓.

**Placeholder scan:** No TBD/TODO. Each code step shows complete code. Test steps flag "confirm the real selector" where the exact DOM class must be read from existing render code — this is verification guidance, not a placeholder (the assertion logic is fully specified).

**Type consistency:** `RandomInput.randomInputFor(methodId, getInputDifficulty())` and `.rand-btn` shared class used identically across all tasks, matching R1. Return-shape field reads (`.text`, `.vals`, `.circular`, `.arr`, `.target`, `.data`, `.M`) match the module's documented shapes and the unit tests. `arr.length = 0; push(...)` in-place mutation correctly respects the `const` binding of `arrBinary`/`arrLinear`. `getInputDifficulty()` group resolution correct for each method's group (linear/searching/sorting).
