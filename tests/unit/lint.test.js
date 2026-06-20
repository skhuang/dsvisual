// tests/unit/lint.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { lintBindings } = require('../../pipeline/lint.js');

function tmpLib() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lib-'));
  fs.writeFileSync(path.join(dir, 'stack_array.cpp'), 'int main(){return 0;}');
  return dir;
}

test('passes when all bindings resolve', () => {
  const dir = tmpLib();
  const out = lintBindings({
    bindings: [
      { type: 'code', value: 'stack_array.cpp', title: null, line: 1 },
      { type: 'viz', value: 'stack-array', title: null, line: 2 },
      { type: 'oj', value: 'lab01-stack', title: null, line: 3 },
    ],
    libDir: dir,
    vizIds: new Set(['stack-array']),
    ojIds: new Set(['lab01-stack']),
  });
  assert.deepEqual(out.errors, []);
  assert.deepEqual(out.warnings, []);
});

test('errors on missing code file and unknown viz id', () => {
  const dir = tmpLib();
  const out = lintBindings({
    bindings: [
      { type: 'code', value: 'ghost.cpp', title: null, line: 1 },
      { type: 'viz', value: 'nope', title: null, line: 2 },
    ],
    libDir: dir,
    vizIds: new Set(['stack-array']),
    ojIds: new Set(),
  });
  assert.equal(out.errors.length, 2);
});

test('warns (not errors) on unknown oj id', () => {
  const dir = tmpLib();
  const out = lintBindings({
    bindings: [{ type: 'oj', value: 'lab99-future', title: null, line: 1 }],
    libDir: dir,
    vizIds: new Set(),
    ojIds: new Set(),
  });
  assert.deepEqual(out.errors, []);
  assert.equal(out.warnings.length, 1);
});
