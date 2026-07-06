const { test, expect } = require('@playwright/test');
const path = require('path');

const FILE_URL = 'file://' + path.resolve(__dirname, '../index.html');

async function loadMethod(page, methodId) {
    const navItem = page.locator(`.category-nav-item:has(.category-nav-method[data-method-id="${methodId}"])`);
    await navItem.locator('.category-nav-btn').click();
    await navItem.locator(`.category-nav-method[data-method-id="${methodId}"]`).click();
    await expect(page.locator(`[data-method-section="${methodId}"]`)).toHaveAttribute('data-runtime-state', 'active');
}

test.describe('OOP concepts visualization', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {}
        });
        await page.goto(FILE_URL);
        await loadMethod(page, 'oop-inheritance');
    });

    test('supports step controls and reset for the visual explanation', async ({ page }) => {
        const stepCtl = page.locator('#oop-actions .stepctl');
        const badge = page.locator('#oop-inheritance-svg text').filter({ hasText: /Step \d\/4/ });
        const caption = page.locator('#oop-inheritance-svg text').filter({ hasText: /Base class|Derived classes|Overrides|base pointer/ });

        await expect(stepCtl).toBeVisible();
        await expect(badge).toHaveText('Step 1/4');
        await expect(caption).toContainText('Base class');

        await stepCtl.locator('[data-action="step"]').click();
        await expect(badge).toHaveText('Step 2/4');
        await expect(caption).toContainText('Derived classes');

        await stepCtl.locator('[data-action="reset"]').click();
        await expect(badge).toHaveText('Step 1/4');
        await expect(caption).toContainText('Base class');
    });

    test('run button toggles pause while OOP steps advance', async ({ page }) => {
        const stepCtl = page.locator('#oop-actions .stepctl');
        const runBtn = stepCtl.locator('[data-action="run"]');
        const slider = stepCtl.locator('.stepctl-speed');
        const badge = page.locator('#oop-inheritance-svg text').filter({ hasText: /Step \d\/4/ });

        await slider.evaluate((el) => {
            el.value = '600';
            el.dispatchEvent(new Event('input', { bubbles: true }));
        });
        await expect(runBtn).toHaveText('Run');
        await runBtn.click();
        await expect(runBtn).toHaveText('Pause');
        await expect.poll(async () => {
            const text = await badge.textContent();
            return text !== 'Step 1/4';
        }, { timeout: 1000 }).toBe(true);

        await runBtn.click();
        await expect(runBtn).toHaveText(/Run|Resume/);
    });
});
