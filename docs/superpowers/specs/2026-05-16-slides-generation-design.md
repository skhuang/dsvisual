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
slides_db.js                    ← 結構化來源(單一事實來源,~50 主題,中英 i18n,
      │                            含原始 LaTeX / mermaid 原始碼)
      ▼
build_slides.js (Node)          ← 建構期:預渲染 LaTeX→HTML、mermaid→SVG
      │
      ├──►  slides/zh/<id>.md  /  slides/en/<id>.md   ← Marp 簡報
      │
      └──►  slides_rendered.js                        ← App 用(數學/圖形已預渲染)
                  │
                  ▼
            app.js buildSlides()  ──►  slide-viewer modal(多頁 + 語言切換)
```

數學與圖形一律在建構期預渲染(見 §3)。App 載入的是產出檔 `slides_rendered.js`,
不是原始來源 `slides_db.js`,因此 App 端零執行期渲染相依。

### 為何來源與產出都用 `.js` 檔

專案核心特性是「免後端、直接開 `index.html`」。App 載入的資料檔必須能用
`<script>` 直接載入,比較過三種格式:

| 方案 | 評估 |
|------|------|
| `.js` 檔(掛 `window` / `module.exports`) | ✅ 採用。沿用既有 `desc_db.js` / `code_db.js` 慣例;App 用 `<script>` 載入,Node 用 `require()`。 |
| 每主題一份 JSON | ❌ App 在 `file://` 下 `fetch()` 本地 JSON 會被 CORS 擋掉。 |
| 每主題一份 ES module | ⚠️ `file://` 下 ES module import 常受限。 |

故手寫來源 `slides_db.js` 與 App 產出檔 `slides_rendered.js` 都採單一 `.js` 檔。

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
// slides_db.js 為手寫來源,只被 build_slides.js (Node) require,故僅需 module.exports。
// App 載入的是產出檔 slides_rendered.js(掛 window.SLIDES_RENDERED)。
```

### 內容區塊型別

區塊設計成能同時無痛轉成 Marp markdown 與 App HTML:

| 區塊型別 | 內容 | Marp 渲染 | App 渲染 |
|----------|------|-----------|----------|
| `paragraph` | 一段文字(可含行內 LaTeX) | 段落 | `<p>` |
| `bullets` | 文字清單 | `-` 清單 | `<ul>` |
| `steps` | 有序步驟(逐步圖解用) | `1.` 清單 | `<ol>` |
| `table` | 表頭 + 列(複雜度表用) | markdown 表格 | `<table>` |
| `code` | C++ 程式碼字串(取自 `code_db.js`) | ` ```cpp ` 圍欄 | `<pre><code>` |
| `note` | 重點提示 / callout | blockquote | `.note` div |
| `math` | 顯示型 LaTeX 公式(遞迴式、複雜度推導) | `$$...$$` | 建構期預渲染的 KaTeX HTML |
| `image` | 外部圖檔(`src` + `alt`/`caption` i18n) | `![alt](src)` | `<img>` + `<figcaption>` |
| `svg` | 行內 SVG 原始碼(自繪示意圖) | 直接內嵌 `<svg>` | 直接內嵌 `<svg>` |
| `mermaid` | mermaid 圖原始碼(流程、樹、狀態圖) | 建構期預渲染成內嵌 SVG | 建構期預渲染的內嵌 SVG |

- 所有文字葉節點為 `{ zh: "...", en: "..." }`。
- `code`、`svg`、`mermaid` 區塊不需 i18n(語言中性);`math` 的公式本體不需 i18n,
  但其 `caption` 若有則需 i18n。
- **行內數學**:`paragraph`、`bullets`、`steps`、`note`、`table` 的文字葉節點可內嵌
  `$...$` 行內 LaTeX(例:`$O(\log n)$`),建構期會被預渲染。
- 新增語言時:在每個文字葉節點加一個語言鍵,生成器自動多產出一個語言資料夾。

### 數學與圖形渲染策略 — 統一採建構期(Marp 端)渲染

