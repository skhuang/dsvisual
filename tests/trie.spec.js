const { test, expect } = require('@playwright/test'); const path = require('path');
const FILE_URI = 'file://' + path.resolve(__dirname, '../index.html');

test.describe('tree-trie (VCR stepping)', () => {
  test('build default: scrub to end reveals all 9 nodes + 5 word-ends', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=tree-trie');
    await expect(page.locator('.trie-wrap')).toBeVisible();
    await expect(page.locator('.stepctl .stepctl-scrubber')).toBeVisible();
    const scrub = page.locator('.stepctl .stepctl-scrubber');
    await scrub.evaluate((el) => { el.value = el.max; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await expect(page.locator('.trie-svg .trie-node')).toHaveCount(9);
    await expect(page.locator('.trie-svg .trie-node-end')).toHaveCount(5);
    await expect(page.locator('.trie-banner')).toContainText('Done');
  });

  test('search mode: CAR → FOUND; miss demo → NOT FOUND', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=tree-trie');
    await page.selectOption('.trie-mode', 'search');
    let scrub = page.locator('.stepctl .stepctl-scrubber');
    await scrub.evaluate((el) => { el.value = el.max; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await expect(page.locator('.trie-banner')).toContainText('FOUND');

    await page.selectOption('.ex-select', { label: 'Miss demo' });
    await page.selectOption('.trie-mode', 'search');
    scrub = page.locator('.stepctl .stepctl-scrubber');
    await scrub.evaluate((el) => { el.value = el.max; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await expect(page.locator('.trie-banner')).toContainText('NOT FOUND');
  });

  test('custom words + Apply updates the trie and saves an example; code drawer hidden', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=tree-trie');
    await page.fill('.trie-words', 'AB, AC');
    await page.click('.trie-apply');
    const scrub = page.locator('.stepctl .stepctl-scrubber');
    await scrub.evaluate((el) => { el.value = el.max; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await expect(page.locator('.trie-svg .trie-node')).toHaveCount(4);   // root + A + B + C = 4
    await expect(page.locator('[data-method-section="tree-trie"] .code-drawer')).toBeHidden();
  });
});
