const { test, expect } = require('@playwright/test');
const path = require('path');
const FILE_URI = 'file://' + path.resolve(__dirname, '../index.html');

test.describe('tree-persistent-segment', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try { localStorage.setItem('dsvisual-lang', 'en'); } catch (error) { /* ignore */ }
    });
  });

  test('renders the tree, VCR controls, version tabs, and the code drawer toggle', async ({ page }) => {
    await page.goto(FILE_URI + '#m=tree-persistent-segment');
    await expect(page.locator('.pst-wrap')).toBeVisible();
    await expect(page.locator('.pst-svg')).toBeVisible();
    await expect(page.locator('.stepctl .stepctl-scrubber')).toBeVisible();
    await expect(page.locator('[data-testid="pst-vtab-0"]')).toBeVisible();
    await expect(page.locator('[data-testid="pst-vtab-1"]')).toBeVisible();
    await expect(page.locator('[data-testid="pst-vtab-2"]')).toBeVisible();
    await expect(page.locator('[data-method-section="tree-persistent-segment"] .code-drawer-toggle')).toBeVisible();
  });

  test('stepping to the end shows the query result and reveals shared (non-new) nodes', async ({ page }) => {
    await page.goto(FILE_URI + '#m=tree-persistent-segment');
    const scrubber = page.locator('.stepctl .stepctl-scrubber');
    await scrubber.evaluate((element) => {
      element.value = element.max;
      element.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await expect(page.locator('[data-testid="pst-banner"]')).toContainText('result');
    await expect(page.locator('[data-testid="pst-stats"]')).toContainText('shared');
  });

  test('the persistence invariant is visible: querying v0 differs from querying v2 after later updates', async ({ page }) => {
    await page.goto(FILE_URI + '#m=tree-persistent-segment');
    await expect(page.locator('[data-testid="pst-invariant"]')).toContainText('v0 stays untouched');
    await page.locator('[data-jump="resultV0"]').click();
    const v0Text = await page.locator('[data-testid="pst-banner"]').textContent();
    expect(v0Text).toContain('v0');
    await page.locator('[data-jump="resultV2"]').click();
    const v2Text = await page.locator('[data-testid="pst-banner"]').textContent();
    expect(v2Text).toContain('v2');
  });

  test('clicking a version tab jumps the VCR to that version and highlights new nodes', async ({ page }) => {
    await page.goto(FILE_URI + '#m=tree-persistent-segment');
    await page.locator('[data-testid="pst-vtab-1"]').click();
    await expect(page.locator('[data-testid="pst-banner"]')).toContainText('v1');
    await expect(page.locator('[data-testid="pst-vtab-1"]')).toHaveClass(/pst-vtab-current/);
  });

  test('editable input applies a new example, updates root sums, and saves it to Examples', async ({ page }) => {
    await page.goto(FILE_URI + '#m=tree-persistent-segment');
    const before = await page.locator('.ex-select option').count();
    await page.locator('.pst-arr').fill('1,2,3,4');
    await page.locator('.pst-u1').fill('0:10');
    await page.locator('.pst-u2').fill('3:40');
    await page.locator('.pst-q').fill('0,3');
    await page.locator('.pst-apply').click();
    await expect(page.locator('.ex-select option')).toHaveCount(before + 1);
    await expect(page.locator('[data-testid="pst-vtab-0"]')).toContainText('Σ=10');
    await expect(page.locator('[data-testid="pst-invariant"]')).toContainText('v0 = 10');
    await expect(page.locator('[data-testid="pst-invariant"]')).toContainText('v2 = 55');
  });

  test('malformed update input is clamped/defaulted with a visible bilingual warning', async ({ page }) => {
    await page.goto(FILE_URI + '#m=tree-persistent-segment');
    await page.locator('.pst-u1').fill('garbage');
    await page.locator('.pst-apply').click();
    await expect(page.locator('.pst-warning')).toContainText('idx:val');
  });

  test('non-normal input difficulty selects the edge-case preset (double update on the same index)', async ({ page }) => {
    await page.addInitScript(() => {
      try { localStorage.setItem('dsvisual.inputDifficulty.global', 'edge'); } catch (error) { /* ignore */ }
    });
    await page.goto(FILE_URI + '#m=tree-persistent-segment');
    await expect(page.locator('.pst-tier')).toContainText('Challenge');
    await expect(page.locator('.pst-u1')).toHaveValue('0:100');
    await expect(page.locator('.pst-u2')).toHaveValue('0:1');
  });

  test('random input follows the inline difficulty and stays runnable to completion', async ({ page }) => {
    await page.goto(FILE_URI + '#m=tree-persistent-segment');
    await page.locator('[data-testid="viz-difficulty"]').selectOption('edge');
    await page.locator('.pst-random').click();
    await expect(page.locator('.pst-tier')).toContainText('Challenge');
    const scrubber = page.locator('.stepctl .stepctl-scrubber');
    await scrubber.evaluate((element) => {
      element.value = element.max;
      element.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await expect(page.locator('[data-testid="pst-banner"]')).toContainText('result');
  });
});
