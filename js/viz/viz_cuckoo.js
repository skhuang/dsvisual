(function (global) {
    const K = () => global.VizKit;
    const SIZE = 11;
    const MAX_KICKS = SIZE * 2;
    let state = null;

    function mod(n, m) { return ((n % m) + m) % m; }
    function h1(key) { return mod(key, SIZE); }
    function h2(key) { return mod(key * 7 + 3, SIZE); }
    function emptyTable() { return new Array(SIZE).fill(null); }
    function makeState() { return { tables: [emptyTable(), emptyTable()], trace: 'Ready: insert an integer.', query: '' }; }

    // Work on copies. If a relocation cycle is detected, the visible table is
    // deliberately left unchanged: a real implementation would grow/rehash.
    function insert(key, tables) {
        if (tables[0].includes(key) || tables[1].includes(key)) {
            return { ok: true, tables, trace: key + ' is already stored.', path: [] };
        }
        const next = [tables[0].slice(), tables[1].slice()];
        const path = [];
        let value = key;
        let table = 0;
        for (let kick = 0; kick < MAX_KICKS; kick++) {
            const slot = table === 0 ? h1(value) : h2(value);
            const old = next[table][slot];
            next[table][slot] = value;
            path.push({ table, slot, value, old });
            if (old === null) {
                return { ok: true, tables: next, path,
                    trace: path.length === 1
                        ? 'Placed ' + value + ' in T' + (table + 1) + '[' + slot + '].'
                        : 'Placed ' + value + ' after ' + (path.length - 1) + ' kick(s): ' + path.map((p) => 'T' + (p.table + 1) + '[' + p.slot + ']').join(' → ') };
            }
            value = old;
            table = 1 - table;
        }
        return { ok: false, tables, path,
            trace: 'Relocation cycle detected while inserting ' + key + '. A real cuckoo hash table now rehashes; this demo kept the previous table.' };
    }

    function find(key, tables) {
        const a = h1(key), b = h2(key);
        return { a, b, found: tables[0][a] === key || tables[1][b] === key };
    }

    function renderCuckoo() {
        const host = K().acquireDynamicVizHost();
        if (!state) state = makeState();
        const wrap = document.createElement('div');
        wrap.className = 'cuckoo-wrap';
        const tableHtml = (table) => state.tables[table].map((value, i) =>
            '<div class="cuckoo-cell" data-testid="cuckoo-cell" data-table="' + table + '" data-index="' + i + '">' +
                '<span class="cuckoo-index">' + i + '</span><strong>' + (value === null ? '·' : value) + '</strong></div>').join('');
        wrap.innerHTML =
            '<div class="cuckoo-explain">Two hash choices per key: h₁(x) = x mod 11, h₂(x) = (7x + 3) mod 11. A collision kicks the old key to its other table.</div>' +
            '<div class="cuckoo-tables">' +
              '<section><h4>Table 1 · h₁</h4><div class="cuckoo-row">' + tableHtml(0) + '</div></section>' +
              '<section><h4>Table 2 · h₂</h4><div class="cuckoo-row">' + tableHtml(1) + '</div></section>' +
            '</div>' +
            '<div class="cuckoo-controls" role="group" aria-label="Cuckoo hashing controls">' +
              '<label>Key <input type="number" data-testid="cuckoo-key" value="' + (state.query || '') + '"></label>' +
              '<button type="button" class="btn primary" data-action="cuckoo-insert">Insert</button>' +
              '<button type="button" class="btn secondary" data-action="cuckoo-search">Search</button>' +
              '<button type="button" class="btn secondary" data-action="cuckoo-clear">Clear</button>' +
            '</div>' +
            '<div class="cuckoo-trace" data-testid="cuckoo-trace" role="status">' + state.trace + '</div>';
        host.appendChild(wrap);

        const input = wrap.querySelector('[data-testid="cuckoo-key"]');
        function keyOrError() {
            const key = Number(input.value);
            if (!Number.isSafeInteger(key)) {
                state.trace = 'Please enter one safe integer key.';
                renderCuckoo();
                return null;
            }
            state.query = String(key);
            return key;
        }
        wrap.querySelector('[data-action="cuckoo-insert"]').onclick = () => {
            const key = keyOrError();
            if (key === null) return;
            const result = insert(key, state.tables);
            state.tables = result.tables;
            state.trace = result.trace;
            renderCuckoo();
        };
        wrap.querySelector('[data-action="cuckoo-search"]').onclick = () => {
            const key = keyOrError();
            if (key === null) return;
            const result = find(key, state.tables);
            state.trace = 'Check T1[' + result.a + '] and T2[' + result.b + '] → ' + (result.found ? key + ' found.' : key + ' is not present.');
            renderCuckoo();
        };
        wrap.querySelector('[data-action="cuckoo-clear"]').onclick = () => {
            state = makeState();
            state.trace = 'Tables cleared.';
            renderCuckoo();
        };
    }

    if (global.VizRegistry) {
        global.VizRegistry.attach('hash-cuckoo', {
            render: renderCuckoo,
            code: () => codeCuckooHash,
            layout: { host: 'dynamic' },
        });
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { SIZE, h1, h2, insert, find };
    }
})(typeof window !== 'undefined' ? window : globalThis);
