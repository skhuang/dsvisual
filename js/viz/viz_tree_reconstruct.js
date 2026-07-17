(function (global) {
    const K = () => global.VizKit;

    function computeTreeLayout(node, x, y, dx, meta) {
        if (!node) return;
        meta.push({ id: node.id, val: node.val, x: x, y: y });
        if (node.left) computeTreeLayout(node.left, x - dx, y + 60, dx * 0.55, meta);
        if (node.right) computeTreeLayout(node.right, x + dx, y + 60, dx * 0.55, meta);
    }

    const MODES = {
        'pre-in':   { s1: { zh: '前序', en: 'Preorder' },  s2: { zh: '中序', en: 'Inorder' },   d1: 'A B D E C', d2: 'D B E A C' },
        'post-in':  { s1: { zh: '後序', en: 'Postorder' }, s2: { zh: '中序', en: 'Inorder' },   d1: 'D E B C A', d2: 'D B E A C' },
        'pre-post': { s1: { zh: '前序', en: 'Preorder' },  s2: { zh: '後序', en: 'Postorder' }, d1: 'A B D E C', d2: 'D E B C A' },
    };

    // Build a random FULL binary tree (every node 0 or 2 children) with `leaves`
    // leaves, then derive its three traversals — so pre-post stays unambiguous.
    function randomTraversals() {
        const labels = 'ABCDEFGHIJKLMNO'.split('');
        let li = 0;
        function grow(depthBudget) {
            const n = { val: labels[li++], left: null, right: null };
            if (depthBudget > 0 && li < labels.length - 1 && Math.random() < 0.6) {
                n.left = grow(depthBudget - 1);
                n.right = grow(depthBudget - 1);
            }
            return n;
        }
        const root = grow(3);
        const pre = [], ino = [], post = [];
        (function walk(n) { if (!n) return; pre.push(n.val); walk(n.left); ino.push(n.val); walk(n.right); post.push(n.val); })(root);
        return { pre: pre.join(' '), in: ino.join(' '), post: post.join(' ') };
    }

    let _state = null;
    function renderTreeReconstruct() {
        const host = K().acquireDynamicVizHost();
        if (!_state) _state = { mode: 'pre-in', seq1: MODES['pre-in'].d1, seq2: MODES['pre-in'].d2 };
        const st = _state;
        const langOf = K().langOf;
        const m = MODES[st.mode];
        const res = TreeReconstructViz.buildReconstructFrames(st.seq1, st.seq2, st.mode);
        const frames = res.frames;
        let idx = 0;

        const modeBtn = (id, label) => '<button type="button" class="rc-mode-btn' + (st.mode === id ? ' active' : '') + '" data-mode="' + id + '">' + label + '</button>';
        host.innerHTML =
            '<div class="rc-mode">' +
              modeBtn('pre-in', langOf({ zh: '前序+中序', en: 'Pre+In' })) +
              modeBtn('post-in', langOf({ zh: '後序+中序', en: 'Post+In' })) +
              modeBtn('pre-post', langOf({ zh: '前序+後序', en: 'Pre+Post' })) +
            '</div>' +
            '<div class="rc-controls">' +
              '<label>' + langOf(m.s1) + ' <input type="text" class="rc-seq1" value="' + st.seq1.replace(/"/g, '&quot;') + '"></label>' +
              '<label>' + langOf(m.s2) + ' <input type="text" class="rc-seq2" value="' + st.seq2.replace(/"/g, '&quot;') + '"></label>' +
              '<button type="button" class="rand-btn" title="Random">🎲</button><button type="button" class="rc-apply">Apply</button>' +
            '</div>' +
            '<div class="et-stage"><svg class="et-edges"></svg><div class="et-nodes"></div></div>' +
            '<div class="rc-seqs"><div class="rc-strip rc-strip1"></div><div class="rc-strip rc-strip2"></div></div>' +
            '<div class="rc-verdict"></div>' +
            '<div class="et-phase"></div>';

        function paintTree(tree, createdId) {
            const stageEl = host.querySelector('.et-stage'); if (!stageEl) return;
            const W = stageEl.clientWidth || 720;
            const meta = []; let svg = '';
            if (tree) {
                computeTreeLayout(tree, W / 2, 30, Math.max(48, W / 5), meta);
                const byId = {}; meta.forEach((mm) => { byId[mm.id] = mm; });
                (function walk(n) { if (!n) return; [n.left, n.right].forEach((c) => { if (!c) return; const a = byId[n.id], b = byId[c.id]; svg += '<line x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '" stroke="#94a3b8" stroke-width="2"/>'; walk(c); }); })(tree);
            }
            host.querySelector('.et-edges').innerHTML = svg;
            host.querySelector('.et-nodes').innerHTML = meta.map((mm) =>
                '<div class="tree-node' + (mm.id === createdId ? ' rc-created' : '') + '" style="left:' + mm.x + 'px;top:' + mm.y + 'px">' + mm.val + '</div>').join('');
        }
        function paintStrip(el, tokens, hi, range, split) {
            el.innerHTML = '<span class="rc-label">' + el.getAttribute('data-label') + '</span>' + tokens.map((t, i) => {
                let cls = 'rc-cell';
                if (range && i >= range[0] && i <= range[1]) cls += ' rc-inrange';
                if (i === hi) cls += ' rc-root';
                if (i === split) cls += ' rc-split';
                return '<span class="' + cls + '">' + t + '</span>';
            }).join('');
        }
        const seq1toks = TreeReconstructViz.tokenize(st.seq1);
        const seq2toks = TreeReconstructViz.tokenize(st.seq2);
        host.querySelector('.rc-strip1').setAttribute('data-label', langOf(m.s1));
        host.querySelector('.rc-strip2').setAttribute('data-label', langOf(m.s2));

        function paint() {
            const fr = frames[idx];
            if (!host.querySelector('.et-stage')) return;
            paintTree(fr.tree, fr.created);
            // seq1 shows the driving-sequence root highlight; seq2 shows the split subrange
            paintStrip(host.querySelector('.rc-strip1'), seq1toks, fr.root1, null, null);
            paintStrip(host.querySelector('.rc-strip2'), seq2toks, null, fr.range2, fr.splitAt);
            const verdictEl = host.querySelector('.rc-verdict');
            if (fr.action === 'done') { verdictEl.className = 'rc-verdict rc-ok'; verdictEl.textContent = langOf(fr.msg); }
            else if (fr.action === 'error') { verdictEl.className = 'rc-verdict rc-err'; verdictEl.textContent = langOf(fr.msg); }
            else { verdictEl.className = 'rc-verdict'; verdictEl.textContent = ''; }
            host.querySelector('.et-phase').textContent = langOf(fr.msg);
        }
        function step() { if (idx < frames.length - 1) { idx++; paint(); return idx < frames.length - 1; } return false; }
        function reset() { idx = 0; paint(); }

        host.appendChild(K().buildStepControls(step, reset, 700));
        paint();

        host.querySelectorAll('.rc-mode-btn').forEach((b) => {
            b.onclick = () => { const mm = b.getAttribute('data-mode'); if (mm !== st.mode) { st.mode = mm; st.seq1 = MODES[mm].d1; st.seq2 = MODES[mm].d2; renderTreeReconstruct(); } };
        });
        host.querySelector('.rc-apply').onclick = () => {
            st.seq1 = host.querySelector('.rc-seq1').value.trim();
            st.seq2 = host.querySelector('.rc-seq2').value.trim();
            renderTreeReconstruct();
        };
        host.querySelector('.rand-btn').onclick = () => {
            const t = randomTraversals();
            if (st.mode === 'pre-in') { st.seq1 = t.pre; st.seq2 = t.in; }
            else if (st.mode === 'post-in') { st.seq1 = t.post; st.seq2 = t.in; }
            else { st.seq1 = t.pre; st.seq2 = t.post; }
            renderTreeReconstruct();
        };
    }

    global.VizRegistry.attach('tree-reconstruct', {
        render: renderTreeReconstruct,
        code: () => (typeof codeTreeReconstruct !== 'undefined' ? codeTreeReconstruct : ''),
        layout: { host: 'dynamic' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
