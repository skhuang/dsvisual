const { test, expect } = require('@playwright/test'); const path = require('path');
const FILE_URI = 'file://' + path.resolve(__dirname, '../index.html');

test.describe('viz refinements', () => {
  test('trie edge labels are a dark, visible color', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=tree-trie');
    const step = page.locator('.stepctl [data-action="step"]');
    await step.click(); await step.click();                 // reveal an edge + its label
    const label = page.locator('.trie-edge-label').first();
    await expect(label).toHaveCount(1);
    const fill = await label.evaluate((el) => getComputedStyle(el).fill);
    expect(fill).toBe('rgb(30, 41, 59)');                    // #1e293b, not the old light #cbd5e1
  });
});
