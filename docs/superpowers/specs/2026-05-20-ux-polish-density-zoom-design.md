# 設計文件:UX 微調 — 程式碼面板密度 + Visualizer Zoom

- **日期**:2026-05-20
- **分支**:`feature/ux-polish-density-zoom`
- **狀態**:設計待用戶核可

## 1. 目標

兩個獨立但合在一個 PR 的小型 UX 改進,讓現有介面更可用:

1. **程式碼面板行距可調**:目前 `.code-panel-body` 寫死 `line-height: 1.55`,有些使用者覺得太寬。提供一個 **全域、persistent** 的滑桿,可調 1.0–1.8 之間。
2. **Visualizer 縮放**:每個 visualizer 右上角加 zoom 控件(`−` / 百分比 reset / `＋`),範圍 50%–200%,支援按鈕、滑鼠 wheel、觸控 pinch。**Per-visualizer state、切方法 reset、不存 localStorage**。

## 2. 架構

```
index.html header
    └── ⚙ settings-toggle(新)──► settings-drawer(新,右側 slide-in panel)
                                        └── 滑桿:程式碼面板行距
                                              └── localStorage `dsvisual.codeDensity`
                                              └── --code-line-height CSS custom property
                                              └── 套到所有 .code-panel-body(主畫面 + 簡報)

每張 method-section-card
    └── .method-section-visual 右上角
            └── [−] [100%] [＋] [⤺]
                  └── CSS transform: scale(x) on visualizer body
                  └── 按鈕、wheel、pinch 三種互動
                  └── 切方法 reset 100%
```

關鍵設計選擇:
- **密度為全域、persistent**(localStorage),套用主畫面 + 簡報內所有 `.code-panel-body`,一處改處處生效。
- **Zoom 為 per-visualizer、ephemeral**,不跨方法保留(切方法直覺重置)、不存 localStorage。如未來要存,API 預留。
- **Zoom 不套用簡報內的 SVG / mermaid / KaTeX**(那些有自己的內容比例),先聚焦主畫面 visualizer。
- 設定抽屜採可擴充設計:未來可加主題、語言預設、動畫速度等。

## 3. 程式碼面板密度滑桿

### UI 元件

`index.html` header 加:
```html
<button id="settings-toggle" type="button" aria-label="Open settings">⚙</button>
```
放在既有 header 右上角(與 nav 區隔)。

新增 `<aside id="settings-drawer">` 右側 slide-in panel,結構:
```html
<aside id="settings-drawer" class="settings-drawer" hidden>
  <button class="settings-drawer-backdrop" data-settings-close aria-label="Close settings"></button>
  <section class="settings-drawer-panel" role="dialog" aria-modal="true" aria-labelledby="settings-drawer-title">
    <header class="settings-drawer-header">
      <h2 id="settings-drawer-title">設定 / Settings</h2>
      <button class="settings-drawer-close" data-settings-close aria-label="Close">×</button>
    </header>
    <div class="settings-drawer-body">
      <section class="settings-row">
        <label for="code-density-slider">程式碼面板行距 / Code panel line-height</label>
        <div class="settings-row-controls">
          <input id="code-density-slider" type="range" min="1.0" max="1.8" step="0.05" value="1.55">
          <span id="code-density-value">1.55</span>
          <button id="code-density-reset" type="button">Reset</button>
        </div>
      </section>
    </div>
  </section>
</aside>
```

### 範圍與預設

- `min="1.0"`(最緊湊)、`max="1.8"`(最寬鬆)、`step="0.05"`、`value="1.55"`(目前值)
- 首次載入維持 PR #57 後的 1.55 視覺,使用者主動拖才寫 localStorage。
- 滑桿即時更新:`input` event(不是 `change`),拖動時馬上反應。
- 旁邊的 `<span id="code-density-value">` 即時顯示當前值。
- `Reset` 按鈕回 1.55,並從 localStorage 刪除該 key。

### 套用機制

`style.css` 變更:
```css
:root {
  --code-line-height: 1.55;
}
.code-panel-body {
  line-height: var(--code-line-height);  /* 取代既有的 1.55 硬編碼 */
}
```

