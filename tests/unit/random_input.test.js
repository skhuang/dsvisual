const test = require('node:test');
const assert = require('node:assert');
const RI = require('../../js/random_input.js');

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

test('sort-external data + M', () => {
  const out = RI.randomInputFor('sort-external', 'normal');
  assert.ok(Array.isArray(out.data) && out.data.length >= 1);
  assert.strictEqual(out.M, 4);
});
