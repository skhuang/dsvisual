(function (global) {
    const K = () => global.VizKit; // resolved at call time (VizKit set at startup)

    // NOTE: escapeHtml is a stateless pure helper also used elsewhere in
    // js/app.js (e.g. slide title rendering). Duplicated here privately
    // rather than shared, per the extraction recipe.
    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, (c) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
        }[c]));
    }

    let _hfState = null;
    function renderHuffman() {
        const host = K().acquireDynamicVizHost();
        if (!_hfState) _hfState = { text: 'ABRACADABRA' };
        const st = _hfState;
        const freqs = HuffmanViz.computeFrequencies(st.text);
        const result = HuffmanViz.buildHuffmanFrames(freqs);
        const frames = result.frames, nodes = result.nodes, codes = result.codes;
        let idx = 0;
        const langOf = K().langOf;

        host.innerHTML =
            '<div class="hf-controls">' +
              '<input type="text" class="hf-input">' +
              '<button type="button" class="rand-btn" title="Random">🎲</button>' +
              '<button type="button" class="hf-apply">Apply</button>' +
            '</div>' +
            '<div class="hf-pq"><strong>Priority queue:</strong> <span class="hf-pq-list"></span></div>' +
            '<div class="hf-stage"><svg class="hf-edges"></svg><div class="hf-nodes"></div></div>' +
            '<div class="hf-codes"></div>' +
            '<div class="hf-phase"></div>';
        host.querySelector('.hf-input').value = st.text;

        const nodesEl = host.querySelector('.hf-nodes');
        const edgesEl = host.querySelector('.hf-edges');

        function layoutForest(rootIds) {
            const meta = {};
            const width = host.querySelector('.hf-stage').clientWidth || 760;
            const slot = width / (rootIds.length + 1);
            function place(id, x, y, dx, m) {
                const n = nodes[id];
                m[id] = { x: x, y: y, label: (n.sym !== null ? n.sym + ':' : '') + n.freq, isLeaf: n.sym !== null };
                if (n.left) place(n.left, x - dx, y + 60, dx * 0.6, m);
                if (n.right) place(n.right, x + dx, y + 60, dx * 0.6, m);
            }
            rootIds.forEach((rid, i) => { place(rid, (i + 1) * slot, 30, Math.max(40, slot / 2.4), meta); });
            return meta;
        }

        function paint() {
            const pqEl = host.querySelector('.hf-pq-list');
            if (!pqEl) return;
            const fr = frames[idx];
            pqEl.innerHTML = fr.pq.map(p =>
                '<span class="hf-pq-card">' + (p.sym !== null ? escapeHtml(p.sym) + ':' : '') + p.freq + '</span>').join('');
            const meta = layoutForest(fr.forestRoots);
            nodesEl.innerHTML = ''; edgesEl.innerHTML = '';
            Object.keys(meta).forEach(id => {
                const m = meta[id];
                const d = document.createElement('div');
                d.className = 'tree-node hf-node' + (m.isLeaf ? ' leaf' : '');
                if (fr.picked && fr.picked.includes(id)) d.classList.add('picked');
                if (fr.merged === id) d.classList.add('merged');
                d.textContent = m.label;
                d.style.left = m.x + 'px'; d.style.top = m.y + 'px';
                nodesEl.appendChild(d);
                const n = nodes[id];
                [n.left, n.right].forEach(c => {
                    if (c && meta[c]) edgesEl.innerHTML += '<line x1="' + m.x + '" y1="' + m.y + '" x2="' + meta[c].x + '" y2="' + meta[c].y + '" stroke="#94a3b8" stroke-width="2"/>';
                });
            });
            if (fr.phase === 'done') {
                const totalBits = Object.entries(codes).reduce((s, pair) => {
                    const sym = pair[0], c = pair[1];
                    const f = freqs.find(x => x.sym === sym); return s + c.length * (f ? f.freq : 0);
                }, 0);
                const fixedBits = freqs.reduce((s, f) => s + f.freq, 0) * Math.max(1, Math.ceil(Math.log2(Math.max(1, freqs.length))));
                host.querySelector('.hf-codes').innerHTML =
                    '<table class="hf-code-table"><thead><tr><th>Symbol</th><th>Freq</th><th>Code</th></tr></thead><tbody>' +
                    freqs.map(f => '<tr><td>' + escapeHtml(f.sym) + '</td><td>' + f.freq + '</td><td><code>' + codes[f.sym] + '</code></td></tr>').join('') +
                    '</tbody></table>' +
                    '<div class="hf-stats">Huffman: ' + totalBits + ' bits vs fixed-length: ' + fixedBits + ' bits</div>';
            } else {
                host.querySelector('.hf-codes').innerHTML = '';
            }
            host.querySelector('.hf-phase').textContent = langOf(fr.msg);
        }
        function step() { if (idx < frames.length - 1) { idx++; paint(); return idx < frames.length - 1; } return false; }
        function reset() { idx = 0; paint(); }

        host.appendChild(K().buildStepControls(step, reset, 800));
        paint();

        host.querySelector('.hf-apply').onclick = () => {
            const v = host.querySelector('.hf-input').value;
            if (v && v.length) { st.text = v; renderHuffman(); }
        };
        host.querySelector('.rand-btn').onclick = () => {
            const inp = window.RandomInput && RandomInput.randomInputFor('huffman', K().getInputDifficulty());
            if (!inp) return;
            _hfState.text = inp.text;
            renderHuffman();
        };
    }

    global.VizRegistry.attach('huffman', {
        render: renderHuffman,
        // NOTE: codeHuffman is declared with `const` at the top level of the
        // classic (non-module) script js/code_db.js — a lexical global shared
        // across <script> tags but not attached to `window`. Must reference the
        // bare identifier, not `global.codeHuffman` (always undefined).
        code: () => codeHuffman,
        layout: { host: 'dynamic' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
