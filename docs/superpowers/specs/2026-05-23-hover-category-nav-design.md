# Hover 分類下拉選單 設計文件

## 目標與背景

目前選擇方法需要兩步:先點分類 pill(載入該分類第一個方法),再從方法區塊標題列的 `<select>` 下拉選方法。這份 spec 把「方法選擇」上移到頂層分類列 —— 滑鼠移到分類 pill 時自動展開該分類的方法清單,點任一方法即可直接載入。觸控裝置點一下 pill 同樣可展開。

設計目標:**減少一次點擊**(從「點分類 → 在方法區挑方法」變成「hover 分類 → 直接點方法」),把分類-方法的關係視覺化為「分類包含哪些方法」,並把方法選擇集中到頂層導覽。

執行方法論:brainstorming → writing-plans → subagent-driven-development → finishing-a-development-branch。

## 範圍

**做:**
- 移除方法區塊標題列的方法選擇 `<select>`(及其 `<label>`),以靜態方法標題文字取代。
- 每個頂層分類 pill 包進一個 wrapper,內含 pill 按鈕 + 一個下拉面板(預設隱藏)。
- 下拉面板列出該分類的所有方法,各為可點按鈕。
- Design Patterns 的下拉面板額外帶 4 個小標題(Creational / Structural / Behavioral / Architectural),把方法依子分類分組呈現於同一個面板。
- CSS `:hover` 在桌機自動展開下拉;`.open` class(由 JS 在 tap/click 時切換)讓觸控裝置與滑鼠點擊也能展開。
- 點分類 pill = toggle `.open`;點下拉裡的方法按鈕 = 載入該方法並關閉所有下拉;點下拉外側或按 Esc = 關閉所有下拉。
- `loadMethod(page, methodId)` 測試輔助函式重寫以走新下拉。
- 新增 1–2 個下拉行為的 Playwright 測試。

**不做:**
- 下拉內方向鍵導覽(Tab / Enter 由 button 元素原生支援即可,符合最低 a11y)。
- 下拉開合動畫 / transition。
- 下拉內搜尋 / 過濾。
- Design Patterns sub-tab row 的結構或行為調整(維持原樣作為作用中狀態指示)。
- 任何超出下拉本身的 RWD / 行動版版型重排。

## 使用者流程

桌機(滑鼠):
1. 滑鼠移到分類 pill → CSS `:hover` 顯示下拉。
2. 滑鼠移進下拉、點方法按鈕 → 載入方法、關閉下拉。

桌機點擊 / 觸控:
1. 點 / tap 分類 pill → JS toggle `.open` 顯示下拉。
2. 點 / tap 方法按鈕 → 載入方法、關閉所有下拉。

通用:
- 點下拉外側 → 所有下拉關閉。
- 按 Esc → 所有下拉關閉。
- hover 完滑鼠離開時 CSS `:hover` 不再 match,下拉自動收回(若 `.open` 未掛則收回)。

點 pill 不再自動載入該分類的第一個方法 —— pill 是純粹的下拉開合控制。Design Patterns 的 sub-tab row 仍維持原行為(顯示當前作用中的子分類、可點切換),但不再是必經路徑(可從 hover 下拉直接選任一 design pattern 方法)。

## HTML 與 CSS 結構

### 新的 nav DOM

```html
<div class="category-nav" data-testid="category-nav">
  <div class="category-nav-item" data-group="linear">
    <button class="category-nav-btn" data-group="linear">Linear Structures</button>
    <div class="category-nav-dropdown">
      <button class="category-nav-method" data-method-id="stack-array">Stack (Array)</button>
      <button class="category-nav-method" data-method-id="stack-list">Stack (List)</button>
      <!-- ... 該分類全部方法 ... -->
    </div>
  </div>
  <!-- ... 其他分類 ... -->
  <div class="category-nav-item" data-group="patterns">
    <button class="category-nav-btn" data-group="patterns">Design Patterns</button>
    <div class="category-nav-dropdown category-nav-dropdown-grouped">
      <div class="category-nav-group-header">Creational</div>
      <button class="category-nav-method" data-method-id="pattern-singleton">Singleton</button>
      <button class="category-nav-method" data-method-id="pattern-factory">Factory Method</button>
      <div class="category-nav-group-header">Structural</div>
      <!-- ... -->
    </div>
  </div>
  <div class="category-subtab-row" data-testid="category-subtab-row"><!-- 不動 --></div>
</div>
```

