(function (global) {
    const K = () => global.VizKit;
    const P = 4;
    const M = 1 << P;
    let state = null;

    // Deterministic 32-bit FNV-1a.  A visualizer needs repeatable buckets so
    // the same word always explains the same register update.
    function hash32(text) {
        let h = 2166136261;
        for (let i = 0; i < text.length; i++) {
            h ^= text.charCodeAt(i);
            h = Math.imul(h, 16777619);
        }
        return h >>> 0;
    }
    function bucketAndRank(text) {
        const hash = hash32(text);
        const bucket = hash & (M - 1);
        let rest = hash >>> P;
        let rank = 1;
        while ((rest & 1) === 0 && rank < 32 - P) {
            rank++;
            rest >>>= 1;
        }
        return { hash, bucket, rank };
    }
    function estimate(registers) {
        const alpha = 0.673; // standard HLL alpha for m = 16
        let inverseSum = 0;
        let zeroes = 0;
        for (const r of registers) {
            inverseSum += Math.pow(2, -r);
            if (r === 0) zeroes++;
        }
        let raw = alpha * M * M / inverseSum;
        // Linear-counting correction makes the small classroom examples less
        // misleading while preserving the register-based HLL idea.
        if (raw <= 2.5 * M && zeroes > 0) raw = M * Math.log(M / zeroes);
        return raw;
    }
    function makeState() {
        return { registers: new Array(M).fill(0), items: new Set(), input: '', last: null, message: 'Add words to estimate the number of distinct values.' };
    }
    function addItem(text, old) {
        const next = { registers: old.registers.slice(), items: new Set(old.items), input: '', last: null, message: '' };
        const info = bucketAndRank(text);
        const was = next.registers[info.bucket];
        const duplicate = next.items.has(text);
        next.items.add(text);
        next.registers[info.bucket] = Math.max(was, info.rank);
        next.last = { text, ...info, was, updated: next.registers[info.bucket] !== was, duplicate };
        next.message = duplicate
            ? '"' + text + '" was already seen; the estimate stays based on the same registers.'
            : 'hash("' + text + '") → bucket ' + info.bucket + ', rank ' + info.rank + (next.last.updated ? ': register updated.' : ': register already larger.');
        return next;
    }

    function renderHyperLogLog() {
        const host = K().acquireDynamicVizHost();
        if (!state) state = makeState();
        const est = estimate(state.registers);
        const truth = state.items.size;
        const error = truth ? Math.abs(est - truth) / truth * 100 : 0;
        const wrap = document.createElement('div');
        wrap.className = 'hll-wrap';
        const cells = state.registers.map((value, i) => {
            const active = state.last && state.last.bucket === i;
            return '<div class="hll-cell' + (active ? ' hll-active' : '') + '" data-testid="hll-cell" data-bucket="' + i + '">' +
                '<span>R[' + i + ']</span><strong>' + value + '</strong></div>';
        }).join('');
        wrap.innerHTML =
            '<div class="hll-explain">HyperLogLog estimates distinct values. A hash chooses one register; the rank records how rare that hash pattern is.</div>' +
            '<div class="hll-registers" aria-label="HyperLogLog registers">' + cells + '</div>' +
            '<div class="hll-stats" data-testid="hll-stats">' +
              '<span>distinct seen: <strong>' + truth + '</strong></span>' +
              '<span>HLL estimate: <strong>' + est.toFixed(2) + '</strong></span>' +
              '<span>error: <strong>' + error.toFixed(1) + '%</strong></span>' +
            '</div>' +
            '<div class="hll-controls" role="group" aria-label="HyperLogLog controls">' +
              '<label>Value <input type="text" data-testid="hll-value" value="' + state.input.replace(/&/g, '&amp;').replace(/"/g, '&quot;') + '"></label>' +
              '<button type="button" class="btn primary" data-action="hll-add">Add</button>' +
              '<button type="button" class="btn secondary" data-action="hll-clear">Clear</button>' +
            '</div>' +
            '<div class="hll-message" data-testid="hll-message" role="status">' + state.message + '</div>';
        host.appendChild(wrap);
        const input = wrap.querySelector('[data-testid="hll-value"]');
        input.addEventListener('input', () => { state.input = input.value; });
        wrap.querySelector('[data-action="hll-add"]').onclick = () => {
            const value = input.value.trim();
            if (!value) {
                state.message = 'Enter a non-empty value.';
                renderHyperLogLog();
                return;
            }
            state = addItem(value, state);
            renderHyperLogLog();
        };
        wrap.querySelector('[data-action="hll-clear"]').onclick = () => {
            state = makeState();
            state.message = 'Registers cleared.';
            renderHyperLogLog();
        };
    }

    if (global.VizRegistry) {
        global.VizRegistry.attach('hyperloglog', {
            render: renderHyperLogLog,
            code: () => codeHyperLogLog,
            layout: { host: 'dynamic' },
        });
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { M, hash32, bucketAndRank, estimate, makeState, addItem };
    }
})(typeof window !== 'undefined' ? window : globalThis);
