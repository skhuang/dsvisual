const { test, expect } = require('@playwright/test');
const { loadMethod } = require('./helpers');
const path = require('path');

test.describe('HyperLogLog', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('dsvisual-lang', 'en'));
    await page.goto('file://' + path.resolve(__dirname, '../index.html'));
  });

  test('updates a hash register and estimates distinct values', async ({ page }) => {
    await loadMethod(page, 'hyperloglog');
    const card = page.locator('[data-method-section="hyperloglog"]');
    await expect(card.locator('.code-panel-filename')).toHaveText('hyperloglog.cpp');
    await expect(card.locator('[data-testid="hll-cell"]')).toHaveCount(16);

    await card.locator('[data-testid="hll-value"]').fill('cat');
    await card.locator('[data-action="hll-add"]').click();
    await expect(card.locator('[data-testid="hll-message"]')).toContainText('bucket');
    await expect(card.locator('.hll-active')).toHaveCount(1);
    await expect(card.locator('[data-testid="hll-stats"]')).toContainText('distinct seen: 1');
  });
});
