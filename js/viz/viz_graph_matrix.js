(function (global) {
  'use strict';
  const K = () => global.VizKit; // resolved at call time (VizKit set at startup)

  // NOTE: loadExamples/saveExample/buildExamplesSelect are stateless helpers
  // (pure wrappers around the global ExamplesStore + localStorage, keyed by
  // methodId). Duplicated from js/viz/viz_list_equivalence.js per the
  // extraction recipe (also copied into viz_matrix_sparse_list.js) — do not
  // refactor into a shared module.
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
    loadExamples(methodId).forEach((e) => {
      if (e.text === defaultText) return;
      h += '<option value="' + escAttr(e.text) + '">' + escText(trunc(e.text)) + '</option>';
    });
    h += '</select>';
    return h;
  }

  // Serialize/deserialize _st as `n|directed|weighted|u-v:w,u-v:w,...` so it
  // round-trips through the examples select's <option value>.
  function serialize(st) {
    return st.n + '|' + (st.directed ? 1 : 0) + '|' + (st.weighted ? 1 : 0) + '|' +
      st.edges.map((e) => e.u + '-' + e.v + ':' + e.w).join(',');
  }
  function deserialize(text) {
    const parts = String(text).split('|');
    const nStr = parts[0], directedFlag = parts[1], weightedFlag = parts[2];
    const edgesStr = parts.slice(3).join('|');
    const parsed = global.GraphMatrixViz.parseInput(nStr, edgesStr);
    return { n: parsed.n, edges: parsed.edges, directed: directedFlag === '1', weighted: weightedFlag === '1' };
  }
  const DEFAULT_SERIALIZED = serialize(global.GraphMatrixViz.SAMPLE);

  // Module state seeded from GraphMatrixViz.SAMPLE.
  const _st = {
    n: global.GraphMatrixViz.SAMPLE.n,
    edges: global.GraphMatrixViz.SAMPLE.edges.slice(),
    directed: global.GraphMatrixViz.SAMPLE.directed,
    weighted: global.GraphMatrixViz.SAMPLE.weighted,
  };

  function edgesToStr(edges) {
    return edges.map((e) => e.u + '-' + e.v + (e.w != null ? ':' + e.w : '')).join(',');
  }

  // Compact self-contained node-link SVG: n nodes on a circle, edges drawn as
  // lines (+ optional weight label, + arrowhead marker when directed). The
  // current frame's edge (if any) gets the .gm-edge-active highlight.
  function gmGraphSvg(n, edges, directed, weighted, activeEdge) {
    const CX = 120, CY = 120, R = 90, NR = 16;
    const pos = [];
    for (let i = 0; i < n; i++) {
      const ang = -Math.PI / 2 + (i * 2 * Math.PI) / Math.max(n, 1);
      pos.push({ x: CX + R * Math.cos(ang), y: CY + R * Math.sin(ang) });
    }
    let svg = '<svg viewBox="0 0 240 240" width="240" height="240" class="gm-svg">';
    if (directed) {
      svg += '<defs><marker id="gm-arrow" viewBox="0 0 10 10" refX="9" refY="5" ' +
             'markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#64748b"/></marker></defs>';
    }
    edges.forEach((e) => {
      const a = pos[e.u], b = pos[e.v];
      if (!a || !b) return;
      const isActive = !!(activeEdge && activeEdge.u === e.u && activeEdge.v === e.v);
      const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
      const ux = dx / len, uy = dy / len;
      const pad = directed ? NR + 6 : NR;
      const x1 = a.x + ux * NR, y1 = a.y + uy * NR;
      const x2 = b.x - ux * pad, y2 = b.y - uy * pad;
      svg += '<line class="gm-edge' + (isActive ? ' gm-edge-active' : '') + '" ' +
             'data-u="' + e.u + '" data-v="' + e.v + '" ' +
             'x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"' +
             (directed ? ' marker-end="url(#gm-arrow)"' : '') + '/>';
      if (weighted) {
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        svg += '<text class="gm-edge-label' + (isActive ? ' gm-edge-active' : '') + '" data-u="' + e.u + '" data-v="' + e.v + '" x="' + mx + '" y="' + my + '" text-anchor="middle">' + e.w + '</text>';
      }
    });
    pos.forEach((p, i) => {
      svg += '<circle class="gm-node" cx="' + p.x + '" cy="' + p.y + '" r="' + NR + '"/>' +
             '<text class="gm-node-label" x="' + p.x + '" y="' + (p.y + 5) + '" text-anchor="middle">' + i + '</text>';
    });
    svg += '</svg>';
    return svg;
  }

  // Matrix grid, mirroring floyd-grid: header row (col indices) + n rows each
  // with a row-index header cell + n .gm-cell values. Cells the current frame
  // just filled get .gm-added. A degree row/col (.gm-degree) is always shown,
  // computed live from the frame's own matrix (out-degree per row, in-degree
  // per column) so it reads correctly at every step, not only once `done`.
  function gmMatrixHtml(frame, n) {
    const M = frame.matrix;
    const addedSet = new Set((frame.added || []).map((c) => c.i + ',' + c.j));
    const cols = n + 2; // row-header + n data cols + degree col
    let html = '<div class="gm-grid" style="grid-template-columns: repeat(' + cols + ', 40px);">';
    html += '<div class="gm-hcell"></div>';
    for (let j = 0; j < n; j++) html += '<div class="gm-hcell">' + j + '</div>';
    html += '<div class="gm-hcell gm-degree">deg</div>';
    for (let i = 0; i < n; i++) {
      html += '<div class="gm-hcell">' + i + '</div>';
      let rowSum = 0;
      for (let j = 0; j < n; j++) {
        const v = M[i][j];
        if (v) rowSum++;
        const cls = 'gm-cell' + (addedSet.has(i + ',' + j) ? ' gm-added' : '') + (!v ? ' gm-zero' : '');
        html += '<div class="' + cls + '" data-i="' + i + '" data-j="' + j + '">' + (v || 0) + '</div>';
      }
      html += '<div class="gm-cell gm-degree">' + rowSum + '</div>';
    }
    html += '<div class="gm-hcell gm-degree">deg</div>';
    for (let j = 0; j < n; j++) {
      let colSum = 0;
      for (let i = 0; i < n; i++) if (M[i][j]) colSum++;
      html += '<div class="gm-cell gm-degree">' + colSum + '</div>';
    }
    html += '<div class="gm-cell gm-degree"></div>';
    html += '</div>';
    return html;
  }

  function renderGraphMatrix() {
    const host = K().acquireDynamicVizHost();
    host.innerHTML =
      '<div class="gm-wrap">' +
        '<div class="gm-controls">' +
          '<label>n <input type="text" class="gm-n" value="' + _st.n + '"></label>' +
          '<label>edges <input type="text" class="gm-edges" value="' + edgesToStr(_st.edges) + '"></label>' +
          '<button type="button" class="gm-apply">套用 Apply</button>' +
          buildExamplesSelect('graph-matrix', DEFAULT_SERIALIZED) +
          '<label><input type="checkbox" class="gm-directed"' + (_st.directed ? ' checked' : '') + '> 有向 Directed</label>' +
          '<label><input type="checkbox" class="gm-weighted"' + (_st.weighted ? ' checked' : '') + '> 加權 Weighted</label>' +
        '</div>' +
        '<div class="gm-scroll">' +
          '<div class="gm-graph"></div>' +
          '<div class="gm-matrix"></div>' +
        '</div>' +
        '<div class="gm-msg" data-testid="gm-msg">&nbsp;</div>' +
      '</div>';

    const wrap = host.querySelector('.gm-wrap');
    const graphEl = wrap.querySelector('.gm-graph');
    const matrixEl = wrap.querySelector('.gm-matrix');
    const msgEl = wrap.querySelector('.gm-msg');

    const frames = global.GraphMatrixViz.matrixFrames(_st).frames;

    // Hover correspondence, wired only once the build has fully completed
    // (the final `done` frame — see gmMatrixHtml's addedSet, which at that
    // point marks every filled cell, not just the last step's). Hovering a
    // matrix cell [i][j] highlights the matching edge in the node-link SVG;
    // hovering an edge highlights cell [i][j] (and [j][i] for undirected).
    function clearHoverClasses() {
      graphEl.querySelectorAll('.gm-edge-hover').forEach((el) => el.classList.remove('gm-edge-hover'));
      matrixEl.querySelectorAll('.gm-cell-hover').forEach((el) => el.classList.remove('gm-cell-hover'));
    }
    function wireHover() {
      matrixEl.querySelectorAll('.gm-cell[data-i]').forEach((cell) => {
        const i = +cell.getAttribute('data-i'), j = +cell.getAttribute('data-j');
        cell.addEventListener('mouseenter', () => {
          graphEl.querySelectorAll('[data-u]').forEach((el) => {
            const eu = +el.getAttribute('data-u'), ev = +el.getAttribute('data-v');
            if ((eu === i && ev === j) || (!_st.directed && eu === j && ev === i)) el.classList.add('gm-edge-hover');
          });
        });
        cell.addEventListener('mouseleave', clearHoverClasses);
      });
      graphEl.querySelectorAll('[data-u]').forEach((el) => {
        const u = +el.getAttribute('data-u'), v = +el.getAttribute('data-v');
        el.addEventListener('mouseenter', () => {
          el.classList.add('gm-edge-hover');
          const cellUV = matrixEl.querySelector('.gm-cell[data-i="' + u + '"][data-j="' + v + '"]');
          if (cellUV) cellUV.classList.add('gm-cell-hover');
          if (!_st.directed) {
            const cellVU = matrixEl.querySelector('.gm-cell[data-i="' + v + '"][data-j="' + u + '"]');
            if (cellVU) cellVU.classList.add('gm-cell-hover');
          }
        });
        el.addEventListener('mouseleave', clearHoverClasses);
      });
    }

    function paint(f, i) {
      graphEl.innerHTML = gmGraphSvg(_st.n, _st.edges, _st.directed, _st.weighted, f.edge);
      matrixEl.innerHTML = gmMatrixHtml(f, _st.n);
      msgEl.textContent = K().langOf(f.msg);
      K().showStatus(K().langOf(f.msg), f.done ? '#34d399' : '#60a5fa');
      if (f.done) wireHover();
    }

    wrap.appendChild(K().buildFrameControls(frames, paint, { runIntervalMs: 800 }));

    wrap.querySelector('.gm-directed').addEventListener('change', function () {
      _st.directed = this.checked;
      renderGraphMatrix();
    });
    wrap.querySelector('.gm-weighted').addEventListener('change', function () {
      _st.weighted = this.checked;
      renderGraphMatrix();
    });
    wrap.querySelector('.gm-apply').addEventListener('click', function () {
      const nVal = wrap.querySelector('.gm-n').value;
      const edgesVal = wrap.querySelector('.gm-edges').value;
      const parsed = global.GraphMatrixViz.parseInput(nVal, edgesVal);
      _st.n = parsed.n;
      _st.edges = parsed.edges;
      saveExample('graph-matrix', serialize(_st), DEFAULT_SERIALIZED);
      renderGraphMatrix();
    });
    const exSelect = wrap.querySelector('.ex-select');
    if (exSelect) exSelect.addEventListener('change', function (ev) {
      const v = ev.target.value;
      if (!v) return;
      const parsed = deserialize(v);
      _st.n = parsed.n;
      _st.edges = parsed.edges;
      _st.directed = parsed.directed;
      _st.weighted = parsed.weighted;
      renderGraphMatrix();
    });
  }

  global.VizRegistry.attach('graph-matrix', {
    render: renderGraphMatrix,
    code: () => (typeof codeGraphMatrix !== 'undefined' ? codeGraphMatrix : ''),
    layout: { host: 'dynamic' },
  });
})(typeof window !== 'undefined' ? window : globalThis);
