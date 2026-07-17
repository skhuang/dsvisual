# app.js Stage 4 Phase B — Plan #3: sort domain

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox syntax.

**Goal:** Extract the sort domain (11 ids → `renderSortBars` + 11 animation fns) from `js/app.js` into `js/domains/sort.js`, using the proven hash/graph domain seam. Zero behavior change; tests green each step.

**Architecture:** IIFE + globals, no bundler. Follows `js/domains/graph.js` (template) and the `js/domains/README.md` recipe. One new core primitive: `getDelay` added to `window.VizKit` (it reads the shared `#sort-speed` control and is used by BOTH sort and the heap animation `animateHeapEvents` — so it's a shared anim primitive, exposed via VizKit; the closure `getDelay`/`sortSpeedInput` stay in app.js for the heap caller).

## Global Constraints

- Proven pattern: `const K=()=>global.VizKit; const C=()=>global.VizCore; const R=()=>global.VizRegistry;`; `currentMode`→`C().getMode()`; `showStatus`/`executeAnimWrapper`/`getDelay`→`K().*`; `getInputDifficulty`→`K().getInputDifficulty()`; `sleep` global; `window.RandomInput` stays.
- Zero behavior/styling/feature change; all suites green after every task.
- **Shell stays in app.js** (graph precedent): `sortContainer`/`sortActions` consts + `updateLayout` sort branch; `btnSortStart`/`btnSortRandom`/`btnSortPause`/`btnSortStop` consts + `setAnimControls`'s sort branch + `handlePauseClick`/`handleStopClick` + `sortSpeedInput` + the closure `getDelay`. The domain does its OWN `getElementById` for the buttons/container it wires/renders (duplicated lookup, same node — exactly as graph did).
- Load order: append `js/domains/sort.js` after `js/domains/graph.js`, before `js/app.js`.

## Inventory (verified)

- **ids (11) → `renderSortBars`**: sort-bubble/select/insert/quick/merge/shell/bucket/count/radix/heap/shaker; code consts codeSortBubble/SortSelect/SortInsert/SortQuick/SortMerge/SortShell/SortBucket/SortCounting/SortRadix/SortHeap/SortShaker; `layout: null`.
- **renderer + helpers:** `renderSortBars` (2665), `setBarColor` (2670), `setBarVal` (2669), `generateSortArray` (1753).
- **animation fns:** `runBubbleSort`, `runSelectionSort`, `runInsertionSort`, `runQuickSort` + `qsHelper` (2931), `runMergeSort` + `msHelper` (2946) + `msMerge` (2947), `runShellSort`, `runBucketSort`, `runCountingSort`, `runRadixSort`, `runHeapSort` + nested `heapify` (3031), `runShakerSort`.
- **handlers:** `btnSortRandom` (2135, → generateSortArray), `btnSortStart` (2136, big dispatch to run*Sort with the `setBarColor(...,'sorted')` finalizers).
- **state:** `sortArrData` (on shared decl line 1431 with `bstRoot`/`mainListData`).
- **switchMode:** line 1783 `if(currentMode.includes('sort-') && sortArrData.length === 0) generateSortArray();` → becomes the domain's `onModeSwitch`.

---

### Task 1: Add `getDelay` to VizKit

**Files:** modify `js/app.js`.

- [ ] **Step 1:** In `js/app.js`, add `getDelay,` to the `window.VizKit = { ... }` object (getDelay is a hoisted function at ~2152). Confirm via grep it exists.
- [ ] **Step 2:** Verify no behavior change: `node -c js/app.js`; `node --test tests/unit/*.test.js`; `npx playwright test tests/smoke_modes.spec.js` — pass.
- [ ] **Step 3:** Commit: `git commit -am "refactor: expose getDelay via VizKit (shared sort/heap anim primitive)"`

---

### Task 2: Extract the sort domain (atomic flip)

**Files:** create `js/domains/sort.js`; modify `js/app.js`, `index.html`.

- [ ] **Step 1: Create `js/domains/sort.js`** (IIFE per graph template). Move VERBATIM (substitutions: `currentMode`→`C().getMode()`; `showStatus`→`K().showStatus`; `executeAnimWrapper`→`K().executeAnimWrapper`; `getDelay()`→`K().getDelay()`; `getInputDifficulty()`→`K().getInputDifficulty()`; `sortContainer`→`dom.sortContainer` from init; `sleep`/`document.getElementById('sb-'+i)`/`RandomInput` stay):
  - state `sortArrData`;
  - `renderSortBars`, `setBarColor`, `setBarVal`, `generateSortArray`;
  - all 11 run fns + `qsHelper`/`msHelper`/`msMerge` (nested `heapify` stays nested in runHeapSort);
  - `onModeSwitch(mode)`: `if (mode.includes('sort-') && sortArrData.length === 0) generateSortArray();`
  - `init()`: self-look-up `dom = { sortContainer: getElementById('sort-container'), btnSortStart: getElementById('btn-sort-start'), btnSortRandom: getElementById('btn-sort-random') }`; wire `btnSortRandom` click (`if (K().isPlaying?...)` — actually keep verbatim: `if (animState...) return` becomes a guard; NOTE animState is a global `let` at app.js top — it IS a global, so the domain can read `animState` directly) and `btnSortStart` click (the big dispatch, verbatim with substitutions).
  - Register the 11 ids via `R().attach(id, { render: renderSortBars, code: () => <bareConst>, layout: null })`; `C().registerDomain({ id: 'sort', init, onModeSwitch })`.
  - NOTE: `animState` is a module-global `let animState` (app.js:4) — confirm it is declared with `var`/hoisted-global or on window; if it is a top-level `let` NOT on window, the domain cannot read it. Check: `grep -n "let animState\|window.animState\|var animState" js/app.js`. If it's a top-level `let` (module-global of the classic script, shared across scripts), the domain CAN reference `animState` since classic scripts share global lexical scope. Verify before relying on it; if not accessible, guard via `K()` (e.g. check a VizKit-exposed anim state) — but simplest: the btnSortRandom guard `if(animState==='playing'||animState==='paused') return;` — if animState is reachable, keep verbatim; else expose `getAnimState` via VizKit in Task 1.

- [ ] **Step 2: Remove from app.js:** the renderer + helpers + 11 run fns + qs/ms helpers + generateSortArray + both handlers; `sortArrData` from the shared decl line 1431 (KEEP `bstRoot`/`mainListData`); the 11 `reg('sort-*')` lines; the `else if (currentMode.includes('sort-')) renderSortBars();` renderAll arm (2658); the switchMode line 1783. KEEP: `sortContainer`/`sortActions`/`btnSort*` consts, `setAnimControls` sort branch, `handlePause/Stop`, `sortSpeedInput`, closure `getDelay`, `updateLayout` sort branch.
  After: `grep -nE "renderSortBars|setBarColor|setBarVal|generateSortArray|runBubbleSort|runSelectionSort|runInsertionSort|runQuickSort|qsHelper|runMergeSort|msHelper|msMerge|runShellSort|runBucketSort|runCountingSort|runRadixSort|runHeapSort|runShakerSort|sortArrData" js/app.js` — remaining hits must be only: the `btnSortStart`/`btnSortRandom` consts kept for setAnimControls, and setAnimControls/updateLayout shell lines. Verify each.

- [ ] **Step 3:** index.html: add `<script src="js/domains/sort.js" defer></script>` after `js/domains/graph.js`, before `js/app.js`.

- [ ] **Step 4: Verify** — `node -c` both; grep-clean; FULL `npx playwright test` + `node --test tests/unit/*.test.js`; headless drive of ≥3 sort modes (bubble, quick, radix): Randomize → Start → bars end sorted; no console errors; switching into a sort mode with empty data auto-generates.

- [ ] **Step 5:** Commit: `git add -A && git commit -m "refactor: extract sort domain to js/domains/sort.js"`

---

### Task 3: Verify + record

- [ ] `npm run test:all` — report counts + `wc -l js/app.js`. Update `js/domains/README.md` remaining-domains (remove sort). Commit.

---

## Self-Review

- **Spec coverage:** sort domain from Phase B design → Tasks 1-2; verify → Task 3.
- **New primitive:** `getDelay` on VizKit (Task 1) — needed because heap's `animateHeapEvents` also calls it; keeping the closure copy in app.js means the heap caller is unaffected and the sort domain uses `K().getDelay()`.
- **animState reachability** is explicitly checked in Task 2 Step 1 before relying on it (classic-script global vs closure); fallback: expose via VizKit.
- **Risk:** shared decl line 1431 split (keep bstRoot/mainListData); shell consts + setAnimControls stay in app.js per the graph precedent (verified graph kept its button consts). 11 ids each attach once → renderSortBars.
