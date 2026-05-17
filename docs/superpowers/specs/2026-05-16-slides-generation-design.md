# 設計文件:資料結構與演算法簡報生成

- **日期**:2026-05-16
- **分支**:`feature/categorized-menu`(本工作將開新分支)
- **狀態**:設計已核可,待撰寫實作計畫

## 1. 目標

為專案中所有資料結構與演算法主題(約 50 個,涵蓋 stack / queue / list / sort /
search / hash / heap / graph / tree / OOP / design patterns)產生教學用簡報。

- 輸出格式為 **Marp Markdown**(`.md`),可用 Marp 轉成 PDF / HTML / PPTX。
- 簡報內容支援 **i18n**,目前提供 **繁體中文** 與 **英文** 兩種版本,架構需可再擴充語言。
- 同一份內容也餵給 App 既有的 slide-viewer modal,讓網頁上能瀏覽多頁簡報並切換語言。
- 簡報內容由 Claude 撰寫(以現有 `desc_db.js` / `code_db.js` 為基礎擴寫成完整教學內容),
  使用者事後校閱。

## 2. 架構

單一結構化來源,展開成兩種渲染器、多種語言:

```
slides_db.js          ← 結構化來源(單一事實來源,~50 主題,中英 i18n)
      │
      ├──► build_slides.js (Node)  ──►  slides/zh/<id>.md   ← Marp 簡報
      │                                  slides/en/<id>.md
      │
      └──► app.js buildSlides()    ──►  slide-viewer modal(多頁 + 語言切換)
```

### 為何用單一 `slides_db.js`

專案核心特性是「免後端、直接開 `index.html`」。比較過三種來源格式:

| 方案 | 評估 |
|------|------|
| 單一 `slides_db.js`(export `SLIDES_DB`) | ✅ 採用。沿用既有 `desc_db.js` / `code_db.js` 慣例;App 用 `<script>` 載入,Node 生成器用 `require()`。 |
| 每主題一份 JSON | ❌ App 在 `file://` 下 `fetch()` 本地 JSON 會被 CORS 擋掉。 |
| 每主題一份 ES module | ⚠️ `file://` 下 ES module import 常受限。 |

## 3. 內容模型

### Deck 結構

每個主題一份 deck,每份 deck 由多張投影片組成。每張投影片 =
標題 + 內容區塊陣列。

`slides_db.js` 結構:

```js
const SLIDES_DB = {
  'stack-array': {
    category: 'Basic Linear Structures',
    title: { zh: '堆疊(陣列實作)', en: 'Stack (Array Implementation)' },
    slides: [
      { kind: 'title',  subtitle: { zh: '...', en: '...' } },
      { kind: 'concept', heading: { zh: '核心概念', en: 'Core Concept' },
        blocks: [
          { type: 'paragraph', text: { zh: '...', en: '...' } },
          { type: 'bullets',  items: [ { zh: '...', en: '...' } ] },
        ] },
      // ...
    ],
  },
  // ~50 個主題
};
// 瀏覽器:window.SLIDES_DB = SLIDES_DB;
// Node:  module.exports = SLIDES_DB;(以與 desc_db.js 一致的雙環境匯出方式處理)
```

### 內容區塊型別

區塊設計成能同時無痛轉成 Marp markdown 與 App HTML:

