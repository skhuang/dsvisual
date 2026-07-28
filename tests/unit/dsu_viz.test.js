const test = require('node:test');
const assert = require('node:assert');
const D = require('../../js/dsu_viz.js');

test('parseOps: compact + long forms; n = maxIndex+1 clamped [2,12]; drops malformed/out-of-range', () => {
  const a = D.parseOps('U0 1; U2 3; F3');
  assert.strictEqual(a.n, 4);
  assert.deepStrictEqual(a.ops, [
    { kind: 'union', a: 0, b: 1 }, { kind: 'union', a: 2, b: 3 }, { kind: 'find', x: 3 },
  ]);
  // long forms + newlines + case-insensitive + extra whitespace
  const b = D.parseOps('union 0 1\nFIND 1');
  assert.deepStrictEqual(b.ops, [{ kind: 'union', a: 0, b: 1 }, { kind: 'find', x: 1 }]);
  // malformed dropped; no valid index → n floor 2
  assert.deepStrictEqual(D.parseOps('hello; U; F').ops, []);
  assert.strictEqual(D.parseOps('').n, 2);
  // clamp high + drop out-of-range ops
  const c = D.parseOps('U0 20; F15');
  assert.strictEqual(c.n, 12);
  assert.strictEqual(c.ops.length, 0);
});

test('SAMPLE parses to n=8 with 6 ops', () => {
  const s = D.parseOps(D.SAMPLE);
  assert.strictEqual(s.n, 8);
  assert.strictEqual(s.ops.length, 6);
});

test('buildFrames: init frame + one frame per op; bilingual msg', () => {
  const spec = D.parseOps(D.SAMPLE);
  const { frames } = D.buildFrames(spec);
  assert.strictEqual(frames.length, spec.ops.length + 1);
  assert.strictEqual(frames[0].kind, 'init');
  frames.forEach((f) => {
    assert.ok(f.msg && typeof f.msg.zh === 'string' && typeof f.msg.en === 'string', 'bilingual msg');
    assert.strictEqual(f.parent.length, spec.n);
    assert.strictEqual(f.rank.length, spec.n);
  });
});

test('buildFrames: final parent[] groups SAMPLE sets correctly', () => {
  const { frames } = D.buildFrames(D.parseOps(D.SAMPLE));
  const p = frames[frames.length - 1].parent;
  const root = (x) => { while (p[x] !== x) x = p[x]; return x; };
  // SAMPLE: {0,1,2,3} together, {4,5} together, {6,7} together
  assert.strictEqual(root(0), root(3));
  assert.strictEqual(root(1), root(2));
  assert.strictEqual(root(4), root(5));
  assert.strictEqual(root(6), root(7));
  assert.notStrictEqual(root(0), root(4));
  assert.notStrictEqual(root(0), root(6));
  assert.notStrictEqual(root(4), root(6));
});

test('buildFrames: find compresses a depth-2 node onto its root; union-by-rank keeps larger root', () => {
  // U0 1 -> rank[0]=1,parent[1]=0 ; U2 3 -> rank[2]=1,parent[3]=2 ;
  // U0 2 -> equal rank -> 2 under 0, rank[0]=2, parent[2]=0 (so 3 is depth 2: 3->2->0) ; F3 compresses 3->0
  const { frames } = D.buildFrames(D.parseOps('U0 1; U2 3; U0 2; F3'));
  const last = frames[frames.length - 1];
  assert.strictEqual(last.kind, 'find');
  assert.strictEqual(last.found, 0);
  assert.strictEqual(last.parent[3], 0, 'node 3 repointed straight to root 0');
  assert.strictEqual(last.parent[0], 0, 'root 0 unchanged');
  // union by rank: after U0 2 the root is 0 (the taller tree), not 2
  const afterU02 = frames[3]; // init,U0 1,U2 3,U0 2
  assert.strictEqual(afterU02.parent[2], 0);
});

test('buildFrames: frame snapshots are isolated (mutating one does not affect another)', () => {
  const { frames } = D.buildFrames(D.parseOps(D.SAMPLE));
  frames[frames.length - 1].parent[0] = 999;
  assert.notStrictEqual(frames[0].parent[0], 999);
});

test('randomInput: every difficulty yields a parseable op string with in-range indices', () => {
  for (const d of ['normal', 'special', 'edge', 'large']) {
    for (let i = 0; i < 8; i++) {
      const str = D.randomInput(d);
      assert.strictEqual(typeof str, 'string', d + ' returns string');
      const spec = D.parseOps(str);
      assert.ok(spec.ops.length >= 1, d + ' has >=1 op: ' + str);
      spec.ops.forEach((o) => {
        if (o.kind === 'union') { assert.ok(o.a < spec.n && o.b < spec.n, d + ' union in range'); }
        else { assert.ok(o.x < spec.n, d + ' find in range'); }
      });
      assert.doesNotThrow(() => D.buildFrames(spec), d + ' builds frames');
    }
  }
});
