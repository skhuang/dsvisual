# GC viz clarity — object-graph view for mark-sweep & refcount — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make each memory block's status legible in the `gc-memory` visualizer by rendering the `mark-sweep` and `refcount` modes as object graphs (nodes + reference edges, roots flagged, per-block state + legend), and enrich the mark-sweep scenario with a garbage cycle.

**Architecture:** Add `roots` to mark-sweep frames and a garbage cycle to `MS_SCENARIO` (logic). Add a shared `renderObjectGraph` helper in the renderer that draws an SVG edge layer + absolutely-positioned node cells + a legend, and wire both graph-shaped modes to it. Buddy / pointer-reversal / compact are untouched.

**Tech Stack:** Vanilla JS dual-export IIFE logic module; `VizRegistry`/`VizKit` render seam; inline SVG; `node --test` unit tests; Playwright e2e.

## Global Constraints

- Concurrent refactor session — targeted `git add` of only each task's named files; never `git add -A`/`.`/`-u`; `git status` before committing.
- Run the FULL Playwright suite (`npm test`) before merge. No METHOD_GROUPS row / no new category ⇒ no overview-tile/`.overview-category` count change; the i18n count assertions must stay untouched.
- Do not modify the buddy / pointer-reversal / compact frame builders or render branches, or any generated file (`js/code_db.js`, `slides/**`, `js/slides_rendered.js`).
- Branch: `feat/gc-viz-graph-clarity`.

---

### Task 1: Logic — roots in frames + garbage-cycle scenario

**Files:**
- Modify: `js/gc_memory_viz.js` (`MS_SCENARIO`, `markSweepFrames` snap)
- Test: `tests/unit/gc_memory.test.js`

**Interfaces:**
- Produces: `markSweepFrames()` frames each include `roots: number[]`; `MS_SCENARIO` has objects `0..8` with `7↔8` an unreachable cycle; garbage set `{6,7,8}`.

- [ ] **Step 1: Update the failing test** — replace the existing `mark-sweep frees only unreachable objects` test in `tests/unit/gc_memory.test.js` with:

```js
test('mark-sweep frees unreachable objects incl. a garbage cycle; frames carry roots', () => {
  const { frames } = V.markSweepFrames();
  const last = frames[frames.length - 1];
  const byId = {}; last.heap.forEach((o) => { byId[o.id] = o; });
  // reachable from roots {0,1}: 0,1,2,3,4,5 kept
  [0, 1, 2, 3, 4, 5].forEach((id) => assert.strictEqual(byId[id].free, false, 'id ' + id + ' kept'));
  // garbage: isolated 6 AND the unreachable cycle 7<->8 all freed
  [6, 7, 8].forEach((id) => assert.strictEqual(byId[id].free, true, 'id ' + id + ' freed'));
  // every frame carries the root set for the renderer
  assert.ok(frames.every((f) => Array.isArray(f.roots) && f.roots.length === 2 && f.roots.includes(0) && f.roots.includes(1)));
  assert.ok(frames.some((f) => f.phase === 'mark'));
  assert.ok(frames.some((f) => f.phase && f.phase.indexOf('sweep') === 0));
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `node --test tests/unit/gc_memory.test.js`
Expected: FAIL — ids 7/8 not present (undefined `.free`), and `f.roots` undefined.

- [ ] **Step 3: Implement** — in `js/gc_memory_viz.js`, extend `MS_SCENARIO.objects` with the cycle and add `roots` to the snapshot. New `MS_SCENARIO`:

```js
  const MS_SCENARIO = {
    objects: [
      { id: 0, refs: [2] }, { id: 1, refs: [3, 4] }, { id: 2, refs: [5] },
      { id: 3, refs: [] }, { id: 4, refs: [2] }, { id: 5, refs: [] }, { id: 6, refs: [] },
      { id: 7, refs: [8] }, { id: 8, refs: [7] }   // unreachable garbage cycle
    ],
    roots: [0, 1]
  };
```

And change the `snap` inside `markSweepFrames` to include roots:

```js
    function snap(phase, active) { return { phase: phase, active: active, roots: scenario.roots.slice(), heap: objs.map((o) => ({ id: o.id, refs: o.refs.slice(), mark: o.mark, free: o.free })) }; }
