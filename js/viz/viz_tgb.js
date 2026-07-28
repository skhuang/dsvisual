(function (global) {
    const K = () => global.VizKit; // resolved at call time (VizKit set at startup)

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
    var TGB_MISS = 'A:B;B:C;C:D;D:E';   // built-in "Deep chain" example

    let _tgbState = null;
    function renderTreeGeneralBinary() {
        if (!_tgbState) _tgbState = { text: TreeGeneralBinaryViz.SAMPLE };
        const host = K().acquireDynamicVizHost();
        const gen = TreeGeneralBinaryViz.parseGeneralTree(_tgbState.text);
        const bin = TreeGeneralBinaryViz.toBinary(gen);
        const { frames } = TreeGeneralBinaryViz.convertFrames(gen);

        const lang = (global.I18N && I18N.getCurrentLanguage) ? I18N.getCurrentLanguage() : 'en';
        host.innerHTML =
            '<div class="tgb-wrap vizfit-host">' +
              '<div class="tt-controls">' +
                '<input type="text" class="tgb-input" placeholder="A:B,C,D;B:E,F" value="' + String(_tgbState.text).replace(/"/g, '&quot;') + '">' +
                '<button type="button" class="tgb-build">' + (lang === 'zh' ? '建立 Build' : 'Build') + '</button>' +
                '<button type="button" class="tgb-random" title="' + (lang === 'zh' ? '隨機輸入' : 'Random input') + '">🎲</button>' +
                buildExamplesSelect('tree-general-binary', TreeGeneralBinaryViz.SAMPLE) +
              '</div>' +
              '<div class="tgb-scroll vizfit-scroll">' +
                '<div class="tgb-stage" style="display:flex;gap:16px;flex-wrap:wrap">' +
                  '<div style="flex:1 1 280px;min-width:260px">' +
                    '<div class="tgb-col-head" style="font-weight:700;margin-bottom:4px">General tree</div>' +
                    '<div class="tgb-general" style="position:relative;overflow:hidden;height:300px;border:1px solid #e2e8f0;border-radius:8px">' +
                      '<svg class="tgb-general-edges" style="position:absolute;inset:0;width:100%;height:100%"></svg>' +
                      '<div class="tgb-general-nodes"></div>' +
                    '</div>' +
                  '</div>' +
                  '<div style="flex:1 1 280px;min-width:260px">' +
                    '<div class="tgb-col-head" style="font-weight:700;margin-bottom:4px">Binary tree (left-child / right-sibling)</div>' +
                    '<div class="tgb-binary" style="position:relative;overflow:hidden;height:300px;border:1px solid #e2e8f0;border-radius:8px">' +
                      '<svg class="tgb-binary-edges" style="position:absolute;inset:0;width:100%;height:100%"></svg>' +
                      '<div class="tgb-binary-nodes"></div>' +
                    '</div>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>';

        // ---- General tree layout: x by leaf order, y by depth ----
        const genMeta = {}; // id -> {x,y}
        (function () {
            let leafCursor = 0;
            const colW = 64, rowH = 64, padX = 40, padY = 34;
            function layout(node, depth) {
                const kids = gen.children[node] || [];
                let x;
                if (!kids.length) { x = padX + (leafCursor++) * colW; }
                else {
                    const xs = kids.map((k) => layout(k, depth + 1));
                    x = (xs[0] + xs[xs.length - 1]) / 2;
                }
                genMeta[node] = { x: x, y: padY + depth * rowH };
                return x;
            }
            if (gen.root) layout(gen.root, 0);
        })();

        // ---- Binary tree layout from {id,left,right} ----
        const binMeta = {}; // id -> {x,y}
        (function () {
            let col = 0;
            const colW = 56, rowH = 64, padX = 40, padY = 34;
            function layout(bn, depth) {
                if (!bn) return;
                layout(bn.left, depth + 1);
                binMeta[bn.id] = { x: padX + (col++) * colW, y: padY + depth * rowH };
                layout(bn.right, depth + 1);
            }
            layout(bin, 0);
        })();

        const genNodesEl = host.querySelector('.tgb-general-nodes');
        const genEdgesEl = host.querySelector('.tgb-general-edges');
        const binNodesEl = host.querySelector('.tgb-binary-nodes');
        const binEdgesEl = host.querySelector('.tgb-binary-edges');

        // Static general nodes
        Object.keys(genMeta).forEach((id) => {
            const m = genMeta[id];
            const d = document.createElement('div');
            d.className = 'tree-node'; d.id = 'tgb-g-' + id; d.textContent = id;
            d.style.left = m.x + 'px'; d.style.top = m.y + 'px';
            genNodesEl.appendChild(d);
        });
        // Static binary nodes
        Object.keys(binMeta).forEach((id) => {
            const m = binMeta[id];
            const d = document.createElement('div');
            d.className = 'tree-node'; d.id = 'tgb-b-' + id; d.textContent = id;
            d.style.left = m.x + 'px'; d.style.top = m.y + 'px';
            binNodesEl.appendChild(d);
        });

        function lineSvg(a, b, color, width) {
            return '<line x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y +
                   '" stroke="' + color + '" stroke-width="' + width + '"/>';
        }

        function paint(fr) {
            fr = fr || frames[frames.length - 1] || { links: [], active: null };
            const active = fr.active;
            const isActive = (l) => active && l.from === active.from && l.to === active.to && l.kind === active.kind;

            // General tree: draw all parent->child edges; highlight the edge whose child matches a cumulative link
            let g = '';
            const litChildren = {};
            fr.links.forEach((l) => { litChildren[l.to] = l; });
            (function walk(node) {
                const kids = gen.children[node] || [];
                kids.forEach((k) => {
                    const a = genMeta[node], b = genMeta[k];
                    if (a && b) {
                        const lk = litChildren[k];
                        const isAct = lk && isActive(lk);
                        const color = isAct ? '#ef4444' : (lk ? (lk.kind === 'left' ? '#2563eb' : '#16a34a') : '#94a3b8');
                        g += lineSvg(a, b, color, isAct ? 3 : 2);
                    }
                    walk(k);
                });
            })(gen.root);
            genEdgesEl.innerHTML = g;

            // Binary tree: draw cumulative links only (left=blue, right=green); active=red
            let b = '';
            fr.links.forEach((l) => {
                const a = binMeta[l.from], c = binMeta[l.to];
                if (!a || !c) return;
                const isAct = isActive(l);
                const color = isAct ? '#ef4444' : (l.kind === 'left' ? '#2563eb' : '#16a34a');
                b += lineSvg(a, c, color, isAct ? 3 : 2);
            });
            binEdgesEl.innerHTML = b;

            // Node highlighting
            host.querySelectorAll('.tgb-general .tree-node, .tgb-binary .tree-node').forEach((el) => el.classList.remove('active'));
            if (active) {
                const ga = document.getElementById('tgb-g-' + active.to);
                const ba = document.getElementById('tgb-b-' + active.to);
                if (ga) ga.classList.add('active');
                if (ba) ba.classList.add('active');
            }
        }
        const wrap = host.querySelector('.tgb-wrap');
        const exSelect = wrap.querySelector('.ex-select');
        if (exSelect && !Array.from(exSelect.options).some(function (o) { return o.value === TGB_MISS; })) {
            const opt = document.createElement('option');
            opt.value = TGB_MISS; opt.textContent = (lang === 'zh' ? '深鏈' : 'Deep chain');
            exSelect.insertBefore(opt, exSelect.options[2] || null);
        }
        wrap.appendChild(K().buildFrameControls(frames, paint, { runIntervalMs: 700 }));
        K().markFocusFit(host);   // viz-fit path (no {svg}) — bounded + fullscreen-expand + wrapper zoom

        host.querySelector('.tgb-build').onclick = () => {
            try {
                _tgbState.text = host.querySelector('.tgb-input').value;
                saveExample('tree-general-binary', _tgbState.text, TreeGeneralBinaryViz.SAMPLE);
                renderTreeGeneralBinary();
            } catch (e) { /* ignore malformed input */ }
        };
        host.querySelector('.tgb-random').onclick = () => {
            const dfc = (K().getInputDifficulty && K().getInputDifficulty()) || 'normal';
            _tgbState.text = TreeGeneralBinaryViz.randomInput(dfc);
            saveExample('tree-general-binary', _tgbState.text, TreeGeneralBinaryViz.SAMPLE);
            renderTreeGeneralBinary();
        };
        if (exSelect) exSelect.onchange = (ev) => {
            const v = ev.target.value; if (!v) return;
            _tgbState.text = v; renderTreeGeneralBinary();
        };
    }

    global.VizRegistry.attach('tree-general-binary', {
        render: renderTreeGeneralBinary,
        code: () => codeTreeGeneralBinary,
        layout: { host: 'dynamic' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
