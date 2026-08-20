const test = require('node:test');
const assert = require('node:assert');
const RI = require('../../js/random_input.js');
const TGB = require('../../js/tree_general_binary_viz.js');
const CE = require('../../js/tree_copy_equal_viz.js');
const GW = require('../../js/viz/viz_graph_workbench.js');
const GMV = require('../../js/graph_matrix_viz.js');
const GCV = require('../../js/graph_components_viz.js');
const GBV = require('../../js/graph_bipartite_viz.js');
const GCLV = require('../../js/graph_closure_viz.js');
const GSCV = require('../../js/graph_scc_viz.js');
const GMFV = require('../../js/graph_maxflow_viz.js');
const FIV = require('../../js/file_isam_viz.js');
const FInV = require('../../js/file_inverted_viz.js');
const GCMV = require('../../js/gc_memory_viz.js');
const RV = require('../../js/recursion_viz.js');
const SPV = require('../../js/sort_polyphase_viz.js');
const MLV = require('../../js/magic_latin_viz.js');

const DIFFS = ['normal', 'special', 'edge', 'large'];
function isSortedAsc(a) { return a.every((v, i) => i === 0 || a[i - 1] <= v); }
function allEqual(a) { return a.every((v) => v === a[0]); }

test('unknown method returns null', () => {
  assert.strictEqual(RI.randomInputFor('nope', 'normal'), null);
});

test('value-seq methods: shape + per-difficulty properties', () => {
  for (const id of ['tree-traversal', 'tree-threaded', 'sort']) {
    for (const d of DIFFS) {
      for (let i = 0; i < 30; i++) {
        const out = RI.randomInputFor(id, d);
        const vals = id === 'sort' ? out.data : out.vals;
        assert.ok(Array.isArray(vals) && vals.length >= 1, `${id}/${d} non-empty`);
        assert.ok(vals.every(Number.isFinite), `${id}/${d} numbers`);
        if (d === 'normal') assert.ok(vals.length >= 6 && vals.length <= 9);
        if (d === 'edge') assert.ok(vals.length <= 4 && (vals.length === 1 || allEqual(vals)));
        if (d === 'large') assert.ok(vals.length >= 18);
        if (d === 'special') assert.ok(isSortedAsc(vals) || isSortedAsc(vals.slice().reverse()));
      }
    }
  }
});

for (const id of ['heap-binary', 'heap-binomial', 'heap-fibonacci', 'heap-leftist', 'heap-skew', 'heap-dary', 'heap-pairing']) {
  test(`randomInputFor ${id}: value sequence per difficulty`, () => {
    for (const d of DIFFS) {
      const r = RI.randomInputFor(id, d, Math.random);
      assert.ok(r && Array.isArray(r.vals) && r.vals.length >= 1, `${id}/${d} shape`);
    }
    const n = RI.randomInputFor(id, 'normal', Math.random).vals.length;
    const big = RI.randomInputFor(id, 'large', Math.random).vals.length;
    assert.ok(big > n, `${id}: large (${big}) > normal (${n})`);
  });
}

for (const id of ['tree-btree', 'tree-bplus']) {
  test(`randomInputFor ${id}: value sequence per difficulty`, () => {
    for (const d of DIFFS) {
      const r = RI.randomInputFor(id, d, Math.random);
      assert.ok(r && Array.isArray(r.vals) && r.vals.length >= 1, `${id}/${d} shape`);
      assert.ok(r.vals.every(Number.isFinite), `${id}/${d} numbers`);
    }
    const n = RI.randomInputFor(id, 'normal', Math.random).vals.length;
    const big = RI.randomInputFor(id, 'large', Math.random).vals.length;
    assert.ok(big > n, `${id}: large (${big}) > normal (${n})`);
  });
}

for (const id of ['tree-radix', 'tree-ternary']) {
  test(`randomInputFor ${id}: word set per difficulty`, () => {
    for (const d of DIFFS) {
      const r = RI.randomInputFor(id, d, Math.random);
      assert.ok(r && Array.isArray(r.words) && r.words.length >= 1, `${id}/${d} shape`);
      assert.ok(r.words.every((w) => typeof w === 'string' && /^[a-z]+$/.test(w)), `${id}/${d} lowercase words`);
      if (d === 'edge') assert.strictEqual(r.words.length, 1);
      if (d === 'special') assert.ok(r.words.every((w) => w.length >= 3), `${id}/special words carry the shared 2-char prefix`);
    }
    const n = RI.randomInputFor(id, 'normal', Math.random).words.length;
    const big = RI.randomInputFor(id, 'large', Math.random).words.length;
    assert.ok(big > n, `${id}: large (${big}) > normal (${n})`);
  });
}

test('list-doubly: vals + circular boolean', () => {
  for (const d of DIFFS) {
    const out = RI.randomInputFor('list-doubly', d);
    assert.ok(Array.isArray(out.vals) && out.vals.length >= 1);
    assert.strictEqual(typeof out.circular, 'boolean');
  }
});

test('search methods: sorted arr + target presence', () => {
  for (const id of ['search-fibonacci', 'search-interpolation', 'search-binary', 'search-linear']) {
    for (const d of DIFFS) {
      for (let i = 0; i < 30; i++) {
        const { arr, target } = RI.randomInputFor(id, d);
        assert.ok(Array.isArray(arr) && arr.length >= 1, `${id}/${d} arr`);
        assert.ok(isSortedAsc(arr), `${id}/${d} sorted`);
        assert.ok(Number.isFinite(target));
        if (d === 'edge') assert.ok(!arr.includes(target), `${id}/edge target absent`);
        else if (d !== 'edge') assert.ok(arr.includes(target), `${id}/${d} target present`);
        if (d === 'large') assert.ok(arr.length >= 30);
      }
    }
  }
  for (let i = 0; i < 10; i++) {
    const { arr } = RI.randomInputFor('search-interpolation', 'special');
    const diff = arr[1] - arr[0];
    assert.ok(arr.every((v, k) => k === 0 || v - arr[k - 1] === diff), 'interp special uniform');
  }
});

