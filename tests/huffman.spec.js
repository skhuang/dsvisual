const { test, expect } = require('@playwright/test');
const { loadMethod } = require('./helpers');
const path = require('path');

test.describe('Huffman Coding Visualization', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {}
        });
        const fileUri = 'file://' + path.resolve(__dirname, '../index.html');
        await page.goto(fileUri);
    });

    test('huffman: stepping through shows code table at final step', async ({ page }) => {
        // 1. Navigate to huffman method
        await loadMethod(page, 'huffman');

        // 2. Assert code panel filename contains huffman.cpp
        const section = page.locator('[data-method-section="huffman"]');
        await expect(section.locator('.code-panel-filename')).toContainText('huffman.cpp');

        // 3. Click Step ~25 times
        const stepBtn = section.locator('.stepctl [data-action="step"]');
        for (let i = 0; i < 25; i++) {
            await stepBtn.click();
        }

        // 4. Assert .hf-code-table is visible
        await expect(section.locator('.hf-code-table')).toBeVisible();
    });
});
