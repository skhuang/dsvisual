const { test, expect } = require('@playwright/test'); const path = require('path');
const FILE_URI = 'file://' + path.resolve(__dirname, '../index.html');

test.describe('vizfit shared mechanism (trie is the first adopter)', () => {
  test('focus marks the card viz-fit viz-fit-svg; .vizfit-scroll is the bounded region; zoom toolbar floats', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=tree-trie');
    const scrub = page.locator('.stepctl .stepctl-scrubber');
    await scrub.evaluate((el) => { el.value = el.max; el.dispatchEvent(new Event('input', { bubbles: true })); });
    // the trie's scroll region carries the shared class
    await expect(page.locator('.method-section-card.active .vizfit-scroll')).toHaveCount(1);
    await page.locator('.method-section-card.active .viz-focus-toggle').click();
    const card = page.locator('.method-section-card.active');
    await expect(card).toHaveClass(/viz-fit(\s|$)/);
    await expect(card).toHaveClass(/viz-fit-svg(\s|$)/);
    // bounded: the scroll region leaves room for chrome + VCR
    expect(await page.locator('.vizfit-scroll').evaluate((el) => el.clientHeight <= window.innerHeight - 120)).toBe(true);
    await expect(page.locator('.viz-zoom-controls')).toBeVisible();
  });
});
