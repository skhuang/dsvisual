# Linked-List (正交鏈結) 稀疏矩陣視覺化 — 設計文件

- 日期:2026-06-30
- Repo:`/Users/skhuang/course/dsvisual`(main @ f7123b4)
- 動機:以**正交循環鏈結串列(orthogonal / multi-linked list)**表示稀疏矩陣(Horowitz 表示法),並示範建構與轉置。與既有的 `matrix-sparse`(三元組陣列 + 轉置)互補:同問題、不同表示。

## 1. 範圍

`arrays` 群組新增單一方法 `matrix-sparse-list`(緊鄰 `matrix-sparse`,**不新增群組**)。沿用既有 dsvisual 模式(純 `*_viz.js` + app.js render + 統一 Step/Run/Reset + 雙語 slides + 單元/E2E),並接入既有難度隨機輸入(`random_input` + 🎲)。

輸入上限:矩陣 ≤ 6×6(確保節點與 right/down 箭頭在畫面內可視化)。

## 2. 資料結構

正交鏈結稀疏矩陣:
- 每個**非零元素**一個節點 `{ id, row, col, val }`,概念上有 `right`(同列下一個)與 `down`(同行下一個)指標。
- 每一**列(row)**與每一**行(col)**各一個表頭節點;同列非零節點以 `right` 依 col 遞增串成循環鏈(尾端回表頭),同行以 `down` 依 row 遞增串成循環鏈。
- 轉置:交換每個節點的 (row, col) 並重建行/列鏈,等價於對 gridᵀ 重新建構。

## 3. 架構

### 3.1 純模組 `js/matrix_sparse_list_viz.js`(雙重匯出,可單元測試)
- `parse(text)` → `grid`(2D number 陣列):沿用 matrix-sparse 格式,列以 `;` 分隔、格以 `,` 分隔;非數字視為 0;夾到 ≤ 6×6。
- `build(grid)` → `built`:
  ```
  { rows, cols,
    nodes: [{ id, row, col, val }, ...],           // 非零,row-major 順序,id 由 0 遞增
    rowChains: [[nodeId,...], ...],                 // 長度 rows;每列的 nodeId 依 col 遞增
    colChains: [[nodeId,...], ...] }                // 長度 cols;每行的 nodeId 依 row 遞增
  ```
- `buildFrames(grid)` → `{ frames, built }`:frames 為逐個非零元素(row-major)插入的快照;每個 `{ type:'insert', nodeId, row, col, val, nodes:<至此已插入的節點淺拷貝>, rowChains, colChains }`;最後 `{ type:'done', ... }`。
- `transpose(built)` → 對 gridᵀ 的 `build` 結果(即 `build(transposeGrid(grid))`);另提供 `transposeGrid(grid)`。
- 純函式(不碰 DOM);`module.exports` 供 `node --test`,`window.MatrixSparseListViz` 供瀏覽器。
- `DEFAULT`:`'0,0,3,0;5,0,0,0;0,2,0,4'`(3×4,與 matrix-sparse 預設一致,便於對照)。

### 3.2 render `renderMatrixSparseList()`(js/app.js 主 closure)
- `let _mslState = null;`;預設 `{ text: MatrixSparseListViz.DEFAULT, phase: 'build' }`。
- `const host = acquireDynamicVizHost(); host.style.width = '100%';`(沿用 recursion 修復後的 host 撐滿做法)。
- 控制列:`<input class="msl-input">`(矩陣文字)+ `<button class="msl-build">Build</button>` + `<button class="rand-btn">🎲</button>` + 一個「Build ↔ Transpose」切換(`.msl-phase-btn`)。
- 舞台 `.msl-stage`(position:relative;overflow:auto):**上方列一排 col 表頭**、**左側一欄 row 表頭**、非零節點置於對應格點(`.msl-node` 顯示 val,dataset row/col);SVG 畫 `right`(同列往右到下一節點/循環回列表頭)與 `down`(同行往下)箭頭。
- `buildFrames` 驅動:build 階段逐步顯示已插入節點與剛接上的 right/down 連結(高亮 `frames[idx].nodeId`);切到 transpose 階段時,以 `transpose(built)` 顯示轉置後結構(可與原結構對照;左原、右轉置,或以 phase 切換整個 stage)。
- `paint()`/`step()`(回傳 `idx < frames.length - 1`)/`reset()`;`host.appendChild(buildStepControls(step, reset, 700))`。
- `.msl-build` onclick(try/catch):`parse` → 夾 ≤6×6 → `_mslState.text` → 重繪。`.rand-btn`:`RandomInput.randomInputFor('matrix-sparse-list', getInputDifficulty())` → 設 text → 重繪。`.msl-phase-btn`:切換 `_mslState.phase` 於 `'build'`/`'transpose'` → 重繪(轉置階段用轉置後的 frames/結構)。
- 語言 `window.I18N.getCurrentLanguage()`。

