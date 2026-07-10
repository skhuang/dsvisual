(function (global) {
  function topo(nodes, edges) {
    const indeg = {}, adj = {};
    nodes.forEach((n) => { indeg[n.id] = 0; adj[n.id] = []; });
    edges.forEach(([u, v]) => { adj[u].push(v); indeg[v]++; });
    const q = nodes.filter((n) => indeg[n.id] === 0).map((n) => n.id).sort();
    const order = [];
    while (q.length) {
      const u = q.shift(); order.push(u);
      for (const v of adj[u]) { if (--indeg[v] === 0) { q.push(v); q.sort(); } }
    }
    return order;
  }
  function buildFrames(graph) {
    const byId = {}; graph.nodes.forEach((n) => { byId[n.id] = n; });
    const preds = {}; graph.nodes.forEach((n) => { preds[n.id] = []; });
    graph.edges.forEach(([u, v]) => preds[v].push(u));
    const order = topo(graph.nodes, graph.edges);
    const frames = [];
    const evaluated = [];
    const values = {};
    order.forEach((id, k) => frames.push({ phase: 'order', order: order.slice(0, k + 1), active: id,
      evaluated: [], values: {}, msg: { en: 'topo #' + (k + 1) + ': ' + id, zh: '拓撲序 #' + (k + 1) + '：' + id } }));
    for (const id of order) {
      const n = byId[id], ins = preds[id].map((p) => values[p]);
      let val;
      if (n.op === 'const') val = n.val;
      else if (n.op === 'add') val = ins.reduce((a, b) => a + b, 0);
      else if (n.op === 'mul') val = ins.reduce((a, b) => a * b, 1);
      else val = ins.reduce((a, b) => a + b, 0);
      values[id] = val; evaluated.push(id);
      frames.push({ phase: 'forward', order, active: id, evaluated: evaluated.slice(),
        values: Object.assign({}, values), msg: { en: id + ' = ' + val, zh: id + ' = ' + val } });
    }
    frames.push({ phase: 'done', order, active: null, evaluated: evaluated.slice(),
      values: Object.assign({}, values), msg: { en: 'forward pass complete', zh: '前向傳遞完成' } });
    return { frames, order };
  }
  const api = { buildFrames };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.NanoComputeGraphViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
