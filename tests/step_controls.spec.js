const { test, expect } = require('@playwright/test');
const path = require('path');
const FILE_URL = 'file://' + path.resolve(__dirname, '../index.html');

async function loadMethod(page, methodId) {
    const navItem = page.locator(`.category-nav-item:has(.category-nav-method[data-method-id="${methodId}"])`);
    await navItem.locator('.category-nav-btn').click();
    await navItem.locator(`.category-nav-method[data-method-id="${methodId}"]`).click();
    await expect(page.locator(`[data-method-section="${methodId}"]`)).toHaveAttribute('data-runtime-state', 'active');
}

test.describe('Unified step controls — Run/Pause/Resume + Speed', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); localStorage.removeItem('dsvisual.stepSpeed.graph-aoe'); } catch (e) {} });
        await page.goto(FILE_URL);
        await loadMethod(page, 'graph-aoe');
    });

    test('Run toggles to Pause then Resume; progress advances only while running', async ({ page }) => {
        const sec = page.locator('[data-method-section="graph-aoe"]');
        const runBtn = sec.locator('.stepctl [data-action="run"]');
        const slider = sec.locator('.stepctl .stepctl-speed');
        const phase = sec.locator('.aoe-phase');

        await expect(runBtn).toHaveText('Run');
        await expect(slider).toHaveCount(1);

        await slider.evaluate((el) => { el.value = '510'; el.dispatchEvent(new Event('input', { bubbles: true })); });

        await runBtn.click();
        await expect(runBtn).toHaveText('Pause');
        const t1 = await phase.textContent();
        await page.waitForTimeout(400);
        const t2 = await phase.textContent();
        expect(t2).not.toBe(t1);

        await runBtn.click();
        await expect(runBtn).toHaveText('Resume');
        const p1 = await phase.textContent();
        await page.waitForTimeout(400);
        const p2 = await phase.textContent();
        expect(p2).toBe(p1);

        await runBtn.click();
        await expect(runBtn).toHaveText('Pause');
    });

    test('Step from paused advances; Reset returns to Run state', async ({ page }) => {
        const sec = page.locator('[data-method-section="graph-aoe"]');
        const runBtn = sec.locator('.stepctl [data-action="run"]');
        const stepBtn = sec.locator('.stepctl [data-action="step"]');
        const phase = sec.locator('.aoe-phase');

        const before = await phase.textContent();
        await stepBtn.click();
        const after = await phase.textContent();
        expect(after).not.toBe(before);

        await sec.locator('.stepctl [data-action="reset"]').click();
        await expect(runBtn).toHaveText('Run');
    });

    test('Speed slider value persists per visualization across reload', async ({ page }) => {
        const sec = page.locator('[data-method-section="graph-aoe"]');
        await sec.locator('.stepctl .stepctl-speed').evaluate((el) => { el.value = '123'; el.dispatchEvent(new Event('input', { bubbles: true })); });
        await page.reload();
        await loadMethod(page, 'graph-aoe');
        await expect(page.locator('[data-method-section="graph-aoe"] .stepctl .stepctl-speed')).toHaveValue('123');
    });
});
