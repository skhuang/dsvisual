const test = require('node:test');
const assert = require('node:assert');
const RI = require('../../js/random_input.js');
const TGB = require('../../js/tree_general_binary_viz.js');
const CE = require('../../js/tree_copy_equal_viz.js');
const GW = require('../../js/viz/viz_graph_workbench.js');
const GMV = require('../../js/graph_matrix_viz.js');

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
