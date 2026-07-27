const { test, expect } = require('@playwright/test'); const path = require('path');
const FILE_URI = 'file://' + path.resolve(__dirname, '../index.html');

test.describe('viz fullscreen focus mode', () => {
  test('CSS layer: toggling body.viz-focus hides chrome and reveals exit button', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=graph-scc');
    await expect(page.locator('.method-section-visual').first()).toBeVisible();

    // Baseline: chrome visible, exit button hidden.
    await expect(page.locator('.app-header')).toBeVisible();
    await expect(page.locator('.app-category-nav')).toBeVisible();
    await expect(page.locator('#viz-focus-exit')).toBeHidden();

    // Drive the CSS layer directly (no JS wiring yet).
    await page.evaluate(() => document.body.classList.add('viz-focus'));
    await expect(page.locator('.app-header')).toBeHidden();
    await expect(page.locator('.app-category-nav')).toBeHidden();
    await expect(page.locator('#viz-focus-exit')).toBeVisible();
    await expect(page.locator('.method-section-card.active .method-section-visual')).toBeVisible();

    await page.evaluate(() => document.body.classList.remove('viz-focus'));
    await expect(page.locator('.app-header')).toBeVisible();
    await expect(page.locator('#viz-focus-exit')).toBeHidden();
  });

  test('toggle button enters focus mode; exit button restores', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=graph-scc');
    const toggle = page.locator('.method-section-card.active .viz-focus-toggle');
    await expect(toggle).toBeVisible();
    await expect(page.locator('body')).not.toHaveClass(/viz-focus/);

    await toggle.click();
    await expect(page.locator('body')).toHaveClass(/viz-focus/);
    await expect(page.locator('.app-header')).toBeHidden();
    await expect(page.locator('#viz-focus-exit')).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');

    await page.locator('#viz-focus-exit').click();
    await expect(page.locator('body')).not.toHaveClass(/viz-focus/);
    await expect(page.locator('.app-header')).toBeVisible();
    await expect(page.locator('#viz-focus-exit')).toBeHidden();
  });

  test('Escape exits focus mode', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=graph-scc');
    const toggle = page.locator('.method-section-card.active .viz-focus-toggle');
    await toggle.click();
    await expect(page.locator('body')).toHaveClass(/viz-focus/);
    await page.keyboard.press('Escape');
    await expect(page.locator('body')).not.toHaveClass(/viz-focus/);
    await expect(page.locator('.app-header')).toBeVisible();
  });

  test('CSS layer: focus mode hides the source code panel for a non-drawer method', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=stack-array');
    await expect(page.locator('.method-section-card.active .code-panel')).toBeVisible();

    await page.evaluate(() => document.body.classList.add('viz-focus'));
    await expect(page.locator('.method-section-card.active .code-panel')).toBeHidden();
  });

  test('exit button anchors bottom-right (clears the top control bar)', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=graph-scc');
    await page.locator('.method-section-card.active .viz-focus-toggle').click();
    const exit = page.locator('#viz-focus-exit');
    await expect(exit).toBeVisible();
    const box = await exit.boundingBox();
    const vp = page.viewportSize();
    // Bottom-right: sits in the lower and right portion of the viewport, away
    // from the viz control bar which lives at the top.
    expect(box.y + box.height).toBeGreaterThan(vp.height * 0.6);
    expect(box.x + box.width).toBeGreaterThan(vp.width * 0.6);
  });

  test('exit button is draggable; a drag repositions it without exiting focus', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {} });
    await page.goto(FILE_URI + '#m=graph-scc');
    await page.locator('.method-section-card.active .viz-focus-toggle').click();
    const exit = page.locator('#viz-focus-exit');
    const before = await exit.boundingBox();

    // Drag it toward the top-left.
    await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2);
    await page.mouse.down();
    await page.mouse.move(before.x - 120, before.y - 200, { steps: 8 });
    await page.mouse.up();

    // Still in focus mode (the drag must not trigger the exit click) ...
    await expect(page.locator('body')).toHaveClass(/viz-focus/);
    // ... and the button actually moved.
    const after = await exit.boundingBox();
    expect(Math.abs(after.x - before.x) + Math.abs(after.y - before.y)).toBeGreaterThan(40);

    // A plain click (no drag) still exits.
    await exit.click();
    await expect(page.locator('body')).not.toHaveClass(/viz-focus/);
  });
});