```

- [ ] **Step 4: Run the test to confirm it passes**

Run: `node --test tests/unit/gc_memory.test.js`
Expected: PASS (all gc unit tests).

- [ ] **Step 5: Commit**

```bash
git add js/gc_memory_viz.js tests/unit/gc_memory.test.js
git commit -m "feat(dsvisual): mark-sweep frames carry roots; MS_SCENARIO gains a garbage cycle"
```

---

### Task 2: renderObjectGraph helper + CSS + wire mark-sweep

**Files:**
- Modify: `js/viz/viz_gc.js` (add `renderObjectGraph` helper; replace the `mark-sweep` branch in `paint()` with a call to it)
- Modify: `style.css` (graph/edge/node/root/legend classes)
- Test: `tests/tier3.spec.js` (extend gc-memory test for mark-sweep)

**Interfaces:**
- Consumes: `fr.heap` (`[{id,refs,mark,free}]`), `fr.roots`, `fr.active` from Task 1.
- Produces: module-local `renderObjectGraph(stage, { mode, nodes, roots, activeId })` (also used by Task 3 for refcount).

- [ ] **Step 1: Extend the e2e (RED)** — in the gc-memory test in `tests/tier3.spec.js`, after loading gc-memory (default mode is `mark-sweep`), add:

```js
  // mark-sweep renders an object graph: edges, a flagged root, and a legend
  await expect(page.locator('.gc-stage .gc-edge-layer')).toBeVisible();
  await expect(page.locator('.gc-stage .gc-node.gc-root').first()).toBeVisible();
  await expect(page.locator('.gc-stage .gc-legend')).toBeVisible();
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx playwright test tests/tier3.spec.js -g "gc-memory"`
Expected: FAIL — `.gc-edge-layer` / `.gc-node` / `.gc-legend` do not exist (flat grid still).

- [ ] **Step 3: Add the helper** — in `js/viz/viz_gc.js`, inside the IIFE (before `renderGcMemory`), add:

```js
    function renderObjectGraph(stage, opts) {
        const mode = opts.mode, nodes = opts.nodes, roots = opts.roots || [], activeId = opts.activeId;
        const byId = {}; nodes.forEach((n) => { byId[n.id] = n; });
        const rootSet = new Set(roots);
        const NODE_W = 74, NODE_H = 46, COL_GAP = 66, ROW_GAP = 22;
        const pos = {};
        if (mode === 'mark-sweep') {
            const depth = {}, q = [];
            roots.forEach((r) => { if (byId[r] != null) { depth[r] = 0; q.push(r); } });
            while (q.length) {
                const id = q.shift();
                (byId[id].refs || []).forEach((t) => { if (byId[t] != null && depth[t] === undefined) { depth[t] = depth[id] + 1; q.push(t); } });
            }
            const layers = {};
            nodes.forEach((n) => { if (depth[n.id] !== undefined) { (layers[depth[n.id]] = layers[depth[n.id]] || []).push(n.id); } });
            Object.keys(layers).forEach((d) => {
                layers[d].forEach((id, i) => { pos[id] = { x: 12 + Number(d) * (NODE_W + COL_GAP), y: 12 + i * (NODE_H + ROW_GAP) }; });
            });
            const layerSizes = Object.values(layers).map((a) => a.length);
            const reachableRows = layerSizes.length ? Math.max.apply(null, layerSizes) : 1;
            const bandY = 12 + reachableRows * (NODE_H + ROW_GAP) + 26;
            nodes.filter((n) => depth[n.id] === undefined).forEach((n, i) => { pos[n.id] = { x: 12 + i * (NODE_W + COL_GAP), y: bandY }; });
        } else {
            nodes.forEach((n, i) => { pos[n.id] = { x: 12 + i * (NODE_W + COL_GAP), y: 48 }; });
        }
        const xs = nodes.map((n) => pos[n.id].x), ys = nodes.map((n) => pos[n.id].y);
        const width = Math.max.apply(null, xs) + NODE_W + 12;
        const height = Math.max.apply(null, ys) + NODE_H + 12;

        const graph = document.createElement('div');
        graph.className = 'gc-graph';
        graph.style.width = width + 'px'; graph.style.height = height + 'px';

        const NS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('class', 'gc-edge-layer');
        svg.setAttribute('width', width); svg.setAttribute('height', height);
        const defs = document.createElementNS(NS, 'defs');
        defs.innerHTML = '<marker id="gc-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#94a3b8"/></marker>';
        svg.appendChild(defs);
        nodes.forEach((n, si) => {
            (n.refs || []).forEach((t) => {
                if (!pos[n.id] || !pos[t]) return;
                const a = pos[n.id], b = pos[t];
                const x1 = a.x + NODE_W / 2, y1 = a.y + NODE_H / 2, x2 = b.x + NODE_W / 2, y2 = b.y + NODE_H / 2;
                let el;
                if (mode === 'refcount') {                       // bow so bidirectional pairs (leaked cycle) separate
                    const ti = nodes.findIndex((m) => m.id === t);
                    const dir = ti > si ? -1 : 1;
                    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 + dir * 34;
                    el = document.createElementNS(NS, 'path');
                    el.setAttribute('d', 'M' + x1 + ',' + y1 + ' Q' + mx + ',' + my + ' ' + x2 + ',' + y2);
                    el.setAttribute('fill', 'none');
                } else {
                    el = document.createElementNS(NS, 'line');
                    el.setAttribute('x1', x1); el.setAttribute('y1', y1); el.setAttribute('x2', x2); el.setAttribute('y2', y2);
                }
                el.setAttribute('class', 'gc-edge');
                el.setAttribute('marker-end', 'url(#gc-arrow)');
                svg.appendChild(el);
            });
        });
        graph.appendChild(svg);

        nodes.forEach((n) => {
            const p = pos[n.id]; if (!p) return;
            const cell = document.createElement('div');
            let cls = 'gc-cell gc-node';
            if (n.free) cls += ' gc-free';
            else if (mode === 'mark-sweep' && n.mark) cls += ' gc-mark';
            if (rootSet.has(n.id)) cls += ' gc-root';
            if (n.id === activeId) cls += ' gc-active';
            cell.className = cls;
            cell.style.left = p.x + 'px'; cell.style.top = p.y + 'px';
            let meta;
            if (mode === 'mark-sweep') meta = n.free ? 'freed' : (rootSet.has(n.id) ? 'root' : (n.mark ? 'reachable' : 'unmarked'));
            else meta = n.free ? 'freed' : ('rc=' + n.count);
            cell.innerHTML = '<div class="gc-cell-id">#' + n.id + '</div><div class="gc-cell-meta">' + meta + '</div>';
            graph.appendChild(cell);
        });
        stage.appendChild(graph);

        const legend = document.createElement('div');
        legend.className = 'gc-legend';
        const items = (mode === 'mark-sweep')
            ? [['gc-root', 'root'], ['gc-mark', 'reachable'], ['', 'unmarked'], ['gc-free', 'freed']]
            : [['', 'alive (rc>0)'], ['gc-free', 'freed (rc=0)']];
        legend.innerHTML = items.map((it) => '<span class="gc-legend-item"><span class="gc-swatch ' + it[0] + '"></span>' + it[1] + '</span>').join('');
        stage.appendChild(legend);
    }
