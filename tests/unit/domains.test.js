const test = require('node:test');
const assert = require('node:assert/strict');
const { VizCore } = require('../../js/core/domains');

test('registerDomain + domains() preserve registration order', () => {
  const a = { id: 'a' }, b = { id: 'b' };
  VizCore.registerDomain(a); VizCore.registerDomain(b);
  const ids = VizCore.domains().map((d) => d.id);
  assert.ok(ids.indexOf('a') !== -1 && ids.indexOf('b') !== -1);
  assert.ok(ids.indexOf('a') < ids.indexOf('b'));
});

test('bindMode wires getMode/setMode to the host accessors', () => {
  let mode = 'x';
  VizCore.bindMode(() => mode, (m) => { mode = m; });
  assert.equal(VizCore.getMode(), 'x');
  VizCore.setMode('y');
  assert.equal(mode, 'y');
  assert.equal(VizCore.getMode(), 'y');
});
