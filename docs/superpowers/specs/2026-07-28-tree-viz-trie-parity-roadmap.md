# Tree-viz "trie parity" program — roadmap

- Date: 2026-07-28
- Repo: `/Users/skhuang/course/dsvisual`
- Goal: bring five tree viz up to the **trie's full presentation** — hidden code (`codeDrawer`),
  bounded scroll (in and out of fullscreen), fullscreen fit/zoom with the VCR always operable, and
  (where the input model allows) editable input + saveable examples + a difficulty-aware 🎲 random
  button. Built **shared-mechanism-first, then applied per viz** (user-directed).

## The five viz + locked per-viz scope

All five already use VCR stepping (`buildFrameControls`) + `VizRegistry.attach(<id>)` + a dynamic
host. What each gains:

| viz | id | structure | scope (locked via brainstorm) |
|-----|----|-----------|-------------------------------|
| Threaded Binary Tree | `tree-threaded` | `.th-stage` = SVG edge layer (100%×100%, no viewBox) + **absolutely-positioned HTML node overlay** | FULL: examples + `randomInput` + bounded + fullscreen-expand + codeDrawer + drawing fit — see ⚠ below |
| Game Tree | `game-tree` | `.gt-stage` = same pattern (SVG edges + HTML node overlay) | FULL: examples + `randomInput` + bounded + fullscreen-expand + codeDrawer + drawing fit — see ⚠ below |
| General ↔ Binary Tree | `tree-general-binary` | **dual-panel** (general + binary SVGs); text input | examples + `randomInput` (random general-tree string) + bounded + fullscreen-expand + codeDrawer; zoom via wrapper (no per-SVG fit) |
| Disjoint Set (Union-Find) | `tree-dsu` | **HTML forest**, live union/find buttons | **REDESIGN → scripted op sequence** (input `U0 1; U2 3; F5` → one VCR frame per op) + examples + random op-sequence + 🎲 + bounded + fullscreen-expand + codeDrawer |
| Counting Trees (Catalan) | `tree-catalan` | **shape gallery** + table; only `n∈{0..4}` | LAYOUT ONLY: codeDrawer + bounded gallery + fullscreen-expand. **No examples/random** (n is its only input; the paradigm doesn't fit) |

## Decomposition (each phase = its own spec → plan → subagent → PR)

- **Phase 0 — shared "vizfit" mechanism** (`docs/superpowers/specs/2026-07-28-vizfit-shared-mechanism-design.md`):
  generalize the trie's fullscreen fit/zoom + bounded-scroll off the trie-only
  `[data-method-section="tree-trie"]` selectors into a reusable **marker-class convention**
  (`.vizfit-host` / `.vizfit-scroll`, card markers `viz-fit` / `viz-fit-svg`) + **VizKit helpers**
  (`fitFocusSize(scrollEl,natW,natH)→{w,h}`, `observeFocusFit`, `markFocusFit`). Refactor the trie
  onto it (behaviour parity; trie tests stay green). Nothing user-visible changes. **DONE — PR on
  branch `feat/vizfit-shared-mechanism`.**

> **⚠ Phase-0 review finding (affects threaded + game-tree fit):** `fitFocusSize` + the `viz-fit-svg`
> path are validated only for the trie's shape — a **single `<svg>` with a `viewBox`** whose content
> scales when its `width`/`height` change. Threaded and game-tree are NOT that shape: each is a
> fixed-coordinate `.th-stage`/`.gt-stage` mixing a `100%×100%` (no-viewBox) SVG edge layer with an
> **absolutely-positioned HTML node overlay** (`left/top` px). `fitFocusSize`'s `{w,h}` has no single
> scalable root to apply to. So their Phase-1 sub-project must either (a) `transform: scale()` the
> whole stage (a `viz-fit`-style wrapper zoom on the stage, cheap, blurs slightly), or (b) rewrite the
> stage as a real viewBox SVG (nodes as `<circle>`+`<text>` instead of HTML) so `fitFocusSize` applies
> crisply — decide per viz in its brainstorm. The `viz-fit` (bounded + wrapper-zoom) path — used by
> tgb/dsu/catalan — is fully proven and needs only the two marker classes.
>
> **Mechanism contract for Phase-1 authors:** (1) `.vizfit-host` must be a DIRECT child of
> `#dynamic-viz-host` (the flex chain depends on the adjacency). (2) `fitFocusSize` derives available
> height by summing the heights of `.vizfit-scroll`'s **later DOM siblings** — so all pinned
> chrome-below (VCR strip, status/msg) must be later siblings of `.vizfit-scroll` in the same parent.
> (3) card markers are added, never removed — safe because `renderMethodSections` rebuilds a fresh
> card per mode switch; don't rely on markers persisting.
- **Phase 1 — per-viz application**, in this order (simple→complex): `tree-threaded` → `game-tree`
  → `tree-catalan` (layout-only, quick) → `tree-general-binary` → `tree-dsu` (redesign, largest).

## Program-wide conventions (from [[dsvisual-viz-authoring]] / [[dsvisual-vcr-frame-controls]] / [[dsvisual-fullscreen-focus-mode]])

- VCR `buildFrameControls` for stepping; `codeDrawer:true`; Traditional-zh bilingual; honest per-frame
  rendering; `ExamplesStore` trio (duplicated per-viz, NOT refactored) + inline difficulty
  auto-injected next to any `.ex-select` (already generic); a pure `randomInput(difficulty)` per
  module; run FULL Playwright before each merge.
- The inline per-viz difficulty selector already auto-appears beside any `.ex-select` (two-tier
  difficulty work) — so a viz gets it for free once it renders an `.ex-select`.
- e2e assert robust locators (counts / values / bounding-rect geometry / SVG width attr / step
  count) — never SVG edge visibility; capture any exact fit size only after it stabilises.

## Out of scope

- Per-SVG drawing-only zoom for the dual-panel (tgb) / HTML-forest (dsu) / gallery (catalan) viz —
  they use whole-wrapper zoom in fullscreen (their structure doesn't support a single-SVG fit).
- Examples/random for Catalan.
- Touching any viz not in the five.

## Success criteria

The five viz present like the trie to the extent their structure allows (per the table): all get
hidden code + bounded scroll + a fullscreen that keeps the VCR operable + working zoom; four get
editable input + examples + a difficulty-aware 🎲 (DSU via an op-sequence redesign); Catalan gets the
layout treatment only. Built on one shared vizfit mechanism (trie migrated onto it). Each phase is a
review-passed PR; full Playwright green throughout.
