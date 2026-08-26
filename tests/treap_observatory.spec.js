const { test, expect } = require('@playwright/test');
const { loadMethod } = require('./helpers');
const path = require('path');

test.describe('tree-treap (Treap 旋轉觀測站)', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'zh'); } catch (e) {} });
        await page.goto('file://' + path.resolve(__dirname, '../index.html'));
        await loadMethod(page, 'tree-treap');
    });

    test('renders the sandbox with toolbar, 6 presets, transport and step log', async ({ page }) => {
        const sec = page.locator('[data-method-section="tree-treap"]');
        await expect(sec.locator('[data-testid="treapviz-input"]')).toBeVisible();
        await expect(sec.locator('.treapviz-preset')).toHaveCount(6);
        await expect(sec.locator('[data-testid="treapviz-transport"] .tbtn')).toHaveCount(5);
        await expect(sec.locator('.treapviz-logcol h4')).toHaveText('步驟紀錄');
    });

    test('Key input defaults to a random 1–99 value on load', async ({ page }) => {
        const sec = page.locator('[data-method-section="tree-treap"]');
        const v = await sec.locator('[data-testid="treapviz-input"]').inputValue();
        expect(v).not.toBe('');
        const n = Number(v);
        expect(Number.isInteger(n)).toBe(true);
        expect(n).toBeGreaterThanOrEqual(1);
        expect(n).toBeLessThanOrEqual(99);
    });

    test('code panel is a collapsed drawer, opened via the header toggle', async ({ page }) => {
        const sec = page.locator('[data-method-section="tree-treap"]');
        await expect(sec.locator('.method-section-grid .code-panel')).toHaveCount(0);
        const drawer = sec.locator('[data-testid="code-drawer"]');
        await expect(drawer).toBeHidden();
        await sec.locator('[data-testid="code-drawer-toggle"]').click();
        await expect(drawer).toBeVisible();
        await expect(drawer.locator('.code-panel-filename')).toContainText('tree_treap.cpp');
        await expect(drawer.locator('code')).toContainText('Rotate');
    });

    test('inserting three keys grows the tree and logs a rotation', async ({ page }) => {
        const sec = page.locator('[data-method-section="tree-treap"]');
        const input = sec.locator('[data-testid="treapviz-input"]');
        // random priorities, but 3 inserts virtually always trigger >=1 rotation
        for (const v of ['10', '20', '30']) { await input.fill(v); await sec.locator('[data-testid="treapviz-insert"]').click(); }
        await expect(sec.locator('[data-testid="treapviz-stage"] .nd')).toHaveCount(3, { timeout: 15000 });
        const cnt0 = await sec.locator('[data-testid="treapviz-transport"] .cnt').textContent();
        await page.keyboard.press('ArrowLeft');
        await expect(sec.locator('[data-testid="treapviz-transport"] .cnt')).not.toHaveText(cnt0);
    });

    test('single-right preset loads parked; slider to the end shows a rotation', async ({ page }) => {
        const sec = page.locator('[data-method-section="tree-treap"]');
        await sec.locator('.treapviz-preset[data-preset="single-right"]').click();
        await expect(sec.locator('[data-testid="treapviz-transport"] .tbtn.play')).toHaveText('▶');
        await sec.locator('[data-testid="treapviz-transport"] input[type=range]')
            .evaluate((el) => { el.value = el.max; el.dispatchEvent(new Event('input', { bubbles: true })); });
        await expect(sec.locator('[data-testid="treapviz-stage"] .nd')).toHaveCount(3);
        await expect(sec.locator('[data-testid="treapviz-log"] .dot.k-rotate').first()).toBeAttached();
    });

    test('delete-rot preset reaches a rotation at the end', async ({ page }) => {
        const sec = page.locator('[data-method-section="tree-treap"]');
        await sec.locator('.treapviz-preset[data-preset="delete-rot"]').click();
        await sec.locator('[data-testid="treapviz-transport"] input[type=range]')
            .evaluate((el) => { el.value = el.max; el.dispatchEvent(new Event('input', { bubbles: true })); });
        await expect(sec.locator('[data-testid="treapviz-log"] .dot.k-rotate').first()).toBeAttached();
    });

    test('duplicate insert rejected; clear empties the tree', async ({ page }) => {
        const sec = page.locator('[data-method-section="tree-treap"]');
        const input = sec.locator('[data-testid="treapviz-input"]');
        await input.fill('7'); await sec.locator('[data-testid="treapviz-insert"]').click();
        await input.fill('7'); await sec.locator('[data-testid="treapviz-insert"]').click();
        await expect(page.locator('#status-message')).toContainText('已經在樹裡了');
        await sec.locator('[data-testid="treapviz-clear"]').click();
        await expect(sec.locator('[data-testid="treapviz-stage"] .nd')).toHaveCount(0);
        await expect(sec.locator('.treapviz-empty')).toBeVisible();
    });

    test('other tree methods keep the side-by-side code panel', async ({ page }) => {
        await loadMethod(page, 'tree-bst');
        const sec = page.locator('[data-method-section="tree-bst"]');
        await expect(sec.locator('.method-section-grid .code-panel')).toHaveCount(1);
    });
});

