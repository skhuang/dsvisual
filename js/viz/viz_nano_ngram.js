(function (global) {
    const K = () => global.VizKit; // resolved at call time (VizKit set at startup)

    let _ngramState = null;
    function renderNanoNgramNext() {
        const host = K().acquireDynamicVizHost();
        if (!_ngramState) _ngramState = { cand: 'the:5,a:3,cat:2', r: 0.5 };
        const st = _ngramState;
        const langOf = K().langOf;
        const cand = st.cand.split(',').map((p) => { const [t, c] = p.split(':'); return [t.trim(), parseInt(c, 10)]; })
                        .filter(([t, c]) => t && Number.isFinite(c));
        const frames = NanoNgramNextViz.buildFrames(cand, st.r).frames;
        let idx = 0;
        host.innerHTML =
            '<div class="ss-controls">' +
              'dist <input type="text" class="ng-cand" value="' + st.cand + '">' +
              'r <input type="number" step="0.05" min="0" max="0.999" class="ng-r" value="' + st.r + '" style="width:70px">' +
              '<button type="button" class="ng-apply">Apply</button>' +
            '</div>' +
            '<div class="ng-bars" data-testid="ng-bars"></div>' +
            '<div class="ng-cum" data-testid="ng-cum"></div>' +
            '<div class="ss-phase ng-phase"></div>';
        function paint() {
            const fr = frames[idx];
            host.querySelector('.ng-bars').innerHTML = fr.candidates.map(([t, c], i) =>
                '<span class="ng-bar' + (fr.picked === t ? ' picked' : '') + '" style="height:' + (10 + c * 12) + 'px">' + t + ':' + c + '</span>').join('');
            host.querySelector('.ng-cum').innerHTML = (fr.cumulative || []).map((v, i) => {
                let cls = 'ng-cell';
                if (fr.status === 'bsearch' && i >= fr.lo && i <= fr.hi) cls += ' inrange';
                if (i === fr.mid) cls += ' mid';
                return '<span class="' + cls + '">' + v + '</span>';
            }).join('') + (fr.draw ? '<span class="ng-draw">draw=' + fr.draw.toFixed(2) + '</span>' : '');
            host.querySelector('.ng-phase').textContent = langOf(fr.msg);
        }
        function step() { if (idx < frames.length - 1) { idx++; paint(); return idx < frames.length - 1; } return false; }
        function reset() { idx = 0; paint(); }
        host.appendChild(K().buildStepControls(step, reset, 700));
        paint();
        host.querySelector('.ng-apply').onclick = () => {
            const c = host.querySelector('.ng-cand').value;
            const r = parseFloat(host.querySelector('.ng-r').value);
            if (c && Number.isFinite(r) && r >= 0 && r < 1) { st.cand = c; st.r = r; renderNanoNgramNext(); }
        };
    }

    global.VizRegistry.attach('nano-ngram-next', {
        render: renderNanoNgramNext,
        // NOTE: codeNanoNgramNext is declared with `const` at the top level of the
        // classic (non-module) script js/code_db.js — a lexical global shared
        // across <script> tags but not attached to `window`. Must reference the
        // bare identifier, not `global.codeNanoNgramNext` (always undefined).
        code: () => codeNanoNgramNext,
        layout: { host: 'dynamic' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
