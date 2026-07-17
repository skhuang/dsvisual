# Boolean mode for the Expression Tree viz — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Boolean (propositional) mode to dsvisual's `tree-expression` visualization: build a boolean expression tree from postfix, evaluate it under an assignment, and sweep a truth table to decide satisfiability.

**Architecture:** Extend the pure module `js/tree_expression_viz.js` (`ExprTreeViz`) with boolean frame/eval functions; extend the render module `js/viz/viz_expr_tree.js` (`renderTreeExpression`) with an Arithmetic|Boolean mode toggle and boolean UI (assignment row, truth-table panel, verdict); extend the C++ code drawer and description. Boolean mode is a mode inside the existing `tree-expression` registry id — no new viz, arithmetic mode unchanged.

**Tech Stack:** Vanilla JS (dual-export IIFE modules + `VizRegistry`/`VizKit` seam), `node --test` unit tests, Playwright e2e, C++ code drawer generated from `cpp/` via `build_db.js`.

## Global Constraints

- Post-refactor file layout (verified on `main` @ 62b835e): pure logic in `js/tree_expression_viz.js`; render in `js/viz/viz_expr_tree.js` (uses `K() = global.VizKit`, ends with `VizRegistry.attach('tree-expression', {...})`); C++ string `codeTreeExpression` in `js/code_db.js` generated from `cpp/tree_expression.cpp` by `build_db.js`; description in `js/desc_db.js`.
- Operators (space-separated postfix tokens): `&`=∧, `|`=∨, `!`=¬ (unary), `^`=⊕, `>`=→; operands are single-letter variables and constants `0`/`1`. Display glyphs ∧ ∨ ¬ ⊕ →.
- Eval semantics: `!a`=¬; `&`=∧; `|`=∨; `^`=⊕ (a≠b); `>`=→ (¬a∨b).
- Verdict over all `2^k` assignments: `tautology` (all 1), `contradiction` (all 0), `contingent` (mixed); `satisfiable = verdict≠contradiction`. Variable cap `k≤5`; if more, skip the sweep (single-assignment eval only) with a message.
- Additive only: do NOT change arithmetic-mode behavior or any other viz. Bilingual zh/en for all new UI text (via `K().langOf`). Keep modules' dual-export shape.
- Commit discipline: targeted `git add` of only the files each task names. This dsvisual working tree may have a concurrent refactor session — never `git add -A`/`.`/`-u`; verify `git status` before committing.
- Test commands: unit `npm run test:unit` (`node --test tests/unit/*.test.js`); e2e `npm test` (Playwright); both `npm run test:all`.

Running example trees (used across tasks):
- Contingent: `a b & c ! |` → (a∧b)∨¬c
- Tautology: `a a ! |` → a∨¬a
- Contradiction: `a a ! &` → a∧¬a

---

### Task 1: Boolean logic in the pure module (`ExprTreeViz`)

**Files:**
- Modify: `js/tree_expression_viz.js` (add `OP_GLYPH`, `BOOL_ARITY`, `buildBoolExprTreeFrames`, `evalBoolExprTree`, `buildTruthTableFrames`; extend the exported `api`)
- Test: `tests/unit/tree_expression_viz.test.js` (append boolean tests)

**Interfaces:**
- Consumes: existing `tokenizePostfix`.
- Produces (used by Task 2):
  - `buildBoolExprTreeFrames(tokens) -> { frames, root, vars }` — frames like the arithmetic builder (`{token, action, forest, msg:{zh,en}}`); `vars` sorted distinct variable names.
  - `evalBoolExprTree(root, asg) -> 0|1`.
  - `buildTruthTableFrames(root, vars) -> { frames, rows, verdict, satisfiable }` — frames `{action:'ttrow', asg, value, rowsSoFar, msg}` then one `{action:'verdict', verdict, satisfiable, rowsSoFar, msg}`.
  - `OP_GLYPH` = `{ '&':'∧','|':'∨','!':'¬','^':'⊕','>':'→' }`.

- [ ] **Step 1: Append the failing unit tests** to `tests/unit/tree_expression_viz.test.js`:

