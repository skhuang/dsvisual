const { test, expect } = require('@playwright/test');
const path = require('path');
const FILE_URI = 'file://' + path.resolve(__dirname, '../index.html');

const ALL = ['pattern-singleton','pattern-factory','pattern-builder','pattern-adapter','pattern-decorator','pattern-composite','pattern-observer','pattern-strategy','pattern-command','pattern-mvc','pattern-layered','pattern-pubsub','pattern-pipefilter','pattern-di'];

test('every pattern (11 migrated + 3 new) loads and renders an svg', async ({ page }) => {
  const errors = []; page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  for (const id of ALL) {
    await page.goto(FILE_URI + '#m=' + id);
    await expect(page.locator('#pattern-svg')).toBeVisible();
    await expect.poll(() => page.locator('#pattern-svg *').count()).toBeGreaterThan(0);
  }
  expect(errors).toEqual([]);
});

test('new patterns appear in the category-scoped menu', async ({ page }) => {
  await page.goto(FILE_URI + '#m=pattern-builder');
  expect(await page.$$eval('#pattern-mode-select option', (o) => o.map((x) => x.value))).toEqual(['singleton', 'factory', 'builder']);
  await page.goto(FILE_URI + '#m=pattern-command');
  expect(await page.$$eval('#pattern-mode-select option', (o) => o.map((x) => x.value))).toEqual(['observer', 'strategy', 'command']);
});