test('huffman text per difficulty', () => {
  for (let i = 0; i < 20; i++) {
    assert.strictEqual(RI.randomInputFor('huffman', 'edge').text.length, 1);
    assert.ok(RI.randomInputFor('huffman', 'large').text.length >= 30);
    const sp = RI.randomInputFor('huffman', 'special').text;
    assert.strictEqual(new Set(sp.split('')).size, 2, 'special => 2 distinct symbols');
    assert.ok(/^[A-Z]+$/.test(RI.randomInputFor('huffman', 'normal').text));
  }
});

test('expr infix + postfix validity', () => {
  for (let i = 0; i < 20; i++) {
    const inf = RI.randomInputFor('expr-infix-postfix', 'normal').text;
    assert.ok(/[+\-*/]/.test(inf), 'normal infix has operator');
    assert.ok(!/[+\-*/]/.test(RI.randomInputFor('expr-infix-postfix', 'edge').text), 'edge no operator');
    const sp = RI.randomInputFor('expr-infix-postfix', 'special').text;
    assert.strictEqual(new Set((sp.match(/[+\-*/]/g) || [])).size, 1, 'special single operator type');
    const lg = RI.randomInputFor('expr-infix-postfix', 'large').text;
    assert.ok((lg.match(/[+\-*/]/g) || []).length >= 6, 'large >=6 operators');
    const post = RI.randomInputFor('tree-expression', 'normal').text;
    assert.ok(/\d/.test(post) && /[+\-*/]/.test(post), 'postfix has number + operator');
  }
});

test('tree-obst keys sorted, lengths match, dominant special, edge single', () => {
  for (const d of DIFFS) {
    const { keys, freqs } = RI.randomInputFor('tree-obst', d);
    assert.ok(isSortedAsc(keys));
    assert.strictEqual(keys.length, freqs.length);
    if (d === 'edge') assert.strictEqual(keys.length, 1);
    if (d === 'large') assert.ok(keys.length >= 8);
    if (d === 'special') assert.ok(Math.max(...freqs) >= 3 * Math.min(...freqs));
  }
});

test('matrix-sparse text shape', () => {
  function parse(t) { return t.split(';').map((r) => r.split(',').map(Number)); }
  const edge = parse(RI.randomInputFor('matrix-sparse', 'edge').text);
  assert.ok(edge.every((r) => r.every((v) => v === 0)), 'edge all zero');
  const sp = parse(RI.randomInputFor('matrix-sparse', 'special').text);
  assert.ok(sp.every((row, r) => row.every((v, c) => v === 0 || r === c)), 'special diagonal only');
  const lg = parse(RI.randomInputFor('matrix-sparse', 'large').text);
  assert.ok(lg.length >= 8 && lg[0].length >= 8, 'large >=8x8');
});

test('poly-padd shape', () => {
  const edge = RI.randomInputFor('poly-padd', 'edge');
  assert.ok(!edge.a.includes(',') && !edge.b.includes(','), 'edge single term');
  const sp = RI.randomInputFor('poly-padd', 'special');
  const exps = (s) => s.split(',').map((t) => t.split(':')[1]).join(',');
  assert.strictEqual(exps(sp.a), exps(sp.b), 'special identical exponents');
  const lg = RI.randomInputFor('poly-padd', 'large');
  assert.ok(lg.a.split(',').length >= 6, 'large >=6 terms');
});

test('maze solvability per difficulty', () => {
  for (let i = 0; i < 15; i++) {
    assert.ok(RI.isMazeSolvable(RI.randomInputFor('maze-stack', 'normal').text), 'normal solvable');
    assert.ok(RI.isMazeSolvable(RI.randomInputFor('maze-stack', 'special').text), 'special solvable');
    assert.ok(RI.isMazeSolvable(RI.randomInputFor('maze-stack', 'large').text), 'large solvable');
    assert.ok(!RI.isMazeSolvable(RI.randomInputFor('maze-stack', 'edge').text), 'edge unsolvable');
  }
});

test('tree-mway keys + m', () => {
  for (const d of DIFFS) {
    const { keys, m } = RI.randomInputFor('tree-mway', d);
    assert.strictEqual(m, 3);
    assert.ok(keys.length >= 1);
    if (d === 'edge') assert.ok(keys.length <= 2);
    if (d === 'large') assert.ok(keys.length >= 14);
    if (d === 'special') assert.ok(isSortedAsc(keys));
  }
});

test('tree-segment: vals per difficulty, bounded to <=8 leaves for the fixed layout', () => {
  for (const d of DIFFS) {
    const r = RI.randomInputFor('tree-segment', d, Math.random);
    assert.ok(r && Array.isArray(r.vals) && r.vals.length >= 1 && r.vals.length <= 8, `tree-segment/${d} shape`);
    assert.ok(r.vals.every(Number.isFinite), `tree-segment/${d} numbers`);
    if (d === 'edge') assert.strictEqual(r.vals.length, 1);
    if (d === 'special') assert.ok(allEqual(r.vals), 'special is a uniform array');
  }
  const n = RI.randomInputFor('tree-segment', 'normal', Math.random).vals.length;
  const big = RI.randomInputFor('tree-segment', 'large', Math.random).vals.length;
  assert.ok(big > n, `tree-segment: large (${big}) > normal (${n})`);
});

test('tree-fenwick: vals per difficulty', () => {
  for (const d of DIFFS) {
    const r = RI.randomInputFor('tree-fenwick', d, Math.random);
    assert.ok(r && Array.isArray(r.vals) && r.vals.length >= 1, `tree-fenwick/${d} shape`);
    assert.ok(r.vals.every(Number.isFinite), `tree-fenwick/${d} numbers`);
  }
  const n = RI.randomInputFor('tree-fenwick', 'normal', Math.random).vals.length;
  const big = RI.randomInputFor('tree-fenwick', 'large', Math.random).vals.length;
  assert.ok(big > n, `tree-fenwick: large (${big}) > normal (${n})`);
});

test('tree-dsu: op string per difficulty, more union/find ops at large', () => {
  function opCount(s) { return (s.match(/[UuFf]/g) || []).length; }
  for (const d of DIFFS) {
    const r = RI.randomInputFor('tree-dsu', d, Math.random);
    assert.ok(r && typeof r.text === 'string' && r.text.length > 0, `tree-dsu/${d} shape`);
    assert.ok(opCount(r.text) >= 1, `tree-dsu/${d} has at least one op`);
  }
  const n = opCount(RI.randomInputFor('tree-dsu', 'normal', Math.random).text);
  const big = opCount(RI.randomInputFor('tree-dsu', 'large', Math.random).text);
  assert.ok(big > n, `tree-dsu: large (${big}) > normal (${n}) ops`);
});

