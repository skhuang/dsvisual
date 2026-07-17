(function (global) {
    const K = () => global.VizKit; // resolved at call time (VizKit set at startup)

    // NOTE: loadExamples/saveExample/buildExamplesSelect are stateless helpers
    // (pure wrappers around the global ExamplesStore + localStorage, keyed by
    // methodId) also used by renderListEquivalence, which still lives in
    // js/app.js. Duplicated here privately rather than shared, per the
    // extraction recipe.
    function loadExamples(methodId) { try { return ExamplesStore.load(localStorage, methodId); } catch (e) { return []; } }
    function saveExample(methodId, text, defaultText) { try { ExamplesStore.save(localStorage, methodId, text, defaultText); } catch (e) { /* ignore */ } }
    function buildExamplesSelect(methodId, defaultText) {
        var lang = (window.I18N && I18N.getCurrentLanguage) ? I18N.getCurrentLanguage() : 'en';
        var escAttr = function (s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;'); };
        var escText = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); };
        var trunc = function (s) { s = String(s); return s.length > 24 ? s.slice(0, 24) + '…' : s; };
        var placeholder = lang === 'zh' ? '範例…' : 'Examples…';
        var defLabel = lang === 'zh' ? '預設' : 'Default';
        var h = '<select class="ex-select" data-method="' + escAttr(methodId) + '">';
        h += '<option value="">' + placeholder + '</option>';
        h += '<option value="' + escAttr(defaultText) + '">' + defLabel + '</option>';
        loadExamples(methodId).forEach(function (e) {
            if (e.text === defaultText) return;
            h += '<option value="' + escAttr(e.text) + '">' + escText(trunc(e.text)) + '</option>';
        });
        h += '</select>';
        return h;
    }

    let _mslState = null;
    function renderMatrixSparseList() {
        if (!_mslState) _mslState = { text: MatrixSparseListViz.DEFAULT, phase: 'build' };
        const st = _mslState;
        const host = K().acquireDynamicVizHost();
        host.style.width = '100%';
        const langOf = K().langOf;
        const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');

        const grid = MatrixSparseListViz.parse(st.text);
        const src = st.phase === 'transpose' ? MatrixSparseListViz.transposeGrid(grid) : grid;
        const { frames, built } = MatrixSparseListViz.buildFrames(src);

        host.innerHTML =
            '<div class="msl-controls">' +
              '<input type="text" class="msl-input" value="' + esc(st.text) + '">' +
              '<button type="button" class="msl-build">Build</button>' +
              buildExamplesSelect('matrix-sparse-list', MatrixSparseListViz.DEFAULT) +
              '<button type="button" class="rand-btn" title="Random">🎲</button>' +
              '<button type="button" class="msl-phase-btn">' + (st.phase === 'build' ? 'Show Transpose' : 'Show Original') + '</button>' +
              '<span class="sm-hint">rows separated by ; , entries by ,</span>' +
            '</div>' +
            '<div class="msl-label"></div>' +
            '<div class="msl-stage" style="position:relative;overflow:auto">' +
              '<svg class="msl-edges" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none"></svg>' +
              '<div class="msl-nodes"></div>' +
            '</div>';

        const nodesEl = host.querySelector('.msl-nodes');
        const edgesEl = host.querySelector('.msl-edges');
        const labelEl = host.querySelector('.msl-label');

        let idx = 0;

        const cellW = 64, cellH = 48, headW = 46, headH = 34, pad = 20;
        const colX = (c) => headW + c * cellW + cellW / 2;
        const rowY = (r) => headH + r * cellH + cellH / 2;
        const colHeaderY = headH / 2;
        const rowHeaderX = headW / 2;

        function paint() {
            const fr = frames[idx];
            const revealed = fr.nodes || [];
            const byId = {};
            const revealedIds = {};
            revealed.forEach((n) => { byId[n.id] = n; revealedIds[n.id] = true; });
            const curId = fr.nodeId;

            const stageW = headW + built.cols * cellW + pad;
            const stageH = headH + built.rows * cellH + pad;
            nodesEl.style.width = stageW + 'px';
            nodesEl.style.height = stageH + 'px';
            edgesEl.style.width = stageW + 'px';
            edgesEl.style.height = stageH + 'px';

            let html = '';
            for (let c = 0; c < built.cols; c++) {
                html += '<div class="msl-colhead" style="left:' + colX(c) + 'px;top:' + colHeaderY + 'px">C' + c + '</div>';
            }
            for (let r = 0; r < built.rows; r++) {
                html += '<div class="msl-rowhead" style="left:' + rowHeaderX + 'px;top:' + rowY(r) + 'px">R' + r + '</div>';
            }
            revealed.forEach((n) => {
                const active = (n.id === curId) ? ' msl-node-active' : '';
                html += '<div class="msl-node' + active + '" data-row="' + n.row + '" data-col="' + n.col + '" style="left:' + colX(n.col) + 'px;top:' + rowY(n.row) + 'px">' + n.val + '</div>';
            });
            nodesEl.innerHTML = html;

            let svg = '<defs>' +
                '<marker id="msl-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker>' +
                '<marker id="msl-arrow-faint" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" opacity="0.55"/></marker>' +
                '</defs>';

            function line(x1, y1, x2, y2, cls, marker) {
                svg += '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" class="' + cls + '" marker-end="url(#' + marker + ')"/>';
            }

            built.rowChains.forEach((chain, r) => {
                const ids = chain.filter((id) => revealedIds[id]);
                if (ids.length) {
                    const first = byId[ids[0]];
                    const activeCls = (first.id === curId) ? ' msl-link-active' : '';
                    line(rowHeaderX + 10, rowY(r), colX(first.col) - 14, rowY(first.row), 'msl-link msl-link-faint' + activeCls, 'msl-arrow-faint');
                }
                for (let k = 0; k < ids.length - 1; k++) {
                    const a = byId[ids[k]], b = byId[ids[k + 1]];
                    const activeCls = (b.id === curId) ? ' msl-link-active' : '';
                    line(colX(a.col) + 14, rowY(a.row), colX(b.col) - 14, rowY(b.row), 'msl-link' + activeCls, 'msl-arrow');
                }
                if (ids.length) {
                    const last = byId[ids[ids.length - 1]];
                    const midY = rowY(r) + cellH * 0.55;
                    svg += '<path d="M ' + colX(last.col) + ' ' + (rowY(last.row) + 12) + ' Q ' + ((colX(last.col) + rowHeaderX) / 2) + ' ' + midY + ' ' + rowHeaderX + ' ' + (rowY(r) + 10) + '" class="msl-link msl-link-faint msl-link-wrap" fill="none" marker-end="url(#msl-arrow-faint)"/>';
                }
            });

            built.colChains.forEach((chain, c) => {
                const ids = chain.filter((id) => revealedIds[id]);
                if (ids.length) {
                    const first = byId[ids[0]];
                    const activeCls = (first.id === curId) ? ' msl-link-active' : '';
                    line(colX(c), colHeaderY + 10, colX(first.col), rowY(first.row) - 14, 'msl-link msl-link-faint' + activeCls, 'msl-arrow-faint');
                }
                for (let k = 0; k < ids.length - 1; k++) {
                    const a = byId[ids[k]], b = byId[ids[k + 1]];
                    const activeCls = (b.id === curId) ? ' msl-link-active' : '';
                    line(colX(a.col), rowY(a.row) + 14, colX(b.col), rowY(b.row) - 14, 'msl-link' + activeCls, 'msl-arrow');
                }
                if (ids.length) {
                    const last = byId[ids[ids.length - 1]];
                    const midX = colX(c) + cellW * 0.55;
                    svg += '<path d="M ' + (colX(last.col) + 12) + ' ' + rowY(last.row) + ' Q ' + midX + ' ' + ((rowY(last.row) + colHeaderY) / 2) + ' ' + (colX(c) + 10) + ' ' + colHeaderY + '" class="msl-link msl-link-faint msl-link-wrap" fill="none" marker-end="url(#msl-arrow-faint)"/>';
                }
            });

            edgesEl.innerHTML = svg;
            labelEl.textContent = langOf({
                zh: st.phase === 'transpose' ? '轉置(列↔欄)' : '原始矩陣',
                en: st.phase === 'transpose' ? 'Transpose (rows↔cols)' : 'Original',
            });
        }

        function step() { if (idx < frames.length - 1) { idx++; paint(); return idx < frames.length - 1; } return false; }
        function reset() { idx = 0; paint(); }

        paint();
        host.appendChild(K().buildStepControls(step, reset, 700));

        host.querySelector('.msl-build').onclick = () => {
            try {
                st.text = host.querySelector('.msl-input').value;
                saveExample('matrix-sparse-list', st.text, MatrixSparseListViz.DEFAULT);
                renderMatrixSparseList();
            } catch (e) { /* ignore malformed input */ }
        };
        host.querySelector('.rand-btn').onclick = () => {
            const inp = window.RandomInput && RandomInput.randomInputFor('matrix-sparse-list', K().getInputDifficulty());
            if (inp) { st.text = inp.text; renderMatrixSparseList(); }
        };
        host.querySelector('.msl-phase-btn').onclick = () => {
            st.phase = st.phase === 'build' ? 'transpose' : 'build';
            renderMatrixSparseList();
        };
        const mslEx = host.querySelector('.ex-select');
        if (mslEx) mslEx.onchange = (ev) => { const v = ev.target.value; if (!v) return; st.text = v; renderMatrixSparseList(); };
    }

    global.VizRegistry.attach('matrix-sparse-list', {
        render: renderMatrixSparseList,
        // NOTE: codeMatrixSparseList is declared with `const` at the top level
        // of the classic (non-module) script js/code_db.js — a lexical global
        // shared across <script> tags but not attached to `window`. Must
        // reference the bare identifier, not `global.codeMatrixSparseList`
        // (always undefined).
        code: () => codeMatrixSparseList,
        layout: { host: 'dynamic' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
