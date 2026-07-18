# decision-tree-coins viz — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new dsvisual `decision-tree-coins` visualization for the 8-coins puzzle: draw the ternary EIGHTCOINS decision tree and let the user pick a hidden counterfeit (coin + heavy/light) then walk the ≤3 weighings with a tilting balance, highlighting the current tree path, ending at the correctly identified coin.

**Architecture:** Pure `js/decision_tree_coins_viz.js` (`DecisionTreeCoinsViz`) transcribes the deck's EIGHTCOINS/COMP procedure and builds the decision tree by running it over all 16 scenarios; render module `js/viz/viz_decision_tree_coins.js` (VizRegistry/VizKit seam) draws a balance SVG + the decision tree as a nested HTML list with path highlight; `cpp/decision_tree_coins.cpp` → `js/code_db.js`; `js/desc_db.js` entry. Unit + e2e.

**Tech Stack:** Vanilla JS dual-export IIFE modules, `node --test` unit tests, Playwright e2e, C++ code drawer via `build_db.js`.

## Global Constraints

- Post-refactor layout (verified on `main` @ 3175abc): per-viz renderers live in `js/viz/viz_*.js` using `K() = global.VizKit`; a viz self-registers via `global.VizRegistry.attach(id, {render, code, layout})`. A NEW viz needs: a `METHOD_GROUPS` trees-group row (app.js), the render module, **TWO** `index.html` `<script defer>` tags (pure then render, after `js/code_db.js`, before `js/app.js`), a `build_db.js` cpp→code mapping, and a `desc_db.js` entry.
- Faithful to the deck's EIGHTCOINS/COMP. Coins a…h = indices 0…7; base 10, fake = 10±1. `weigh(scenario,L,R)=sign(sum(L)-sum(R))`. W1 `{0,1,2}v{3,4,5}`; if `=` W2 `{6}v{7}` then COMP vs `{0}`; if `>`/`<` W2 `{0,3}v{1,4}` then COMP. Decision tree built by running decide() over all 16 scenarios (guaranteed consistent; 16 leaves).
- Bilingual zh/en for all UI text via `K().langOf`. `desc_db.js` English-only file-wide; styled `class="complexities"`. Step/Run/Reset via `K().buildStepControls`.
- Additive only — no change to other viz/methods. Commit discipline: targeted `git add` of only each task's named files; a concurrent refactor session may touch this repo — run `git status` before committing, NEVER `git add -A`/`.`/`-u`; add exactly the one registry row.
- Tests: unit `npm run test:unit`; e2e `npm test`.

**Worked scenarios:** c heavy (fake=2, heavy) → identified `c heavy`; g light (fake=6, light) → `g light`.

---

### Task 1: Pure decision logic (`DecisionTreeCoinsViz`) + unit tests

**Files:**
- Create: `js/decision_tree_coins_viz.js`
- Test: `tests/unit/decision_tree_coins_viz.test.js`

**Interfaces:**
- Produces (used by Task 2):
  - `COINS` (`['a'..'h']`), `weigh(scenario,L,R)->-1|0|1`
  - `decide(scenario)->{path:[{left,right,outcome}], verdict:{coin,heavy}}`
  - `buildDecisionTree()->Node` (`Node = {key, weigh:{left,right}, children:{'-1'|'0'|'1':Node}} | {key, leaf:{coin,heavy}}`)
  - `allScenariosCorrect()->boolean`, `allScenarios()->[{fake,heavy}]` (16)
  - `buildCoinsFrames(scenario)->{frames, verdict}`; Frame = `{step,left,right,outcome,nodeKey,verdict|null,action:'weigh'|'done',msg:{zh,en}}`.

