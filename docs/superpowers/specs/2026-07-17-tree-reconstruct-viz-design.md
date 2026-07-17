# dsvisual — Reconstruct-a-Tree-from-Two-Traversals viz (chap05 §5.9) — design

- Date: 2026-07-17
- Repo: `/Users/skhuang/course/dsvisual` (branch `feat/tree-reconstruct`)
- Umbrella: [chap05 tree-viz gaps roadmap](2026-07-17-chap05-tree-viz-gaps-roadmap.md) — **sub-project #2 of 6**.
- Motivation: ds2026 `chap05_trees_core` §5.9 ("Unique Reconstruction from Two
  Traversals") teaches rebuilding a binary tree from two traversal sequences, but
  dsvisual has no viz for it. Add a new `tree-reconstruct` viz that animates the
  reconstruction and surfaces the uniqueness conditions.

## Post-refactor architecture (verified on `main` @ 43af78e)

New viz following the Stage-4 layout (`VizRegistry`/`VizKit` seam; see
`js/domains/README.md` and the #1 precedent `js/viz/viz_expr_tree.js`):

- **Pure logic:** `js/tree_reconstruct_viz.js` — dual-export IIFE
  `TreeReconstructViz`; no DOM; unit-testable.
- **Render:** `js/viz/viz_tree_reconstruct.js` — dual-export IIFE defining
  `renderTreeReconstruct()` via `K() = global.VizKit`, with a local
  `computeTreeLayout` copy, ending in
  `global.VizRegistry.attach('tree-reconstruct', { render, code: () => codeTreeReconstruct, layout: { host: 'dynamic' } })`.
- **Registry row** in app.js `METHOD_GROUPS` trees group:
  `{ id: 'tree-reconstruct', title: 'Reconstruct Tree', file: 'tree_reconstruct.cpp', visualizer: 'reconstruct', controls: 'reconstruct' }`.
- **Load:** `<script src="js/viz/viz_tree_reconstruct.js" defer>` in `index.html`
  (after `js/code_db.js`, before `js/app.js`).
- **Code drawer:** `cpp/tree_reconstruct.cpp` + a `'tree_reconstruct.cpp':
  'codeTreeReconstruct'` mapping in `build_db.js`; regenerate `js/code_db.js` via
  `node build_db.js`.
- **Description:** `js/desc_db.js` entry `'tree-reconstruct'` (English-only, per
  file convention).

## Decisions (brainstorming, approved)

- **Three modes** (a selector), covering the two unique-for-any-binary-tree pairs
  plus the full-tree-only pair (approved: "再加 前序+後序"):

  | Mode id | Sequence 1 | Sequence 2 | Root each step | Uniqueness |
  |---|---|---|---|---|
  | `pre-in`   | preorder  | inorder | `pre[0]` | **any** binary tree |
  | `post-in`  | postorder | inorder | `post[last]` | **any** binary tree |
  | `pre-post` | preorder  | postorder | `pre[0]` | **full binary trees only** |

- **`pre-post` uniqueness caveat is the teaching point:** preorder+postorder
  determines a binary tree uniquely ONLY when it is *full* (every node has 0 or 2
  children); a single-child node is ambiguous. In `pre-post` mode the default
  example is a full tree, and inconsistent / non-full-implying input yields an
  **"ambiguous — preorder+postorder needs a full binary tree"** message rather
  than a guessed tree.
- **Distinct keys** assumed (single-char/short tokens, space-separated). Duplicate
  keys are out of scope.
- **Additive, minimal:** one pure module + one render module + one registry row +
  one cpp + one desc entry + one index.html line. No change to other viz.

## Component 1 — pure logic (`js/tree_reconstruct_viz.js`)

```
tokenize(str) -> string[]                    // split on whitespace, drop empties

buildReconstructFrames(seq1, seq2, mode) -> { frames, root, error }
  mode ∈ {'pre-in','post-in','pre-post'}
  - Validate: seq1.length === seq2.length, same key multiset, keys distinct.
    On failure -> { frames:[errorFrame], root:null, error:'<reason>' }.
  - Recursively reconstruct, emitting one Frame per node created:
    Frame = {
      root1: index|null,        // highlighted position in sequence 1 (the root token)
      range2: [lo, hi]|null,    // highlighted subrange in sequence 2 for this call
      splitAt: index|null,      // where seq2 splits into L/R (pre-in/post-in), or the
                                //   post-index locating pre[1] (pre-post)
      tree: <clonable partial tree of {id,val,left,right}>,
      created: nodeId,          // node built this step
      msg: { zh, en },
    }
  - Algorithms:
    * pre-in : root=pre[preIdx++]; m=index of root in inorder subrange;
               left = inorder[lo..m-1], right = inorder[m+1..hi]; recurse left then right.
    * post-in: root=post[postIdx--]; m=index of root in inorder subrange;
               recurse RIGHT then LEFT (postorder consumed back-to-front).
    * pre-post: root=pre[preIdx++]; if subrange size==1 -> leaf; else
               leftRootVal=pre[preIdx]; j=index of leftRootVal in postorder subrange;
               leftSize=j-lo+1; recurse left (that many) then right. If a node ends up
               with exactly one child (non-full) -> set error 'ambiguous (needs full
               binary tree)' and stop.
  - Final frame: action 'done' with the full tree + a verdict line showing the
    reconstructed inorder (for confirmation), or the error frame.

reconstructedInorder(root) -> string         // helper for the verdict/tests
```

Invariants (unit tests): for a fixed sample tree, `pre-in`, `post-in`, and
`pre-post` each rebuild it (reconstructed inorder equals the known inorder);
`pre-post` on a non-full example (`pre='A B'`, `post='B A'`) returns
`error` (ambiguous); mismatched-length or mismatched-key inputs return `error`;
every frame carries bilingual `msg`.

**Sample trees (used across tasks):**
- Full tree `A(B(D,E), C)`: pre `A B D E C`, in `D B E A C`, post `D E B C A`;
  reconstructed inorder = `D B E A C`. Used by all three modes.
- Non-full `A(B, -)` (B is A's only child): pre `A B`, post `B A` — `pre-post`
  ambiguous.

## Component 2 — render (`js/viz/viz_tree_reconstruct.js`)

- Module-level `_state = { mode:'pre-in', seq1:'A B D E C', seq2:'D B E A C' }`;
  default `seq1`/`seq2` swap to the mode's canonical pair when the mode changes.
- Controls: **mode selector** (Pre+In / Post+In / Pre+Post); two labeled inputs
  whose labels track the mode (e.g. "Preorder" / "Inorder"); Apply; 🎲 random
  (generates a small random tree and derives the two sequences for the mode);
  Step/Run/Reset via `K().buildStepControls`.
- Stage: the growing tree (via local `computeTreeLayout`; the just-`created` node
  flashes/highlights); two **sequence strips** below, each token in a cell, with
  the current `root1` cell and `range2` subrange highlighted, and a `splitAt`
  marker.
- On `done`: a verdict line — reconstructed inorder (green) — or, on `error`, the
  ambiguity/validation message (red). Bilingual via `K().langOf`.

## Component 3 — supporting deliverables

- `cpp/tree_reconstruct.cpp`: a `TNode`, `buildFromPreIn`, `buildFromPostIn`,
  `buildFromPrePost` (full-tree; returns null/flag on ambiguity), and an `inorder`
  print for confirmation — mirroring the JS algorithms. Regenerate code_db.
- `js/desc_db.js` `'tree-reconstruct'` entry (English, with the uniqueness note).
- Registry row + index.html script tag.

## Testing / acceptance

1. **Unit (`node --test tests/unit/tree_reconstruct_viz.test.js`):** each mode
   rebuilds the full sample (reconstructed inorder `D B E A C`); `pre-post`
   ambiguous case → `error`; length/key-mismatch → `error`; frames carry `msg.zh`
   & `msg.en`; final frame is `done` with the complete tree.
2. **e2e (Playwright, `tests/tree_reconstruct.spec.js`):** load `tree-reconstruct`,
   for each mode Apply the sample + Run to completion and assert the verdict shows
   the reconstructed inorder; switch to `pre-post` with the non-full input and
   assert the ambiguity message.
3. Bilingual: step text/labels render zh and en; language switch re-renders.
4. Additive: no other viz/method affected; `npm run test:unit` + `npm test` green.

## Scope

- **In:** the `tree-reconstruct` viz (3 modes, animation, validation/ambiguity),
  pure module, render module, registry, cpp/code_db, description, tests.
- **Out:** duplicate keys; level-order pairs; trees > ~10 nodes; deck wiring (a
  later ds2026-repo step per the roadmap).

## Success criteria

A new `tree-reconstruct` viz rebuilds a binary tree from two traversals in three
modes (pre+in, post+in, pre+post), animating root-selection and subrange-splitting
step by step and growing the tree; it confirms success via the reconstructed
inorder and surfaces the preorder+postorder full-binary-tree uniqueness limit as
an explicit message. Logic is unit-tested, an e2e covers all modes + the ambiguous
case, and the UI is bilingual — consistent with the existing tree viz.
