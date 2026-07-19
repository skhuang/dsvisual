# MARK2 & COMPACT modes for the Memory/GC visualizer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two new modes — Pointer-Reversal Mark (MARK2) and Compaction (COMPACT) — to dsvisual's existing `gc-memory` visualizer, faithful to the ds2026 chap04 §4.10 algorithms.

**Architecture:** Extend the pure-logic module `js/gc_memory_viz.js` with two frame builders and dispatch cases, then the renderer `js/viz/viz_gc.js` with two dropdown modes + render branches. Supporting content (code drawer, description, slides) updated last. No METHOD_GROUPS row and no new category → no overview tile/category-count change.

**Tech Stack:** Vanilla JS dual-export IIFE modules; `node --test` unit tests; Playwright e2e; `VizRegistry`/`VizKit` render seam.

## Global Constraints

- dsvisual has a **concurrent refactor session** — targeted `git add` of only each task's named files; never `git add -A`/`.`/`-u`; verify `git status` first.
- Run the **FULL Playwright suite** (`npm test`) before merge, not just `npm run test:unit` (see the CI trap in prior work). Adding modes does NOT change the overview-tile or `.overview-category` counts, so the i18n count assertions stay valid untouched.
- `desc_db.js` is **English-only**; any new `slides_db.js` text is **bilingual zh/en**.
- Never hand-edit generated `slides/**`, `js/slides_rendered.js`, or `js/code_db.js` — regenerate them.
- MARK2 uses the generalized-list model (`tag`/`dlink`/`rlink`) matching ds2026 §4.10.

---

### Task 1: Pointer-reversal (MARK2) frame builder

**Files:**
- Modify: `js/gc_memory_viz.js` (add scenario + `pointerReversalFrames`; extend `gcMemoryFrames`; export)
- Test: `tests/unit/gc_memory.test.js`

**Interfaces:**
- Produces: `pointerReversalFrames(scenario?) → { frames: Frame[] }` where `Frame = { phase, p, q, nodes: [{id, tag, mark, c, dlink, rlink, dRev, rRev}] }`; `PR_SCENARIO`; `gcMemoryFrames('pointer-reversal')` dispatches to it. All added to the exported `api`.

- [ ] **Step 1: Write the failing test** — append to `tests/unit/gc_memory.test.js`:

