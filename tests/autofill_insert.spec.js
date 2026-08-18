// Auto-fill the single insert-value field with a fresh random value, matching the existing
// stack/queue (linear.js randStdValue()) and AVL/RB tree (tree.js randKey()) idiom, for the six
// structures that previously shipped with a fixed/hardcoded default: heap, hash, deque, bloom
// filter, skip list, and count-min sketch.
const { test, expect } = require('@playwright/test');
const { loadMethod } = require('./helpers');
const path = require('path');

const fileUri = 'file://' + path.resolve(__dirname, '../index.html');

// A randomizer can legitimately regenerate the same value by chance, so a single click + strict
// inequality assertion is inherently flaky. Re-click until the value changes: a working
// randomizer does so within a few clicks, a broken one never will, so this still fails on a
// genuinely dead refill. Mirrors tests/random_input.spec.js's expectRandomizes helper.
async function expectRandomizes(clickTarget, valueLocator, before) {
  await expect(async () => {
    await clickTarget.click();
    expect(await valueLocator.inputValue()).not.toBe(before);
  }).toPass({ timeout: 5000 });
}

function isValidInt1to99(v) {
  const n = Number(v);
  return Number.isInteger(n) && n >= 1 && n <= 99;
}

function isValidWord(v) {
  return typeof v === 'string' && /^[a-z]+$/.test(v.trim());
}

test('heap: #heap-val auto-fills a random 1..99 value on load and after a successful insert', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'heap-binary');

  const input = page.locator('#heap-val');
  const before = await input.inputValue();
  expect(isValidInt1to99(before)).toBe(true);

  await expectRandomizes(page.locator('#btn-heap-insert'), input, before);
  expect(isValidInt1to99(await input.inputValue())).toBe(true);
});

test('heap tutorial: #heap-val shows the tutorial-driven step value, not an auto-filled random one', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'heap-binary');

  await page.click('#btn-heap-tutorial');
  // Tutorial step 1 ("Create the first root") drives #heap-val to '12' — auto-fill must not
  // override this at tutorial start.
  await expect(page.locator('#heap-val')).toHaveValue('12');

  // Insert with the tutorial-driven value: the insert succeeds, the tutorial advances to step 2
  // ("Bubble up a better key"), and #heap-val must show *that* step's value ('7') — the
  // tutorialDriving gate in btn-heap-insert's handler must have skipped the random refill.
  await page.click('#btn-heap-insert');
  await expect(page.locator('#heap-val')).toHaveValue('7');
});

test('hash: #hash-val auto-fills a random 1..99 value on load and after a successful insert', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'hash-chain');
  // See random_input.spec.js's hash-chain test: move the mouse off the nav first so a leftover
  // hover-opened flyout from loadMethod's last click doesn't intercept the click below.
  await page.mouse.move(50, 900);

  const input = page.locator('#hash-val');
  const before = await input.inputValue();
  expect(isValidInt1to99(before)).toBe(true);

  await expectRandomizes(page.locator('#btn-hash-add'), input, before);
  expect(isValidInt1to99(await input.inputValue())).toBe(true);
});

test('deque: [data-deque-val] auto-fills a random 1..99 value on load and after a successful insert', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'deque');

  const section = page.locator('[data-method-section="deque"]');
  const input = section.locator('[data-deque-val]');
  const before = await input.inputValue();
  expect(isValidInt1to99(before)).toBe(true);

  await expectRandomizes(section.locator('[data-action="push-front"]'), input, before);
  expect(isValidInt1to99(await input.inputValue())).toBe(true);
});

test('bloom filter: [data-bloom-val] auto-fills a random word on load and after a successful insert', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'bloom-filter');

  const section = page.locator('[data-method-section="bloom-filter"]');
  const input = section.locator('[data-bloom-val]');
  const before = await input.inputValue();
  expect(isValidWord(before)).toBe(true);

  await expectRandomizes(section.locator('[data-action="bloom-insert"]'), input, before);
  expect(isValidWord(await input.inputValue())).toBe(true);
});

test('skip-list: [data-skiplist-val] auto-fills a random 1..99 value on load and after a successful insert', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'skip-list');

  const section = page.locator('[data-method-section="skip-list"]');
  const input = section.locator('[data-skiplist-val]');
  const initial = await input.inputValue();
  expect(isValidInt1to99(initial)).toBe(true);

  // Use a value guaranteed not to collide with the skip-list's default seeded keys
  // (3, 7, 12, 19, 25) so the insert always succeeds and the refill-under-test actually fires,
  // rather than occasionally hitting the ~5% chance the auto-filled default is already a key.
  await input.fill('37');
  await expectRandomizes(section.locator('[data-action="skiplist-insert"]'), input, '37');
  expect(isValidInt1to99(await input.inputValue())).toBe(true);

  // [data-skiplist-search] is a separate field and must be left untouched by this feature.
  await expect(section.locator('[data-skiplist-search]')).toHaveValue('12');
});

test('count-min sketch: [data-cms-val] auto-fills a random word on load and after a successful add', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'count-min-sketch');

  const section = page.locator('[data-method-section="count-min-sketch"]');
  const input = section.locator('[data-cms-val]');
  const before = await input.inputValue();
  expect(isValidWord(before)).toBe(true);

  await expectRandomizes(section.locator('[data-action="cms-add"]'), input, before);
  expect(isValidWord(await input.inputValue())).toBe(true);
});

// Regression: deque/skip-list/CMS render functions are the modules' VizRegistry.render() hooks,
// which fire again on every navigate-away/navigate-back (not just on mount/insert). A typed value
// must survive that re-render, not get replaced by a fresh random one — mirrors the persistence
// viz_bloom.js already had via _bloomState.inputVal.
test('skip-list: a typed insert value survives navigating away and back (not re-randomized on re-render)', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'skip-list');

  const section = page.locator('[data-method-section="skip-list"]');
  const input = section.locator('[data-skiplist-val]');
  await input.fill('43');
  await expect(input).toHaveValue('43');

  await loadMethod(page, 'heap-binary');
  await loadMethod(page, 'skip-list');

  await expect(section.locator('[data-skiplist-val]')).toHaveValue('43');
});

test('deque: a typed insert value survives navigating away and back (not re-randomized on re-render)', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'deque');

  const section = page.locator('[data-method-section="deque"]');
  const input = section.locator('[data-deque-val]');
  await input.fill('43');
  await expect(input).toHaveValue('43');

  await loadMethod(page, 'heap-binary');
  await loadMethod(page, 'deque');

  await expect(section.locator('[data-deque-val]')).toHaveValue('43');
});

test('count-min sketch: a typed insert value survives navigating away and back (not re-randomized on re-render)', async ({ page }) => {
  await page.goto(fileUri);
  await loadMethod(page, 'count-min-sketch');

  const section = page.locator('[data-method-section="count-min-sketch"]');
  const input = section.locator('[data-cms-val]');
  await input.fill('zzzqx');
  await expect(input).toHaveValue('zzzqx');

  await loadMethod(page, 'heap-binary');
  await loadMethod(page, 'count-min-sketch');

  await expect(section.locator('[data-cms-val]')).toHaveValue('zzzqx');
});
