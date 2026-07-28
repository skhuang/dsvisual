const { test, expect } = require('@playwright/test'); const path = require('path');
const FILE_URI = 'file://' + path.resolve(__dirname, '../index.html');

async function enterFocusOnFullTrie(page) {
  await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
  await page.goto(FILE_URI + '#m=tree-trie');
  const scrub = page.locator('.stepctl .stepctl-scrubber');
  await scrub.evaluate((el) => { el.value = el.max; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.locator('.method-section-card.active .viz-focus-toggle').click();
}

test.describe('fullscreen layout + drawing-only zoom', () => {
  test('VCR stays in-viewport, drawing is bounded, zoom toolbar is floated', async ({ page }) => {
    await enterFocusOnFullTrie(page);
    const vcr = page.locator('.stepctl');
    await expect(vcr).toBeVisible();
    expect(await vcr.evaluate((el) => el.getBoundingClientRect().bottom <= window.innerHeight + 1)).toBe(true);
    expect(await page.locator('.trie-scroll').evaluate((el) => el.clientHeight <= window.innerHeight - 150)).toBe(true);
    await expect(page.locator('.viz-zoom-controls')).toBeVisible();
  });

  test('zoom scales only the drawing; controls + VCR stay put; cursor preserved', async ({ page }) => {
    await enterFocusOnFullTrie(page);
    const svgW = () => page.locator('.trie-svg').getAttribute('width').then((v) => parseFloat(v));
    const vcrTop = () => page.locator('.stepctl').evaluate((el) => Math.round(el.getBoundingClientRect().top));
    const beforeW = await svgW();
    const beforeTop = await vcrTop();
    const beforeCount = await page.locator('.stepctl-count').textContent();

    await page.locator('.viz-zoom-controls [data-zoom="in"]').click();
    await expect.poll(async () => await svgW()).toBeGreaterThan(beforeW);           // drawing grew
    expect(Math.abs((await vcrTop()) - beforeTop)).toBeLessThanOrEqual(2);          // VCR did not move
    expect(await page.locator('.stepctl-count').textContent()).toBe(beforeCount);   // cursor preserved

    await page.locator('.viz-zoom-controls [data-zoom="reset"]').click();
    await expect.poll(async () => await svgW()).toBeLessThanOrEqual(beforeW + 1);    // back to fit size
  });
});
