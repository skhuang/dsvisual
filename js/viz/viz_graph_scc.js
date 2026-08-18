(function (global) {
  'use strict';
  const K = () => global.VizKit;
  const PALETTE = ['#3b82f6', '#f59e0b', '#10b981', '#a855f7', '#ec4899', '#14b8a6', '#ef4444', '#6366f1'];

  // Examples-helper trio — duplicated per program convention; do NOT refactor.
  function loadExamples(methodId) { try { return ExamplesStore.load(localStorage, methodId); } catch (e) { return []; } }
  function saveExample(methodId, text, defaultText) { try { ExamplesStore.save(localStorage, methodId, text, defaultText); } catch (e) { /* ignore */ } }
  function buildExamplesSelect(methodId, defaultText) {
    const lang = (global.I18N && I18N.getCurrentLanguage) ? I18N.getCurrentLanguage() : 'en';
    const escAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
    const escText = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const trunc = (s) => { s = String(s); return s.length > 24 ? s.slice(0, 24) + '…' : s; };
    const placeholder = lang === 'zh' ? '範例…' : 'Examples…';
    const defLabel = lang === 'zh' ? '預設' : 'Default';
    let h = '<select class="ex-select" data-method="' + escAttr(methodId) + '">';
    h += '<option value="">' + placeholder + '</option>';
    h += '<option value="' + escAttr(defaultText) + '">' + defLabel + '</option>';
    loadExamples(methodId).forEach((e) => { if (e.text === defaultText) return;
      h += '<option value="' + escAttr(e.text) + '">' + escText(trunc(e.text)) + '</option>'; });
    h += '</select>';
    return h;
  }

  function edgesToStr(edges) { return edges.map((e) => e.u + '-' + e.v).join(','); }
  function serialize(st) { return st.n + '|' + edgesToStr(st.edges); }
  function deserialize(text) {
    const parts = String(text).split('|');
    const parsed = global.GraphSccViz.parseInput(parts[0], parts.slice(1).join('|'));
    return { n: parsed.n, edges: parsed.edges };
  }
  const DEFAULT_SERIALIZED = serialize(global.GraphSccViz.SAMPLE);
  const CYCLE_SERIALIZED = '4|0-1,1-2,2-3,3-0';               // built-in single-SCC example

  const _st = { n: global.GraphSccViz.SAMPLE.n, edges: global.GraphSccViz.SAMPLE.edges.slice() };

  // Main directed node-link. Draws G (init/p1) or Gᵀ (p2/done, edges reversed). Node fill: SCC colour
  // when comp>=0, visited shade in p1, else neutral; current vertex ringed; current treeEdge highlighted.
  function gscGraphSvg(n, origEdges, frame) {
    const CX = 130, CY = 130, R = 100, NR = 16;
    const transposed = frame.phase === 'p2' || frame.phase === 'done';
    const drawEdges = transposed ? origEdges.map((e) => ({ u: e.v, v: e.u })) : origEdges;
    const te = frame.treeEdge;
    const pos = [];
    for (let i = 0; i < n; i++) { const a = -Math.PI/2 + i*2*Math.PI/Math.max(n,1); pos.push({ x: CX + R*Math.cos(a), y: CY + R*Math.sin(a) }); }
    let svg = '<svg viewBox="0 0 260 260" width="260" height="260" class="gsc-svg">' +
      '<defs><marker id="gsc-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#64748b"/></marker>' +
      '<marker id="gsc-arrow-t" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#0f172a"/></marker></defs>';
    drawEdges.forEach((e) => {
      const a = pos[e.u], b = pos[e.v]; if (!a || !b || e.u === e.v) return;   // self-loops shown via colour only
      const dx = b.x-a.x, dy = b.y-a.y, len = Math.hypot(dx,dy)||1, ux = dx/len, uy = dy/len;
      const isTree = !!(te && te.u === e.u && te.v === e.v);
      svg += '<line class="gsc-edge' + (isTree ? ' gsc-edge-tree' : '') + '" x1="'+(a.x+ux*NR)+'" y1="'+(a.y+uy*NR)+'" x2="'+(b.x-ux*(NR+6))+'" y2="'+(b.y-uy*(NR+6))+'" marker-end="url(#'+(isTree?'gsc-arrow-t':'gsc-arrow')+')"/>';
    });
    pos.forEach((p, i) => {
      const c = frame.comp[i];
      const scc = c >= 0;
      const fill = scc ? PALETTE[c % PALETTE.length] : (frame.phase === 'p1' && frame.visited[i] ? '#e2e8f0' : '');
      let cls = 'gsc-node' + (scc ? ' gsc-node-scc' : '') + (frame.cur === i ? ' gsc-node-cur' : '');
      svg += '<circle class="' + cls + '" data-v="'+i+'"'+(scc?' data-comp="'+c+'"':'')+' cx="'+p.x+'" cy="'+p.y+'" r="'+NR+'"'+(fill?' style="fill:'+fill+'"':'')+'/>' +
             '<text class="gsc-node-label" x="'+p.x+'" y="'+(p.y+5)+'" text-anchor="middle">'+i+'</text>';
    });
    return svg + '</svg>';
  }

  // Finish-order stack: bottom → top; top (last) item marked. Empty placeholder when empty.
  function gscStackHtml(frame) {
    const s = frame.finishStack || [];
    let h = '<div class="gsc-stack-title">finish stack</div><div class="gsc-stack-col">';
    if (!s.length) h += '<div class="gsc-stack-empty">∅</div>';
    for (let i = s.length - 1; i >= 0; i--) h += '<div class="gsc-stack-item' + (i === s.length-1 ? ' gsc-stack-top' : '') + '">' + s[i] + '</div>';
    return h + '</div>';
  }

  // Condensation DAG: one super-node per SCC id present (ascending id = discovery/topological order),
  // laid out left→right; inter-SCC edges (comp[u]→comp[v], distinct, both assigned) deduped.
  function gscCondSvg(n, origEdges, frame) {
    const comp = frame.comp;
    const ids = [];
    for (let i = 0; i < n; i++) if (comp[i] >= 0 && ids.indexOf(comp[i]) < 0) ids.push(comp[i]);
    ids.sort((a, b) => a - b);
    if (!ids.length) return '<div class="gsc-cond-empty">（強連通分量完成後顯示凝聚圖 / condensation appears once SCCs are formed）</div>';
    const members = {}; ids.forEach((c) => { members[c] = []; });
    for (let i = 0; i < n; i++) if (comp[i] >= 0) members[comp[i]].push(i);
    const W = 120, H = 90, GAP = 40, RW = 84, RH = 46;
    const totalW = ids.length * W + GAP;
    let svg = '<svg viewBox="0 0 ' + Math.max(totalW, 160) + ' ' + H + '" width="' + Math.max(totalW, 160) + '" height="' + H + '" class="gsc-cond-svg">' +
      '<defs><marker id="gsc-cond-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#64748b"/></marker></defs>';
    const cx = {}; ids.forEach((c, idx) => { cx[c] = GAP/2 + idx * W + RW/2; });
    const cy = H/2;
    // edges between distinct SCCs (dedup)
    const seen = {};
    origEdges.forEach((e) => {
      const a = comp[e.u], b = comp[e.v];
      if (a >= 0 && b >= 0 && a !== b && !seen[a + '>' + b]) {
        seen[a + '>' + b] = 1;
        const x1 = cx[a] + RW/2, x2 = cx[b] - RW/2;
        svg += '<line class="gsc-cond-edge" x1="'+x1+'" y1="'+cy+'" x2="'+x2+'" y2="'+cy+'" marker-end="url(#gsc-cond-arrow)"/>';
      }
    });
    ids.forEach((c) => {
      const x = cx[c] - RW/2;
      svg += '<rect class="gsc-super" data-scc="'+c+'" x="'+x+'" y="'+(cy-RH/2)+'" width="'+RW+'" height="'+RH+'" rx="8" style="fill:'+PALETTE[c % PALETTE.length]+'22;stroke:'+PALETTE[c % PALETTE.length]+'"/>' +
             '<text class="gsc-super-label" x="'+cx[c]+'" y="'+cy+'" text-anchor="middle">{'+members[c].join(',')+'}</text>';
    });
    return svg + '</svg>';
  }

  function renderGraphScc() {
    const host = K().acquireDynamicVizHost();
    host.innerHTML =
      '<div class="gsc-wrap">' +
        '<div class="gsc-controls">' +
          '<label>n <input type="text" class="gsc-n" value="' + _st.n + '"></label>' +
          '<label>edges (u-v, directed) <input type="text" class="gsc-edges" value="' + edgesToStr(_st.edges) + '"></label>' +
          '<button type="button" class="gsc-apply">套用 Apply</button>' +
          '<button type="button" class="rand-btn" title="Random">🎲</button>' +
          buildExamplesSelect('graph-scc', DEFAULT_SERIALIZED) +
        '</div>' +
        '<div class="gsc-banner" data-testid="gsc-banner">&nbsp;</div>' +
        '<div class="gsc-scroll"><div class="gsc-graph"></div><div class="gsc-stack"></div></div>' +
        '<div class="gsc-cond"></div>' +
        '<div class="gsc-msg" data-testid="gsc-msg">&nbsp;</div>' +
      '</div>';
    const wrap = host.querySelector('.gsc-wrap');
    const graphEl = wrap.querySelector('.gsc-graph');
    const stackEl = wrap.querySelector('.gsc-stack');
    const condEl = wrap.querySelector('.gsc-cond');
    const bannerEl = wrap.querySelector('.gsc-banner');
    const msgEl = wrap.querySelector('.gsc-msg');

    // built-in single-cycle example after Default
    const exSelect = wrap.querySelector('.ex-select');
    if (exSelect && !Array.from(exSelect.options).some((o) => o.value === CYCLE_SERIALIZED)) {
      const lang = (global.I18N && I18N.getCurrentLanguage) ? I18N.getCurrentLanguage() : 'en';
      const opt = document.createElement('option');
      opt.value = CYCLE_SERIALIZED; opt.textContent = lang === 'zh' ? '單一循環 (1 個 SCC)' : 'Single cycle (1 SCC)';
      exSelect.insertBefore(opt, exSelect.options[2] || null);
    }

    const frames = global.GraphSccViz.sccFrames(_st).frames;
    function bannerText(fr) {
      const lang = (global.I18N && I18N.getCurrentLanguage) ? I18N.getCurrentLanguage() : 'en';
      const phaseName = { init: lang==='zh'?'開始':'start', p1: lang==='zh'?'階段1：DFS(G)':'phase 1: DFS(G)', transpose: lang==='zh'?'轉置 Gᵀ':'transpose Gᵀ', p2: lang==='zh'?'階段2：DFS(Gᵀ)':'phase 2: DFS(Gᵀ)', done: lang==='zh'?'完成':'done' }[fr.phase];
      return (lang==='zh' ? '強連通分量：' : 'SCCs: ') + fr.sccCount + '　·　' + phaseName;
    }
    function paint(fr, i) {
      graphEl.innerHTML = gscGraphSvg(_st.n, _st.edges, fr);
      stackEl.innerHTML = gscStackHtml(fr);
      condEl.innerHTML = gscCondSvg(_st.n, _st.edges, fr);
      bannerEl.textContent = bannerText(fr);
      msgEl.textContent = K().langOf(fr.msg);
      K().showStatus(K().langOf(fr.msg), fr.phase === 'done' ? '#34d399' : (fr.phase === 'transpose' ? '#f59e0b' : '#60a5fa'));
    }
    wrap.appendChild(K().buildFrameControls(frames, paint, { runIntervalMs: 700 }));

    wrap.querySelector('.gsc-apply').addEventListener('click', function () {
      const parsed = global.GraphSccViz.parseInput(wrap.querySelector('.gsc-n').value, wrap.querySelector('.gsc-edges').value);
      _st.n = parsed.n; _st.edges = parsed.edges;
      saveExample('graph-scc', serialize(_st), DEFAULT_SERIALIZED);
      renderGraphScc();
    });
    wrap.querySelector('.rand-btn').addEventListener('click', function () {
      const difficulty = K().getInputDifficulty();
      const r = global.RandomInput && global.RandomInput.randomInputFor('graph-scc', difficulty);
      if (!r || !Array.isArray(r.edges)) return;
      _st.n = r.n; _st.edges = r.edges;
      saveExample('graph-scc', serialize(_st), DEFAULT_SERIALIZED);
      renderGraphScc();
    });
    if (exSelect) exSelect.addEventListener('change', function (ev) {
      const v = ev.target.value; if (!v) return;
      const parsed = deserialize(v); _st.n = parsed.n; _st.edges = parsed.edges;
      renderGraphScc();
    });
  }

  global.VizRegistry.attach('graph-scc', {
    render: renderGraphScc,
    code: () => (typeof codeGraphScc !== 'undefined' ? codeGraphScc : ''),
    layout: { host: 'dynamic' },
  });
})(typeof window !== 'undefined' ? window : globalThis);
