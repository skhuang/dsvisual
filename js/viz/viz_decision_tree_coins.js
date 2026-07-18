(function (global) {
    const K = () => global.VizKit;
    const V = () => global.DecisionTreeCoinsViz;

    // Small tilting balance: outcome > 0 => left pan down.
    function balanceSVG(left, right, outcome, langOf) {
        const cx = 150, cy = 34, arm = 96;
        const a = (outcome || 0) * 9 * Math.PI / 180;
        const lx = cx - arm * Math.cos(a), ly = cy + arm * Math.sin(a);
        const rx = cx + arm * Math.cos(a), ry = cy - arm * Math.sin(a);
        const pan = (px, py, coins, side) =>
            '<line x1="' + px + '" y1="' + py + '" x2="' + px + '" y2="' + (py + 26) + '" stroke="#94a3b8"/>' +
            '<rect x="' + (px - 34) + '" y="' + (py + 26) + '" width="68" height="20" rx="4" fill="#eef3f9" stroke="#94a3b8"/>' +
            '<text x="' + px + '" y="' + (py + 40) + '" text-anchor="middle" font-size="12" font-family="monospace">' + (coins.length ? coins.map((i) => V().COINS[i]).join(' ') : '·') + '</text>';
        return '<svg class="dc-balance" width="300" height="110">' +
            '<line x1="' + cx + '" y1="' + cy + '" x2="' + cx + '" y2="92" stroke="#64748b" stroke-width="3"/>' +
            '<line x1="' + lx + '" y1="' + ly + '" x2="' + rx + '" y2="' + ry + '" stroke="#1a4d8f" stroke-width="4"/>' +
            pan(lx, ly, left, 'L') + pan(rx, ry, right, 'R') + '</svg>';
    }

    function activeKeys(nodeKey) {
        const parts = nodeKey.split('.');
        const keys = [];
        for (let i = 0; i < parts.length; i++) keys.push(parts.slice(0, i + 1).join('.'));
        return new Set(keys);
    }

    function treeHTML(n, edgeSym, active, COINS) {
        const hl = active.has(n.key) ? ' dc-active' : '';
        const edge = edgeSym ? '<span class="dc-edge">' + edgeSym + '</span> ' : '';
        if (n.leaf) return '<li class="dc-leaf' + hl + '">' + edge + COINS[n.leaf.coin] + ' ' + (n.leaf.heavy ? '↑' : '↓') + '</li>';
        const fmt = (arr) => arr.map((i) => COINS[i]).join('');
        let h = '<li class="dc-tnode' + hl + '">' + edge + '<span class="dc-weigh">' + fmt(n.weigh.left) + ' ? ' + fmt(n.weigh.right) + '</span><ul>';
        const syms = { '-1': '<', '0': '=', '1': '>' };
        for (const o of ['-1', '0', '1']) if (n.children[o]) h += treeHTML(n.children[o], syms[o], active, COINS);
        return h + '</ul></li>';
    }

    let _state = null;
    function renderDecisionTreeCoins() {
        const host = K().acquireDynamicVizHost();
        if (!_state) _state = { fake: 2, heavy: true };
        const st = _state;
        const langOf = K().langOf;
        const COINS = V().COINS;
        const res = V().buildCoinsFrames({ fake: st.fake, heavy: st.heavy });
        const frames = res.frames;
        const tree = V().buildDecisionTree();
        let idx = 0;

        const coinBtns = COINS.map((c, i) => '<button type="button" class="dc-coin' + (i === st.fake ? ' active' : '') + '" data-coin="' + i + '">' + c + '</button>').join('');
        host.innerHTML =
            '<div class="dc-controls">' +
              '<span class="sm-hint">' + langOf({ zh: '選偽幣與方向,逐步秤 3 次找出它', en: 'pick the fake coin + direction; step the ≤3 weighings to find it' }) + '</span>' +
              '<div class="dc-coins">' + coinBtns + '</div>' +
              '<div class="dc-dir">' +
                '<button type="button" class="dc-hl' + (st.heavy ? ' active' : '') + '" data-heavy="1">' + langOf({ zh: '較重', en: 'heavy' }) + '</button>' +
                '<button type="button" class="dc-hl' + (!st.heavy ? ' active' : '') + '" data-heavy="0">' + langOf({ zh: '較輕', en: 'light' }) + '</button>' +
                '<button type="button" class="rand-btn" title="Random">🎲</button>' +
                '<button type="button" class="dc-verify">' + langOf({ zh: '驗證全部 16', en: 'verify all 16' }) + '</button>' +
                '<span class="dc-verifyout"></span>' +
              '</div>' +
            '</div>' +
            '<div class="dc-balancewrap"></div>' +
            '<div class="dc-verdict"></div>' +
            '<div class="dc-treewrap"><div class="dc-treetitle">' + langOf({ zh: '決策樹(< = > 為秤重結果)', en: 'decision tree (< = > = weighing outcome)' }) + '</div><ul class="dc-tree"></ul></div>' +
            '<div class="et-phase"></div>';

        function paint() {
            const fr = frames[idx];
            if (!host.querySelector('.dc-treewrap')) return;
            host.querySelector('.dc-balancewrap').innerHTML = balanceSVG(fr.left, fr.right, fr.outcome, langOf);
            const active = activeKeys(fr.nodeKey);
            host.querySelector('.dc-tree').innerHTML = treeHTML(tree, null, active, COINS);
            const v = host.querySelector('.dc-verdict');
            if (fr.action === 'done') { v.className = 'dc-verdict dc-ok'; v.textContent = langOf(fr.msg); }
            else { v.className = 'dc-verdict'; v.textContent = ''; }
            host.querySelector('.et-phase').textContent = langOf(fr.msg);
        }
        function step() { if (idx < frames.length - 1) { idx++; paint(); return idx < frames.length - 1; } return false; }
        function reset() { idx = 0; paint(); }

        host.appendChild(K().buildStepControls(step, reset, 900));
        paint();

        host.querySelectorAll('.dc-coin').forEach((b) => { b.onclick = () => { st.fake = parseInt(b.getAttribute('data-coin'), 10); renderDecisionTreeCoins(); }; });
        host.querySelectorAll('.dc-hl').forEach((b) => { b.onclick = () => { st.heavy = b.getAttribute('data-heavy') === '1'; renderDecisionTreeCoins(); }; });
        host.querySelector('.rand-btn').onclick = () => { st.fake = Math.floor(Math.random() * 8); st.heavy = Math.random() < 0.5; renderDecisionTreeCoins(); };
        host.querySelector('.dc-verify').onclick = () => {
            const ok = V().allScenariosCorrect();
            const out = host.querySelector('.dc-verifyout');
            out.textContent = ok ? langOf({ zh: '全部 16 種皆正確 ✓', en: 'all 16 correct ✓' }) : '✗';
            out.className = 'dc-verifyout ' + (ok ? 'dc-ok' : 'dc-err');
        };
    }

    global.VizRegistry.attach('decision-tree-coins', {
        render: renderDecisionTreeCoins,
        code: () => (typeof codeDecisionTreeCoins !== 'undefined' ? codeDecisionTreeCoins : ''),
        layout: { host: 'dynamic' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
