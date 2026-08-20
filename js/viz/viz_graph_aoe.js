(function (global) {
    const K = () => global.VizKit; // resolved at call time (VizKit set at startup)

    // Default network = AoeViz.AOE_PRESET, re-expressed as a directed weighted
    // edge-list text (A-I ≅ the preset's original ids 1-9, in the same appearance
    // order, so GraphWorkbench.parseEdges assigns the exact same 0-based indices)
    // so the default render — including tests/graph_aoe.spec.js's "critical path
    // length 18" assertion — stays behaviorally identical while making the
    // network genuinely editable.
    const AOE_DEFAULT_TEXT = 'A-B:6,A-C:4,A-D:5,B-E:1,C-E:1,D-F:2,E-G:9,E-H:7,F-H:4,G-I:2,H-I:4';
    const _aoeState = { text: AOE_DEFAULT_TEXT };

    function escText(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

    function renderGraphAoe() {
        const host = K().acquireDynamicVizHost();
        const langOf = K().langOf;

        host.innerHTML =
            '<div class="gw-toolbar">' +
              '<textarea class="gw-input aoe-input" data-testid="aoe-input" rows="2" spellcheck="false">' + escText(_aoeState.text) + '</textarea>' +
              '<div class="gw-btns">' +
                '<button type="button" class="btn primary aoe-apply" data-testid="aoe-apply">' + langOf({ zh: '建立', en: 'Build' }) + '</button>' +
                '<button type="button" class="rand-btn" title="' + K().t('btn.random-input') + '">🎲</button>' +
              '</div>' +
              '<div class="gw-err aoe-err" data-testid="aoe-err" style="display:none"></div>' +
            '</div>' +
            '<div class="aoe-stage"><svg class="aoe-svg" viewBox="0 0 700 280" width="100%">' +
              '<defs><marker id="aoe-arrow" markerWidth="9" markerHeight="9" refX="14" refY="3" orient="auto">' +
              '<path d="M0,0 L8,3 L0,6 Z" fill="#94a3b8"/></marker></defs>' +
              '<g class="aoe-edges"></g><g class="aoe-nodes"></g></svg></div>' +
            '<div class="aoe-table"></div>' +
            '<div class="aoe-phase"></div>';

        const errEl = host.querySelector('.aoe-err');
        const edgesG = host.querySelector('.aoe-edges');
        const nodesG = host.querySelector('.aoe-nodes');

        function wireToolbar() {
            host.querySelector('.aoe-apply').addEventListener('click', () => {
                _aoeState.text = host.querySelector('.aoe-input').value;
                renderGraphAoe();
            });
            host.querySelector('.rand-btn').addEventListener('click', () => {
                const difficulty = K().getInputDifficulty();
                const r = global.RandomInput && global.RandomInput.randomInputFor('graph-aoe', difficulty);
                if (!r || !r.text) return;
                _aoeState.text = r.text;
                renderGraphAoe();
            });
        }

        const parsed = GraphWorkbench.parseEdges(_aoeState.text, true, true, false);
        if (!parsed.ok) {
            errEl.textContent = langOf(parsed.error);
            errEl.style.display = '';
            wireToolbar();
            return;
        }
        errEl.style.display = 'none';

        const n = parsed.n;
        const nodeStubs = [];
        for (let i = 0; i < n; i++) nodeStubs.push({ id: i });
        const built = AoeViz.buildAoeFrames(nodeStubs, parsed.edges);
        const frames = built.frames;
        const ee = built.ee;

        // Layered left-to-right layout keyed by ee (earliest-event time, a
        // longest-path-from-source depth): nodes sharing the same ee value stack
        // vertically — mirrors the manually-placed AOE_PRESET topology without
        // needing a dedicated layout algorithm.
        const levels = {};
        for (let i = 0; i < n; i++) { const lvl = ee[i] || 0; (levels[lvl] = levels[lvl] || []).push(i); }
        const levelKeys = Object.keys(levels).map(Number).sort((a, b) => a - b);
        const maxLevel = levelKeys.length ? levelKeys[levelKeys.length - 1] : 1;
        const nodes = new Array(n);
        levelKeys.forEach((lvl) => {
            const ids = levels[lvl];
            ids.forEach((id, k) => {
                const x = 40 + (maxLevel > 0 ? (lvl / maxLevel) * 620 : 0);
                const y = ids.length > 1 ? 30 + (k * 220) / (ids.length - 1) : 140;
                nodes[id] = { id: id, label: parsed.labels[id], x: x, y: y };
            });
        });
        const net = { nodes: nodes, edges: parsed.edges };
        const nodeById = (id) => net.nodes[id];

        function paint(fr) {
            if (!host.querySelector('.aoe-table')) return; // host wiped (method switched) — ignore stale tick
            const crit = new Set((fr.criticalEdges || []).map((e) => e.u + '-' + e.v));
            edgesG.innerHTML = net.edges.map((e) => {
                const a = nodeById(e.u), b = nodeById(e.v);
                const isC = crit.has(e.u + '-' + e.v);
                const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
                return '<line x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '" ' +
                    'stroke="' + (isC ? '#dc2626' : '#94a3b8') + '" stroke-width="' + (isC ? 3 : 2) + '" marker-end="url(#aoe-arrow)"/>' +
                    '<text x="' + mx + '" y="' + (my - 4) + '" fill="' + (isC ? '#dc2626' : '#475569') + '" font-size="12" text-anchor="middle">' + e.w + '</text>';
            }).join('');
            nodesG.innerHTML = net.nodes.map((nd) => {
                const active = fr.current === nd.id;
                const eeT = fr.ee[nd.id] != null ? 'ee=' + fr.ee[nd.id] : '';
                const leT = fr.le[nd.id] != null ? 'le=' + fr.le[nd.id] : '';
                return '<circle cx="' + nd.x + '" cy="' + nd.y + '" r="16" fill="' + (active ? '#f59e0b' : '#fff') + '" stroke="#1e40af" stroke-width="2"/>' +
                    '<text x="' + nd.x + '" y="' + (nd.y + 4) + '" text-anchor="middle" font-size="13" font-weight="700">' + nd.label + '</text>' +
                    '<text x="' + nd.x + '" y="' + (nd.y - 22) + '" text-anchor="middle" font-size="10" fill="#2563eb">' + eeT + '</text>' +
                    '<text x="' + nd.x + '" y="' + (nd.y + 30) + '" text-anchor="middle" font-size="10" fill="#7c3aed">' + leT + '</text>';
            }).join('');
            const rows = net.nodes.map((nd) => '<tr><td>' + nd.label + '</td><td>' + (fr.ee[nd.id] != null ? fr.ee[nd.id] : '') + '</td><td>' + (fr.le[nd.id] != null ? fr.le[nd.id] : '') + '</td></tr>').join('');
            host.querySelector('.aoe-table').innerHTML = '<table class="aoe-tbl"><thead><tr><th>v</th><th>ee</th><th>le</th></tr></thead><tbody>' + rows + '</tbody></table>';
            host.querySelector('.aoe-phase').textContent = langOf(fr.msg);
        }
        host.appendChild(K().buildFrameControls(frames, paint, { runIntervalMs: 800 }));
        wireToolbar();
    }

    global.VizRegistry.attach('graph-aoe', {
        render: renderGraphAoe,
        code: () => codeGraphAoe,
        layout: { host: 'dynamic' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
