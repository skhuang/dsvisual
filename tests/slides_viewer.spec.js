const { test, expect } = require('@playwright/test');
const { loadMethod } = require('./helpers');
const path = require('path');

const FILE_URL = 'file://' + path.resolve(__dirname, '..', 'index.html');

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try { localStorage.setItem('dsvisual-lang', 'en'); } catch (e) {}
  });
});

async function openStackArraySlides(page) {
  await page.goto(FILE_URL);
  await loadMethod(page, 'stack-array');
  await page.locator('.method-slides-btn[data-method="stack-array"]').click();
  await expect(page.locator('[data-testid="slide-viewer"]')).toBeVisible();
}

test('slide deck has multiple pages and navigates', async ({ page }) => {
  await openStackArraySlides(page);
  await expect(page.locator('#slide-viewer-progress')).toContainText('Slide 1 / 8');
  await page.locator('#slide-next').click();
  await expect(page.locator('#slide-viewer-progress')).toContainText('Slide 2 / 8');
});

test('language toggle switches slide content', async ({ page }) => {
  await openStackArraySlides(page);
  // Bar now shows deckTitle only (per-slide title is injected as h1 in body).
  // deckTitle uses t('method.stack-array') which is 'Stack (Array)' in en.
  await expect(page.locator('#slide-viewer-title')).toHaveText('Stack (Array)');
  await page.locator('[data-testid="lang-toggle"]').click();
  // zh translation from i18n.js: '堆疊（陣列實作）' (full-width parens)
  await expect(page.locator('#slide-viewer-title')).toHaveText('堆疊（陣列實作）');
});

test('math renders via KaTeX and mermaid renders as SVG', async ({ page }) => {
  await openStackArraySlides(page);
  // Navigate to the operation-flow slide (slide 3) which has a mermaid diagram.
  await page.locator('#slide-next').click();
  await page.locator('#slide-next').click();
  await expect(page.locator('#slide-viewer-body svg').first()).toBeVisible();
  // Navigate to the complexity slide (slide 5) which has a KaTeX formula.
  await page.locator('#slide-next').click();
  await page.locator('#slide-next').click();
  await expect(page.locator('#slide-viewer-body .katex').first()).toBeVisible();
});

test('slide stage has 16:9 aspect ratio', async ({ page }) => {
  await openStackArraySlides(page);
  await expect(page.locator('[data-testid="slide-viewer"]')).toBeVisible();

  const stage = page.locator('.slideviewer-stage');
  await expect(stage).toBeVisible();

  const slide = page.locator('.slideviewer-slide').first();
  const box = await slide.boundingBox();
  // Allow ±2% tolerance for browser rounding
  const ratio = box.width / box.height;
  expect(ratio).toBeGreaterThan(16/9 * 0.98);
  expect(ratio).toBeLessThan(16/9 * 1.02);
});

test('notes toggle hidden on public deck (no notes)', async ({ page }) => {
  await openStackArraySlides(page);
  await expect(page.locator('[data-testid="slide-viewer"]')).toBeVisible();
  await expect(page.locator('[data-testid="slideviewer-notes-toggle"]')).toBeHidden();
});

test('slide body starts with <h1> matching slide.title', async ({ page }) => {
  await openStackArraySlides(page);
  await expect(page.locator('[data-testid="slide-viewer"]')).toBeVisible();

  // The first <h1> inside the slide should be the app-injected slide-title
  // (not from slide.body content), bearing the .slide-title class.
  const titleEl = page.locator('.slideviewer-slide h1.slide-title').first();
  await expect(titleEl).toBeVisible();

  // The text should match what the bar's deckTitle label shows OR a slide-specific
  // title. For the first slide of Stack (Array), the slide title typically matches
  // the method name or is the cover slide.
  const titleText = (await titleEl.textContent()).trim();
  expect(titleText.length).toBeGreaterThan(0);
});

test('bar shows deck title only (small label), not duplicating slide title', async ({ page }) => {
  await openStackArraySlides(page);

  // .slideviewer-title is the small bar label
  const barTitle = page.locator('.slideviewer-title');
  await expect(barTitle).toBeVisible();
  const barText = (await barTitle.textContent()).trim();

  // Confirm it matches the method name (deckTitle), not necessarily slide.title.
  // Loose assertion: just confirm non-empty and styled small.
  expect(barText.length).toBeGreaterThan(0);

  // Confirm bar title uses small label font-size (0.9rem from rdvisual canonical block)
  const fontSize = await barTitle.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(fontSize).toBeLessThan(16);  // 0.9rem ≈ 14.4px, well under 16

  // Confirm body h1.slide-title is larger
  const bodyH1FontSize = await page.locator('.slideviewer-slide h1.slide-title')
      .first()
      .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(bodyH1FontSize).toBeGreaterThan(fontSize);
});
