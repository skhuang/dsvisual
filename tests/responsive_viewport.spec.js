const { test, expect, devices } = require('@playwright/test');
const path = require('path');

const fileUri = 'file://' + path.resolve(__dirname, '../index.html');
const { defaultBrowserType: _iphoneBrowser, ...iphone12 } = devices['iPhone 12'];
const { defaultBrowserType: _ipadBrowser, ...ipadMini } = devices['iPad Mini'];

async function ensureGroupExpanded(page, groupIndex) {
  const group = page.locator('.mode-group').nth(groupIndex);
  const content = group.locator('.group-content');
  if (!(await content.isVisible())) {
    await group.locator('.group-header').click();
  }
}

test.describe('Responsive Viewport: iPhone 12', () => {
  test.use(iphone12);

  test.beforeEach(async ({ page }) => {
    await page.goto(fileUri);
  });

  test('loads default mode and keeps controls accessible on mobile', async ({ page }) => {
    await expect(page.locator('#code-title')).toHaveText('stack_array.cpp');
    await expect(page.locator('#desc-view h3')).toHaveText('Stack (Array Implementation)');
    await expect(page.locator('#array-container')).toBeVisible();
    await expect(page.locator('.mode-groups')).toBeVisible();
    await expect(page.locator('#btn-std-add')).toBeVisible();
  });

  test('can expand advanced group and execute sorting flow on mobile', async ({ page }) => {
    await ensureGroupExpanded(page, 3);
    await page.locator('label[for="mode-sort-bubble"]').click();

    await expect(page.locator('#code-title')).toHaveText('sort_bubble.cpp');

    await page.click('#btn-sort-random');
    await expect(page.locator('.sort-bar')).toHaveCount(15);

    await page.click('#btn-sort-start');
    await expect(page.locator('#status-message')).toContainText('Bubble Sort', { timeout: 20000 });
  });
});

test.describe('Responsive Viewport: iPad Mini', () => {
  test.use(ipadMini);

  test.beforeEach(async ({ page }) => {
    await page.goto(fileUri);
  });

  test('can switch to tree mode and run trie insertion on tablet', async ({ page }) => {
    await ensureGroupExpanded(page, 2);
    await page.locator('label[for="mode-tree-trie"]').click();

    await expect(page.locator('#code-title')).toHaveText('tree_trie.cpp');

    await page.fill('#text-tree-val', 'CAT');
    await page.click('#btn-text-tree-add');

    await expect(page.locator('#status-message')).toHaveText('Execution Complete!');
    await expect(page.locator('.edge-label')).toHaveCount(3);
  });

  test('can use heap mode after expanding advanced group on tablet', async ({ page }) => {
    await ensureGroupExpanded(page, 3);
    await page.locator('label[for="mode-heap-binary"]').click();

    await expect(page.locator('#desc-view h3')).toContainText('Binary Heap');
    await expect(page.locator('#heap-actions')).toBeVisible();

    await page.fill('#heap-val', '42');
    await page.click('#btn-heap-insert');

    await expect(page.locator('#status-message')).toContainText('Inserted 42', { timeout: 10000 });
  });
});
