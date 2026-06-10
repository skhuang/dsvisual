const { test, expect } = require('@playwright/test');
const path = require('path');

async function loadMethod(page, methodId) {
    const navItem = page.locator(`.category-nav-item:has(.category-nav-method[data-method-id="${methodId}"])`);
    await navItem.locator('.category-nav-btn').click();
    await navItem.locator(`.category-nav-method[data-method-id="${methodId}"]`).click();
    await expect(page.locator(`[data-method-section="${methodId}"]`)).toHaveAttribute('data-runtime-state', 'active');
}

test.describe('External Merge Sort', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
        await page.goto('file://' + path.resolve(__dirname, '../index.html'));
        await loadMethod(page, 'sort-external');
    });

    test('generates runs, merges, output sorted; code filename', async ({ page }) => {
        const sec = page.locator('[data-method-section="sort-external"]');
        await expect(sec.locator('.code-panel-filename')).toContainText('sort_external.cpp');
        await expect(sec.locator('.ext-runs')).toBeVisible();
        const step = sec.locator('.stepctl [data-action="step"]');
        for (let i = 0; i < 60; i++) await step.click();
        const out = await sec.locator('.ext-out-cells').innerText();
        const nums = out.split(/\s+/).filter((s) => s.length).map(Number);
        const sorted = [...nums].sort((a, b) => a - b);
        expect(nums).toEqual(sorted);
        expect(nums.length).toBe(10);
    });
});
