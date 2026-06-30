# Random Push/Enqueue Default Value Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the shared stack/queue value input (`#std-value`) default to a fresh 1–99 random integer on load and after every successful Push/Enqueue, instead of the fixed `10`.

**Architecture:** Add a `randStdValue()` helper in the `js/app.js` main closure; set `stdVal.value` to a random value once at init and again at the end of the `btnStdAdd` click handler (success-only, since invalid/overflow paths `return` earlier).

**Tech Stack:** Vanilla browser JS, Playwright E2E.

**Spec:** `docs/superpowers/specs/2026-06-30-random-push-default-design.md`

## Global Constraints

- Range is **1–99** inclusive.
- Only re-randomize on init and after a SUCCESSFUL push/enqueue — never mid-typing, never on overflow/invalid input.
- Do not touch Pop/Dequeue, other visualizations, or `js/cloud-config.js`.
- Three modes (stack-array, stack-list, queue) share `#std-value` — one change covers all.

---

## Task 1: Random default value for `#std-value`

**Files:**
- Modify: `js/app.js` (add `randStdValue()`; set initial value near the `stdVal` element ref ~line 1328; refill at end of `btnStdAdd` handler ~line 1791-1795)
- Modify: `index.html` (the `#std-value` `value="10"` becomes irrelevant; leave as-is — JS overwrites it on load)
- Test: `tests/random_push.spec.js`

**Interfaces:**
- Produces: `randStdValue()` → integer in [1,99]. Used only inside the js/app.js closure.

- [ ] **Step 1: Write the failing E2E test**

Create `tests/random_push.spec.js`. First read `tests/random_input.spec.js` to copy its exact `fileUri` constant + `loadMethod(page, id)` helper (there is no `tests/helpers.js`; the helper is defined inline in the spec). Then:

```js
const { test, expect } = require('@playwright/test');
const path = require('path');
const fileUri = 'file://' + path.resolve(__dirname, '../index.html');

async function loadMethod(page, methodId) {
  // mirror the navigation used by tests/random_input.spec.js
  const navItem = page.locator('.category-nav-item', { has: page.locator(`.category-nav-method[data-method-id="${methodId}"]`) });
  await navItem.hover();
  await navItem.locator(`.category-nav-method[data-method-id="${methodId}"]`).click();
  await expect(page.locator(`[data-method-section="${methodId}"][data-runtime-state="active"]`)).toBeVisible();
}

function readVal(page) { return page.locator('#std-value').inputValue(); }
function inRange(v) { const n = parseInt(v, 10); return Number.isInteger(n) && n >= 1 && n <= 99; }

test('stack-array std-value is random on load and after push', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'stack-array');
  const initial = await readVal(page);
  expect(inRange(initial)).toBe(true);
  await page.click('#btn-std-add');
  const after = await readVal(page);
  expect(inRange(after)).toBe(true);
});

test('queue std-value is random after enqueue', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'queue');
  const initial = await readVal(page);
  expect(inRange(initial)).toBe(true);
  await page.click('#btn-std-add');
  expect(inRange(await readVal(page))).toBe(true);
});
```

IMPORTANT: if `tests/random_input.spec.js`'s `loadMethod`/`fileUri` differ from the skeleton above (selector names, hover vs click), copy THEIRS verbatim — they are known-good for this repo. The assertions (range 1–99 on load + after push) are the contract; do not assert "different from previous" (random repeats are valid and would flake).

- [ ] **Step 2: Run it to verify it fails**

Run: `npx playwright test tests/random_push.spec.js`
Expected: FAIL — initial `#std-value` is `10` (out of the asserted behavior only if 10∈[1,99]… note 10 IS in range, so the LOAD assertion passes even before the change). The meaningful failure: after clicking Push, `#std-value` stays `10` every time, which still satisfies `inRange`. So this test as-written would PASS even unchanged. To make it a TRUE failing test, strengthen it: assert that across several pushes the value is NOT always identical. Replace the push assertions with:

```js
test('stack-array std-value re-randomizes across pushes', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'stack-array');
  expect(inRange(await readVal(page))).toBe(true);
  const seen = new Set();
  for (let i = 0; i < 8; i++) {
    const v = await readVal(page);
    expect(inRange(v)).toBe(true);
    seen.add(v);
    await page.click('#btn-std-add');
  }
  // Fixed default (10) → seen.size === 1. Random → almost always >1 across 8 draws.
  expect(seen.size).toBeGreaterThan(1);
});

test('queue std-value re-randomizes across enqueues', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'queue');
  const seen = new Set();
  for (let i = 0; i < 8; i++) {
    const v = await readVal(page);
    expect(inRange(v)).toBe(true);
    seen.add(v);
    await page.click('#btn-std-add');
  }
  expect(seen.size).toBeGreaterThan(1);
});
```
Use THESE two tests (drop the weaker pair above). Now run `npx playwright test tests/random_push.spec.js` → Expected: FAIL — `seen.size` is 1 (always `10`) before the change. (Flake note: 8 random draws from 1–99 collapsing to a single value is ~1e-15; safe. MAX_SIZE for stack-array is large enough for 8 pushes — verify `MAX_SIZE` ≥ 8 in app.js; it is, but if a push overflows early the value still re-randomizes only on success, so cap the loop at a safe count. Stack-array MAX_SIZE is ample for 8.)

