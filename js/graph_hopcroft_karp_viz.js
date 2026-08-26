(function (global) {
  'use strict';

  const INF = Number.POSITIVE_INFINITY;

  function cloneMatching(pairU) {
    const result = [];

    for (let u = 0; u < pairU.length; u++) {
      if (pairU[u] !== -1) {
        result.push([u, pairU[u]]);
      }
    }

    return result;
  }

  function cloneLayers(dist) {
    const result = {};

    for (let u = 0; u < dist.length; u++) {
      if (Number.isFinite(dist[u])) {
        result[u] = dist[u];
      }
    }

    return result;
  }

  function generateFrames(nLeft, nRight, inputEdges) {
    const edges = [];
    const seen = new Set();

    for (const edge of inputEdges || []) {
      const u = Number(edge[0]);
      const v = Number(edge[1]);

      if (
        Number.isInteger(u) &&
        Number.isInteger(v) &&
        u >= 0 &&
        u < nLeft &&
        v >= 0 &&
        v < nRight
      ) {
        const key = `${u}-${v}`;

        if (!seen.has(key)) {
          seen.add(key);
          edges.push([u, v]);
        }
      }
    }

    const adj = Array.from(
      { length: nLeft },
      () => []
    );

    for (const [u, v] of edges) {
      adj[u].push(v);
    }

    for (const row of adj) {
      row.sort((a, b) => a - b);
    }

    const pairU = Array(nLeft).fill(-1);
    const pairV = Array(nRight).fill(-1);
    const dist = Array(nLeft).fill(INF);

    const frames = [];

    let matching = 0;
    let phase = 0;
    let shortestPath = INF;

    function pushFrame(options) {
      frames.push({
        title: options.title,
        message: options.message,

        data: {
          nLeft,
          nRight,
          edges: edges.map(
            ([u, v]) => [u, v]
          ),
          matching: cloneMatching(pairU)
        },

        layers:
          options.layers !== undefined
            ? options.layers
            : cloneLayers(dist),

        queue:
          options.queue !== undefined
            ? [...options.queue]
            : [],

        inspectEdges:
          options.inspectEdges
            ? options.inspectEdges.map(
                ([u, v]) => [u, v]
              )
            : [],

        pathEdges:
          options.pathEdges
            ? options.pathEdges.map(
                ([u, v]) => [u, v]
              )
            : [],

        currentU:
          options.currentU !== undefined
            ? options.currentU
            : null,

        currentV:
          options.currentV !== undefined
            ? options.currentV
            : null,

        phase,
        matchingSize: matching
      });
    }

    pushFrame({
      title: 'Step 0 — Initial graph',
      message:
        '初始狀態：所有左右頂點皆尚未匹配。',
      layers: {},
      queue: []
    });

    function bfs() {
      phase++;
      shortestPath = INF;

      const queue = [];
      let head = 0;

      for (let u = 0; u < nLeft; u++) {
        if (pairU[u] === -1) {
          dist[u] = 0;
          queue.push(u);
        } else {
          dist[u] = INF;
        }
      }

      pushFrame({
        title: `BFS Phase ${phase} — Start`,
        message:
          '將所有尚未匹配的左側頂點加入 BFS 佇列，並設為第 0 層。',
        queue: queue.map(u => `U${u}`)
      });

      while (head < queue.length) {
        const u = queue[head++];

        if (dist[u] + 1 > shortestPath) {
          continue;
        }

        for (const v of adj[u]) {
          const matchedU = pairV[v];

          pushFrame({
            title: `BFS Phase ${phase} — Inspect U${u}-V${v}`,
            message:
              `BFS 檢查 U${u} 到 V${v}。`,
            queue:
              queue
                .slice(head)
                .map(x => `U${x}`),
            inspectEdges: [[u, v]],
            currentU: u,
            currentV: v
          });

          if (matchedU === -1) {
            shortestPath = Math.min(
              shortestPath,
              dist[u] + 1
            );

            pushFrame({
              title:
                `BFS Phase ${phase} — Free V${v}`,
              message:
                `V${v} 尚未匹配，因此找到一條可能結束於此的最短增廣路徑。`,
              queue:
                queue
                  .slice(head)
                  .map(x => `U${x}`),
              inspectEdges: [[u, v]],
              currentU: u,
              currentV: v
            });
          }

          else if (
            dist[matchedU] === INF &&
            dist[u] + 1 < shortestPath
          ) {
            dist[matchedU] =
              dist[u] + 1;

            queue.push(matchedU);

            pushFrame({
              title:
                `BFS Phase ${phase} — Layer U${matchedU}`,
              message:
                `V${v} 已與 U${matchedU} 匹配，因此沿匹配邊回到 U${matchedU}，設定 dist(U${matchedU}) = ${dist[matchedU]}。`,
              queue:
                queue
                  .slice(head)
                  .map(x => `U${x}`),

              // 只把正在走的未匹配邊標成橘色。
              // 既有 matching 仍會保持綠色。
              inspectEdges: [[u, v]],

              currentU: matchedU,
              currentV: v
            });
          }
        }
      }

      return shortestPath !== INF;
    }

    function dfsFind(u, active) {
      active.add(u);

      for (const v of adj[u]) {
        const matchedU = pairV[v];

        pushFrame({
          title: `DFS — Inspect U${u}-V${v}`,
          message:
            `DFS 從 U${u} 嘗試邊 U${u}-V${v}。`,
          inspectEdges: [[u, v]],
          currentU: u,
          currentV: v
        });

        if (
          matchedU === -1 &&
          dist[u] + 1 === shortestPath
        ) {
          active.delete(u);

          return {
            newPairs: [[u, v]],
            pathEdges: [[u, v]]
          };
        }

        if (
          matchedU !== -1 &&
          !active.has(matchedU) &&
          dist[matchedU] === dist[u] + 1
        ) {
          const tail =
            dfsFind(matchedU, active);

          if (tail) {
            active.delete(u);

            return {
              newPairs:
                [[u, v]].concat(
                  tail.newPairs
                ),

              pathEdges:
                [
                  [u, v],
                  [matchedU, v]
                ].concat(
                  tail.pathEdges
                )
            };
          }
        }
      }

      dist[u] = INF;
      active.delete(u);

      pushFrame({
        title: `DFS — Dead end at U${u}`,
        message:
          `U${u} 在目前 BFS 分層中沒有可用的最短增廣路徑。`,
        currentU: u
      });

      return null;
    }

    while (bfs()) {
      for (let u = 0; u < nLeft; u++) {
        if (pairU[u] !== -1) {
          continue;
        }

        pushFrame({
          title: `DFS — Start from U${u}`,
          message:
            `從自由左側頂點 U${u} 開始 DFS，並只沿 BFS 建立的分層前進。`,
          currentU: u
        });

        const found =
          dfsFind(u, new Set());

        if (!found) {
          continue;
        }

        pushFrame({
          title: 'Shortest augmenting path',
          message:
            '找到符合 BFS 分層的最短增廣路徑，紫色顯示整條 alternating path。',
          pathEdges: found.pathEdges
        });

        for (const [pathU, pathV]
          of found.newPairs) {

          pairU[pathU] = pathV;
          pairV[pathV] = pathU;
        }

        matching++;

        pushFrame({
          title:
            `Augment — Matching size = ${matching}`,
          message:
            `翻轉增廣路徑後，匹配大小增加為 ${matching}。`,
          layers: {},
          queue: []
        });
      }
    }

    pushFrame({
      title: 'Done — Maximum matching',
      message:
        `已無新的增廣路徑，因此最大匹配大小為 ${matching}。`,
      layers: {},
      queue: []
    });

    return {
      frames,
      matching,
      pairU: [...pairU],
      pairV: [...pairV]
    };
  }

  const api = {
    generateFrames
  };

  if (
    typeof module !== 'undefined' &&
    module.exports
  ) {
    module.exports = api;
  }

  global.GraphHopcroftKarpViz = api;

})(
  typeof window !== 'undefined'
    ? window
    : globalThis
);