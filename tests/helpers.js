// Shared test helpers. Consolidates the previously-duplicated per-spec loadMethod
// (38 identical inline copies) into one hardened implementation.
const { expect } = require('@playwright/test');

// Navigate the category dropdown to activate a visualization method.
// Hardening over the old inline copies (condition-based waiting, not arbitrary
// timeouts): after opening the dropdown we explicitly wait for the method button
// to be visible before clicking, and give the activation assertion generous
// headroom so CPU contention under parallel CI load can't lose a 5s default race.
async function loadMethod(page, methodId) {
  const navItem = page.locator(
    `.category-nav-item:has(.category-nav-method[data-method-id="${methodId}"])`);
  const method = navItem.locator(`.category-nav-method[data-method-id="${methodId}"]`);
  await navItem.locator('.category-nav-btn').click();
  await method.waitFor({ state: 'visible' });
  await method.click();
  await expect(page.locator(`[data-method-section="${methodId}"]`))
    .toHaveAttribute('data-runtime-state', 'active', { timeout: 15000 });
}

module.exports = { loadMethod };
