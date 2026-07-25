const { test, expect } = require('@playwright/test'); const path = require('path');
const FILE_URI = 'file://' + path.resolve(__dirname, '../index.html');
test.describe('graph-matrix', () => {
  test('stepped build fills matrix + highlights edge; toggles + degree', async ({ page }) => {
    await page.goto(FILE_URI + '#m=graph-matrix');
    const host = page.locator('.gm-wrap');
    await expect(host).toBeVisible();
    await expect(page.locator('.gm-matrix .gm-cell').first()).toBeVisible();
    // step advances and lights a cell
    await page.locator('.stepctl [data-action="step"]').click();
    await expect(page.locator('.gm-matrix .gm-cell.gm-added').first()).toBeVisible();
    // directed toggle → asymmetry class/marker present; degree row visible
    await page.locator('.gm-directed').check();
    await expect(page.locator('.gm-degree').first()).toBeVisible();
    // code hidden until drawer toggled
    await expect(page.locator('[data-method-section="graph-matrix"] .code-drawer-toggle')).toBeVisible();
  });
});
