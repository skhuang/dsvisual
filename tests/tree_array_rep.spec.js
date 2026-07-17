const { test, expect } = require('@playwright/test');
const { loadMethod } = require('./helpers');
const path = require('path');

test.describe('Array Representation', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
        await page.goto('file://' + path.resolve(__dirname, '../index.html'));
        await loadMethod(page, 'tree-array-rep');
    });

    test('right-skewed preset shows wasted slots', async ({ page }) => {
        const sec = page.locator('[data-method-section="tree-array-rep"]');
        await sec.locator('.ar-preset[data-p="right-skewed"]').click();
        await sec.locator('.stepctl [data-action="run"]').click();
        await expect(sec.locator('.ar-stats.ar-ok')).toContainText('wasted 4', { timeout: 15000 });
        await expect(sec.locator('.ar-cell.ar-wasted').first()).toBeVisible();
    });

    test('complete preset wastes nothing', async ({ page }) => {
        const sec = page.locator('[data-method-section="tree-array-rep"]');
        await sec.locator('.ar-preset[data-p="complete"]').click();
        await sec.locator('.stepctl [data-action="run"]').click();
        await expect(sec.locator('.ar-stats.ar-ok')).toContainText('wasted 0', { timeout: 15000 });
    });

    test('clicking a node highlights its parent cell', async ({ page }) => {
        const sec = page.locator('[data-method-section="tree-array-rep"]');
        await sec.locator('.ar-preset[data-p="right-skewed"]').click();
        await sec.locator('.stepctl [data-action="run"]').click();
        await expect(sec.locator('.ar-stats.ar-ok')).toBeVisible({ timeout: 15000 });
        await sec.locator('.tree-node[data-i="3"]').click();          // node C at index 3
        await expect(sec.locator('.ar-cell[data-i="1"].ar-hl-parent')).toBeVisible();
    });
});
