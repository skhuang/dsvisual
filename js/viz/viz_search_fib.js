(function (global) {
    const K = () => global.VizKit; // resolved at call time (VizKit set at startup)

    let _fibState = null;
    function renderSearchFibonacci() {
        const host = K().acquireDynamicVizHost();
        if (!_fibState) _fibState = { arr: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19], target: 11 };
        const st = _fibState;
        const langOf = K().langOf;
        const res = FibSearchViz.buildFibSearchFrames(st.arr, st.target);
        const frames = res.frames;
        let idx = 0;

        host.innerHTML =
            '<div class="ss-controls">' +
              '<input type="text" class="ss-arr" value="' + st.arr.join(',') + '">' +
              'target <input type="number" class="ss-target" value="' + st.target + '" style="width:64px">' +
              '<button type="button" class="rand-btn" title="Random">🎲</button>' +
              '<button type="button" class="ss-apply">Apply</button>' +
              '<span class="sm-hint">array must be sorted</span>' +
            '</div>' +
            '<div class="ss-cells"></div>' +
            '<div class="ss-info"></div>' +
            '<div class="ss-result"></div>' +
            '<div class="ss-phase"></div>';

        function paint() {
            const fr = frames[idx];
            if (!host.querySelector('.ss-cells')) return;
            const inRange = (i) => fr.range && i >= fr.range[0] && i <= fr.range[1];
            host.querySelector('.ss-cells').innerHTML = st.arr.map((v, i) =>
                '<span class="ss-cell' + (i === fr.probe ? ' probe' : (inRange(i) ? ' inrange' : '')) + '"><span class="ss-idx">' + i + '</span>' + v + '</span>').join('');
            host.querySelector('.ss-info').innerHTML = 'fibM=' + fr.fibM + ', fib1=' + fr.fib1 + ', fib2=' + fr.fib2 + ', offset=' + fr.lo;
            host.querySelector('.ss-result').textContent = fr.found >= 0 ? ('✓ found at index ' + fr.found) : '';
            host.querySelector('.ss-phase').textContent = langOf(fr.msg);
        }
        function step() { if (idx < frames.length - 1) { idx++; paint(); return idx < frames.length - 1; } return false; }
        function reset() { idx = 0; paint(); }

        host.appendChild(K().buildStepControls(step, reset, 600));
        paint();
        host.querySelector('.ss-apply').onclick = () => {
            const arr = host.querySelector('.ss-arr').value.split(',').map((s) => parseInt(s.trim(), 10)).filter(Number.isFinite).sort((a, b) => a - b);
            const target = parseInt(host.querySelector('.ss-target').value, 10);
            if (arr.length && Number.isFinite(target)) { st.arr = arr; st.target = target; renderSearchFibonacci(); }
        };
        host.querySelector('.rand-btn').onclick = () => {
            const inp = window.RandomInput && RandomInput.randomInputFor('search-fibonacci', K().getInputDifficulty());
            if (!inp) return;
            _fibState.arr = inp.arr;
            _fibState.target = inp.target;
            renderSearchFibonacci();
        };
    }

    global.VizRegistry.attach('search-fibonacci', {
        render: renderSearchFibonacci,
        code: () => codeSearchFibonacci,
        layout: { host: 'dynamic' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
