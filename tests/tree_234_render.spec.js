const { test, expect } = require('@playwright/test');
const path = require('path');
const FILE_URI = 'file://' + path.resolve(__dirname, '../index.html');

// Regression guard for the render(container) → render() host-acquisition bug:
// renderAll() invokes a viz's render() with no argument, so the viz must
// acquire its own dynamic host. Previously tree-234 read container.querySelector
// on an undefined argument and threw before drawing anything.
const scrubTo = async (page, value) => {
  await page.locator('.stepctl .stepctl-scrubber').evaluate((element, target) => {
    element.value = target === null ? element.max : String(target);
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
};

test.describe('tree-234 render', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try { localStorage.setItem('dsvisual-lang', 'en'); } catch (error) { /* ignore */ }
    });
  });

  test('selecting 2-3-4 tree renders the SVG without throwing', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(FILE_URI + '#m=tree-234');

    // render() must acquire its own host and lay out the controls + SVG.
    await expect(page.locator('#tree234-svg')).toBeVisible();
    await expect(page.locator('.stepctl .stepctl-scrubber')).toBeVisible();

    // The final frame of the default build draws the fully-built tree.
    await scrubTo(page, null);
    await expect(page.locator('#tree234-svg rect').first()).toBeVisible();
    expect(await page.locator('#tree234-svg text').count()).toBeGreaterThan(0);

    // Rebuilding from the input field still works.
    await page.locator('#tree234-input').fill('7, 3, 9, 1');
    await page.locator('#tree234-build-btn').click();
    await scrubTo(page, null);
    expect(await page.locator('#tree234-svg text').count()).toBeGreaterThan(0);

    expect(errors, errors.join('\n')).toEqual([]);
  });
});
