const { test, expect } = require('@playwright/test'); const path = require('path');
const FILE_URI = 'file://' + path.resolve(__dirname, '../index.html');

test.describe('graph-scc', () => {
  test('renders panels + VCR bar; scrub to end → 3 SCCs colored + 3 condensation super-nodes', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=graph-scc');
    await expect(page.locator('.gsc-wrap')).toBeVisible();
    await expect(page.locator('.gsc-graph .gsc-node').first()).toBeVisible();
    await expect(page.locator('.stepctl .stepctl-scrubber')).toBeVisible();
    const scrub = page.locator('.stepctl .stepctl-scrubber');
    await scrub.evaluate((el) => { el.value = el.max; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await expect(page.locator('.gsc-banner')).toContainText('3');            // SCCs: 3
    await expect(page.locator('.gsc-graph .gsc-node-scc')).toHaveCount(6);   // all 6 vertices colored
    await expect(page.locator('.gsc-cond .gsc-super')).toHaveCount(3);       // condensation: 3 super-nodes
    await expect(page.locator('[data-method-section="graph-scc"] .code-drawer-toggle')).toBeVisible();
  });

  test('stepping shows a current-node ring; finish stack fills during phase 1', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=graph-scc');
    const step = page.locator('.stepctl [data-action="step"]');
    await step.click();                                    // init -> first p1 visit
    await expect(page.locator('.gsc-graph .gsc-node-cur')).toHaveCount(1);
    for (let i = 0; i < 12; i++) await step.click();       // deep into phase 1
    await expect(page.locator('.gsc-stack .gsc-stack-item').first()).toBeVisible();
  });

  test('built-in Single cycle example → 1 SCC / 1 super-node', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=graph-scc');
    await page.selectOption('.ex-select', { label: 'Single cycle (1 SCC)' });
    const scrub = page.locator('.stepctl .stepctl-scrubber');
    await scrub.evaluate((el) => { el.value = el.max; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await expect(page.locator('.gsc-banner')).toContainText('1');
    await expect(page.locator('.gsc-cond .gsc-super')).toHaveCount(1);
  });

  test('editable directed input + Apply updates graph and saves an example', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=graph-scc');
    const before = await page.locator('.ex-select option').count();
    await page.locator('.gsc-n').fill('3');
    await page.locator('.gsc-edges').fill('0-1,1-2');
    await page.locator('.gsc-apply').click();
    await expect(page.locator('.gsc-graph .gsc-node')).toHaveCount(3);
    await expect(page.locator('.ex-select option')).toHaveCount(before + 1);
    await expect(page.locator('.gsc-scroll')).toBeVisible();
  });
});
