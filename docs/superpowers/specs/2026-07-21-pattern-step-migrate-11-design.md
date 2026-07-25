# Migrate the remaining 11 patterns to stepped diagrams — design

- Date: 2026-07-21
- Repo: `/Users/skhuang/course/dsvisual`
- Extends the step-able pattern UI (PR #149) — which converted Builder/Command/Composite —
  to the other 11 patterns. Mechanism, data model, and renderer are already in place; this
  is content conversion + a small cleanup.

## Problem

After PR #149, only 3 of 14 patterns are step-able; the other 11 still use their
escape-hatch `render(svg)` + text-only `narration`. Migrate them to the same stepped
declarative model so all patterns share one OOP-style Step/Run/Reset UX.

## Decisions (approved)

- **Stepped declarative model** for all 11 (same as PR #149): a `diagram` with
  `steps:[{caption:{zh,en}}]` + per-element `active:[stepIdx]`; remove `render`/`narration`.
- **Batch by category** into ~4 conversion tasks + 1 verification task.
- **Architectural patterns → standard declarative node look** (not the OOP-styled boxes);
  after conversion the `drawOop*`/`oopSvgEl`/`OOP_COLORS` copies in `viz_pattern.js` are
  dead and removed (app.js keeps its own copies for the OOP visualizers — untouched).

## Conventions (from PR #149 reviews — binding)

- zh captions **Traditional Chinese (zh-Hant)** — NO Simplified. (Task-1 of #149 shipped
  Simplified and it slipped a review; every conversion + review must check this.)
- **Honest** `active` mapping — an element highlights in the step where it actually
  participates; never distort to satisfy a test.
- **Non-collinear** edges — connected nodes must not share an exact x- or y-center (a
  zero-bbox `<line>` renders hidden). Offset ~20px+.
- Mirror the shape of the converted Builder/Command/Composite descriptors in
  `js/patterns_db.js`; reuse each pattern's EXISTING escape-hatch render body for the
  diagram geometry (box coordinates → nodes, arrows → edges), then author the
  step/active/caption layer.
- e2e per pattern in `tests/pattern_step.spec.js` mirrors the existing ones (rect-scoped
  `#pattern-svg rect.pattern-step-active`/`.pattern-step-dim`, controls visible,
  `#btn-pattern-demo` hidden, badge `Step 1/`→`Step 2/`, reset → `Step 1/`).

## Per-pattern content (GoF-accurate participants + step story)

- **singleton** — one Singleton class + its unique instance. Steps: getInstance() called →
  instance null, construct → stored in static → subsequent calls return same. **Converting
  removes the known escape-hatch SVG bug** (`y:'130 + i*18'`), so Task 1 also drops the
  `patterns_registry.spec.js` whitelist for that message (assert `errors == []`).
- **factory** — Factory + Product interface + concrete products (Car/Bike/…). Steps:
  createVehicle("car") → returns Car; createVehicle("bike") → returns Bike; client depends
  on interface.
- **adapter** — Client / Target interface / Adapter / Adaptee (legacy). Steps: client calls
  Target.request() → Adapter → adaptee.legacy().
- **decorator** — Component / ConcreteComponent / Decorator(s) wrapping. Steps: base
  component → wrap with decorator A → wrap with B → call chains through wrappers.
- **observer** — Subject + Observers. Steps: observers subscribe → subject state changes →
  notify() → each observer updates.
- **strategy** — Context + Strategy interface + concrete strategies. Steps: set strategy →
  context delegates → switch strategy at runtime.
- **mvc** — Model / View / Controller triangle. Steps: user input → Controller → updates
  Model → Model notifies View → View queries Model.
- **layered** — Presentation / Business / Data stack. Steps: request flows down each layer.
- **pubsub** — Publisher / EventBus / Subscribers. Steps: publish → bus → fan-out to subs.
- **pipefilter** — Input → Filter chain → Output. Steps: data through each filter.
- **di** — Composition root / Service abstraction / Consumer. Steps: root creates concrete
  Service → injected into Consumer → Consumer depends only on abstraction.

(Each pattern's node coordinates come from reading its current render body; adjust to keep
edges non-collinear. Captions authored from the existing English narration, translated to
Traditional Chinese.)

## Task breakdown

1. **Creational** — singleton, factory (+ remove singleton console-error whitelist).
2. **Structural** — adapter, decorator.
3. **Behavioral** — observer, strategy.
4. **Architectural** — mvc, layered, pubsub, pipefilter, di; then remove the dead
   `drawOop*`/`oopSvgEl`/`OOP_COLORS` from `js/viz/viz_pattern.js` (verify nothing else in
   viz_pattern references them; app.js's copies stay).
5. **Full verification** — `npm run test:unit` + `npm test` (all 14 patterns step; the
   `patterns_db` unit test still holds; no OOP/menu/smoke regression) + browser spot-check
   of a couple of the newly-migrated patterns in zh + en.

## Files

- `js/patterns_db.js` — the 11 descriptor conversions.
- `js/viz/viz_pattern.js` — Task 4 only: remove dead OOP helpers.
- `tests/pattern_step.spec.js` — per-pattern stepping tests; `tests/patterns_registry.spec.js`
  — Task 1 removes the singleton whitelist.
- Do NOT touch app.js, style.css, slides, OOP viz, or the already-stepped 3.

## Verification

- Per task: focused `npx playwright test tests/pattern_step.spec.js` green for its patterns.
- Final: unit + FULL Playwright green; `node -e "require('./js/patterns_db.js')"` parses;
  a Simplified-char scan of all new zh captions is clean; browser spot-check.

## Global constraints

- Concurrent refactor session — targeted `git add` only; never `-A`/`.`/`-u`; `git status` first.
- No METHOD_GROUPS/category change ⇒ i18n count assertions untouched. Run FULL Playwright before merge. One branch + PR.

## Out of scope

- Changing the mechanism/renderer (except the Task-4 dead-helper removal); the OOP viz;
  the slide decks; the 3 already-stepped patterns.

## Success criteria

All 14 design patterns present the OOP-style stepped UI (Step/Run/Reset, per-step
highlight, Step N/total + Traditional-Chinese caption); architectural patterns render as
uniform declarative nodes; the dead OOP helpers are removed from viz_pattern.js; the
singleton escape-hatch bug is gone (whitelist removed); unit + full Playwright green; one
review-passed PR with no unrelated churn.
