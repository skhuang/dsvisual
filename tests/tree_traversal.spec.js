const { test, expect } = require('@playwright/test');
const { loadMethod } = require('./helpers');
const path = require('path');

test.describe('Tree Traversal Visualization', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {}
        });
        const fileUri = 'file://' + path.resolve(__dirname, '../index.html');
        await page.goto(fileUri);
    });

    test('tree-traversal: inorder iterative step produces output sequence', async ({ page }) => {
        // 1. Navigate to tree-traversal method
        await loadMethod(page, 'tree-traversal');

        // 2. Assert code panel filename contains tree_traversal.cpp
        const section = page.locator('[data-method-section="tree-traversal"]');
        await expect(section.locator('.code-panel-filename')).toContainText('tree_traversal.cpp');

        // 3. Select inorder + iterative
        await section.locator('.tt-order').selectOption('inorder');
        await section.locator('.tt-mode').selectOption('iterative');

        // 4. Click Step ~12 times
        const stepBtn = section.locator('.stepctl [data-action="step"]');
        for (let i = 0; i < 12; i++) {
            await stepBtn.click();
        }

        // 5. Assert .tt-seq is non-empty
        const seqSpan = section.locator('.tt-seq');
        await expect(seqSpan).not.toBeEmpty();
    });
});
