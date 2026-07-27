# Trie visualization on VCR stepping — design

- Date: 2026-07-27
- Repo: `/Users/skhuang/course/dsvisual`
- Converts the `tree-trie` method from the shared one-shot `text-tree` renderer to a dedicated
  VizRegistry viz stepped on `buildFrameControls` ([[dsvisual-vcr-frame-controls]] standing directive),
  following the new-viz recipe ([[dsvisual-viz-authoring]]).

## Goal

Make the Trie visualization step **one character at a time** on the standard VCR transport bar, over
two operations: **building a trie from a word list** (per-character insertion) and **searching a
query** (per-character descent with a hit / prefix-only / miss verdict). Radix Tree and Ternary
Search Tree keep their existing `text-tree` (`renderAdvTrees`) renderer, untouched.

## Behaviour

- **Two modes**, chosen by a `<select>` (`建立 Build` / `搜尋 Search`); Apply / mode-change rebuilds
  the frame set. Same dictionary drives both; Search also uses the query input.
- **Build mode** replays insertion of the words in input order. Per character: a **follow** frame
  (the child already exists) or a **create** frame (a new node is revealed); after a word's last
  character, a **mark-end** frame flips that node's `endOfWord`. An `init` frame (root only) first, a
  `done` frame last.
- **Search mode** runs the query against the **fully-built** trie. Per character: a **match** frame
  (descend) or a **mismatch** frame (stop → verdict `not-found`); after the last character, `found`
  (the node is `endOfWord`) vs `prefix-only`. A `start` frame first.
- **Stable layout:** node positions are computed **once from the full final trie** (recursive spread,
  like the current `drawTrie`), so frames only *reveal / highlight* — nodes never jump. Build reveals
  the subset created so far; Search shows the whole trie and highlights the descent path.
- **Input:** A–Z, uppercased. Words comma/space separated; clamp to ≤ 12 words, each length ≤ 8
  (layout sanity). Query = first A–Z token, length ≤ 8. Malformed characters stripped.
- **Default sample:** words `CAT, CAR, CARD, DO, DOG`, query `CAR` (→ found). Built-in example
  demonstrates a miss: `CAR,CARD|CARE` (mismatch at `E`).

## Architecture (files)

- **`js/trie_viz.js`** (new, dual-export IIFE `module.exports` + `global.TrieViz`):
  - `SAMPLE = { words: ['CAT','CAR','CARD','DO','DOG'], query: 'CAR' }`.
  - `parseWords(str) → string[]` — split on `[,\s]+`, uppercase, strip non-`A-Z`, drop empties, clamp
    each to length ≤ 8, clamp to ≤ 12 words. (Duplicates kept — a duplicate insert is all-follows +
    mark-end, which is valid.)
  - `parseQuery(str) → string` — first token, uppercased, non-`A-Z` stripped, length ≤ 8.
  - `buildTrie(words) → { nodes, root: 0 }`. `nodes[i] = { id, parent, char, depth, endOfWord,
    children: { <ch>: childId } }`. Root is id 0, `char: ''`, `parent: -1`. Node ids assigned in
    creation order (words in input order, chars in order) — deterministic.
  - `buildFrames({ words, query, mode }) → { frames }`. Frame shape:
    - Build: `{ op:'build', action:'init'|'follow'|'create'|'mark-end'|'done', word, ci,
      cur:number, edge:{from,to,ch}|null, revealed:number[], ends:number[], msg:{zh,en} }`.
      `revealed`/`ends` are **snapshots** (`.slice()`), growing monotonically; final `revealed` =
      all node ids, final `ends` = every word-terminal node.
    - Search: `{ op:'search', action:'start'|'match'|'mismatch'|'found'|'prefix-only', query, ci,
      cur:number, path:number[] (snapshot), verdict:null|'found'|'prefix-only'|'not-found',
      msg:{zh,en} }`. The full node set is always present (Search paints all nodes).
    - Every frame carries a bilingual `msg`. Frame count bounded by Σ word lengths (+init/marks/done)
      for build, query length (+start) for search.
  - Unit-tested. No DOM.
