(function (global) {
    const K = () => global.VizKit; // resolved at call time (VizKit set at startup)

    // SVG_NS was only ever used by renderMagicTorus, so it moves here wholesale
    // (not duplicated) rather than staying behind in app.js.
    const SVG_NS = 'http://www.w3.org/2000/svg';

    let _magicTorusState = null;
    function renderMagicTorus() {
        const host = K().acquireDynamicVizHost();
        if (!_magicTorusState) _magicTorusState = { n: 5, ghosts: true };
        const st = _magicTorusState;
        const langOf = K().langOf;
        const n = st.n;
        const res = MagicTorusViz.buildFrames(n);
        const frames = res.frames;
        const square = res.square;
        const path = res.path;
        const runs = res.runs;
        let idx = 0;

        const CS = 22; // cell size (SVG user units); viewBox scales it responsively
        const planeCells = 3 * n;
        const svgSize = planeCells * CS;

        host.innerHTML =
            '<div class="mt-wrap">' +
                '<div class="mt-controls">' +
                    '<label>n <select class="mt-order">' +
                        [3, 5, 7].map((v) => '<option value="' + v + '"' + (v === n ? ' selected' : '') + '>' + v + '</option>').join('') +
                    '</select></label>' +
                    '<button type="button" class="mt-apply">Apply</button>' +
                    '<label class="mt-ghost-toggle"><input type="checkbox" class="mt-ghost-cb"' + (st.ghosts ? ' checked' : '') + '> ghost tiles</label>' +
                    '<span class="mt-runs">runs = ' + runs + '</span>' +
                '</div>' +
                '<div class="mt-legend">' +
                    '<span class="mt-legend-run">&mdash; run step (&minus;1,&minus;1)</span>' +
                    '<span class="mt-legend-break">&#8901;&#8901;&#8901; break step (+1,0)</span>' +
                '</div>' +
                '<div class="mt-plane-wrap"><svg class="mt-plane" data-testid="mt-plane" viewBox="0 0 ' + svgSize + ' ' + svgSize + '"></svg></div>' +
                '<div class="mt-phase"></div>' +
                '<div class="mt-readout" data-testid="mt-readout"></div>' +
            '</div>';

        const order = host.querySelector('.mt-order');
        const svg = host.querySelector('.mt-plane');
        const ghostCb = host.querySelector('.mt-ghost-cb');

        function svgEl(tag, attrs) {
            const el = document.createElementNS(SVG_NS, tag);
            for (const k in attrs) el.setAttribute(k, attrs[k]);
            return el;
        }

        function paint() {
            const fr = frames[idx];
            const revealed = fr.phase === 'fill' ? fr.index + 1 : (fr.phase === 'done' ? n * n : 0);
            const showGhosts = ghostCb.checked;
            while (svg.firstChild) svg.removeChild(svg.firstChild);

            // 3x3 tiled board: center tile is the real board, 8 ghost copies around it.
            for (let tr = 0; tr < 3; tr++) {
                for (let tc = 0; tc < 3; tc++) {
                    const isCenter = tr === 1 && tc === 1;
                    if (!isCenter && !showGhosts) continue;
                    const g = svgEl('g', { class: isCenter ? 'mt-tile-center' : 'mt-tile-ghost' });
                    for (let r = 0; r < n; r++) {
                        for (let c = 0; c < n; c++) {
                            const v = square[r][c];
                            const cx = (tc * n + c) * CS, cy = (tr * n + r) * CS;
                            g.appendChild(svgEl('rect', { x: cx, y: cy, width: CS, height: CS, class: 'mt-cell' }));
                            if (v <= revealed) {
                                const t = svgEl('text', { x: cx + CS / 2, y: cy + CS / 2, class: 'mt-num' });
                                t.textContent = v;
                                g.appendChild(t);
                            }
                        }
                    }
                    g.appendChild(svgEl('rect', { x: tc * n * CS, y: tr * n * CS, width: n * CS, height: n * CS, class: 'mt-tile-border' }));
                    svg.appendChild(g);
                }
            }

            // Path polyline through path[0..revealed-1] via plane coords: run segments solid, break segments dashed.
            // When ghosts are hidden, clip the path to the center tile's rect so no segment floats over blank
            // background where the (now-invisible) ghost tiles used to be.
            const pathGroup = svgEl('g', { class: 'mt-path-group' });
            if (!showGhosts) {
                const defs = svgEl('defs', {});
                const clip = svgEl('clipPath', { id: 'mt-clip-center' });
                clip.appendChild(svgEl('rect', { x: n * CS, y: n * CS, width: n * CS, height: n * CS }));
                defs.appendChild(clip);
                svg.appendChild(defs);
                pathGroup.setAttribute('clip-path', 'url(#mt-clip-center)');
            }
            for (let i = 1; i < revealed; i++) {
                const a = path[i - 1], b = path[i];
                pathGroup.appendChild(svgEl('line', {
                    x1: a.planeX * CS + CS / 2, y1: a.planeY * CS + CS / 2,
                    x2: b.planeX * CS + CS / 2, y2: b.planeY * CS + CS / 2,
                    class: 'mt-path-seg ' + (b.stepType === 'break' ? 'mt-seg-break' : 'mt-seg-run'),
                }));
            }
            svg.appendChild(pathGroup);

            // Current cell lit in the center tile and (optionally) all 8 ghost copies.
            if (fr.phase === 'fill') {
                const cell = fr.cell;
                for (let tr = 0; tr < 3; tr++) {
                    for (let tc = 0; tc < 3; tc++) {
                        const isCenter = tr === 1 && tc === 1;
                        if (!isCenter && !showGhosts) continue;
                        const cx = (tc * n + cell.col) * CS, cy = (tr * n + cell.row) * CS;
                        svg.appendChild(svgEl('rect', {
                            x: cx, y: cy, width: CS, height: CS,
                            class: 'mt-current' + (isCenter ? ' mt-current-center' : ' mt-current-ghost'),
                        }));
                    }
                }
            }

            host.querySelector('.mt-phase').textContent = langOf(fr.msg);
            const readout = fr.phase === 'fill'
                ? '#' + fr.cell.v + ' (' + fr.cell.row + ',' + fr.cell.col + ')  plane(' + fr.cell.planeX + ',' + fr.cell.planeY + ')  run ' + (fr.cell.runIndex + 1) + '/' + runs
                : (fr.phase === 'done' ? runs + ' runs, ' + (runs - 1) + ' breaks' : 'ready — n² = ' + (n * n) + ' cells');
            host.querySelector('[data-testid="mt-readout"]').textContent = readout;
        }

        function step() {
            if (idx < frames.length - 1) {
                idx++;
                paint();
                return idx < frames.length - 1;
            }
            return false;
        }
        function reset() {
            idx = 0;
            paint();
        }

        host.querySelector('.mt-wrap').appendChild(K().buildStepControls(step, reset, 400));
        order.onchange = () => {
            const val = parseInt(order.value, 10);
            if ([3, 5, 7].indexOf(val) >= 0) { _magicTorusState.n = val; renderMagicTorus(); }
        };
        host.querySelector('.mt-apply').onclick = () => {
            const val = parseInt(order.value, 10);
            if ([3, 5, 7].indexOf(val) >= 0) { _magicTorusState.n = val; renderMagicTorus(); }
        };
        ghostCb.onchange = () => { _magicTorusState.ghosts = ghostCb.checked; paint(); };
        paint();
    }

    global.VizRegistry.attach('magic-torus', {
        render: renderMagicTorus,
        // NOTE: codeMagicTorus is declared with `const` at the top level of the
        // classic (non-module) script js/code_db.js — a lexical global shared
        // across <script> tags but not attached to `window`. Must reference the
        // bare identifier, not `global.codeMagicTorus` (always undefined).
        code: () => codeMagicTorus,
        layout: { host: 'dynamic' },
    });
})(typeof window !== 'undefined' ? window : globalThis);
