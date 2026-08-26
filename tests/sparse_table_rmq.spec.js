const { test, expect } = require('@playwright/test');
const { loadMethod } = require('./helpers');
const path = require('path');

test.describe('Sparse Table (RMQ)', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
        await page.goto('file://' + path.resolve(__dirname, '../index.html'));
        await loadMethod(page, 'sparse-table-rmq');
    });

    test('builds the doubling table, steps to the query answer; code filename', async ({ page }) => {
        const sec = page.locator('[data-method-section="sparse-table-rmq"]');
        await expect(sec.locator('.code-panel-filename')).toContainText('sparse_table_rmq.cpp');
        await expect(sec.locator('.spt-grid').first()).toBeVisible();

        const step = sec.locator('.stepctl [data-action="step"]');
        const msg = sec.locator('[data-testid="spt-msg"]');
        // Default input is arr=[7,2,3,9,4,6,1,8], query [1,4] -> min(2,3,9,4) = 2.
        for (let i = 0; i < 40; i++) {
            const text = await msg.textContent();
            if (text && text.includes('answer')) break;
            await step.click();
        }
        await expect(msg).toContainText('answer = min(2, 2) = 2');
    });

    test('edit array + range, rebuild, and reach the new answer', async ({ page }) => {
        const sec = page.locator('[data-method-section="sparse-table-rmq"]');
        await sec.locator('.spt-arr').fill('5,1,4,2,8,3');
        await sec.locator('.spt-range').fill('0,5');
        await sec.locator('.spt-build').click();

        const step = sec.locator('.stepctl [data-action="step"]');
        const msg = sec.locator('[data-testid="spt-msg"]');
        for (let i = 0; i < 40; i++) {
            const text = await msg.textContent();
            if (text && text.includes('answer')) break;
            await step.click();
        }
        // min of [5,1,4,2,8,3] over the whole array is 1.
        await expect(msg).toContainText('= 1');
    });

    test('handles a single-element array without erroring', async ({ page }) => {
        const sec = page.locator('[data-method-section="sparse-table-rmq"]');
        await sec.locator('.spt-arr').fill('42');
        await sec.locator('.spt-range').fill('0,0');
        await sec.locator('.spt-build').click();
        await expect(sec.locator('.spt-cell').first()).toContainText('42');

        const step = sec.locator('.stepctl [data-action="step"]');
        const msg = sec.locator('[data-testid="spt-msg"]');
        for (let i = 0; i < 10; i++) {
            const text = await msg.textContent();
            if (text && text.includes('answer')) break;
            await step.click();
        }
        await expect(msg).toContainText('answer = min(42, 42) = 42');
    });

    test('empty/invalid array input falls back to the default array instead of breaking', async ({ page }) => {
        const sec = page.locator('[data-method-section="sparse-table-rmq"]');
        await sec.locator('.spt-arr').fill('');
        await sec.locator('.spt-build').click();
        // Falls back to the default array [7,2,3,9,4,6,1,8], 8 cells wide.
        await expect(sec.locator('.spt-row').first().locator('.spt-idx')).toHaveCount(8);
    });
});
