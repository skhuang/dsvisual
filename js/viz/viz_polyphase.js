(function (global) {
    const K = () => global.VizKit; // resolved at call time (VizKit set at startup)

    let _polyphaseState = null;
    function renderSortPolyphase() {
        const host = K().acquireDynamicVizHost();
        if (!_polyphaseState) _polyphaseState = { data: SortPolyphaseViz.SAMPLE.slice() };
        const st = _polyphaseState;
        const res = SortPolyphaseViz.polyphaseFrames(st.data);
        const frames = res.frames;
        let idx = 0;

        const labels = ['Tape 1', 'Tape 2', 'Output'];

        host.innerHTML =
            '<div class="pf-controls">' +
              '<input type="text" class="pf-data" value="' + st.data.join(',') + '">' +
              '<button type="button" class="pf-apply">Apply</button>' +
            '</div>' +
            '<div class="pf-stage"></div>' +
            '<div class="pf-phase"></div>';

        function runChip(run) {
            if (run === null || run === undefined) return '<span class="pf-chip pf-dummy">∅</span>';
            return '<span class="pf-chip">[' + run.join(',') + ']</span>';
        }

        function paint() {
            const fr = frames[idx];
            const stage = host.querySelector('.pf-stage');
            if (!stage) return;
            // The output row is the tape just written to during a merge frame.
            stage.innerHTML = fr.tapes.map((tape, i) =>
                '<div class="pf-row">' +
                  '<span class="pf-row-label">' + labels[i] + '</span>' +
                  '<span class="pf-chips">' + (tape.length ? tape.map(runChip).join('') : '<span class="pf-empty">—</span>') + '</span>' +
                '</div>').join('');
            const badge = { distribute: 'Distribute', merge: 'Merge', done: 'Done' }[fr.phase] || fr.phase;
            host.querySelector('.pf-phase').innerHTML = '<span class="pf-badge pf-' + fr.phase + '">' + badge + '</span>';
        }
        function step() { if (idx < frames.length - 1) { idx++; paint(); return idx < frames.length - 1; } return false; }
        function reset() { idx = 0; paint(); }

        host.appendChild(K().buildStepControls(step, reset, 700));
        paint();

        host.querySelector('.pf-apply').onclick = () => {
            try {
                const d = host.querySelector('.pf-data').value.split(',').map((s) => parseInt(s.trim(), 10)).filter(Number.isFinite);
                _polyphaseState.data = d;
                renderSortPolyphase();
            } catch (e) { /* ignore malformed input */ }
        };
    }

    global.VizRegistry.attach('sort-polyphase', {
        render: renderSortPolyphase,
        code: () => codeSortPolyphase,
        layout: { host: 'dynamic' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
