const { test, expect } = require('@playwright/test');
const { loadMethod } = require('./helpers');
const path = require('path');

test.describe('source drawer language switcher (multilang pills)', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'zh'); } catch (e) {} });
        await page.goto('file://' + path.resolve(__dirname, '../index.html'));
    });

    test('graph-dijkstra drawer defaults to C++ and switches through every language', async ({ page }) => {
        const consoleErrors = [];
        page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
        page.on('pageerror', (err) => consoleErrors.push(String(err)));

        await loadMethod(page, 'graph-dijkstra');
        const sec = page.locator('[data-method-section="graph-dijkstra"]');
        const drawer = sec.locator('[data-testid="code-drawer"]');
        await sec.locator('[data-testid="code-drawer-toggle"]').click();
        await expect(drawer).toBeVisible();

        const code = drawer.locator('.code-panel-body code');
        const filename = drawer.locator('.code-panel-filename');

        // Default: C++, active cpp pill, every language pill present.
        await expect(code).toHaveClass(/language-cpp/);
        await expect(code).toContainText('priority_queue');
        await expect(drawer.locator('[data-testid="srclang-cpp"]')).toHaveClass(/active/);
        await expect(drawer.locator('[data-testid="srclang-python"]')).toBeVisible();
        await expect(drawer.locator('[data-testid="srclang-rust"]')).toBeVisible();
        await expect(drawer.locator('[data-testid="srclang-go"]')).toBeVisible();
        await expect(drawer.locator('[data-testid="srclang-php"]')).toBeVisible();

        // Python
        await drawer.locator('[data-testid="srclang-python"]').click();
        await expect(code).toHaveClass(/language-python/);
        await expect(code).toContainText('def');
        await expect(filename).toContainText('graph_dijkstra.py');
        await expect(drawer.locator('[data-testid="srclang-python"]')).toHaveClass(/active/);
        await expect(code.locator('.token').first()).toBeVisible();

        // Rust
        await drawer.locator('[data-testid="srclang-rust"]').click();
        await expect(code).toHaveClass(/language-rust/);
        await expect(code).toContainText('fn main');
        await expect(filename).toContainText('graph_dijkstra.rs');
        await expect(code.locator('.token').first()).toBeVisible();

        // Go
        await drawer.locator('[data-testid="srclang-go"]').click();
        await expect(code).toHaveClass(/language-go/);
        await expect(code).toContainText('func main');
        await expect(filename).toContainText('graph_dijkstra.go');
        await expect(code.locator('.token').first()).toBeVisible();

        // PHP (needs markup-templating loaded to not throw)
        await drawer.locator('[data-testid="srclang-php"]').click();
        await expect(code).toHaveClass(/language-php/);
        const phpText = await code.textContent();
        expect(phpText.includes('<?php') || phpText.includes('function')).toBe(true);
        await expect(filename).toContainText('graph_dijkstra.php');
        await expect(code.locator('.token').first()).toBeVisible();

        // Back to C++
        await drawer.locator('[data-testid="srclang-cpp"]').click();
        await expect(code).toHaveClass(/language-cpp/);
        await expect(code).toContainText('priority_queue');
        await expect(filename).toContainText('graph_dijkstra.cpp');
        await expect(drawer.locator('[data-testid="srclang-cpp"]')).toHaveClass(/active/);

        expect(consoleErrors).toEqual([]);
    });

    test('a C++-only codeDrawer method (tree-rb) shows no language pills', async ({ page }) => {
        await loadMethod(page, 'tree-rb');
        const sec = page.locator('[data-method-section="tree-rb"]');
        await sec.locator('[data-testid="code-drawer-toggle"]').click();
        const drawer = sec.locator('[data-testid="code-drawer"]');
        await expect(drawer).toBeVisible();
        await expect(drawer.locator('[data-testid^="srclang-"]')).toHaveCount(0);
    });
});
