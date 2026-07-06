const { test, expect } = require('@playwright/test');
const path = require('path');

async function loadMethod(page, methodId) {
    const navItem = page.locator(`.category-nav-item:has(.category-nav-method[data-method-id="${methodId}"])`);
    await navItem.locator('.category-nav-btn').click();
    await navItem.locator(`.category-nav-method[data-method-id="${methodId}"]`).click();
    await expect(page.locator(`[data-method-section="${methodId}"]`)).toHaveAttribute('data-runtime-state', 'active');
}

test.describe("Magic Square (Coxeter's Rule)", () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
        await page.goto('file://' + path.resolve(__dirname, '../index.html'));
        await loadMethod(page, 'magic-square');
    });

    test('renders Coxeter rule steps and completes a 3x3 magic square', async ({ page }) => {
        const sec = page.locator('[data-method-section="magic-square"]');
        await expect(sec.locator('.code-panel-filename')).toContainText('magic_square.cpp');
        await expect(sec.locator('.magic-board .magic-cell')).toHaveCount(25);
        await expect(sec.locator('.magic-rule')).toContainText('Start at the center');

        await sec.locator('.stepctl [data-action="step"]').click();
        await expect(sec.locator('.magic-cell.current')).toHaveText('1');
        await expect(sec.locator('.magic-readout')).toContainText('placed 1');

        await sec.locator('.magic-order').selectOption('3');
        await expect(sec.locator('.magic-board .magic-cell')).toHaveCount(9);
        const step = sec.locator('.stepctl [data-action="step"]');
        for (let i = 0; i < 9; i++) await step.click();

        await expect(sec.locator('.magic-rule')).toContainText('Complete');
        await expect(sec.locator('.magic-readout')).toContainText('magic sum = 15');
        const values = await sec.locator('.magic-board .magic-cell').allTextContents();
        expect(values.map(Number).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });
});