**所有數學與圖形一律在建構期(Node 端)預渲染**,App slide-viewer 不引入任何
前端執行期渲染函式庫(不 vendored KaTeX / mermaid.js,無 `vendor/`)。

| 能力 | 建構期處理(`build_slides.js`) | Marp `.md` 產出 | App 產出(`slides_rendered.js`) |
|------|--------------------------------|------------------|----------------------------------|
| LaTeX | `katex`(npm)伺服器端渲染成 HTML | 保留 `$`/`$$`,交 Marp Core 內建 KaTeX | 內嵌預渲染的 KaTeX HTML |
| mermaid | `@mermaid-js/mermaid-cli` 渲染成 SVG | 內嵌預渲染 SVG | 內嵌預渲染 SVG |
| 外部圖檔 | 不處理(僅複製路徑) | `![](../assets/<file>)` | `<img src="slides/assets/<file>">` |
| 行內 SVG | 不處理(原樣) | 直接內嵌 `<svg>` | 直接內嵌 `<svg>` |

理由:專案核心特性是直接開 `index.html`、免後端。建構期預渲染讓 App 端**零執行期
相依**、離線可用、且不必把數 MB 的 mermaid.js 放進 repo。KaTeX 與 mermaid-cli
僅作為 build-time 的 devDependency 存在。代價是每次改 `slides_db.js` 都需重跑
`build:slides`,產出檔(`.md` 與 `slides_rendered.js`)需一併 commit。

### 每份 deck 的標準投影片序列(深入多頁式,8–10 頁)

1. **標題頁** — 主題名稱、類別標籤、一句話定義。
2. **核心概念** — `paragraph` + `bullets`。
3. **運作流程** — `steps` 逐步圖解,搭配 `mermaid` 或 `svg` 圖示(流程 / 樹 / 狀態圖)。
4. **複雜度分析** — `table`(操作 → 時間 / 空間);推導用 `math` 顯示公式。
5. **優缺點與使用時機** — `bullets`(優點 / 缺點 / 適用場景)。
6. **程式碼** — `code` 區塊(內容多時可拆成 1–2 頁)。
7. **小結** — `bullets` 重點回顧。

頁數依主題實際內容在 8–10 頁間浮動;序列固定,內容由 Claude 撰寫。

## 4. 元件

### `slides_db.js`(新增)

手寫的結構化內容來源。約 50 個主題,key 與 `desc_db.js` 一致。含原始 LaTeX 與
mermaid 原始碼。只被 `build_slides.js`(Node)`require`,故僅需 `module.exports`。

### `build_slides.js`(新增)

Node 腳本。職責:

1. `require('./slides_db.js')`。
2. 預渲染圖形:每個 `mermaid` 區塊用 `@mermaid-js/mermaid-cli` 渲染成 SVG
   (相同原始碼算一次,快取避免重複渲染)。
3. 預渲染數學:行內 `$...$` 與 `math` 區塊用 `katex`(npm)伺服器端渲染成 HTML。
4. 產出 Marp `.md`:對每個主題、每種語言把 deck 渲染成 Marp markdown,
   寫出 `slides/<lang>/<id>.md`。
5. 產出 App 資料:把每份 deck 連同預渲染好的數學 HTML 與 mermaid SVG,
   序列化成 `slides_rendered.js`(含中英兩語言)。

Marp markdown 輸出規格:

- 檔首 frontmatter:`marp: true`、`theme`、`paginate: true`、`math: katex`、`title`。
- 投影片之間以 `---` 分隔。
- 各區塊依上表規則轉為對應 markdown;`mermaid` 輸出為預渲染的內嵌 `<svg>`;
  `math` 輸出 `$$...$$`、行內 `$...$` 原樣保留(交 Marp Core 內建 KaTeX,
  使 `.md` 對外仍是乾淨可讀的 markdown)。

### App slide-viewer 整合

- `index.html` 載入產出檔 `slides_rendered.js`(取代直接載入 `slides_db.js`)。
- `app.js` 的 `buildSlides(methodId)` 改為讀 `slides_rendered.js` 的資料,
  回傳多張投影片(每張一個已組好的 HTML body),取代目前只回傳單張、
  直接塞 `descDB[methodId]` 的作法。
