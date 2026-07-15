const { test, expect } = require('@playwright/test');
const { loadMethod } = require('./helpers');
const path = require('path');

test.describe('magic-latin', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
        await page.goto('file://' + path.resolve(__dirname, '../index.html'));
    });

    test('mode button appears in nav and code filename shows', async ({ page }) => {
        await loadMethod(page, 'magic-latin');
        const sec = page.locator('[data-method-section="magic-latin"]');
        await expect(sec.locator('.code-panel-filename')).toContainText('magic_latin.cpp');
    });

    test('renders the three grids and reaches the verified-done phase', async ({ page }) => {
        await loadMethod(page, 'magic-latin');
        const sec = page.locator('[data-method-section="magic-latin"]');

        const gridA = sec.locator('[data-testid="ml-grid-a"]');
        await expect(gridA).toBeVisible();
        await expect(gridA.locator('.ml-cell')).toHaveCount(25);
        await expect(sec.locator('[data-testid="ml-grid-square"] .ml-cell')).toHaveCount(25);
        await expect(sec.locator('[data-testid="ml-grid-b"] .ml-cell')).toHaveCount(25);

        const step = sec.locator('.stepctl [data-action="step"]');
        for (let i = 0; i < 60; i++) await step.click();

        await expect(sec.locator('.ml-phase')).toContainText('every row/col/diagonal');
        await expect(sec.locator('[data-testid="ml-readout"]')).toContainText('magic sum');
    });
});
