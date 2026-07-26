(function (global) {
    const K = () => global.VizKit; // resolved at call time (VizKit set at startup)

    function renderZAlgo() {
        const host = K().acquireDynamicVizHost();
        const pattern = 'ABABCABAB';
        const text = 'ABABDABACDABABCABAB';
        const s = pattern + '$' + text;
        const n = s.length, m = pattern.length;
        const z = new Array(n).fill(0);
        const trace = [];
        (function () {
            let l = 0, r = 0;
            for (let i = 1; i < n; i++) {
                if (i < r) z[i] = Math.min(r - i, z[i - l]);
                while (i + z[i] < n && s[z[i]] === s[i + z[i]]) z[i]++;
                if (i + z[i] > r) { l = i; r = i + z[i]; }
                trace[i] = { l: l, r: r };
            }
        })();

        // Materialize a frames array so the VCR control can random-access any
        // position. Old code tracked a single cursor `cur` (starting at 1,
        // meaning "next index to reveal") and derived `box` from
        // `trace[cur - 1]` (or {l:0,r:0} before anything was computed).
        // frames[i] === the `box` that old draw() used when `cur === i + 1`;
        // frames[0] reproduces the old cur=1 state (nothing computed yet —
        // already a valid pre-scan frame, no synthesis needed).
        const frames = [{ l: 0, r: 0 }];
        for (let i = 1; i < n; i++) frames.push(trace[i]);

        const wrap = document.createElement('div');
        wrap.className = 'zalgo-wrap';
        wrap.innerHTML =
            '<div class="zalgo-grid"></div>' +
            '<div class="zalgo-stats" data-testid="zalgo-stats">computed: <span class="zalgo-count">0</span>' +
                ' &nbsp;|&nbsp; matches: <span class="zalgo-matches">[]</span></div>';
        host.appendChild(wrap);
        const gridEl = wrap.querySelector('.zalgo-grid');
        const countEl = wrap.querySelector('.zalgo-count');
        const matchesEl = wrap.querySelector('.zalgo-matches');

        function paint(fr, i) {
            const cur = i + 1; // old cursor equivalent
            const box = fr;
            let chr = '<div class="zalgo-row zalgo-chr">';
            let zr = '<div class="zalgo-row zalgo-z">';
            const matches = [];
            for (let k = 0; k < n; k++) {
                const inBox = box.r > box.l && k >= box.l && k < box.r;
                chr += '<span class="zalgo-cell' + (inBox ? ' zalgo-box' : '') +
                       (k === cur && cur < n ? ' zalgo-cur' : '') + '">' + s[k] + '</span>';
                let zval = '-';
                if (k > 0 && k < cur) {
                    zval = z[k];
                    if (z[k] === m) matches.push(k - m - 1);
                } else if (k >= cur) {
                    zval = '?';
                }
                zr += '<span class="zalgo-cell' + (k < cur && k > 0 && z[k] === m ? ' zalgo-match' : '') +
                      '">' + zval + '</span>';
            }
            chr += '</div>';
            zr += '</div>';
            gridEl.innerHTML = chr + zr;
            countEl.textContent = Math.max(0, cur - 1);
            matchesEl.textContent = '[' + matches.join(',') + ']';
        }
        wrap.appendChild(K().buildFrameControls(frames, paint, { runIntervalMs: 350 }));
    }

    global.VizRegistry.attach('search-zalgo', {
        render: renderZAlgo,
        code: () => codeSearchZAlgo,
        layout: { host: 'dynamic' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