### 3.3 接線(4 處,同既有 dynamic-host 模式)
1. `METHOD_GROUPS`:`arrays` 群組於 `matrix-sparse` 之後加 `{ id:'matrix-sparse-list', title:'Sparse Matrix (Linked List)', file:'matrix_sparse_list.cpp', visualizer:'msl', controls:'msl' }`。
2. `getCodeForMethod` `codeByMethod`:`'matrix-sparse-list': codeMatrixSparseList`。
3. `updateLayout`:`else if (currentMode === 'matrix-sparse-list') { codeTitle.textContent = 'matrix_sparse_list.cpp'; codeDisplay.textContent = codeMatrixSparseList; }`。
4. `renderAll`:`else if (currentMode === 'matrix-sparse-list') renderMatrixSparseList();`(精確 id;放在任何泛用 substring catch-all 之前——`matrix-sparse-list` 含子字串 `matrix-sparse`,務必置於既有 `currentMode === 'matrix-sparse'` 分支「之前」以免被吃)。

### 3.4 其他
- `cpp/matrix_sparse_list.cpp` + `build_db.js` mapping → `codeMatrixSparseList`(`node build_db.js`;build_db 現有缺檔守衛,故 mapping 與檔案需一起加)。
- `slides_db.js` 加 `matrix-sparse-list` deck → `npm run build:slides`。
- `js/i18n.js`:`method.matrix-sparse-list`(en/zh)。**無新群組**,不需 `group.*`。
- `index.html`:`<script src="js/matrix_sparse_list_viz.js" defer>` 於 app.js 之前(依現有 viz script 慣例含 `defer`)。
- `js/random_input.js`:`randomInputFor` 加 `matrix-sparse-list` 分支,回傳 `{ text }`(重用矩陣產生邏輯;難度:normal 4×4~5×5 數個非零;special 對角;edge 全零或 1×1;large 6×6),與既有 `.rand-btn` CSS 共用。

## 4. 檔案清單
- 新增:`js/matrix_sparse_list_viz.js`、`tests/unit/matrix_sparse_list.test.js`、`cpp/matrix_sparse_list.cpp`、`slides/{zh,en}/matrix-sparse-list.md`(build 產生)、E2E `tests/matrix_sparse_list.spec.js`
- 修改:`js/app.js`、`index.html`、`js/i18n.js`、`slides_db.js`、`build_db.js`、`js/code_db.js`(build 產生)、`js/slides_rendered.js`(build 產生)、`js/random_input.js`、`style.css`、`tests/i18n.spec.js`
- 不動:`js/cloud-config.js`

## 5. 計數更新(目前 tiles 111 / categories 14 / nav 15)
新增 1 method 到既有 `arrays` 群組 →
- `tests/i18n.spec.js`:overview-tile 111 → **112**。
- overview-category 維持 **14**;`tests/visualizer.spec.js` `.category-nav-btn` 維持 **15**。

## 6. 測試
- **單元**(`tests/unit/matrix_sparse_list.test.js`):
  - `parse` 正確解析、非數字→0、夾到 ≤6×6。
  - `build`:`nodes` 恰為所有非零(row-major、id 遞增);`rowChains[r]` 為第 r 列非零 nodeId 依 col 遞增;`colChains[c]` 為第 c 行非零 nodeId 依 row 遞增;`rows`/`cols` 正確。
  - `transposeGrid(grid)` == gridᵀ;`transpose(build(grid))` 的 nodes 為原 nodes 交換 (row,col) 後、對 gridᵀ 重建(值相同、位置轉置),且其 grid 重構 == gridᵀ。
  - `buildFrames`:frames 數 = 非零數 + 1(done);逐步累積、最後 built 與 `build` 相同。
  - edge:全零(nodes 空、frames 至少 done)、1×1。
- **E2E**(`tests/matrix_sparse_list.spec.js`):載入 `matrix-sparse-list`;斷言 active;`.msl-stage` 與至少一個 `.msl-node` 可見;Build → Step 前進;切「Transpose」對照;🎲 改變輸入。
- 全套 `npm run test:all` 綠(含計數更新)。

## 7. 驗收標準
- `matrix-sparse-list` 可從 nav(arrays 群組)載入;輸入矩陣可 Build;逐步建構正交鏈結(節點 + right/col 循環鏈 + 行/列表頭);可切換顯示轉置結構對照;Step/Run/Reset 正常。
- 🎲 依難度產生輸入;雙語 slides deck 存在。
- 單元 + E2E 全綠;overview-tile 更新為 112;`js/cloud-config.js` 未動。

## 8. 風險與緩解
- **renderAll 被 `matrix-sparse` catch-all 吃掉**:`matrix-sparse-list` 含子字串 `matrix-sparse`;確認 renderAll 與 updateLayout 用**精確 `===` 比對**,且 `matrix-sparse-list` 分支置於 `matrix-sparse` 分支之前(既有分支用 `===`,故只要新分支在前即安全)。單元/E2E 各驗證兩者互不誤觸。
- **鏈結/箭頭在大矩陣溢出**:≤6×6 上限 + host 撐滿 + stage `overflow:auto`。
- **正交鏈視覺複雜**:build 逐步高亮單一節點與其兩條連結,降低一次資訊量;循環回表頭的連結以較淡樣式表示。
- **正確性**:單元測試以「鏈排序性質 + transpose == gridᵀ」把關。
- **build_db 缺檔守衛**:新增 mapping 時務必同時新增 `cpp/matrix_sparse_list.cpp`,否則 `node build_db.js` 會(如設計般)報錯。
- **輸入解析**:Build 以 try/catch 包覆,無效輸入不重繪、不丟例外。
