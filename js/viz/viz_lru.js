(function (global) {
    const K = () => global.VizKit; // resolved at call time (VizKit set at startup)

    let _lruState = null;
    function renderLruCache() {
        const host = K().acquireDynamicVizHost();
        if (!_lruState) _lruState = { capacity: 3, keys: [1, 2, 3, 1, 4, 5, 1] };
        const st = _lruState;
        const langOf = K().langOf;
        const res = LruViz.buildFrames(st.capacity, st.keys);
        const frames = res.frames;
        let idx = 0;

        host.innerHTML =
            '<div class="lru-controls">' +
              '<label class="lru-cap-label">cap <input type="number" class="lru-cap" min="1" max="8" value="' + res.capacity + '"></label>' +
              '<input type="text" class="lru-input" value="' + st.keys.join(',') + '">' +
              '<button type="button" class="rand-btn" title="Random">🎲</button>' +
              '<button type="button" class="lru-apply">Apply</button>' +
            '</div>' +
            '<div class="lru-stage" data-testid="lru-stage"></div>' +
            '<div class="lru-stats" data-testid="lru-stats"></div>' +
            '<div class="lru-phase"></div>';

        function paint() {
            const fr = frames[idx];
            const stage = host.querySelector('.lru-stage');
            if (!stage) return;
            const last = fr.order.length - 1;
            const cells = fr.order.map((k, i) => {
                let cls = 'lru-node';
                if (k === fr.access && fr.status === 'hit') cls += ' hit';
                else if (k === fr.access && (fr.status === 'miss' || fr.status === 'evict')) cls += ' fresh';
                if (i === 0) cls += ' mru';
                if (i === last) cls += ' lru';
                const tag = i === 0 ? 'MRU' : (i === last ? 'LRU' : '');
                return '<span class="' + cls + '"><span class="lru-key">' + k + '</span>' +
                       '<span class="lru-tag">' + tag + '</span></span>';
            }).join('<span class="lru-link">→</span>');
            stage.innerHTML = fr.order.length
                ? cells + (fr.evicted != null ? '<span class="lru-evicted">🗑 ' + fr.evicted + '</span>' : '')
                : '<span class="lru-empty">∅</span>';
            host.querySelector('.lru-stats').textContent =
                'hits ' + fr.hits + ' · misses ' + fr.misses + ' · cap ' + fr.capacity;
            host.querySelector('.lru-phase').textContent = langOf(fr.msg);
        }
        function step() { if (idx < frames.length - 1) { idx++; paint(); return idx < frames.length - 1; } return false; }
        function reset() { idx = 0; paint(); }

        host.appendChild(K().buildStepControls(step, reset, 700));
        paint();
        host.querySelector('.lru-apply').onclick = () => {
            const cap = parseInt(host.querySelector('.lru-cap').value, 10);
            const keys = host.querySelector('.lru-input').value.split(',').map((s) => parseInt(s.trim(), 10)).filter(Number.isFinite);
            if (keys.length && Number.isFinite(cap) && cap >= 1) { st.capacity = cap; st.keys = keys; renderLruCache(); }
        };
        host.querySelector('.rand-btn').onclick = () => {
            const cap = 3 + Math.floor(Math.random() * 2);
            const len = 7 + Math.floor(Math.random() * 3);
            st.capacity = cap;
            st.keys = Array.from({ length: len }, () => 1 + Math.floor(Math.random() * 6));
            renderLruCache();
        };
    }

    global.VizRegistry.attach('cache-lru', {
        render: renderLruCache,
        code: () => codeLruCache,
        layout: { host: 'dynamic' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
