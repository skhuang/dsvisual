(function (global) {
    const K = () => global.VizKit; // resolved at call time (VizKit set at startup)

    const FEN_DEFAULT = [3, 2, 5, 1, 7, 4, 6, 2];

    function parseFenInput(text) {
        const nums = String(text).split(/[\s,]+/).map((s) => parseInt(s, 10)).filter(Number.isFinite);
        const clamped = nums.slice(0, 30);
        return clamped.length >= 1 ? clamped : FEN_DEFAULT.slice();
    }

    let _fenState = null;
    function renderFenwick() {
        const host = K().acquireDynamicVizHost();
        if (!_fenState) _fenState = { vals: FEN_DEFAULT.slice() };
        const lang = (global.I18N && I18N.getCurrentLanguage) ? I18N.getCurrentLanguage() : 'en';
        const arr = _fenState.vals;
        const n = arr.length;
        const bit = new Array(n + 1).fill(0);
        function lowbit(i) { return i & -i; }
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j <= n; j += lowbit(j)) bit[j] += arr[i];
        }

        const frames = [];
        function snapshot(phase, active, acc, msg) {
            frames.push({ bit: bit.slice(), phase: phase, active: active, acc: acc, msg: msg });
        }
        snapshot('Ready', 0, null, 'Fenwick tree built — press Step');

        // Phase indices generalize the original fixed demo (prefixSum(7) /
        // update(3, +5) on n=8) to any n >= 1 — identical to the original values
        // when n === 8 (the untouched default array).
        const qi = Math.max(1, n - 1);
        const ui = Math.max(1, Math.min(3, n));

        // Phase 1: prefixSum(qi)
        let s = 0;
        for (let i = qi; i > 0; i -= lowbit(i)) {
            s += bit[i];
            snapshot('Phase 1: prefixSum(' + qi + ')', i, s,
                'add bit[' + i + '] = ' + bit[i] + '  (lowbit ' + lowbit(i) + ')  → sum ' + s);
        }
        frames[frames.length - 1].msg += '   result = ' + s;

        // Phase 2: update(ui, +5)
        for (let i = ui; i <= n; i += lowbit(i)) {
            bit[i] += 5;
            snapshot('Phase 2: update(' + ui + ', +5)', i, null,
                'bit[' + i + '] += 5 → ' + bit[i] + '  (lowbit ' + lowbit(i) + ')');
        }

        // Phase 3: prefixSum(qi)
        s = 0;
        for (let i = qi; i > 0; i -= lowbit(i)) {
            s += bit[i];
            snapshot('Phase 3: prefixSum(' + qi + ')', i, s,
                'add bit[' + i + '] = ' + bit[i] + '  (lowbit ' + lowbit(i) + ')  → sum ' + s);
        }
        frames[frames.length - 1].msg += '   result = ' + s;

        const wrap = document.createElement('div');
        wrap.className = 'fenwick-wrap';
        wrap.innerHTML =
            '<div class="fenwick-controls">' +
              '<input type="text" class="fenwick-input" value="' + arr.join(',') + '">' +
              '<button type="button" class="fenwick-build">' + (lang === 'zh' ? '建立' : 'Build') + '</button>' +
              '<button type="button" class="rand-btn" title="' + (lang === 'zh' ? '隨機' : 'Random') + '">🎲</button>' +
            '</div>' +
            '<div class="fenwick-phase" data-testid="fenwick-phase"></div>' +
            '<div class="fenwick-row"></div>' +
            '<div class="fenwick-msg" data-testid="fenwick-msg">&nbsp;</div>';
        const rowEl = wrap.querySelector('.fenwick-row');
        const phaseEl = wrap.querySelector('.fenwick-phase');
        const msgEl = wrap.querySelector('.fenwick-msg');

        function draw(f) {
            let html = '';
            for (let i = 1; i <= n; i++) {
                html += '<div class="fenwick-col">' +
                        '<span class="fenwick-idx">' + i + '</span>' +
                        '<span class="fenwick-cell' + (i === f.active ? ' fenwick-active' : '') +
                        '" data-cell="' + i + '">' + f.bit[i] + '</span>' +
                        '<span class="fenwick-span">(' + (i - lowbit(i)) + ',' + i + ']</span>' +
                        '</div>';
            }
            rowEl.innerHTML = html;
            phaseEl.textContent = f.phase + (f.acc !== null ? '   running sum: ' + f.acc : '');
            msgEl.textContent = f.msg;
        }
        host.appendChild(K().buildStepWorkbench({
            stage: wrap, frames: frames, paint: draw, runIntervalMs: 600,
            getMessage: (f) => f.phase + (f.msg ? ' — ' + f.msg : ''),
        }));

        wrap.querySelector('.fenwick-build').onclick = () => {
            _fenState.vals = parseFenInput(wrap.querySelector('.fenwick-input').value);
            renderFenwick();
        };
        wrap.querySelector('.rand-btn').onclick = () => {
            const difficulty = (global.VizKit && global.VizKit.getInputDifficulty) ? global.VizKit.getInputDifficulty() : 'normal';
            const r = global.RandomInput && global.RandomInput.randomInputFor('tree-fenwick', difficulty);
            if (!r || !Array.isArray(r.vals) || !r.vals.length) return;
            _fenState.vals = r.vals;
            renderFenwick();
        };
    }

    global.VizRegistry.attach('tree-fenwick', {
        render: renderFenwick,
        code: () => codeTreeFenwick,
        layout: { host: 'dynamic' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
