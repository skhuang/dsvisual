(function (global) {
    const K = () => global.VizKit; // resolved at call time (VizKit set at startup)

    function renderGraphAoe() {
        const host = K().acquireDynamicVizHost();
        const langOf = K().langOf;
        const net = AoeViz.AOE_PRESET;
        const built = AoeViz.buildAoeFrames(net.nodes, net.edges);
        const frames = built.frames;
        let idx = 0;
        const nodeById = (id) => net.nodes.find((n) => n.id === id);

        host.innerHTML =
            '<div class="aoe-stage"><svg class="aoe-svg" viewBox="0 0 700 280" width="100%">' +
              '<defs><marker id="aoe-arrow" markerWidth="9" markerHeight="9" refX="14" refY="3" orient="auto">' +
              '<path d="M0,0 L8,3 L0,6 Z" fill="#94a3b8"/></marker></defs>' +
              '<g class="aoe-edges"></g><g class="aoe-nodes"></g></svg></div>' +
            '<div class="aoe-table"></div>' +
            '<div class="aoe-phase"></div>';

        const edgesG = host.querySelector('.aoe-edges');
        const nodesG = host.querySelector('.aoe-nodes');

        function paint() {
            if (!host.querySelector('.aoe-table')) return; // host wiped (method switched) — ignore stale tick
            const fr = frames[idx];
            const crit = new Set((fr.criticalEdges || []).map((e) => e.u + '-' + e.v));
            edgesG.innerHTML = net.edges.map((e) => {
                const a = nodeById(e.u), b = nodeById(e.v);
                const isC = crit.has(e.u + '-' + e.v);
                const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
                return '<line x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '" ' +
                    'stroke="' + (isC ? '#dc2626' : '#94a3b8') + '" stroke-width="' + (isC ? 3 : 2) + '" marker-end="url(#aoe-arrow)"/>' +
                    '<text x="' + mx + '" y="' + (my - 4) + '" fill="' + (isC ? '#dc2626' : '#475569') + '" font-size="12" text-anchor="middle">' + e.w + '</text>';
            }).join('');
            nodesG.innerHTML = net.nodes.map((n) => {
                const active = fr.current === n.id;
                const eeT = fr.ee[n.id] != null ? 'ee=' + fr.ee[n.id] : '';
                const leT = fr.le[n.id] != null ? 'le=' + fr.le[n.id] : '';
                return '<circle cx="' + n.x + '" cy="' + n.y + '" r="16" fill="' + (active ? '#f59e0b' : '#fff') + '" stroke="#1e40af" stroke-width="2"/>' +
                    '<text x="' + n.x + '" y="' + (n.y + 4) + '" text-anchor="middle" font-size="13" font-weight="700">' + n.id + '</text>' +
                    '<text x="' + n.x + '" y="' + (n.y - 22) + '" text-anchor="middle" font-size="10" fill="#2563eb">' + eeT + '</text>' +
                    '<text x="' + n.x + '" y="' + (n.y + 30) + '" text-anchor="middle" font-size="10" fill="#7c3aed">' + leT + '</text>';
            }).join('');
            const rows = net.nodes.map((n) => '<tr><td>' + n.id + '</td><td>' + (fr.ee[n.id] != null ? fr.ee[n.id] : '') + '</td><td>' + (fr.le[n.id] != null ? fr.le[n.id] : '') + '</td></tr>').join('');
            host.querySelector('.aoe-table').innerHTML = '<table class="aoe-tbl"><thead><tr><th>v</th><th>ee</th><th>le</th></tr></thead><tbody>' + rows + '</tbody></table>';
            host.querySelector('.aoe-phase').textContent = langOf(fr.msg);
        }
        function step() { if (idx < frames.length - 1) { idx++; paint(); return idx < frames.length - 1; } return false; }
        function reset() { idx = 0; paint(); }

        host.appendChild(K().buildStepControls(step, reset, 800));
        paint();
    }

    global.VizRegistry.attach('graph-aoe', {
        render: renderGraphAoe,
        code: () => codeGraphAoe,
        layout: { host: 'dynamic' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
