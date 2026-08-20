# 多語言範例原始碼(source drawer 語言切換)設計文件

- 日期:2026-08-16
- Repo:`dsvisual`;branch `feat/multilang-source`
- 動機:目前 viz 的範例程式只有 C++。新增 **Python / Rust / Go / PHP** 四種語言,先以 **Dijkstra** viz 為例,在 source drawer 內以語言切換(pills)呈現,**預設仍為 C++**。目的:同一演算法的不同語言實作並列,方便比較學習。

## 0. 範圍與決策(已與使用者確認)

- **切換 UI**:source drawer header 內一列語言 pills:**C++ · Python · Rust · Go · PHP**,預設 C++。點擊切換 `<code>` 內容 + `language-*` class 並重新 Prism highlight。
- **只在有多語言來源的 method 顯示 pills**;目前僅 Dijkstra。其他 method 維持 C++-only、行為不變。
- **來源 = 各語言完整可執行程式**,對齊 C++ 參考(相同 5 節點無向加權圖、相同 relaxation trace 與輸出),讓每份都能單獨執行、逐行對照。
- **可一般化**:未來把檔案丟進 `src/<lang>/<name>` 即自動出現該語言 pill。

## 1. 現況(已查證,file:line)

- C++ 來源:`cpp/graph_dijkstra.cpp`(72 行,`int main()`,V=5,adjacency list,7 條無向邊,min-heap Dijkstra + cout trace);由 `build_db.js`(`node build_db.js`)產生 `js/code_db.js`(generated,已提交;**不在** `pages:prepare` 內)。
- drawer 渲染:`renderMethodSections`(`js/app.js:574`),`codeDrawer:true`(graph-dijkstra 於 `:113`);code panel HTML `<pre class="code-panel-body"><code class="language-cpp">${getEscapedCode(id)}</code></pre>`(`:621-629`);drawer DOM inline(`:656-666`,`[data-testid="code-drawer"]`);toggle `.code-drawer-toggle`(`:642`);open/close(`:673-693`);highlight `Prism.highlightAllUnder(section)`(`:696`),之後包 `.code-line`(`:698-703`)。
- 取碼:`getEscapedCode(id)`(`:523`)→ `getCodeForMethod(id)`(`:273`;`codeByMethod['graph-dijkstra']=codeGraphDijkstra`,`:328`)。
- Prism:`index.html:11` css;`:400-402` 只載 `prism.min.js`、`prism-c.min.js`、`prism-cpp.min.js`;`vendor/prism/` 只有 c/cpp。**node_modules/prismjs/components/** 有 `prism-{python,rust,go,php}.min.js`(devDep prismjs ^1.30)。
- 語言切換可仿 slides `slideLangToggle`(`:720`,handler `:900-916`)。

## 2. 設計

### 2.1 來源儲存

- 新增 `src/python/graph_dijkstra.py`、`src/rust/graph_dijkstra.rs`、`src/go/graph_dijkstra.go`、`src/php/graph_dijkstra.php`,各為完整程式,**對齊 `cpp/graph_dijkstra.cpp`**:
  - 相同圖:V=5,無向邊 (0,1,4)(0,2,1)(1,2,2)(1,3,3)(2,3,1)(3,4,3)(2,4,5);source=0。
  - 相同演算法:min-priority-queue Dijkstra,visited 跳過,relaxation。
  - 相同輸出格式(逐字對齊,便於對照):`Dijkstra's Shortest Path from node 0:` / 分隔線 / `Processing node <u> (distance = <d>)` / `  Updated distance to node <v>: <dist>` / 空行 / `Final shortest distances from node 0:` / `Node <i>: <dist>` 或 `Node <i>: INF (unreachable)`。
  - 各語言慣用寫法(Python `heapq`;Rust `std::collections::BinaryHeap` + `Reverse`;Go `container/heap`;PHP `SplPriorityQueue` 或陣列 min-heap)。
- 命名:以 methodId 對應之 cpp base 名(`graph_dijkstra`)為各語言檔名 + 該語言副檔名。

### 2.2 Build → `js/code_multilang.js`

- 新增 `build_multilang.js`:掃 `src/<lang>/`(lang ∈ python|rust|go|php),依 method 對應表(`{ 'graph-dijkstra': 'graph_dijkstra' }`,可擴充)讀取存在的檔案,轉義(比照 build_db.js:143 的 backtick/`$`/`\`),輸出 `js/code_multilang.js`:
  ```js
  // Auto-generated multi-language code DB
  window.CODE_MULTILANG = { 'graph-dijkstra': { python: `...`, rust: `...`, go: `...`, php: `...` } };
  ```
  只放**非 C++** 語言(C++ 仍走既有 `getCodeForMethod`)。缺某語言就略過該鍵。
- `package.json`:加 `"build:multilang": "node build_multilang.js"`。`js/code_multilang.js` 為 generated、**提交**(比照 code_db.js 慣例;不強制進 pages:prepare)。
- `index.html`:在 `js/code_db.js`(`:407`)附近加載 `js/code_multilang.js`。

### 2.3 Prism 語言元件

- 複製 `node_modules/prismjs/components/prism-{python,rust,go,php}.min.js` 到 `vendor/prism/`;`index.html` 於 `:402` 後加對應 `<script>`。
- 切換時對該 `<code>` 重設 `className='language-<lang>'`、填新碼、`Prism.highlightElement(codeEl)`,再重建 `.code-line` gutter(比照 `:698-703`)。

### 2.4 Drawer 語言 pills(`js/app.js`)

- 在 drawer(或 code panel)header 內,**當 `window.CODE_MULTILANG[methodId]` 存在時**,渲染一列 pills:C++(預設 active)+ 該 method 有的語言。每顆 `data-lang`、`data-testid="srclang-<lang>"`。
- 狀態:預設 `cpp`;點擊某 pill → 取碼(cpp:`getCodeForMethod`;其他:`CODE_MULTILANG[methodId][lang]`)→ 更新 `<code>` class + textContent → `Prism.highlightElement` → 重建 gutter → 更新 filename(`graph_dijkstra.py`/`.rs`/`.go`/`.php`/`.cpp`)+ active pill。
- 無多語言的 method:不渲染 pills,現況不變。
- 預設每次開 drawer 為 C++(可選:記住上次選擇;預設不記,符合「default 仍是 C++」)。

### 2.5 CSS

- `.srclang-pills`(header 內一列)、`.srclang-pill`(+ `.active`),沿用既有 drawer/pill 樣式與主題 token;窄螢幕可換行。

## 3. 檔案清單

- 新增:`src/python/graph_dijkstra.py`、`src/rust/graph_dijkstra.rs`、`src/go/graph_dijkstra.go`、`src/php/graph_dijkstra.php`;`build_multilang.js`;`js/code_multilang.js`(generated);`vendor/prism/prism-{python,rust,go,php}.min.js`。
- 修改:`index.html`(prism scripts + code_multilang.js)、`js/app.js`(drawer pills + 切換)、`style.css`(pills 樣式)、`package.json`(build:multilang script)。
- 測試:`tests/`(Playwright)。
- 不動:`cpp/`、`js/code_db.js`、其他 method 的 drawer 行為、其他 viz。

## 4. 測試

- **Dijkstra 有 pills + 預設 C++**:開 graph-dijkstra drawer → `<code>` class `language-cpp`、含 C++ token(如 `priority_queue`);出現 `[data-testid="srclang-cpp"]`(active)與 python/rust/go/php pills。
- **切換**:點 Python → `<code>` class 變 `language-python`、含 `def`/`heapq`、filename `graph_dijkstra.py`;Rust → `language-rust` 含 `fn main`;Go → `language-go` 含 `func main`;PHP → `language-php` 含 `function`/`<?php`;切回 C++ → `language-cpp`。
- **其他 method 無 pills**:某 C++-only method(如 `sort-bubble` 的 drawer,或另一 codeDrawer method)→ 無 `[data-testid^="srclang-"]`。
- **highlight**:切換後該 `<code>` 有 Prism token(`.token`)子元素(確認對應語言元件已載入)。
- **build**:`node build_multilang.js` 產生的 `js/code_multilang.js` 含 `graph-dijkstra` 的 4 語言鍵;各源含關鍵 token。
- **輸出對齊(可行則驗)**:若環境有 python3,執行 `src/python/graph_dijkstra.py` 輸出與 C++ 參考逐行相同;rust/go/php 若無 runtime 則以結構/ token 對齊(實作者盡量執行驗證)。
- 回歸:`npm run test:all` 綠;既有 code-drawer 測試(如 `tests/tree_rb.spec.js`)不退化;Prism 既有 c/cpp 正常。

## 5. 驗收標準

- Dijkstra source drawer 預設顯示 C++,可切 Python/Rust/Go/PHP,各語言正確 highlight、內容為對齊 C++ 的完整程式、filename 隨語言更新。
- 其他 method 不受影響(無 pills,C++ 照舊)。
- 丟新檔到 `src/<lang>/` 並 rebuild 即可擴充(機制一般化)。
- `npm run test:all` 綠。

## 6. 風險與緩解

- **語言實作正確性**:四份需與 C++ 同圖同輸出;實作者盡量以各語言 runtime 執行比對(至少 python3),無 runtime 者確保語法有效 + 結構對齊;測試驗關鍵 token。
- **Prism 元件缺失**:未載對應元件會不 highlight;確認四個 component script 已加,測試驗 `.token` 出現。
- **generated 檔**:`js/code_multilang.js` 由 `build_multilang.js` 產生並提交;勿手改(改 `src/` 後 rebuild)。C++ 仍走 code_db,不動。
- **只影響 dijkstra**:pills 僅在 `CODE_MULTILANG[methodId]` 存在時渲染,其他 method drawer 位元組相同。
- **escape**:多行原始碼寫入 template literal 需轉義 backtick/`$`/`\`(比照 build_db.js)。
- **範圍**:純前端 + 新 build + 新來源;不動 cpp/code_db/演算法/其他 viz。
