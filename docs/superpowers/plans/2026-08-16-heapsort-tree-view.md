# Heap Sort Tree View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a synchronized binary-heap TREE below the bars in the Heap Sort visualizer (`sort-heap` only).

**Architecture:** In `js/domains/sort.js` `renderSort`, when `methodId === 'sort-heap'`, add an SVG tree stage after the bar stage and extend `paint(f)` to also render the array as a complete binary tree (node `i` → children `2i+1`/`2i+2`) from the same per-frame state, coloring nodes by `f.hi[i]` (`active`/`sorted`/default) and dimming edges to extracted (`sorted`) nodes. All other sorts are unchanged.

**Tech Stack:** Vanilla JS; `js/domains/sort.js` (sort observatory via `VizRegistry`), `style.css`; Playwright.

## Global Constraints

- Branch `feat/heapsort-tree-view` (dsvisual).
- The tree renders ONLY for `sort-heap`. Every other `sort-*` methodId must be visually and behaviorally unchanged (no tree stage, same bars). Guard all new rendering behind `methodId === 'sort-heap'`.
- Both bars and tree are painted by the SAME `paint(f)` (so `buildStepWorkbench` drives them in sync). Do NOT change the frame model, `FRAMES`, `viz_sort_frames.js`, or the bar rendering.
- Frame shape (unchanged): `{ array:[...], hi:{index:'active'|'sorted'|...}, message:{zh,en} }`. Heap frames use `active` (the two nodes in a sift-down/extract swap) and `sorted` (extracted tail).
- Node colors match the existing bar colors: default `#60a5fa`, `active` `#818cf8`, `sorted` `#34d399` (see `style.css:526-532`).
- Complete-binary-tree layout: for node `i`, level `L = Math.floor(Math.log2(i+1))`; in-level index `p = i - (2**L - 1)`; nodes-in-level `2**L`; `depth = Math.floor(Math.log2(n)) + 1`; `x = (p + 0.5) / 2**L`, `y = (L + 0.5) / depth` (times the SVG viewBox W/H). Parent of `i` is `Math.floor((i-1)/2)`.
- Do NOT touch generated files (`js/code_db.js`, `js/*_rendered.js`), other visualizers, or `viz_sort_frames.js`.
- Run `npm run test:all` (unit deterministic gate; re-run a flaky Playwright spec in isolation and note it).
- Commit trailer `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

---

### Task 1: Heap-tree panel synchronized with the Heap Sort bars

**Files:** Modify `js/domains/sort.js`, `style.css`; Test `tests/heapsort_tree.spec.js` (new).

**Interfaces:** Adds an internal `renderHeapTree(svgEl, array, hi)` helper in `sort.js` and a `sort-heap`-only tree stage; no new global surface.

- [ ] **Step 1: Write the failing Playwright test** — `tests/heapsort_tree.spec.js`:
  - Load `sort-heap`; assert `[data-testid="heaptree"]` exists and contains `n` `.heaptree-node` elements where `n` = the input array length (read the input length from `.sortviz-input`, or use a known Build input).
  - Assert the tree reflects the array: after building, the node value texts in index order equal `f.array`; and parent→child edges exist (at least node 0 connects to nodes 1 and 2 when n≥3).
  - Highlight sync: step to a frame where a node is `active` (a sift-down/extract step) and assert a `.heaptree-node.active` exists; step to after an extract and assert the tail node has `.heaptree-node.sorted`. (Mirror how `tests/random_input.spec.js`/existing sort specs drive the step controls — read them for the step-button/scrubber selectors.)
  - Assert OTHER sorts have no tree: load `sort-bubble`, assert `[data-testid="heaptree"]` count is 0.
  - Verify the exact step-control selectors + how to drive frames by reading an existing sort/step spec first.

- [ ] **Step 2: Run it — expect FAIL** (`.sortviz-heaptree` doesn't exist). `npx playwright test tests/heapsort_tree.spec.js --reporter=line`

- [ ] **Step 3: Implement in `js/domains/sort.js`**
  - Add a `renderHeapTree(svg, array, hi)` helper (module scope or inside `renderSort`): compute each node's `x,y` per the layout formula, set the SVG's `viewBox` (e.g. `0 0 100 <depth*heightPerLevel>`), and set `svg.innerHTML` to: edges first (`<line class="heaptree-edge{ dim if hi[i]==='sorted' || hi[parent]==='sorted'}">` for each `i>0`), then nodes (`<circle class="heaptree-node {hi[i] or ''}">` + `<text class="heaptree-label">value</text>`). Escape/format values as integers.
  - In `renderSort.rebuild`, after creating `stage`, if `methodId === 'sort-heap'` create `const treeStage = document.createElementNS('http://www.w3.org/2000/svg','svg'); treeStage.setAttribute('class','sortviz-heaptree'); treeStage.setAttribute('data-testid','heaptree');` and append it to `host` (after `stage`, before the workbench) — OR append both `stage` and `treeStage` inside a wrapper so the workbench's `stage` param still points at the bars. IMPORTANT: `buildStepWorkbench` is given `stage` as the bars container; keep passing the bars `stage`. Add the tree rendering inside `paint`.
  - Extend `paint(f)`: keep the existing bar rendering; then `if (methodId === 'sort-heap') renderHeapTree(treeStage, f.array, f.hi);`.
  - Guard everything behind `methodId === 'sort-heap'` so other sorts are untouched.

- [ ] **Step 4: Add CSS in `style.css`**
  - `.sortviz-heaptree { width: 100%; height: auto; max-height: 40vh; margin-top: 12px; overflow-x: auto; }`
  - `.heaptree-edge { stroke: var(--text-muted, #94a3b8); stroke-width: 1; }` and `.heaptree-edge.dim { opacity: 0.25; }`
  - `.heaptree-node { fill: #60a5fa; }` `.heaptree-node.active { fill: #818cf8; }` `.heaptree-node.sorted { fill: #34d399; opacity: 0.5; }`
  - `.heaptree-label { fill: #fff; font-size: 4px; text-anchor: middle; dominant-baseline: central; }` (scale within the viewBox units; adjust so labels are legible at the chosen viewBox scale).
  - Keep it consistent with the existing sort-viz styling and dark/light theme tokens where the file uses them.

- [ ] **Step 5: Run — expect PASS**, then the full suite. `npx playwright test tests/heapsort_tree.spec.js --reporter=line` then `npm run test:all`.
Expected: the new spec passes; full suite green (all other sort specs unaffected — the tree only renders for `sort-heap`).

- [ ] **Step 6: Commit** `git commit -m "feat(viz): show synchronized heap tree in Heap Sort"`

---

## Final gate

- [ ] `npm run test:all` green.
- [ ] Manual/visual check via the sort-heap viz: bars + tree render together; stepping updates both in sync; `active` nodes highlight during sift-down/extract; extracted tail greys out and its edges dim; other sorts show no tree.
- [ ] Grep: the tree code is guarded by `methodId === 'sort-heap'`; `viz_sort_frames.js` and other visualizers untouched; generated files untouched.
- [ ] Open a PR to `main` and merge on green.
