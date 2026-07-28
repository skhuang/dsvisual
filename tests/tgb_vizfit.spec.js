const { test, expect } = require('@playwright/test'); const path = require('path');
const FILE_URI = 'file://' + path.resolve(__dirname, '../index.html');

test.describe('tree-general-binary vizfit + examples + random', () => {
  test('vizfit wrap + examples + 🎲; both panels render + step', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=tree-general-binary');
    await expect(page.locator('.tgb-wrap.vizfit-host')).toHaveCount(1);
    const scroll = page.locator('.tgb-scroll.vizfit-scroll');
    await expect(scroll).toHaveCount(1);
    expect(await scroll.evaluate((el) => el.clientHeight <= window.innerHeight - 120)).toBe(true);
    await expect(page.locator('.ex-select')).toBeVisible();
    await expect(page.locator('.tgb-random')).toBeVisible();
    expect(await page.locator('.tgb-general .tree-node').count()).toBeGreaterThan(0);
    expect(await page.locator('.tgb-binary .tree-node').count()).toBeGreaterThan(0);
    const scrub = page.locator('.stepctl .stepctl-scrubber');
    await scrub.evaluate((el) => { el.value = el.max; el.dispatchEvent(new Event('input', { bubbles: true })); });
    expect(await page.locator('.tgb-binary-edges line').count()).toBeGreaterThan(0);
  });

  test('🎲 generates a valid tree; Build saves an example', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=tree-general-binary');
    await page.click('.tgb-random');
    const v = await page.locator('.tgb-input').inputValue();
    expect(v).toMatch(/^[A-Z:,;]+$/);
    expect(await page.locator('.tgb-general .tree-node').count()).toBeGreaterThan(0);
    await page.fill('.tgb-input', 'A:B,C');
    await page.click('.tgb-build');
    expect(await page.locator('.tgb-general .tree-node').count()).toBe(3);
    const opts = await page.locator('.ex-select option').count();
    expect(opts).toBeGreaterThan(2);   // placeholder + default + built-in/saved
  });

  test('fullscreen: card viz-fit, VCR operable, zoom toolbar; code drawer hidden', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=tree-general-binary');
    await page.locator('.method-section-card.active .viz-focus-toggle').click();
    await expect(page.locator('.method-section-card.active')).toHaveClass(/viz-fit(\s|$)/);
    const inView = await page.locator('.stepctl').evaluate((el) => el.getBoundingClientRect().bottom <= window.innerHeight + 1);
    expect(inView).toBe(true);
    await expect(page.locator('.viz-zoom-controls')).toBeVisible();
    await expect(page.locator('[data-method-section="tree-general-binary"] .code-drawer')).toBeHidden();
  });
});
