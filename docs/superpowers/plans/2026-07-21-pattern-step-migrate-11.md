# Migrate the other 11 patterns to stepping — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the remaining 11 design patterns from escape-hatch `render(svg)` + narration to the stepped declarative diagram model (from PR #149), so all 14 patterns share the OOP-style Step/Run/Reset UX.

**Architecture:** Per pattern, replace `render`/`narration` in its `js/patterns_db.js` descriptor with a declarative `diagram` = `{nodes:[{id,x,y,w,h,label,members?,color?,active:[…]}], edges:[{from,to,label?,active:[…]}], steps:[{caption:{zh,en}}]}`. The renderer (`viz_pattern.js`) already dispatches `diagram.steps` decks to the stepped path — no mechanism change (except a Task-4 dead-code removal).

**Tech Stack:** Vanilla JS data; Playwright.

## Global Constraints

- Concurrent refactor session — `git add` only each task's files by path; never `-A`/`.`/`-u`; `git status` first.
- No METHOD_GROUPS/category change ⇒ i18n count assertions untouched. Run FULL Playwright before merge.
- Do NOT touch app.js, style.css, slides, the OOP visualizers, or the 3 already-stepped patterns (builder/command/composite).

## Conversion recipe (every pattern)

1. READ the pattern's current escape-hatch `render` body in `js/patterns_db.js` for geometry — its box coordinates → `nodes` (`{id,x,y,w,h,label,members?,color?}`), its arrows → `edges` (`{from,to,label?}`). Keep the same layout/colors where sensible.
2. **Non-collinear:** ensure connected nodes don't share an exact x- OR y-center (offset ~20px+) so edges aren't zero-bbox lines.
3. Add `steps:[{caption:{zh,en}}]` (author captions from the existing English `narration`, translated to **Traditional Chinese** — NO Simplified characters) and per-node/edge `active:[stepIdx]` for an **honest** highlight walk (element lights up in the step where it participates).
4. Remove the descriptor's `render` and `narration`. Keep `id/category/title/label/cpp`.
5. Self-check before commit: `node -e "require('./js/patterns_db.js')"` parses; grep your new zh captions for Simplified chars (e.g. `[产构挥驱换个应对请执发调复观关递归执行树节结绍继类别设务]`) → zero hits.

## e2e model (parametrized — set up in Task 1, appended by later tasks)

Task 1 refactors `tests/pattern_step.spec.js` to a single parametrized loop over a `STEPPED`
id array, asserting for each: `.pattern-step-controls` visible, `#btn-pattern-demo` hidden,
badge `Step 1/`, an active + a dim `#pattern-svg rect`, click `[data-action="step"]` →
badge `Step 2/`, `[data-action="reset"]` → `Step 1/`. Each later task appends its ids to
`STEPPED`. (The old per-pattern test blocks + the "non-stepped keeps its Visualize button"
test are removed — after this project no pattern is non-stepped, so that assertion has no
valid target; the non-stepped render path is unchanged legacy code.)

---

### Task 1: Creational — singleton, factory (+ e2e refactor + whitelist removal)

**Files:** `js/patterns_db.js`, `tests/pattern_step.spec.js`, `tests/patterns_registry.spec.js`

- [ ] **Step 1: Refactor the e2e to a parametrized loop.** Rewrite `tests/pattern_step.spec.js` as:
```js
const { test, expect } = require('@playwright/test');
const path = require('path');
const FILE_URI = 'file://' + path.resolve(__dirname, '../index.html');
const STEPPED = ['pattern-builder', 'pattern-command', 'pattern-composite', 'pattern-singleton', 'pattern-factory'];
for (const id of STEPPED) {
  test(`${id} is step-able with visual highlighting`, async ({ page }) => {
    await page.goto(FILE_URI + '#m=' + id);
    const controls = page.locator('.pattern-step-controls');
    await expect(controls).toBeVisible();
    await expect(page.locator('#btn-pattern-demo')).toBeHidden();
    const badge = page.locator('#pattern-svg .pattern-step-badge');
    await expect(badge).toContainText('Step 1/');
    await expect(page.locator('#pattern-svg rect.pattern-step-active').first()).toBeVisible();
    await expect(page.locator('#pattern-svg rect.pattern-step-dim').first()).toBeVisible();
    await controls.locator('[data-action="step"]').click();
    await expect(badge).toContainText('Step 2/');
    await controls.locator('[data-action="reset"]').click();
    await expect(badge).toContainText('Step 1/');
  });
}
```

