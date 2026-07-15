const { test, expect } = require('@playwright/test');
const { loadMethod } = require('./helpers');
const path = require('path');

test.describe('magic-symmetry', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
        await page.goto('file://' + path.resolve(__dirname, '../index.html'));
    });

    test('mode button appears in nav and code filename shows', async ({ page }) => {
        await loadMethod(page, 'magic-symmetry');
        const sec = page.locator('[data-method-section="magic-symmetry"]');
        await expect(sec.locator('.code-panel-filename')).toContainText('magic_symmetry.cpp');
    });

    test('renders the result grid and reaches "still magic" after stepping through an op', async ({ page }) => {
        await loadMethod(page, 'magic-symmetry');
        const sec = page.locator('[data-method-section="magic-symmetry"]');

        const grid = sec.locator('[data-testid="sym-grid"]');
        await expect(grid).toBeVisible();
        await expect(grid.locator('.sym-cell')).toHaveCount(25); // default n=5

        // Pick an op explicitly (r180), then step through show -> apply -> verify* -> done.
        await sec.locator('.sym-op-btn[data-op="r180"]').click();
        const step = sec.locator('.stepctl [data-action="step"]');
        for (let i = 0; i < 30; i++) await step.click();

        await expect(sec.locator('[data-testid="sym-readout"]')).toContainText('still magic');
        await expect(sec.locator('[data-testid="sym-orbit"]')).toContainText('/ 8 distinct');
    });
});
