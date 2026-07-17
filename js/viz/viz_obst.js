(function (global) {
    const K = () => global.VizKit; // resolved at call time (VizKit set at startup)

    // NOTE: computeTreeLayout is a pure, stateless geometry helper also used by
    // several other tree renderers still living in js/app.js (renderTreeMway,
    // renderTreeExpression, the BST renderer, etc.). It reads/writes nothing
    // outside its own parameters, so it's duplicated here verbatim rather than
    // shared, per the self-containment rule: it is NOT removed from app.js.
    function computeTreeLayout(node, x, y, dx, nodesMeta) {
        if (!node) return;
        nodesMeta.push({ id: node.id, val: node.val, x: x, y: y, color: node.color });
        if (node.left) computeTreeLayout(node.left, x - dx, y + 60, dx * 0.55, nodesMeta);
        if (node.right) computeTreeLayout(node.right, x + dx, y + 60, dx * 0.55, nodesMeta);
    }

    let _obstState = null;
    function renderTreeObst() {
        const host = K().acquireDynamicVizHost();
        if (!_obstState) _obstState = { keys: [10, 20, 30, 40], freqs: [4, 2, 6, 3] };
        const st = _obstState;
        const langOf = K().langOf;
        const n = st.keys.length;
        const res = ObstViz.buildObstFrames(st.keys, st.freqs);
        const frames = res.frames;
        let idx = 0;

        host.innerHTML =
            '<div class="obst-controls">' +
              '<input type="text" class="obst-keys" value="' + st.keys.join(',') + '" placeholder="keys e.g. 10,20,30">' +
              '<input type="text" class="obst-freqs" value="' + st.freqs.join(',') + '" placeholder="freqs e.g. 4,2,6">' +
              '<button type="button" class="rand-btn" title="Random">🎲</button>' +
              '<button type="button" class="obst-apply">Apply</button>' +
            '</div>' +
            '<div class="obst-grid"></div>' +
            '<div class="obst-tree-stage"><svg class="obst-edges"></svg><div class="obst-nodes"></div></div>' +
            '<div class="obst-phase"></div>';

        function paint() {
            const fr = frames[idx];
            if (!host.querySelector('.obst-grid')) return;
            let html = '<table class="obst-tbl"><tr><th>i\\j</th>';
            for (let j = 0; j < n; j++) html += '<th>' + st.keys[j] + '</th>';
            html += '</tr>';
            for (let i = 0; i < n; i++) {
                html += '<tr><th>' + st.keys[i] + '</th>';
                for (let j = 0; j < n; j++) {
                    if (j < i) { html += '<td class="obst-empty"></td>'; continue; }
                    const v = fr.cost[i + ',' + j];
                    const cur = (fr.phase === 'fill' && fr.i === i && fr.j === j) ? ' obst-cur' : '';
                    html += '<td class="obst-cell' + cur + '">' + (v != null ? v : '') + '</td>';
                }
                html += '</tr>';
            }
            html += '</table>';
            host.querySelector('.obst-grid').innerHTML = html;
            const nodesEl = host.querySelector('.obst-nodes');
            const edgesEl = host.querySelector('.obst-edges');
            if (fr.phase === 'tree') {
                const meta = [];
                computeTreeLayout(res.tree, 200, 30, 90, meta);
                const byId = {}; meta.forEach((m) => { byId[m.id] = m; });
                edgesEl.innerHTML = '';
                (function walk(nd) { if (!nd) return; [nd.left, nd.right].forEach((c) => { if (!c) return; const a = byId[nd.id], b = byId[c.id]; edgesEl.innerHTML += '<line x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '" stroke="#94a3b8" stroke-width="2"/>'; walk(c); }); })(res.tree);
                nodesEl.innerHTML = '';
                meta.forEach((m) => { const d = document.createElement('div'); d.className = 'tree-node'; d.textContent = m.val; d.style.left = m.x + 'px'; d.style.top = m.y + 'px'; nodesEl.appendChild(d); });
            } else { nodesEl.innerHTML = ''; edgesEl.innerHTML = ''; }
            host.querySelector('.obst-phase').textContent = langOf(fr.msg);
        }
        function step() { if (idx < frames.length - 1) { idx++; paint(); return idx < frames.length - 1; } return false; }
        function reset() { idx = 0; paint(); }

        host.appendChild(K().buildStepControls(step, reset, 600));
        paint();
        host.querySelector('.obst-apply').onclick = () => {
            const ks = host.querySelector('.obst-keys').value.split(',').map((s) => parseInt(s.trim(), 10)).filter(Number.isFinite);
            const fs = host.querySelector('.obst-freqs').value.split(',').map((s) => parseInt(s.trim(), 10)).filter(Number.isFinite);
            if (ks.length && ks.length === fs.length) { ks.sort((a, b) => a - b); st.keys = ks; st.freqs = fs; renderTreeObst(); }
        };
        host.querySelector('.rand-btn').onclick = () => {
            const inp = window.RandomInput && RandomInput.randomInputFor('tree-obst', K().getInputDifficulty());
            if (!inp) return;
            _obstState.keys = inp.keys;
            _obstState.freqs = inp.freqs;
            renderTreeObst();
        };
    }

    global.VizRegistry.attach('tree-obst', {
        render: renderTreeObst,
        code: () => codeTreeObst,
        layout: { host: 'dynamic' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
