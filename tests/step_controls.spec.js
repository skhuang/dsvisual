const { test, expect } = require('@playwright/test');
const { loadMethod } = require('./helpers');
const path = require('path');
const FILE_URL = 'file://' + path.resolve(__dirname, '../index.html');

test.describe('VCR frame controls', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
        await page.goto(FILE_URL);
        await loadMethod(page, 'graph-aoe');
    });

    test('forward/back/reset/scrubber move the position counter; back reproduces a prior frame', async ({ page }) => {
        const sec = page.locator('[data-method-section="graph-aoe"]');
        const cnt = sec.locator('.stepctl .stepctl-count');
        const step = sec.locator('.stepctl [data-action="step"]');
        const back = sec.locator('.stepctl [data-action="back"]');
        await expect(cnt).toContainText('0 /');
        const phase0 = await sec.locator('.aoe-phase').textContent();
        await step.click();
        await expect(cnt).toContainText('1 /');
        const phase1 = await sec.locator('.aoe-phase').textContent();
        expect(phase1).not.toBe(phase0);
        await back.click();                         // instant backward
        await expect(cnt).toContainText('0 /');
        await expect(sec.locator('.aoe-phase')).toHaveText(phase0);   // exact prior frame reproduced
        // scrubber jumps to the end
        const scrub = sec.locator('.stepctl .stepctl-scrubber');
        const last = await scrub.getAttribute('max');
        await scrub.evaluate((el) => { el.value = el.max; el.dispatchEvent(new Event('input', { bubbles: true })); });
        await expect(cnt).toContainText(last + ' / ' + last);
        // reset returns to start
        await sec.locator('.stepctl [data-action="reset"]').click();
        await expect(cnt).toContainText('0 /');
    });

    test('Run auto-advances then pauses; toggling run stops progress', async ({ page }) => {
        const sec = page.locator('[data-method-section="graph-aoe"]');
        const runBtn = sec.locator('.stepctl [data-action="run"]');
        const cnt = sec.locator('.stepctl .stepctl-count');
        await sec.locator('.stepctl .stepctl-speed').evaluate((el) => { el.value = '510'; el.dispatchEvent(new Event('input', { bubbles: true })); });
        await runBtn.click();
        const a = await cnt.textContent();
        await page.waitForTimeout(400);
        const b = await cnt.textContent();
        expect(b).not.toBe(a);                      // advanced while running
        await runBtn.click();                       // pause
        const c = await cnt.textContent();
        await page.waitForTimeout(400);
        expect(await cnt.textContent()).toBe(c);    // stopped
    });

    test('Speed slider value persists per visualization across reload', async ({ page }) => {
        const sec = page.locator('[data-method-section="graph-aoe"]');
        await sec.locator('.stepctl .stepctl-speed').evaluate((el) => { el.value = '123'; el.dispatchEvent(new Event('input', { bubbles: true })); });
        await expect.poll(() => page.evaluate(() => localStorage.getItem('dsvisual.stepSpeed.graph-aoe'))).toBe('123');
        await page.reload();
        await loadMethod(page, 'graph-aoe');
        await expect(page.locator('[data-method-section="graph-aoe"] .stepctl .stepctl-speed')).toHaveValue('123');
    });
});
