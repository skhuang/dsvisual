(function (global) {
  'use strict';
  const SAMPLE = { n: 4, edges: [{u:0,v:1},{u:1,v:2},{u:2,v:3},{u:3,v:1}] };

  function parseInput(nStr, edgesStr) {
    let n = parseInt(nStr, 10); if (!Number.isFinite(n) || n < 1) n = 1; if (n > 10) n = 10;
    const edges = [];
    String(edgesStr || '').split(',').forEach((tok) => {
      const m = /^\s*(\d+)\s*-\s*(\d+)\s*(?::\s*\d+)?\s*$/.exec(tok);
      if (!m) return;
      const u = +m[1], v = +m[2];
      if (u < 0 || v < 0 || u >= n || v >= n) return;
      edges.push({ u, v });                 // directed
    });
    return { n, edges };
  }

  function closureFrames(cfg) {
    const n = cfg.n, edges = cfg.edges || [];
    const R = Array.from({ length: n }, () => Array(n).fill(0));
    const orig = Array.from({ length: n }, () => Array(n).fill(0));
    edges.forEach((e) => { if (e.u < n && e.v < n) { R[e.u][e.v] = 1; orig[e.u][e.v] = 1; } });
    const frames = [];
    const snap = () => R.map((r) => r.slice());
    function reachEdges() {
      const out = [];
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++)
        if (i !== j && R[i][j] && !orig[i][j]) out.push({ u: i, v: j });
      return out;
    }
    frames.push({ R: snap(), k: null, cur: null, phase: 'init', reach: [],
      msg: { zh: '從相鄰矩陣開始（R = 直接邊）。', en: 'Start from the adjacency matrix (R = direct edges).' } });
    for (let k = 0; k < n; k++) {
      frames.push({ R: snap(), k: k, cur: null, phase: 'pivot', reach: reachEdges(),
        msg: { zh: '以頂點 ' + k + ' 為中介點（pivot）：尋找 i → ' + k + ' → j 的路徑。',
               en: 'Pivot on vertex ' + k + ': look for paths i → ' + k + ' → j.' } });
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        if (!R[i][j] && R[i][k] && R[k][j]) {
          R[i][j] = 1;
          frames.push({ R: snap(), k: k, cur: { i: i, j: j }, phase: 'set', reach: reachEdges(),
            msg: { zh: 'R[' + i + '][' + j + '] ← 1：因為 R[' + i + '][' + k + '] 且 R[' + k + '][' + j + ']（' + i + ' 可經由 ' + k + ' 到達 ' + j + '）。',
                   en: 'R[' + i + '][' + j + '] ← 1: since R[' + i + '][' + k + '] and R[' + k + '][' + j + '] (' + i + ' reaches ' + j + ' via ' + k + ').' } });
        }
      }
    }
    frames.push({ R: snap(), k: null, cur: null, phase: 'done', reach: reachEdges(),
      msg: { zh: '遞移閉包完成：R[i][j]=1 表示 i 可到達 j。', en: 'Transitive closure complete: R[i][j]=1 means i can reach j.' } });
    return { frames: frames };
  }

  const api = { SAMPLE, parseInput, closureFrames };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.GraphClosureViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