test('sort-external data + M', () => {
  const out = RI.randomInputFor('sort-external', 'normal');
  assert.ok(Array.isArray(out.data) && out.data.length >= 1);
  assert.strictEqual(out.M, 4);
});

// n stays within the UI's own n=0..4 button range (enumerateShapes(n) is exponential,
// so the viz itself never offers a button past n=4 — see js/viz/viz_tree_catalan.js).
test('tree-catalan: n stays within the 0..4 button range, large is the max', () => {
  for (const d of DIFFS) {
    for (let i = 0; i < 30; i++) {
      const r = RI.randomInputFor('tree-catalan', d, Math.random);
      assert.ok(r && Number.isInteger(r.n) && r.n >= 0 && r.n <= 4, `tree-catalan/${d} in range`);
    }
  }
  assert.strictEqual(RI.randomInputFor('tree-catalan', 'large', Math.random).n, 4);
  const n = RI.randomInputFor('tree-catalan', 'normal', Math.random).n;
  const big = RI.randomInputFor('tree-catalan', 'large', Math.random).n;
  assert.ok(big > n, `tree-catalan: large (${big}) > normal (${n})`);
});

test('game-tree: leaf values per difficulty', () => {
  for (const d of DIFFS) {
    const r = RI.randomInputFor('game-tree', d, Math.random);
    assert.ok(r && Array.isArray(r.leaves) && r.leaves.length >= 1, `game-tree/${d} shape`);
    assert.ok(r.leaves.every(Number.isFinite), `game-tree/${d} numbers`);
  }
  assert.strictEqual(RI.randomInputFor('game-tree', 'edge', Math.random).leaves.length, 4);
  const n = RI.randomInputFor('game-tree', 'normal', Math.random).leaves.length;
  const big = RI.randomInputFor('game-tree', 'large', Math.random).leaves.length;
  assert.ok(big > n, `game-tree: large (${big}) > normal (${n})`);
});

test('tree-general-binary: adjacency text parses to a valid rooted tree, larger at large', () => {
  for (const d of DIFFS) {
    for (let i = 0; i < 30; i++) {
      const r = RI.randomInputFor('tree-general-binary', d, Math.random);
      assert.ok(r && typeof r.text === 'string' && r.text.length > 0, `tree-general-binary/${d} shape`);
      const gen = TGB.parseGeneralTree(r.text);
      assert.ok(gen.root, `tree-general-binary/${d} has a root`);
      assert.doesNotThrow(() => TGB.toBinary(gen), `tree-general-binary/${d} converts to binary without throwing`);
    }
  }
  const nodeCount = (text) => new Set((text.match(/[A-Z]/g) || [])).size;
  const n = nodeCount(RI.randomInputFor('tree-general-binary', 'normal', Math.random).text);
  const big = nodeCount(RI.randomInputFor('tree-general-binary', 'large', Math.random).text);
  assert.ok(big > n, `tree-general-binary: large (${big}) > normal (${n}) nodes`);
});

test('tree-copy-equal: level-order tokens parse for src/a/b, special forces a===b, edge is single-node', () => {
  for (const d of DIFFS) {
    for (let i = 0; i < 30; i++) {
      const r = RI.randomInputFor('tree-copy-equal', d, Math.random);
      assert.ok(r && typeof r.src === 'string' && typeof r.a === 'string' && typeof r.b === 'string', `tree-copy-equal/${d} shape`);
      for (const text of [r.src, r.a, r.b]) {
        const { root, error } = CE.parseTree(CE.tokenize(text));
        assert.strictEqual(error, null, `tree-copy-equal/${d} "${text}" parses cleanly`);
        assert.ok(root, `tree-copy-equal/${d} "${text}" has a root`);
      }
      if (d === 'special') assert.strictEqual(r.a, r.b, 'special forces a === b');
      if (d === 'edge') { assert.strictEqual(r.src, 'A'); assert.strictEqual(r.a, 'A'); assert.strictEqual(r.b, 'A'); }
    }
  }
  const nodeCount = (text) => text.split(/\s+/).filter((t) => t !== '-').length;
  const n = nodeCount(RI.randomInputFor('tree-copy-equal', 'normal', Math.random).src);
  const big = nodeCount(RI.randomInputFor('tree-copy-equal', 'large', Math.random).src);
  assert.ok(big > n, `tree-copy-equal: large (${big}) > normal (${n}) nodes`);
});

test('graph-floyd-warshall: edge-list text parses to a valid (weighted, directed-or-not) graph, larger at large', () => {
  for (const d of DIFFS) {
    for (let i = 0; i < 30; i++) {
      const r = RI.randomInputFor('graph-floyd-warshall', d, Math.random);
      assert.ok(r && typeof r.text === 'string' && r.text.length > 0, `graph-floyd-warshall/${d} shape`);
      const parsedDirected = GW.parseEdges(r.text, true, true, false);
      const parsedUndirected = GW.parseEdges(r.text, true, false, false);
      assert.ok(parsedDirected.ok, `graph-floyd-warshall/${d} parses directed: ${JSON.stringify(parsedDirected.error)}`);
      assert.ok(parsedUndirected.ok, `graph-floyd-warshall/${d} parses undirected: ${JSON.stringify(parsedUndirected.error)}`);
      assert.ok(parsedDirected.n >= 2 && parsedDirected.n <= 12, `graph-floyd-warshall/${d} node count in range`);
      assert.ok(parsedDirected.edges.length >= 1, `graph-floyd-warshall/${d} has at least one edge`);
      parsedDirected.edges.forEach((e) => assert.ok(e.w >= 1, `graph-floyd-warshall/${d} positive weight`));
    }
  }
  const nodeCount = (text) => GW.parseEdges(text, true, true, false).n;
  const n = nodeCount(RI.randomInputFor('graph-floyd-warshall', 'normal', Math.random).text);
  const big = nodeCount(RI.randomInputFor('graph-floyd-warshall', 'large', Math.random).text);
  assert.ok(big > n, `graph-floyd-warshall: large (${big}) > normal (${n}) nodes`);
});

