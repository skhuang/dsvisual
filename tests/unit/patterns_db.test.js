const test = require('node:test');
const assert = require('node:assert');
const P = require('../../js/patterns_db.js');

test('registry exposes the 3 new patterns grouped by category', () => {
  assert.ok(P.getPattern('pattern-builder'));
  assert.strictEqual(P.getPattern('pattern-builder').category, 'patterns-creational');
  assert.strictEqual(P.getPattern('pattern-composite').category, 'patterns-structural');
  assert.strictEqual(P.getPattern('pattern-command').category, 'patterns-behavioral');
  // Builder/Command/Composite are now stepped declarative diagrams (step-viz feature):
  // each has diagram.nodes + a diagram.steps array (Composite was converted from its
  // former escape-hatch render to a declarative stepped diagram).
  ['pattern-builder', 'pattern-command', 'pattern-composite'].forEach((id) => {
    const d = P.getPattern(id);
    assert.ok(d.diagram && d.diagram.nodes.length > 0, id + ' has diagram nodes');
    assert.ok(Array.isArray(d.diagram.steps) && d.diagram.steps.length > 0, id + ' has steps');
  });
});

test('patternsByCategory filters', () => {
  assert.ok(P.patternsByCategory('patterns-creational').some((p) => p.id === 'pattern-builder'));
  assert.ok(!P.patternsByCategory('patterns-structural').some((p) => p.id === 'pattern-builder'));
});

test('registry has all 14 patterns in the right category counts', () => {
  assert.strictEqual(P.PATTERNS.length, 14);
  assert.strictEqual(P.patternsByCategory('patterns-creational').length, 3);
  assert.strictEqual(P.patternsByCategory('patterns-structural').length, 3);
  assert.strictEqual(P.patternsByCategory('patterns-behavioral').length, 3);
  assert.strictEqual(P.patternsByCategory('patterns-architectural').length, 5);
  // migrated patterns use the escape hatch (verbatim move), so each has a render fn
  ['pattern-singleton','pattern-factory','pattern-adapter','pattern-decorator','pattern-observer','pattern-strategy','pattern-mvc','pattern-layered','pattern-pubsub','pattern-pipefilter','pattern-di']
    .forEach((id) => { const p = P.getPattern(id); assert.ok(p, id); assert.strictEqual(typeof p.render, 'function', id + ' render'); assert.ok(Array.isArray(p.narration), id + ' narration'); });
});
