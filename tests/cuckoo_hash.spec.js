const { test, expect } = require('@playwright/test');
const { loadMethod } = require('./helpers');
const path = require('path');

test.describe('Cuckoo Hashing', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('dsvisual-lang', 'en'));
    await page.goto('file://' + path.resolve(__dirname, '../index.html'));
  });

  test('inserting colliding keys relocates a key and search finds it', async ({ page }) => {
    await loadMethod(page, 'hash-cuckoo');
    const card = page.locator('[data-method-section="hash-cuckoo"]');
    await expect(card.locator('.code-panel-filename')).toHaveText('hash_cuckoo.cpp');
    await expect(card.locator('[data-testid="cuckoo-cell"]')).toHaveCount(22);

    await card.locator('[data-testid="cuckoo-key"]').fill('1');
    await card.locator('[data-action="cuckoo-insert"]').click();
    await card.locator('[data-testid="cuckoo-key"]').fill('12');
    await card.locator('[data-action="cuckoo-insert"]').click();
    await expect(card.locator('[data-testid="cuckoo-trace"]')).toContainText('kick');

    await card.locator('[data-testid="cuckoo-key"]').fill('1');
    await card.locator('[data-action="cuckoo-search"]').click();
    await expect(card.locator('[data-testid="cuckoo-trace"]')).toContainText('1 found');
  });
});
