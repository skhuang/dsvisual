(function (global) {
  'use strict';
  const SAMPLE = { n: 5, directed: false, weighted: false, edges: [
    {u:0,v:1,w:4},{u:0,v:4,w:1},{u:1,v:2,w:3},{u:1,v:3,w:2},{u:1,v:4,w:5},{u:2,v:3,w:6},{u:3,v:4,w:7}
  ] };
  function parseInput(nStr, edgesStr) {
    let n = parseInt(nStr, 10); if (!Number.isFinite(n) || n < 1) n = 1; if (n > 10) n = 10;
    const edges = [];
    String(edgesStr || '').split(',').forEach((tok) => {
      const m = /^\s*(\d+)\s*-\s*(\d+)\s*(?::\s*(\d+))?\s*$/.exec(tok);
      if (!m) return;
      const u = +m[1], v = +m[2], w = m[3] != null ? +m[3] : 1;
      if (u < 0 || v < 0 || u >= n || v >= n) return;
      edges.push({ u, v, w });
    });
    return { n, edges };
  }
  function matrixFrames(cfg) {
    const n = cfg.n, directed = !!cfg.directed, weighted = !!cfg.weighted, edges = cfg.edges || [];
    const M = Array.from({ length: n }, () => Array(n).fill(0));
    const frames = [];
    function msgFor(edge, added, done) {
      if (done) return { zh: '矩陣建立完成；每列之和為出分支度、每行之和為入分支度。', en: 'Matrix complete; row sums = out-degree, column sums = in-degree.' };
      if (!edge) return { zh: '從空的相鄰矩陣開始（全部為 0）。', en: 'Start from an empty adjacency matrix (all zeros).' };
      const val = weighted ? edge.w : 1;
      const cellStrs = added.map((c) => '[' + c.i + '][' + c.j + ']=' + val);
      const zhCells = cellStrs.join('、'), enCells = cellStrs.join(', ');
      return { zh: '加入邊 ' + edge.u + (directed ? '→' : '—') + edge.v + '，填入 ' + zhCells + (directed ? '' : '（對稱）') + '。',
               en: 'Add edge ' + edge.u + (directed ? '→' : '—') + edge.v + ' → set ' + enCells + (directed ? '' : ' (symmetric)') + '.' };
    }
    function snap(added, edge, done) { return { matrix: M.map((r) => r.slice()), added: added, edge: edge, done: !!done, msg: msgFor(edge, added, done) }; }
    frames.push(snap([], null, false));
    edges.forEach((e) => {
      const val = weighted ? e.w : 1, added = [{ i: e.u, j: e.v }];
      M[e.u][e.v] = val;
      if (!directed && e.u !== e.v) { M[e.v][e.u] = val; added.push({ i: e.v, j: e.u }); }
      frames.push(snap(added, e, false));
    });
    const out = M.map((r) => r.reduce((s, x) => s + (x ? 1 : 0), 0));
    const inn = Array.from({ length: n }, (_, j) => M.reduce((s, r) => s + (r[j] ? 1 : 0), 0));
    const last = snap([], null, true); last.degree = { out: out, in: inn, undirected: !directed };
    frames.push(last);
    return { frames: frames };
  }
  const api = { SAMPLE, parseInput, matrixFrames };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.GraphMatrixViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