`app.js` 加:
```js
const STORAGE_KEY = 'dsvisual.codeDensity';
function applySavedDensity() {
  const v = localStorage.getItem(STORAGE_KEY);
  if (v) document.documentElement.style.setProperty('--code-line-height', v);
}
function bindDensitySlider() {
  const slider = document.getElementById('code-density-slider');
  const display = document.getElementById('code-density-value');
  const resetBtn = document.getElementById('code-density-reset');
  // initial sync
  const saved = localStorage.getItem(STORAGE_KEY) || '1.55';
  slider.value = saved;
  display.textContent = saved;
  slider.addEventListener('input', () => {
    document.documentElement.style.setProperty('--code-line-height', slider.value);
    display.textContent = slider.value;
    localStorage.setItem(STORAGE_KEY, slider.value);
  });
  resetBtn.addEventListener('click', () => {
    slider.value = '1.55';
    display.textContent = '1.55';
    document.documentElement.style.removeProperty('--code-line-height');
    localStorage.removeItem(STORAGE_KEY);
  });
}
```

### 套用範圍

所有 `.code-panel-body`(主畫面方法卡內、簡報檢視器內)同步生效,因為它們都繼承 root 的 CSS custom property。

## 4. Visualizer Zoom 控件

### UI 元件(每個 visualizer 右上角)

`app.js` 渲染 method section 時,在 `.method-section-visual` 內注入:
```html
<div class="viz-zoom-controls" role="toolbar" aria-label="Zoom controls">
  <button type="button" data-zoom="out" aria-label="Zoom out">−</button>
  <button type="button" data-zoom="reset" aria-label="Reset zoom">100%</button>
  <button type="button" data-zoom="in" aria-label="Zoom in">+</button>
</div>
```

中間 `reset` 按鈕的文字顯示當前縮放百分比,點擊回 100%。

### 範圍與步距

- 範圍:50% – 200%(`0.5` – `2.0`)
- 按鈕步距:`±0.1`(±10%)
- 滑鼠 wheel 步距:`±0.05`(±5%,較細)
- Pinch 步距:依距離比例平滑變化

### 套用機制

新增 `.viz-body-scaled` 容器(包住既有 visualizer DOM 內容),CSS:
```css
.method-section-visual {
  position: relative;
  overflow: auto;  /* zoom > 100% 時可滾 */
}
.viz-body-scaled {
  transform: scale(var(--viz-zoom, 1));
  transform-origin: top left;
  transition: transform 0.2s ease;
}
.viz-zoom-controls {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
  display: flex;
  gap: 2px;
  /* 按鈕樣式略 */
}
```

每個 method-section 卡片有自己的 zoom state,綁在 section DOM 上(`section.dataset.zoom = '1.0'`)。

### 互動

```js
function bindZoomControls(section) {
  const body = section.querySelector('.viz-body-scaled');
  const controls = section.querySelector('.viz-zoom-controls');
  const resetBtn = controls.querySelector('[data-zoom="reset"]');
  let zoom = 1.0;

  function applyZoom(z) {
    zoom = Math.max(0.5, Math.min(2.0, z));
    body.style.setProperty('--viz-zoom', zoom);
    resetBtn.textContent = Math.round(zoom * 100) + '%';
  }

  controls.querySelector('[data-zoom="in"]').addEventListener('click', () => applyZoom(zoom + 0.1));
  controls.querySelector('[data-zoom="out"]').addEventListener('click', () => applyZoom(zoom - 0.1));
  resetBtn.addEventListener('click', () => applyZoom(1.0));

  // Wheel
  body.parentElement.addEventListener('wheel', (e) => {
    e.preventDefault();
    applyZoom(zoom + (e.deltaY < 0 ? 0.05 : -0.05));
  }, { passive: false });

  // Pinch (two-pointer)
  const pointers = new Map();
  let pinchStart = null;
  body.parentElement.addEventListener('pointerdown', (e) => {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const [a, b] = Array.from(pointers.values());
      pinchStart = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom };
    }
  });
  body.parentElement.addEventListener('pointermove', (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2 && pinchStart) {
      const [a, b] = Array.from(pointers.values());
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      applyZoom(pinchStart.zoom * (dist / pinchStart.dist));
    }
  });
  body.parentElement.addEventListener('pointerup', (e) => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinchStart = null;
  });

  // expose for method-switch reset
  return { reset: () => applyZoom(1.0) };
}
```

### Zoom lifecycle

- 切方法時 reset 回 100%(`selectMethod()` 內,新 section 渲染後即套 1.0,等於 transform 不縮放)。
- 不存 localStorage,不跨方法保留。

## 5. 檔案異動

