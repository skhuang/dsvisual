(function (global) {
    const K = () => global.VizKit; // resolved at call time (VizKit set at startup)

    // NOTE: buildAlignmentRow is a stateless pure helper also used by renderBM,
    // renderRK, and renderStringCompare, which still live in js/app.js. Duplicated
    // here privately rather than shared, per the extraction recipe.
    function buildAlignmentRow(text, pattern, offset, hi) {
        function cls(on) { return on && hi && hi.status ? ' strsearch-' + hi.status : ''; }
        let t = '<div class="strsearch-row strsearch-text">';
        for (let k = 0; k < text.length; k++) {
            let on = false;
            if (hi && hi.kind === 'cell') on = (k === hi.textIdx);
            else if (hi && hi.kind === 'window') on = (k >= offset && k < offset + pattern.length);
            t += '<span class="strsearch-cell' + cls(on) + '">' + text[k] + '</span>';
        }
        t += '</div>';
        let p = '<div class="strsearch-row strsearch-pattern">';
        for (let k = 0; k < offset; k++) p += '<span class="strsearch-cell strsearch-spacer"></span>';
        for (let k = 0; k < pattern.length; k++) {
            let on = false;
            if (hi && hi.kind === 'cell') on = (k === hi.patIdx);
            else if (hi && hi.kind === 'window') on = true;
            p += '<span class="strsearch-cell' + cls(on) + '">' + pattern[k] + '</span>';
        }
        p += '</div>';
        return t + p;
    }

    function renderKMP() {
        const host = K().acquireDynamicVizHost();
        const text = 'ABABDABACDABABCABAB';
        const pattern = 'ABABCABAB';
        const m = pattern.length;
        const lps = new Array(m).fill(0);
        for (let len = 0, k = 1; k < m;) {
            if (pattern[k] === pattern[len]) lps[k++] = ++len;
            else if (len !== 0) len = lps[len - 1];
            else lps[k++] = 0;
        }
        let i = 0, j = 0, comparisons = 0, matches = [], runTimer = null;

        const wrap = document.createElement('div');
        wrap.className = 'strsearch-wrap';
        wrap.innerHTML =
            '<div class="strsearch-align"></div>' +
            '<div class="strsearch-lps"><strong>LPS:</strong> <span class="strsearch-lps-cells"></span></div>' +
            '<div class="strsearch-stats" data-testid="kmp-stats">comparisons: <span class="strsearch-cmp">0</span>' +
                ' &nbsp;|&nbsp; matches: <span class="strsearch-matches">[]</span></div>' +
            '<div class="strsearch-controls" role="group">' +
                '<button type="button" data-action="step">Step</button>' +
                '<button type="button" data-action="run">Run</button>' +
                '<button type="button" data-action="reset">Reset</button>' +
            '</div>';
        host.appendChild(wrap);

        const alignEl = wrap.querySelector('.strsearch-align');
        const lpsEl = wrap.querySelector('.strsearch-lps-cells');
        const cmpEl = wrap.querySelector('.strsearch-cmp');
        const matchesEl = wrap.querySelector('.strsearch-matches');

        function draw(offset, hi, lpsActive) {
            alignEl.innerHTML = buildAlignmentRow(text, pattern, offset, hi);
            let h = '';
            for (let k = 0; k < m; k++) {
                h += '<span class="strsearch-lps-cell' + (k === lpsActive ? ' strsearch-lps-active' : '') +
                     '">' + lps[k] + '</span>';
            }
            lpsEl.innerHTML = h;
            cmpEl.textContent = comparisons;
            matchesEl.textContent = '[' + matches.join(',') + ']';
        }
        function step() {
            if (i >= text.length) return;
            comparisons++;
            const ti = i, pj = j, drawOffset = i - j;
            if (text[i] === pattern[j]) {
                i++; j++;
                if (j === m) { matches.push(i - j); j = lps[j - 1]; }
                draw(drawOffset, { kind: 'cell', textIdx: ti, patIdx: pj, status: 'match' }, -1);
            } else if (j !== 0) {
                const lpsActive = pj - 1;
                j = lps[j - 1];
                draw(drawOffset, { kind: 'cell', textIdx: ti, patIdx: pj, status: 'mismatch' }, lpsActive);
            } else {
                i++;
                draw(drawOffset, { kind: 'cell', textIdx: ti, patIdx: pj, status: 'mismatch' }, -1);
            }
        }
        function reset() {
            i = 0; j = 0; comparisons = 0; matches = [];
            if (runTimer) { clearInterval(runTimer); runTimer = null; }
            draw(0, null, -1);
        }
        wrap.querySelector('[data-action="step"]').onclick = step;
        wrap.querySelector('[data-action="run"]').onclick = () => {
            if (runTimer) return;
            runTimer = setInterval(() => {
                if (i >= text.length) { clearInterval(runTimer); runTimer = null; return; }
                step();
            }, 500);
        };
        wrap.querySelector('[data-action="reset"]').onclick = reset;
        draw(0, null, -1);
    }

    global.VizRegistry.attach('search-kmp', {
        render: renderKMP,
        code: () => codeSearchKMP,
        layout: { host: 'dynamic' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
