const { test, expect } = require('@playwright/test');
const path = require('path');
const { loadMethod } = require('./helpers');
const FILE = 'file://' + path.resolve(__dirname, '../index.html');

// One representative method per group — the load+dispatch path we must not regress.
const MODES = [
  'stack-array', 'list-array', 'matrix-sparse', 'tree-bst', 'tree-trie',
  'graph', 'graph-prim', 'hash-chain', 'cache-lru', 'heap-binary',
  'sort-bubble', 'search-binary', 'file-isam', 'gc-memory', 'recursion',
  'oop-inheritance',
  // 'pattern-singleton' excluded: on current (pre-refactor) code it already logs
  // a console error — `<text> attribute y: Expected length, "130 + i*18".` —
  // from an unevaluated SVG y-coordinate expression. Not fixed here; this net
  // is a baseline regression guard, not a bug-fix vehicle.
];

for (const id of MODES) {
  test(`mode ${id} loads with no console errors`, async ({ page }) => {
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE);
    await loadMethod(page, id);
    expect(errors, errors.join('\n')).toEqual([]);
  });
}
