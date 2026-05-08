const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Data Structure Visualizer Full Suite', () => {
    
    test.beforeEach(async ({ page }) => {
        // Correctly assemble cross-platform absolute URI mapping mapping directly to your HTML
        const fileUri = 'file://' + path.resolve(__dirname, '../index.html');
        await page.goto(fileUri);
    });

    test('Initial Load: Should load Array Stack correctly by default', async ({ page }) => {
        await expect(page.locator('#code-title')).toHaveText('stack_array.cpp');
        await expect(page.locator('#desc-view h3')).toHaveText('Stack (Array Implementation)');
        await expect(page.locator('#array-container')).toBeVisible();
    });

    test('Trie Trees: Submits string prefix and generates character-marked edges', async ({ page }) => {
        // Expand Non-Linear group
        const nonLinearGroup = page.locator('.mode-group').nth(2);
        const nonLinearHeader = nonLinearGroup.locator('.group-header');
        const nonLinearContent = nonLinearGroup.locator('.group-content');
        if (!(await nonLinearContent.isVisible())) {
            await nonLinearHeader.click();
        }
        
        // Toggle UI
        await page.locator('label[for="mode-tree-trie"]').click();
        await expect(page.locator('#code-title')).toHaveText('tree_trie.cpp');
        await expect(page.locator('#desc-view h3')).toHaveText('Trie (Prefix Tree)');

        // Run UI Event Check
        await page.fill('#text-tree-val', 'CAT');
        await page.click('#btn-text-tree-add');
        
        // Wait till Javascript triggers UI execution hook completion
        await expect(page.locator('#status-message')).toHaveText('Execution Complete!');
        
        // Validate visual rendering logic produced exactly 3 geometric edges (C, A, T)
        const edges = page.locator('.edge-label');
        await expect(edges).toHaveCount(3);
        await expect(edges.nth(0)).toHaveText('C');

        // And only 1 literal "End Of Word" marker
        const trieEnd = page.locator('.trie-end');
        await expect(trieEnd).toHaveCount(1);
    });

    test('Sorting Engine: Instantiates bars and manages states successfully', async ({ page }) => {
        // Expand Advanced group
        const advancedGroup = page.locator('.mode-group').nth(3);
        const advancedHeader = advancedGroup.locator('.group-header');
        const advancedContent = advancedGroup.locator('.group-content');
        if (!(await advancedContent.isVisible())) {
            await advancedHeader.click();
        }
        
        await page.locator('label[for="mode-sort-bubble"]').click();
        await expect(page.locator('#code-title')).toHaveText('sort_bubble.cpp');
        
        await page.click('#btn-sort-random');
        await expect(page.locator('.sort-bar')).toHaveCount(15);

        await page.click('#btn-sort-start');
        
        // Animation Lock validation (The state must visibly mark as executing)
        await expect(page.locator('#status-message')).toContainText('Bubble Sort', { timeout: 20000 });
    });

    test('Hash Tables: Explicitly verifies Collision Handlers catch overlaps', async ({ page }) => {
        // Expand Advanced group
        const advancedGroup = page.locator('.mode-group').nth(3);
        const advancedHeader = advancedGroup.locator('.group-header');
        const advancedContent = advancedGroup.locator('.group-content');
        if (!(await advancedContent.isVisible())) {
            await advancedHeader.click();
        }
        
        await page.locator('label[for="mode-hash-open"]').click();
        
        await page.fill('#hash-val', '12'); // Modulo mathematics mapping to Index 2
        await page.click('#btn-hash-add');
        await page.waitForTimeout(1000); // Safe UI delay matching user behaviour
        
        await page.fill('#hash-val', '22'); // Identical mapping to Index 2 forces manual linear probe
        await page.click('#btn-hash-add');
        
        // Playwright listens for the DOM string injection reporting Probing
        await expect(page.locator('#status-message')).toContainText('occupied! Probing...', { timeout: 10000 });
    });

    test('Advanced Sort: Radix Sort completes execution properly', async ({ page }) => {
        // Expand Advanced group
        const advancedGroup = page.locator('.mode-group').nth(3);
        const advancedHeader = advancedGroup.locator('.group-header');
        const advancedContent = advancedGroup.locator('.group-content');
        if (!(await advancedContent.isVisible())) {
            await advancedHeader.click();
        }
        
        await page.locator('label[for="mode-sort-radix"]').click();
        await expect(page.locator('#code-title')).toHaveText('sort_radix.cpp');
        await page.click('#btn-sort-random');
        await expect(page.locator('.sort-bar')).toHaveCount(15);
        await page.click('#btn-sort-start');
        await expect(page.locator('#status-message')).toContainText('Radix Sort', { timeout: 15000 });
    });

    test('Shaker Sort: Bidirectional bubble sort completes correctly', async ({ page }) => {
        // Expand Advanced group
        const advancedGroup = page.locator('.mode-group').nth(3);
        const advancedHeader = advancedGroup.locator('.group-header');
        const advancedContent = advancedGroup.locator('.group-content');
        if (!(await advancedContent.isVisible())) {
            await advancedHeader.click();
        }
        
        await page.locator('label[for="mode-sort-shaker"]').click();
        await expect(page.locator('#code-title')).toHaveText('sort_shaker.cpp');
        await expect(page.locator('#desc-view h3')).toContainText('Shaker Sort');
        
        await page.click('#btn-sort-random');
        await expect(page.locator('.sort-bar')).toHaveCount(15);
        await page.locator('#sort-speed').fill('600');

        await page.click('#btn-sort-start');
        await expect(page.locator('#status-message')).toContainText('Shaker Sort', { timeout: 15000 });
        await expect(page.locator('#status-message')).toHaveText('Execution Complete!', { timeout: 15000 });
    });

    test('Mode Groups: First group (Basic Linear) is expanded by default', async ({ page }) => {
        const basicLinearGroup = page.locator('.mode-group').first();
        const basicLinearHeader = basicLinearGroup.locator('.group-header');
        const basicLinearContent = basicLinearGroup.locator('.group-content');

        // Verify first group header contains "Basic Linear Structures"
        await expect(basicLinearHeader).toContainText('Basic Linear Structures');

        // Verify first group content is visible
        await expect(basicLinearContent).toBeVisible();

        // Verify group is not collapsed
        await expect(basicLinearGroup).not.toHaveClass(/collapsed/);
    });

    test('Mode Groups: Other groups are collapsed by default', async ({ page }) => {
        const allGroups = page.locator('.mode-group');
        const groupCount = await allGroups.count();

        // Skip first group (which should be expanded)
        for (let i = 1; i < groupCount; i++) {
            const group = allGroups.nth(i);
            const content = group.locator('.group-content');

            // Verify content is hidden for all groups except first
            await expect(content).toBeHidden();

            // Verify group has collapsed class
            await expect(group).toHaveClass(/collapsed/);
        }
    });

    test('Mode Groups: Clicking group header toggles expansion', async ({ page }) => {
        const linkedListsGroup = page.locator('.mode-group').nth(1);
        const linkedListsHeader = linkedListsGroup.locator('.group-header');
        const linkedListsContent = linkedListsGroup.locator('.group-content');

        // Initially collapsed
        await expect(linkedListsContent).toBeHidden();

        // Click to expand
        await linkedListsHeader.click();
        await expect(linkedListsContent).toBeVisible();
        await expect(linkedListsGroup).not.toHaveClass(/collapsed/);

        // Click to collapse
        await linkedListsHeader.click();
        await expect(linkedListsContent).toBeHidden();
        await expect(linkedListsGroup).toHaveClass(/collapsed/);
    });

    test('Mode Groups: Can select mode from different groups', async ({ page }) => {
        // Expand Advanced group
        const advancedGroup = page.locator('.mode-group').nth(3);
        const advancedHeader = advancedGroup.locator('.group-header');
        await advancedHeader.click();
        
        // Verify it's expanded
        const advancedContent = advancedGroup.locator('.group-content');
        await expect(advancedContent).toBeVisible();

        // Select Bubble Sort from Sorting subgroup
        await page.locator('label[for="mode-sort-bubble"]').click();
        
        // Verify page switches to Bubble Sort
        await expect(page.locator('#code-title')).toHaveText('sort_bubble.cpp');
        await expect(page.locator('#desc-view h3')).toContainText('Bubble Sort');
    });

    test('Mode Groups: Switching between groups preserves group expansion state', async ({ page }) => {
        const basicLinearGroup = page.locator('.mode-group').first();
        const advancedGroup = page.locator('.mode-group').nth(3);
        const advancedHeader = advancedGroup.locator('.group-header');

        // Basic Linear is expanded, Advanced is collapsed
        await expect(basicLinearGroup.locator('.group-content')).toBeVisible();
        await expect(advancedGroup.locator('.group-content')).toBeHidden();

        // Expand Advanced
        await advancedHeader.click();
        await expect(advancedGroup.locator('.group-content')).toBeVisible();

        // Select something from Advanced
        await page.locator('label[for="mode-hash-chain"]').click();

        // Back to Basic Linear group
        await page.locator('label[for="mode-stack-arr"]').click();

        // Verify Advanced is still expanded (state preserved)
        await expect(advancedGroup.locator('.group-content')).toBeVisible();
    });

    test('Mode Groups: All data structure modes are accessible from menus', async ({ page }) => {
        const modeTests = [
            { group: 0, selector: '#mode-queue', title: 'queue.cpp' },
            { group: 1, selector: '#mode-list-list', title: 'list_linked.cpp' },
            { group: 2, selector: '#mode-tree-bst', title: 'tree_bst.cpp' },
            { group: 2, selector: '#mode-graph', title: 'graph.cpp' },
            { group: 3, selector: '#mode-hash-chain', title: 'hash_chaining.cpp' },
            { group: 3, selector: '#mode-search-binary', title: 'search_binary.cpp' },
            { group: 3, selector: '#mode-heap-binary', title: '', desc: 'Binary Heap' },
        ];

        for (const test of modeTests) {
            // Expand group if needed
            const group = page.locator('.mode-group').nth(test.group);
            const header = group.locator('.group-header');
            const content = group.locator('.group-content');
            
            if (!(await content.isVisible())) {
                await header.click();
            }

            // Select mode
            await page.locator(`label[for="${test.selector.substring(1)}"]`).click();

            // Verify selection
            if (test.title) {
                await expect(page.locator('#code-title')).toHaveText(test.title);
            }
            if (test.desc) {
                await expect(page.locator('#desc-view h3')).toContainText(test.desc);
            }
        }
    });

});
