(function (global) {
    const K = () => global.VizKit; // resolved at call time (VizKit set at startup)

    const SIZE = 32;

    // NOTE: showStatus is a stateless shared helper (writes to the #status-message
    // element) also used by many renderers still in js/app.js. Duplicated here
    // privately rather than shared, per the extraction recipe.
    function showStatus(msg, color) {
        const el = document.getElementById('status-message');
        if (el) { el.textContent = msg; el.style.color = color; }
    }

    let _bloomState = null;

    // Fresh random short lowercase word for [data-bloom-val] — mirrors linear.js's
    // randStdValue()/tree.js's randKey() idiom, adapted for a text field.
    function randWord() {
        const alpha = 'abcdefghijklmnopqrstuvwxyz';
        const len = 3 + Math.floor(Math.random() * 3); // 3..5 chars
        let s = '';
        for (let i = 0; i < len; i++) s += alpha[Math.floor(Math.random() * alpha.length)];
        return s;
    }

    function h1(s) { let h = 5381; for (const c of s) h = (h * 33 + c.charCodeAt(0)) >>> 0; return h % SIZE; }
    function h2(s) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h % SIZE; }
    function h3(s) { let h = 7; for (const c of s) h = (h * 17 + c.charCodeAt(0) + 1) >>> 0; return h % SIZE; }
    function hashes(s) { return [h1(s), h2(s), h3(s)]; }

    // Frame builders. Both walk the k hash probes one at a time so the VCR transport
    // can show each probe separately — the insert path is what sets a bit, and the
    // query path is where a false positive becomes visible (every probed bit is 1,
    // but each was set by some *other* word; `owners` carries that attribution).
    //
    // Pure functions over a plain state object: no DOM here, so tests/unit can call
    // them directly (see module.exports at the bottom).

    function probeFrames(key, bits, owners, mode) {
        const idxs = hashes(key);
        const frames = [];
        const seen = [];
        frames.push({
            phase: 'start', key, mode, bit: -1, probe: -1, idxs,
            bits: bits.slice(), owners: owners.map((o) => o.slice()), seen: seen.slice(),
            message: mode === 'insert'
                ? { zh: '插入 "' + key + '":依序計算 ' + idxs.length + ' 個雜湊值', en: 'Insert "' + key + '": compute ' + idxs.length + ' hashes in turn' }
                : { zh: '查詢 "' + key + '":逐一檢查 ' + idxs.length + ' 個 bit', en: 'Query "' + key + '": check ' + idxs.length + ' bits one by one' },
        });
        for (let p = 0; p < idxs.length; p++) {
            const bit = idxs[p];
            const was = bits[bit];
            seen.push(bit);
            if (mode === 'insert') {
                bits[bit] = true;
                if (!owners[bit].includes(key)) owners[bit].push(key);
                frames.push({
                    phase: 'set', key, mode, bit, probe: p, idxs, was,
                    bits: bits.slice(), owners: owners.map((o) => o.slice()), seen: seen.slice(),
                    message: was
                        ? { zh: 'h' + (p + 1) + '("' + key + '") = ' + bit + ' — 已經是 1,維持不變', en: 'h' + (p + 1) + '("' + key + '") = ' + bit + ' — already 1, unchanged' }
                        : { zh: 'h' + (p + 1) + '("' + key + '") = ' + bit + ' — 設為 1', en: 'h' + (p + 1) + '("' + key + '") = ' + bit + ' — set to 1' },
                });
            } else {
                frames.push({
                    phase: was ? 'hit' : 'miss', key, mode, bit, probe: p, idxs, was,
                    bits: bits.slice(), owners: owners.map((o) => o.slice()), seen: seen.slice(),
                    message: was
                        ? { zh: 'h' + (p + 1) + '("' + key + '") = ' + bit + ' — 該 bit 是 1,繼續檢查', en: 'h' + (p + 1) + '("' + key + '") = ' + bit + ' — bit is 1, keep checking' }
                        : { zh: 'h' + (p + 1) + '("' + key + '") = ' + bit + ' — 該 bit 是 0', en: 'h' + (p + 1) + '("' + key + '") = ' + bit + ' — bit is 0' },
                });
                // A single 0 is conclusive: Bloom filters never yield false negatives,
                // so stop probing the moment one misses.
                if (!was) break;
            }
        }
        return { frames, idxs };
    }

    function buildInsertFrames(key, bits, owners) {
        const r = probeFrames(key, bits, owners, 'insert');
        r.frames.push({
            phase: 'done', key, mode: 'insert', bit: -1, probe: -1, idxs: r.idxs,
            bits: bits.slice(), owners: owners.map((o) => o.slice()), seen: r.idxs.slice(),
            present: true,
            message: { zh: '"' + key + '" 已插入 → bits {' + r.idxs.join(', ') + '}', en: 'Inserted "' + key + '" -> bits {' + r.idxs.join(', ') + '}' },
        });
        return r.frames;
    }

    function buildQueryFrames(key, bits, owners) {
        const r = probeFrames(key, bits, owners, 'query');
        const present = r.idxs.every((i) => bits[i]);
        // Attribution for the final verdict: which previously-inserted words set the
        // probed bits. When none of them is `key` itself, this is a false positive.
        const setters = [];
        for (const i of r.idxs) for (const w of owners[i]) if (!setters.includes(w)) setters.push(w);
        const falsePositive = present && !setters.includes(key);
        r.frames.push({
            phase: 'done', key, mode: 'query', bit: -1, probe: -1, idxs: r.idxs,
            bits: bits.slice(), owners: owners.map((o) => o.slice()), seen: r.idxs.slice(),
            present, falsePositive, setters,
            message: !present
                ? { zh: '有 bit 是 0 → "' + key + '" 一定不存在', en: 'A bit is 0 -> "' + key + '" is definitely not present' }
                : (falsePositive
                    ? { zh: '所有 bit 都是 1,但它們是由 ' + setters.join(', ') + ' 設起來的 → 偽陽性!', en: 'All bits are 1, but they were set by ' + setters.join(', ') + ' -> false positive!' }
                    : { zh: '所有 bit 都是 1 → "' + key + '" 可能存在', en: 'All bits are 1 -> "' + key + '" is possibly present' }),
        });
        return r.frames;
    }

    function renderBloomFilter() {
        const host = K().acquireDynamicVizHost();

        if (!_bloomState) {
            _bloomState = {
                bits: new Array(SIZE).fill(false),
                owners: Array.from({ length: SIZE }, () => []),
                items: [],
                inputVal: randWord(),
                frames: null,
            };
            for (const w of ['cat', 'dog', 'bird']) {
                for (const i of hashes(w)) {
                    _bloomState.bits[i] = true;
                    _bloomState.owners[i].push(w);
                }
                _bloomState.items.push(w);
            }
        }
        const bits = _bloomState.bits;
        const owners = _bloomState.owners;
        const items = _bloomState.items;
        const savedVal = _bloomState.inputVal || 'fish';

        const wrap = document.createElement('div');
        wrap.className = 'bloom-wrap';
        let html = '<div class="bloom-row">';
        for (let i = 0; i < SIZE; i++) {
            html += '<span class="bloom-cell' + (bits[i] ? ' bloom-on' : '') +
                    '" data-bit="' + i + '">' + (bits[i] ? 1 : 0) + '</span>';
        }
        html += '</div>';
        html += '<div class="bloom-hashes" data-testid="bloom-hashes"></div>';
        html += '<div class="bloom-note" data-testid="bloom-note"></div>';
        html += '<div class="bloom-items"><strong>inserted:</strong> <span class="bloom-items-list"></span></div>';
        html += '<div class="bloom-steps"></div>';
        html += '<div class="bloom-controls" role="group">' +
                    '<input type="text" data-bloom-val>' +
                    '<button type="button" class="rand-btn" title="' + K().t('btn.random-input') + '">🎲</button>' +
                    '<button type="button" data-action="bloom-insert">Insert</button>' +
                    '<button type="button" data-action="bloom-query">Query</button>' +
                '</div>';
        wrap.innerHTML = html;
        host.appendChild(wrap);

        const valInput = wrap.querySelector('[data-bloom-val]');
        valInput.value = savedVal;
        wrap.querySelector('.bloom-items-list').textContent = items.join(', ');
        const hashesEl = wrap.querySelector('.bloom-hashes');
        const noteEl = wrap.querySelector('.bloom-note');
        const stepsEl = wrap.querySelector('.bloom-steps');
        valInput.addEventListener('input', () => { _bloomState.inputVal = valInput.value.trim(); });

        // paint() is the only DOM writer for a frame: it restores the whole bit row
        // from frame.bits, then marks the probe cursor. Repainting from the frame
        // (rather than mutating incrementally) is what makes scrubbing backwards work.
        function paint(frame) {
            wrap.querySelectorAll('.bloom-cell').forEach((cell) => {
                const i = parseInt(cell.getAttribute('data-bit'), 10);
                cell.classList.remove('bloom-hit', 'bloom-miss', 'bloom-probe');
                cell.classList.toggle('bloom-on', !!frame.bits[i]);
                cell.textContent = frame.bits[i] ? 1 : 0;
            });
            const paintCell = (i, cls) => {
                const cell = wrap.querySelector('.bloom-cell[data-bit="' + i + '"]');
                if (cell) cell.classList.add(cls);
            };
            // Cells probed so far keep a hit/miss tint; the current one also gets the cursor.
            for (const i of frame.seen) paintCell(i, frame.bits[i] ? 'bloom-hit' : 'bloom-miss');
            if (frame.phase === 'done' && frame.mode === 'query' && !frame.present) {
                for (const i of frame.seen) if (!frame.bits[i]) paintCell(i, 'bloom-miss');
            }
            if (frame.bit >= 0) paintCell(frame.bit, 'bloom-probe');

            hashesEl.textContent = 'hashes of "' + frame.key + '" → {' + frame.idxs.join(', ') + '}';
            noteEl.textContent = K().langOf(frame.message);
            // Attribution: who set the bit currently under the cursor.
            if (frame.bit >= 0 && frame.owners[frame.bit].length) {
                noteEl.textContent += '  ·  bit ' + frame.bit + ' ← ' + frame.owners[frame.bit].join(', ');
            }
            noteEl.classList.toggle('bloom-note-fp', !!frame.falsePositive);
        }

        // Re-attach the transport for the most recent run so a re-render (which happens
        // after every insert) does not drop the stepper.
        if (_bloomState.frames && _bloomState.frames.length) {
            stepsEl.appendChild(K().buildFrameControls(_bloomState.frames, paint, {
                runIntervalMs: 620,
                initialIndex: _bloomState.frames.length - 1,
            }));
        }

        function runFrames(frames) {
            _bloomState.frames = frames;
            renderBloomFilter();
        }

        wrap.querySelector('[data-action="bloom-insert"]').onclick = () => {
            const key = valInput.value.trim();
            if (!key) { showStatus('Enter a word', '#f87171'); return; }
            const frames = buildInsertFrames(key, bits, owners);
            if (!items.includes(key)) items.push(key);
            // Refill with a fresh random word after a successful insert, rather than
            // leaving the just-inserted word sitting in the field.
            _bloomState.inputVal = randWord();
            runFrames(frames);
            showStatus('Inserted "' + key + '" → bits {' + hashes(key).join(', ') + '}', '#34d399');
        };
        wrap.querySelector('.rand-btn').onclick = () => {
            const difficulty = (global.VizKit && global.VizKit.getInputDifficulty) ? global.VizKit.getInputDifficulty() : 'normal';
            const r = global.RandomInput && global.RandomInput.randomInputFor('bloom-filter', difficulty);
            if (!r || !Array.isArray(r.items) || !r.items.length) return;
            _bloomState = {
                bits: new Array(SIZE).fill(false),
                owners: Array.from({ length: SIZE }, () => []),
                items: [],
                inputVal: r.query || 'fish',
                frames: null,
            };
            for (const w of r.items) {
                for (const i of hashes(w)) {
                    _bloomState.bits[i] = true;
                    _bloomState.owners[i].push(w);
                }
                _bloomState.items.push(w);
            }
            renderBloomFilter();
            showStatus('Randomized ' + r.items.length + ' item(s)', '#34d399');
        };
        wrap.querySelector('[data-action="bloom-query"]').onclick = () => {
            const key = valInput.value.trim();
            if (!key) { showStatus('Enter a word', '#f87171'); return; }
            _bloomState.inputVal = key;
            const present = hashes(key).every((i) => bits[i]);
            runFrames(buildQueryFrames(key, bits, owners));
            if (present) showStatus('"' + key + '" possibly present', '#f59e0b');
            else showStatus('"' + key + '" definitely not present', '#60a5fa');
        };
    }

    if (global.VizRegistry) {
        global.VizRegistry.attach('bloom-filter', {
            render: renderBloomFilter,
            code: () => codeBloomFilter,
            layout: { host: 'dynamic' },
        });
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { hashes, buildInsertFrames, buildQueryFrames, SIZE };
    }
})(typeof window !== 'undefined' ? window : globalThis);
