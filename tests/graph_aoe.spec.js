const { test, expect } = require('@playwright/test');
const { loadMethod } = require('./helpers');
const path = require('path');

test.describe('AOE / Critical Path', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
        await page.goto('file://' + path.resolve(__dirname, '../index.html'));
        await loadMethod(page, 'graph-aoe');
    });

    test('renders graph + ee/le table, steps to critical path; code filename', async ({ page }) => {
        const sec = page.locator('[data-method-section="graph-aoe"]');
        await expect(sec.locator('.code-panel-filename')).toContainText('graph_aoe.cpp');
        await expect(sec.locator('.aoe-svg')).toBeVisible();
        const step = sec.locator('.stepctl [data-action="step"]');
        for (let i = 0; i < 25; i++) await step.click();
        await expect(sec.locator('.aoe-tbl')).toContainText('18');
    });
});