```js
const {
  buildBoolExprTreeFrames, evalBoolExprTree, buildTruthTableFrames, OP_GLYPH,
} = require('../../js/tree_expression_viz');

test('boolean: ! is unary (one child), binary ops have two; vars sorted & exclude consts', () => {
  const { root, vars } = buildBoolExprTreeFrames(tokenizePostfix('a b & c ! |'));
  assert.deepEqual(vars, ['a', 'b', 'c']);
  // root is OR; right child is NOT (unary)
  assert.equal(root.val, '|');
  const notNode = root.right;
  assert.equal(notNode.val, '!');
  assert.ok(notNode.left && notNode.right === null, '! has exactly one (left) child');
  // constants are not collected as vars
  assert.deepEqual(buildBoolExprTreeFrames(tokenizePostfix('a 1 |')).vars, ['a']);
});

test('boolean: eval truth values for & | ! ^ >', () => {
  const t = (s) => buildBoolExprTreeFrames(tokenizePostfix(s)).root;
  assert.equal(evalBoolExprTree(t('a b &'), { a: 1, b: 1 }), 1);
  assert.equal(evalBoolExprTree(t('a b &'), { a: 1, b: 0 }), 0);
  assert.equal(evalBoolExprTree(t('a b |'), { a: 0, b: 0 }), 0);
  assert.equal(evalBoolExprTree(t('a !'), { a: 0 }), 1);
  assert.equal(evalBoolExprTree(t('a b ^'), { a: 1, b: 0 }), 1);
  assert.equal(evalBoolExprTree(t('a b ^'), { a: 1, b: 1 }), 0);
  assert.equal(evalBoolExprTree(t('a b >'), { a: 1, b: 0 }), 0); // 1→0 = false
  assert.equal(evalBoolExprTree(t('a b >'), { a: 0, b: 0 }), 1); // 0→0 = true
  assert.equal(evalBoolExprTree(t('1 0 &'), {}), 0);             // constants
});

test('boolean: truth table has 2^k rows and correct verdict', () => {
  const sweep = (s) => { const { root, vars } = buildBoolExprTreeFrames(tokenizePostfix(s)); return buildTruthTableFrames(root, vars); };
  const contingent = sweep('a b &');
  assert.equal(contingent.rows.length, 4);           // 2^2
  assert.equal(contingent.verdict, 'contingent');
  assert.equal(contingent.satisfiable, true);
  const taut = sweep('a a ! |');
  assert.equal(taut.rows.length, 2);                 // 2^1
  assert.equal(taut.verdict, 'tautology');
  const contra = sweep('a a ! &');
  assert.equal(contra.verdict, 'contradiction');
  assert.equal(contra.satisfiable, false);
  // last frame is the verdict frame
  assert.equal(taut.frames[taut.frames.length - 1].action, 'verdict');
});
```

- [ ] **Step 2: Run the tests, verify they fail**

Run: `npm run test:unit`
Expected: FAIL — `buildBoolExprTreeFrames`/`evalBoolExprTree`/`buildTruthTableFrames`/`OP_GLYPH` are `undefined`.

- [ ] **Step 3: Implement the boolean functions** in `js/tree_expression_viz.js`. Insert inside the IIFE, after `evalExprTree` and before `const api = {...}`:

