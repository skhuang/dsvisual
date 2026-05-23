const { test, expect } = require('@playwright/test');
const path = require('path');

const FILE_URI = 'file://' + path.resolve(__dirname, '../index.html');

test.describe('i18n', () => {
    test('toggle persists across reload', async ({ browser }) => {
        // No addInitScript; we want to control localStorage directly.
        const context = await browser.newContext({ locale: 'en-US' });
        const page = await context.newPage();
        await page.goto(FILE_URI);
        // Default is en. Switch to zh via the API.
        await page.evaluate(() => window.I18N.setLanguage('zh'));
        await expect(page.locator('html')).toHaveAttribute('lang', 'zh-Hant');
        // Reload — localStorage persists.
        await page.reload();
        await expect(page.locator('html')).toHaveAttribute('lang', 'zh-Hant');
        await expect(page.locator('.category-nav-item[data-group="linear"] .category-nav-btn'))
            .toHaveText('線性結構');
        await context.close();
    });

    test('<html lang> attribute updates on toggle', async ({ page }) => {
        await page.addInitScript(() => {
            try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {}
        });
        await page.goto(FILE_URI);
        await expect(page.locator('html')).toHaveAttribute('lang', 'en');
        await page.evaluate(() => window.I18N.setLanguage('zh'));
        await expect(page.locator('html')).toHaveAttribute('lang', 'zh-Hant');
        await page.evaluate(() => window.I18N.setLanguage('en'));
        await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    });

    test('data-i18n-key walker translates settings drawer', async ({ page }) => {
        await page.addInitScript(() => {
            try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {}
        });
        await page.goto(FILE_URI);
        await expect(page.locator('#settings-drawer-title')).toHaveText('Settings');
        await page.evaluate(() => window.I18N.setLanguage('zh'));
        await expect(page.locator('#settings-drawer-title')).toHaveText('設定');
    });

    test('missing-key fallback returns the raw key', async ({ page }) => {
        await page.addInitScript(() => {
            try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {}
        });
        await page.goto(FILE_URI);
        const result = await page.evaluate(() => window.t('definitely.missing.key'));
        expect(result).toBe('definitely.missing.key');
    });

    test('browser auto-detect: zh-TW locale defaults to zh', async ({ browser }) => {
        const context = await browser.newContext({ locale: 'zh-TW' });
        const page = await context.newPage();
        // NO addInitScript — we want the natural first-visit behavior.
        await page.goto(FILE_URI);
        await expect(page.locator('html')).toHaveAttribute('lang', 'zh-Hant');
        await expect(page.locator('.category-nav-item[data-group="linear"] .category-nav-btn'))
            .toHaveText('線性結構');
        await context.close();
    });

    test('browser auto-detect: en-US locale defaults to en', async ({ browser }) => {
        const context = await browser.newContext({ locale: 'en-US' });
        const page = await context.newPage();
        await page.goto(FILE_URI);
        await expect(page.locator('html')).toHaveAttribute('lang', 'en');
        await expect(page.locator('.category-nav-item[data-group="linear"] .category-nav-btn'))
            .toHaveText('Linear Structures');
        await context.close();
    });
});
