(function (global) {
  'use strict';

  const SAMPLE = {
    n: 6,
    source: 0,
    sink: 5,
    edges: [
      { u: 0, v: 1, capacity: 16 }, { u: 0, v: 2, capacity: 13 },
      { u: 1, v: 2, capacity: 10 }, { u: 2, v: 1, capacity: 4 },
      { u: 1, v: 3, capacity: 12 }, { u: 3, v: 2, capacity: 9 },
      { u: 2, v: 4, capacity: 14 }, { u: 4, v: 3, capacity: 7 },
      { u: 3, v: 5, capacity: 20 }, { u: 4, v: 5, capacity: 4 },
    ],
  };

  const CHALLENGE = {
    n: 8,
    source: 0,
    sink: 7,
    edges: [
      { u: 0, v: 1, capacity: 10 }, { u: 0, v: 2, capacity: 8 },
      { u: 1, v: 3, capacity: 5 }, { u: 1, v: 4, capacity: 5 },
      { u: 2, v: 1, capacity: 3 }, { u: 2, v: 4, capacity: 10 },
      { u: 3, v: 5, capacity: 7 }, { u: 4, v: 3, capacity: 3 },
      { u: 4, v: 6, capacity: 8 }, { u: 5, v: 7, capacity: 9 },
      { u: 6, v: 5, capacity: 3 }, { u: 6, v: 7, capacity: 8 },
    ],
  };

  function cloneConfig(config) {
    return {
      n: config.n,
      source: config.source,
      sink: config.sink,
      edges: config.edges.map((edge) => ({
        u: edge.u, v: edge.v, capacity: edge.capacity,
      })),
    };
  }

  function presetForDifficulty(difficulty) {
    return cloneConfig(difficulty === 'normal' ? SAMPLE : CHALLENGE);
  }

  function randomConfig(difficulty, random) {
    const draw = typeof random === 'function' ? random : Math.random;
    const challenge = difficulty !== 'normal';
    const n = challenge ? 8 : 6;
    const source = 0;
    const sink = n - 1;
    const targetEdges = challenge ? 2 * n : n + 3;
    const maxCapacity = challenge ? 30 : 16;
    const edges = new Map();
    const randomCapacity = () => 2 + Math.floor(Math.max(0, Math.min(0.999999, draw())) * (maxCapacity - 1));
    const addEdge = (u, v) => edges.set(u + '>' + v, { u, v, capacity: randomCapacity() });

    // A source-to-sink backbone guarantees that every generated network has
    // at least one augmenting path. Extra candidates are shuffled so the
    // residual graph still varies from run to run.
    for (let u = 0; u + 1 < n; ++u) addEdge(u, u + 1);
    const candidates = [];
    for (let u = 0; u < n; ++u) {
      for (let v = 0; v < n; ++v) {
        if (u !== v && !edges.has(u + '>' + v)) candidates.push({ u, v });
      }
    }
    for (let i = candidates.length - 1; i > 0; --i) {
      const j = Math.floor(Math.max(0, Math.min(0.999999, draw())) * (i + 1));
      const tmp = candidates[i];
      candidates[i] = candidates[j];
      candidates[j] = tmp;
    }
    for (let i = 0; edges.size < targetEdges && i < candidates.length; ++i) {
      addEdge(candidates[i].u, candidates[i].v);
    }
    return { n, source, sink, edges: Array.from(edges.values()) };
  }

  function parseInput(nText, edgesText, sourceText, sinkText) {
    const errors = [];
    const warnings = [];
    let n = Number(String(nText).trim());
    if (!Number.isInteger(n)) {
      errors.push({ zh: '頂點數 n 必須是整數；已改用 2。', en: 'Vertex count n must be an integer; using 2.' });
      n = 2;
    }
    if (n < 2 || n > 10) {
      warnings.push({ zh: '頂點數限制為 2 到 10；已自動截斷。', en: 'Vertex count is limited to 2…10 and was clamped.' });
      n = Math.max(2, Math.min(10, n));
    }

    const parseVertex = (text, fallback, label) => {
      const value = Number(String(text).trim());
      if (!Number.isInteger(value) || value < 0 || value >= n) {
        errors.push({
          zh: label.zh + '必須介於 0 與 ' + (n - 1) + '；已改用 ' + fallback + '。',
          en: label.en + ' must be between 0 and ' + (n - 1) + '; using ' + fallback + '.',
        });
        return fallback;
      }
      return value;
    };
    const source = parseVertex(sourceText, 0, { zh: '起點', en: 'Source' });
    const sink = parseVertex(sinkText, n - 1, { zh: '終點', en: 'Sink' });
    if (source === sink) {
      errors.push({ zh: '起點與終點必須不同。', en: 'Source and sink must be different.' });
    }

    const aggregated = new Map();
    String(edgesText || '').split(',').forEach((rawToken) => {
      const token = rawToken.trim();
      if (!token) return;
      const match = /^(\d+)\s*(?:->|-)\s*(\d+)\s*:\s*(-?\d+)$/.exec(token);
      if (!match) {
        warnings.push({ zh: '忽略格式錯誤的邊：' + token, en: 'Ignored malformed edge: ' + token });
        return;
      }
      const u = Number(match[1]);
      const v = Number(match[2]);
      const capacity = Number(match[3]);
      if (u >= n || v >= n) {
        warnings.push({ zh: '忽略超出頂點範圍的邊：' + token, en: 'Ignored out-of-range edge: ' + token });
        return;
      }
      if (u === v) {
        warnings.push({ zh: '忽略自迴圈：' + token, en: 'Ignored self-loop: ' + token });
        return;
      }
      if (!Number.isSafeInteger(capacity) || capacity <= 0) {
        warnings.push({ zh: '容量必須是正整數，已忽略：' + token, en: 'Capacity must be a positive integer; ignored: ' + token });
        return;
      }
      const key = u + '>' + v;
      if (aggregated.has(key)) {
        warnings.push({ zh: '重複邊 ' + u + '→' + v + ' 的容量已合併。', en: 'Parallel capacities for ' + u + '→' + v + ' were combined.' });
      }
      aggregated.set(key, (aggregated.get(key) || 0) + capacity);
    });

    const edges = Array.from(aggregated.entries()).map(([key, capacity]) => {
      const pair = key.split('>').map(Number);
      return { u: pair[0], v: pair[1], capacity: capacity };
    }).sort((a, b) => a.u - b.u || a.v - b.v);
    if (!edges.length) {
      warnings.push({ zh: '沒有有效邊；最大流會是 0。', en: 'No valid edges; maximum flow will be 0.' });
    }
    return { n, source, sink, edges, errors, warnings };
  }

  function maxFlowFrames(config) {
    const n = Math.max(0, Number(config.n) || 0);
    const source = Number(config.source);
    const sink = Number(config.sink);
    const edges = (config.edges || []).filter((edge) =>
      Number.isInteger(edge.u) && Number.isInteger(edge.v) &&
      edge.u >= 0 && edge.v >= 0 && edge.u < n && edge.v < n &&
      edge.u !== edge.v && Number.isFinite(edge.capacity) && edge.capacity > 0
    ).map((edge) => ({ u: edge.u, v: edge.v, capacity: edge.capacity }));

    const capacity = Array.from({ length: n }, () => Array(n).fill(0));
    edges.forEach((edge) => { capacity[edge.u][edge.v] += edge.capacity; });
    const adjacencySets = Array.from({ length: n }, () => new Set());
    edges.forEach((edge) => {
      // Include both directions: the reverse direction may become traversable
      // after an augmentation even when it had no original capacity.
      adjacencySets[edge.u].add(edge.v);
      adjacencySets[edge.v].add(edge.u);
    });
    const adjacency = adjacencySets.map((neighbors) => Array.from(neighbors).sort((a, b) => a - b));
    const residual = capacity.map((row) => row.slice());
    const flow = Array.from({ length: n }, () => Array(n).fill(0));
    const frames = [];
    let maxFlow = 0;

    const copyMatrix = (matrix) => matrix.map((row) => row.slice());
    const snapshot = (phase, state, msg) => {
      frames.push({
        phase: phase,
        current: state.current === undefined ? null : state.current,
        inspectedEdge: state.inspectedEdge || null,
        augmentEdge: state.augmentEdge || null,
        path: (state.path || []).map((edge) => ({ u: edge.u, v: edge.v })),
        bottleneck: state.bottleneck || 0,
        queue: (state.queue || []).slice(),
        visited: (state.visited || Array(n).fill(false)).slice(),
        parent: (state.parent || Array(n).fill(-1)).slice(),
        flow: copyMatrix(flow),
        residual: copyMatrix(residual),
        maxFlow: maxFlow,
        minCut: state.minCut ? {
          sourceSide: state.minCut.sourceSide.slice(),
          sinkSide: state.minCut.sinkSide.slice(),
          edges: state.minCut.edges.map((edge) => ({ u: edge.u, v: edge.v, capacity: edge.capacity })),
          capacity: state.minCut.capacity,
        } : null,
        msg: msg,
      });
    };

    if (n < 2 || !Number.isInteger(source) || !Number.isInteger(sink) ||
        source < 0 || sink < 0 || source >= n || sink >= n || source === sink) {
      snapshot('invalid', {}, {
        zh: '輸入無效：需要至少兩個頂點，且起點與終點必須是不同的有效頂點。',
        en: 'Invalid input: use at least two vertices and distinct, valid source and sink vertices.',
      });
      return { frames, maxFlow: 0, capacity };
    }

    snapshot('init', { queue: [source] }, {
      zh: '初始化流量為 0；殘量容量一開始等於原始容量。',
      en: 'Initialize every flow to 0; residual capacities initially equal the original capacities.',
    });

    while (true) {
      const parent = Array(n).fill(-1);
      const visited = Array(n).fill(false);
      const queue = [source];
      let head = 0;
      visited[source] = true;
      snapshot('bfs-start', { queue: queue.slice(head), visited, parent, current: source }, {
        zh: '從起點 ' + source + ' 開始 BFS，在殘量網路中尋找增廣路徑。',
        en: 'Start BFS at source ' + source + ' to find an augmenting path in the residual graph.',
      });

      while (head < queue.length && !visited[sink]) {
        const u = queue[head++];
        snapshot('dequeue', { queue: queue.slice(head), visited, parent, current: u }, {
          zh: '從 BFS 佇列取出頂點 ' + u + '。',
          en: 'Dequeue vertex ' + u + ' from the BFS frontier.',
        });
        for (const v of adjacency[u]) {
          if (visited[sink]) break;
          if (residual[u][v] <= 0) continue;
          snapshot('inspect', {
            queue: queue.slice(head), visited, parent, current: u,
            inspectedEdge: { u, v },
          }, {
            zh: '檢查殘量邊 ' + u + '→' + v + '（剩餘容量 ' + residual[u][v] + '）。',
            en: 'Inspect residual edge ' + u + '→' + v + ' (capacity ' + residual[u][v] + ').',
          });
          if (visited[v]) continue;
          visited[v] = true;
          parent[v] = u;
          queue.push(v);
          snapshot('discover', {
            queue: queue.slice(head), visited, parent, current: v,
            inspectedEdge: { u, v },
          }, {
            zh: '發現頂點 ' + v + '，記錄 parent[' + v + '] = ' + u + ' 並加入佇列。',
            en: 'Discover vertex ' + v + '; set parent[' + v + '] = ' + u + ' and enqueue it.',
          });
        }
      }

      if (!visited[sink]) {
        const sourceSide = [];
        const sinkSide = [];
        visited.forEach((reachable, vertex) => (reachable ? sourceSide : sinkSide).push(vertex));
        const cutEdges = [];
        let cutCapacity = 0;
        for (let u = 0; u < n; ++u) {
          if (!visited[u]) continue;
          for (let v = 0; v < n; ++v) {
            if (visited[v] || capacity[u][v] <= 0) continue;
            cutEdges.push({ u, v, capacity: capacity[u][v] });
            cutCapacity += capacity[u][v];
          }
        }
        const minCut = { sourceSide, sinkSide, edges: cutEdges, capacity: cutCapacity };
        snapshot('done', { visited, parent, minCut }, {
          zh: '找不到增廣路徑。最大流 = ' + maxFlow + '，最小割容量 = ' + cutCapacity + '。',
          en: 'No augmenting path remains. Maximum flow = ' + maxFlow + '; minimum-cut capacity = ' + cutCapacity + '.',
        });
        return { frames, maxFlow, capacity, minCut };
      }

      const path = [];
      let bottleneck = Infinity;
      for (let v = sink; v !== source; v = parent[v]) {
        const u = parent[v];
        path.push({ u, v });
        bottleneck = Math.min(bottleneck, residual[u][v]);
      }
      path.reverse();
      snapshot('path', { path, bottleneck, visited, parent }, {
        zh: '找到最短增廣路徑；瓶頸容量為 ' + bottleneck + '。',
        en: 'Found a shortest augmenting path; its bottleneck capacity is ' + bottleneck + '.',
      });

      for (const edge of path) {
        flow[edge.u][edge.v] += bottleneck;
        flow[edge.v][edge.u] -= bottleneck;
        residual[edge.u][edge.v] -= bottleneck;
        residual[edge.v][edge.u] += bottleneck;
        snapshot('augment', { path, bottleneck, augmentEdge: edge, visited, parent }, {
          zh: '沿 ' + edge.u + '→' + edge.v + ' 增加 ' + bottleneck + '，並建立／增加反向殘量邊。',
          en: 'Augment ' + bottleneck + ' along ' + edge.u + '→' + edge.v + ' and add it to the reverse residual edge.',
        });
      }
      maxFlow += bottleneck;
      snapshot('round-done', { path, bottleneck, visited, parent }, {
        zh: '本輪增廣完成；目前總流量 = ' + maxFlow + '。',
        en: 'Augmentation complete; total flow is now ' + maxFlow + '.',
      });
    }
  }

  const api = {
    SAMPLE,
    CHALLENGE,
    cloneConfig,
    presetForDifficulty,
    randomConfig,
    parseInput,
    maxFlowFrames,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.GraphMaxFlowViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
