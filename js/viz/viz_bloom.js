(function (global) {
    const K = () => global.VizKit; // resolved at call time (VizKit set at startup)

    // NOTE: showStatus is a stateless shared helper (writes to the #status-message
    // element) also used by many renderers still in js/app.js. Duplicated here
    // privately rather than shared, per the extraction recipe.
    function showStatus(msg, color) {
        const el = document.getElementById('status-message');
        if (el) { el.textContent = msg; el.style.color = color; }
    }

    let _bloomState = null;

    function renderBloomFilter() {
        const host = K().acquireDynamicVizHost();
        const SIZE = 32;
        function h1(s) { let h = 5381; for (const c of s) h = (h * 33 + c.charCodeAt(0)) >>> 0; return h % SIZE; }
        function h2(s) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h % SIZE; }
        function h3(s) { let h = 7; for (const c of s) h = (h * 17 + c.charCodeAt(0) + 1) >>> 0; return h % SIZE; }
        function hashes(s) { return [h1(s), h2(s), h3(s)]; }

        if (!_bloomState) {
            _bloomState = { bits: new Array(SIZE).fill(false), items: [], inputVal: 'fish' };
            for (const w of ['cat', 'dog', 'bird']) {
                for (const i of hashes(w)) _bloomState.bits[i] = true;
                _bloomState.items.push(w);
            }
        }
        const bits = _bloomState.bits;
        const items = _bloomState.items;
        const savedVal = _bloomState.inputVal || 'fish';

        const wrap = document.createElement('div');
        wrap.className = 'bloom-wrap';
        let html = '<div class="bloom-row">';
        for (let i = 0; i < SIZE; i++) {
            html += '<span class="bloom-cell' + (bits[i] ? ' bloom-on' : '') +
                    '" data-bit="' + i + '">' + (bits[i] ? 1 : 0) + '</span>';
        }
        html += '</div>';
        html += '<div class="bloom-hashes" data-testid="bloom-hashes"></div>';
        html += '<div class="bloom-items"><strong>inserted:</strong> <span class="bloom-items-list"></span></div>';
        html += '<div class="bloom-controls" role="group">' +
                    '<input type="text" data-bloom-val>' +
                    '<button type="button" data-action="bloom-insert">Insert</button>' +
                    '<button type="button" data-action="bloom-query">Query</button>' +
                '</div>';
        wrap.innerHTML = html;
        host.appendChild(wrap);

        const valInput = wrap.querySelector('[data-bloom-val]');
        valInput.value = savedVal;
        wrap.querySelector('.bloom-items-list').textContent = items.join(', ');
        const hashesEl = wrap.querySelector('.bloom-hashes');
        valInput.addEventListener('input', () => { _bloomState.inputVal = valInput.value.trim(); });
        function highlight(idxs, cls) {
            wrap.querySelectorAll('.bloom-cell').forEach((c) => c.classList.remove('bloom-hit', 'bloom-miss'));
            for (const i of idxs) {
                const cell = wrap.querySelector('.bloom-cell[data-bit="' + i + '"]');
                if (cell) cell.classList.add(cls);
            }
        }
        wrap.querySelector('[data-action="bloom-insert"]').onclick = () => {
            const key = valInput.value.trim();
            if (!key) { showStatus('Enter a word', '#f87171'); return; }
            _bloomState.inputVal = key;
            const idxs = hashes(key);
            for (const i of idxs) bits[i] = true;
            if (!items.includes(key)) items.push(key);
            renderBloomFilter();
            showStatus('Inserted "' + key + '" → bits {' + idxs.join(', ') + '}', '#34d399');
        };
        wrap.querySelector('[data-action="bloom-query"]').onclick = () => {
            const key = valInput.value.trim();
            if (!key) { showStatus('Enter a word', '#f87171'); return; }
            _bloomState.inputVal = key;
            const idxs = hashes(key);
            hashesEl.textContent = 'hashes of "' + key + '" → {' + idxs.join(', ') + '}';
            const present = idxs.every((i) => bits[i]);
            highlight(idxs, present ? 'bloom-hit' : 'bloom-miss');
            if (present) showStatus('"' + key + '" possibly present', '#f59e0b');
            else showStatus('"' + key + '" definitely not present', '#60a5fa');
        };
    }

    global.VizRegistry.attach('bloom-filter', {
        render: renderBloomFilter,
        code: () => codeBloomFilter,
        layout: { host: 'dynamic' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
