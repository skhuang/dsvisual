(function (global) {
    const K = () => global.VizKit; // resolved at call time (VizKit set at startup)

    let _bpeTrainState = null;
    function renderNanoBpeTrain() {
        const host = K().acquireDynamicVizHost();
        if (!_bpeTrainState) _bpeTrainState = { corpus: 'a,b,a,b,a,b,c', merges: 3 };
        const st = _bpeTrainState;
        const langOf = K().langOf;
        const corpus = st.corpus.split(',').map((s) => s.trim()).filter(Boolean);
        const frames = NanoBpeTrainViz.buildFrames(corpus, st.merges).frames;
        let idx = 0;
        host.innerHTML =
            '<div class="ss-controls">' +
              'corpus <input type="text" class="bt-corpus" value="' + st.corpus + '">' +
              'merges <input type="number" class="bt-merges" min="1" max="10" value="' + st.merges + '" style="width:56px">' +
              '<button type="button" class="bt-apply">Apply</button>' +
            '</div>' +
            '<div class="bt-symbols" data-testid="bt-symbols"></div>' +
            '<div class="bt-pairs" data-testid="bt-pairs"></div>' +
            '<div class="ss-phase bt-phase"></div>';
        function paint() {
            const fr = frames[idx];
            host.querySelector('.bt-symbols').innerHTML = fr.symbols.map((s) => '<span class="bt-sym">' + s + '</span>').join('');
            host.querySelector('.bt-pairs').innerHTML = (fr.pairCounts || []).slice(0, 8).map(([p, c]) =>
                '<span class="bt-pair' + (p === fr.top ? ' top' : '') + '">' + p + ' ×' + c + '</span>').join('');
            host.querySelector('.bt-phase').textContent = langOf(fr.msg);
        }
        function step() { if (idx < frames.length - 1) { idx++; paint(); return idx < frames.length - 1; } return false; }
        function reset() { idx = 0; paint(); }
        host.appendChild(K().buildStepControls(step, reset, 800));
        paint();
        host.querySelector('.bt-apply').onclick = () => {
            const c = host.querySelector('.bt-corpus').value;
            const m = parseInt(host.querySelector('.bt-merges').value, 10);
            if (c && Number.isFinite(m) && m >= 1) { st.corpus = c; st.merges = m; renderNanoBpeTrain(); }
        };
    }

    global.VizRegistry.attach('nano-bpe-train', {
        render: renderNanoBpeTrain,
        // NOTE: codeNanoBpeTrain is declared with `const` at the top level of the
        // classic (non-module) script js/code_db.js — a lexical global shared
        // across <script> tags but not attached to `window`. Must reference the
        // bare identifier, not `global.codeNanoBpeTrain` (always undefined).
        code: () => codeNanoBpeTrain,
        layout: { host: 'dynamic' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
