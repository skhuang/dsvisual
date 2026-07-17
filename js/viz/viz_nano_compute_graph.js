(function (global) {
    const K = () => global.VizKit; // resolved at call time (VizKit set at startup)

    let _cgState = null;
    function renderNanoComputeGraph() {
        const host = K().acquireDynamicVizHost();
        if (!_cgState) _cgState = { preset: 'mul-add' };
        const presets = {
            'mul-add': { nodes: [ {id:'a',op:'const',val:2}, {id:'b',op:'const',val:3}, {id:'m',op:'mul'}, {id:'c',op:'const',val:4}, {id:'s',op:'add'} ],
                         edges: [ ['a','m'],['b','m'],['m','s'],['c','s'] ] },
        };
        const langOf = K().langOf;
        const frames = NanoComputeGraphViz.buildFrames(presets[_cgState.preset]).frames;
        const nodes = presets[_cgState.preset].nodes;
        let idx = 0;
        host.innerHTML =
            '<div class="cg-nodes" data-testid="cg-nodes"></div>' +
            '<div class="cg-order" data-testid="cg-order"></div>' +
            '<div class="ss-phase cg-phase"></div>';
        function paint() {
            const fr = frames[idx];
            host.querySelector('.cg-nodes').innerHTML = nodes.map((n) => {
                let cls = 'cg-node';
                if (fr.evaluated.indexOf(n.id) >= 0) cls += ' done';
                if (n.id === fr.active) cls += ' active';
                const v = (fr.values[n.id] != null) ? ' = ' + fr.values[n.id] : '';
                return '<span class="' + cls + '">' + n.id + ':' + n.op + v + '</span>';
            }).join('');
            host.querySelector('.cg-order').textContent = 'topo: ' + fr.order.join(' → ');
            host.querySelector('.cg-phase').textContent = langOf(fr.msg);
        }
        function step() { if (idx < frames.length - 1) { idx++; paint(); return idx < frames.length - 1; } return false; }
        function reset() { idx = 0; paint(); }
        host.appendChild(K().buildStepControls(step, reset, 700));
        paint();
    }

    global.VizRegistry.attach('nano-compute-graph', {
        render: renderNanoComputeGraph,
        // NOTE: codeNanoComputeGraph is declared with `const` at the top level of the
        // classic (non-module) script js/code_db.js — a lexical global shared
        // across <script> tags but not attached to `window`. Must reference the
        // bare identifier, not `global.codeNanoComputeGraph` (always undefined).
        code: () => codeNanoComputeGraph,
        layout: { host: 'dynamic' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
