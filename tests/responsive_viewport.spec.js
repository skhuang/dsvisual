const { test, expect, devices } = require('@playwright/test');
const path = require('path');

const fileUri = 'file://' + path.resolve(__dirname, '../index.html');
const { defaultBrowserType: _iphoneBrowser, ...iphone12 } = devices['iPhone 12'];
const { defaultBrowserType: _ipadBrowser, ...ipadMini } = devices['iPad Mini'];

async function loadMethod(page, methodId) {
  // Try to find and click the method card directly
  const card = page.locator(`[data-method-section="${methodId}"]`);
  if (await card.count()) {
    // Scroll to the card if needed
    await card.scrollIntoViewIfNeeded();
    await card.locator('.method-load-btn').click();
    await expect(card).toHaveAttribute('data-runtime-state', 'active');
    return;
  }
  
  // If card not found in current view, search through categories
  const viewport = await page.viewportSize();
  const isMobile = viewport.width < 640;
  
  if (isMobile) {
    // On mobile, use select dropdown
    const select = page.locator('.category-nav-select');
    if (await select.count()) {
      // Try each category option to find the method
      const options = page.locator('.category-nav-select option');
      const optionCount = await options.count();
      for (let i = 1; i < optionCount; i++) {
        await select.selectOption({ index: i });
        await page.waitForTimeout(300);
        const methodCard = page.locator(`[data-method-section="${methodId}"]`);
        if (await methodCard.count()) {
          await methodCard.scrollIntoViewIfNeeded();
          await methodCard.locator('.method-load-btn').click();
          await expect(methodCard).toHaveAttribute('data-runtime-state', 'active');
          return;
        }
      }
    }
  } else {
    // On desktop, click category buttons
    const categoryButtons = page.locator('[data-testid="category-nav"] .category-nav-btn');
    const count = await categoryButtons.count();
    for (let i = 0; i < count; i++) {
      await categoryButtons.nth(i).click();
      await page.waitForTimeout(200);
      const methodCard = page.locator(`[data-method-section="${methodId}"]`);
      if (await methodCard.count()) {
        await methodCard.scrollIntoViewIfNeeded();
        await methodCard.locator('.method-load-btn').click();
        await expect(methodCard).toHaveAttribute('data-runtime-state', 'active');
        return;
      }
    }
  }
  
  throw new Error(`Method ${methodId} not found`);
}

async function loadMethodByRadioId(page, methodId) {
  // Extract methodId from radio ID (e.g., 'mode-sort-bubble' -> 'sort-bubble')
  const cleanMethodId = methodId.replace('mode-', '');
  await loadMethod(page, cleanMethodId);
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
    // Verify mobile navigation uses select dropdown
    await expect(page.locator('.category-nav-select')).toBeVisible();
    await expect(page.locator('#btn-std-add')).toBeVisible();
  });

  test('can expand advanced group and execute sorting flow on mobile', async ({ page }) => {
    await loadMethodByRadioId(page, 'mode-sort-bubble');

    await expect(page.locator('#code-title')).toHaveText('sort_bubble.cpp');

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
    await loadMethodByRadioId(page, 'mode-tree-trie');

    await expect(page.locator('#code-title')).toHaveText('tree_trie.cpp');

    await page.fill('#text-tree-val', 'CAT');
    await page.click('#btn-text-tree-add');

    await expect(page.locator('#status-message')).toHaveText('Execution Complete!');
    await expect(page.locator('.edge-label')).toHaveCount(3);
  });

  test('can use heap mode after expanding advanced group on tablet', async ({ page }) => {
    await loadMethodByRadioId(page, 'mode-heap-binary');

    await expect(page.locator('#desc-view h3')).toContainText('Binary Heap');
    await expect(page.locator('#heap-actions')).toBeVisible();

    await page.fill('#heap-val', '42');
    await page.click('#btn-heap-insert');

    await expect(page.locator('#status-message')).toContainText('Inserted 42', { timeout: 10000 });
  });
});