test('graph-aoe: activity network is a DAG with a single source and single sink, larger at large', () => {
  for (const d of DIFFS) {
    for (let i = 0; i < 30; i++) {
      const r = RI.randomInputFor('graph-aoe', d, Math.random);
      assert.ok(r && typeof r.text === 'string' && r.text.length > 0, `graph-aoe/${d} shape`);
      const parsed = GW.parseEdges(r.text, true, true, false);
      assert.ok(parsed.ok, `graph-aoe/${d} parses: ${JSON.stringify(parsed.error)}`);
      const n = parsed.n;
      const indeg = new Array(n).fill(0), outdeg = new Array(n).fill(0);
      parsed.edges.forEach((e) => {
        assert.ok(e.u < e.v, `graph-aoe/${d} edge ${e.u}-${e.v} keeps index order (acyclic by construction)`);
        assert.ok(e.w >= 1, `graph-aoe/${d} positive activity duration`);
        outdeg[e.u]++; indeg[e.v]++;
      });
      assert.strictEqual(indeg.filter((x) => x === 0).length, 1, `graph-aoe/${d} exactly one source`);
      assert.strictEqual(outdeg.filter((x) => x === 0).length, 1, `graph-aoe/${d} exactly one sink`);
      assert.strictEqual(indeg[0], 0, `graph-aoe/${d} node 0 is the source`);
      assert.strictEqual(outdeg[n - 1], 0, `graph-aoe/${d} last node is the sink`);
    }
  }
  const nodeCount = (text) => GW.parseEdges(text, true, true, false).n;
  const n = nodeCount(RI.randomInputFor('graph-aoe', 'normal', Math.random).text);
  const big = nodeCount(RI.randomInputFor('graph-aoe', 'large', Math.random).text);
  assert.ok(big > n, `graph-aoe: large (${big}) > normal (${n}) nodes`);
});

test('graph-matrix: {n, edges} is valid input for GraphMatrixViz, larger at large', () => {
  for (const d of DIFFS) {
    for (let i = 0; i < 30; i++) {
      const r = RI.randomInputFor('graph-matrix', d, Math.random);
      assert.ok(r && Number.isInteger(r.n) && Array.isArray(r.edges), `graph-matrix/${d} shape`);
      assert.ok(r.n >= 1 && r.n <= 10, `graph-matrix/${d} node count in GraphMatrixViz's range`);
      r.edges.forEach((e) => {
        assert.ok(Number.isInteger(e.u) && Number.isInteger(e.v) && e.u !== e.v, `graph-matrix/${d} edge endpoints valid`);
        assert.ok(e.u >= 0 && e.u < r.n && e.v >= 0 && e.v < r.n, `graph-matrix/${d} endpoints within n`);
        assert.ok(e.w >= 1, `graph-matrix/${d} positive weight`);
      });
      // Round-trips through the viz's own parser unchanged.
      const roundTrip = GMV.parseInput(String(r.n), r.edges.map((e) => e.u + '-' + e.v + ':' + e.w).join(','));
      assert.strictEqual(roundTrip.n, r.n, `graph-matrix/${d} round-trips n`);
      assert.strictEqual(roundTrip.edges.length, r.edges.length, `graph-matrix/${d} round-trips edge count`);
    }
  }
  const n = RI.randomInputFor('graph-matrix', 'normal', Math.random).n;
  const big = RI.randomInputFor('graph-matrix', 'large', Math.random).n;
  assert.ok(big > n, `graph-matrix: large (${big}) > normal (${n}) nodes`);
});

function isConnectedUndirected(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  edges.forEach((e) => { adj[e.u].push(e.v); adj[e.v].push(e.u); });
  const seen = new Array(n).fill(false);
  const stack = [0];
  seen[0] = true;
  let count = 1;
  while (stack.length) {
    const u = stack.pop();
    adj[u].forEach((v) => { if (!seen[v]) { seen[v] = true; count++; stack.push(v); } });
  }
  return count === n;
}

function hasDirectedCycle(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  edges.forEach((e) => adj[e.u].push(e.v));
  const color = new Array(n).fill(0); // 0=white, 1=gray, 2=black
  let found = false;
  function dfs(u) {
    color[u] = 1;
    for (const v of adj[u]) {
      if (color[v] === 1) { found = true; return; }
      if (color[v] === 0) dfs(v);
      if (found) return;
    }
    color[u] = 2;
  }
  for (let i = 0; i < n && !found; i++) if (color[i] === 0) dfs(i);
  return found;
}

function countComponentsUndirected(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  edges.forEach((e) => { adj[e.u].push(e.v); adj[e.v].push(e.u); });
  const seen = new Array(n).fill(false);
  let count = 0;
  for (let s = 0; s < n; s++) {
    if (seen[s]) continue;
    count++;
    const stack = [s];
    seen[s] = true;
    while (stack.length) {
      const u = stack.pop();
      adj[u].forEach((v) => { if (!seen[v]) { seen[v] = true; stack.push(v); } });
    }
  }
  return count;
}

function isBipartiteUndirected(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  edges.forEach((e) => { adj[e.u].push(e.v); adj[e.v].push(e.u); });
  const color = new Array(n).fill(-1);
  for (let s = 0; s < n; s++) {
    if (color[s] !== -1) continue;
    color[s] = 0;
    const queue = [s];
    while (queue.length) {
      const u = queue.shift();
      for (const v of adj[u]) {
        if (color[v] === -1) { color[v] = 1 - color[u]; queue.push(v); }
        else if (color[v] === color[u]) return false;
      }
    }
  }
  return true;
}

