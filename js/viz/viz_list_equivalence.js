(function (global) {
    const K = () => global.VizKit; // resolved at call time (VizKit set at startup)

    // NOTE: loadExamples/saveExample/buildExamplesSelect are stateless helpers
    // (pure wrappers around the global ExamplesStore + localStorage, keyed by
    // methodId). Also duplicated into js/viz/viz_matrix_sparse_list.js; the
    // original still lives in js/app.js per the extraction recipe.
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

    let _equivState = null;
    function renderListEquivalence() {
        if (!_equivState) _equivState = { n: ListEquivalenceViz.DEFAULT.n, pairs: ListEquivalenceViz.DEFAULT.pairs.map((p) => p.slice()) };
        const host = K().acquireDynamicVizHost();
        host.style.width = '100%';
        const st = _equivState;
        const serEq = (s) => s.n + '|' + s.pairs.map((p) => p[0] + '=' + p[1]).join(',');
        const defSerEq = serEq({ n: ListEquivalenceViz.DEFAULT.n, pairs: ListEquivalenceViz.DEFAULT.pairs });
        const { frames } = ListEquivalenceViz.equivalenceFrames(st.n, st.pairs);
        const finalSeq = ListEquivalenceViz.buildAdjacency(st.n, st.pairs);

        host.innerHTML =
            '<div class="eq-controls">' +
              '<label>n <input type="number" class="eq-n" min="1" max="12" value="' + st.n + '"></label>' +
              '<input type="text" class="eq-pairs" value="' + st.pairs.map((p) => p[0] + '=' + p[1]).join(',') + '">' +
              '<button type="button" class="eq-build">Build</button>' +
              buildExamplesSelect('list-equivalence', defSerEq) +
              '<button type="button" class="rand-btn" title="Random">🎲</button>' +
            '</div>' +
            '<div class="eq-stage">' +
              '<div class="eq-adj"></div>' +
              '<div class="eq-find"></div>' +
            '</div>' +
            '<div class="eq-status"></div>';

        const adjEl = host.querySelector('.eq-adj');
        const findEl = host.querySelector('.eq-find');
        const statusEl = host.querySelector('.eq-status');

        let idx = 0;

        function chainHtml(chain, highlightSet) {
            if (!chain.length) return '<span class="eq-null">&empty;</span>';
            return chain.map((v) =>
                '<span class="eq-chip' + (highlightSet && highlightSet.has(v) ? ' eq-chip-hot' : '') + '">' + v + '</span>'
            ).join('<span class="eq-arrow">&rarr;</span>') + '<span class="eq-arrow">&rarr;</span><span class="eq-null">&empty;</span>';
        }

        function paintAdj(fr) {
            const seq = (fr.phase === 'build') ? fr.seq : finalSeq;
            const activeRows = (fr.phase === 'build') ? new Set(fr.pair) : new Set();
            const scanning = (fr.phase === 'find') ? fr.scanning : null;
            let html = '';
            for (let i = 0; i < st.n; i++) {
                const highlightSet = (scanning && scanning.from === i) ? new Set([scanning.to]) : null;
                html += '<div class="eq-adj-row' + (activeRows.has(i) ? ' eq-row-active' : '') + '">' +
                    '<span class="eq-adj-idx">' + i + '</span>' +
                    '<span class="eq-adj-arrow">&rarr;</span>' +
                    chainHtml(seq[i], highlightSet) +
                    '</div>';
            }
            adjEl.innerHTML = html;
        }

        function paintFind(fr) {
            let html = '';
            // out[] marks
            const out = fr.out || new Array(st.n).fill(false);
            const active = (fr.phase === 'find') ? fr.active : -1;
            html += '<div class="eq-out-title">Visited</div><div class="eq-out-row">';
            for (let k = 0; k < st.n; k++) {
                let cls = 'eq-out-chip';
                if (out[k]) cls += ' eq-out-done';
                if (k === active) cls += ' eq-out-active';
                html += '<span class="' + cls + '">' + k + '</span>';
            }
            html += '</div>';

            // stack (top = last element, shown at top of the vertical stack)
            const stack = fr.stack || [];
            html += '<div class="eq-stack-title">Stack</div><div class="eq-stack">';
            if (stack.length) {
                for (let s = stack.length - 1; s >= 0; s--) {
                    html += '<div class="eq-stack-item' + (s === stack.length - 1 ? ' eq-stack-top' : '') + '">' + stack[s] + '</div>';
                }
            } else {
                html += '<div class="eq-stack-empty">(empty)</div>';
            }
            html += '</div>';

            // current class being assembled
            if (fr.phase === 'find' && fr.current && fr.current.length) {
                html += '<div class="eq-current-title">Current class</div><div class="eq-class-box eq-class-current">' +
                    fr.current.map((v) => '<span class="eq-chip">' + v + '</span>').join('') + '</div>';
            }

            // completed classes
            const classes = fr.classes || [];
            if (classes.length) {
                html += '<div class="eq-classes-title">Classes</div><div class="eq-classes">';
                classes.forEach((c, ci) => {
                    html += '<div class="eq-class-box eq-class-' + (ci % 6) + '">' + c.map((v) => '<span class="eq-chip">' + v + '</span>').join('') + '</div>';
                });
                html += '</div>';
            }

            if (fr.phase === 'find' && fr.scanning) {
                html += '<div class="eq-scan">scanning ' + fr.scanning.from + ' &rarr; ' + fr.scanning.to + '</div>';
            }

            findEl.innerHTML = html;
        }

        function paint() {
            const fr = frames[idx];
            paintAdj(fr);
            paintFind(fr);
            let status = 'Phase: ' + fr.phase;
            if (fr.phase === 'find') status += ' (' + fr.event + ')';
            if (fr.phase === 'done') status += ' — ' + fr.classes.length + ' class' + (fr.classes.length === 1 ? '' : 'es');
            statusEl.textContent = status;
        }

        function step() { if (idx < frames.length - 1) { idx++; paint(); return true; } return false; }
        function reset() { idx = 0; paint(); }

        paint();
        host.appendChild(K().buildStepControls(step, reset, 700));

        host.querySelector('.eq-build').onclick = () => {
            try {
                const nClamped = Math.min(12, Math.max(1, parseInt(host.querySelector('.eq-n').value, 10) || 1));
                const parsed = ListEquivalenceViz.parseInput(String(nClamped), host.querySelector('.eq-pairs').value);
                parsed.pairs = parsed.pairs.slice(0, 20);
                _equivState = parsed;
                saveExample('list-equivalence', serEq(_equivState), defSerEq);
                renderListEquivalence();
            } catch (e) { /* ignore malformed input */ }
        };
        host.querySelector('.rand-btn').onclick = () => {
            const inp = window.RandomInput && RandomInput.randomInputFor('list-equivalence', K().getInputDifficulty());
            if (inp) { _equivState = { n: inp.n, pairs: inp.pairs }; renderListEquivalence(); }
        };
        const eqEx = host.querySelector('.ex-select');
        if (eqEx) eqEx.onchange = (ev) => {
            const v = ev.target.value; if (!v) return;
            const bar = v.indexOf('|');
            const nStr = v.slice(0, bar), pairsStr = v.slice(bar + 1);
            const nClamped = Math.min(12, Math.max(1, parseInt(nStr, 10) || 1));
            const parsed = ListEquivalenceViz.parseInput(String(nClamped), pairsStr);
            parsed.pairs = parsed.pairs.slice(0, 20);
            _equivState = parsed;
            renderListEquivalence();
        };
    }

    global.VizRegistry.attach('list-equivalence', {
        render: renderListEquivalence,
        // NOTE: codeListEquivalence is declared with `const` at the top level
        // of the classic (non-module) script js/code_db.js — a lexical global
        // shared across <script> tags but not attached to `window`. Must
        // reference the bare identifier, not `global.codeListEquivalence`
        // (always undefined).
        code: () => codeListEquivalence,
        layout: { host: 'dynamic' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
