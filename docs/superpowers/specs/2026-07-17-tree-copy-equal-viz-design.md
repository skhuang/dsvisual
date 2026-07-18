# dsvisual — Tree COPY & EQUAL viz (chap05 §5.5) — design

- Date: 2026-07-17
- Repo: `/Users/skhuang/course/dsvisual` (branch `feat/tree-copy-equal`)
- Umbrella: [chap05 tree-viz gaps roadmap](2026-07-17-chap05-tree-viz-gaps-roadmap.md) — **sub-project #6 of 6 (final)**.
- Motivation: ds2026 `chap05_trees_core` §5.5 teaches the paired tree operations
  `COPY` (deep copy) and `EQUAL` (structural + content comparison). dsvisual has
  no viz for them.

## Post-refactor architecture (verified on `main` @ 4dbcb5a)

New viz following the Stage-4 layout (precedents `js/viz/viz_tree_array_rep.js`
#3, `js/viz/viz_decision_tree_coins.js` #5):

- **Pure logic:** `js/tree_copy_equal_viz.js` — dual-export IIFE
  `TreeCopyEqualViz`; no DOM.
- **Render:** `js/viz/viz_tree_copy_equal.js` — dual-export IIFE
  `renderTreeCopyEqual()` via `K() = global.VizKit`, ending in
  `global.VizRegistry.attach('tree-copy-equal', { render, code: () => (typeof codeTreeCopyEqual !== 'undefined' ? codeTreeCopyEqual : ''), layout: { host: 'dynamic' } })`.
- **Registry row** in app.js `METHOD_GROUPS` trees group:
  `{ id: 'tree-copy-equal', title: 'Tree COPY & EQUAL', file: 'tree_copy_equal.cpp', visualizer: 'copyequal', controls: 'copyequal' }`.
- **Load:** TWO `<script defer>` tags in `index.html` (pure then render), after
  `js/code_db.js`, before `js/app.js`.
- **Code drawer:** `cpp/tree_copy_equal.cpp` + `'tree_copy_equal.cpp':
  'codeTreeCopyEqual'` mapping in `build_db.js`; regenerate `js/code_db.js`.
- **Description:** `js/desc_db.js` entry `'tree-copy-equal'` (English-only; styled
  `class="complexities"`).

## Decisions (brainstorming, approved)

- **Two modes** (approved: "雙模式 COPY + EQUAL"): a **COPY** mode and an **EQUAL**
  mode via a toggle.
- **Input = positional 1-indexed level-order array** (same convention as
  `tree-array-rep`): space-separated tokens, `-` (also `.`/`_`) = empty; token
  position `k` = array index `k`; node `i` → left `2i`, right `2i+1`. COPY takes
  one tree; EQUAL takes two (A, B). Self-contained parse (root-missing / orphan
  validation), no cross-module dependency.
- **COPY:** the deck's `copyTree` — create the node, then copy left/right (a
  **top-down** build). Animate: highlight the source node being copied while the
  copy grows top-down in a second panel; on completion run `equal(original, copy)`
  and show it is **equal ✓** (the §5.5 tie-in).
- **EQUAL:** recursive `equal(s,t)` — both null → ok; one null → **structural
  mismatch**; `s.val ≠ t.val` → **value mismatch**; else recurse. Walk A and B in
  lockstep, highlight the compared pair, **stop at the first mismatch** (marked,
  with its reason), or reach **equal ✓**.
- **Additive, minimal:** one pure module + one render + one registry row + two
  index.html tags + one cpp + one desc entry.

## Component 1 — pure logic (`js/tree_copy_equal_viz.js`)

