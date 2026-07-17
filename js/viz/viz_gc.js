(function (global) {
    const K = () => global.VizKit; // resolved at call time (VizKit set at startup)

    let _gcState = null;
    function renderGcMemory() {
        if (!_gcState) _gcState = { mode: 'mark-sweep' };
        const host = K().acquireDynamicVizHost();
        const { frames } = GcMemoryViz.gcMemoryFrames(_gcState.mode);
        let idx = 0;

        const modes = [['mark-sweep', 'Mark-Sweep'], ['refcount', 'Reference Counting'], ['buddy', 'Buddy System']];
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
            } else {
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
