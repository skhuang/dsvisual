(function (global) {
    const K = () => global.VizKit; // resolved at call time (VizKit set at startup)

    // ML_PALETTE was only ever used by renderMagicLatin, so it moves here
    // wholesale (not duplicated) rather than staying behind in app.js.
    const ML_PALETTE = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899', '#78716c'];

    let _magicLatinState = null;
    function renderMagicLatin() {
        const host = K().acquireDynamicVizHost();
        if (!_magicLatinState) _magicLatinState = { n: 5 };
        const st = _magicLatinState;
        const langOf = K().langOf;
        const n = st.n;
        const res = MagicLatinViz.buildFrames(n);
        const frames = res.frames;
        const square = res.square;
        const a = res.a;
        const b = res.b;
        const magicSum = res.magicSum;
        let idx = 0;

        host.innerHTML =
            '<div class="ml-wrap">' +
                '<div class="ss-controls">' +
                    '<label>n <select class="ml-order">' +
                        [3, 5, 7, 9].map((v) => '<option value="' + v + '"' + (v === n ? ' selected' : '') + '>' + v + '</option>').join('') +
                    '</select></label>' +
                    '<button type="button" class="ml-apply">Apply</button>' +
                    '<span class="ml-sum">Magic sum = ' + magicSum + '</span>' +
                '</div>' +
                '<div class="ml-grids">' +
                    '<div class="ml-grid-col"><h4>square (v)</h4><div class="ml-grid" data-testid="ml-grid-square" style="--ml-n:' + n + '"></div></div>' +
                    '<div class="ml-grid-col"><h4>a = &lfloor;(v&minus;1)/n&rfloor;</h4><div class="ml-grid" data-testid="ml-grid-a" style="--ml-n:' + n + '"></div></div>' +
                    '<div class="ml-grid-col"><h4>b = (v&minus;1) mod n</h4><div class="ml-grid" data-testid="ml-grid-b" style="--ml-n:' + n + '"></div></div>' +
                '</div>' +
                '<div class="ss-phase ml-phase"></div>' +
                '<div class="ml-readout" data-testid="ml-readout"></div>' +
            '</div>';

        const order = host.querySelector('.ml-order');

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
            const revealed = fr.phase === 'split' ? fr.count : n * n;
            const squareGrid = host.querySelector('[data-testid="ml-grid-square"]');
            const aGrid = host.querySelector('[data-testid="ml-grid-a"]');
            const bGrid = host.querySelector('[data-testid="ml-grid-b"]');
            if (!squareGrid || !aGrid || !bGrid) return;

            let sqHtml = '', aHtml = '', bHtml = '';
            for (let r = 0; r < n; r++) {
                for (let c = 0; c < n; c++) {
                    const cellIdx = r * n + c;
                    const isRevealed = cellIdx < revealed;
                    const isCurrent = fr.phase === 'split' && fr.r === r && fr.c === c;
                    const isHi = highlighted(fr, r, c);
                    let cls = 'ml-cell';
                    if (isCurrent) cls += ' current';
                    if (isHi) cls += ' highlight';
                    sqHtml += '<div class="' + cls + '" data-cell="' + r + '-' + c + '">' + square[r][c] + '</div>';
                    if (isRevealed) {
                        const av = a[r][c], bv = b[r][c];
                        aHtml += '<div class="' + cls + ' ml-digit" data-cell="' + r + '-' + c + '" style="background:' + ML_PALETTE[av % ML_PALETTE.length] + '">' + av + '</div>';
                        bHtml += '<div class="' + cls + ' ml-digit" data-cell="' + r + '-' + c + '" style="background:' + ML_PALETTE[bv % ML_PALETTE.length] + '">' + bv + '</div>';
                    } else {
                        aHtml += '<div class="' + cls + ' ml-hidden" data-cell="' + r + '-' + c + '">?</div>';
                        bHtml += '<div class="' + cls + ' ml-hidden" data-cell="' + r + '-' + c + '">?</div>';
                    }
                }
            }
            squareGrid.innerHTML = sqHtml;
            aGrid.innerHTML = aHtml;
            bGrid.innerHTML = bHtml;

            host.querySelector('.ml-phase').textContent = langOf(fr.msg);

            let readout;
            if (fr.phase === 'verify') {
                readout = 'aSum=' + fr.aSum + ' bSum=' + fr.bSum + ' → line sum=' + fr.lineSum + ' vs magic sum=' + magicSum +
                    (fr.lineSum === magicSum ? ' ✓' : '');
                if (fr.kind === 'diag' || fr.kind === 'anti') {
                    readout = 'line sum=' + fr.lineSum + ' vs magic sum=' + magicSum + (fr.lineSum === magicSum ? ' ✓' : '');
                }
            } else if (fr.phase === 'split') {
                readout = fr.count ? 'revealed ' + fr.count + ' / ' + (n * n) + ' cells' : 'ready to reveal ' + (n * n) + ' cells';
            } else {
                readout = 'magic sum = ' + magicSum;
            }
            host.querySelector('.ml-readout').textContent = readout;
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

        host.querySelector('.ml-wrap').appendChild(K().buildStepControls(step, reset, 500));
        host.querySelector('.ml-apply').onclick = () => {
            const val = parseInt(order.value, 10);
            if ([3, 5, 7, 9].indexOf(val) >= 0) { _magicLatinState.n = val; renderMagicLatin(); }
        };
        paint();
    }

    global.VizRegistry.attach('magic-latin', {
        render: renderMagicLatin,
        // NOTE: codeMagicLatin is declared with `const` at the top level of the
        // classic (non-module) script js/code_db.js — a lexical global shared
        // across <script> tags but not attached to `window`. Must reference the
        // bare identifier, not `global.codeMagicLatin` (always undefined).
        code: () => codeMagicLatin,
        layout: { host: 'dynamic' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
