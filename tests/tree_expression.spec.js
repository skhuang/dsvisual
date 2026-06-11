const { test, expect } = require('@playwright/test');
const path = require('path');

async function loadMethod(page, methodId) {
    const navItem = page.locator(`.category-nav-item:has(.category-nav-method[data-method-id="${methodId}"])`);
    await navItem.locator('.category-nav-btn').click();
    await navItem.locator(`.category-nav-method[data-method-id="${methodId}"]`).click();
    await expect(page.locator(`[data-method-section="${methodId}"]`)).toHaveAttribute('data-runtime-state', 'active');
}

test.describe('Expression Tree', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
        await page.goto('file://' + path.resolve(__dirname, '../index.html'));
        await loadMethod(page, 'tree-expression');
    });

    test('builds the tree and shows the evaluated result; code filename', async ({ page }) => {
        const sec = page.locator('[data-method-section="tree-expression"]');
        await expect(sec.locator('.code-panel-filename')).toContainText('tree_expression.cpp');
        await expect(sec.locator('.et-stage')).toBeVisible();
        const step = sec.locator('.stepctl [data-action="step"]');
        for (let i = 0; i < 10; i++) await step.click();
        await expect(sec.locator('.et-result')).toContainText('35');
        await expect(sec.locator('.et-nodes .tree-node.et-op').first()).toBeVisible();
    });
});
