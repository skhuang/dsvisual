// tests/viz_deeplink.spec.js
const { test, expect } = require('@playwright/test');
const path = require('path');

const fileUri = 'file://' + path.resolve(__dirname, '../index.html');

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
});

test('deep-link #m=deque opens the deque visualizer', async ({ page }) => {
  await page.goto(fileUri + '#m=deque');
  await expect(page.locator('[data-method-section="deque"]')).toHaveAttribute('data-runtime-state', 'active');
});

test('no hash keeps the default (stack-array) active', async ({ page }) => {
  await page.goto(fileUri);
  await expect(page.locator('[data-method-section="stack-array"]')).toHaveAttribute('data-runtime-state', 'active');
});

test('unknown #m=nope falls back to the default, no error', async ({ page }) => {
  await page.goto(fileUri + '#m=nope');
  await expect(page.locator('[data-method-section="stack-array"]')).toHaveAttribute('data-runtime-state', 'active');
});

test('selecting a method updates the URL hash (bonus)', async ({ page }) => {
  await page.goto(fileUri);
  const navItem = page.locator('.category-nav-item:has(.category-nav-method[data-method-id="deque"])');
  await navItem.locator('.category-nav-btn').click();
  await navItem.locator('.category-nav-method[data-method-id="deque"]').click();
  await expect(page).toHaveURL(/#m=deque$/);
});
