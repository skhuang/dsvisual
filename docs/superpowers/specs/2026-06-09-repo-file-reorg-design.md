# dsvisual 倉庫檔案重組(cpp/ + js/)— 設計文件

- 日期:2026-06-09
- Repo:`/Users/skhuang/course/dsvisual`(分支 main)
- 動機:repo 根目錄散落 87 個 `.cpp` + 24 個 `.js`,外加約 10 個被 git 追蹤的編譯 binary,難以瀏覽。將原始碼歸入 `cpp/` 與 `js/` 兩個資料夾,並清除編譯產物。

## 1. 範圍與目標

- 將 87 個演算法 `.cpp` 移入 `cpp/`。
- 將所有瀏覽器載入 / 模組 JS(16 個)移入 `js/`。
- 移除被 git 追蹤的編譯 binary,並補上 `.gitignore`。
- 同步更新所有引用路徑,使 build、測試、GitHub Pages 全部照常運作。
- 中度力度;**不**改任何程式邏輯、**不**改演算法或視覺化行為。

### 非目標(YAGNI)
- 不把 build 腳本搬進 `scripts/`(留根目錄,降低 churn)。
- 不再細分 `js/viz`、`js/cloud` 子目錄(中度即可)。
- 不改 `slides/`、`docs/`、`tests/`、`vendor/`、`scripts/` 既有目錄。
- 不改任何 `.cpp`/`.js` 的內容邏輯(僅移動 + 更新路徑引用)。

## 2. 目錄結構與檔案對照

### `cpp/`(新增)← 全部 87 個 `.cpp`
僅由 `build_db.js` 讀取以產生 `code_db.js` 的字串(瀏覽器不直接載入)。

### `js/`(新增)← 16 個瀏覽器載入 / 模組 JS
- 核心:`app.js`、`i18n.js`、`heap_models.js`、`slide-markdown.js`、`private-decks.js`
- cloud:`cloud-config.js`、`cloud-drawer.js`、`cloud-integration.js`
- 視覺化模組(8):`tree_traversal_viz.js`、`huffman_viz.js`、`graph_aoe_viz.js`、`expr_infix_postfix_viz.js`、`tree_obst_viz.js`、`sort_external_viz.js`、`matrix_sparse_viz.js`、`poly_padd_viz.js`
- 產生式(瀏覽器載入):`code_db.js`、`desc_db.js`、`slides_rendered.js`

### 留在根目錄(不動)
`index.html`(Pages 入口)、`package.json`、`playwright.config.js`、`build_db.js`、`build_slides.js`、`format_code.js`、`slides_db.js`(build 資料源,Node `require`)、`README.md`、`.env.example`、`.clang-format`、`puppeteer-config.json`、`Plan.md` 等設定/文件。

### 移除(編譯 binary)
被 git 追蹤的:`search_binary`、`search_linear`、`list_array_test`、`list_linked_test`、`sort_bubble_test`、`sort_insert_test`、`sort_merge_test`、`sort_quick_test`、`sort_select_test`、`sort_shell_test`(以及 `.gitignore` 已列但若仍存在的 `stack_array`、`stack_linkedlist`、`queue_test`、`graph_test`、`tree_test`)。以 `git rm --cached`(或 `git rm`)移除並補 `.gitignore`。

## 3. 需更新的引用(消費者)

1. **`build_db.js`**
   - 讀取 `.cpp`:每個 mapping 的檔名讀取路徑改為 `cpp/<filename>`(實作上於讀檔處 `path.join('cpp', file)` 或在 mapping 前綴;以最小改動為準——見下「實作備註」)。
   - 輸出:`code_db.js` 寫到 `js/code_db.js`。
2. **`build_slides.js`**
   - 輸出:`slides_rendered.js` 寫到 `js/slides_rendered.js`。
   - `require('./slides_db.js')` 不變(slides_db 留根目錄);`slides/zh|en/*.md` 輸出不變。
3. **`index.html`**
   - 所有指向已移動 JS 的 `<script src="...">` 改為 `js/...`(`code_db.js`、`desc_db.js`、`slides_rendered.js`、`heap_models.js`、`i18n.js`、`cloud-*.js`、`slide-markdown.js`、`private-decks.js`、8 個 `*_viz.js`、`app.js`)。vendor / firebase CDN 不變。
4. **`tests/unit/*.test.js`**
   - `require('../../<module>')` 改為 `require('../../js/<module>')`,涉及:`heap_models`、`i18n`、`slide-markdown`、`cloud-integration`、`private-decks`、以及 8 個 `*_viz`(若其單元測試存在)。
   - 維持不變:`build_slides`、`format_code`(這兩個 .js 留根目錄)。
5. **`.gitignore`**:新增編譯 binary 規則(明確檔名 + `*_test`)。

### 實作備註(build_db.js cpp 路徑)
`build_db.js` 目前以裸檔名 `readFileSync(file)`(相對 cwd=repo 根)讀取。最小改動:在讀檔處改成讀 `path.join(__dirname, 'cpp', file)`(mapping 的 key 仍是裸檔名,作為 code 變數命名來源)。`code_db.js` 為純字串輸出,瀏覽器端不受 .cpp 位置影響。

## 4. 做法

- 一律用 `git mv` 保留檔案歷史。
- 分三階段,每階段後立即驗證:
  1. **cpp/**:`git mv *.cpp cpp/` → 更新 `build_db.js` 讀取路徑 → `node build_db.js` 重生 `code_db.js`(此時仍在根)→ 確認無錯。
  2. **js/**:`git mv` 16 個 .js 入 `js/` → 更新 `build_db.js`/`build_slides.js` 輸出路徑、`index.html` script src、`tests/unit` require → 重生 `js/code_db.js`、`js/slides_rendered.js`。
  3. **binary 清除**:`git rm` 被追蹤 binary + `.gitignore`。
- 每階段跑相關測試;全部完成後跑 `npm run test:all`。

## 5. 驗收標準

- 根目錄不再有散落的 `.cpp`(全在 `cpp/`)與應用 `.js`(全在 `js/`);僅留 build 腳本、`slides_db.js`、`index.html`、設定檔。
- 無被 git 追蹤的編譯 binary;`.gitignore` 涵蓋之。
- `node build_db.js` 產生 `js/code_db.js`;`npm run build:slides` 產生 `js/slides_rendered.js` 與 `slides/zh|en/*.md`,且 `git status` 無預期外 diff(內容不變,僅位置)。
- `npm run test:all` 全綠(單元 require 新路徑 + Playwright 由 `index.html` 載入 `js/*` 成功)。
- GitHub Pages:`index.html` 以相對路徑載入 `js/*`,部署後正常(`npm run pages:prepare` 流程不變)。

## 6. 風險與緩解

- **漏改某個路徑引用** → 測試會抓:Playwright E2E 由 `index.html` 實際載入所有 `js/*`,任何 404/未定義全域會使視覺化測試失敗;`node --test` 抓 require 路徑錯誤。分階段執行縮小定位範圍。
- **build 產物路徑** → 明確將 `code_db.js`/`slides_rendered.js` 輸出改到 `js/`,並在驗收以 `git status` 確認 clean rebuild。
- **GitHub Pages 相對路徑** → 所有 `js/*` 以相對於 `index.html` 的相對路徑載入,Pages 與 `file://` 皆適用(E2E 用 `file://` 驗證即涵蓋)。
- **歷史遺失** → 一律 `git mv`,保留 blame/history。
- **`format_code.js` 是否被 build_db 引用** → 若 `build_db.js require('./format_code')`,因兩者皆留根目錄,引用不變(實作時確認)。
