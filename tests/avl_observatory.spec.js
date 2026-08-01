const { test, expect } = require('@playwright/test');
const { loadMethod } = require('./helpers');
const path = require('path');

test.describe('tree-avl (AVL 旋轉觀測站)', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'zh'); } catch (e) {} });
        await page.goto('file://' + path.resolve(__dirname, '../index.html'));
        await loadMethod(page, 'tree-avl');
    });

    test('renders the sandbox with toolbar, 7 presets, transport and step log', async ({ page }) => {
        const sec = page.locator('[data-method-section="tree-avl"]');
        await expect(sec.locator('[data-testid="avlviz-input"]')).toBeVisible();
        await expect(sec.locator('.avlviz-preset')).toHaveCount(7);
        await expect(sec.locator('[data-testid="avlviz-transport"] .tbtn')).toHaveCount(5);
        await expect(sec.locator('.avlviz-logcol h4')).toHaveText('步驟紀錄');
    });

    test('code panel is a collapsed drawer, opened via the header toggle', async ({ page }) => {
        const sec = page.locator('[data-method-section="tree-avl"]');
        await expect(sec.locator('.method-section-grid .code-panel')).toHaveCount(0);
        const drawer = sec.locator('[data-testid="code-drawer"]');
        await expect(drawer).toBeHidden();
        await sec.locator('[data-testid="code-drawer-toggle"]').click();
        await expect(drawer).toBeVisible();
        await expect(drawer.locator('.code-panel-filename')).toContainText('tree_avl.cpp');
        await expect(drawer.locator('code')).toContainText('Rotate');
    });

    test('inserting an LL sequence grows the tree and logs a rotation', async ({ page }) => {
        const sec = page.locator('[data-method-section="tree-avl"]');
        const input = sec.locator('[data-testid="avlviz-input"]');
        for (const v of ['3', '2', '1']) { await input.fill(v); await sec.locator('[data-testid="avlviz-insert"]').click(); }
        await expect(sec.locator('[data-testid="avlviz-stage"] .nd')).toHaveCount(3, { timeout: 15000 });
        await expect(sec.locator('[data-testid="avlviz-log"] .dot.k-rotate').first()).toBeAttached();
        const cnt0 = await sec.locator('[data-testid="avlviz-transport"] .cnt').textContent();
        await page.keyboard.press('ArrowLeft');
        await expect(sec.locator('[data-testid="avlviz-transport"] .cnt')).not.toHaveText(cnt0);
    });

    test('LR preset loads parked; slider to the end shows a rotation', async ({ page }) => {
        const sec = page.locator('[data-method-section="tree-avl"]');
        await sec.locator('.avlviz-preset[data-preset="lr"]').click();
        await expect(sec.locator('[data-testid="avlviz-transport"] .tbtn.play')).toHaveText('▶');
        await sec.locator('[data-testid="avlviz-transport"] input[type=range]')
            .evaluate((el) => { el.value = el.max; el.dispatchEvent(new Event('input', { bubbles: true })); });
        await expect(sec.locator('[data-testid="avlviz-stage"] .nd')).toHaveCount(3);
        await expect(sec.locator('[data-testid="avlviz-log"] .dot.k-rotate').first()).toBeAttached();
    });

    test('delete-rot preset reaches a rotation at the end', async ({ page }) => {
        const sec = page.locator('[data-method-section="tree-avl"]');
        await sec.locator('.avlviz-preset[data-preset="delete-rot"]').click();
        await sec.locator('[data-testid="avlviz-transport"] input[type=range]')
            .evaluate((el) => { el.value = el.max; el.dispatchEvent(new Event('input', { bubbles: true })); });
        await expect(sec.locator('[data-testid="avlviz-log"] .dot.k-rotate').first()).toBeAttached();
    });

    test('duplicate insert rejected; clear empties the tree', async ({ page }) => {
        const sec = page.locator('[data-method-section="tree-avl"]');
        const input = sec.locator('[data-testid="avlviz-input"]');
        await input.fill('7'); await sec.locator('[data-testid="avlviz-insert"]').click();
        await input.fill('7'); await sec.locator('[data-testid="avlviz-insert"]').click();
        await expect(page.locator('#status-message')).toContainText('已經在樹裡了');
        await sec.locator('[data-testid="avlviz-clear"]').click();
        await expect(sec.locator('[data-testid="avlviz-stage"] .nd')).toHaveCount(0);
        await expect(sec.locator('.avlviz-empty')).toBeVisible();
    });

    test('other tree methods keep the side-by-side code panel', async ({ page }) => {
        await loadMethod(page, 'tree-bst');
        const sec = page.locator('[data-method-section="tree-bst"]');
        await expect(sec.locator('.method-section-grid .code-panel')).toHaveCount(1);
    });
});

test.describe('tree-avl (English)', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
        await page.goto('file://' + path.resolve(__dirname, '../index.html'));
        await loadMethod(page, 'tree-avl');
    });
    test('renders English UI and step log', async ({ page }) => {
        const sec = page.locator('[data-method-section="tree-avl"]');
        await expect(sec.locator('[data-testid="avlviz-insert"]')).toHaveText('Insert');
        await expect(sec.locator('.avlviz-logcol h4')).toHaveText('Step Log');
        const input = sec.locator('[data-testid="avlviz-input"]');
        await input.fill('1'); await sec.locator('[data-testid="avlviz-insert"]').click();
        await input.fill('2'); await sec.locator('[data-testid="avlviz-insert"]').click();
        await input.fill('3'); await sec.locator('[data-testid="avlviz-insert"]').click();
        await expect(sec.locator('[data-testid="avlviz-log"] .op-h').first()).toContainText('Insert');
    });
});