test('randomInputFor graph-components: undirected numeric FOREST with >1 component, larger at large', () => {
  // 'edge' may legitimately draw k=1 (a single tiny component), so it isn't
  // asserted here — but every other tier's k is fixed/floored at >=2, so it
  // must show >1 component on every single draw, never just "sometimes".
  for (const d of DIFFS) {
    for (let i = 0; i < 30; i++) {
      const r = RI.randomInputFor('graph-components', d, Math.random);
      assert.ok(r && Number.isInteger(r.n) && Array.isArray(r.edges), `graph-components/${d} shape`);
      assert.ok(r.n >= 2 && r.n <= 10, `graph-components/${d} node count in the viz's 1..10 range`);
      r.edges.forEach((e) => {
        assert.ok(Number.isInteger(e.u) && Number.isInteger(e.v) && e.u !== e.v, `graph-components/${d} edge endpoints valid`);
        assert.ok(e.u >= 0 && e.u < r.n && e.v >= 0 && e.v < r.n, `graph-components/${d} endpoints within n`);
      });
      const count = countComponentsUndirected(r.n, r.edges);
      if (d !== 'edge') assert.ok(count > 1, `graph-components/${d} draw #${i} has ${count} component(s), expected >1`);
      else assert.ok(count >= 1, `graph-components/edge has >=1 component`);
      // Round-trips through the viz's own parser unchanged.
      const roundTrip = GCV.parseInput(String(r.n), r.edges.map((e) => e.u + '-' + e.v).join(','));
      assert.strictEqual(roundTrip.n, r.n, `graph-components/${d} round-trips n`);
      assert.strictEqual(roundTrip.edges.length, r.edges.length, `graph-components/${d} round-trips edge count`);
    }
  }
  const n = RI.randomInputFor('graph-components', 'normal', Math.random).n;
  const big = RI.randomInputFor('graph-components', 'large', Math.random).n;
  assert.ok(big > n, `graph-components: large (${big}) > normal (${n}) nodes`);
});

test('randomInputFor graph-bipartite: connected undirected graph, mixed bipartite/non-bipartite verdicts at every difficulty, larger at large', () => {
  for (const d of DIFFS) {
    const seen = { bipartite: false, notBipartite: false };
    for (let i = 0; i < 60; i++) {
      const r = RI.randomInputFor('graph-bipartite', d, Math.random);
      assert.ok(r && Number.isInteger(r.n) && Array.isArray(r.edges), `graph-bipartite/${d} shape`);
      assert.ok(r.n >= 2 && r.n <= 10, `graph-bipartite/${d} node count in the viz's 1..10 range`);
      r.edges.forEach((e) => {
        assert.ok(Number.isInteger(e.u) && Number.isInteger(e.v) && e.u !== e.v, `graph-bipartite/${d} edge endpoints valid`);
        assert.ok(e.u >= 0 && e.u < r.n && e.v >= 0 && e.v < r.n, `graph-bipartite/${d} endpoints within n`);
      });
      assert.ok(isConnectedUndirected(r.n, r.edges), `graph-bipartite/${d} graph is connected`);
      if (isBipartiteUndirected(r.n, r.edges)) seen.bipartite = true; else seen.notBipartite = true;
      // Round-trips through the viz's own parser unchanged.
      const roundTrip = GBV.parseInput(String(r.n), r.edges.map((e) => e.u + '-' + e.v).join(','));
      assert.strictEqual(roundTrip.n, r.n, `graph-bipartite/${d} round-trips n`);
      assert.strictEqual(roundTrip.edges.length, r.edges.length, `graph-bipartite/${d} round-trips edge count`);
    }
    assert.ok(seen.bipartite, `graph-bipartite/${d}: at least one of 60 draws should be bipartite`);
    assert.ok(seen.notBipartite, `graph-bipartite/${d}: at least one of 60 draws should be NOT bipartite`);
  }
  const n = RI.randomInputFor('graph-bipartite', 'normal', Math.random).n;
  const big = RI.randomInputFor('graph-bipartite', 'large', Math.random).n;
  assert.ok(big > n, `graph-bipartite: large (${big}) > normal (${n}) nodes`);
});

for (const [id, Viz] of [['graph-closure', GCLV], ['graph-scc', GSCV]]) {
  test(`randomInputFor ${id}: directed numeric graph with a guaranteed cycle, larger at large`, () => {
    for (const d of DIFFS) {
      for (let i = 0; i < 30; i++) {
        const r = RI.randomInputFor(id, d, Math.random);
        assert.ok(r && Number.isInteger(r.n) && Array.isArray(r.edges), `${id}/${d} shape`);
        assert.ok(r.n >= 2 && r.n <= 10, `${id}/${d} node count in the viz's 1..10 range`);
        r.edges.forEach((e) => {
          assert.ok(Number.isInteger(e.u) && Number.isInteger(e.v) && e.u !== e.v, `${id}/${d} edge endpoints valid`);
          assert.ok(e.u >= 0 && e.u < r.n && e.v >= 0 && e.v < r.n, `${id}/${d} endpoints within n`);
        });
        assert.ok(hasDirectedCycle(r.n, r.edges), `${id}/${d} graph contains at least one cycle`);
        // Round-trips through the viz's own parser unchanged.
        const roundTrip = Viz.parseInput(String(r.n), r.edges.map((e) => e.u + '-' + e.v).join(','));
        assert.strictEqual(roundTrip.n, r.n, `${id}/${d} round-trips n`);
        assert.strictEqual(roundTrip.edges.length, r.edges.length, `${id}/${d} round-trips edge count`);
      }
    }
    const n = RI.randomInputFor(id, 'normal', Math.random).n;
    const big = RI.randomInputFor(id, 'large', Math.random).n;
    assert.ok(big > n, `${id}: large (${big}) > normal (${n}) nodes`);
  });
}

