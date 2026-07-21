# Step-able, visually-animated pattern UI (OOP-style) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Builder, Command, and Composite present an OOP-style stepped UI — Step/Run/Reset controls where each step highlights the corresponding diagram element(s) — via a generic stepped-declarative mechanism in the pattern renderer/registry.

**Architecture:** Extend the declarative `diagram` with `steps: [{caption:{zh,en}}]` + per-element `active:[stepIdx]`. `viz_pattern.js` gains `drawSteppedDiagram` + a `renderStepped` path (with `buildStepControls`); `render` dispatches to it when `diagram.steps` exists. app.js hides the legacy "Visualize" button for stepped patterns. The other 11 patterns are unchanged.

**Tech Stack:** Vanilla JS, `VizRegistry`/`VizKit` (`K().buildStepControls`, `showStatus`, `langOf`), Playwright.

## Global Constraints

- Concurrent refactor session — `git add` only each task's files by path; never `-A`/`.`/`-u`; `git status` first.
- No METHOD_GROUPS/category change ⇒ i18n count assertions untouched.
- Bilingual `{zh,en}` step captions. Run FULL Playwright before merge.
- Do NOT touch the OOP visualizers or the `.oop-step-*` CSS. Do NOT touch `slides_db.js`/slides.
- The other 11 patterns keep their current static+narration UI (unchanged).

## Convention

`active` on a node/edge = the list of step indices in which it is **highlighted**; omit
`active` ⇒ always highlighted. A diagram is "stepped" iff it has a `steps` array.

---

### Task 1: Step mechanism + CSS + app.js wiring + convert Builder

**Files:**
- Modify: `js/viz/viz_pattern.js` (add `drawSteppedDiagram`, `renderStepped`; extend `render`; export)
- Modify: `style.css` (step classes)
- Modify: `js/app.js` (hide legacy buttons for stepped patterns)
- Modify: `js/patterns_db.js` (convert `pattern-builder` to a stepped diagram)
- Test: `tests/pattern_step.spec.js` (new)

**Interfaces:** Produces `PatternViz.render` routing `diagram.steps` decks to a stepped path with `.pattern-step-controls` + `.pattern-step-active`/`.pattern-step-dim` + a `.pattern-step-badge`.

- [ ] **Step 1: Write the failing e2e** — `tests/pattern_step.spec.js`:

```js
const { test, expect } = require('@playwright/test');
const path = require('path');
const FILE_URI = 'file://' + path.resolve(__dirname, '../index.html');

test.describe('design patterns are step-able with visual highlighting', () => {
  test('pattern-builder steps and highlights', async ({ page }) => {
    await page.goto(FILE_URI + '#m=pattern-builder');
    const controls = page.locator('.pattern-step-controls');
    await expect(controls).toBeVisible();
    await expect(page.locator('#btn-pattern-demo')).toBeHidden();
    const badge = page.locator('#pattern-svg .pattern-step-badge');
    await expect(badge).toContainText('Step 1/');
    await expect(page.locator('#pattern-svg .pattern-step-active').first()).toBeVisible();
    await expect(page.locator('#pattern-svg .pattern-step-dim').first()).toBeVisible();
    await controls.locator('[data-action="step"]').click();
    await expect(badge).toContainText('Step 2/');
    await controls.locator('[data-action="reset"]').click();
    await expect(badge).toContainText('Step 1/');
  });

  test('a non-stepped pattern keeps its Visualize button', async ({ page }) => {
    await page.goto(FILE_URI + '#m=pattern-singleton');
    await expect(page.locator('#btn-pattern-demo')).toBeVisible();
    await expect(page.locator('.pattern-step-controls')).toHaveCount(0);
  });
});
```

- [ ] **Step 2: Run it, confirm it fails**

Run: `npx playwright test tests/pattern_step.spec.js`
Expected: FAIL — no `.pattern-step-controls` (mechanism absent; builder not yet stepped).

- [ ] **Step 3: Add the step mechanism to `js/viz/viz_pattern.js`** — after `drawDiagram` (before `tree`), add:

