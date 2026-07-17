(function (global) {
    const K = () => global.VizKit; // resolved at call time (VizKit set at startup)

    // NOTE: buildAlignmentRow is a stateless pure helper also used by
    // renderStringCompare, which still lives in js/app.js (renderKMP's and
    // renderBM's copies already moved to js/viz/viz_kmp.js and js/viz/viz_bm.js).
    // Duplicated here privately rather than shared, per the extraction recipe.
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

    function renderRK() {
        const host = K().acquireDynamicVizHost();
        const text = 'ABABDABACDABABCABAB';
        const pattern = 'ABABCABAB';
        const BASE = 256, MOD = 101;
        const n = text.length, m = pattern.length;
        let h = 1;
        for (let k = 0; k < m - 1; k++) h = (h * BASE) % MOD;
        let patHash = 0;
        for (let k = 0; k < m; k++) patHash = (BASE * patHash + pattern.charCodeAt(k)) % MOD;
        function windowHash(start) {
            let wh = 0;
            for (let k = 0; k < m; k++) wh = (BASE * wh + text.charCodeAt(start + k)) % MOD;
            return wh;
        }
        let s = 0, winHash = windowHash(0);
        let hashChecks = 0, verifyChecks = 0, matches = [], runTimer = null;

        const wrap = document.createElement('div');
        wrap.className = 'strsearch-wrap';
        wrap.innerHTML =
            '<div class="strsearch-align"></div>' +
            '<div class="strsearch-hash" data-testid="rk-hash">pattern hash: <span class="rk-pat">' + patHash + '</span>' +
                ' &nbsp;|&nbsp; window hash: <span class="rk-win">' + winHash + '</span></div>' +
            '<div class="strsearch-stats">hash checks: <span class="rk-hc">0</span>' +
                ' &nbsp;|&nbsp; verifications: <span class="rk-vc">0</span>' +
                ' &nbsp;|&nbsp; matches: <span class="rk-matches">[]</span></div>' +
            '<div class="strsearch-shift-note" data-testid="rk-note">&nbsp;</div>' +
            '<div class="strsearch-controls" role="group">' +
                '<button type="button" data-action="step">Step</button>' +
                '<button type="button" data-action="run">Run</button>' +
                '<button type="button" data-action="reset">Reset</button>' +
            '</div>';
        host.appendChild(wrap);

        const alignEl = wrap.querySelector('.strsearch-align');
        const winEl = wrap.querySelector('.rk-win');
        const hcEl = wrap.querySelector('.rk-hc');
        const vcEl = wrap.querySelector('.rk-vc');
        const matchesEl = wrap.querySelector('.rk-matches');
        const noteEl = wrap.querySelector('[data-testid="rk-note"]');

        function draw(status, note) {
            alignEl.innerHTML = buildAlignmentRow(text, pattern, Math.min(s, n - m), { kind: 'window', status: status });
            winEl.textContent = winHash;
            hcEl.textContent = hashChecks;
            vcEl.textContent = verifyChecks;
            matchesEl.textContent = '[' + matches.join(',') + ']';
            noteEl.innerHTML = note || '&nbsp;';
        }
        function step() {
            if (s > n - m) return;
            hashChecks++;
            let status, note;
            if (winHash === patHash) {
                let k = 0;
                while (k < m && text[s + k] === pattern[k]) { verifyChecks++; k++; }
                if (k === m) { matches.push(s); status = 'match'; note = 'hash hit + verified &rarr; match at ' + s; }
                else { status = 'collision'; note = 'hash hit but verify failed &rarr; collision'; }
            } else {
                status = 'mismatch';
                note = 'hash mismatch &rarr; slide window';
            }
            draw(status, note);
            if (s < n - m) {
                winHash = (BASE * (winHash - text.charCodeAt(s) * h) + text.charCodeAt(s + m)) % MOD;
                winHash = ((winHash % MOD) + MOD) % MOD;
            }
            s++;
        }
        function reset() {
            s = 0; winHash = windowHash(0);
            hashChecks = 0; verifyChecks = 0; matches = [];
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

    global.VizRegistry.attach('search-rk', {
        render: renderRK,
        code: () => codeSearchRK,
        layout: { host: 'dynamic' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
