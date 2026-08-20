// tests/lab.spec.js
const { test, expect } = require('@playwright/test');
const path = require('path');
const { loadMethod } = require('./helpers.js');

test.describe('lab entry point', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto('file://' + path.resolve(__dirname, '../index.html'));
  });

  test('Lab button shows on graph-dijkstra when a LAB_RENDERED entry exists', async ({ page }) => {
    await loadMethod(page, 'graph-dijkstra');
    await expect(page.locator('[data-method-section="graph-dijkstra"] .method-lab-btn')).toBeVisible();
  });

  test('Lab button hidden when its LAB_RENDERED entry is removed before first render', async ({ page }) => {
    // graph-bfs has no entry to begin with (no-op deletion, kept for coverage of the
    // "never had a lab" path); graph-dijkstra DOES have one, so deleting it here is the
    // case that actually exercises removal-gating end to end.
    await page.evaluate(() => {
      if (window.LAB_RENDERED) {
        delete window.LAB_RENDERED['graph-bfs'];
        delete window.LAB_RENDERED['graph-dijkstra'];
      }
    });
    await loadMethod(page, 'graph-bfs');
    await expect(page.locator('[data-method-section="graph-bfs"] .method-lab-btn')).toHaveCount(0);
    await loadMethod(page, 'graph-dijkstra');
    await expect(page.locator('[data-method-section="graph-dijkstra"] .method-lab-btn')).toHaveCount(0);
  });

  test('opening Lab shows statement, samples, repo link, and the Practice-on-dsjudge link', async ({ page }) => {
    await loadMethod(page, 'graph-dijkstra');
    await page.locator('[data-method-section="graph-dijkstra"] .method-lab-btn').click();
    const v = page.locator('#lab-viewer');
    await expect(v).toBeVisible();
    await expect(v.locator('[data-testid="lab-statement"]')).toContainText(/最短|shortest|dijkstra/i);
    await expect(v.locator('[data-testid="lab-samples"]')).toContainText('0 3 1 4 7');
    const repo = v.locator('[data-testid="lab-open-repo"]');
    await expect(repo).toHaveAttribute('href', /ds2026-lab-dijkstra/);
    // Post go-live: dijkstra has a dsjudgeUrl, and with no maccount client
    // configured in this test the control falls back to an enabled bank link.
    const dsj = v.locator('a[data-testid="lab-dsjudge"]');
    await expect(dsj).toBeVisible();
    await expect(dsj).toHaveAttribute('href', 'https://ds2026summer.cs.nycu.edu.tw/bank/dijkstra');
    await page.keyboard.press('Escape');
    await expect(v).toBeHidden();
  });

  test('statement renders in English and toggles to Chinese', async ({ page }) => {
    await loadMethod(page, 'graph-dijkstra');
    await page.locator('[data-method-section="graph-dijkstra"] .method-lab-btn').click();
    const v = page.locator('#lab-viewer');
    const stmt = v.locator('[data-testid="lab-statement"]');
    // default lang is en (set in beforeEach): the English statement, not the zh fallback
    await expect(stmt).toContainText(/Single-Source Shortest Path|shortest path/i);
    await expect(stmt).not.toContainText('單源最短路徑');
    // toggling switches to the Chinese statement
    await v.locator('#lab-lang-toggle').click();
    await expect(stmt).toContainText('單源最短路徑');
  });
});