- [ ] **Step 1: Write the failing unit test** — create `tests/unit/decision_tree_coins_viz.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { weigh, decide, buildDecisionTree, allScenariosCorrect, allScenarios, buildCoinsFrames } = require('../../js/decision_tree_coins_viz');

test('weigh compares index-set totals with a ±1 fake', () => {
  const s = { fake: 2, heavy: true };            // c heavy
  assert.equal(weigh(s, [0, 1, 2], [3, 4, 5]), 1);
  assert.equal(weigh(s, [0], [1]), 0);
  const t = { fake: 6, heavy: false };           // g light
  assert.equal(weigh(t, [6], [7]), -1);
});

test('decide identifies all 16 scenarios; each outcome matches weigh', () => {
  assert.equal(allScenariosCorrect(), true);
  for (const s of allScenarios()) {
    const { path, verdict } = decide(s);
    assert.deepEqual(verdict, { coin: s.fake, heavy: s.heavy });
    assert.ok(path.length >= 2 && path.length <= 3);
    for (const w of path) assert.equal(w.outcome, weigh(s, w.left, w.right));
  }
});

test('pinned scenarios: c heavy and g light', () => {
  assert.deepEqual(decide({ fake: 2, heavy: true }).verdict, { coin: 2, heavy: true });
  assert.deepEqual(decide({ fake: 6, heavy: false }).verdict, { coin: 6, heavy: false });
});

test('decision tree has 16 leaves', () => {
  let leaves = 0;
  (function count(n) { if (!n) return; if (n.leaf) { leaves++; return; } for (const o of ['-1', '0', '1']) if (n.children[o]) count(n.children[o]); })(buildDecisionTree());
  assert.equal(leaves, 16);
});

test('buildCoinsFrames ends in a done verdict; frames bilingual', () => {
  const { frames, verdict } = buildCoinsFrames({ fake: 2, heavy: true });
  assert.deepEqual(verdict, { coin: 2, heavy: true });
  assert.equal(frames[frames.length - 1].action, 'done');
  for (const f of frames) assert.ok(f.msg.zh && f.msg.en);
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm run test:unit`
Expected: FAIL — cannot find module `../../js/decision_tree_coins_viz`.

- [ ] **Step 3: Create `js/decision_tree_coins_viz.js`:**