test('randomInputFor graph-maxflow: directed weighted network with capacities >=1 and a clear source/sink, larger at challenge tiers', () => {
  for (const d of DIFFS) {
    for (let i = 0; i < 30; i++) {
      const r = RI.randomInputFor('graph-maxflow', d, Math.random);
      assert.ok(r && Number.isInteger(r.n) && Array.isArray(r.edges), `graph-maxflow/${d} shape`);
      assert.ok(Number.isInteger(r.source) && Number.isInteger(r.sink) && r.source !== r.sink, `graph-maxflow/${d} distinct source/sink`);
      assert.ok(r.source >= 0 && r.source < r.n && r.sink >= 0 && r.sink < r.n, `graph-maxflow/${d} source/sink within n`);
      assert.ok(r.edges.length >= 1, `graph-maxflow/${d} has at least one edge`);
      r.edges.forEach((e) => {
        assert.ok(Number.isInteger(e.u) && Number.isInteger(e.v) && e.u !== e.v, `graph-maxflow/${d} edge endpoints valid`);
        assert.ok(e.u >= 0 && e.u < r.n && e.v >= 0 && e.v < r.n, `graph-maxflow/${d} endpoints within n`);
        assert.ok(Number.isInteger(e.capacity) && e.capacity >= 1, `graph-maxflow/${d} capacity >=1`);
      });
      assert.ok(r.edges.some((e) => e.u === r.source), `graph-maxflow/${d} source has an outgoing edge`);
      assert.ok(r.edges.some((e) => e.v === r.sink), `graph-maxflow/${d} sink has an incoming edge`);
      // Round-trips through the viz's own parser unchanged.
      const edgesText = r.edges.map((e) => e.u + '-' + e.v + ':' + e.capacity).join(',');
      const parsed = GMFV.parseInput(String(r.n), edgesText, String(r.source), String(r.sink));
      assert.strictEqual(parsed.errors.length, 0, `graph-maxflow/${d} round-trip has no errors: ${JSON.stringify(parsed.errors)}`);
      assert.strictEqual(parsed.n, r.n, `graph-maxflow/${d} round-trips n`);
      assert.strictEqual(parsed.edges.length, r.edges.length, `graph-maxflow/${d} round-trips edge count`);
    }
  }
  const n = RI.randomInputFor('graph-maxflow', 'normal', Math.random).n;
  const big = RI.randomInputFor('graph-maxflow', 'large', Math.random).n;
  assert.ok(big > n, `graph-maxflow: large (${big}) > normal (${n}) nodes`);
});

for (const [id, cap] of [['hash-chain', 9], ['hash-open', 5], ['hash-bucket', 8]]) {
  test(`randomInputFor ${id}: unique key set within the table's fixed capacity, larger at large`, () => {
    for (const d of DIFFS) {
      for (let i = 0; i < 30; i++) {
        const r = RI.randomInputFor(id, d, Math.random);
        assert.ok(r && Array.isArray(r.vals) && r.vals.length >= 1, `${id}/${d} shape`);
        assert.ok(r.vals.every(Number.isFinite), `${id}/${d} numbers`);
        assert.strictEqual(new Set(r.vals).size, r.vals.length, `${id}/${d} unique keys`);
        assert.ok(r.vals.length <= cap, `${id}/${d} stays within the table's capacity (${cap})`);
        if (d === 'edge') assert.strictEqual(r.vals.length, 1);
        if (d === 'large') assert.strictEqual(r.vals.length, cap, `${id}/large fills the table exactly`);
      }
    }
    const n = RI.randomInputFor(id, 'normal', Math.random).vals.length;
    const big = RI.randomInputFor(id, 'large', Math.random).vals.length;
    assert.ok(big > n, `${id}: large (${big}) > normal (${n})`);
  });
}

test('randomInputFor bloom-filter: item set + query word, stays well under the 32-bit table', () => {
  for (const d of DIFFS) {
    for (let i = 0; i < 20; i++) {
      const r = RI.randomInputFor('bloom-filter', d, Math.random);
      assert.ok(r && Array.isArray(r.items) && r.items.length >= 1, `bloom-filter/${d} shape`);
      assert.ok(r.items.every((w) => typeof w === 'string' && /^[a-z]+$/.test(w)), `bloom-filter/${d} lowercase words`);
      assert.strictEqual(new Set(r.items).size, r.items.length, `bloom-filter/${d} unique items`);
      assert.ok(r.items.length <= 8, `bloom-filter/${d} stays well under the 32-bit table`);
      assert.ok(typeof r.query === 'string' && r.query.length > 0, `bloom-filter/${d} has a query word`);
      if (d === 'edge') assert.strictEqual(r.items.length, 1);
    }
  }
  const n = RI.randomInputFor('bloom-filter', 'normal', Math.random).items.length;
  const big = RI.randomInputFor('bloom-filter', 'large', Math.random).items.length;
  assert.ok(big > n, `bloom-filter: large (${big}) > normal (${n})`);
});

test('randomInputFor skip-list: unique key set, kept readable, larger at large', () => {
  for (const d of DIFFS) {
    for (let i = 0; i < 20; i++) {
      const r = RI.randomInputFor('skip-list', d, Math.random);
      assert.ok(r && Array.isArray(r.vals) && r.vals.length >= 1, `skip-list/${d} shape`);
      assert.ok(r.vals.every(Number.isFinite), `skip-list/${d} numbers`);
      assert.strictEqual(new Set(r.vals).size, r.vals.length, `skip-list/${d} unique keys`);
      assert.ok(r.vals.length <= 10, `skip-list/${d} stays readable (<=10 nodes)`);
      if (d === 'edge') assert.strictEqual(r.vals.length, 1);
    }
  }
  const n = RI.randomInputFor('skip-list', 'normal', Math.random).vals.length;
  const big = RI.randomInputFor('skip-list', 'large', Math.random).vals.length;
  assert.ok(big > n, `skip-list: large (${big}) > normal (${n})`);
});

test('randomInputFor count-min-sketch: word-op sequence, heavy repeats at special, larger at large', () => {
  for (const d of DIFFS) {
    for (let i = 0; i < 20; i++) {
      const r = RI.randomInputFor('count-min-sketch', d, Math.random);
      assert.ok(r && Array.isArray(r.words) && r.words.length >= 1, `count-min-sketch/${d} shape`);
      assert.ok(r.words.every((w) => typeof w === 'string' && /^[a-z]+$/.test(w)), `count-min-sketch/${d} lowercase words`);
      if (d === 'edge') assert.strictEqual(r.words.length, 1);
      if (d === 'special') assert.ok(new Set(r.words).size <= 2, `count-min-sketch/special stays within 2 distinct words`);
    }
  }
  const n = RI.randomInputFor('count-min-sketch', 'normal', Math.random).words.length;
  const big = RI.randomInputFor('count-min-sketch', 'large', Math.random).words.length;
  assert.ok(big > n, `count-min-sketch: large (${big}) > normal (${n})`);
});

