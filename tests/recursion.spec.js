const { test, expect } = require('@playwright/test');
const path = require('path');

const fileUri = 'file://' + path.resolve(__dirname, '../index.html');

async function loadMethod(page, methodId) {
  const navItem = page.locator(
    `.category-nav-item:has(.category-nav-method[data-method-id="${methodId}"])`);
  await navItem.locator('.category-nav-btn').click();
  await navItem.locator(`.category-nav-method[data-method-id="${methodId}"]`).click();
  const card = page.locator(`[data-method-section="${methodId}"]`);
  await expect(card).toHaveAttribute('data-runtime-state', 'active');
}

test('recursion loads, shows tree + stack, switches example, steps', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'recursion');
  const card = page.locator('[data-method-section="recursion"]');
  await expect(card).toHaveAttribute('data-runtime-state', 'active');
  await expect(card.locator('.rec-tree .tree-node').first()).toBeVisible();
  await expect(card.locator('.rec-stack').first()).toBeVisible();
  await card.locator('.rec-example').selectOption('quicksort');
  await card.locator('.rec-build').click();
  await card.locator('[data-action="step"]').click();
});

test('recursion guards empty input (no calls) without a blank pane', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'recursion');
  const card = page.locator('[data-method-section="recursion"]');
  await card.locator('.rec-example').selectOption('quicksort');
  await card.locator('.rec-arr').fill('');
  await card.locator('.rec-build').click();
  await expect(card.locator('.rec-tree')).toContainText('No recursive calls for this input.');
  await expect(card.locator('.rec-tree .tree-node')).toHaveCount(0);
});
