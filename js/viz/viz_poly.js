(function (global) {
    const K = () => global.VizKit; // resolved at call time (VizKit set at startup)

    let _polyState = null;
    function renderPolyPadd() {
        const host = K().acquireDynamicVizHost();
        if (!_polyState) _polyState = { a: '3:2,2:1,1:0', b: '5:3,4:1' };
        const st = _polyState;
        const langOf = K().langOf;
        const A = PolyViz.parsePoly(st.a);
        const B = PolyViz.parsePoly(st.b);
        const res = PolyViz.buildPaddFrames(A, B);
        const frames = res.frames;
        let idx = 0;

        host.innerHTML =
            '<div class="pp-controls">' +
              'A <input type="text" class="pp-a" value="' + st.a + '"> ' +
              'B <input type="text" class="pp-b" value="' + st.b + '"> ' +
              '<button type="button" class="rand-btn" title="Random">🎲</button>' +
              '<button type="button" class="pp-apply">Apply</button>' +
              '<span class="sm-hint">terms as coef:exp, comma-separated</span>' +
            '</div>' +
            '<div class="pp-row"><span class="pp-label">A =</span> <span class="pp-a-terms"></span></div>' +
            '<div class="pp-row"><span class="pp-label">B =</span> <span class="pp-b-terms"></span></div>' +
            '<div class="pp-row"><span class="pp-label">A+B =</span> <span class="pp-result"></span></div>' +
            '<div class="pp-phase"></div>';

        function termCells(poly, ptr) {
            return poly.map((t, k) => '<span class="pp-term' + (k === ptr ? ' pp-cur' : '') + '">' + PolyViz.formatPoly([t]) + '</span>').join('');
        }

        function paint() {
            const fr = frames[idx];
            if (!host.querySelector('.pp-a-terms')) return;
            host.querySelector('.pp-a-terms').innerHTML = termCells(A, fr.i);
            host.querySelector('.pp-b-terms').innerHTML = termCells(B, fr.j);
            host.querySelector('.pp-result').innerHTML = (fr.result || []).map((t) => '<span class="pp-term out">' + PolyViz.formatPoly([t]) + '</span>').join('') || '<span class="pp-term out">0</span>';
            host.querySelector('.pp-phase').textContent = langOf(fr.msg);
        }
        function step() { if (idx < frames.length - 1) { idx++; paint(); return idx < frames.length - 1; } return false; }
        function reset() { idx = 0; paint(); }

        host.appendChild(K().buildStepControls(step, reset, 700));
        paint();
        host.querySelector('.pp-apply').onclick = () => {
            const a = host.querySelector('.pp-a').value.trim();
            const b = host.querySelector('.pp-b').value.trim();
            if (a && b) { st.a = a; st.b = b; renderPolyPadd(); }
        };
        host.querySelector('.rand-btn').onclick = () => {
            const inp = window.RandomInput && RandomInput.randomInputFor('poly-padd', K().getInputDifficulty());
            if (!inp) return;
            _polyState.a = inp.a;
            _polyState.b = inp.b;
            renderPolyPadd();
        };
    }

    global.VizRegistry.attach('poly-padd', {
        render: renderPolyPadd,
        code: () => codePolyPadd,
        layout: { host: 'dynamic' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
