const { test, expect } = require('@playwright/test');
const { loadMethod } = require('./helpers');
const path = require('path');

const fileUri = 'file://' + path.resolve(__dirname, '../index.html');

test.describe('Heap Sort tree view', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(fileUri);
  });

  test('renders a heap-tree with n nodes matching the array, and edges from the root', async ({ page }) => {
    await loadMethod(page, 'sort-heap');
    const card = page.locator('[data-method-section="sort-heap"]');
    const tree = card.locator('[data-testid="heaptree"]');
    await expect(tree).toBeVisible();

    const input = card.locator('[data-testid="sortviz-input"]');
    const inputVal = await input.inputValue();
    const arr = inputVal.split(/[\s,]+/).map((s) => parseInt(s, 10)).filter(Number.isFinite);
    const n = arr.length;

    const nodes = tree.locator('.heaptree-node');
    await expect(nodes).toHaveCount(n);

    // Values in index order equal the current (initial) array.
    const labels = tree.locator('.heaptree-label');
    const texts = await labels.allTextContents();
    expect(texts.map((t) => parseInt(t, 10))).toEqual(arr);

    // Parent->child edges: node 0 connects to nodes 1 and 2 when n>=3.
    expect(n).toBeGreaterThanOrEqual(3);
    const edgeCount = await tree.locator('.heaptree-edge').count();
    expect(edgeCount).toBe(n - 1);
  });

  test('active nodes highlight during sift-down/extract, and extracted tail greys out', async ({ page }) => {
    await loadMethod(page, 'sort-heap');
    const card = page.locator('[data-method-section="sort-heap"]');
    const tree = card.locator('[data-testid="heaptree"]');
    const step = card.locator('.stepctl [data-action="step"]');
    const scrub = card.locator('.stepctl-scrubber');
    const max = parseInt(await scrub.getAttribute('max'), 10);

    // Step forward until we see an active node (a sift-down/extract highlight frame).
    let sawActive = false;
    for (let i = 0; i < max; i++) {
      await step.click();
      const activeCount = await tree.locator('.heaptree-node.active').count();
      if (activeCount > 0) { sawActive = true; break; }
    }
    expect(sawActive).toBe(true);

    // Continue stepping until an extract has produced a sorted (greyed) tail node.
    let sawSorted = false;
    for (let i = 0; i < max; i++) {
      const sortedCount = await tree.locator('.heaptree-node.sorted').count();
      if (sortedCount > 0) { sawSorted = true; break; }
      await step.click();
    }
    expect(sawSorted).toBe(true);
  });

  test('other sorts render no heap tree', async ({ page }) => {
    await loadMethod(page, 'sort-bubble');
    const card = page.locator('[data-method-section="sort-bubble"]');
    await expect(card.locator('[data-testid="heaptree"]')).toHaveCount(0);
  });
});
