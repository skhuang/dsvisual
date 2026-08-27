const { test, expect } = require('@playwright/test');

const { loadMethod } = require('./helpers');

const path = require('path');

const fileUri = 'file://' + path.resolve(__dirname, '../index.html');

test('cuckoo-hashing visualization loads', async ({ page }) => {
    await page.goto(fileUri);

    await loadMethod(page, 'cuckoo-hash');

    const card = page.locator('[data-method-section="cuckoo-hash"]');

    await expect(card).toBeVisible();
});

test('cuckoo-hash renders two hash tables', async ({ page }) => {
    await page.goto(fileUri);

    await loadMethod(page, 'cuckoo-hash');

    const card = page.locator('[data-method-section="cuckoo-hash"]');

    await expect(card.locator('.cuckoo-table')).toHaveCount(2);

    await expect(card.locator('.cuckoo-table-grid')).toHaveCount(2);

    await expect(card.locator('.cuckoo-table').nth(0))
        .toContainText('Hash Table 1');

    await expect(card.locator('.cuckoo-table').nth(1))
        .toContainText('Hash Table 2');

    await expect(card.locator('.cuckoo-cell')).toHaveCount(22);

});
test('cuckoo-hash shows insertion information', async ({ page }) => {
    await page.goto(fileUri);

    await loadMethod(page, 'cuckoo-hash');

    const card = page.locator('[data-method-section="cuckoo-hash"]');

    await expect(card.locator('.cuckoo-status')).toContainText('Ready to insert keys.');

    await expect(card.locator('.cuckoo-hash-info'))
        .toContainText('hash1(key)');

    await expect(card.locator('.cuckoo-hash-info'))
        .toContainText('hash2(key)');

    await expect(card.locator('.cuckoo-hash-info'))
        .toContainText('Collision');
});
