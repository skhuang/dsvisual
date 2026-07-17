# dsvisual — Boolean mode for the Expression Tree viz (chap05 §5.5) — design

- Date: 2026-07-17
- Repo: `/Users/skhuang/course/dsvisual` (branch `feat/tree-expression-boolean`)
- Umbrella: [chap05 tree-viz gaps roadmap](2026-07-17-chap05-tree-viz-gaps-roadmap.md) — this is **sub-project #1 of 6**.
- Motivation: ds2026 `chap05_trees_core` §5.5 teaches propositional expression
  trees and satisfiability (`POSTORDER_EVAL`), but dsvisual's `tree-expression`
  viz evaluates **arithmetic** only. Add a **boolean mode** that builds a
  propositional expression tree, evaluates it under an assignment, and sweeps a
  truth table to decide satisfiability.

## Post-refactor architecture (verified against current `main` @ 62b835e)

The Stage-4 refactor extracted per-visualizer renderers out of `app.js` into
`js/viz/viz_*.js` modules coordinated by a `VizRegistry` / `VizKit` seam:

- **Pure logic:** `js/tree_expression_viz.js` — the dual-export IIFE
  `ExprTreeViz` (`tokenizePostfix`, `buildExprTreeFrames`, `evalExprTree`). No DOM;
  unit-testable via `require()`.
- **Render:** `js/viz/viz_expr_tree.js` — `renderTreeExpression()` (module-level
  `_exprTreeState`), which calls `ExprTreeViz` for frames and uses `K() =
  global.VizKit` primitives (`acquireDynamicVizHost`, `buildStepControls`,
  `getInputDifficulty`, `langOf`, …). Ends with
  `VizRegistry.attach('tree-expression', { render, code, layout })`.
- **C++ code drawer:** the `codeTreeExpression` string in `js/code_db.js`
  (sourced from `cpp/tree_expression.cpp`).
- **Description panel:** `js/desc_db.js`.
- Loaded as a `<script defer>` in `index.html` (`js/viz/viz_expr_tree.js`).

Boolean mode is a **mode toggle inside the existing `tree-expression` id** — no
new registry id, no new viz module. Arithmetic mode stays the default and is
unchanged.

## Decisions (brainstorming, approved)

- **Scope of the SAT feature:** build the tree + **truth-table sweep** —
  postorder-evaluate under a single assignment AND enumerate all `2^k`
  assignments to decide satisfiability (approved: "建樹 + 真值表掃描").
- **Operators & notation** (space-separated postfix tokens): `&`=∧, `|`=∨,
  `!`=¬ (unary), `^`=⊕ (XOR), `>`=→ (implies); operands are single-letter
  variables (`a`,`b`,…) and constants `0`/`1` (approved: "加 XOR 與 →").
  Displayed with glyphs (∧ ∨ ¬ ⊕ →).
- **Verdict labels:** over all `2^k` assignments — `tautology` (all true),
  `contradiction` (all false), `contingent` (mixed); `satisfiable = verdict ≠
  contradiction`.
- **Variable cap:** `k ≤ 5` (≤ 32 rows). If the expression has > 5 distinct
  variables, skip the sweep, show a message, and still allow single-assignment
  evaluation.
- **Minimal, additive:** touch only the expression-tree pure module + its render
  module + code/desc + tests. Do not change arithmetic-mode behavior or any other
  viz.

## Component 1 — pure logic (`js/tree_expression_viz.js`, extend `ExprTreeViz`)

Add three functions (kept pure, unit-testable; dual-export unchanged):

```
ARITY: { '!':1, '&':2, '|':2, '^':2, '>':2 }   // operators; else operand

buildBoolExprTreeFrames(tokens) -> { frames, root, vars }
  - Same forest-snapshot animation as buildExprTreeFrames, but arity-aware:
    '!' pops 1 child (right=null), binary ops pop 2. Operand tokens are leaves.
  - `vars` = sorted distinct variable names (tokens that are neither an
    operator nor a constant 0/1).
  - Bilingual msg:{zh,en} per token (operator/operand/unary-not phrasing).
  - Malformed input (stack underflow / leftover >1) -> a frame with an error
    msg and root=null (mirrors arithmetic builder returning root=null).

evalBoolExprTree(root, asg) -> 0 | 1
  - Postorder eval. Leaf: constant 0/1 -> its value; variable -> asg[name] (0/1).
  - '!a' = a?0:1 ; '&' = a&&b ; '|' = a||b ; '^' = a!==b ; '>' = (!a)||b.

buildTruthTableFrames(root, vars) -> { frames, rows, verdict, satisfiable }
  - Enumerate assignments 0..2^k-1 (k=vars.length, k<=5 enforced by caller);
    for each, one frame: { asg:{var->0/1}, value:0/1, rowsSoFar:[...] }.
  - rows = [{ asg, value }] for all assignments (MSB = vars[0]).
  - verdict: 'tautology' if all value=1; 'contradiction' if all value=0; else
    'contingent'. satisfiable = verdict !== 'contradiction'.
  - Bilingual msg per row.
```