test('deque: value sequence per difficulty', () => {
  for (const d of DIFFS) {
    const r = RI.randomInputFor('deque', d, Math.random);
    assert.ok(r && Array.isArray(r.vals) && r.vals.length >= 1, `deque/${d} shape`);
    assert.ok(r.vals.every(Number.isFinite), `deque/${d} numbers`);
  }
  const n = RI.randomInputFor('deque', 'normal', Math.random).vals.length;
  const big = RI.randomInputFor('deque', 'large', Math.random).vals.length;
  assert.ok(big > n, `deque: large (${big}) > normal (${n})`);
});

test('sort-polyphase: data array per difficulty, valid input to polyphaseFrames', () => {
  for (const d of DIFFS) {
    for (let i = 0; i < 15; i++) {
      const r = RI.randomInputFor('sort-polyphase', d, Math.random);
      assert.ok(r && Array.isArray(r.data) && r.data.length >= 1, `sort-polyphase/${d} shape`);
      assert.ok(r.data.every(Number.isFinite), `sort-polyphase/${d} numbers`);
      assert.doesNotThrow(() => SPV.polyphaseFrames(r.data), `sort-polyphase/${d} runs without throwing`);
    }
  }
  const n = RI.randomInputFor('sort-polyphase', 'normal', Math.random).data.length;
  const big = RI.randomInputFor('sort-polyphase', 'large', Math.random).data.length;
  assert.ok(big > n, `sort-polyphase: large (${big}) > normal (${n})`);
});

test('file-isam: sorted unique keys + search key, valid input to buildIsam/searchFrames', () => {
  for (const d of DIFFS) {
    for (let i = 0; i < 15; i++) {
      const r = RI.randomInputFor('file-isam', d, Math.random);
      assert.ok(r && Array.isArray(r.keys) && r.keys.length >= 1, `file-isam/${d} shape`);
      assert.ok(isSortedAsc(r.keys), `file-isam/${d} sorted keys`);
      assert.strictEqual(new Set(r.keys).size, r.keys.length, `file-isam/${d} unique keys`);
      assert.strictEqual(r.blockSize, 3, `file-isam/${d} default blockSize`);
      assert.ok(Number.isFinite(r.key), `file-isam/${d} search key is a number`);
      if (d === 'edge') assert.strictEqual(r.keys.length, 1);
      if (d === 'large') assert.ok(r.keys.length >= 15);
      const isam = FIV.buildIsam(r.keys, r.blockSize);
      assert.doesNotThrow(() => FIV.searchFrames(isam, r.key), `file-isam/${d} search runs without throwing`);
    }
  }
  const n = RI.randomInputFor('file-isam', 'normal', Math.random).keys.length;
  const big = RI.randomInputFor('file-isam', 'large', Math.random).keys.length;
  assert.ok(big > n, `file-isam: large (${big}) > normal (${n})`);
});

test('file-inverted: small document set + query term drawn from the shared vocabulary', () => {
  for (const d of DIFFS) {
    for (let i = 0; i < 15; i++) {
      const r = RI.randomInputFor('file-inverted', d, Math.random);
      assert.ok(r && Array.isArray(r.docs) && r.docs.length >= 1, `file-inverted/${d} shape`);
      assert.ok(r.docs.every((doc) => typeof doc === 'string' && doc.length > 0), `file-inverted/${d} non-empty docs`);
      assert.ok(typeof r.query === 'string' && r.query.length > 0, `file-inverted/${d} query`);
      assert.ok(r.docs.length <= 6, `file-inverted/${d} stays readable (<=6 docs)`);
      if (d === 'edge') assert.strictEqual(r.docs.length, 1);
      const { index } = FInV.buildFrames(r.docs);
      assert.ok(Object.prototype.hasOwnProperty.call(index, r.query), `file-inverted/${d} query term is actually in the built index`);
    }
  }
  const n = RI.randomInputFor('file-inverted', 'normal', Math.random).docs.length;
  const big = RI.randomInputFor('file-inverted', 'large', Math.random).docs.length;
  assert.ok(big > n, `file-inverted: large (${big}) > normal (${n})`);
});

test('gc-memory: a scenario for every mode, each valid input to its GcMemoryViz function', () => {
  for (const d of DIFFS) {
    for (let i = 0; i < 15; i++) {
      const r = RI.randomInputFor('gc-memory', d, Math.random);
      assert.ok(r && r.markSweep && Array.isArray(r.markSweep.objects) && Array.isArray(r.markSweep.roots), `gc-memory/${d} markSweep shape`);
      assert.ok(Array.isArray(r.refcountOps) && r.refcountOps.length >= 1, `gc-memory/${d} refcountOps shape`);
      assert.ok(r.buddy && Number.isFinite(r.buddy.total) && Array.isArray(r.buddy.ops), `gc-memory/${d} buddy shape`);
      assert.ok(r.pointerReversal && Array.isArray(r.pointerReversal.nodes) && r.pointerReversal.root, `gc-memory/${d} pointerReversal shape`);
      assert.ok(r.compact && Number.isFinite(r.compact.total) && Array.isArray(r.compact.blocks), `gc-memory/${d} compact shape`);

      assert.doesNotThrow(() => GCMV.markSweepFrames(r.markSweep), `gc-memory/${d} markSweepFrames runs without throwing`);
      assert.doesNotThrow(() => GCMV.refCountFrames(r.refcountOps), `gc-memory/${d} refCountFrames runs without throwing`);
      assert.doesNotThrow(() => GCMV.buddyFrames(r.buddy.total, r.buddy.ops), `gc-memory/${d} buddyFrames runs without throwing`);
      assert.doesNotThrow(() => GCMV.compactFrames(r.compact), `gc-memory/${d} compactFrames runs without throwing`);

      // The pointer-reversal Schorr-Waite mark loop (js/gc_memory_viz.js) has NO iteration
      // guard of its own -- termination relies entirely on the generator only ever emitting a
      // simple unbranching dlink->rlink-chain (see js/random_input.js's gcPointerReversalScenario
      // comment). This assertion is the actual regression guard for that safety property: a
      // malformed scenario would hang this test (and the real browser) instead of throwing.
      const prResult = GCMV.pointerReversalFrames(r.pointerReversal);
      assert.ok(prResult.frames.length >= 1, `gc-memory/${d} pointerReversalFrames terminates with >=1 frame`);

      // Every unreachable-garbage-cycle object (present whenever markSweep has >=4 objects)
      // must end up freed, and every root-reachable object must not.
      const msFrames = GCMV.markSweepFrames(r.markSweep).frames;
      const last = msFrames[msFrames.length - 1];
      const n = r.markSweep.objects.length;
      if (n >= 4) {
        const heapById = {}; last.heap.forEach((o) => { heapById[o.id] = o; });
        assert.ok(heapById[n - 1].free && heapById[n - 2].free, `gc-memory/${d} the tail garbage cycle got collected`);
      }
    }
  }
  const msCount = (r) => r.markSweep.objects.length;
  const n = msCount(RI.randomInputFor('gc-memory', 'normal', Math.random));
  const big = msCount(RI.randomInputFor('gc-memory', 'large', Math.random));
  assert.ok(big > n, `gc-memory: large (${big}) > normal (${n}) markSweep objects`);
});

