const { test, expect } = require('@playwright/test');
const path = require('path');

const heapModes = [
    { id: 'heap-binary', file: 'heap_binary.cpp', title: 'Binary Heap' },
    { id: 'heap-binomial', file: 'heap_binomial.cpp', title: 'Binomial Heap' },
    { id: 'heap-fibonacci', file: 'heap_fibonacci.cpp', title: 'Fibonacci Heap' },
    { id: 'heap-leftist', file: 'heap_leftist.cpp', title: 'Leftist Heap' },
    { id: 'heap-skew', file: 'heap_skew.cpp', title: 'Skew Heap' },
    { id: 'heap-dary', file: 'heap_dary.cpp', title: '4-ary Heap' },
    { id: 'heap-pairing', file: 'heap_pairing.cpp', title: 'Pairing Heap' },
];

async function loadMethod(page, methodId) {
    const categoryButtons = page.locator('[data-testid="category-nav"] .category-nav-btn');
    const count = await categoryButtons.count();
    for (let i = 0; i < count; i++) {
        await categoryButtons.nth(i).click();
        await page.waitForSelector('[data-method-section]', { timeout: 5000 });
        const card = page.locator(`[data-method-section="${methodId}"]`);
        if (await card.count()) {
            await card.locator('.method-load-btn').click();
            return;
        }
    }
    throw new Error(`Method ${methodId} not found`);
}

test.describe('Heap Visualizer Suite', () => {
    test.beforeEach(async ({ page }) => {
        const fileUri = 'file://' + path.resolve(__dirname, '../index.html');
        await page.goto(fileUri);
    });

    for (const mode of heapModes) {
        test(`${mode.id}: method card loads and opens slides`, async ({ page }) => {
            await loadMethod(page, mode.id);

            const card = page.locator(`[data-method-section="${mode.id}"]`);
            await expect(card).toBeVisible();
            await expect(card.locator('.method-section-code')).toContainText(mode.file);

            await card.locator('.method-slides-btn').click();
            await expect(page.locator('[data-testid="slide-viewer"]')).toBeVisible();
            await expect(page.locator('#slide-viewer-title')).toContainText(mode.title);

            await page.locator('.slide-viewer-close').click();
            await expect(page.locator('[data-testid="slide-viewer"]')).toBeHidden();
        });
    }
});
