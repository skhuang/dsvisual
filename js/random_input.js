(function (global) {
  'use strict';

  function randInt(rng, lo, hi) { return lo + Math.floor(rng() * (hi - lo + 1)); }
  function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }
  function uniqueInts(rng, n, lo, hi) {
    const set = new Set();
    let guard = 0;
    while (set.size < n && guard++ < n * 80) set.add(randInt(rng, lo, hi));
    return Array.from(set);
  }

  // magic-square / magic-latin / magic-torus / magic-formula / magic-symmetry (js/viz/viz_magic*.js):
  // all five build on the odd-order Siamese/Coxeter method (up-left, wrap-around placement), which
  // only produces a genuine magic square for an ODD n — there is no doubly-even/singly-even branch
  // anywhere in these modules, unlike a general-order magic-square algorithm. Each viz's own
  // <select class="*-order"> dropdown already enumerates exactly the odd values it offers (no
  // free-form n input exists in any of these five modules): magic-square/torus/formula/symmetry
  // offer [3,5,7]; magic-latin additionally offers 9 ([3,5,7,9]) purely as a UI choice (its
  // decomposition v-1 = n*a+b works for any odd n, same as the others). So "a constructible n"
  // simply means "one of the viz's own dropdown options" — `allowed` below IS that exact option
  // list for each caller. edge -> the smallest offered order (still a full, non-trivial magic
  // square, unlike n=1, which none of these dropdowns even offer); large -> the largest offered
  // order; normal -> any order except the largest (so 'large' is never smaller); special -> a
  // middle order when one exists (never an extreme), so a 'special' draw is visibly distinct from
  // both 'edge' and 'large'.
  function magicOrder(rng, difficulty, allowed) {
    switch (difficulty) {
      case 'edge': return allowed[0];
      case 'large': return allowed[allowed.length - 1];
      case 'special': {
        const mid = allowed.length > 2 ? allowed.slice(1, -1) : allowed;
        return pick(rng, mid);
      }
      default: {
        const nonMax = allowed.length > 1 ? allowed.slice(0, -1) : allowed;
        return pick(rng, nonMax);
      }
    }
  }

  function valSeq(rng, difficulty) {
    switch (difficulty) {
      case 'special': {
        const base = uniqueInts(rng, randInt(rng, 6, 8), 10, 99).sort((a, b) => a - b);
        return rng() < 0.5 ? base : base.slice().reverse();
      }
      case 'edge': {
        if (rng() < 0.5) return [randInt(rng, 10, 99)];
        const v = randInt(rng, 10, 99);
        return [v, v, v, v];
      }
      case 'large':
        return uniqueInts(rng, randInt(rng, 18, 24), 10, 99);
      default:
        return uniqueInts(rng, randInt(rng, 6, 9), 10, 99);
    }
  }

  function searchInput(rng, difficulty, uniform) {
    let n;
    if (difficulty === 'large') n = randInt(rng, 30, 40);
    else if (difficulty === 'edge') n = rng() < 0.5 ? 1 : randInt(rng, 6, 10);
    else n = randInt(rng, 8, 12);
    let arr;
    if (uniform && difficulty === 'special') {
      const start = randInt(rng, 1, 9), step = randInt(rng, 3, 9);
      arr = Array.from({ length: n }, (_, i) => start + i * step);
    } else {
      arr = uniqueInts(rng, n, 1, 200).sort((a, b) => a - b);
      while (arr.length < n) arr.push(arr[arr.length - 1] + 1);
    }
    let target;
    if (difficulty === 'edge') target = arr[arr.length - 1] + randInt(rng, 1, 9);
    else target = arr[randInt(rng, 0, arr.length - 1)];
    return { arr, target };
  }

  function huffmanText(rng, difficulty) {
    const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const ch = () => A[Math.floor(rng() * 26)];
    if (difficulty === 'edge') return ch();
    if (difficulty === 'special') {
      const a = ch(); let b = ch(); while (b === a) b = ch();
      return (a + b).repeat(randInt(rng, 4, 6));
    }
    const len = difficulty === 'large' ? randInt(rng, 30, 40) : randInt(rng, 8, 14);
    let s = '';
    for (let i = 0; i < len; i++) s += ch();
    return s;
  }

  function buildExprTree(rng, n, operandFn, singleOp) {
    const ops = ['+', '-', '*', '/'];
    let nodes = [];
    for (let i = 0; i < n; i++) nodes.push({ v: operandFn(rng, i) });
    while (nodes.length > 1) {
      const i = Math.floor(rng() * (nodes.length - 1));
      const op = singleOp || pick(rng, ops);
      nodes.splice(i, 2, { op, l: nodes[i], r: nodes[i + 1] });
    }
    return nodes[0];
  }
  function toInfix(node) {
    if (node.v != null) return String(node.v);
    return '(' + toInfix(node.l) + node.op + toInfix(node.r) + ')';
  }
  function toPostfix(node) {
    if (node.v != null) return String(node.v);
    return toPostfix(node.l) + ' ' + toPostfix(node.r) + ' ' + node.op;
  }
  function exprInfix(rng, difficulty) {
    const letter = (r, i) => 'ABCDEFGHIJ'[i % 10];
    let n, singleOp = null;
    if (difficulty === 'edge') { n = 1; }
    else if (difficulty === 'special') { n = 4; singleOp = '+'; }
    else if (difficulty === 'large') { n = randInt(rng, 7, 8); }
    else { n = 4; }
    return toInfix(buildExprTree(rng, n, letter, singleOp));
  }
  function exprPostfix(rng, difficulty) {
    const num = (r) => randInt(r, 1, 9);
    let n, singleOp = null;
    if (difficulty === 'edge') { n = 1; }
    else if (difficulty === 'special') { n = 4; singleOp = '+'; }
    else if (difficulty === 'large') { n = randInt(rng, 7, 8); }
    else { n = 4; }
    return toPostfix(buildExprTree(rng, n, num, singleOp));
  }

  function obstInput(rng, difficulty) {
    let nk;
    if (difficulty === 'edge') nk = 1;
    else if (difficulty === 'large') nk = randInt(rng, 8, 10);
    else nk = randInt(rng, 4, 6);
    const keys = uniqueInts(rng, nk, 10, 99).sort((a, b) => a - b);
    let freqs;
    if (difficulty === 'special' && keys.length > 1) {
      freqs = keys.map(() => randInt(rng, 1, 2));
      freqs[Math.floor(rng() * freqs.length)] = randInt(rng, 20, 30);
    } else {
      freqs = keys.map(() => randInt(rng, 1, 9));
    }
    return { keys, freqs };
  }

  function matrixText(rng, difficulty) {
    let rows, cols;
    if (difficulty === 'edge') { rows = randInt(rng, 2, 3); cols = randInt(rng, 2, 3); }
    else if (difficulty === 'large') { rows = 8; cols = 8; }
    else { rows = randInt(rng, 4, 5); cols = randInt(rng, 4, 5); }
    const grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0));
    if (difficulty === 'edge') {
      // all zeros — leave grid as-is
    } else if (difficulty === 'special') {
      for (let i = 0; i < Math.min(rows, cols); i++) grid[i][i] = randInt(rng, 1, 9);
    } else {
      const nz = Math.max(2, Math.floor(rows * cols * 0.2));
      for (let k = 0; k < nz; k++) grid[randInt(rng, 0, rows - 1)][randInt(rng, 0, cols - 1)] = randInt(rng, 1, 9);
    }
    return grid.map((r) => r.join(',')).join(';');
  }

  function matrixSparseListText(rng, difficulty) {
    let rows, cols;
    if (difficulty === 'edge') { rows = randInt(rng, 2, 3); cols = randInt(rng, 2, 3); }
    else if (difficulty === 'large') { rows = 6; cols = 6; }
    else { rows = randInt(rng, 3, 5); cols = randInt(rng, 3, 5); }
    const grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0));
    if (difficulty === 'edge') {
      // all zeros — leave grid as-is
    } else if (difficulty === 'special') {
      for (let i = 0; i < Math.min(rows, cols); i++) grid[i][i] = randInt(rng, 1, 9);
    } else {
      const nz = Math.max(2, Math.floor(rows * cols * 0.3));
      for (let k = 0; k < nz; k++) grid[randInt(rng, 0, rows - 1)][randInt(rng, 0, cols - 1)] = randInt(rng, 1, 9);
    }
    return grid.map((r) => r.join(',')).join(';');
  }

  function polyInput(rng, difficulty) {
    const term = (e) => randInt(rng, 1, 9) + ':' + e;
    if (difficulty === 'edge') return { a: term(randInt(rng, 0, 3)), b: term(randInt(rng, 0, 3)) };
    if (difficulty === 'special') {
      const exps = [3, 2, 1];
      return { a: exps.map(term).join(','), b: exps.map(term).join(',') };
    }
    if (difficulty === 'large') {
      return { a: [6, 5, 4, 3, 2, 1].map(term).join(','), b: [5, 4, 3, 2, 1, 0].map(term).join(',') };
    }
    return { a: [2, 1, 0].map(term).join(','), b: [3, 1].map(term).join(',') };
  }

  function parseMaze(text) { return text.split(';').map((r) => r.split('')); }
  function findCell(g, ch) {
    for (let r = 0; r < g.length; r++) for (let c = 0; c < g[r].length; c++) if (g[r][c] === ch) return [r, c];
    return null;
  }
  function isMazeSolvable(text) {
    const g = parseMaze(text);
    const s = findCell(g, 'S'), e = findCell(g, 'E');
    if (!s || !e) return false;
    const R = g.length, C = g[0].length;
    const seen = Array.from({ length: R }, () => Array(C).fill(false));
    const q = [s]; seen[s[0]][s[1]] = true;
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    while (q.length) {
      const [r, c] = q.shift();
      if (r === e[0] && c === e[1]) return true;
      for (const [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < R && nc >= 0 && nc < C && !seen[nr][nc] && g[nr][nc] !== '#') {
          seen[nr][nc] = true; q.push([nr, nc]);
        }
      }
    }
    return false;
  }
  function makeMaze(rng, R, C, wallP) {
    const g = Array.from({ length: R }, () => Array.from({ length: C }, () => (rng() < wallP ? '#' : '.')));
    g[0][0] = 'S'; g[R - 1][C - 1] = 'E';
    return g.map((r) => r.join('')).join(';');
  }
  function mazeText(rng, difficulty) {
    if (difficulty === 'edge') {
      const R = 5, C = 5;
      const g = Array.from({ length: R }, () => Array.from({ length: C }, () => '.'));
      g[0][0] = 'S'; g[R - 1][C - 1] = 'E';
      g[R - 2][C - 1] = '#'; g[R - 1][C - 2] = '#';
      return g.map((r) => r.join('')).join(';');
    }
    const R = difficulty === 'large' ? randInt(rng, 8, 9) : 5;
    const C = R;
    const wallP = difficulty === 'special' ? 0.32 : 0.25;
    for (let t = 0; t < 60; t++) {
      const m = makeMaze(rng, R, C, wallP);
      if (isMazeSolvable(m)) return m;
    }
    return makeMaze(rng, R, C, 0);
  }

  function wordSet(rng, difficulty) {
    const alpha = 'abcdefghijklmnopqrstuvwxyz';
    const ch = () => alpha[Math.floor(rng() * alpha.length)];
    function randWord(len) { let s = ''; for (let i = 0; i < len; i++) s += ch(); return s; }
    if (difficulty === 'edge') return [randWord(1)];
    if (difficulty === 'special') {
      // Shared-prefix cluster — exercises branching/merging in radix & ternary trees.
      const prefix = randWord(2);
      const n = randInt(rng, 3, 5);
      const words = new Set();
      let guard = 0;
      while (words.size < n && guard++ < n * 50) words.add(prefix + randWord(randInt(rng, 1, 3)));
      return Array.from(words);
    }
    const n = difficulty === 'large' ? randInt(rng, 10, 14) : randInt(rng, 4, 6);
    const lenLo = difficulty === 'large' ? 4 : 3;
    const lenHi = difficulty === 'large' ? 7 : 6;
    const words = new Set();
    let guard = 0;
    while (words.size < n && guard++ < n * 50) words.add(randWord(randInt(rng, lenLo, lenHi)));
    return Array.from(words);
  }

  function mwayInput(rng, difficulty) {
    let nk;
    if (difficulty === 'edge') nk = randInt(rng, 1, 2);
    else if (difficulty === 'large') nk = randInt(rng, 14, 18);
    else nk = randInt(rng, 6, 8);
    let keys = uniqueInts(rng, nk, 10, 99);
    if (difficulty === 'special') keys = keys.sort((a, b) => a - b);
    return { keys, m: 3 };
  }

  // Bounded to <=8 leaves — viz_segment.js's fixed-depth SVG layout (a hardcoded
  // POS map covering node indices 1..15) only has room for a segment tree built
  // over at most 8 leaves before node indices spill past that table.
  function segTreeVals(rng, difficulty) {
    switch (difficulty) {
      case 'edge':
        return [randInt(rng, 1, 9)];
      case 'special': {
        const v = randInt(rng, 1, 9);
        return Array.from({ length: 6 }, () => v);
      }
      case 'large':
        return Array.from({ length: 8 }, () => randInt(rng, 1, 9));
      default:
        return Array.from({ length: randInt(rng, 4, 6) }, () => randInt(rng, 1, 9));
    }
  }

  // Self-contained op-string generator for tree-dsu, mirroring DsuViz.randomInput
  // (js/dsu_viz.js) but threaded through the shared `rng` for testability. Not
  // wired into js/viz/viz_dsu.js — see task-3 report for why.
  function dsuOpString(rng, difficulty) {
    if (difficulty === 'special') return 'U0 1; U2 3; U0 2; U4 5; U4 0; F5';
    if (difficulty === 'edge') return rng() < 0.5 ? 'F0' : 'U0 1; U2 3';
    const n = difficulty === 'large' ? randInt(rng, 10, 12) : 6;
    const numOps = difficulty === 'large' ? 10 : 6;
    const out = [];
    for (let i = 0; i < numOps; i++) {
      if (rng() < 0.7) out.push('U' + randInt(rng, 0, n - 1) + ' ' + randInt(rng, 0, n - 1));
      else out.push('F' + randInt(rng, 0, n - 1));
    }
    return out.join('; ');
  }

  var lbl = function (i) { return String.fromCharCode(65 + i); };

  function graphEdgeList(rng, difficulty, weighted) {
    var n, extra;
    if (difficulty === 'edge') { n = randInt(rng, 3, 4); extra = 0; }
    else if (difficulty === 'large') { n = randInt(rng, 9, 12); extra = randInt(rng, n, n + 3); }
    else if (difficulty === 'special') { n = 6; extra = 2; }
    else { n = randInt(rng, 5, 7); extra = randInt(rng, 1, 3); }
    var seen = {}, lines = [];
    function add(u, v) {
      var a = Math.min(u, v), b = Math.max(u, v);
      if (a === b) return false;
      var k = a + '-' + b; if (seen[k]) return false; seen[k] = true;
      lines.push(weighted ? (lbl(a) + '-' + lbl(b) + ':' + randInt(rng, 1, 9)) : (lbl(a) + '-' + lbl(b)));
      return true;
    }
    var i;
    for (i = 1; i < n; i++) add(i, randInt(rng, 0, i - 1)); // spanning tree → connected
    var tries = 0;
    while (extra > 0 && tries < 200) { tries++; if (add(randInt(rng, 0, n - 1), randInt(rng, 0, n - 1))) extra--; }
    return lines.join(',');
  }

  // A weighted DAG guaranteed to have a SINGLE source (node 0, in-degree 0) and a
  // SINGLE sink (node n-1, out-degree 0) — js/graph_aoe_viz.js's buildAoeFrames
  // computes le[u] for every node with no outgoing edges as `ee[sink]` where
  // `sink` is just the last node in topological order, so more than one true sink
  // would silently get the wrong le. Not reusing graphDagText(rng,difficulty,true)
  // here: (a) its extra-edge pass never targets node 0 or sources node n-1, so a
  // middle node can end up with out-degree 0 too (a second, bogus "sink"), and
  // (b) its weights are randInt(-5,9) (negative, meant for Bellman-Ford's edge
  // relaxation demo) — an activity duration can't be negative. All edges keep
  // u<v by construction (spanning-chain parent<child, extra a<b, and both
  // repair passes below), so the graph is acyclic by index order alone.
  function aoeNetworkText(rng, difficulty) {
    var n;
    if (difficulty === 'edge') n = randInt(rng, 3, 4);
    else if (difficulty === 'large') n = randInt(rng, 9, 12);
    else if (difficulty === 'special') n = 6;
    else n = randInt(rng, 5, 7);
    var seen = {}, lines = [], indeg = [], outdeg = [], i;
    for (i = 0; i < n; i++) { indeg.push(0); outdeg.push(0); }
    function add(u, v) {
      var k = u + '-' + v; if (u === v || seen[k]) return;
      seen[k] = true; outdeg[u]++; indeg[v]++;
      lines.push(lbl(u) + '-' + lbl(v) + ':' + randInt(rng, 1, 9));
    }
    for (i = 1; i < n; i++) add(randInt(rng, 0, i - 1), i); // spanning chain → node 0 is the only source
    var extra = difficulty === 'large' ? n : Math.floor(n / 2);
    for (var e = 0; e < extra; e++) { var a = randInt(rng, 0, n - 2), b = randInt(rng, a + 1, n - 1); add(a, b); }
    for (i = 0; i < n - 1; i++) if (outdeg[i] === 0) add(i, n - 1);   // repair: route every dead end to the sink
    for (i = 1; i < n; i++) if (indeg[i] === 0) add(0, i);            // repair: connect any stray source to node 0
    return lines.join(',');
  }

  // graph-matrix's own edge format is numeric (u-v[:w], 0-based — see
  // GraphMatrixViz.parseInput), unlike graphEdgeList's letter labels, so this
  // builds {n, edges} directly rather than reusing graphEdgeList's text output.
  function graphMatrixInput(rng, difficulty) {
    var n, extra;
    if (difficulty === 'edge') { n = randInt(rng, 2, 3); extra = 0; }
    else if (difficulty === 'large') { n = randInt(rng, 8, 10); extra = randInt(rng, n, n + 3); }
    else if (difficulty === 'special') { n = 6; extra = 2; }
    else { n = randInt(rng, 4, 6); extra = randInt(rng, 1, 3); }
    var seen = {}, edges = [];
    function add(u, v) {
      var k = u + '-' + v; if (u === v || seen[k]) return false;
      seen[k] = true; edges.push({ u: u, v: v, w: randInt(rng, 1, 9) });
      return true;
    }
    var i;
    for (i = 1; i < n; i++) add(i, randInt(rng, 0, i - 1)); // spanning tree → connected
    var tries = 0;
    while (extra > 0 && tries < 200) { tries++; if (add(randInt(rng, 0, n - 1), randInt(rng, 0, n - 1))) extra--; }
    return { n: n, edges: edges };
  }

  // Numeric 0-based DIRECTED edge-list generator for graph-closure / graph-scc.
  // Their GraphClosureViz/GraphSccViz.parseInput expect PLAIN NUMERIC "u-v[:w]"
  // tokens (a trailing weight is tolerated but ignored) and clamp n to <=10 —
  // a different token alphabet from graphEdgeList's letter labels, so it isn't
  // reused as-is (same reasoning as graphMatrixInput's own numeric generator
  // in task 5). Dedupes by the exact ordered pair (so both u->v and v->u can
  // coexist) and ALSO fires one extra 0->target edge: the spanning pass only
  // ever adds "child->parent" edges (parent index strictly smaller than
  // child), so every node already has a directed path back down to node 0 —
  // adding 0->target therefore always closes at least one cycle, which SCC
  // needs to be interesting (an acyclic graph has every vertex in its own
  // singleton SCC). graph-components/graph-bipartite do NOT use this — they
  // need structural properties (multiple components; a controlled mix of
  // bipartite/non-bipartite instances) that a single connected spanning tree
  // can never produce, so they get their own dedicated generators below.
  function graphNumericEdges(rng, difficulty) {
    var n, extra;
    if (difficulty === 'edge') { n = randInt(rng, 2, 3); extra = 0; }
    else if (difficulty === 'large') { n = randInt(rng, 8, 10); extra = randInt(rng, n, n + 3); }
    else if (difficulty === 'special') { n = 6; extra = 2; }
    else { n = randInt(rng, 4, 6); extra = randInt(rng, 1, 3); }
    var seen = {}, edges = [];
    function key(u, v) { return u + '>' + v; }
    function add(u, v) {
      if (u === v) return false;
      var k = key(u, v);
      if (seen[k]) return false;
      seen[k] = true;
      edges.push({ u: u, v: v });
      return true;
    }
    var i;
    for (i = 1; i < n; i++) add(i, randInt(rng, 0, i - 1)); // spanning chain -> weakly connected
    var tries = 0;
    while (extra > 0 && tries < 200) { tries++; if (add(randInt(rng, 0, n - 1), randInt(rng, 0, n - 1))) extra--; }
    if (n > 1) add(0, randInt(rng, 1, n - 1)); // guarantee >=1 cycle (see comment above)
    return { n: n, edges: edges };
  }

  // Numeric 0-based UNDIRECTED FOREST generator for graph-components — the
  // entire point of "Connected Components" is watching componentsFrames
  // partition the graph into >=2 pieces, so a single spanning tree over all n
  // nodes (which is always 1 component) would defeat the demo. Partitions the
  // n nodes into k disjoint, non-empty groups (k scales with difficulty),
  // spanning-trees WITHIN each group, and only ever adds extra edges WITHIN a
  // group — never across groups — so the graph has EXACTLY k components,
  // never 1, regardless of which edges happen to land where.
  function graphComponentsEdges(rng, difficulty) {
    var n, k;
    if (difficulty === 'edge') { n = randInt(rng, 3, 4); k = randInt(rng, 1, 2); }
    else if (difficulty === 'large') { n = randInt(rng, 8, 10); k = randInt(rng, 2, 3); }
    else if (difficulty === 'special') { n = 6; k = 3; }
    else { n = randInt(rng, 4, 6); k = 2; }
    if (k > n) k = n;
    var groups = [], g;
    for (g = 0; g < k; g++) groups.push([]);
    var i;
    for (i = 0; i < n; i++) groups[i < k ? i : randInt(rng, 0, k - 1)].push(i); // every group non-empty (first k nodes seed one each)
    var seen = {}, edges = [];
    function add(u, v) {
      if (u === v) return false;
      var a = Math.min(u, v), b = Math.max(u, v), key = a + '-' + b;
      if (seen[key]) return false;
      seen[key] = true;
      edges.push({ u: u, v: v });
      return true;
    }
    groups.forEach(function (group) {
      var j;
      for (j = 1; j < group.length; j++) add(group[j], group[randInt(rng, 0, j - 1)]); // spanning tree within the group only
      var extra = group.length > 2 ? randInt(rng, 0, Math.min(2, group.length - 1)) : 0;
      var tries = 0;
      while (extra > 0 && tries < 100) { tries++; if (add(group[randInt(rng, 0, group.length - 1)], group[randInt(rng, 0, group.length - 1)])) extra--; }
    });
    return { n: n, edges: edges };
  }

  // Numeric 0-based UNDIRECTED generator for graph-bipartite. Left uncontrolled
  // (spanning tree + extra=0 always acyclic, i.e. always bipartite) an 'edge'
  // draw NEVER shows the "NOT bipartite" verdict, and (spanning tree + several
  // random extra edges) a 'large' draw ALMOST ALWAYS lands on an odd cycle, so
  // it ALMOST NEVER shows the "Bipartite" verdict either — only two of the
  // four difficulty tiers used to exercise both outcomes. Fixed by building
  // the spanning tree with an explicit BFS-style 2-coloring (color[child] =
  // 1 - color[parent], assigned as each tree edge is added) and then flipping
  // a coin per draw: if "make it bipartite", extra edges are restricted to
  // cross-color pairs (color[u] != color[v]) so the whole graph stays
  // 2-colorable; otherwise ONE edge between a same-color pair is forced first
  // — the tree path between any two same-colored vertices has even length (by
  // the very same parity argument), so closing it with a length-1 edge always
  // produces an odd cycle, guaranteeing the graph is NOT bipartite regardless
  // of what other edges are added afterward. This yields a genuine ~50/50 mix
  // of both verdicts at every difficulty, not just normal/special.
  function graphBipartiteEdges(rng, difficulty) {
    var n, extra;
    if (difficulty === 'edge') { n = randInt(rng, 3, 4); extra = 0; }
    else if (difficulty === 'large') { n = randInt(rng, 8, 10); extra = randInt(rng, n, n + 3); }
    else if (difficulty === 'special') { n = 6; extra = 2; }
    else { n = randInt(rng, 4, 6); extra = randInt(rng, 1, 3); }
    var seen = {}, edges = [], color = [0];
    function add(u, v) {
      if (u === v) return false;
      var a = Math.min(u, v), b = Math.max(u, v), key = a + '-' + b;
      if (seen[key]) return false;
      seen[key] = true;
      edges.push({ u: u, v: v });
      return true;
    }
    var i, parent;
    for (i = 1; i < n; i++) {
      parent = randInt(rng, 0, i - 1);
      color[i] = 1 - color[parent];
      add(i, parent);
    }
    if (rng() < 0.5) {
      // stay bipartite: extra edges only ever cross color classes
      var tries = 0;
      while (extra > 0 && tries < 200) {
        tries++;
        var u = randInt(rng, 0, n - 1), v = randInt(rng, 0, n - 1);
        if (color[u] !== color[v] && add(u, v)) extra--;
      }
    } else {
      // force >=1 odd cycle first (see comment above), then fill in the rest freely
      var guard = 0, forced = false;
      while (!forced && guard < 200) {
        guard++;
        var a = randInt(rng, 0, n - 1), b = randInt(rng, 0, n - 1);
        if (a !== b && color[a] === color[b] && add(a, b)) forced = true;
      }
      var tries2 = 0;
      while (extra > 0 && tries2 < 200) { tries2++; if (add(randInt(rng, 0, n - 1), randInt(rng, 0, n - 1))) extra--; }
    }
    return { n: n, edges: edges };
  }

  // Self-contained mirror of GraphMaxFlowViz.randomConfig (js/graph_maxflow_viz.js),
  // threaded through the shared rng for testability. NOT wired into
  // js/viz/viz_graph_maxflow.js's own 🎲 (which already calls
  // GraphMaxFlowViz.randomConfig(difficulty) directly and is fully
  // working/tested) — this exists only so RandomInput.randomInputFor covers the
  // methodId too. Deliberately mirrors the source module's own two-tier design:
  // GraphMaxFlowViz only distinguishes 'normal' from everything else
  // (syncDifficultyPreset maps inputDifficulty==='normal' to the 'normal'
  // tier and any other difficulty to 'challenge'), so this does the same.
  function maxFlowConfig(rng, difficulty) {
    var challenge = difficulty !== 'normal';
    var n = challenge ? 8 : 6;
    var source = 0, sink = n - 1;
    var targetEdges = challenge ? 2 * n : n + 3;
    var maxCapacity = challenge ? 30 : 16;
    var edges = {};
    function randomCapacity() { return 2 + Math.floor(Math.max(0, Math.min(0.999999, rng())) * (maxCapacity - 1)); }
    function addEdge(u, v) { edges[u + '>' + v] = { u: u, v: v, capacity: randomCapacity() }; }
    var u, v, i;
    for (u = 0; u + 1 < n; u++) addEdge(u, u + 1);
    var candidates = [];
    for (u = 0; u < n; u++) for (v = 0; v < n; v++) if (u !== v && !edges[u + '>' + v]) candidates.push({ u: u, v: v });
    for (i = candidates.length - 1; i > 0; i--) {
      var j = Math.floor(Math.max(0, Math.min(0.999999, rng())) * (i + 1));
      var tmp = candidates[i]; candidates[i] = candidates[j]; candidates[j] = tmp;
    }
    var idx = 0;
    while (Object.keys(edges).length < targetEdges && idx < candidates.length) { addEdge(candidates[idx].u, candidates[idx].v); idx++; }
    var out = [];
    Object.keys(edges).forEach(function (k) { out.push(edges[k]); });
    return { n: n, source: source, sink: sink, edges: out };
  }

  // n stays within the viz's own button range (nBtns only render k=0..4 —
  // enumerateShapes(n) is exponential, so the UI itself never offers n>4).
  function catalanN(rng, difficulty) {
    switch (difficulty) {
      case 'edge': return rng() < 0.5 ? 0 : 1;
      case 'special': return rng() < 0.5 ? 2 : 3;
      case 'large': return 4;
      default: return randInt(rng, 1, 3);
    }
  }

  // Self-contained mirror of GameTreeViz.randomInput (js/game_tree_viz.js), threaded
  // through the shared `rng` for testability — buildGameTree() pads any leaf count up
  // to the next power of the branching factor, so there's no fixed-size ceiling to respect.
  function gameTreeLeaves(rng, difficulty) {
    let n, lo, hi;
    if (difficulty === 'large') { n = 16; lo = -9; hi = 9; }
    else if (difficulty === 'edge') { n = 4; lo = -5; hi = 9; }
    else { n = 8; lo = -5; hi = 9; } // normal, special
    let leaves = [];
    for (let i = 0; i < n; i++) leaves.push(randInt(rng, lo, hi));
    if (difficulty === 'special') { // bias toward alpha-beta pruning: strong values first
      const head = leaves.slice(0, n / 2).sort((a, b) => b - a);
      leaves = head.concat(leaves.slice(n / 2));
    }
    return leaves;
  }

  // Self-contained mirror of TreeGeneralBinaryViz.randomInput (js/tree_general_binary_viz.js),
  // threaded through the shared `rng` for testability. Not wired into js/viz/viz_tgb.js's
  // own 🎲 (which already calls TreeGeneralBinaryViz.randomInput directly and is fully
  // working/tested) — this exists so RandomInput.randomInputFor covers the methodId too.
  function tgbTreeText(rng, difficulty) {
    const LETTERS = 'ABCDEFGHIJKLMNOPQRST'; // cap 20 -> single-letter labels
    function emit(children, order) {
      return order.filter((p) => (children[p] || []).length)
                  .map((p) => p + ':' + children[p].join(','))
                  .join(';');
    }
    if (difficulty === 'edge') {
      const which = randInt(rng, 0, 2);
      if (which === 0) return 'A';                // single node
      if (which === 1) return 'A:B;B:C;C:D';       // pure chain
      return 'A:B,C,D,E,F';                        // star
    }
    if (difficulty === 'special') {
      if (rng() < 0.5) { // wide fan
        const k = randInt(rng, 4, 6); const order = ['A']; const children = { A: [] }; let next = 1;
        for (let i = 0; i < k && next < LETTERS.length; i++) { const lab = LETTERS[next++]; children.A.push(lab); order.push(lab); children[lab] = []; }
        children.A.slice().forEach((c) => { if (rng() < 0.5 && next < LETTERS.length) { const gl = LETTERS[next++]; children[c] = [gl]; order.push(gl); children[gl] = []; } });
        return emit(children, order);
      }
      const depth = randInt(rng, 5, 7); const parts = []; // deep chain
      for (let j = 0; j < depth && j + 1 < LETTERS.length; j++) parts.push(LETTERS[j] + ':' + LETTERS[j + 1]);
      return parts.join(';');
    }
    const n = difficulty === 'large' ? randInt(rng, 10, 14) : randInt(rng, 5, 7);
    const cap = difficulty === 'large' ? 4 : 3;
    const placed = ['A']; const childMap = { A: [] }; const ord = ['A'];
    for (let idx = 1; idx < n && idx < LETTERS.length; idx++) {
      const label = LETTERS[idx];
      const candidates = placed.filter((p) => childMap[p].length < cap);
      const parent = candidates[randInt(rng, 0, candidates.length - 1)];
      childMap[parent].push(label); childMap[label] = []; placed.push(label); ord.push(label);
    }
    return emit(childMap, ord);
  }

  // A level-order token string (space-separated; '-' = empty slot) that
  // js/tree_copy_equal_viz.js's tokenize()/parseTree() can consume directly.
  // Grows a valid rooted binary tree of exactly `maxNodes` nodes by always
  // attaching the next node under a uniformly-random already-present node
  // that still has an empty child slot, so every parent always precedes its
  // child (no orphans) and the root (index 1) is always present.
  function copyEqualTreeTokens(rng, difficulty) {
    let maxNodes;
    if (difficulty === 'edge') maxNodes = 1;
    else if (difficulty === 'large') maxNodes = randInt(rng, 10, 14);
    else maxNodes = randInt(rng, 5, 7); // normal, special
    const present = new Set([1]);
    const order = [1];
    while (present.size < maxNodes) {
      const candidates = order.filter((p) => !present.has(2 * p) || !present.has(2 * p + 1));
      if (!candidates.length) break;
      const parent = candidates[randInt(rng, 0, candidates.length - 1)];
      const child = !present.has(2 * parent) ? 2 * parent : 2 * parent + 1;
      present.add(child); order.push(child);
    }
    const maxIndex = Math.max.apply(null, Array.from(present));
    const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let li = 0;
    const tokens = [];
    for (let i = 1; i <= maxIndex; i++) tokens.push(present.has(i) ? LETTERS[li++ % LETTERS.length] : '-');
    return tokens.join(' ');
  }

  // src (COPY mode) + an {a,b} pair (EQUAL mode) — 'special' forces a===b (the
  // "equal trees" success path); other difficulties draw a and b independently,
  // which differ most of the time and naturally exercise the mismatch path too.
  function copyEqualInput(rng, difficulty) {
    const src = copyEqualTreeTokens(rng, difficulty);
    const a = copyEqualTreeTokens(rng, difficulty);
    const b = difficulty === 'special' ? a : copyEqualTreeTokens(rng, difficulty);
    return { src, a, b };
  }

  function graphDagText(rng, difficulty, weighted) {
    var n;
    if (difficulty === 'edge') n = randInt(rng, 3, 4);
    else if (difficulty === 'large') n = randInt(rng, 9, 12);
    else if (difficulty === 'special') n = 6;
    else n = randInt(rng, 5, 7);
    var lines = [], seen = {};
    function add(u, v) {
      var k = u + '-' + v; if (seen[k] || u === v) return; seen[k] = true;
      lines.push(weighted ? (lbl(u) + '-' + lbl(v) + ':' + randInt(rng, -5, 9)) : (lbl(u) + '-' + lbl(v)));
    }
    for (var j = 1; j < n; j++) add(randInt(rng, 0, j - 1), j); // spanning chain (i<j) → weakly connected DAG
    var extra = difficulty === 'large' ? n : Math.floor(n / 2);
    for (var e = 0; e < extra; e++) { var a = randInt(rng, 0, n - 2), b = randInt(rng, a + 1, n - 1); add(a, b); } // forward edges (a<b) keep it acyclic
    return lines.join(',');
  }

  // hash-chain / hash-open / hash-bucket (js/domains/hash.js): a set of UNIQUE keys inserted
  // into a small fixed-size table. Uniqueness only guards against a value being inserted twice
  // outright — once hashed mod the table size, several unique keys legitimately land in the
  // same slot/bucket, which is exactly what chaining/bucketing exist to demonstrate. `cap` is
  // each table's real physical capacity: hash-open has exactly 5 slots (linear probing over a
  // full table hits hash.js's "Hash Table Full!" bail-out and silently drops the value) and
  // hash-bucket has 4 buckets * 2 slots = 8 total (its own "All Buckets Saturated!" bail-out);
  // hash-chain has no structural bound (chains grow unbounded) so it's just kept in the same
  // ballpark as the other two for a readable diagram. 'large' always fills exactly `cap` keys
  // (always inside the table for open/bucket); 'normal'/'special' stay comfortably below any
  // `cap` (min 5) so 'large' is guaranteed strictly bigger every draw.
  function hashKeys(rng, difficulty, cap) {
    let n;
    switch (difficulty) {
      case 'edge': n = 1; break;
      case 'special': n = Math.min(cap, randInt(rng, 4, 5)); break;
      case 'large': n = cap; break;
      default: n = Math.min(cap, randInt(rng, 2, 3));
    }
    return uniqueInts(rng, n, 1, 99);
  }

  // bloom-filter (js/viz/viz_bloom.js): a small set of lowercase words to insert plus one query
  // word. SIZE=32 bits / 3 hash functions per insert — capped at 8 words (<=24 bit-sets, with
  // overlap) so it never approaches saturating every bit, which would make every query trivially
  // "possibly present" and defeat the demo. The query word is drawn 50/50 from the inserted set
  // (exercises the "possibly present" path) or fresh (exercises "definitely not present").
  function bloomWords(rng, difficulty) {
    const alpha = 'abcdefghijklmnopqrstuvwxyz';
    function randWord(len) { let s = ''; for (let i = 0; i < len; i++) s += alpha[Math.floor(rng() * alpha.length)]; return s; }
    let n;
    switch (difficulty) {
      case 'edge': n = 1; break;
      case 'special': n = randInt(rng, 5, 6); break;
      case 'large': n = randInt(rng, 7, 8); break;
      default: n = randInt(rng, 3, 4);
    }
    const items = new Set();
    let guard = 0;
    while (items.size < n && guard++ < n * 50) items.add(randWord(randInt(rng, 3, 5)));
    const itemsArr = Array.from(items);
    let query;
    if (rng() < 0.5) {
      query = itemsArr[Math.floor(rng() * itemsArr.length)];
    } else {
      let q, g2 = 0;
      do { q = randWord(randInt(rng, 3, 5)); g2++; } while (items.has(q) && g2 < 50);
      query = q;
    }
    return { items: itemsArr, query: query };
  }

  // skip-list (js/viz/viz_skiplist.js): a unique key set for the node list. No hard structural
  // cap — MAXLVL=4 governs each node's *height*, assigned by the viz's own randomLevel() at
  // insert time, not by the key count — but node count is still kept modest (<=10) so the level
  // rows stay readable rather than scrolling arbitrarily wide.
  function skiplistKeys(rng, difficulty) {
    let n;
    switch (difficulty) {
      case 'edge': n = 1; break;
      case 'special': n = randInt(rng, 6, 7); break;
      case 'large': n = randInt(rng, 8, 10); break;
      default: n = randInt(rng, 4, 5);
    }
    return uniqueInts(rng, n, 1, 60);
  }

  // count-min-sketch (js/viz/viz_cms.js): a sequence of word "add" operations — repeats allowed
  // and expected, since CMS's whole point is estimating frequency from a handful of hashed
  // counters, so a few repeated words is what makes the demo interesting. WIDTH=8 counters per
  // row just accumulate integers (no hard capacity ceiling), so distinct-word and op counts are
  // kept modest purely for readability.
  function cmsWords(rng, difficulty) {
    const alpha = 'abcdefghijklmnopqrstuvwxyz';
    function randWord(len) { let s = ''; for (let i = 0; i < len; i++) s += alpha[Math.floor(rng() * alpha.length)]; return s; }
    let nDistinct, totalOps;
    switch (difficulty) {
      case 'edge': nDistinct = 1; totalOps = 1; break;
      case 'special': nDistinct = 2; totalOps = randInt(rng, 6, 8); break; // heavy repeats -> visible frequency skew
      case 'large': nDistinct = randInt(rng, 5, 6); totalOps = randInt(rng, 10, 12); break;
      default: nDistinct = randInt(rng, 3, 4); totalOps = randInt(rng, 5, 6);
    }
    const words = new Set();
    let guard = 0;
    while (words.size < nDistinct && guard++ < nDistinct * 50) words.add(randWord(randInt(rng, 3, 5)));
    const pool = Array.from(words);
    const ops = [];
    for (let i = 0; i < totalOps; i++) ops.push(pool[Math.floor(rng() * pool.length)]);
    return ops;
  }

  // file-isam (js/viz/viz_file_isam.js): a sorted set of unique integer keys the ISAM
  // index/blocks are built over (FileIsamViz.buildIsam sorts internally too, but keeping
  // the generator's output pre-sorted matches the SAMPLE_KEYS default) plus a search key.
  // blockSize stays at the viz's own default (3) — only the key set and search target are
  // randomized, per the brief's "sorted keys / records the ISAM viz builds its index over."
  function isamInput(rng, difficulty) {
    let n;
    switch (difficulty) {
      case 'edge': n = 1; break;
      case 'special': n = 9; break; // exactly 3 full blocks at the default blockSize=3
      case 'large': n = randInt(rng, 15, 18); break;
      default: n = randInt(rng, 6, 9);
    }
    const keys = uniqueInts(rng, n, 10, 99).sort((a, b) => a - b);
    const key = rng() < 0.7 ? keys[randInt(rng, 0, keys.length - 1)] : randInt(rng, 100, 199);
    return { keys: keys, blockSize: 3, key: key };
  }

  // file-inverted (js/viz/viz_file_inverted.js): a small set of short documents (space-separated
  // lowercase words, tokenized the same way FileInvertedViz.tokenize does) plus a query term drawn
  // from the shared vocabulary so it's a hit most of the time — mirrors the shape the viz already
  // keeps in `_invState.docs`/`.query`. Vocabulary/doc counts stay small (<=6 docs, <=6 words/doc)
  // so the rendered Documents/Index panes stay readable.
  function invertedInput(rng, difficulty) {
    const alpha = 'abcdefghijklmnopqrstuvwxyz';
    function randWord(len) { let s = ''; for (let i = 0; i < len; i++) s += alpha[Math.floor(rng() * alpha.length)]; return s; }
    let numDocs, wordsPerDoc, vocabSize;
    switch (difficulty) {
      case 'edge': numDocs = 1; wordsPerDoc = 1; vocabSize = 2; break;
      case 'special': numDocs = 3; wordsPerDoc = 3; vocabSize = 4; break; // small shared vocabulary -> visible term overlap across docs
      case 'large': numDocs = randInt(rng, 5, 6); wordsPerDoc = randInt(rng, 5, 6); vocabSize = 10; break;
      default: numDocs = randInt(rng, 3, 4); wordsPerDoc = randInt(rng, 3, 4); vocabSize = 7;
    }
    const vocab = [];
    let guard = 0;
    while (vocab.length < vocabSize && guard++ < vocabSize * 50) {
      const w = randWord(randInt(rng, 3, 5));
      if (vocab.indexOf(w) === -1) vocab.push(w);
    }
    const docs = [];
    const used = [];
    for (let d = 0; d < numDocs; d++) {
      const words = [];
      for (let w = 0; w < wordsPerDoc; w++) {
        const pick = vocab[randInt(rng, 0, vocab.length - 1)];
        words.push(pick);
        used.push(pick);
      }
      docs.push(words.join(' '));
    }
    // Draw the query from words that actually landed in a doc (not just the full vocab pool —
    // FileInvertedViz.buildFrames only indexes terms that appear, so a query term that was never
    // actually picked for any doc would legitimately miss, breaking the "actually in the index"
    // invariant tests/unit/random_input.test.js checks).
    const query = used[randInt(rng, 0, used.length - 1)];
    return { docs: docs, query: query };
  }

  // gc-memory (js/viz/viz_gc.js): the viz has FIVE independent scenario shapes, one per mode
  // selector option (mark-sweep / refcount / buddy / pointer-reversal / compact) — each backed
  // by its own hardcoded default scenario in js/gc_memory_viz.js (MS_SCENARIO, RC_OPS,
  // BUDDY_OPS, PR_SCENARIO, COMPACT_SCENARIO). Rather than requiring the caller to know which
  // mode is currently selected, this returns a random scenario for ALL FIVE at once (mirroring
  // how `recursionInputs` covers every example); the viz's 🎲 handler stores all five and only
  // the active mode's is used until the user switches modes, at which point that one is already
  // randomized too. All generators are careful to stay within each algorithm's safety
  // requirements (see per-function comments) — none of gcMemoryFrames' underlying functions has
  // a runaway-loop guard, so a malformed scenario is the actual hang/crash risk here.

  // Reachable chain from the roots, plus an UNREACHABLE 2-object reference cycle at the tail
  // (objects[n-2] <-> objects[n-1], never referenced by anything in the reachable chain) so
  // mark-sweep always has real garbage to collect, exactly like MS_SCENARIO's cycle {7,8}.
  function gcMarkSweepScenario(rng, difficulty) {
    let n;
    switch (difficulty) {
      case 'edge': n = 2; break;
      case 'special': n = 6; break;
      case 'large': n = 10; break;
      default: n = randInt(rng, 5, 7);
    }
    const objects = [];
    for (let i = 0; i < n; i++) objects.push({ id: i, refs: [] });
    const numRoots = difficulty === 'edge' ? 1 : randInt(rng, 1, 2);
    const roots = [];
    for (let i = 0; i < Math.min(numRoots, n); i++) roots.push(i);
    const reachableEnd = n >= 4 ? n - 2 : n; // objects[reachableEnd..n) are left for the garbage cycle
    for (let i = 0; i < reachableEnd - 1; i++) {
      if (rng() < 0.7) objects[i].refs.push(i + 1);
    }
    if (n >= 4) {
      objects[n - 2].refs.push(n - 1);
      objects[n - 1].refs.push(n - 2);
    }
    return { objects: objects, roots: roots };
  }

  // alloc/ref/droproot op sequence for GcMemoryViz.refCountFrames. `to` in every 'ref' op is
  // always a DIFFERENT already-allocated id (never self-referential) — refCountFrames indexes
  // straight into `objs[op.from]`/`objs[op.to]` with no existence guard for 'ref', so every id
  // referenced must already have an 'alloc' op ahead of it in the sequence (guaranteed here since
  // all allocs are emitted first). 'special' forces a mutual A<->B cycle to exercise the
  // "leaked cycle stays alive" legend case, same as RC_OPS's D<->E pair.
  function gcRefcountOps(rng, difficulty) {
    let n;
    switch (difficulty) {
      case 'edge': n = 1; break;
      case 'special': n = 2; break;
      case 'large': n = 5; break;
      default: n = randInt(rng, 3, 4);
    }
    const ids = 'ABCDEFGH'.slice(0, n).split('');
    const ops = [];
    ids.forEach((id) => ops.push({ type: 'alloc', id: id }));
    if (difficulty === 'special' && n >= 2) {
      ops.push({ type: 'ref', from: ids[0], to: ids[1] });
      ops.push({ type: 'ref', from: ids[1], to: ids[0] });
    } else if (n >= 2) {
      const numRefs = difficulty === 'large' ? randInt(rng, 2, 3) : randInt(rng, 0, 1);
      for (let i = 0; i < numRefs; i++) {
        const from = ids[randInt(rng, 0, n - 1)];
        const to = ids[(ids.indexOf(from) + 1) % n]; // always != from
        ops.push({ type: 'ref', from: from, to: to });
      }
    }
    ids.forEach((id) => ops.push({ type: 'droproot', id: id }));
    return ops;
  }

  // alloc/free op sequence for GcMemoryViz.buddyFrames. Every 'free' targets an id that was
  // actually allocated earlier in the sequence (tracked in `allocated`) and every 'alloc' size is
  // drawn from a fixed power-of-two menu <= the chosen `total`, so nextPow2() splitting always has
  // somewhere to bottom out; an alloc that can't find a free block just logs "FAILED" (buddyFrames'
  // own, non-throwing bail-out) rather than erroring, so oversubscribing the arena is harmless.
  function gcBuddyOps(rng, difficulty) {
    let total, numOps, maxSizeIdx;
    switch (difficulty) {
      case 'edge': total = 16; numOps = 2; maxSizeIdx = 1; break;
      case 'special': total = 32; numOps = 5; maxSizeIdx = 2; break;
      case 'large': total = 128; numOps = 8; maxSizeIdx = 3; break;
      default: total = 64; numOps = 5; maxSizeIdx = 2;
    }
    const sizes = [4, 8, 16, 32];
    const ids = 'abcdefgh';
    const allocated = [];
    const ops = [];
    let nextIdx = 0;
    for (let i = 0; i < numOps; i++) {
      if (allocated.length && rng() < 0.35) {
        const idx = randInt(rng, 0, allocated.length - 1);
        const id = allocated.splice(idx, 1)[0];
        ops.push({ type: 'free', id: id });
      } else {
        const id = ids[nextIdx++ % ids.length];
        const size = sizes[randInt(rng, 0, maxSizeIdx)];
        ops.push({ type: 'alloc', id: id, size: size });
        allocated.push(id);
      }
    }
    return { total: total, ops: ops };
  }

  // A single top-level list node (tag=1) whose dlink descends into a chain of plain atoms
  // (tag=0) linked by rlink — a generalized, arbitrary-length version of PR_SCENARIO's shape
  // (R -> n1 -> n2 -> ... via dlink then rlink). Deliberately NOT a general random graph: the
  // Schorr-Waite mark loop in pointerReversalFrames has no iteration guard of its own, and its
  // termination proof depends on every dlink/rlink either being null or pointing at a node that
  // actually exists in `nodes` — a single unbranching chain trivially satisfies that by
  // construction for any n, so this is safe at every difficulty without risking a hang.
  function gcPointerReversalScenario(rng, difficulty) {
    let n;
    switch (difficulty) {
      case 'edge': n = 2; break;
      case 'special': n = 4; break;
      case 'large': n = 6; break;
      default: n = randInt(rng, 3, 5);
    }
    const ids = [];
    for (let i = 0; i < n; i++) ids.push('A' + i);
    const nodes = ids.map((id, i) => ({ id: id, tag: 0, dlink: null, rlink: i + 1 < n ? ids[i + 1] : null }));
    nodes.unshift({ id: 'R', tag: 1, dlink: ids[0], rlink: null });
    return { nodes: nodes, root: 'R' };
  }

  // A contiguous run of blocks (live/dead, `addr` assigned sequentially from 1 with no gaps or
  // overlaps) for GcMemoryViz.compactFrames, generalizing COMPACT_SCENARIO's fixed 5-block layout.
  // `total` is set to exactly one past the last block's end address (same convention as the
  // original: total=10, last block E ends at addr 9 + size 1 = 10), so pass1's address assignment
  // and pass3's relocation always have room for every live block. A `link` (when present) always
  // points at a DIFFERENT already-created live block's id — compactFrames tolerates a link to a
  // dead/missing id anyway (falls back to `0`), so this is a belt-and-suspenders choice, not a
  // required one.
  function gcCompactScenario(rng, difficulty) {
    let n;
    switch (difficulty) {
      case 'edge': n = 2; break;
      case 'special': n = 5; break;
      case 'large': n = 7; break;
      default: n = randInt(rng, 3, 4);
    }
    const LETTERS = 'ABCDEFG';
    const blocks = [];
    let addr = 1;
    const liveIds = [];
    for (let i = 0; i < n; i++) {
      const size = randInt(rng, 1, 2);
      const live = rng() < 0.6;
      blocks.push({ id: LETTERS[i], addr: addr, size: size, live: live, link: null });
      if (live) liveIds.push(LETTERS[i]);
      addr += size;
    }
    if (liveIds.length >= 2 && rng() < 0.7) {
      const a = liveIds[randInt(rng, 0, liveIds.length - 1)];
      const others = liveIds.filter((x) => x !== a);
      if (others.length) blocks.filter((b) => b.id === a)[0].link = others[randInt(rng, 0, others.length - 1)];
    }
    return { total: addr, blocks: blocks };
  }

  function gcMemoryInputs(rng, difficulty) {
    return {
      markSweep: gcMarkSweepScenario(rng, difficulty),
      refcountOps: gcRefcountOps(rng, difficulty),
      buddy: gcBuddyOps(rng, difficulty),
      pointerReversal: gcPointerReversalScenario(rng, difficulty),
      compact: gcCompactScenario(rng, difficulty),
    };
  }

  // recursion (js/viz/viz_recursion.js): one input set per RecursionViz.EXAMPLES entry, matching
  // RecursionViz.DEFAULTS's shape exactly, so the 🎲 handler can just replace `_recState.inputs`
  // wholesale regardless of which example is currently selected. Every bound mirrors the viz's
  // OWN "Build" button clamps (js/viz/viz_recursion.js) since the random handler bypasses that
  // parsing/clamping and writes straight into state: fibonacci n<=7 (the `.rec-n` input itself
  // has max="7"), reverse text<=6 chars (`.slice(0,6)`), permutations text<=4 chars
  // (`.slice(0,4)`), binary-search arr<=15 entries (`.slice(0,15)`), quicksort arr<=10 entries
  // (`.slice(0,10)`). Fibonacci n<=7 in particular is the recursion-depth safety cap the brief
  // calls out: recursionTrace has no guard of its own, so exceeding the viz's own bound here
  // (fib(n) makes 2*fib(n+1)-1 calls -- 41 calls at n=7) is exactly the risk to avoid.
  function recLetters(rng, n) {
    const pool = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    let s = '';
    for (let i = 0; i < n; i++) s += pool.splice(randInt(rng, 0, pool.length - 1), 1)[0];
    return s;
  }
  function recursionInputs(rng, difficulty) {
    let fibN, revLen, permLen, bsLen, qsLen;
    switch (difficulty) {
      case 'edge': fibN = 0; revLen = 1; permLen = 1; bsLen = 1; qsLen = 1; break;
      case 'special': fibN = 1; revLen = 3; permLen = 3; bsLen = 6; qsLen = 5; break;
      case 'large': fibN = 7; revLen = 6; permLen = 4; bsLen = 15; qsLen = 10; break;
      default: fibN = randInt(rng, 3, 6); revLen = randInt(rng, 3, 5); permLen = randInt(rng, 2, 3); bsLen = randInt(rng, 6, 10); qsLen = randInt(rng, 5, 8);
    }
    const bsArr = uniqueInts(rng, bsLen, 1, 99);
    const bsTarget = rng() < 0.7 ? bsArr[randInt(rng, 0, bsArr.length - 1)] : randInt(rng, 1, 99);
    return {
      fibonacci: { n: fibN },
      reverse: { text: recLetters(rng, revLen) },
      permutations: { text: recLetters(rng, permLen) },
      'binary-search': { arr: bsArr, target: bsTarget },
      quicksort: { arr: uniqueInts(rng, qsLen, 1, 99) },
    };
  }

  function randomInputFor(methodId, difficulty, rng) {
    rng = rng || Math.random;
    if (['normal', 'special', 'edge', 'large'].indexOf(difficulty) === -1) difficulty = 'normal';
    switch (methodId) {
      case 'tree-traversal':
      case 'tree-threaded': return { vals: valSeq(rng, difficulty) };
      case 'heap-binary':
      case 'heap-binomial':
      case 'heap-fibonacci':
      case 'heap-leftist':
      case 'heap-skew':
      case 'heap-dary':
      case 'heap-pairing':
        return { vals: valSeq(rng, difficulty) };
      case 'list-doubly': return { vals: valSeq(rng, difficulty), circular: rng() < 0.5 };
      case 'list-equivalence': {
        if (difficulty === 'edge') return rng() < 0.5 ? { n: 1, pairs: [] } : { n: randInt(rng, 4, 6), pairs: [] };
        if (difficulty === 'special') {
          const n = randInt(rng, 8, 10); const pairs = [];
          for (let i = 0; i < n - 1; i++) pairs.push([i, i + 1]);
          return { n: n, pairs: pairs };
        }
        const n = difficulty === 'large' ? 12 : randInt(rng, 8, 10);
        const m = difficulty === 'large' ? randInt(rng, 10, 14) : randInt(rng, 6, 8);
        const pairs = [];
        for (let k = 0; k < m; k++) { const a = randInt(rng, 0, n - 1), b = randInt(rng, 0, n - 1); if (a !== b) pairs.push([a, b]); }
        return { n: n, pairs: pairs };
      }
      case 'search': {
        const data = valSeq(rng, difficulty);
        const target = rng() < 0.6 ? data[Math.floor(rng() * data.length)] : randInt(rng, 1, 99);
        return { data, target };
      }
      case 'strsearch': {
        const alpha = 'ABCD';
        const L = difficulty === 'large' ? randInt(rng, 22, 28) : randInt(rng, 14, 20);
        let text = '';
        for (let i = 0; i < L; i++) text += alpha[Math.floor(rng() * alpha.length)];
        let pattern;
        if (rng() < 0.7 && L > 6) { const start = Math.floor(rng() * (L - 4)); pattern = text.substr(start, randInt(rng, 3, 5)); }
        else { const pl = randInt(rng, 3, 5); pattern = ''; for (let i = 0; i < pl; i++) pattern += alpha[Math.floor(rng() * alpha.length)]; }
        return { text, pattern };
      }
      case 'aho': {
        const alpha = 'abcde';
        const np = randInt(rng, 2, 4), patterns = [];
        for (let i = 0; i < np; i++) { const pl = randInt(rng, 2, 3); let p = ''; for (let k = 0; k < pl; k++) p += alpha[Math.floor(rng() * alpha.length)]; patterns.push(p); }
        const L = difficulty === 'large' ? randInt(rng, 14, 20) : randInt(rng, 8, 12);
        let text = '';
        for (let i = 0; i < L; i++) text += alpha[Math.floor(rng() * alpha.length)];
        if (rng() < 0.7) { const at = Math.floor(rng() * (L - patterns[0].length + 1)); text = text.slice(0, at) + patterns[0] + text.slice(at + patterns[0].length); }
        return { patterns, text };
      }
      case 'sort': return { data: valSeq(rng, difficulty) };
      case 'sort-external': return { data: valSeq(rng, difficulty), M: 4 };
      case 'huffman': return { text: huffmanText(rng, difficulty) };
      case 'expr-infix-postfix': return { text: exprInfix(rng, difficulty) };
      case 'tree-expression': return { text: exprPostfix(rng, difficulty) };
      case 'tree-obst': return obstInput(rng, difficulty);
      case 'tree-radix':
      case 'tree-ternary':
        return { words: wordSet(rng, difficulty) };
      case 'tree-btree':
      case 'tree-bplus':
        return { vals: valSeq(rng, difficulty) };
      case 'matrix-sparse': return { text: matrixText(rng, difficulty) };
      case 'matrix-sparse-list': return { text: matrixSparseListText(rng, difficulty) };
      case 'poly-padd': return polyInput(rng, difficulty);
      case 'maze-stack': return { text: mazeText(rng, difficulty) };
      case 'tree-mway': return mwayInput(rng, difficulty);
      case 'search-fibonacci': return searchInput(rng, difficulty, false);
      case 'search-interpolation': return searchInput(rng, difficulty, true);
      case 'search-binary':
      case 'search-linear': return searchInput(rng, difficulty, false);
      case 'graph-bfs':
      case 'graph-dfs':
        return { text: graphEdgeList(rng, difficulty, false) };
      case 'graph-dijkstra':
        return { text: graphEdgeList(rng, difficulty, true) };
      case 'graph-kruskal':
      case 'graph-prim':
      case 'graph-boruvka':
      case 'graph-redblue':
        return { text: graphEdgeList(rng, difficulty, true) };
      case 'graph-topo': return { text: graphDagText(rng, difficulty, false) };
      case 'graph-bellman-ford': return { text: graphDagText(rng, difficulty, true) };
      case 'graph-floyd-warshall': return { text: graphEdgeList(rng, difficulty, true) };
      case 'graph-aoe': return { text: aoeNetworkText(rng, difficulty) };
      case 'graph-matrix': return graphMatrixInput(rng, difficulty);
      case 'graph':
      case 'graph-adjlist':
      case 'graph-multilist':
      case 'graph-traversal':
        return { text: graphEdgeList(rng, difficulty, false) };
      case 'graph-components': return graphComponentsEdges(rng, difficulty);
      case 'graph-bipartite': return graphBipartiteEdges(rng, difficulty);
      case 'graph-closure':
      case 'graph-scc':
        return graphNumericEdges(rng, difficulty);
      case 'graph-maxflow': return maxFlowConfig(rng, difficulty);
      case 'tree-dsu': return { text: dsuOpString(rng, difficulty) };
      case 'tree-segment': return { vals: segTreeVals(rng, difficulty) };
      case 'tree-fenwick': return { vals: valSeq(rng, difficulty) };
      case 'tree-catalan': return { n: catalanN(rng, difficulty) };
      case 'game-tree': return { leaves: gameTreeLeaves(rng, difficulty) };
      case 'tree-general-binary': return { text: tgbTreeText(rng, difficulty) };
      case 'tree-copy-equal': return copyEqualInput(rng, difficulty);
      case 'hash-chain': return { vals: hashKeys(rng, difficulty, 9) };
      case 'hash-open': return { vals: hashKeys(rng, difficulty, 5) };
      case 'hash-bucket': return { vals: hashKeys(rng, difficulty, 8) };
      case 'bloom-filter': return bloomWords(rng, difficulty);
      case 'skip-list': return { vals: skiplistKeys(rng, difficulty) };
      case 'count-min-sketch': return { words: cmsWords(rng, difficulty) };
      case 'deque': return { vals: valSeq(rng, difficulty) };
      case 'sort-polyphase': return { data: valSeq(rng, difficulty) };
      case 'file-isam': return isamInput(rng, difficulty);
      case 'file-inverted': return invertedInput(rng, difficulty);
      case 'gc-memory': return gcMemoryInputs(rng, difficulty);
      case 'recursion': return recursionInputs(rng, difficulty);
      case 'magic-square':
      case 'magic-torus':
      case 'magic-formula':
      case 'magic-symmetry':
        return { n: magicOrder(rng, difficulty, [3, 5, 7]) };
      case 'magic-latin':
        return { n: magicOrder(rng, difficulty, [3, 5, 7, 9]) };
      default: return null;
    }
  }

  const api = { randomInputFor: randomInputFor, isMazeSolvable: isMazeSolvable };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.RandomInput = api;
})(typeof window !== 'undefined' ? window : globalThis);