```js
  const STEP_ACTIVE = 'pattern-step-active', STEP_DIM = 'pattern-step-dim';
  function stepCls(active, step) { return (!active || active.indexOf(step) !== -1) ? STEP_ACTIVE : STEP_DIM; }
  function drawSteppedDiagram(svg, diagram, step) {
    svg.innerHTML = ''; defsArrow(svg);
    const byId = {}; (diagram.nodes || []).forEach((n) => { byId[n.id] = n; });
    (diagram.edges || []).forEach((e) => {
      const a = byId[e.from], b = byId[e.to]; if (!a || !b) return;
      const cls = stepCls(e.active, step);
      const x1 = a.x + a.w / 2, y1 = a.y + a.h / 2, x2 = b.x + b.w / 2, y2 = b.y + b.h / 2;
      svg.appendChild(el('line', { x1, y1, x2, y2, class: cls, stroke: '#94a3b8', 'stroke-width': 2, 'marker-end': 'url(#pattern-arrow)' }));
      if (e.label) { const t = el('text', { x: (x1 + x2) / 2, y: (y1 + y2) / 2 - 4, 'font-size': 11, fill: '#cbd5e1', 'text-anchor': 'middle', class: cls }); t.textContent = e.label; svg.appendChild(t); }
    });
    (diagram.nodes || []).forEach((n) => {
      const cls = stepCls(n.active, step);
      svg.appendChild(el('rect', { x: n.x, y: n.y, width: n.w, height: n.h, rx: 8, fill: n.color || '#334155', stroke: '#0f172a', 'stroke-width': 2, class: cls }));
      const title = el('text', { x: n.x + n.w / 2, y: n.y + 20, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 'bold', fill: 'white', class: cls }); title.textContent = n.label; svg.appendChild(title);
      (n.members || []).forEach((m, i) => { const t = el('text', { x: n.x + 10, y: n.y + 40 + i * 16, 'font-family': 'monospace', 'font-size': 11, fill: 'rgba(255,255,255,0.85)', class: cls }); t.textContent = m; svg.appendChild(t); });
    });
    const steps = diagram.steps || [];
    const badge = el('text', { x: 12, y: 18, 'font-size': 12, 'font-weight': 'bold', fill: '#94a3b8', class: 'pattern-step-badge' });
    badge.textContent = 'Step ' + (step + 1) + '/' + steps.length; svg.appendChild(badge);
    const cap = el('text', { x: 250, y: 308, 'text-anchor': 'middle', 'font-size': 12, fill: '#cbd5e1', class: 'pattern-step-caption' });
    cap.textContent = steps[step] ? K().langOf(steps[step].caption) : ''; svg.appendChild(cap);
  }
  let _step = 0, _stepFor = null;
  function renderStepped(svg, descriptor) {
    if (_stepFor !== descriptor.id) { _step = 0; _stepFor = descriptor.id; }
    const steps = descriptor.diagram.steps || [];
    if (_step > steps.length - 1) _step = 0;
    function paint() { drawSteppedDiagram(svg, descriptor.diagram, _step); }
    paint();
    const host = svg.parentNode; if (!host) return;
    let slot = host.querySelector('.pattern-step-controls'); if (slot) slot.remove();
    slot = document.createElement('div'); slot.className = 'pattern-step-controls';
    slot.appendChild(K().buildStepControls(
      () => { if (_step < steps.length - 1) { _step++; paint(); K().showStatus(K().langOf(steps[_step].caption), '#6366f1'); return _step < steps.length - 1; } return false; },
      () => { _step = 0; paint(); K().showStatus(K().langOf(steps[0].caption), '#6366f1'); },
      900));
    host.appendChild(slot);
  }
```

Replace the existing `render` with:
```js
  function render(svg, descriptor) {
    if (!descriptor) return;
    const host = svg.parentNode;
    if (descriptor.diagram && descriptor.diagram.steps) { renderStepped(svg, descriptor); return; }
    if (host) { const slot = host.querySelector('.pattern-step-controls'); if (slot) slot.remove(); }
    if (typeof descriptor.render === 'function') descriptor.render(svg);
    else if (descriptor.diagram) drawDiagram(svg, descriptor.diagram);
  }
```
And add `drawSteppedDiagram` to the `PatternViz` export.

- [ ] **Step 4: CSS** — append to `style.css`:
```css
.pattern-step-active { opacity: 1; }
.pattern-step-dim { opacity: 0.3; }
.pattern-step-controls { margin-top: 10px; display: flex; justify-content: center; }
```

- [ ] **Step 5: app.js — hide legacy buttons for stepped patterns.** In the `else if (currentMode.includes('pattern-'))` activation branch, after `document.getElementById('pattern-title').textContent = p.label;`, add:
```js
            const stepped = !!(p.diagram && p.diagram.steps);
            btnPatternDemo.style.display = stepped ? 'none' : '';
            if (typeof btnPatternReset !== 'undefined' && btnPatternReset) btnPatternReset.style.display = stepped ? 'none' : '';
```
(Confirm the `btnPatternReset` reference name near `btnPatternDemo` ~app.js:1390; use whatever the existing const is. Keep `#pattern-mode-select` visible.)

