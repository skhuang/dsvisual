const { test, expect } = require('@playwright/test');
const { loadMethod } = require('./helpers');
const path = require('path');

const heapModes = [
    { id: 'heap-binary', file: 'heap_binary.cpp', title: 'Binary Heap' },
    { id: 'heap-binomial', file: 'heap_binomial.cpp', title: 'Binomial Heap' },
    { id: 'heap-fibonacci', file: 'heap_fibonacci.cpp', title: 'Fibonacci Heap' },
    { id: 'heap-leftist', file: 'heap_leftist.cpp', title: 'Leftist Heap' },
    { id: 'heap-skew', file: 'heap_skew.cpp', title: 'Skew Heap' },
    { id: 'heap-dary', file: 'heap_dary.cpp', title: 'D-ary Heap' },
    { id: 'heap-pairing', file: 'heap_pairing.cpp', title: 'Pairing Heap' },
];

test.describe('Heap Visualizer Suite', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {}
        });
        const fileUri = 'file://' + path.resolve(__dirname, '../index.html');
        await page.goto(fileUri);
    });

    for (const mode of heapModes) {
        test(`${mode.id}: menu selection activates card and opens slides`, async ({ page }) => {
            await loadMethod(page, mode.id);

            const card = page.locator(`[data-method-section="${mode.id}"]`);
            await expect(card).toBeVisible();
            await expect(card.locator('.code-panel-filename')).toHaveText(mode.file);

            await card.locator('.method-slides-btn').click();
            await expect(page.locator('[data-testid="slide-viewer"]')).toBeVisible();
            // Bar now shows deckTitle only; slide.title is injected as <h1> in the body.
            await expect(page.locator('.slideviewer-slide h1.slide-title').first()).toContainText(mode.title);

            await page.locator('.slideviewer-close').click();
            await expect(page.locator('[data-testid="slide-viewer"]')).toBeHidden();
        });
    }
});
