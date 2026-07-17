(function (global) {
    const K = () => global.VizKit;

    function computeTreeLayout(node, x, y, dx, meta) {
        if (!node) return;
        meta.push({ id: node.id, val: node.val, idx: node.idx, x: x, y: y });
        if (node.left) computeTreeLayout(node.left, x - dx, y + 60, dx * 0.55, meta);
        if (node.right) computeTreeLayout(node.right, x + dx, y + 60, dx * 0.55, meta);
    }

    const PRESETS = { complete: 'A B C D E F G', 'left-skewed': 'A B - D - - - H', 'right-skewed': 'A - C - - - G' };

    function randomLevelArray() {
        const labels = 'ABCDEFGHIJKLMNO'.split('');
        const present = {}; let li = 0;
        (function grow(i, depth) {
            if (i > 15 || li >= labels.length) return;
            present[i] = labels[li++];
            if (depth < 3) { if (Math.random() < 0.7) grow(2 * i, depth + 1); if (Math.random() < 0.7) grow(2 * i + 1, depth + 1); }
        })(1, 0);
        const maxIdx = Math.max.apply(null, Object.keys(present).map(Number));
        const toks = [];
        for (let i = 1; i <= maxIdx; i++) toks.push(present[i] || '-');
        return toks.join(' ');
    }

    let _state = null;
    function renderTreeArrayRep() {
        const host = K().acquireDynamicVizHost();
        if (!_state) _state = { text: PRESETS.complete };
        const st = _state;
        const langOf = K().langOf;
        const res = TreeArrayRepViz.buildArrayRepFrames(TreeArrayRepViz.tokenize(st.text));
        const frames = res.frames;
        const size = res.size;
        const slots = res.slots;
        let idx = 0;

        host.innerHTML =
            '<div class="ar-controls">' +
              '<input type="text" class="ar-input" value="' + st.text.replace(/"/g, '&quot;') + '">' +
              '<button type="button" class="rand-btn" title="Random">🎲</button>' +
              '<button type="button" class="ar-apply">Apply</button>' +
              '<span class="sm-hint">' + langOf({ zh: '層序陣列;- 表空位;左=2i 右=2i+1 父=⌊i/2⌋', en: 'level-order array; - = empty; left=2i right=2i+1 parent=⌊i/2⌋' }) + '</span>' +
            '</div>' +
            '<div class="ar-presets">' +
              ['complete', 'left-skewed', 'right-skewed'].map((p) => '<button type="button" class="ar-preset" data-p="' + p + '">' + p + '</button>').join('') +
            '</div>' +
            '<div class="et-stage"><svg class="et-edges"></svg><div class="et-nodes"></div></div>' +
            '<div class="ar-array"></div>' +
            '<div class="ar-stats"></div>' +
            '<div class="et-phase"></div>';

        function highlightArithmetic(i) {
            host.querySelectorAll('.ar-cell,.tree-node').forEach((c) => c.classList.remove('ar-hl-self', 'ar-hl-parent', 'ar-hl-child'));
            if (!i) return;
            const mark = (j, cls) => { const c = host.querySelector('.ar-cell[data-i="' + j + '"]'); if (c) c.classList.add(cls); const tn = host.querySelector('.tree-node[data-i="' + j + '"]'); if (tn) tn.classList.add(cls); };
            mark(i, 'ar-hl-self');
            if (i > 1) mark(Math.floor(i / 2), 'ar-hl-parent');
            mark(2 * i, 'ar-hl-child'); mark(2 * i + 1, 'ar-hl-child');
        }

        function paint() {
            const fr = frames[idx];
            if (!host.querySelector('.et-stage')) return;
            const stageEl = host.querySelector('.et-stage'); const W = stageEl.clientWidth || 720;
            const meta = []; let svg = '';
            if (fr.tree) {
                computeTreeLayout(fr.tree, W / 2, 30, Math.max(44, W / 6), meta);
                const byId = {}; meta.forEach((mm) => { byId[mm.id] = mm; });
                (function walk(n) { if (!n) return; [n.left, n.right].forEach((c) => { if (!c) return; const a = byId[n.id], b = byId[c.id]; svg += '<line x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '" stroke="#94a3b8" stroke-width="2"/>'; walk(c); }); })(fr.tree);
            }
            host.querySelector('.et-edges').innerHTML = svg;
            host.querySelector('.et-nodes').innerHTML = meta.map((mm) =>
                '<div class="tree-node' + (fr.current === mm.idx ? ' ar-placing' : '') + '" data-i="' + mm.idx + '" style="left:' + mm.x + 'px;top:' + mm.y + 'px">' + mm.val + '</div>').join('');

            let cells = '';
            for (let i = 1; i <= size; i++) {
                const revealed = i <= fr.placedUpTo;
                const s = slots[i];
                const empty = !s || s.val === null;
                let cls = 'ar-cell';
                if (!revealed) cls += ' ar-hidden';
                else if (empty) cls += ' ar-wasted';
                if (revealed && fr.current === i) cls += ' ar-current';
                if (revealed && fr.parent === i) cls += ' ar-parent';
                if (revealed && (fr.left === i || fr.right === i)) cls += ' ar-childidx';
                cells += '<div class="ar-cellwrap"><div class="ar-idx">' + i + '</div><div class="' + cls + '" data-i="' + i + '">' + (revealed ? (empty ? '·' : s.val) : '') + '</div></div>';
            }
            host.querySelector('.ar-array').innerHTML = cells;

            const statsEl = host.querySelector('.ar-stats');
            if (fr.action === 'done' && size > 0) { statsEl.className = 'ar-stats ar-ok'; statsEl.textContent = langOf(fr.msg) + ' — ' + langOf({ zh: '(偏斜樹最壞需 2^(h+1)−1 槽)', en: '(a skewed tree needs up to 2^(h+1)−1 slots)' }); }
            else if (fr.action === 'error') { statsEl.className = 'ar-stats ar-err'; statsEl.textContent = langOf(fr.msg); }
            else { statsEl.className = 'ar-stats'; statsEl.textContent = langOf({ zh: '目前浪費槽 = ', en: 'wasted so far = ' }) + fr.wastedSoFar; }
            host.querySelector('.et-phase').textContent = langOf(fr.msg);

            host.querySelectorAll('.ar-cell:not(.ar-hidden),.tree-node').forEach((el) => {
                el.onclick = () => highlightArithmetic(parseInt(el.getAttribute('data-i'), 10));
            });
        }
        function step() { if (idx < frames.length - 1) { idx++; paint(); return idx < frames.length - 1; } return false; }
        function reset() { idx = 0; paint(); }

        host.appendChild(K().buildStepControls(step, reset, 700));
        paint();

        host.querySelector('.ar-apply').onclick = () => { const v = host.querySelector('.ar-input').value.trim(); if (v) { st.text = v; renderTreeArrayRep(); } };
        host.querySelectorAll('.ar-preset').forEach((b) => { b.onclick = () => { st.text = PRESETS[b.getAttribute('data-p')]; renderTreeArrayRep(); }; });
        host.querySelector('.rand-btn').onclick = () => { st.text = randomLevelArray(); renderTreeArrayRep(); };
    }

    global.VizRegistry.attach('tree-array-rep', {
        render: renderTreeArrayRep,
        code: () => (typeof codeTreeArrayRep !== 'undefined' ? codeTreeArrayRep : ''),
        layout: { host: 'dynamic' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
