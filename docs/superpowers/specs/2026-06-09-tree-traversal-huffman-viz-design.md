# dsvisual 新增視覺化:二元樹走訪 + Huffman 編碼 — 設計文件

- 日期:2026-06-09
- Repo:`/Users/skhuang/course/dsvisual`(分支 main)
- 動機:ds2026 課程主線教到、但 dsvisual 尚無互動視覺化的兩個高價值缺口(Tier 1):二元樹走訪(Ch5)、Huffman 編碼(Ch9)。

## 1. 目標

在 dsvisual 新增兩個互動視覺化 method:

1. `tree-traversal` — 二元樹走訪:前序 / 中序 / 後序 / 層序(BFS),每序提供「遞迴」與「迭代」兩版本,逐步顯示走訪順序與輔助結構(顯式 stack / queue / 遞迴 call stack)。
2. `huffman` — Huffman 編碼:由文字輸入統計字頻,逐步以優先佇列合併最小兩子樹建出 Huffman 樹,最後產生前綴碼表與壓縮比。

兩者皆:Step/Run/Reset 逐步動畫、可編輯輸入、雙語(zh/en)、含 slides 講解 deck、含測試。

## 2. 非目標(YAGNI)

- 不重構 app.js 既有結構(僅加最小接線 + 兩支獨立模組檔)。
- 不改動其他既有 method 的行為。
- tree-traversal 不支援刪除節點 / 非 BST 任意建樹 UI(以「輸入值建 BST」+「隨機重建」+「預設範例」涵蓋)。
- huffman 不含自適應 Huffman、不含解碼互動(僅可選地展示「用建好的樹編碼輸入文字」)。

## 3. 整合方式

**模組化**:兩個視覺化的核心邏輯各放一支獨立檔(`tree_traversal_viz.js`、`huffman_viz.js`),沿用既有 `heap_models.js` 拆檔先例與 segment/fenwick tree 的 **dynamic viz host** 模式(`acquireDynamicVizHost()`):每個視覺化在 `#dynamic-viz-host` 內自建控制列、畫布與面板。`app.js` 只加「註冊 + dispatch」最小接線。理由:app.js 已 ~326KB,兩個視覺化各自複雜且 UI 不符既有通用控制面板;獨立檔聚焦、好維護、好測試,且核心 frame 產生器可抽成純函式做單元測試。

### 動畫模型

採既有 **frames + `buildStepControls(onStep, onReset, intervalMs)`** 逐步模式(app.js line 3445;segment tree line 3977–4106 為範本):

- 模組計算出完整 `frames[]`,每個 frame 是一個可重繪的快照。
- `buildStepControls` 產生 Step / Run / Reset 按鈕;Run 以 `setInterval` 連續前進。
- 每步以 phase/msg 面板(仿 segment tree 的 `phaseEl` / `msgEl`)顯示當前階段與解說。

## 4. 元件 1:`tree-traversal`(`tree_traversal_viz.js`)

### 資料模型
- 重用 app.js 既有 `TreeNode { val, left, right, id, parent }`(`id = 'tid-' + val`)。
- 建樹:使用者於輸入框輸入整數 → BST 插入(重用既有 `insertBST` 邏輯或模組內等價函式);輸入為空時載入預設範例樹;提供「隨機重建」(隨機 7–9 個值)。
- 模組持有自己的 root 變數(不污染全域 `bstRoot`,避免與 tree-bst 互相干擾)。

### 純函式(可單元測試)
```
buildTraversalFrames(root, order, mode) -> Frame[]
  order ∈ {'preorder','inorder','postorder','levelorder'}
  mode  ∈ {'recursive','iterative'}
Frame = {
  current: nodeId | null,        // 當前造訪/檢視的節點
  visited: number[],             // 到目前為止的輸出序列(值)
  aux: { kind: 'stack'|'queue'|'callstack', items: nodeLabel[] },
  msg: { zh: string, en: string }
}
```
- `levelorder` 僅有 `iterative`(queue);若 mode 傳 `recursive` + `levelorder`,以 iterative 處理並在 msg 註明。
- 不變式(測試用):
  - 前/中/後序的最終 `visited` 等於對該樹遞迴定義的標準順序。
  - 同一序的 `recursive` 與 `iterative` 最終 `visited` 相同。
  - 層序 `visited` 等於 BFS 順序。
  - 每個節點在最終序中恰出現一次,長度 = 節點數。

