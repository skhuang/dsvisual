const { test, expect } = require('@playwright/test');
const path = require('path');

const FILE_URI =
  'file://' + path.resolve(__dirname, '../index.html');

const scrubToEnd = async (page) => {
  await page
    .locator('.stepctl .stepctl-scrubber')
    .evaluate((element) => {
      element.value = element.max;
      element.dispatchEvent(
        new Event('input', { bubbles: true })
      );
    });
};

test.describe('graph-hopcroft-karp', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem(
          'dsvisual-lang',
          'en'
        );
      } catch (error) {
        // ignore
      }
    });
  });

  test(
    'renders bipartite graph and reaches maximum matching',
    async ({ page }) => {
      await page.goto(
        FILE_URI + '#m=graph-hopcroft-karp'
      );

      await expect(
        page.locator('.hk-svg-area svg')
      ).toBeVisible();

      await expect(
        page.locator('.stepctl .stepctl-scrubber')
      ).toBeVisible();

      await scrubToEnd(page);

      await expect(
        page.locator('.hk-matching-table')
      ).toContainText('V');

      await expect(
        page.locator('.hk-info')
      ).toContainText('Maximum matching');

      await expect(
        page.locator('.hk-info')
      ).toContainText('Matching size');
    }
  );

  test(
    'custom input computes a valid maximum matching',
    async ({ page }) => {
      await page.goto(
        FILE_URI + '#m=graph-hopcroft-karp'
      );

      await page.locator('.hk-left').fill('2');
      await page.locator('.hk-right').fill('3');
      await page
        .locator('.hk-edges')
        .fill('0-0,0-1,1-2');

      await page.locator('.hk-apply').click();

      await scrubToEnd(page);

      await expect(
        page.locator('.hk-matching-table')
      ).toContainText('V0');

      await expect(
        page.locator('.hk-matching-table')
      ).toContainText('V2');

      await expect(
        page.locator('.hk-info')
      ).toContainText('Matching size');
    }
  );

  test(
    'invalid edges show warnings without breaking visualization',
    async ({ page }) => {
      await page.goto(
        FILE_URI + '#m=graph-hopcroft-karp'
      );

      await page.locator('.hk-left').fill('3');
      await page.locator('.hk-right').fill('3');

      await page
        .locator('.hk-edges')
        .fill(
          '0-0,bad,1-2,9-1,1-2'
        );

      await page.locator('.hk-apply').click();

      await expect(
        page.locator('.hk-issues')
      ).toBeVisible();

      await expect(
        page.locator('.hk-issues')
      ).toContainText('bad');

      await expect(
        page.locator('.hk-svg-area svg')
      ).toBeVisible();
    }
  );
});