const { test, expect } = require('@playwright/test');
const path = require('path');
const FILE_URI = 'file://' + path.resolve(__dirname, '../index.html');

const scrubTo = async (page, value) => {
  await page.locator('.stepctl .stepctl-scrubber').evaluate((element, target) => {
    element.value = target === null ? element.max : String(target);
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
};

test.describe('graph-euler', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try { localStorage.setItem('dsvisual-lang', 'en'); } catch (error) { /* ignore */ }
    });
  });

  test('renders the graph and VCR; the final frame reads back a complete Euler circuit', async ({ page }) => {
    await page.goto(FILE_URI + '#m=graph-euler');
    await expect(page.locator('.geu-wrap')).toBeVisible();
    await expect(page.locator('.geu-graph .geu-node')).toHaveCount(5);
    await expect(page.locator('.stepctl .stepctl-scrubber')).toBeVisible();
    await scrubTo(page, null);
    await expect(page.locator('[data-testid="geu-banner"]')).toContainText('Euler circuit exists');
    await expect(page.locator('[data-testid="geu-banner"]')).toContainText('edges walked 6/6');
    await expect(page.locator('[data-testid="geu-msg"]')).toContainText('0 → 1 → 2 → 3 → 4 → 2 → 0');
    // Every edge ends up walked exactly once.
    await expect(page.locator('.geu-graph .geu-edge-used')).toHaveCount(6);
    await expect(page.locator('[data-method-section="graph-euler"] .code-drawer-toggle')).toBeVisible();
  });

  test('stepping exposes the stack and the finalized tail when the walk gets stuck', async ({ page }) => {
    await page.goto(FILE_URI + '#m=graph-euler');
    const backtrackIndex = await page.evaluate(() =>
      GraphEulerViz.eulerFrames(GraphEulerViz.SAMPLE).frames.findIndex((frame) => frame.phase === 'backtrack'));
    await scrubTo(page, backtrackIndex);
    await expect(page.locator('[data-testid="geu-banner"]')).toContainText('backtrack');
    // The dead end has been popped off the stack and onto the output list.
    await expect(page.locator('[data-testid="geu-stack"] .geu-stack-item')).toHaveCount(3);
    await expect(page.locator('[data-testid="geu-circuit"] .geu-circuit-item')).toHaveCount(1);
  });

  test('Konigsberg: four odd vertices means no trail exists', async ({ page }) => {
    await page.goto(FILE_URI + '#m=graph-euler');
    await page.locator('.ex-select').selectOption({ label: 'Konigsberg 7 bridges (no trail)' });
    await expect(page.locator('.geu-graph .geu-node')).toHaveCount(4);
    await scrubTo(page, null);
    await expect(page.locator('[data-testid="geu-banner"]')).toContainText('No Euler path or circuit');
    await expect(page.locator('[data-testid="geu-banner"]')).toContainText('odd 4');
    await expect(page.locator('[data-testid="geu-msg"]')).toContainText('odd-degree vertices');
    // Parallel bridges must stay drawn as separate edges.
    await expect(page.locator('.geu-graph .geu-edge')).toHaveCount(7);
  });

  test('even degrees but disconnected still has no circuit', async ({ page }) => {
    await page.goto(FILE_URI + '#m=graph-euler');
    await page.locator('.ex-select').selectOption({ label: 'Even degrees but disconnected' });
    await scrubTo(page, null);
    await expect(page.locator('[data-testid="geu-banner"]')).toContainText('odd 0');
    await expect(page.locator('[data-testid="geu-banner"]')).toContainText('No Euler path or circuit');
    await expect(page.locator('[data-testid="geu-msg"]')).toContainText('more than one component');
  });

  test('non-normal input difficulty selects the six-vertex Euler-path preset', async ({ page }) => {
    await page.addInitScript(() => {
      try { localStorage.setItem('dsvisual.inputDifficulty.global', 'edge'); } catch (error) { /* ignore */ }
    });
    await page.goto(FILE_URI + '#m=graph-euler');
    await expect(page.locator('.geu-tier')).toContainText('Challenge');
    await expect(page.locator('.geu-graph .geu-node')).toHaveCount(6);
    await scrubTo(page, null);
    await expect(page.locator('[data-testid="geu-banner"]')).toContainText('Euler path exists');
  });

  test('random input follows the inline difficulty and stays fully walkable', async ({ page }) => {
    await page.goto(FILE_URI + '#m=graph-euler');
    await page.locator('[data-testid="viz-difficulty"]').selectOption('edge');
    await page.locator('.geu-random').click();
    await expect(page.locator('.geu-tier')).toContainText('Challenge');
    await expect(page.locator('.geu-graph .geu-node')).toHaveCount(7);
    await scrubTo(page, null);
    await expect(page.locator('[data-testid="geu-banner"]')).toContainText('done');
    await expect(page.locator('[data-testid="geu-msg"]')).toContainText('each used exactly once');
  });

  test('editable input saves a valid example and handles the no-edge boundary', async ({ page }) => {
    await page.goto(FILE_URI + '#m=graph-euler');
    const before = await page.locator('.ex-select option').count();
    await page.locator('.geu-n').fill('4');
    await page.locator('.geu-start').fill('0');
    await page.locator('.geu-edges').fill('0-1,1-2,2-3,3-0');
    await page.locator('.geu-apply').click();
    await expect(page.locator('.ex-select option')).toHaveCount(before + 1);
    await scrubTo(page, null);
    await expect(page.locator('[data-testid="geu-banner"]')).toContainText('Euler circuit exists');

    await page.locator('.geu-edges').fill('');
    await page.locator('.geu-apply').click();
    await expect(page.locator('.geu-warning')).toContainText('no Euler circuit');
  });

  test('an out-of-range start vertex produces a visible validation error', async ({ page }) => {
    await page.goto(FILE_URI + '#m=graph-euler');
    await page.locator('.geu-start').fill('9');
    await page.locator('.geu-apply').click();
    await expect(page.locator('.geu-error')).toContainText('Start vertex must be between 0 and 4');
  });

  test('a self-loop is rejected with a warning instead of breaking the walk', async ({ page }) => {
    await page.goto(FILE_URI + '#m=graph-euler');
    await page.locator('.geu-edges').fill('0-1,1-2,2-0,3-3');
    await page.locator('.geu-apply').click();
    await expect(page.locator('.geu-warning')).toContainText('Ignored self-loop');
    await scrubTo(page, null);
    await expect(page.locator('[data-testid="geu-banner"]')).toContainText('Euler circuit exists');
  });
});
