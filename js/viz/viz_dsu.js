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
    var DSU_DEEP = 'U0 1; U2 3; U0 2; U4 5; U4 0; F5';   // built-in "Deep chain" example
    var NR = 16, COLW = 54, ROWH = 64, PADX = 30, PADY = 30;

    let _dsuState = null;
    function renderDSU() {
        if (!_dsuState) _dsuState = { opStr: DsuViz.SAMPLE };
        const host = K().acquireDynamicVizHost();
        const lang = (global.I18N && I18N.getCurrentLanguage) ? I18N.getCurrentLanguage() : 'en';
        const spec = DsuViz.parseOps(_dsuState.opStr);
        const { frames } = DsuViz.buildFrames(spec);
        const n = spec.n;
        const ids = []; for (let i = 0; i < n; i++) ids.push(i);

        host.innerHTML =
            '<div class="dsu-wrap vizfit-host">' +
              '<div class="tt-controls">' +
                '<input type="text" class="dsu-input">' +
                '<button type="button" class="dsu-build">' + (lang === 'zh' ? '建立 Build' : 'Build') + '</button>' +
                '<button type="button" class="dsu-random" title="' + (lang === 'zh' ? '隨機輸入' : 'Random input') + '">🎲</button>' +
                buildExamplesSelect('tree-dsu', DsuViz.SAMPLE) +
                '<span class="dsu-hint">' + (lang === 'zh' ? 'U a b = 聯集，F x = 查找' : 'U a b = union, F x = find') + '</span>' +
              '</div>' +
              '<div class="dsu-scroll vizfit-scroll"><svg class="dsu-svg"></svg></div>' +
              '<div class="dsu-info" style="margin-top:6px;font-weight:700"></div>' +
            '</div>';

        const wrap = host.querySelector('.dsu-wrap');
        const scrollEl = wrap.querySelector('.dsu-scroll');
        const svgEl = scrollEl.querySelector('.dsu-svg');
        const infoEl = wrap.querySelector('.dsu-info');
        wrap.querySelector('.dsu-input').value = _dsuState.opStr;

        function paint(fr) {
            if (!svgEl.isConnected || !fr) return;
            const parent = fr.parent;
            // Build children + roots from this frame's parent[].
            const children = {}; const roots = [];
            for (let i = 0; i < n; i++) children[i] = [];
            for (let i = 0; i < n; i++) { if (parent[i] === i) roots.push(i); else children[parent[i]].push(i); }
            roots.sort((a, b) => a - b);
            for (let i = 0; i < n; i++) children[i].sort((a, b) => a - b);
            // n-ary layout: leaves get sequential columns, parents centered; trees placed left→right.
            const pos = {}; let col = 0;
            function layout(node, depth) {
                const kids = children[node];
                let c;
                if (!kids.length) { c = col++; }
                else { const cs = kids.map((k) => layout(k, depth + 1)); c = (cs[0] + cs[cs.length - 1]) / 2; }
                pos[node] = { x: PADX + c * COLW, y: PADY + depth * ROWH };
                return c;
            }
            roots.forEach((r) => { layout(r, 0); });

            const xs = ids.map((i) => pos[i].x), ys = ids.map((i) => pos[i].y);
            const minX = Math.min.apply(null, xs) - NR - 10, maxX = Math.max.apply(null, xs) + NR + 10;
            const minY = Math.min.apply(null, ys) - NR - 20, maxY = Math.max.apply(null, ys) + NR + 10;
            const natW = Math.max(maxX - minX, 120), natH = Math.max(maxY - minY, 120);
            const sz = K().fitFocusSize(scrollEl, natW, natH);

            const hl = fr.highlight || [];
            let out = '';
            for (let i = 0; i < n; i++) {
                if (parent[i] !== i) {
                    const a = pos[i], b = pos[parent[i]];
                    out += '<line class="dsu-edge" x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '"/>';
                }
            }
            for (let i = 0; i < n; i++) {
                const p = pos[i]; const isRoot = parent[i] === i;
                let cls = 'dsu-node'; if (isRoot) cls += ' dsu-root'; if (hl.indexOf(i) >= 0) cls += ' dsu-hl';
                out += '<circle class="' + cls + '" cx="' + p.x + '" cy="' + p.y + '" r="' + NR + '"/>';
                out += '<text class="dsu-node-label" x="' + p.x + '" y="' + p.y + '">' + i + '</text>';
                if (isRoot) out += '<text class="dsu-rank-label" x="' + p.x + '" y="' + (p.y - NR - 6) + '">r=' + fr.rank[i] + '</text>';
            }
            svgEl.setAttribute('viewBox', minX + ' ' + minY + ' ' + natW + ' ' + natH);
            svgEl.setAttribute('width', sz.w);
            svgEl.setAttribute('height', sz.h);
            svgEl.innerHTML = out;
            infoEl.textContent = (lang === 'zh' ? fr.msg.zh : fr.msg.en);
        }

        const exSelect = wrap.querySelector('.ex-select');
        if (exSelect && !Array.from(exSelect.options).some((o) => o.value === DSU_DEEP)) {
            const opt = document.createElement('option');
            opt.value = DSU_DEEP; opt.textContent = (lang === 'zh' ? '深鏈 Deep chain' : 'Deep chain');
            exSelect.insertBefore(opt, exSelect.options[2] || null);
        }
        wrap.appendChild(K().buildFrameControls(frames, paint, { runIntervalMs: 700 }));
        K().markFocusFit(host, { svg: true });   // viz-fit-svg: per-SVG drawing-only zoom

        wrap.querySelector('.dsu-build').onclick = () => {
            const txt = wrap.querySelector('.dsu-input').value;
            const parsed = DsuViz.parseOps(txt);
            if (parsed.ops.length) { _dsuState.opStr = txt; saveExample('tree-dsu', txt, DsuViz.SAMPLE); renderDSU(); }
        };
        wrap.querySelector('.dsu-random').onclick = () => {
            const str = DsuViz.randomInput(K().getInputDifficulty());
            _dsuState.opStr = str; saveExample('tree-dsu', str, DsuViz.SAMPLE); renderDSU();
        };
        if (exSelect) exSelect.onchange = (ev) => {
            const v = ev.target.value; if (!v) return;
            if (DsuViz.parseOps(v).ops.length) { _dsuState.opStr = v; renderDSU(); }
        };
    }

    global.VizRegistry.attach('tree-dsu', {
        render: renderDSU,
        code: () => codeTreeDSU,
        layout: { host: 'dynamic' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
