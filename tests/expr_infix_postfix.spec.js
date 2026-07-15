const { test, expect } = require('@playwright/test');
const { loadMethod } = require('./helpers');
const path = require('path');

test.describe('Infix → Postfix', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
        await page.goto('file://' + path.resolve(__dirname, '../index.html'));
        await loadMethod(page, 'expr-infix-postfix');
    });

    test('steps through convert then eval; postfix shown; code filename', async ({ page }) => {
        const sec = page.locator('[data-method-section="expr-infix-postfix"]');
        await expect(sec.locator('.code-panel-filename')).toContainText('expr_infix_postfix.cpp');
        const step = sec.locator('.stepctl [data-action="step"]');
        for (let i = 0; i < 10; i++) await step.click();
        await expect(sec.locator('.expr-phasebadge')).toContainText('A B C + * D *');
    });
});
