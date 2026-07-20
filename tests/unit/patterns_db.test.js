const test = require('node:test');
const assert = require('node:assert');
const P = require('../../js/patterns_db.js');

test('registry exposes the 3 new patterns grouped by category', () => {
  assert.ok(P.getPattern('pattern-builder'));
  assert.strictEqual(P.getPattern('pattern-builder').category, 'patterns-creational');
  assert.strictEqual(P.getPattern('pattern-composite').category, 'patterns-structural');
  assert.strictEqual(P.getPattern('pattern-command').category, 'patterns-behavioral');
  // Composite uses the escape hatch; Builder/Command are declarative
  assert.strictEqual(typeof P.getPattern('pattern-composite').render, 'function');
  assert.ok(P.getPattern('pattern-builder').diagram && P.getPattern('pattern-builder').diagram.nodes.length > 0);
});

test('patternsByCategory filters', () => {
  assert.ok(P.patternsByCategory('patterns-creational').some((p) => p.id === 'pattern-builder'));
  assert.ok(!P.patternsByCategory('patterns-structural').some((p) => p.id === 'pattern-builder'));
});
