const { test, expect } = require('@playwright/test'); const path = require('path');
const FILE_URI = 'file://' + path.resolve(__dirname, '../index.html');

test.describe('game-tree vizfit-svg + examples + random', () => {
  test('single-SVG rect nodes; bounded; controls; stepping prunes', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=game-tree');
    await expect(page.locator('.gt-wrap.vizfit-host')).toHaveCount(1);
    const scroll = page.locator('.gt-scroll.vizfit-scroll');
    await expect(scroll.locator('> svg.gt-svg')).toHaveCount(1);
    expect(await scroll.evaluate((el) => el.clientHeight <= window.innerHeight - 120)).toBe(true);
    await expect(page.locator('.ex-select')).toBeVisible();
    await expect(page.locator('.gt-random')).toBeVisible();
    await expect(page.locator('.gt-ab')).toBeVisible();
    expect(await page.locator('.gt-svg .gt-node').count()).toBeGreaterThan(0);
    expect(await page.locator('.gt-nodes .tree-node').count()).toBe(0);   // no HTML overlay
    // step to end (α-β on by default) → root value shown + at least one pruned node
    const scrub = page.locator('.stepctl .stepctl-scrubber');
    await scrub.evaluate((el) => { el.value = el.max; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await expect(page.locator('.gt-info')).toContainText('Root value');
    expect(await page.locator('.gt-svg .gt-node.gt-pruned').count()).toBeGreaterThan(0);
  });

  test('🎲 valid leaves; Build saves example', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=game-tree');
    await page.click('.gt-random');
    expect(await page.locator('.gt-input').inputValue()).toMatch(/^-?\d+(,-?\d+)*$/);
    expect(await page.locator('.gt-svg .gt-node').count()).toBeGreaterThan(0);
    await page.fill('.gt-input', '1,2,3,4');
    await page.click('.gt-build');
    expect(await page.locator('.gt-svg .gt-node').count()).toBeGreaterThan(0);
    expect(await page.locator('.ex-select option').count()).toBeGreaterThan(2);
  });

  test('fullscreen: viz-fit-svg, SVG width grows, VCR operable, code drawer hidden', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=game-tree');
    const svgW = () => page.locator('.gt-svg').getAttribute('width').then((v) => parseFloat(v));
    const before = await svgW();
    await page.locator('.method-section-card.active .viz-focus-toggle').click();
    const card = page.locator('.method-section-card.active');
    await expect(card).toHaveClass(/viz-fit(\s|$)/);
    await expect(card).toHaveClass(/viz-fit-svg(\s|$)/);
    await expect.poll(async () => await svgW()).toBeGreaterThan(before);
    expect(await page.locator('.stepctl').evaluate((el) => el.getBoundingClientRect().bottom <= window.innerHeight + 1)).toBe(true);
    await expect(page.locator('.viz-zoom-controls')).toBeVisible();
    await expect(page.locator('[data-method-section="game-tree"] .code-drawer')).toBeHidden();
  });
});
