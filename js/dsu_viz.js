(function (global) {
  'use strict';

  // Parse a scripted op string into { n, ops }.
  // Segments split on ';' or newlines. Each segment:
  //   union: "U a b" | "U0 1" | "union 0 1"   find: "F x" | "F3" | "find 3"  (case-insensitive)
  function parseOps(text) {
    var ops = [], maxIdx = -1;
    String(text == null ? '' : text).split(/[;\n]+/).forEach(function (raw) {
      var seg = raw.trim();
      if (!seg) return;
      var m = seg.match(/^u(?:nion)?\s*(\d+)\s+(\d+)$/i);
      if (m) { var a = +m[1], b = +m[2]; ops.push({ kind: 'union', a: a, b: b }); if (a > maxIdx) maxIdx = a; if (b > maxIdx) maxIdx = b; return; }
      m = seg.match(/^f(?:ind)?\s*(\d+)$/i);
      if (m) { var x = +m[1]; ops.push({ kind: 'find', x: x }); if (x > maxIdx) maxIdx = x; return; }
      // malformed → dropped
    });
    var n = Math.min(Math.max(maxIdx + 1, 2), 12);
    ops = ops.filter(function (o) {
      return o.kind === 'union' ? (o.a < n && o.b < n) : (o.x < n);
    });
    return { n: n, ops: ops };
  }

  // Replay the ops (union by rank + path compression), one frame per op plus an init frame.
  function buildFrames(spec) {
    var n = spec.n, ops = spec.ops;
    var parent = [], rank = [];
    for (var i = 0; i < n; i++) { parent.push(i); rank.push(0); }
    function rootOf(x) { while (parent[x] !== x) x = parent[x]; return x; }
    function pathTo(x) { var p = [x]; while (parent[p[p.length - 1]] !== p[p.length - 1]) p.push(parent[p[p.length - 1]]); return p; }
    function compress(x, root) { while (parent[x] !== root) { var nx = parent[x]; parent[x] = root; x = nx; } }
    var frames = [];
    function snap(kind, op, highlight, roots, found, msg) {
      frames.push({ kind: kind, op: op || null, parent: parent.slice(), rank: rank.slice(),
        highlight: (highlight || []).slice(), roots: roots || null,
        found: (found == null ? null : found), msg: msg });
    }
    snap('init', null, [], null, null,
      { zh: '初始：' + n + ' 個單節點集合', en: 'Init: ' + n + ' singleton sets' });
    ops.forEach(function (op) {
      if (op.kind === 'union') {
        var ra = rootOf(op.a), rb = rootOf(op.b);
        if (ra === rb) {
          snap('union', { a: op.a, b: op.b }, [ra], { small: ra, large: rb }, null,
            { zh: 'Union(' + op.a + ',' + op.b + ')：已在同一集合', en: 'Union(' + op.a + ',' + op.b + '): already in the same set' });
          return;
        }
        var small, large;
        if (rank[ra] < rank[rb]) { small = ra; large = rb; }
        else if (rank[ra] > rank[rb]) { small = rb; large = ra; }
        else { small = rb; large = ra; rank[large]++; }
        parent[small] = large;
        snap('union', { a: op.a, b: op.b }, [small, large], { small: small, large: large }, null,
          { zh: 'Union(' + op.a + ',' + op.b + ')：將根 ' + small + ' 接到根 ' + large + ' 之下（按秩）',
            en: 'Union(' + op.a + ',' + op.b + '): link root ' + small + ' under root ' + large + ' (by rank)' });
      } else {
        var path = pathTo(op.x);
        var root = path[path.length - 1];
        compress(op.x, root);
        snap('find', { x: op.x }, path, null, root,
          { zh: 'Find(' + op.x + ') = ' + root + '，路徑壓縮', en: 'Find(' + op.x + ') = ' + root + ', path compressed' });
      }
    });
    return { frames: frames };
  }

  // A difficulty-aware op string. normal/large are random; special is a curated
  // path-compression showcase; edge is an extreme.
  function randomInput(difficulty) {
    var d = difficulty || 'normal';
    function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
    if (d === 'special') return 'U0 1; U2 3; U0 2; U4 5; U4 0; F5';
    if (d === 'edge') return Math.random() < 0.5 ? 'F0' : 'U0 1; U2 3';
    var n, numOps;
    if (d === 'large') { n = ri(10, 12); numOps = 10; } else { n = 6; numOps = 6; }
    var out = [];
    for (var i = 0; i < numOps; i++) {
      if (Math.random() < 0.7) out.push('U' + ri(0, n - 1) + ' ' + ri(0, n - 1));
      else out.push('F' + ri(0, n - 1));
    }
    return out.join('; ');
  }

  var api = { parseOps: parseOps, buildFrames: buildFrames, randomInput: randomInput,
    SAMPLE: 'U0 1; U2 3; U0 2; U4 5; F3; U6 7' };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.DsuViz = api;
})(typeof window !== 'undefined' ? window : globalThis);
