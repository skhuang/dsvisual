const { test, expect } = require('@playwright/test');
const { loadMethod } = require('./helpers');
const path = require('path');
const FILE_URL = 'file://' + path.resolve(__dirname, '../index.html');

test('frame-controls counter shows 步/Step i / last and clamps at ends', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URL);
    await loadMethod(page, 'graph-aoe');
    const sec = page.locator('[data-method-section="graph-aoe"]');
    const cnt = sec.locator('.stepctl .stepctl-count');
    const step = sec.locator('.stepctl [data-action="step"]');
    const back = sec.locator('.stepctl [data-action="back"]');
    await expect(cnt).toContainText('Step 0 /');
    await back.click();                              // clamp at 0
    await expect(cnt).toContainText('Step 0 /');
    for (let i = 0; i < 40; i++) await step.click(); // clamp at last
    const scrub = sec.locator('.stepctl .stepctl-scrubber');
    const last = await scrub.getAttribute('max');
    await expect(cnt).toContainText('Step ' + last + ' / ' + last);
});
