# Recursion Execution Visualization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `recursion` visualization (new `recursion` group) that animates recursive execution as a call tree + call stack, with 5 example algorithms (Fibonacci, reverse string, permutations, binary search, quicksort) selectable via a dropdown.

**Architecture:** A pure dual-export module `js/recursion_viz.js` runs each example's recursion instrumented with an event recorder, producing `{frames, nodes, result}` — `nodes` is the full call tree, `frames` is the step sequence (call/return events + active stack). `renderRecursion()` in the js/app.js closure replays frames: left pane = incrementally-revealed call tree (custom n-ary layout like `renderGameTree`), right pane = the call stack. Plus a new group, 4 wiring edits, cpp, bilingual slides, i18n, E2E.

**Tech Stack:** Vanilla browser JS, `node --test`, Playwright, `node build_db.js`, `npm run build:slides`.

**Spec:** `docs/superpowers/specs/2026-06-30-recursion-visualization-design.md`

## Global Constraints

- Input caps (enforced in the render's Build handler, clamped): fibonacci n ≤ 7; reverse text length ≤ 6; permutations text length ≤ 4; binary-search array length ≤ 15; quicksort array length ≤ 10.
- Module is pure / DOM-free, dual-export IIFE like `js/heap_models.js` (`module.exports` + `global.RecursionViz`).
- Node-drawing rules: `.tree-node { transform: translate(-50%,-50%) }` (set left/top = center); SVG edges at (x,y) with NO offset; tree stage `overflow` scrollable/hidden.
- `computeTreeLayout` is binary-only — use a custom n-ary layout (mirror `renderGameTree`).
- Do NOT touch `js/cloud-config.js`.
- Current counts before this feature: overview tiles 99, categories 12, nav pills 13.

---

## Task 1: Pure module `js/recursion_viz.js` + unit tests

**Files:**
- Create: `js/recursion_viz.js`, `tests/unit/recursion.test.js`

**Interfaces:**
- Produces: `recursionTrace(example, input)` → `{ frames, nodes, result }` (or `null` for unknown example); `EXAMPLES` (string[]); `DEFAULTS` (per-example default input object). Frame = `{ event:'call'|'return', id, stack:number[], value? }`. Node = `{ id, parentId, label, depth, value, returned }`.

- [ ] **Step 1: Write the failing unit test** — create `tests/unit/recursion.test.js`:
```js
const test = require('node:test');
const assert = require('node:assert');
const V = require('../../js/recursion_viz.js');
function fact(n) { let f = 1; for (let i = 2; i <= n; i++) f *= i; return f; }

test('unknown example returns null', () => {
  assert.strictEqual(V.recursionTrace('nope', {}), null);
});

test('fibonacci result + trace consistency', () => {
  const { result, nodes, frames } = V.recursionTrace('fibonacci', { n: 6 });
  assert.strictEqual(result, 8);
  assert.strictEqual(V.recursionTrace('fibonacci', { n: 5 }).result, 5);
  assert.ok(frames.length > 0);
  assert.ok(nodes.every((n) => n.returned === true));
  assert.strictEqual(nodes[0].parentId, null);
  assert.strictEqual(frames.filter((f) => f.event === 'call').length, nodes.length);
  assert.strictEqual(frames.filter((f) => f.event === 'return').length, nodes.length);
});

test('reverse string', () => {
  assert.strictEqual(V.recursionTrace('reverse', { text: 'ABCDE' }).result, 'EDCBA');
  assert.strictEqual(V.recursionTrace('reverse', { text: '' }).result, '');
});

test('permutations produce n! unique valid perms; leaves == n!', () => {
  const { result, nodes } = V.recursionTrace('permutations', { text: 'ABC' });
  assert.strictEqual(result.length, fact(3));
  assert.strictEqual(new Set(result).size, fact(3));
  result.forEach((p) => assert.strictEqual(p.split('').sort().join(''), 'ABC'));
  const parents = new Set(nodes.map((n) => n.parentId));
  const leaves = nodes.filter((n) => !parents.has(n.id));
  assert.strictEqual(leaves.length, fact(3));
});

test('binary search hit + miss + sorts unsorted input', () => {
  const arr = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];
  assert.strictEqual(V.recursionTrace('binary-search', { arr, target: 23 }).result, 5);
  assert.strictEqual(V.recursionTrace('binary-search', { arr, target: 99 }).result, -1);
  assert.strictEqual(V.recursionTrace('binary-search', { arr: [5, 1, 3], target: 3 }).result, 1);
});

test('quicksort returns sorted', () => {
  const { result, nodes } = V.recursionTrace('quicksort', { arr: [5, 3, 8, 1, 9, 2, 7, 4] });
  assert.deepStrictEqual(result, [1, 2, 3, 4, 5, 7, 8, 9]);
  assert.ok(nodes.every((n) => n.returned === true));
});

test('all examples: root parentId null, all returned, root returns last', () => {
  const inputs = { fibonacci: { n: 4 }, reverse: { text: 'abc' }, permutations: { text: 'ab' }, 'binary-search': { arr: [1, 2, 3], target: 2 }, quicksort: { arr: [3, 1, 2] } };
  for (const ex of V.EXAMPLES) {
    const { frames, nodes } = V.recursionTrace(ex, inputs[ex]);
    assert.ok(nodes.length > 0, ex);
    assert.strictEqual(nodes[0].parentId, null, ex);
    assert.ok(nodes.every((n) => n.returned), ex);
    const last = frames[frames.length - 1];
    assert.strictEqual(last.event, 'return', ex);
    assert.strictEqual(last.stack.length, 1, ex);
    assert.strictEqual(last.stack[0], 0, ex);
  }
});

test('EXAMPLES and DEFAULTS exported and aligned', () => {
  assert.deepStrictEqual(V.EXAMPLES, ['fibonacci', 'reverse', 'permutations', 'binary-search', 'quicksort']);
  V.EXAMPLES.forEach((ex) => assert.ok(V.DEFAULTS[ex], ex));
});
```
Run `node --test tests/unit/recursion.test.js` → FAIL (module missing).

- [ ] **Step 2: Implement `js/recursion_viz.js`:**
```js
(function (global) {
  'use strict';

  function makeRecorder() {
    let nextId = 0;
    const frames = [];
    const nodes = [];
    const stack = [];
    function call(label, parentId, depth) {
      const id = nextId++;
      nodes.push({ id: id, parentId: parentId, label: label, depth: depth, value: undefined, returned: false });
      stack.push(id);
      frames.push({ event: 'call', id: id, stack: stack.slice() });
      return id;
    }
    function ret(id, value) {
      const node = nodes[id];
      node.value = value; node.returned = true;
      frames.push({ event: 'return', id: id, value: value, stack: stack.slice() });
      stack.pop();
      return value;
    }
    return { call: call, ret: ret, frames: frames, nodes: nodes };
  }

  function fibTrace(n, rec) {
    function fib(k, parentId, depth) {
      const id = rec.call('fib(' + k + ')', parentId, depth);
      if (k < 2) return rec.ret(id, k);
      const a = fib(k - 1, id, depth + 1);
      const b = fib(k - 2, id, depth + 1);
      return rec.ret(id, a + b);
    }
    return fib(n, null, 0);
  }

  function reverseTrace(s, rec) {
    function rev(str, parentId, depth) {
      const id = rec.call('rev("' + str + '")', parentId, depth);
      if (str.length <= 1) return rec.ret(id, str);
      const sub = rev(str.slice(1), id, depth + 1);
      return rec.ret(id, sub + str[0]);
    }
    return rev(s, null, 0);
  }

  function permTrace(s, rec) {
    const out = [];
    function permute(prefix, rest, parentId, depth) {
      const id = rec.call('perm("' + prefix + '","' + rest + '")', parentId, depth);
      if (rest.length === 0) { out.push(prefix); return rec.ret(id, 1); }
      let cnt = 0;
      for (let i = 0; i < rest.length; i++) {
        cnt += permute(prefix + rest[i], rest.slice(0, i) + rest.slice(i + 1), id, depth + 1);
      }
      return rec.ret(id, cnt);
    }
    permute('', s, null, 0);
    return out;
  }

  function bsearchTrace(arr, target, rec) {
    function bs(lo, hi, parentId, depth) {
      const id = rec.call('bs(' + lo + ',' + hi + ')', parentId, depth);
      if (lo > hi) return rec.ret(id, -1);
      const mid = Math.floor((lo + hi) / 2);
      if (arr[mid] === target) return rec.ret(id, mid);
      if (arr[mid] < target) return rec.ret(id, bs(mid + 1, hi, id, depth + 1));
      return rec.ret(id, bs(lo, mid - 1, id, depth + 1));
    }
    return bs(0, arr.length - 1, null, 0);
  }

  function qsortTrace(arr, rec) {
    const a = arr.slice();
    function qs(lo, hi, parentId, depth) {
      const id = rec.call('qs(' + lo + '..' + hi + ')', parentId, depth);
      if (lo >= hi) return rec.ret(id, a.slice(lo, hi + 1));
      const pivot = a[hi];
      let i = lo;
      for (let j = lo; j < hi; j++) { if (a[j] < pivot) { const t = a[i]; a[i] = a[j]; a[j] = t; i++; } }
      const t = a[i]; a[i] = a[hi]; a[hi] = t;
      const p = i;
      qs(lo, p - 1, id, depth + 1);
      qs(p + 1, hi, id, depth + 1);
      return rec.ret(id, a.slice(lo, hi + 1));
    }
    if (a.length) qs(0, a.length - 1, null, 0);
    return a;
  }

  const EXAMPLES = ['fibonacci', 'reverse', 'permutations', 'binary-search', 'quicksort'];
  const DEFAULTS = {
    fibonacci: { n: 5 },
    reverse: { text: 'ABCDE' },
    permutations: { text: 'ABC' },
    'binary-search': { arr: [2, 5, 8, 12, 16, 23, 38, 56, 72, 91], target: 23 },
    quicksort: { arr: [5, 3, 8, 1, 9, 2, 7, 4] }
  };

  function recursionTrace(example, input) {
    const rec = makeRecorder();
    input = input || {};
    let result;
    if (example === 'fibonacci') result = fibTrace(Math.max(0, parseInt(input.n, 10) || 0), rec);
    else if (example === 'reverse') result = reverseTrace(String(input.text || ''), rec);
    else if (example === 'permutations') result = permTrace(String(input.text || ''), rec);
    else if (example === 'binary-search') { const arr = (input.arr || []).slice().sort((x, y) => x - y); result = bsearchTrace(arr, input.target, rec); }
    else if (example === 'quicksort') result = qsortTrace(input.arr || [], rec);
    else return null;
    return { frames: rec.frames, nodes: rec.nodes, result: result };
  }

  const api = { recursionTrace: recursionTrace, EXAMPLES: EXAMPLES, DEFAULTS: DEFAULTS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.RecursionViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
```
Run `node --test tests/unit/recursion.test.js` → PASS (8 tests).

- [ ] **Step 3: Commit:**
```bash
git add js/recursion_viz.js tests/unit/recursion.test.js
git commit -m "feat: pure recursion trace generator module

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: render + `recursion` group + wiring + cpp + slides + i18n + E2E

**Files:**
- Create: `cpp/recursion.cpp`, `slides/{zh,en}/recursion.md` (generated), `tests/recursion.spec.js`
- Modify: `js/app.js`, `index.html`, `js/i18n.js`, `slides_db.js`, `build_db.js`, `js/code_db.js` (generated), `js/slides_rendered.js` (generated)

**Interfaces:**
- Consumes: `RecursionViz.recursionTrace(example, input)`, `RecursionViz.EXAMPLES`, `RecursionViz.DEFAULTS` (Task 1). App helpers `acquireDynamicVizHost()`, `buildStepControls(onStep, onReset, runIntervalMs)`.

- [ ] **Step 1: Create `cpp/recursion.cpp`** (reference code shown in the panel — the 5 recursive functions):
```cpp
// Recursion examples: Fibonacci, reverse, permutations, binary search, quicksort
#include <iostream>
#include <string>
#include <vector>
#include <algorithm>
using namespace std;

int fib(int k) { return k < 2 ? k : fib(k - 1) + fib(k - 2); }

string reverseStr(const string& s) { return s.size() <= 1 ? s : reverseStr(s.substr(1)) + s[0]; }

void permute(string prefix, string rest) {
    if (rest.empty()) { cout << prefix << "\n"; return; }
    for (size_t i = 0; i < rest.size(); ++i)
        permute(prefix + rest[i], rest.substr(0, i) + rest.substr(i + 1));
}

int bsearch(const vector<int>& a, int target, int lo, int hi) {
    if (lo > hi) return -1;
    int mid = (lo + hi) / 2;
    if (a[mid] == target) return mid;
    return a[mid] < target ? bsearch(a, target, mid + 1, hi)
                           : bsearch(a, target, lo, mid - 1);
}

void quicksort(vector<int>& a, int lo, int hi) {
    if (lo >= hi) return;
    int pivot = a[hi], i = lo;
    for (int j = lo; j < hi; ++j) if (a[j] < pivot) swap(a[i++], a[j]);
    swap(a[i], a[hi]);
    quicksort(a, lo, i - 1);
    quicksort(a, i + 1, hi);
}

int main() {
    cout << "fib(6) = " << fib(6) << "\n";
    cout << "reverse(ABCDE) = " << reverseStr("ABCDE") << "\n";
    permute("", "ABC");
    vector<int> a = {2, 5, 8, 12, 16, 23, 38, 56, 72, 91};
    cout << "bsearch(23) = " << bsearch(a, 23, 0, a.size() - 1) << "\n";
    vector<int> q = {5, 3, 8, 1, 9, 2, 7, 4};
    quicksort(q, 0, q.size() - 1);
    for (int x : q) cout << x << " ";
    cout << "\n";
    return 0;
}
```

- [ ] **Step 2: build_db mapping + regenerate** — add `recursion.cpp` → `codeRecursion` to `build_db.js` (read it for the mapping format); run `node build_db.js`; verify `grep -c codeRecursion js/code_db.js` ≥1.

- [ ] **Step 3: index.html** — add `<script src="js/recursion_viz.js"></script>` immediately before `<script src="js/app.js"></script>`.

- [ ] **Step 4: Add the `recursion` group to METHOD_GROUPS** — place the group object after the `memory` group's closing `},` and before the `oop` group (js/app.js; the `memory` group id is at ~line 233, `oop` at ~240):
```js
    {
        id: 'recursion',
        title: 'Recursion',
        methods: [
            { id: 'recursion', title: 'Recursion (Call Tree & Stack)', file: 'recursion.cpp', visualizer: 'recursion', controls: 'recursion' },
        ],
    },
