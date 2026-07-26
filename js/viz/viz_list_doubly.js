(function (global) {
    const K = () => global.VizKit; // resolved at call time (VizKit set at startup)

    let _doublyState = null;
    function renderListDoubly() {
        const host = K().acquireDynamicVizHost();
        if (!_doublyState) _doublyState = { vals: [10, 20, 30, 40], circular: false };
        const st = _doublyState;
        const langOf = K().langOf;
        const res = DoublyViz.buildDoublyFrames(st.vals, st.circular);
        const frames = res.frames;

        host.innerHTML =
            '<div class="dl-controls">' +
              '<input type="text" class="dl-input" value="' + st.vals.join(',') + '">' +
              '<label><input type="checkbox" class="dl-circular"' + (st.circular ? ' checked' : '') + '> circular</label>' +
              '<button type="button" class="rand-btn" title="Random">🎲</button>' +
              '<button type="button" class="dl-apply">Apply</button>' +
            '</div>' +
            '<div class="dl-row' + (st.circular ? ' dl-circular-on' : '') + '"></div>' +
            '<div class="dl-phase"></div>';

        function paint(fr) {
            if (!host.querySelector('.dl-row')) return;
            host.querySelector('.dl-row').innerHTML = fr.nodes.map((n, i) =>
                '<span class="dl-node' + (i === fr.current ? ' cur' : '') + '">' +
                  '<span class="dl-ptr">' + (n.prevVal == null ? '∅' : n.prevVal) + '</span>' +
                  '<span class="dl-val">' + n.val + '</span>' +
                  '<span class="dl-ptr">' + (n.nextVal == null ? '∅' : n.nextVal) + '</span>' +
                '</span>' + (i < fr.nodes.length - 1 ? '<span class="dl-link">⇄</span>' : '')
            ).join('') + (fr.circular ? '<span class="dl-wrap">↩ circular</span>' : '');
            host.querySelector('.dl-phase').textContent = langOf(fr.msg);
        }
        host.appendChild(K().buildFrameControls(frames, paint, { runIntervalMs: 600 }));
        host.querySelector('.dl-apply').onclick = () => {
            const vals = host.querySelector('.dl-input').value.split(',').map((s) => parseInt(s.trim(), 10)).filter(Number.isFinite);
            const circular = host.querySelector('.dl-circular').checked;
            if (vals.length) { st.vals = vals; st.circular = circular; renderListDoubly(); }
        };
        host.querySelector('.rand-btn').onclick = () => {
            const inp = window.RandomInput && RandomInput.randomInputFor('list-doubly', K().getInputDifficulty());
            if (!inp) return;
            _doublyState.vals = inp.vals;
            _doublyState.circular = inp.circular;
            renderListDoubly();
        };
    }

    global.VizRegistry.attach('list-doubly', {
        render: renderListDoubly,
        code: () => codeListDoubly,
        layout: { host: 'dynamic' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
