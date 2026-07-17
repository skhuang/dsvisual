# dsvisual — Sequential (array) representation viz (chap05 §5.3) — design

- Date: 2026-07-17
- Repo: `/Users/skhuang/course/dsvisual` (branch `feat/tree-array-rep`)
- Umbrella: [chap05 tree-viz gaps roadmap](2026-07-17-chap05-tree-viz-gaps-roadmap.md) — **sub-project #3 of 6**.
- Motivation: ds2026 `chap05_trees_core` §5.3 ("Sequential (Array) Representation",
  Lemma 5.3 index arithmetic) teaches storing a binary tree in a 1-indexed array
  where node `i` has left child `2i`, right child `2i+1`, parent `⌊i/2⌋` — and the
  wasted slots a skewed tree incurs. dsvisual has no viz for it.

## Post-refactor architecture (verified on `main` @ fedebca)

New viz following the Stage-4 layout (`VizRegistry`/`VizKit` seam; precedents
`js/viz/viz_expr_tree.js` #1 and `js/viz/viz_tree_reconstruct.js` #2):

- **Pure logic:** `js/tree_array_rep_viz.js` — dual-export IIFE
  `TreeArrayRepViz`; no DOM; unit-testable.
- **Render:** `js/viz/viz_tree_array_rep.js` — dual-export IIFE defining
  `renderTreeArrayRep()` via `K() = global.VizKit`, ending in
  `global.VizRegistry.attach('tree-array-rep', { render, code: () => (typeof codeTreeArrayRep !== 'undefined' ? codeTreeArrayRep : ''), layout: { host: 'dynamic' } })`.
- **Registry row** in app.js `METHOD_GROUPS` trees group:
  `{ id: 'tree-array-rep', title: 'Array Representation', file: 'tree_array_rep.cpp', visualizer: 'arrayrep', controls: 'arrayrep' }`.
- **Load:** TWO `<script defer>` tags in `index.html` — the pure module then the
  render module — after `js/code_db.js`, before `js/app.js` (a new top-level pure
  module needs its own tag; established sibling-pair pattern).
- **Code drawer:** `cpp/tree_array_rep.cpp` + a `'tree_array_rep.cpp':
  'codeTreeArrayRep'` mapping in `build_db.js`; regenerate `js/code_db.js` via
  `node build_db.js`.
- **Description:** `js/desc_db.js` entry `'tree-array-rep'` (English-only, per
  file convention).

## Decisions (brainstorming, approved)

- **Input model = positional 1-indexed array** (approved: "層序陣列+空位"):
  space-separated tokens, `-` (or `.`) = empty. Token position `k` (1-indexed) IS
  array index `k`. Node `i` ⇒ left `2i`, right `2i+1`, parent `⌊i/2⌋`.
  Example `A B C - D` ⇒ `array[1]=A,[2]=B,[3]=C,[4]=∅,[5]=D`; tree `A(B(-,D), C)`.
- **Array size = the largest index holding a node** — a skewed tree naturally
  reveals its wasted slots (right-skewed `A - C - - - G` → nodes at 1,3,7 → size 7,
  4 wasted) without padding to a full `2^(h+1)−1`. The `2^(h+1)−1` worst-case bound
  is stated in the stats/description text.
- **Validation:** if any token present, index 1 (root) must be present; every
  present node at index `i>1` requires its parent `⌊i/2⌋` present (no orphan child)
  → else an error frame with a clear message.
- **Click-to-highlight index arithmetic:** clicking a tree node or an array cell
  highlights that index's parent `⌊i/2⌋`, left `2i`, right `2i+1` in BOTH the tree
  and the array.
- **Additive, minimal:** one pure module + one render module + one registry row +
  two index.html tags + one cpp + one desc entry. No change to other viz.

## Component 1 — pure logic (`js/tree_array_rep_viz.js`)

```
tokenize(str) -> string[]                       // split on whitespace, keep '-'
EMPTY = '-'                                      // (also accept '.')

parseLevelArray(tokens) -> { slots, size, error }
  // slots: array indexed 1..size; slots[i] = { idx, val } for a present node,
  //        or { idx, val:null } for an allocated-but-empty slot.
  // size = largest index with a non-empty token.
  // error: 'root-missing' | 'orphan-child at index i' | null.
  // Validate: if size>0, slots[1] present; for each present i>1, slots[floor(i/2)]
  //   present (parent must exist).

buildArrayRepFrames(tokens) -> { frames, root, size, nodeCount, wasted, error }
  Frame = {
    placedUpTo: index,                 // array cells revealed so far (1..placedUpTo)
    current: index|null,               // the cell being placed this step
    parent: index|null, left: index|null, right: index|null,  // arithmetic for current
    tree: <clonable partial tree {id,val,idx,left,right}>|null,
    wastedSoFar: number,
    action: 'place'|'skip'|'done'|'error',
    msg: { zh, en },
  }
  - Walk i = 1..size. If slots[i] present: create/attach the node (parent linked via
    ⌊i/2⌋ and odd/even → right/left), snap a 'place' frame with parent/left/right
    indices. If empty: snap a 'skip' frame (wasted++). 
  - Final 'done' frame: full tree + stats {nodeCount, size, wasted}. Or 'error' frame.

arrayIndexOfNode(root, id) -> index               // helper for click highlighting
```

Invariants (unit tests): `parseLevelArray('A B C - D')` → size 5, one empty slot
(idx 4); complete `A B C D E F G` → wasted 0; right-skewed `A - C - - - G` → nodes
at 1,3,7, size 7, wasted 4; orphan child `A - - D` (D at idx4 but parent idx2
empty) → error `orphan-child`; `- A` (root missing) → error `root-missing`; every
frame has bilingual `msg`; final frame `done` with correct `wasted = size −
nodeCount`.

## Component 2 — render (`js/viz/viz_tree_array_rep.js`)

- `_state = { text: 'A B C D E F G' }` (default: a complete tree, zero waste).
- Controls: text input (positional array, `-`=empty) + Apply + 🎲 random + preset
  buttons **Complete / Left-skewed / Right-skewed / Random**; Step/Run/Reset via
  `K().buildStepControls`.
- Stage (two panels):
  1. **Tree** (via a local `computeTreeLayout`; the just-placed node highlighted).
  2. **Array strip** — cells `1..size` with the index number above each; present
     cells show the value, empty cells styled as **wasted** (hatched/grey). During
     stepping only `placedUpTo` cells are revealed; the `current` cell + its
     `parent`/`left`/`right` cells get distinct highlight classes.
- Stats line: `nodes = N · slots = M · wasted = M−N` (+ note: a skewed tree of
  height h needs up to `2^(h+1)−1` slots). Error message (red) on invalid input.
- **Click handler:** clicking a tree node or an array cell computes `i` and
  highlights `⌊i/2⌋`, `2i`, `2i+1` in both panels (a separate, non-stepping
  interaction layered on the final/placed state).
- Bilingual via `K().langOf`.

## Component 3 — supporting deliverables

- `cpp/tree_array_rep.cpp`: a fixed-capacity array tree (`std::vector<std::string>
  a` 1-indexed, `-` = empty) with `left(i)=2i`, `right(i)=2i+1`, `parent(i)=i/2`,
  a `fromLevel` parser, an inorder walk over the array, and a `wastedSlots` count.
  Regenerate code_db.
- `js/desc_db.js` `'tree-array-rep'` entry (English; index arithmetic + skewed
  waste / Lemma 5.3 bound).
- Registry row + two index.html script tags.

## Testing / acceptance

1. **Unit (`node --test tests/unit/tree_array_rep_viz.test.js`):** the invariants
   above (index arithmetic, wasted counts complete=0/skewed>0, orphan & root-missing
   errors, bilingual frames, final `done` stats).
2. **e2e (Playwright, `tests/tree_array_rep.spec.js`):** load `tree-array-rep`;
   click the "Right-skewed" preset, Run, assert the stats line shows the expected
   wasted count (and empty cells carry the wasted class); click a node and assert
   its parent/left/right array cells get the highlight class; Complete preset → 0
   wasted.
3. Bilingual: labels/steps render zh and en; language switch re-renders.
4. Additive: no other viz/method affected; `npm run test:unit` + `npm test` green.

## Scope

- **In:** the `tree-array-rep` viz (positional-array input, fill animation with
  index arithmetic, wasted-slot visualization, click-to-highlight parent/children),
  pure module, render, registry, cpp/code_db, description, tests.
- **Out:** drag-editing array cells; trees taller than ~4 levels (size grows as
  `2^depth`); deck wiring (a later ds2026-repo step per the roadmap).

## Success criteria

A new `tree-array-rep` viz maps a binary tree (given as a positional level-order
array with gaps) to its 1-indexed array, animating each node into its slot while
showing `left=2i / right=2i+1 / parent=⌊i/2⌋`, marking wasted slots, and reporting
`nodes / slots / wasted`; clicking a node highlights its parent and children in both
tree and array. Skewed presets make the wasted-slot cost vivid. Logic is
unit-tested, an e2e covers the skewed/complete cases + the click interaction, and
the UI is bilingual — consistent with the existing tree viz.
