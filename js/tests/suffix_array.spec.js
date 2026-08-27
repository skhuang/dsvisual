const { test, expect } = require('@playwright/test');

test('Suffix Array + LCP 可正確渲染與互動', async ({ page }) => {
  await page.goto('file://' + __dirname + '/../index.html');
  
  // 模擬切換到 suffix-array 頁面
  await page.selectOption('#method-select', 'suffix-array');
  
  // 驗證表格與關鍵欄位呈現
  const table = page.locator('#sa-viz-display table');
  await expect(table).toBeVisible();
  await expect(page.locator('th:has-text("LCP[i]")')).toBeVisible();
});