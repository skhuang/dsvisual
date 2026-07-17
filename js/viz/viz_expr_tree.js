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

    let _exprTreeState = null;
    function renderTreeExpression() {
        const host = K().acquireDynamicVizHost();
        if (!_exprTreeState) _exprTreeState = { text: '3 4 + 5 *' };
        const st = _exprTreeState;
        const langOf = K().langOf;
        const tokens = ExprTreeViz.tokenizePostfix(st.text);
        const res = ExprTreeViz.buildExprTreeFrames(tokens);
        const frames = res.frames;
        let idx = 0;

        host.innerHTML =
            '<div class="et-controls"><input type="text" class="et-input" value="' + st.text + '"><button type="button" class="rand-btn" title="Random">🎲</button><button type="button" class="et-apply">Apply</button>' +
            '<span class="sm-hint">postfix; operands + operators (+ - * /), space-separated</span></div>' +
            '<div class="et-stack"><strong>Subtree stack:</strong> <span class="et-stack-cells"></span></div>' +
            '<div class="et-stage"><svg class="et-edges"></svg><div class="et-nodes"></div></div>' +
            '<div class="et-result"></div>' +
            '<div class="et-phase"></div>';

        function subtreeLabel(n) { return (!n.left && !n.right) ? n.val : '(' + subtreeLabel(n.left) + n.val + subtreeLabel(n.right) + ')'; }

        function paint() {
            const fr = frames[idx];
            if (!host.querySelector('.et-stage')) return;
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

        host.appendChild(K().buildStepControls(step, reset, 700));
        paint();
        host.querySelector('.et-apply').onclick = () => { const v = host.querySelector('.et-input').value.trim(); if (v) { st.text = v; renderTreeExpression(); } };
        host.querySelector('.rand-btn').onclick = () => {
            const inp = window.RandomInput && RandomInput.randomInputFor('tree-expression', K().getInputDifficulty());
            if (!inp) return;
            _exprTreeState.text = inp.text;
            renderTreeExpression();
        };
    }

    global.VizRegistry.attach('tree-expression', {
        render: renderTreeExpression,
        code: () => codeTreeExpression,
        layout: { host: 'dynamic' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
