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

  function randomInput(difficulty) {
    var d = difficulty || 'normal';
    var LETTERS = 'ABCDEFGHIJKLMNOPQRST';   // cap 20 → single-letter labels
    function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
    function emit(children, order) {
      return order.filter(function (p) { return (children[p] || []).length; })
                  .map(function (p) { return p + ':' + children[p].join(','); })
                  .join(';');
    }
    if (d === 'edge') {
      var pick = randInt(0, 2);
      if (pick === 0) return 'A';                 // single node
      if (pick === 1) return 'A:B;B:C;C:D';       // pure chain
      return 'A:B,C,D,E,F';                       // star
    }
    if (d === 'special') {
      if (Math.random() < 0.5) {                  // wide fan
        var k = randInt(4, 6), order = ['A'], children = { A: [] }, next = 1;
        for (var i = 0; i < k && next < LETTERS.length; i++) { var lab = LETTERS[next++]; children.A.push(lab); order.push(lab); children[lab] = []; }
        children.A.slice().forEach(function (c) { if (Math.random() < 0.5 && next < LETTERS.length) { var gl = LETTERS[next++]; children[c] = [gl]; order.push(gl); children[gl] = []; } });
        return emit(children, order);
      }
      var depth = randInt(5, 7), parts = [];      // deep chain
      for (var j = 0; j < depth && j + 1 < LETTERS.length; j++) parts.push(LETTERS[j] + ':' + LETTERS[j + 1]);
      return parts.join(';');
    }
    var n, cap;
    if (d === 'large') { n = randInt(10, 14); cap = 4; } else { n = randInt(5, 7); cap = 3; }
    var placed = ['A'], childMap = { A: [] }, ord = ['A'];
    for (var idx = 1; idx < n && idx < LETTERS.length; idx++) {
      var label = LETTERS[idx];
      var candidates = placed.filter(function (p) { return childMap[p].length < cap; });
      var parent = candidates[randInt(0, candidates.length - 1)];
      childMap[parent].push(label); childMap[label] = []; placed.push(label); ord.push(label);
    }
    return emit(childMap, ord);
  }

  const api = { parseGeneralTree: parseGeneralTree, toBinary: toBinary, convertFrames: convertFrames, SAMPLE: 'A:B,C,D;B:E,F;C:G', randomInput: randomInput };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.TreeGeneralBinaryViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
