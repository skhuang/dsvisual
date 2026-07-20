# Extract design patterns from app.js into a data-driven registry — design

- Date: 2026-07-20
- Repo: `/Users/skhuang/course/dsvisual`
- Follow-up to the category-scoped pattern menu (PR #146). Precursor context + footprint:
  [[dsvisual-patterns-app-js-refactor]]. Architecture reference: [[dsvisual-viz-authoring]].

## Motivation

The design-pattern visualizer is the ONE visualizer never migrated to the `js/viz/` +
`VizRegistry`/`VizKit` seam — it lives entirely in `app.js` (~600–700 lines, ≈22% of
~2966). Each pattern today is 4 scattered pieces: a static `.pattern-view` div in
`index.html`, a hand-coded `renderPatternXxx()` (~50–100 lines of `createElementNS`), a
`visualizePattern` narration case, and entries in dispatch/activation/`<select>`/code_db.
Adding the full GoF catalog (23) this way would add thousands of lines. Goal: a
**data-driven registry** so adding a pattern is **one descriptor (+ one cpp file)**, and
app.js stops growing per pattern.

## Decisions (approved)

- **Hybrid rendering:** a generic declarative diagram renderer is the DEFAULT; an optional
  per-pattern `render(svg)` escape hatch overrides it for bespoke diagrams.
- **Scope of THIS project:** build the architecture, **migrate the existing 11**, and
  **author 3 new iconic GoF patterns** (one per GoF category): **Builder** (Creational),
  **Composite** (Structural, via the escape hatch — validates that path), **Command**
  (Behavioral). Filling out the rest of GoF is cheap follow-on content, out of scope here.
- **Keep the 4 categories** (GoF creational/structural/behavioral + the non-GoF
  architectural styles MVC/Layered/Pub-Sub/Pipe-Filter/DI). Narration stays **English-only**
  (pattern UI is not i18n-wired; i18n is separate).
- **Low-risk migration:** the existing 11 are moved by **relocating each `renderPatternXxx`
  body verbatim into its descriptor's `render` escape hatch** (and its narration case into
  `narration[]`) — NO visual rewrite, so no regression. The declarative path is proven by
  the 3 new patterns only.

## Target architecture

### 1. Pattern registry — `js/patterns_db.js` (new)

Dual-export IIFE (window + module.exports), an array `PATTERNS`, one descriptor each:

```js
{
  id: 'pattern-builder',            // matches METHOD_GROUPS method id
  category: 'patterns-creational',  // one of the 4 pattern group ids
  title: 'Builder',                 // nav/menu title
  label: 'Builder - Step-by-step construction', // #pattern-mode-select option label
  cpp: 'pattern_builder.cpp',       // code drawer source (cpp/ + build_db)
  diagram: {                        // declarative default (ignored if `render` set)
    nodes: [{ id, x, y, w, h, label, members: [..], color }],
    edges: [{ from, to, label }],   // from/to are node ids; arrow drawn center→center
  },
  narration: [{ text, color }, ...],// "Visualize Pattern" demo steps (fixed ~600ms delay)
  render: null,                     // optional fn(svg) — escape hatch, overrides `diagram`
}
```

Helper exports on the api: `patternsByCategory(catId)`, `getPattern(id)`.

### 2. Generic renderer — `js/viz/viz_pattern.js` (new)

- `drawDiagram(svg, diagram)` — clears the svg, draws each `node` as a labelled box with
  optional `members[]` lines, each `edge` as an arrow between node centers with an optional
  label. Generalizes the current inline `createArrow` / box-drawing code (moved out of
  app.js). Namespaced SVG (`createElementNS`).
- `playNarration(steps)` — the generic demo player (`showStatus(step.text, step.color)` +
  delay), replacing the per-pattern `visualizePattern` cases.
- `render(host)` — resolves the active pattern descriptor; renders a title + one `<svg>`
  into the shared host; if `descriptor.render` is set calls it, else `drawDiagram`. Wires
  the "Visualize Pattern" / "Reset" buttons to `playNarration(descriptor.narration)` /
  re-render.
- Registered via `global.VizRegistry.attach('pattern', { render, code, layout })` — one
  registration for ALL patterns (they share `visualizer: 'pattern'` in METHOD_GROUPS).

### 3. Data-driven wiring (remove per-pattern duplication)

- **METHOD_GROUPS**: the 4 pattern groups' `methods` arrays are **generated from
  `PATTERNS`** (`patternsByCategory(catId).map(p => ({id, title, file: p.cpp, visualizer:
  'pattern', controls: 'pattern'}))`). Adding a descriptor auto-adds the nav method + the
  overview tile + the category-scoped `<select>` entry (the scoped-menu logic from PR #146
  now sourced from the registry).
