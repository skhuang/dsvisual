const { test, expect } = require('@playwright/test');
const { loadMethod } = require('./helpers');
const path = require('path');

const fileUri = 'file://' + path.resolve(__dirname, '../index.html');

test('list-equivalence loads, builds, steps, randomizes', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'list-equivalence');
  const card = page.locator('[data-method-section="list-equivalence"]');
  await expect(card).toHaveAttribute('data-runtime-state', 'active');
  await expect(card.locator('.eq-adj').first()).toBeVisible();
  await expect(card.locator('.eq-find').first()).toBeVisible();
  await card.locator('[data-action="step"]').click();
  await card.locator('.rand-btn').click();
});
