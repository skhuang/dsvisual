const { test, expect } = require('@playwright/test');
const { loadMethod } = require('./helpers');
const path = require('path');

test.describe('magic-formula', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
        await page.goto('file://' + path.resolve(__dirname, '../index.html'));
    });

    test('mode button appears in nav and code filename shows', async ({ page }) => {
        await loadMethod(page, 'magic-formula');
        const sec = page.locator('[data-method-section="magic-formula"]');
        await expect(sec.locator('.code-panel-filename')).toContainText('magic_formula.cpp');
    });

    test('renders a blank grid, and querying a cell fills only that cell', async ({ page }) => {
        await loadMethod(page, 'magic-formula');
        const sec = page.locator('[data-method-section="magic-formula"]');

        const grid = sec.locator('[data-testid="mf-grid"]');
        await expect(grid).toBeVisible();
        await expect(grid.locator('.mf-cell')).toHaveCount(25); // default n=5
        await expect(grid.locator('.mf-cell.blank')).toHaveCount(25);

        // Click one cell to start a query.
        await grid.locator('.mf-cell').nth(7).click();
        await expect(grid.locator('.mf-cell.current')).toHaveCount(1);

        // Step through pick -> a -> b -> value.
        const step = sec.locator('.stepctl [data-action="step"]');
        for (let i = 0; i < 3; i++) await step.click();

        await expect(grid.locator('.mf-cell.blank')).toHaveCount(24); // only the queried cell revealed
        await expect(sec.locator('[data-testid="mf-readout"]')).toContainText('value=');
    });

    test('"Fill all by formula" reveals every cell and ends on the O(1) callout', async ({ page }) => {
        await loadMethod(page, 'magic-formula');
        const sec = page.locator('[data-method-section="magic-formula"]');

        await sec.locator('.mf-fillall').click();
        const step = sec.locator('.stepctl [data-action="step"]');
        for (let i = 0; i < 30; i++) await step.click();

        await expect(sec.locator('[data-testid="mf-grid"] .mf-cell.blank')).toHaveCount(0);
        await expect(sec.locator('[data-testid="mf-readout"]')).toContainText('25 / 25');
        await expect(sec.locator('[data-testid="mf-callout"]')).toContainText('O(1)');
    });
});
