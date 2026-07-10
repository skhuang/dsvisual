const { test, expect } = require('@playwright/test');
const path = require('path');

const fileUri = 'file://' + path.resolve(__dirname, '../index.html');

async function openSettings(page) {
  await page.click('#settings-toggle');
  await expect(page.locator('#settings-drawer')).toBeVisible();
}

// A randomizer can legitimately regenerate the same value by chance, so a single
// click + strict-inequality assertion is inherently flaky (this is what tripped
// random_input.spec.js:83 on CI, including on main). Re-click until the value
// changes: a working randomizer does so within a few clicks, a broken one never
// will, so this still fails on a genuinely dead button.
async function expectRandomizes(clickTarget, valueLocator, before) {
  await expect(async () => {
    await clickTarget.click();
    expect(await valueLocator.inputValue()).not.toBe(before);
  }).toPass({ timeout: 5000 });
}

test('difficulty is remembered per category and persists across reload', async ({ page }) => {
  await page.goto(fileUri);
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await openSettings(page);
  const sel = page.locator('#input-difficulty');
  await expect(sel).toHaveValue('normal');
  await sel.selectOption('large');
  await page.click('#settings-drawer .settings-drawer-close');

  await page.reload();
  await openSettings(page);
  await expect(page.locator('#input-difficulty')).toHaveValue('large');

  const stored = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('dsvisual.inputDifficulty.')));
  expect(stored.length).toBeGreaterThanOrEqual(1);
});

async function loadMethod(page, methodId) {
  const navItem = page.locator(
    `.category-nav-item:has(.category-nav-method[data-method-id="${methodId}"])`);
  await navItem.locator('.category-nav-btn').click();
  await navItem.locator(`.category-nav-method[data-method-id="${methodId}"]`).click();
  const card = page.locator(`[data-method-section="${methodId}"]`);
  await expect(card).toHaveAttribute('data-runtime-state', 'active');
}

test('random button on tree-traversal changes the input field', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'tree-traversal');

  const section = page.locator('[data-method-section="tree-traversal"]');
  const input = section.locator('.tt-input');
  const before = await input.inputValue();
  await expectRandomizes(section.locator('.rand-btn'), input, before);
});

test('random button on matrix-sparse changes the input field', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'matrix-sparse');

  const section = page.locator('[data-method-section="matrix-sparse"]');
  const input = section.locator('.sm-input');
  const before = await input.inputValue();
  await expectRandomizes(section.locator('.rand-btn'), input, before);
});

test('random button on list-doubly changes the input field', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'list-doubly');

  const section = page.locator('[data-method-section="list-doubly"]');
  const input = section.locator('.dl-input');
  const before = await input.inputValue();
  await expectRandomizes(section.locator('.rand-btn'), input, before);
});

test('random button on old binary search updates target + array', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'search-binary');

  await openSettings(page);
  await page.locator('#input-difficulty').selectOption('edge');
  await page.click('#settings-drawer .settings-drawer-close');

  const target = page.locator('#search-val');
  const before = await target.inputValue();
  await expectRandomizes(page.locator('#btn-search-random'), target, before);
  await expect(page.locator('#search-array .s-slot').first()).toBeVisible();
});

test('Randomize on sort visualizer honors large difficulty (>15 bars)', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'sort-bubble');

  await openSettings(page);
  await page.locator('#input-difficulty').selectOption('large');
  await page.click('#settings-drawer .settings-drawer-close');

  await page.click('#btn-sort-random');

  const bars = page.locator('#sort-container .sort-bar');
  await expect.poll(async () => await bars.count()).toBeGreaterThan(15);
});

test('random button on search-fibonacci changes the input field', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'search-fibonacci');

  const section = page.locator('[data-method-section="search-fibonacci"]');
  const input = section.locator('.ss-arr');
  const before = await input.inputValue();
  await expectRandomizes(section.locator('.rand-btn'), input, before);
});
