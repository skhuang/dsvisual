const { test, expect } = require('@playwright/test'); const path = require('path');
const FILE_URI = 'file://' + path.resolve(__dirname, '../index.html');

test.describe('tree-dsu scripted op-sequence + SVG forest (vizfit-svg)', () => {
  test('single-SVG forest; bounded; controls; stepping shows edges + op info', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=tree-dsu');
    await expect(page.locator('.dsu-wrap.vizfit-host')).toHaveCount(1);
    const scroll = page.locator('.dsu-scroll.vizfit-scroll');
    await expect(scroll.locator('> svg.dsu-svg')).toHaveCount(1);
    expect(await scroll.evaluate((el) => el.clientHeight <= window.innerHeight - 120)).toBe(true);
    await expect(page.locator('.ex-select')).toBeVisible();
    await expect(page.locator('.dsu-random')).toBeVisible();
    // no legacy HTML forest
    expect(await page.locator('.dsu-forest, .dsu-tree-node').count()).toBe(0);
    // SAMPLE → n=8 SVG nodes
    expect(await page.locator('.dsu-svg .dsu-node').count()).toBe(8);
    // step to end → edges present + op info shown
    const scrub = page.locator('.stepctl .stepctl-scrubber');
    await scrub.evaluate((el) => { el.value = el.max; el.dispatchEvent(new Event('input', { bubbles: true })); });
    expect(await page.locator('.dsu-svg .dsu-edge').count()).toBeGreaterThan(0);
    expect((await page.locator('.dsu-info').textContent()).trim().length).toBeGreaterThan(0);
  });

  test('🎲 valid op string; Build re-renders + saves example', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=tree-dsu');
    await page.click('.dsu-random');
    expect(await page.locator('.dsu-input').inputValue()).toMatch(/^[UFuf0-9;\s]+$/);
    expect(await page.locator('.dsu-svg .dsu-node').count()).toBeGreaterThan(0);
    await page.fill('.dsu-input', 'U0 1; U2 3');
    await page.click('.dsu-build');
    expect(await page.locator('.dsu-svg .dsu-node').count()).toBe(4); // maxIdx 3 → n=4
    expect(await page.locator('.ex-select option').count()).toBeGreaterThan(2);
  });

  test('fullscreen: viz-fit-svg, SVG width grows, VCR operable, code drawer hidden', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=tree-dsu');
    const svgW = () => page.locator('.dsu-svg').getAttribute('width').then((v) => parseFloat(v));
    const before = await svgW();
    await page.locator('.method-section-card.active .viz-focus-toggle').click();
    const card = page.locator('.method-section-card.active');
    await expect(card).toHaveClass(/viz-fit(\s|$)/);
    await expect(card).toHaveClass(/viz-fit-svg(\s|$)/);
    await expect.poll(async () => await svgW()).toBeGreaterThan(before);
    expect(await page.locator('.stepctl').evaluate((el) => el.getBoundingClientRect().bottom <= window.innerHeight + 1)).toBe(true);
    await expect(page.locator('.viz-zoom-controls')).toBeVisible();
    await expect(page.locator('[data-method-section="tree-dsu"] .code-drawer')).toBeHidden();
  });
});
