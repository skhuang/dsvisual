const { test, expect } = require('@playwright/test');
const path = require('path');
const FILE_URI = 'file://' + path.resolve(__dirname, '../index.html');

test.describe('design patterns are step-able with visual highlighting', () => {
  test('pattern-builder steps and highlights', async ({ page }) => {
    await page.goto(FILE_URI + '#m=pattern-builder');
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

  test('a non-stepped pattern keeps its Visualize button', async ({ page }) => {
    await page.goto(FILE_URI + '#m=pattern-singleton');
    await expect(page.locator('#btn-pattern-demo')).toBeVisible();
    await expect(page.locator('.pattern-step-controls')).toHaveCount(0);
  });
});