### 畫面(dynamic host 內)
1. 樹:重用 `computeTreeLayout(root, x, y, dx, meta)` 取得座標,於 host 內繪 `.tree-node` 與 SVG 邊;當前節點加 `.active`、已造訪加 `.visited`(新增 CSS)。
2. 走訪輸出列:依序顯示 `visited` 值。
3. 輔助結構面板:依 `aux.kind` 顯示顯式 stack(垂直)/ queue(水平)/ 遞迴 call stack。
4. phase/msg 解說列。
5. 控制列:序別下拉(前/中/後/層序)、版本下拉(遞迴/迭代)、輸入框 + Insert、隨機重建、Step / Run / Reset。切換序別或版本即重算 frames 並 reset。

## 5. 元件 2:`huffman`(`huffman_viz.js`)

### 資料模型 / 純函式
```
computeFrequencies(text) -> { sym: string, freq: number }[]
  // 逐字元統計;空白以可見標記 '␣' 呈現;穩定排序(freq 升冪,同頻按 sym)
buildHuffmanFrames(freqs) -> { frames: Frame[], codes: {sym: string} }
Frame = {
  forestRoots: nodeId[],                 // 當前森林各根
  pq: { sym: string, freq: number }[],   // 優先佇列(依 freq 升冪)當前內容
  picked: [nodeId, nodeId] | null,       // 本步取出的兩最小
  merged: nodeId | null,                 // 本步新建的合併節點
  phase: 'init' | 'pick' | 'merge' | 'done',
  msg: { zh: string, en: string }
}
```
- Huffman 節點:`{ id, freq, sym?, left, right }`(內部節點無 sym)。
- 不變式(測試用):
  - 每步合併後森林根數減 1;最終剩 1 根。
  - 全部頻率守恆(根頻 = 各 symbol 頻率總和)。
  - `codes` 為 prefix-free(無任一碼是另一碼的前綴)。
  - 加權路徑長(Σ freq×|code|)等於以每步取兩最小貪婪法所得的最小值。
  - 單一 symbol 的退化情形:給定長度 1 的碼(明確處理,避免空碼)。

### 畫面(dynamic host 內)
1. 優先佇列:依 freq 排序的子樹根卡片列;本步取出的兩張加 `.picked`。
2. 森林 / 逐步長成的樹:重用 `computeTreeLayout` 定位每棵子樹,多根水平排列(借 heap 多根森林佈局思路);新合併節點加 `.merged` 高亮。
3. 編碼表:symbol → bits、各 symbol 頻率、總位元數、相對固定長度編碼的壓縮比。
4. phase/msg 解說列。
5. 控制列:文字輸入框 + 套用、Step / Run / Reset。

## 6. 接線(app.js 最小改動)

1. `METHOD_GROUPS` 的 `trees` 群組 `methods` 陣列加兩筆:
   - `{ id: 'tree-traversal', title: 'Tree Traversal', file: 'tree_traversal.cpp', visualizer: 'tree', controls: 'tree' }`
   - `{ id: 'huffman', title: 'Huffman Coding', file: 'huffman.cpp', visualizer: 'tree', controls: 'tree' }`
2. `getCodeForMethod()` 加 `'tree-traversal': codeTreeTraversal`、`'huffman': codeHuffman`。
3. `updateLayout()`:`currentMode` 為這兩者時 → 設定 code 面板檔名/內容,並呼叫對應模組的 `mount(host)`(取得 dynamic viz host)。隱藏所有通用 container/actions(沿用既有第一段全部隱藏邏輯即可)。
4. `renderAll()`:dispatch 到模組的 render / 重新 mount。
5. `index.html`:在 `app.js` 之前以 `<script src="tree_traversal_viz.js">`、`<script src="huffman_viz.js">` 載入(模組以全域物件如 `window.TreeTraversalViz`、`window.HuffmanViz` 暴露 `mount` / `unmount` 與純函式,供 app.js 與測試呼叫)。

## 7. 資料 / 建置管線

