# tree-avl → AVL Rotation Observatory (mirror of the RB viz) — design

- Date: 2026-08-01
- Repo: `/Users/skhuang/course/dsvisual`
- Rebuild the **AVL Tree** viz from the generic live-BST renderer into a dedicated **rotation
  observatory** that mirrors the Red-Black tree viz (`tree-rb`): a stepped, rewindable insert/delete
  sandbox with scripted scenarios, a step log, transport controls, keyboard stepping, and a hidden
  C++ drawer — adapted to AVL semantics (balance factors + LL/LR/RR/RL rotations instead of
  red/black colors + CLRS cases).
- One branch (`feat/avl-observatory`) / one PR.

## Current state (to be replaced)

`tree-avl` (row `js/app.js:76`) is `visualizer:'tree', controls:'tree'` — it shares the **generic live
BST container** (`treeContainer`/`treeActions`) with `tree-bst` and `tree-splay`. Insertion goes
through `js/domains/tree.js` `init()`'s `btnTreeAdd` handler (`insertAVL(bstRoot, val)` at ~line 310)
and the static `renderTree()`; no rotation stepping, no balance factors shown, no delete-rebalance
walk, no code drawer. Registered `R().attach('tree-avl', { render: renderTree, code: () => codeTreeAVL,
layout: null })` (`js/domains/tree.js:358`).

## Reference: the RB observatory (the pattern to mirror)

`js/tree_rb_viz.js` exposes `RBTreeViz = { RBTree, Stage, History, KIND_META, PRESETS, RED, BLACK }`:
- **`RBTree`** core: every rotation/recolor/graft calls `onStep(step)` with
  `{ kind, title:{zh,en}, detail:{zh,en}, hl:[ids], beta?:id }`. `serialize()` → nested
  `{id,key,color,data,left,right}`.
- **`Stage`** (container-agnostic): given a stage element, lays out a serialized binary tree by
  in-order index (x) + depth (y), renders each node as an SVG group `nd <color>` with a key + a
  `sub` label, animates focus/β highlights, empty-text placeholder, `onNodeClick(key)`.
- **`History`**: the step machine — `runOp(label, fn, {play})`, `goTo`, `play`/`pause`,
  `prevOp`/`nextOp`, builds transport (`.tbtn`×5, `.cnt` "i / n", range slider) into `transportEl`,
  and the step log (`.op-h` op headers, `.dot <KIND_META.cls>` per step) into `logEl`; drives the
  step description into `descEl`. `attach(cfg)` re-binds after a re-render; state persists.
- **`KIND_META`**: `insert`/`recolor`/`rotate-left`/`rotate-right`/`delete`/`note`/`init` → `{cls,label}`.
- **`PRESETS`**: `{ id, name:{zh,en}, tip:{zh,en}, seed():number[], final?:{op,v} }` — seed inserts
  silently (`play:false`); `final` parks one step before the payoff op so ▶ plays exactly it.
- Renderer `renderTreeRB()` (`js/domains/tree.js:172`): `.rbviz` toolbar (key input +
  Insert/Delete/Clear), presets row, workbench (`.rbviz-stepdesc` + `.rbviz-stage` +
  `.rbviz-transport` + `.rbviz-legend`) + `.rbviz-logcol` step-log aside; `_rbState={tree,hist}`
  persists; keyboard ←/→/Space gated to `tree-rb` (in `init()`); `codeDrawer:true`; caps at 63 nodes.
  e2e `tests/tree_rb.spec.js` (data-testids `rbviz-input/insert/delete/clear/stage/transport/log/desc`).

## The redesign

### Pure module `js/tree_avl_viz.js` (new) — `AVLViz = { AVLTree, Stage, History, KIND_META, PRESETS }`

Parallel to `RBTreeViz` (duplicate `Stage`/`History` per the repo's duplicate-don't-refactor
convention; RB module untouched).

