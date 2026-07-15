const { test, expect } = require('@playwright/test');
const { loadMethod } = require('./helpers');
const path = require('path');

test.describe('Sparse Matrix', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
        await page.goto('file://' + path.resolve(__dirname, '../index.html'));
        await loadMethod(page, 'matrix-sparse');
    });

    test('renders grids/triples, steps through transpose; code filename', async ({ page }) => {
        const sec = page.locator('[data-method-section="matrix-sparse"]');
        await expect(sec.locator('.code-panel-filename')).toContainText('matrix_sparse.cpp');
        await expect(sec.locator('.sm-grid').first()).toBeVisible();
        const step = sec.locator('.stepctl [data-action="step"]');
        for (let i = 0; i < 12; i++) await step.click();
        await expect(sec.locator('.sm-triple-tbl')).toBeVisible();
        await expect(sec.locator('.sm-phase')).toContainText('complete');
    });
});
