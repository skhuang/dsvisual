(function (global) {
    const K = () => global.VizKit; // resolved at call time (VizKit set at startup)

    let _sparseState = null;
    const SPARSE_EXAMPLES_KEY = 'dsvisual:sparse:examples';
    const SPARSE_DEFAULT_TEXT = '0,0,3,0;5,0,0,0;0,2,0,4';
    function loadSparseExamples() {
        try {
            const raw = localStorage.getItem(SPARSE_EXAMPLES_KEY);
            const arr = raw ? JSON.parse(raw) : [];
            return Array.isArray(arr) ? arr.filter((e) => e && typeof e.text === 'string' && SparseViz.parseMatrix(e.text).ok) : [];
        } catch (e) { return []; }
    }
    function saveSparseExample(text) {
        try {
            if (text === SPARSE_DEFAULT_TEXT) return;
            let arr = loadSparseExamples().filter((e) => e.text !== text);
            arr.unshift({ text: text });
            arr = arr.slice(0, 8);
            localStorage.setItem(SPARSE_EXAMPLES_KEY, JSON.stringify(arr));
        } catch (e) { /* ignore */ }
    }
    function renderMatrixSparse() {
        const host = K().acquireDynamicVizHost();
        if (!_sparseState) _sparseState = { text: SPARSE_DEFAULT_TEXT };
        const st = _sparseState;
        const langOf = K().langOf;
        const parsed = SparseViz.parseMatrix(st.text);
        const matrix = parsed.matrix;
        const rows = parsed.rows, cols = parsed.cols;
        const res = SparseViz.buildFastTransposeFrames(matrix);
        const frames = res.frames;
        let idx = 0;

        host.innerHTML =
            '<div class="sm-controls"><input type="text" class="sm-input" value="' + st.text + '">' +
            (function () {
                const trunc = (s) => s.length > 24 ? s.slice(0, 24) + '…' : s;
                const esc = (s) => s.replace(/"/g, '&quot;');
                let h = '<select class="sm-examples"><option value="">' + langOf({ zh: '範例…', en: 'Examples…' }) + '</option>';
                h += '<option value="' + SPARSE_DEFAULT_TEXT + '">' + langOf({ zh: '預設', en: 'Default' }) + '</option>';
                loadSparseExamples().forEach((e) => { h += '<option value="' + esc(e.text) + '">' + trunc(e.text) + '</option>'; });
                return h + '</select>';
            })() +
            '<button type="button" class="rand-btn" title="Random">🎲</button><button type="button" class="sm-apply">Apply</button>' +
            '<span class="sm-hint">rows separated by ; , entries by ,</span></div>' +
            '<div class="sm-error" style="display:none"></div>' +
            '<div class="sm-cols"><div class="sm-dense"></div><div class="sm-triples"></div></div>' +
            '<div class="sm-arrays"></div>' +
            '<div class="sm-phase"></div>';

        function gridHtml(mat, title) {
            let h = '<div class="sm-grid-title">' + title + '</div><table class="sm-grid">';
            for (let r = 0; r < mat.length; r++) { h += '<tr>'; for (let c = 0; c < mat[r].length; c++) { const v = mat[r][c]; h += '<td class="' + (v !== 0 ? 'nz' : 'z') + '">' + v + '</td>'; } h += '</tr>'; }
            return h + '</table>';
        }
        function transposedSoFar(placed) {
            const T = [];
            for (let r = 0; r < cols; r++) T.push(new Array(rows).fill(0));
            placed.forEach((t) => { if (t) T[t.r][t.c] = t.v; });
            return T;
        }
        function transposedTriplesHtml(placed, dst) {
            const n = res.triples.length;
            let idxRow = '', rRow = '', cRow = '', vRow = '';
            for (let i = 0; i < n; i++) {
                const t = placed[i];
                const cur = i === dst ? ' class="sm-cur"' : '';
                idxRow += '<td class="sm-tvec-idx"' + (i === dst ? ' style="font-weight:700"' : '') + '>' + i + '</td>';
                rRow += '<td' + cur + '>' + (t ? t.r : '·') + '</td>';
                cRow += '<td' + cur + '>' + (t ? t.c : '·') + '</td>';
                vRow += '<td' + cur + '>' + (t ? t.v : '·') + '</td>';
            }
            return '<div><div class="sm-grid-title">' + langOf({ zh: '轉置三元組 b[]', en: 'Transposed triples b[]' }) + '</div>' +
                '<table class="sm-tvec">' +
                '<tr><th>idx</th>' + idxRow + '</tr>' +
                '<tr><th>r</th>' + rRow + '</tr>' +
                '<tr><th>c</th>' + cRow + '</tr>' +
                '<tr><th>v</th>' + vRow + '</tr></table></div>';
        }

        function paint() {
            const fr = frames[idx];
            if (!host.querySelector('.sm-dense')) return;
            host.querySelector('.sm-dense').innerHTML = gridHtml(matrix, langOf({ zh: '原矩陣', en: 'Original' }));
            let tr = '<div class="sm-grid-title">' + langOf({ zh: '三元組 (列,欄,值)', en: 'Triples (r,c,v)' }) + '</div><table class="sm-triple-tbl"><tr><th>r</th><th>c</th><th>v</th></tr>';
            res.triples.forEach((t, s) => { tr += '<tr class="' + (fr.phase === 'place' && fr.scan === s ? 'sm-cur' : '') + '"><td>' + t.r + '</td><td>' + t.c + '</td><td>' + t.v + '</td></tr>'; });
            tr += '</table>';
            host.querySelector('.sm-triples').innerHTML = tr;
            let a = '';
            if (fr.rowSize && fr.rowSize.length) a += '<div class="sm-arr"><span class="sm-arr-label">rowSize</span> ' + fr.rowSize.map((v) => '<span class="sm-acell">' + v + '</span>').join('') + '</div>';
            if (fr.startPos && fr.startPos.length) a += '<div class="sm-arr"><span class="sm-arr-label">startPos</span> ' + fr.startPos.map((v) => '<span class="sm-acell">' + v + '</span>').join('') + '</div>';
            a += '<div class="sm-tout">' +
                '<div>' + gridHtml(transposedSoFar(fr.placed || []), langOf({ zh: '轉置結果', en: 'Transposed' })) + '</div>' +
                transposedTriplesHtml(fr.placed || [], (fr.phase === 'place' ? fr.dst : -1)) +
                '</div>';
            host.querySelector('.sm-arrays').innerHTML = a;
            host.querySelector('.sm-phase').textContent = langOf(fr.msg);
        }
        function step() { if (idx < frames.length - 1) { idx++; paint(); return idx < frames.length - 1; } return false; }
        function reset() { idx = 0; paint(); }

        host.appendChild(K().buildStepControls(step, reset, 700));
        paint();
        host.querySelector('.sm-apply').onclick = () => {
            const v = host.querySelector('.sm-input').value.trim();
            const p = SparseViz.parseMatrix(v);
            const errEl = host.querySelector('.sm-error');
            if (!p.ok) { errEl.textContent = langOf(p.error); errEl.style.display = ''; return; }
            errEl.textContent = ''; errEl.style.display = 'none';
            st.text = v; saveSparseExample(v); renderMatrixSparse();
        };
        host.querySelector('.rand-btn').onclick = () => {
            const inp = window.RandomInput && RandomInput.randomInputFor('matrix-sparse', K().getInputDifficulty());
            if (!inp) return;
            _sparseState.text = inp.text;
            renderMatrixSparse();
        };
        host.querySelector('.sm-examples').onchange = (ev) => {
            const v = ev.target.value;
            if (!v) return;
            host.querySelector('.sm-input').value = v;
            const errEl = host.querySelector('.sm-error');
            errEl.textContent = ''; errEl.style.display = 'none';
            st.text = v; renderMatrixSparse();
        };
    }

    global.VizRegistry.attach('matrix-sparse', {
        render: renderMatrixSparse,
        // NOTE: codeMatrixSparse is declared with `const` at the top level of the
        // classic (non-module) script js/code_db.js. Top-level const/let in a
        // classic script creates a lexical global binding shared across all
        // <script> tags on the page, but it is NOT attached to `window` (unlike
        // `var`/function declarations). So this must reference the bare
        // identifier, not `global.codeMatrixSparse` (which is always undefined).
        code: () => codeMatrixSparse,
        layout: { host: 'dynamic' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
