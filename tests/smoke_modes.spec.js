const { test, expect } = require('@playwright/test');
const path = require('path');
const { loadMethod } = require('./helpers');
const FILE = 'file://' + path.resolve(__dirname, '../index.html');

// One representative method per group — the load+dispatch path we must not regress.
const MODES = [
  'stack-array', 'list-array', 'matrix-sparse', 'tree-bst', 'tree-trie',
  'graph', 'graph-prim', 'graph-matrix', 'graph-components', 'graph-bipartite', 'hash-chain', 'cache-lru', 'heap-binary',
  'sort-bubble', 'search-binary', 'file-isam', 'gc-memory', 'recursion',
  'oop-inheritance', 'pattern-singleton',
  // (pattern-singleton was previously excluded for an SVG-attribute console error in its
  // old escape-hatch render; that render is gone — it's now a stepped declarative diagram —
  // so it's back in the smoke net.)
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
