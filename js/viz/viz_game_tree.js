(function (global) {
    const K = () => global.VizKit; // resolved at call time (VizKit set at startup)

    let _gameState = null;
    function renderGameTree() {
        if (!_gameState) _gameState = { leaves: GameTreeViz.SAMPLE_LEAVES.slice(), useAB: true };
        const host = K().acquireDynamicVizHost();
        const { root } = GameTreeViz.buildGameTree(_gameState.leaves, 2);
        const { frames } = GameTreeViz.minimaxFrames(root, _gameState.useAB);
        let idx = 0;

        // ---- Layout: leaves left-to-right, parents centered over children ----
        const meta = {}; // id -> {x,y,node}
        (function () {
            let leafCursor = 0;
            const colW = 60, rowH = 70, padX = 36, padY = 30;
            function layout(node, depth) {
                let x;
                if (node.leaf || !node.children.length) { x = padX + (leafCursor++) * colW; }
                else {
                    const xs = node.children.map((c) => layout(c, depth + 1));
                    x = (xs[0] + xs[xs.length - 1]) / 2;
                }
                meta[node.id] = { x: x, y: padY + depth * rowH, node: node };
                return x;
            }
            layout(root, 0);
        })();

        host.innerHTML =
            '<div class="tt-controls">' +
              '<input type="text" class="gt-input" value="' + _gameState.leaves.join(',') + '">' +
              '<button type="button" class="gt-build">Build</button>' +
              '<label style="margin-left:8px"><input type="checkbox" class="gt-ab" ' + (_gameState.useAB ? 'checked' : '') + '> &alpha;-&beta;</label>' +
            '</div>' +
            '<div class="gt-stage" style="position:relative;overflow:hidden;height:320px">' +
              '<svg class="gt-edges" style="position:absolute;inset:0;width:100%;height:100%"></svg>' +
              '<div class="gt-nodes"></div>' +
            '</div>' +
            '<div class="gt-info" style="margin-top:6px;font-weight:700"></div>';

        const nodesEl = host.querySelector('.gt-nodes');
        const edgesEl = host.querySelector('.gt-edges');

        // Static edges
        let edgeSvg = '';
        Object.keys(meta).forEach((id) => {
            const m = meta[id];
            (m.node.children || []).forEach((c) => {
                const b = meta[c.id];
                if (b) edgeSvg += '<line x1="' + m.x + '" y1="' + m.y + '" x2="' + b.x + '" y2="' + b.y + '" stroke="#94a3b8" stroke-width="2"/>';
            });
        });
        edgesEl.innerHTML = edgeSvg;

        // Static nodes
        Object.keys(meta).forEach((id) => {
            const m = meta[id], node = m.node;
            const d = document.createElement('div');
            d.className = 'tree-node'; d.id = 'gt-node-' + id;
            d.style.left = m.x + 'px'; d.style.top = m.y + 'px';
            if (node.leaf) d.dataset.symbol = String(node.value);
            else d.dataset.symbol = node.isMax ? '▲' : '▽';
            d.textContent = d.dataset.symbol;
            nodesEl.appendChild(d);
        });

        function paint() {
            // Cumulative state up to idx
            const pruned = new Set();
            const returned = {}; // id -> value
            const abText = {};   // id -> {alpha,beta,value}
            let current = null;
            for (let i = 0; i <= idx && i < frames.length; i++) {
                const f = frames[i];
                if (f.type === 'prune') (f.pruned || []).forEach((p) => pruned.add(p));
                if (f.type === 'return' || f.type === 'leaf') returned[f.id] = f.value;
                if (f.type === 'enter' || f.type === 'update') {
                    abText[f.id] = { alpha: f.alpha, beta: f.beta, value: f.type === 'update' ? f.value : undefined };
                }
                if (f.type === 'enter' || f.type === 'update' || f.type === 'leaf' || f.type === 'return') current = f.id;
            }
            const fmt = (v) => (v === Infinity ? '∞' : v === -Infinity ? '-∞' : String(v));

            Object.keys(meta).forEach((id) => {
                const el = document.getElementById('gt-node-' + id);
                if (!el) return;
                el.classList.remove('active', 'visited');
                const nid = meta[id].node.id;
                if (pruned.has(nid)) el.classList.add('gt-pruned'); else el.classList.remove('gt-pruned');
                let label = el.dataset.symbol;
                if (Object.prototype.hasOwnProperty.call(returned, nid) && !meta[id].node.leaf) {
                    label = el.dataset.symbol + '=' + fmt(returned[nid]);
                    el.classList.add('visited');
                }
                el.textContent = label;
                if (nid === current) el.classList.add('active');
            });

            const fr = frames[idx];
            let info = '';
            if (fr) {
                const ab = abText[fr.id];
                if (fr.type === 'prune') info = 'Prune at node ' + fr.id + ': α=' + fmt(fr.alpha) + ' ≥ β=' + fmt(fr.beta);
                else if (fr.type === 'leaf') info = 'Leaf node ' + fr.id + ' = ' + fmt(fr.value);
                else if (ab) info = 'Node ' + fr.id + ': α=' + fmt(ab.alpha) + ', β=' + fmt(ab.beta) + (ab.value !== undefined ? ', best=' + fmt(ab.value) : '');
            }
            if (Object.prototype.hasOwnProperty.call(returned, root.id)) {
                info += (info ? '  |  ' : '') + 'Root value = ' + fmt(returned[root.id]);
            }
            host.querySelector('.gt-info').textContent = info;
        }
        function step() { if (idx < frames.length - 1) { idx++; paint(); return idx < frames.length - 1; } return false; }
        function reset() { idx = 0; paint(); }

        host.appendChild(K().buildStepControls(step, reset, 700));
        paint();

        host.querySelector('.gt-build').onclick = () => {
            try {
                const vals = host.querySelector('.gt-input').value.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => Number.isFinite(n));
                if (vals.length) { _gameState.leaves = vals; renderGameTree(); }
            } catch (e) { /* ignore malformed input */ }
        };
        host.querySelector('.gt-ab').onchange = (e) => {
            _gameState.useAB = e.target.checked;
            renderGameTree();
        };
    }

    global.VizRegistry.attach('game-tree', {
        render: renderGameTree,
        code: () => codeGameTree,
        layout: { host: 'dynamic' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
