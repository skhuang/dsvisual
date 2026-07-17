(function (global) {
    const K = () => global.VizKit; // resolved at call time (VizKit set at startup)

    // NOTE: computeTreeLayout is a stateless pure helper also used by renderTree
    // (tree-bst/tree-avl/tree-splay), which still lives in js/app.js against the
    // shared bstRoot. Duplicated here privately rather than shared, per the
    // extraction recipe.
    function computeTreeLayout(node, x, y, dx, nodesMeta) {
        if (!node) return;
        nodesMeta.push({ id: node.id, val: node.val, x: x, y: y, color: node.color });
        if (node.left) computeTreeLayout(node.left, x - dx, y + 60, dx * 0.55, nodesMeta);
        if (node.right) computeTreeLayout(node.right, x + dx, y + 60, dx * 0.55, nodesMeta);
    }

    let _ttState = null;
    function renderTreeTraversal() {
        const host = K().acquireDynamicVizHost();
        if (!_ttState) {
            _ttState = { values: TreeTraversalViz.SAMPLE_VALUES.slice(), order: 'inorder', mode: 'recursive' };
        }
        const st = _ttState;
        const root = TreeTraversalViz.buildTreeFromValues(st.values);
        const frames = TreeTraversalViz.buildTraversalFrames(root, st.order, st.mode);
        let idx = 0;
        const langOf = K().langOf;

        host.innerHTML =
            '<div class="tt-controls">' +
              '<input type="text" class="tt-input" placeholder="50,30,70,..." value="' + st.values.join(',') + '">' +
              '<button type="button" class="tt-build">Build</button>' +
              '<button type="button" class="rand-btn" title="Random">🎲</button>' +
              '<select class="tt-order">' +
                '<option value="preorder">Preorder</option>' +
                '<option value="inorder">Inorder</option>' +
                '<option value="postorder">Postorder</option>' +
                '<option value="levelorder">Level-order</option>' +
              '</select>' +
              '<select class="tt-mode">' +
                '<option value="recursive">Recursive</option>' +
                '<option value="iterative">Iterative</option>' +
              '</select>' +
            '</div>' +
            '<div class="tt-stage"><svg class="tt-edges"></svg><div class="tt-nodes"></div></div>' +
            '<div class="tt-aux"></div>' +
            '<div class="tt-output"><strong>Output:</strong> <span class="tt-seq"></span></div>' +
            '<div class="tt-phase"></div>';
        host.querySelector('.tt-order').value = st.order;
        host.querySelector('.tt-mode').value = st.mode;

        const nodesMeta = [];
        computeTreeLayout(root, 200, 30, 90, nodesMeta);
        const nodesEl = host.querySelector('.tt-nodes');
        const edgesEl = host.querySelector('.tt-edges');
        const metaById = {};
        nodesMeta.forEach(m => { metaById[m.id] = m; });
        (function drawEdges() {
            edgesEl.innerHTML = '';
            (function walk(n) {
                if (!n) return;
                [n.left, n.right].forEach(c => {
                    if (!c) return;
                    const a = metaById[n.id], b = metaById[c.id];
                    edgesEl.innerHTML += '<line x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '" stroke="#94a3b8" stroke-width="2"/>';
                    walk(c);
                });
            })(root);
        })();
        nodesMeta.forEach(m => {
            const d = document.createElement('div');
            d.className = 'tree-node'; d.id = 'tt-node-' + m.id; d.textContent = m.val;
            d.style.left = m.x + 'px'; d.style.top = m.y + 'px';
            nodesEl.appendChild(d);
        });

        function paint() {
            const fr = frames[idx];
            const seqEl = host.querySelector('.tt-seq');
            if (!seqEl) return;
            nodesMeta.forEach(m => {
                const el = document.getElementById('tt-node-' + m.id);
                if (!el) return;
                el.classList.remove('active', 'visited');
                if (fr.visited.includes(m.val)) el.classList.add('visited');
                if (fr.current === m.id) el.classList.add('active');
            });
            seqEl.textContent = fr.visited.join(', ');
            const auxLabel = { stack: 'Stack', queue: 'Queue', callstack: 'Call stack' }[fr.aux.kind];
            host.querySelector('.tt-aux').innerHTML =
                '<span class="tt-aux-label">' + auxLabel + ':</span> ' +
                fr.aux.items.map(v => '<span class="tt-aux-cell">' + v + '</span>').join('');
            host.querySelector('.tt-phase').textContent = langOf(fr.msg);
        }
        function step() { if (idx < frames.length - 1) { idx++; paint(); return idx < frames.length - 1; } return false; }
        function reset() { idx = 0; paint(); }

        host.appendChild(K().buildStepControls(step, reset, 700));
        paint();

        function rebuild() {
            st.order = host.querySelector('.tt-order').value;
            st.mode = host.querySelector('.tt-mode').value;
            renderTreeTraversal();
        }
        host.querySelector('.tt-order').onchange = rebuild;
        host.querySelector('.tt-mode').onchange = rebuild;
        host.querySelector('.tt-build').onclick = () => {
            const vals = host.querySelector('.tt-input').value.split(',').map(s => parseInt(s.trim(), 10)).filter(n => Number.isFinite(n));
            if (vals.length) { st.values = vals; renderTreeTraversal(); }
        };
        host.querySelector('.rand-btn').onclick = () => {
            const inp = window.RandomInput && RandomInput.randomInputFor('tree-traversal', K().getInputDifficulty());
            if (!inp) return;
            st.values = inp.vals;
            renderTreeTraversal();
        };
    }

    global.VizRegistry.attach('tree-traversal', {
        render: renderTreeTraversal,
        // NOTE: codeTreeTraversal is declared with `const` at the top level of the
        // classic (non-module) script js/code_db.js — a lexical global shared
        // across <script> tags but not attached to `window`. Must reference the
        // bare identifier, not `global.codeTreeTraversal` (always undefined).
        code: () => codeTreeTraversal,
        layout: { host: 'dynamic' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