- **`js/viz/viz_trie.js`** (new, `global.VizRegistry.attach('tree-trie', { render, code, layout })` —
  attach key is the **method id** `tree-trie`, which is how `renderAll()` resolves `behavior`):
  - `K() = global.VizKit`. `_st = { words: SAMPLE.words.slice(), query: SAMPLE.query, mode: 'build' }`.
  - `render()` calls `K().acquireDynamicVizHost()` and builds a `.trie-wrap` with: a controls bar
    (`.trie-words` input, `.trie-query` input, `.trie-mode` `<select>` [建立 Build / 搜尋 Search],
    `套用 Apply` button `.trie-apply`, `buildExamplesSelect('tree-trie', DEFAULT_SERIALIZED)`), a
    `.trie-banner`, a `.trie-scroll` (overflow:auto) wrapping the `.trie-svg` SVG host, and a
    `.trie-msg`.
  - **Layout** computed once per render from `buildTrie(parseWords(_st.words))`: recursive spread
    (root centred at top; children spread `startX = x-(k-1)*dx/2`, `dx` shrinks with depth; `y` by
    depth). `pos[id] = {x,y}`. Used by both modes.
  - **SVG** (per frame): draw edges (line + char label at midpoint) then nodes (circle) among the
    frame's present set — Build: `fr.revealed`; Search: all node ids. Classes: `.trie-node`,
    `.trie-node-end` (endOfWord — Build: id ∈ `fr.ends`; Search: `node.endOfWord`), `.trie-node-cur`
    ring on `fr.cur`, `.trie-edge`, `.trie-edge-cur` (Build: `fr.edge`; Search: last edge of
    `fr.path`), `.trie-edge-label`.
  - **Banner** (bilingual, via `I18N.getCurrentLanguage`): Build → `建立 <word> · '<ch>'` + step
    context, `done` → `完成 · <N> 節點`; Search → `搜尋 <query> → 命中/前綴/找不到` (found /
    prefix-only / not-found).
  - Stepping via `K().buildFrameControls(buildFrames(_st).frames, paint, { runIntervalMs: 650 })`
    (Shape A: `paint(fr,i)` renders everything from `fr` + folds `K().showStatus`; NO local cursor).
  - Examples-helper trio (`loadExamples`/`saveExample`/`buildExamplesSelect`) duplicated per
    convention (NOT refactored). Serialize = `words.join(',') + '|' + query`;
    `DEFAULT_SERIALIZED = 'CAT,CAR,CARD,DO,DOG|CAR'`; built-in `MISS_SERIALIZED = 'CAR,CARD|CARE'`
    injected after Default. `code: () => (global.CODE_DB && CODE_DB['tree-trie']) || ''`. `layout: null`.
  - Apply → reparse words+query (keep mode), `saveExample`, re-render. Mode `<select>` change → set
    `_st.mode`, re-render. Examples `<select>` change → deserialize `words|query`, re-render.
- **`js/domains/tree.js`** (modify — remove Trie, leave Radix/Ternary intact): delete the
  `R().attach('tree-trie', …)` line; delete the `if (currentMode === 'tree-trie') { … drawTrie … }`
  render branch (the following `else if (tree-radix)` becomes the first branch); delete the
  `tree-trie` branch in the insert-word handler; delete the `trieRoot` declaration and its reset.
  Keep the shared `drawLine` helper (Radix/Ternary use it).
- **`js/app.js`** (modify — ONE `trees`-group row): change `tree-trie` to
  `{ id:'tree-trie', title:'Trie', file:'tree_trie.cpp', visualizer:'trie', controls:'trie',
  codeDrawer:true }` (the `visualizer`/`controls` values are cosmetic; `codeDrawer:true` moves the
  C++ into the hidden drawer and gives the viz full width).
- **`index.html`** (modify): two `<script defer>` tags — `js/trie_viz.js` then `js/viz/viz_trie.js`
  — placed **after** `js/code_db.js` and **after** `js/domains/tree.js` (so the new attach overrides
  any residual), before `js/app.js`.
- **`cpp/tree_trie.cpp`**: unchanged — already has `insert` + `search` + a `main`; shown via the code
  drawer from `CODE_DB['tree-trie']`. Verify it is present in `js/code_db.js` (no regen needed unless
  absent).
- **`js/desc_db.js`** (modify): refresh the `tree-trie` English description (trie = prefix tree;
  insert builds shared-prefix paths; `endOfWord` marks; search descends per character → found /
  prefix-only / miss; O(L) per op).
- **`style.css`** (modify): `.trie-*` block (wrap/controls, scroll, `.trie-node` + `-end` + `-cur`,
  `.trie-edge` + `-cur` + `-label`, banner, msg).
- **`js/i18n.js`**: no change required — `method.tree-trie` already exists ('Trie'); all viz control
  labels are inline bilingual (e.g. `套用 Apply`, `建立 Build`), matching the graph-viz convention.