- [ ] **Step 3: Implement in `js/app.js`**

(a) Add the helper near the top of the main closure (e.g. just above the `btnStdAdd` handler, or beside other small helpers). Exact code:
```js
    function randStdValue() { return Math.floor(Math.random() * 99) + 1; }
```

(b) Set the initial random value right after the `stdVal` element is captured. Find (~line 1328):
```js
    const btnStdAdd = document.getElementById('btn-std-add'); const btnStdRemove = document.getElementById('btn-std-remove'); const stdVal = document.getElementById('std-value');
```
Add immediately after it:
```js
    if (stdVal) stdVal.value = String(randStdValue());
```

(c) Re-randomize after a successful push/enqueue. Find the `btnStdAdd` handler (~line 1791):
```js
    btnStdAdd.addEventListener('click', () => {
        const val = parseInt(stdVal.value); if(isNaN(val)) return showStatus('Enter a valid number.', '#f87171');
        if(currentMode.includes('stack')) { if(currentMode === 'stack-array' && stackData.length >= MAX_SIZE) return showStatus('Stack Overflow!', '#f87171'); stackData.push(val); showStatus("Pushed " + val, '#60a5fa'); renderStack('push'); }
        else if (currentMode === 'queue') { if (qCount >= MAX_SIZE) return showStatus('Queue Overflow!', '#f87171'); qRear = (qRear + 1) % MAX_SIZE; qArr[qRear] = val; qCount++; showStatus("Enqueued " + val, '#60a5fa'); renderQueue('enqueue'); }
    });
```
Add a final line inside the handler, AFTER the if/else (so it runs only when neither early `return` fired — i.e. only on success):
```js
    btnStdAdd.addEventListener('click', () => {
        const val = parseInt(stdVal.value); if(isNaN(val)) return showStatus('Enter a valid number.', '#f87171');
        if(currentMode.includes('stack')) { if(currentMode === 'stack-array' && stackData.length >= MAX_SIZE) return showStatus('Stack Overflow!', '#f87171'); stackData.push(val); showStatus("Pushed " + val, '#60a5fa'); renderStack('push'); }
        else if (currentMode === 'queue') { if (qCount >= MAX_SIZE) return showStatus('Queue Overflow!', '#f87171'); qRear = (qRear + 1) % MAX_SIZE; qArr[qRear] = val; qCount++; showStatus("Enqueued " + val, '#60a5fa'); renderQueue('enqueue'); }
        stdVal.value = String(randStdValue());
    });
```
NOTE: the early `return`s for invalid input / overflow fire before this line, so the value is NOT re-randomized on failure — exactly the spec's requirement.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx playwright test tests/random_push.spec.js`
Expected: PASS (both tests — `seen.size > 1`).

- [ ] **Step 5: Run the full suite + secret check**

Run: `npm run test:all`
Expected: unit unchanged & green; Playwright green (incl. random_push.spec.js). No count-test changes (no methods/groups added).
Run: `git status --porcelain js/cloud-config.js` → empty (else `git checkout js/cloud-config.js`).

- [ ] **Step 6: Commit**

```bash
git add js/app.js tests/random_push.spec.js
git commit -m "feat: random default value for stack push / queue enqueue

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review (completed by plan author)

**Spec coverage:** §2 initial-random → Step 3(b) ✓; after-success re-randomize → Step 3(c) ✓; no-change-on-overflow/invalid → guaranteed by the early `return`s preceding the new line (noted) ✓; range 1–99 → `randStdValue()` ✓; three modes share input → single change ✓; E2E → Steps 1–2 ✓.

**Placeholder scan:** None. The test step explicitly resolves the weak-vs-strong test issue (uses the `seen.size > 1` pair) and points to `tests/random_input.spec.js` for the known-good nav helper. All code shown verbatim.

**Type consistency:** `randStdValue()` returns a number; assigned via `String(...)` to the input's `.value` (a string) consistently in (b) and (c). `stdVal` is the existing element ref; `btnStdAdd`/`MAX_SIZE`/`stackData`/`qArr`/`qCount`/`qRear`/`renderStack`/`renderQueue`/`showStatus` are all pre-existing in the closure — no new identifiers beyond `randStdValue`.
