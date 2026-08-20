(function (global) {
    const K = () => global.VizKit; // resolved at call time (VizKit set at startup)

    // NOTE: showStatus is a stateless shared helper (writes to the #status-message
    // element) also used by many renderers still in js/app.js. Duplicated here
    // privately rather than shared, per the extraction recipe.
    function showStatus(msg, color) {
        const el = document.getElementById('status-message');
        if (el) { el.textContent = msg; el.style.color = color; }
    }

    let _cmsState = null;

    // Fresh random short lowercase word for [data-cms-val] — mirrors linear.js's
    // randStdValue()/tree.js's randKey() idiom, adapted for a text field.
    function randWord() {
        const alpha = 'abcdefghijklmnopqrstuvwxyz';
        const len = 3 + Math.floor(Math.random() * 3); // 3..5 chars
        let s = '';
        for (let i = 0; i < len; i++) s += alpha[Math.floor(Math.random() * alpha.length)];
        return s;
    }

    function renderCountMinSketch() {
        const host = K().acquireDynamicVizHost();
        const DEPTH = 3, WIDTH = 8;
        if (!_cmsState) {
            _cmsState = {
                table: Array.from({ length: DEPTH }, () => new Array(WIDTH).fill(0)),
                actual: {},
                inputVal: null, // persisted insert-field value across re-renders (see below)
            };
        }
        const cms = _cmsState;
        // Persist the insert field's value across re-renders (this function is re-invoked
        // wholesale on navigate-away/back and by the 🎲 handler) — mirrors viz_bloom.js's
        // _bloomState.inputVal pattern so a re-render never clobbers what the user typed.
        // Falsy (unset) only at genuine first mount -> fresh random default.
        if (!cms.inputVal) cms.inputVal = randWord();
        function hash(row, s) {
            let h = ((row + 1) * 2654435761) >>> 0;
            for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
            return h % WIDTH;
        }

        const wrap = document.createElement('div');
        wrap.className = 'cms-wrap';
        let html = '<div class="cms-grid">';
        for (let r = 0; r < DEPTH; r++) {
            html += '<div class="cms-rowlabel">h' + r + '</div>';
            for (let c = 0; c < WIDTH; c++) {
                html += '<span class="cms-cell" data-row="' + r + '" data-col="' + c + '">' +
                        cms.table[r][c] + '</span>';
            }
        }
        html += '</div>';
        html += '<div class="cms-readout" data-testid="cms-readout">&nbsp;</div>';
        html += '<div class="cms-controls" role="group">' +
                    '<input type="text" value="' + cms.inputVal + '" data-cms-val>' +
                    '<button type="button" class="rand-btn" title="' + K().t('btn.random-input') + '">🎲</button>' +
                    '<button type="button" data-action="cms-add">Add</button>' +
                    '<button type="button" data-action="cms-estimate">Estimate</button>' +
                '</div>';
        wrap.innerHTML = html;
        host.appendChild(wrap);

        const valInput = wrap.querySelector('[data-cms-val]');
        const readoutEl = wrap.querySelector('.cms-readout');
        function highlight(cells) {
            wrap.querySelectorAll('.cms-cell').forEach((c) => c.classList.remove('cms-hit'));
            for (const rc of cells) {
                const el = wrap.querySelector('.cms-cell[data-row="' + rc[0] + '"][data-col="' + rc[1] + '"]');
                if (el) el.classList.add('cms-hit');
            }
        }
        valInput.addEventListener('input', () => { cms.inputVal = valInput.value; });
        wrap.querySelector('.rand-btn').onclick = () => {
            const difficulty = (global.VizKit && global.VizKit.getInputDifficulty) ? global.VizKit.getInputDifficulty() : 'normal';
            const r = global.RandomInput && global.RandomInput.randomInputFor('count-min-sketch', difficulty);
            if (!r || !Array.isArray(r.words) || !r.words.length) return;
            _cmsState = { table: Array.from({ length: DEPTH }, () => new Array(WIDTH).fill(0)), actual: {}, inputVal: cms.inputVal };
            const table = _cmsState.table, actual = _cmsState.actual;
            for (const key of r.words) {
                for (let row = 0; row < DEPTH; row++) table[row][hash(row, key)]++;
                actual[key] = (actual[key] || 0) + 1;
            }
            renderCountMinSketch();
            showStatus('Randomized ' + r.words.length + ' add(s)', '#34d399');
        };
        wrap.querySelector('[data-action="cms-add"]').onclick = () => {
            const key = valInput.value.trim();
            if (!key) { showStatus('Enter a word', '#f87171'); return; }
            const cells = [];
            for (let r = 0; r < DEPTH; r++) {
                const c = hash(r, key);
                cms.table[r][c]++;
                cells.push([r, c]);
                const el = wrap.querySelector('.cms-cell[data-row="' + r + '"][data-col="' + c + '"]');
                if (el) el.textContent = cms.table[r][c];
            }
            cms.actual[key] = (cms.actual[key] || 0) + 1;
            highlight(cells);
            showStatus('Added "' + key + '" (+1 per row)', '#34d399');
            // "cms-add" updates cells in place rather than re-rendering the whole widget, so
            // refill the field explicitly with a fresh random word after a successful add.
            cms.inputVal = randWord();
            valInput.value = cms.inputVal;
        };
        wrap.querySelector('[data-action="cms-estimate"]').onclick = () => {
            const key = valInput.value.trim();
            if (!key) { showStatus('Enter a word', '#f87171'); return; }
            const cells = [], vals = [];
            for (let r = 0; r < DEPTH; r++) {
                const c = hash(r, key);
                cells.push([r, c]);
                vals.push(cms.table[r][c]);
            }
            highlight(cells);
            const est = Math.min.apply(null, vals);
            const actual = cms.actual[key] || 0;
            readoutEl.textContent = 'estimate("' + key + '") = min(' + vals.join(', ') + ') = ' + est +
                                    '  |  actual = ' + actual;
            showStatus('Estimate ' + est + ' (actual ' + actual + ')', '#f59e0b');
        };
    }

    global.VizRegistry.attach('count-min-sketch', {
        render: renderCountMinSketch,
        code: () => codeCountMinSketch,
        layout: { host: 'dynamic' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