- [ ] **Step 2: Run it, confirm singleton/factory fail** — `npx playwright test tests/pattern_step.spec.js` (builder/command/composite pass; singleton/factory fail — not yet stepped).

- [ ] **Step 3: Convert `pattern-singleton`** per the recipe. Participants: the Singleton class box + its unique instance box (+ arrow). Steps (Traditional zh): getInstance() called → instance is null, construct → stored in static member → subsequent getInstance() returns the same instance. `active` walks class → instance. (Its former buggy hand-render is dropped.)

- [ ] **Step 4: Convert `pattern-factory`** per the recipe. Participants: Factory + Product interface + concrete products (from its render body, e.g. Car/Bike). Steps: createVehicle("car") → Car; createVehicle("bike") → Bike; client depends on the interface.

- [ ] **Step 5: Remove the singleton console-error whitelist** in `tests/patterns_registry.spec.js` — the `.filter(e => !e.includes('130 + i*18'))` (or similar) that tolerated singleton's old render bug; make it assert `errors` is empty (the bug is gone with the declarative conversion). Verify the whole-registry test still passes.

- [ ] **Step 6: Run e2e + registry** — `npx playwright test tests/pattern_step.spec.js tests/patterns_registry.spec.js` → all green.

- [ ] **Step 7: Commit**
```bash
git add js/patterns_db.js tests/pattern_step.spec.js tests/patterns_registry.spec.js
git commit -m "feat(dsvisual): step Creational patterns (singleton, factory); drop singleton render bug"
```

---

### Task 2: Structural — adapter, decorator

**Files:** `js/patterns_db.js`, `tests/pattern_step.spec.js`

- [ ] **Step 1: Append to `STEPPED`** in `tests/pattern_step.spec.js`: `'pattern-adapter', 'pattern-decorator'`.
- [ ] **Step 2: Run, confirm the two fail.**
- [ ] **Step 3: Convert `pattern-adapter`** — Client / Target interface / Adapter / Adaptee(legacy). Steps: client calls Target.request() → Adapter → adaptee.legacy(). Traditional zh.
- [ ] **Step 4: Convert `pattern-decorator`** — Component / ConcreteComponent / Decorator(s). Steps: base component → wrap with decorator A → wrap with B → call chains through wrappers. Traditional zh.
- [ ] **Step 5: Run e2e** → green.
- [ ] **Step 6: Commit** — `feat(dsvisual): step Structural patterns (adapter, decorator)` (stage `js/patterns_db.js tests/pattern_step.spec.js`).

---

### Task 3: Behavioral — observer, strategy

**Files:** `js/patterns_db.js`, `tests/pattern_step.spec.js`

- [ ] **Step 1: Append to `STEPPED`**: `'pattern-observer', 'pattern-strategy'`.
- [ ] **Step 2: Run, confirm the two fail.**
- [ ] **Step 3: Convert `pattern-observer`** — Subject + Observers. Steps: observers subscribe → subject state changes → notify() → each observer updates. Traditional zh.
- [ ] **Step 4: Convert `pattern-strategy`** — Context + Strategy interface + concrete strategies. Steps: set strategy → context delegates → switch strategy at runtime. Traditional zh.
- [ ] **Step 5: Run e2e** → green.
- [ ] **Step 6: Commit** — `feat(dsvisual): step Behavioral patterns (observer, strategy)`.

---

### Task 4: Architectural — mvc, layered, pubsub, pipefilter, di (+ dead-helper cleanup)

**Files:** `js/patterns_db.js`, `tests/pattern_step.spec.js`, `js/viz/viz_pattern.js`

