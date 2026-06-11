# Tier-3 Batch B Implementation Plan (files + memory groups: file-isam, file-inverted, gc-memory)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two NEW method groups — `files` (file-isam, file-inverted) and `memory` (gc-memory) — with three new visualizations following the established dsvisual pattern.

**Architecture:** Each viz = a pure dual-export frame-generator module `js/<name>_viz.js` (unit-tested), a `render<Name>()` in the js/app.js closure (using `acquireDynamicVizHost()` + `buildStepControls(onStep,onReset,intervalMs)`), 4 wiring edits, a reference cpp + build_db mapping, a bilingual slides deck, i18n (`group.<id>` for the 2 new groups + `method.<id>`), and E2E. Two new METHOD_GROUPS group objects are added (placed after `searching`, before `oop`). These viz render heap blocks / index blocks / posting lists (NOT trees) — mirror `renderSortExternal()` (~line 4495) for block/row rendering.

**Tech Stack:** Vanilla browser JS, `node --test`, Playwright, `node build_db.js`, `npm run build:slides`.

**Spec:** `docs/superpowers/specs/2026-06-10-tier3-advanced-gaps-design.md` (§3.4 gc-memory, §3.5 file-isam, §3.6 file-inverted, §4 new-group infra).

---

## Shared reference

- **Module wrapper**: `(function(global){ 'use strict'; ...; const api={...}; if (typeof module!=='undefined'&&module.exports) module.exports=api; global.<Name>Viz=api; })(typeof window!=='undefined'?window:globalThis)`.
- **Render template**: READ `renderSortExternal()` (~4495) for block/row rendering + step controls; READ `acquireDynamicVizHost()` (~3315) and `buildStepControls(onStep,onReset,runIntervalMs)` (~3591). Pattern: `const host = acquireDynamicVizHost();` build `host.innerHTML` (controls + stage), `let idx=0;`, `paint()`/`step()` (return `idx<frames.length-1`)/`reset()`, `host.appendChild(buildStepControls(step, reset, 700));`.
- **New group object shape** (copy from the `searching` group at ~line 209):
```js
    {
        id: 'files',
        title: 'File Structures',
        methods: [ /* ... */ ],
    },
```
- **4 wiring edits per viz**: METHOD_GROUPS (the group's methods array), getCodeForMethod `codeByMethod` map, updateLayout else-if (set codeTitle/codeDisplay only), renderAll else-if (exact id; place before any generic substring catch-all — none of these ids collide with `search`/`sort`/`list-`/`stack` EXCEPT `file-*` has no catch-all and `gc-memory`/`file-*` are safe; still add them as exact-id branches near the other dynamic-host ones).
- **i18n**: add `group.files`, `group.memory` to BOTH en (near line 18) and zh (near line 237) group blocks; add `method.<id>` for all three ids to both en and zh.
- **counts**: after Batch B — overview tiles 96→**99**, overview-category 10→**12**, nav `.category-nav-btn` 11→**13** (Task 4).
- **code_db**: `code<Name>` from `node build_db.js` after adding the `cpp/<name>.cpp` → const mapping to `build_db.js`.
- **slides**: deck in `slides_db.js` → `npm run build:slides` (if a homebrew `libsimdjson` dylib error appears, prior tasks symlinked `/opt/homebrew/opt/simdjson/lib/libsimdjson.28.dylib` — reuse if needed).
- **index.html**: `<script src="js/<name>_viz.js"></script>` before app.js.

---

## Task 1: gc-memory (new `memory` group; mark-sweep / refcount / buddy)

**Files:** Create `js/gc_memory_viz.js`, `tests/unit/gc_memory.test.js`, `cpp/gc_memory.cpp`; Modify `js/app.js`, `index.html`, `js/i18n.js`, `slides_db.js`, `build_db.js`, `tests/tier3.spec.js`.

- [ ] **Step 1: Failing unit test `tests/unit/gc_memory.test.js`:**
```js
const test = require('node:test');
const assert = require('node:assert');
const V = require('../../js/gc_memory_viz.js');

test('mark-sweep frees only unreachable objects', () => {
  const { frames } = V.markSweepFrames();
  const last = frames[frames.length - 1];
  const byId = {}; last.heap.forEach((o) => { byId[o.id] = o; });
  // scenario: id 6 is garbage (unreachable); 0..5 reachable from roots [0,1]
  assert.strictEqual(byId[6].free, true);
  [0, 1, 2, 3, 4, 5].forEach((id) => assert.strictEqual(byId[id].free, false, 'id ' + id + ' kept'));
  // a mark phase happened before sweep
  assert.ok(frames.some((f) => f.phase === 'mark'));
  assert.ok(frames.some((f) => f.phase && f.phase.indexOf('sweep') === 0));
});

test('reference counting frees acyclic garbage but leaks a cycle', () => {
  const { frames } = V.refCountFrames();
  const last = frames[frames.length - 1];
  const byId = {}; last.objs.forEach((o) => { byId[o.id] = o; });
  // A,B acyclic -> freed; D,E cycle -> leaked (not freed)
  assert.strictEqual(byId['A'].free, true);
  assert.strictEqual(byId['B'].free, true);
  assert.strictEqual(byId['D'].free, false);
  assert.strictEqual(byId['E'].free, false);
});

test('buddy system conserves total space and coalesces', () => {
  const { frames } = V.buddyFrames();
  const last = frames[frames.length - 1];
  const totalCovered = last.blocks.reduce((s, b) => s + b.size, 0);
  assert.strictEqual(totalCovered, last.total);
  const allocated = last.blocks.filter((b) => !b.free).reduce((s, b) => s + b.size, 0);
  // BUDDY_OPS final live allocations: b(16) + d(32) = 48
  assert.strictEqual(allocated, 48);
  // a coalesce happened at some point
  assert.ok(frames.some((f) => /coalesce/.test(f.action || '')));
});

test('gcMemoryFrames dispatches by mode', () => {
  assert.ok(V.gcMemoryFrames('mark-sweep').frames.length > 0);
  assert.ok(V.gcMemoryFrames('refcount').frames.length > 0);
  assert.ok(V.gcMemoryFrames('buddy').frames.length > 0);
  assert.ok(V.gcMemoryFrames('unknown').frames.length > 0); // defaults to mark-sweep
});
```
Run → FAIL.

- [ ] **Step 2: Implement `js/gc_memory_viz.js`:**
```js
(function (global) {
  'use strict';

  const MS_SCENARIO = {
    objects: [
      { id: 0, refs: [2] }, { id: 1, refs: [3, 4] }, { id: 2, refs: [5] },
      { id: 3, refs: [] }, { id: 4, refs: [2] }, { id: 5, refs: [] }, { id: 6, refs: [] }
    ],
    roots: [0, 1]
  };
  function markSweepFrames(scenario) {
    scenario = scenario || MS_SCENARIO;
    const objs = scenario.objects.map((o) => ({ id: o.id, refs: o.refs.slice(), mark: false, free: false }));
    const byId = {}; objs.forEach((o) => { byId[o.id] = o; });
    const frames = [];
    function snap(phase, active) { return { phase: phase, active: active, heap: objs.map((o) => ({ id: o.id, refs: o.refs.slice(), mark: o.mark, free: o.free })) }; }
    frames.push(snap('start', null));
    const stack = scenario.roots.slice();
    while (stack.length) {
      const id = stack.pop(); const o = byId[id];
      if (!o || o.mark) continue;
      o.mark = true; frames.push(snap('mark', id));
      o.refs.forEach((r) => stack.push(r));
    }
    objs.forEach((o) => { if (!o.mark) { o.free = true; frames.push(snap('sweep-free', o.id)); } else { frames.push(snap('sweep-keep', o.id)); } });
    frames.push(snap('done', null));
    return { frames: frames };
  }

  const RC_OPS = [
    { type: 'alloc', id: 'A' }, { type: 'alloc', id: 'B' }, { type: 'ref', from: 'A', to: 'B' },
    { type: 'droproot', id: 'B' }, { type: 'droproot', id: 'A' },
    { type: 'alloc', id: 'D' }, { type: 'alloc', id: 'E' },
    { type: 'ref', from: 'D', to: 'E' }, { type: 'ref', from: 'E', to: 'D' },
    { type: 'droproot', id: 'D' }, { type: 'droproot', id: 'E' }
  ];
  function refCountFrames(ops) {
    ops = ops || RC_OPS;
    const objs = {}; const order = [];
    const frames = [];
    function snap(action, active) { return { action: action, active: active, objs: order.map((id) => ({ id: id, count: objs[id].count, refs: objs[id].refs.slice(), free: objs[id].free })) }; }
    function decref(id) {
      const o = objs[id]; if (!o || o.free) return;
      o.count--;
      if (o.count <= 0) { o.free = true; frames.push(snap('free ' + id, id)); o.refs.forEach((t) => decref(t)); }
    }
    ops.forEach((op) => {
      if (op.type === 'alloc') { objs[op.id] = { count: 1, refs: [], free: false }; order.push(op.id); frames.push(snap('alloc ' + op.id, op.id)); }
      else if (op.type === 'ref') { objs[op.to].count++; objs[op.from].refs.push(op.to); frames.push(snap('ref ' + op.from + '->' + op.to, op.to)); }
      else if (op.type === 'droproot') { frames.push(snap('droproot ' + op.id, op.id)); decref(op.id); }
    });
    frames.push(snap('done', null));
    return { frames: frames };
  }

  const BUDDY_TOTAL = 64;
  const BUDDY_OPS = [
    { type: 'alloc', id: 'a', size: 8 }, { type: 'alloc', id: 'b', size: 16 }, { type: 'alloc', id: 'c', size: 8 },
    { type: 'free', id: 'a' }, { type: 'free', id: 'c' }, { type: 'alloc', id: 'd', size: 32 }
  ];
  function nextPow2(n) { let p = 1; while (p < n) p *= 2; return p; }
  function buddyFrames(total, ops) {
    total = total || BUDDY_TOTAL; ops = ops || BUDDY_OPS;
    let blocks = [{ start: 0, size: total, free: true, id: null }];
    const frames = [];
    function snap(action, active) { return { action: action, active: active, total: total, blocks: blocks.map((b) => ({ start: b.start, size: b.size, free: b.free, id: b.id })).sort((x, y) => x.start - y.start) }; }
    frames.push(snap('start', null));
    function alloc(id, size) {
      const need = nextPow2(size);
      let cand = null;
      blocks.forEach((b) => { if (b.free && b.size >= need) { if (!cand || b.size < cand.size) cand = b; } });
      if (!cand) { frames.push(snap('alloc ' + id + ' FAILED', null)); return; }
      while (cand.size > need) {
        const half = cand.size / 2;
        const left = { start: cand.start, size: half, free: true, id: null };
        const right = { start: cand.start + half, size: half, free: true, id: null };
        blocks = blocks.filter((b) => b !== cand); blocks.push(left, right);
        frames.push(snap('split ' + cand.size + '->' + half, cand.start));
        cand = left;
      }
      cand.free = false; cand.id = id;
      frames.push(snap('alloc ' + id + ' (' + need + ')', cand.start));
    }
    function free(id) {
      let b = blocks.find((x) => x.id === id);
      if (!b) return;
      b.free = true; b.id = null;
      frames.push(snap('free ' + id, b.start));
      let merged = true;
      while (merged) {
        merged = false;
        const buddyStart = b.start ^ b.size;
        const buddy = blocks.find((x) => x.start === buddyStart && x.size === b.size && x.free);
        if (buddy) {
          const start = Math.min(b.start, buddy.start);
          blocks = blocks.filter((x) => x !== b && x !== buddy);
          const m = { start: start, size: b.size * 2, free: true, id: null };
          blocks.push(m);
          frames.push(snap('coalesce @' + start + ' (' + m.size + ')', start));
          b = m; merged = true;
        }
      }
    }
    ops.forEach((op) => { if (op.type === 'alloc') alloc(op.id, op.size); else if (op.type === 'free') free(op.id); });
    frames.push(snap('done', null));
    return { frames: frames };
  }

  function gcMemoryFrames(mode) {
    if (mode === 'refcount') return refCountFrames();
    if (mode === 'buddy') return buddyFrames();
    return markSweepFrames();
  }

  const api = { markSweepFrames: markSweepFrames, refCountFrames: refCountFrames, buddyFrames: buddyFrames, gcMemoryFrames: gcMemoryFrames, MS_SCENARIO: MS_SCENARIO, RC_OPS: RC_OPS, BUDDY_OPS: BUDDY_OPS, BUDDY_TOTAL: BUDDY_TOTAL };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.GcMemoryViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
```
Run unit test → PASS (4 tests). (Note: in RC scenario, droproot B leaves B alive via A's ref; droproot A frees A then decrefs B → B freed. D/E mutual refs keep count=1 after both droproots → leaked. Verify the test passes; if not, debug with systematic-debugging — do not weaken the test.)

- [ ] **Step 3: Create `cpp/gc_memory.cpp`** (concise reference covering the three strategies):
```cpp
// Dynamic storage management: mark-sweep, reference counting, buddy system
#include <iostream>
#include <vector>
#include <unordered_map>
using namespace std;

struct Obj { vector<int> refs; bool mark = false; bool freed = false; };

void markSweep(vector<Obj>& heap, const vector<int>& roots) {
    vector<int> stack = roots;
    while (!stack.empty()) {
        int id = stack.back(); stack.pop_back();
        if (heap[id].mark) continue;
        heap[id].mark = true;
        for (int r : heap[id].refs) stack.push_back(r);
    }
    for (auto& o : heap) if (!o.mark) o.freed = true;  // sweep
}

int main() {
    vector<Obj> heap = { {{2}}, {{3,4}}, {{5}}, {{}}, {{2}}, {{}}, {{}} };
    markSweep(heap, {0, 1});
    for (size_t i = 0; i < heap.size(); ++i)
        cout << "obj " << i << (heap[i].freed ? " freed\n" : " kept\n");
    return 0;
}
```

- [ ] **Step 4: build_db mapping** — add `gc_memory.cpp` → `codeGcMemory`; `node build_db.js`; verify `grep -c codeGcMemory js/code_db.js` ≥1.

- [ ] **Step 5: index.html** — `<script src="js/gc_memory_viz.js"></script>` before app.js.

- [ ] **Step 6: Add the NEW `memory` group to METHOD_GROUPS** (place the group object after the `searching` group's closing `},` and before the `oop` group):
```js
    {
        id: 'memory',
        title: 'Memory / GC',
        methods: [
            { id: 'gc-memory', title: 'Dynamic Storage / GC', file: 'gc_memory.cpp', visualizer: 'gcmem', controls: 'gcmem' },
        ],
    },
```

- [ ] **Step 7: Implement `renderGcMemory()` in js/app.js** (mirror renderSortExternal block rendering):
- `let _gcState = null;`
- `if (!_gcState) _gcState = { mode: 'mark-sweep' };`
- `const host = acquireDynamicVizHost();`
- `const { frames } = GcMemoryViz.gcMemoryFrames(_gcState.mode);`
- `host.innerHTML`: controls row = a `<select class="gc-mode">` with options `mark-sweep` / `refcount` / `buddy` (current selected) + a stage `<div class="gc-stage"></div>` + a phase badge.
- `paint()`:
  - mark-sweep: render `frames[idx].heap` as object cells showing id + mark/free state (marked=green, free=greyed/✗); show the active id and `phase`.
  - refcount: render `frames[idx].objs` as cells showing id + count + free state; show `action`.
  - buddy: render `frames[idx].blocks` as a horizontal bar partitioned by `start`/`size` (width ∝ size/total), free=light, allocated=colored with its id; show `action`.
  Branch on `_gcState.mode` to pick the renderer for the frame shape.
- `step()` returns `idx < frames.length - 1`; `reset()` idx=0; `host.appendChild(buildStepControls(step, reset, 700));`
- `.gc-mode` onchange: `_gcState.mode = select.value; renderGcMemory();`

- [ ] **Step 8: 3 remaining wiring edits**
2. codeByMethod: `'gc-memory': codeGcMemory,`
3. updateLayout: `else if (currentMode === 'gc-memory') { codeTitle.textContent = 'gc_memory.cpp'; codeDisplay.textContent = codeGcMemory; }`
4. renderAll: `else if (currentMode === 'gc-memory') renderGcMemory();`

- [ ] **Step 9: i18n** — add to en group block: `'group.memory': 'Memory / GC',`; zh group block: `'group.memory': '記憶體 / GC',`. Add method keys — en: `'method.gc-memory': 'Dynamic Storage / GC',`; zh: `'method.gc-memory': '動態儲存管理 / GC',`.

- [ ] **Step 10: slides** — add `gc-memory` deck to slides_db.js (zh+en): why automatic memory management; mark-sweep (mark from roots, sweep unmarked); reference counting + the cycle-leak problem; buddy system (split/coalesce, internal fragmentation). `npm run build:slides`.

- [ ] **Step 11: E2E** — append to `tests/tier3.spec.js`:
```js
test('gc-memory loads, switches mode, steps', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'gc-memory');
  await expect(page.locator('[data-method-section][data-runtime-state="active"]')).toBeVisible();
  await expect(page.locator('.gc-stage').first()).toBeVisible();
  await page.selectOption('.gc-mode', 'buddy');
  await page.click('[data-action="step"]');
});
```

- [ ] **Step 12: Run + commit**
Run: `node --test tests/unit/gc_memory.test.js && node --test tests/unit/*.test.js && npx playwright test tests/tier3.spec.js`
```bash
git add js/gc_memory_viz.js tests/unit/gc_memory.test.js cpp/gc_memory.cpp js/code_db.js build_db.js index.html js/app.js js/i18n.js slides_db.js js/slides_rendered.js slides/zh/gc-memory.md slides/en/gc-memory.md tests/tier3.spec.js
git commit -m "feat: dynamic storage / GC visualization (memory group)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: file-isam (new `files` group; ISAM index search)

**Files:** Create `js/file_isam_viz.js`, `tests/unit/file_isam.test.js`, `cpp/file_isam.cpp`; Modify `js/app.js`, `index.html`, `js/i18n.js`, `slides_db.js`, `build_db.js`, `tests/tier3.spec.js`.

- [ ] **Step 1: Failing unit test `tests/unit/file_isam.test.js`:**
```js
const test = require('node:test');
const assert = require('node:assert');
const V = require('../../js/file_isam_viz.js');

test('buildIsam partitions sorted keys into blocks with an index', () => {
  const isam = V.buildIsam([30, 10, 50, 20, 40, 70, 60], 3);
  // sorted: 10 20 30 | 40 50 60 | 70
  assert.strictEqual(isam.blocks.length, 3);
  assert.deepStrictEqual(isam.blocks[0].keys, [10, 20, 30]);
  assert.deepStrictEqual(isam.index.map((e) => e.minKey), [10, 40, 70]);
});

test('searchFrames finds a present key in the right block', () => {
  const isam = V.buildIsam([10, 20, 30, 40, 50, 60, 70], 3);
  const r = V.searchFrames(isam, 50);
  assert.strictEqual(r.found, true);
  assert.strictEqual(r.block, 1); // 40 50 60
  assert.ok(r.frames.some((f) => f.phase === 'found'));
});

test('searchFrames reports not-found for an absent key', () => {
  const isam = V.buildIsam([10, 20, 30, 40, 50, 60, 70], 3);
  const r = V.searchFrames(isam, 55);
  assert.strictEqual(r.found, false);
  assert.ok(r.frames.some((f) => f.phase === 'notfound'));
});

test('empty key set builds one empty block', () => {
  const isam = V.buildIsam([], 3);
  assert.strictEqual(isam.blocks.length, 1);
  assert.deepStrictEqual(isam.blocks[0].keys, []);
});
```
Run → FAIL.

- [ ] **Step 2: Implement `js/file_isam_viz.js`:**
```js
(function (global) {
  'use strict';

  function buildIsam(keys, blockSize) {
    blockSize = blockSize || 3;
    const sorted = (keys || []).slice().sort((a, b) => a - b);
    const blocks = [];
    for (let i = 0; i < sorted.length; i += blockSize) blocks.push({ keys: sorted.slice(i, i + blockSize), overflow: [] });
    if (!blocks.length) blocks.push({ keys: [], overflow: [] });
    const index = blocks.map((b, i) => ({ blockIndex: i, minKey: b.keys.length ? b.keys[0] : Infinity }));
    return { blocks: blocks, index: index, blockSize: blockSize };
  }

  function searchFrames(isam, key) {
    const frames = [];
    let bi = 0;
    for (let i = 0; i < isam.index.length; i++) {
      frames.push({ phase: 'index', activeIndex: i, key: key });
      if (isam.index[i].minKey <= key) bi = i; else break;
    }
    frames.push({ phase: 'block', activeBlock: bi, key: key });
    const blk = isam.blocks[bi];
    for (let s = 0; s < blk.keys.length; s++) {
      frames.push({ phase: 'scan', activeBlock: bi, activeSlot: s, key: key });
      if (blk.keys[s] === key) { frames.push({ phase: 'found', activeBlock: bi, activeSlot: s, key: key }); return { frames: frames, found: true, block: bi, slot: s }; }
    }
    for (let s = 0; s < blk.overflow.length; s++) {
      frames.push({ phase: 'overflow', activeBlock: bi, activeSlot: s, key: key });
      if (blk.overflow[s] === key) { frames.push({ phase: 'found', activeBlock: bi, overflow: true, slot: s, key: key }); return { frames: frames, found: true, block: bi, slot: s, overflow: true }; }
    }
    frames.push({ phase: 'notfound', activeBlock: bi, key: key });
    return { frames: frames, found: false, block: bi };
  }

  const api = { buildIsam: buildIsam, searchFrames: searchFrames, SAMPLE_KEYS: [10, 20, 30, 40, 50, 60, 70, 80, 90], SAMPLE_BLOCK: 3 };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.FileIsamViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
```
Run unit test → PASS (4 tests).

- [ ] **Step 3: Create `cpp/file_isam.cpp`:**
```cpp
// ISAM: indexed sequential access — index of block min-keys + sorted data blocks
#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    vector<int> keys = {10, 20, 30, 40, 50, 60, 70, 80, 90};
    int blockSize = 3;
    sort(keys.begin(), keys.end());
    vector<vector<int>> blocks;
    for (size_t i = 0; i < keys.size(); i += blockSize)
        blocks.push_back(vector<int>(keys.begin() + i, keys.begin() + min(keys.size(), i + blockSize)));

    int target = 50, bi = 0;
    for (size_t i = 0; i < blocks.size(); ++i)   // index: pick block whose min-key <= target
        if (!blocks[i].empty() && blocks[i][0] <= target) bi = i; else break;
    bool found = false;
    for (int k : blocks[bi]) if (k == target) found = true;   // scan within block
    cout << "key " << target << (found ? " found" : " not found") << " in block " << bi << "\n";
    return 0;
}
```

- [ ] **Step 4: build_db** — add `file_isam.cpp` → `codeFileIsam`; `node build_db.js`; verify.

- [ ] **Step 5: index.html** — `<script src="js/file_isam_viz.js"></script>` before app.js.

- [ ] **Step 6: Add the NEW `files` group to METHOD_GROUPS** (place after the `searching` group, before `memory`/`oop`):
```js
    {
        id: 'files',
        title: 'File Structures',
        methods: [
            { id: 'file-isam', title: 'ISAM (Indexed Sequential)', file: 'file_isam.cpp', visualizer: 'isam', controls: 'isam' },
        ],
    },
```
(file-inverted is appended to this group in Task 3.)

- [ ] **Step 7: Implement `renderFileIsam()` in js/app.js** (mirror renderSortExternal):
- `let _isamState = null;`
- `if (!_isamState) _isamState = { keys: FileIsamViz.SAMPLE_KEYS.slice(), blockSize: FileIsamViz.SAMPLE_BLOCK, key: 50 };`
- `const host = acquireDynamicVizHost();`
- `const isam = FileIsamViz.buildIsam(_isamState.keys, _isamState.blockSize);`
- `const { frames } = FileIsamViz.searchFrames(isam, _isamState.key);`
- `host.innerHTML`: controls row = `<input type="number" class="isam-key" value="${_isamState.key}">` + `<button class="isam-search">Search</button>` + stage. Stage = an index row (one cell per `isam.index[i].minKey`) above a row of data blocks (each block shows its keys; show overflow if any).
- `paint()`: highlight per `frames[idx]` — `index` phase highlights `activeIndex` index cell; `block`/`scan` highlights `activeBlock` and `activeSlot`; `found` greens the slot; `notfound` marks the block red. Show `phase`+`key`.
- `step()` returns `idx < frames.length - 1`; `reset()`; `buildStepControls(step, reset, 700)`.
- `.isam-search` onclick (try/catch): `_isamState.key = parseInt(host.querySelector('.isam-key').value, 10); renderFileIsam();`

- [ ] **Step 8: 3 remaining wiring edits** — codeByMethod `'file-isam': codeFileIsam,`; updateLayout `else if (currentMode === 'file-isam') { codeTitle.textContent = 'file_isam.cpp'; codeDisplay.textContent = codeFileIsam; }`; renderAll `else if (currentMode === 'file-isam') renderFileIsam();`

- [ ] **Step 9: i18n** — en group: `'group.files': 'File Structures',`; zh group: `'group.files': '檔案結構',`. Method — en: `'method.file-isam': 'ISAM (Indexed Sequential)',`; zh: `'method.file-isam': 'ISAM 索引循序',`.

- [ ] **Step 10: slides** — `file-isam` deck (zh+en): indexed sequential access concept; index level → data blocks; search path; overflow handling. `npm run build:slides`.

- [ ] **Step 11: E2E** — append to tests/tier3.spec.js:
```js
test('file-isam loads, searches, steps', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'file-isam');
  await expect(page.locator('[data-method-section][data-runtime-state="active"]')).toBeVisible();
  await page.fill('.isam-key', '40');
  await page.click('.isam-search');
  await page.click('[data-action="step"]');
});
```

- [ ] **Step 12: Run + commit**
Run: `node --test tests/unit/file_isam.test.js && node --test tests/unit/*.test.js && npx playwright test tests/tier3.spec.js`
```bash
git add js/file_isam_viz.js tests/unit/file_isam.test.js cpp/file_isam.cpp js/code_db.js build_db.js index.html js/app.js js/i18n.js slides_db.js js/slides_rendered.js slides/zh/file-isam.md slides/en/file-isam.md tests/tier3.spec.js
git commit -m "feat: ISAM indexed-sequential search visualization (files group)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: file-inverted (append to `files` group; inverted index)

**Files:** Create `js/file_inverted_viz.js`, `tests/unit/file_inverted.test.js`, `cpp/file_inverted.cpp`; Modify `js/app.js`, `index.html`, `js/i18n.js`, `slides_db.js`, `build_db.js`, `tests/tier3.spec.js`.

- [ ] **Step 1: Failing unit test `tests/unit/file_inverted.test.js`:**
```js
const test = require('node:test');
const assert = require('node:assert');
const V = require('../../js/file_inverted_viz.js');

const DOCS = ['the cat sat', 'the dog ran', 'cat and dog'];

test('buildInverted maps terms to sorted unique docIds', () => {
  const idx = V.buildInverted(DOCS);
  assert.deepStrictEqual(idx['the'], [0, 1]);
  assert.deepStrictEqual(idx['cat'], [0, 2]);
  assert.deepStrictEqual(idx['dog'], [1, 2]);
  assert.deepStrictEqual(idx['sat'], [0]);
});

test('buildFrames produces a frame per posting insertion and a final index', () => {
  const { frames, index } = V.buildFrames(DOCS);
  assert.ok(frames.length >= 1);
  assert.deepStrictEqual(index['cat'], [0, 2]);
});

test('queryFrames returns postings for a term (case-insensitive)', () => {
  const idx = V.buildInverted(DOCS);
  const r = V.queryFrames(idx, 'CAT');
  assert.deepStrictEqual(r.postings, [0, 2]);
});

test('query for an absent term returns empty postings', () => {
  const idx = V.buildInverted(DOCS);
  assert.deepStrictEqual(V.queryFrames(idx, 'zebra').postings, []);
});
```
Run → FAIL.

- [ ] **Step 2: Implement `js/file_inverted_viz.js`:**
```js
(function (global) {
  'use strict';

  function tokenize(s) { return String(s).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean); }

  function buildInverted(docs) {
    const index = {};
    (docs || []).forEach((doc, di) => {
      const seen = {};
      tokenize(doc).forEach((tok) => {
        if (!seen[tok]) { seen[tok] = true; (index[tok] = index[tok] || []).push(di); }
      });
    });
    return index;
  }

  function buildFrames(docs) {
    const index = {};
    const frames = [];
    function snap(active) { const copy = {}; Object.keys(index).forEach((k) => { copy[k] = index[k].slice(); }); return { index: copy, active: active }; }
    (docs || []).forEach((doc, di) => {
      const seen = {};
      tokenize(doc).forEach((tok) => {
        if (!seen[tok]) { seen[tok] = true; (index[tok] = index[tok] || []).push(di); frames.push(snap({ doc: di, term: tok })); }
      });
    });
    frames.push(snap(null));
    return { frames: frames, index: index };
  }

  function queryFrames(index, term) {
    term = String(term).toLowerCase();
    const postings = (index[term] || []).slice();
    return { frames: [{ term: term, postings: postings }], postings: postings };
  }

  const api = { tokenize: tokenize, buildInverted: buildInverted, buildFrames: buildFrames, queryFrames: queryFrames, SAMPLE_DOCS: ['the cat sat on the mat', 'the dog ran fast', 'cat and dog play', 'a quick brown fox'] };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.FileInvertedViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
```
Run unit test → PASS (4 tests).

- [ ] **Step 3: Create `cpp/file_inverted.cpp`:**
```cpp
// Inverted index: term -> list of document ids
#include <iostream>
#include <map>
#include <set>
#include <vector>
#include <sstream>
#include <string>
using namespace std;

int main() {
    vector<string> docs = {"the cat sat", "the dog ran", "cat and dog"};
    map<string, set<int>> index;
    for (size_t d = 0; d < docs.size(); ++d) {
        istringstream iss(docs[d]); string w;
        while (iss >> w) index[w].insert((int)d);
    }
    for (auto& [term, postings] : index) {
        cout << term << " ->";
        for (int id : postings) cout << " " << id;
        cout << "\n";
    }
    return 0;
}
```

- [ ] **Step 4: build_db** — add `file_inverted.cpp` → `codeFileInverted`; `node build_db.js`; verify.

- [ ] **Step 5: index.html** — `<script src="js/file_inverted_viz.js"></script>` before app.js.

- [ ] **Step 6: Append `file-inverted` to the existing `files` group** in METHOD_GROUPS (after the `file-isam` method entry):
```js
            { id: 'file-inverted', title: 'Inverted Index', file: 'file_inverted.cpp', visualizer: 'inverted', controls: 'inverted' },
```

- [ ] **Step 7: Implement `renderFileInverted()` in js/app.js:**
- `let _invState = null;`
- `if (!_invState) _invState = { docs: FileInvertedViz.SAMPLE_DOCS.slice(), query: 'cat' };`
- `const host = acquireDynamicVizHost();`
- `const { frames, index } = FileInvertedViz.buildFrames(_invState.docs);`
- `host.innerHTML`: controls row = `<input type="text" class="inv-query" value="${_invState.query}">` + `<button class="inv-query-btn">Query</button>` + a two-pane stage: left = document list (id: text), right = `<div class="inv-index">` posting table (term → docIds).
- `paint()`: render the cumulative `frames[idx].index` posting table; highlight the active `{doc, term}` insertion. The build animation steps through `frames`.
- After the build frames are exhausted (or always available), a Query: when `.inv-query-btn` clicked, compute `FileInvertedViz.queryFrames(index, _invState.query)` and highlight the resulting `postings` docs + the term row. (Simplest: store `_invState.query`, and in paint always show the queried term's postings highlighted using the FULL index; the step controls walk the build frames.)
- `step()` returns `idx < frames.length - 1`; `reset()`; `buildStepControls(step, reset, 700)`.
- `.inv-query-btn` onclick (try/catch): `_invState.query = host.querySelector('.inv-query').value; renderFileInverted();`

- [ ] **Step 8: 3 remaining wiring edits** — codeByMethod `'file-inverted': codeFileInverted,`; updateLayout `else if (currentMode === 'file-inverted') { codeTitle.textContent = 'file_inverted.cpp'; codeDisplay.textContent = codeFileInverted; }`; renderAll `else if (currentMode === 'file-inverted') renderFileInverted();`

- [ ] **Step 9: i18n** — en: `'method.file-inverted': 'Inverted Index',`; zh: `'method.file-inverted': '倒排索引',`. (group.files already added in Task 2.)

- [ ] **Step 10: slides** — `file-inverted` deck (zh+en): inverted index for full-text search; term→postings; build process; query + AND intersection. `npm run build:slides`.

- [ ] **Step 11: E2E** — append to tests/tier3.spec.js:
```js
test('file-inverted loads, queries, steps', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'file-inverted');
  await expect(page.locator('[data-method-section][data-runtime-state="active"]')).toBeVisible();
  await expect(page.locator('.inv-index').first()).toBeVisible();
  await page.fill('.inv-query', 'dog');
  await page.click('.inv-query-btn');
  await page.click('[data-action="step"]');
});
```

- [ ] **Step 12: Run + commit**
Run: `node --test tests/unit/file_inverted.test.js && node --test tests/unit/*.test.js && npx playwright test tests/tier3.spec.js`
```bash
git add js/file_inverted_viz.js tests/unit/file_inverted.test.js cpp/file_inverted.cpp js/code_db.js build_db.js index.html js/app.js js/i18n.js slides_db.js js/slides_rendered.js slides/zh/file-inverted.md slides/en/file-inverted.md tests/tier3.spec.js
git commit -m "feat: inverted index visualization (files group)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Full suite green + count reconciliation (2 new groups, 3 new methods)

**Files:** Modify `tests/i18n.spec.js`, `tests/visualizer.spec.js`.

- [ ] **Step 1: Run full suite** — `npm run test:all`. Expect failures ONLY on the hardcoded counts.

- [ ] **Step 2: Update counts** (Batch B adds 2 groups + 3 methods):
- `tests/i18n.spec.js`: line ~89 comment and line ~90 `overview-category` count `10` → **12**; line ~91 `overview-tile` count `96` → **99**.
- `tests/visualizer.spec.js`: line ~37 comment and line ~38 `.category-nav-btn` count `11` → **13** (1 overview + 12 groups).
Update these literals to the new values. Verify they match reality (12 categories, 99 tiles, 13 pills).

- [ ] **Step 3: Secret check** — `git status --porcelain js/cloud-config.js` empty (else `git checkout js/cloud-config.js`).

- [ ] **Step 4: Re-run + commit**
Run: `npm run test:all` → fully green.
```bash
git add tests/i18n.spec.js tests/visualizer.spec.js
git commit -m "test: update counts for Tier-3 Batch B (99 tiles, 12 categories, 13 pills)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review (completed by plan author)

**Spec coverage:** §3.4 gc-memory (3 modes) → Task 1 ✓; §3.5 file-isam → Task 2 ✓; §3.6 file-inverted → Task 3 ✓; §4 new-group infra (files+memory groups, group.* i18n, count updates) → Tasks 1/2 add the group objects + group i18n, Task 4 updates counts ✓. §6 Batch B = these 3 viz + 2 groups ✓. §7 unit + E2E + counts → Tasks 1–4 ✓.

**Placeholder scan:** All three modules + unit tests are complete code defining exact behavior. Render steps are structured against the named template `renderSortExternal` with explicit state vars, selectors, frame contracts, and per-mode rendering. cpp files are complete. No TODO/TBD.

**Type/name consistency:** Module exports & ids consistent across module/test/render/wiring/i18n/slides: `GcMemoryViz`/`gc-memory`/`_gcState`/`.gc-*`/`codeGcMemory`; `FileIsamViz`/`file-isam`/`_isamState`/`.isam-*`/`codeFileIsam`; `FileInvertedViz`/`file-inverted`/`_invState`/`.inv-*`/`codeFileInverted`. New group ids `memory` (Task 1) and `files` (Task 2, file-inverted appends in Task 3). State var names checked for collisions against existing app.js (`_gcState`/`_isamState`/`_invState`/`_polyphaseState` are all new). Counts: tiles 96→99, category 10→12, nav 11→13 — internally consistent (3 methods, 2 groups, 2 pills). renderAll exact-id branches don't collide with substring catch-alls (no `sort`/`search`/`list-`/`stack` substrings in these ids).
