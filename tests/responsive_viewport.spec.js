const { test, expect, devices } = require('@playwright/test');
const path = require('path');

const fileUri = 'file://' + path.resolve(__dirname, '../index.html');
const { defaultBrowserType: _iphoneBrowser, ...iphone12 } = devices['iPhone 12'];
const { defaultBrowserType: _ipadBrowser, ...ipadMini } = devices['iPad Mini'];

async function loadMethod(page, methodId) {
  const allMethodBtns = page.locator('button[data-method]');
  const count = await allMethodBtns.count();
  
  for (let i = 0; i < count; i++) {
    const method = await allMethodBtns.nth(i).getAttribute('data-method');
    if (method === methodId) {
      await allMethodBtns.nth(i).click();
      await page.waitForTimeout(500);
      const card = page.locator(`[data-method-section="${methodId}"]`);
      await expect(card).toHaveAttribute('data-runtime-state', 'active');
      return;
    }
  }
  throw new Error(`Method ${methodId} not found in menu`);
}


test.describe('Responsive Viewport: iPhone 12', () => {
  test.use(iphone12);

  test.beforeEach(async ({ page }) => {
    await page.goto(fileUri);
  });

  test('loads default mode and keeps controls accessible on mobile', async ({ page }) => {
    // 檢查卡片標題與檔名
    const stackCard = page.locator('[data-method-section="stack-array"]');
    await expect(stackCard.locator('.method-code-title')).toHaveText('stack_array.cpp');
    await expect(stackCard.locator('h3')).toHaveText('Stack (Array)');
    // 檢查可見的視覺化區塊
    await expect(stackCard.locator('.method-section-visual')).toBeVisible();
    // 檢查互動按鈕
    await expect(stackCard.locator('.method-load-btn')).toBeVisible();
    await expect(stackCard.locator('.method-slides-btn')).toBeVisible();
  });

  test('can expand advanced group and execute sorting flow on mobile', async ({ page }) => {
    await loadMethod(page, 'sort-bubble');
    const sortCard = page.locator('[data-method-section="sort-bubble"]');
    await expect(sortCard.locator('.method-code-title')).toHaveText('sort_bubble.cpp');

    await page.click('#btn-sort-random');
    await expect(page.locator('.sort-bar')).toHaveCount(15);

    await page.click('#btn-sort-start');
    await expect(page.locator('#status-message')).toContainText('Bubble Sort', { timeout: 20000 });
  });

  test('can access method sections and slides on mobile', async ({ page }) => {
    await expect(page.locator('[data-testid="category-nav"]')).toBeVisible();
    await expect(page.locator('[data-testid="method-sections"] [data-method-section]')).toHaveCount(4);

    await page.locator('[data-method-section="stack-array"] .method-slides-btn').click();
    await expect(page.locator('[data-testid="slide-viewer"]')).toBeVisible();
    await expect(page.locator('#slide-viewer-title')).toHaveText('Stack (Array)');

    await page.locator('.slide-viewer-close').click();
    await expect(page.locator('[data-testid="slide-viewer"]')).toBeHidden();
  });
});

test.describe('Responsive Viewport: iPad Mini', () => {
  test.use(ipadMini);

  test.beforeEach(async ({ page }) => {
    await page.goto(fileUri);
  });

  test('can switch to tree mode and run trie insertion on tablet', async ({ page }) => {
    await loadMethod(page, 'tree-trie');
    const trieCard = page.locator('[data-method-section="tree-trie"]');
    await expect(trieCard.locator('.method-code-title')).toHaveText('tree_trie.cpp');

    await page.fill('#text-tree-val', 'CAT');
    await page.click('#btn-text-tree-add');

    await expect(page.locator('#status-message')).toHaveText('Execution Complete!');
    await expect(page.locator('.edge-label')).toHaveCount(3);
  });

  test('can use heap mode after expanding advanced group on tablet', async ({ page }) => {
    await loadMethod(page, 'heap-binary');
    const heapCard = page.locator('[data-method-section="heap-binary"]');
    await expect(heapCard.locator('h3')).toContainText('Binary Heap');
    await expect(page.locator('#heap-actions')).toBeVisible();

    await page.fill('#heap-val', '42');
    await page.click('#btn-heap-insert');

    await expect(page.locator('#status-message')).toContainText('Inserted 42', { timeout: 10000 });
  });
});
