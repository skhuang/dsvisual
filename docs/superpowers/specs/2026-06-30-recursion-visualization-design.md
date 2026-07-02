# 遞迴程式執行視覺化 — 設計文件

- 日期:2026-06-30
- Repo:`/Users/skhuang/course/dsvisual`(main @ 4d71959)
- 動機:視覺化「遞迴呼叫」的執行過程——呼叫樹逐步展開、呼叫堆疊 push/pop、回傳值回填。以 5 個經典遞迴範例呈現不同的遞迴形態。

## 1. 範圍

單一新方法 `recursion`,置於**新群組 `recursion`**;以下拉選單切換 5 個範例:

| 範例 key | 輸入 | 上限 | 回傳 | 形態 |
|---|---|---|---|---|
| `fibonacci` | `{n}` | n ≤ 7 | 費式值 | 重疊子問題二元樹 |
| `reverse` | `{text}` | len ≤ 6 | 反轉字串 | 線性鏈 |
| `permutations` | `{text}` | len ≤ 4 | 全排列(n! 個) | 寬展開樹 |
| `binary-search` | `{arr, target}` | len ≤ 15 | 索引 / -1 | 對數深度鏈 |
| `quicksort` | `{arr}` | len ≤ 10 | 已排序陣列 | 分割遞迴樹 |

輸入上限確保呼叫樹在畫面內可視化。沿用既有 dsvisual 模式(純 `*_viz.js` + app.js render + 統一 Step/Run/Reset + 雙語 slides + 單元/E2E)。

## 2. 架構

### 2.1 純模組 `js/recursion_viz.js`(雙重匯出,可單元測試)
以「instrumented 遞迴 + 事件記錄器」統一產生 trace。

- `recursionTrace(example, input)` → `{ frames, nodes, result }`:
  - `nodes`:完整呼叫樹陣列/物件,每節點 `{ id, parentId, label, depth, value, returned }`(id 由 0 遞增,root 的 parentId 為 null)。
  - `frames`:逐步快照序列;每個 `{ event: 'call'|'return', id, stack }`,其中 `stack` 是當下活躍呼叫 id 由 root 到頂端的陣列。`call` 事件在進入時記錄(該 id 已 push);`return` 事件在回傳時記錄(此時 id 仍在 stack 頂端),記錄後才 pop。
  - `result`:整體回傳值。
- 記錄器 `makeRecorder()`:提供 `call(label, parentId, depth) → id`(建節點、push、記 call frame)與 `ret(id, value)`(填值、記 return frame、pop)。
- 5 個 instrumented 遞迴函式(fib/reverse/permute/bsearch/qsort)各自呼叫記錄器;label 格式如 `fib(5)`、`rev("abc")`、`perm("","abc")`、`bs(0,6)`、`qs(0..5)`。
- 純函式(不碰 DOM);`module.exports` 供 `node --test`,`window.RecursionViz` 供瀏覽器。
- `EXAMPLES`(key + 標題)與各範例預設輸入常數。

### 2.2 DOM render `renderRecursion()`(js/app.js 主 closure)
- `let _recState = null;`;預設 `{ example:'fibonacci', inputs:{ fibonacci:{n:5}, reverse:{text:'ABCDE'}, permutations:{text:'ABC'}, 'binary-search':{arr:[2,5,8,12,16,23,38,56,72,91], target:23}, quicksort:{arr:[5,3,8,1,9,2,7,4]} } }`。
- `const host = acquireDynamicVizHost();`。
- 控制列:`<select class="rec-example">`(5 選項)+ 依 example 顯示的輸入欄(fibonacci=數字 `.rec-n`;reverse/permutations=文字 `.rec-text`;binary-search=`.rec-arr`+`.rec-target`;quicksort=`.rec-arr`)+ `<button class="rec-build">Build</button>`。
- 呼叫 `RecursionViz.recursionTrace(example, inputs[example])` 取得 `{frames, nodes, result}`。
- 雙欄舞台:**左 `.rec-tree`** = 呼叫樹(自訂 n-ary 佈局,同 game-tree 的做法:依 leaf 順序定 x、depth 定 y;`.tree-node` 置中、SVG edge 畫在 (x,y) 不加偏移;stage `overflow:hidden`/可捲動)。**右 `.rec-stack`** = 呼叫堆疊(垂直清單,底→頂,頂端為目前呼叫)。
- `paint(idx)`:只顯示到 `frames[idx]` 為止已 `call` 的節點;對已 `return` 的節點回填 value;高亮 `frames[idx].id`(目前事件的節點),依 `event` 標示 call/return;右欄依 `frames[idx].stack` 列出堆疊。走完顯示 `result`。
- `step()` 回傳 `idx < frames.length - 1`;`reset()` idx=0;`host.appendChild(buildStepControls(step, reset, 700))`。
- `.rec-example` onchange:切 example → 重繪(帶出該 example 的輸入欄與預設)。`.rec-build` onclick(try/catch):讀輸入欄、依上限夾住(clamp)、寫入 `_recState.inputs[example]` → 重繪。
- 語言 `window.I18N.getCurrentLanguage()`。

