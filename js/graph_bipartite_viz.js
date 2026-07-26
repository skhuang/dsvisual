(function (global) {
  'use strict';
  const SAMPLE = { n: 6, edges: [{u:0,v:1},{u:1,v:2},{u:2,v:3},{u:3,v:4},{u:4,v:5},{u:5,v:0}] };

  function parseInput(nStr, edgesStr) {
    let n = parseInt(nStr, 10); if (!Number.isFinite(n) || n < 1) n = 1; if (n > 10) n = 10;
    const edges = [];
    String(edgesStr || '').split(',').forEach((tok) => {
      const m = /^\s*(\d+)\s*-\s*(\d+)\s*(?::\s*\d+)?\s*$/.exec(tok);
      if (!m) return;
      const u = +m[1], v = +m[2];
      if (u < 0 || v < 0 || u >= n || v >= n) return;
      edges.push({ u, v });
    });
    return { n, edges };
  }

  function bipartiteFrames(cfg) {
    const n = cfg.n, edges = cfg.edges || [];
    const adj = Array.from({ length: n }, () => []);
    edges.forEach((e) => {
      if (e.u < 0 || e.v < 0 || e.u >= n || e.v >= n) return;
      adj[e.u].push(e.v);
      if (e.u !== e.v) adj[e.v].push(e.u);
    });
    adj.forEach((lst) => lst.sort((a, b) => a - b));

    const color = Array(n).fill(-1);
    const frames = [];
    const copy = () => color.slice();
    const COL = ['A', 'B'];

    frames.push({ color: copy(), current: null, frontier: [], newly: [], seed: false, conflict: null, bipartite: null, done: false,
      msg: { zh: '從所有頂點皆未著色開始，準備進行 BFS 二著色。', en: 'Start with every vertex uncoloured; begin BFS 2-colouring.' } });

    for (let s = 0; s < n; s++) {
      if (color[s] !== -1) continue;
      color[s] = 0;
      const queue = [s];
      let isSeed = true;
      while (queue.length) {
        const v = queue.shift();
        const newly = [];
        for (let k = 0; k < adj[v].length; k++) {
          const w = adj[v][k];
          if (color[w] === -1) { color[w] = 1 - color[v]; queue.push(w); newly.push(w); }
          else if (color[w] === color[v]) {
            frames.push({ color: copy(), current: v, frontier: queue.slice(), newly: newly.slice(), seed: isSeed,
              conflict: { u: v, v: w }, bipartite: false, done: true,
              msg: { zh: '邊 ' + v + '—' + w + ' 連接兩個同為顏色 ' + COL[color[v]] + ' 的頂點 → 出現奇環，此圖不是二分圖。',
                     en: 'Edge ' + v + '—' + w + ' joins two vertices both coloured ' + COL[color[v]] + ' → odd cycle; the graph is NOT bipartite.' } });
            return { frames: frames };
          }
        }
        const other = COL[1 - color[v]];
        const enLbl = newly.length ? (' Colour neighbour' + (newly.length > 1 ? 's ' : ' ') + newly.join(', ') + ' ' + other + '.') : ' No uncoloured neighbours.';
        const zhLbl = newly.length ? ('，將鄰居 ' + newly.join('、') + ' 著色為 ' + other + '。') : '，沒有可著色的鄰居。';
        const msg = isSeed
          ? { zh: '頂點 ' + v + ' 開啟一輪 BFS，著色為 ' + COL[color[v]] + zhLbl,
              en: 'Vertex ' + v + ' seeds a BFS, coloured ' + COL[color[v]] + '.' + enLbl }
          : { zh: '處理頂點 ' + v + '（顏色 ' + COL[color[v]] + '）' + zhLbl,
              en: 'Process vertex ' + v + ' (colour ' + COL[color[v]] + ').' + enLbl };
        frames.push({ color: copy(), current: v, frontier: queue.slice(), newly: newly, seed: isSeed, conflict: null, bipartite: null, done: false, msg: msg });
        isSeed = false;
      }
    }

    const v1 = [], v2 = [];
    for (let i = 0; i < n; i++) { if (color[i] === 0) v1.push(i); else if (color[i] === 1) v2.push(i); }
    frames.push({ color: copy(), current: null, frontier: [], newly: [], seed: false, conflict: null, bipartite: true, done: true, classes: { v1: v1, v2: v2 },
      msg: { zh: '完成：此圖是二分圖。V₁ = {' + v1.join('、') + '}、V₂ = {' + v2.join('、') + '}。',
             en: 'Done: the graph is bipartite. V1 = {' + v1.join(', ') + '}, V2 = {' + v2.join(', ') + '}.' } });
    return { frames: frames };
  }

  const api = { SAMPLE, parseInput, bipartiteFrames };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.GraphBipartiteViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