```js
(function (global) {
  const COINS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  function weigh(scenario, L, R) {
    const w = (i) => 10 + (i === scenario.fake ? (scenario.heavy ? 1 : -1) : 0);
    const sum = (arr) => arr.reduce((t, i) => t + w(i), 0);
    const d = sum(L) - sum(R);
    return d > 0 ? 1 : (d < 0 ? -1 : 0);
  }

  // Faithful transcription of the deck's EIGHTCOINS / COMP procedure.
  function decide(scenario) {
    const path = [];
    const W = (L, R) => { const o = weigh(scenario, L, R); path.push({ left: L, right: R, outcome: o }); return o; };
    // COMP(x, y, z): weigh {x} vs good {z}; >0 -> x heavy, else y light.
    const comp = (x, y, z) => { const o = W([x], [z]); return o > 0 ? { coin: x, heavy: true } : { coin: y, heavy: false }; };
    const a = 0, b = 1, c = 2, d = 3, e = 4, f = 5, g = 6, h = 7;
    let verdict;
    const w1 = W([a, b, c], [d, e, f]);
    if (w1 === 0) {
      const w2 = W([g], [h]);
      verdict = (w2 > 0) ? comp(g, h, a) : comp(h, g, a);
    } else if (w1 > 0) {
      const w2 = W([a, d], [b, e]);
      if (w2 === 0) verdict = comp(c, f, a);
      else if (w2 > 0) verdict = comp(a, e, b);
      else verdict = comp(b, d, a);
    } else {
      const w2 = W([a, d], [b, e]);
      if (w2 === 0) verdict = comp(f, c, a);
      else if (w2 > 0) verdict = comp(d, b, a);
      else verdict = comp(e, a, b);
    }
    return { path, verdict };
  }

  function allScenarios() {
    const out = [];
    for (let fake = 0; fake < 8; fake++) for (const heavy of [true, false]) out.push({ fake, heavy });
    return out;
  }

  function allScenariosCorrect() {
    return allScenarios().every((s) => {
      const v = decide(s).verdict;
      return v.coin === s.fake && v.heavy === s.heavy;
    });
  }

  function buildDecisionTree() {
    const runs = allScenarios().map((s) => { const r = decide(s); return { verdict: r.verdict, path: r.path }; });
    function build(depth, subset, key) {
      const withW = subset.filter((r) => r.path.length > depth);
      if (withW.length === 0) return { key, leaf: subset[0].verdict };
      const wg = withW[0].path[depth];
      const children = {};
      for (const o of [-1, 0, 1]) {
        const child = subset.filter((r) => r.path[depth] && r.path[depth].outcome === o);
        if (child.length) children[String(o)] = build(depth + 1, child, key + '.' + o);
      }
      return { key, weigh: { left: wg.left, right: wg.right }, children };
    }
    return build(0, runs, 'r');
  }

  function buildCoinsFrames(scenario) {
    const { path, verdict } = decide(scenario);
    const frames = [];
    let key = 'r';
    const fmt = (arr) => arr.map((i) => COINS[i]).join('');
    path.forEach((wg, k) => {
      const sym = wg.outcome > 0 ? '>' : (wg.outcome < 0 ? '<' : '=');
      frames.push({
        step: k + 1, left: wg.left, right: wg.right, outcome: wg.outcome, nodeKey: key, verdict: null, action: 'weigh',
        msg: {
          zh: '第 ' + (k + 1) + ' 次秤:' + fmt(wg.left) + ' 對 ' + fmt(wg.right) + ' → ' + (wg.outcome > 0 ? '左重' : wg.outcome < 0 ? '右重' : '平衡') + ' (' + sym + ')',
          en: 'weighing ' + (k + 1) + ': ' + fmt(wg.left) + ' vs ' + fmt(wg.right) + ' → ' + (wg.outcome > 0 ? 'left heavier' : wg.outcome < 0 ? 'right heavier' : 'balanced') + ' (' + sym + ')',
        },
      });
      key = key + '.' + wg.outcome;
    });
    frames.push({
      step: path.length, left: [], right: [], outcome: null, nodeKey: key, verdict, action: 'done',
      msg: {
        zh: '找到:硬幣 ' + COINS[verdict.coin] + ' 為' + (verdict.heavy ? '較重' : '較輕') + '的偽幣',
        en: 'identified: coin ' + COINS[verdict.coin] + ' is the ' + (verdict.heavy ? 'heavy' : 'light') + ' counterfeit',
      },
    });
    return { frames, verdict };
  }

  const api = { COINS, weigh, decide, allScenarios, allScenariosCorrect, buildDecisionTree, buildCoinsFrames };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.DecisionTreeCoinsViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 4: Run, verify pass**

Run: `npm run test:unit`
Expected: PASS (existing unit tests + the 5 new `decision_tree_coins` tests). Note: `path.length` is 3 for every scenario (W1,W2,W3); the test's `>=2` bound is a safe floor.

- [ ] **Step 5: Commit**

```bash
cd /Users/skhuang/course/dsvisual
git add js/decision_tree_coins_viz.js tests/unit/decision_tree_coins_viz.test.js
git commit -m "feat(dsvisual): 8-coins decision logic (EIGHTCOINS/COMP, decision tree, all-16 check)"
```

---

### Task 2: Render module + registry + index.html + CSS + e2e

**Files:**
- Create: `js/viz/viz_decision_tree_coins.js`
- Modify: `js/app.js` (one `METHOD_GROUPS` trees-group row)
- Modify: `index.html` (two `<script defer>` tags)
- Modify: `style.css` (append coins CSS)
- Test: `tests/decision_tree_coins.spec.js`

**Interfaces:**
- Consumes (Task 1): `DecisionTreeCoinsViz.buildCoinsFrames`, `.buildDecisionTree`, `.allScenariosCorrect`, `.COINS`.

- [ ] **Step 1: Add the registry row** in `js/app.js`, in the `METHOD_GROUPS` trees group, immediately after the `tree-general-binary` row:

```js
            { id: 'decision-tree-coins', title: '8-Coins Decision Tree', file: 'decision_tree_coins.cpp', visualizer: 'coins', controls: 'coins' },
```

- [ ] **Step 2: Add BOTH script tags** in `index.html`, immediately after the existing `<script src="js/viz/viz_expr_tree.js" defer></script>` line (pure first, then render):

```html
    <script src="js/decision_tree_coins_viz.js" defer></script>
    <script src="js/viz/viz_decision_tree_coins.js" defer></script>
