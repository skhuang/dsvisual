// tests/unit/viz-link.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const { expandVizLinks } = require('../../pipeline/viz-link.js');

test('viz directive becomes a blockquote link with default base URL', () => {
  const out = expandVizLinks('<!-- viz: deque -->');
  assert.equal(out, '> ▶ [互動視覺化:deque](https://skhuang.github.io/dsvisual/#m=deque)');
});

test('optional quoted label is used as the link text', () => {
  const out = expandVizLinks('<!-- viz: stack-array "Stack (Array)" -->');
  assert.equal(out, '> ▶ [互動視覺化:Stack (Array)](https://skhuang.github.io/dsvisual/#m=stack-array)');
});

test('baseUrl option overrides the default', () => {
  const out = expandVizLinks('<!-- viz: queue -->', { baseUrl: 'http://localhost:8080/' });
  assert.equal(out, '> ▶ [互動視覺化:queue](http://localhost:8080/#m=queue)');
});

test('non-viz lines are untouched, viz lines among them are expanded', () => {
  const md = ['# Heading', '<!-- code: queue.cpp -->', '<!-- viz: queue -->', 'prose'].join('\n');
  const out = expandVizLinks(md).split('\n');
  assert.equal(out[0], '# Heading');
  assert.equal(out[1], '<!-- code: queue.cpp -->');   // code directive untouched
  assert.equal(out[2], '> ▶ [互動視覺化:queue](https://skhuang.github.io/dsvisual/#m=queue)');
  assert.equal(out[3], 'prose');
});

test('an inline (non-standalone) viz comment is left untouched', () => {
  const line = 'see this <!-- viz: deque --> inline';
  assert.equal(expandVizLinks(line), line);
});