- [ ] **Step 1: Append to `STEPPED`**: `'pattern-mvc','pattern-layered','pattern-pubsub','pattern-pipefilter','pattern-di'`.
- [ ] **Step 2: Run, confirm the five fail.**
- [ ] **Step 3–7: Convert each** per the recipe (these use `drawOop*` today — reauthor as standard declarative nodes):
  - **mvc** — Model / View / Controller. Steps: user input → Controller → updates Model → Model notifies View → View reads Model.
  - **layered** — Presentation / Business / Data. Steps: request flows down each layer.
  - **pubsub** — Publisher / EventBus / Subscribers. Steps: publish → bus → fan-out to subscribers.
  - **pipefilter** — Input → filter chain → Output. Steps: data transformed through each filter.
  - **di** — Composition root / Service interface / Consumer. Steps: root creates concrete Service → injected into Consumer → Consumer depends only on the abstraction.
  Traditional zh; non-collinear; honest active.
- [ ] **Step 8: Remove dead OOP helpers** from `js/viz/viz_pattern.js` — after this task no pattern descriptor uses `drawOop*`. `git grep`-confirm nothing in `viz_pattern.js` (or any descriptor's `render`) still calls `PatternVizDraw.drawOopBox/drawOopLabel/drawOopLine`, then delete `oopSvgEl`, `OOP_COLORS`, `drawOopBox`, `drawOopLabel`, `drawOopLine` and drop them from the `PatternVizDraw` export. (Leave `arrow`/`drawDiagram`/`tree`/`drawSteppedDiagram`; do NOT touch app.js's own OOP copies.)
- [ ] **Step 9: Run e2e** → green (all 14 in `STEPPED`).
- [ ] **Step 10: Commit** — `feat(dsvisual): step Architectural patterns + remove dead OOP helpers from viz_pattern` (stage `js/patterns_db.js tests/pattern_step.spec.js js/viz/viz_pattern.js`).

---

### Task 5: Full verification

- [ ] **Step 1: Unit** — `npm run test:unit` → green (`patterns_db.test.js` still holds; if it asserts anything specific about the previously-static patterns' shape, update it to match — all 14 now have `diagram`/no `render`).
- [ ] **Step 2: Simplified-char scan** — scan all pattern zh captions:
```bash
node -e 'const S=require("./js/patterns_db.js"); const re=/[产构挥驱换个应对请执发调复递归执行树节结继类别设务观关闭];/; let bad=0; S.PATTERNS.forEach(p=>(p.diagram&&p.diagram.steps||[]).forEach((s,i)=>{if(re.test(s.caption.zh)){bad++;console.log(p.id,i,s.caption.zh);}})); console.log(bad?("SIMPLIFIED FOUND: "+bad):"all Traditional");'
```
Expected: `all Traditional`.
- [ ] **Step 3: Full Playwright** — `npm test` → green: all 14 stepping tests pass; OOP visualizers unaffected; scoped menu (PR #146) + smoke_modes green.
- [ ] **Step 4: Browser spot-check (note in report)** — load 2–3 newly-migrated patterns (e.g. `pattern-observer`, `pattern-mvc`), step through, confirm per-step highlight + Traditional captions in zh and en.
- [ ] **Step 5: Commit (only if Step 1 required a unit-test update or any fix; else skip).**

---

## Self-Review

- **Spec coverage:** the 11 conversions across Tasks 1–4 by category; dead-helper cleanup (Task 4); singleton bug/whitelist (Task 1); full verify (Task 5). All spec sections covered.
- **Placeholder scan:** the shared recipe + per-pattern participant/step specifics + the parametrized e2e code are concrete; conversions are precise instructions against the ACTUAL existing render bodies (geometry read at implementation time) — content authoring, not hand-waving.
- **Type consistency:** every descriptor uses the `diagram{nodes,edges,steps}` + `active` shape the renderer's `drawSteppedDiagram`/`renderStepped` read (unchanged from PR #149); `STEPPED` ids match the `pattern-<x>` method ids; the e2e selectors match the mechanism's emitted classes.
