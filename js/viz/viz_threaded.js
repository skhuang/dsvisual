(function (global) {
    const K = () => global.VizKit; // resolved at call time (VizKit set at startup)

    // NOTE: computeTreeLayout is a pure, stateless geometry helper also used by
    // several other tree renderers still living in js/app.js (renderTreeObst,
    // renderTreeExpression, the BST renderer, etc.). It reads/writes nothing
    // outside its own parameters, so it's duplicated here verbatim rather than
    // shared, per the self-containment rule: it is NOT removed from app.js.
    function computeTreeLayout(node, x, y, dx, nodesMeta) {
        if (!node) return;
        nodesMeta.push({ id: node.id, val: node.val, x: x, y: y, color: node.color });
        if (node.left) computeTreeLayout(node.left, x - dx, y + 60, dx * 0.55, nodesMeta);
        if (node.right) computeTreeLayout(node.right, x + dx, y + 60, dx * 0.55, nodesMeta);
    }

    let _threadedState = null;
    function renderTreeThreaded() {
        const host = K().acquireDynamicVizHost();
        if (!_threadedState) _threadedState = { vals: ThreadedViz.SAMPLE.slice() };
        const st = _threadedState;
        const langOf = K().langOf;
        const root = ThreadedViz.buildTreeFromValues(st.vals);
        const res = ThreadedViz.buildThreadedFrames(root);
        const frames = res.frames;
        let idx = 0;

        host.innerHTML =
            '<div class="th-controls"><input type="text" class="th-input" value="' + st.vals.join(',') + '"><button type="button" class="rand-btn" title="Random">🎲</button><button type="button" class="th-build">Build</button>' +
            '<span class="sm-hint">values build a BST; dashed = inorder thread</span></div>' +
            '<div class="th-stage"><svg class="th-edges"></svg><div class="th-nodes"></div></div>' +
            '<div class="th-output"><strong>Inorder:</strong> <span class="th-seq"></span></div>' +
            '<div class="th-phase"></div>';

        const meta = [];
        computeTreeLayout(root, 200, 30, 90, meta);
        const byId = {}; meta.forEach((m) => { byId[m.id] = m; });
        const nodesEl = host.querySelector('.th-nodes');

        function paint() {
            const fr = frames[idx];
            if (!host.querySelector('.th-edges')) return;
            const edgesEl = host.querySelector('.th-edges');
            let svg = '';
            (function walk(n) { if (!n) return; [n.left, n.right].forEach((c) => { if (!c) return; const a = byId[n.id], b = byId[c.id]; svg += '<line x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '" stroke="#94a3b8" stroke-width="2"/>'; walk(c); }); })(root);
            (fr.threads || []).forEach((t) => {
                const a = byId[t.fromId], b = byId[t.toId];
                if (!a || !b) return;
                const midY = Math.min(a.y, b.y) - 30;
                svg += '<path d="M' + a.x + ',' + a.y + ' Q' + ((a.x + b.x) / 2) + ',' + midY + ' ' + b.x + ',' + b.y + '" fill="none" stroke="#a855f7" stroke-width="2" stroke-dasharray="5 4"/>';
            });
            edgesEl.innerHTML = svg;
            nodesEl.innerHTML = meta.map((m) => '<div class="tree-node' + (fr.current === m.id ? ' active' : (fr.visited.includes(m.val) ? ' visited' : '')) + '" style="left:' + m.x + 'px;top:' + m.y + 'px">' + m.val + '</div>').join('');
            host.querySelector('.th-seq').textContent = fr.visited.join(', ');
            host.querySelector('.th-phase').textContent = langOf(fr.msg);
        }
        function step() { if (idx < frames.length - 1) { idx++; paint(); return idx < frames.length - 1; } return false; }
        function reset() { idx = 0; paint(); }

        host.appendChild(K().buildStepControls(step, reset, 700));
        paint();
        host.querySelector('.th-build').onclick = () => {
            const vals = host.querySelector('.th-input').value.split(',').map((s) => parseInt(s.trim(), 10)).filter(Number.isFinite);
            if (vals.length) { st.vals = vals; renderTreeThreaded(); }
        };
        host.querySelector('.rand-btn').onclick = () => {
            const inp = window.RandomInput && RandomInput.randomInputFor('tree-threaded', K().getInputDifficulty());
            if (!inp) return;
            _threadedState.vals = inp.vals;
            renderTreeThreaded();
        };
    }

    global.VizRegistry.attach('tree-threaded', {
        render: renderTreeThreaded,
        code: () => codeTreeThreaded,
        layout: { host: 'dynamic' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
