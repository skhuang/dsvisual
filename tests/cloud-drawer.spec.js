'use strict';
const { test, expect } = require('@playwright/test');
const path = require('node:path');

// Matches the pattern used by tests/cloud-private-slides.spec.js: index.html
// is opened via file://, and the drawer is opened through the real ☁ toggle
// button (data-testid="cloud-toggle" in index.html), not a synthetic hook.
const HOME = 'file://' + path.resolve(__dirname, '..', 'index.html');

async function withClient(page, user) {
  // index.html loads js/cloud-integration.js (defer) BEFORE js/cloud-drawer.js
  // (defer): cloud-integration.js unconditionally does
  // `window.cloudClient = cloudClient;` on load, which runs AFTER our
  // page.addInitScript callback (init scripts fire before any page script)
  // but BEFORE cloud-drawer.js's bind() reads window.cloudClient() to wire
  // up subscribeAuthState. A plain addInitScript stub gets clobbered before
  // bind() ever sees it, and a post-load patch (after goto resolves) is too
  // late for that same one-time bind()-time subscription — it would only
  // help drawer opens, not the sign-out re-render path.
  // Fix: install the stub via a locked accessor property whose setter is a
  // silent no-op, so the real script's overwrite attempt does nothing and
  // cloud-drawer.js's bind() (and every later window.cloudClient() call)
  // keeps seeing our fake client, exactly like the real code's singleton.
  await page.addInitScript((u) => {
    let cur = u;
    const subs = [];
    const client = () => ({
      isConfigured: true,
      missingReason: '',
      getUser: () => cur,
      subscribeAuthState: (cb) => { subs.push(cb); cb(cur); return () => {}; },
      signIn: () => { window.__signInCalled = true; },
      signOut: () => { cur = null; subs.forEach((cb) => cb(null)); },
      handleRedirect: () => Promise.resolve(),
    });
    Object.defineProperty(window, 'cloudClient', {
      configurable: true,
      enumerable: true,
      get() { return client; },
      set() { /* ignore cloud-integration.js's later overwrite */ },
    });
  }, user);
  await page.goto(HOME);
}

test.describe('cloud drawer (maccount)', () => {

  test('logged out: sign-in button visible, click calls client.signIn()', async ({ page }) => {
    await withClient(page, null);
    await page.getByTestId('cloud-toggle').click();
    await expect(page.getByTestId('cloud-drawer')).toBeVisible();

    const signin = page.getByTestId('cloud-signin-btn');
    await expect(signin).toBeVisible();
    await expect(signin).toBeEnabled();
    await signin.click();
    expect(await page.evaluate(() => window.__signInCalled)).toBe(true);
  });

  test('logged in: drawer body shows student_id and GitHub provider', async ({ page }) => {
    await withClient(page, { student_id: 'B10901', providers: { github: true, google: false } });
    await page.getByTestId('cloud-toggle').click();
    await expect(page.getByTestId('cloud-drawer')).toBeVisible();

    const body = page.getByTestId('cloud-drawer-body');
    await expect(body).toContainText('B10901');
    await expect(body).toContainText(/GitHub/i);
    // Only the linked provider should show; Google was false.
    await expect(body).not.toContainText('Google');
  });

  test('sign-out returns to the logged-out state', async ({ page }) => {
    await withClient(page, { student_id: 'B10901', providers: { github: true, google: false } });
    await page.getByTestId('cloud-toggle').click();
    await expect(page.getByTestId('cloud-drawer')).toBeVisible();

    const signout = page.getByTestId('cloud-signout-btn');
    await expect(signout).toBeVisible();
    await signout.click();

    // subscribeAuthState re-render (wired in cloud-drawer.js bind()) should
    // flip the drawer body back to the signed-out sign-in button.
    await expect(page.getByTestId('cloud-signin-btn')).toBeVisible();
  });

});
