const { test, expect } = require('@playwright/test'); const path = require('path');
const FILE_URI = 'file://' + path.resolve(__dirname, '../index.html');

async function enterFocusOnFullTrie(page) {
  await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
  await page.goto(FILE_URI + '#m=tree-trie');
  const scrub = page.locator('.stepctl .stepctl-scrubber');
  await scrub.evaluate((el) => { el.value = el.max; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.locator('.method-section-card.active .viz-focus-toggle').click();
}

// The focus fit converges once the fullscreen/flex layout settles (a ResizeObserver repaints on the
// box-size change). Poll until the SVG width holds steady for two consecutive reads before measuring,
// so a baseline captured mid-settle can't make an exact-size assertion flaky.
async function settledSvgWidth(page) {
  let last = -1;
  await expect.poll(async () => {
    const w = await page.locator('.trie-svg').getAttribute('width').then((v) => parseFloat(v));
    const stable = (w === last);
    last = w;
    return stable ? w : -1;
  }, { timeout: 5000, intervals: [60, 60, 60] }).toBeGreaterThan(0);
  return last;
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
    const beforeW = await settledSvgWidth(page);   // measure the fit only after the layout settles
    const beforeTop = await vcrTop();
    const beforeCount = await page.locator('.stepctl-count').textContent();

    await page.locator('.viz-zoom-controls [data-zoom="in"]').click();
    await expect.poll(async () => await svgW()).toBeGreaterThan(beforeW);           // drawing grew
    expect(Math.abs((await vcrTop()) - beforeTop)).toBeLessThanOrEqual(2);          // VCR did not move
    expect(await page.locator('.stepctl-count').textContent()).toBe(beforeCount);   // cursor preserved

    await page.locator('.viz-zoom-controls [data-zoom="reset"]').click();
    const resetW = await settledSvgWidth(page);
    expect(resetW).toBeLessThan(beforeW * 1.09);   // shrank back toward fit (below the +0.1 zoom step)
    expect(Math.abs(resetW - beforeW)).toBeLessThanOrEqual(24);   // ~scrollbar-width tolerance
  });

  test('VCR stays operable at a narrow viewport where controls wrap', async ({ page }) => {
    await page.setViewportSize({ width: 560, height: 380 });
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=tree-trie');
    const scrub = page.locator('.stepctl .stepctl-scrubber');
    await scrub.evaluate((el) => { el.value = el.max; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await page.locator('.method-section-card.active .viz-focus-toggle').click();
    const vcr = page.locator('.stepctl');
    await expect(vcr).toBeVisible();
    // VCR fully within the (small) viewport — the fixed-210 reserve pushed it off here
    expect(await vcr.evaluate((el) => el.getBoundingClientRect().bottom <= window.innerHeight + 1)).toBe(true);
    // drawing area still shows (flex-allocated, not collapsed)
    expect(await page.locator('.trie-scroll').evaluate((el) => el.clientHeight > 40)).toBe(true);
  });
});
