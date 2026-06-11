# Tier-2 Batch E4: Expression Tree — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the `tree-expression` dsvisual visualization (build an expression tree from a postfix expression using a stack of subtrees, then evaluate it) in the `trees` group, with Step/Run/Reset (inherits Pause/Resume + speed), bilingual UI + slides, and tests.

**Architecture:** Pure frame-generator in `js/tree_expression_viz.js` (dual-export, like `js/heap_models.js`), unit-tested under `node --test`. DOM renderer `renderTreeExpression` in `js/app.js` using `acquireDynamicVizHost()` + `buildStepControls()` + `computeTreeLayout()`. The stack-of-subtrees is drawn as a horizontal forest (reusing `computeTreeLayout` per root, like the huffman forest); follows the node-drawing rules (`.tree-node` translate-centered, edges at (x,y), `overflow:hidden`). Files under `cpp/` + `js/`.

**Tech Stack:** Vanilla JS (IIFE module + browser globals), Node test runner, Playwright, Marp slides.

**Spec:** `docs/superpowers/specs/2026-06-09-tier2-visualizations-design.md` (§3.7 tree-expression).

---

## File Structure
- `js/tree_expression_viz.js` (new pure module)
- `cpp/tree_expression.cpp` (new C++ ref)
- `tests/unit/tree_expression_viz.test.js`, `tests/tree_expression.spec.js` (new)
- modify: `js/app.js`, `build_db.js`, `js/i18n.js`, `js/desc_db.js`, `slides_db.js`, `index.html`, `style.css`
- regenerated: `js/code_db.js`, `js/slides_rendered.js` (+ slides md)

---

## Task 1: Feature branch + expression-tree pure module (TDD)

**Files:** Create `js/tree_expression_viz.js`, `tests/unit/tree_expression_viz.test.js`.

- [ ] **Step 1: Branch**
```bash
cd /Users/skhuang/course/dsvisual
git checkout main && git pull --ff-only
git checkout -b feat/tier2-batch-e4
git branch --show-current
```
Expected: `feat/tier2-batch-e4`.

- [ ] **Step 2: Write the failing unit test**

Create `tests/unit/tree_expression_viz.test.js`:
```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { tokenizePostfix, buildExprTreeFrames, evalExprTree } = require('../../js/tree_expression_viz');

function countNodes(n) { return n ? 1 + countNodes(n.left) + countNodes(n.right) : 0; }
function eachNode(n, fn) { if (!n) return; fn(n); eachNode(n.left, fn); eachNode(n.right, fn); }

test('tokenizePostfix splits on whitespace', () => {
  assert.deepEqual(tokenizePostfix('3 4 + 5 *'), ['3', '4', '+', '5', '*']);
  assert.deepEqual(tokenizePostfix('  A B C +  *  '), ['A', 'B', 'C', '+', '*']);
});

test('numeric postfix builds a tree that evaluates correctly', () => {
  const { root } = buildExprTreeFrames(tokenizePostfix('3 4 + 5 *'));
  assert.equal(evalExprTree(root), 35);            // (3+4)*5
  const { root: r2 } = buildExprTreeFrames(tokenizePostfix('6 2 / 1 -'));
  assert.equal(evalExprTree(r2), 2);               // 6/2 - 1
});

test('operators are internal (2 children), operands are leaves; node count = token count', () => {
  const tokens = tokenizePostfix('3 4 + 5 *');
  const { root } = buildExprTreeFrames(tokens);
  assert.equal(countNodes(root), tokens.length);
  eachNode(root, (n) => {
    const op = ['+', '-', '*', '/'].includes(n.val);
    if (op) { assert.ok(n.left && n.right, 'operator must have 2 children'); }
    else { assert.equal(n.left, null); assert.equal(n.right, null); }
  });
});

test('frames build up to a single-root forest and carry bilingual msg', () => {
  const { frames } = buildExprTreeFrames(tokenizePostfix('A B C + * D *'));
  const last = frames[frames.length - 1];
  assert.equal(last.forest.length, 1);
  for (const f of frames) { assert.ok(f.msg.zh && f.msg.en); assert.ok(Array.isArray(f.forest)); }
});
```

- [ ] **Step 3: Run — expect FAIL**

Run: `cd /Users/skhuang/course/dsvisual && node --test tests/unit/tree_expression_viz.test.js`
Expected: FAIL — `Cannot find module '../../js/tree_expression_viz'`.

