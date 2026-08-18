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
    var TH_SKEW = '50,40,30,20,10';   // built-in "Left-skewed" example (descending → left chain)

    // Pure geometry helper (also duplicated in app.js for other tree renderers; unchanged).
    function computeTreeLayout(node, x, y, dx, nodesMeta) {
        if (!node) return;
        nodesMeta.push({ id: node.id, val: node.val, x: x, y: y, color: node.color });
        if (node.left) computeTreeLayout(node.left, x - dx, y + 60, dx * 0.55, nodesMeta);
        if (node.right) computeTreeLayout(node.right, x + dx, y + 60, dx * 0.55, nodesMeta);
    }

    let _threadedState = null;
    function renderTreeThreaded() {
        const host = K().acquireDynamicVizHost();
        if (!_threadedState) _threadedState = { vals: ThreadedViz.SAMPLE.slice() };
        const st = _threadedState;
        const langOf = K().langOf;
        const lang = (global.I18N && I18N.getCurrentLanguage) ? I18N.getCurrentLanguage() : 'en';
        const root = ThreadedViz.buildTreeFromValues(st.vals);
        const res = ThreadedViz.buildThreadedFrames(root);
        const frames = res.frames;

        host.innerHTML =
            '<div class="th-wrap vizfit-host">' +
              '<div class="th-controls">' +
                '<input type="text" class="th-input" value="' + st.vals.join(',') + '">' +
                '<button type="button" class="rand-btn" title="' + K().t('btn.random-input') + '">🎲</button>' +
                '<button type="button" class="th-build">' + (lang === 'zh' ? '建立 Build' : 'Build') + '</button>' +
                buildExamplesSelect('tree-threaded', ThreadedViz.SAMPLE.join(',')) +
                '<span class="sm-hint">' + (lang === 'zh' ? '數值建成 BST；虛線 = 中序線索' : 'values build a BST; dashed = inorder thread') + '</span>' +
              '</div>' +
              '<div class="th-scroll vizfit-scroll"><svg class="th-svg"></svg></div>' +
              '<div class="th-output"><strong>Inorder:</strong> <span class="th-seq"></span></div>' +
              '<div class="th-phase"></div>' +
            '</div>';

        const wrap = host.querySelector('.th-wrap');
        const scrollEl = wrap.querySelector('.th-scroll');
        const svgEl = scrollEl.querySelector('.th-svg');

        const meta = [];
        computeTreeLayout(root, 200, 30, 90, meta);
        const byId = {}; meta.forEach((m) => { byId[m.id] = m; });
        const R = 16;
        const xs = meta.map((m) => m.x), ys = meta.map((m) => m.y);
        const minX = Math.min.apply(null, xs) - R - 12;
        const maxX = Math.max.apply(null, xs) + R + 12;
        const minY = Math.min.apply(null, ys) - 46;   // threads arc ~30 above a node
        const maxY = Math.max.apply(null, ys) + R + 12;
        const natW = Math.max(maxX - minX, 120), natH = Math.max(maxY - minY, 120);

        function paint(fr) {
            // NOTE: no `svgEl.isConnected` gate here (on purpose) — buildStepWorkbench's
            // first paint() fires while `wrap`/`svgEl` are still mid-reparent (created,
            // moved into the not-yet-attached stagecol) and only become connected once
            // the returned workbench is appended to `host`. Bailing on a disconnected
            // svgEl would leave the initial frame undrawn until an unrelated resize
            // happened to repaint it. Query `.th-seq`/`.th-phase` via `wrap` (not `host`)
            // below for the same reason — `host` doesn't contain `wrap` at that instant.
            const sz = K().fitFocusSize(scrollEl, natW, natH);
            let inner = '';
            (function walk(n) { if (!n) return; [n.left, n.right].forEach((c) => { if (!c) return; const a = byId[n.id], b = byId[c.id]; inner += '<line class="th-edge" x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '"/>'; walk(c); }); })(root);
            (fr.threads || []).forEach((t) => { const a = byId[t.fromId], b = byId[t.toId]; if (!a || !b) return; const midY = Math.min(a.y, b.y) - 30; inner += '<path class="th-thread" d="M' + a.x + ',' + a.y + ' Q' + ((a.x + b.x) / 2) + ',' + midY + ' ' + b.x + ',' + b.y + '"/>'; });
            meta.forEach((m) => { const cls = 'th-node' + (fr.current === m.id ? ' active' : (fr.visited.includes(m.val) ? ' visited' : '')); inner += '<circle class="' + cls + '" cx="' + m.x + '" cy="' + m.y + '" r="' + R + '"/><text class="th-node-label" x="' + m.x + '" y="' + m.y + '">' + m.val + '</text>'; });
            svgEl.setAttribute('viewBox', minX + ' ' + minY + ' ' + natW + ' ' + natH);
            svgEl.setAttribute('width', sz.w);
            svgEl.setAttribute('height', sz.h);
            svgEl.innerHTML = inner;
            wrap.querySelector('.th-seq').textContent = fr.visited.join(', ');
            wrap.querySelector('.th-phase').textContent = langOf(fr.msg);
        }

        const exSelect = wrap.querySelector('.ex-select');
        if (exSelect && !Array.from(exSelect.options).some((o) => o.value === TH_SKEW)) {
            const opt = document.createElement('option');
            opt.value = TH_SKEW; opt.textContent = (lang === 'zh' ? '左斜樹' : 'Left-skewed');
            exSelect.insertBefore(opt, exSelect.options[2] || null);
        }
        host.appendChild(K().buildStepWorkbench({
            stage: wrap, frames: frames, paint: paint, runIntervalMs: 700,
            getMessage: (f) => K().langOf(f.msg),
        }));
        K().markFocusFit(host, { svg: true });   // viz-fit-svg: per-SVG drawing-only zoom

        host.querySelector('.th-build').onclick = () => {
            const vals = host.querySelector('.th-input').value.split(',').map((s) => parseInt(s.trim(), 10)).filter(Number.isFinite);
            if (vals.length) { st.vals = vals; saveExample('tree-threaded', st.vals.join(','), ThreadedViz.SAMPLE.join(',')); renderTreeThreaded(); }
        };
        host.querySelector('.rand-btn').onclick = () => {
            const inp = window.RandomInput && RandomInput.randomInputFor('tree-threaded', K().getInputDifficulty());
            if (!inp) return;
            _threadedState.vals = inp.vals;
            saveExample('tree-threaded', _threadedState.vals.join(','), ThreadedViz.SAMPLE.join(','));
            renderTreeThreaded();
        };
        if (exSelect) exSelect.onchange = (ev) => {
            const v = ev.target.value; if (!v) return;
            const vals = v.split(',').map((s) => parseInt(s.trim(), 10)).filter(Number.isFinite);
            if (vals.length) { _threadedState.vals = vals; renderTreeThreaded(); }
        };
    }

    global.VizRegistry.attach('tree-threaded', {
        render: renderTreeThreaded,
        code: () => codeTreeThreaded,
        layout: { host: 'dynamic' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
