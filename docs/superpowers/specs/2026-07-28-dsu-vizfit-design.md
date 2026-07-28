# tree-dsu → scripted op-sequence + SVG forest + vizfit-svg — design

- Date: 2026-07-28
- Repo: `/Users/skhuang/course/dsvisual`
- Phase 1, viz #5 (final) of the tree-viz "trie parity" program
  (`docs/superpowers/specs/2026-07-28-tree-viz-trie-parity-roadmap.md`). Reuses the viewBox-SVG
  pattern (threaded/game-tree) on the vizfit **`viz-fit-svg`** path.
- **Redesign** (user-chosen): from live union/find buttons to a **scripted op sequence stepped on the
  VCR**, rendered as a real **SVG forest** (nodes + child→parent edges), showing union-by-rank depth
  and path-compression flattening — a genuine upgrade over today's flat HTML grouping.
- One branch (`feat/dsu-vizfit`) / one PR.

## Current state (to be replaced)

`js/viz/viz_dsu.js` `renderDSU()`: `N=8` fixed; `parent[]`/`rank[]`; `find` (path compression) +
`unite` (union by rank) defined inline; **interactive** union/find/reset buttons that live-mutate the
DOM. The "forest" is a flat HTML grouping (`.dsu-forest` > `.dsu-tree` > `.dsu-tree-node` divs; union
moves node divs into one container) — it does NOT draw parent→child edges or show tree structure/depth.
No frames, no VCR, no examples, no codeDrawer. Logic lives in the renderer (no pure module).

## The redesign

### Pure module `js/dsu_viz.js` (new, dual-export)

- `parseOps(text) → { n, ops }`. Segments split on `;` or newlines; each segment is `U a b` (union) or
  `F x` (find), case-insensitive, whitespace-tolerant (also accept `union a b` / `find x`). `ops` =
  `[{ kind:'union', a, b } | { kind:'find', x }]` (indices ≥ 0; out-of-range or malformed segments
  dropped). `n = clamp((max index referenced) + 1, 2, 12)` (default `n = 2` if no valid op references
  an index). Whitespace/case tolerant.
- `SAMPLE = 'U0 1; U2 3; U0 2; U4 5; F3; U6 7'` → `n = 8`.
- `buildFrames({ n, ops }) → { frames }`. DSU arrays `parent = [0..n-1]`, `rank = new Array(n).fill(0)`.
  `find(x)` with **path compression** (repoints every node on the path to the root); `unite(a,b)`
  **union by rank** (smaller rank under larger; equal → one under the other and `rank++`). Emit an
  `init` frame first (all singletons), then **one frame per op** (post-op state). Frame shape:
  `{ kind:'init'|'union'|'find', op:{a,b}|{x}|null, parent:number[], rank:number[],
  highlight:number[] (nodes to emphasise: the two involved roots for union; the find path + root for
  find), roots:{small,large}|null, found:number|null, msg:{zh,en} }`. `parent`/`rank`/`highlight` are
  per-frame snapshots (`.slice()`). For `find`, capture the pre-compression path (from `x` up to the
  root) as `highlight`; the snapshot shows the post-compression `parent`.
- `randomInput(difficulty) → string` (an op string that `parseOps` accepts):
  - `normal`: `n≈6`, ~5 unions building a couple of sets + 1–2 finds.
  - `special`: chain unions to grow one deeper set, then a `F` on a deep leaf (to showcase path
    compression flattening).
  - `edge`: extremes — a single `F0` on all-singletons, or 2–3 unions only.
  - `large`: `n≈10–12`, ~10 mixed ops.
  Uses `Math.random`; every op references indices `< n`.

### Renderer `js/viz/viz_dsu.js` (rewrite)

- Controls (`.dsu-controls`): `.dsu-input` (op string) + `.dsu-build` (Build) + `.dsu-random` (🎲) +
  `.ex-select` + a hint (`U a b = union, F x = find`).
