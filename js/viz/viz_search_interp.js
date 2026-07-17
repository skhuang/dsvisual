(function (global) {
    const K = () => global.VizKit; // resolved at call time (VizKit set at startup)

    let _interpState = null;
    function renderSearchInterpolation() {
        const host = K().acquireDynamicVizHost();
        if (!_interpState) _interpState = { arr: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100], target: 70 };
        const st = _interpState;
        const langOf = K().langOf;
        const res = InterpSearchViz.buildInterpFrames(st.arr, st.target);
        const frames = res.frames;
        let idx = 0;

        host.innerHTML =
            '<div class="ss-controls">' +
              '<input type="text" class="ss-arr" value="' + st.arr.join(',') + '">' +
              'target <input type="number" class="ss-target" value="' + st.target + '" style="width:64px">' +
              '<button type="button" class="rand-btn" title="Random">🎲</button>' +
              '<button type="button" class="ss-apply">Apply</button>' +
              '<span class="sm-hint">sorted; works best when ~uniform</span>' +
            '</div>' +
            '<div class="ss-cells"></div>' +
            '<div class="ss-info"></div>' +
            '<div class="ss-result"></div>' +
            '<div class="ss-phase"></div>';

        function paint() {
            const fr = frames[idx];
            if (!host.querySelector('.ss-cells')) return;
            const inRange = (i) => i >= fr.lo && i <= fr.hi;
            host.querySelector('.ss-cells').innerHTML = st.arr.map((v, i) =>
                '<span class="ss-cell' + (i === fr.pos ? ' probe' : (inRange(i) ? ' inrange' : '')) + '"><span class="ss-idx">' + i + '</span>' + v + '</span>').join('');
            const a = st.arr;
            host.querySelector('.ss-info').innerHTML = (fr.pos >= 0 && fr.lo <= fr.hi)
                ? 'pos = lo + (target − a[lo])·(hi − lo) / (a[hi] − a[lo]) = ' + fr.lo + ' + (' + st.target + '−' + a[fr.lo] + ')·(' + fr.hi + '−' + fr.lo + ')/(' + a[fr.hi] + '−' + a[fr.lo] + ') = ' + fr.pos
                : 'lo=' + fr.lo + ', hi=' + fr.hi;
            host.querySelector('.ss-result').textContent = fr.found >= 0 ? ('✓ found at index ' + fr.found) : '';
            host.querySelector('.ss-phase').textContent = langOf(fr.msg);
        }
        function step() { if (idx < frames.length - 1) { idx++; paint(); return idx < frames.length - 1; } return false; }
        function reset() { idx = 0; paint(); }

        host.appendChild(K().buildStepControls(step, reset, 700));
        paint();
        host.querySelector('.ss-apply').onclick = () => {
            const arr = host.querySelector('.ss-arr').value.split(',').map((s) => parseInt(s.trim(), 10)).filter(Number.isFinite).sort((a, b) => a - b);
            const target = parseInt(host.querySelector('.ss-target').value, 10);
            if (arr.length && Number.isFinite(target)) { st.arr = arr; st.target = target; renderSearchInterpolation(); }
        };
        host.querySelector('.rand-btn').onclick = () => {
            const inp = window.RandomInput && RandomInput.randomInputFor('search-interpolation', K().getInputDifficulty());
            if (!inp) return;
            _interpState.arr = inp.arr;
            _interpState.target = inp.target;
            renderSearchInterpolation();
        };
    }

    global.VizRegistry.attach('search-interpolation', {
        render: renderSearchInterpolation,
        code: () => codeSearchInterpolation,
        layout: { host: 'dynamic' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
