(function (global) {
  'use strict';
  const K = () => global.VizKit;

  // Examples-helper trio — duplicated from viz_graph_matrix.js per program convention; do NOT refactor.
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
    const parsed = global.GraphClosureViz.parseInput(parts[0], parts.slice(1).join('|'));
    return { n: parsed.n, edges: parsed.edges };
  }
  const DEFAULT_SERIALIZED = serialize(global.GraphClosureViz.SAMPLE);
  const DAG_SERIALIZED = '4|0-1,1-2,2-3';                    // built-in acyclic example (empty diagonal)

  const _st = { n: global.GraphClosureViz.SAMPLE.n, edges: global.GraphClosureViz.SAMPLE.edges.slice() };

  // Directed node-link SVG: n nodes on a circle, arrowheads; original edges solid, added closure
  // edges (frame.reach, i≠j) dashed, the current set edge highlighted, pivot vertex ringed.
  function gclGraphSvg(n, origEdges, frame) {
    const CX = 130, CY = 130, R = 100, NR = 16;
    const pos = [];
    for (let i = 0; i < n; i++) { const a = -Math.PI/2 + i*2*Math.PI/Math.max(n,1); pos.push({ x: CX + R*Math.cos(a), y: CY + R*Math.sin(a) }); }
    const cur = frame.cur;
    let svg = '<svg viewBox="0 0 260 260" width="260" height="260" class="gcl-svg">' +
      '<defs><marker id="gcl-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#64748b"/></marker>' +
      '<marker id="gcl-arrow-add" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#a855f7"/></marker></defs>';
    function line(u, v, cls, marker) {
      const a = pos[u], b = pos[v]; if (!a || !b || u === v) return '';   // self-loops shown in matrix only
      const dx = b.x-a.x, dy = b.y-a.y, len = Math.hypot(dx,dy)||1, ux = dx/len, uy = dy/len;
      const x1 = a.x+ux*NR, y1 = a.y+uy*NR, x2 = b.x-ux*(NR+6), y2 = b.y-uy*(NR+6);
      return '<line class="' + cls + '" x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" marker-end="url(#'+marker+')"/>';
    }
    // added (dashed) first, then original (solid) on top
    (frame.reach || []).forEach((e) => {
      const isCur = cur && cur.i === e.u && cur.j === e.v;
      svg += line(e.u, e.v, 'gcl-edge-added' + (isCur ? ' gcl-edge-cur' : ''), 'gcl-arrow-add');
    });
    origEdges.forEach((e) => { svg += line(e.u, e.v, 'gcl-edge', 'gcl-arrow'); });
    pos.forEach((p, i) => {
      const cls = 'gcl-node' + (frame.k === i ? ' gcl-node-pivot' : '');
      svg += '<circle class="' + cls + '" cx="'+p.x+'" cy="'+p.y+'" r="'+NR+'"/>' +
             '<text class="gcl-node-label" x="'+p.x+'" y="'+(p.y+5)+'" text-anchor="middle">'+i+'</text>';
    });
    return svg + '</svg>';
  }

  // Matrix grid (floyd-grid style): pivot row k / col k tinted; for a set frame, the two source cells
  // R[i][k] & R[k][j] marked, and the just-set cell R[i][j] marked.
  function gclMatrixHtml(frame, n) {
    const M = frame.R, k = frame.k, cur = frame.cur;
    let html = '<div class="gcl-grid" style="grid-template-columns: repeat(' + (n+1) + ', 34px);">';
    html += '<div class="gcl-hcell"></div>';
    for (let j = 0; j < n; j++) html += '<div class="gcl-hcell' + (k === j ? ' gcl-pivot' : '') + '">' + j + '</div>';
    for (let i = 0; i < n; i++) {
      html += '<div class="gcl-hcell' + (k === i ? ' gcl-pivot' : '') + '">' + i + '</div>';
      for (let j = 0; j < n; j++) {
        let cls = 'gcl-cell' + (M[i][j] ? '' : ' gcl-zero');
        if (k === i || k === j) cls += ' gcl-pivot';
        if (cur) {
          if (i === cur.i && j === cur.j) cls += ' gcl-added';
          else if ((i === cur.i && j === k) || (i === k && j === cur.j)) cls += ' gcl-src';
        }
        html += '<div class="' + cls + '" data-i="'+i+'" data-j="'+j+'">' + (M[i][j] || 0) + '</div>';
      }
    }
    return html + '</div>';
  }

  function renderGraphClosure() {
    const host = K().acquireDynamicVizHost();
    host.innerHTML =
      '<div class="gcl-wrap">' +
        '<div class="gcl-controls">' +
          '<label>n <input type="text" class="gcl-n" value="' + _st.n + '"></label>' +
          '<label>edges (u-v, directed) <input type="text" class="gcl-edges" value="' + edgesToStr(_st.edges) + '"></label>' +
          '<button type="button" class="gcl-apply">套用 Apply</button>' +
          '<button type="button" class="rand-btn" title="Random">🎲</button>' +
          buildExamplesSelect('graph-closure', DEFAULT_SERIALIZED) +
        '</div>' +
        '<div class="gcl-scroll"><div class="gcl-graph"></div><div class="gcl-matrix"></div></div>' +
        '<div class="gcl-msg" data-testid="gcl-msg">&nbsp;</div>' +
      '</div>';

    const wrap = host.querySelector('.gcl-wrap');
    const graphEl = wrap.querySelector('.gcl-graph');
    const matrixEl = wrap.querySelector('.gcl-matrix');
    const msgEl = wrap.querySelector('.gcl-msg');

    // built-in DAG example option after Default
    const exSelect = wrap.querySelector('.ex-select');
    if (exSelect && !Array.from(exSelect.options).some((o) => o.value === DAG_SERIALIZED)) {
      const lang = (global.I18N && I18N.getCurrentLanguage) ? I18N.getCurrentLanguage() : 'en';
      const opt = document.createElement('option');
      opt.value = DAG_SERIALIZED; opt.textContent = lang === 'zh' ? '有向無環圖 (鏈)' : 'DAG (chain)';
      exSelect.insertBefore(opt, exSelect.options[2] || null);
    }

    const frames = global.GraphClosureViz.closureFrames(_st).frames;
    function paint(fr, i) {
      graphEl.innerHTML = gclGraphSvg(_st.n, _st.edges, fr);
      matrixEl.innerHTML = gclMatrixHtml(fr, _st.n);
      msgEl.textContent = K().langOf(fr.msg);
      K().showStatus(K().langOf(fr.msg), fr.phase === 'done' ? '#34d399' : (fr.phase === 'set' ? '#a855f7' : '#60a5fa'));
    }
    wrap.appendChild(K().buildFrameControls(frames, paint, { runIntervalMs: 700 }));

    wrap.querySelector('.gcl-apply').addEventListener('click', function () {
      const parsed = global.GraphClosureViz.parseInput(wrap.querySelector('.gcl-n').value, wrap.querySelector('.gcl-edges').value);
      _st.n = parsed.n; _st.edges = parsed.edges;
      saveExample('graph-closure', serialize(_st), DEFAULT_SERIALIZED);
      renderGraphClosure();
    });
    wrap.querySelector('.rand-btn').addEventListener('click', function () {
      const difficulty = K().getInputDifficulty();
      const r = global.RandomInput && global.RandomInput.randomInputFor('graph-closure', difficulty);
      if (!r || !Array.isArray(r.edges)) return;
      _st.n = r.n; _st.edges = r.edges;
      saveExample('graph-closure', serialize(_st), DEFAULT_SERIALIZED);
      renderGraphClosure();
    });
    if (exSelect) exSelect.addEventListener('change', function (ev) {
      const v = ev.target.value; if (!v) return;
      const parsed = deserialize(v); _st.n = parsed.n; _st.edges = parsed.edges;
      renderGraphClosure();
    });
  }

  global.VizRegistry.attach('graph-closure', {
    render: renderGraphClosure,
    code: () => (typeof codeGraphClosure !== 'undefined' ? codeGraphClosure : ''),
    layout: { host: 'dynamic' },
  });
})(typeof window !== 'undefined' ? window : globalThis);
