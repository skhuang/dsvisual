const { test, expect } = require('@playwright/test'); const path = require('path');
const FILE_URI = 'file://' + path.resolve(__dirname, '../index.html');

test.describe('graph-bipartite', () => {
  test('stepped 2-colouring: colours a vertex + shows a frontier; VCR bar present', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=graph-bipartite');
    await expect(page.locator('.gbp-wrap')).toBeVisible();
    await expect(page.locator('.gbp-graph .gbp-node').first()).toBeVisible();
    await expect(page.locator('.stepctl .stepctl-scrubber')).toBeVisible();
    await page.locator('.stepctl [data-action="step"]').click(); // seed 0 → colours it, enqueues neighbours
    await expect(page.locator('.gbp-graph .gbp-node-a, .gbp-graph .gbp-node-b').first()).toBeVisible();
    await expect(page.locator('.gbp-graph .gbp-node-frontier').first()).toBeVisible();
    await expect(page.locator('[data-method-section="graph-bipartite"] .code-drawer-toggle')).toBeVisible();
  });

  test('default C6 → bipartite verdict listing two classes', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=graph-bipartite');
    const scrub = page.locator('.stepctl .stepctl-scrubber');
    await scrub.evaluate((el) => { el.value = el.max; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await expect(page.locator('.gbp-verdict')).toContainText('Bipartite');
    await expect(page.locator('.gbp-verdict')).toContainText('0, 2, 4');
    await expect(page.locator('.gbp-graph .gbp-edge-conflict')).toHaveCount(0);
  });

  test('built-in Odd cycle example → conflict edge + NOT bipartite', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=graph-bipartite');
    await page.selectOption('.ex-select', { label: 'Odd cycle' });
    const scrub = page.locator('.stepctl .stepctl-scrubber');
    await scrub.evaluate((el) => { el.value = el.max; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await expect(page.locator('.gbp-graph .gbp-edge-conflict')).toHaveCount(1);
    await expect(page.locator('.gbp-verdict')).toContainText('NOT bipartite');
  });

  test('editable n/edges + Apply updates the graph and saves an example', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=graph-bipartite');
    const before = await page.locator('.ex-select option').count();
    await page.locator('.gbp-n').fill('3');
    await page.locator('.gbp-edges').fill('0-1,1-2');
    await page.locator('.gbp-apply').click();
    await expect(page.locator('.gbp-graph .gbp-node')).toHaveCount(3);
    await expect(page.locator('.gbp-graph .gbp-edge')).toHaveCount(2);
    await expect(page.locator('.ex-select option')).toHaveCount(before + 1);
    await expect(page.locator('.gbp-scroll')).toBeVisible();
  });
});