```js
test('pointer reversal marks all reachable nodes and restores every link', () => {
  const { frames } = V.pointerReversalFrames();
  const last = frames[frames.length - 1];
  const byId = {}; last.nodes.forEach((n) => { byId[n.id] = n; });
  // all four reachable nodes marked
  ['R', 'S', 'n1', 'n2'].forEach((id) => assert.strictEqual(byId[id].mark, true, id + ' marked'));
  // every link restored to its home target (no link left reversed)
  last.nodes.forEach((n) => {
    assert.strictEqual(n.dRev, false, n.id + ' dlink restored');
    assert.strictEqual(n.rRev, false, n.id + ' rlink restored');
  });
  assert.strictEqual(byId['R'].dlink, 'n1');
  assert.strictEqual(byId['R'].rlink, 'S');
  assert.strictEqual(byId['n1'].rlink, 'n2');
  // the intermediate walk actually reversed something (proves it's not a no-op)
  assert.ok(frames.some((f) => f.nodes.some((n) => n.dRev || n.rRev)), 'some frame shows a reversed link');
});

test('gcMemoryFrames dispatches pointer-reversal', () => {
  assert.ok(V.gcMemoryFrames('pointer-reversal').frames.length > 0);
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `node --test tests/unit/gc_memory.test.js`
Expected: FAIL — `V.pointerReversalFrames is not a function`.

- [ ] **Step 3: Implement the frame builder** — in `js/gc_memory_viz.js`, after the buddy section (before `gcMemoryFrames`), add:

```js
  const PR_SCENARIO = {
    nodes: [
      { id: 'R', tag: 1, dlink: 'n1', rlink: 'S' },  // list node
      { id: 'S', tag: 0, dlink: null, rlink: null }, // atom sibling
      { id: 'n1', tag: 0, dlink: null, rlink: 'n2' },// atom
      { id: 'n2', tag: 0, dlink: null, rlink: null } // atom
    ],
    root: 'R'
  };
  function pointerReversalFrames(scenario) {
    scenario = scenario || PR_SCENARIO;
    const nodes = {}; const order = scenario.nodes.map((n) => n.id);
    const home = {};
    scenario.nodes.forEach((n) => {
      nodes[n.id] = { id: n.id, tag: n.tag, dlink: n.dlink, rlink: n.rlink, mark: false, c: 0 };
      home[n.id] = { dlink: n.dlink, rlink: n.rlink };
    });
    const frames = [];
    function snap(phase, p, q) {
      return { phase: phase, p: p, q: q, nodes: order.map((id) => {
        const o = nodes[id];
        return { id: id, tag: o.tag, mark: o.mark, c: o.c, dlink: o.dlink, rlink: o.rlink,
                 dRev: o.dlink !== home[id].dlink, rRev: o.rlink !== home[id].rlink };
      }) };
    }
    let p = scenario.root, q = null;
    frames.push(snap('start', p, q));
    for (;;) {
      if (p && !nodes[p].mark) {                 // first visit: mark, descend, reverse
        nodes[p].mark = true;
        if (nodes[p].tag) { nodes[p].c = 0; const t = nodes[p].dlink; nodes[p].dlink = q; q = p; p = t; frames.push(snap('descend dlink', p, q)); }
        else { nodes[p].c = 1; const t = nodes[p].rlink; nodes[p].rlink = q; q = p; p = t; frames.push(snap('atom → rlink', p, q)); }
      } else {                                    // dead end: back up along reversed links
        if (!q) { frames.push(snap('done', p, q)); break; }
        if (nodes[q].c === 0) { nodes[q].c = 1; const t = nodes[q].dlink; nodes[q].dlink = p; p = nodes[q].rlink; nodes[q].rlink = t; frames.push(snap('switch dlink→rlink', p, q)); }
        else { const t = nodes[q].rlink; nodes[q].rlink = p; p = q; q = t; frames.push(snap('pop (restore)', p, q)); }
      }
    }
    return { frames: frames };
  }
```

Then extend `gcMemoryFrames` (add before the final `return markSweepFrames();`):

```js
    if (mode === 'pointer-reversal') return pointerReversalFrames();
```

And add to the `api` object: `pointerReversalFrames: pointerReversalFrames, PR_SCENARIO: PR_SCENARIO,`.

- [ ] **Step 4: Run the test to confirm it passes**

Run: `node --test tests/unit/gc_memory.test.js`
Expected: PASS (all gc unit tests, including the two new ones).

- [ ] **Step 5: Commit**

```bash
git add js/gc_memory_viz.js tests/unit/gc_memory.test.js
git commit -m "feat(dsvisual): pointer-reversal (MARK2) frame builder for gc-memory viz"
```

---

### Task 2: Compaction (COMPACT) frame builder

**Files:**
- Modify: `js/gc_memory_viz.js` (add scenario + `compactFrames`; extend `gcMemoryFrames`; export)
- Test: `tests/unit/gc_memory.test.js`

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces: `compactFrames(scenario?) → { frames: Frame[] }` where `Frame = { phase, active, av, pass, total, blocks: [{id, addr, size, live, link, newAddr}] }`; `COMPACT_SCENARIO`; `gcMemoryFrames('compact')` dispatches to it. Added to `api`.

- [ ] **Step 1: Write the failing test** — append to `tests/unit/gc_memory.test.js`:

```js
test('compaction slides live blocks contiguous and rewrites links to new addresses', () => {
  const { frames } = V.compactFrames();
  const last = frames[frames.length - 1];
  const byId = {}; last.blocks.forEach((b) => { byId[b.id] = b; });
  // live blocks relocated to contiguous addresses 1,3,5 in order
  assert.strictEqual(byId['A'].addr, 1);
  assert.strictEqual(byId['C'].addr, 3);
  assert.strictEqual(byId['D'].addr, 5);
  // links rewritten to targets' new addresses: A->D(5), D->A(1)
  assert.strictEqual(byId['A'].link, 5);
  assert.strictEqual(byId['D'].link, 1);
  // all three passes represented
  [1, 2, 3].forEach((p) => assert.ok(frames.some((f) => f.pass === p), 'pass ' + p + ' present'));
});

