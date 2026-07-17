(function (global) {
    const K = () => global.VizKit; // resolved at call time (VizKit set at startup)

    function renderDSU() {
        const host = K().acquireDynamicVizHost();
        const N = 8;
        const dsu = {
            parent: Array.from({length: N}, (_, i) => i),
            rank: new Array(N).fill(0),
        };
        const wrap = document.createElement('div');
        wrap.className = 'dsu-wrap';
        let html = '<div class="dsu-forest">';
        for (let i = 0; i < N; i++) {
            html += '<div class="dsu-tree" data-tree-of="' + i + '">' +
                      '<div class="dsu-tree-node" data-node="' + i + '" data-parent="' + i + '">' + i + '</div>' +
                    '</div>';
        }
        html += '</div>';
        html += '<div class="dsu-rank-table"><strong>rank:</strong> <span class="dsu-ranks">[0,0,0,0,0,0,0,0]</span></div>';
        html += '<div class="dsu-controls" role="group">' +
                    '<label>Union</label>' +
                    '<input type="number" min="0" max="7" value="0" data-dsu-a>' +
                    '<input type="number" min="0" max="7" value="1" data-dsu-b>' +
                    '<button type="button" data-action="union">Union</button>' +
                    '<label>Find</label>' +
                    '<input type="number" min="0" max="7" value="0" data-dsu-x>' +
                    '<button type="button" data-action="find">Find</button>' +
                    '<button type="button" data-action="reset">Reset</button>' +
                '</div>';
        wrap.innerHTML = html;
        host.appendChild(wrap);

        function refreshRanks() {
            const ranksEl = wrap.querySelector('.dsu-ranks');
            if (ranksEl) ranksEl.textContent = '[' + dsu.rank.join(',') + ']';
        }
        function find(x) {
            const p = dsu.parent;
            if (p[x] === x) return x;
            p[x] = find(p[x]);  // path compression
            return p[x];
        }
        function unite(a, b) {
            const root = find(a);
            const rootB = find(b);
            if (root === rootB) return;
            const r = dsu.rank;
            let small, large;
            if (r[root] < r[rootB]) { small = root; large = rootB; }
            else if (r[root] > r[rootB]) { small = rootB; large = root; }
            else { small = rootB; large = root; r[large]++; }
            dsu.parent[small] = large;
            const smallTree = wrap.querySelector('[data-tree-of="' + small + '"]');
            const largeTree = wrap.querySelector('[data-tree-of="' + large + '"]');
            if (smallTree && largeTree) {
                const nodes = smallTree.querySelectorAll('.dsu-tree-node');
                nodes.forEach((n) => largeTree.appendChild(n));
                smallTree.remove();
            }
            refreshRanks();
        }

        const aInput = wrap.querySelector('[data-dsu-a]');
        const bInput = wrap.querySelector('[data-dsu-b]');
        const xInput = wrap.querySelector('[data-dsu-x]');
        const unionBtn = wrap.querySelector('[data-action="union"]');
        const findBtn = wrap.querySelector('[data-action="find"]');
        const resetBtn = wrap.querySelector('[data-action="reset"]');
        if (unionBtn) unionBtn.onclick = () => unite(+aInput.value, +bInput.value);
        if (findBtn) findBtn.onclick = () => {
            find(+xInput.value);
            const node = wrap.querySelector('[data-node="' + xInput.value + '"]');
            if (node) {
                node.classList.add('dsu-highlight');
                setTimeout(() => node.classList.remove('dsu-highlight'), 600);
            }
            refreshRanks();
        };
        if (resetBtn) resetBtn.onclick = () => { renderDSU(); };
    }

    global.VizRegistry.attach('tree-dsu', {
        render: renderDSU,
        code: () => codeTreeDSU,
        layout: { host: 'dynamic' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
