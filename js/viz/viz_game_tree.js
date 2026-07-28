(function (global) {
    const K = () => global.VizKit; // resolved at call time (VizKit set at startup)

    // Examples-helper trio — duplicated per program convention; do NOT refactor.
    function loadExamples(methodId) { try { return ExamplesStore.load(localStorage, methodId); } catch (e) { return []; } }
    function saveExample(methodId, text, defaultText) { try { ExamplesStore.save(localStorage, methodId, text, defaultText); } catch (e) {} }
    function buildExamplesSelect(methodId, defaultText) {
        var lang = (global.I18N && I18N.getCurrentLanguage) ? I18N.getCurrentLanguage() : 'en';
        var escA = function (s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;'); };
        var escT = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); };
        var trunc = function (s) { s = String(s); return s.length > 24 ? s.slice(0, 24) + '…' : s; };
        var h = '<select class="ex-select" data-method="' + escA(methodId) + '">';
        h += '<option value="">' + (lang === 'zh' ? '範例…' : 'Examples…') + '</option>';
        h += '<option value="' + escA(defaultText) + '">' + (lang === 'zh' ? '預設' : 'Default') + '</option>';
        loadExamples(methodId).forEach(function (e) { if (e.text === defaultText) return; h += '<option value="' + escA(e.text) + '">' + escT(trunc(e.text)) + '</option>'; });
        return h + '</select>';
    }
    var GT_PRUNE = '9,8,7,6,1,2,3,4';   // built-in "Heavy pruning" example
    var NW = 46, NH = 26;               // rounded-rect node size (fits symbol=value labels)
    function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
    function fmt(v) { return v === Infinity ? '∞' : v === -Infinity ? '-∞' : String(v); }

    let _gameState = null;
    function renderGameTree() {
        if (!_gameState) _gameState = { leaves: GameTreeViz.SAMPLE_LEAVES.slice(), useAB: true };
        const host = K().acquireDynamicVizHost();
        const lang = (global.I18N && I18N.getCurrentLanguage) ? I18N.getCurrentLanguage() : 'en';
        const { root } = GameTreeViz.buildGameTree(_gameState.leaves, 2);
        const { frames } = GameTreeViz.minimaxFrames(root, _gameState.useAB);

        // ---- Layout: leaves left-to-right, parents centered over children (unchanged geometry) ----
        const meta = {};
        (function () {
            let leafCursor = 0;
            const colW = 60, rowH = 70, padX = 36, padY = 30;
            function layout(node, depth) {
                let x;
                if (node.leaf || !node.children.length) { x = padX + (leafCursor++) * colW; }
                else { const xs = node.children.map((c) => layout(c, depth + 1)); x = (xs[0] + xs[xs.length - 1]) / 2; }
                meta[node.id] = { x: x, y: padY + depth * rowH, node: node };
                return x;
            }
            layout(root, 0);
        })();

        host.innerHTML =
            '<div class="gt-wrap vizfit-host">' +
              '<div class="tt-controls">' +
                '<input type="text" class="gt-input" value="' + _gameState.leaves.join(',') + '">' +
                '<button type="button" class="gt-build">' + (lang === 'zh' ? '建立 Build' : 'Build') + '</button>' +
                '<button type="button" class="gt-random" title="' + (lang === 'zh' ? '隨機輸入' : 'Random input') + '">🎲</button>' +
                '<label style="margin-left:8px"><input type="checkbox" class="gt-ab" ' + (_gameState.useAB ? 'checked' : '') + '> &alpha;-&beta;</label>' +
                buildExamplesSelect('game-tree', GameTreeViz.SAMPLE_LEAVES.join(',')) +
              '</div>' +
              '<div class="gt-scroll vizfit-scroll"><svg class="gt-svg"></svg></div>' +
              '<div class="gt-info" style="margin-top:6px;font-weight:700"></div>' +
            '</div>';

        const wrap = host.querySelector('.gt-wrap');
        const scrollEl = wrap.querySelector('.gt-scroll');
        const svgEl = scrollEl.querySelector('.gt-svg');
        const ids = Object.keys(meta);
        const xs = ids.map((id) => meta[id].x), ys = ids.map((id) => meta[id].y);
        const minX = Math.min.apply(null, xs) - NW / 2 - 10, maxX = Math.max.apply(null, xs) + NW / 2 + 10;
        const minY = Math.min.apply(null, ys) - NH / 2 - 10, maxY = Math.max.apply(null, ys) + NH / 2 + 10;
        const natW = Math.max(maxX - minX, 120), natH = Math.max(maxY - minY, 120);

        function paint(fr, i) {
            if (!svgEl.isConnected) return;
            const sz = K().fitFocusSize(scrollEl, natW, natH);
            const pruned = new Set(); const returned = {}; const abText = {}; let current = null;
            for (let s = 0; s <= i && s < frames.length; s++) {
                const f = frames[s];
                if (f.type === 'prune') (f.pruned || []).forEach((p) => pruned.add(p));
                if (f.type === 'return' || f.type === 'leaf') returned[f.id] = f.value;
                if (f.type === 'enter' || f.type === 'update') abText[f.id] = { alpha: f.alpha, beta: f.beta, value: f.type === 'update' ? f.value : undefined };
                if (f.type === 'enter' || f.type === 'update' || f.type === 'leaf' || f.type === 'return') current = f.id;
            }
            let out = '';
            ids.forEach((id) => { const m = meta[id]; (m.node.children || []).forEach((c) => { const b = meta[c.id]; if (b) out += '<line class="gt-edge" x1="' + m.x + '" y1="' + m.y + '" x2="' + b.x + '" y2="' + b.y + '"/>'; }); });
            ids.forEach((id) => {
                const m = meta[id], node = m.node, nid = node.id;
                const symbol = node.leaf ? String(node.value) : (node.isMax ? '▲' : '▽');
                let label = symbol, cls = 'gt-node';
                if (Object.prototype.hasOwnProperty.call(returned, nid) && !node.leaf) { label = symbol + '=' + fmt(returned[nid]); cls += ' visited'; }
                if (pruned.has(nid)) cls += ' gt-pruned';
                if (nid === current) cls += ' active';
                out += '<rect class="' + cls + '" x="' + (m.x - NW / 2) + '" y="' + (m.y - NH / 2) + '" width="' + NW + '" height="' + NH + '" rx="6"/>';
                out += '<text class="gt-node-label" x="' + m.x + '" y="' + m.y + '">' + esc(label) + '</text>';
            });
            svgEl.setAttribute('viewBox', minX + ' ' + minY + ' ' + natW + ' ' + natH);
            svgEl.setAttribute('width', sz.w);
            svgEl.setAttribute('height', sz.h);
            svgEl.innerHTML = out;

            let info = '';
            if (fr) {
                const ab = abText[fr.id];
                if (fr.type === 'prune') info = 'Prune at node ' + fr.id + ': α=' + fmt(fr.alpha) + ' ≥ β=' + fmt(fr.beta);
                else if (fr.type === 'leaf') info = 'Leaf node ' + fr.id + ' = ' + fmt(fr.value);
                else if (ab) info = 'Node ' + fr.id + ': α=' + fmt(ab.alpha) + ', β=' + fmt(ab.beta) + (ab.value !== undefined ? ', best=' + fmt(ab.value) : '');
            }
            if (Object.prototype.hasOwnProperty.call(returned, root.id)) info += (info ? '  |  ' : '') + 'Root value = ' + fmt(returned[root.id]);
            host.querySelector('.gt-info').textContent = info;
        }

        const exSelect = wrap.querySelector('.ex-select');
        if (exSelect && !Array.from(exSelect.options).some((o) => o.value === GT_PRUNE)) {
            const opt = document.createElement('option');
            opt.value = GT_PRUNE; opt.textContent = (lang === 'zh' ? '大量剪枝' : 'Heavy pruning');
            exSelect.insertBefore(opt, exSelect.options[2] || null);
        }
        wrap.appendChild(K().buildFrameControls(frames, paint, { runIntervalMs: 700 }));
        K().markFocusFit(host, { svg: true });   // viz-fit-svg: per-SVG drawing-only zoom

        host.querySelector('.gt-build').onclick = () => {
            try {
                const vals = host.querySelector('.gt-input').value.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => Number.isFinite(n));
                if (vals.length) { _gameState.leaves = vals; saveExample('game-tree', vals.join(','), GameTreeViz.SAMPLE_LEAVES.join(',')); renderGameTree(); }
            } catch (e) { /* ignore malformed input */ }
        };
        host.querySelector('.gt-random').onclick = () => {
            const r = GameTreeViz.randomInput(K().getInputDifficulty());
            _gameState.leaves = r.leaves;
            saveExample('game-tree', r.leaves.join(','), GameTreeViz.SAMPLE_LEAVES.join(','));
            renderGameTree();
        };
        if (exSelect) exSelect.onchange = (ev) => {
            const v = ev.target.value; if (!v) return;
            const vals = v.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => Number.isFinite(n));
            if (vals.length) { _gameState.leaves = vals; renderGameTree(); }
        };
        host.querySelector('.gt-ab').onchange = (e) => {
            _gameState.useAB = e.target.checked;
            renderGameTree();
        };
    }

    global.VizRegistry.attach('game-tree', {
        render: renderGameTree,
        code: () => codeGameTree,
        layout: { host: 'dynamic' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