test('recursion: an input set per RecursionViz example, all within the viz\'s own safety caps', () => {
  for (const d of DIFFS) {
    for (let i = 0; i < 15; i++) {
      const r = RI.randomInputFor('recursion', d, Math.random);
      assert.ok(r && r.fibonacci && r.reverse && r.permutations && r['binary-search'] && r.quicksort, `recursion/${d} covers every example`);

      // Fibonacci n<=7 -- the recursion-depth/call-count safety cap (js/viz/viz_recursion.js's
      // own .rec-n input has max="7"); recursionTrace has no guard of its own.
      assert.ok(Number.isInteger(r.fibonacci.n) && r.fibonacci.n >= 0 && r.fibonacci.n <= 7, `recursion/${d} fibonacci n in [0,7]`);
      assert.ok(typeof r.reverse.text === 'string' && r.reverse.text.length >= 1 && r.reverse.text.length <= 6, `recursion/${d} reverse text length in [1,6]`);
      assert.ok(typeof r.permutations.text === 'string' && r.permutations.text.length >= 1 && r.permutations.text.length <= 4, `recursion/${d} permutations text length in [1,4]`);
      assert.ok(Array.isArray(r['binary-search'].arr) && r['binary-search'].arr.length >= 1 && r['binary-search'].arr.length <= 15, `recursion/${d} binary-search arr length in [1,15]`);
      assert.ok(Array.isArray(r.quicksort.arr) && r.quicksort.arr.length >= 1 && r.quicksort.arr.length <= 10, `recursion/${d} quicksort arr length in [1,10]`);

      for (const ex of RV.EXAMPLES) {
        assert.doesNotThrow(() => RV.recursionTrace(ex, r[ex]), `recursion/${d} ${ex} runs without throwing`);
      }
    }
  }
  assert.strictEqual(RI.randomInputFor('recursion', 'large', Math.random).fibonacci.n, 7, 'recursion/large hits the fibonacci n=7 cap exactly');
  const n = RI.randomInputFor('recursion', 'normal', Math.random).fibonacci.n;
  const big = RI.randomInputFor('recursion', 'large', Math.random).fibonacci.n;
  assert.ok(big >= n, `recursion: large fibonacci n (${big}) >= normal (${n})`);
});

// magic-square / magic-latin / magic-torus / magic-formula / magic-symmetry (js/viz/viz_magic*.js):
// all five are the odd-order Siamese/Coxeter construction, which is only a genuine magic square
// for an ODD n, and each viz's own <select class="*-order"> dropdown enumerates exactly the odd
// orders it supports (no free-form n input exists) — magic-square/torus/formula/symmetry offer
// [3,5,7]; magic-latin additionally offers 9. The guard this batch cares about: a random draw must
// always land on one of THOSE exact dropdown values (never an even n, never outside the option
// list), which is asserted both structurally (parity + set membership) and functionally (the
// order MagicLatinViz.buildFrames actually constructs for that n really does sum to the magic
// constant on every row/col/diagonal — the strongest possible check that n was constructible).
const MAGIC_ALLOWED = {
  'magic-square': [3, 5, 7],
  'magic-torus': [3, 5, 7],
  'magic-formula': [3, 5, 7],
  'magic-symmetry': [3, 5, 7],
  'magic-latin': [3, 5, 7, 9],
};

function isGenuineMagicSquare(square, magicSum) {
  const n = square.length;
  for (let r = 0; r < n; r++) if (square[r].reduce((a, b) => a + b, 0) !== magicSum) return false;
  for (let c = 0; c < n; c++) {
    let s = 0; for (let r = 0; r < n; r++) s += square[r][c];
    if (s !== magicSum) return false;
  }
  let diag = 0, anti = 0;
  for (let i = 0; i < n; i++) { diag += square[i][i]; anti += square[i][n - 1 - i]; }
  return diag === magicSum && anti === magicSum;
}

for (const [id, allowed] of Object.entries(MAGIC_ALLOWED)) {
  test(`randomInputFor ${id}: n is always one of the viz's own odd dropdown options and actually constructs`, () => {
    for (const d of DIFFS) {
      for (let i = 0; i < 30; i++) {
        const r = RI.randomInputFor(id, d, Math.random);
        assert.ok(r && Number.isInteger(r.n), `${id}/${d} shape`);
        assert.ok(allowed.includes(r.n), `${id}/${d} n=${r.n} must be one of [${allowed}] (the viz's own dropdown options)`);
        assert.strictEqual(r.n % 2, 1, `${id}/${d} n=${r.n} must be odd (Siamese/Coxeter method is odd-order only)`);

        // Functional check: the odd-order Siamese construction every one of these five viz's
        // shares (see MagicLatinViz.buildFrames/siamese) really is magic at this exact n.
        const built = MLV.buildFrames(r.n);
        assert.ok(isGenuineMagicSquare(built.square, built.magicSum), `${id}/${d} n=${r.n} constructs a genuinely magic square`);
      }
    }
    assert.strictEqual(RI.randomInputFor(id, 'edge', Math.random).n, allowed[0], `${id}: edge picks the smallest offered order`);
    assert.strictEqual(RI.randomInputFor(id, 'large', Math.random).n, allowed[allowed.length - 1], `${id}: large picks the largest offered order`);
    const n = RI.randomInputFor(id, 'normal', Math.random).n;
    const big = RI.randomInputFor(id, 'large', Math.random).n;
    assert.ok(big >= n, `${id}: large (${big}) >= normal (${n})`);
  });
}
