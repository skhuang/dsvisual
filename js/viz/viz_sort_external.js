(function (global) {
    const K = () => global.VizKit; // resolved at call time (VizKit set at startup)

    let _extState = null;
    function renderSortExternal() {
        const host = K().acquireDynamicVizHost();
        if (!_extState) _extState = { data: [5, 3, 8, 1, 9, 2, 7, 4, 6, 0], M: 4 };
        const st = _extState;
        const langOf = K().langOf;
        const res = ExtSortViz.buildExternalSortFrames(st.data, st.M);
        const frames = res.frames;
        let idx = 0;

        host.innerHTML =
            '<div class="ext-controls">' +
              '<input type="text" class="ext-data" value="' + st.data.join(',') + '">' +
              '<label>M <input type="number" class="ext-m" min="1" max="20" value="' + st.M + '" style="width:54px"></label>' +
              '<button type="button" class="rand-btn" title="Random">🎲</button>' +
              '<button type="button" class="ext-apply">Apply</button>' +
            '</div>' +
            '<div class="ext-runs"></div>' +
            '<div class="ext-tree-stage"><div class="ext-tree-nodes"></div></div>' +
            '<div class="ext-out"><strong>Output:</strong> <span class="ext-out-cells"></span></div>' +
            '<div class="ext-phase"></div>';

        function cells(arr, cls) { return arr.map((v) => '<span class="ext-cell ' + (cls || '') + '">' + v + '</span>').join(' '); }

        function paint() {
            const fr = frames[idx];
            if (!host.querySelector('.ext-runs')) return;
            host.querySelector('.ext-runs').innerHTML = fr.runs.map((r, i) =>
                '<div class="ext-run"><span class="ext-run-label">run ' + (i + 1) + (i === fr.current ? ' ★' : '') + '</span> ' + cells(r) + '</div>').join('');
            const nodesEl = host.querySelector('.ext-tree-nodes');
            nodesEl.innerHTML = '';
            const tree = fr.tree || [];
            if (tree.length > 1) {
                const W = host.querySelector('.ext-tree-stage').clientWidth || 700;
                for (let i = 1; i < tree.length; i++) {
                    if (!tree[i]) continue;
                    const level = Math.floor(Math.log2(i));
                    const posInLevel = i - Math.pow(2, level);
                    const count = Math.pow(2, level);
                    const x = (posInLevel + 0.5) / count * W;
                    const y = level * 52 + 20;
                    const d = document.createElement('div');
                    const isWinner = (i === 1 && fr.winnerRun >= 0);
                    d.className = 'ext-tnode' + (isWinner ? ' winner' : '') + (tree[i].run < 0 ? ' pad' : '');
                    d.textContent = tree[i].val == null ? '∞' : tree[i].val;
                    d.style.left = x + 'px'; d.style.top = y + 'px';
                    nodesEl.appendChild(d);
                }
            }
            host.querySelector('.ext-out-cells').innerHTML = cells(fr.output, 'out');
            host.querySelector('.ext-phase').textContent = langOf(fr.msg);
        }
        function step() { if (idx < frames.length - 1) { idx++; paint(); return idx < frames.length - 1; } return false; }
        function reset() { idx = 0; paint(); }

        host.appendChild(K().buildStepControls(step, reset, 600));
        paint();
        host.querySelector('.ext-apply').onclick = () => {
            const d = host.querySelector('.ext-data').value.split(',').map((s) => parseInt(s.trim(), 10)).filter(Number.isFinite);
            const m = parseInt(host.querySelector('.ext-m').value, 10);
            if (d.length && m >= 1) { st.data = d; st.M = m; renderSortExternal(); }
        };
        host.querySelector('.rand-btn').onclick = () => {
            const inp = window.RandomInput && RandomInput.randomInputFor('sort-external', K().getInputDifficulty());
            if (!inp) return;
            _extState.data = inp.data;
            _extState.M = inp.M;
            renderSortExternal();
        };
    }

    global.VizRegistry.attach('sort-external', {
        render: renderSortExternal,
        code: () => codeSortExternal,
        layout: { host: 'dynamic' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
