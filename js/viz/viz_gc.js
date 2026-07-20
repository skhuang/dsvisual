(function (global) {
    const K = () => global.VizKit; // resolved at call time (VizKit set at startup)

    let _gcState = null;

    function renderObjectGraph(stage, opts) {
        const mode = opts.mode, nodes = opts.nodes, roots = opts.roots || [], activeId = opts.activeId;
        const byId = {}; nodes.forEach((n) => { byId[n.id] = n; });
        const rootSet = new Set(roots);
        const NODE_W = 74, NODE_H = 46, COL_GAP = 66, ROW_GAP = 22;
        const pos = {};
        if (mode === 'mark-sweep') {
            const depth = {}, q = [];
            roots.forEach((r) => { if (byId[r] != null) { depth[r] = 0; q.push(r); } });
            while (q.length) {
                const id = q.shift();
                (byId[id].refs || []).forEach((t) => { if (byId[t] != null && depth[t] === undefined) { depth[t] = depth[id] + 1; q.push(t); } });
            }
            const layers = {};
            nodes.forEach((n) => { if (depth[n.id] !== undefined) { (layers[depth[n.id]] = layers[depth[n.id]] || []).push(n.id); } });
            Object.keys(layers).forEach((d) => {
                layers[d].forEach((id, i) => { pos[id] = { x: 12 + Number(d) * (NODE_W + COL_GAP), y: 12 + i * (NODE_H + ROW_GAP) }; });
            });
            const layerSizes = Object.values(layers).map((a) => a.length);
            const reachableRows = layerSizes.length ? Math.max.apply(null, layerSizes) : 1;
            const bandY = 12 + reachableRows * (NODE_H + ROW_GAP) + 26;
            nodes.filter((n) => depth[n.id] === undefined).forEach((n, i) => { pos[n.id] = { x: 12 + i * (NODE_W + COL_GAP), y: bandY }; });
        } else {
            nodes.forEach((n, i) => { pos[n.id] = { x: 12 + i * (NODE_W + COL_GAP), y: 48 }; });
        }
        const xs = nodes.map((n) => pos[n.id].x), ys = nodes.map((n) => pos[n.id].y);
        const width = Math.max.apply(null, xs) + NODE_W + 12;
        const height = Math.max.apply(null, ys) + NODE_H + 12;

        const graph = document.createElement('div');
        graph.className = 'gc-graph';
        graph.style.width = width + 'px'; graph.style.height = height + 'px';

        const NS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('class', 'gc-edge-layer');
        svg.setAttribute('width', width); svg.setAttribute('height', height);
        const defs = document.createElementNS(NS, 'defs');
        defs.innerHTML = '<marker id="gc-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#94a3b8"/></marker>';
        svg.appendChild(defs);
        nodes.forEach((n, si) => {
            (n.refs || []).forEach((t) => {
                if (!pos[n.id] || !pos[t]) return;
                const a = pos[n.id], b = pos[t];
                const x1 = a.x + NODE_W / 2, y1 = a.y + NODE_H / 2, x2 = b.x + NODE_W / 2, y2 = b.y + NODE_H / 2;
                let el;
                if (mode === 'refcount') {                       // bow so bidirectional pairs (leaked cycle) separate
                    const ti = nodes.findIndex((m) => m.id === t);
                    const dir = ti > si ? -1 : 1;
                    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 + dir * 34;
                    el = document.createElementNS(NS, 'path');
                    el.setAttribute('d', 'M' + x1 + ',' + y1 + ' Q' + mx + ',' + my + ' ' + x2 + ',' + y2);
                    el.setAttribute('fill', 'none');
                } else {
                    el = document.createElementNS(NS, 'line');
                    el.setAttribute('x1', x1); el.setAttribute('y1', y1); el.setAttribute('x2', x2); el.setAttribute('y2', y2);
                }
                el.setAttribute('class', 'gc-edge');
                el.setAttribute('marker-end', 'url(#gc-arrow)');
                svg.appendChild(el);
            });
        });
        graph.appendChild(svg);

        nodes.forEach((n) => {
            const p = pos[n.id]; if (!p) return;
            const cell = document.createElement('div');
            let cls = 'gc-cell gc-node';
            if (n.free) cls += ' gc-free';
            else if (mode === 'mark-sweep' && n.mark) cls += ' gc-mark';
            if (rootSet.has(n.id)) cls += ' gc-root';
            if (n.id === activeId) cls += ' gc-active';
            cell.className = cls;
            cell.style.left = p.x + 'px'; cell.style.top = p.y + 'px';
            let meta;
            if (mode === 'mark-sweep') meta = n.free ? 'freed' : (rootSet.has(n.id) ? 'root' : (n.mark ? 'reachable' : 'unmarked'));
            else meta = n.free ? 'freed' : ('rc=' + n.count);
            cell.innerHTML = '<div class="gc-cell-id">#' + n.id + '</div><div class="gc-cell-meta">' + meta + '</div>';
            graph.appendChild(cell);
        });
        stage.appendChild(graph);

        const legend = document.createElement('div');
        legend.className = 'gc-legend';
        const items = (mode === 'mark-sweep')
            ? [['gc-root', 'root'], ['gc-mark', 'reachable'], ['', 'unmarked'], ['gc-free', 'freed']]
            : [['', 'alive (rc>0)'], ['gc-free', 'freed (rc=0)']];
        legend.innerHTML = items.map((it) => '<span class="gc-legend-item"><span class="gc-swatch ' + it[0] + '"></span>' + it[1] + '</span>').join('');
        stage.appendChild(legend);
    }

    function renderGcMemory() {
        if (!_gcState) _gcState = { mode: 'mark-sweep' };
        const host = K().acquireDynamicVizHost();
        const { frames } = GcMemoryViz.gcMemoryFrames(_gcState.mode);
        let idx = 0;

        const modes = [
            ['mark-sweep', 'Mark-Sweep'],
            ['refcount', 'Reference Counting'],
            ['buddy', 'Buddy System'],
            ['pointer-reversal', 'Pointer-Reversal Mark (MARK2)'],
            ['compact', 'Compaction (COMPACT)'],
        ];
        host.innerHTML =
            '<div class="gc-controls">' +
              '<select class="gc-mode">' +
                modes.map((m) => '<option value="' + m[0] + '"' + (m[0] === _gcState.mode ? ' selected' : '') + '>' + m[1] + '</option>').join('') +
              '</select>' +
              '<span class="gc-badge"></span>' +
            '</div>' +
            '<div class="gc-stage"></div>';

        const stage = host.querySelector('.gc-stage');
        const badge = host.querySelector('.gc-badge');

        function paint() {
            const fr = frames[idx];
            stage.innerHTML = '';
            if (_gcState.mode === 'mark-sweep') {
                badge.textContent = 'phase: ' + fr.phase + (fr.active != null ? '  (obj ' + fr.active + ')' : '');
                renderObjectGraph(stage, { mode: 'mark-sweep', nodes: fr.heap, roots: fr.roots, activeId: fr.active });
            } else if (_gcState.mode === 'refcount') {
                badge.textContent = fr.action;
                renderObjectGraph(stage, { mode: 'refcount', nodes: fr.objs, roots: [], activeId: fr.active });
            } else if (_gcState.mode === 'buddy') {
                badge.textContent = fr.action;
                const bar = document.createElement('div');
                bar.className = 'gc-bar';
                fr.blocks.forEach((b) => {
                    const seg = document.createElement('div');
                    seg.className = 'gc-seg' + (b.free ? ' gc-seg-free' : ' gc-seg-alloc') + (b.start === fr.active ? ' gc-active' : '');
                    seg.style.width = (100 * b.size / fr.total) + '%';
                    seg.textContent = (b.free ? '' : (b.id + ' ')) + b.size;
                    bar.appendChild(seg);
                });
                stage.appendChild(bar);
            } else if (_gcState.mode === 'pointer-reversal') {
                badge.textContent = fr.phase + '   P=' + (fr.p || '·') + '  Q=' + (fr.q || '·');
                const grid = document.createElement('div');
                grid.className = 'gc-grid';
                fr.nodes.forEach((n) => {
                    const c = document.createElement('div');
                    c.className = 'gc-cell' + (n.mark ? ' gc-mark' : '')
                        + (n.id === fr.p ? ' gc-node-p' : '') + (n.id === fr.q ? ' gc-node-q' : '');
                    const d = 'd:' + (n.dlink || '·') + (n.dRev ? '↺' : '');
                    const r = 'r:' + (n.rlink || '·') + (n.rRev ? '↺' : '');
                    c.innerHTML = '<div class="gc-cell-id">' + n.id + (n.tag ? ' ▣' : '') + '</div>'
                        + '<div class="gc-cell-meta">' + (n.mark ? '✓ ' : '') + d + '  ' + r + '</div>';
                    grid.appendChild(c);
                });
                stage.appendChild(grid);
            } else if (_gcState.mode === 'compact') {
                badge.textContent = fr.phase;
                const bar = document.createElement('div');
                bar.className = 'gc-bar';
                // lay out by address from LIVE blocks only; free space = the gaps + tail
                const live = fr.blocks.filter((b) => b.live).slice().sort((x, y) => x.addr - y.addr);
                let cursor = 1;
                function pushFree(size) {
                    if (size <= 0) return;
                    const seg = document.createElement('div');
                    seg.className = 'gc-seg gc-seg-free';
                    seg.style.width = (100 * size / fr.total) + '%';
                    bar.appendChild(seg);
                }
                live.forEach((b) => {
                    if (b.addr > cursor) pushFree(b.addr - cursor);
                    const seg = document.createElement('div');
                    seg.className = 'gc-seg gc-seg-alloc' + (b.id === fr.active ? ' gc-active' : '');
                    seg.style.width = (100 * b.size / fr.total) + '%';
                    let label = b.id;
                    if (b.newAddr != null && fr.pass < 3) label += '→@' + b.newAddr;
                    if (b.link != null) label += ' →' + b.link;
                    seg.textContent = label;
                    bar.appendChild(seg);
                    cursor = b.addr + b.size;
                });
                pushFree(fr.total + 1 - cursor);
                stage.appendChild(bar);
            }
        }
        function step() { if (idx < frames.length - 1) { idx++; paint(); return idx < frames.length - 1; } return false; }
        function reset() { idx = 0; paint(); }

        host.appendChild(K().buildStepControls(step, reset, 700));
        paint();

        host.querySelector('.gc-mode').onchange = function () {
            _gcState.mode = this.value;
            renderGcMemory();
        };
    }

    global.VizRegistry.attach('gc-memory', {
        render: renderGcMemory,
        code: () => codeGcMemory,
        layout: { host: 'dynamic' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
