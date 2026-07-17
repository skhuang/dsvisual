(function (global) {
    const K = () => global.VizKit; // resolved at call time (VizKit set at startup)

    // NOTE: buildAlignmentRow is a stateless pure helper. This is the last
    // renderer using it that lives in js/app.js (renderKMP/renderBM/renderRK
    // already moved to js/viz/viz_kmp.js, js/viz/viz_bm.js, js/viz/viz_rk.js,
    // each with their own private copy). Duplicated here privately per the
    // extraction recipe; the original in js/app.js is left in place.
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

    function renderStringCompare() {
        const host = K().acquireDynamicVizHost();
        const text = 'ABABDABACDABABCABAB';
        const pattern = 'ABABCABAB';
        const n = text.length, m = pattern.length;

        // --- KMP stepper ---
        const lps = new Array(m).fill(0);
        for (let len = 0, k = 1; k < m;) {
            if (pattern[k] === pattern[len]) lps[k++] = ++len;
            else if (len !== 0) len = lps[len - 1];
            else lps[k++] = 0;
        }
        const kmp = { i: 0, j: 0, cmp: 0, done: false };
        function kmpStep() {
            if (kmp.done || kmp.i >= n) { kmp.done = true; return; }
            kmp.cmp++;
            if (text[kmp.i] === pattern[kmp.j]) {
                kmp.i++; kmp.j++;
                if (kmp.j === m) kmp.j = lps[kmp.j - 1];
            } else if (kmp.j !== 0) {
                kmp.j = lps[kmp.j - 1];
            } else {
                kmp.i++;
            }
            if (kmp.i >= n) kmp.done = true;
        }

        // --- Boyer-Moore (bad-character) stepper ---
        const bad = {};
        for (let k = 0; k < m; k++) bad[pattern[k]] = k;
        const bm = { s: 0, j: m - 1, cmp: 0, done: false };
        function bmStep() {
            if (bm.done || bm.s > n - m) { bm.done = true; return; }
            bm.cmp++;
            if (pattern[bm.j] === text[bm.s + bm.j]) {
                if (bm.j === 0) { bm.s += 1; bm.j = m - 1; }
                else bm.j--;
            } else {
                const bcRaw = bad[text[bm.s + bm.j]];
                bm.s += Math.max(1, bm.j - (bcRaw === undefined ? -1 : bcRaw));
                bm.j = m - 1;
            }
            if (bm.s > n - m) bm.done = true;
        }

        // --- Rabin-Karp stepper ---
        const BASE = 256, MOD = 101;
        let rkH = 1;
        for (let k = 0; k < m - 1; k++) rkH = (rkH * BASE) % MOD;
        let rkPat = 0;
        for (let k = 0; k < m; k++) rkPat = (BASE * rkPat + pattern.charCodeAt(k)) % MOD;
        function rkWindow(start) {
            let wh = 0;
            for (let k = 0; k < m; k++) wh = (BASE * wh + text.charCodeAt(start + k)) % MOD;
            return wh;
        }
        const rk = { s: 0, hash: rkWindow(0), cmp: 0, done: false };
        function rkStep() {
            if (rk.done || rk.s > n - m) { rk.done = true; return; }
            rk.cmp++;
            if (rk.hash === rkPat) {
                let k = 0;
                while (k < m && text[rk.s + k] === pattern[k]) { rk.cmp++; k++; }
            }
            if (rk.s < n - m) {
                rk.hash = (BASE * (rk.hash - text.charCodeAt(rk.s) * rkH) + text.charCodeAt(rk.s + m)) % MOD;
                rk.hash = ((rk.hash % MOD) + MOD) % MOD;
            }
            rk.s++;
            if (rk.s > n - m) rk.done = true;
        }

        const grid = document.createElement('div');
        grid.className = 'strcompare-grid';
        grid.innerHTML =
            '<div class="strcompare-pane" data-pane="kmp"><h4>KMP</h4>' +
                '<div class="strcompare-align"></div>' +
                '<div class="strsearch-stats">comparisons: <span class="strcompare-cmp">0</span></div></div>' +
            '<div class="strcompare-pane" data-pane="bm"><h4>Boyer-Moore (bad-char)</h4>' +
                '<div class="strcompare-align"></div>' +
                '<div class="strsearch-stats">comparisons: <span class="strcompare-cmp">0</span></div></div>' +
            '<div class="strcompare-pane" data-pane="rk"><h4>Rabin-Karp</h4>' +
                '<div class="strcompare-align"></div>' +
                '<div class="strsearch-stats">comparisons: <span class="strcompare-cmp">0</span></div></div>' +
            '<div class="strsearch-controls" role="group">' +
                '<button type="button" data-action="step">Step</button>' +
                '<button type="button" data-action="run">Run</button>' +
                '<button type="button" data-action="reset">Reset</button>' +
            '</div>';
        host.appendChild(grid);

        const kmpPane = grid.querySelector('[data-pane="kmp"]');
        const bmPane = grid.querySelector('[data-pane="bm"]');
        const rkPane = grid.querySelector('[data-pane="rk"]');
        let runTimer = null;

        function paint() {
            kmpPane.querySelector('.strcompare-align').innerHTML =
                buildAlignmentRow(text, pattern, kmp.i - kmp.j, null);
            kmpPane.querySelector('.strcompare-cmp').textContent = kmp.cmp;
            bmPane.querySelector('.strcompare-align').innerHTML =
                buildAlignmentRow(text, pattern, Math.min(bm.s, n - m), null);
            bmPane.querySelector('.strcompare-cmp').textContent = bm.cmp;
            rkPane.querySelector('.strcompare-align').innerHTML =
                buildAlignmentRow(text, pattern, Math.min(rk.s, n - m), { kind: 'window', status: null });
            rkPane.querySelector('.strcompare-cmp').textContent = rk.cmp;
        }
        function allDone() { return kmp.done && bm.done && rk.done; }
        function step() { kmpStep(); bmStep(); rkStep(); paint(); }
        grid.querySelector('[data-action="step"]').onclick = step;
        grid.querySelector('[data-action="run"]').onclick = () => {
            if (runTimer) return;
            runTimer = setInterval(() => {
                if (allDone()) { clearInterval(runTimer); runTimer = null; return; }
                step();
            }, 500);
        };
        grid.querySelector('[data-action="reset"]').onclick = () => {
            if (runTimer) { clearInterval(runTimer); runTimer = null; }
            renderStringCompare();
        };
        paint();
    }

    global.VizRegistry.attach('search-strcompare', {
        render: renderStringCompare,
        code: () => codeSearchStrCompare,
        layout: { host: 'dynamic' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
