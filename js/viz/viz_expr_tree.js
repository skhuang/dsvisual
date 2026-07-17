(function (global) {
    const K = () => global.VizKit; // resolved at call time (VizKit set at startup)

    // NOTE: computeTreeLayout is a pure, stateless geometry helper also used by
    // several other tree renderers still living in js/app.js (renderTreeMway's
    // former sibling renderers, the BST renderer, etc.). It reads/writes nothing
    // outside its own parameters, so it's duplicated here verbatim rather than
    // shared, per the self-containment rule: it is NOT removed from app.js.
    function computeTreeLayout(node, x, y, dx, nodesMeta) {
        if (!node) return;
        nodesMeta.push({ id: node.id, val: node.val, x: x, y: y, color: node.color });
        if (node.left) computeTreeLayout(node.left, x - dx, y + 60, dx * 0.55, nodesMeta);
        if (node.right) computeTreeLayout(node.right, x + dx, y + 60, dx * 0.55, nodesMeta);
    }

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
            ? langOf({ zh: '後序布林 — 變數 a,b,c… 常數 0/1 運算子 ∧(&) ∨(|) ¬(!) ⊕(^) →(>)', en: 'postfix boolean — vars a,b,c… consts 0/1 ops ∧(&) ∨(|) ¬(!) ⊕(^) →(>)' })
            : 'postfix; operands + operators (+ - * /), space-separated';

        host.innerHTML =
            '<div class="et-mode">' +
              '<button type="button" class="et-mode-btn' + (!bool ? ' active' : '') + '" data-mode="arith">' + langOf({ zh: '算術', en: 'Arithmetic' }) + '</button>' +
              '<button type="button" class="et-mode-btn' + (bool ? ' active' : '') + '" data-mode="bool">' + langOf({ zh: '布林', en: 'Boolean' }) + '</button>' +
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
                else if (fr.action === 'done' && fr.forest.length === 1) { const v = ExprTreeViz.evalExprTree(fr.forest[0]); host.querySelector('.et-result').textContent = Number.isNaN(v) ? 'Result: (symbolic expression)' : ('Result = ' + v); }
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

    global.VizRegistry.attach('tree-expression', {
        render: renderTreeExpression,
        code: () => codeTreeExpression,
        layout: { host: 'dynamic' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
