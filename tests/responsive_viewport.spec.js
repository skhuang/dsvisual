const { test, expect, devices } = require('@playwright/test');
const path = require('path');

const fileUri = 'file://' + path.resolve(__dirname, '../index.html');
const { defaultBrowserType: _iphoneBrowser, ...iphone12 } = devices['iPhone 12'];
const { defaultBrowserType: _ipadBrowser, ...ipadMini } = devices['iPad Mini'];

async function loadMethod(page, methodId) {
  // 取得當前視口大小
  const viewport = await page.viewportSize();
  const isMobile = viewport.width < 640;
  
  if (isMobile) {
    // 行動版：使用 <select> 選擇器（包含 optgroup）
    const select = page.locator('.category-nav-select');
    if (await select.count()) {
      // 直接選擇方法 (option value = methodId)
      await select.selectOption(methodId);
      await page.waitForTimeout(500);
      const methodCard = page.locator(`[data-method-section="${methodId}"]`);
      if (await methodCard.count()) {
        await methodCard.scrollIntoViewIfNeeded();
        await expect(methodCard).toHaveAttribute('data-runtime-state', 'active');
        return;
      }
      throw new Error(`Method ${methodId} card not found after selection`);
    }
    throw new Error('Category select not found on mobile');
  } else {
    // 桌機版：使用菜單按鈕和子選單
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
    throw new Error(`Method ${methodId} not found in desktop menu`);
  }
}
}


test.describe('Responsive Viewport: iPhone 12', () => {
  test.use(iphone12);

  test.beforeEach(async ({ page }) => {
    await page.goto(fileUri);
  });

  test('loads default mode and keeps controls accessible on mobile', async ({ page }) => {
    await expect(page.locator('[data-testid="category-nav"]')).toBeVisible();
    const stackCard = page.locator('[data-method-section="stack-array"]');
    await expect(stackCard).toHaveAttribute('data-runtime-state', 'active');
    await expect(stackCard.locator('.method-code-title')).toHaveText('stack_array.cpp');
    await expect(stackCard.locator('h3')).toHaveText('Stack (Array)');
    await expect(stackCard.locator('.method-section-visual')).toBeVisible();
    await expect(stackCard.locator('.method-slides-btn')).toBeVisible();
  });

  test('can switch to advanced sorting method on mobile', async ({ page }) => {
    await loadMethod(page, 'sort-bubble');
    const sortCard = page.locator('[data-method-section="sort-bubble"]');
    await expect(sortCard).toHaveAttribute('data-runtime-state', 'active');
    await expect(sortCard.locator('.method-code-title')).toHaveText('sort_bubble.cpp');
    await expect(sortCard.locator('.method-section-visual')).toBeVisible();
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

  test('can switch to tree mode on tablet', async ({ page }) => {
    await loadMethod(page, 'tree-trie');
    const trieCard = page.locator('[data-method-section="tree-trie"]');
    await expect(trieCard).toHaveAttribute('data-runtime-state', 'active');
    await expect(trieCard.locator('.method-code-title')).toHaveText('tree_trie.cpp');
    await expect(trieCard.locator('.method-section-visual')).toBeVisible();
  });

  test('can use heap mode after switching menu on tablet', async ({ page }) => {
    await loadMethod(page, 'heap-binary');
    const heapCard = page.locator('[data-method-section="heap-binary"]');
    await expect(heapCard).toHaveAttribute('data-runtime-state', 'active');
    await expect(heapCard.locator('h3')).toContainText('Binary Heap');
    await expect(heapCard.locator('.method-code-title')).toHaveText('heap_binary.cpp');
    await expect(heapCard.locator('.method-section-visual')).toBeVisible();
  });
});
