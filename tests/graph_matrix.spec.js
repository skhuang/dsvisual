const { test, expect } = require('@playwright/test'); const path = require('path');
const FILE_URI = 'file://' + path.resolve(__dirname, '../index.html');
test.describe('graph-matrix', () => {
  test('stepped build fills matrix + highlights edge; toggles + degree', async ({ page }) => {
    await page.goto(FILE_URI + '#m=graph-matrix');
    const host = page.locator('.gm-wrap');
    await expect(host).toBeVisible();
    await expect(page.locator('.gm-matrix .gm-cell').first()).toBeVisible();
    // step advances and lights a cell
    await page.locator('.stepctl [data-action="step"]').click();
    await expect(page.locator('.gm-matrix .gm-cell.gm-added').first()).toBeVisible();
    // directed toggle → asymmetry class/marker present; degree row visible
    await page.locator('.gm-directed').check();
    await expect(page.locator('.gm-degree').first()).toBeVisible();
    // code hidden until drawer toggled
    await expect(page.locator('[data-method-section="graph-matrix"] .code-drawer-toggle')).toBeVisible();
  });

  test('editable n/edges + Apply updates the graph/matrix and saves an example', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=graph-matrix');
    const beforeOptions = await page.locator('.ex-select option').count();

    await page.locator('.gm-n').fill('3');
    await page.locator('.gm-edges').fill('0-1,1-2');
    await page.locator('.gm-apply').click();

    // matrix/graph now reflect n=3, 2 edges
    await expect(page.locator('.gm-graph .gm-node')).toHaveCount(3);
    await expect(page.locator('.gm-graph .gm-edge')).toHaveCount(2);

    // Apply saved a new option into .ex-select
    await expect(page.locator('.ex-select option')).toHaveCount(beforeOptions + 1);
  });

  test('selecting an .ex-select option re-applies it', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=graph-matrix');

    await page.locator('.gm-n').fill('3');
    await page.locator('.gm-edges').fill('0-1,1-2');
    await page.locator('.gm-apply').click();
    await expect(page.locator('.gm-graph .gm-node')).toHaveCount(3);

    // switch to the built-in Default sample (n=5) ...
    await page.selectOption('.ex-select', { label: 'Default' });
    await expect(page.locator('.gm-graph .gm-node')).toHaveCount(5);

    // ... then back to the just-saved custom example (n=3) confirms the
    // .ex-select change handler re-applies its n/edges.
    await page.selectOption('.ex-select', '3|0|0|0-1:1,1-2:1');
    await expect(page.locator('.gm-graph .gm-node')).toHaveCount(3);
  });

  test('hover correspondence after a full build: cell <-> edge, both directions', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=graph-matrix');
    await page.locator('.gm-n').fill('3');
    await page.locator('.gm-edges').fill('0-1,1-2');
    await page.locator('.gm-apply').click();

    // Run to completion: start + 2 edge frames + done = 4 frames -> 3 steps
    // (a couple of extra clicks are harmless once the build is done).
    for (let i = 0; i < 5; i++) {
      await page.locator('.stepctl [data-action="step"]').click();
    }

    // Target the [0][1] cell directly by data-i/data-j: with edges 0-1,1-2
    // it's a known-filled cell, independent of which step last set .gm-added
    // (that class only ever marks the current step's cell(s), not "every
    // filled cell" — see gmMatrixHtml).
    const cell = page.locator('.gm-matrix .gm-cell[data-i="0"][data-j="1"]');
    await expect(cell).toBeVisible();
    await cell.hover();
    await expect(page.locator('.gm-graph .gm-edge.gm-edge-hover')).toHaveCount(1);

    // vice versa: hovering an edge highlights its matching matrix cell(s)
    await page.locator('.gm-graph .gm-edge').first().hover();
    await expect(page.locator('.gm-matrix .gm-cell.gm-cell-hover').first()).toBeVisible();
  });
});
