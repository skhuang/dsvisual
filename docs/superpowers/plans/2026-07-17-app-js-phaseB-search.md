# app.js Stage 4 Phase B — Plan #5: search domain (search-linear/binary)

> REQUIRED SUB-SKILL: superpowers:subagent-driven-development.

**Goal:** Extract the search domain (search-linear, search-binary) from `js/app.js` into `js/domains/search.js` via the proven domain seam. Zero behavior change.

## Constraints (proven pattern)
`K=()=>global.VizKit; C=()=>global.VizCore; R=()=>global.VizRegistry`; `currentMode`→`C().getMode()`; `showStatus`/`executeAnimWrapper`/`getInputDifficulty`→`K().*`; `sleep`/`document.getElementById(...)`/bare `animState`/`window.RandomInput` stay; DOM→`dom.*` via `init()`. Keep shell in app.js (containers + `updateLayout` + `setAnimControls` search branch + `handlePauseClick`/`handleStopClick` + btnSearch* consts). Load `js/domains/search.js` after linear.js, before app.js.

## Inventory
- ids→renderer (code, layout): `search-linear`→`() => renderSearchArray(arrLinear)` (codeSearchLinear, null); `search-binary`→`() => renderSearchArray(arrBinary)` (codeSearchBinary, null).
- renderer: `renderSearchArray(arr)` (2917; uses `getElementById('search-array')`/`('search-pointers')`).
- anim fns: `runLinearSearch(target)` (2801), `runBinarySearch(target)` (2810) — use `renderSearchArray`, `showStatus`, `sleep`, `getElementById`, arrLinear/arrBinary.
- state: `const arrLinear` (1423), `const arrBinary` (1424) — mutated in place by btnSearchRandom (`arr.length=0; push`). Move as module consts (mutated in place — same behavior).
- handlers: `btnSearchGo` (2060; dispatch to runLinear/BinarySearch via executeAnimWrapper), `btnSearchRandom` (2061; guard animState, RandomInput regen, renderSearchArray). `btnSearchPause`/`btnSearchStop` are wired to the SHARED `handlePauseClick`/`handleStopClick` (STAY in app.js).
- NO onModeSwitch needed (search keeps its arrays across switches; initial render happens via registry `render`).

## The `handleStopClick` search-branch fix (like sort's)
`handleStopClick` (app.js:2018, kept) has a `currentMode.includes('search')` branch calling bare `renderSearchArray(...)`, which becomes private to the domain. Change that branch to the registry idiom (same as the sort branch already uses):
`else if (currentMode.includes('search')) { const b = window.VizRegistry && window.VizRegistry.behavior(currentMode); if (b && b.render) b.render(); }`

---

### Task 1: Extract search domain (atomic)

**Files:** create `js/domains/search.js`; modify `js/app.js`, `index.html`.

- [ ] **Step 1:** Create `js/domains/search.js` (IIFE per linear.js/sort.js). Move VERBATIM (substitutions above): module consts `arrLinear`/`arrBinary`; `renderSearchArray`, `runLinearSearch`, `runBinarySearch`. `init()`: self-look-up `{ searchVal, btnSearchGo, btnSearchRandom }`; wire `btnSearchGo` (parse searchVal, dispatch to runLinear/BinarySearch via `K().executeAnimWrapper`) and `btnSearchRandom` (guard bare `animState`, `RandomInput.randomInputFor(C().getMode(), K().getInputDifficulty())`, mutate arr in place, `renderSearchArray(arr)`) VERBATIM with substitutions. Register: `R().attach('search-linear', { render: () => renderSearchArray(arrLinear), code: () => codeSearchLinear, layout: null })` and `search-binary` with arrBinary/codeSearchBinary; `C().registerDomain({ id: 'search', init })` (no onModeSwitch).

- [ ] **Step 2:** Remove from app.js: `arrLinear`/`arrBinary` decls (1423-1424); `renderSearchArray`, `runLinearSearch`, `runBinarySearch`; `btnSearchGo`/`btnSearchRandom` handlers; the 2 `reg('search-*')` lines; the `renderAll` search arm (2577). **Fix** `handleStopClick`'s search branch to the registry idiom (above). KEEP: `searchContainer`/`searchActions`/`btnSearch*` consts + `setAnimControls` search branch + `handlePauseClick`/`handleStopClick` (with the fixed search branch) + `updateLayout` search branch.
  After: `grep -nE "renderSearchArray|runLinearSearch|runBinarySearch|arrLinear|arrBinary" js/app.js` → 0 (all moved; handleStopClick no longer references arrLinear/arrBinary after the registry fix).

- [ ] **Step 3:** index.html: `<script src="js/domains/search.js" defer></script>` after linear.js, before app.js.

- [ ] **Step 4: Verify:** `node -c` both; grep-clean; FULL `npx playwright test` + `node --test tests/unit/*.test.js`; headless drive: search-linear (Find target → animates, found/not-found), search-binary (Find → pointer animation), Random regenerates, Stop mid-search resets. Report.

- [ ] **Step 5:** Commit: `git add -A && git commit -m "refactor: extract search domain to js/domains/search.js"`

### Task 2: Verify + record
- [ ] `npm run test:all`; report counts + `wc -l js/app.js`; update `js/domains/README.md` (search → migrated; remaining: tree, heap). Commit.

## Self-Review
- setAnimControls search branch + handlePause/Stop stay in app.js (graph/sort precedent); the ONE app.js logic edit is the handleStopClick search-branch registry fix (mirrors the already-merged sort fix). arrLinear/arrBinary are search-only mutable-in-place consts → module consts. No onModeSwitch (no per-switch reset today). 2 ids each attach once.