- [ ] **Step 4: Implement `js/tree_expression_viz.js`**

Create `js/tree_expression_viz.js`:
```js
(function (global) {
  const isOp = (t) => t === '+' || t === '-' || t === '*' || t === '/';

  function tokenizePostfix(str) {
    return String(str).trim().split(/\s+/).filter((s) => s.length);
  }

  function buildExprTreeFrames(tokens) {
    let idc = 0;
    const node = (val, left, right) => ({ id: 'ex-' + (idc++), val: val, left: left || null, right: right || null });
    const clone = (n) => n ? { id: n.id, val: n.val, left: clone(n.left), right: clone(n.right) } : null;
    const stack = [];
    const frames = [];
    const snap = (token, action, msg) => frames.push({ token, action, forest: stack.map(clone), msg });

    snap(null, 'start', { zh: '開始由後序式建立運算式樹', en: 'Begin building the expression tree from postfix' });
    for (const t of tokens) {
      if (isOp(t)) {
        const r = stack.pop() || null;
        const l = stack.pop() || null;
        stack.push(node(t, l, r));
        snap(t, 'combine', { zh: '運算子 ' + t + ':彈出兩棵子樹合併', en: 'Operator ' + t + ': pop two subtrees and combine' });
      } else {
        stack.push(node(t, null, null));
        snap(t, 'leaf', { zh: '運算元 ' + t + ':建立葉節點並推入', en: 'Operand ' + t + ': create a leaf and push' });
      }
    }
    const root = stack.length === 1 ? stack[0] : null;
    snap(null, 'done', { zh: '完成,運算式樹建立完畢', en: 'Done; expression tree built' });
    return { frames, root };
  }

  function evalExprTree(root) {
    if (!root) return NaN;
    if (!root.left && !root.right) { const v = parseFloat(root.val); return Number.isNaN(v) ? NaN : v; }
    const a = evalExprTree(root.left), b = evalExprTree(root.right);
    if (root.val === '+') return a + b;
    if (root.val === '-') return a - b;
    if (root.val === '*') return a * b;
    if (root.val === '/') return b === 0 ? NaN : a / b;
    return NaN;
  }

  const api = { tokenizePostfix, buildExprTreeFrames, evalExprTree };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.ExprTreeViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 5: Run — expect PASS**

Run: `cd /Users/skhuang/course/dsvisual && node --test tests/unit/tree_expression_viz.test.js`
Expected: PASS — 4 tests (`# pass 4`, `# fail 0`). If an eval mismatch occurs, STOP and report the value returned.

- [ ] **Step 6: Commit**
```bash
cd /Users/skhuang/course/dsvisual
git add js/tree_expression_viz.js tests/unit/tree_expression_viz.test.js
git commit -m "feat(viz): expression-tree pure frame generator + unit tests"
```

---

## Task 2: C++ reference + code_db regeneration

**Files:** Create `cpp/tree_expression.cpp`; modify `build_db.js`; regenerate `js/code_db.js`.

- [ ] **Step 1: Create `cpp/tree_expression.cpp`**
```cpp
#include <stack>
#include <string>
#include <sstream>
#include <cctype>

// Build an expression tree from a postfix expression using a stack of subtrees.
struct ENode {
    std::string val;
    ENode* left = nullptr;
    ENode* right = nullptr;
};

ENode* buildExprTree(const std::string& postfix) {
    std::stack<ENode*> st;
    std::istringstream in(postfix);
    std::string tok;
    auto isOp = [](const std::string& s) {
        return s == "+" || s == "-" || s == "*" || s == "/";
    };
    while (in >> tok) {
        ENode* n = new ENode{ tok, nullptr, nullptr };
        if (isOp(tok)) {
            n->right = st.top(); st.pop();
            n->left = st.top(); st.pop();
        }
        st.push(n);
    }
    return st.empty() ? nullptr : st.top();
}

double evalExprTree(ENode* n) {
    if (!n) return 0;
    if (!n->left && !n->right) return std::stod(n->val);
    double a = evalExprTree(n->left), b = evalExprTree(n->right);
    if (n->val == "+") return a + b;
    if (n->val == "-") return a - b;
    if (n->val == "*") return a * b;
    return a / b;
}
```

- [ ] **Step 2: Register in `build_db.js`**

In `build_db.js` `mappings`, add:
```js
    'tree_expression.cpp': 'codeTreeExpression',
```

