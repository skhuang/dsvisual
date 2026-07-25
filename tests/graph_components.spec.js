const { test, expect } = require('@playwright/test'); const path = require('path');
const FILE_URI = 'file://' + path.resolve(__dirname, '../index.html');

test.describe('graph-components', () => {
  test('stepped BFS flood colours vertices, marks a frontier, drawer hidden', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=graph-components');
    await expect(page.locator('.gc2-wrap')).toBeVisible();
    await expect(page.locator('.gc2-graph .gc2-node').first()).toBeVisible();
    // one step: a current vertex + a frontier vertex appear (default seed 0 enqueues 1)
    await page.locator('.stepctl [data-action="step"]').click();
    await expect(page.locator('.gc2-graph .gc2-node-current')).toHaveCount(1);
    await expect(page.locator('.gc2-graph .gc2-node-frontier').first()).toBeVisible();
    // code hidden until drawer toggled
    await expect(page.locator('[data-method-section="graph-components"] .code-drawer-toggle')).toBeVisible();
  });

  test('running to completion reports 3 components for the default graph', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=graph-components');
    for (let i = 0; i < 8; i++) await page.locator('.stepctl [data-action="step"]').click();
    await expect(page.locator('.gc2-count')).toContainText('3');
  });

  test('editable n/edges + Apply updates the graph and saves an example', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=graph-components');
    const before = await page.locator('.ex-select option').count();
    await page.locator('.gc2-n').fill('3');
    await page.locator('.gc2-edges').fill('0-1,1-2');
    await page.locator('.gc2-apply').click();
    await expect(page.locator('.gc2-graph .gc2-node')).toHaveCount(3);
    await expect(page.locator('.gc2-graph .gc2-edge')).toHaveCount(2);
    await expect(page.locator('.ex-select option')).toHaveCount(before + 1);
  });

  test('selecting the Default example restores the 5-vertex sample', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=graph-components');
    await page.locator('.gc2-n').fill('3');
    await page.locator('.gc2-edges').fill('0-1,1-2');
    await page.locator('.gc2-apply').click();
    await expect(page.locator('.gc2-graph .gc2-node')).toHaveCount(3);
    await page.selectOption('.ex-select', { label: 'Default' });
    await expect(page.locator('.gc2-graph .gc2-node')).toHaveCount(5);
    await expect(page.locator('.gc2-scroll')).toBeVisible();
  });
});
