(function (global) {
    const K = () => global.VizKit; // resolved at call time (VizKit set at startup)

    let _recState = null;
    function renderRecursion() {
        if (!_recState) _recState = { example: 'fibonacci', inputs: JSON.parse(JSON.stringify(RecursionViz.DEFAULTS)) };
        const host = K().acquireDynamicVizHost();
        host.style.width = '100%';
        const ex = _recState.example;
        const inputs = _recState.inputs;
        const { frames, nodes, result } = RecursionViz.recursionTrace(ex, inputs[ex]);

        // Build parent -> children map (children in id order)
        const childrenOf = {};
        let root = null;
        nodes.forEach((n) => {
            if (n.parentId === null) root = n;
            else { (childrenOf[n.parentId] = childrenOf[n.parentId] || []).push(n.id); }
        });

        // Custom n-ary layout: x by in-order leaf index, y by depth
        const meta = {}; // id -> {node, x, y}
        const colW = 74, rowH = 70, padX = 40, padY = 30;
        let leafCursor = 0;
        function layout(id) {
            const kids = childrenOf[id] || [];
            let x;
            if (!kids.length) { x = padX + (leafCursor++) * colW; }
            else {
                const xs = kids.map((c) => layout(c));
                x = (xs[0] + xs[xs.length - 1]) / 2;
            }
            meta[id] = { node: nodes[id], x: x, y: padY + nodes[id].depth * rowH };
            return x;
        }

        const readableLabels = {
            fibonacci: 'Fibonacci', reverse: 'Reverse String', permutations: 'Permutations',
            'binary-search': 'Binary Search', quicksort: 'Quicksort'
        };
        let optsHtml = '';
        RecursionViz.EXAMPLES.forEach((e) => {
            optsHtml += '<option value="' + e + '"' + (e === ex ? ' selected' : '') + '>' + (readableLabels[e] || e) + '</option>';
        });

        let inputsHtml = '';
        if (ex === 'fibonacci') {
            inputsHtml = '<input type="number" class="rec-n" min="0" max="7" value="' + inputs.fibonacci.n + '">';
        } else if (ex === 'reverse' || ex === 'permutations') {
            inputsHtml = '<input type="text" class="rec-text" value="' + inputs[ex].text + '">';
        } else if (ex === 'binary-search') {
            inputsHtml = '<input type="text" class="rec-arr" value="' + inputs['binary-search'].arr.join(',') + '"> ' +
                         '<input type="number" class="rec-target" value="' + inputs['binary-search'].target + '">';
        } else if (ex === 'quicksort') {
            inputsHtml = '<input type="text" class="rec-arr" value="' + inputs.quicksort.arr.join(',') + '">';
        }

        host.innerHTML =
            '<div class="tt-controls">' +
              '<select class="rec-example">' + optsHtml + '</select>' +
              inputsHtml +
              '<button type="button" class="rec-build">Build</button>' +
            '</div>' +
            '<div class="rec-stage">' +
              '<div class="rec-tree" style="position:relative;overflow:auto;height:320px">' +
                '<svg class="rec-edges" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none"></svg>' +
                '<div class="rec-nodes"></div>' +
              '</div>' +
              '<div class="rec-stack"></div>' +
            '</div>' +
            '<div class="rec-info"></div>';

        const treeEl = host.querySelector('.rec-tree');
        const nodesEl = host.querySelector('.rec-nodes');
        const edgesEl = host.querySelector('.rec-edges');
        const stackEl = host.querySelector('.rec-stack');
        const infoEl = host.querySelector('.rec-info');

        host.querySelector('.rec-example').onchange = (e) => {
            _recState.example = e.target.value;
            renderRecursion();
        };
        host.querySelector('.rec-build').onclick = () => {
            try {
                if (ex === 'fibonacci') {
                    const v = host.querySelector('.rec-n').value;
                    inputs.fibonacci.n = Math.max(0, Math.min(7, parseInt(v, 10) || 0));
                } else if (ex === 'reverse') {
                    inputs.reverse.text = host.querySelector('.rec-text').value.slice(0, 6);
                } else if (ex === 'permutations') {
                    inputs.permutations.text = host.querySelector('.rec-text').value.slice(0, 4);
                } else if (ex === 'binary-search') {
                    const arr = host.querySelector('.rec-arr').value.split(',').map((x) => parseInt(x.trim(), 10)).filter(Number.isFinite).slice(0, 15);
                    inputs['binary-search'].arr = arr;
                    inputs['binary-search'].target = parseInt(host.querySelector('.rec-target').value, 10);
                } else if (ex === 'quicksort') {
                    inputs.quicksort.arr = host.querySelector('.rec-arr').value.split(',').map((x) => parseInt(x.trim(), 10)).filter(Number.isFinite).slice(0, 10);
                }
                renderRecursion();
            } catch (e) { /* ignore malformed input */ }
        };

        // Guard: no calls recorded (empty or degenerate input) — show a friendly note, keep controls usable.
        if (!root || !frames.length) {
            if (treeEl) treeEl.innerHTML = '<div class="rec-info">No recursive calls for this input.</div>';
            if (stackEl) stackEl.innerHTML = '';
            return;
        }

        layout(root.id);

        // Size the tree area so scrolling works
        const maxX = Math.max.apply(null, Object.keys(meta).map((id) => meta[id].x));
        const maxY = Math.max.apply(null, Object.keys(meta).map((id) => meta[id].y));
        nodesEl.style.width = (maxX + padX) + 'px';
        nodesEl.style.height = (maxY + padY) + 'px';
        edgesEl.style.width = (maxX + padX) + 'px';
        edgesEl.style.height = (maxY + padY) + 'px';

        let idx = 0;

        const fmtResult = (r) => {
            if (Array.isArray(r)) return '[' + r.join(', ') + ']';
            return String(r);
        };

        function paint() {
            // Which node ids are revealed (called) and which have returned by now
            const revealed = {};
            const returnedVal = {};
            for (let k = 0; k <= idx && k < frames.length; k++) {
                const f = frames[k];
                if (f.event === 'call') revealed[f.id] = true;
                if (f.event === 'return') returnedVal[f.id] = f.value;
            }
            const cur = frames[idx];

            // Edges (only where both endpoints revealed)
            let edgeSvg = '';
            Object.keys(revealed).forEach((idStr) => {
                const id = parseInt(idStr, 10);
                const n = nodes[id];
                if (n.parentId !== null && revealed[n.parentId]) {
                    const a = meta[n.parentId], b = meta[id];
                    edgeSvg += '<line x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '" stroke="#94a3b8" stroke-width="2"/>';
                }
            });
            edgesEl.innerHTML = edgeSvg;

            // Nodes
            nodesEl.innerHTML = '';
            Object.keys(revealed).forEach((idStr) => {
                const id = parseInt(idStr, 10);
                const m = meta[id];
                const d = document.createElement('div');
                d.className = 'tree-node rec-node';
                d.style.left = m.x + 'px'; d.style.top = m.y + 'px';
                let label = m.node.label;
                if (Object.prototype.hasOwnProperty.call(returnedVal, id)) {
                    label += ' = ' + fmtResult(returnedVal[id]);
                    d.classList.add('visited');
                }
                if (cur && id === cur.id) {
                    d.classList.add('active');
                    if (cur.event === 'return') d.classList.add('rec-returning');
                }
                d.textContent = label;
                nodesEl.appendChild(d);
            });

            // Stack (bottom -> top; top = current)
            let stackHtml = '<div class="rec-stack-title">Call Stack</div>';
            if (cur && cur.stack.length) {
                for (let s = 0; s < cur.stack.length; s++) {
                    const nid = cur.stack[s];
                    const isTop = s === cur.stack.length - 1;
                    stackHtml += '<div class="rec-chip' + (isTop ? ' rec-chip-top' : '') + '">' + nodes[nid].label + '</div>';
                }
            } else {
                stackHtml += '<div class="rec-chip-empty">(empty)</div>';
            }
            stackEl.innerHTML = stackHtml;

            // Info line
            let info = '';
            if (cur) {
                info = (cur.event === 'call' ? 'Call ' : 'Return ') + nodes[cur.id].label;
                if (cur.event === 'return') info += ' → ' + fmtResult(cur.value);
            }
            if (idx === frames.length - 1) {
                info += (info ? '  |  ' : '') + 'Result: ' + fmtResult(result);
            }
            infoEl.textContent = info;
        }

        function step() { if (idx < frames.length - 1) { idx++; paint(); return true; } return false; }
        function reset() { idx = 0; paint(); }

        paint();
        host.appendChild(K().buildStepControls(step, reset, 700));
    }

    global.VizRegistry.attach('recursion', {
        render: renderRecursion,
        code: () => codeRecursion,
        layout: { host: 'dynamic' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
