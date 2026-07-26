# VCR frame-controls — site-wide stepping transport — design

- Date: 2026-07-26
- Repo: `/Users/skhuang/course/dsvisual`
- Replaces the shared `VizKit.buildStepControls(onStep, onReset, runIntervalMs)` (Step / Run / Reset + Speed)
  with a VCR-style transport modelled on the Red-Black-Tree `History` bar
  (`js/tree_rb_viz.js` `_buildTransport`): **⏮ to-start · ◀ back · ▶/⏸ run · ▶︎ forward · scrubber · speed · `步 i / N`**.

## Goal

Every stepped visualization gains **backward** stepping, a **draggable scrubber**, and a **position
counter**, so a learner can move freely back and forth through an algorithm's frames — not only
forward — with the same transport everywhere. Backward and scrubbing are **instant** (random access
into a precomputed frames array), matching the RB-tree bar's feel.

## Approach (decided)

- **Scope:** site-wide. All 50 `buildStepControls` call sites migrate to a new frame-array control.
- **Backward mechanism (B):** the control owns the frame index and does `goTo(k)` by rendering
  `frames[k]` directly — no reset+replay. This requires each viz to hand the control its precomputed
  `frames` array plus a `paint(frame, idx)` function (instead of opaque `step`/`reset` closures).
- **All 50 migrate**, including the 2 IMPERATIVE ones (rebuild the control when their frames array
  changes). `buildStepControls` is deleted once every consumer is migrated.
- **Order:** this refactor ships first; the parked viz #3 `graph-bipartite` brainstorm resumes after.

## New API — `VizKit.buildFrameControls(frames, paint, opts)`

- `frames: Array<Frame>` — the precomputed frames (any shape; the control never inspects a frame).
- `paint(frame, idx): void` — renders the given frame. **`idx` is passed** because several consumers
  repaint cumulatively over `frames[0..idx]` (Prim, Bellman-Ford, Floyd, recursion, aho) rather than
  from a single frame object — they close over `idx`, not `frame`.
- `opts` (all optional):
  - `runIntervalMs` — initial autoplay delay (default 500); seeds the speed control, preserving the
    per-mode localStorage memory the old control had (`dsvisual.stepSpeed.<mode>`).
  - `initialIndex` — starting cursor (default 0); used by consumers with a persisted cursor
    (OOP steps, pattern steps).
  - `onIndexChange(idx)` — called after every `goTo`; used to persist the cursor (OOP/pattern) and
    for any consumer that must react to index changes.
  - `statusColor(frame, idx)` — optional; when present the control calls
    `VizKit.showStatus(text, color)` — **but** per-frame status text belongs in `paint` (see below),
    so most consumers fold status INTO `paint` and omit this.
- **Returns** the `.stepctl` strip element. The control manages the cursor, autoplay timer, scrubber,
  speed, and counter internally, and calls `paint(frames[idx], idx)` on every change (including the
  initial render — the consumer no longer calls `paint()` itself).

### Behaviour
- `⏮` `goTo(0)`; `◀` `goTo(idx-1)`; `▶/⏸` toggle autoplay (advance one frame per tick at the speed
  value; auto-pause at the last frame); `▶︎` `goTo(idx+1)`; scrubber `input` → `goTo(+value)`;
  speed change re-applies live if playing; all indices clamped to `[0, frames.length-1]`.
- Any transport action other than run/⏸ pauses autoplay first (matches RB-tree).

### DOM contract (preserve existing e2e selectors; add new)
```
<div class="stepctl">
  <button data-action="reset"  class="tbtn">⏮</button>
  <button data-action="back"   class="tbtn">◀</button>
  <button data-action="run"    class="tbtn play">▶</button>   <!-- text ⏸ while playing -->
  <button data-action="step"   class="tbtn">▶︎</button>        <!-- forward one frame -->
  <input  type="range" class="stepctl-scrubber" min="0" max="N-1" value="0">
  <label class="stepctl-speed-wrap">…<input type="range" class="stepctl-speed" min="10" max="600"></label>
  <span class="stepctl-count">步 0 / N-1</span>   <!-- 0-based cursor / last index (frames.length-1), matching RB-tree -->

</div>
```
- Existing specs click `.stepctl [data-action="step"]` (forward), `[data-action="run"]`,
  `[data-action="reset"]` — all preserved with the SAME semantics (step = +1 frame, run = autoplay,
  reset = to start). This is what lets the bulk of the suite pass unchanged.
