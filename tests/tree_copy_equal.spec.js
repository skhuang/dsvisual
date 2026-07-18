const { test, expect } = require('@playwright/test');
const { loadMethod } = require('./helpers');
const path = require('path');

test.describe('Tree COPY & EQUAL', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
        await page.goto('file://' + path.resolve(__dirname, '../index.html'));
        await loadMethod(page, 'tree-copy-equal');
    });

    test('COPY verifies the copy equals the original', async ({ page }) => {
        const sec = page.locator('[data-method-section="tree-copy-equal"]');
        await sec.locator('.stepctl [data-action="run"]').click();
        await expect(sec.locator('.ce-verdict.ce-ok')).toContainText('yes', { timeout: 15000 });
    });

    test('EQUAL of two equal trees reports equal', async ({ page }) => {
        const sec = page.locator('[data-method-section="tree-copy-equal"]');
        await sec.locator('.ce-mode-btn[data-mode="equal"]').click();
        await sec.locator('.ce-preset[data-p="equal"]').click();
        await sec.locator('.stepctl [data-action="run"]').click();
        await expect(sec.locator('.ce-verdict.ce-ok')).toContainText('equal', { timeout: 15000 });
    });

    test('EQUAL of a differing pair marks a mismatch', async ({ page }) => {
        const sec = page.locator('[data-method-section="tree-copy-equal"]');
        await sec.locator('.ce-mode-btn[data-mode="equal"]').click();
        await sec.locator('.ce-preset[data-p="diff"]').click();
        await sec.locator('.stepctl [data-action="run"]').click();
        await expect(sec.locator('.ce-verdict.ce-err')).toContainText('differ', { timeout: 15000 });
        await expect(sec.locator('.tree-node.ce-mismatch').first()).toBeVisible();
    });
});
