# Step-able, visually-animated design-pattern UI (OOP-style) — design

- Date: 2026-07-20
- Repo: `/Users/skhuang/course/dsvisual`
- Follow-up to the patterns-registry refactor (PR #147). Makes the pattern UI work like
  the OOP visualizers: a Step/Run/Reset control where each step highlights the
  corresponding diagram element(s) — instead of today's static diagram + text-only narration.

## Problem & current state

**OOP model (target):** each mode has `OOP_STEPS[mode]` (ordered captions); every drawn
element gets `activeClass = oopActiveClass(step, [stepsItIsActiveIn])` →
`oop-step-active` (highlighted) vs `oop-step-dim` (faded); a "Step N/total" + caption
badge; `buildStepControls` (Step / Run / Reset) advances the step and re-renders.

**Patterns now (post-refactor):** `PatternViz.render(svg, descriptor)` (`js/viz/viz_pattern.js`)
draws a *static* diagram — declarative `descriptor.diagram` via `drawDiagram`, or an
escape-hatch `descriptor.render(svg)` — and the `#pattern-actions` "Visualize Pattern"
button plays `descriptor.narration` as **text-only** `showStatus` messages (`playNarration`).
No stepping, no per-step visual change.

## Decisions (approved)

- **Stepped declarative model** — a pattern opts into stepping by giving its `diagram` a
  `steps` array + per-element `active` lists. A generic step-aware renderer highlights/dims
  per step and shows a step badge, driven by `buildStepControls`.
- **Scope now: the 3 new patterns** (Builder, Command, Composite). The mechanism is generic
  so the other 11 (still escape-hatch) migrate later; they keep today's static+narration UI
  until then.
- Build via spec → plan → subagent-driven.

## Data model — `js/patterns_db.js`

Extend the declarative `diagram` (presence of `steps` ⇒ stepped):
```js
diagram: {
  nodes: [{ id, x, y, w, h, label, members?, color?, active: [0,1] }],  // step indices highlighted in
  edges: [{ from, to, label?, active: [1] }],
  steps: [{ caption: { zh, en } }, … ]
}
```
- An element with no `active` (or whose `active` includes the current step) is highlighted;
  otherwise dimmed. (Convention: omit `active` ⇒ always highlighted; `[]` ⇒ never.)
- **Builder** & **Command**: already have `diagram.nodes/edges` → add `active` + `steps`
  (step captions from the current `narration`).
- **Composite**: convert its escape-hatch `tree` `render` into a stepped declarative
  `diagram` (tree nodes/edges as data; steps highlight the recursion Composite → children →
  Leaf). Drop its `render`/`narration` in favour of `diagram` + `steps`.
- The other 11 descriptors are unchanged.

## Renderer — `js/viz/viz_pattern.js`

- `drawSteppedDiagram(svg, diagram, step)` — like `drawDiagram`, but each node/edge is drawn
  with `.pattern-step-active` or `.pattern-step-dim` per `active.includes(step)`, and a
  step badge "Step N/total" + the current caption (`K().langOf(step.caption)`) is drawn.
- Extend `render(svg, descriptor)`:
  ```
  if (descriptor.diagram && descriptor.diagram.steps) return renderStepped(svg, descriptor);
  if (descriptor.render) descriptor.render(svg);
  else if (descriptor.diagram) drawDiagram(svg, descriptor.diagram);
  ```
- `renderStepped(svg, descriptor)`: module-local step index (`_step`, `_stepFor` reset when
  the pattern id changes); `paint()` = `drawSteppedDiagram(svg, descriptor.diagram, _step)`;
  build/append **`buildStepControls`** (Step / Run / Reset via `K().buildStepControls`) into
  a `.pattern-step-controls` slot next to the svg (`svg.parentNode`), re-created per render.
  Step advances `_step` + `paint()` + `showStatus(caption)`; Run auto-advances (the delay
  arg); Reset → `_step=0`.
- Export `drawSteppedDiagram` on `PatternViz` (for testing/reuse). `narration`/`playNarration`
  stay for the still-static 11.

## app.js integration

In the pattern activation branch (`currentMode.includes('pattern-')`): after resolving the
descriptor `p`, if `p.diagram && p.diagram.steps` (stepped) → **hide the `#pattern-actions`
"Visualize Pattern"/"Reset" buttons** (the renderer's Step/Run/Reset in the host replaces
them); else show them as today. `btnPatternDemo`'s narration handler is unchanged (only
reached by non-stepped patterns now). The registerBehaviors loop (`PatternViz.render(svg,p)`)
is unchanged — `render` internally dispatches to the stepped path.

## CSS — `style.css`

Add `.pattern-step-active` (full opacity / emphasized stroke) and `.pattern-step-dim`
(reduced opacity) applied to the stepped diagram's `rect`/`line`/`text`, plus a step-badge
text style. Do not touch OOP's `.oop-step-*` classes.

## Tests

e2e (`tests/pattern_step.spec.js`): for each of `pattern-builder`, `pattern-command`,
`pattern-composite`: load it, assert `.pattern-step-controls` (Step/Run/Reset) is present
and the legacy Visualize button is hidden; the step badge shows "Step 1/N"; click **Step**
→ the badge advances to "Step 2/N", the caption text changes, and at least one diagram
node gains `.pattern-step-active` while another is `.pattern-step-dim`; **Reset** returns to
step 1. Confirm the other 11 patterns still render (static) with their Visualize button.

## Verification

- `npm run test:unit` green.
- `npm test` (FULL Playwright) green incl. the new stepping e2e + no regression to the
  11 static patterns, the scoped menu (PR #146), and smoke_modes.
- Browser spot-check: step through Builder/Command/Composite in zh and en.

## Global constraints

- Concurrent refactor session — targeted `git add` only; never `-A`/`.`/`-u`.
- No METHOD_GROUPS/category change ⇒ i18n count assertions untouched.
- Bilingual step captions `{zh,en}`; run FULL Playwright before merge; one branch + PR.
- Slides decks (`slides_db.js`) are a SEPARATE concern — not touched here.

## Out of scope

- Migrating the other 11 patterns to stepped diagrams (follow-on batches);
  changing the OOP visualizers; the slide decks; the recorded singleton/other follow-ups.

## Success criteria

Builder, Command, and Composite present an OOP-style stepped UI — Step/Run/Reset controls
where each step highlights the corresponding diagram element(s) with a "Step N/total" +
bilingual caption; the generic mechanism lives in the registry/renderer so the remaining
11 can migrate by adding `steps`+`active` data; the 11 still-static patterns are unchanged;
unit + full Playwright green; one review-passed PR.
