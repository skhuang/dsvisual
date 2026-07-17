(function (global) {
    const K = () => global.VizKit; // resolved at call time (VizKit set at startup)

    // NOTE: showStatus is a stateless shared helper (writes to the #status-message
    // element) also used by many renderers still in js/app.js. Duplicated here
    // privately rather than shared, per the extraction recipe.
    function showStatus(msg, color) {
        const el = document.getElementById('status-message');
        if (el) { el.textContent = msg; el.style.color = color; }
    }

    let _skipListState = null;

    function renderSkipList() {
        const host = K().acquireDynamicVizHost();
        const MAXLVL = 4;  // levels 0..3
        if (!_skipListState) {
            _skipListState = {
                nodes: [
                    { key: 3, h: 1 }, { key: 7, h: 2 }, { key: 12, h: 3 },
                    { key: 19, h: 1 }, { key: 25, h: 1 },
                ],
            };
        }
        const sl = _skipListState;
        sl.nodes.sort((a, b) => a.key - b.key);

        function randomLevel() {
            let lvl = 1;
            while (Math.random() < 0.5 && lvl < MAXLVL) lvl++;
            return lvl;
        }
        function computePath(target) {
            const path = [];
            let level = MAXLVL - 1, idx = -1;
            while (level >= 0) {
                let next = idx + 1;
                while (next < sl.nodes.length && sl.nodes[next].h <= level) next++;
                if (next < sl.nodes.length && sl.nodes[next].key < target) {
                    idx = next;
                    path.push({ level: level, idx: idx, kind: 'right' });
                } else {
                    path.push({ level: level, idx: idx, kind: 'down' });
                    level--;
                }
            }
            const after = idx + 1;
            if (after < sl.nodes.length && sl.nodes[after].key === target) {
                path.push({ level: 0, idx: after, kind: 'found' });
            } else {
                path.push({ level: 0, idx: idx, kind: 'notfound' });
            }
            return path;
        }

        let searchPath = null, searchStep = 0, searchTarget = null;

        const wrap = document.createElement('div');
        wrap.className = 'skiplist-wrap';
        wrap.innerHTML =
            '<div class="skiplist-grid"></div>' +
            '<div class="skiplist-status" data-testid="skiplist-status">&nbsp;</div>' +
            '<div class="skiplist-controls" role="group">' +
                '<input type="number" value="15" data-skiplist-val>' +
                '<button type="button" data-action="skiplist-insert">Insert</button>' +
                '<button type="button" data-action="skiplist-delete">Delete</button>' +
                '<input type="number" value="12" data-skiplist-search>' +
            '</div>';
        host.appendChild(wrap);
        const gridEl = wrap.querySelector('.skiplist-grid');
        const statusEl = wrap.querySelector('.skiplist-status');

        function activeStep() {
            if (!searchPath || searchStep === 0) return null;
            return searchPath[searchStep - 1];
        }
        function draw() {
            const act = activeStep();
            let html = '';
            for (let L = MAXLVL - 1; L >= 0; L--) {
                html += '<div class="skiplist-level" data-level="' + L + '">';
                html += '<span class="skiplist-head' +
                        (act && act.level === L && act.idx === -1 ? ' skiplist-active' : '') +
                        '">head</span>';
                for (let i = 0; i < sl.nodes.length; i++) {
                    const n = sl.nodes[i];
                    if (n.h > L) {
                        html += '<span class="skiplist-arrow">&rarr;</span>';
                        const on = act && act.level === L && act.idx === i;
                        html += '<span class="skiplist-node' + (on ? ' skiplist-active' : '') +
                                '" data-key="' + n.key + '">' + n.key + '</span>';
                    } else {
                        html += '<span class="skiplist-arrow skiplist-skip">&middot;&middot;&middot;</span>';
                        html += '<span class="skiplist-node skiplist-ghost"></span>';
                    }
                }
                html += '<span class="skiplist-arrow">&rarr;</span><span class="skiplist-nil">NIL</span>';
                html += '</div>';
            }
            gridEl.innerHTML = html;
        }
        function resetSearch() {
            searchPath = null;
            searchStep = 0;
            searchTarget = null;
            statusEl.innerHTML = '&nbsp;';
            draw();
        }
        function stepSearch() {
            if (!searchPath) {
                const t = parseInt(wrap.querySelector('[data-skiplist-search]').value, 10);
                if (Number.isNaN(t)) { showStatus('Enter a search key', '#f87171'); return false; }
                searchTarget = t;
                searchPath = computePath(t);
                searchStep = 0;
            }
            if (searchStep >= searchPath.length) return false;
            const s = searchPath[searchStep];
            searchStep++;
            draw();
            if (s.kind === 'found') statusEl.textContent = 'Found ' + searchTarget;
            else if (s.kind === 'notfound') statusEl.textContent = searchTarget + ' not found';
            else statusEl.textContent = 'level ' + s.level + ': move ' + s.kind;
            return searchStep < searchPath.length;
        }

        wrap.querySelector('[data-action="skiplist-insert"]').onclick = () => {
            const v = parseInt(wrap.querySelector('[data-skiplist-val]').value, 10);
            if (Number.isNaN(v)) { showStatus('Enter a number', '#f87171'); return; }
            if (sl.nodes.some((n) => n.key === v)) { showStatus(v + ' already present', '#f87171'); return; }
            const h = randomLevel();
            sl.nodes.push({ key: v, h: h });
            showStatus('Inserted ' + v + ' (level ' + h + ')', '#34d399');
            renderSkipList();
        };
        wrap.querySelector('[data-action="skiplist-delete"]').onclick = () => {
            const v = parseInt(wrap.querySelector('[data-skiplist-val]').value, 10);
            if (Number.isNaN(v)) { showStatus('Enter a number', '#f87171'); return; }
            const before = sl.nodes.length;
            sl.nodes = sl.nodes.filter((n) => n.key !== v);
            if (sl.nodes.length === before) showStatus(v + ' not found', '#f87171');
            else showStatus('Deleted ' + v, '#60a5fa');
            renderSkipList();
        };

        wrap.appendChild(K().buildStepControls(stepSearch, resetSearch, 500));
        draw();
    }

    global.VizRegistry.attach('skip-list', {
        render: renderSkipList,
        code: () => codeSkipList,
        layout: { host: 'dynamic' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
