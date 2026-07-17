const test = require('node:test');
const assert = require('node:assert/strict');
const { VizRegistry } = require('../../js/core/registry');

test('attach then behavior returns the descriptor; last attach wins', () => {
  VizRegistry.attach('x', { render: () => 1, code: () => 'a', layout: { host: 'dynamic' } });
  assert.equal(VizRegistry.has('x'), true);
  assert.equal(VizRegistry.behavior('x').render(), 1);
  assert.equal(VizRegistry.behavior('x').code(), 'a');
  VizRegistry.attach('x', { render: () => 2 });
  assert.equal(VizRegistry.behavior('x').render(), 2);
  assert.equal(VizRegistry.behavior('x').code(), 'a'); // partial attach merges
});

test('behavior/has are null/false for unknown ids', () => {
  assert.equal(VizRegistry.behavior('nope'), null);
  assert.equal(VizRegistry.has('nope'), false);
});
