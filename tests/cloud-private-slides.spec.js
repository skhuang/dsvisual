'use strict';
const { test, expect } = require('@playwright/test');

// Open index.html via file:// (matches the other dsvisual specs' pattern).
const path = require('node:path');
const HOME = 'file://' + path.resolve(__dirname, '..', 'index.html');

test.describe('cloud + private slides', () => {

  test('regression: no folder configured → no sign-in row in slide picker', async ({ page }) => {
    await page.goto(HOME);
    // Click any method's Slides button.
    const firstSlideBtn = page.locator('.method-slides-btn').first();
    await firstSlideBtn.waitFor();
    await firstSlideBtn.click();
    // Slide viewer opens.
    await expect(page.getByTestId('slide-viewer')).toBeVisible();
    // No sign-in row, no deck-picker bar (single public deck only).
    await expect(page.getByTestId('slide-signin-row')).toHaveCount(0);
    await expect(page.getByTestId('slide-deck-bar')).toHaveCount(0);
  });

  test('cloud drawer: ☁ button opens and closes the drawer', async ({ page }) => {
    await page.goto(HOME);
    await page.getByTestId('cloud-toggle').click();
    const drawer = page.getByTestId('cloud-drawer');
    await expect(drawer).toBeVisible();
    // Close button (× in drawer header).
    await drawer.locator('.cloud-drawer-close').click();
    await expect(drawer).toBeHidden();
  });

  test('sign-in row: folder configured but not signed in → row appears + clicking opens cloud drawer', async ({ page }) => {
    // Post-load patch: set privateSlidesFolderId after the page is fully loaded.
    // This is more reliable than addInitScript for deferred-loaded config because
    // cloud-config.js is loaded with `defer`, meaning it runs after HTML parsing but
    // the exact timing relative to addInitScript can create race conditions where our
    // property descriptor is overwritten. Patching after waitFor() guarantees the
    // config object exists and our mutation takes effect before the slides button is clicked.
    await page.goto(HOME);
    const firstSlideBtn = page.locator('.method-slides-btn').first();
    await firstSlideBtn.waitFor();
    await page.evaluate(() => { window.dsvisualCloudConfig.drive.privateSlidesFolderId = 'FAKE_FOLDER_ID'; });
    await firstSlideBtn.click();
    // Sign-in row visible.
    const signinRow = page.getByTestId('slide-signin-row');
    await expect(signinRow).toBeVisible();
    // Clicking it closes slide viewer + opens cloud drawer.
    await signinRow.click();
    await expect(page.getByTestId('slide-viewer')).toBeHidden();
    await expect(page.getByTestId('cloud-drawer')).toBeVisible();
  });

});