- [ ] **Step 3: Regenerate + verify**
```bash
cd /Users/skhuang/course/dsvisual
node build_db.js
grep -c 'const codeTreeExpression' js/code_db.js
```
Expected: build no error; count `1`.

- [ ] **Step 4: Commit**
```bash
cd /Users/skhuang/course/dsvisual
git add cpp/tree_expression.cpp build_db.js js/code_db.js
git commit -m "feat(viz): C++ ref for expression tree; regen code_db"
```

---

## Task 3: app.js registration + index.html

**Files:** Modify `js/app.js`, `index.html`.

- [ ] **Step 1: Register method in METHOD_GROUPS**

In `js/app.js`, in the `trees` group's `methods` array, after the `tree-mway` entry (`{ id: 'tree-mway', ... }`) add:
```js
            { id: 'tree-expression', title: 'Expression Tree', file: 'tree_expression.cpp', visualizer: 'exprtree', controls: 'exprtree' },
```

- [ ] **Step 2: code lookup in getCodeForMethod()**

In `js/app.js` `codeByMethod`, add:
```js
        'tree-expression': codeTreeExpression,
```

- [ ] **Step 3: updateLayout() branch**

After the existing `else if (currentMode === 'tree-mway') { ... }` block, add:
```js
        else if (currentMode === 'tree-expression') {
            codeTitle.textContent = 'tree_expression.cpp';
            codeDisplay.textContent = codeTreeExpression;
        }
```

- [ ] **Step 4: renderAll() dispatch**

In `js/app.js` `renderAll()`, find `else if (currentMode === 'tree-mway') renderTreeMway();` and add immediately AFTER it:
```js
        else if (currentMode === 'tree-expression') renderTreeExpression();
```

- [ ] **Step 5: stub**

Before `function renderSegmentTree()`, add:
```js
    function renderTreeExpression() { const host = acquireDynamicVizHost(); host.textContent = 'tree-expression (pending)'; }
```

- [ ] **Step 6: index.html — load module**

After `<script src="js/tree_mway_viz.js"></script>`, add:
```html
    <script src="js/tree_expression_viz.js"></script>
```

- [ ] **Step 7: Verify**
```bash
cd /Users/skhuang/course/dsvisual
node -c js/app.js && echo "app.js OK"
node -e "require('./js/tree_expression_viz.js'); console.log('module loads OK')"
grep -c "id: 'tree-expression'" js/app.js
grep -c "function renderTreeExpression" js/app.js
grep -c 'tree_expression_viz.js' index.html
grep -c "includes('tree')" js/app.js
```
Expected: `app.js OK`, `module loads OK`, then `1`, `1`, `1`, `0`. If `node -c` fails, STOP/BLOCKED.

- [ ] **Step 8: Commit**
```bash
cd /Users/skhuang/course/dsvisual
git add js/app.js index.html
git commit -m "feat(viz): register tree-expression; load module"
```

---

## Task 4: `renderTreeExpression()` + CSS

**Files:** Modify `js/app.js` (replace stub), `style.css`.

- [ ] **Step 1: Replace the `renderTreeExpression` stub**

