(function (global) {
    const K = () => global.VizKit; // resolved at call time (VizKit set at startup)

    let _gcState = null;
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
                const grid = document.createElement('div');
                grid.className = 'gc-grid';
                fr.heap.forEach((o) => {
                    const c = document.createElement('div');
                    c.className = 'gc-cell' + (o.free ? ' gc-free' : (o.mark ? ' gc-mark' : '')) + (o.id === fr.active ? ' gc-active' : '');
                    c.innerHTML = '<div class="gc-cell-id">#' + o.id + '</div><div class="gc-cell-meta">' + (o.free ? 'freed' : (o.mark ? 'marked' : '·')) + '</div>';
                    grid.appendChild(c);
                });
                stage.appendChild(grid);
            } else if (_gcState.mode === 'refcount') {
                badge.textContent = fr.action;
                const grid = document.createElement('div');
                grid.className = 'gc-grid';
                fr.objs.forEach((o) => {
                    const c = document.createElement('div');
                    c.className = 'gc-cell' + (o.free ? ' gc-free' : '') + (o.id === fr.active ? ' gc-active' : '');
                    c.innerHTML = '<div class="gc-cell-id">' + o.id + '</div><div class="gc-cell-meta">rc=' + o.count + (o.free ? ' freed' : '') + '</div>';
                    grid.appendChild(c);
                });
                stage.appendChild(grid);
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
