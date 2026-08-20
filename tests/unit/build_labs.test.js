// tests/unit/build_labs.test.js
const test = require('node:test');
const assert = require('node:assert');
const { mdToHtml, buildLabs } = require('../../build_labs.js');

test('mdToHtml renders headings, paragraphs, and fenced code, escaping HTML', () => {
  const html = mdToHtml('# Title\n\nHello <x> world\n\n```\n1 2 3\n```\n');
  assert.match(html, /<h1>Title<\/h1>/);
  assert.match(html, /Hello &lt;x&gt; world/);
  assert.match(html, /<pre><code>1 2 3\n<\/code><\/pre>/);
});

test('mdToHtml renders bold and italic emphasis', () => {
  const html = mdToHtml('**bold** and *em*');
  assert.match(html, /<strong>bold<\/strong>/);
  assert.match(html, /<em>em<\/em>/);
});

test('buildLabs maps graph-dijkstra with public fields and no hidden data', () => {
  const R = buildLabs();
  assert.ok(R['graph-dijkstra'], 'graph-dijkstra present');
  const lab = R['graph-dijkstra'][0];
  assert.strictEqual(lab.slug, 'dijkstra');
  // Published to the public bank in the 2026-08-19 go-live (was null before).
  assert.strictEqual(lab.dsjudgeUrl, 'https://ds2026summer.cs.nycu.edu.tw/bank/dijkstra');
  assert.match(lab.repoUrl, /ds2026-lab-dijkstra/);
  assert.ok(lab.statementHtml.zh && lab.statementHtml.en, 'both langs present (en falls back to zh)');
  assert.ok(Array.isArray(lab.samples) && lab.samples[0].in && lab.samples[0].out, 'samples present');
  assert.ok(lab.titleZh && lab.titleEn, 'titles present');
});