In `js/app.js`, replace the `renderTreeExpression` stub line with:
```js
    let _exprTreeState = null;
    function renderTreeExpression() {
        const host = acquireDynamicVizHost();
        if (!_exprTreeState) _exprTreeState = { text: '3 4 + 5 *' };
        const st = _exprTreeState;
        const langOf = (m) => (window.I18N && window.I18N.getCurrentLanguage() === 'zh') ? m.zh : m.en;
        const tokens = ExprTreeViz.tokenizePostfix(st.text);
        const res = ExprTreeViz.buildExprTreeFrames(tokens);
        const frames = res.frames;
        let idx = 0;

        host.innerHTML =
            '<div class="et-controls"><input type="text" class="et-input" value="' + st.text + '"><button type="button" class="et-apply">Apply</button>' +
            '<span class="sm-hint">postfix; operands + operators (+ - * /), space-separated</span></div>' +
            '<div class="et-stack"><strong>Subtree stack:</strong> <span class="et-stack-cells"></span></div>' +
            '<div class="et-stage"><svg class="et-edges"></svg><div class="et-nodes"></div></div>' +
            '<div class="et-result"></div>' +
            '<div class="et-phase"></div>';

        function subtreeLabel(n) { return (!n.left && !n.right) ? n.val : '(' + subtreeLabel(n.left) + n.val + subtreeLabel(n.right) + ')'; }

        function paint() {
            const fr = frames[idx];
            if (!host.querySelector('.et-stage')) return;
            // lay out the forest: each subtree root gets its own horizontal band
            const W = host.querySelector('.et-stage').clientWidth || 720;
            const roots = fr.forest || [];
            const slot = W / (roots.length + 1);
            const allNodes = []; let svg = '';
            roots.forEach((rt, ri) => {
                const meta = [];
                computeTreeLayout(rt, (ri + 1) * slot, 30, Math.max(40, slot / 2.6), meta);
                const byId = {}; meta.forEach((m) => { byId[m.id] = m; });
                (function walk(n) { if (!n) return; [n.left, n.right].forEach((c) => { if (!c) return; const a = byId[n.id], b = byId[c.id]; svg += '<line x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '" stroke="#94a3b8" stroke-width="2"/>'; walk(c); }); })(rt);
                meta.forEach((m) => allNodes.push(m));
            });
            host.querySelector('.et-edges').innerHTML = svg;
            host.querySelector('.et-nodes').innerHTML = allNodes.map((m) =>
                '<div class="tree-node' + (['+', '-', '*', '/'].includes(String(m.val)) ? ' et-op' : '') + '" style="left:' + m.x + 'px;top:' + m.y + 'px">' + m.val + '</div>').join('');
            host.querySelector('.et-stack-cells').innerHTML = roots.map((rt) => '<span class="et-scell">' + subtreeLabel(rt) + '</span>').join('');
            if (fr.action === 'done' && roots.length === 1) {
                const v = ExprTreeViz.evalExprTree(roots[0]);
                host.querySelector('.et-result').textContent = Number.isNaN(v) ? 'Result: (symbolic expression)' : ('Result = ' + v);
            } else {
                host.querySelector('.et-result').textContent = '';
            }
            host.querySelector('.et-phase').textContent = (fr.token ? '[' + fr.token + '] ' : '') + langOf(fr.msg);
        }
        function step() { if (idx < frames.length - 1) { idx++; paint(); return idx < frames.length - 1; } return false; }
        function reset() { idx = 0; paint(); }

        host.appendChild(buildStepControls(step, reset, 700));
        paint();
        host.querySelector('.et-apply').onclick = () => { const v = host.querySelector('.et-input').value.trim(); if (v) { st.text = v; renderTreeExpression(); } };
    }
```

- [ ] **Step 2: Append CSS**

Append to `style.css`:
```css
.et-controls { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-bottom: 10px; }
.et-controls .et-input { flex: 1; min-width: 200px; }
.et-stack { margin: 6px 0; min-height: 26px; }
.et-scell { display: inline-block; padding: 3px 8px; margin: 2px; background: #e2e8f0; border: 1px solid #cbd5e1; border-radius: 5px; font-weight: 600; font-family: monospace; }
.et-stage { position: relative; height: 300px; overflow: hidden; }
.et-stage .et-edges { position: absolute; inset: 0; width: 100%; height: 100%; }
.et-stage .et-nodes { position: absolute; inset: 0; }
.tree-node.et-op { background: #f59e0b; border-color: #b45309; }
.et-result { font-weight: 700; color: #059669; min-height: 20px; margin-top: 4px; }
.et-phase { margin-top: 6px; color: #1e40af; font-style: italic; }
```
(Reuses `.tree-node` base; `.et-op` tints operator nodes.)

- [ ] **Step 3: Verify**
```bash
cd /Users/skhuang/course/dsvisual
node -c js/app.js && echo "app.js OK"
grep -c "tree-expression (pending)" js/app.js
node --test tests/unit/tree_expression_viz.test.js 2>&1 | grep -E 'pass [0-9]|fail [0-9]'
```
Expected: `app.js OK`; stub count `0`; unit pass 4 / fail 0.

- [ ] **Step 4: Commit**
```bash
cd /Users/skhuang/course/dsvisual
git add js/app.js style.css
git commit -m "feat(viz): implement renderTreeExpression (subtree-stack forest + eval) + styles"
```

---

## Task 5: i18n + desc_db

**Files:** Modify `js/i18n.js`, `js/desc_db.js`.

- [ ] **Step 1: i18n method name (both locales)**

In `js/i18n.js` `en` block:
```js
        'method.tree-expression': 'Expression Tree',
```
In the `zh` block:
```js
        'method.tree-expression': '運算式樹',
```