test('gcMemoryFrames dispatches compact', () => {
  assert.ok(V.gcMemoryFrames('compact').frames.length > 0);
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `node --test tests/unit/gc_memory.test.js`
Expected: FAIL — `V.compactFrames is not a function`.

- [ ] **Step 3: Implement the frame builder** — in `js/gc_memory_viz.js`, after `pointerReversalFrames`, add:

```js
  const COMPACT_SCENARIO = {
    total: 10,
    blocks: [
      { id: 'A', addr: 1, size: 2, live: true, link: 'D' },
      { id: 'B', addr: 3, size: 2, live: false, link: null },
      { id: 'C', addr: 5, size: 2, live: true, link: null },
      { id: 'D', addr: 7, size: 2, live: true, link: 'A' },
      { id: 'E', addr: 9, size: 1, live: false, link: null }
    ]
  };
  function compactFrames(scenario) {
    scenario = scenario || COMPACT_SCENARIO;
    const total = scenario.total;
    const blocks = scenario.blocks.map((b) => ({ id: b.id, addr: b.addr, size: b.size, live: b.live, link: b.link, newAddr: null }));
    const byId = {}; blocks.forEach((b) => { byId[b.id] = b; });
    const frames = [];
    function snap(phase, active, av, pass) {
      return { phase: phase, active: active, av: av, pass: pass, total: total,
               blocks: blocks.map((b) => ({ id: b.id, addr: b.addr, size: b.size, live: b.live, link: b.link, newAddr: b.newAddr })) };
    }
    frames.push(snap('start', null, 1, 0));
    let av = 1;                                                    // Pass 1: assign new addresses
    blocks.forEach((b) => { if (b.live) { b.newAddr = av; av += b.size; frames.push(snap('pass1: newAddr[' + b.id + ']=' + b.newAddr, b.id, av, 1)); } });
    blocks.forEach((b) => {                                        // Pass 2: rewrite links old->new addr
      if (b.live && b.link != null) { const tgt = byId[b.link]; b.link = tgt ? tgt.newAddr : 0; frames.push(snap('pass2: link[' + b.id + ']=' + b.link, b.id, av, 2)); }
    });
    blocks.forEach((b) => { if (b.live) { b.addr = b.newAddr; frames.push(snap('pass3: move ' + b.id + ' → ' + b.addr, b.id, av, 3)); } }); // Pass 3: relocate
    frames.push(snap('done', null, av, 3));
    return { frames: frames };
  }
```

Then extend `gcMemoryFrames` (before `return markSweepFrames();`):

```js
    if (mode === 'compact') return compactFrames();
```

And add to `api`: `compactFrames: compactFrames, COMPACT_SCENARIO: COMPACT_SCENARIO,`.

- [ ] **Step 4: Run the test to confirm it passes**

Run: `node --test tests/unit/gc_memory.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/gc_memory_viz.js tests/unit/gc_memory.test.js
git commit -m "feat(dsvisual): compaction (COMPACT) frame builder for gc-memory viz"
```

---

### Task 3: Renderer + CSS for both new modes

**Files:**
- Modify: `js/viz/viz_gc.js` (dropdown entries; restructure `paint()` dispatch; two render branches; compact layout helper)
- Modify: `style.css` (P/Q cursor + reversed-link classes)
- Test: `tests/tier3.spec.js` (extend the gc-memory mode-switch test)

**Interfaces:**
- Consumes: `GcMemoryViz.gcMemoryFrames('pointer-reversal'|'compact')` from Tasks 1–2 (frame shapes as defined there).

- [ ] **Step 1: Write the failing e2e** — in `tests/tier3.spec.js`, extend the existing `gc-memory` test (after the `buddy` selectOption + step) with:

```js
  for (const mode of ['pointer-reversal', 'compact']) {
    await page.selectOption('.gc-mode', mode);
    await expect(page.locator('.gc-stage')).toBeVisible();
    await page.locator('.stepctl [data-action="step"]').click();
    await expect(page.locator('.gc-badge')).not.toHaveText('');
  }
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx playwright test tests/tier3.spec.js -g "gc-memory"`
Expected: FAIL — selecting `pointer-reversal` renders nothing meaningful / stage not updated (the option/branch does not exist yet).

- [ ] **Step 3: Add the dropdown entries** — in `js/viz/viz_gc.js`, replace the `modes` array with:

```js
        const modes = [
            ['mark-sweep', 'Mark-Sweep'],
            ['refcount', 'Reference Counting'],
            ['buddy', 'Buddy System'],
            ['pointer-reversal', 'Pointer-Reversal Mark (MARK2)'],
            ['compact', 'Compaction (COMPACT)'],
        ];
```

- [ ] **Step 4: Restructure `paint()` dispatch and add render branches** — in `paint()`, change the existing final `else {` (buddy) to `else if (_gcState.mode === 'buddy') {`, and after it add the two new branches:

```js
            } else if (_gcState.mode === 'pointer-reversal') {
                badge.textContent = fr.phase + '   P=' + (fr.p || '·') + '  Q=' + (fr.q || '·');
                const grid = document.createElement('div');
                grid.className = 'gc-grid';
                fr.nodes.forEach((n) => {
                    const c = document.createElement('div');
                    c.className = 'gc-cell' + (n.mark ? ' gc-mark' : '')
                        + (n.id === fr.p ? ' gc-node-p' : '') + (n.id === fr.q ? ' gc-node-q' : '');
                    const d = 'd:' + (n.dlink || '·') + (n.dRev ? '↺' : '');
                    const r = 'r:' + (n.rlink || '·') + (n.rRev ? '↺' : '');
                    c.innerHTML = '<div class="gc-cell-id">' + n.id + (n.tag ? ' ▣' : '') + '</div>'
                        + '<div class="gc-cell-meta">' + (n.mark ? '✓ ' : '') + d + '  ' + r + '</div>';
                    grid.appendChild(c);
                });
                stage.appendChild(grid);
            } else if (_gcState.mode === 'compact') {
                badge.textContent = fr.phase;
                const bar = document.createElement('div');
                bar.className = 'gc-bar';
                // lay out by address from LIVE blocks only; free space = the gaps + tail
                const live = fr.blocks.filter((b) => b.live).slice().sort((x, y) => x.addr - y.addr);
                let cursor = 1;
                function pushFree(size) {
                    if (size <= 0) return;
                    const seg = document.createElement('div');
                    seg.className = 'gc-seg gc-seg-free';
                    seg.style.width = (100 * size / fr.total) + '%';
                    bar.appendChild(seg);
                }
                live.forEach((b) => {
                    if (b.addr > cursor) pushFree(b.addr - cursor);
                    const seg = document.createElement('div');
                    seg.className = 'gc-seg gc-seg-alloc' + (b.id === fr.active ? ' gc-active' : '');
                    seg.style.width = (100 * b.size / fr.total) + '%';
                    let label = b.id;
                    if (b.newAddr != null && fr.pass < 3) label += '→@' + b.newAddr;
                    if (b.link != null) label += ' →' + b.link;
                    seg.textContent = label;
                    bar.appendChild(seg);
                    cursor = b.addr + b.size;
                });
                pushFree(fr.total + 1 - cursor);
                stage.appendChild(bar);
            }
```

- [ ] **Step 5: Add CSS** — append to `style.css`:

```css
.gc-cell.gc-node-p { outline: 3px solid #2563eb; outline-offset: 1px; }
.gc-cell.gc-node-q { border-color: #f59e0b; background: #fef3c7; }
```

- [ ] **Step 6: Run the e2e to confirm it passes**

Run: `npx playwright test tests/tier3.spec.js -g "gc-memory"`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add js/viz/viz_gc.js style.css tests/tier3.spec.js
git commit -m "feat(dsvisual): render pointer-reversal & compaction modes in gc-memory viz"
```

---

### Task 4: Code drawer, description, slides, and full verification

**Files:**
- Modify: `cpp/gc_memory.cpp` (append MARK2 + COMPACT C++), then regenerate `js/code_db.js`
- Modify: `js/desc_db.js` (extend the `gc-memory` entry)
- Modify: `slides_db.js` (extend `SLIDES_DB["gc-memory"]`), then regenerate slides

- [ ] **Step 1: Append the two algorithms to `cpp/gc_memory.cpp`** — add, after the existing content, the MARK2 (`M2Node` + `mark2`) and COMPACT (`CBlock` + `compact`) functions used in ds2026 §4.10 (unique struct names; illustrative, not executed here). Keep the file self-consistent (its own includes at top if needed).

- [ ] **Step 2: Regenerate the code DB**

Run: `node build_db.js`
Expected: `js/code_db.js` regenerated; `git diff --stat js/code_db.js` shows only the `codeGcMemory` string changed.

- [ ] **Step 3: Extend the description** — in `js/desc_db.js`, add to the `gc-memory` entry two bullet lines (English) describing: *Pointer-Reversal Mark (MARK2)* — stack-free marking that temporarily reverses links and restores them on the way back; and *Compaction (COMPACT)* — 3-pass sliding compaction (assign new addresses, rewrite links, relocate).

- [ ] **Step 4: Extend the slides** — in `slides_db.js`, add to `SLIDES_DB["gc-memory"].slides` one slide covering pointer reversal and one covering compaction, bilingual `{zh, en}`, reusing the phrasing from the spec. Then:

Run: `npm run build:slides`
Expected: `slides/en/gc-memory.md`, `slides/zh/gc-memory.md`, and `js/slides_rendered.js` regenerated; `git status` shows only these gc-memory slide artifacts changed (no unrelated slide churn — if other slide files change, STOP and report).

- [ ] **Step 5: Full verification**

Run: `npm run test:unit`
Expected: PASS (all unit tests, including the two new gc frame-builder tests).

Run: `npm test`
Expected: PASS (full Playwright, including `tier3.spec.js` gc-memory mode switching and `smoke_modes.spec.js` gc-memory load-without-console-errors).

- [ ] **Step 6: Commit**

```bash
git add cpp/gc_memory.cpp js/code_db.js js/desc_db.js slides_db.js slides/en/gc-memory.md slides/zh/gc-memory.md js/slides_rendered.js
git commit -m "docs(dsvisual): code drawer, description & slides for MARK2/COMPACT gc modes"
```

---

## Self-Review

- **Spec coverage:** MARK2 builder (Task 1), COMPACT builder (Task 2), both renderers + CSS + e2e (Task 3), code drawer + desc + slides + full verify (Task 4) — every spec section maps to a task.
- **Placeholder scan:** none — all steps carry concrete code or exact commands. Task 4 Steps 1/3/4 describe content additions rather than verbatim code (prose/C++/bilingual slides authored during implementation), with exact files, regen commands, and expected diffs.
- **Type consistency:** frame shapes in Tasks 1–2 (`{phase,p,q,nodes[...]}`, `{phase,active,av,pass,total,blocks[...]}`) match exactly what Task 3's render branches read (`fr.phase`, `fr.p`, `fr.q`, `fr.nodes[].{mark,dlink,rlink,dRev,rRev,tag}`; `fr.blocks[].{live,addr,size,newAddr,link}`, `fr.total`, `fr.pass`, `fr.active`). Dropdown ids (`pointer-reversal`, `compact`) match the dispatch strings in `gcMemoryFrames`.
