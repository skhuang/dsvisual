(function (global) {
    const K = () => global.VizKit; // resolved at call time (VizKit set at startup)

    let _invState = null;
    function renderFileInverted() {
        if (!_invState) _invState = { docs: FileInvertedViz.SAMPLE_DOCS.slice(), query: 'cat' };
        const host = K().acquireDynamicVizHost();
        const { frames, index } = FileInvertedViz.buildFrames(_invState.docs);
        const q = FileInvertedViz.queryFrames(index, _invState.query);
        const qTerm = String(_invState.query).toLowerCase();
        const qPostings = q.postings;
        const qSet = {};
        qPostings.forEach((d) => { qSet[d] = true; });
        let idx = 0;

        host.innerHTML =
            '<div class="inv-controls">' +
              '<input type="text" class="inv-query" value="' + _invState.query + '">' +
              '<button type="button" class="inv-query-btn">Query</button>' +
              '<span class="inv-query-line"></span>' +
            '</div>' +
            '<div class="inv-stage">' +
              '<div class="inv-docs"></div>' +
              '<div class="inv-index"></div>' +
            '</div>';

        const docsPane = host.querySelector('.inv-docs');
        const idxPane = host.querySelector('.inv-index');
        const qLine = host.querySelector('.inv-query-line');

        function paint() {
            const fr = frames[idx];
            const active = fr.active;

            docsPane.innerHTML = '<div class="inv-pane-title">Documents</div>';
            _invState.docs.forEach((doc, di) => {
                const row = document.createElement('div');
                row.className = 'inv-doc' +
                    (active && active.doc === di ? ' inv-doc-active' : '') +
                    (qSet[di] ? ' inv-doc-hit' : '');
                row.textContent = di + ': ' + doc;
                docsPane.appendChild(row);
            });

            idxPane.innerHTML = '<div class="inv-pane-title">Inverted Index (term &rarr; docIds)</div>';
            const terms = Object.keys(fr.index).sort();
            terms.forEach((term) => {
                const row = document.createElement('div');
                row.className = 'inv-term-row' +
                    (active && active.term === term ? ' inv-term-active' : '') +
                    (term === qTerm ? ' inv-term-query' : '');
                const tEl = document.createElement('span');
                tEl.className = 'inv-term';
                tEl.textContent = term;
                const pEl = document.createElement('span');
                pEl.className = 'inv-postings';
                pEl.textContent = '[' + fr.index[term].join(', ') + ']';
                row.appendChild(tEl);
                row.appendChild(pEl);
                idxPane.appendChild(row);
            });

            qLine.textContent = 'query: ' + qTerm + ' → [' + qPostings.join(', ') + ']';
        }
        function step() { if (idx < frames.length - 1) { idx++; paint(); return idx < frames.length - 1; } return false; }
        function reset() { idx = 0; paint(); }

        host.appendChild(K().buildStepControls(step, reset, 700));
        paint();

        host.querySelector('.inv-query-btn').onclick = function () {
            try {
                _invState.query = host.querySelector('.inv-query').value;
                renderFileInverted();
            } catch (e) { /* ignore invalid input */ }
        };
    }

    global.VizRegistry.attach('file-inverted', {
        render: renderFileInverted,
        code: () => codeFileInverted,
        layout: { host: 'dynamic' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
