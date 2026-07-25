(function (global) {
  'use strict';
  const SAMPLE = { n: 5, edges: [{ u: 0, v: 1 }, { u: 2, v: 3 }] };

  function parseInput(nStr, edgesStr) {
    let n = parseInt(nStr, 10); if (!Number.isFinite(n) || n < 1) n = 1; if (n > 10) n = 10;
    const edges = [];
    String(edgesStr || '').split(',').forEach((tok) => {
      const m = /^\s*(\d+)\s*-\s*(\d+)\s*(?::\s*\d+)?\s*$/.exec(tok); // :w tolerated but ignored
      if (!m) return;
      const u = +m[1], v = +m[2];
      if (u < 0 || v < 0 || u >= n || v >= n) return;
      edges.push({ u, v });
    });
    return { n, edges };
  }

  function componentsFrames(cfg) {
    const n = cfg.n, edges = cfg.edges || [];
    // Undirected adjacency; sort neighbour lists for deterministic order.
    const adj = Array.from({ length: n }, () => []);
    edges.forEach((e) => {
      if (e.u < 0 || e.v < 0 || e.u >= n || e.v >= n) return;
      adj[e.u].push(e.v);
      if (e.u !== e.v) adj[e.v].push(e.u);
    });
    adj.forEach((lst) => lst.sort((a, b) => a - b));

    const comp = Array(n).fill(-1);
    const frames = [];
    const copy = () => comp.slice();

    frames.push({ comp: copy(), current: null, frontier: [], newly: [], k: 0, seed: false, done: false,
      msg: { zh: '從所有頂點皆未標記開始（尚無連通分量）。', en: 'Start with every vertex unlabelled (no components yet).' } });

    let k = 0;
    for (let s = 0; s < n; s++) {
      if (comp[s] !== -1) continue;
      comp[s] = k;
      const queue = [s];
      let isSeed = true;
      while (queue.length) {
        const v = queue.shift();
        const newly = [];
        adj[v].forEach((w) => { if (comp[w] === -1) { comp[w] = k; queue.push(w); newly.push(w); } });
        const enLbl = newly.length ? (' Enqueue neighbour' + (newly.length > 1 ? 's ' : ' ') + newly.join(', ') + '.') : ' No new neighbours.';
        const zhLbl = newly.length ? ('，將鄰居 ' + newly.join('、') + ' 加入佇列。') : '，沒有新的鄰居。';
        const msg = isSeed
          ? { zh: '頂點 ' + v + ' 開啟新的連通分量（第 ' + (k + 1) + ' 個）' + zhLbl,
              en: 'Vertex ' + v + ' starts a new component (#' + (k + 1) + ').' + enLbl }
          : { zh: '處理頂點 ' + v + '（第 ' + (k + 1) + ' 個連通分量）' + zhLbl,
              en: 'Process vertex ' + v + ' (component #' + (k + 1) + ').' + enLbl };
        frames.push({ comp: copy(), current: v, frontier: queue.slice(), newly, k: k + 1, seed: isSeed, done: false, msg });
        isSeed = false;
      }
      k++;
    }

    frames.push({ comp: copy(), current: null, frontier: [], newly: [], k, seed: false, done: true,
      msg: { zh: '完成：共有 ' + k + ' 個連通分量。', en: 'Done: ' + k + ' connected component' + (k === 1 ? '' : 's') + '.' } });

    return { frames };
  }

  const api = { SAMPLE, parseInput, componentsFrames };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.GraphComponentsViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
