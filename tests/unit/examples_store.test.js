const test = require('node:test');
const assert = require('node:assert');
const S = require('../../js/examples_store.js');
function fakeStorage() { const d = {}; return { data: d, getItem: (k) => (k in d ? d[k] : null), setItem: (k, v) => { d[k] = String(v); } }; }

test('key format', () => { assert.strictEqual(S.key('foo-bar'), 'dsvisual:examples:foo-bar'); });

test('save then load round-trips', () => {
  const st = fakeStorage();
  S.save(st, 'm', 'aaa', 'DEF');
  assert.deepStrictEqual(S.load(st, 'm'), [{ text: 'aaa' }]);
});

test('dedupe, newest first', () => {
  const st = fakeStorage();
  S.save(st, 'm', 'a', 'DEF'); S.save(st, 'm', 'b', 'DEF'); S.save(st, 'm', 'a', 'DEF');
  assert.deepStrictEqual(S.load(st, 'm').map((e) => e.text), ['a', 'b']);
});

test('cap at 8, newest first', () => {
  const st = fakeStorage();
  for (let i = 0; i < 12; i++) S.save(st, 'm', 't' + i, 'DEF');
  const arr = S.load(st, 'm');
  assert.strictEqual(arr.length, 8);
  assert.strictEqual(arr[0].text, 't11');
});

test('skip default and empty', () => {
  const st = fakeStorage();
  S.save(st, 'm', 'DEF', 'DEF'); S.save(st, 'm', '', 'DEF');
  assert.deepStrictEqual(S.load(st, 'm'), []);
});

test('load filters dirty data', () => {
  const st = fakeStorage();
  st.data[S.key('m')] = JSON.stringify([{ text: 'ok' }, { nope: 1 }, 42, null, { text: 5 }]);
  assert.deepStrictEqual(S.load(st, 'm'), [{ text: 'ok' }]);
});

test('load returns [] on bad json; storage errors never throw', () => {
  const st = fakeStorage(); st.data[S.key('m')] = '{not json';
  assert.deepStrictEqual(S.load(st, 'm'), []);
  const bad = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); } };
  assert.deepStrictEqual(S.load(bad, 'm'), []);
  assert.doesNotThrow(() => S.save(bad, 'm', 'a', 'DEF'));
});

test('per-method isolation', () => {
  const st = fakeStorage();
  S.save(st, 'm1', 'a', 'DEF'); S.save(st, 'm2', 'b', 'DEF');
  assert.deepStrictEqual(S.load(st, 'm1').map((e) => e.text), ['a']);
  assert.deepStrictEqual(S.load(st, 'm2').map((e) => e.text), ['b']);
});
