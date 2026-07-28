# tree-threaded → vizfit-svg (viewBox rewrite) + examples — design

- Date: 2026-07-28
- Repo: `/Users/skhuang/course/dsvisual`
- Phase 1, viz #3 of the tree-viz "trie parity" program
  (`docs/superpowers/specs/2026-07-28-tree-viz-trie-parity-roadmap.md`). Consumes the Phase-0 vizfit
  mechanism via the **`viz-fit-svg`** (per-SVG drawing-only zoom) path.
- **Resolves the roadmap's stage-fit fork (Option A, user-chosen):** rewrite the HTML-overlay stage as
  a single viewBox `<svg>`, making threaded a true single-SVG viz. **This sets the reusable pattern
  that `game-tree` (identical stage shape) will follow.**
- One branch (`feat/threaded-vizfit`) / one PR.

## Goal

Bring the Threaded Binary Tree viz to full trie parity: hidden C++ (`codeDrawer`), a bounded/
drag-scrollable drawing that fits the viewport and drawing-only-zooms in fullscreen (crisp, via
`fitFocusSize`), editable input + saveable examples, keeping its existing difficulty-aware 🎲.

## Current structure

`js/viz/viz_threaded.js` `renderTreeThreaded()`:
- `_threadedState = { vals }`, default `ThreadedViz.SAMPLE = [50,30,70,20,40,60,80]`; builds a BST, then
  `buildThreadedFrames` (frames add inorder-thread links + walk the visit order).
- Controls `.th-controls`: `.th-input` (comma ints) + `.rand-btn` (🎲, via
  `RandomInput.randomInputFor('tree-threaded', getInputDifficulty()) → {vals}`) + `.th-build` +
  an inline hint.
- **`.th-stage`** (`position:relative; height:320px; overflow:hidden`): an SVG `.th-edges`
  (`inset:0;100%×100%`, raw-px coords) drawing tree edges (grey lines) + inorder threads (purple
  dashed `Q` paths), PLUS a `.th-nodes` HTML overlay of `.tree-node` divs positioned by px
  (`left/top`), with `active`/`visited` state classes.
- `.th-output` (inorder sequence) + `.th-phase` (message) below the stage.
- `paint(fr)` rebuilds the edge SVG string and the node HTML string each frame.
- `computeTreeLayout(node, 200, 30, 90, meta)` → px `{id,val,x,y,color}` per node (left/right spread;
  x can go negative for left-heavy trees; y = 30 + depth·60).
- Pure module `ThreadedViz`: `{ makeNode, insert, buildTreeFromValues, inorderNodes,
  buildThreadedFrames, SAMPLE }` (no `randomInput` — random comes from the shared `RandomInput` registry).

## Changes

### `js/app.js` — hide code

`tree-threaded` row (line 90) gains `codeDrawer: true`:
```js
{ id: 'tree-threaded', title: 'Threaded Binary Tree', file: 'tree_threaded.cpp', visualizer: 'threaded', controls: 'threaded', codeDrawer: true },
```

### `js/viz/viz_threaded.js` — viewBox-SVG rewrite + examples + vizfit-svg

**Examples-helper trio** duplicated per convention (`loadExamples`/`saveExample`/`buildExamplesSelect`).
Serialize an example as the comma value string (`st.vals.join(',')`); default = `ThreadedViz.SAMPLE.join(',')`;
built-in **"Left-skewed"** example `10,20,30,40,50` injected after Default.

**Markup** — wrap in `.th-wrap.vizfit-host` (direct child of `#dynamic-viz-host`); controls pinned top;
a single-SVG drawing inside `.th-scroll.vizfit-scroll`; the inorder output, phase, and VCR are later
siblings of the scroll:
```
'<div class="th-wrap vizfit-host">' +
  '<div class="th-controls"> …th-input… rand-btn(🎲) … th-build … ex-select … hint …</div>' +
  '<div class="th-scroll vizfit-scroll"><svg class="th-svg"></svg></div>' +
  '<div class="th-output"><strong>Inorder:</strong> <span class="th-seq"></span></div>' +
  '<div class="th-phase"></div>' +
'</div>'
```
(The old `.th-stage`/`.th-edges`/`.th-nodes` are replaced by the single `.th-svg`.)

**Layout bounds → viewBox.** Keep `computeTreeLayout` (unchanged, px coords). After building `meta`,
compute natural bounds with a node radius `R = 16` and a top margin for the thread arcs:
`minX = min(m.x) - R - 12`, `maxX = max(m.x) + R + 12`, `minY = min(m.y) - 46` (threads arc ~30 above
a node), `maxY = max(m.y) + R + 12`; `natW = maxX - minX`, `natH = maxY - minY`. The SVG uses
`viewBox="minX minY natW natH"` (negative origin is fine) and its `width`/`height` come from
`K().fitFocusSize(scrollEl, natW, natH)` — natural out of focus, fitted×zoom in focus.

**`paint(fr)`** rebuilds the single SVG's innerHTML (all in viewBox px coords):
- tree edges: `<line class="th-edge" …>` (grey), same walk as today.
- threads: `<path class="th-thread" … stroke-dasharray>` (purple dashed `Q`), same as today.
- nodes: for each `meta` entry, a `<circle class="th-node[ active|visited]" cx cy r="16">` + a
  `<text class="th-node-label" x=cx y=cy>val</text>` (state from `fr.current`/`fr.visited`, same logic
  as the current HTML overlay). This REPLACES the `.th-nodes` HTML div.