```

- [ ] **Step 5: Implement `renderRecursion()` in js/app.js.** READ `renderGameTree()` first (its n-ary `.children` layout + SVG edges + `.tree-node` centering is the template for the left pane). Structure:
  - Add near other render fns: `let _recState = null;`
  - `if (!_recState) _recState = { example: 'fibonacci', inputs: JSON.parse(JSON.stringify(RecursionViz.DEFAULTS)) };`
  - `const host = acquireDynamicVizHost();`
  - `const ex = _recState.example; const trace = RecursionViz.recursionTrace(ex, _recState.inputs[ex]); const { frames, nodes, result } = trace;`
  - Build a parent→children map from `nodes` (children in id order) and find the root (`parentId === null`). Compute an n-ary layout: assign each node an x by in-order leaf position and y by `depth` (same approach as renderGameTree's custom layout — read it and reuse the pattern). Store `{node, x, y}` per id in a `meta` map.
  - `host.innerHTML`: a controls row + a two-pane stage:
    - controls: `<select class="rec-example">` with one `<option value="...">` per `RecursionViz.EXAMPLES` (label each in a readable form; current selected = `ex`); then the per-example input(s):
      - fibonacci → `<input type="number" class="rec-n" value="${inputs.fibonacci.n}" min="0" max="7">`
      - reverse / permutations → `<input type="text" class="rec-text" value="${inputs[ex].text}">`
      - binary-search → `<input type="text" class="rec-arr" value="${inputs['binary-search'].arr.join(',')}"> <input type="number" class="rec-target" value="${inputs['binary-search'].target}">`
      - quicksort → `<input type="text" class="rec-arr" value="${inputs.quicksort.arr.join(',')}">`
      - then `<button type="button" class="rec-build">Build</button>`
    - stage: `<div class="rec-tree" style="position:relative;overflow:auto;height:320px"></div>` (left, call tree) + `<div class="rec-stack"></div>` (right, call stack).
  - Render the tree nodes as `.tree-node` divs (left/top = center); SVG `<line>` edges at (x,y) with no offset — but ONLY reveal nodes/edges for calls that have happened up to the current frame.
  - `let idx = 0;`
  - `paint()`:
    - Determine revealed node ids = the set of `frames[k].id` for `k ≤ idx` where `frames[k].event === 'call'` (a node is revealed once its call frame is reached). Also collect returned values: for `k ≤ idx` with `event === 'return'`, set that node's shown value.
    - Draw only revealed nodes + edges from a revealed child to its (revealed) parent. Each node shows its `label`; if returned-by-now, append `= <value>`. Highlight `frames[idx].id` (add an `active` class), and tint by `frames[idx].event` (call vs return).
    - Right pane `.rec-stack`: render `frames[idx].stack` bottom-to-top as frame chips (top = current call), each showing that node's `label`.
    - Show a status line: current event + (`idx === frames.length-1` ? final `result`).
  - `step()`: `if (idx < frames.length - 1) { idx++; paint(); return true; } return false;`
  - `reset()`: `idx = 0; paint();`
  - `paint(); host.appendChild(buildStepControls(step, reset, 700));`
  - `.rec-example` onchange: `_recState.example = sel.value; renderRecursion();`
  - `.rec-build` onclick (wrap in try/catch): read the visible input(s), clamp to caps, write into `_recState.inputs[ex]`, then `renderRecursion()`. Clamps:
    - fibonacci: `n = Math.max(0, Math.min(7, parseInt(...)||0))`
    - reverse: `text = value.slice(0, 6)`
    - permutations: `text = value.slice(0, 4)`
    - binary-search: `arr = value.split(',').map(x=>parseInt(x.trim(),10)).filter(Number.isFinite).slice(0,15)`, `target = parseInt(targetVal,10)`
    - quicksort: `arr = value.split(',').map(...).filter(Number.isFinite).slice(0,10)`
  - Add minimal CSS to `style.css` for `.rec-tree`/`.rec-stack`/stack chips if needed (allowed; commit it).

- [ ] **Step 6: 3 remaining wiring edits in js/app.js:**
  - codeByMethod (in getCodeForMethod): `'recursion': codeRecursion,`
  - updateLayout: `else if (currentMode === 'recursion') { codeTitle.textContent = 'recursion.cpp'; codeDisplay.textContent = codeRecursion; }`
  - renderAll: `else if (currentMode === 'recursion') renderRecursion();` (exact id; not near any substring catch-all conflict).

- [ ] **Step 7: i18n** — add to en group block `'group.recursion': 'Recursion',` and zh `'group.recursion': '遞迴',`; add method keys en `'method.recursion': 'Recursion (Call Tree & Stack)',` zh `'method.recursion': '遞迴(呼叫樹與堆疊)',`.

- [ ] **Step 8: slides** — add a `recursion` deck to `slides_db.js` (mirror an existing entry's shape; zh + en arrays of slide markdown). Cover: what recursion is (base case + recursive case); the call stack (LIFO frames) and call tree; how the 5 examples differ (overlapping subproblems in Fibonacci, linear reverse, exponential permutation tree, log-depth binary search, partition tree in quicksort). Run `npm run build:slides` (if a homebrew `libsimdjson` dylib error appears, a prior task symlinked `/opt/homebrew/opt/simdjson/lib/libsimdjson.28.dylib` — reuse if needed). Confirm `slides/zh/recursion.md` and `slides/en/recursion.md` were created.

- [ ] **Step 9: E2E** — create `tests/recursion.spec.js`. Copy the `fileUri` + `loadMethod(page, id)` helper verbatim from `tests/random_input.spec.js` (lines 1-37). Then:
```js
test('recursion loads, shows tree + stack, switches example, steps', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'recursion');
  const card = page.locator('[data-method-section="recursion"]');
  await expect(card).toHaveAttribute('data-runtime-state', 'active');
  await expect(card.locator('.rec-tree .tree-node').first()).toBeVisible();
  await expect(card.locator('.rec-stack').first()).toBeVisible();
  await card.locator('.rec-example').selectOption('quicksort');
  await card.locator('.rec-build').click();
  await card.locator('[data-action="step"]').click();
});
```
IMPORTANT: if the step-control button selector differs (`[data-action="step"]` is used by other viz tests — confirm against a passing tier3/random_input test), match the real selector. If `loadMethod`/`fileUri` differ, copy theirs verbatim.

- [ ] **Step 10: Verify + commit**
Run: `node --test tests/unit/*.test.js` (unchanged pass) and `npx playwright test tests/recursion.spec.js` (PASS).
NOTE: overview-tile/category and nav-pill COUNT tests in tests/i18n.spec.js + tests/visualizer.spec.js will FAIL now (new group/method) — EXPECTED, fixed in Task 3. Do NOT edit them here.
```bash
git add js/recursion_viz.js cpp/recursion.cpp js/code_db.js build_db.js index.html js/app.js js/i18n.js slides_db.js js/slides_rendered.js slides/zh/recursion.md slides/en/recursion.md tests/recursion.spec.js style.css
git commit -m "feat: recursion call-tree & call-stack visualization (recursion group)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```
(omit style.css if unchanged; js/recursion_viz.js already committed in Task 1 — omit it here.)

---

## Task 3: Full suite green + count reconciliation

**Files:** Modify `tests/i18n.spec.js`, `tests/visualizer.spec.js`.

- [ ] **Step 1: Run** `npm run test:all`. Expect failures only on the counts.

- [ ] **Step 2: Update counts** (this feature adds 1 method + 1 group):
  - `tests/i18n.spec.js`: overview-tile `99` → **100**; overview-category `12` → **13** (and the nearby comment "12 categories and 99 tiles" → "13 categories and 100 tiles").
  - `tests/visualizer.spec.js`: `.category-nav-btn` `13` → **14** (and comment "12 category groups = 13 pills" → "13 category groups = 14 pills").
  Verify the new numbers match reality (13 categories, 100 tiles, 14 pills).

- [ ] **Step 3: Secret check** — `git status --porcelain js/cloud-config.js` empty (else `git checkout js/cloud-config.js`).

- [ ] **Step 4: Re-run + commit**
Run: `npm run test:all` → fully green.
```bash
git add tests/i18n.spec.js tests/visualizer.spec.js
git commit -m "test: update counts for recursion viz (100 tiles, 13 categories, 14 pills)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review (completed by plan author)

**Spec coverage:** §2.1 module → Task 1 ✓ (`recursionTrace`/`EXAMPLES`/`DEFAULTS`, recorder, 5 instrumented fns). §2.2 render → Task 2 Step 5 (call tree + call stack, example dropdown, per-example inputs with caps). §2.3 wiring (4 edits) → Task 2 Steps 4/6. §2.4 cpp/slides/i18n/index → Task 2 Steps 1/2/3/7/8. §4 counts → Task 3. §5 unit + E2E → Tasks 1 + 2 Step 9. §7 risks (caps, n-ary layout, try/catch Build) addressed in Task 2 Step 5.

**Placeholder scan:** Module + unit test are complete verbatim code. Render is structured against the named template `renderGameTree` with explicit state var, selectors, frame/node contracts, clamps, and step/reset semantics. cpp complete. No TODO/TBD.

**Type/name consistency:** `recursionTrace(example, input)` → `{frames, nodes, result}` consistent across module, tests, render. Node fields `{id,parentId,label,depth,value,returned}` and frame fields `{event,id,stack,value}` used consistently. `_recState`, `.rec-example`/`.rec-n`/`.rec-text`/`.rec-arr`/`.rec-target`/`.rec-build`/`.rec-tree`/`.rec-stack`, `codeRecursion`, `renderRecursion`, group id `recursion`, method id `recursion` all consistent. `_recState` is a new state var (no collision). Counts 99→100 / 12→13 / 13→14 internally consistent (1 method, 1 group, 1 pill).
