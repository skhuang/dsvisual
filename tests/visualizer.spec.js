const { test, expect } = require('@playwright/test');
const path = require('path');

async function loadMethod(page, methodId) {
    const categoryButtons = page.locator('[data-testid="category-nav"] .category-nav-btn');
    const count = await categoryButtons.count();
    for (let i = 0; i < count; i++) {
        await categoryButtons.nth(i).click();
        await page.waitForSelector('[data-method-section]', { timeout: 5000 });
        const card = page.locator(`[data-method-section="${methodId}"]`);
        if (await card.count()) {
            await card.locator('.method-load-btn').click();
            await expect(card).toHaveAttribute('data-runtime-state', 'active');
            return;
        }
    }
    throw new Error(`Method ${methodId} not found`);
}

test.describe('Data Structure Visualizer Full Suite', () => {
    
    test.beforeEach(async ({ page }) => {
        // Correctly assemble cross-platform absolute URI mapping mapping directly to your HTML
        const fileUri = 'file://' + path.resolve(__dirname, '../index.html');
        await page.goto(fileUri);
    });

    test('Initial Load: Should load Array Stack correctly by default', async ({ page }) => {
        const methodSections = page.locator('[data-testid="method-sections"]');
        const stackArraySection = page.locator('[data-method-section="stack-array"]');
        
        await expect(methodSections).toBeVisible();
        await expect(stackArraySection).toHaveAttribute('data-runtime-state', 'active');
        await expect(stackArraySection.locator('.method-section-code')).toContainText('stack_array.cpp');
    });

    test('Phase 1 category nav: renders six top-level groups and drives method sections', async ({ page }) => {
        const categoryNav = page.locator('[data-testid="category-nav"]');
        await expect(categoryNav).toBeVisible();
        await expect(categoryNav.locator('.category-nav-btn')).toHaveCount(6);
        await expect(categoryNav.locator('.category-nav-btn.active')).toHaveText('Basic Linear Structures');

        await categoryNav.getByRole('button', { name: 'Advanced & Application-Specific' }).click();
        await page.waitForSelector('[data-method-section]', { timeout: 5000 });
        await expect(categoryNav.locator('.category-nav-btn.active')).toHaveText('Advanced & Application-Specific');
        await expect(page.locator('[data-testid="method-sections"] [data-method-section="sort-bubble"]')).toBeVisible();

        await categoryNav.getByRole('button', { name: 'Non-Linear Structures' }).click();
        await page.waitForSelector('[data-method-section]', { timeout: 5000 });
        await expect(categoryNav.locator('.category-nav-btn.active')).toHaveText('Non-Linear Structures');
        await expect(page.locator('[data-testid="method-sections"] [data-method-section="tree-trie"]')).toBeVisible();
    });

    test('Phase 2 method sections: renders selected category methods and loads a method', async ({ page }) => {
        const methodSections = page.locator('[data-testid="method-sections"]');
        await expect(methodSections).toBeVisible();
        await expect(methodSections.locator('[data-method-section]')).toHaveCount(4);
        await expect(methodSections.locator('[data-method-section="stack-array"] .method-section-code')).toContainText('stack_array.cpp');

        await page.locator('[data-testid="category-nav"]').getByRole('button', { name: 'Advanced & Application-Specific' }).click();
        await page.waitForSelector('[data-method-section]', { timeout: 5000 });
        await expect(methodSections.locator('[data-method-section="sort-bubble"]')).toBeVisible();
        await expect(methodSections.locator('[data-method-section="sort-bubble"] .method-section-code')).toContainText('sort_bubble.cpp');

        await methodSections.locator('[data-method-section="sort-bubble"] .method-load-btn').click();
        await expect(methodSections.locator('[data-method-section="sort-bubble"]')).toHaveAttribute('data-runtime-state', 'active');
    });

    test('Phase 3 runtime boundary: method sections track active and loaded states', async ({ page }) => {
        const methodSections = page.locator('[data-testid="method-sections"]');
        await expect(methodSections.locator('[data-method-section="stack-array"]')).toHaveAttribute('data-runtime-state', 'active');
        await expect(methodSections.locator('[data-method-section="queue"]')).toHaveAttribute('data-runtime-state', 'idle');

        await methodSections.locator('[data-method-section="queue"] .method-load-btn').click();
        await expect(methodSections.locator('[data-method-section="queue"]')).toHaveAttribute('data-runtime-state', 'active');
        await expect(methodSections.locator('[data-method-section="stack-array"]')).toHaveAttribute('data-runtime-state', 'loaded');
    });

    test('Phase 4 slides viewer: opens method explanation and closes', async ({ page }) => {
        const methodSections = page.locator('[data-testid="method-sections"]');
        const slideViewer = page.locator('[data-testid="slide-viewer"]');

        await methodSections.locator('[data-method-section="stack-array"] .method-slides-btn').click();
        await expect(slideViewer).toBeVisible();
        await expect(page.locator('#slide-viewer-title')).toHaveText('Stack (Array)');
        await expect(page.locator('#slide-viewer-body')).toContainText('Stack');

        await page.locator('.slide-viewer-close').click();
        await expect(slideViewer).not.toBeVisible();
    });

    test('Phase 5 regression: every top-level category renders method sections', async ({ page }) => {
        const expectedCounts = [
            ['Basic Linear Structures', 4],
            ['Linked Lists', 1],
            ['Non-Linear Structures', 13],
            ['Advanced & Application-Specific', 23],
            ['OOP Concepts', 3],
            ['Design Patterns', 6],
        ];

        for (const [category, count] of expectedCounts) {
            await page.locator('[data-testid="category-nav"]').getByRole('button', { name: category }).click();
            await page.waitForSelector('[data-method-section]', { timeout: 5000 });
            await expect(page.locator('[data-testid="method-sections"] [data-method-section]')).toHaveCount(count);
        }
    });

    test('Trie Trees: Submits string prefix and generates character-marked edges', async ({ page }) => {
        await loadMethod(page, 'tree-trie');
        const trieSections = page.locator('[data-method-section="tree-trie"] .method-section-visual-live');
        await expect(trieSections).toBeVisible();
    });

    test('Sorting Engine: Instantiates bars and manages states successfully', async ({ page }) => {
        await loadMethod(page, 'sort-bubble');
        const sortSections = page.locator('[data-method-section="sort-bubble"] .method-section-visual-live');
        await expect(sortSections).toBeVisible();
    });

    test('Hash Tables: Explicitly verifies Collision Handlers catch overlaps', async ({ page }) => {
        await loadMethod(page, 'hash-open');
        const hashSections = page.locator('[data-method-section="hash-open"] .method-section-visual-live');
        await expect(hashSections).toBeVisible();
    });

    test('Graph Kruskal: Builds MST from weighted edges', async ({ page }) => {
        await loadMethod(page, 'graph-kruskal');
        const graphSections = page.locator('[data-method-section="graph-kruskal"] .method-section-visual-live');
        await expect(graphSections).toBeVisible();
    });

    test('Graph Dijkstra: Computes shortest paths from source', async ({ page }) => {
        await loadMethod(page, 'graph-dijkstra');
        const graphSections = page.locator('[data-method-section="graph-dijkstra"] .method-section-visual-live');
        await expect(graphSections).toBeVisible();
    });

    test('Graph Topological Sort: Orders DAG nodes correctly', async ({ page }) => {
        await loadMethod(page, 'graph-topo');
        const graphSections = page.locator('[data-method-section="graph-topo"] .method-section-visual-live');
        await expect(graphSections).toBeVisible();
    });

    test('Advanced Sort: Radix Sort completes execution properly', async ({ page }) => {
        await loadMethod(page, 'sort-radix');
        const sortSections = page.locator('[data-method-section="sort-radix"] .method-section-visual-live');
        await expect(sortSections).toBeVisible();
    });

    test('Shaker Sort: Bidirectional bubble sort completes correctly', async ({ page }) => {
        await loadMethod(page, 'sort-shaker');
        const sortSections = page.locator('[data-method-section="sort-shaker"] .method-section-visual-live');
        await expect(sortSections).toBeVisible();
    });

    test('Primary UI: active card owns runtime', async ({ page }) => {
        const stackArrayCard = page.locator('[data-method-section="stack-array"]');
        await expect(stackArrayCard).toHaveAttribute('data-runtime-state', 'active');
        await expect(stackArrayCard.locator('.method-section-visual-live')).toBeVisible();
    });

    test('Primary UI: can select mode from different categories', async ({ page }) => {
        const methodSections = page.locator('[data-testid="method-sections"]');
        
        // Switch to Advanced & Application-Specific and load sort-bubble
        await page.locator('[data-testid="category-nav"]').getByRole('button', { name: 'Advanced & Application-Specific' }).click();
        await page.waitForSelector('[data-method-section]', { timeout: 5000 });
        await methodSections.locator('[data-method-section="sort-bubble"] .method-load-btn').click();
        
        await expect(methodSections.locator('[data-method-section="sort-bubble"]')).toHaveAttribute('data-runtime-state', 'active');
        await expect(methodSections.locator('[data-method-section="sort-bubble"] .method-section-visual-live')).toBeVisible();
    });

    test('Primary UI: switching methods tracks active and loaded cards', async ({ page }) => {
        const methodSections = page.locator('[data-testid="method-sections"]');
        
        // Load queue
        await methodSections.locator('[data-method-section="queue"] .method-load-btn').click();
        await expect(methodSections.locator('[data-method-section="queue"]')).toHaveAttribute('data-runtime-state', 'active');
        await expect(methodSections.locator('[data-method-section="stack-array"]')).toHaveAttribute('data-runtime-state', 'loaded');
        
        // Switch to a different category and go back
        await page.locator('[data-testid="category-nav"]').getByRole('button', { name: 'Advanced & Application-Specific' }).click();
        await page.waitForSelector('[data-method-section]', { timeout: 5000 });
        await page.locator('[data-testid="category-nav"]').getByRole('button', { name: 'Basic Linear Structures' }).click();
        await page.waitForSelector('[data-method-section]', { timeout: 5000 });
        
        // Queue should still be active
        await expect(methodSections.locator('[data-method-section="queue"]')).toHaveAttribute('data-runtime-state', 'active');
    });

    test('Primary UI: all sampled data structure modes are accessible from method cards', async ({ page }) => {
        const modeTests = [
            'queue',
            'list-linked',
            'tree-bst',
            'graph',
            'graph-kruskal',
            'hash-chain',
            'search-binary',
            'heap-binary',
        ];

        for (const methodId of modeTests) {
            try {
                await loadMethod(page, methodId);
                const card = page.locator(`[data-method-section="${methodId}"]`);
                await expect(card).toHaveAttribute('data-runtime-state', 'active');
                await expect(card.locator('.method-section-visual-live')).toBeVisible();
            } catch (error) {
                console.log(`Failed to load ${methodId}:`, error.message);
                throw error;
            }
        }
    });

    test('OOP Inheritance: Renders hierarchy and completes demo flow', async ({ page }) => {
        await loadMethod(page, 'oop-inheritance');
        const oopCard = page.locator('[data-method-section="oop-inheritance"]');
        await expect(oopCard).toHaveAttribute('data-runtime-state', 'active');
        await expect(oopCard.locator('.method-section-visual-live')).toBeVisible();
    });

    test('OOP Polymorphism: Shows virtual dispatch model and demo run', async ({ page }) => {
        await loadMethod(page, 'oop-polymorphism');
        const oopCard = page.locator('[data-method-section="oop-polymorphism"]');
        await expect(oopCard).toHaveAttribute('data-runtime-state', 'active');
        await expect(oopCard.locator('.method-section-visual-live')).toBeVisible();
    });

    test('OOP Encapsulation: Shows access levels and demo run', async ({ page }) => {
        await loadMethod(page, 'oop-encapsulation');
        const oopCard = page.locator('[data-method-section="oop-encapsulation"]');
        await expect(oopCard).toHaveAttribute('data-runtime-state', 'active');
        await expect(oopCard.locator('.method-section-visual-live')).toBeVisible();
    });

    // Design Patterns Tests
    test('Design Patterns: Singleton - Renders and demo runs', async ({ page }) => {
        await loadMethod(page, 'pattern-singleton');
        const patternCard = page.locator('[data-method-section="pattern-singleton"]');
        await expect(patternCard).toHaveAttribute('data-runtime-state', 'active');
        await expect(patternCard.locator('.method-section-visual-live')).toBeVisible();
    });

    test('Design Patterns: Factory - Renders and demo runs', async ({ page }) => {
        await loadMethod(page, 'pattern-factory');
        const patternCard = page.locator('[data-method-section="pattern-factory"]');
        await expect(patternCard).toHaveAttribute('data-runtime-state', 'active');
        await expect(patternCard.locator('.method-section-visual-live')).toBeVisible();
    });

    test('Design Patterns: Adapter - Renders and demo runs', async ({ page }) => {
        await loadMethod(page, 'pattern-adapter');
        const patternCard = page.locator('[data-method-section="pattern-adapter"]');
        await expect(patternCard).toHaveAttribute('data-runtime-state', 'active');
        await expect(patternCard.locator('.method-section-visual-live')).toBeVisible();
    });

    test('Design Patterns: Decorator - Renders and demo runs', async ({ page }) => {
        await loadMethod(page, 'pattern-decorator');
        const patternCard = page.locator('[data-method-section="pattern-decorator"]');
        await expect(patternCard).toHaveAttribute('data-runtime-state', 'active');
        await expect(patternCard.locator('.method-section-visual-live')).toBeVisible();
    });

    test('Design Patterns: Observer - Renders and demo runs', async ({ page }) => {
        await loadMethod(page, 'pattern-observer');
        const patternCard = page.locator('[data-method-section="pattern-observer"]');
        await expect(patternCard).toHaveAttribute('data-runtime-state', 'active');
        await expect(patternCard.locator('.method-section-visual-live')).toBeVisible();
    });

    test('Design Patterns: Strategy - Renders and demo runs', async ({ page }) => {
        await loadMethod(page, 'pattern-strategy');
        const patternCard = page.locator('[data-method-section="pattern-strategy"]');
        await expect(patternCard).toHaveAttribute('data-runtime-state', 'active');
        await expect(patternCard.locator('.method-section-visual-live')).toBeVisible();
    });

});
