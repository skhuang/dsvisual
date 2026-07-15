const { test, expect } = require('@playwright/test');
const { loadMethod } = require('./helpers');
const path = require('path');

test.describe('Polynomial Addition', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
        await page.goto('file://' + path.resolve(__dirname, '../index.html'));
        await loadMethod(page, 'poly-padd');
    });

    test('merges two polynomials into the result; code filename', async ({ page }) => {
        const sec = page.locator('[data-method-section="poly-padd"]');
        await expect(sec.locator('.code-panel-filename')).toContainText('poly_padd.cpp');
        const step = sec.locator('.stepctl [data-action="step"]');
        for (let i = 0; i < 12; i++) await step.click();
        await expect(sec.locator('.pp-result')).toContainText('6x');
        await expect(sec.locator('.pp-result')).toContainText('5x^3');
    });
});
