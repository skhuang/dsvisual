const { test, expect } = require('@playwright/test');
const { loadMethod } = require('./helpers');
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

test('random button on binary search observatory honors difficulty', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'search-binary');

  await openSettings(page);
  await page.locator('#input-difficulty').selectOption('edge');
  await page.click('#settings-drawer .settings-drawer-close');

  const card = page.locator('[data-method-section="search-binary"]');
  const input = card.locator('.searchviz-arr');
  const before = await input.inputValue();
  await expectRandomizes(card.locator('.rand-btn'), input, before);
  await expect(card.locator('.searchviz-stage .search-cell').first()).toBeVisible();
});

test('Randomize (🎲) on sort observatory honors large difficulty (>15 bars)', async ({ page }) => {
  await page.goto(fileUri);
  // All sorts now use the dynamic renderSort host: a .sortviz-stage of .sort-bar
  // elements plus a 🎲 .rand-btn that pulls a fresh RandomInput array.
  await loadMethod(page, 'sort-radix');

  await openSettings(page);
  await page.locator('#input-difficulty').selectOption('large');
  await page.click('#settings-drawer .settings-drawer-close');

  const card = page.locator('[data-method-section="sort-radix"]');
  const bars = card.locator('.sortviz-stage .sort-bar');
  // Default input renders a small array; large difficulty randomizes to 18-24 values
  // (parseArr caps at 20), so the 🎲 re-render must yield well over 15 bars.
  await expect.poll(async () => await bars.count()).toBeGreaterThan(1);
  await card.locator('.rand-btn').click();
  await expect.poll(async () => await bars.count()).toBeGreaterThan(15);
});

test('random button on search-fibonacci changes the input field', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'search-fibonacci');

  const section = page.locator('[data-method-section="search-fibonacci"]');
  const input = section.locator('.searchviz-arr');
  const before = await input.inputValue();
  await expectRandomizes(section.locator('.rand-btn'), input, before);
});

test('random button on tree-radix changes the rendered edges and honors large difficulty', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'tree-radix');

  const randomBtn = page.locator('[data-testid="text-tree-random"]');
  const edges = page.locator('#advanced-tree-container .edge-label');

  const before = (await edges.allTextContents()).join(',');
  await expect(async () => {
    await randomBtn.click();
    const after = (await edges.allTextContents()).join(',');
    expect(after).not.toBe(before);
  }).toPass({ timeout: 5000 });

  await openSettings(page);
  await page.locator('#input-difficulty').selectOption('normal');
  await page.click('#settings-drawer .settings-drawer-close');
  await randomBtn.click();
  const normalCount = await edges.count();

  await openSettings(page);
  await page.locator('#input-difficulty').selectOption('large');
  await page.click('#settings-drawer .settings-drawer-close');
  await randomBtn.click();
  const largeCount = await edges.count();

  expect(largeCount).toBeGreaterThan(normalCount);
});

test('random button on tree-btree changes the rendered keys and honors large difficulty', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'tree-btree');

  const randomBtn = page.locator('[data-testid="tree-random"]');
  const keys = page.locator('#advanced-tree-container .key');

  const before = (await keys.allTextContents()).join(',');
  await expect(async () => {
    await randomBtn.click();
    const after = (await keys.allTextContents()).join(',');
    expect(after).not.toBe(before);
  }).toPass({ timeout: 5000 });

  await openSettings(page);
  await page.locator('#input-difficulty').selectOption('normal');
  await page.click('#settings-drawer .settings-drawer-close');
  await randomBtn.click();
  const normalCount = await keys.count();

  await openSettings(page);
  await page.locator('#input-difficulty').selectOption('large');
  await page.click('#settings-drawer .settings-drawer-close');
  await randomBtn.click();
  const largeCount = await keys.count();

  expect(largeCount).toBeGreaterThan(normalCount);
});

test('random button on tree-fenwick changes the input field and honors large difficulty', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'tree-fenwick');

  const section = page.locator('[data-method-section="tree-fenwick"]');
  const input = section.locator('.fenwick-input');
  const before = await input.inputValue();
  await expectRandomizes(section.locator('.rand-btn'), input, before);

  const cells = section.locator('.fenwick-cell');

  await openSettings(page);
  await page.locator('#input-difficulty').selectOption('normal');
  await page.click('#settings-drawer .settings-drawer-close');
  await section.locator('.rand-btn').click();
  const normalCount = await cells.count();

  await openSettings(page);
  await page.locator('#input-difficulty').selectOption('large');
  await page.click('#settings-drawer .settings-drawer-close');
  await section.locator('.rand-btn').click();
  const largeCount = await cells.count();

  expect(largeCount).toBeGreaterThan(normalCount);
});

