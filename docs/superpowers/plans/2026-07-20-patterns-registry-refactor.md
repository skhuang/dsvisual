# Extract design patterns into a data-driven registry — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the ~600–700 lines of per-pattern code in `app.js` with a data-driven registry (`js/patterns_db.js`) + one generic renderer (`js/viz/viz_pattern.js`), so adding a pattern is one descriptor (+ one cpp file). Migrate the 11 existing patterns (verbatim, no visual change) and author 3 new GoF patterns (Builder, Composite, Command).

**Architecture:** Patterns stay on the existing `VizRegistry` + `patternContainer` + `#pattern-actions` shell (keeps the PR #146 category-scoped select). Only the guts change: a registry of descriptors, a generic renderer that draws a declarative `diagram` (or calls a per-pattern `render` escape hatch) into one shared `<svg>`, and a generic narration player. METHOD_GROUPS pattern rows + the scoped select + code lookup are derived from the registry.

**Tech Stack:** Vanilla JS dual-export IIFE; `VizRegistry`/`VizKit` seam (`K()=global.VizKit` exposes `showStatus`, `executeAnimWrapper`, `acquireDynamicVizHost`, `t`, `langOf`; `sleep` is global); `node --test`; Playwright.

## Global Constraints

- Concurrent refactor session — `git add` only each task's files by path; never `-A`/`.`/`-u`; `git status` first.
- Run FULL Playwright (`npm test`) before merge. The 3 new patterns add overview tiles + METHOD_GROUPS methods → the self-updating i18n tile-count assertion (PR #142) should still pass; the `.overview-category` count (categories unchanged = same) must not change.
- English-only pattern text (unchanged). Never hand-edit generated `js/code_db.js`.
- Each new pure module needs its own `index.html` `<script defer>` (patterns_db.js before viz_pattern.js, after `js/code_db.js`, before `app.js`).
- Migrated patterns must render byte-for-byte as before (escape-hatch = verbatim move).

## Descriptor schema (reference for all tasks)

```js
{ id:'pattern-builder', category:'patterns-creational', title:'Builder',
  label:'Builder - Step-by-step construction', cpp:'pattern_builder.cpp',
  diagram:{ nodes:[{id,x,y,w,h,label,members:[],color}], edges:[{from,to,label}] },
  narration:[{text,color}], render:null /* optional fn(svg) overriding diagram */ }
```

---

### Task 1: Registry module + generic renderer + 3 new descriptors

**Files:**
- Create: `js/patterns_db.js`, `js/viz/viz_pattern.js`
- Test: `tests/unit/patterns_db.test.js`

**Interfaces:**
- Produces: `PatternsDB` api `{ PATTERNS, patternsByCategory(catId), getPattern(id) }`; `PatternViz` with `drawDiagram(svg, diagram)`, `playNarration(steps)`, `render(svg, descriptor)`.

- [ ] **Step 1: Write failing unit test** — `tests/unit/patterns_db.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert');
const P = require('../../js/patterns_db.js');

test('registry exposes the 3 new patterns grouped by category', () => {
  assert.ok(P.getPattern('pattern-builder'));
  assert.strictEqual(P.getPattern('pattern-builder').category, 'patterns-creational');
  assert.strictEqual(P.getPattern('pattern-composite').category, 'patterns-structural');
  assert.strictEqual(P.getPattern('pattern-command').category, 'patterns-behavioral');
  // Composite uses the escape hatch; Builder/Command are declarative
  assert.strictEqual(typeof P.getPattern('pattern-composite').render, 'function');
  assert.ok(P.getPattern('pattern-builder').diagram && P.getPattern('pattern-builder').diagram.nodes.length > 0);
});

test('patternsByCategory filters', () => {
  assert.ok(P.patternsByCategory('patterns-creational').some((p) => p.id === 'pattern-builder'));
  assert.ok(!P.patternsByCategory('patterns-structural').some((p) => p.id === 'pattern-builder'));
});
```

- [ ] **Step 2: Run it, confirm it fails**

Run: `node --test tests/unit/patterns_db.test.js` → FAIL (module missing).

- [ ] **Step 3: Create `js/patterns_db.js`** with the 3 new descriptors and helpers:

```js
(function (global) {
  'use strict';
  const PATTERNS = [
    { id:'pattern-builder', category:'patterns-creational', title:'Builder',
      label:'Builder - Step-by-step construction', cpp:'pattern_builder.cpp',
      diagram:{ nodes:[
        {id:'dir',x:40,y:40,w:150,h:70,label:'Director',members:['construct()'],color:'#6366f1'},
        {id:'bld',x:250,y:40,w:170,h:90,label:'Builder',members:['buildPartA()','buildPartB()','getResult()'],color:'#ec4899'},
        {id:'prod',x:250,y:200,w:170,h:60,label:'Product',members:['parts…'],color:'#eab308'}
      ], edges:[ {from:'dir',to:'bld',label:'uses'}, {from:'bld',to:'prod',label:'builds'} ] },
      narration:[
        {text:'Director drives step-by-step construction…', color:'#6366f1'},
        {text:'builder.buildPartA()', color:'#ec4899'},
        {text:'builder.buildPartB()', color:'#ec4899'},
        {text:'product = builder.getResult()', color:'#34d399'},
        {text:'Same steps, different builders → different products', color:'#10b981'}
      ], render:null },
    { id:'pattern-command', category:'patterns-behavioral', title:'Command',
      label:'Command - Encapsulate a request', cpp:'pattern_command.cpp',
      diagram:{ nodes:[
        {id:'inv',x:40,y:60,w:150,h:70,label:'Invoker',members:['setCommand()','run()'],color:'#6366f1'},
        {id:'cmd',x:250,y:60,w:160,h:70,label:'Command',members:['execute()'],color:'#ec4899'},
        {id:'rcv',x:460,y:60,w:150,h:70,label:'Receiver',members:['action()'],color:'#eab308'}
      ], edges:[ {from:'inv',to:'cmd',label:'holds'}, {from:'cmd',to:'rcv',label:'calls'} ] },
      narration:[
        {text:'Invoker holds a Command, not a Receiver…', color:'#6366f1'},
        {text:'invoker.run() → command.execute()', color:'#ec4899'},
        {text:'command.execute() → receiver.action()', color:'#eab308'},
        {text:'Request is encapsulated as an object (queue/undo-able)', color:'#10b981'}
      ], render:null },
    { id:'pattern-composite', category:'patterns-structural', title:'Composite',
      label:'Composite - Tree of parts & wholes', cpp:'pattern_composite.cpp',
      diagram:null,
      narration:[
        {text:'Client treats leaves and composites uniformly…', color:'#6366f1'},
        {text:'Composite.operation() recurses into children', color:'#ec4899'},
        {text:'Leaf.operation() does the work', color:'#eab308'},
        {text:'Whole-part hierarchy via one Component interface', color:'#10b981'}
      ],
      render: function (svg) {
        // Escape hatch: a small component tree (Composite → {Leaf, Composite → {Leaf, Leaf}}).
        PatternVizDraw.tree(svg, {
          label:'Composite', color:'#ec4899', children:[
            { label:'Leaf', color:'#eab308' },
            { label:'Composite', color:'#ec4899', children:[
              { label:'Leaf', color:'#eab308' }, { label:'Leaf', color:'#eab308' } ] }
          ]
        });
      } }
  ];
  const byId = {}; PATTERNS.forEach((p) => { byId[p.id] = p; });
  const api = {
    PATTERNS,
    getPattern: (id) => byId[id] || null,
    patternsByCategory: (cat) => PATTERNS.filter((p) => p.category === cat),
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.PatternsDB = api;
})(typeof window !== 'undefined' ? window : globalThis);
```

(`PatternVizDraw.tree` is provided by viz_pattern.js at runtime; in Node unit tests the `render` fn is never called, so the reference is fine.)

- [ ] **Step 4: Create `js/viz/viz_pattern.js`** — generic renderer + the shared draw helpers (move `createArrow` here from app.js in Task 4):

```js
(function (global) {
  const K = () => global.VizKit;
  const NS = 'http://www.w3.org/2000/svg';

  function el(tag, attrs) { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); return n; }
  function arrow(svg, x1, y1, x2, y2, color, label) {
    const line = el('line', { x1, y1, x2, y2, stroke: color || '#94a3b8', 'stroke-width': 2, 'marker-end': 'url(#pattern-arrow)' });
    svg.appendChild(line);
    if (label) { const t = el('text', { x: (x1 + x2) / 2, y: (y1 + y2) / 2 - 4, 'font-size': 11, fill: '#cbd5e1', 'text-anchor': 'middle' }); t.textContent = label; svg.appendChild(t); }
  }
  function defsArrow(svg) {
    const defs = el('defs', {}); defs.innerHTML = '<marker id="pattern-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#94a3b8"/></marker>'; svg.appendChild(defs);
  }
  function node(svg, n) {
    svg.appendChild(el('rect', { x: n.x, y: n.y, width: n.w, height: n.h, rx: 8, fill: n.color || '#334155', stroke: '#0f172a', 'stroke-width': 2 }));
    const title = el('text', { x: n.x + n.w / 2, y: n.y + 20, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 'bold', fill: 'white' }); title.textContent = n.label; svg.appendChild(title);
    (n.members || []).forEach((m, i) => { const t = el('text', { x: n.x + 10, y: n.y + 40 + i * 16, 'font-family': 'monospace', 'font-size': 11, fill: 'rgba(255,255,255,0.85)' }); t.textContent = m; svg.appendChild(t); });
  }
  function drawDiagram(svg, diagram) {
    svg.innerHTML = ''; defsArrow(svg);
    const byId = {}; (diagram.nodes || []).forEach((n) => { byId[n.id] = n; });
    (diagram.edges || []).forEach((e) => { const a = byId[e.from], b = byId[e.to]; if (a && b) arrow(svg, a.x + a.w / 2, a.y + a.h / 2, b.x + b.w / 2, b.y + b.h / 2, null, e.label); });
    (diagram.nodes || []).forEach((n) => node(svg, n));
  }
  function tree(svg, root) {
    svg.innerHTML = ''; defsArrow(svg);
    const W = 120, H = 44, VGAP = 70, HGAP = 20;
    // simple layered layout by DFS; compute subtree widths
    function width(t) { return (!t.children || !t.children.length) ? W + HGAP : t.children.reduce((s, c) => s + width(c), 0); }
    let placed = [];
    function place(t, x, depth) { const w = width(t); const cx = x + w / 2; t._x = cx - W / 2; t._y = 20 + depth * (H + VGAP); placed.push(t); let cur = x; (t.children || []).forEach((c) => { const cw = width(c); const child = place(c, cur, depth + 1); arrow(svg, cx, t._y + H, child._cx, child._y, null, null); cur += cw; }); t._cx = cx; return t; }
    place(root, 10, 0);
    placed.forEach((t) => node(svg, { x: t._x, y: t._y, w: W, h: H, label: t.label, color: t.color }));
  }
  function playNarration(steps) {
    return K().executeAnimWrapper(async () => { for (const s of steps) { K().showStatus(s.text, s.color); await sleep(600); } });
  }
  function render(svg, descriptor) {
    if (!descriptor) return;
    if (typeof descriptor.render === 'function') descriptor.render(svg);
    else if (descriptor.diagram) drawDiagram(svg, descriptor.diagram);
  }
  global.PatternVizDraw = { drawDiagram, tree, arrow };
  global.PatternViz = { drawDiagram, tree, playNarration, render };
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 5: Run unit test, confirm pass**

Run: `node --test tests/unit/patterns_db.test.js` → PASS.

- [ ] **Step 6: Commit**

```bash
git add js/patterns_db.js js/viz/viz_pattern.js tests/unit/patterns_db.test.js
git commit -m "feat(dsvisual): pattern registry + generic renderer (declarative + escape hatch)"
```

---

### Task 2: Migrate the 11 existing patterns into the registry

**Files:**
- Modify: `js/patterns_db.js` (add 11 descriptors)
- Test: `tests/unit/patterns_db.test.js`

**Interfaces:**
- Consumes: Task 1 schema. Produces: `PATTERNS` has all 14, categorized: creational {singleton,factory,builder}, structural {adapter,decorator,composite}, behavioral {observer,strategy,command}, architectural {mvc,layered,pubsub,pipefilter,di}.

- [ ] **Step 1: Extend the unit test** — append:

```js
test('registry has all 14 patterns in the right category counts', () => {
  assert.strictEqual(P.PATTERNS.length, 14);
  assert.strictEqual(P.patternsByCategory('patterns-creational').length, 3);
  assert.strictEqual(P.patternsByCategory('patterns-structural').length, 3);
  assert.strictEqual(P.patternsByCategory('patterns-behavioral').length, 3);
  assert.strictEqual(P.patternsByCategory('patterns-architectural').length, 5);
  // migrated patterns use the escape hatch (verbatim move), so each has a render fn
  ['pattern-singleton','pattern-factory','pattern-adapter','pattern-decorator','pattern-observer','pattern-strategy','pattern-mvc','pattern-layered','pattern-pubsub','pattern-pipefilter','pattern-di']
    .forEach((id) => { const p = P.getPattern(id); assert.ok(p, id); assert.strictEqual(typeof p.render, 'function', id + ' render'); assert.ok(Array.isArray(p.narration), id + ' narration'); });
});
```

- [ ] **Step 2: Run it, confirm it fails** (length 3 ≠ 14).

- [ ] **Step 3: Add the 11 descriptors.** For each of singleton, factory, adapter, decorator, observer, strategy, mvc, layered, pubsub, pipefilter, di, add a descriptor to `PATTERNS` with:
  - `id` = `pattern-<x>`, `category` = its group (see counts above), `title`/`label` = the existing METHOD_GROUPS title / the existing `#pattern-mode-select` option label (from index.html), `cpp` = `pattern_<x>.cpp`, `diagram: null`.
  - `render: function (svg) { … }` = the **verbatim body** of the existing `renderPattern<Xxx>()` in `app.js`, with two mechanical edits: (a) replace the first line `const svg = document.getElementById('pattern-<x>-svg');` with using the passed `svg` parameter (delete that lookup line); (b) any helper call `createArrow(svg, …)` becomes `PatternVizDraw.arrow(svg, …)` (same signature: x1,y1,x2,y2,color[,label]) — verify each migrated pattern's `createArrow` args match `arrow`'s; if a pattern used other inline helpers, move those into the descriptor or `PatternVizDraw`.
  - `narration` = the array of `{text,color}` derived from that pattern's `visualizePattern` case (each `showStatus(text,color)` → `{text,color}`; drop the `sleep` lines — the player inserts the delay).

  Do NOT modify `app.js` yet (the originals stay until Task 4).

- [ ] **Step 4: Run unit test, confirm pass** → `node --test tests/unit/patterns_db.test.js` PASS (14 patterns).

- [ ] **Step 5: Commit**

```bash
git add js/patterns_db.js tests/unit/patterns_db.test.js
git commit -m "feat(dsvisual): migrate 11 existing patterns into the registry (verbatim escape-hatch)"
```

---

### Task 3: cpp for the 3 new patterns + CODE_DB map + regen

**Files:**
- Create: `cpp/pattern_builder.cpp`, `cpp/pattern_composite.cpp`, `cpp/pattern_command.cpp`
- Modify: `build_db.js` (map the 3 files; emit a `CODE_DB` filename→string object), then regenerate `js/code_db.js`

- [ ] **Step 1: Author the 3 cpp files** — a concise, correct C++ illustration of each pattern (Builder: Director + Builder interface + ConcreteBuilder + Product; Composite: Component base + Leaf + Composite with a `std::vector<Component*>` and recursive `operation()`; Command: Command interface + ConcreteCommand + Receiver + Invoker). Display-only (code drawer); match the style/length of existing `cpp/pattern_*.cpp`.

- [ ] **Step 2: Wire build_db.js** — add the 3 filename→var mappings alongside the existing `pattern_*.cpp` ones. Additionally, make `build_db.js` emit a lookup object in `js/code_db.js`:
  ```js
  // after emitting the individual code vars:
  var CODE_DB = { 'pattern_builder.cpp': codePatternBuilder, /* …all mapped files… */ };
  if (typeof module !== 'undefined' && module.exports) module.exports.CODE_DB = CODE_DB;
  window.CODE_DB = CODE_DB;
  ```
  (Generate this map from the same filename→var table build_db already has, so it covers every cpp, not just patterns.)

- [ ] **Step 3: Regenerate**

Run: `node build_db.js`
Expected: `js/code_db.js` gains `codePatternBuilder/Composite/Command` + the `CODE_DB` map; `git diff` shows only additions.

- [ ] **Step 4: Sanity check**

Run: `node -e "const d=require('./js/code_db.js'); console.log(!!d.CODE_DB && !!d.CODE_DB['pattern_builder.cpp'] && !!d.CODE_DB['pattern_singleton.cpp'])"`
Expected: `true`.

- [ ] **Step 5: Commit**

```bash
git add cpp/pattern_builder.cpp cpp/pattern_composite.cpp cpp/pattern_command.cpp build_db.js js/code_db.js
git commit -m "feat(dsvisual): cpp for Builder/Composite/Command + CODE_DB filename map"
```

---

### Task 4: Flip the wiring; remove pattern code from app.js; index.html; verify

**Files:**
- Modify: `js/app.js`, `index.html`
- Test: `tests/patterns_registry.spec.js` (new), `tests/patterns_menu.spec.js` (keep passing)

**Interfaces:**
- Consumes: `PatternsDB`, `PatternViz`, `window.CODE_DB` from Tasks 1–3.

- [ ] **Step 1: Write the failing e2e** — `tests/patterns_registry.spec.js`:

```js
const { test, expect } = require('@playwright/test');
const path = require('path');
const FILE_URI = 'file://' + path.resolve(__dirname, '../index.html');

const ALL = ['pattern-singleton','pattern-factory','pattern-builder','pattern-adapter','pattern-decorator','pattern-composite','pattern-observer','pattern-strategy','pattern-command','pattern-mvc','pattern-layered','pattern-pubsub','pattern-pipefilter','pattern-di'];

test('every pattern (11 migrated + 3 new) loads and renders an svg', async ({ page }) => {
  const errors = []; page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  for (const id of ALL) {
    await page.goto(FILE_URI + '#m=' + id);
    await expect(page.locator('#pattern-svg')).toBeVisible();
    await expect.poll(() => page.locator('#pattern-svg *').count()).toBeGreaterThan(0);
  }
  expect(errors).toEqual([]);
});

test('new patterns appear in the category-scoped menu', async ({ page }) => {
  await page.goto(FILE_URI + '#m=pattern-builder');
  expect(await page.$$eval('#pattern-mode-select option', (o) => o.map((x) => x.value))).toEqual(['singleton','factory','builder']);
  await page.goto(FILE_URI + '#m=pattern-command');
  expect(await page.$$eval('#pattern-mode-select option', (o) => o.map((x) => x.value))).toEqual(['observer','strategy','command']);
});
```

- [ ] **Step 2: Run it, confirm it fails** (no `#pattern-svg`; new ids unknown).

- [ ] **Step 3: index.html** — inside `#pattern-container`, replace the 11 `.pattern-view` divs with a single title + svg:
```html
<h3 id="pattern-title" style="color:#ec4899;margin-bottom:1rem;"></h3>
<svg id="pattern-svg" width="100%" height="320" style="border:1px solid rgba(255,255,255,0.1);border-radius:8px;background:rgba(0,0,0,0.2);"></svg>
```
Remove the 11 hardcoded `<option>`s inside `#pattern-mode-select` (leave the empty `<select>`; it's populated from the registry). Add two `<script defer>` tags — `js/patterns_db.js` then `js/viz/viz_pattern.js` — after `js/code_db.js` and before `js/app.js`.

- [ ] **Step 4: app.js — generate METHOD_GROUPS pattern methods from the registry.** Replace the hardcoded `methods:[…]` arrays of the four `patterns-*` groups with (computed once, using `PatternsDB`): for each group, `methods: PatternsDB.patternsByCategory('<group-id>').map((p) => ({ id: p.id, title: p.title, file: p.cpp, visualizer: 'pattern', controls: 'pattern' }))`. (If `METHOD_GROUPS` is a top-level const evaluated before `PatternsDB` loads, build the pattern groups in an init step after scripts load instead — verify load order; patterns_db.js is a `defer` script before app.js, so `window.PatternsDB` is available when app.js runs.)

- [ ] **Step 5: app.js — registerBehaviors loop.** Replace the 14 `reg('pattern-…', renderPattern, () => codePattern…, null)` lines with:
```js
PatternsDB.PATTERNS.forEach((p) => reg(p.id, () => {
    const svg = document.getElementById('pattern-svg');
    PatternViz.render(svg, p);
}, () => window.CODE_DB[p.cpp], null));
```

- [ ] **Step 6: app.js — collapse the activation branch.** Replace the whole `else if (currentMode.includes('pattern-')) { … 11-way if/else … }` block (~lines 1850–1920) with:
```js
        else if (currentMode.includes('pattern-')) {
            patternContainer.classList.remove('hidden');
            patternActions.classList.remove('hidden');
            const p = PatternsDB.getPattern(currentMode);
            if (p) {
                codeTitle.textContent = p.cpp;
                codeDisplay.textContent = window.CODE_DB[p.cpp] || '';
                document.getElementById('pattern-title').textContent = p.label;
                // category-scoped select (from PR #146), now sourced from the registry:
                patternModeSelect.innerHTML = PatternsDB.patternsByCategory(p.category)
                    .map((q) => '<option value="' + q.id.replace(/^pattern-/, '') + '">' + q.label + '</option>').join('');
                patternModeSelect.value = currentMode.replace(/^pattern-/, '');
            }
        }
```
Also delete the now-obsolete `PATTERN_OPTION_LABELS` snapshot (from PR #146) — labels now come from the registry descriptors.

- [ ] **Step 7: app.js — narration button.** Change the `btnPatternDemo` click handler to:
```js
    btnPatternDemo.addEventListener('click', () => {
        const p = PatternsDB.getPattern(currentMode);
        if (p) PatternViz.playNarration(p.narration);
    });
```
And `btnPatternReset` to re-render via the registry: `const svg=document.getElementById('pattern-svg'); PatternViz.render(svg, PatternsDB.getPattern(currentMode)); K?`. Use the existing `renderAll()` if simpler: `btnPatternReset` → `renderAll(); showStatus('Pattern visualization reset.', '#6366f1');`.

- [ ] **Step 8: app.js — delete dead code.** Remove: `function renderPattern()`, all 11 `function renderPattern<Xxx>()`, `async function visualizePattern()` and its cases, the `renderAll()` `else if (currentMode.includes('pattern-')) renderPattern();` fallback line, the `codePattern*`→id map block (~lines 357–367 if it only serves patterns; if it serves others too, remove only pattern rows), and any pattern-only SVG helper now living in `viz_pattern.js` (e.g. `createArrow` if unused elsewhere — verify with `git grep`). Keep `patternContainer`, `patternActions`, `patternModeSelect`, `btnPatternDemo/Reset` refs.

- [ ] **Step 9: Run the e2e, confirm pass**

Run: `npx playwright test tests/patterns_registry.spec.js tests/patterns_menu.spec.js`
Expected: PASS.

- [ ] **Step 10: Spot-check migration fidelity (manual assertion in test or notes).** For two migrated patterns (e.g. `pattern-singleton`, `pattern-observer`), confirm the rendered `#pattern-svg` child count/structure matches pre-refactor intent (the escape-hatch body is verbatim, so any diff is a wiring bug). Note the check in the report.

- [ ] **Step 11: Full verification**

Run: `git grep -c "function renderPatternSingleton\|async function visualizePattern" js/app.js` → expected `0` (or no match).
Run: `npm run test:unit` → PASS.
Run: `npm test` → PASS (full Playwright: patterns_registry + patterns_menu + smoke_modes patterns + no regressions; verify the i18n overview-tile count self-updated for +3 patterns).

- [ ] **Step 12: Commit**

```bash
git add js/app.js index.html tests/patterns_registry.spec.js
git commit -m "refactor(dsvisual): route patterns through the registry; remove per-pattern code from app.js"
```

---

## Self-Review

- **Spec coverage:** registry + renderer (Task 1); migrate 11 (Task 2); cpp + CODE_DB (Task 3); wiring flip + app.js removal + index.html + derivation + tests (Task 4). All spec sections mapped.
- **Placeholder scan:** infra + new descriptors are complete code; the migration (Task 2 Step 3) and app.js deletions (Task 4 Step 8) are precise mechanical instructions with exact source references and edits (verbatim move + two named substitutions) — concrete, not hand-waved.
- **Type consistency:** `PatternViz.render(svg, descriptor)` / `PatternViz.playNarration(steps)` used identically in app.js Task 4 as defined in Task 1; `window.CODE_DB[p.cpp]` produced in Task 3, consumed in Task 4; `patternsByCategory(catId)` used for METHOD_GROUPS derivation and the scoped select; option value = `id.replace(/^pattern-/,'')` matches the demo button's `currentMode.replace('pattern-','')` semantics. `PatternVizDraw.arrow` signature matches the migrated `createArrow(svg,x1,y1,x2,y2,color[,label])` calls.