```js
  const OP_GLYPH = { '&': '∧', '|': '∨', '!': '¬', '^': '⊕', '>': '→' };
  const BOOL_ARITY = { '!': 1, '&': 2, '|': 2, '^': 2, '>': 2 };
  const isBoolOp = (t) => Object.prototype.hasOwnProperty.call(BOOL_ARITY, t);
  const isConst = (t) => t === '0' || t === '1';

  function buildBoolExprTreeFrames(tokens) {
    let idc = 0;
    const node = (val, left, right) => ({ id: 'bx-' + (idc++), val: val, left: left || null, right: right || null });
    const clone = (n) => n ? { id: n.id, val: n.val, left: clone(n.left), right: clone(n.right) } : null;
    const stack = [];
    const frames = [];
    const varset = {};
    const snap = (token, action, msg) => frames.push({ token, action, forest: stack.map(clone), msg });

    snap(null, 'start', { zh: '開始由後序式建立布林運算式樹', en: 'Begin building the boolean expression tree from postfix' });
    let error = null;
    for (const t of tokens) {
      if (isBoolOp(t)) {
        const arity = BOOL_ARITY[t];
        if (stack.length < arity) { error = t; break; }
        if (arity === 1) {
          const c = stack.pop();
          stack.push(node(t, c, null));
          snap(t, 'not', { zh: '一元運算子 ¬:彈出一棵子樹取反', en: 'Unary ¬: pop one subtree and negate' });
        } else {
          const r = stack.pop(), l = stack.pop();
          stack.push(node(t, l, r));
          snap(t, 'combine', { zh: '運算子 ' + OP_GLYPH[t] + ':彈出兩棵子樹合併', en: 'Operator ' + OP_GLYPH[t] + ': pop two subtrees and combine' });
        }
      } else {
        if (!isConst(t)) varset[t] = true;
        stack.push(node(t, null, null));
        snap(t, 'leaf', { zh: (isConst(t) ? '常數 ' : '變數 ') + t + ':建立葉節點', en: (isConst(t) ? 'Constant ' : 'Variable ') + t + ': create a leaf' });
      }
    }
    let root = null;
    if (error) {
      snap(error, 'error', { zh: '輸入不合法:運算元不足', en: 'Invalid input: not enough operands' });
    } else if (stack.length === 1) {
      root = stack[0];
      snap(null, 'done', { zh: '完成,布林運算式樹建立完畢', en: 'Done; boolean expression tree built' });
    } else {
      snap(null, 'error', { zh: '輸入不合法:剩餘多於一棵子樹', en: 'Invalid input: more than one subtree remains' });
    }
    return { frames, root, vars: Object.keys(varset).sort() };
  }

  function evalBoolExprTree(root, asg) {
    if (!root) return 0;
    if (!root.left && !root.right) {
      if (root.val === '1') return 1;
      if (root.val === '0') return 0;
      return asg && asg[root.val] ? 1 : 0;
    }
    if (root.val === '!') return evalBoolExprTree(root.left, asg) ? 0 : 1;
    const a = evalBoolExprTree(root.left, asg), b = evalBoolExprTree(root.right, asg);
    if (root.val === '&') return (a && b) ? 1 : 0;
    if (root.val === '|') return (a || b) ? 1 : 0;
    if (root.val === '^') return (a !== b) ? 1 : 0;
    if (root.val === '>') return (!a || b) ? 1 : 0;
    return 0;
  }

  function buildTruthTableFrames(root, vars) {
    const k = vars.length, total = 1 << k;
    const frames = [], rows = [];
    for (let mask = 0; mask < total; mask++) {
      const asg = {};
      for (let i = 0; i < k; i++) asg[vars[i]] = (mask >> (k - 1 - i)) & 1;  // MSB = vars[0]
      const value = evalBoolExprTree(root, asg);
      rows.push({ asg: Object.assign({}, asg), value });
      const line = vars.map((v) => v + '=' + asg[v]).join(', ');
      frames.push({
        action: 'ttrow', asg: Object.assign({}, asg), value,
        rowsSoFar: rows.map((r) => ({ asg: Object.assign({}, r.asg), value: r.value })),
        msg: { zh: '指派 ' + line + ' → ' + value, en: 'Assign ' + line + ' → ' + value },
      });
    }
    const allTrue = rows.every((r) => r.value === 1);
    const allFalse = rows.every((r) => r.value === 0);
    const verdict = allTrue ? 'tautology' : (allFalse ? 'contradiction' : 'contingent');
    const satisfiable = verdict !== 'contradiction';
    frames.push({
      action: 'verdict', verdict, satisfiable, rowsSoFar: rows.slice(),
      msg: {
        zh: '結論:' + (verdict === 'tautology' ? '恆真(tautology)' : verdict === 'contradiction' ? '矛盾,不可滿足(contradiction)' : '可滿足但非恆真(contingent)'),
        en: 'Verdict: ' + verdict + (satisfiable ? ' — satisfiable' : ' — unsatisfiable'),
      },
    });
    return { frames, rows, verdict, satisfiable };
  }
```

Then extend the export line:

```js
  const api = { tokenizePostfix, buildExprTreeFrames, evalExprTree, buildBoolExprTreeFrames, evalBoolExprTree, buildTruthTableFrames, OP_GLYPH, BOOL_ARITY };
```

- [ ] **Step 4: Run the tests, verify they pass**

