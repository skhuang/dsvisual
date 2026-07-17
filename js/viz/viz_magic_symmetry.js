(function (global) {
    const K = () => global.VizKit; // resolved at call time (VizKit set at startup)

    let _magicSymmetryState = null;
    function renderMagicSymmetry() {
        const host = K().acquireDynamicVizHost();
        if (!_magicSymmetryState) _magicSymmetryState = { n: 5, op: 'r90', seen: new Set() };
        const st = _magicSymmetryState;
        const langOf = K().langOf;
        const n = st.n;
        const op = st.op;
        const OPS = MagicSymmetryViz.OPS;
        const res = MagicSymmetryViz.buildFrames(n, op);
        const frames = res.frames;
        const original = res.original;
        const magicSum = res.magicSum;
        const orbitInfo = MagicSymmetryViz.orbit(n);
        let idx = 0;

        host.innerHTML =
            '<div class="sym-wrap">' +
                '<div class="ss-controls">' +
                    '<label>n <select class="sym-order">' +
                        [3, 5, 7].map((v) => '<option value="' + v + '"' + (v === n ? ' selected' : '') + '>' + v + '</option>').join('') +
                    '</select></label>' +
                    '<button type="button" class="sym-apply">Apply</button>' +
                    '<span class="sym-sum">Magic sum = ' + magicSum + '</span>' +
                    '<span class="sym-orbit" data-testid="sym-orbit">orbit: ' + st.seen.size + ' / ' + orbitInfo.size + ' distinct</span>' +
                '</div>' +
                '<div class="sym-ops" data-testid="sym-ops">' +
                    OPS.map((o) => '<button type="button" class="sym-op-btn' + (o === op ? ' active' : '') + '" data-op="' + o + '">' + o + '</button>').join('') +
                '</div>' +
                '<div class="sym-grids">' +
                    '<div class="sym-grid-col"><h4>original</h4><div class="sym-grid" data-testid="sym-grid-original" style="--sym-n:' + n + '"></div></div>' +
                    '<div class="sym-grid-col"><h4>result (' + op + ')</h4><div class="sym-grid" data-testid="sym-grid" style="--sym-n:' + n + '"></div></div>' +
                '</div>' +
                '<div class="ss-phase sym-phase"></div>' +
                '<div class="sym-readout" data-testid="sym-readout"></div>' +
            '</div>';

        const order = host.querySelector('.sym-order');

        function highlighted(fr, r, c) {
            if (fr.phase !== 'verify') return false;
            if (fr.kind === 'row') return fr.index === r;
            if (fr.kind === 'col') return fr.index === c;
            if (fr.kind === 'diag') return r === c;
            if (fr.kind === 'anti') return r + c === n - 1;
            return false;
        }

        function paint() {
            const fr = frames[idx];
            const originalGrid = host.querySelector('[data-testid="sym-grid-original"]');
            const resultGrid = host.querySelector('[data-testid="sym-grid"]');
            if (!originalGrid || !resultGrid) return;

            const showResult = fr.phase !== 'show';
            let oHtml = '', rHtml = '';
            for (let r = 0; r < n; r++) {
                for (let c = 0; c < n; c++) {
                    oHtml += '<div class="sym-cell" data-cell="' + r + '-' + c + '">' + original[r][c] + '</div>';
                    if (showResult) {
                        const isHi = highlighted(fr, r, c);
                        let cls = 'sym-cell';
                        if (isHi) cls += ' highlight';
                        if (fr.phase === 'apply') cls += ' moving';
                        rHtml += '<div class="' + cls + '" data-cell="' + r + '-' + c + '">' + fr.transformed[r][c] + '</div>';
                    } else {
                        rHtml += '<div class="sym-cell sym-hidden" data-cell="' + r + '-' + c + '">?</div>';
                    }
                }
            }
            originalGrid.innerHTML = oHtml;
            resultGrid.innerHTML = rHtml;

            host.querySelector('.sym-phase').textContent = langOf(fr.msg);

            let readout;
            if (fr.phase === 'verify') {
                readout = 'line sum=' + fr.lineSum + ' vs magic sum=' + magicSum + (fr.lineSum === magicSum ? ' ✓' : '');
            } else if (fr.phase === 'apply') {
                readout = 'remapped ' + fr.mapping.length + ' cells (' + op + ')';
            } else if (fr.phase === 'done') {
                readout = (fr.stillMagic ? 'still magic' : 'NOT magic') + ' (all lines = ' + magicSum + ')';
                const key = fr.transformed.map((row) => row.join(',')).join(';');
                if (!st.seen.has(key)) {
                    st.seen.add(key);
                    const orbitEl = host.querySelector('[data-testid="sym-orbit"]');
                    if (orbitEl) orbitEl.textContent = 'orbit: ' + st.seen.size + ' / ' + orbitInfo.size + ' distinct';
                }
            } else {
                readout = 'operation: ' + op;
            }
            host.querySelector('[data-testid="sym-readout"]').textContent = readout;
        }

        function step() {
            if (idx < frames.length - 1) {
                idx++;
                paint();
                return idx < frames.length - 1;
            }
            return false;
        }
        function reset() {
            idx = 0;
            paint();
        }

        host.querySelector('.sym-wrap').appendChild(K().buildStepControls(step, reset, 500));
        host.querySelector('.sym-apply').onclick = () => {
            const val = parseInt(order.value, 10);
            if ([3, 5, 7].indexOf(val) >= 0) { _magicSymmetryState.n = val; _magicSymmetryState.seen = new Set(); renderMagicSymmetry(); }
        };
        host.querySelectorAll('.sym-op-btn').forEach((btn) => {
            btn.onclick = () => {
                _magicSymmetryState.op = btn.getAttribute('data-op');
                renderMagicSymmetry();
            };
        });
        paint();
    }

    global.VizRegistry.attach('magic-symmetry', {
        render: renderMagicSymmetry,
        // NOTE: codeMagicSymmetry is declared with `const` at the top level of the
        // classic (non-module) script js/code_db.js — a lexical global shared
        // across <script> tags but not attached to `window`. Must reference the
        // bare identifier, not `global.codeMagicSymmetry` (always undefined).
        code: () => codeMagicSymmetry,
        layout: { host: 'dynamic' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
