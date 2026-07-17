# app.js Stage 4 Phase B — Plan #7 (final): tree domain

> REQUIRED SUB-SKILL: superpowers:subagent-driven-development.

**Goal:** Extract the tree domain (bst/avl/splay/rb + trie/radix/ternary/btree/bplus — 9 ids, 3 renderers) from `js/app.js` into `js/domains/tree.js`, completing Phase B. Zero behavior change.

## Constraints (proven pattern)
`K=()=>global.VizKit; C=()=>global.VizCore; R=()=>global.VizRegistry`; `currentMode`→`C().getMode()`; `showStatus`→`K().showStatus`; `acquireDynamicVizHost`→`K().acquireDynamicVizHost`; `langOf`→`K().langOf`; `t`→`K().t`; bare `insertBST`/`insertAVL`/`insertSplay`/`splayNode`/`getHeight`/`assignRBColors` (TreeAlgos globals) + `RBTreeViz` (window) + `sleep`/`document.getElementById` stay; DOM→`dom.*` via `init()`. Keep shell in app.js: tree container consts (`treeContainer`/`advTreeContainer`) + `updateLayout` tree branches. NOT coupled to setAnimControls (it doesn't key on tree). Load `js/domains/tree.js` AFTER `js/algos/tree_algos.js` and the RB viz script (`RBTreeViz` dep) and core, before app.js.

## Inventory (verified)
- ids→renderer (code, layout): `tree-bst`/`tree-avl`/`tree-splay`→renderTree (null); `tree-rb`→renderTreeRB ({host:'dynamic'}); `tree-trie`/`tree-radix`/`tree-ternary`/`tree-btree`/`tree-bplus`→renderAdvTrees (null). Code consts codeTreeBST/AVL/Splay/RB/Trie/Radix/TST/BTree/BPlus.
- state: `bstRoot` (1423), `trieRoot` (1426), `radixRoot` (1427), `tstRoot` (1428), `btreeData`/`bplusData` (1429), `_rbState` (2253).
- renderers + helpers: `renderTree` (with nested `drawR` ~1488 + `computeTreeLayout` ~1518, used ONLY by renderTree — move it), `renderAdvTrees` (with nested `drawRadix` ~2139 + any text-tree helpers), `renderTreeRB` (~2254, uses RBTreeViz + `_rbState` + `rbInsert` helper + `acquireDynamicVizHost`).
- handlers: `btnTreeAdd` (1466; dispatch bst/avl/splay/rb numeric insert + btree/bplus push-sort), `btnTreeSearch` (1478; splay search), `btnTextTreeAdd` (1604; trie/radix/ternary word insert), plus tree-rb's input keydown (~2328, Enter→rbInsert) and the document keydown (~2364, gated `currentMode!=='tree-rb' || !_rbState`, arrow/space stepping).
- switchMode tree pieces: `if (_rbState) _rbState.hist.pause();` (1450, top) + `bstRoot = null;` (1452) + `trieRoot = {...}; radixRoot = {...}; tstRoot = null; btreeData = []; bplusData = [];` (1453).

---

### Task 1: Extract tree domain (atomic) — completes Phase B

**Files:** create `js/domains/tree.js`; modify `js/app.js`, `index.html`.

- [ ] **Step 1: Create `js/domains/tree.js`** (IIFE per graph.js). Move VERBATIM (substitutions above):
  - state: `bstRoot`, `trieRoot`, `radixRoot`, `tstRoot`, `btreeData`, `bplusData`, `_rbState`;
  - `renderTree` (+ nested drawR + `computeTreeLayout`), `renderAdvTrees` (+ nested helpers), `renderTreeRB` (+ `rbInsert`), and any tree-only helper they reference (grep to be exhaustive: text-tree render helpers, `drawRadix`, TST helpers);
  - `onModeSwitch(mode)`: `if (_rbState) _rbState.hist.pause(); bstRoot = null; trieRoot = { children: {}, endOfWord: false }; radixRoot = { edges: {} }; tstRoot = null; btreeData = []; bplusData = [];` (the three switchMode tree pieces combined; all currentMode-independent so post-setMode timing is equivalent);
  - `init()`: self-look-up tree DOM (treeContainer/advTreeContainer + tree-action inputs/buttons: `btn-tree-add`, `btn-tree-search`, `tree-val`, `btn-text-tree-add`, `text-tree-val`); wire `btnTreeAdd`/`btnTreeSearch`/`btnTextTreeAdd` handlers VERBATIM; AND wire the document-level keydown listener for tree-rb stepping (`document.addEventListener('keydown', e => { if (C().getMode() !== 'tree-rb' || !_rbState) return; ... })`) — this replaces the app.js one. (The tree-rb input keydown at ~2328 lives inside renderTreeRB, so it moves with it.)
  - Register 9 ids per the map; `C().registerDomain({ id: 'tree', init, onModeSwitch })`.

- [ ] **Step 2: Remove from app.js:** the 3 renderers + all moved helpers (incl. `computeTreeLayout`); state decls `bstRoot`/`trieRoot`/`radixRoot`/`tstRoot`/`btreeData`/`bplusData`/`_rbState`; the 3 handlers + the document keydown listener (~2364); the 9 `reg('tree-*')` lines; the renderAll tree arms (renderTree/renderAdvTrees/renderTreeRB); the three switchMode tree pieces (lines 1450, 1452, 1453). KEEP: `treeContainer`/`advTreeContainer`/tree-action DOM consts still used by `updateLayout` + the `updateLayout` tree/text-tree branches. (btnTreeSearch: updateLayout toggles its visibility for splay — keep that const if referenced there.)
  After: `grep -nE "renderTree\b|renderAdvTrees|renderTreeRB|computeTreeLayout|\bbstRoot\b|trieRoot|radixRoot|tstRoot|btreeData|bplusData|_rbState|rbInsert" js/app.js` → remaining hits must be ONLY updateLayout/container shell (verify each is not tree logic; bstRoot/trie/etc. should be 0).

- [ ] **Step 3:** index.html: add `<script src="js/domains/tree.js" defer></script>` AFTER `js/algos/tree_algos.js` and the RB-viz script (grep index.html for the file defining `RBTreeViz`) and after core/domains.js, before `js/app.js`.

- [ ] **Step 4: Verify:** `node -c` both; grep-clean; FULL `npx playwright test` (tree specs) + `node --test tests/unit/*.test.js`. Headless drive: BST insert/search, AVL insert (rotation), splay insert+search, RB insert several + arrow-key stepping + space play/pause, trie/radix/ternary word insert, btree/bplus numeric insert, and mode-switch resets each. Report exactly what you drove.

- [ ] **Step 5:** Commit: `git add -A && git commit -m "refactor: extract tree domain to js/domains/tree.js"`

### Task 2: Verify + record — Phase B COMPLETE
- [ ] `npm run test:all`; report counts + `wc -l js/app.js`. Update `js/domains/README.md`: tree → migrated; "Remaining domains" now empty → note **Phase B complete** (all stateful domains extracted). Optionally note app.js is now shell + orchestration only. Commit.

## Self-Review
- Final domain; not setAnimControls-coupled. `computeTreeLayout` is app.js-only (renderTree) → move (other viz modules already have their own copies). tree-rb: `_rbState` + RBTreeViz + the document keydown listener move to the domain (keydown uses C().getMode()). Three switchMode tree pieces → onModeSwitch (all currentMode-independent). 9 ids each attach once (tree-rb dynamic-host, rest null). Load tree.js after tree_algos.js + RB-viz. Headless RB arrow/space stepping verification REQUIRED (keydown relocation).
