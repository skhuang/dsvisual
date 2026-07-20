const { test, expect } = require('@playwright/test');
const path = require('path');
const FILE_URI = 'file://' + path.resolve(__dirname, '../index.html');

async function optionValues(page) {
  return page.$$eval('#pattern-mode-select option', (os) => os.map((o) => o.value));
}

test.describe('pattern menu is scoped to the current category', () => {
  // NOTE (patterns-registry refactor, Task 4): the pattern-registry migration (Tasks 1-3,
  // already committed) added 3 new patterns — builder, command, composite — into the
  // *existing* creational/behavioral/structural categories. The menu is scoped to a
  // pattern's whole category (PatternsDB.patternsByCategory), so a new category member is,
  // by design, now visible alongside the 2 originally-migrated ones. The 11 migrated
  // patterns keep their pre-refactor relative order; the new one is appended last.
  test('creational → singleton, factory, builder', async ({ page }) => {
    await page.goto(FILE_URI + '#m=pattern-singleton');
    await expect(page.locator('#pattern-mode-select')).toBeVisible();
    expect(await optionValues(page)).toEqual(['singleton', 'factory', 'builder']);
    await expect(page.locator('#pattern-mode-select')).toHaveValue('singleton');
  });

  test('behavioral → observer, strategy, command', async ({ page }) => {
    await page.goto(FILE_URI + '#m=pattern-observer');
    expect(await optionValues(page)).toEqual(['observer', 'strategy', 'command']);
    await expect(page.locator('#pattern-mode-select')).toHaveValue('observer');
  });

  test('architectural → its five patterns', async ({ page }) => {
    await page.goto(FILE_URI + '#m=pattern-mvc');
    expect(await optionValues(page)).toEqual(['mvc', 'layered', 'pubsub', 'pipefilter', 'di']);
    await expect(page.locator('#pattern-mode-select')).toHaveValue('mvc');
  });
});
