(function (global) {
    const K = () => global.VizKit; // resolved at call time (VizKit set at startup)

    let _exprState = null;
    function renderExprInfixPostfix() {
        const host = K().acquireDynamicVizHost();
        if (!_exprState) _exprState = { text: 'A*(B+C)*D' };
        const st = _exprState;
        const langOf = K().langOf;
        let frames = [], postfix = [];
        try {
            const tokens = ExprViz.tokenize(st.text);
            const conv = ExprViz.buildShuntingYardFrames(tokens);
            postfix = conv.postfix;
            const evalRes = ExprViz.buildPostfixEvalFrames(postfix);
            frames = conv.frames.concat(evalRes.frames);
        } catch (e) {
            host.innerHTML = '<div class="expr-controls"><input type="text" class="expr-input"><button type="button" class="expr-apply">Apply</button></div>' +
                '<div class="expr-error" style="color:#dc2626;margin-top:8px;"></div>';
            host.querySelector('.expr-input').value = st.text;
            host.querySelector('.expr-error').textContent = 'Parse error: ' + e.message;
            host.querySelector('.expr-apply').onclick = () => { st.text = host.querySelector('.expr-input').value; renderExprInfixPostfix(); };
            return;
        }
        let idx = 0;

        host.innerHTML =
            '<div class="expr-controls"><input type="text" class="expr-input"><button type="button" class="rand-btn" title="Random">🎲</button><button type="button" class="expr-apply">Apply</button></div>' +
            '<div class="expr-phasebadge"></div>' +
            '<div class="expr-stack"><strong>Stack:</strong> <span class="expr-stack-cells"></span></div>' +
            '<div class="expr-out"><strong>Output:</strong> <span class="expr-out-cells"></span></div>' +
            '<div class="expr-phase"></div>';
        host.querySelector('.expr-input').value = st.text;

        function paint() {
            const fr = frames[idx];
            if (!host.querySelector('.expr-stack-cells')) return;
            host.querySelector('.expr-phasebadge').textContent = fr.phase === 'convert'
                ? 'Phase 1 — Convert (postfix: ' + postfix.join(' ') + ')'
                : 'Phase 2 — Evaluate';
            const stackArr = fr.phase === 'convert' ? fr.opStack : fr.valStack;
            const outArr = fr.phase === 'convert' ? fr.output : [];
            host.querySelector('.expr-stack-cells').innerHTML = stackArr.map((v) => '<span class="expr-cell">' + v + '</span>').join('');
            host.querySelector('.expr-out-cells').innerHTML = outArr.map((v) => '<span class="expr-cell out">' + v + '</span>').join('');
            host.querySelector('.expr-phase').textContent = (fr.token ? '[' + fr.token + '] ' : '') + langOf(fr.msg);
        }
        function step() { if (idx < frames.length - 1) { idx++; paint(); return idx < frames.length - 1; } return false; }
        function reset() { idx = 0; paint(); }

        host.appendChild(K().buildStepControls(step, reset, 700));
        paint();
        host.querySelector('.expr-apply').onclick = () => { st.text = host.querySelector('.expr-input').value; renderExprInfixPostfix(); };
        host.querySelector('.rand-btn').onclick = () => {
            const inp = window.RandomInput && RandomInput.randomInputFor('expr-infix-postfix', K().getInputDifficulty());
            if (!inp) return;
            _exprState.text = inp.text;
            renderExprInfixPostfix();
        };
    }

    global.VizRegistry.attach('expr-infix-postfix', {
        render: renderExprInfixPostfix,
        code: () => codeExprInfixPostfix,
        layout: { host: 'dynamic' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
