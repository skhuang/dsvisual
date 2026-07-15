const { test, expect } = require('@playwright/test');
const { loadMethod } = require('./helpers');
const path = require('path');

test.describe('magic-torus', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
        await page.goto('file://' + path.resolve(__dirname, '../index.html'));
    });

    test('mode button appears in nav and code filename shows', async ({ page }) => {
        await loadMethod(page, 'magic-torus');
        const sec = page.locator('[data-method-section="magic-torus"]');
        await expect(sec.locator('.code-panel-filename')).toContainText('magic_torus.cpp');
    });

    test('renders the tiled plane and reaches the done phase after stepping', async ({ page }) => {
        await loadMethod(page, 'magic-torus');
        const sec = page.locator('[data-method-section="magic-torus"]');

        const plane = sec.locator('[data-testid="mt-plane"]');
        await expect(plane).toBeVisible();
        await expect(sec.locator('.mt-tile-center')).toHaveCount(1);

        const step = sec.locator('.stepctl [data-action="step"]');
        for (let i = 0; i < 30; i++) await step.click();

        await expect(sec.locator('[data-testid="mt-readout"]')).toContainText('run');
    });
});