test('random button on tree-segment changes the tree and honors the <=8-leaf cap', async ({ page }) => {
  await page.goto(fileUri);
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));

  await loadMethod(page, 'tree-segment');

  const section = page.locator('[data-method-section="tree-segment"]');
  const input = section.locator('.segtree-input');
  const nodes = section.locator('.segtree-node');
  const before = await input.inputValue();
  await expectRandomizes(section.locator('.rand-btn'), input, before);

  // Step through the query/update phases at this randomized (very likely n!=8)
  // array, so the generalized ql/qr/ul/ur formulas run in the browser at n!=8,
  // not just by hand-proof — and the fixed POS-table gap-skip branch fires.
  // Frame count per phase varies with the recursion shape, so just drive the
  // transport to the end via the scrubber and assert it got there cleanly.
  const phase = section.locator('[data-testid="segtree-phase"]');
  await expect(phase).toContainText('Ready');
  const max = parseInt(await section.locator('.stepctl-scrubber').getAttribute('max'), 10);
  const stepBtn = section.locator('.stepctl [data-action="step"]');
  for (let i = 0; i < max; i++) await stepBtn.click();
  await expect(phase).toContainText('Phase 3');
  await expect(nodes.first()).toBeVisible();

  await openSettings(page);
  await page.locator('#input-difficulty').selectOption('normal');
  await page.click('#settings-drawer .settings-drawer-close');
  await section.locator('.rand-btn').click();
  const normalCount = await nodes.count();

  await openSettings(page);
  await page.locator('#input-difficulty').selectOption('large');
  await page.click('#settings-drawer .settings-drawer-close');
  await section.locator('.rand-btn').click();
  const largeCount = await nodes.count();

  // 'large' always fills all 8 leaves -> all 15 node-table slots are visited
  // (no gaps); 'normal' (4-6 leaves) always renders strictly fewer.
  expect(largeCount).toBe(15);
  expect(largeCount).toBeGreaterThan(normalCount);
  expect(largeCount).toBeLessThanOrEqual(15); // never overflows the fixed 15-node table

  expect(errors).toEqual([]);
});

test('random button on tree-catalan changes n and honors the 0..4 button range at large', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'tree-catalan');

  const section = page.locator('[data-method-section="tree-catalan"]');
  const activeBtn = section.locator('.cat-nbtn.active');
  const shapes = section.locator('.cat-shapes svg.cat-shape');

  const before = await activeBtn.textContent();
  await expect(async () => {
    await section.locator('.rand-btn').click();
    expect(await activeBtn.textContent()).not.toBe(before);
  }).toPass({ timeout: 5000 });

  await openSettings(page);
  await page.locator('#input-difficulty').selectOption('large');
  await page.click('#settings-drawer .settings-drawer-close');
  await section.locator('.rand-btn').click();
  // 'large' always draws n=4 (the UI's own max button) -> C4 = 14 shapes total once
  // every group step has been shown (the step workbench starts at step 0, i.e. only
  // the first split group, so drive the scrubber to the end first).
  await expect(activeBtn).toHaveText('n=4');
  const max = parseInt(await section.locator('.stepctl-scrubber').getAttribute('max'), 10);
  const stepBtn = section.locator('.stepctl [data-action="step"]');
  for (let i = 0; i < max; i++) await stepBtn.click();
  await expect.poll(async () => await shapes.count()).toBe(14);
});

test('random button on heap-binary changes the rendered nodes and honors large difficulty', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'heap-binary');

  const randomBtn = page.locator('[data-testid="heap-random"]');
  const nodes = page.locator('.heap-node');

  const before = (await nodes.allTextContents()).join(',');
  await expect(async () => {
    await randomBtn.click();
    const after = (await nodes.allTextContents()).join(',');
    expect(after).not.toBe(before);
  }).toPass({ timeout: 5000 });

  await openSettings(page);
  await page.locator('#input-difficulty').selectOption('normal');
  await page.click('#settings-drawer .settings-drawer-close');
  await randomBtn.click();
  const normalCount = await nodes.count();

  await openSettings(page);
  await page.locator('#input-difficulty').selectOption('large');
  await page.click('#settings-drawer .settings-drawer-close');
  await randomBtn.click();
  const largeCount = await nodes.count();

  expect(largeCount).toBeGreaterThan(normalCount);
});