- [ ] **Step 2: desc_db entry**

In `js/desc_db.js`, before the closing `};` add:
```js
    'tree-expression': `
        <h3>Expression Tree</h3>
        <p>Build a binary expression tree from a postfix expression using a stack of subtrees, then evaluate it bottom-up.</p>
        <hr>
        <ul>
            <li><strong>Operand:</strong> push a leaf node onto the subtree stack</li>
            <li><strong>Operator:</strong> pop two subtrees, make them the children of a new node, push it</li>
            <li><strong>Evaluate:</strong> recurse — leaves are values, internal nodes apply their operator</li>
        </ul>
        <div class="complexities">
            <span class="badge time">Build/Eval: O(N)</span>
            <span class="badge space">Space: O(N)</span>
        </div>
    `,
```

- [ ] **Step 3: Verify**
```bash
cd /Users/skhuang/course/dsvisual
node -c js/i18n.js && echo "i18n OK"
node -c js/desc_db.js && echo "desc OK"
grep -c 'method.tree-expression' js/i18n.js
```
Expected: both OK; count `2`.

- [ ] **Step 4: Commit**
```bash
cd /Users/skhuang/course/dsvisual
git add js/i18n.js js/desc_db.js
git commit -m "feat(viz): i18n name + desc_db for tree-expression"
```

---

## Task 6: slides deck + build

**Files:** Modify `slides_db.js`; regenerate.

- [ ] **Step 1: Append the deck**

In `slides_db.js` (repo root), before `module.exports = SLIDES_DB;`, add:
```js
SLIDES_DB["tree-expression"] = {
  "category": "Trees",
  "title": { "zh": "運算式樹", "en": "Expression Tree" },
  "slides": [
    { "heading": { "zh": "從後序式建樹", "en": "Build from Postfix" },
      "blocks": [
        { "type": "paragraph", "text": { "zh": "用一個「子樹堆疊」掃描後序式:運算元成為葉節點,運算子把兩棵子樹接成新樹。", "en": "Scan the postfix with a stack of subtrees: operands become leaves; an operator joins the top two subtrees under a new node." } },
        { "type": "steps", "items": [
          { "zh": "遇運算元:建立葉節點並推入堆疊。", "en": "Operand: create a leaf and push it." },
          { "zh": "遇運算子:彈出兩棵子樹當左右子,合併成新樹後推回。", "en": "Operator: pop two subtrees as children, push the combined tree." },
          { "zh": "掃描完成,堆疊上剩下的唯一一棵即為運算式樹。", "en": "At the end, the single remaining subtree is the expression tree." }
        ] }
      ] },
    { "heading": { "zh": "求值與複雜度", "en": "Evaluation & Complexity" },
      "blocks": [
        { "type": "paragraph", "text": { "zh": "自底向上遞迴求值:葉為數值,內部節點對左右結果套用其運算子。", "en": "Evaluate bottom-up: leaves are values; internal nodes apply their operator to the children's results." } },
        { "type": "code", "lang": "cpp", "file": "tree_expression.cpp", "code": "while (in >> tok) {\n    ENode* n = new ENode{ tok, nullptr, nullptr };\n    if (isOp(tok)) {\n        n->right = st.top(); st.pop();\n        n->left = st.top(); st.pop();\n    }\n    st.push(n);\n}" },
        { "type": "bullets", "items": [
          { "zh": "建樹與求值皆為 O(N);空間 O(N)。", "en": "Build and evaluation are both O(N); space O(N)." }
        ] }
      ] }
  ]
};
```

- [ ] **Step 2: Build + verify**
```bash
cd /Users/skhuang/course/dsvisual
node -c slides_db.js && echo "slides_db OK"
npm run build:slides
ls slides/zh/tree-expression.md slides/en/tree-expression.md
```
Expected: `slides_db OK`; build prints `Generated N decks` (+1); both md exist.

- [ ] **Step 3: Commit**
```bash
cd /Users/skhuang/course/dsvisual
git add slides_db.js js/slides_rendered.js slides/zh/tree-expression.md slides/en/tree-expression.md
git commit -m "feat(viz): bilingual slides deck for tree-expression"
```

---

## Task 7: Playwright E2E

**Files:** Create `tests/tree_expression.spec.js`.

