const { test, expect } = require('@playwright/test');
const { loadMethod } = require('./helpers');
const path = require('path');

const fileUri = 'file://' + path.resolve(__dirname, '../index.html');

test('recursion loads, shows tree + stack, switches example, steps', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'recursion');
  const card = page.locator('[data-method-section="recursion"]');
  await expect(card).toHaveAttribute('data-runtime-state', 'active');
  await expect(card.locator('.rec-tree .tree-node').first()).toBeVisible();
  await expect(card.locator('.rec-stack').first()).toBeVisible();
  await card.locator('.rec-example').selectOption('quicksort');
  await card.locator('.rec-build').click();
  await card.locator('[data-action="step"]').click();
});

test('recursion guards empty input (no calls) without a blank pane', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'recursion');
  const card = page.locator('[data-method-section="recursion"]');
  await card.locator('.rec-example').selectOption('quicksort');
  await card.locator('.rec-arr').fill('');
  await card.locator('.rec-build').click();
  await expect(card.locator('.rec-tree')).toContainText('No recursive calls for this input.');
  await expect(card.locator('.rec-tree .tree-node')).toHaveCount(0);
});

test('recursion viz stays within its container (no clip) and scrolls wide trees', async ({ page }) => {
  await page.setViewportSize({ width: 700, height: 900 });
  await page.goto(fileUri);
  await loadMethod(page, 'recursion');
  await page.locator('[data-method-section="recursion"] .rec-example').selectOption('fibonacci');
  await page.locator('[data-method-section="recursion"] .rec-build').click();
  const m = await page.evaluate(() => {
    const wrap = document.querySelector('.stack-container-wrapper');
    const host = document.getElementById('dynamic-viz-host');
    const tree = document.querySelector('.rec-tree');
    return { wrapW: wrap.clientWidth, hostW: host.offsetWidth, treeClientW: tree.clientWidth, treeScrollW: tree.scrollWidth };
  });
  // host must fit inside its container — no center-clipping of the call tree
  expect(m.hostW).toBeLessThanOrEqual(m.wrapW + 1);
  // the wide fibonacci tree must remain reachable via internal horizontal scroll, not cut off
  expect(m.treeScrollW).toBeGreaterThan(m.treeClientW);
});