```

- [ ] **Step 3: Create `js/viz/viz_decision_tree_coins.js`:**

```js
(function (global) {
    const K = () => global.VizKit;
    const V = () => global.DecisionTreeCoinsViz;

    // Small tilting balance: outcome > 0 => left pan down.
    function balanceSVG(left, right, outcome, langOf) {
        const cx = 150, cy = 34, arm = 96;
        const a = (outcome || 0) * 9 * Math.PI / 180;
        const lx = cx - arm * Math.cos(a), ly = cy + arm * Math.sin(a);
        const rx = cx + arm * Math.cos(a), ry = cy - arm * Math.sin(a);
        const pan = (px, py, coins, side) =>
            '<line x1="' + px + '" y1="' + py + '" x2="' + px + '" y2="' + (py + 26) + '" stroke="#94a3b8"/>' +
            '<rect x="' + (px - 34) + '" y="' + (py + 26) + '" width="68" height="20" rx="4" fill="#eef3f9" stroke="#94a3b8"/>' +
            '<text x="' + px + '" y="' + (py + 40) + '" text-anchor="middle" font-size="12" font-family="monospace">' + (coins.length ? coins.map((i) => V().COINS[i]).join(' ') : '·') + '</text>';
        return '<svg class="dc-balance" width="300" height="110">' +
            '<line x1="' + cx + '" y1="' + cy + '" x2="' + cx + '" y2="92" stroke="#64748b" stroke-width="3"/>' +
            '<line x1="' + lx + '" y1="' + ly + '" x2="' + rx + '" y2="' + ry + '" stroke="#1a4d8f" stroke-width="4"/>' +
            pan(lx, ly, left, 'L') + pan(rx, ry, right, 'R') + '</svg>';
    }

    function activeKeys(nodeKey) {
        const parts = nodeKey.split('.');
        const keys = [];
        for (let i = 0; i < parts.length; i++) keys.push(parts.slice(0, i + 1).join('.'));
        return new Set(keys);
    }

    function treeHTML(n, edgeSym, active, COINS) {
        const hl = active.has(n.key) ? ' dc-active' : '';
        const edge = edgeSym ? '<span class="dc-edge">' + edgeSym + '</span> ' : '';
        if (n.leaf) return '<li class="dc-leaf' + hl + '">' + edge + COINS[n.leaf.coin] + ' ' + (n.leaf.heavy ? '↑' : '↓') + '</li>';
        const fmt = (arr) => arr.map((i) => COINS[i]).join('');
        let h = '<li class="dc-tnode' + hl + '">' + edge + '<span class="dc-weigh">' + fmt(n.weigh.left) + ' ? ' + fmt(n.weigh.right) + '</span><ul>';
        const syms = { '-1': '<', '0': '=', '1': '>' };
        for (const o of ['-1', '0', '1']) if (n.children[o]) h += treeHTML(n.children[o], syms[o], active, COINS);
        return h + '</ul></li>';
    }

    let _state = null;
    function renderDecisionTreeCoins() {
        const host = K().acquireDynamicVizHost();
        if (!_state) _state = { fake: 2, heavy: true };
        const st = _state;
        const langOf = K().langOf;
        const COINS = V().COINS;
        const res = V().buildCoinsFrames({ fake: st.fake, heavy: st.heavy });
        const frames = res.frames;
        const tree = V().buildDecisionTree();
        let idx = 0;

        const coinBtns = COINS.map((c, i) => '<button type="button" class="dc-coin' + (i === st.fake ? ' active' : '') + '" data-coin="' + i + '">' + c + '</button>').join('');
        host.innerHTML =
            '<div class="dc-controls">' +
              '<span class="sm-hint">' + langOf({ zh: '選偽幣與方向,逐步秤 3 次找出它', en: 'pick the fake coin + direction; step the ≤3 weighings to find it' }) + '</span>' +
              '<div class="dc-coins">' + coinBtns + '</div>' +
              '<div class="dc-dir">' +
                '<button type="button" class="dc-hl' + (st.heavy ? ' active' : '') + '" data-heavy="1">' + langOf({ zh: '較重', en: 'heavy' }) + '</button>' +
                '<button type="button" class="dc-hl' + (!st.heavy ? ' active' : '') + '" data-heavy="0">' + langOf({ zh: '較輕', en: 'light' }) + '</button>' +
                '<button type="button" class="rand-btn" title="Random">🎲</button>' +
                '<button type="button" class="dc-verify">' + langOf({ zh: '驗證全部 16', en: 'verify all 16' }) + '</button>' +
                '<span class="dc-verifyout"></span>' +
              '</div>' +
            '</div>' +
            '<div class="dc-balancewrap"></div>' +
            '<div class="dc-verdict"></div>' +
            '<div class="dc-treewrap"><div class="dc-treetitle">' + langOf({ zh: '決策樹(< = > 為秤重結果)', en: 'decision tree (< = > = weighing outcome)' }) + '</div><ul class="dc-tree"></ul></div>' +
            '<div class="et-phase"></div>';

        function paint() {
            const fr = frames[idx];
            if (!host.querySelector('.dc-treewrap')) return;
            host.querySelector('.dc-balancewrap').innerHTML = balanceSVG(fr.left, fr.right, fr.outcome, langOf);
            const active = activeKeys(fr.nodeKey);
            host.querySelector('.dc-tree').innerHTML = treeHTML(tree, null, active, COINS);
            const v = host.querySelector('.dc-verdict');
            if (fr.action === 'done') { v.className = 'dc-verdict dc-ok'; v.textContent = langOf(fr.msg); }
            else { v.className = 'dc-verdict'; v.textContent = ''; }
            host.querySelector('.et-phase').textContent = langOf(fr.msg);
        }
        function step() { if (idx < frames.length - 1) { idx++; paint(); return idx < frames.length - 1; } return false; }
        function reset() { idx = 0; paint(); }

        host.appendChild(K().buildStepControls(step, reset, 900));
        paint();

        host.querySelectorAll('.dc-coin').forEach((b) => { b.onclick = () => { st.fake = parseInt(b.getAttribute('data-coin'), 10); renderDecisionTreeCoins(); }; });
        host.querySelectorAll('.dc-hl').forEach((b) => { b.onclick = () => { st.heavy = b.getAttribute('data-heavy') === '1'; renderDecisionTreeCoins(); }; });
        host.querySelector('.rand-btn').onclick = () => { st.fake = Math.floor(Math.random() * 8); st.heavy = Math.random() < 0.5; renderDecisionTreeCoins(); };
        host.querySelector('.dc-verify').onclick = () => {
            const ok = V().allScenariosCorrect();
            const out = host.querySelector('.dc-verifyout');
            out.textContent = ok ? langOf({ zh: '全部 16 種皆正確 ✓', en: 'all 16 correct ✓' }) : '✗';
            out.className = 'dc-verifyout ' + (ok ? 'dc-ok' : 'dc-err');
        };
    }

    global.VizRegistry.attach('decision-tree-coins', {
        render: renderDecisionTreeCoins,
        code: () => (typeof codeDecisionTreeCoins !== 'undefined' ? codeDecisionTreeCoins : ''),
        layout: { host: 'dynamic' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 4: Append CSS** to `style.css`:

```css
/* decision-tree-coins */
.dc-coins { display: flex; gap: 4px; margin: 6px 0; }
.dc-coin { width: 28px; height: 28px; border: 1px solid #cbd5e1; background: #fff; border-radius: 6px; cursor: pointer; font-family: 'Fira Code', monospace; }
.dc-coin.active { background: #1a4d8f; color: #fff; border-color: #1a4d8f; }
.dc-dir { display: flex; gap: 6px; align-items: center; }
.dc-hl { padding: 3px 10px; border: 1px solid #cbd5e1; background: #f8fafc; border-radius: 999px; cursor: pointer; font-size: 12px; }
.dc-hl.active { background: #1a4d8f; color: #fff; border-color: #1a4d8f; }
.dc-verify { padding: 3px 10px; border: 1px solid #cbd5e1; background: #f8fafc; border-radius: 6px; cursor: pointer; font-size: 12px; }
.dc-verifyout { font-size: 12px; font-weight: 700; }
.dc-balancewrap { margin: 8px 0; }
.dc-verdict { font-weight: bold; margin: 4px 0; }
.dc-verdict.dc-ok, .dc-verifyout.dc-ok { color: #16a34a; }
.dc-verifyout.dc-err { color: #dc2626; }
.dc-treewrap { margin-top: 10px; overflow-x: auto; }
.dc-treetitle { font-weight: 700; font-size: 13px; margin-bottom: 4px; }
ul.dc-tree, ul.dc-tree ul { list-style: none; margin: 0; padding-left: 18px; }
.dc-tree li { font-family: 'Fira Code', monospace; font-size: 12px; line-height: 1.7; }
.dc-edge { display: inline-block; min-width: 14px; color: #b8336a; font-weight: 700; }
.dc-tnode.dc-active > .dc-weigh, .dc-leaf.dc-active { background: #fef9c3; border-radius: 3px; padding: 0 3px; }
.dc-leaf { color: #1a4d8f; }
```

- [ ] **Step 5: Create the e2e test** `tests/decision_tree_coins.spec.js`:

```js
const { test, expect } = require('@playwright/test');
const { loadMethod } = require('./helpers');
const path = require('path');

test.describe('8-Coins Decision Tree', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
        await page.goto('file://' + path.resolve(__dirname, '../index.html'));
        await loadMethod(page, 'decision-tree-coins');
    });

    test('identifies c heavy', async ({ page }) => {
        const sec = page.locator('[data-method-section="decision-tree-coins"]');
        await sec.locator('.dc-coin[data-coin="2"]').click();       // c
        await sec.locator('.dc-hl[data-heavy="1"]').click();        // heavy
        await sec.locator('.stepctl [data-action="run"]').click();
        await expect(sec.locator('.dc-verdict.dc-ok')).toContainText('coin c', { timeout: 15000 });
        await expect(sec.locator('.dc-verdict.dc-ok')).toContainText('heavy');
    });

    test('identifies g light', async ({ page }) => {
        const sec = page.locator('[data-method-section="decision-tree-coins"]');
        await sec.locator('.dc-coin[data-coin="6"]').click();       // g
        await sec.locator('.dc-hl[data-heavy="0"]').click();        // light
        await sec.locator('.stepctl [data-action="run"]').click();
        await expect(sec.locator('.dc-verdict.dc-ok')).toContainText('coin g', { timeout: 15000 });
        await expect(sec.locator('.dc-verdict.dc-ok')).toContainText('light');
    });

    test('verify all 16 shows a pass and the tree renders 16 leaves', async ({ page }) => {
        const sec = page.locator('[data-method-section="decision-tree-coins"]');
        await sec.locator('.dc-verify').click();
        await expect(sec.locator('.dc-verifyout.dc-ok')).toContainText('16');
        await expect(sec.locator('.dc-tree .dc-leaf')).toHaveCount(16);
    });
});
```

- [ ] **Step 6: Run e2e; verify pass**

Run: `npm test -- decision_tree_coins`
Expected: 3 tests pass. If the `[data-action="run"]` step-control selector differs, mirror `tests/tree_expression.spec.js` and re-run.

- [ ] **Step 7: Commit**

```bash
cd /Users/skhuang/course/dsvisual
git add js/viz/viz_decision_tree_coins.js js/app.js index.html style.css tests/decision_tree_coins.spec.js
git commit -m "feat(dsvisual): decision-tree-coins render UI + registry + e2e (balance + decision tree)"
```

---

### Task 3: C++ code drawer + description

**Files:**
- Create: `cpp/decision_tree_coins.cpp`
- Modify: `build_db.js` (add cpp→code mapping)
- Modify: `js/code_db.js` (regenerated)
- Modify: `js/desc_db.js` (add `decision-tree-coins` entry)

- [ ] **Step 1: Create `cpp/decision_tree_coins.cpp`:**

```cpp
#include <iostream>
#include <array>

// The 8-coins puzzle as a ternary decision tree (Horowitz & Sahni EIGHTCOINS).
// One of coins a..h is counterfeit (heavier or lighter); find it in 3 weighings.
struct Result { char coin; bool heavy; };

// z is a known-good coin; exactly one of x,y is the fake.
Result comp(int x, char lx, int y, char ly, int z) {
    if (x > z) return { lx, true };
    else       return { ly, false };
}

// weights a..h at indices 0..7 (base value, the fake is ±1).
Result eightCoins(const std::array<int, 8>& w) {
    int a = w[0], b = w[1], c = w[2], d = w[3], e = w[4], f = w[5], g = w[6], h = w[7];
    if (a + b + c == d + e + f) {                    // fake in {g, h}
        return (g > h) ? comp(g, 'g', h, 'h', a) : comp(h, 'h', g, 'g', a);
    } else if (a + b + c > d + e + f) {              // abc side heavier
        if (a + d == b + e) return comp(c, 'c', f, 'f', a);
        else if (a + d > b + e) return comp(a, 'a', e, 'e', b);
        else return comp(b, 'b', d, 'd', a);
    } else {                                          // def side heavier
        if (a + d == b + e) return comp(f, 'f', c, 'c', a);
        else if (a + d > b + e) return comp(d, 'd', b, 'b', a);
        else return comp(e, 'e', a, 'a', b);
    }
}
```

- [ ] **Step 2: Add the cpp→code mapping** in `build_db.js` — add to the `mappings` object near the other `tree_*.cpp` entries:

```js
    'decision_tree_coins.cpp': 'codeDecisionTreeCoins',
```

- [ ] **Step 3: Regenerate the code drawer string**

Run: `node build_db.js`
Expected: `js/code_db.js` gains `const codeDecisionTreeCoins = \`...\`;`. `git diff --stat js/code_db.js` shows only that addition. If `build_db.js` rewrites unrelated `codeXxx` entries with spurious diffs, STOP and report.

- [ ] **Step 4: Add the description entry** in `js/desc_db.js` — add a `'decision-tree-coins'` key (English, matching the flat `key: \`<html>\`` shape; place near other tree entries):

```js
    'decision-tree-coins': `
        <h3>The 8-Coins Puzzle — a Ternary Decision Tree</h3>
        <p>Among 8 coins one is counterfeit — heavier or lighter — and an equal-arm balance gives three outcomes per weighing (left down, balanced, right down). This is a <strong>ternary decision tree</strong>: each internal node is a weighing, each of its three edges an outcome, and each leaf names the fake coin and its direction.</p>
        <p>Three weighings give <code>3³ = 27</code> leaves, enough to distinguish the <code>16</code> possible answers (8 coins × heavy/light) — an information-theoretic argument for why 3 weighings suffice. The viz walks the fixed EIGHTCOINS procedure for any chosen fake and verifies it identifies all 16.</p>
        <div class="complexities">
            <span class="badge time">Weighings: 3</span>
            <span class="badge space">Outcomes: 3³ = 27 ≥ 16</span>
        </div>
    `,
```

- [ ] **Step 5: Sanity-check**

Run: `npm test -- decision_tree_coins` and `npm run test:unit`
Expected: still green. Optionally open `index.html`, select "8-Coins Decision Tree", confirm the code drawer shows `decision_tree_coins.cpp` and the info panel shows the description.

- [ ] **Step 6: Commit**

```bash
cd /Users/skhuang/course/dsvisual
git add cpp/decision_tree_coins.cpp build_db.js js/code_db.js js/desc_db.js
git commit -m "feat(dsvisual): C++ code drawer + description for decision-tree-coins"
```

---

## Notes for the executor

- **Concurrent refactor session:** before each commit run `git status` and stage ONLY the task's named files. Never `git add -A`/`.`/`-u`.
- Task ordering: Task 1 (pure) → Task 2 (render, consumes Task 1; needs BOTH index.html tags — pure before render) → Task 3 (code drawer; the render's `code:` callback tolerates `codeDecisionTreeCoins` undefined until Task 3).
- `.et-phase` is reused from existing tree viz (shared CSS exists); all `.dc-*` classes are new (Task 2 Step 4). This viz renders its own balance SVG + a nested-list decision tree; it does NOT use the shared `.et-stage` tree canvas.
- `desc_db` uses `class="complexities"` (plural, styled) — not the unstyled singular `complexity`.
- e2e step-control selectors: if `[data-action="run"]` is wrong, mirror `tests/tree_expression.spec.js`.