- **`AVLTree`** core: nodes `{ id, key, height, left, right, parent }` (plain BST links, no NIL
  sentinel). Balance factor `bf(n) = h(n.left) − h(n.right)` (empty height = 0, leaf height = 1).
  `onStep(step)` (same contract as `RBTree`) emits ONE step per teachable event:
  - **descent/attach**: walk BST to the insertion point; attach the new leaf (kind `insert`).
  - **update**: while unwinding, recompute `height`+`bf` at each ancestor (kind `update`, `hl:[node]`,
    detail states the node's new bf).
  - **imbalance**: when an ancestor reaches |bf|=2, emit a `note` naming the case **LL / LR / RR /
    RL** (`hl:[pivot]`, and the offending child), then:
  - **rotation**: each single rotation emits `rotate-right` or `rotate-left` with `hl:[pivot]` and
    `beta:` the subtree that switches sides (LR/RL emit two rotation steps).
  - **delete**: BST delete — leaf / one-child / two-child via in-order successor (kind `delete`,
    successor-swap noted) — then rebalance up the path (may emit multiple rotations).
  - `serialize()` → nested `{ id, key, bf, height, left, right }` (Stage reads `bf` as the sub-label).
  - Helpers: `insert(key)`, `delete(key)`, `find(key)`, `size()`, `min(n)`. Maintains the AVL
    invariant |bf|≤1 after every op (unit-tested).
- **`Stage`** — copy of RB's `Stage`, with these swaps:
  - the per-node group class becomes `nd` + state classes from the step (`focus` = this step's pivot,
    `beta` = the moved subtree, `imbalanced` = |bf|=2) instead of `nd R`/`nd B`;
  - the `sub` label = the node's **balance factor** (from `serialize().bf`); no `data`/name path.
  - keep layout (in-order x, depth y), empty-text, `onNodeClick(key)`, focus/β animation, marker.
- **`History`** — copy of RB's `History` verbatim (it is RB-agnostic: it drives steps, transport,
  log, description). Same `.tbtn`/`.cnt`/`.op-h`/`.dot` DOM so the shared transport/log CSS applies.
- **`KIND_META`**: `insert` (k-insert) · `update` (k-recolor — reuse the amber "update" dot) ·
  `rotate-left`/`rotate-right` (k-rotate) · `delete` (k-delete) · `note`/`init` (k-note). Bilingual
  labels (Traditional zh).
- **`PRESETS`** (7): each `{id,name,tip,seed,final?}` (seed silent, `final` parks before the payoff):
  - `ll` — **LL 單旋（右旋）**: `seed [3,2]`, `final insert 1` → single right rotation.
  - `rr` — **RR 單旋（左旋）**: `seed [1,2]`, `final insert 3` → single left rotation.
  - `lr` — **LR 雙旋**: `seed [3,1]`, `final insert 2` → left-then-right double rotation.
  - `rl` — **RL 雙旋**: `seed [1,3]`, `final insert 2` → right-then-left double rotation.
  - `grow-1-15` — **成長：依序插入 1–15**: `seed range(1,15)` (no final) → many rebalances; parks at step 0.
  - `delete-rot` — **刪除觸發旋轉**: `seed` a built AVL, `final delete v` chosen so the deletion triggers
    ≥1 rotation. Starting candidate `seed range(1,12)`, `final delete 1`; the impl MUST verify (unit
    test asserts this preset yields ≥1 `rotate-*` step) and adjust the deleted key if needed.
  - `random-15` — **隨機 15 顆**: 15 distinct random keys (no final).
- Dual-export: `global.AVLViz = api` + `module.exports = api`.

### Renderer `renderTreeAVL()` in `js/domains/tree.js` (mirror `renderTreeRB`)

- Markup `.avlviz` with the SAME inner structure/data-testids as `.rbviz` but `avlviz-` prefixed:
  toolbar (`avlviz-input` + `avlviz-insert`/`avlviz-delete`/`avlviz-clear`), `avlviz-presets` row,
  workbench (`avlviz-stepdesc` + `avlviz-stage` + `avlviz-transport` + `avlviz-legend`) +
  `avlviz-logcol` step-log aside. Legend items: **平衡因子 bf**（節點下方數字）· **本步驟主角**（旋轉樞紐）·
  **β 子樹（旋轉時換邊的那包）**. Hint: click a node to load its key; ←/→ step; Space play/pause.
