(function (global) {
  'use strict';
  const SAMPLE = { n: 6, edges: [{u:0,v:1},{u:1,v:2},{u:2,v:0},{u:2,v:3},{u:3,v:4},{u:4,v:3},{u:4,v:5}] };

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

  function sccFrames(cfg) {
    const n = cfg.n, edges = cfg.edges || [];
    const adj = Array.from({ length: n }, () => []);
    const radj = Array.from({ length: n }, () => []);
    edges.forEach((e) => { if (e.u < n && e.v < n) { adj[e.u].push(e.v); radj[e.v].push(e.u); } });
    adj.forEach((l) => l.sort((a, b) => a - b));
    radj.forEach((l) => l.sort((a, b) => a - b));

    const visited = Array(n).fill(false);
    const finishStack = [];
    const comp = Array(n).fill(-1);
    let sccCount = 0;
    const frames = [];
    const mk = (phase, cur, treeEdge, msg, seed) => frames.push({
      phase: phase, cur: cur, treeEdge: treeEdge || null, seed: !!seed,
      visited: visited.slice(), finishStack: finishStack.slice(), comp: comp.slice(), sccCount: sccCount, msg: msg,
    });

    mk('init', null, null, { zh: '從有向圖開始，準備進行 Kosaraju 演算法。', en: "Start from the directed graph; begin Kosaraju's algorithm." });

    function dfs1(u) {
      visited[u] = true;
      mk('p1', u, null, { zh: '第一階段 DFS（在 G 上）：造訪頂點 ' + u + '。', en: 'Phase 1 DFS (on G): visit vertex ' + u + '.' });
      adj[u].forEach((w) => {
        if (!visited[w]) {
          mk('p1', u, { u: u, v: w }, { zh: '沿邊 ' + u + '→' + w + ' 深入。', en: 'Descend along edge ' + u + '→' + w + '.' });
          dfs1(w);
        }
      });
      finishStack.push(u);
      mk('p1', u, null, { zh: '頂點 ' + u + ' 完成，推入完成堆疊（finish stack）。', en: 'Vertex ' + u + ' finished — push it onto the finish stack.' });
    }
    for (let s = 0; s < n; s++) if (!visited[s]) dfs1(s);

    mk('transpose', null, null, { zh: '轉置圖 G → Gᵀ：反轉所有邊的方向。', en: 'Transpose G → Gᵀ: reverse the direction of every edge.' });

    function dfs2(u, cid) {
      comp[u] = cid;
      mk('p2', u, null, { zh: '第二階段（在 Gᵀ 上）：頂點 ' + u + ' 併入 SCC #' + (cid + 1) + '。', en: 'Phase 2 (on Gᵀ): assign vertex ' + u + ' to SCC #' + (cid + 1) + '.' });
      radj[u].forEach((w) => {
        if (comp[w] === -1) {
          mk('p2', u, { u: u, v: w }, { zh: '沿 Gᵀ 的邊 ' + u + '→' + w + ' 深入。', en: 'Descend along Gᵀ edge ' + u + '→' + w + '.' });
          dfs2(w, cid);
        }
      });
    }
    while (finishStack.length) {
      const v = finishStack.pop();
      if (comp[v] === -1) {
        const cid = sccCount;
        sccCount++;                 // count the new SCC now (banner shows it as in-progress)
        mk('p2', v, null, { zh: '從完成堆疊彈出頂點 ' + v + '，開啟新的強連通分量（SCC #' + (cid + 1) + '）。', en: 'Pop vertex ' + v + ' from the finish stack — start a new SCC (#' + (cid + 1) + ').' }, true);
        dfs2(v, cid);
      }
    }

    mk('done', null, null, { zh: '完成：共有 ' + sccCount + ' 個強連通分量（依拓樸順序著色）。', en: 'Done: ' + sccCount + ' strongly connected components (colored in topological order).' });
    return { frames: frames };
  }

  const api = { SAMPLE, parseInput, sccFrames };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.GraphSccViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