### 2.3 接線(4 處,同既有 dynamic-host 模式)
1. `METHOD_GROUPS`:新增 `{ id:'recursion', title:'Recursion', methods:[{ id:'recursion', title:'Recursion (Call Tree & Stack)', file:'recursion.cpp', visualizer:'recursion', controls:'recursion' }] }`,放在 `memory` 群組之後、`oop` 之前。
2. `getCodeForMethod` `codeByMethod`:`'recursion': codeRecursion`。
3. `updateLayout`:`else if (currentMode === 'recursion') { codeTitle.textContent = 'recursion.cpp'; codeDisplay.textContent = codeRecursion; }`。
4. `renderAll`:`else if (currentMode === 'recursion') renderRecursion();`(精確 id,不與 substring catch-all 衝突)。

### 2.4 其他
- `cpp/recursion.cpp` + `build_db.js` mapping → `codeRecursion`(`node build_db.js`)。cpp 展示 5 個遞迴函式(fib/reverse/permute/bsearch/quicksort)。
- `slides_db.js` 加 `recursion` deck → `npm run build:slides`。
- `js/i18n.js`:`group.recursion`(en/zh)+ `method.recursion`(en/zh)。
- `index.html`:`<script src="js/recursion_viz.js">` 於 app.js 之前。

## 3. 檔案清單
- 新增:`js/recursion_viz.js`、`tests/unit/recursion.test.js`、`cpp/recursion.cpp`、`slides/{zh,en}/recursion.md`(build 產生)
- 修改:`js/app.js`、`index.html`、`js/i18n.js`、`slides_db.js`、`build_db.js`、`js/code_db.js`(build 產生)、`js/slides_rendered.js`(build 產生)、`tests/i18n.spec.js`、`tests/visualizer.spec.js`;新增 E2E(`tests/recursion.spec.js` 或併入既有)
- 不動:`js/cloud-config.js`

## 4. 計數更新(目前 tiles 99 / categories 12 / nav 13)
新增 1 method + 1 群組 →
- `tests/i18n.spec.js`:overview-tile 99 → **100**;overview-category 12 → **13**。
- `tests/visualizer.spec.js`:`.category-nav-btn` 13 → **14**(1 overview + 13 群組)。

## 5. 測試
- **單元**(`tests/unit/recursion.test.js`),每個範例:
  - 結果正確:`fibonacci` n=6 → 8、n=5 → 5;`reverse` "ABCDE" → "EDCBA";`permutations` "ABC" → 6 個且皆為合法排列(葉節點數 = n!);`binary-search` 命中回正確索引、未命中回 -1;`quicksort` 回 sorted。
  - trace 一致性:`frames` 非空;每個 `call` 都有對應 `return`(所有 nodes 最終 `returned === true`);root `parentId === null`;走完最後一個 frame 後堆疊概念上為空(最後一個 return 的 stack 長度為 1)。
- **E2E**(`tests/recursion.spec.js`):載入 `recursion`;斷言 `[data-method-section="recursion"][data-runtime-state="active"]`;左樹 `.rec-tree .tree-node` 可見、右堆疊 `.rec-stack` 可見;切換到 `quicksort` 範例、Build、按 Step 不出錯。
- 全套 `npm run test:all` 綠(含計數更新)。

## 6. 驗收標準
- `recursion` 方法可從 nav 載入;5 個範例皆可切換、Build、逐步執行,呼叫樹展開/回填、堆疊 push/pop 正確;走完顯示結果。
- 新 `recursion` 群組出現在 nav 與 overview;雙語 slides deck 存在。
- 單元 + E2E 全綠;計數更新為 100/13/14;`js/cloud-config.js` 未動。

## 7. 風險與緩解
- **大樹溢出**:各範例輸入設上限(fib≤7、perm≤4、qsort≤10 等);樹 stage `overflow` 可捲動 + 既有縮放控制。
- **trace 正確性**:單元測試以「結果值 == 直接計算」+「所有節點皆 returned」把關(instrumented 版本與純版本一致)。
- **n-ary 佈局**:`computeTreeLayout` 僅支援二元(left/right),故用自訂 n-ary 佈局(同 game-tree 已驗證做法)。
- **節點/邊對齊**:沿用既有規則(`.tree-node` translate(-50%,-50%);edge 畫在 (x,y);highlight class 保留 transform)。
- **輸入解析**:Build 以 try/catch 包覆,無效輸入不重繪、不丟例外。