- Markup: `.dsu-wrap.vizfit-host` (direct child of `#dynamic-viz-host`); controls pinned top; a
  `.dsu-scroll.vizfit-scroll` whose sole child is `<svg class="dsu-svg">`; a `.dsu-info` op line + VCR
  as later siblings of the scroll.
- **Forest layout** (per frame, from `parent[]`): build `children` map + `roots` (i where
  `parent[i]===i`); lay out each tree (root on top, n-ary children spread below by leaf order; `colW`,
  `rowH`) and place trees left→right with a gap (a running column cursor across trees). Node `pos` in
  px. `viewBox` from node bounds (+ symmetric margin + room for the small rank label); node
  `NR=16`.
- `paint(fr)` rebuilds the single SVG's innerHTML: `<line class="dsu-edge">` child→parent; per node a
  `<circle class="dsu-node[ dsu-root| dsu-hl]" r=16>` + `<text class="dsu-node-label">i</text>`; roots
  also get a small `<text class="dsu-rank-label">r=<rank></text>`. `dsu-hl` on the frame's
  `highlight` nodes; `dsu-root` on roots. Update `.dsu-info` from `fr.msg` (e.g. "Union(0,1): link
  root 0 under 1 (rank)" / "Find(3) = 2, path compressed"). SVG sized via
  `K().fitFocusSize(scrollEl, natW, natH)` (width/height + `viewBox`).
- `K().markFocusFit(host, { svg: true })` (viz-fit-svg). Stepping via `K().buildFrameControls`.
- Examples trio duplicated; serialize the op string; default `DsuViz.SAMPLE`; built-in **"Deep chain"**
  example (unions that build a deep set then a find). Build → `saveExample('tree-dsu', opStr,
  DsuViz.SAMPLE)` + re-render; 🎲 → `DsuViz.randomInput(K().getInputDifficulty())` → set + save +
  re-render; `.ex-select` change → set op string + re-render.

### `js/app.js` — hide code

`tree-dsu` row (line 84) gains `codeDrawer: true`:
```js
{ id: 'tree-dsu', title: 'Disjoint Set (Union-Find)', file: 'tree_dsu.cpp', visualizer: 'dsu', controls: 'dsu', codeDrawer: true },
```

### `style.css` — SVG forest styling (replace the HTML-forest rules)

Keep `.dsu-wrap` (a `width:100%` vizfit host — adjust from the old flex/padding) and `.dsu-controls`.
Replace the HTML-forest rules `.dsu-forest`/`.dsu-tree`/`.dsu-tree-node`/`.dsu-tree-node.dsu-highlight`/
`.dsu-rank-table` (style.css 1549–1590) with SVG classes:
```css
.dsu-wrap { width: 100%; }
.dsu-svg { display: block; }
.dsu-edge { stroke: #94a3b8; stroke-width: 2; }
.dsu-node { fill: #1e293b; stroke: #64748b; stroke-width: 2; }
.dsu-node.dsu-root { stroke: #16a34a; stroke-width: 3; }
.dsu-node.dsu-hl { fill: #f59e0b; stroke: #b45309; }
.dsu-node-label { fill: #ffffff; font-size: 13px; font-weight: 700; text-anchor: middle; dominant-baseline: middle; }
.dsu-rank-label { fill: #16a34a; font-size: 10px; font-weight: 700; text-anchor: middle; }
```
(Do NOT touch the shared `.tree-node` base class.)

## Tests

- **Unit** (`tests/unit/dsu_viz.test.js`, new): `parseOps` (compact `U`/`F` + long forms; `n` = max
  index +1 clamped [2,12]; drops malformed/out-of-range); `buildFrames(parseOps(SAMPLE))` → an `init`
  frame + one frame per op; final `parent[]` groups the SAMPLE sets correctly (find-root of members
  equal within a set, differ across); `find` compresses (after a `F` on a deep node, that node's
  `parent` is its root); union-by-rank (root with larger rank stays root); snapshot isolation
  (mutating a later frame's `parent` doesn't change an earlier one); every frame `msg` bilingual.
  `randomInput(d)` for each difficulty → a string that `parseOps` yields ≥1 op and `buildFrames`
  doesn't throw, with all indices `< n`.
- **e2e** (`tests/dsu_vizfit.spec.js`, new): load `#m=tree-dsu`;
  1. `.dsu-wrap.vizfit-host` + `.dsu-scroll.vizfit-scroll > svg.dsu-svg`; `.vizfit-scroll` bounded
     (`clientHeight <= window.innerHeight - 120`); `.ex-select` + `.dsu-random` present; NO old
     `.dsu-forest`/`.dsu-tree-node`.
  2. Nodes render as SVG: `.dsu-svg .dsu-node` count === `n` (8 for SAMPLE); scrub to `max` → edges
     present (`.dsu-svg .dsu-edge` count > 0) and `.dsu-info` shows an op description.
  3. 🎲 → `.dsu-input` becomes a valid op string (`/^[UF0-9 ;]+$/i`) and re-renders (`.dsu-node` > 0);
     Build `U0 1;U2 3` → re-renders + an `.ex-select` option added.
  4. Fullscreen via `.viz-focus-toggle` → card `viz-fit` AND `viz-fit-svg`; `.dsu-svg` `width` grows
     after a rAF; VCR (`.stepctl`) within viewport; zoom toolbar visible.
  5. Code drawer hidden until `.code-drawer-toggle`.
  Assert robust locators (counts, class presence, value regex, width attribute) — never SVG edge
  visibility.
- Existing suites stay green (esp. the other vizfit adopters + fullscreen specs; update any
  pre-existing DSU test that drove the old buttons / asserted `.dsu-tree-node`).
- Full Playwright before merge.

## Verification

`npm run test:unit` + `npm test` green; browser spot-check zh + en: op sequence steps on the VCR;
the SVG forest shows real trees with edges, union-by-rank depth, and path-compression flattening after
a find; bounded + drag-scroll normal view; fullscreen fits + drawing-only zoom; 🎲/examples work; code
in the drawer.

## Global constraints

- Targeted `git add` by explicit path only; never `-A`/`.`/`-u`; verify `git status` first.
- Never hand-edit generated files (`js/code_db.js`, `slides/**`, `js/slides_rendered.js`).
- TWO new `index.html` `<script defer>` tags — `js/dsu_viz.js` (pure) THEN nothing else new (the
  renderer `js/viz/viz_dsu.js` already has a tag); the pure module tag goes after `js/code_db.js`,
  before `js/viz/viz_dsu.js`. (A NEW pure module needs its own tag — easy to forget.)
- `viz-fit-svg` path: `markFocusFit(host,{svg:true})` + `fitFocusSize` for the single SVG.
  `.vizfit-host` a DIRECT child of `#dynamic-viz-host`; `.dsu-svg` sole child of `.vizfit-scroll`;
  `.dsu-info`/VCR later siblings.
- Do NOT modify the shared `.tree-node` base class. Examples trio duplicated (do NOT refactor).
  `randomInput` per-module. Traditional-zh where the viz emits zh. Non-focus + other viz UNCHANGED.
- e2e assert counts/class/regex/width — never SVG edge visibility.
- One branch + PR. This is the LAST viz of the program.

## Out of scope

- Sub-stepping within a single find (one frame per op — the sequence IS the ops). Weighted/other DSU
  variants. Keeping the live interactive buttons (replaced by the scripted sequence). Hoisting the
  bounds→viewBox math to a shared helper (deferred DRY). Node-overlap on very wide forests
  (pre-existing, program-wide).

## Success criteria

`tree-dsu` becomes a scripted union/find op sequence stepped on the VCR, rendered as a single viewBox
SVG forest (nodes + child→parent edges, roots + ranks) that shows union-by-rank depth and
path-compression flattening; on the vizfit `viz-fit-svg` path (C++ in the drawer, bounded + fullscreen
fit + drawing-only zoom); editable op input + saveable examples + a difficulty-aware 🎲. Unit + full
Playwright green; one review-passed PR. **Completes the tree-viz trie-parity program (6/6).**
