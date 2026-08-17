const { test, expect } = require('@playwright/test');
const path = require('path');
const FILE_URI = 'file://' + path.resolve(__dirname, '../index.html');

test.describe('graph-maxflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try { localStorage.setItem('dsvisual-lang', 'en'); } catch (error) { /* ignore */ }
    });
  });

  test('renders both networks and VCR; final frame proves max-flow/min-cut = 23', async ({ page }) => {
    await page.goto(FILE_URI + '#m=graph-maxflow');
    await expect(page.locator('.gmf-wrap')).toBeVisible();
    await expect(page.locator('.gmf-flow .gmf-flow-node')).toHaveCount(6);
    await expect(page.locator('.gmf-residual .gmf-res-node')).toHaveCount(6);
    await expect(page.locator('.stepctl .stepctl-scrubber')).toBeVisible();
    const scrubber = page.locator('.stepctl .stepctl-scrubber');
    await scrubber.evaluate((element) => {
      element.value = element.max;
      element.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await expect(page.locator('[data-testid="gmf-banner"]')).toContainText('23');
    await expect(page.locator('[data-testid="gmf-cut"]')).toContainText('capacity 23');
    await expect(page.locator('.gmf-flow-edge.gmf-edge-cut').first()).toBeVisible();
    await expect(page.locator('[data-method-section="graph-maxflow"] .code-drawer-toggle')).toBeVisible();
  });

  test('stepping exposes BFS state and an augmenting path in the residual graph', async ({ page }) => {
    await page.goto(FILE_URI + '#m=graph-maxflow');
    const scrubber = page.locator('.stepctl .stepctl-scrubber');
    const pathIndex = await page.evaluate(() => GraphMaxFlowViz.maxFlowFrames(GraphMaxFlowViz.SAMPLE).frames.findIndex((frame) => frame.phase === 'path'));
    await scrubber.evaluate((element, index) => {
      element.value = String(index);
      element.dispatchEvent(new Event('input', { bubbles: true }));
    }, pathIndex);
    await expect(page.locator('.gmf-res-edge.gmf-edge-path').first()).toBeVisible();
    await expect(page.locator('[data-testid="gmf-banner"]')).toContainText('bottleneck');
  });

  test('non-normal input difficulty selects the eight-vertex challenge preset', async ({ page }) => {
    await page.addInitScript(() => {
      try { localStorage.setItem('dsvisual.inputDifficulty.global', 'edge'); } catch (error) { /* ignore */ }
    });
    await page.goto(FILE_URI + '#m=graph-maxflow');
    await expect(page.locator('.gmf-tier')).toContainText('Challenge');
    await expect(page.locator('.gmf-flow .gmf-flow-node')).toHaveCount(8);
  });

  test('random input follows the inline difficulty and stays runnable', async ({ page }) => {
    await page.goto(FILE_URI + '#m=graph-maxflow');
    await page.locator('[data-testid="viz-difficulty"]').selectOption('edge');
    await page.locator('.gmf-random').click();
    await expect(page.locator('.gmf-tier')).toContainText('Challenge');
    await expect(page.locator('.gmf-flow .gmf-flow-node')).toHaveCount(8);
    const scrubber = page.locator('.stepctl .stepctl-scrubber');
    await scrubber.evaluate((element) => {
      element.value = element.max;
      element.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await expect(page.locator('[data-testid="gmf-banner"]')).toContainText('done');
  });

  test('editable input saves a valid example and handles no-path boundary', async ({ page }) => {
    await page.goto(FILE_URI + '#m=graph-maxflow');
    const before = await page.locator('.ex-select option').count();
    await page.locator('.gmf-n').fill('4');
    await page.locator('.gmf-source').fill('0');
    await page.locator('.gmf-sink').fill('3');
    await page.locator('.gmf-edges').fill('0-1:7,2-3:4');
    await page.locator('.gmf-apply').click();
    await expect(page.locator('.ex-select option')).toHaveCount(before + 1);
    const scrubber = page.locator('.stepctl .stepctl-scrubber');
    await scrubber.evaluate((element) => {
      element.value = element.max;
      element.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await expect(page.locator('[data-testid="gmf-banner"]')).toContainText('Maximum flow 0');
  });

  test('equal source and sink produces a visible bilingual validation error', async ({ page }) => {
    await page.goto(FILE_URI + '#m=graph-maxflow');
    await page.locator('.gmf-source').fill('2');
    await page.locator('.gmf-sink').fill('2');
    await page.locator('.gmf-apply').click();
    await expect(page.locator('.gmf-error')).toContainText('must be different');
    await expect(page.locator('[data-testid="gmf-banner"]')).toContainText('invalid');
  });
});
