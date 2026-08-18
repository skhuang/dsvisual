(function (global) {
    const K = () => global.VizKit; // resolved at call time (VizKit set at startup)

    const SEG_DEFAULT = [5, 8, 6, 3, 2, 7, 2, 6];

    // Fixed-depth layout below (POS map, nodes 1..15) supports at most 8 leaves,
    // so inputs are clamped to that bound regardless of what the user types.
    function parseSegInput(text) {
        const nums = String(text).split(/[\s,]+/).map((s) => parseInt(s, 10)).filter(Number.isFinite);
        const clamped = nums.filter((v) => v >= 0 && v <= 99).slice(0, 8);
        return clamped.length >= 1 ? clamped : SEG_DEFAULT.slice();
    }

    let _segState = null;
    function renderSegmentTree() {
        const host = K().acquireDynamicVizHost();
        if (!_segState) _segState = { vals: SEG_DEFAULT.slice() };
        const lang = (global.I18N && I18N.getCurrentLanguage) ? I18N.getCurrentLanguage() : 'en';
        const arr = _segState.vals;
        const n = arr.length;
        const lo = new Array(16), hi = new Array(16);
        (function setRanges(node, l, r) {
            lo[node] = l; hi[node] = r;
            if (l === r) return;
            const mid = (l + r) >> 1;
            setRanges(2 * node, l, mid);
            setRanges(2 * node + 1, mid + 1, r);
        })(1, 0, n - 1);

        const tree = new Array(16).fill(0);
        const lazy = new Array(16).fill(0);
        (function build(node) {
            if (lo[node] === hi[node]) { tree[node] = arr[lo[node]]; return; }
            build(2 * node);
            build(2 * node + 1);
            tree[node] = tree[2 * node] + tree[2 * node + 1];
        })(1);

        const frames = [];
        function snapshot(phase, active, msg) {
            frames.push({ tree: tree.slice(), lazy: lazy.slice(), phase: phase, active: active, msg: msg });
        }
        function applyLazy(node, val) {
            tree[node] += (hi[node] - lo[node] + 1) * val;
            lazy[node] += val;
        }
        function pushDown(node, phase) {
            if (lazy[node] === 0) return;
            applyLazy(2 * node, lazy[node]);
            applyLazy(2 * node + 1, lazy[node]);
            lazy[node] = 0;
            snapshot(phase, node, 'push lazy tag down from node ' + node);
        }
        function query(node, ql, qr, phase) {
            if (qr < lo[node] || hi[node] < ql) {
                snapshot(phase, node, 'node ' + node + ' [' + lo[node] + ',' + hi[node] + '] disjoint — skip');
                return 0;
            }
            if (ql <= lo[node] && hi[node] <= qr) {
                snapshot(phase, node, 'node ' + node + ' fully covered — take ' + tree[node]);
                return tree[node];
            }
            pushDown(node, phase);
            snapshot(phase, node, 'node ' + node + ' partial — recurse into children');
            return query(2 * node, ql, qr, phase) + query(2 * node + 1, ql, qr, phase);
        }
        function update(node, ql, qr, val, phase) {
            if (qr < lo[node] || hi[node] < ql) return;
            if (ql <= lo[node] && hi[node] <= qr) {
                applyLazy(node, val);
                snapshot(phase, node, 'node ' + node + ' fully covered — apply lazy +' + val);
                return;
            }
            pushDown(node, phase);
            update(2 * node, ql, qr, val, phase);
            update(2 * node + 1, ql, qr, val, phase);
            tree[node] = tree[2 * node] + tree[2 * node + 1];
            snapshot(phase, node, 'node ' + node + ' pull up — sum now ' + tree[node]);
        }

        snapshot('Ready', -1, 'segment tree built — press Step');
        // Query/update ranges generalize the original fixed demo ([2,5] range-sum,
        // [1,4] += 3 update, both on n=8) to any n in [1,8] — identical to the
        // original indices when n === 8 (the untouched default array).
        const ql = Math.min(2, n - 1), qr = Math.max(ql, Math.min(5, n - 1));
        const ul = Math.min(1, n - 1), ur = Math.max(ul, Math.min(4, n - 1));
        const r1 = query(1, ql, qr, 'Phase 1: range query sum[' + ql + ',' + qr + ']');
        frames[frames.length - 1].msg += '   result = ' + r1;
        update(1, ul, ur, 3, 'Phase 2: range update [' + ul + ',' + ur + '] += 3');
        const r3 = query(1, ql, qr, 'Phase 3: range query sum[' + ql + ',' + qr + ']');
        frames[frames.length - 1].msg += '   result = ' + r3;

        const POS = {
            1: [299, 34], 2: [151, 96], 3: [447, 96],
            4: [77, 158], 5: [225, 158], 6: [373, 158], 7: [521, 158],
            8: [40, 220], 9: [114, 220], 10: [188, 220], 11: [262, 220],
            12: [336, 220], 13: [410, 220], 14: [484, 220], 15: [558, 220],
        };
        const wrap = document.createElement('div');
        wrap.className = 'segtree-wrap';
        wrap.innerHTML =
            '<div class="segtree-controls">' +
              '<input type="text" class="segtree-input" value="' + arr.join(',') + '">' +
              '<button type="button" class="segtree-build">' + (lang === 'zh' ? '建立' : 'Build') + '</button>' +
              '<button type="button" class="rand-btn" title="' + (lang === 'zh' ? '隨機' : 'Random') + '">🎲</button>' +
            '</div>' +
            '<div class="segtree-phase" data-testid="segtree-phase"></div>' +
            '<div class="segtree-grid"></div>' +
            '<div class="segtree-msg" data-testid="segtree-msg">&nbsp;</div>';
        const gridEl = wrap.querySelector('.segtree-grid');
        const phaseEl = wrap.querySelector('.segtree-phase');
        const msgEl = wrap.querySelector('.segtree-msg');

        function draw(f) {
            let svg = '<svg class="segtree-svg" viewBox="0 0 600 252" width="100%" ' +
                      'xmlns="http://www.w3.org/2000/svg">';
            for (let node = 2; node <= 15; node++) {
                if (lo[node] === undefined) continue; // n<8 leaves gaps in the fixed node table
                const p = POS[node >> 1], c = POS[node];
                svg += '<line x1="' + p[0] + '" y1="' + (p[1] + 15) + '" x2="' + c[0] +
                       '" y2="' + (c[1] - 15) + '" stroke="#cbd5e1" stroke-width="1.5"/>';
            }
            for (let node = 1; node <= 15; node++) {
                if (lo[node] === undefined) continue;
                const c = POS[node];
                const isActive = node === f.active;
                svg += '<rect class="segtree-node" data-node="' + node + '" x="' + (c[0] - 28) +
                       '" y="' + (c[1] - 15) + '" width="56" height="30" rx="4" fill="' +
                       (isActive ? '#34d399' : '#fff') + '" stroke="#1e40af" stroke-width="1.5"/>';
                svg += '<text x="' + c[0] + '" y="' + (c[1] - 19) + '" text-anchor="middle" ' +
                       'font-size="9" fill="#64748b">[' + lo[node] + ',' + hi[node] + ']</text>';
                svg += '<text x="' + c[0] + '" y="' + (c[1] + 5) + '" text-anchor="middle" ' +
                       'font-size="13" font-weight="700" fill="' + (isActive ? '#fff' : '#1e293b') +
                       '">' + f.tree[node] + '</text>';
                if (f.lazy[node] !== 0) {
                    svg += '<text x="' + (c[0] + 23) + '" y="' + (c[1] - 5) + '" text-anchor="middle" ' +
                           'font-size="9" font-weight="700" fill="#f59e0b">+' + f.lazy[node] + '</text>';
                }
            }
            svg += '</svg>';
            gridEl.innerHTML = svg;
            phaseEl.textContent = f.phase;
            msgEl.textContent = f.msg;
        }
        host.appendChild(K().buildStepWorkbench({
            stage: wrap, frames: frames, paint: draw, runIntervalMs: 600,
            getMessage: (f) => f.phase + (f.msg ? ' — ' + f.msg : ''),
        }));

        wrap.querySelector('.segtree-build').onclick = () => {
            _segState.vals = parseSegInput(wrap.querySelector('.segtree-input').value);
            renderSegmentTree();
        };
        wrap.querySelector('.rand-btn').onclick = () => {
            const difficulty = (global.VizKit && global.VizKit.getInputDifficulty) ? global.VizKit.getInputDifficulty() : 'normal';
            const r = global.RandomInput && global.RandomInput.randomInputFor('tree-segment', difficulty);
            if (!r || !Array.isArray(r.vals) || !r.vals.length) return;
            _segState.vals = r.vals;
            renderSegmentTree();
        };
    }

    global.VizRegistry.attach('tree-segment', {
        render: renderSegmentTree,
        code: () => codeTreeSegment,
        layout: { host: 'dynamic' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