**修改**
- `index.html`
  - header 加 `<button id="settings-toggle">⚙</button>`
  - body 末尾加 `<aside id="settings-drawer">...</aside>` panel
- `app.js`
  - 在 method-section 模板加 `<div class="viz-body-scaled">` 包住 visualizer 內容,並在 section 右上角加 `.viz-zoom-controls` HTML
  - 加 `bindZoomControls(section)` / `setZoom(section, v)` 函式
  - 加 `bindSettingsDrawer()` 與密度滑桿邏輯
  - 加 `applySavedDensity()` 在 DOMContentLoaded
  - method 切換時 reset zoom(每張 section 自帶 reset 函式)
- `style.css`
  - 新增 `:root { --code-line-height: 1.55; }`、改 `.code-panel-body` 用 var
  - 加 `.settings-drawer` / `.settings-drawer-panel` / `.settings-drawer-backdrop` / `.settings-row` / `.settings-toggle` 樣式
  - 加 `.viz-body-scaled`(`transform: scale(var(--viz-zoom, 1)); transform-origin: top left; transition: transform 0.2s ease;`)
  - 加 `.viz-zoom-controls` + 內按鈕樣式
  - `.method-section-visual { position: relative; overflow: auto; }`
- `tests/ux_polish.spec.js`(新增測試檔)

**新增**
- `tests/ux_polish.spec.js` — 4–6 個 Playwright 測試 case

**無變更**
- `slides_db.js`、`slides_rendered.js`、`build_slides.js`、`build_db.js`、`format_code.js`、`code_db.js`、所有 `.cpp`、`vendor/`

## 6. 測試

### 密度滑桿
- 開抽屜、拖滑桿到 1.30 → 確認 `.code-panel-body` computed `lineHeight` 變 `~17.6px`(假設 font-size 13.6px × 1.3)。
- 重整頁面 → 仍是 1.30(從 localStorage)。
- 按 Reset → 回 1.55,localStorage 該 key 被移除。
- 切到簡報檢視器,內部程式碼 `.code-panel-body` 同樣套用。

### Zoom
- 點 `+` → reset 按鈕文字變 `110%`、visualizer transform scale `1.1`。
- 點 `−` 兩次回 `90%`。
- Reset 按鈕回 `100%`。
- 切方法後,新 section 的 reset 是 `100%`(獨立 state)。
- 範圍 clamp:多按 `+` 不會超過 `200%`、多按 `−` 不會低於 `50%`。
- (Headless 環境 wheel / pinch 不易精準測,先用 button 路徑驗證夠了)

### 既有測試
- 全部 87 個既有測試保持綠燈(密度滑桿與 zoom 是純疊加,不破壞既有 DOM 行為)。

## 7. 不在此範圍

- 不改 visualizer 動畫邏輯;只在外面套縮放 transform。
- 不對簡報內的 SVG / mermaid / KaTeX 套 zoom(那些有自己的呈現邏輯)。
- 不加 zoom 持久化(切方法後重置,不存 localStorage)。
- 不加其他設定項(主題、動畫速度)— 抽屜架構保留擴充,本 PR 只放密度滑桿。

## 8. 風險與已知考量

- **CSS transform scale 與 SVG**:`transform: scale()` 套在外層 div 上對 inline SVG、DOM 內容皆有效,不會因渲染類型不同而失效。所有既有 visualizer 不需個別調整。
- **transform-origin: top left** 確保放大時內容不會偏出可視範圍中心;搭配 `overflow: auto` 提供 scroll。
- **Wheel preventDefault**:在 `.method-section-visual` 內接管 wheel 會阻擋 page scroll —— 但這是預期行為,使用者在 visualizer 內滾就是要 zoom。離開 visualizer 區就回到正常 page scroll。
- **Pinch 在 trackpad**:現代 trackpad 的雙指縮放通常會觸發 ctrl+wheel,瀏覽器原生 page zoom。我們的 zoom 只在 `.method-section-visual` 內生效,不影響全頁。實裝後手測確認體驗。
- **抽屜 z-index 與 slide-viewer**:簡報 modal 是 z-index 300,設定抽屜建議 z-index 200(在 modal 之下),避免重疊。
- **既有測試 selectors**:既有 Playwright 測試對 `.method-section-visual` 內元素用 querySelector,新加的 `.viz-body-scaled` 包一層 → 大多用 descendant selector,不破壞。實作期確認沒有 `>` 直接子代選擇器卡住。
