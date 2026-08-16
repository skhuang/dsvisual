const { test, expect } = require('@playwright/test');
const path = require('path');

const FILE_URL = 'file://' + path.resolve(__dirname, '../index.html');

const FIXTURE = {
  'has-url': [{
    slug: 'fixture', titleZh: '測試', titleEn: 'Fixture', difficulty: 1, week: 1,
    tags: [], repoUrl: 'https://example.com/repo',
    dsjudgeUrl: 'https://ds2026summer.cs.nycu.edu.tw/bank/fixture',
    statementHtml: { zh: '<p>敘述</p>', en: '<p>stmt</p>' }, samples: [{ in: '1', out: '2' }],
  }],
  'no-url': [{
    slug: 'nofix', titleZh: '無', titleEn: 'NoUrl', difficulty: 1, week: 1,
    tags: [], repoUrl: 'https://example.com/repo', dsjudgeUrl: null,
    statementHtml: { zh: '<p>x</p>', en: '<p>x</p>' }, samples: [{ in: '1', out: '2' }],
  }],
};

// Install fixtures AFTER load. lab.js reads window.LAB_RENDERED and
// window.cloudClient LAZILY at render time, so overwriting the real globals
// post-load is sufficient (no pre-load locked-getter trick needed — unlike
// the cloud-drawer which binds its client at load).
async function setup(page, { loggedIn = false, configured = true, hasClient = true } = {}) {
  await page.goto(FILE_URL);
  await page.evaluate(({ fixture, loggedIn, configured, hasClient }) => {
    window.LAB_RENDERED = fixture;
    if (!hasClient) { try { delete window.cloudClient; } catch (e) { window.cloudClient = undefined; } return; }
    const st = { user: loggedIn ? { student_id: 'B1', providers: { github: true, google: false } } : null, cbs: [], signInCalls: 0 };
    window.__labAuth = st;
    const client = {
      isConfigured: configured,
      getUser: () => st.user,
      subscribeAuthState: (cb) => { st.cbs.push(cb); cb(st.user); return () => { st.cbs = st.cbs.filter((x) => x !== cb); }; },
      signIn: () => { st.signInCalls += 1; },
      signOut: () => {},
    };
    window.cloudClient = () => client;
    window.__setUser = (u) => { st.user = u; st.cbs.slice().forEach((cb) => cb(u)); };
  }, { fixture: FIXTURE, loggedIn, configured, hasClient });
}

test('A: no dsjudgeUrl -> disabled coming-soon button', async ({ page }) => {
  await setup(page, { loggedIn: false });
  await page.evaluate(() => window.LabViewer.open('no-url'));
  const el = page.locator('[data-testid="lab-dsjudge"]');
  await expect(el).toBeVisible();
  await expect(el).toBeDisabled();
  await expect(page.locator('[data-testid="lab-dsjudge-signin"]')).toHaveCount(0);
});

test('B: dsjudgeUrl + logged out -> sign-in button calls signIn()', async ({ page }) => {
  await setup(page, { loggedIn: false });
  await page.evaluate(() => window.LabViewer.open('has-url'));
  const btn = page.locator('[data-testid="lab-dsjudge-signin"]');
  await expect(btn).toBeVisible();
  await expect(page.locator('a[data-testid="lab-dsjudge"]')).toHaveCount(0);
  await btn.click();
  expect(await page.evaluate(() => window.__labAuth.signInCalls)).toBe(1);
});

test('C: dsjudgeUrl + logged in -> enabled bank link', async ({ page }) => {
  await setup(page, { loggedIn: true });
  await page.evaluate(() => window.LabViewer.open('has-url'));
  const link = page.locator('a[data-testid="lab-dsjudge"]');
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('href', 'https://ds2026summer.cs.nycu.edu.tw/bank/fixture');
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(page.locator('[data-testid="lab-dsjudge-signin"]')).toHaveCount(0);
});

test('D: logging in while open flips sign-in button to bank link', async ({ page }) => {
  await setup(page, { loggedIn: false });
  await page.evaluate(() => window.LabViewer.open('has-url'));
  await expect(page.locator('[data-testid="lab-dsjudge-signin"]')).toBeVisible();
  await page.evaluate(() => window.__setUser({ student_id: 'B2', providers: { github: false, google: true } }));
  await expect(page.locator('a[data-testid="lab-dsjudge"]')).toBeVisible();
  await expect(page.locator('[data-testid="lab-dsjudge-signin"]')).toHaveCount(0);
});

test('E: client not configured -> enabled link fallback', async ({ page }) => {
  await setup(page, { configured: false });
  await page.evaluate(() => window.LabViewer.open('has-url'));
  await expect(page.locator('a[data-testid="lab-dsjudge"]')).toBeVisible();
  await expect(page.locator('[data-testid="lab-dsjudge-signin"]')).toHaveCount(0);
});

test('F: close unsubscribes (later auth change does not throw / re-render)', async ({ page }) => {
  await setup(page, { loggedIn: false });
  await page.evaluate(() => window.LabViewer.open('has-url'));
  await page.evaluate(() => window.LabViewer.close());
  // subscriber count should be back to 0 after close
  expect(await page.evaluate(() => window.__labAuth.cbs.length)).toBe(0);
  // firing an auth change after close must not throw and must not repopulate the hidden body
  await page.evaluate(() => window.__setUser({ student_id: 'B3', providers: { github: true, google: false } }));
  await expect(page.locator('#lab-viewer')).toBeHidden();
});

test('G: no cloudClient at all -> enabled link fallback (no signin button)', async ({ page }) => {
  await setup(page, { hasClient: false });
  await page.evaluate(() => window.LabViewer.open('has-url'));
  const link = page.locator('a[data-testid="lab-dsjudge"]');
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('href', 'https://ds2026summer.cs.nycu.edu.tw/bank/fixture');
  await expect(page.locator('[data-testid="lab-dsjudge-signin"]')).toHaveCount(0);
});

test('H: repeated open() without close() does not orphan the auth subscription', async ({ page }) => {
  await setup(page, { loggedIn: false });
  await page.evaluate(() => window.LabViewer.open('has-url'));
  await page.evaluate(() => window.LabViewer.open('has-url')); // no close() between
  await page.evaluate(() => window.LabViewer.close());
  expect(await page.evaluate(() => window.__labAuth.cbs.length)).toBe(0);
  await page.evaluate(() => window.__setUser({ student_id: 'B4', providers: { github: true, google: false } }));
  expect(await page.evaluate(() => window.__labAuth.cbs.length)).toBe(0);
});