- New: `data-action="back"`, `.stepctl-scrubber`, `.stepctl-count`.
- Tooltips (`title`) bilingual, `zh` = Traditional. Button glyphs match RB-tree (⏮ ◀ ▶/⏸ ▶︎).

## Migration inventory (surveyed) — 42 CLEAN · 6 ARRAYish · 2 IMPERATIVE

**CLEAN (42)** — `const frames = X.someFrames(...).frames; let idx; paint()/step()/reset()`. Mechanical:
replace the trio with `buildFrameControls(frames, (frame, idx) => paint(idx))`, drop the local
`step/reset/paint()` bootstrap call. The cumulative painters (js/domains/graph.js `renderPrim`
:296 / `renderBellmanFord` :372 / `renderFloydWarshall` :445, `viz_recursion.js` :200,
`viz_aho.js`—see ARRAYish) MUST use the `idx` arg. Files (call-site lines):
graph.js 296/372/445; viz_decision_tree_coins 83; viz_expr 50; viz_expr_tree 158; viz_fenwick 79;
viz_file_inverted 68; viz_file_isam 93; viz_game_tree 116; viz_gc 192; viz_graph_aoe 52;
viz_huffman 98; viz_list_doubly 39; viz_list_equivalence 145; viz_lru 50; viz_magic 139;
viz_magic_latin 115; viz_magic_symmetry 111; viz_magic_torus 142; viz_matrix_sparse_list 155;
viz_maze 55; viz_mway 66; viz_nano_bpe_encode 35; viz_nano_bpe_train 31; viz_nano_compute_graph 34;
viz_nano_ngram 37; viz_obst 72; viz_poly 44; viz_polyphase 44; viz_search_fib 40;
viz_search_interp 43; viz_segment 131; viz_sort_external 59; viz_sparse 103; viz_tgb 142;
viz_threaded 59; viz_tree_array_rep 105; viz_tree_catalan 63; viz_tree_copy_equal 86;
viz_tree_reconstruct 107; viz_tree_traversal 96.

**ARRAYish (6)** — array + index but step/reset do extra work:
- `viz_graph_matrix.js` :215 — per-frame `showStatus`(color) + done-frame hover wiring → fold into
  `paint(frame, idx)` (status every frame; wire hover when `frame.done`).
- `viz_graph_components.js` :122 — per-frame `showStatus`(color) → fold into `paint`.
- `viz_aho.js` :111 — two arrays (failSteps + scanSteps) + one composite cursor; draw is cumulative
  → materialize ONE `frames` array (concat the two phases) and paint cumulatively by `idx`.
- `viz_zalgo.js` :67 — `z[]`+`trace[]` with a `cur` starting at 1 → materialize a `frames` array
  (one entry per trace step) so index 0 is a valid start frame.
- `viz_pattern.js` :72 — `descriptor.diagram.steps[]` + module-level `_step`; step/reset also
  `showStatus(caption)`. Use `opts.initialIndex = savedStep`, `opts.onIndexChange` to persist
  `_step`, and fold the caption `showStatus` into `paint`.
