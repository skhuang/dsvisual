const { test, expect } = require('@playwright/test');
const { loadMethod } = require('./helpers');
const path = require('path');
const FILE_URL = 'file://' + path.resolve(__dirname, '../index.html');

test.describe('Unified step controls — Run/Pause/Resume + Speed', () => {
    test.beforeEach(async ({ page }) => {
        // Each Playwright test gets a fresh context (no localStorage bleed), so we only
        // set the language here. Do NOT removeItem the speed key — addInitScript re-runs on
        // page.reload(), which would wipe the value the persistence test is verifying.
        await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
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
        // Confirm the value was actually persisted before reloading — otherwise a
        // reload that races the input handler leaves nothing to restore and the
        // slider comes back at its default (the CI flake this guards against).
        await expect.poll(() => page.evaluate(() => localStorage.getItem('dsvisual.stepSpeed.graph-aoe'))).toBe('123');
        await page.reload();
        await loadMethod(page, 'graph-aoe');
        await expect(page.locator('[data-method-section="graph-aoe"] .stepctl .stepctl-speed')).toHaveValue('123');
    });
});