- [ ] **Step 6: Convert `pattern-builder` in `js/patterns_db.js`.** Read the existing `SLIDES?`… no — read the existing `pattern-builder` descriptor in `js/patterns_db.js` (its `diagram.nodes`/`edges` ids + `narration`). Extend its `diagram`:
  - Add `steps: [{caption:{zh,en}}, …]` — one per narration step, bilingual (author zh from the existing English narration).
  - Add `active: [stepIdx…]` to each node and edge so the highlight walks the participants across steps (e.g. Director node active in the "director drives" + final steps; Builder node active throughout the buildPartA/B/getResult steps; Product node active from the getResult step; the Director→Builder edge with the Director steps, the Builder→Product edge with the getResult step).
  - Remove the now-superseded `narration` field from `pattern-builder` (the `steps` captions replace it).
  Use the ACTUAL node ids present in the descriptor (don't assume). Keep `id/category/title/label/cpp`.

- [ ] **Step 7: Run the e2e, confirm pass**

Run: `npx playwright test tests/pattern_step.spec.js`
Expected: PASS (builder steps; singleton keeps its Visualize button).

- [ ] **Step 8: Commit**
```bash
git add js/viz/viz_pattern.js style.css js/app.js js/patterns_db.js tests/pattern_step.spec.js
git commit -m "feat(dsvisual): step-able pattern renderer + Builder stepped diagram"
```

---

### Task 2: Convert Command to a stepped diagram

**Files:** Modify `js/patterns_db.js`; extend `tests/pattern_step.spec.js`.

- [ ] **Step 1: Extend the e2e** — add a test mirroring the builder one for `pattern-command` (controls visible, `#btn-pattern-demo` hidden, badge `Step 1/`→`Step 2/` on Step, active+dim present, Reset → `Step 1/`).

- [ ] **Step 2: Run it, confirm it fails** (`pattern-command` not yet stepped).

- [ ] **Step 3: Convert `pattern-command`** — same recipe as Builder Step 6, on the existing `pattern-command` descriptor: add `steps` (bilingual captions from its narration) + per-element `active` so the highlight walks Invoker → Command → Receiver (and the undo/history step if present); remove `narration`. Use the actual node ids.

- [ ] **Step 4: Run the e2e, confirm pass** (`npx playwright test tests/pattern_step.spec.js`).

- [ ] **Step 5: Commit**
```bash
git add js/patterns_db.js tests/pattern_step.spec.js
git commit -m "feat(dsvisual): Command stepped diagram"
```

---

### Task 3: Convert Composite (escape-hatch → stepped declarative)

**Files:** Modify `js/patterns_db.js`; extend `tests/pattern_step.spec.js`.

- [ ] **Step 1: Extend the e2e** — add a `pattern-composite` test mirroring the others.

- [ ] **Step 2: Run it, confirm it fails** (`pattern-composite` still uses its escape-hatch `render`, no steps).

- [ ] **Step 3: Convert `pattern-composite`.** It currently has an escape-hatch `render` (a `PatternVizDraw.tree(...)` call) and `narration`. Replace with a declarative stepped `diagram`:
  - `nodes`: the tree as positioned boxes — a root Composite, a Leaf child, a nested Composite with two Leaf children (mirror the escape-hatch tree). Give each `{id,x,y,w,h,label,color}` (lay out by hand; the svg is ~500×320; root near top-center, children below).
  - `edges`: parent→child links (`{from,to}`).
  - `steps` (bilingual) + per-node/edge `active` so the highlight walks the recursion: e.g. step 0 root Composite; step 1 recurse into children (edges + children active); step 2 Leaf.operation() (leaves active); step 3 uniform treatment (all active).
  - Remove the `render` and `narration` fields.

- [ ] **Step 4: Run the e2e, confirm pass.**

- [ ] **Step 5: Commit**
```bash
git add js/patterns_db.js tests/pattern_step.spec.js
git commit -m "feat(dsvisual): Composite stepped diagram (declarative)"
```

---

### Task 4: Full verification

- [ ] **Step 1: Unit** — `npm run test:unit` → green (patterns_db still parses; registry intact).

- [ ] **Step 2: Full Playwright** — `npm test` → green: the 3 new stepping tests pass; the 11 static patterns still render with their Visualize button; the category-scoped menu (PR #146), smoke_modes, and OOP visualizers are unaffected (no `.oop-step-*` regression).

- [ ] **Step 3: Browser spot-check (note in report).** Serve the site; load `#m=pattern-builder`, `#m=pattern-command`, `#m=pattern-composite`; confirm Step/Run/Reset present, each Step highlights the right element(s) and advances the badge/caption; toggle language → captions render in zh. (If no browser, rely on the e2e + state checks and say so.)

- [ ] **Step 4: Commit (if Step 3 or any polish produced changes; otherwise skip).**

---

## Self-Review

- **Spec coverage:** mechanism + CSS + app.js + Builder (Task 1); Command (Task 2); Composite incl. escape-hatch→declarative conversion (Task 3); full verify (Task 4). All spec sections covered.
- **Placeholder scan:** mechanism/CSS/app.js/e2e are complete code; the per-pattern conversions are precise instructions against the ACTUAL existing descriptors (node ids read at implementation time, not assumed) + explicit step/active mapping guidance — concrete, not hand-waved.
- **Type consistency:** `render` dispatches on `descriptor.diagram.steps`; `drawSteppedDiagram(svg, diagram, step)` reads `diagram.nodes/edges/steps` and each element's `active`; `renderStepped` uses `K().buildStepControls(stepFn, resetFn, delay)` (same signature OOP/gc-memory use) and `K().langOf(step.caption)`; e2e selectors (`.pattern-step-controls`, `.pattern-step-active/dim`, `.pattern-step-badge`, `[data-action="step"|"reset"]`) match what the mechanism emits.
