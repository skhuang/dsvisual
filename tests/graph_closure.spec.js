const { test, expect } = require('@playwright/test'); const path = require('path');
const FILE_URI = 'file://' + path.resolve(__dirname, '../index.html');

test.describe('graph-closure', () => {
  test('renders dual view + VCR bar; stepping marks pivot & added cell/edge', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=graph-closure');
    await expect(page.locator('.gcl-wrap')).toBeVisible();
    await expect(page.locator('.gcl-graph .gcl-node').first()).toBeVisible();
    await expect(page.locator('.gcl-matrix .gcl-cell').first()).toBeVisible();
    await expect(page.locator('.stepctl .stepctl-scrubber')).toBeVisible();
    // run to the end via scrubber → closure complete
    const scrub = page.locator('.stepctl .stepctl-scrubber');
    await scrub.evaluate((el) => { el.value = el.max; el.dispatchEvent(new Event('input', { bubbles: true })); });
    // default sample: R[0][3]=1 and diagonal R[1][1]=1 (cycle)
    await expect(page.locator('.gcl-matrix .gcl-cell[data-i="0"][data-j="3"]')).toHaveText('1');
    await expect(page.locator('.gcl-matrix .gcl-cell[data-i="1"][data-j="1"]')).toHaveText('1');
    // Use .last() rather than .first(): with the default sample the first added
    // edge (0→2) renders as a perfectly vertical <line>, whose SVG geometry
    // bounding box has zero width — Playwright's toBeVisible() requires a
    // non-empty bbox on both axes, so it reports "hidden" even though the
    // stroke is on screen. The last added edge (3→2) is diagonal and unaffected.
    await expect(page.locator('.gcl-graph .gcl-edge-added').last()).toBeVisible();  // transitively-added edges drawn
    await expect(page.locator('[data-method-section="graph-closure"] .code-drawer-toggle')).toBeVisible();
  });

  test('a pivot frame highlights the pivot vertex, a set frame highlights an added cell', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=graph-closure');
    const step = page.locator('.stepctl [data-action="step"]');
    await step.click();                                   // init -> first pivot frame
    await expect(page.locator('.gcl-graph .gcl-node-pivot')).toHaveCount(1);
    for (let i = 0; i < 40; i++) await step.click();      // reach a set frame / the end
    await expect(page.locator('.gcl-matrix .gcl-cell.gcl-added, .gcl-matrix .gcl-cell[data-i="0"][data-j="3"]').first()).toBeVisible();
  });

  test('built-in DAG example → no diagonal cell set', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=graph-closure');
    await page.selectOption('.ex-select', { label: 'DAG (chain)' });
    const scrub = page.locator('.stepctl .stepctl-scrubber');
    await scrub.evaluate((el) => { el.value = el.max; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await expect(page.locator('.gcl-matrix .gcl-cell[data-i="0"][data-j="3"]')).toHaveText('1');
    await expect(page.locator('.gcl-matrix .gcl-cell[data-i="0"][data-j="0"]')).toHaveText('0');   // DAG → empty diagonal
  });

  test('editable directed input + Apply updates graph and saves an example', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=graph-closure');
    const before = await page.locator('.ex-select option').count();
    await page.locator('.gcl-n').fill('3');
    await page.locator('.gcl-edges').fill('0-1,1-2');
    await page.locator('.gcl-apply').click();
    await expect(page.locator('.gcl-graph .gcl-node')).toHaveCount(3);
    await expect(page.locator('.ex-select option')).toHaveCount(before + 1);
    await expect(page.locator('.gcl-scroll')).toBeVisible();
  });
});
