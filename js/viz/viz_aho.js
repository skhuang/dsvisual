(function (global) {
    const K = () => global.VizKit; // resolved at call time (VizKit set at startup)

    function renderAhoCorasick() {
        const host = K().acquireDynamicVizHost();
        // Fixed trie for patterns {he, she, his, hers}.
        const nodes = [
            { id: 0, ch: '', x: 180, y: 30, parent: -1 },
            { id: 1, ch: 'h', x: 110, y: 95, parent: 0 },
            { id: 2, ch: 'e', x: 70, y: 160, parent: 1 },
            { id: 3, ch: 'r', x: 70, y: 225, parent: 2 },
            { id: 4, ch: 's', x: 70, y: 290, parent: 3 },
            { id: 5, ch: 'i', x: 150, y: 160, parent: 1 },
            { id: 6, ch: 's', x: 150, y: 225, parent: 5 },
            { id: 7, ch: 's', x: 250, y: 95, parent: 0 },
            { id: 8, ch: 'h', x: 250, y: 160, parent: 7 },
            { id: 9, ch: 'e', x: 250, y: 225, parent: 8 },
        ];
        const output = { 2: 'he', 4: 'hers', 6: 'his', 9: 'she' };
        // Failure links in BFS computation order (one per non-root node).
        const failSteps = [
            { node: 1, fail: 0 }, { node: 7, fail: 0 }, { node: 2, fail: 0 }, { node: 5, fail: 0 },
            { node: 8, fail: 1 }, { node: 3, fail: 0 }, { node: 6, fail: 7 }, { node: 9, fail: 2 },
            { node: 4, fail: 7 },
        ];
        const text = 'ushers';
        // Scan trace: automaton node after reading each char, and matches reported.
        const scanSteps = [
            { node: 0, matches: [] },
            { node: 7, matches: [] },
            { node: 8, matches: [] },
            { node: 9, matches: ['she@1', 'he@2'] },
            { node: 3, matches: [] },
            { node: 4, matches: ['hers@2'] },
        ];
        const TOTAL = failSteps.length + 1 + scanSteps.length;
        let idx = 0;

        const wrap = document.createElement('div');
        wrap.className = 'aho-wrap';
        wrap.innerHTML =
            '<div class="aho-phase" data-testid="aho-phase"></div>' +
            '<svg class="aho-svg" viewBox="0 0 320 320" width="100%" xmlns="http://www.w3.org/2000/svg"></svg>' +
            '<div class="aho-textrow"></div>' +
            '<div class="aho-stats" data-testid="aho-stats">matches: <span class="aho-matches">[]</span></div>';
        host.appendChild(wrap);
        const svgEl = wrap.querySelector('.aho-svg');
        const phaseEl = wrap.querySelector('.aho-phase');
        const textRowEl = wrap.querySelector('.aho-textrow');
        const matchesEl = wrap.querySelector('.aho-matches');

        function nodeById(id) { return nodes.find((n) => n.id === id); }

        function draw() {
            const inBuild = idx <= failSteps.length;
            const builtCount = inBuild ? idx : failSteps.length;
            let curScanNode = -1;
            let allMatches = [];
            if (!inBuild) {
                const sIdx = idx - failSteps.length - 1;
                for (let k = 0; k <= sIdx && k < scanSteps.length; k++) {
                    curScanNode = scanSteps[k].node;
                    allMatches = allMatches.concat(scanSteps[k].matches);
                }
            }
            let svg = '';
            for (const n of nodes) {
                if (n.parent >= 0) {
                    const p = nodeById(n.parent);
                    svg += '<line x1="' + p.x + '" y1="' + p.y + '" x2="' + n.x + '" y2="' + n.y +
                           '" stroke="#94a3b8" stroke-width="2"/>';
                }
            }
            for (let k = 0; k < builtCount; k++) {
                const fs = failSteps[k];
                const a = nodeById(fs.node), b = nodeById(fs.fail);
                svg += '<line x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y +
                       '" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="4 3"/>';
            }
            for (const n of nodes) {
                const isBuildCur = inBuild && failSteps[idx] && n.id === failSteps[idx].node;
                const isCur = (!inBuild && n.id === curScanNode) || isBuildCur;
                const hasOut = output[n.id] !== undefined;
                svg += '<circle cx="' + n.x + '" cy="' + n.y + '" r="16" fill="' +
                       (isCur ? '#34d399' : (hasOut ? '#dbeafe' : '#fff')) +
                       '" stroke="#1e40af" stroke-width="2" data-node="' + n.id + '"/>';
                svg += '<text x="' + n.x + '" y="' + (n.y + 5) + '" text-anchor="middle" font-size="13" ' +
                       'font-weight="700">' + (n.ch || '·') + '</text>';
            }
            svgEl.innerHTML = svg;

            const scanPos = inBuild ? -1 : (idx - failSteps.length - 1);
            let tr = '';
            for (let k = 0; k < text.length; k++) {
                tr += '<span class="aho-char' + (k === scanPos ? ' aho-char-cur' : '') + '">' + text[k] + '</span>';
            }
            textRowEl.innerHTML = tr;

            phaseEl.textContent = inBuild
                ? 'Phase 1: Building failure links (' + builtCount + '/' + failSteps.length + ')'
                : 'Phase 2: Scanning text (' + (idx - failSteps.length) + '/' + text.length + ')';
            matchesEl.textContent = '[' + allMatches.join(', ') + ']';
        }
        function step() {
            if (idx >= TOTAL) return false;
            idx++;
            draw();
            return idx < TOTAL;
        }
        function reset() { idx = 0; draw(); }
        wrap.appendChild(K().buildStepControls(step, reset, 500));
        draw();
    }

    global.VizRegistry.attach('search-aho', {
        render: renderAhoCorasick,
        code: () => codeSearchAho,
        layout: { host: 'dynamic' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
