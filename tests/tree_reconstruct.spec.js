const { test, expect } = require('@playwright/test');
const { loadMethod } = require('./helpers');
const path = require('path');

test.describe('Reconstruct Tree', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
        await page.goto('file://' + path.resolve(__dirname, '../index.html'));
        await loadMethod(page, 'tree-reconstruct');
    });

    for (const mode of ['pre-in', 'post-in', 'pre-post']) {
        test('mode ' + mode + ' reconstructs to inorder D B E A C', async ({ page }) => {
            const sec = page.locator('[data-method-section="tree-reconstruct"]');
            await sec.locator('.rc-mode-btn[data-mode="' + mode + '"]').click();
            await sec.locator('.rc-apply').click();               // apply the mode's default sample
            await sec.locator('.stepctl [data-action="run"]').click();
            await expect(sec.locator('.rc-verdict.rc-ok')).toContainText('D B E A C', { timeout: 15000 });
        });
    }

    test('pre-post with a non-full tree reports ambiguity', async ({ page }) => {
        const sec = page.locator('[data-method-section="tree-reconstruct"]');
        await sec.locator('.rc-mode-btn[data-mode="pre-post"]').click();
        await sec.locator('.rc-seq1').fill('A B');
        await sec.locator('.rc-seq2').fill('B A');
        await sec.locator('.rc-apply').click();
        await sec.locator('.stepctl [data-action="run"]').click();
        await expect(sec.locator('.rc-verdict.rc-err')).toContainText('ambiguous', { timeout: 15000 });
    });
});
