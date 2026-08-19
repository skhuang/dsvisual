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

    // Not just a count: the first two edges must actually run from node 0's center
    // to node 1's and node 2's centers (edges are emitted in node order starting at i=1,
    // so edge index 0 is node1's parent-edge and edge index 1 is node2's).
    const centers = await nodes.evaluateAll((els) => els.map((el) => ({
      cx: parseFloat(el.getAttribute('cx')), cy: parseFloat(el.getAttribute('cy')),
    })));
    const edgeEndpoints = await tree.locator('.heaptree-edge').evaluateAll((els) => els.map((el) => ({
      x1: parseFloat(el.getAttribute('x1')), y1: parseFloat(el.getAttribute('y1')),
      x2: parseFloat(el.getAttribute('x2')), y2: parseFloat(el.getAttribute('y2')),
    })));
    const closeTo = (a, b) => Math.abs(a - b) < 0.05;
    for (const childIdx of [1, 2]) {
      const e = edgeEndpoints[childIdx - 1];
      expect(closeTo(e.x1, centers[0].cx) && closeTo(e.y1, centers[0].cy)).toBe(true);
      expect(closeTo(e.x2, centers[childIdx].cx) && closeTo(e.y2, centers[childIdx].cy)).toBe(true);
    }
  });

  test('deepest-level siblings never overlap once the heap reaches 16+ elements (regression)', async ({ page }) => {
    await loadMethod(page, 'sort-heap');
    const card = page.locator('[data-method-section="sort-heap"]');
    const input = card.locator('[data-testid="sortviz-input"]');
    const vals = Array.from({ length: 20 }, (_, i) => i + 1); // 20 = parseArr's cap; hits the deepest full-ish level
    await input.fill(vals.join(','));
    await card.locator('.sortviz-build').click();

    const tree = card.locator('[data-testid="heaptree"]');
    const n = vals.length;
    const depth = Math.floor(Math.log2(n)) + 1;

    const circles = tree.locator('.heaptree-node');
    await expect(circles).toHaveCount(n);
    const info = await circles.evaluateAll((els) => els.map((el) => ({
      cx: parseFloat(el.getAttribute('cx')), r: parseFloat(el.getAttribute('r')),
    })));

    const deepest = [];
    for (let i = 0; i < n; i++) {
      const L = Math.floor(Math.log2(i + 1));
      if (L === depth - 1) deepest.push(info[i]);
    }
    // Sanity: this fixture must actually exercise multiple siblings at the deepest level,
    // otherwise the assertion below would pass vacuously.
    expect(deepest.length).toBeGreaterThan(1);

    deepest.sort((a, b) => a.cx - b.cx);
    for (let i = 1; i < deepest.length; i++) {
      const gap = deepest[i].cx - deepest[i - 1].cx;
      const touchingThreshold = deepest[i].r + deepest[i - 1].r;
      expect(gap).toBeGreaterThanOrEqual(touchingThreshold);
    }
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
