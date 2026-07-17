(function (global) {
    const K = () => global.VizKit; // resolved at call time (VizKit set at startup)

    let _mazeState = null;
    function renderMazeStack() {
        const host = K().acquireDynamicVizHost();
        if (!_mazeState) _mazeState = { text: 'S....;.###.;.#...;.#.#.;...#E' };
        const st = _mazeState;
        const langOf = K().langOf;
        const maze = MazeViz.parseMaze(st.text);
        const res = MazeViz.buildMazeFrames(maze);
        const frames = res.frames;
        let idx = 0;

        host.innerHTML =
            '<div class="mz-controls"><input type="text" class="mz-input" value="' + st.text + '">' +
            '<button type="button" class="rand-btn" title="Random">🎲</button>' +
            '<button type="button" class="mz-apply">Apply</button>' +
            '<span class="sm-hint"># wall, . open, S start, E end; rows split by ;</span></div>' +
            '<div class="mz-cols"><div class="mz-grid"></div><div class="mz-stack"><strong>Path stack:</strong><div class="mz-stack-cells"></div></div></div>' +
            '<div class="mz-phase"></div>';

        function paint() {
            const fr = frames[idx];
            if (!host.querySelector('.mz-grid')) return;
            const inStack = new Set((fr.stack || []).map((p) => p[0] + ',' + p[1]));
            const inPath = new Set((fr.path || []).map((p) => p[0] + ',' + p[1]));
            const visited = new Set((fr.visited || []).map((p) => p[0] + ',' + p[1]));
            const cur = fr.current ? fr.current[0] + ',' + fr.current[1] : '';
            let html = '<table class="mz-tbl">';
            for (let r = 0; r < maze.grid.length; r++) {
                html += '<tr>';
                for (let c = 0; c < maze.grid[r].length; c++) {
                    const ch = maze.grid[r][c];
                    const k = r + ',' + c;
                    let cls = ch === '#' ? 'wall' : 'open';
                    if (ch === 'S') cls = 'start';
                    else if (ch === 'E') cls = 'end';
                    if (inPath.has(k)) cls += ' path';
                    else if (k === cur) cls += ' cur';
                    else if (inStack.has(k)) cls += ' instack';
                    else if (visited.has(k)) cls += ' visited';
                    html += '<td class="mz-cell ' + cls + '">' + (ch === '#' ? '' : (ch === 'S' || ch === 'E' ? ch : '')) + '</td>';
                }
                html += '</tr>';
            }
            html += '</table>';
            host.querySelector('.mz-grid').innerHTML = html;
            host.querySelector('.mz-stack-cells').innerHTML = (fr.stack || []).map((p) => '<span class="mz-scell">(' + p[0] + ',' + p[1] + ')</span>').join('');
            host.querySelector('.mz-phase').textContent = langOf(fr.msg);
        }
        function step() { if (idx < frames.length - 1) { idx++; paint(); return idx < frames.length - 1; } return false; }
        function reset() { idx = 0; paint(); }

        host.appendChild(K().buildStepControls(step, reset, 500));
        paint();
        host.querySelector('.mz-apply').onclick = () => { const v = host.querySelector('.mz-input').value.trim(); if (v) { st.text = v; renderMazeStack(); } };
        host.querySelector('.rand-btn').onclick = () => {
            const inp = window.RandomInput && RandomInput.randomInputFor('maze-stack', K().getInputDifficulty());
            if (!inp) return;
            _mazeState.text = inp.text;
            renderMazeStack();
        };
    }

    global.VizRegistry.attach('maze-stack', {
        render: renderMazeStack,
        code: () => codeMazeStack,
        layout: { host: 'dynamic' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
