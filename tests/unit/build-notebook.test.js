// tests/unit/build-notebook.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const { buildNotebook } = require('../../pipeline/build-notebook.js');

test('runnable cpp cell becomes a code cell with xcpp17 kernel', () => {
  const nb = buildNotebook([
    { kind: 'code', source: 'int x=1;', lang: 'cpp', runnable: true, codeRef: null },
  ]);
  assert.equal(nb.metadata.kernelspec.name, 'xcpp17');
  assert.equal(nb.nbformat, 4);
  assert.equal(nb.cells[0].cell_type, 'code');
  assert.equal(nb.cells[0].execution_count, null);
  assert.deepEqual(nb.cells[0].outputs, []);
});

test('sparks (non-runnable) code becomes a fenced markdown cell', () => {
  const nb = buildNotebook([
    { kind: 'code', source: 'procedure ADD', lang: 'sparks', runnable: false, codeRef: null },
  ]);
  assert.equal(nb.cells[0].cell_type, 'markdown');
  assert.ok(nb.cells[0].source.join('').includes('```sparks'));
});

test('prose markdown passes through', () => {
  const nb = buildNotebook([
    { kind: 'markdown', source: 'Hello', lang: null, runnable: false, codeRef: null },
  ]);
  assert.equal(nb.cells[0].cell_type, 'markdown');
  assert.equal(nb.cells[0].source.join(''), 'Hello');
});

test('runnable cell with codeRef pulls from the library', () => {
  const fs = require('node:fs'); const os = require('node:os'); const path = require('node:path');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lib-'));
  fs.writeFileSync(path.join(dir, 'snippet.cpp'), 'int fromLib(){return 7;}');
  const nb = buildNotebook(
    [{ kind: 'code', source: 'PLACEHOLDER', lang: 'cpp', runnable: true, codeRef: 'snippet.cpp' }],
    { libDir: dir }
  );
  assert.ok(nb.cells[0].source.join('').includes('fromLib'));
  assert.ok(!nb.cells[0].source.join('').includes('PLACEHOLDER'));
});
