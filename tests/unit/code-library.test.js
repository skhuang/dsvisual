const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { resolveCode, resolveCodeSafe } = require('../../pipeline/code-library.js');

function tmpLib() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lib-'));
  fs.writeFileSync(path.join(dir, 'stack_array.cpp'), [
    '#include <iostream>',
    '// >>> push',
    'bool push(int v){ return true; }',
    '// <<< push',
    'int main(){ return 0; }',
  ].join('\n'));
  return dir;
}

test('resolves a whole file', () => {
  const dir = tmpLib();
  const src = resolveCode('stack_array.cpp', dir);
  assert.ok(src.includes('#include <iostream>'));
  assert.ok(src.includes('int main()'));
});

test('resolves a marked section, excluding the marker lines', () => {
  const dir = tmpLib();
  const src = resolveCode('stack_array.cpp#push', dir);
  assert.equal(src.trim(), 'bool push(int v){ return true; }');
  assert.ok(!src.includes('>>>'));
});

test('throws on missing file', () => {
  const dir = tmpLib();
  assert.throws(() => resolveCode('nope.cpp', dir), /not found/i);
});

test('throws on missing section', () => {
  const dir = tmpLib();
  assert.throws(() => resolveCode('stack_array.cpp#ghost', dir), /section/i);
});

test('resolveCodeSafe reports without throwing', () => {
  const dir = tmpLib();
  assert.deepEqual(resolveCodeSafe('stack_array.cpp', dir), { ok: true, error: null });
  assert.equal(resolveCodeSafe('nope.cpp', dir).ok, false);
});
