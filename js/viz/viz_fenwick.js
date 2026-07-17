(function (global) {
    const K = () => global.VizKit; // resolved at call time (VizKit set at startup)

    function renderFenwick() {
        const host = K().acquireDynamicVizHost();
        const arr = [3, 2, 5, 1, 7, 4, 6, 2];
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

        // Phase 1: prefixSum(7)
        let s = 0;
        for (let i = 7; i > 0; i -= lowbit(i)) {
            s += bit[i];
            snapshot('Phase 1: prefixSum(7)', i, s,
                'add bit[' + i + '] = ' + bit[i] + '  (lowbit ' + lowbit(i) + ')  → sum ' + s);
        }
        frames[frames.length - 1].msg += '   result = ' + s;

        // Phase 2: update(3, +5)
        for (let i = 3; i <= n; i += lowbit(i)) {
            bit[i] += 5;
            snapshot('Phase 2: update(3, +5)', i, null,
                'bit[' + i + '] += 5 → ' + bit[i] + '  (lowbit ' + lowbit(i) + ')');
        }

        // Phase 3: prefixSum(7)
        s = 0;
        for (let i = 7; i > 0; i -= lowbit(i)) {
            s += bit[i];
            snapshot('Phase 3: prefixSum(7)', i, s,
                'add bit[' + i + '] = ' + bit[i] + '  (lowbit ' + lowbit(i) + ')  → sum ' + s);
        }
        frames[frames.length - 1].msg += '   result = ' + s;

        let idx = 0;
        const wrap = document.createElement('div');
        wrap.className = 'fenwick-wrap';
        wrap.innerHTML =
            '<div class="fenwick-phase" data-testid="fenwick-phase"></div>' +
            '<div class="fenwick-row"></div>' +
            '<div class="fenwick-msg" data-testid="fenwick-msg">&nbsp;</div>';
        host.appendChild(wrap);
        const rowEl = wrap.querySelector('.fenwick-row');
        const phaseEl = wrap.querySelector('.fenwick-phase');
        const msgEl = wrap.querySelector('.fenwick-msg');

        function draw() {
            const f = frames[idx];
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
        function step() {
            if (idx >= frames.length - 1) return false;
            idx++;
            draw();
            return idx < frames.length - 1;
        }
        function reset() { idx = 0; draw(); }
        wrap.appendChild(K().buildStepControls(step, reset, 600));
        draw();
    }

    global.VizRegistry.attach('tree-fenwick', {
        render: renderFenwick,
        code: () => codeTreeFenwick,
        layout: { host: 'dynamic' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
