(function (global) {
    const K = () => global.VizKit; // resolved at call time (VizKit set at startup)

    // NOTE: buildAlignmentRow is a stateless pure helper also used by renderRK
    // and renderStringCompare, which still live in js/app.js (renderKMP's copy
    // already moved to js/viz/viz_kmp.js). Duplicated here privately rather than
    // shared, per the extraction recipe.
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

    function renderBM() {
        const host = K().acquireDynamicVizHost();
        const text = 'ABABDABACDABABCABAB';
        const pattern = 'ABABCABAB';
        const n = text.length, m = pattern.length;
        const badChar = {};
        for (let k = 0; k < m; k++) badChar[pattern[k]] = k;
        const shift = new Array(m + 1).fill(0);
        const bpos = new Array(m + 1).fill(0);
        (function preprocess() {
            let i = m, j = m + 1;
            bpos[i] = j;
            while (i > 0) {
                while (j <= m && pattern[i - 1] !== pattern[j - 1]) {
                    if (shift[j] === 0) shift[j] = j - i;
                    j = bpos[j];
                }
                i--; j--;
                bpos[i] = j;
            }
            j = bpos[0];
            for (i = 0; i <= m; i++) {
                if (shift[i] === 0) shift[i] = j;
                if (i === j) j = bpos[j];
            }
        })();

        let s = 0, j = m - 1, comparisons = 0, matches = [], runTimer = null;

        const wrap = document.createElement('div');
        wrap.className = 'strsearch-wrap';
        let badRow = '';
        Object.keys(badChar).sort().forEach((c) => {
            badRow += '<span class="strsearch-bm-cell">' + c + ':' + badChar[c] + '</span>';
        });
        wrap.innerHTML =
            '<div class="strsearch-align"></div>' +
            '<div class="strsearch-lps"><strong>bad-char:</strong> ' + badRow + '</div>' +
            '<div class="strsearch-lps"><strong>good-suffix shift:</strong> <span>[' + shift.join(',') + ']</span></div>' +
            '<div class="strsearch-shift-note" data-testid="bm-note">&nbsp;</div>' +
            '<div class="strsearch-stats" data-testid="bm-stats">comparisons: <span class="strsearch-cmp">0</span>' +
                ' &nbsp;|&nbsp; matches: <span class="strsearch-matches">[]</span></div>' +
            '<div class="strsearch-controls" role="group">' +
                '<button type="button" data-action="step">Step</button>' +
                '<button type="button" data-action="run">Run</button>' +
                '<button type="button" data-action="reset">Reset</button>' +
            '</div>';
        host.appendChild(wrap);

        const alignEl = wrap.querySelector('.strsearch-align');
        const noteEl = wrap.querySelector('[data-testid="bm-note"]');
        const cmpEl = wrap.querySelector('.strsearch-cmp');
        const matchesEl = wrap.querySelector('.strsearch-matches');

        function draw(hi, note) {
            alignEl.innerHTML = buildAlignmentRow(text, pattern, s, hi);
            cmpEl.textContent = comparisons;
            matchesEl.textContent = '[' + matches.join(',') + ']';
            noteEl.innerHTML = note || '&nbsp;';
        }
        function step() {
            if (s > n - m) return;
            comparisons++;
            const ti = s + j, pj = j;
            if (pattern[j] === text[s + j]) {
                if (j === 0) {
                    matches.push(s);
                    draw({ kind: 'cell', textIdx: ti, patIdx: pj, status: 'match' }, 'full match at index ' + s);
                    s += shift[0];
                    j = m - 1;
                } else {
                    draw({ kind: 'cell', textIdx: ti, patIdx: pj, status: 'match' }, 'match — scan left');
                    j--;
                }
            } else {
                const bcRaw = badChar[text[s + j]];
                const bcShift = Math.max(1, j - (bcRaw === undefined ? -1 : bcRaw));
                const gsShift = shift[j + 1];
                const used = gsShift >= bcShift ? 'good-suffix' : 'bad-character';
                draw({ kind: 'cell', textIdx: ti, patIdx: pj, status: 'mismatch' },
                     'mismatch — bad-char=' + bcShift + ', good-suffix=' + gsShift + ' &rarr; shift by ' +
                     Math.max(bcShift, gsShift) + ' (' + used + ')');
                s += Math.max(bcShift, gsShift);
                j = m - 1;
            }
        }
        function reset() {
            s = 0; j = m - 1; comparisons = 0; matches = [];
            if (runTimer) { clearInterval(runTimer); runTimer = null; }
            draw(null, null);
        }
        wrap.querySelector('[data-action="step"]').onclick = step;
        wrap.querySelector('[data-action="run"]').onclick = () => {
            if (runTimer) return;
            runTimer = setInterval(() => {
                if (s > n - m) { clearInterval(runTimer); runTimer = null; return; }
                step();
            }, 500);
        };
        wrap.querySelector('[data-action="reset"]').onclick = reset;
        draw(null, null);
    }

    global.VizRegistry.attach('search-bm', {
        render: renderBM,
        code: () => codeSearchBM,
        layout: { host: 'dynamic' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
