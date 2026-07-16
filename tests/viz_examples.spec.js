const { test, expect } = require('@playwright/test');
const { loadMethod } = require('./helpers');
const path = require('path');

const fileUri = 'file://' + path.resolve(__dirname, '../index.html');

test('matrix-sparse-list saves input as example and restores it', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'matrix-sparse-list');
  const card = page.locator('[data-method-section="matrix-sparse-list"]');
  const special = '9,0;0,9';
  await card.locator('.msl-input').fill(special);
  await card.locator('.msl-build').click();
  await expect(card.locator('.ex-select option', { hasText: '9,0;0,9' })).toHaveCount(1);
  await card.locator('.msl-input').fill('1,1;1,1');
  await card.locator('.ex-select').selectOption(special);
  await expect(card.locator('.msl-input')).toHaveValue(special);
});

test('list-equivalence saves input as example and restores it', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'list-equivalence');
  const card = page.locator('[data-method-section="list-equivalence"]');
  await card.locator('.eq-n').fill('4');
  await card.locator('.eq-pairs').fill('0=1,2=3');
  await card.locator('.eq-build').click();
  expect(await card.locator('.ex-select option').count()).toBeGreaterThanOrEqual(3);
  await card.locator('.eq-pairs').fill('0=3');
  await card.locator('.ex-select').selectOption('4|0=1,2=3');
  await expect(card.locator('.eq-pairs')).toHaveValue('0=1,2=3');
  await expect(card.locator('.eq-n')).toHaveValue('4');
});