每個 `.category-nav-item` 包一顆 pill 按鈕 + 一個下拉面板。Wrapper 用 `position: relative` 當作下拉的定位基準。Design Patterns 的下拉加 `category-nav-dropdown-grouped` 修飾類別,內部交錯 `.category-nav-group-header` 與 `.category-nav-method` 區塊。

### 新增 CSS(附加在 `style.css` 末端)

```css
/* Category nav hover dropdown */
.category-nav-item { position: relative; display: inline-block; }
.category-nav-dropdown {
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 50;
  min-width: 180px;
  max-height: 70vh;
  overflow-y: auto;
  background: #fff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 4px 0;
  margin-top: 4px;
}
.category-nav-item:hover .category-nav-dropdown,
.category-nav-item.open .category-nav-dropdown { display: block; }
.category-nav-method {
  display: block; width: 100%; text-align: left;
  padding: 6px 12px;
  background: none; border: 0; cursor: pointer;
  font-size: 14px; color: #1e293b; white-space: nowrap;
}
.category-nav-method:hover { background: #eff6ff; color: #1d4ed8; }
.category-nav-method.is-current-method { background: #dbeafe; font-weight: 600; }
.category-nav-group-header {
  padding: 8px 12px 4px;
  font-size: 11px; font-weight: 700;
  text-transform: uppercase; color: #64748b;
  letter-spacing: 0.05em;
}
```

`.category-nav-item:hover` 同時涵蓋 pill 與其下拉面板(都在同一個 wrapper 內),所以滑鼠從 pill 移到下拉內並不會關閉 —— 不需要 hover 延遲計時器。

### 方法區塊標題列

把現有的 `<label class="method-select-label">` + `<select class="category-method-select method-heading-select">` 整個 `methodPicker` 替換成:

```html
<span class="method-heading-title" data-testid="method-heading-title">Binary Search Tree</span>
```

旁邊既有的「Slides」按鈕保持不變。`.method-heading-title` 的文字在每次 `selectMethod(methodId)` 觸發切換時更新。

## 互動邏輯(JS)

hover 由純 CSS 處理。JS 負責點擊 toggle、外部點擊關閉、Esc 關閉、以及「目前選中的方法」高亮。

在 `renderCategoryNav` 內,每個 `.category-nav-item` 與其方法按鈕都掛上 listener;document 層級則註冊一次:

```js
categoryBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const wasOpen = navItem.classList.contains('open');
    closeAllDropdowns();
    if (!wasOpen) navItem.classList.add('open');
});

methodBtn.addEventListener('click', () => {
    activateGroup(group.id, method.id);   // 既有函式,不動
    closeAllDropdowns();
});

document.addEventListener('click', (e) => {
    if (!e.target.closest('.category-nav-item')) closeAllDropdowns();
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllDropdowns();
});

function closeAllDropdowns() {
    categoryNav.querySelectorAll('.category-nav-item.open')
        .forEach((it) => it.classList.remove('open'));
}
```

行為一覽:

| 事件 | 結果 |
|---|---|
| 滑鼠 hover pill | CSS 展開下拉(無 JS) |
| 點 / tap pill | toggle 自身 `.open`(先關掉其他開啟中的下拉) |
| 點下拉內的方法按鈕 | `activateGroup(groupId, methodId)`,關閉所有下拉 |
| 點 `.category-nav-item` 外側 | 關閉所有下拉 |
| 按 Esc | 關閉所有下拉 |
| hover 後滑鼠離開 wrapper | CSS `:hover` 不再 match,自動收起(若無 `.open`) |

**作用中方法高亮:** `setActiveCategory(groupId)` 既有函式擴充 —— 走訪當前 active 分類的下拉內 `.category-nav-method` 按鈕,把屬於 `currentMode` 的那一顆掛上 `.is-current-method`,其他移除。沒有額外狀態機,只是多一次 DOM toggle。

## app.js 變更摘要

集中在以下幾處:

