const { test, expect } = require('@playwright/test'); const path = require('path');
const FILE_URI = 'file://' + path.resolve(__dirname, '../index.html');

test.describe('viz fullscreen focus mode', () => {
  test('CSS layer: toggling body.viz-focus hides chrome and reveals exit button', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=graph-scc');
    await expect(page.locator('.method-section-visual').first()).toBeVisible();

    // Baseline: chrome visible, exit button hidden.
    await expect(page.locator('.app-header')).toBeVisible();
    await expect(page.locator('.app-category-nav')).toBeVisible();
    await expect(page.locator('#viz-focus-exit')).toBeHidden();

    // Drive the CSS layer directly (no JS wiring yet).
    await page.evaluate(() => document.body.classList.add('viz-focus'));
    await expect(page.locator('.app-header')).toBeHidden();
    await expect(page.locator('.app-category-nav')).toBeHidden();
    await expect(page.locator('#viz-focus-exit')).toBeVisible();
    await expect(page.locator('.method-section-card.active .method-section-visual')).toBeVisible();

    await page.evaluate(() => document.body.classList.remove('viz-focus'));
    await expect(page.locator('.app-header')).toBeVisible();
    await expect(page.locator('#viz-focus-exit')).toBeHidden();
  });
});
