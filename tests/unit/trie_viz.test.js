const test = require('node:test');
const assert = require('node:assert');
const T = require('../../js/trie_viz.js');

test('buildTrie shares a common prefix', () => {
  const { nodes } = T.buildTrie(['CAT', 'CAR']);
  assert.strictEqual(nodes.length, 5);                 // root + C + A + T + R
  const c = nodes[0].children['C'];
  const a = nodes[c].children['A'];
  assert.deepStrictEqual(Object.keys(nodes[a].children).sort(), ['R', 'T']);
  assert.strictEqual(nodes[nodes[a].children['T']].endOfWord, true);
  assert.strictEqual(nodes[nodes[a].children['R']].endOfWord, true);
  assert.strictEqual(nodes[a].endOfWord, false);       // 'CA' is not a word
});

test('build frames reveal monotonically and end with done + all nodes', () => {
  const words = ['CAT', 'CAR', 'CARD', 'DO', 'DOG'];
  const { frames } = T.buildFrames({ words, mode: 'build' });
  assert.strictEqual(frames[0].action, 'init');
  assert.strictEqual(frames[frames.length - 1].action, 'done');
  for (let i = 1; i < frames.length; i++) {
    assert.ok(frames[i].revealed.length >= frames[i - 1].revealed.length);  // monotone
  }
  const total = T.buildTrie(words).nodes.length;
  assert.strictEqual(frames[frames.length - 1].revealed.length, total);     // 9
  assert.strictEqual(frames[frames.length - 1].ends.length, 5);             // 5 word terminals
});

test('snapshot isolation: mutating a later frame does not touch an earlier one', () => {
  const { frames } = T.buildFrames({ words: ['CAT', 'CAR'], mode: 'build' });
  const firstLen = frames[0].revealed.length;
  frames[frames.length - 1].revealed.push(999);
  assert.strictEqual(frames[0].revealed.length, firstLen);
});

test('search verdicts: found / prefix-only / not-found', () => {
  const words = ['CAT', 'CAR', 'CARD', 'DO', 'DOG'];
  const found = T.buildFrames({ words, query: 'CAR', mode: 'search' }).frames;
  assert.strictEqual(found[found.length - 1].verdict, 'found');
  const prefix = T.buildFrames({ words, query: 'CA', mode: 'search' }).frames;
  assert.strictEqual(prefix[prefix.length - 1].verdict, 'prefix-only');
  const miss = T.buildFrames({ words, query: 'CARE', mode: 'search' }).frames;
  assert.strictEqual(miss[miss.length - 1].verdict, 'not-found');
  assert.strictEqual(miss[miss.length - 1].action, 'mismatch');
  const missX = T.buildFrames({ words, query: 'X', mode: 'search' }).frames;
  assert.strictEqual(missX[missX.length - 1].verdict, 'not-found');
});

test('every frame carries a bilingual message', () => {
  const all = []
    .concat(T.buildFrames({ words: ['CAT', 'CAR'], mode: 'build' }).frames)
    .concat(T.buildFrames({ words: ['CAT', 'CAR'], query: 'CAR', mode: 'search' }).frames);
  for (const f of all) { assert.ok(f.msg.zh && f.msg.en); }
});

test('parseWords/parseQuery normalize + clamp', () => {
  assert.deepStrictEqual(T.parseWords('cat, ca9r  Dog!'), ['CAT', 'CAR', 'DOG']);
  assert.strictEqual(T.parseWords('abcdefghij')[0].length, 8);   // length clamp
  assert.ok(T.parseWords(Array(30).fill('AB').join(',')).length <= 12);  // count clamp
  assert.strictEqual(T.parseQuery('  car dog '), 'CAR');         // first token
});

test('randomInput respects bounds and round-trips through parse', () => {
  for (const d of ['normal', 'special', 'edge', 'large']) {
    for (let i = 0; i < 5; i++) {
      const r = T.randomInput(d);
      assert.ok(Array.isArray(r.words) && r.words.length >= 1 && r.words.length <= 12, d + ' word count');
      for (const w of r.words) assert.ok(/^[A-Z]{1,8}$/.test(w), d + ' word "' + w + '"');
      assert.strictEqual(typeof r.query, 'string');
      assert.deepStrictEqual(T.parseWords(r.words.join(',')), r.words);   // clamps already applied
      assert.strictEqual(T.parseQuery(r.query), r.query);
    }
  }
});

test('special difficulty words share a common prefix', () => {
  const r = T.randomInput('special');
  const p = r.words[0].slice(0, 2);
  for (const w of r.words) assert.ok(w.startsWith(p), 'word "' + w + '" starts with "' + p + '"');
});
