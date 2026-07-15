const { test, expect } = require('@playwright/test');
const { loadMethod } = require('./helpers');
const path = require('path');

test.describe('Fibonacci Search', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
        await page.goto('file://' + path.resolve(__dirname, '../index.html'));
        await loadMethod(page, 'search-fibonacci');
    });

    test('steps to a found result; code filename', async ({ page }) => {
        const sec = page.locator('[data-method-section="search-fibonacci"]');
        await expect(sec.locator('.code-panel-filename')).toContainText('search_fibonacci.cpp');
        await expect(sec.locator('.ss-cells')).toBeVisible();
        const step = sec.locator('.stepctl [data-action="step"]');
        for (let i = 0; i < 12; i++) await step.click();
        await expect(sec.locator('.ss-result')).toContainText('found at index');
    });
});
