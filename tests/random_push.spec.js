const { test, expect } = require('@playwright/test');
const path = require('path');

const fileUri = 'file://' + path.resolve(__dirname, '../index.html');

async function loadMethod(page, methodId) {
  const navItem = page.locator(
    `.category-nav-item:has(.category-nav-method[data-method-id="${methodId}"])`);
  await navItem.locator('.category-nav-btn').click();
  await navItem.locator(`.category-nav-method[data-method-id="${methodId}"]`).click();
  const card = page.locator(`[data-method-section="${methodId}"]`);
  await expect(card).toHaveAttribute('data-runtime-state', 'active');
}

function readVal(page) { return page.locator('#std-value').inputValue(); }
function inRange(v) { const n = parseInt(v, 10); return Number.isInteger(n) && n >= 1 && n <= 99; }

test('stack-array std-value re-randomizes across pushes', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'stack-array');
  expect(inRange(await readVal(page))).toBe(true);
  const seen = new Set();
  for (let i = 0; i < 8; i++) {
    const v = await readVal(page);
    expect(inRange(v)).toBe(true);
    seen.add(v);
    await page.click('#btn-std-add');
  }
  // Fixed default (10) => seen.size === 1. Random => almost always >1 across 8 draws.
  expect(seen.size).toBeGreaterThan(1);
});

test('queue std-value re-randomizes across enqueues', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'queue');
  const seen = new Set();
  for (let i = 0; i < 8; i++) {
    const v = await readVal(page);
    expect(inRange(v)).toBe(true);
    seen.add(v);
    await page.click('#btn-std-add');
  }
  expect(seen.size).toBeGreaterThan(1);
});