| 區塊型別 | 內容 | Marp 渲染 | App 渲染 |
|----------|------|-----------|----------|
| `paragraph` | 一段文字 | 段落 | `<p>` |
| `bullets` | 文字清單 | `-` 清單 | `<ul>` |
| `steps` | 有序步驟(逐步圖解用) | `1.` 清單 | `<ol>` |
| `table` | 表頭 + 列(複雜度表用) | markdown 表格 | `<table>` |
| `code` | C++ 程式碼字串(取自 `code_db.js`) | ` ```cpp ` 圍欄 | `<pre><code>` |
| `note` | 重點提示 / callout | blockquote | `.note` div |

- 所有文字葉節點為 `{ zh: "...", en: "..." }`。
- `code` 區塊不需 i18n(程式碼語言中性)。
- 新增語言時:在每個文字葉節點加一個語言鍵,生成器自動多產出一個語言資料夾。

### 每份 deck 的標準投影片序列(深入多頁式,8–10 頁)

1. **標題頁** — 主題名稱、類別標籤、一句話定義。
2. **核心概念** — `paragraph` + `bullets`。
3. **運作流程** — `steps` 逐步圖解(必要時配簡單 ASCII 圖,放在 `note` 或 `code` 區塊)。
4. **複雜度分析** — `table`(操作 → 時間 / 空間)。
5. **優缺點與使用時機** — `bullets`(優點 / 缺點 / 適用場景)。
6. **程式碼** — `code` 區塊(內容多時可拆成 1–2 頁)。
7. **小結** — `bullets` 重點回顧。

頁數依主題實際內容在 8–10 頁間浮動;序列固定,內容由 Claude 撰寫。

## 4. 元件

### `slides_db.js`(新增)

結構化內容來源。約 50 個主題,key 與 `desc_db.js` 一致。雙環境匯出
(瀏覽器掛 `window`,Node `module.exports`)。

### `build_slides.js`(新增)

Node 腳本。職責:

1. `require('./slides_db.js')`。
2. 對每個主題、每種語言,把 deck 渲染成一份 Marp markdown 字串。
3. 寫出 `slides/<lang>/<id>.md`。

Marp markdown 輸出規格:

- 檔首 frontmatter:`marp: true`、`theme`、`paginate: true`、`title`。
- 投影片之間以 `---` 分隔。
- 各區塊依上表規則轉為對應 markdown。

### App slide-viewer 整合

- `app.js` 的 `buildSlides(methodId)` 改為讀 `SLIDES_DB[methodId]`,
  回傳多張投影片(每張一個 HTML body),取代目前只回傳單張、
  直接塞 `descDB[methodId]` 的作法。
- 區塊 → HTML 的渲染器與 Marp 渲染器並列,共用同一份 deck 資料。
- slide-viewer header 新增 `中 / EN` 語言切換鈕;切換時以目前語言重建 deck
  並保留當前頁碼。
- `index.html`:slide-viewer header 加入語言切換鈕標記。
- `style.css`:多頁簡報內容與語言鈕樣式。

### Marp 工具

- `package.json` 加 `@marp-team/marp-cli` 為 devDependency。
- npm scripts:
  - `build:slides` — 執行 `build_slides.js` 產出 `.md`。
  - `slides:pdf`(可選) — 用 Marp CLI 把 `.md` 轉 PDF / HTML。

## 5. 檔案異動總覽

**新增**

- `slides_db.js` — 結構化內容來源。
- `build_slides.js` — Marp 生成器。
- `slides/zh/<id>.md`、`slides/en/<id>.md` — 生成的簡報(約 100 份)。
- `slides/README.md` — 說明如何用 Marp 轉檔。

**修改**

- `app.js` — `buildSlides()` 改讀 `SLIDES_DB`、區塊→HTML 渲染、語言切換。
- `index.html` — slide-viewer header 語言切換鈕、`slides_db.js` 的 `<script>` 標籤。
- `style.css` — 多頁簡報與語言鈕樣式。
- `package.json` — devDependency 與 scripts。

## 6. 測試

- **`build_slides.js` 單元測試**:給定一份小型 deck,驗證輸出的 Marp markdown
  正確(frontmatter、`---` 分隔、各區塊型別轉換)。
- **App Playwright 測試**:更新既有 slide-viewer 測試;新增「多頁前後切換」與
  「中英語言切換」測試。
- **Marp 轉檔抽樣**:用 Marp CLI 實際轉一份 `.md`,確認可成功產出。

## 7. 不在此範圍

- 不新增主題;只為現有 `desc_db.js` 的 key 做簡報。
- 不改動既有的視覺化 / 演算法動畫邏輯。
- 不做中英以外的語言內容(但架構保留擴充點)。
- `slides:pdf` 的 PDF 批次產出為可選 script,不在驗收必要項。

## 8. 內容工作量備註

約 50 主題 × 8–10 頁 × 中英雙語,內容量大。實作計畫需將內容撰寫
分批進行(可依類別切批,例如 stack/queue/list 一批、sort 一批……),
每批產出後校閱再進下一批。