- `_avlState = { tree, hist }` persists across re-renders (module-scoped, like `_rbState`); `attach`
  re-binds transport/log/desc after a re-render. `avlInsert(v,opt)`/`avlDelete(v,opt)`/`avlReset()`
  mirror the RB ones (duplicate-key + max-63 + not-found guards via `showStatus`).
- Presets wired exactly like RB (reset → silent seed → park before `final` → ▶ plays it).
- Register: change `js/domains/tree.js:358` to
  `R().attach('tree-avl', { render: renderTreeAVL, code: () => codeTreeAVL, layout: { host: 'dynamic' } })`.
- Keyboard: add an AVL branch to the existing `keydown` handler in `init()` (or a parallel one) gated
  to `mode === 'tree-avl'` && `_avlState`: ←/→ step, Space play/pause (same as RB).

### `js/app.js` changes

- Row `js/app.js:76` → `{ id:'tree-avl', title:'AVL Tree', file:'tree_avl.cpp', visualizer:'avltree',
  controls:'avltree', codeDrawer:true }`.
- In `updateControls`, REMOVE `'tree-avl'` from the shared `['tree-bst','tree-avl','tree-splay']`
  branch (`js/app.js:1726`) and ADD a dedicated `tree-avl` branch (like the `tree-rb` one at
  `js/app.js:1732`): set `codeTitle='tree_avl.cpp'`, `codeDisplay=codeTreeAVL`, and DO NOT unhide the
  legacy `treeContainer`/`treeActions` (the viz renders into the dynamic host). Leave `tree-bst`,
  `tree-splay` on the shared container unchanged.
- The `btnTreeAdd`/`btnTreeSearch` handlers' `tree-avl` branches (`js/domains/tree.js:310`) become
  dead (the legacy tree container is never shown for AVL now) — leave `insertAVL` in place (harmless;
  minimal churn), or remove the two dead `tree-avl` branches. Either is acceptable; do not break
  `tree-bst`/`tree-splay`.

### `style.css` — duplicate the `.rbviz-*` block to `.avlviz-*`

Duplicate the entire RB observatory CSS block (`style.css:2932–3009`, `.rbviz` … `.rbviz .k-insert`
incl. the media query and the `--rb-*` custom props) as an `.avlviz-*` parallel, RB rules untouched.
Node-state swaps: drop `.nd.R`/`.nd.B` red/black fills; give `.avlviz .nd` a neutral fill
(`--rb-node-black`-like slate) with `.avlviz .nd.imbalanced` a red ring, `.avlviz .nd.focus` amber,
`.avlviz .nd.beta` violet (reuse the `--rb-amber`/`--rb-violet` values). Keep `.dot.k-rotate`/
`.k-insert`/`.k-delete`/`.k-note`/`.k-recolor` styles under `.avlviz` so the step-log dots color
correctly. The `sub` label styling carries the bf number.

## Tests

