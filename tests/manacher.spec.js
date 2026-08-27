const { test, expect } = require('@playwright/test');
const path = require('path');

const FILE_URI = 'file://' + path.resolve(__dirname, '../index.html');

const scrubTo = async (page, value) => {
  await page.locator('.stepctl .stepctl-scrubber').evaluate((element, target) => {
    element.value = target === null ? element.max : String(target);
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
};

test.describe('Manacher visualization', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try { localStorage.setItem('dsvisual-lang', 'en'); }
      catch (error) { /* file storage may be unavailable */ }
    });
  });

  test('opens directly, renders the VCR, and reaches the default answer', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await page.goto(FILE_URI + '#m=manacher');
    await expect(page.locator('.man-wrap')).toBeVisible();
    await expect(page.locator('[data-testid="man-input"]')).toHaveValue('abacaba');
    await expect(page.locator('[data-testid="man-token"]')).toHaveCount(17);
    await expect(page.locator('.stepctl .stepctl-scrubber')).toBeVisible();
    await expect(page.locator('[data-method-section="manacher"] .code-drawer-toggle')).toContainText('manacher.cpp');

    await scrubTo(page, null);
    await expect(page.locator('[data-testid="man-result"]')).toContainText('abacaba');
    await expect(page.locator('[data-testid="man-message"]')).toContainText('length 7');
    expect(pageErrors, pageErrors.join('\n')).toEqual([]);
  });

  test('shows mirror reuse and center/right markers on an intermediate frame', async ({ page }) => {
    await page.goto(FILE_URI + '#m=manacher');
    const mirrorFrame = await page.evaluate(() =>
      ManacherViz.buildManacherFrames('abacaba').frames.findIndex(
        (frame) => frame.phase === 'inspect' && frame.mirror >= 0
      ));
    expect(mirrorFrame).toBeGreaterThan(0);

    await scrubTo(page, mirrorFrame);
    await expect(page.locator('.man-cell.mirror')).toHaveCount(1);
    await expect(page.locator('.man-marker').filter({ hasText: 'M' })).toHaveCount(1);
    await expect(page.locator('.man-marker').filter({ hasText: 'C' })).toHaveCount(1);
    await expect(page.locator('.man-marker').filter({ hasText: 'R' })).toHaveCount(1);
  });

  test('editable input handles an even palindrome and saves it as an example', async ({ page }) => {
    await page.goto(FILE_URI + '#m=manacher');
    const before = await page.locator('[data-testid="man-examples"] option').count();
    await page.locator('[data-testid="man-input"]').fill('racecarabba');
    await page.locator('[data-testid="man-build"]').click();
    await expect(page.locator('[data-testid="man-examples"] option')).toHaveCount(before + 1);
    await scrubTo(page, null);
    await expect(page.locator('[data-testid="man-result"]')).toContainText('racecar');

    await page.locator('[data-testid="man-input"]').fill('cbbd');
    await page.locator('[data-testid="man-build"]').click();
    await scrubTo(page, null);
    await expect(page.locator('[data-testid="man-result"]')).toContainText('bb');
  });

  test('treats separator-looking characters as input and falls back on empty input', async ({ page }) => {
    await page.goto(FILE_URI + '#m=manacher');
    await page.locator('[data-testid="man-input"]').fill('a#^#a');
    await page.locator('[data-testid="man-build"]').click();
    await scrubTo(page, null);
    await expect(page.locator('[data-testid="man-result"]')).toContainText('a#^#a');

    await page.locator('[data-testid="man-input"]').fill('');
    await page.locator('[data-testid="man-build"]').click();
    await expect(page.locator('[data-testid="man-input"]')).toHaveValue('abacaba');
  });

  test('uses bilingual labels and loads C++ through CODE_DB', async ({ page }) => {
    await page.addInitScript(() => {
      try { localStorage.setItem('dsvisual-lang', 'zh'); }
      catch (error) { /* file storage may be unavailable */ }
    });
    await page.goto(FILE_URI + '#m=manacher');
    await expect(page.locator('[data-testid="man-build"]')).toHaveText('建立');
    await expect(page.locator('[data-testid="man-message"]')).toContainText('分隔符號');

    const code = await page.evaluate(() => CODE_DB['manacher.cpp']);
    expect(code).toContain('ManacherResult');
    expect(code).toContain('longestPalindromicSubstring');
  });
});
