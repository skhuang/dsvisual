const { test, expect } = require('@playwright/test');
const { loadMethod } = require('./helpers');
const path = require('path');

const fileUri = 'file://' + path.resolve(__dirname, '../index.html');

test('matrix-sparse-list loads, builds, steps, toggles transpose, randomizes', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'matrix-sparse-list');
  const card = page.locator('[data-method-section="matrix-sparse-list"]');
  await expect(card).toHaveAttribute('data-runtime-state', 'active');
  await expect(card.locator('.msl-stage').first()).toBeVisible();
  await expect(card.locator('.msl-node').first()).toBeVisible();
  await card.locator('[data-action="step"]').click();
  await card.locator('.msl-phase-btn').click();
  await expect(card.locator('.msl-node').first()).toBeVisible();
  await card.locator('.rand-btn').click();
});