- **Unit** (`tests/unit/tree_avl_viz.test.js`, new): using `AVLViz`:
  - each rotation case produces the expected root: LL `insert 3,2,1` → root 2; RR `1,2,3` → root 2;
    LR `3,1,2` → root 2; RL `1,3,2` → root 2.
  - after every insert of a random permutation (several trials) the tree satisfies |bf|≤1 at all
    nodes AND in-order traversal is sorted (BST invariant).
  - delete rebalances: build then delete keys so |bf|≤1 holds after each delete; and the `delete-rot`
    preset yields ≥1 `rotate-left`/`rotate-right` step (drives the preset's `final` choice).
  - `onStep` emits `rotate-left`/`rotate-right` steps for the 4 case sequences; `serialize()` returns
    `{id,key,bf,height,left,right}`; every step `title`/`detail` bilingual.
  - each `PRESETS` entry: `seed()` returns distinct keys, and building it (seed + optional final)
    through an `AVLTree` does not throw.
- **e2e** (`tests/avl_observatory.spec.js`, new — mirror `tests/tree_rb.spec.js`): load `tree-avl`
  (zh + a short en block);
  1. `.avlviz` toolbar (`[data-testid="avlviz-input"]` visible), `.avlviz-preset` count = 7,
     `[data-testid="avlviz-transport"] .tbtn` count = 5, `.avlviz-logcol h4` = 步驟紀錄 (zh) / Step Log (en).
  2. Code drawer collapsed by default; toggling shows `tree_avl.cpp` and the code contains
     `leftRotate` (or `rightRotate`); other tree methods (`tree-bst`) keep the side-by-side code panel.
  3. Insert `3,2,1` → stage `.nd` count 3 after playback; transport `.cnt` reaches its max; the step
     log contains a `.dot.k-rotate` (the LL rotation); ArrowLeft rewinds one step (`.cnt` decrements).
  4. `ll` preset loads parked (▶ shows ▶, not playing); jumping the slider to max leaves 3 nodes with
     a `.dot.k-rotate` logged; `delete-rot` preset → slider to max shows a `.dot.k-rotate`.
  5. Duplicate insert → status "已經在樹裡了"; Clear → 0 nodes + `.avlviz-empty` visible.
  Assert counts / testids / text / classes — never SVG edge visibility.
- Existing suites stay green (esp. `tests/tree_rb.spec.js` must be UNAFFECTED — RB module + CSS
  untouched; and any test that drove the old live-BST AVL via `treeContainer` — update it if it
  asserted AVL in the shared container).
- Full Playwright + `npm run test:unit` before merge.

## Verification

Browser spot-check zh + en: insert/delete step through rotations with the pivot + β subtree
highlighted and balance factors under each node; ←/→/Space + transport + slider navigate; the 7
presets load parked and ▶ plays the payoff rotation; the step log groups steps per op with correct
rotation dots; C++ in the drawer; RB viz visually unchanged.

## Global constraints

- Targeted `git add` by explicit path only; never `-A`/`.`/`-u`; verify `git status` first.
- Never hand-edit generated files (`js/code_db.js`, `slides/**`, `js/slides_rendered.js`).
- A NEW pure module needs its OWN `index.html` `<script defer>` tag — add `js/tree_avl_viz.js` next
  to `js/tree_rb_viz.js` (`index.html:481`), before `js/domains/tree.js` loads.
- Do NOT modify `RBTreeViz` (`js/tree_rb_viz.js`), `renderTreeRB`, or the `.rbviz-*` CSS — AVL is a
  parallel copy. Do NOT break `tree-bst`/`tree-splay` (still on the shared live container).
- Reuse the existing `method.tree-avl` i18n (already 'AVL Tree' / 'AVL 樹'); Traditional zh throughout.
- Cap at 63 nodes (like RB). Non-AVL viz UNCHANGED.
- e2e: counts/testids/text/classes, never SVG edge visibility.

## Out of scope

- Any change to the RB viz, `renderTree` (BST/Splay), or other tree viz.
- The vizfit/`viz-fit-svg` fullscreen-fit mechanism (RB doesn't use it; AVL matches RB — the
  auto-injected `.viz-focus-toggle` still works via the CSS focus layer, same as RB).
- AVL variants (weight-balanced, etc.); animating individual comparisons within a BST descent beyond
  the single attach step; a difficulty-aware 🎲 (RB has none — presets + free input cover it).

## Success criteria

`tree-avl` becomes a dedicated AVL rotation observatory mirroring the RB viz: a stepped, rewindable
insert **and** delete sandbox driven by a new `AVLViz` pure module (`AVLTree` emitting a step per
descent/update/imbalance/rotation, plus `Stage`/`History`/`KIND_META`/`PRESETS`); nodes show balance
factors, rotations highlight the pivot + β subtree; 7 presets (LL/LR/RR/RL/growth/delete/random),
step log, transport, ←/→/Space keyboard, and a hidden C++ drawer. RB viz untouched. New unit + e2e +
full Playwright green; one review-passed PR.