- update `.th-seq` (inorder) + `.th-phase` (message) as today.
The SVG element to size is `scrollEl.querySelector('.th-svg')` — but since `paint` writes the full
`<svg …width…height…viewBox…>` string, compute `{w,h} = K().fitFocusSize(scrollEl, natW, natH)` at the
top of `paint` and emit them in the `<svg>` tag (mirrors the trie's `svgFor(...,w,h)` pattern).

**After building:** inject the built-in example into `.ex-select` (after Default, idempotent),
`wrap.appendChild(K().buildFrameControls(frames, paint, { runIntervalMs: 700 }))`, then
`K().markFocusFit(host, { svg: true })` (viz-fit-svg → per-SVG drawing-only zoom).

**Wiring:**
- `.th-build` → parse `.th-input` comma ints; if any, `st.vals = vals`,
  `saveExample('tree-threaded', st.vals.join(','), ThreadedViz.SAMPLE.join(','))`, re-render.
- `.rand-btn` → `RandomInput.randomInputFor('tree-threaded', K().getInputDifficulty()) → {vals}`; set,
  save example, re-render (unchanged except the save).
- `.ex-select` change → parse the value's comma ints into `st.vals`, re-render.

### `style.css` — SVG node styling (replaces the HTML-overlay stage CSS)

Replace the threaded stage rules (`.th-stage`/`.th-stage .th-edges`/`.th-stage .th-nodes`, lines
2903–2905) with vizfit + SVG styling:
```css
.th-wrap { width: 100%; }
.th-svg { display: block; }
.th-edge { stroke: #94a3b8; stroke-width: 2; }
.th-thread { fill: none; stroke: #a855f7; stroke-width: 2; stroke-dasharray: 5 4; }
.th-node { fill: #1e293b; stroke: #64748b; stroke-width: 2; }
.th-node.active { fill: #f59e0b; stroke: #b45309; }
.th-node.visited { fill: #2563eb; stroke: #1e40af; }
.th-node-label { fill: #ffffff; font-size: 13px; font-weight: 700; text-anchor: middle; dominant-baseline: middle; }
```
(Keep `.th-controls`/`.th-controls .th-input` at 2901–2902. `.tree-node` is a SHARED class used by other
viz — do NOT touch it; threaded simply stops using it.)

## Tests

- **e2e** (`tests/threaded_vizfit.spec.js`, new): load `#m=tree-threaded`;
  1. `.th-wrap.vizfit-host` + `.th-scroll.vizfit-scroll > svg.th-svg` exist; `.vizfit-scroll` bounded
     (`clientHeight <= window.innerHeight - 120`); `.ex-select` + `.rand-btn` present.
  2. Nodes render **as SVG**: `.th-svg .th-node` count === the 7 default values; `.th-svg .th-node-label`
     count === 7; and there are NO HTML `.th-nodes .tree-node` (overlay removed).
  3. Stepping works: scrub to `max` → inorder `.th-seq` non-empty and thread paths present
     (`.th-svg .th-thread` count > 0).
  4. 🎲 changes `.th-input` (a comma int list) and re-renders (`.th-svg .th-node` count > 0); Build a
     custom `10,20,30` → `.th-svg .th-node` count === 3 + an `.ex-select` option added.
  5. Fullscreen via `.viz-focus-toggle` → active card has `viz-fit` AND `viz-fit-svg`; the `.th-svg`
     `width` attribute increases (per-SVG fit) after a rAF; VCR (`.stepctl`) within viewport; zoom
     toolbar visible.
  6. Code drawer hidden until `.code-drawer-toggle`.
  Assert robust locators (counts, class presence, width attribute) — never SVG edge visibility.
- Existing suites stay green (esp. `tests/vizfit.spec.js`, `tests/catalan_vizfit.spec.js`,
  `tests/tgb_vizfit.spec.js`, fullscreen specs, any existing threaded test — update it if it asserted
  the old HTML `.tree-node` overlay).
- Full Playwright before merge.

## Verification

`npm test` green; browser spot-check zh + en: BST + inorder threads render crisply as one SVG; bounded
+ drag-scroll in normal view; fullscreen fits the drawing to the window and drawing-only-zoom enlarges
it (controls/VCR fixed); 🎲/examples work; code in the drawer; stepping (visit order + thread reveal)
intact.

## Global constraints

- Targeted `git add` by explicit path only; never `-A`/`.`/`-u`; verify `git status` first.
- Never hand-edit generated files (`js/code_db.js`, `slides/**`, `js/slides_rendered.js`).
- `.vizfit-host` a DIRECT child of `#dynamic-viz-host`; the drawing SVG is the sole child of
  `.vizfit-scroll`; the inorder/phase/VCR are later DOM siblings of `.vizfit-scroll`.
- `viz-fit-svg` path: `markFocusFit(host, {svg:true})` + `fitFocusSize` for the single SVG.
- Do NOT modify the shared `.tree-node` class or `computeTreeLayout`'s geometry. Keep the shared
  `RandomInput` registry for 🎲 (no per-module randomInput).
- Traditional-zh where the viz emits zh; existing hint/labels preserved. Non-focus + other viz UNCHANGED.
- One branch + PR.

## Out of scope

- `game-tree` (next sub-project; reuses this viewBox-SVG pattern).
- Changing the threaded-tree algorithm, `buildThreadedFrames`, or `computeTreeLayout` geometry.
- A per-module `randomInput` (threaded keeps the shared `RandomInput` registry).

## Success criteria

`tree-threaded` renders as a single viewBox SVG and adopts the vizfit **`viz-fit-svg`** path: C++ in the
drawer; bounded drawing that fits the window and drawing-only-zooms crisply in fullscreen (VCR + controls
operable); editable input + saveable examples + the existing difficulty-aware 🎲; visit/thread stepping
intact. Establishes the reusable viewBox-SVG pattern for `game-tree`. New e2e + full Playwright green;
one review-passed PR.
