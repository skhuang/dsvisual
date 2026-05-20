# 設計文件:資料結構與演算法分類重組(A 方案)

- **日期**:2026-05-20
- **分支**:`feature/category-restructure`
- **狀態**:設計待用戶核可

## 1. 目標

把目前 6 個分類重組為 **9 個** 內聚性更高的分類,不新增任何方法/視覺化/簡報內容。此為「Spec 1 of 4」,後續 spec 會在新分類架構上補新項目(🔴 強烈建議、🟡 值得補、🟢 加分項)。

## 2. 現況問題

| 問題 | 現況 |
|------|------|
| 退化分類 | `Linked Lists` 只 1 項(`list-linked`) |
| 同類被切散 | `list-array` 在 Basic Linear、`list-linked` 在 Linked Lists |
| 大雜燴 1 | `Non-Linear Structures` 把 9 顆樹 + 4 個圖混在一起;後者多為演算法非結構 |
| 大雜燴 2 | `Advanced & Application-Specific`(23 項)把 heap、hash、sort、search 全塞 |
| OOP / Patterns 擴充被限制 | 兩者皆有實質擴充空間(GoF 還有 17 個未做、OOP 還可加 ad hoc/parametric polymorphism 等),維持分開 |

## 3. 新分類(9 類)

| # | `id` | `title` | 方法 ids(保留現有順序) | 數量 |
|---|------|---------|--------------------------|------|
| 1 | `linear` | **Linear Structures** | `stack-array`, `stack-list`, `queue`, `list-array`, `list-linked` | 5 |
| 2 | `trees` | **Trees** | `tree-bst`, `tree-avl`, `tree-rb`, `tree-splay`, `tree-trie`, `tree-radix`, `tree-ternary`, `tree-btree`, `tree-bplus` | 9 |
| 3 | `graphs` | **Graphs** | `graph`, `graph-kruskal`, `graph-dijkstra`, `graph-topo` | 4 |
| 4 | `hash` | **Hash & Probabilistic** | `hash-chain`, `hash-open`, `hash-bucket` | 3 |
| 5 | `heaps` | **Heaps / Priority Queues** | `heap-binary`, `heap-binomial`, `heap-fibonacci`, `heap-leftist`, `heap-skew`, `heap-dary`, `heap-pairing` | 7 |
| 6 | `sorting` | **Sorting** | `sort-bubble`, `sort-select`, `sort-insert`, `sort-quick`, `sort-merge`, `sort-shell`, `sort-bucket`, `sort-count`, `sort-radix`, `sort-heap`, `sort-shaker` | 11 |
| 7 | `searching` | **Searching & String Matching** | `search-linear`, `search-binary` | 2 |
| 8 | `oop` | **OOP Concepts** | `oop-inheritance`, `oop-polymorphism`, `oop-encapsulation` | 3 |
| 9 | `patterns` | **Design Patterns** | `pattern-singleton`, `pattern-factory`, `pattern-adapter`, `pattern-decorator`, `pattern-observer`, `pattern-strategy` | 6 |

### 命名理由

- `Hash & Probabilistic`、`Searching & String Matching` 是**前瞻性命名**,目前各只有 3 / 2 項;當 Spec 3 補 Bloom filter / KMP 等時可直接落進去,不需再次改 nav 標籤。
- `Heaps / Priority Queues` 點出抽象介面,避免讀者誤以為只是「樹的另一種實作」。
- 其餘採最直白的單名複數(Trees / Graphs / Sorting…),與 stvisual 風格一致。

### id 變更摘要

| 舊 id | 新 id |
|-------|-------|
| `basic-linear` | `linear` |
| `linked-lists` | (合併進 `linear`) |
| `non-linear` | (拆分為 `trees` + `graphs`) |
| `advanced` | (拆分為 `hash` + `heaps` + `sorting` + `searching`) |
| `oop-concepts` | `oop` |
| `design-patterns` | `patterns` |

