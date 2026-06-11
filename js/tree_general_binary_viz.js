(function (global) {
  'use strict';

  function parseGeneralTree(text) {
    const children = {};
    const order = [];
    const seen = new Set();
    const allChildren = new Set();
    function touch(n) { if (!seen.has(n)) { seen.add(n); order.push(n); children[n] = children[n] || []; } }
    String(text || '').split(';').map((s) => s.trim()).filter(Boolean).forEach((part) => {
      const [p, kids] = part.split(':');
      const parent = (p || '').trim();
      if (!parent) return;
      touch(parent);
      const list = (kids || '').split(',').map((s) => s.trim()).filter(Boolean);
      children[parent] = list;
      list.forEach((c) => { touch(c); allChildren.add(c); });
    });
    const root = order.find((n) => !allChildren.has(n)) || order[0] || null;
    return { root, children, nodes: order };
  }

  function toBinary(general) {
    const { root, children } = general;
    if (!root) return null;
    const seen = new Set();
    function build(node) {
      if (seen.has(node)) return { id: node, left: null, right: null };
      seen.add(node);
      const kids = children[node] || [];
      const bn = { id: node, left: null, right: null };
      let prev = null;
      kids.forEach((k, i) => {
        const childBin = build(k);
        if (i === 0) bn.left = childBin; else prev.right = childBin;
        prev = childBin;
      });
      return bn;
    }
    return build(root);
  }

  function convertFrames(general) {
    const { root, children } = general;
    const frames = [];
    const links = [];
    function pushFrame(active) { frames.push({ links: links.slice(), active: active }); }
    if (!root) { return { frames: [{ links: [], active: null }] }; }
    const visited = new Set();
    function visit(node) {
      if (visited.has(node)) return;
      visited.add(node);
      const kids = children[node] || [];
      kids.forEach((k, i) => {
        if (i === 0) links.push({ from: node, to: k, kind: 'left' });
        else links.push({ from: kids[i - 1], to: k, kind: 'right' });
        pushFrame({ from: i === 0 ? node : kids[i - 1], to: k, kind: i === 0 ? 'left' : 'right' });
      });
      kids.forEach(visit);
    }
    visit(root);
    if (!frames.length) pushFrame(null);
    return { frames };
  }

  const api = { parseGeneralTree: parseGeneralTree, toBinary: toBinary, convertFrames: convertFrames, SAMPLE: 'A:B,C,D;B:E,F;C:G' };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.TreeGeneralBinaryViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
