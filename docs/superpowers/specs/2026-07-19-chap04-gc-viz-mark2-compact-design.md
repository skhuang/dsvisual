# chap04 §4.10 GC viz — MARK2 & COMPACT modes for the Memory/GC visualizer — design

- Date: 2026-07-19
- Repo: `/Users/skhuang/course/dsvisual`
- Companion to the ds2026 chap04 §4.10 slide work (MARK2 pointer reversal + COMPACT
  3-pass compaction, merged as ds2026 PR #49). This surfaces those two algorithms as
  interactive modes in dsvisual's existing **Memory / GC** visualizer.

## Motivation & current state

The `memory` category (title **Memory / GC**) already has ONE viz, `gc-memory`
(visualizer `gcmem`, renderer `js/viz/viz_gc.js`, logic `js/gc_memory_viz.js`), with a
mode dropdown offering three modes: **Mark-Sweep**, **Reference Counting**, **Buddy
System**. Missing from the §4.10 story are the two distinctive algorithms:

- **MARK2** — Deutsch–Schorr–Waite *pointer-reversal* marking (stack-free; links flip on
  descent and are restored on the way back). The existing "Mark-Sweep" marks
  reachable-from-roots with a plain stack + sweep — it does NOT show pointer reversal.
- **COMPACT** — 3-pass *sliding compaction* (assign new addresses → rewrite links →
  relocate). The existing "Buddy System" is a different allocator, not compaction.

## Decisions (approved)

- Cover **both** MARK2 and COMPACT.
- Add them as **two new modes in the existing `gc-memory` viz** (extend the `.gc-mode`
  dropdown), NOT as new METHOD_GROUPS rows. Consequence: no new overview tile and no new
  category ⇒ **no `overview-tile`/`overview-category` count change**, so the i18n
  tile-count assertion is untouched (contrast the chap05 tree-viz program). Still run the
  FULL Playwright suite before merge (see [[dsvisual-ci]]).
- **MARK2 uses the generalized-list model** (`tag`/`dlink`/`rlink`) matching the ds2026
  §4.10 slide, not a plain binary graph.

## Files touched

- `js/gc_memory_viz.js` — add `pointerReversalFrames(scenario)` and
  `compactFrames(scenario)`; add their default scenarios; extend `gcMemoryFrames(mode)`
  to dispatch `'pointer-reversal'` and `'compact'`; export the new functions + scenarios
  on `api`. Dual-export IIFE convention (window + module.exports) unchanged.
- `js/viz/viz_gc.js` — add `['pointer-reversal','Pointer-Reversal Mark (MARK2)']` and
  `['compact','Compaction (COMPACT)']` to the `modes` array; add a render branch for each
  in `paint()`.
- `style.css` — minimal additions for the pointer-reversal view (reuse `gc-grid`/`gc-cell`
  and `gc-mark`; add classes for the P/Q cursors and a reversed-link flag). COMPACT reuses
  the existing `gc-bar`/`gc-seg`/`gc-seg-free`/`gc-seg-alloc`/`gc-active` address-bar style.
- `cpp/gc_memory.cpp` + `build_db.js` mapping (`'gc_memory.cpp' → codeGcMemory`, already
  present) — append the MARK2 and COMPACT C++ so the code drawer reflects the new modes;
  `node build_db.js` regenerates `js/code_db.js`.
- `js/desc_db.js` — extend the `gc-memory` entry to describe the two new modes
  (English-only, styled `class="complexities"` plural if a complexity line is added).
- `slides_db.js` — extend the existing `SLIDES_DB["gc-memory"]` deck with a slide (or two)
  for pointer reversal + compaction; `npm run build:slides` regenerates
  `slides/{en,zh}/gc-memory.md` + `js/slides_rendered.js`. Do NOT hand-edit generated
  slides. (Same viz id, so no new `slides/en/<id>.md` file — lint stays clean.)
- Tests: `tests/unit/gc_memory_viz.test.js` (new or extend) for the two frame builders;
  `tests/tier3.spec.js` (already drives `.gc-mode` to `buddy`) extended to also select
  `pointer-reversal` and `compact` and step through.

## MARK2 — pointer-reversal frame builder

Nodes `{id, tag, dlink, rlink}` (links are ids or null). Default scenario (mirrors ds2026
`demo410b`): `R{tag:1,dlink:n1,rlink:S}`, `S{tag:0}`, `n1{tag:0,rlink:n2}`, `n2{tag:0}`;
root `R`. Run Deutsch–Schorr–Waite:

- first visit `p` (unmarked): `mark p`; if `tag` → reverse `dlink` (`c=0`), else reverse
  `rlink` (`c=1`); advance.
- dead end (`p` null/marked): if `q` null → done; if `c(q)=0` → restore `dlink`, descend
  `rlink`, reverse it (`c=1`); else restore `rlink`, pop.

`snap = { phase, p, q, nodes:[{id,tag,mark,c,dlink,rlink}] }` pushed at every step. Phase
labels: `start` / `mark` / `descend dlink` / `atom → rlink` / `switch dlink→rlink` /
`pop (restore)` / `done`. Renderer flags a link as *reversed* when its current target ≠
the node's home target (captured from the original scenario), and highlights `p`/`q`.

**End-state invariant (unit-tested):** all reachable nodes (`R,S,n1,n2`) marked AND every
node's `dlink`/`rlink` equals its original value (reversal fully undone).

## COMPACT — 3-pass frame builder

Blocks `{id, addr, size, live, link, newAddr}` in address order. Default scenario (mirrors
`demo410c`): `A{1,2,live,link:D}`, `B{3,2,free}`, `C{5,2,live}`, `D{7,2,live,link:A}`,
`E{9,1,free}`; total `M=10`.

- **Pass 1** — `av=1`; each live block: `newAddr=av`, `av+=size`; snap per block.
- **Pass 2** — each live block with a link: resolve `link`'s target `newAddr` and show the
  rewrite `old→new`; snap. (Null link ⇒ stays null — node-0 convention.)
- **Pass 3** — each live block: `addr=newAddr` (relocate); snap. Final bar contiguous.

`snap = { phase, active, av, pass, blocks:[...] }`. Renderer draws the address bar (free
gaps visible), annotates `newAddr` during passes 1–2 and link targets, then the compacted
bar in pass 3.

**End-state invariant (unit-tested):** live blocks `A,C,D` at addresses `1,3,5` (order
preserved), `A.link` rewritten to `5` (D's new addr), `D.link` rewritten to `1` (A's new
addr).

## Verification

- `npm run test:unit` — new frame-builder tests green (end-state invariants above).
- `node build_db.js` — `code_db.js` regenerated; `npm run build:slides` — gc-memory slides
  regenerated with no unrelated churn.
- `npm test` (FULL Playwright) — all green, including `tier3.spec.js` driving the two new
  modes and `smoke_modes.spec.js` (gc-memory loads with no console errors).

## Global constraints

- dsvisual has a **concurrent refactor session** — targeted `git add` of only these files;
  never `git add -A`/`.`/`-u`; verify `git status` first.
- Bilingual zh/en for any new `slides_db` text; `desc_db` stays English-only.
- One branch + PR; run full Playwright locally before merge.

## Out of scope

- Changing the existing mark-sweep/refcount/buddy modes; other categories; a separate
  compaction-of-linked-nodes (fixed-size) mode; the shared mid-`Run` timer nit.

## Success criteria

The `gc-memory` viz gains **Pointer-Reversal Mark (MARK2)** and **Compaction (COMPACT)**
modes, faithful to the ds2026 §4.10 algorithms, with unit-tested end-state invariants,
a code drawer + description + slides covering them, and a green full Playwright run — all
in one PR with no tile/category-count change and no unrelated churn.