- [ ] **Step 1: Create `tests/tree_expression.spec.js`**
```js
const { test, expect } = require('@playwright/test');
const path = require('path');

async function loadMethod(page, methodId) {
    const navItem = page.locator(`.category-nav-item:has(.category-nav-method[data-method-id="${methodId}"])`);
    await navItem.locator('.category-nav-btn').click();
    await navItem.locator(`.category-nav-method[data-method-id="${methodId}"]`).click();
    await expect(page.locator(`[data-method-section="${methodId}"]`)).toHaveAttribute('data-runtime-state', 'active');
}

test.describe('Expression Tree', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
        await page.goto('file://' + path.resolve(__dirname, '../index.html'));
        await loadMethod(page, 'tree-expression');
    });

    test('builds the tree and shows the evaluated result; code filename', async ({ page }) => {
        const sec = page.locator('[data-method-section="tree-expression"]');
        await expect(sec.locator('.code-panel-filename')).toContainText('tree_expression.cpp');
        await expect(sec.locator('.et-stage')).toBeVisible();
        const step = sec.locator('.stepctl [data-action="step"]');
        for (let i = 0; i < 10; i++) await step.click();
        // default '3 4 + 5 *' → (3+4)*5 = 35
        await expect(sec.locator('.et-result')).toContainText('35');
        await expect(sec.locator('.et-nodes .tree-node.et-op').first()).toBeVisible();
    });
});
```

- [ ] **Step 2: Run**
```bash
cd /Users/skhuang/course/dsvisual
npx playwright test tests/tree_expression.spec.js --reporter=line
```
Expected: PASS. If the result doesn't show within 10 steps, increase the loop (default `3 4 + 5 *` has ~7 frames). Do NOT commit failing tests; report BLOCKED with the actual `.et-result` text if unresolved.

- [ ] **Step 3: Commit**
```bash
cd /Users/skhuang/course/dsvisual
git add tests/tree_expression.spec.js
git commit -m "test(viz): E2E for tree-expression"
```

---

## Task 8: Full suite + README + finish

**Files:** Modify `README.md`.

- [ ] **Step 1: README row**

In `README.md`, add to the Trees table:
```
| Expression Tree | Build from postfix via a subtree stack, then evaluate |
```

- [ ] **Step 2: Full suite**

Run: `cd /Users/skhuang/course/dsvisual && npm run test:all`
Expected: unit (incl. the new file) + Playwright all PASS. If a hardcoded method/tile COUNT test fails (e.g. `tests/i18n.spec.js` overview-tile count), update it to the new count (+1 method, same `trees` group → nav/category unchanged; overview-tile +1) and include it in the Step 4 commit; report old→new. If a NON-count test fails, STOP and report BLOCKED.

- [ ] **Step 3: Clean-build check**
```bash
cd /Users/skhuang/course/dsvisual
node build_db.js && npm run build:slides
git status --porcelain
```
Expected: no diffs to `js/code_db.js` / `js/slides_rendered.js` / `slides/`.

- [ ] **Step 4: Commit and finish**
```bash
cd /Users/skhuang/course/dsvisual
git add README.md
git commit -m "docs(viz): list tree-expression in README"
```
Then use **superpowers:finishing-a-development-branch** for `feat/tier2-batch-e4`.

---

## Self-Review notes
- **Spec coverage (E4):** tree-expression §3.7 — pure builder + eval (Task 1), C++ (Task 2), wiring (Task 3), renderer (Task 4), i18n/desc (Task 5), slides (Task 6), E2E (Task 7), acceptance (Task 8).
- **Dispatch safety:** placed after `tree-mway`; `renderAll` tree branches are exact-id arrays with no `tree`-substring catch-all (Task 3 Step 7 asserts `includes('tree')` is 0).
- **Node-drawing rules:** reuses `.tree-node` (translate-centered); forest edges drawn at `(x,y)` (no offset); `.et-stage` has `overflow:hidden`. Operators tinted via `.et-op`.
- **Type/name consistency:** `tokenizePostfix`/`buildExprTreeFrames`/`evalExprTree`; global `window.ExprTreeViz`; method id `tree-expression`. Consistent across module, tests, renderer, index.html, build_db.
- **Fixtures verified by hand:** `3 4 + 5 *` → (3+4)*5 = 35; `6 2 / 1 -` → 6/2−1 = 2; node count = token count; operators internal, operands leaves; final forest length 1.
- **Single viz:** one shippable PR completes Tier-2.
```
