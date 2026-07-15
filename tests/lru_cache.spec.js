const { test, expect } = require('@playwright/test');
const { loadMethod } = require('./helpers');
const path = require('path');

test.describe('LRU Cache', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
        await page.goto('file://' + path.resolve(__dirname, '../index.html'));
        await loadMethod(page, 'cache-lru');
    });

    test('renders cache stage + code filename, steps through hits/evictions', async ({ page }) => {
        const sec = page.locator('[data-method-section="cache-lru"]');
        await expect(sec.locator('.code-panel-filename')).toContainText('lru_cache.cpp');

        const stage = sec.locator('[data-testid="lru-stage"]');
        await expect(stage).toBeVisible();

        const step = sec.locator('.stepctl [data-action="step"]');
        for (let i = 0; i < 8; i++) await step.click();

        // Default run: cap 3, keys 1,2,3,1,4,5,1 -> 2 hits, 5 misses, evictions occur.
        await expect(sec.locator('[data-testid="lru-stats"]')).toContainText('hits 2');
        await expect(sec.locator('[data-testid="lru-stats"]')).toContainText('misses 5');
        await expect(stage).toContainText('MRU');
        await expect(stage).toContainText('LRU');
    });

    test('Apply re-runs with a custom capacity and key sequence', async ({ page }) => {
        const sec = page.locator('[data-method-section="cache-lru"]');
        await sec.locator('.lru-cap').fill('2');
        await sec.locator('.lru-input').fill('7,8,7,9');
        await sec.locator('.lru-apply').click();

        const step = sec.locator('.stepctl [data-action="step"]');
        for (let i = 0; i < 5; i++) await step.click();

        // cap 2: 7,8 -> [8,7]; 7 hit -> [7,8]; 9 miss evicts LRU 8.
        await expect(sec.locator('[data-testid="lru-stats"]')).toContainText('cap 2');
        await expect(sec.locator('[data-testid="lru-stats"]')).toContainText('hits 1');
        await expect(sec.locator('[data-testid="lru-stage"]')).toContainText('9');
    });
});
