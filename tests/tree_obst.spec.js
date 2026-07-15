const { test, expect } = require('@playwright/test');
const { loadMethod } = require('./helpers');
const path = require('path');

test.describe('Optimal BST', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
        await page.goto('file://' + path.resolve(__dirname, '../index.html'));
        await loadMethod(page, 'tree-obst');
    });

    test('fills DP table then shows reconstructed tree; code filename', async ({ page }) => {
        const sec = page.locator('[data-method-section="tree-obst"]');
        await expect(sec.locator('.code-panel-filename')).toContainText('tree_obst.cpp');
        await expect(sec.locator('.obst-tbl')).toBeVisible();
        const step = sec.locator('.stepctl [data-action="step"]');
        for (let i = 0; i < 15; i++) await step.click();
        await expect(sec.locator('.obst-nodes')).toContainText('30');
    });
});