## 4. 涉及修改

純結構性修改,**不動任何方法的視覺化/動畫/簡報內容**。

### `app.js`

`METHOD_GROUPS` 陣列重組:6 個 group 物件變 9 個,`id`、`title` 改新值,`methods` 陣列依新分類重新分配(成員順序保留現狀)。

### `slides_db.js`

每個 deck 的 `category` 字串改為對應的新 title 字串。50 個 deck,大多原本是 `'Advanced & Application-Specific'` 或 `'Non-Linear Structures'`。映射表:

| 舊 category | 新 category |
|-------------|-------------|
| `Basic Linear Structures` | `Linear Structures`(stack-*, queue, list-array) |
| `Linked Lists` | `Linear Structures`(list-linked) |
| `Non-Linear Structures` | `Trees`(tree-*) **或** `Graphs`(graph-*),依方法 id |
| `Advanced & Application-Specific` | `Hash & Probabilistic`(hash-*)、`Heaps / Priority Queues`(heap-*)、`Sorting`(sort-*)、`Searching & String Matching`(search-*),依方法 id |
| `OOP Concepts` | `OOP Concepts`(未變) |
| `Design Patterns` | `Design Patterns`(未變) |

### 重生 slides 產出

執行 `npm run build:slides`,重生 `slides_rendered.js` 與 `slides/{zh,en}/*.md`。這 100 份 `.md` 與 `slides_rendered.js` 因為 `category` 字串改變會有 diff,屬於預期。

### 測試斷言

- Playwright 測試裡若有比對到分類標籤或舊 id 的(例如 `[data-category="advanced"]` 之類)需要更新。
- 既有 80+ 個測試大多以方法 id 與 method-section 為主、不直接綁分類標籤;但需實作階段一一驗證。

### CSS / `style.css`

若有以 `[data-category="<old-id>"]` 或舊 title 文字為 selector 的 CSS rule 需更新。預期影響面小或無,實作階段確認。

### `index.html`

預期不需改 — 分類 nav 是 JS 動態渲染。如有靜態提到舊分類名稱的字串需更新(例如 README-style help text)。

## 5. 不在此範圍

- **不新增任何方法、視覺化、簡報**。新增項目屬 Spec 2/3/4。
- **不重命名任何方法 id**(`stack-array` 等保持不變,確保 slides 與 code_db 對映穩定)。
- **不調整 nav 視覺樣式**(pill 樣式、捲動行為不動)。9 個 pill 已超過寬度時依現有 horizontal scroll 行為自然處理。

## 6. 驗收測試

- `npm run test:all` 全綠(unit + Playwright)。
- 開瀏覽器:nav 顯示 9 個 pill,點每個 pill 都能切到對應第一個方法;每個方法的 Slides 按鈕能開出簡報且 deck 的 `category` 顯示新字串。
- `npm run build:slides` 冪等:再跑一次 `git status --short` 乾淨。
- `npm run format:code` 冪等:再跑一次 `git status --short` 乾淨。

## 7. 風險與已知考量

- **Playwright selector 風險**:若有測試以舊 category title 文字斷言(如 `toContainText('Advanced & Application-Specific')`),需更新。實作計畫第一步就應全掃。
- **使用者書籤/記憶**:無 URL 狀態;不會破壞外部連結。
- **未來 Spec 2/3/4 的「Hash & Probabilistic」與「Searching & String Matching」標籤**:目前無對應內容,標籤稍嫌前瞻,但這是刻意的,避免後續再改 nav 標籤造成使用者重新認識。如真要保守,可後置改名(等到 Bloom / KMP 落地時),但會多一次 nav 標籤異動,該方案被否決。

## 8. 後續

Spec 1 落地後,進入 Spec 2(🔴 強烈建議的 5 項補齊):BFS/DFS、Adjacency List、Disjoint Set、Deque、字串比對(KMP/BM/RK)。Spec 2 在這個新分類架構上補內容、不再動結構。
