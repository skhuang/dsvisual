const { test, expect } = require('@playwright/test');
const path = require('path');
const FILE_URI = 'file://' + path.resolve(__dirname, '../index.html');
const STEPPED = ['pattern-builder', 'pattern-command', 'pattern-composite', 'pattern-singleton', 'pattern-factory', 'pattern-adapter', 'pattern-decorator', 'pattern-observer', 'pattern-strategy', 'pattern-mvc', 'pattern-layered', 'pattern-pubsub', 'pattern-pipefilter', 'pattern-di'];
for (const id of STEPPED) {
  test(`${id} is step-able with visual highlighting`, async ({ page }) => {
    await page.goto(FILE_URI + '#m=' + id);
    const controls = page.locator('.pattern-step-controls');
    await expect(controls).toBeVisible();
    await expect(page.locator('#btn-pattern-demo')).toBeHidden();
    const badge = page.locator('#pattern-svg .pattern-step-badge');
    await expect(badge).toContainText('Step 1/');
    await expect(page.locator('#pattern-svg rect.pattern-step-active').first()).toBeVisible();
    await expect(page.locator('#pattern-svg rect.pattern-step-dim').first()).toBeVisible();
    await controls.locator('[data-action="step"]').click();
    await expect(badge).toContainText('Step 2/');
    await controls.locator('[data-action="reset"]').click();
    await expect(badge).toContainText('Step 1/');
  });
}
