(function (global) {
  'use strict';

  // Undirected Euler trail / circuit via Hierholzer's algorithm (Chapter 6).
  //
  // Parallel edges are kept as distinct edges on purpose: the Konigsberg bridge
  // problem that started graph theory has two bridges between the same pair of
  // banks, and aggregating them would destroy the very degrees the theorem is
  // about.

  // All degrees even and connected -> Euler circuit.
  const SAMPLE = {
    n: 5,
    start: 0,
    edges: [
      { u: 0, v: 1 }, { u: 1, v: 2 }, { u: 2, v: 0 },
      { u: 2, v: 3 }, { u: 3, v: 4 }, { u: 4, v: 2 },
    ],
  };

  // Exactly two odd vertices (0 and 5) -> Euler path, not a circuit. Two
  // triangles hinge on vertex 2, so a greedy walk that picks the wrong side
  // first must back out - this is the preset that shows why the algorithm
  // needs its stack.
  const CHALLENGE = {
    n: 6,
    start: 5,
    edges: [
      { u: 0, v: 1 }, { u: 1, v: 2 }, { u: 2, v: 0 },
      { u: 2, v: 3 }, { u: 3, v: 4 }, { u: 4, v: 2 },
      { u: 0, v: 5 },
    ],
  };

  // Konigsberg, 1736: banks 0/1, islands 2/3, seven bridges. All four vertices
  // have odd degree, so no Euler trail exists - Euler's original answer.
  const KONIGSBERG = {
    n: 4,
    start: 0,
    edges: [
      { u: 0, v: 2 }, { u: 0, v: 2 }, { u: 0, v: 3 },
      { u: 1, v: 2 }, { u: 1, v: 2 }, { u: 1, v: 3 },
      { u: 2, v: 3 },
    ],
  };

  // Every degree is even, yet there is no Euler circuit: the edges form two
  // components. Shows that the parity test alone is not sufficient.
  const DISCONNECTED = {
    n: 6,
    start: 0,
    edges: [
      { u: 0, v: 1 }, { u: 1, v: 2 }, { u: 2, v: 0 },
      { u: 3, v: 4 }, { u: 4, v: 5 }, { u: 5, v: 3 },
    ],
  };

  function cloneConfig(config) {
    return {
      n: config.n,
      start: config.start,
      edges: config.edges.map((edge) => ({ u: edge.u, v: edge.v })),
    };
  }

  function presetForDifficulty(difficulty) {
    return cloneConfig(difficulty === 'normal' ? SAMPLE : CHALLENGE);
  }

  function sanitizeEdges(n, edges) {
    return (edges || []).filter((edge) =>
      Number.isInteger(edge.u) && Number.isInteger(edge.v) &&
      edge.u >= 0 && edge.v >= 0 && edge.u < n && edge.v < n && edge.u !== edge.v
    ).map((edge) => ({ u: edge.u, v: edge.v }));
  }

  function degreesOf(n, edges) {
    const degrees = Array(n).fill(0);
    edges.forEach((edge) => { degrees[edge.u] += 1; degrees[edge.v] += 1; });
    return degrees;
  }

  // Connectivity only has to hold over vertices that actually carry an edge;
  // isolated vertices can never appear in a trail, so they are ignored.
  function edgesConnected(n, edges, degrees) {
    const seed = degrees.findIndex((degree) => degree > 0);
    if (seed === -1) return true;
    const adjacency = Array.from({ length: n }, () => []);
    edges.forEach((edge) => { adjacency[edge.u].push(edge.v); adjacency[edge.v].push(edge.u); });
    const seen = Array(n).fill(false);
    const stack = [seed];
    seen[seed] = true;
    while (stack.length) {
      const u = stack.pop();
      adjacency[u].forEach((v) => { if (!seen[v]) { seen[v] = true; stack.push(v); } });
    }
    return degrees.every((degree, vertex) => degree === 0 || seen[vertex]);
  }

  // 'circuit' | 'path' | 'none' plus the reason a 'none' verdict was reached.
  function classify(n, edges) {
    const degrees = degreesOf(n, edges);
    const odd = [];
    degrees.forEach((degree, vertex) => { if (degree % 2 === 1) odd.push(vertex); });
    const connected = edgesConnected(n, edges, degrees);
    let verdict = 'none';
    let reason = null;
    if (!edges.length) reason = 'empty';
    else if (!connected) reason = 'disconnected';
    else if (odd.length === 0) verdict = 'circuit';
    else if (odd.length === 2) verdict = 'path';
    else reason = 'odd';
    return { degrees, odd, connected, verdict, reason };
  }

  // An Euler path has to begin at one of the two odd vertices; a circuit may
  // begin anywhere that has an edge. Returns the corrected vertex so the UI can
  // explain the correction instead of silently producing a wrong walk.
  function resolveStart(requested, info) {
    const { degrees, odd, verdict } = info;
    if (verdict === 'path') {
      return odd.indexOf(requested) >= 0 ? requested : odd[0];
    }
    if (verdict === 'circuit') {
      return degrees[requested] > 0 ? requested : degrees.findIndex((degree) => degree > 0);
    }
    return requested;
  }

  function randomConfig(difficulty, random) {
    const draw = typeof random === 'function' ? random : Math.random;
    const pick = (limit) => Math.floor(Math.max(0, Math.min(0.999999, draw())) * limit);
    const challenge = difficulty !== 'normal';
    const n = challenge ? 7 : 5;
    const edges = [];
    // A union of edge-disjoint cycles leaves every degree even, and anchoring
    // each new cycle on an already-used vertex keeps the whole thing connected,
    // so a normal-tier random graph always has an Euler circuit.
    const used = [0];
    const rings = challenge ? 3 : 2;
    for (let ring = 0; ring < rings; ++ring) {
      const anchor = used[pick(used.length)];
      const pool = [];
      for (let vertex = 0; vertex < n; ++vertex) {
        if (vertex !== anchor) pool.push(vertex);
      }
      // Prefer vertices not used yet so the drawing does not leave stragglers.
      pool.sort((a, b) => (used.indexOf(a) >= 0 ? 1 : 0) - (used.indexOf(b) >= 0 ? 1 : 0));
      const length = 2 + pick(2);
      const cycle = [anchor].concat(pool.slice(0, length));
      for (let i = 0; i < cycle.length; ++i) {
        edges.push({ u: cycle[i], v: cycle[(i + 1) % cycle.length] });
      }
      cycle.forEach((vertex) => { if (used.indexOf(vertex) === -1) used.push(vertex); });
    }
    let start = used[0];
    if (challenge) {
      // One extra edge flips exactly two degrees to odd, turning the circuit
      // into an Euler path that must start at one of them.
      const a = used[pick(used.length)];
      let b = used[pick(used.length)];
      if (a === b) b = used[(used.indexOf(a) + 1) % used.length];
      if (a !== b) { edges.push({ u: a, v: b }); start = a; }
    }
    return { n, start, edges };
  }

  function parseInput(nText, edgesText, startText) {
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

    const edges = [];
    String(edgesText || '').split(',').forEach((rawToken) => {
      const token = rawToken.trim();
      if (!token) return;
      const match = /^(\d+)\s*(?:-|--)\s*(\d+)$/.exec(token);
      if (!match) {
        warnings.push({ zh: '忽略格式錯誤的邊：' + token, en: 'Ignored malformed edge: ' + token });
        return;
      }
      const u = Number(match[1]);
      const v = Number(match[2]);
      if (u >= n || v >= n) {
        warnings.push({ zh: '忽略超出頂點範圍的邊：' + token, en: 'Ignored out-of-range edge: ' + token });
        return;
      }
      if (u === v) {
        warnings.push({ zh: '忽略自迴圈：' + token, en: 'Ignored self-loop: ' + token });
        return;
      }
      // Parallel edges are kept, not merged - Konigsberg needs them.
      edges.push({ u, v });
    });
    if (edges.length > 24) {
      warnings.push({ zh: '邊數上限為 24；多餘的邊已忽略。', en: 'Edge count is capped at 24; extra edges were dropped.' });
      edges.length = 24;
    }

    let start = Number(String(startText).trim());
    if (!Number.isInteger(start) || start < 0 || start >= n) {
      errors.push({
        zh: '起點必須介於 0 與 ' + (n - 1) + '；已改用 0。',
        en: 'Start vertex must be between 0 and ' + (n - 1) + '; using 0.',
      });
      start = 0;
    }
    if (!edges.length) {
      warnings.push({ zh: '沒有有效邊；不存在尤拉迴路。', en: 'No valid edges; there is no Euler circuit.' });
    }
    return { n, start, edges, errors, warnings };
  }

  function eulerFrames(config) {
    const n = Math.max(0, Number(config.n) || 0);
    const edges = sanitizeEdges(n, config.edges);
    const requestedStart = Number(config.start);
    const frames = [];

    const used = Array(edges.length).fill(false);
    const takenAt = Array(edges.length).fill(-1);
    let stack = [];
    let output = [];

    const snapshot = (phase, state, msg) => {
      frames.push({
        phase: phase,
        current: state.current === undefined ? null : state.current,
        checking: state.checking === undefined ? null : state.checking,
        edgeTaken: state.edgeTaken === undefined ? null : state.edgeTaken,
        stack: stack.slice(),
        // `output` is built back-to-front; its reverse is always a finalized
        // suffix of the answer, which is what the panel shows.
        output: output.slice(),
        circuit: output.slice().reverse(),
        used: used.slice(),
        takenAt: takenAt.slice(),
        degrees: state.degrees ? state.degrees.slice() : [],
        odd: state.odd ? state.odd.slice() : [],
        verdict: state.verdict === undefined ? null : state.verdict,
        connected: state.connected === undefined ? null : state.connected,
        start: state.start === undefined ? null : state.start,
        msg: msg,
      });
    };

    if (n < 2 || !Number.isInteger(requestedStart) || requestedStart < 0 || requestedStart >= n) {
      snapshot('invalid', {}, {
        zh: '輸入無效：需要至少兩個頂點，且起點必須是有效頂點。',
        en: 'Invalid input: use at least two vertices and a valid start vertex.',
      });
      return { frames, verdict: 'none', reason: 'invalid', trail: [], degrees: [], odd: [] };
    }

    const info = classify(n, edges);
    const { degrees, odd, connected } = info;
    const base = { degrees, odd, connected, verdict: info.verdict };

    snapshot('degrees', Object.assign({}, base, { verdict: null }), {
      zh: '先數每個頂點的度數：一條邊為它的兩個端點各加 1。',
      en: 'First count every degree: each edge adds 1 to both of its endpoints.',
    });
    for (let vertex = 0; vertex < n; ++vertex) {
      const even = degrees[vertex] % 2 === 0;
      snapshot('degrees', Object.assign({}, base, { verdict: null, checking: vertex }), {
        zh: '頂點 ' + vertex + ' 的度數為 ' + degrees[vertex] + '（' + (even ? '偶數' : '奇數') + '）。',
        en: 'Vertex ' + vertex + ' has degree ' + degrees[vertex] + ' (' + (even ? 'even' : 'odd') + ').',
      });
    }

    if (info.verdict === 'none') {
      const reasons = {
        empty: {
          zh: '圖中沒有邊，因此沒有可走的尤拉迴路。',
          en: 'The graph has no edges, so there is no Euler circuit to walk.',
        },
        disconnected: {
          zh: '有邊的頂點分屬不同連通分量。度數全為偶數還不夠——邊必須連成一塊。',
          en: 'The edges span more than one component. Even degrees are not enough — the edges must also be connected.',
        },
        odd: {
          zh: '奇數度頂點有 ' + odd.length + ' 個（' + odd.join(', ') + '）。尤拉迴路需要 0 個、尤拉路徑需要剛好 2 個，因此都不存在。',
          en: 'There are ' + odd.length + ' odd-degree vertices (' + odd.join(', ') + '). A circuit needs 0 and a path needs exactly 2, so neither exists.',
        },
      };
      snapshot('verdict', base, reasons[info.reason] || reasons.empty);
      return { frames, verdict: 'none', reason: info.reason, trail: [], degrees, odd };
    }

    const start = resolveStart(requestedStart, info);
    const corrected = start !== requestedStart;
    const verdictMsg = info.verdict === 'circuit'
      ? {
        zh: '所有度數皆為偶數且連通 → 存在尤拉迴路（起點 = 終點）。從頂點 ' + start + ' 出發。' +
            (corrected ? '（原本指定的起點沒有邊，已改用 ' + start + '。）' : ''),
        en: 'All degrees are even and the edges are connected → an Euler circuit exists (start = end). Starting at vertex ' + start + '.' +
            (corrected ? ' (The requested start had no edges, so ' + start + ' is used.)' : ''),
      }
      : {
        zh: '恰有 2 個奇數度頂點（' + odd.join(' 與 ') + '）→ 存在尤拉路徑，且必須從其中一個奇點出發、在另一個結束。從頂點 ' + start + ' 出發。' +
            (corrected ? '（原本指定的起點不是奇點，已改用 ' + start + '。）' : ''),
        en: 'Exactly 2 odd-degree vertices (' + odd.join(' and ') + ') → an Euler path exists and must start at one of them and end at the other. Starting at vertex ' + start + '.' +
            (corrected ? ' (The requested start was not odd, so ' + start + ' is used.)' : ''),
      };
    snapshot('verdict', Object.assign({}, base, { start, current: start }), verdictMsg);

    // Adjacency stores edge ids so parallel edges stay distinguishable; the
    // per-vertex cursor `cursor[v]` never rewinds, which is what keeps the
    // whole walk O(V + E) instead of O(V * E).
    const adjacency = Array.from({ length: n }, () => []);
    edges.forEach((edge, id) => {
      adjacency[edge.u].push({ to: edge.v, id });
      adjacency[edge.v].push({ to: edge.u, id });
    });
    const cursor = Array(n).fill(0);

    stack = [start];
    snapshot('push', Object.assign({}, base, { start, current: start }), {
      zh: '把起點 ' + start + ' 推入堆疊。堆疊保存「還沒走完的路」，輸出串列保存「已定案的尾段」。',
      en: 'Push start vertex ' + start + '. The stack holds the unfinished walk; the output list holds the finalized tail of the answer.',
    });

    let steps = 0;
    let order = 0;
    const guard = edges.length * 2 + n * 2 + 8;
    while (stack.length && steps <= guard) {
      steps += 1;
      const v = stack[stack.length - 1];
      while (cursor[v] < adjacency[v].length && used[adjacency[v][cursor[v]].id]) cursor[v] += 1;
      if (cursor[v] < adjacency[v].length) {
        const link = adjacency[v][cursor[v]];
        cursor[v] += 1;
        used[link.id] = true;
        // The order the walk *took* the edge, which is deliberately not the
        // order it appears in the final trail - that gap is the whole point of
        // the reversal at the end.
        order += 1;
        takenAt[link.id] = order;
        stack.push(link.to);
        snapshot('advance', Object.assign({}, base, {
          start, current: link.to, edgeTaken: { u: v, v: link.to, id: link.id },
        }), {
          zh: '從 ' + v + ' 走未使用的邊到 ' + link.to + '，標記該邊已用並把 ' + link.to + ' 推入堆疊。',
          en: 'Walk an unused edge from ' + v + ' to ' + link.to + '; mark it used and push ' + link.to + ' onto the stack.',
        });
      } else {
        const popped = stack.pop();
        output.push(popped);
        snapshot('backtrack', Object.assign({}, base, { start, current: stack.length ? stack[stack.length - 1] : null }), {
          zh: '頂點 ' + popped + ' 已無未使用的邊——卡住了。把它彈出並附加到輸出串列，回到 ' +
              (stack.length ? '頂點 ' + stack[stack.length - 1] + ' 繼續找出口' : '起點，走訪結束') + '。',
          en: 'Vertex ' + popped + ' has no unused edge left — stuck. Pop it onto the output list and return to ' +
              (stack.length ? 'vertex ' + stack[stack.length - 1] + ' to look for another way out' : 'the start; the walk is over') + '.',
        });
      }
    }

    const trail = output.slice().reverse();
    const complete = trail.length === edges.length + 1;
    snapshot('done', Object.assign({}, base, { start }), {
      zh: complete
        ? '把輸出串列反轉就得到答案：' + trail.join(' → ') + '，共 ' + edges.length + ' 條邊，每條剛好走一次。'
        : '走訪結束，但只用了 ' + (trail.length ? trail.length - 1 : 0) + ' / ' + edges.length + ' 條邊。',
      en: complete
        ? 'Reverse the output list to read the answer: ' + trail.join(' → ') + ' — all ' + edges.length + ' edges, each used exactly once.'
        : 'The walk ended after only ' + (trail.length ? trail.length - 1 : 0) + ' of ' + edges.length + ' edges.',
    });

    return { frames, verdict: info.verdict, reason: null, trail, degrees, odd, start, complete };
  }

  const api = {
    SAMPLE,
    CHALLENGE,
    KONIGSBERG,
    DISCONNECTED,
    cloneConfig,
    presetForDifficulty,
    degreesOf,
    edgesConnected,
    classify,
    resolveStart,
    randomConfig,
    parseInput,
    eulerFrames,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.GraphEulerViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
