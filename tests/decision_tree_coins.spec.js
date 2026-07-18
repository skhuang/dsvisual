const { test, expect } = require('@playwright/test');
const { loadMethod } = require('./helpers');
const path = require('path');

test.describe('8-Coins Decision Tree', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
        await page.goto('file://' + path.resolve(__dirname, '../index.html'));
        await loadMethod(page, 'decision-tree-coins');
    });

    test('identifies c heavy', async ({ page }) => {
        const sec = page.locator('[data-method-section="decision-tree-coins"]');
        await sec.locator('.dc-coin[data-coin="2"]').click();       // c
        await sec.locator('.dc-hl[data-heavy="1"]').click();        // heavy
        await sec.locator('.stepctl [data-action="run"]').click();
        await expect(sec.locator('.dc-verdict.dc-ok')).toContainText('coin c', { timeout: 15000 });
        await expect(sec.locator('.dc-verdict.dc-ok')).toContainText('heavy');
    });

    test('identifies g light', async ({ page }) => {
        const sec = page.locator('[data-method-section="decision-tree-coins"]');
        await sec.locator('.dc-coin[data-coin="6"]').click();       // g
        await sec.locator('.dc-hl[data-heavy="0"]').click();        // light
        await sec.locator('.stepctl [data-action="run"]').click();
        await expect(sec.locator('.dc-verdict.dc-ok')).toContainText('coin g', { timeout: 15000 });
        await expect(sec.locator('.dc-verdict.dc-ok')).toContainText('light');
    });

    test('verify all 16 shows a pass and the tree renders 16 leaves', async ({ page }) => {
        const sec = page.locator('[data-method-section="decision-tree-coins"]');
        await sec.locator('.dc-verify').click();
        await expect(sec.locator('.dc-verifyout.dc-ok')).toContainText('16');
        await expect(sec.locator('.dc-tree .dc-leaf')).toHaveCount(16);
    });
});
