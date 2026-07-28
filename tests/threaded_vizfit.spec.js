const { test, expect } = require('@playwright/test'); const path = require('path');
const FILE_URI = 'file://' + path.resolve(__dirname, '../index.html');

test.describe('tree-threaded vizfit-svg + examples', () => {
  test('single-SVG nodes, bounded, examples + 🎲, stepping', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=tree-threaded');
    await expect(page.locator('.th-wrap.vizfit-host')).toHaveCount(1);
    const scroll = page.locator('.th-scroll.vizfit-scroll');
    await expect(scroll.locator('> svg.th-svg')).toHaveCount(1);
    expect(await scroll.evaluate((el) => el.clientHeight <= window.innerHeight - 120)).toBe(true);
    await expect(page.locator('.ex-select')).toBeVisible();
    await expect(page.locator('.rand-btn')).toBeVisible();
    // nodes are SVG circles (7 default values); NO HTML overlay left
    await expect(page.locator('.th-svg .th-node')).toHaveCount(7);
    await expect(page.locator('.th-svg .th-node-label')).toHaveCount(7);
    expect(await page.locator('.th-nodes .tree-node').count()).toBe(0);
    // stepping: scrub to end → inorder populated + threads present
    const scrub = page.locator('.stepctl .stepctl-scrubber');
    await scrub.evaluate((el) => { el.value = el.max; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await expect(page.locator('.th-seq')).not.toHaveText('');
    expect(await page.locator('.th-svg .th-thread').count()).toBeGreaterThan(0);
  });

  test('Build a custom tree saves an example; 🎲 re-renders', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=tree-threaded');
    await page.fill('.th-input', '10,20,30');
    await page.click('.th-build');
    await expect(page.locator('.th-svg .th-node')).toHaveCount(3);
    expect(await page.locator('.ex-select option').count()).toBeGreaterThan(2);
    await page.click('.rand-btn');
    expect(await page.locator('.th-input').inputValue()).toMatch(/^\d+(,\d+)*$/);
    expect(await page.locator('.th-svg .th-node').count()).toBeGreaterThan(0);
  });

  test('fullscreen: viz-fit-svg, SVG width grows, VCR operable, code drawer hidden', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=tree-threaded');
    const svgW = () => page.locator('.th-svg').getAttribute('width').then((v) => parseFloat(v));
    const before = await svgW();
    await page.locator('.method-section-card.active .viz-focus-toggle').click();
    const card = page.locator('.method-section-card.active');
    await expect(card).toHaveClass(/viz-fit(\s|$)/);
    await expect(card).toHaveClass(/viz-fit-svg(\s|$)/);
    await expect.poll(async () => await svgW()).toBeGreaterThan(before);
    expect(await page.locator('.stepctl').evaluate((el) => el.getBoundingClientRect().bottom <= window.innerHeight + 1)).toBe(true);
    await expect(page.locator('.viz-zoom-controls')).toBeVisible();
    await expect(page.locator('[data-method-section="tree-threaded"] .code-drawer')).toBeHidden();
  });
});
