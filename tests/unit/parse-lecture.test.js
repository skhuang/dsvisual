// tests/unit/parse-lecture.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const { parseLecture } = require('../../pipeline/parse-lecture.js');

test('splits prose and fenced code into ordered cells', () => {
  const md = [
    'Intro paragraph.',
    '',
    '```cpp',
    'int x = 1;',
    '```',
    '',
    'After paragraph.',
  ].join('\n');
  const { cells } = parseLecture(md);
  assert.equal(cells.length, 3);
  assert.equal(cells[0].kind, 'markdown');
  assert.equal(cells[1].kind, 'code');
  assert.equal(cells[1].lang, 'cpp');
  assert.equal(cells[1].source, 'int x = 1;');
  assert.equal(cells[2].kind, 'markdown');
});

test('runnable + code directives attach to the following code cell', () => {
  const md = [
    '<!-- code: stack_array.cpp#push -->',
    '<!-- runnable -->',
    '```cpp',
    's.push(10);',
    '```',
  ].join('\n');
  const { cells, bindings } = parseLecture(md);
  const code = cells.find((c) => c.kind === 'code');
  assert.equal(code.runnable, true);
  assert.equal(code.codeRef, 'stack_array.cpp#push');
  assert.ok(bindings.some((b) => b.type === 'code' && b.value === 'stack_array.cpp#push'));
  assert.ok(bindings.some((b) => b.type === 'runnable'));
});

test('viz and oj directives become bindings with optional title', () => {
  const md = [
    '<!-- viz: stack-array -->',
    '<!-- oj: lab01-stack "Stack 實作" -->',
    'Some prose.',
  ].join('\n');
  const { bindings } = parseLecture(md);
  const viz = bindings.find((b) => b.type === 'viz');
  const oj = bindings.find((b) => b.type === 'oj');
  assert.equal(viz.value, 'stack-array');
  assert.equal(oj.value, 'lab01-stack');
  assert.equal(oj.title, 'Stack 實作');
});

test('sparks fence keeps its language tag', () => {
  const md = ['```sparks', 'procedure ADD', '```'].join('\n');
  const { cells } = parseLecture(md);
  assert.equal(cells[0].kind, 'code');
  assert.equal(cells[0].lang, 'sparks');
});

test('directive separated from fence by prose does not attach', () => {
  const md = [
    '<!-- code: x.cpp -->',
    'This prose breaks adjacency.',
    '```cpp',
    'int y = 2;',
    '```',
  ].join('\n');
  const { cells, bindings } = parseLecture(md);
  const code = cells.find((c) => c.kind === 'code');
  assert.equal(code.codeRef, null, 'directive should not attach after intervening prose');
  assert.ok(bindings.some((b) => b.type === 'code' && b.value === 'x.cpp'), 'binding still recorded');
});