- **`renderCategoryNav`** —— 重寫,改為輸出 `.category-nav-item` wrapper 結構;對每個分類動態建立 `.category-nav-dropdown` 並逐方法加入 `.category-nav-method` 按鈕;Design Patterns 額外插入 4 個 `.category-nav-group-header` 並依 sub-group 順序排列其下的方法;掛上 pill click toggle、方法按鈕 click 處理器;在函式末尾首次註冊 document 層級的 outside-click 與 Esc listener(以模組層級旗標確保不重複註冊)。
- **方法區塊標題列建構(`app.js:485-513` 附近)** —— 移除 `methodPicker`(`<label>` + `<select>`),改建 `<span class="method-heading-title" data-testid="method-heading-title">` 顯示當前方法標題。
- **`selectMethod(methodId)`** —— 刪除 `methodSelect.value = methodId` 那行(`<select>` 已不存在);改為更新所有 `.method-heading-title` 元素的 textContent 為新方法的 title。既有的 method-section 顯示/隱藏邏輯(以 `[data-method-section]` 為基礎)維持不變。
- **`setActiveCategory(groupId)`** —— 在既有的 active-class toggling 之後,新增一段:遍歷該 group(若是有 parent 的 sub-group,則用 parent group 的 wrapper)下拉內的方法按鈕,設定 `.is-current-method` 反映 `currentMode`。

`index.html` 不需要更動 —— 分類列與方法區塊標題皆為 JS 動態建構。

## 測試

### `loadMethod` 測試輔助函式重寫

`tests/visualizer.spec.js` 開頭的 `loadMethod(page, methodId)` 改為:

```js
async function loadMethod(page, methodId) {
    const navItem = page.locator(
        `.category-nav-item:has(.category-nav-method[data-method-id="${methodId}"])`);
    await navItem.locator('.category-nav-btn').click();
    await navItem.locator(`.category-nav-method[data-method-id="${methodId}"]`).click();
    const card = page.locator(`[data-method-section="${methodId}"]`);
    await expect(card).toHaveAttribute('data-runtime-state', 'active');
}
```

簽章不變,所有既有測試呼叫端零改動。

### 既有測試影響

- `Phase 1 category nav: renders nine top-level groups and drives method sections` —— 斷言 `.category-nav-btn` 共 9 顆 → 仍然成立(9 個 wrapper 各含 1 顆按鈕)。
- `Phase 5 regression: every top-level category renders method sections` —— 經 `loadMethod` 走訪,helper 改寫即可。
- `Design Patterns sub-tabs` —— 斷言 4 顆 `.category-subtab-btn` → 不動(sub-tab row 維持)。
- `Navigation: ... does not crash` —— 經 `loadMethod`,helper 改寫即可。
- 所有方法的 render 測試 —— 經 `loadMethod`,helper 改寫即可。

### 新增測試

新增 2 個下拉行為的 Playwright 測試:

1. **點 pill toggle 下拉、點方法載入** —— 點分類 pill,斷言其 `.category-nav-item` 取得 `.open` class;斷言下拉可見;點下拉內某方法按鈕,斷言該方法 section 變 active 且所有 `.category-nav-item.open` 已關閉。
2. **點外側與按 Esc 關閉下拉** —— 開啟某下拉後,點頁面其他位置 → 下拉關閉;再開一次,按 Esc → 關閉。

### 全套件數量

130 → **131 或 132**(44 unit + 87 或 88 Playwright)。

### 冪等性

`npm run format:code` 與 `npm run build:slides` 重跑後 `git status` 乾淨。

## CSS 清理

舊的 `.category-method-select` / `.method-heading-select` / `.method-select-label` 規則(如有)在 `style.css` 中移除以維持整潔;若僅是無 selector 命中的死規則亦可選擇保留(low priority)。

## 不在範圍內

- 下拉內方向鍵 / 多層 hover / 搜尋過濾(YAGNI)。
- 開合動畫(YAGNI;hover 與 `.open` 切換無需過渡即足夠順暢)。
- Design Patterns sub-tab row 結構變動(維持作為作用中狀態指示)。
- 手機版 nav 的版型重排(現行手機版橫向滾動 pill 列不動,只是 pill tap 時展開下拉)。

## 預期產出

`app.js` 內 `renderCategoryNav` 重寫、方法區塊標題改用靜態標題、`selectMethod` 與 `setActiveCategory` 小幅延伸;`style.css` 末端追加下拉樣式;`tests/visualizer.spec.js` 的 `loadMethod` 改寫並新增 2 個下拉測試。無 `index.html` 變動、無 `.cpp` / 簡報變動。
