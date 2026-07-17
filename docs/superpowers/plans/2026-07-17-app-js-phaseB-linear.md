# app.js Stage 4 Phase B — Plan #4: linear domain (stack/queue/list/deque)

> REQUIRED SUB-SKILL: superpowers:subagent-driven-development.

**Goal:** Extract the linear domain (stack/queue/list/deque — 6 ids, 4 renderers) from `js/app.js` into `js/domains/linear.js` via the proven domain seam. Zero behavior change. This domain is NOT coupled to `setAnimControls`/`getDelay` (clean).

## Constraints (proven pattern)
`K=()=>global.VizKit; C=()=>global.VizCore; R=()=>global.VizRegistry`; `currentMode`→`C().getMode()`; `showStatus`→`K().showStatus`; `acquireDynamicVizHost`→`K().acquireDynamicVizHost`; containers→`dom.*` via `init()` self-lookup; `sleep`/`setTimeout`/`document.getElementById(...)`/`window.RandomInput` stay. Keep shell (containers + `updateLayout`) in app.js. Load `js/domains/linear.js` after sort.js, before app.js.

## Inventory
- ids→renderer (code const, layout): `stack-array`→renderStack(codeArray,null), `stack-list`→renderStack(codeLinkedList,null), `queue`→renderQueue(codeQueue,{host:'dynamic'}), `list-array`→renderLists(codeListArray,null), `list-linked`→renderLists(codeListLinked,null), `deque`→renderDeque(codeDeque,{host:'dynamic'}).
- renderers: `renderStack(action)` (2974), `renderQueue` (2988), `renderLists` (2962), `renderDeque` (3009, uses acquireDynamicVizHost + `runtimeVisualizer._dequeData`).
- state: `stackData`, `qArr`/`qFront`/`qRear`/`qCount`, `mainListData`; deque uses `runtimeVisualizer._dequeData` → convert to a module-local `let _dequeData` (Phase A bloom/skiplist precedent).
- helpers: `MAX_SIZE` (=5; stack/queue only, lines 1783/1784/1789), `randStdValue` (1326; used by startup seed 1327 + btnStdAdd 1785).
- handlers: `btnStdAdd`/`btnStdRemove` (2974-era, dispatch stack vs queue), `btnListAdd`/`btnListRemove`. DOM: `stdVal`, `listIdx`, `listValInput`, plus container consts.
- deque has NO external handlers (renderDeque builds its own inline buttons).
- switchMode resets (line ~1760): `stackData = []; qArr = new Array(5).fill(null); qFront = 0; qRear = -1; qCount = 0; bstRoot = null;` and (~1761) `if(currentMode === 'list-array' || currentMode === 'list-linked') mainListData = [];`.

---

### Task 1: Extract linear domain (atomic)

**Files:** create `js/domains/linear.js`; modify `js/app.js`, `index.html`.

- [ ] **Step 1: Create `js/domains/linear.js`** (IIFE per graph.js/sort.js template). Move VERBATIM with substitutions:
  - state: `stackData`, `qArr`, `qFront`, `qRear`, `qCount`, `mainListData`, and `let _dequeData = null;` (replacing `runtimeVisualizer._dequeData` — initialize to `[10,20,30]` on first render exactly as the original lazy-init does, but as module-local).
  - helpers: `MAX_SIZE`, `randStdValue`.
  - renderers: `renderStack`, `renderQueue`, `renderLists`, `renderDeque` (in renderDeque, `acquireDynamicVizHost()`→`K().acquireDynamicVizHost()` and `runtimeVisualizer._dequeData`→`_dequeData`).
  - `onModeSwitch(mode)`: `stackData = []; qArr = new Array(5).fill(null); qFront = 0; qRear = -1; qCount = 0; if (mode === 'list-array' || mode === 'list-linked') mainListData = [];` (the linear portion of switchMode; do NOT reset bstRoot here).
  - `init()`: self-look-up `dom = { arrayContainer, linkedListContainer, queueContainer, listArrContainer, listLLContainer, btnStdAdd, btnStdRemove, btnListAdd, btnListRemove, stdVal, listIdx, listValInput }`; seed `if (dom.stdVal) dom.stdVal.value = String(randStdValue());` (moved startup seed from app.js:1327); wire the 4 handler bodies VERBATIM (currentMode→C().getMode(), showStatus→K().showStatus, DOM refs→dom.*). renderStack/renderQueue/renderLists reference container refs — either via `dom.*` captured in init OR keep them as module vars set in init; ensure renderers use the captured refs.
  - Register 6 ids per the map; `C().registerDomain({ id: 'linear', init, onModeSwitch })`.

- [ ] **Step 2: Remove from app.js:** the 4 renderers; `MAX_SIZE`; `randStdValue` + its startup seed line 1327; the 4 handlers; `stackData`/`qArr`/`qFront`/`qRear`/`qCount` (remove from switchMode line ~1760 — KEEP `bstRoot = null;`) and their decls on line 1431 (that whole line is linear: `let stackData...qCount` — remove entirely); `mainListData` from decl line 1432 (KEEP `bstRoot`) and from switchMode line ~1761 (remove); the 6 `reg(...)` lines; the renderAll arms for stack/queue/deque/list. KEEP: container consts (arrayContainer/linkedListContainer/queueContainer/listArrContainer/listLLContainer) + stdActions/listActions + `updateLayout` branches; `runtimeVisualizer` const (used elsewhere). 
  After: `grep -nE "renderStack|renderQueue|renderLists|renderDeque|randStdValue|\bstackData\b|\bqArr\b|mainListData|MAX_SIZE" js/app.js` → remaining hits must be ONLY updateLayout/container shell (verify each; note MAX_SIZE should be 0, randStdValue 0).

- [ ] **Step 3:** index.html: add `<script src="js/domains/linear.js" defer></script>` after `js/domains/sort.js`, before `js/app.js`.

- [ ] **Step 4: Verify:** `node -c` both; grep-clean; FULL `npx playwright test` + `node --test tests/unit/*.test.js`; headless drive: stack-array push/pop (overflow at 5), queue enqueue/dequeue (wraparound), list-array insert/remove at index, deque (its inline buttons), and mode-switch resets. Report.

- [ ] **Step 5:** Commit: `git add -A && git commit -m "refactor: extract linear domain to js/domains/linear.js"`

### Task 2: Verify + record
- [ ] `npm run test:all`; report counts + `wc -l js/app.js`; update `js/domains/README.md` (remove linear from remaining). Commit.

## Self-Review
- Clean domain: no setAnimControls/getDelay coupling (verified — setAnimControls keys only on graph/heap/search/sort/oop). deque `_dequeData` DOM-stash → module-local (Phase A precedent). `randStdValue` startup seed relocated into `init()`. Shared decl/switchMode lines split to preserve `bstRoot` (tree, unextracted). 6 ids each attach once.