- `js/app.js` :2092 `syncOopStepControls` — `OOP_STEPS[mode][]` + persisted `oopStep(mode)`; both
  callbacks `renderOOP()` + `showStatus`. Use `opts.initialIndex = oopStep(mode)`,
  `opts.onIndexChange = i => setOopStep(mode, i)`; `paint = (_, i) => { renderOOP(i); showStatus(...) }`.
  Keep the "rebuild strip when the mode select changes" behaviour (call `buildFrameControls` again
  with the new mode's `OOP_STEPS`/`initialIndex`).

**IMPERATIVE (2)** — frames created/swapped at runtime → **rebuild the control on change**:
- `viz_skiplist.js` :146 — the search path doesn't exist until a search key is entered. On the
  search action, compute the `frames` (the path steps) and (re)build a `buildFrameControls` strip
  in place of the old `stepSearch/resetSearch`. Insert/Delete already rebuild the whole viz.
- `viz_magic_formula.js` :115 — `story.frames` is swapped (idle→query on cell click; →fill on
  "Fill all"). On each swap, rebuild the `buildFrameControls` strip with the new frames.

## Files

- **`js/app.js`** — add `buildFrameControls` to VizKit (near `buildStepControls`, ~line 1916) and to
  the VizKit export object (~line 1411); migrate the OOP call (~2092). Delete `buildStepControls`
  ONLY in the final task, after all consumers are migrated.
- **`js/domains/graph.js`** — migrate 3 call sites.
- **`js/viz/*.js`** — migrate ~46 call sites across the listed files.
- **`style.css`** — add `.stepctl` VCR-bar styling: `.tbtn` buttons, `.stepctl-scrubber`,
  `.stepctl-count`, `.play` state; keep `.stepctl-speed*`. (Reference the RB-tree `.tbtn`/`.cnt`
  styling for visual parity, but scope to `.stepctl`.)
- **`tests/frame_controls.spec.js`** (new) — dedicated e2e (below).
- Existing specs unchanged (selectors preserved). Any spec that breaks reveals a real semantic
  regression and must be fixed at the source, not by loosening the test.

## Testing

- **New `tests/frame_controls.spec.js`** against a representative migrated viz (e.g. `graph-components`):
  load; `▶︎` advances and `.stepctl-count` reads `步 1 / <last>` (or the en form); `◀` returns to the
  exact prior frame (assert a frame-specific DOM state reappears — e.g. the same `.gc2-node-current`);
  scrubber set to `max` jumps to the done frame (count `<last> / <last>`); `▶` (run) plays to the end
  and the button returns to the play glyph; `⏮` returns to index 0 (count `步 0 / <last>`).
- **Full Playwright** (`npm test`) is the pre-merge gate for EVERY migration task — the preserved
  `data-action` selectors mean the existing specs (graph-matrix, graph-components, smoke_modes,
  visualizer, patterns, examples, deeplink, etc.) must stay green throughout.
- `npm run test:unit` unaffected (no logic-module changes) but run it too.

## Global constraints

- Bilingual tooltips/labels; `zh` = **Traditional (zh-Hant)**, never Simplified.
- **Concurrent refactor session** edits `js/app.js` — stage with targeted `git add <path>` only,
  never `-A`/`.`/`-u`; verify `git status` before each commit; rebase if `buildStepControls`/VizKit
  region collides.
- Never hand-edit generated files (`js/code_db.js`, `slides/**`, `js/slides_rendered.js`).
- Honest behaviour: never loosen or delete an existing assertion to make a migration pass — fix the
  migration. A spec that genuinely no longer applies (semantics intentionally changed) is flagged,
  not silently edited.
- One branch (`feat/vcr-frame-controls`), one PR. The 4 protected ds2026 notebooks are untouched
  (different repo).

## Out of scope

- The RB-tree's own transport (`js/tree_rb_viz.js`) — it already has this bar; not migrated.
- The op-log side panel / `⏭ next-op` / KIND_META badges of the RB-tree `History` — the generic bar
  has no notion of "operations"; `⏮` means to-start, not previous-op.
- Any change to frame *content* or algorithm logic in the migrated viz — this is a control-layer
  refactor only.
- viz #3 `graph-bipartite` (parked; resumes after merge).

## Success criteria

All 50 stepped visualizations use `buildFrameControls`; every one has working backward, scrubber,
speed, and `步 i / N` counter with the RB-tree-style bar; `buildStepControls` is removed; the full
Playwright suite (with preserved selectors) plus the new frame-controls spec are green; Traditional
zh throughout; delivered as batched, individually-reviewed tasks under one PR.
