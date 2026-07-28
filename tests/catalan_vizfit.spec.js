const { test, expect } = require('@playwright/test'); const path = require('path');
const FILE_URI = 'file://' + path.resolve(__dirname, '../index.html');

test.describe('tree-catalan vizfit (layout-only)', () => {
  test('bounded vizfit gallery; stepping + n-buttons intact', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=tree-catalan');
    await expect(page.locator('.cat-wrap.vizfit-host')).toHaveCount(1);
    const scroll = page.locator('.cat-scroll.vizfit-scroll');
    await expect(scroll).toHaveCount(1);
    expect(await scroll.evaluate((el) => el.clientHeight <= window.innerHeight - 120)).toBe(true);
    // existing stepping still works: scrub to end → groups shown + done verdict
    const scrub = page.locator('.stepctl .stepctl-scrubber');
    await scrub.evaluate((el) => { el.value = el.max; el.dispatchEvent(new Event('input', { bubbles: true })); });
    expect(await page.locator('.cat-groups .cat-group').count()).toBeGreaterThan(0);
    await expect(page.locator('.cat-verdict.cat-ok')).toBeVisible();
    // n-button switches n
    await page.click('.cat-nbtn[data-n="4"]');
    await expect(page.locator('.cat-nbtn.active')).toHaveText('n=4');
    // code hidden in the drawer
    await expect(page.locator('[data-method-section="tree-catalan"] .code-drawer')).toBeHidden();
  });

  test('fullscreen: card marked viz-fit, VCR operable, zoom toolbar floated', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=tree-catalan');
    await page.locator('.method-section-card.active .viz-focus-toggle').click();
    await expect(page.locator('.method-section-card.active')).toHaveClass(/viz-fit(\s|$)/);
    const inView = await page.locator('.stepctl').evaluate((el) => el.getBoundingClientRect().bottom <= window.innerHeight + 1);
    expect(inView).toBe(true);
    await expect(page.locator('.viz-zoom-controls')).toBeVisible();
  });
});