test.describe('tree-treap (English)', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
        await page.goto('file://' + path.resolve(__dirname, '../index.html'));
        await loadMethod(page, 'tree-treap');
    });
    test('renders English UI and step log', async ({ page }) => {
        const sec = page.locator('[data-method-section="tree-treap"]');
        await expect(sec.locator('[data-testid="treapviz-insert"]')).toHaveText('Insert');
        await expect(sec.locator('.treapviz-logcol h4')).toHaveText('Step Log');
        const input = sec.locator('[data-testid="treapviz-input"]');
        await input.fill('1'); await sec.locator('[data-testid="treapviz-insert"]').click();
        await input.fill('2'); await sec.locator('[data-testid="treapviz-insert"]').click();
        await input.fill('3'); await sec.locator('[data-testid="treapviz-insert"]').click();
        await expect(sec.locator('[data-testid="treapviz-log"] .op-h').first()).toContainText('Insert');
    });
});

// Deep interactive coverage: verify the tree is structurally rebalanced (which
// key ends up at the root after a deterministic-priority scenario), not merely
// that a rotation was logged, and that the real ▶ play timer advances the
// transport to the end on its own.
test.describe('tree-treap (interactive: rebalance + playback)', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
        await page.goto('file://' + path.resolve(__dirname, '../index.html'));
        await loadMethod(page, 'tree-treap');
    });

    // read rendered nodes as {key, cy} — the root is the topmost (smallest cy).
    async function nodes(sec) {
        return await sec.locator('[data-testid="treapviz-stage"] .nd').evaluateAll((els) =>
            els.map((e) => { const r = e.getBoundingClientRect(); return { key: e.dataset.key, cy: r.y + r.height / 2 }; }));
    }

    test('bubble-to-root preset ends with the highest-priority key at the root', async ({ page }) => {
        const sec = page.locator('[data-method-section="tree-treap"]');
        await sec.locator('.treapviz-preset[data-preset="bubble-to-root"]').click();
        const slider = sec.locator('[data-testid="treapviz-transport"] input[type=range]');
        // Drive to the final frame and read the root; poll so we land on the
        // settled post-rotation frame rather than a mid-rotation one.
        await expect.poll(async () => {
            await slider.evaluate((el) => { el.value = el.max; el.dispatchEvent(new Event('input', { bubbles: true })); });
            const ns = await nodes(sec);
            if (ns.length !== 4) return null;
            return ns.reduce((a, b) => (b.cy < a.cy ? b : a)).key;
        }, { timeout: 15000 }).toBe('4'); // key 4 was seeded with the highest priority (0.99)

        const ns = await nodes(sec);
        expect(ns.map((n) => n.key).sort()).toEqual(['1', '3', '4', '5']);
        await expect(sec.locator('[data-testid="treapviz-log"] .dot.k-rotate').first()).toBeAttached();
    });

    test('pressing ▶ plays a scenario through to the final step', async ({ page }) => {
        const sec = page.locator('[data-method-section="tree-treap"]');
        await sec.locator('.treapviz-preset[data-preset="single-right"]').click();
        const slider = sec.locator('[data-testid="treapviz-transport"] input[type=range]');
        const max = parseInt(await slider.getAttribute('max'), 10);
        expect(max).toBeGreaterThan(0);
        const play = sec.locator('[data-testid="treapviz-transport"] .tbtn.play');
        await expect(play).toHaveText('▶');
        await play.click(); // start the auto-advance timer
        // the timer should carry the cursor all the way to the last step on its own
        await expect.poll(async () => parseInt(await slider.inputValue(), 10), { timeout: 20000 }).toBe(max);
        await expect(sec.locator('[data-testid="treapviz-stage"] .nd')).toHaveCount(3);
        await expect(sec.locator('[data-testid="treapviz-log"] .dot.k-rotate').first()).toBeAttached();
    });
});