- `tree_traversal.cpp`、`huffman.cpp`:置於 repo 根目錄,作為 code 面板的 C++ 參考實作。
- `build_db.js` 的 `mappings` 加:`'tree_traversal.cpp': 'codeTreeTraversal'`、`'huffman.cpp': 'codeHuffman'`;執行 `node build_db.js` 重生成 `code_db.js`。
- `i18n.js`:`en` 與 `zh` 各加 `'method.tree-traversal'`、`'method.huffman'`,以及新 UI 標籤(序別/版本下拉、Run/Step/Reset 若尚無共用鍵、編碼表標頭等)。
- `desc_db.js`:加兩筆 HTML 說明(含 complexity badge)。註:`descDB` 目前未被 app.js 引用(無 UI 效果),仍依慣例補上。
- `slides_db.js`:加兩個雙語 deck(`tree-traversal`、`huffman`),沿用既有 block 結構(paragraph/bullets/steps/table/code/note/math/mermaid,文字葉為 `{zh,en}`);執行 `npm run build:slides` 重生成 `slides_rendered.js` 及 `slides/zh|en/{tree-traversal,huffman}.md`。

## 8. style.css 新增

- `.tree-node.active`(當前節點高亮)、`.tree-node.visited`(已造訪)。
- 輔助結構面板:stack / queue cell 樣式。
- Huffman:`.pq-card`、`.pq-card.picked`、`.tree-node.merged`、編碼表樣式、森林容器。
- 沿用既有設計語言(顏色變數、圓角、過場 transition)。

## 9. 測試

- **單元測試**(`tests/unit/*.test.js`,`node --test`,仿 `heap_models.test.js`):
  - `tree_traversal_viz`:對固定樣本樹驗證四序 × 兩版本的最終 `visited` 順序;遞迴 vs 迭代一致;節點恰各一次。
  - `huffman_viz`:`computeFrequencies` 正確;`buildHuffmanFrames` 的森林根數遞減、頻率守恆、prefix-free、WPL 最優、單 symbol 退化。
  - 需求:模組純函式須能在 Node(無 DOM)環境載入(把純邏輯與 DOM 繪製分離;模組偵測 `typeof window` 或以 `module.exports` 同時導出純函式)。
- **Playwright E2E**(`tests/`,仿 `visualizer.spec.js`):
  - `tree-traversal`:導航 → 輸入數值建樹 → 選中序/迭代 → Step 數次 → 斷言輸出序列文字遞增出現、code 面板檔名 `tree_traversal.cpp`。
  - `huffman`:導航 → 輸入文字 → Run 到底 → 斷言編碼表出現且為 prefix-free 結構、code 面板檔名 `huffman.cpp`。

## 10. 檔案清單

- **新增**:`tree_traversal.cpp`、`huffman.cpp`、`tree_traversal_viz.js`、`huffman_viz.js`、`tests/unit/tree_traversal_viz.test.js`、`tests/unit/huffman_viz.test.js`、`tests/tree_traversal.spec.js`、`tests/huffman.spec.js`
- **修改**:`app.js`、`build_db.js`、`i18n.js`、`desc_db.js`、`slides_db.js`、`index.html`、`style.css`
- **重生成**:`code_db.js`、`slides_rendered.js`(+ `slides/zh|en/{tree-traversal,huffman}.md`)

## 11. 驗收標準

- 站台選單 trees 群組出現「Tree Traversal」「Huffman Coding」,中英切換顯示正確名稱。
- tree-traversal:可建樹、四序 × 遞迴/迭代皆能 Step/Run/Reset,輸出順序與輔助結構正確;切換序別/版本會重算。
- huffman:輸入文字可建 Huffman 樹,優先佇列與森林逐步更新,最終編碼表 prefix-free 且壓縮比正確。
- `node build_db.js` 後 `code_db.js` 含兩段新代碼;`npm run build:slides` 產出兩個 deck 的 zh/en md 與 rendered。
- `npm run test:all`(單元 + Playwright)通過,含新測試。
- code 面板顯示對應 `.cpp` 內容與檔名。

## 12. 風險與緩解

- **app.js 接線易錯**:把改動限縮為註冊 + dispatch + 載入 script,主邏輯在獨立模組;以 E2E 驗證導航與基本操作。
- **純函式須跨 Node/瀏覽器**:模組明確分離「純 frame 產生器」與「DOM 繪製」,純函式以 `module.exports` 導出供 `node --test`,瀏覽器端掛 `window.*`。
- **slides 雙語撰稿量大**:deck 內容聚焦核心(走訪三序 + 迭代;Huffman 建樹 + 編碼),避免過長。
- **dynamic host 與既有 viz 衝突**:切換 method 時呼叫模組 `unmount()` 清理 host 與 `setInterval`,沿用既有 host 釋放慣例。