Run: `npm run test:unit`
Expected: PASS (existing arithmetic tests + the 3 new boolean tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/skhuang/course/dsvisual
git add js/tree_expression_viz.js tests/unit/tree_expression_viz.test.js
git commit -m "feat(dsvisual): boolean expression-tree logic in ExprTreeViz (build/eval/truth-table)"
```

---

### Task 2: Boolean mode in the render module + UI + e2e

**Files:**
- Modify: `js/viz/viz_expr_tree.js` (replace the `_exprTreeState` decl + `renderTreeExpression` function; keep the `computeTreeLayout` helper and the `VizRegistry.attach(...)` tail)
- Modify: `style.css` (append boolean-mode CSS)
- Test: `tests/tree_expression.spec.js` (append a boolean e2e test)

**Interfaces:**
- Consumes (Task 1): `ExprTreeViz.buildBoolExprTreeFrames`, `.evalBoolExprTree`, `.buildTruthTableFrames`, `.OP_GLYPH`.

- [ ] **Step 1: Replace the state + render function** in `js/viz/viz_expr_tree.js`. Replace everything from `let _exprTreeState = null;` (line ~16) through the end of the `renderTreeExpression` function (the closing `}` at line ~75), leaving the top `computeTreeLayout` helper and the bottom `VizRegistry.attach(...)` block intact:

```js
    const OP_GLYPH = ExprTreeViz.OP_GLYPH; // { '&':'∧','|':'∨','!':'¬','^':'⊕','>':'→' }
    const disp = (v) => OP_GLYPH[v] || String(v);
    const BOOL_OPS = ['&', '|', '!', '^', '>'];
    const ARITH_OPS = ['+', '-', '*', '/'];
    const K_CAP = 5;

    function randomBoolPostfix() {
        const vars = ['a', 'b', 'c'];
        const ops = ['&', '|', '^', '>'];
        const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
        const k = 2 + Math.floor(Math.random() * 2); // 2..3 variables
        const out = [vars[0], vars[1], pick(ops)];
        for (let i = 2; i < k; i++) { out.push(vars[i]); out.push(pick(ops)); }
        if (Math.random() < 0.5) out.push('!');
        return out.join(' ');
    }

    let _exprTreeState = null;
    function renderTreeExpression() {
        const host = K().acquireDynamicVizHost();
        if (!_exprTreeState) _exprTreeState = { mode: 'arith', text: '3 4 + 5 *', boolText: 'a b & c ! |', asg: {} };
        const st = _exprTreeState;
        const langOf = K().langOf;
        const bool = st.mode === 'bool';

        let frames, root, vars = [], tooMany = false;
        if (bool) {
            const res = ExprTreeViz.buildBoolExprTreeFrames(ExprTreeViz.tokenizePostfix(st.boolText));
            root = res.root; vars = res.vars; frames = res.frames.slice();
            vars.forEach((v) => { if (!(v in st.asg)) st.asg[v] = 0; });
            Object.keys(st.asg).forEach((v) => { if (!vars.includes(v)) delete st.asg[v]; });
            if (root && vars.length <= K_CAP) {
                frames = frames.concat(ExprTreeViz.buildTruthTableFrames(root, vars).frames);
            } else if (root && vars.length > K_CAP) {
                tooMany = true;
            }
        } else {
            const res = ExprTreeViz.buildExprTreeFrames(ExprTreeViz.tokenizePostfix(st.text));
            frames = res.frames; root = res.root;
        }
        let idx = 0;

        const inputVal = bool ? st.boolText : st.text;
        const hint = bool
            ? 'postfix boolean — vars a,b,c… consts 0/1 ops ∧(&) ∨(|) ¬(!) ⊕(^) →(>)'
            : 'postfix; operands + operators (+ - * /), space-separated';

        host.innerHTML =
            '<div class="et-mode">' +
              '<button type="button" class="et-mode-btn' + (!bool ? ' active' : '') + '" data-mode="arith">Arithmetic</button>' +
              '<button type="button" class="et-mode-btn' + (bool ? ' active' : '') + '" data-mode="bool">Boolean</button>' +
            '</div>' +
            '<div class="et-controls"><input type="text" class="et-input" value="' + inputVal + '"><button type="button" class="rand-btn" title="Random">🎲</button><button type="button" class="et-apply">Apply</button>' +
            '<span class="sm-hint">' + hint + '</span></div>' +
            '<div class="et-stack"><strong>Subtree stack:</strong> <span class="et-stack-cells"></span></div>' +
            '<div class="et-stage"><svg class="et-edges"></svg><div class="et-nodes"></div></div>' +
            (bool ? '<div class="et-asg"></div><div class="et-truth"></div>' : '') +
            '<div class="et-result"></div>' +
            '<div class="et-phase"></div>';

        function subtreeLabel(n) {
            if (!n.left && !n.right) return disp(n.val);
            if (n.val === '!') return '(¬' + subtreeLabel(n.left) + ')';
            return '(' + subtreeLabel(n.left) + disp(n.val) + subtreeLabel(n.right) + ')';
        }
        function tvMap(n, asg, m) { if (!n) return; m[n.id] = ExprTreeViz.evalBoolExprTree(n, asg); tvMap(n.left, asg, m); tvMap(n.right, asg, m); }

        function paintForest(roots, colorAsg) {
            const stageEl = host.querySelector('.et-stage'); if (!stageEl) return;
            const W = stageEl.clientWidth || 720;
            const slot = W / (roots.length + 1);
            const allNodes = []; let svg = ''; const tv = {};
            roots.forEach((rt, ri) => {
                const meta = [];
                computeTreeLayout(rt, (ri + 1) * slot, 30, Math.max(40, slot / 2.6), meta);
                if (bool && colorAsg) tvMap(rt, colorAsg, tv);
                const byId = {}; meta.forEach((m) => { byId[m.id] = m; });
                (function walk(n) { if (!n) return; [n.left, n.right].forEach((c) => { if (!c) return; const a = byId[n.id], b = byId[c.id]; svg += '<line x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '" stroke="#94a3b8" stroke-width="2"/>'; walk(c); }); })(rt);
                meta.forEach((m) => allNodes.push(m));
            });
            host.querySelector('.et-edges').innerHTML = svg;
            const opSet = bool ? BOOL_OPS : ARITH_OPS;
            host.querySelector('.et-nodes').innerHTML = allNodes.map((m) => {
                let cls = 'tree-node' + (opSet.includes(String(m.val)) ? ' et-op' : '');
                if (bool && colorAsg && (m.id in tv)) cls += tv[m.id] ? ' et-true' : ' et-false';
                return '<div class="' + cls + '" style="left:' + m.x + 'px;top:' + m.y + 'px">' + disp(m.val) + '</div>';
            }).join('');
            host.querySelector('.et-stack-cells').innerHTML = roots.map((rt) => '<span class="et-scell">' + subtreeLabel(rt) + '</span>').join('');
        }

        function renderAsgRow() {
            const el = host.querySelector('.et-asg'); if (!el) return;
            if (!bool || !root) { el.innerHTML = ''; return; }
            let h = '';
            if (tooMany) h += '<span class="sm-hint">' + langOf({ zh: '變數超過 ' + K_CAP + ' 個,略過真值表', en: '>' + K_CAP + ' variables — truth table skipped' }) + '</span> ';
            h += '<strong>' + langOf({ zh: '指派:', en: 'Assignment:' }) + '</strong> ' +
                vars.map((v) => '<button type="button" class="et-asg-btn" data-var="' + v + '">' + v + '=' + st.asg[v] + '</button>').join(' ');
            el.innerHTML = h;
            el.querySelectorAll('.et-asg-btn').forEach((b) => {
                b.onclick = () => { const v = b.getAttribute('data-var'); st.asg[v] = st.asg[v] ? 0 : 1; liveEval(); };
            });
        }
        function liveEval() {
            renderAsgRow();
            if (root) paintForest([root], st.asg);
            host.querySelector('.et-result').textContent = root
                ? langOf({ zh: '此指派求值 = ', en: 'value under this assignment = ' }) + ExprTreeViz.evalBoolExprTree(root, st.asg)
                : '';
        }
        function truthTableHTML(rowsSoFar, curIdx, verdict, satisfiable) {
            let h = '<table class="et-tt"><thead><tr>' + vars.map((v) => '<th>' + v + '</th>').join('') + '<th>' + langOf({ zh: '值', en: 'val' }) + '</th></tr></thead><tbody>';
            rowsSoFar.forEach((r, i) => {
                h += '<tr' + (i === curIdx ? ' class="et-tt-cur"' : '') + '>' + vars.map((v) => '<td>' + r.asg[v] + '</td>').join('') + '<td>' + r.value + '</td></tr>';
            });
            h += '</tbody></table>';
            if (verdict) h += '<div class="et-verdict">' + langOf({ zh: '結論:' + (verdict === 'tautology' ? '恆真' : verdict === 'contradiction' ? '矛盾(不可滿足)' : '可滿足(contingent)'), en: 'Verdict: ' + verdict + (satisfiable ? ' — satisfiable' : ' — unsatisfiable') }) + '</div>';
            return h;
        }

        function paint() {
            const fr = frames[idx];
            if (!host.querySelector('.et-stage')) return;
            if (fr.forest) {
                paintForest(fr.forest, null);
                if (bool) { const t = host.querySelector('.et-truth'); if (t) t.innerHTML = ''; renderAsgRow(); host.querySelector('.et-result').textContent = ''; }
                else if (fr.action === 'done') { const v = ExprTreeViz.evalExprTree(fr.forest[0]); host.querySelector('.et-result').textContent = Number.isNaN(v) ? 'Result: (symbolic expression)' : ('Result = ' + v); }
                else { host.querySelector('.et-result').textContent = ''; }
            } else if (fr.action === 'ttrow') {
                paintForest([root], fr.asg);
                Object.assign(st.asg, fr.asg); renderAsgRow();
                host.querySelector('.et-truth').innerHTML = truthTableHTML(fr.rowsSoFar, fr.rowsSoFar.length - 1, null, null);
                host.querySelector('.et-result').textContent = '';
            } else if (fr.action === 'verdict') {
                paintForest([root], st.asg);
                host.querySelector('.et-truth').innerHTML = truthTableHTML(fr.rowsSoFar, -1, fr.verdict, fr.satisfiable);
                host.querySelector('.et-result').textContent = '';
            }
            host.querySelector('.et-phase').textContent = (fr.token ? '[' + fr.token + '] ' : '') + langOf(fr.msg);
        }
        function step() { if (idx < frames.length - 1) { idx++; paint(); return idx < frames.length - 1; } return false; }
        function reset() { idx = 0; paint(); }

        host.appendChild(K().buildStepControls(step, reset, 700));
        paint();
        if (bool) renderAsgRow();

        host.querySelectorAll('.et-mode-btn').forEach((b) => {
            b.onclick = () => { const m = b.getAttribute('data-mode'); if (m !== st.mode) { st.mode = m; renderTreeExpression(); } };
        });
        host.querySelector('.et-apply').onclick = () => {
            const v = host.querySelector('.et-input').value.trim(); if (!v) return;
            if (bool) st.boolText = v; else st.text = v;
            renderTreeExpression();
        };
        host.querySelector('.rand-btn').onclick = () => {
            if (bool) { st.boolText = randomBoolPostfix(); st.asg = {}; renderTreeExpression(); return; }
            const inp = window.RandomInput && RandomInput.randomInputFor('tree-expression', K().getInputDifficulty());
            if (!inp) return;
            st.text = inp.text; renderTreeExpression();
        };
    }
```

- [ ] **Step 2: Append boolean-mode CSS** to the end of `style.css`:

```css
/* tree-expression boolean mode */
.et-mode { display: flex; gap: 6px; margin-bottom: 8px; }
.et-mode-btn { padding: 4px 12px; border: 1px solid #cbd5e1; background: #f8fafc; border-radius: 999px; cursor: pointer; font-size: 13px; }
.et-mode-btn.active { background: #1a4d8f; color: #fff; border-color: #1a4d8f; }
.et-asg { margin: 8px 0; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.et-asg-btn { padding: 3px 10px; border: 1px solid #cbd5e1; border-radius: 6px; background: #fff; cursor: pointer; font-family: 'Fira Code', monospace; }
.tree-node.et-true { background: #16a34a; color: #fff; border-color: #16a34a; }
.tree-node.et-false { background: #e2e8f0; color: #475569; }
.et-truth { margin: 8px 0; overflow-x: auto; }
table.et-tt { border-collapse: collapse; font-family: 'Fira Code', monospace; font-size: 13px; }
table.et-tt th, table.et-tt td { border: 1px solid #cbd5e1; padding: 2px 10px; text-align: center; }
table.et-tt tr.et-tt-cur { background: #fef9c3; }
.et-verdict { margin-top: 6px; font-weight: bold; color: #1a4d8f; }
```

- [ ] **Step 3: Append the boolean e2e test** to `tests/tree_expression.spec.js` (inside the existing `test.describe('Expression Tree', ...)` block):

```js
    test('boolean mode: builds tree, sweeps truth table, reports verdict', async ({ page }) => {
        const sec = page.locator('[data-method-section="tree-expression"]');
        await sec.locator('.et-mode-btn[data-mode="bool"]').click();
        // apply a tautology preset
        await sec.locator('.et-input').fill('a a ! |');
        await sec.locator('.et-apply').click();
        await expect(sec.locator('.et-asg-btn')).toHaveCount(1); // one variable: a
        const run = sec.locator('.stepctl [data-action="run"]');
        await run.click();
        await expect(sec.locator('.et-verdict')).toContainText('tautology', { timeout: 15000 });
        await expect(sec.locator('table.et-tt tbody tr')).toHaveCount(2); // 2^1 rows
    });

    test('boolean mode does not break arithmetic mode', async ({ page }) => {
        const sec = page.locator('[data-method-section="tree-expression"]');
        await sec.locator('.et-mode-btn[data-mode="bool"]').click();
        await sec.locator('.et-mode-btn[data-mode="arith"]').click();
        const step = sec.locator('.stepctl [data-action="step"]');
        for (let i = 0; i < 10; i++) await step.click();
        await expect(sec.locator('.et-result')).toContainText('35');
    });
```

Note: if the Run/Step control selectors differ from `.stepctl [data-action="run"|"step"]`, match the selectors the existing passing test uses (it uses `.stepctl [data-action="step"]`).

- [ ] **Step 4: Run e2e; verify pass (and no regression)**

Run: `npm test -- tree_expression`
Expected: the existing arithmetic test + the two new boolean tests PASS. If the `[data-action="run"]` selector is wrong, fix it to match the actual step-controls markup and re-run.

- [ ] **Step 5: Commit**

```bash
cd /Users/skhuang/course/dsvisual
git add js/viz/viz_expr_tree.js style.css tests/tree_expression.spec.js
git commit -m "feat(dsvisual): boolean mode UI for tree-expression (assignment + truth-table sweep)"
```

---

### Task 3: C++ code drawer + description

**Files:**
- Modify: `cpp/tree_expression.cpp` (append a boolean expression-tree section)
- Modify: `js/code_db.js` (regenerated from cpp via `build_db.js`)
- Modify: `js/desc_db.js` (extend the `tree-expression` description)

**Interfaces:** none (content only).

- [ ] **Step 1: Append the boolean section** to `cpp/tree_expression.cpp` (after the existing arithmetic `evalExprTree`). Ensure `<iostream>`, `<map>`, `<set>`, `<vector>` are included (add any missing at the top):

```cpp

// ---- Boolean (propositional) expression tree: build, evaluate, satisfiability ----
struct BNode {
    std::string val;                 // "&","|","!","^",">", a variable name, or "0"/"1"
    BNode* left = nullptr;
    BNode* right = nullptr;
};

static bool isBoolOp(const std::string& s) {
    return s == "&" || s == "|" || s == "!" || s == "^" || s == ">";
}

BNode* buildBoolExprTree(const std::string& postfix) {
    std::stack<BNode*> st;
    std::istringstream in(postfix);
    std::string tok;
    while (in >> tok) {
        BNode* n = new BNode{ tok, nullptr, nullptr };
        if (tok == "!") {                       // unary NOT
            n->left = st.top(); st.pop();
        } else if (isBoolOp(tok)) {             // binary op
            n->right = st.top(); st.pop();
            n->left = st.top(); st.pop();
        }
        st.push(n);
    }
    return st.empty() ? nullptr : st.top();
}

int evalBool(BNode* n, const std::map<std::string, int>& asg) {
    if (!n) return 0;
    if (!n->left && !n->right) {                // leaf: constant or variable
        if (n->val == "1") return 1;
        if (n->val == "0") return 0;
        auto it = asg.find(n->val);
        return it == asg.end() ? 0 : it->second;
    }
    if (n->val == "!") return evalBool(n->left, asg) ? 0 : 1;
    int a = evalBool(n->left, asg), b = evalBool(n->right, asg);
    if (n->val == "&") return a && b;
    if (n->val == "|") return a || b;
    if (n->val == "^") return a != b;           // XOR
    if (n->val == ">") return (!a) || b;        // implication
    return 0;
}

void collectVars(BNode* n, std::set<std::string>& vars) {
    if (!n) return;
    if (!n->left && !n->right && n->val != "0" && n->val != "1") vars.insert(n->val);
    collectVars(n->left, vars);
    collectVars(n->right, vars);
}

// Sweep all 2^k assignments and classify the formula.
void satReport(BNode* root) {
    std::set<std::string> vs;
    collectVars(root, vs);
    std::vector<std::string> vars(vs.begin(), vs.end());
    int k = (int)vars.size(), total = 1 << k, trues = 0;
    for (int mask = 0; mask < total; ++mask) {
        std::map<std::string, int> asg;
        for (int i = 0; i < k; ++i) asg[vars[i]] = (mask >> (k - 1 - i)) & 1;
        trues += evalBool(root, asg);
    }
    std::cout << (trues == total ? "tautology"
                : trues == 0     ? "contradiction (unsatisfiable)"
                                 : "contingent (satisfiable)") << "\n";
}
```

- [ ] **Step 2: Regenerate `js/code_db.js` from cpp**

Run: `node build_db.js`
Expected: `js/code_db.js` updated; `git diff --stat js/code_db.js` shows the `codeTreeExpression` string now includes the boolean section. (`'tree_expression.cpp': 'codeTreeExpression'` is already in `build_db.js`'s mappings, since the string exists today.)

- [ ] **Step 3: Extend the `tree-expression` description** in `js/desc_db.js`. Locate the `'tree-expression'` entry and append a bilingual paragraph to its zh and en HTML explaining boolean mode. Add before the closing backtick of each language string:

```html
<p><strong>布林模式:</strong>以後序輸入命題公式(變數 a,b,c…、常數 0/1、運算子 ∧(&) ∨(|) ¬(!) ⊕(^) →(>)),建出運算式樹並在指派下以後序求值;真值表掃描列舉全部 2<sup>k</sup> 種指派,判定恆真(tautology)、矛盾(contradiction,不可滿足)或可滿足(contingent)。</p>
```
```html
<p><strong>Boolean mode:</strong> enter a propositional formula in postfix (variables a,b,c…, constants 0/1, operators ∧(&) ∨(|) ¬(!) ⊕(^) →(>)), build its expression tree and evaluate it postorder under an assignment; a truth-table sweep enumerates all 2<sup>k</sup> assignments and decides tautology, contradiction (unsatisfiable), or contingent (satisfiable).</p>
```

(Match the exact zh/en field structure of the existing `tree-expression` entry — append inside each language's HTML string.)

- [ ] **Step 4: Sanity-check the code drawer + description render**

Run: `npm test -- tree_expression`
Expected: still green (the existing test asserts the code filename `tree_expression.cpp`; the extended string does not change the filename). Optionally load `index.html`, open `tree-expression`, and confirm the code drawer shows the boolean section and the info panel shows the new paragraph.

- [ ] **Step 5: Commit**

```bash
cd /Users/skhuang/course/dsvisual
git add cpp/tree_expression.cpp js/code_db.js js/desc_db.js
git commit -m "feat(dsvisual): C++ code drawer + description for tree-expression boolean mode"
```

---

## Notes for the executor

- **Concurrent refactor session:** another session may be modifying this repo. Before each commit, run `git status` and stage only this task's named files. Never `git add -A`/`.`/`-u`.
- Task 1 is pure-logic TDD (fast `node --test`). Task 2 is the render + e2e. Task 3 is content. They are independently reviewable.
- If the step-controls markup in Task 2's e2e differs (`data-action` values), align with the existing passing arithmetic test in the same file, which is the source of truth for the selectors.
- `computeTreeLayout` and the `VizRegistry.attach('tree-expression', {...})` block at the bottom of `js/viz/viz_expr_tree.js` are unchanged — only the state decl + `renderTreeExpression` body are replaced.
- **Deviation from spec (Examples convention):** the spec listed boolean presets "via the Examples convention" (`buildExamplesSelect`/`saveExample`). The existing `tree-expression` viz has NO Examples dropdown today (only a 🎲 random button), so this plan surfaces presets via the default `boolText` (`a b & c ! |`) plus the boolean `randomBoolPostfix()` generator — NOT a new localStorage Examples dropdown. Adding an Examples dropdown to tree-expression is a separate cross-cutting change (it would need arith/bool serialization) and is intentionally out of scope here to keep the change minimal and additive.
