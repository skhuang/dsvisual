const { test, expect } = require('@playwright/test');
const path = require('path');

const FILE_URL = 'file://' + path.resolve(__dirname, '..', 'index.html');

test.describe('UX polish — code density slider', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto(FILE_URL);
        await page.waitForSelector('.code-panel-body');
        // Reset localStorage so tests don't bleed state
        await page.evaluate(() => localStorage.removeItem('dsvisual.codeDensity'));
        await page.reload();
        await page.waitForSelector('.code-panel-body');
    });

    test('settings drawer opens on toggle and closes on × button', async ({ page }) => {
        const drawer = page.locator('#settings-drawer');
        await expect(drawer).toBeHidden();
        await page.locator('#settings-toggle').click();
        await expect(drawer).toBeVisible();
        await page.locator('.settings-drawer-close').click();
        await expect(drawer).toBeHidden();
    });

    test('settings drawer closes on backdrop click and Escape', async ({ page }) => {
        await page.locator('#settings-toggle').click();
        await page.locator('.settings-drawer-backdrop').click();
        await expect(page.locator('#settings-drawer')).toBeHidden();

        await page.locator('#settings-toggle').click();
        await page.keyboard.press('Escape');
        await expect(page.locator('#settings-drawer')).toBeHidden();
    });

    test('slider changes code-panel-body line-height and value display', async ({ page }) => {
        await page.locator('#settings-toggle').click();
        const slider = page.locator('#code-density-slider');
        // Drag the slider to 1.30 (use evaluate to set value + dispatch input event)
        await slider.evaluate((el) => {
            el.value = '1.30';
            el.dispatchEvent(new Event('input', { bubbles: true }));
        });

        await expect(page.locator('#code-density-value')).toHaveText(/^1\.3$/);
        const cssVar = await page.evaluate(() =>
            getComputedStyle(document.documentElement).getPropertyValue('--code-line-height')
        );
        expect(parseFloat(cssVar.trim())).toBeCloseTo(1.30, 2);
    });

    test('density persists across page reload', async ({ page }) => {
        await page.locator('#settings-toggle').click();
        await page.locator('#code-density-slider').evaluate((el) => {
            el.value = '1.20';
            el.dispatchEvent(new Event('input', { bubbles: true }));
        });
        await page.reload();
        await page.waitForSelector('.code-panel-body');
        const lh = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--code-line-height'));
        expect(parseFloat(lh.trim())).toBeCloseTo(1.20, 2);
    });

    test('reset button restores 1.55 and clears localStorage', async ({ page }) => {
        await page.locator('#settings-toggle').click();
        await page.locator('#code-density-slider').evaluate((el) => {
            el.value = '1.20';
            el.dispatchEvent(new Event('input', { bubbles: true }));
        });
        await page.locator('#code-density-reset').click();
        await expect(page.locator('#code-density-value')).toHaveText('1.55');
        const stored = await page.evaluate(() => localStorage.getItem('dsvisual.codeDensity'));
        expect(stored).toBeNull();
    });
});
