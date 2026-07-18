# dsvisual — 8-Coins decision-tree viz (chap05 §5.8.2) — design

- Date: 2026-07-17
- Repo: `/Users/skhuang/course/dsvisual` (branch `feat/decision-tree-coins`)
- Umbrella: [chap05 tree-viz gaps roadmap](2026-07-17-chap05-tree-viz-gaps-roadmap.md) — **sub-project #5 of 6**.
- Motivation: ds2026 `chap05_trees_core` §5.8.2 teaches the 8-coins puzzle as a
  ternary **decision tree** (`EIGHTCOINS`/`COMP`): among 8 coins one is counterfeit
  (heavier or lighter); identify which and its direction in **3 weighings** on an
  equal-arm balance. dsvisual has no viz for it.

## Post-refactor architecture (verified on `main` @ 3175abc)

New viz following the Stage-4 layout (precedents `js/viz/viz_tree_catalan.js` #4,
`js/viz/viz_tree_array_rep.js` #3):

- **Pure logic:** `js/decision_tree_coins_viz.js` — dual-export IIFE
  `DecisionTreeCoinsViz`; no DOM.
- **Render:** `js/viz/viz_decision_tree_coins.js` — dual-export IIFE
  `renderDecisionTreeCoins()` via `K() = global.VizKit`, ending in
  `global.VizRegistry.attach('decision-tree-coins', { render, code: () => (typeof codeDecisionTreeCoins !== 'undefined' ? codeDecisionTreeCoins : ''), layout: { host: 'dynamic' } })`.
- **Registry row** in app.js `METHOD_GROUPS` trees group:
  `{ id: 'decision-tree-coins', title: '8-Coins Decision Tree', file: 'decision_tree_coins.cpp', visualizer: 'coins', controls: 'coins' }`.
- **Load:** TWO `<script defer>` tags in `index.html` (pure then render), after
  `js/code_db.js`, before `js/app.js`.
- **Code drawer:** `cpp/decision_tree_coins.cpp` + `'decision_tree_coins.cpp':
  'codeDecisionTreeCoins'` mapping in `build_db.js`; regenerate `js/code_db.js`.
- **Description:** `js/desc_db.js` entry `'decision-tree-coins'` (English-only;
  styled `class="complexities"`).

## Decisions (brainstorming, approved)

- **Both views** (approved: "兩者"): a static **decision-tree drawing** AND a
  **scenario walk with a balance**, the walk highlighting the current tree path.
- **Faithful to the deck's `EIGHTCOINS`/`COMP` procedure.** Coins `a…h` = indices
  0…7; base weight (10), the fake is `±1`. `weigh(scenario, L, R) → −1/0/+1`
  compares the total weights of two index sets. The weighings:
  - **W1:** `{a,b,c}` vs `{d,e,f}`.
  - **W1 `=`** (fake ∈ `{g,h}`): **W2:** `{g}` vs `{h}`; **W3 (COMP):** the
    heavier/lighter suspect vs a known-good coin (`{a}`).
  - **W1 `>`/`<`:** **W2:** `{a,d}` vs `{b,e}`; **W3 (COMP):** one coin vs a good
    coin. (Exact COMP targets per the deck's case table, transcribed verbatim.)
- **Decision tree built by running the procedure over all 16 scenarios**
  (8 coins × {heavy, light}) and merging their paths — so the drawing is
  guaranteed consistent with the code; 16 leaves ↔ 16 scenarios ↔ the
  information-theoretic bound `3³ = 27 ≥ 16`.
- **Scenario walk:** pick a hidden fake (coin `a–h` + heavy/light, or 🎲 random);
  step the ≤3 weighings; each shows a **balance** (two pans, coins on each,
  tilting per outcome) and **highlights the current node/edge/path** in the tree;
  ends at the identified leaf; a verdict confirms `identified === planted`.
- **"Verify all 16"** check that `decide(s).verdict === s` for every scenario.
- **Additive, minimal:** one pure module + one render + one registry row + two
  index.html tags + one cpp + one desc entry.

## Component 1 — pure logic (`js/decision_tree_coins_viz.js`)

```
COINS = ['a','b','c','d','e','f','g','h']        // indices 0..7
weigh(scenario, L, R) -> -1|0|1
  // scenario = { fake:int 0..7, heavy:bool }; base=10, fake weight = 10 + (heavy?1:-1).
  // returns sign(sum(L) - sum(R)) over index arrays L,R.

decide(scenario) -> { path:[{ left:int[], right:int[], outcome:-1|0|1 }], verdict:{ coin:int, heavy:bool } }
  // transcribes EIGHTCOINS/COMP: W1 {0,1,2}v{3,4,5};
  //   if 0: W2 {6}v{7}; W3 COMP(heavier-suspect vs {0}) -> verdict
  //   if >0/<0: W2 {0,3}v{1,4}; W3 COMP(...) per the case table -> verdict
  // each weighing's `outcome` = weigh(scenario, left, right).

buildDecisionTree() -> Node
  // Node = { weigh:{left,right} , children:{ '-1':Node,'0':Node,'1':Node } }  (internal)
  //      | { leaf:{ coin, heavy } }                                            (leaf)
  // Built by running decide() over all 16 scenarios and merging their paths keyed
  // by the weighing signature + outcome. 16 leaves.

allScenariosCorrect() -> boolean
  // true iff decide(s).verdict deep-equals s for all 16 scenarios.

buildCoinsFrames(scenario) -> { frames, verdict }
  Frame = {
    step,                         // 1..3
    left:int[], right:int[],      // the weighing's pans
    outcome:-1|0|1,               // tilt: left-down / balance / right-down
    pathKey:string,               // identifies the current tree node (for highlight)
    verdict:{coin,heavy}|null,    // set on the final frame
    action:'weigh'|'done',
    msg:{zh,en},
  }
```

Invariants (unit tests): `allScenariosCorrect() === true`; `buildDecisionTree()`
has exactly 16 leaves; for each scenario, `decide(s).path` has ≤3 weighings and
each `outcome === weigh(s, left, right)`; `decide({fake:2,heavy:true}).verdict`
=== `{coin:2,heavy:true}` (c heavy) and `decide({fake:6,heavy:false}).verdict`
=== `{coin:6,heavy:false}` (g light); frames bilingual; final frame `done` with a
verdict equal to the scenario.

## Component 2 — render (`js/viz/viz_decision_tree_coins.js`)

- `_state = { fake: 2, heavy: true }` (default: c heavy).
- Controls: a **coin selector** (a–h buttons), a **heavy/light** toggle, 🎲 random,
  and a **"verify all 16"** button that shows a ✓/✗ summary; Step/Run/Reset via
  `K().buildStepControls`.
- **Balance panel:** an SVG balance beam that tilts by the current frame's
  `outcome` (left-down / level / right-down); each pan lists the coins in `left`
  / `right` (labels a–h); the fake, once identified, is marked.
- **Decision-tree panel:** the ternary tree from `buildDecisionTree()` drawn
  compactly (internal nodes = `L vs R`, edges labeled `<`/`=`/`>`, leaves =
  `coin heavy/light`); the current frame's `pathKey` path is highlighted as the
  walk proceeds.
- Verdict line: `identified = <coin> <heavy/light> — matches planted ✓`. Bilingual
  via `K().langOf`.

## Component 3 — supporting deliverables

- `cpp/decision_tree_coins.cpp`: the deck's `comp(...)` + `eightCoins(weights[8])`
  returning `{coin, heavy}`, plus a small `weigh`/driver comment. (Transcribes the
  chap05 core-deck C++.) Regenerate code_db.
- `js/desc_db.js` `'decision-tree-coins'` entry (English; ternary decision tree,
  3 weighings, info-theoretic optimality `3³ ≥ 16`).
- Registry row + two index.html script tags.

## Testing / acceptance

1. **Unit (`node --test tests/unit/decision_tree_coins_viz.test.js`):** the
   invariants above (all 16 identified; 16 leaves; per-weighing outcome matches
   `weigh`; the two pinned scenarios; bilingual frames; final verdict).
2. **e2e (Playwright, `tests/decision_tree_coins.spec.js`):** load
   `decision-tree-coins`; select coin `c` + heavy, Run, assert the verdict shows
   `c` + heavy and the balance/tree render; select `g` + light → `g` light;
   click "verify all 16" → shows ✓.
3. Bilingual: labels/steps render zh and en; language switch re-renders.
4. Additive: no other viz/method affected; `npm run test:unit` + `npm test` green.

## Scope

- **In:** the `decision-tree-coins` viz (EIGHTCOINS/COMP procedure, balance-walk
  animation, decision-tree drawing with path highlight, verify-all-16), pure
  module, render, registry, cpp/code_db, description, tests.
- **Out:** generalizing to N coins / k weighings; the "maybe no fake exists" case;
  deriving an optimal tree (the deck's fixed procedure is the subject); deck wiring
  (a later ds2026-repo step per the roadmap).

## Success criteria

A new `decision-tree-coins` viz draws the 8-coins ternary decision tree (built
from the deck's procedure over all 16 scenarios) and lets the user pick a hidden
counterfeit, then walks the ≤3 weighings with a tilting balance while highlighting
the tree path, ending at the correctly identified coin + direction; a
"verify all 16" check confirms the procedure is complete. Logic is unit-tested, an
e2e covers a couple of scenarios + the verify check, and the UI is bilingual —
consistent with the existing tree viz.