- 區塊 → HTML 的渲染器把區塊組成 HTML;數學與 mermaid 已是預渲染好的
  HTML / SVG,直接內嵌即可,**App 端不需任何執行期渲染函式庫**。
- slide-viewer header 新增 `中 / EN` 語言切換鈕;切換時以目前語言重建 deck
  並保留當前頁碼。
- `index.html`:slide-viewer header 加入語言切換鈕標記;載入 vendored 的
  `katex.min.css`。
- `style.css`:多頁簡報內容、語言鈕、`figure`/`figcaption`、mermaid SVG
  容器的樣式。
- 預渲染的數學 HTML 仍需 KaTeX 樣式表才能正確顯示,故 vendored **KaTeX CSS
  一個檔**(`katex.min.css`,體積小,非多 MB 的 JS 執行期)及其字型檔。

### Marp 工具與相依

- `package.json` devDependencies(僅 build-time,不進 App 執行期):
  - `@marp-team/marp-cli` — `.md` → PDF / HTML / PPTX。
  - `@mermaid-js/mermaid-cli` — 建構期預渲染 mermaid。
  - `katex` — 建構期伺服器端渲染數學。
- npm scripts:
  - `build:slides` — 執行 `build_slides.js`,產出 `.md` 與 `slides_rendered.js`。
  - `slides:pdf`(可選) — 用 Marp CLI 把 `.md` 轉 PDF / HTML。

## 5. 檔案異動總覽

**新增**

- `slides_db.js` — 結構化內容來源(手寫,含原始 LaTeX / mermaid 原始碼)。
- `build_slides.js` — 生成器(mermaid → SVG、LaTeX → HTML 預渲染)。
- `slides_rendered.js` — 生成的 App 用資料(數學 / 圖形已預渲染,需 commit)。
- `slides/zh/<id>.md`、`slides/en/<id>.md` — 生成的簡報(約 100 份,需 commit)。
- `slides/assets/` — 外部圖檔資料夾。
- `slides/README.md` — 說明如何用 Marp 轉檔。
- `vendor/katex/` — vendored 的 `katex.min.css` 及字型檔(僅 CSS,無 JS 執行期)。

**修改**

- `app.js` — `buildSlides()` 改讀 `slides_rendered.js`、區塊→HTML 渲染、語言切換。
- `index.html` — slide-viewer header 語言切換鈕、改載入 `slides_rendered.js`
  的 `<script>` 標籤。
- `style.css` — 多頁簡報、語言鈕、`figure`/`figcaption`、KaTeX 輸出與
  mermaid SVG 容器樣式。
- `package.json` — devDependencies 與 scripts。

## 6. 測試

- **`build_slides.js` 單元測試**:給定一份小型 deck,驗證輸出的 Marp markdown
  正確(frontmatter 含 `math: katex`、`---` 分隔、各區塊型別轉換、mermaid 預渲染成
  內嵌 SVG、`math` 轉 `$$...$$`)。
- **App Playwright 測試**:更新既有 slide-viewer 測試;新增「多頁前後切換」、
  「中英語言切換」、「KaTeX 公式有渲染」、「mermaid 圖有渲染成 SVG」測試。
- **Marp 轉檔抽樣**:用 Marp CLI 實際轉一份含數學與 mermaid 的 `.md`,
  確認可成功產出且公式 / 圖形正確。

## 7. 不在此範圍

- 不新增主題;只為現有 `desc_db.js` 的 key 做簡報。
- 不改動既有的視覺化 / 演算法動畫邏輯。
- 不做中英以外的語言內容(但架構保留擴充點)。
- `slides:pdf` 的 PDF 批次產出為可選 script,不在驗收必要項。

## 8. 內容工作量備註

約 50 主題 × 8–10 頁 × 中英雙語,內容量大。實作計畫需將內容撰寫
分批進行(可依類別切批,例如 stack/queue/list 一批、sort 一批……),
每批產出後校閱再進下一批。
