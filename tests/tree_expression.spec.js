const { test, expect } = require('@playwright/test');
const { loadMethod } = require('./helpers');
const path = require('path');

test.describe('Expression Tree', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
        await page.goto('file://' + path.resolve(__dirname, '../index.html'));
        await loadMethod(page, 'tree-expression');
    });

    test('builds the tree and shows the evaluated result; code filename', async ({ page }) => {
        const sec = page.locator('[data-method-section="tree-expression"]');
        await expect(sec.locator('.code-panel-filename')).toContainText('tree_expression.cpp');
        await expect(sec.locator('.et-stage')).toBeVisible();
        const step = sec.locator('.stepctl [data-action="step"]');
        for (let i = 0; i < 10; i++) await step.click();
        await expect(sec.locator('.et-result')).toContainText('35');
        await expect(sec.locator('.et-nodes .tree-node.et-op').first()).toBeVisible();
    });

    test('boolean mode: builds tree, sweeps truth table, reports verdict', async ({ page }) => {
        const sec = page.locator('[data-method-section="tree-expression"]');
        await sec.locator('.et-mode-btn[data-mode="bool"]').click();
        // apply a tautology preset
        await sec.locator('.et-input').fill('a a ! |');
        await sec.locator('.et-apply').click();
        await expect(sec.locator('.et-asg-btn')).toHaveCount(1); // one variable: a
        const run = sec.locator('.stepctl [data-action="run"]');
        await run.click();
        await expect(sec.locator('.et-verdict')).toContainText('tautology', { timeout: 15000 });
        await expect(sec.locator('table.et-tt tbody tr')).toHaveCount(2); // 2^1 rows
    });

    test('boolean mode does not break arithmetic mode', async ({ page }) => {
        const sec = page.locator('[data-method-section="tree-expression"]');
        await sec.locator('.et-mode-btn[data-mode="bool"]').click();
        await sec.locator('.et-mode-btn[data-mode="arith"]').click();
        const step = sec.locator('.stepctl [data-action="step"]');
        for (let i = 0; i < 10; i++) await step.click();
        await expect(sec.locator('.et-result')).toContainText('35');
    });
});
