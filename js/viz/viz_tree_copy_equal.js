(function (global) {
    const K = () => global.VizKit;
    const V = () => global.TreeCopyEqualViz;

    function computeTreeLayout(node, x, y, dx, meta) {
        if (!node) return;
        meta.push({ id: node.id, val: node.val, x: x, y: y });
        if (node.left) computeTreeLayout(node.left, x - dx, y + 56, dx * 0.55, meta);
        if (node.right) computeTreeLayout(node.right, x + dx, y + 56, dx * 0.55, meta);
    }

    const PRESETS = { copy: 'A B C D E', equalA: 'A B C D E', equalB: 'A B C D E', diffA: 'A B C', diffB: 'A B D' };

    let _state = null;
    function renderTreeCopyEqual() {
        const host = K().acquireDynamicVizHost();
        if (!_state) _state = { mode: 'copy', src: PRESETS.copy, a: PRESETS.equalA, b: PRESETS.equalB };
        const st = _state;
        const langOf = K().langOf;
        const copy = st.mode === 'copy';
        const frames = copy ? V().buildCopyFrames(V().tokenize(st.src)).frames
                            : V().buildEqualFrames(V().tokenize(st.a), V().tokenize(st.b)).frames;
        let idx = 0;

        const modeBtn = (m, label) => '<button type="button" class="ce-mode-btn' + (st.mode === m ? ' active' : '') + '" data-mode="' + m + '">' + label + '</button>';
        const inputs = copy
            ? '<label>' + langOf({ zh: '樹', en: 'Tree' }) + ' <input type="text" class="ce-src" value="' + st.src.replace(/"/g, '&quot;') + '"></label>'
            : '<label>A <input type="text" class="ce-a" value="' + st.a.replace(/"/g, '&quot;') + '"></label><label>B <input type="text" class="ce-b" value="' + st.b.replace(/"/g, '&quot;') + '"></label>';
        const presetBtns = copy ? '' :
            '<button type="button" class="ce-preset" data-p="equal">' + langOf({ zh: '相等範例', en: 'equal' }) + '</button>' +
            '<button type="button" class="ce-preset" data-p="diff">' + langOf({ zh: '相異範例', en: 'differ' }) + '</button>';

        host.innerHTML =
            '<div class="ce-mode">' + modeBtn('copy', 'COPY') + modeBtn('equal', 'EQUAL') + '</div>' +
            '<div class="ce-controls">' + inputs + '<button type="button" class="ce-apply">Apply</button>' + presetBtns +
              '<span class="sm-hint">' + langOf({ zh: '層序陣列;- 表空位', en: 'level-order array; - = empty' }) + '</span></div>' +
            '<div class="ce-panels">' +
              '<div class="ce-panel"><div class="ce-ptitle">' + (copy ? langOf({ zh: '原樹', en: 'source' }) : 'A') + '</div><div class="ce-stage ce-left"><svg class="ce-edges"></svg><div class="ce-nodes"></div></div></div>' +
              '<div class="ce-panel"><div class="ce-ptitle">' + (copy ? langOf({ zh: '副本', en: 'copy' }) : 'B') + '</div><div class="ce-stage ce-right"><svg class="ce-edges"></svg><div class="ce-nodes"></div></div></div>' +
            '</div>' +
            '<div class="ce-verdict"></div><div class="et-phase"></div>';

        function paintPanel(sel, tree, hlIds, mmIds) {
            const stage = host.querySelector(sel); if (!stage) return;
            const W = stage.clientWidth || 340;
            const meta = []; let svg = '';
            if (tree) {
                computeTreeLayout(tree, W / 2, 26, Math.max(38, W / 5), meta);
                const byId = {}; meta.forEach((m) => { byId[m.id] = m; });
                (function walk(n) { if (!n) return; [n.left, n.right].forEach((c) => { if (!c) return; const x = byId[n.id], y = byId[c.id]; svg += '<line x1="' + x.x + '" y1="' + x.y + '" x2="' + y.x + '" y2="' + y.y + '" stroke="#94a3b8" stroke-width="2"/>'; walk(c); }); })(tree);
            }
            stage.querySelector('.ce-edges').innerHTML = svg;
            stage.querySelector('.ce-nodes').innerHTML = meta.map((m) => {
                let cls = 'tree-node';
                if (mmIds && mmIds.has(m.id)) cls += ' ce-mismatch';
                else if (hlIds && hlIds.has(m.id)) cls += ' ce-active';
                return '<div class="' + cls + '" style="left:' + m.x + 'px;top:' + m.y + 'px">' + m.val + '</div>';
            }).join('');
        }

        function paint() {
            const fr = frames[idx];
            if (!host.querySelector('.ce-panels')) return;
            const verdictEl = host.querySelector('.ce-verdict');
            if (copy) {
                paintPanel('.ce-left', fr.srcTree, new Set(fr.srcId ? [fr.srcId] : []), null);
                paintPanel('.ce-right', fr.copyTree, new Set(fr.copyId ? [fr.copyId] : []), null);
                if (fr.action === 'done') { verdictEl.className = 'ce-verdict ' + (fr.verdict ? 'ce-ok' : 'ce-err'); verdictEl.textContent = langOf(fr.msg); }
                else if (fr.action === 'error') { verdictEl.className = 'ce-verdict ce-err'; verdictEl.textContent = langOf(fr.msg); }
                else { verdictEl.className = 'ce-verdict'; verdictEl.textContent = ''; }
            } else {
                const mmA = new Set(), mmB = new Set(), hlA = new Set(), hlB = new Set();
                if (fr.status === 'mismatch') { if (fr.aId) mmA.add(fr.aId); if (fr.bId) mmB.add(fr.bId); }
                else { if (fr.aId) hlA.add(fr.aId); if (fr.bId) hlB.add(fr.bId); }
                paintPanel('.ce-left', fr.treeA, hlA, mmA);
                paintPanel('.ce-right', fr.treeB, hlB, mmB);
                if (fr.status === 'equal') { verdictEl.className = 'ce-verdict ce-ok'; verdictEl.textContent = langOf(fr.msg); }
                else if (fr.status === 'mismatch' || fr.status === 'error') { verdictEl.className = 'ce-verdict ce-err'; verdictEl.textContent = langOf(fr.msg); }
                else { verdictEl.className = 'ce-verdict'; verdictEl.textContent = ''; }
            }
            host.querySelector('.et-phase').textContent = langOf(fr.msg);
        }
        function step() { if (idx < frames.length - 1) { idx++; paint(); return idx < frames.length - 1; } return false; }
        function reset() { idx = 0; paint(); }

        host.appendChild(K().buildStepControls(step, reset, 800));
        paint();

        host.querySelectorAll('.ce-mode-btn').forEach((b) => { b.onclick = () => { const m = b.getAttribute('data-mode'); if (m !== st.mode) { st.mode = m; renderTreeCopyEqual(); } }; });
        host.querySelector('.ce-apply').onclick = () => {
            if (copy) { const v = host.querySelector('.ce-src').value.trim(); if (v) st.src = v; }
            else { const va = host.querySelector('.ce-a').value.trim(), vb = host.querySelector('.ce-b').value.trim(); if (va) st.a = va; if (vb) st.b = vb; }
            renderTreeCopyEqual();
        };
        host.querySelectorAll('.ce-preset').forEach((b) => { b.onclick = () => { const p = b.getAttribute('data-p'); if (p === 'equal') { st.a = PRESETS.equalA; st.b = PRESETS.equalB; } else { st.a = PRESETS.diffA; st.b = PRESETS.diffB; } renderTreeCopyEqual(); }; });
    }

    global.VizRegistry.attach('tree-copy-equal', {
        render: renderTreeCopyEqual,
        code: () => (typeof codeTreeCopyEqual !== 'undefined' ? codeTreeCopyEqual : ''),
        layout: { host: 'dynamic' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
