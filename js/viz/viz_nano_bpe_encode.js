(function (global) {
    const K = () => global.VizKit; // resolved at call time (VizKit set at startup)

    let _bpeEncState = null;
    function renderNanoBpeEncode() {
        const host = K().acquireDynamicVizHost();
        if (!_bpeEncState) _bpeEncState = { vocab: ['a','b','ab','abc','c'], input: 'aabcabx' };
        const st = _bpeEncState;
        const langOf = K().langOf;
        const frames = NanoBpeEncodeViz.buildFrames(st.vocab, st.input).frames;
        let idx = 0;
        host.innerHTML =
            '<div class="ss-controls">' +
              'vocab <input type="text" class="be-vocab" value="' + st.vocab.join(',') + '">' +
              'input <input type="text" class="be-input" value="' + st.input + '">' +
              '<button type="button" class="be-apply">Apply</button>' +
            '</div>' +
            '<div class="be-input-row" data-testid="be-input"></div>' +
            '<div class="be-tokens" data-testid="be-tokens"></div>' +
            '<div class="ss-phase be-phase"></div>';
        function paint() {
            const fr = frames[idx];
            host.querySelector('.be-input-row').innerHTML = st.input.split('').map((ch, i) => {
                let cls = 'be-ch';
                if (i >= fr.matchStart && i < fr.matchEnd) cls += ' match';
                if (i === fr.cursor) cls += ' cursor';
                return '<span class="' + cls + '">' + ch + '</span>';
            }).join('');
            host.querySelector('.be-tokens').innerHTML = fr.tokens.map((t) =>
                '<span class="be-token">' + t + '</span>').join('');
            host.querySelector('.be-phase').textContent = langOf(fr.msg);
        }
        function step() { if (idx < frames.length - 1) { idx++; paint(); return idx < frames.length - 1; } return false; }
        function reset() { idx = 0; paint(); }
        host.appendChild(K().buildStepControls(step, reset, 600));
        paint();
        host.querySelector('.be-apply').onclick = () => {
            const vocab = host.querySelector('.be-vocab').value.split(',').map((s) => s.trim()).filter(Boolean);
            const input = host.querySelector('.be-input').value.trim();
            if (vocab.length && input) { st.vocab = vocab; st.input = input; renderNanoBpeEncode(); }
        };
    }

    global.VizRegistry.attach('nano-bpe-encode', {
        render: renderNanoBpeEncode,
        // NOTE: codeNanoBpeEncode is declared with `const` at the top level of the
        // classic (non-module) script js/code_db.js — a lexical global shared
        // across <script> tags but not attached to `window`. Must reference the
        // bare identifier, not `global.codeNanoBpeEncode` (always undefined).
        code: () => codeNanoBpeEncode,
        layout: { host: 'dynamic' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