Invariants (unit tests): `!` yields a single-child node; `vars` excludes
`0`/`1`; `evalBoolExprTree` truth values match a reference truth table for each
operator (incl. `→`, `⊕`); `buildTruthTableFrames` produces exactly `2^k` rows;
verdict classification correct on a tautology (`a a ! |`), a contradiction
(`a a ! &`), and a contingent expr (`a b &`).

## Component 2 — render (`js/viz/viz_expr_tree.js`, extend `renderTreeExpression`)

- Add `_exprTreeState.mode ∈ {'arith','bool'}` (default `'arith'`).
- **Mode toggle** control (two pills / a select) at the top of the controls row.
  Switching mode resets state to that mode's default text and re-renders.
- **Arithmetic mode:** unchanged (existing UI, `+ - * /`).
- **Boolean mode UI (all via `K()` / VizKit):**
  1. Postfix input + Apply + 🎲 random + "Examples…" (`buildExamplesSelect`,
     boolean presets) + hint showing the operator legend (∧ ∨ ¬ ⊕ →).
  2. The build animation reuses the subtree-stack + tree stage (operator glyphs
     rendered from the raw token via a small display map).
  3. **Assignment row:** one 0/1 toggle per variable in `vars`; changing it
     re-evaluates and lights each node with its current truth value (green=1,
     grey=0) via `evalBoolExprTree` on each subtree.
  4. **Truth-table panel:** a table with a column per variable + a result
     column, filled **row-by-row** as the sweep steps (Step/Run advance through
     `buildTruthTableFrames`); current row highlighted.
  5. **Verdict line:** "satisfiable? yes/no — tautology | contradiction |
     contingent" (bilingual).
  6. If `k > 5`: show a message ("too many variables for the full table; showing
     single-assignment evaluation only") and hide the truth-table panel.
- Two phases share one Step/Run/Reset: first the build frames, then (in boolean
  mode) the truth-table frames — OR a mode sub-tab (build | truth table). Chosen:
  **build frames first, then truth-table frames appended** into one frame list,
  so Step walks build → sweep continuously (simplest; matches existing single
  `frames[]` + `buildStepControls` pattern).

## Component 3 — supporting deliverables

- **`cpp/tree_expression.cpp` + `codeTreeExpression` (`js/code_db.js`):** extend
  the shown C++ to include a boolean expression-tree section — a `BoolNode`
  (VAR/AND/OR/NOT/XOR/IMPLIES), `evalBool(node, asg)`, and a truth-table sweep
  with a `satisfiable/tautology/contradiction` verdict — beside the existing
  arithmetic build+eval. (The arithmetic C++ stays.)
- **`js/desc_db.js`:** extend the `tree-expression` bilingual description with a
  boolean-mode / satisfiability paragraph.
- **Examples/presets:** boolean presets via the Examples convention —
  `a b & c ! |` (contingent), `a a ! |` (tautology), `a a ! &` (contradiction),
  `a b >` (implies), `a b ^` (xor).
- **Random input:** `js/random_input.js` `randomInputFor('tree-expression', …)`
  returns a valid boolean postfix when the viz is in boolean mode (small k). If
  wiring the mode through is awkward, a boolean-specific random generator local
  to the render module is acceptable — documented.
- **i18n / bilingual:** all new step text and labels carry zh/en; re-render on
  language switch (existing `langOf` pattern).

## Testing / acceptance

1. **Unit (`node --test`, extend `tests/tree_expression.spec.js` or a sibling):**
   `buildBoolExprTreeFrames` arity + `vars`; `evalBoolExprTree` truth values for
   `& | ! ^ >`; `buildTruthTableFrames` row count `= 2^k` and verdict on
   tautology / contradiction / contingent fixtures.
2. **e2e (Playwright, `tests/tree_expression.spec.js`):** load `tree-expression`,
   switch to Boolean mode, Apply a preset, Run to completion, assert the verdict
   text (e.g. tautology preset → "tautology / satisfiable"), and assert the
   truth-table has `2^k` rows.
3. **No regression:** arithmetic mode still builds + evaluates unchanged
   (existing tests stay green).
4. Bilingual: labels/steps render in both zh and en; language switch re-renders.

## Scope

- **In:** boolean mode for `tree-expression` (build + single-assignment eval +
  truth-table SAT sweep), across the pure module, render module, code drawer,
  description, examples, random input, and tests.
- **Out:** DPLL / clause-learning search; CNF conversion; >5-variable full
  tables; changing arithmetic mode; any other viz; deck wiring (a later,
  separate ds2026-repo step per the roadmap).

## Success criteria

`tree-expression` gains a Boolean mode: a propositional postfix expression
(`& | ! ^ >`, variables, `0/1`) builds a tree with the same stepped animation;
a per-variable assignment lights the tree's truth values; a truth-table sweep
fills row-by-row and reports satisfiable / tautology / contradiction /
contingent. Arithmetic mode is unchanged, logic is unit-tested, an e2e covers
the boolean flow, and everything is bilingual.
