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

  test('two-tier difficulty: inline per-viz override is independent of the global setting', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=tree-trie');
    const inline = page.locator('.viz-difficulty').first();
    await expect(inline).toBeVisible();
    // it sits right after the examples select
    const isSibling = await page.evaluate(() => {
      const ex = document.querySelector('.ex-select');
      return !!(ex && ex.nextElementSibling && ex.nextElementSibling.classList.contains('viz-difficulty'));
    });
    expect(isSibling).toBe(true);
    await expect(inline).toHaveValue('');                    // follows global by default

    // set the GLOBAL difficulty via the settings drawer
    await page.click('#settings-toggle');
    await page.selectOption('#input-difficulty', 'large');
    await page.click('[data-settings-close]');
    await expect(inline).toHaveValue('');                    // still follows global (no per-viz override yet)

    // set the inline PER-VIZ override
    await inline.selectOption('edge');
    const store = await page.evaluate(() => ({
      g: localStorage.getItem('dsvisual.inputDifficulty.global'),
      v: localStorage.getItem('dsvisual.inputDifficulty.viz.tree-trie'),
    }));
    expect(store.g).toBe('large');                           // global unchanged
    expect(store.v).toBe('edge');                            // per-viz override independent
  });

  test('trie random button generates a valid word set', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=tree-trie');
    await page.click('.trie-random');
    const words = await page.locator('.trie-words').inputValue();
    expect(words).toMatch(/^[A-Z]+(,[A-Z]+)*$/);             // valid A–Z word list
    const scrub = page.locator('.stepctl .stepctl-scrubber');
    await scrub.evaluate((el) => { el.value = el.max; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await expect(page.locator('.trie-svg .trie-node').first()).toBeVisible();
    const n = await page.locator('.trie-svg .trie-node').count();
    expect(n).toBeGreaterThan(1);                            // a trie was built
  });

  test('fullscreen auto-fits the trie SVG and preserves the VCR cursor', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=tree-trie');
    const step = page.locator('.stepctl [data-action="step"]');
    await step.click(); await step.click(); await step.click();   // land on a mid frame
    const svgW = () => page.locator('.trie-svg').getAttribute('width').then((v) => parseFloat(v));
    const beforeW = await svgW();
    const beforeCount = await page.locator('.stepctl-count').textContent();

    await page.locator('.method-section-card.active .viz-focus-toggle').click();
    await expect.poll(async () => await svgW()).toBeGreaterThan(beforeW);   // SVG grew to fit the window
    expect(await page.locator('.stepctl-count').textContent()).toBe(beforeCount);   // cursor unchanged

    await page.locator('#viz-focus-exit').click();
    await expect.poll(async () => await svgW()).toBeLessThanOrEqual(beforeW + 1);    // back to natural size
  });
});
