(function (global) {
  'use strict';
  const K = () => global.VizKit; // resolved at call time (VizKit set at startup)

  // Module state seeded from GraphMatrixViz.SAMPLE. Task 3 wires the n/edges
  // Apply flow + examples select; for now only directed/weighted are live.
  const _st = {
    n: global.GraphMatrixViz.SAMPLE.n,
    edges: global.GraphMatrixViz.SAMPLE.edges.slice(),
    directed: global.GraphMatrixViz.SAMPLE.directed,
    weighted: global.GraphMatrixViz.SAMPLE.weighted,
    idx: 0,
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
             'x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"' +
             (directed ? ' marker-end="url(#gm-arrow)"' : '') + '/>';
      if (weighted) {
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        svg += '<text class="gm-edge-label' + (isActive ? ' gm-edge-active' : '') + '" x="' + mx + '" y="' + my + '" text-anchor="middle">' + e.w + '</text>';
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
        html += '<div class="' + cls + '">' + (v || 0) + '</div>';
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
          '<label>n <input type="text" class="gm-n" value="' + _st.n + '" readonly></label>' +
          '<label>edges <input type="text" class="gm-edges" value="' + edgesToStr(_st.edges) + '" readonly></label>' +
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
    if (_st.idx >= frames.length) _st.idx = frames.length - 1;

    function paint() {
      const f = frames[_st.idx];
      graphEl.innerHTML = gmGraphSvg(_st.n, _st.edges, _st.directed, _st.weighted, f.edge);
      matrixEl.innerHTML = gmMatrixHtml(f, _st.n);
      msgEl.textContent = K().langOf(f.msg);
    }
    function step() {
      if (_st.idx >= frames.length - 1) return false;
      _st.idx++;
      paint();
      K().showStatus(K().langOf(frames[_st.idx].msg), frames[_st.idx].done ? '#34d399' : '#60a5fa');
      return _st.idx < frames.length - 1;
    }
    function reset() {
      _st.idx = 0;
      paint();
    }

    wrap.appendChild(K().buildStepControls(step, reset, 800));
    paint();

    wrap.querySelector('.gm-directed').addEventListener('change', function () {
      _st.directed = this.checked;
      _st.idx = 0;
      renderGraphMatrix();
    });
    wrap.querySelector('.gm-weighted').addEventListener('change', function () {
      _st.weighted = this.checked;
      _st.idx = 0;
      renderGraphMatrix();
    });
  }

  global.VizRegistry.attach('graph-matrix', {
    render: renderGraphMatrix,
    code: () => (typeof codeGraphMatrix !== 'undefined' ? codeGraphMatrix : ''),
    layout: { host: 'dynamic' },
  });
})(typeof window !== 'undefined' ? window : globalThis);
