(function (global) {
  'use strict';

  function buildGameTree(leaves, branching) {
    branching = Math.max(2, parseInt(branching, 10) || 2);
    const vals = (leaves && leaves.length ? leaves : [0]).slice();
    let cap = 1, depth = 0;
    while (cap < vals.length) { cap *= branching; depth++; }
    if (depth === 0) { depth = 1; cap = branching; }
    while (vals.length < cap) vals.push(vals[vals.length % (leaves && leaves.length ? leaves.length : 1)]);
    let idc = 0, cursor = 0;
    function build(d) {
      const node = { id: idc++, children: [] };
      if (d === depth) { node.leaf = true; node.value = vals[cursor++]; node.isMax = null; }
      else { node.leaf = false; node.isMax = (d % 2 === 0); for (let i = 0; i < branching; i++) node.children.push(build(d + 1)); }
      return node;
    }
    const root = build(0);
    root.isMax = true;
    return { root, depth, branching };
  }

  function collectIds(node, acc) { acc.push(node.id); (node.children || []).forEach((c) => collectIds(c, acc)); return acc; }

  function minimaxFrames(root, useAB) {
    const frames = [];
    function mm(node, alpha, beta) {
      frames.push({ type: 'enter', id: node.id, alpha: alpha, beta: beta });
      if (node.leaf) { frames.push({ type: 'leaf', id: node.id, value: node.value }); node.mmValue = node.value; return node.value; }
      let best = node.isMax ? -Infinity : Infinity;
      for (let i = 0; i < node.children.length; i++) {
        const v = mm(node.children[i], alpha, beta);
        if (node.isMax) { best = Math.max(best, v); alpha = Math.max(alpha, best); }
        else { best = Math.min(best, v); beta = Math.min(beta, best); }
        frames.push({ type: 'update', id: node.id, value: best, alpha: alpha, beta: beta });
        if (useAB && alpha >= beta) {
          const pruned = [];
          for (let j = i + 1; j < node.children.length; j++) collectIds(node.children[j], pruned);
          frames.push({ type: 'prune', id: node.id, pruned: pruned, alpha: alpha, beta: beta });
          break;
        }
      }
      node.mmValue = best;
      frames.push({ type: 'return', id: node.id, value: best });
      return best;
    }
    const value = mm(root, -Infinity, Infinity);
    return { frames: frames, value: value };
  }

  const api = { buildGameTree: buildGameTree, minimaxFrames: minimaxFrames, SAMPLE_LEAVES: [3, 5, 6, 9, 1, 2, 0, -1] };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.GameTreeViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