- **code_db**: the `id → codeVar` mapping is derived from `PATTERNS` (`p.cpp`); the pattern
  `cpp/*.cpp` files go through the standard `build_db.js` pipeline like every other viz.
- **index.html**: DELETE the 11 static `.pattern-view` divs and the hardcoded `<select>`
  options; keep ONE shared pattern host the renderer fills (the scoped select is already
  dynamic since PR #146 — now populated from the registry). Keep the `#pattern-actions`
  buttons.

### 4. app.js removals

Remove: `renderPattern` + all 11 `renderPatternXxx`, `visualizePattern` + its cases, the
per-pattern `if/else` chain in the activation branch (the generic `pattern` visualizer path
replaces it), the `codePattern*` code_db mapping block, and pattern SVG helpers now living
in `viz_pattern.js`. Net: app.js drops ~600–700 lines and no longer changes when a pattern
is added.

## Migration of the existing 11

For each of singleton, factory, adapter, decorator, observer, strategy, mvc, layered,
pubsub, pipefilter, di: create a descriptor whose `render` is the **verbatim body of the
old `renderPatternXxx`** (retargeted to draw into the shared host's svg instead of the old
per-pattern `pattern-<x>-svg`), and whose `narration` is the old `visualizePattern` case's
steps. `cpp`/`label`/`category`/`title` from the existing data. Visual output must be
byte-for-byte the same (verified by spot-check).

## The 3 new patterns

- **Builder** (`patterns-creational`) — declarative `diagram` (Director → Builder →
  Product boxes; step arrows) + narration + `cpp/pattern_builder.cpp`.
- **Composite** (`patterns-structural`) — `render` escape hatch (recursive tree of
  Component/Composite/Leaf boxes) + narration + `cpp/pattern_composite.cpp`.
- **Command** (`patterns-behavioral`) — declarative `diagram` (Invoker → Command →
  Receiver) + narration + `cpp/pattern_command.cpp`.

## File structure

- New: `js/patterns_db.js`, `js/viz/viz_pattern.js`, `cpp/pattern_{builder,composite,command}.cpp`.
- Modify: `js/app.js` (remove pattern code; generate pattern METHOD_GROUPS rows + code_db
  from registry), `index.html` (remove static views + static options; add shared host +
  two `<script defer>` tags for the new modules), `build_db.js` (map the 3 new cpp files),
  regenerate `js/code_db.js`.
- Tests: `tests/unit/patterns_db.test.js` (registry + derivation + `drawDiagram` shape),
  extend/keep `tests/patterns_menu.spec.js`, add `tests/patterns_registry.spec.js` (each
  pattern loads + renders svg; narration plays; a migrated pattern renders; the 3 new appear).

## Verification

- `npm run test:unit` green incl. new registry tests; `node build_db.js` regenerates only
  the added pattern code strings.
- `npm test` (FULL Playwright) green: every pattern (11 migrated + 3 new) loads with no
  console errors, renders an `<svg>`, the demo narration runs, and the category-scoped menu
  lists only the active category (now from the registry).
- Spot-check ≥2 migrated patterns render identically to pre-refactor (escape-hatch verbatim).
- `git grep -c renderPatternSingleton js/app.js` → 0 (pattern render code fully left app.js).

## Global constraints

- Concurrent refactor session — targeted `git add` of only the task's files; never
  `-A`/`.`/`-u`; `git status` first.
- Run FULL Playwright before merge. Adding the 3 new patterns DOES add overview tiles +
  METHOD_GROUPS methods → the i18n overview-tile assertion (self-updating since PR #142)
  should still pass, but verify; the `.overview-category` count (categories unchanged) must
  stay the same.
- English-only pattern narration/labels (unchanged). Never hand-edit generated `js/code_db.js`.
- Each new top-level pure module needs its own `index.html` `<script defer>` tag (pure
  module before render module, after `js/code_db.js`, before `app.js`).

## Out of scope

- Authoring GoF patterns beyond the 3 (follow-on content); rewriting the migrated 11's
  diagrams as declarative (they stay escape-hatch); i18n of pattern text; changing the 4
  categories; the nav/menu structure (only its data source moves to the registry).

## Success criteria

Patterns are a data-driven registry + one generic renderer under the standard
`VizRegistry` seam; adding a pattern is one descriptor (+ cpp file) with zero app.js
growth; the existing 11 render unchanged; Builder/Composite/Command ship (Composite via the
escape hatch); app.js has no `renderPatternXxx`/`visualizePattern` code; unit + full
Playwright green; one review-passed PR with no unrelated churn.