```
tokenize(str) -> string[]                       // whitespace split, keep '-'
parseTree(tokens) -> { root, error }
  // positional 1-indexed; node = {id,val,idx,left,right}; even idx -> parent.left,
  // odd -> parent.right. error ∈ {null,'root-missing','orphan-child at index N'}.

deepCopy(node) -> node                          // structural deep copy (new ids)
equal(s, t) -> { equal:boolean, reason:null|'structural'|'value' }
  // both null -> equal; one null -> {false,'structural'}; s.val!=t.val ->
  // {false,'value'}; else AND of left/right (first failing reason wins).

buildCopyFrames(tokens) -> { frames, root, copyRoot, error }
  Frame = {
    mode:'copy', srcTree, copyTree,             // src (full) + copy (partial) snapshots
    srcId:string|null, copyId:string|null,      // node just copied
    action:'copy'|'done', verdict:boolean|null, // verdict = equal(root,copy) on done
    msg:{zh,en},
  }
  // Create copy node, link to parent, snapshot (top-down growth), recurse L then R.
  // Final 'done' frame carries verdict = equal(root, copyRoot).equal (true).

buildEqualFrames(tokensA, tokensB) -> { frames, equal, reason, error }
  Frame = {
    mode:'equal', treeA, treeB,
    aId:string|null, bId:string|null,           // compared pair (either may be null)
    status:'compare'|'mismatch'|'equal',
    reason:null|'structural'|'value',
    verdict:boolean|null,                        // set on final frame
    msg:{zh,en},
  }
  // Lockstep preorder over (a,b): skip when both null; else push a 'compare' frame;
  // on structural/value mismatch push a 'mismatch' frame and stop; else recurse.
  // Final frame: status 'equal' (verdict true) or a terminal mismatch (verdict false).
```

Invariants (unit tests): `equal(root, deepCopy(root)).equal === true` for a sample
tree; `equal` returns `{false,'value'}` for trees differing only in a value and
`{false,'structural'}` for trees differing in shape; `buildCopyFrames` ends with a
`done` frame whose `verdict === true`; `buildEqualFrames` on two equal trees ends
`status:'equal'` (verdict true), and on a value-differing pair ends with a
`mismatch` frame `reason:'value'` (verdict false); parse errors surface as an
`error` frame; frames bilingual.

## Component 2 — render (`js/viz/viz_tree_copy_equal.js`)

- `_state = { mode:'copy', src:'A B C D E', a:'A B C D E', b:'A B C D E' }`.
- Controls: **mode toggle** (COPY | EQUAL); in COPY one input (`src`) + presets; in
  EQUAL two inputs (`a`,`b`) + presets (an equal pair and a differing pair);
  Step/Run/Reset via `K().buildStepControls`.
- **Two-panel tree stage** (`computeTreeLayout` local copy): COPY → left = source,
  right = growing copy; EQUAL → left = A, right = B. The current node(s) are
  highlighted; in EQUAL a mismatch node is marked red with the reason.
- Verdict line: COPY → "copy complete; equal(original, copy) = yes ✓"; EQUAL →
  "trees are equal ✓" or "differ — <structural|value> mismatch ✗". Bilingual via
  `K().langOf`.

## Component 3 — supporting deliverables

- `cpp/tree_copy_equal.cpp`: `TreeNode`, `copyTree(t)` (create node then copy
  children), `equal(s,t)` (null/null true; one null false; value compare; recurse)
  — the chap05 core-deck C++. Regenerate code_db.
- `js/desc_db.js` `'tree-copy-equal'` entry (English; deep copy + structural/content
  equality; the "a copy equals its original" tie-in).
- Registry row + two index.html script tags.

## Testing / acceptance

1. **Unit (`node --test tests/unit/tree_copy_equal_viz.test.js`):** the invariants
   above (copy round-trips to equal; value vs structural mismatch reasons; copy
   done-verdict true; equal/mismatch verdicts; parse errors; bilingual frames).
2. **e2e (Playwright, `tests/tree_copy_equal.spec.js`):** load `tree-copy-equal`;
   COPY mode → Run → verdict shows "equal" + "yes"; EQUAL mode with the equal
   preset → "equal"; EQUAL with the differing preset → verdict shows "differ" and a
   mismatch node is marked.
3. Bilingual: labels/steps render zh and en; language switch re-renders.
4. Additive: no other viz/method affected; `npm run test:unit` + `npm test` green.

## Scope

- **In:** the `tree-copy-equal` viz (COPY animation + equal-verify, EQUAL lockstep
  comparison with first-mismatch), pure module, render, registry, cpp/code_db,
  description, tests.
- **Out:** editing trees by click; duplicate-key identity subtleties; deck wiring
  (a later ds2026-repo step per the roadmap).

## Success criteria

A new `tree-copy-equal` viz animates a deep COPY of a tree (top-down) then verifies
the copy EQUALs the original, and separately compares two user-entered trees in
lockstep, stopping at the first structural or value mismatch (or confirming
equality). Logic is unit-tested, an e2e covers both modes incl. a mismatch, and the
UI is bilingual — consistent with the existing tree viz. This completes the
six-viz chap05 program.
