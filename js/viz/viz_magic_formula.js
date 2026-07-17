(function (global) {
    const K = () => global.VizKit; // resolved at call time (VizKit set at startup)

    let _magicFormulaState = null;
    function renderMagicFormula() {
        const host = K().acquireDynamicVizHost();
        if (!_magicFormulaState) _magicFormulaState = { n: 5 };
        const st = _magicFormulaState;
        const langOf = K().langOf;
        const n = st.n;

        // "Blank by default" — nothing is queried yet, so the grid starts empty ("not stored").
        let story = {
            kind: 'idle',
            frames: [{ phase: 'idle', expr: '',
                msg: { en: 'Click a cell to query it by the O(1) formula, or "Fill all by formula".',
                       zh: '點擊一個格子以用 O(1) 公式查詢,或按下「用公式填滿」。' } }],
        };
        let idx = 0;

        host.innerHTML =
            '<div class="mf-wrap">' +
                '<div class="mf-controls">' +
                    '<label>n <select class="mf-order">' +
                        [3, 5, 7].map((v) => '<option value="' + v + '"' + (v === n ? ' selected' : '') + '>' + v + '</option>').join('') +
                    '</select></label>' +
                    '<button type="button" class="mf-apply">Apply</button>' +
                    '<button type="button" class="mf-fillall">Fill all by formula</button>' +
                '</div>' +
                '<div class="mf-grid" data-testid="mf-grid" style="--mf-n:' + n + '"></div>' +
                '<div class="mf-phase"></div>' +
                '<div class="mf-expr" data-testid="mf-expr"></div>' +
                '<div class="mf-readout" data-testid="mf-readout"></div>' +
                '<div class="mf-callout" data-testid="mf-callout">' +
                    '<strong>Sequential Siamese build:</strong> O(n&sup2;) time + O(n&sup2;) array (needs the whole square, visited cells). ' +
                    '<strong>This formula:</strong> O(1) time per cell, O(1) extra space &mdash; any cell, any order, instantly.' +
                '</div>' +
            '</div>';

        const order = host.querySelector('.mf-order');
        const grid = host.querySelector('[data-testid="mf-grid"]');

        function paint() {
            const fr = story.frames[idx];
            let gridHtml = '';
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < n; j++) {
                    let cls = 'mf-cell';
                    let content = '';
                    if (story.kind === 'query' && fr.i === i && fr.j === j) {
                        cls += ' current';
                        content = fr.phase === 'value' ? String(fr.value) : '?';
                    } else if (story.kind === 'fill' && fr.cells) {
                        const found = fr.cells.find((c) => c.i === i && c.j === j);
                        if (found) content = String(found.value);
                        if (fr.phase === 'cell' && fr.i === i && fr.j === j) cls += ' current';
                    }
                    if (content === '') cls += ' blank';
                    gridHtml += '<div class="' + cls + '" data-cell="' + i + '-' + j + '">' + content + '</div>';
                }
            }
            grid.innerHTML = gridHtml;

            host.querySelector('.mf-phase').textContent = langOf(fr.msg);
            host.querySelector('[data-testid="mf-expr"]').textContent = fr.expr || '';

            let readout;
            if (story.kind === 'query') {
                readout = 'a=' + (fr.a === null || fr.a === undefined ? '?' : fr.a) +
                          '  b=' + (fr.b === null || fr.b === undefined ? '?' : fr.b) +
                          '  value=' + (fr.value === null || fr.value === undefined ? '?' : fr.value);
            } else if (story.kind === 'fill') {
                readout = fr.phase === 'done'
                    ? 'filled ' + (n * n) + ' / ' + (n * n) + ' cells by formula'
                    : 'filled ' + (fr.cells ? fr.cells.length : 0) + ' / ' + (n * n) + ' cells';
            } else {
                readout = 'no cell queried yet — O(1) space, nothing stored';
            }
            host.querySelector('[data-testid="mf-readout"]').textContent = readout;

            grid.querySelectorAll('[data-cell]').forEach((cellEl) => {
                cellEl.onclick = () => {
                    const parts = cellEl.getAttribute('data-cell').split('-').map(Number);
                    startQuery(parts[0], parts[1]);
                };
            });
        }

        function startQuery(i, j) {
            const res = MagicFormulaViz.buildFrames(n, i, j);
            story = { kind: 'query', frames: res.frames };
            idx = 0;
            paint();
        }
        function startFillAll() {
            const res = MagicFormulaViz.fillAllFrames(n);
            story = { kind: 'fill', frames: res.frames };
            idx = 0;
            paint();
        }

        function step() {
            if (idx < story.frames.length - 1) {
                idx++;
                paint();
                return idx < story.frames.length - 1;
            }
            return false;
        }
        function reset() {
            idx = 0;
            paint();
        }

        host.querySelector('.mf-wrap').appendChild(K().buildStepControls(step, reset, 500));
        host.querySelector('.mf-apply').onclick = () => {
            const val = parseInt(order.value, 10);
            if ([3, 5, 7].indexOf(val) >= 0) { _magicFormulaState.n = val; renderMagicFormula(); }
        };
        host.querySelector('.mf-fillall').onclick = () => startFillAll();
        paint();
    }

    global.VizRegistry.attach('magic-formula', {
        render: renderMagicFormula,
        // NOTE: codeMagicFormula is declared with `const` at the top level of the
        // classic (non-module) script js/code_db.js — a lexical global shared
        // across <script> tags but not attached to `window`. Must reference the
        // bare identifier, not `global.codeMagicFormula` (always undefined).
        code: () => codeMagicFormula,
        layout: { host: 'dynamic' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