## Program-wide conventions applied

- **VCR control** `buildFrameControls` (⏮ ◀ ▶/⏸ ▶︎ + scrubber + `步 i/N`). **`codeDrawer:true`**.
  **`ExamplesStore`** + a built-in miss example. **`overflow:auto`** scroll. Bilingual, **Traditional
  zh (zh-Hant)**. **Honest stepping** — nodes/edges/marks/highlights map straight from frame fields;
  stable layout, reveal-only. Full Playwright before merge.
- **Playwright edge caveat:** a perfectly vertical/horizontal SVG `<line>` has a zero-width/height
  bbox and `toBeVisible()` reports it hidden. The e2e MUST assert on robust locators (`.trie-node`
  count, `.trie-node-end` count, banner text) — NOT on the visibility of a specific edge.

## Tests

- **Unit** (`tests/unit/trie_viz.test.js`):
  - `buildTrie(['CAT','CAR'])` shares prefix `CA` (the `C→A` node has children `T` and `R`); node
    count = 5 (root + C + A + T + R). `endOfWord` true at `CAT` and `CAR` terminals, false at `CA`.
  - `buildFrames({words:['CAT','CAR','CARD','DO','DOG'], mode:'build'})`: `revealed` grows
    monotonically; final `revealed` = all node ids; final `ends` = every word terminal; last frame
    `action:'done'`; snapshot isolation (mutating a later frame's `revealed` doesn't change an
    earlier frame's).
  - `buildFrames({..., query:'CAR', mode:'search'})` → last verdict `found`; `query:'CA'` →
    `prefix-only`; `query:'CARE'` → `not-found` with a `mismatch` frame (path stops after `CAR`);
    `query:'X'` → `not-found` immediately (mismatch at index 0).
  - every frame `msg.zh` and `msg.en` non-empty. `parseWords` uppercases, strips non-A–Z, clamps
    count ≤ 12 and length ≤ 8; `parseQuery` takes the first token.
- **e2e** (`tests/trie.spec.js`): load `#m=tree-trie`; VCR bar present
  (`.stepctl [data-action="step"]`, `.stepctl-scrubber`). Build default: scrub to `max` → `.trie-node`
  count equals the full-trie node count and `.trie-node-end` count equals the number of distinct word
  terminals; banner contains 完成/done. Switch `.trie-mode` to Search + scrub to `max` → banner
  contains the found marker for `CAR`. Select the built-in miss example (or type `CARE`) + Search +
  scrub → banner contains the not-found marker. Custom words + Apply → re-render + an `.ex-select`
  option added. Code panel hidden until `.code-drawer-toggle`. `.trie-scroll` scrolls.
- `tests/smoke_modes.spec.js`: `tree-trie` still smoke-loads.

## Verification

`npm run test:unit` green; `node build_db.js` shows no unexpected churn (tree_trie.cpp unchanged);
`npm test` (FULL Playwright) green incl. the new spec + smoke + no regression to Radix/Ternary;
browser spot-check zh + en: build stepping (follow/create/mark-end, shared prefix growing), search
stepping (match/mismatch, found vs prefix-only vs miss), mode switch, custom input, code drawer,
scroll, VCR back/scrubber.

## Global constraints

- Concurrent refactor sessions — targeted `git add` by explicit path only; never `-A`/`.`/`-u`;
  verify `git status` first.
- Never hand-edit generated `js/code_db.js` (regen via `node build_db.js` only if needed).
- One branch (`feat/trie-viz-vcr`) + one PR. No new category/method (repointing an existing row) ⇒
  overview counts unchanged.
- Radix Tree and Ternary Search Tree must remain fully functional (shared `renderAdvTrees` +
  `text-tree` controls) — the tree.js edits touch only the Trie branches.

## Out of scope

- Radix / Ternary (unchanged). Trie **deletion**. Non-A–Z alphabets. A `slides_db` deck. Refactoring
  the duplicated examples helpers or the shared `renderAdvTrees`. Compressing/animating node
  repositioning (layout is static from the full trie by design).

## Success criteria

`tree-trie` ships as a dedicated stepped viz: a word list built into a trie one character at a time
(follow / create / mark-end) and a query searched one character at a time (match / mismatch →
found / prefix-only / not-found), on the VCR control, with a stable reveal-only layout, editable
words + query, a mode selector, saveable examples (incl. a built-in miss case), a hidden code drawer,
and scroll; Traditional-zh bilingual; Radix/Ternary unaffected; unit + full Playwright green; one
review-passed PR.
