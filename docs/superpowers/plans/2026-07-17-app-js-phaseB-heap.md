# app.js Stage 4 Phase B — Plan #6: heap domain

> REQUIRED SUB-SKILL: superpowers:subagent-driven-development.

**Goal:** Extract the heap domain (7 ids + tutorial state machine + 12 handlers) from `js/app.js` into `js/domains/heap.js` via the proven domain seam. Zero behavior change. This is the largest/most intricate domain.

## Constraints (proven pattern)
`K=()=>global.VizKit; C=()=>global.VizCore; R=()=>global.VizRegistry`; `currentMode`→`C().getMode()`; `showStatus`/`executeAnimWrapper`/`getDelay`→`K().*`; `t` (i18n) → `K().t`; `sleep`/bare `animState`/`document.getElementById(...)`/`window.HeapModels`/`window.RandomInput` stay; DOM→`dom.*` via `init()`. Keep shell in app.js: heap DOM consts, `setAnimControls` heap branch, `handlePauseClick`/`handleStopClick`, `updateLayout` heap branch. Load `js/domains/heap.js` AFTER `js/heap_models.js` (dependency `window.HeapModels`) and after core, before app.js.

## Inventory (verified)
- ids (7) → `renderHeap`: heap-binary/binomial/fibonacci/leftist/skew/dary/pairing; code consts codeHeapBinary/Binomial/Fibonacci/Leftist/Skew/Dary/Pairing; layout null.
- state: `heapEventTimer` (1425), `heapIsMin` (1431), `heapModels` (const, 1432 — built from `HeapModels.createHeapModel(id, heapIsMin)`), `heapTutorialState` (1499), `heapTutorialProfiles` (config obj, ~1441).
- functions to MOVE: `clearHeapEventMarks` (1517), `getHeapModel`-ish (returns `heapModels[currentMode]`, ~1529), `setHeapComparator` (1540), `renderHeap` (2564), `renderHeapTutorialPanel` (1631), `startHeapTutorial` (1665), `exitHeapTutorial` (1686), `advanceHeapTutorial` (1693), `syncHeapTutorialChrome` (grep it), `eventToClass` (1717), `animateHeapEvents` (1726). (Grep each for exact ranges; move ALL heap-only helpers they reference.)
- handlers (MOVE to init): `heapOrderSelect` change (1770); `btnHeapInsert/Peek/Extract/Merge/Change/Delete/FindMin/Stats/Tutorial` (1779-1909); `btnHeapTutorialNext/Restart/Exit` (1913-1915).
- DOM consts (heapContainer/heapEdges/heapNodesContainer/heapOrderSelect/heapValInput/heapExtraInput/9 buttons/tutorial panel els) — the domain self-looks-up what it needs in init(); KEEP the button consts in app.js for `setAnimControls`.

## Couplings to handle
1. **switchMode** has two heap pieces: (a) top line `if (heapTutorialState.active && nextMode !== heapTutorialState.mode) exitHeapTutorial(true);` and (b) the `if(currentMode.includes('heap-')) { heapOrderSelect.value=...; clearHeapEventMarks(); heapModels[currentMode].clear(); heapModels[currentMode].setOrder(heapIsMin); }` block. Both move into the domain's `onModeSwitch(mode)`: `if (heapTutorialState.active && mode !== heapTutorialState.mode) exitHeapTutorial(true); if (mode.includes('heap-')) { dom.heapOrderSelect.value = heapIsMin ? 'min':'max'; clearHeapEventMarks(); heapModels[mode].clear(); heapModels[mode].setOrder(heapIsMin); }`. (exitHeapTutorial doesn't read currentMode, so running post-setMode is behavior-equivalent — verified.) Remove BOTH from switchMode.
2. **handleStopClick** heap branch calls bare `renderHeap()` → change to registry idiom `else if (currentMode.includes('heap-')) { const b = window.VizRegistry && window.VizRegistry.behavior(currentMode); if (b && b.render) b.render(); }` (same fix as sort/search).
3. **setAnimControls** heap branch stays in app.js (references the kept heap button consts) — do NOT move it.

---

### Task 1: Extract heap domain (atomic)

**Files:** create `js/domains/heap.js`; modify `js/app.js`, `index.html`.

- [ ] **Step 1: Create `js/domains/heap.js`** (IIFE per graph.js/linear.js). Move VERBATIM (substitutions above): state `heapEventTimer`/`heapIsMin`/`heapModels`/`heapTutorialState`/`heapTutorialProfiles`; ALL the heap functions listed; `onModeSwitch(mode)` = the two switchMode heap pieces (item 1); `init()` = self-look-up the heap DOM it needs (heapOrderSelect/heapValInput/heapExtraInput/heapNodesContainer/heapEdges/tutorial panel els/buttons) + wire ALL 12 handlers VERBATIM (substitutions). Register the 7 ids → renderHeap (bare code consts, layout null); `C().registerDomain({ id: 'heap', init, onModeSwitch })`.
  - Grep-find and move any heap-only helper referenced but not yet listed (e.g. `syncHeapTutorialChrome`, heap stats/merge helpers). Ensure NOTHING heap-only is left in app.js.

- [ ] **Step 2: Remove from app.js:** all moved functions + state + config objects; the 12 handlers; the 7 `reg('heap-*')` lines; the `renderAll` heap arm; BOTH switchMode heap pieces (the top tutorial-exit line AND the heap reset block). **Fix** handleStopClick heap branch (item 2). KEEP: heap DOM consts (for setAnimControls), `setAnimControls` heap branch, `handlePause/Stop`, `updateLayout` heap branch.
  After: `grep -nE "renderHeap|heapModels|heapTutorialState|heapIsMin|animateHeapEvents|setHeapComparator|clearHeapEventMarks|exitHeapTutorial|startHeapTutorial|advanceHeapTutorial|heapTutorialProfiles|heapEventTimer" js/app.js` → remaining hits must be ONLY setAnimControls/updateLayout shell + kept button consts (verify each is not heap logic).

- [ ] **Step 3:** index.html: add `<script src="js/domains/heap.js" defer></script>` AFTER `js/heap_models.js` and after core/domains.js, before `js/app.js`.

- [ ] **Step 4: Verify:** `node -c` both; grep-clean; FULL `npx playwright test` (heap has dedicated specs — heap_visualizer.spec.js etc.) + `node --test tests/unit/*.test.js` (heap_models unit tests). Headless drive: for ≥2 heap types (binary + fibonacci), Insert several/Peek/Extract/Merge/Change/Delete/FindMin/Stats; the min/max comparator toggle; the full Start-Tutorial → Next×8 flow → Exit; and mode-switch resets + auto-closes an active tutorial. Report exactly what you drove.

- [ ] **Step 5:** Commit: `git add -A && git commit -m "refactor: extract heap domain to js/domains/heap.js"`

### Task 2: Verify + record
- [ ] `npm run test:all`; report counts + `wc -l js/app.js`; update `js/domains/README.md` (heap → migrated; remaining: tree incl tree-rb). Commit.

## Self-Review
- Largest domain: tutorial state machine + 12 handlers + heapModels(HeapModels dep) + comparator + event animation (getDelay/executeAnimWrapper via VizKit). Both switchMode heap pieces → onModeSwitch (exitHeapTutorial is currentMode-independent, so post-setMode timing is equivalent — verified). handleStopClick heap branch → registry fix (mirrors sort/search). setAnimControls heap branch + button consts stay (graph precedent). Load order: heap.js after heap_models.js. 7 ids each attach once. Headless tutorial-flow verification is REQUIRED given the state-machine complexity.
