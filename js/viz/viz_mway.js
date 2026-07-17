(function (global) {
    const K = () => global.VizKit; // resolved at call time (VizKit set at startup)

    let _mwayState = null;
    function renderTreeMway() {
        const host = K().acquireDynamicVizHost();
        if (!_mwayState) _mwayState = { keys: [50, 30, 70, 20, 40, 60, 80, 10, 25], m: 3 };
        const st = _mwayState;
        const langOf = K().langOf;
        const res = MwayViz.buildMwayFrames(st.keys, st.m);
        const frames = res.frames;
        let idx = 0;

        host.innerHTML =
            '<div class="mw-controls">' +
              '<input type="text" class="mw-keys" value="' + st.keys.join(',') + '">' +
              'm <input type="number" class="mw-m" min="3" max="6" value="' + st.m + '" style="width:54px">' +
              '<button type="button" class="rand-btn" title="Random">🎲</button>' +
              '<button type="button" class="mw-apply">Apply</button>' +
            '</div>' +
            '<div class="mw-stage"><svg class="mw-edges"></svg><div class="mw-nodes"></div></div>' +
            '<div class="mw-phase"></div>';

        function layout(tree) {
            const pos = {}; let leaf = 0; const W = host.querySelector('.mw-stage').clientWidth || 720;
            function place(node, depth) {
                if (!node) return;
                const kids = node.children.filter((c) => c);
                if (kids.length === 0) { pos[node.id] = { col: leaf++, depth, node }; return; }
                kids.forEach((c) => place(c, depth + 1));
                const cols = kids.map((c) => pos[c.id].col);
                pos[node.id] = { col: (Math.min(...cols) + Math.max(...cols)) / 2, depth, node };
            }
            place(tree, 0);
            const maxCol = Math.max(1, leaf - 1);
            const xOf = (col) => 40 + (col / maxCol) * (W - 120);
            return { pos, xOf };
        }

        function paint() {
            const fr = frames[idx];
            if (!host.querySelector('.mw-nodes')) return;
            const nodesEl = host.querySelector('.mw-nodes');
            const edgesEl = host.querySelector('.mw-edges');
            nodesEl.innerHTML = ''; edgesEl.innerHTML = '';
            if (!fr.tree) { host.querySelector('.mw-phase').textContent = langOf(fr.msg); return; }
            const { pos, xOf } = layout(fr.tree);
            const onPath = new Set(fr.descendPath || []);
            let svg = '';
            Object.keys(pos).forEach((id) => {
                const p = pos[id];
                p.node.children.forEach((c) => { if (c && pos[c.id]) svg += '<line x1="' + xOf(p.col) + '" y1="' + (p.depth * 78 + 24) + '" x2="' + xOf(pos[c.id].col) + '" y2="' + (pos[c.id].depth * 78 + 8) + '" stroke="#94a3b8" stroke-width="2"/>'; });
            });
            edgesEl.innerHTML = svg;
            nodesEl.innerHTML = Object.keys(pos).map((id) => {
                const p = pos[id];
                const cls = 'mw-node' + (id === fr.current ? ' cur' : (onPath.has(id) ? ' onpath' : ''));
                const cells = p.node.keys.map((k) => '<span class="mw-key">' + k + '</span>').join('');
                return '<div class="' + cls + '" style="left:' + xOf(p.col) + 'px;top:' + (p.depth * 78 + 8) + 'px">' + cells + '</div>';
            }).join('');
            host.querySelector('.mw-phase').textContent = langOf(fr.msg);
        }
        function step() { if (idx < frames.length - 1) { idx++; paint(); return idx < frames.length - 1; } return false; }
        function reset() { idx = 0; paint(); }

        host.appendChild(K().buildStepControls(step, reset, 700));
        paint();
        host.querySelector('.mw-apply').onclick = () => {
            const keys = host.querySelector('.mw-keys').value.split(',').map((s) => parseInt(s.trim(), 10)).filter(Number.isFinite);
            const m = parseInt(host.querySelector('.mw-m').value, 10);
            if (keys.length && m >= 3) { st.keys = keys; st.m = m; renderTreeMway(); }
        };
        host.querySelector('.rand-btn').onclick = () => {
            const inp = window.RandomInput && RandomInput.randomInputFor('tree-mway', K().getInputDifficulty());
            if (!inp) return;
            _mwayState.keys = inp.keys;
            _mwayState.m = inp.m;
            renderTreeMway();
        };
    }

    global.VizRegistry.attach('tree-mway', {
        render: renderTreeMway,
        code: () => codeTreeMway,
        layout: { host: 'dynamic' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