```

- [ ] **Step 4: Wire the mark-sweep branch** — in `paint()`, replace the body of the `if (_gcState.mode === 'mark-sweep') { ... }` branch (the badge line stays) with:

```js
            if (_gcState.mode === 'mark-sweep') {
                badge.textContent = 'phase: ' + fr.phase + (fr.active != null ? '  (obj ' + fr.active + ')' : '');
                renderObjectGraph(stage, { mode: 'mark-sweep', nodes: fr.heap, roots: fr.roots, activeId: fr.active });
            } else if (_gcState.mode === 'refcount') {
```

(Leave the existing refcount branch body unchanged in this task — Task 3 rewires it.)

- [ ] **Step 5: Add CSS** — append to `style.css`:

```css
.gc-stage { overflow-x: auto; }
.gc-graph { position: relative; margin: 0 auto; }
.gc-edge-layer { position: absolute; left: 0; top: 0; pointer-events: none; }
.gc-edge { stroke: #94a3b8; stroke-width: 2; }
.gc-cell.gc-node { position: absolute; min-width: 60px; margin: 0; }
.gc-cell.gc-root { outline: 2px solid #6366f1; outline-offset: 2px; }
.gc-legend { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 14px; font-size: 12px; color: #475569; justify-content: center; }
.gc-legend-item { display: inline-flex; align-items: center; gap: 5px; }
.gc-swatch { width: 12px; height: 12px; border-radius: 3px; background: #f1f5f9; border: 2px solid #cbd5e1; display: inline-block; }
.gc-swatch.gc-mark { background: #dcfce7; border-color: #4ade80; }
.gc-swatch.gc-free { background: #e2e8f0; border-color: #94a3b8; }
.gc-swatch.gc-root { outline: 2px solid #6366f1; outline-offset: 1px; }
```

- [ ] **Step 6: Run the e2e to confirm it passes**

Run: `npx playwright test tests/tier3.spec.js -g "gc-memory"`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add js/viz/viz_gc.js style.css tests/tier3.spec.js
git commit -m "feat(dsvisual): object-graph view for gc mark-sweep (edges, roots, legend)"
```

---

### Task 3: Wire refcount to the graph helper + full verification

**Files:**
- Modify: `js/viz/viz_gc.js` (replace the refcount branch body with a `renderObjectGraph` call)
- Test: `tests/tier3.spec.js` (extend gc-memory test for refcount)

**Interfaces:**
- Consumes: `renderObjectGraph` (Task 2); `fr.objs` (`[{id,refs,count,free}]`) and `fr.active` from `refCountFrames`.

- [ ] **Step 1: Extend the e2e (RED)** — in the gc-memory test, after the block that selects `refcount` and steps, add:

```js
    // refcount also renders as an object graph with a legend
    await expect(page.locator('.gc-stage .gc-edge-layer')).toBeVisible();
    await expect(page.locator('.gc-stage .gc-legend')).toBeVisible();
    await expect(page.locator('.gc-stage .gc-node').first()).toBeVisible();
```

(If the current test selects modes in a loop, ensure `refcount` is selected before these assertions; otherwise add an explicit `await page.selectOption('.gc-mode', 'refcount');` first.)

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx playwright test tests/tier3.spec.js -g "gc-memory"`
Expected: FAIL — refcount still renders the flat grid (no `.gc-edge-layer`/`.gc-node`).

- [ ] **Step 3: Wire the refcount branch** — in `paint()`, replace the body of the `else if (_gcState.mode === 'refcount') { ... }` branch with:

```js
            } else if (_gcState.mode === 'refcount') {
                badge.textContent = fr.action;
                renderObjectGraph(stage, { mode: 'refcount', nodes: fr.objs, roots: [], activeId: fr.active });
```

- [ ] **Step 4: Run the e2e to confirm it passes**

Run: `npx playwright test tests/tier3.spec.js -g "gc-memory"`
Expected: PASS.

- [ ] **Step 5: Full verification**

Run: `npm run test:unit`
Expected: PASS (all unit tests incl. the enriched mark-sweep test).

Run: `npm test`
Expected: PASS (full Playwright, incl. tier3 gc-memory graph assertions for both modes and smoke_modes gc-memory load-without-console-errors).

- [ ] **Step 6: Commit**

```bash
git add js/viz/viz_gc.js tests/tier3.spec.js
git commit -m "feat(dsvisual): object-graph view for gc reference-counting; verify full suite"
```

---

## Self-Review

- **Spec coverage:** roots-in-frames + garbage cycle (Task 1); shared graph helper + mark-sweep wiring + CSS + legend (Task 2); refcount wiring + full verify (Task 3). All spec sections covered.
- **Placeholder scan:** none — every code step carries complete code or exact commands.
- **Type consistency:** the helper reads `nodes:[{id,refs,mark,free}]` (mark-sweep, from `fr.heap`) and `[{id,refs,count,free}]` (refcount, from `fr.objs`); `roots`/`activeId` match Task 1's `fr.roots`/`fr.active`. `renderObjectGraph` signature is identical across Tasks 2 and 3. Mode strings `'mark-sweep'`/`'refcount'` match the dispatch and dropdown. CSS classes referenced by the helper (`gc-graph`, `gc-edge-layer`, `gc-edge`, `gc-node`, `gc-root`, `gc-legend`, `gc-swatch`) are all defined in Task 2 Step 5; `gc-cell`/`gc-mark`/`gc-free`/`gc-active` pre-exist.
