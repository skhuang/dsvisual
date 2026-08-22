const { test, expect } = require('@playwright/test');
const path = require('path');
const { loadMethod } = require('./helpers');
const FILE = 'file://' + path.resolve(__dirname, '../index.html');

// One representative method per group — the load+dispatch path we must not regress.
const MODES = [
  'stack-array', 'list-array', 'matrix-sparse', 'tree-bst', 'tree-trie',
  'graph', 'graph-prim', 'graph-matrix', 'graph-components', 'graph-bipartite', 'graph-closure', 'graph-scc', 'graph-maxflow', 'hash-chain', 'cache-lru', 'heap-binary',
  'sort-bubble', 'search-binary', 'file-isam', 'gc-memory', 'recursion',
  'oop-inheritance', 'pattern-singleton', 'select-quickselect',
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

test('Quickselect mode loads and operates with testids', async ({ page }) => {
  // 1. 使用原本的檔案載入與 loadMethod 機制切換到 select-quickselect 模式
  await page.goto(FILE);
  await loadMethod(page, 'select-quickselect');

  // 2. 找到陣列與 k 值輸入框
  const arrInput = page.locator('[data-testid="qsel-arr"]');
  const kInput = page.locator('[data-testid="qsel-k"]');

  // 3. 確保元素已掛載於 DOM 上
  await expect(arrInput).toBeVisible();

  // 4. 填入含有「重複值」的測試資料與 k 值
  await arrInput.fill('5,2,8,2,5,1,9,2');
  await kInput.fill('3');

  // 5. 點擊 Quickselect UI 內部的「建立 (Build)」按鈕
  await page.click('.qsel-build');

  // 6. 斷言輸入框與渲染看板正常運作
await expect(arrInput).toHaveValue('5,2,8,2,5,1,9,2');
await expect(page.locator('.searchviz-stage')).toBeVisible();
});
