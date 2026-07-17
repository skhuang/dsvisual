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

    function renderCountMinSketch() {
        const host = K().acquireDynamicVizHost();
        const DEPTH = 3, WIDTH = 8;
        if (!_cmsState) {
            _cmsState = {
                table: Array.from({ length: DEPTH }, () => new Array(WIDTH).fill(0)),
                actual: {},
            };
        }
        const cms = _cmsState;
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
                    '<input type="text" value="apple" data-cms-val>' +
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
