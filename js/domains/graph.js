(function (global) {
  const K = () => global.VizKit;
  const C = () => global.VizCore;
  const R = () => global.VizRegistry;

  // Default = the graph's original hardcoded 4x4 distance matrix, re-expressed as
  // a directed weighted edge-list (A-D ≅ the old row/col 0-3) so the default
  // render — including tests/visualizer.spec.js's "16 cells / 'initial' / 'k = 0'"
  // assertions — stays byte-identical while making the input genuinely editable.
  const FLOYD_DEFAULT_TEXT = 'A-B:3,B-C:2,C-D:1,D-A:2,A-D:7,B-A:8,C-A:5';
  const _floydState = { text: FLOYD_DEFAULT_TEXT, directed: true };

  function floydEscAttr(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;'); }

  function renderFloydWarshall() {
    const host = K().acquireDynamicVizHost();
    const langOf = K().langOf;
    const INF = Infinity;

    host.innerHTML =
        '<div class="floyd-wrap">' +
          '<div class="gm-controls">' +
            '<label>' + langOf({ zh: '邊', en: 'edges' }) + ' <input type="text" class="floyd-edges" data-testid="floyd-edges" value="' + floydEscAttr(_floydState.text) + '"></label>' +
            '<button type="button" class="btn primary floyd-apply" data-testid="floyd-apply">' + langOf({ zh: '套用', en: 'Apply' }) + '</button>' +
            '<label><input type="checkbox" class="floyd-directed"' + (_floydState.directed ? ' checked' : '') + '> ' + langOf({ zh: '有向', en: 'Directed' }) + '</label>' +
            '<button type="button" class="rand-btn" title="' + langOf({ zh: '隨機', en: 'Random' }) + '">🎲</button>' +
          '</div>' +
          '<div class="gw-err floyd-err" data-testid="floyd-err" style="display:none"></div>' +
          '<div class="floyd-grid"></div>' +
          '<div class="floyd-msg" data-testid="floyd-msg">&nbsp;</div>' +
        '</div>';

    const wrap = host.querySelector('.floyd-wrap');
    const gridEl = wrap.querySelector('.floyd-grid');
    const msgEl = wrap.querySelector('.floyd-msg');
    const errEl = wrap.querySelector('.floyd-err');

    function wireToolbar() {
      wrap.querySelector('.floyd-apply').addEventListener('click', () => {
        _floydState.text = wrap.querySelector('.floyd-edges').value;
        renderFloydWarshall();
      });
      wrap.querySelector('.floyd-directed').addEventListener('change', function () {
        _floydState.directed = this.checked;
        renderFloydWarshall();
      });
      wrap.querySelector('.rand-btn').addEventListener('click', () => {
        const difficulty = K().getInputDifficulty();
        const r = window.RandomInput && RandomInput.randomInputFor('graph-floyd-warshall', difficulty);
        if (!r || !r.text) return;
        _floydState.text = r.text;
        renderFloydWarshall();
      });
    }

    const parsed = GraphWorkbench.parseEdges(_floydState.text, true, _floydState.directed, false);
    if (!parsed.ok) {
      errEl.textContent = langOf(parsed.error);
      errEl.style.display = '';
      wireToolbar();
      return;
    }
    errEl.style.display = 'none';

    const n = parsed.n, labels = parsed.labels;
    const init = Array.from({ length: n }, () => Array(n).fill(INF));
    for (let i = 0; i < n; i++) {
      init[i][i] = 0;
      parsed.adj[i].forEach((e) => { if (e.w < init[i][e.to]) init[i][e.to] = e.w; });
    }
    const frames = [{ k: -1, dist: init.map((r) => r.slice()), changed: [],
        msg: 'initial distance matrix (direct edges only)' }];
    let dist = init.map((r) => r.slice());
    for (let k = 0; k < n; k++) {
      const changed = [];
      const next = dist.map((r) => r.slice());
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          if (dist[i][k] + dist[k][j] < dist[i][j]) {
            next[i][j] = dist[i][k] + dist[k][j];
            changed.push(i + ',' + j);
          }
        }
      }
      dist = next;
      frames.push({ k: k, dist: dist.map((r) => r.slice()), changed: changed,
          msg: 'k = ' + k + '  (' + labels[k] + ' as intermediate) — ' +
               changed.length + ' cell(s) improved' });
    }

    gridEl.style.gridTemplateColumns = 'repeat(' + (n + 1) + ', 40px)';
    gridEl.style.overflowX = 'auto';

    function draw(f) {
      let html = '<div class="floyd-hcell"></div>';
      for (let j = 0; j < n; j++) {
        html += '<div class="floyd-hcell' + (j === f.k ? ' floyd-pivot' : '') + '">' +
                labels[j] + '</div>';
      }
      for (let i = 0; i < n; i++) {
        html += '<div class="floyd-hcell' + (i === f.k ? ' floyd-pivot' : '') + '">' +
                labels[i] + '</div>';
        for (let j = 0; j < n; j++) {
          const val = f.dist[i][j] === INF ? '∞' : f.dist[i][j];
          const cls = 'floyd-cell' +
              (f.changed.indexOf(i + ',' + j) >= 0 ? ' floyd-changed' : '') +
              ((i === f.k || j === f.k) ? ' floyd-pivotline' : '');
          html += '<div class="' + cls + '" data-cell="' + i + '-' + j + '">' + val + '</div>';
        }
      }
      gridEl.innerHTML = html;
      msgEl.textContent = f.msg;
    }
    wrap.appendChild(K().buildFrameControls(frames, draw, { runIntervalMs: 800 }));
    wireToolbar();
  }

  // ---- Graph workbench (edge-list + VCR) : pilot bfs/dfs/dijkstra ----
  function gwLoadExamples(methodId) { try { return ExamplesStore.load(localStorage, methodId); } catch (e) { return []; } }
  function gwSaveExample(methodId, text, def) { try { ExamplesStore.save(localStorage, methodId, text, def); } catch (e) { /* ignore */ } }
  function gwExamplesOptionsHtml(methodId, defaultText) {
    const langOf = K().langOf;
    const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    const trunc = (s) => { s = String(s).replace(/\n/g, ' '); return s.length > 24 ? s.slice(0, 24) + '…' : s; };
    let h = '<option value="">' + langOf({ zh: '範例…', en: 'Examples…' }) + '</option>';
    h += '<option value="' + esc(defaultText) + '">' + langOf({ zh: '預設', en: 'Default' }) + '</option>';
    gwLoadExamples(methodId).forEach((e) => { h += '<option value="' + esc(e.text) + '">' + esc(trunc(e.text)) + '</option>'; });
    return h;
  }
  function gwBuildExamplesSelect(methodId, defaultText) {
    const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    return '<select class="ex-select" data-method="' + esc(methodId) + '">' +
      gwExamplesOptionsHtml(methodId, defaultText) + '</select>';
  }

  const GW_META = {
    'graph-bfs':      { weighted: false, usesSource: true,  gen: (p, s) => GraphWorkbench.bfsFrames(p.adj, s, p.labels) },
    'graph-dfs':      { weighted: false, usesSource: true,  gen: (p, s) => GraphWorkbench.dfsFrames(p.adj, s, p.labels) },
    'graph-dijkstra': { weighted: true,  usesSource: true,  gen: (p, s) => GraphWorkbench.dijkstraFrames(p.adj, s, p.labels) },
    'graph-kruskal':  { weighted: true,  usesSource: false, gen: (p, s) => GraphWorkbench.kruskalFrames(p.edges, p.n, p.labels) },
    'graph-prim':     { weighted: true,  usesSource: true,  gen: (p, s) => GraphWorkbench.primFrames(p.adj, s, p.labels) },
    'graph-boruvka':  { weighted: true,  usesSource: false, gen: (p, s) => GraphWorkbench.boruvkaFrames(p.edges, p.n, p.labels) },
    'graph-redblue':  { weighted: true,  usesSource: false, gen: (p, s) => GraphWorkbench.redBlueFrames(p.edges, p.n, p.labels) },
    'graph-topo':         { weighted: false, directed: true, usesSource: false, gen: (p, s) => GraphWorkbench.topoFrames(p.adj, p.n, p.labels) },
    'graph-bellman-ford': { weighted: true,  directed: true, allowNegative: true, usesSource: true,  gen: (p, s) => GraphWorkbench.bellmanFordFrames(p.adj, p.n, s, p.labels) },
  };
  let _gwState = {};

  const GW_DIRECTED_TOGGLE = new Set(['graph', 'graph-adjlist', 'graph-traversal', 'graph-bfs', 'graph-dfs', 'graph-dijkstra']);
  function gwEffectiveDirected(methodId, st, meta) {
    return GW_DIRECTED_TOGGLE.has(methodId) ? !!(st && st.directed) : !!(meta && meta.directed);
  }
  function gwDirToggleHtml(methodId, st, langOf) {
    if (!GW_DIRECTED_TOGGLE.has(methodId)) return '';
    return '<button type="button" class="gw-dir-toggle" data-testid="gw-directed-toggle">' +
      langOf(st.directed ? { zh: '有向 ⇄', en: 'Directed ⇄' } : { zh: '無向 ⇄', en: 'Undirected ⇄' }) + '</button>';
  }
  function gwWireDirToggle(host, st, langOf, rebuild) {
    const b = host.querySelector('.gw-dir-toggle');
    if (!b) return;
    b.addEventListener('click', () => {
      st.directed = !st.directed;
      b.textContent = langOf(st.directed ? { zh: '有向 ⇄', en: 'Directed ⇄' } : { zh: '無向 ⇄', en: 'Undirected ⇄' });
      rebuild();
    });
  }

  function drawUndirectedGraph(parsed, pos, frame, directed) {
    const has = (arr, x) => !!arr && arr.indexOf(x) !== -1;
    const ae = frame && frame.activeEdge ? frame.activeEdge : null;
    const R = 20;
    const dirSet = directed ? new Set(parsed.edges.map((e) => e.u + '-' + e.v)) : null;
    let s = '';
    if (directed) {
      s += '<defs>' +
        '<marker id="gw-arrow" markerWidth="9" markerHeight="9" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6 Z" fill="#94a3b8"/></marker>' +
        '<marker id="gw-arrow-active" markerWidth="9" markerHeight="9" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6 Z" fill="#60a5fa"/></marker>' +
        '</defs>';
    }
    for (const e of parsed.edges) {
      const isActive = ae && ae.u === e.u && ae.v === e.v;
      const ecls = 'graph-edge' + (isActive ? ' active' : '');
      const A = pos[e.u], B = pos[e.v];
      if (directed) {
        const dx = B.x - A.x, dy = B.y - A.y, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
        const px = -uy, py = ux, off = dirSet.has(e.v + '-' + e.u) ? 9 : 0;
        const x1 = A.x + ux * R + px * off, y1 = A.y + uy * R + py * off, x2 = B.x - ux * R + px * off, y2 = B.y - uy * R + py * off;
        s += '<line class="' + ecls + '" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" marker-end="url(#' + (isActive ? 'gw-arrow-active' : 'gw-arrow') + ')"></line>';
      } else {
        s += '<line class="' + ecls + '" x1="' + A.x + '" y1="' + A.y + '" x2="' + B.x + '" y2="' + B.y + '"></line>';
      }
    }
    for (let k = 0; k < parsed.n; k++) {
      let cls = 'graph-node';
      if (frame) { if (frame.active === k) cls += ' active'; else if (has(frame.visited, k)) cls += ' visited'; else if (has(frame.frontier, k)) cls += ' frontier'; }
      s += '<circle class="' + cls + '" data-node="' + k + '" cx="' + pos[k].x + '" cy="' + pos[k].y + '" r="18"></circle>';
      s += '<text class="graph-node-label" x="' + pos[k].x + '" y="' + pos[k].y + '">' + parsed.labels[k] + '</text>';
    }
    return s;
  }

  function renderGraphVcr(methodId) {
    const host = K().acquireDynamicVizHost();
    host.style.width = '100%';
    const langOf = K().langOf;
    const meta = GW_META[methodId];
    const DEF = GraphWorkbench.DEFAULTS[methodId];
    const st = _gwState[methodId] || (_gwState[methodId] = { text: DEF, source: 0 });

    const sourceCtl = (meta.usesSource === false) ? '' :
      '<label class="gw-src-lbl">' + langOf({ zh: '起點', en: 'Source' }) + ' <select class="gw-source" data-testid="gw-source"></select></label>';

    host.innerHTML =
      '<div class="gw" data-testid="gw">' +
        '<div class="gw-toolbar">' +
          '<textarea class="gw-input" data-testid="gw-input" rows="3" spellcheck="false" placeholder="' +
            langOf({ zh: '邊以逗號或換行分隔:' + (meta.weighted ? 'u-v:w(例 A-B:4)' : 'u-v(例 A-B,B-C)'), en: 'Edges by comma or newline: ' + (meta.weighted ? 'u-v:w (e.g. A-B:4)' : 'u-v (e.g. A-B,B-C)') }) + '"></textarea>' +
          '<div class="gw-btns">' +
            '<button type="button" class="btn primary gw-build" data-testid="gw-build">' + langOf({ zh: '建立', en: 'Build' }) + '</button>' +
            '<button type="button" class="rand-btn" title="' + langOf({ zh: '隨機', en: 'Random' }) + '">🎲</button>' +
            gwBuildExamplesSelect(methodId, DEF) +
            sourceCtl +
            gwDirToggleHtml(methodId, st, langOf) +
          '</div>' +
          '<div class="gw-err" data-testid="gw-err" style="display:none"></div>' +
        '</div>' +
        '<div class="gw-body"></div>' +
      '</div>';

    const input = host.querySelector('.gw-input');
    const srcSel = host.querySelector('.gw-source');
    const errEl = host.querySelector('.gw-err');
    const body = host.querySelector('.gw-body');
    input.value = st.text;

    function rebuildSource(parsed) {
      const n = parsed.n;
      srcSel.innerHTML = '';
      for (let k = 0; k < n; k++) { const o = document.createElement('option'); o.value = k; o.textContent = parsed.labels[k]; srcSel.appendChild(o); }
      if (st.source >= n) st.source = 0;
      srcSel.value = st.source;
    }

    function rebuild() {
      const dir = gwEffectiveDirected(methodId, st, meta);
      const parsed = GraphWorkbench.parseEdges(st.text, meta.weighted, dir, meta.allowNegative);
      if (!parsed.ok) { errEl.textContent = langOf(parsed.error); errEl.style.display = ''; body.innerHTML = ''; return; }
      errEl.style.display = 'none';
      if (srcSel) rebuildSource(parsed);
      const frames = meta.gen(parsed, st.source);
      const pos = GraphWorkbench.layout(parsed.n, 300, 200, 150, parsed.edges);

      body.innerHTML =
        '<div class="gw-workbench">' +
          '<div class="gw-stagecol">' +
            '<div class="gw-stepdesc" data-testid="gw-stepdesc"></div>' +
            '<div class="gw-stage"><svg class="gw-svg" data-testid="gw-svg" viewBox="0 0 600 400"></svg></div>' +
          '</div>' +
          '<aside class="gw-logcol">' +
            '<h4>' + langOf({ zh: '步驟紀錄', en: 'Step Log' }) + '</h4>' +
            '<div class="gw-steplog" data-testid="gw-log"></div>' +
          '</aside>' +
        '</div>';
      const stagecol = body.querySelector('.gw-stagecol');
      const svg = body.querySelector('.gw-svg');
      const descEl = body.querySelector('.gw-stepdesc');
      const logEl = body.querySelector('.gw-steplog');
      let lastFrame = frames[0];

      // One clickable row per frame. Structure via innerHTML, but the message text
      // is assigned via textContent (like descEl below) so a frame message containing
      // '<' or '&' can never diverge from the banner's escaped rendering.
      logEl.innerHTML = frames.map((f, i) =>
        '<button type="button" class="gw-logrow" data-i="' + i + '">' +
          '<span class="gw-logidx">' + i + '</span>' +
          '<span class="gw-logmsg"></span>' +
        '</button>'
      ).join('');
      logEl.querySelectorAll('.gw-logrow').forEach((r, i) => {
        r.querySelector('.gw-logmsg').textContent = langOf(frames[i].message);
      });

      function draw(f) {
        lastFrame = f;
        const has = (arr, x) => arr.indexOf(x) !== -1;
        const treeKeys = new Set((f.treeEdges || []).map((e) => e.u + '-' + e.v));
        const blueKeys = new Set((f.blueEdges || []).map((e) => e.u + '-' + e.v));
        const redKeys = new Set((f.redEdges || []).map((e) => e.u + '-' + e.v));
        const R = 20;
        const dirSet = dir ? new Set(parsed.edges.map((e) => e.u + '-' + e.v)) : null;
        let s = '';
        if (dir) {
          s += '<defs>' +
            '<marker id="gw-arrow" markerWidth="9" markerHeight="9" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6 Z" fill="#94a3b8"/></marker>' +
            '<marker id="gw-arrow-active" markerWidth="9" markerHeight="9" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6 Z" fill="#60a5fa"/></marker>' +
            '</defs>';
        }
        for (const e of parsed.edges) {
          const active = f.activeEdge && f.activeEdge.u === e.u && f.activeEdge.v === e.v;
          const ekey = e.u + '-' + e.v;
          const ecls = 'graph-edge' + (active ? ' active' : (blueKeys.has(ekey) ? ' blue' : (treeKeys.has(ekey) ? ' tree' : (redKeys.has(ekey) ? ' red' : ''))));
          const A = pos[e.u], B = pos[e.v];
          let x1 = A.x, y1 = A.y, x2 = B.x, y2 = B.y, mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
          if (dir) {
            const dx = B.x - A.x, dy = B.y - A.y, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
            const px = -uy, py = ux;                         // perpendicular unit
            const off = dirSet.has(e.v + '-' + e.u) ? 9 : 0; // anti-parallel → offset both sides apart
            x1 = A.x + ux * R + px * off; y1 = A.y + uy * R + py * off;
            x2 = B.x - ux * R + px * off; y2 = B.y - uy * R + py * off;
            mx = (x1 + x2) / 2; my = (y1 + y2) / 2;
            const marker = active ? 'gw-arrow-active' : 'gw-arrow';
            s += '<line class="' + ecls + '" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" marker-end="url(#' + marker + ')"></line>';
          } else {
            s += '<line class="' + ecls + '" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"></line>';
          }
          if (meta.weighted) s += '<text class="graph-weight" x="' + mx + '" y="' + my + '">' + e.w + '</text>';
        }
        for (let k = 0; k < parsed.n; k++) {
          let cls = 'graph-node';
          if (f.active === k) cls += ' active'; else if (has(f.visited, k)) cls += ' visited'; else if (has(f.frontier, k)) cls += ' frontier';
          s += '<circle class="' + cls + '" data-node="' + k + '" cx="' + pos[k].x + '" cy="' + pos[k].y + '" r="18"></circle>';
          s += '<text class="graph-node-label" x="' + pos[k].x + '" y="' + pos[k].y + '">' + parsed.labels[k] + '</text>';
          if (f.dist != null) { const d = f.dist[k]; s += '<text class="graph-distance" x="' + pos[k].x + '" y="' + (pos[k].y - 26) + '">' + (d === Infinity ? '∞' : d) + '</text>'; }
        }
        svg.innerHTML = s;
        descEl.textContent = langOf(f.message);
        NodeDrag.fitCanvas(svg, pos, parsed.n);
      }

      function highlightLog(i) {
        const rows = logEl.querySelectorAll('.gw-logrow');
        rows.forEach((r, k) => r.classList.toggle('on', k === i));
        if (rows[i]) rows[i].scrollIntoView({ block: 'nearest' });
      }

      stagecol.appendChild(K().buildFrameControls(frames, draw, { runIntervalMs: 700, onIndexChange: highlightLog }));

      const scrub = stagecol.querySelector('.stepctl-scrubber');
      logEl.querySelectorAll('.gw-logrow').forEach((r) => {
        r.addEventListener('click', () => {
          scrub.value = r.dataset.i;
          scrub.dispatchEvent(new Event('input', { bubbles: true }));
        });
      });

      NodeDrag.attach({ svgs: [svg], pos, edges: parsed.edges, n: parsed.n, redraw: () => draw(lastFrame) });
    }

    function applyText(text) {
      st.text = text; input.value = text;
      const parsed = GraphWorkbench.parseEdges(text, meta.weighted, gwEffectiveDirected(methodId, st, meta), meta.allowNegative);
      if (parsed.ok) { gwSaveExample(methodId, text, DEF); refreshExamplesSelect(); }
      rebuild();
    }

    // Re-populate the examples <select> from localStorage without disturbing the
    // rest of the toolbar (input text, source picker) — needed because a
    // successful build/random-fill saves a new example and it should be pickable
    // again in the same session, not only after the workbench fully re-renders
    // (e.g. on a language switch).
    function refreshExamplesSelect() {
      if (!exSel) return;
      const cur = exSel.value;
      exSel.innerHTML = gwExamplesOptionsHtml(methodId, DEF);
      exSel.value = cur;
    }

    host.querySelector('.gw-build').addEventListener('click', () => applyText(input.value));
    host.querySelector('.rand-btn').addEventListener('click', () => {
      const r = window.RandomInput && RandomInput.randomInputFor(methodId, K().getInputDifficulty());
      if (r && r.text) applyText(r.text);
    });
    if (srcSel) srcSel.addEventListener('change', () => { st.source = +srcSel.value; rebuild(); });
    const exSel = host.querySelector('.ex-select');
    if (exSel) exSel.addEventListener('change', (ev) => { const v = ev.target.value; if (v) applyText(v); });
    gwWireDirToggle(host, st, langOf, rebuild);

    rebuild();
  }

  function renderGraphStruct(methodId) {
    const host = K().acquireDynamicVizHost();
    host.style.width = '100%';
    const langOf = K().langOf;
    const view = methodId === 'graph' ? 'matrix' : methodId === 'graph-multilist' ? 'multilist' : 'list';
    const DEF = GraphWorkbench.DEFAULTS[methodId];
    const st = _gwState[methodId] || (_gwState[methodId] = { text: DEF });

    host.innerHTML =
      '<div class="gw" data-testid="gw">' +
        '<div class="gw-toolbar">' +
          '<textarea class="gw-input" data-testid="gw-input" rows="3" spellcheck="false" placeholder="' +
            langOf({ zh: '邊以逗號或換行分隔:u-v(例 A-B,B-C)', en: 'Edges by comma or newline: u-v (e.g. A-B,B-C)' }) + '"></textarea>' +
          '<div class="gw-btns">' +
            '<button type="button" class="btn primary gw-build" data-testid="gw-build">' + langOf({ zh: '建立', en: 'Build' }) + '</button>' +
            '<button type="button" class="rand-btn" title="' + langOf({ zh: '隨機', en: 'Random' }) + '">🎲</button>' +
            gwBuildExamplesSelect(methodId, DEF) +
            gwDirToggleHtml(methodId, st, langOf) +
          '</div>' +
          '<div class="gw-err" data-testid="gw-err" style="display:none"></div>' +
        '</div>' +
        '<div class="gw-struct-body"></div>' +
      '</div>';

    const input = host.querySelector('.gw-input');
    const errEl = host.querySelector('.gw-err');
    const body = host.querySelector('.gw-struct-body');
    input.value = st.text;

    function rebuild() {
      const dir = gwEffectiveDirected(methodId, st);
      const parsed = GraphWorkbench.parseEdges(st.text, false, dir);
      if (!parsed.ok) { errEl.textContent = langOf(parsed.error); errEl.style.display = ''; body.innerHTML = ''; return; }
      errEl.style.display = 'none';
      const pos = GraphWorkbench.layout(parsed.n, 300, 200, 150, parsed.edges);
      let rep = '';
      if (view === 'matrix') {
        const m = GraphWorkbench.adjMatrix(parsed.adj, parsed.n);
        rep = '<div class="gw-rep-title">' + langOf({ zh: '鄰接矩陣', en: 'Adjacency matrix' }) + '</div><table class="gw-matrix"><tr><th></th>';
        for (let j = 0; j < parsed.n; j++) rep += '<th>' + parsed.labels[j] + '</th>';
        rep += '</tr>';
        for (let i = 0; i < parsed.n; i++) {
          rep += '<tr><th>' + parsed.labels[i] + '</th>';
          for (let j = 0; j < parsed.n; j++) rep += '<td class="' + (m[i][j] ? 'on' : '') + '">' + m[i][j] + '</td>';
          rep += '</tr>';
        }
        rep += '</table>';
      } else if (view === 'multilist') {
        const ml = GraphWorkbench.adjMultilist(parsed.edges, parsed.n);
        rep = '<div class="gw-rep-title">' + langOf({ zh: '鄰接多重表', en: 'Adjacency Multilist' }) + '</div>';
        rep += '<div class="gml-note">' + langOf({ zh: '每條邊只有一個節點,被兩個端點共用(對比鄰接串列每邊存兩份)', en: 'Each edge is one node shared by both endpoints (adjacency list stores each edge twice)' }) + '</div>';
        rep += '<div class="gml-legend">';
        for (const nd of ml.nodes) rep += '<span class="gml-edge-node" data-edge="' + nd.id + '"><b>E' + nd.id + '</b> [' + parsed.labels[nd.u] + '|' + parsed.labels[nd.v] + '|·|·]</span>';
        rep += '</div>';
        rep += '<div class="adjlist-container">';
        for (let i = 0; i < parsed.n; i++) {
          rep += '<div class="adjlist-row gml-row"><span class="adjlist-vertex">[' + parsed.labels[i] + ']</span>';
          for (const c of ml.chains[i]) rep += '<span class="adjlist-arrow">→</span><span class="gml-eref" data-edge="' + c.id + '">E' + c.id + '(' + parsed.labels[c.other] + ')</span>';
          rep += '<span class="adjlist-arrow">→</span><span class="adjlist-null">∧</span></div>';
        }
        rep += '</div>';
      } else {
        rep = '<div class="gw-rep-title">' + langOf({ zh: '鄰接串列', en: 'Adjacency list' }) + '</div><div class="adjlist-container">';
        for (let i = 0; i < parsed.n; i++) {
          rep += '<div class="adjlist-row"><span class="adjlist-vertex">[' + parsed.labels[i] + ']</span>';
          for (const nb of parsed.adj[i]) rep += '<span class="adjlist-arrow">→</span><span class="adjlist-node">' + parsed.labels[nb.to] + '</span>';
          rep += '<span class="adjlist-arrow">→</span><span class="adjlist-null">null</span></div>';
        }
        rep += '</div>';
      }
      body.innerHTML =
        '<div class="gw-struct-grid">' +
          '<div class="gw-stage"><svg class="gw-svg" data-testid="gw-svg" viewBox="0 0 600 400">' + drawUndirectedGraph(parsed, pos, null, dir) + '</svg></div>' +
          '<div class="gw-rep">' + rep + '</div>' +
        '</div>';
      const svg = body.querySelector('.gw-svg');
      NodeDrag.attach({ svgs: [svg], pos, edges: parsed.edges, n: parsed.n,
        redraw: () => { svg.innerHTML = drawUndirectedGraph(parsed, pos, null, dir); NodeDrag.fitCanvas(svg, pos, parsed.n); } });
    }

    function refreshEx() { const ex = host.querySelector('.ex-select'); if (!ex) return; const c = ex.value; ex.innerHTML = gwExamplesOptionsHtml(methodId, DEF); ex.value = c; }
    function applyText(text) {
      st.text = text; input.value = text;
      const parsed = GraphWorkbench.parseEdges(text, false, gwEffectiveDirected(methodId, st));
      if (parsed.ok) { gwSaveExample(methodId, text, DEF); refreshEx(); }
      rebuild();
    }

    host.querySelector('.gw-build').addEventListener('click', () => applyText(input.value));
    host.querySelector('.rand-btn').addEventListener('click', () => {
      const r = window.RandomInput && RandomInput.randomInputFor(methodId, K().getInputDifficulty());
      if (r && r.text) applyText(r.text);
    });
    const exSel = host.querySelector('.ex-select');
    if (exSel) exSel.addEventListener('change', (ev) => { const v = ev.target.value; if (v) applyText(v); });
    gwWireDirToggle(host, st, langOf, rebuild);

    rebuild();
  }

  function renderGraphTraversal() {
    const methodId = 'graph-traversal';
    const host = K().acquireDynamicVizHost();
    host.style.width = '100%';
    const langOf = K().langOf;
    const DEF = GraphWorkbench.DEFAULTS[methodId];
    const st = _gwState[methodId] || (_gwState[methodId] = { text: DEF, source: 0 });

    host.innerHTML =
      '<div class="gw" data-testid="gw">' +
        '<div class="gw-toolbar">' +
          '<textarea class="gw-input" data-testid="gw-input" rows="3" spellcheck="false" placeholder="' +
            langOf({ zh: '邊以逗號或換行分隔:u-v(例 A-B,B-C)', en: 'Edges by comma or newline: u-v (e.g. A-B,B-C)' }) + '"></textarea>' +
          '<div class="gw-btns">' +
            '<button type="button" class="btn primary gw-build" data-testid="gw-build">' + langOf({ zh: '建立', en: 'Build' }) + '</button>' +
            '<button type="button" class="rand-btn" title="' + langOf({ zh: '隨機', en: 'Random' }) + '">🎲</button>' +
            gwBuildExamplesSelect(methodId, DEF) +
            '<label class="gw-src-lbl">' + langOf({ zh: '起點', en: 'Source' }) + ' <select class="gw-source" data-testid="gw-source"></select></label>' +
            gwDirToggleHtml(methodId, st, langOf) +
          '</div>' +
          '<div class="gw-err" data-testid="gw-err" style="display:none"></div>' +
        '</div>' +
        '<div class="gw-dual-body"></div>' +
      '</div>';

    const input = host.querySelector('.gw-input');
    const srcSel = host.querySelector('.gw-source');
    const errEl = host.querySelector('.gw-err');
    const body = host.querySelector('.gw-dual-body');
    input.value = st.text;

    function rebuildSource(parsed) {
      const n = parsed.n;
      srcSel.innerHTML = '';
      for (let k = 0; k < n; k++) { const o = document.createElement('option'); o.value = k; o.textContent = parsed.labels[k]; srcSel.appendChild(o); }
      if (st.source >= n) st.source = 0;
      srcSel.value = st.source;
    }

    function rebuild() {
      const dir = gwEffectiveDirected(methodId, st);
      const parsed = GraphWorkbench.parseEdges(st.text, false, dir);
      if (!parsed.ok) { errEl.textContent = langOf(parsed.error); errEl.style.display = ''; body.innerHTML = ''; return; }
      errEl.style.display = 'none';
      rebuildSource(parsed);
      const pos = GraphWorkbench.layout(parsed.n, 300, 200, 150, parsed.edges);
      const bfs = GraphWorkbench.bfsFrames(parsed.adj, st.source, parsed.labels);
      const dfs = GraphWorkbench.dfsFrames(parsed.adj, st.source, parsed.labels);
      const L = Math.max(bfs.length, dfs.length);

      body.innerHTML =
        '<div class="graph-dual-grid">' +
          '<div class="graph-dual-pane" data-pane="bfs"><h4>' + langOf({ zh: 'BFS(佇列)', en: 'BFS (queue)' }) + '</h4>' +
            '<div class="gw-stage"><svg class="gw-svg gw-svg-bfs" viewBox="0 0 600 400"></svg></div><div class="gw-pane-info gw-info-bfs"></div></div>' +
          '<div class="graph-dual-pane" data-pane="dfs"><h4>' + langOf({ zh: 'DFS(堆疊)', en: 'DFS (stack)' }) + '</h4>' +
            '<div class="gw-stage"><svg class="gw-svg gw-svg-dfs" viewBox="0 0 600 400"></svg></div><div class="gw-pane-info gw-info-dfs"></div></div>' +
        '</div>' +
        '<div class="gw-stepdesc" data-testid="gw-stepdesc"></div>';
      const svgBfs = body.querySelector('.gw-svg-bfs'), svgDfs = body.querySelector('.gw-svg-dfs');
      const infoBfs = body.querySelector('.gw-info-bfs'), infoDfs = body.querySelector('.gw-info-dfs');
      const descEl = body.querySelector('.gw-stepdesc');
      let lastI = 0;

      function paint(_f, i) {
        lastI = i;
        const fb = bfs[Math.min(i, bfs.length - 1)], fd = dfs[Math.min(i, dfs.length - 1)];
        svgBfs.innerHTML = drawUndirectedGraph(parsed, pos, fb, dir);
        svgDfs.innerHTML = drawUndirectedGraph(parsed, pos, fd, dir);
        NodeDrag.fitCanvas(svgBfs, pos, parsed.n);
        NodeDrag.fitCanvas(svgDfs, pos, parsed.n);
        infoBfs.textContent = langOf({ zh: '佇列', en: 'Queue' }) + ': [' + fb.frontier.map((x) => parsed.labels[x]).join(', ') + ']  ' + langOf({ zh: '已訪', en: 'Visited' }) + ': [' + fb.order.map((x) => parsed.labels[x]).join(', ') + ']';
        infoDfs.textContent = langOf({ zh: '堆疊', en: 'Stack' }) + ': [' + fd.frontier.map((x) => parsed.labels[x]).join(', ') + ']  ' + langOf({ zh: '已訪', en: 'Visited' }) + ': [' + fd.order.map((x) => parsed.labels[x]).join(', ') + ']';
        descEl.textContent = 'BFS: ' + langOf(fb.message) + '   |   DFS: ' + langOf(fd.message);
      }
      body.appendChild(K().buildFrameControls(Array.from({ length: L }), paint, { runIntervalMs: 700 }));
      NodeDrag.attach({ svgs: [svgBfs, svgDfs], pos, edges: parsed.edges, n: parsed.n,
        redraw: () => paint(null, lastI) });
    }

    function refreshEx() { const ex = host.querySelector('.ex-select'); if (!ex) return; const c = ex.value; ex.innerHTML = gwExamplesOptionsHtml(methodId, DEF); ex.value = c; }
    function applyText(text) {
      st.text = text; input.value = text;
      const parsed = GraphWorkbench.parseEdges(text, false, gwEffectiveDirected(methodId, st));
      if (parsed.ok) { gwSaveExample(methodId, text, DEF); refreshEx(); }
      rebuild();
    }

    host.querySelector('.gw-build').addEventListener('click', () => applyText(input.value));
    host.querySelector('.rand-btn').addEventListener('click', () => {
      const r = window.RandomInput && RandomInput.randomInputFor(methodId, K().getInputDifficulty());
      if (r && r.text) applyText(r.text);
    });
    srcSel.addEventListener('change', () => { st.source = +srcSel.value; rebuild(); });
    const exSel = host.querySelector('.ex-select');
    if (exSel) exSel.addEventListener('change', (ev) => { const v = ev.target.value; if (v) applyText(v); });
    gwWireDirToggle(host, st, langOf, rebuild);

    rebuild();
  }

  R().attach('graph',         { render: () => renderGraphStruct('graph'),         code: () => codeGraph,        layout: { host: 'dynamic' } });
  R().attach('graph-adjlist', { render: () => renderGraphStruct('graph-adjlist'), code: () => codeGraphAdjlist, layout: { host: 'dynamic' } });
  R().attach('graph-multilist', { render: () => renderGraphStruct('graph-multilist'), code: () => codeGraphMultilist, layout: { host: 'dynamic' } });
  R().attach('graph-traversal', { render: renderGraphTraversal, code: () => codeGraphTraversal, layout: { host: 'dynamic' } });
  R().attach('graph-bfs',      { render: () => renderGraphVcr('graph-bfs'),      code: () => codeGraphBFS,      layout: { host: 'dynamic' } });
  R().attach('graph-dfs',      { render: () => renderGraphVcr('graph-dfs'),      code: () => codeGraphDFS,      layout: { host: 'dynamic' } });
  R().attach('graph-kruskal', { render: () => renderGraphVcr('graph-kruskal'), code: () => codeGraphKruskal, layout: { host: 'dynamic' } });
  R().attach('graph-dijkstra', { render: () => renderGraphVcr('graph-dijkstra'), code: () => codeGraphDijkstra, layout: { host: 'dynamic' } });
  R().attach('graph-topo',         { render: () => renderGraphVcr('graph-topo'),         code: () => codeGraphTopo,        layout: { host: 'dynamic' } });
  R().attach('graph-prim', { render: () => renderGraphVcr('graph-prim'), code: () => codeGraphPrim, layout: { host: 'dynamic' } });
  R().attach('graph-boruvka', { render: () => renderGraphVcr('graph-boruvka'), code: () => codeGraphBoruvka, layout: { host: 'dynamic' } });
  R().attach('graph-redblue', { render: () => renderGraphVcr('graph-redblue'), code: () => codeGraphRedblue, layout: { host: 'dynamic' } });
  R().attach('graph-bellman-ford', { render: () => renderGraphVcr('graph-bellman-ford'), code: () => codeGraphBellmanFord, layout: { host: 'dynamic' } });
  R().attach('graph-floyd-warshall', { render: renderFloydWarshall, code: () => codeGraphFloydWarshall, layout: { host: 'dynamic' } });
  C().registerDomain({ id: 'graph' });
})(typeof window !== 'undefined' ? window : globalThis);
