# 隨機輸入產生器 + 難度設定 — 設計文件

- 日期:2026-06-10
- Repo:`/Users/skhuang/course/dsvisual`(分支 main;檔案於 cpp/ + js/)
- 動機:每個可編輯輸入的視覺化,在 Apply 前加一顆「🎲 隨機產生」鈕,依使用者選的**難度**產生新輸入並立即套用;為簡化各 viz 的輸入介面,難度選單集中放在 Settings,且**依類別(群組)記住**。

## 1. 範圍

對所有「可編輯整組輸入」的視覺化加 🎲 隨機鈕:

- **14 個 dynamic-host viz**:tree-traversal、huffman、expr-infix-postfix、tree-obst、sort-external、matrix-sparse、poly-padd、maze-stack、list-doubly、search-fibonacci、search-interpolation、tree-threaded、tree-mway、tree-expression。(tree-traversal 既有 `.tt-rand` 改接此系統。)
- **舊排序**(sort-bubble … sort-radix 等共用一個陣列):`#btn-sort-random` 改依難度產生。
- **舊搜尋**(search-binary / search-linear):加 🎲 依難度產生「排序陣列 + target」。

oop / patterns / 純互動結構(stack/queue/單獨 insert 的 list/heap/graph 編輯)不在範圍(無「整組輸入」概念)。

## 2. 難度語意

四級,通則如下;§5 逐 viz 定義具體產生。

| 難度 | 通則 |
|---|---|
| **一般 normal** | 典型小隨機輸入(預設) |
| **特殊 special** | 觸發該結構的特殊情形(排序/逆序、退化成鏈、同頻、均勻分佈、滿節點…) |
| **edge** | 邊界:空 / 單一 / 全重複 / 極值 / 無解 / 單 symbol |
| **大型 large** | 接近合理上限的元素數(壓力但仍可視覺化) |

## 3. 架構

### 3.1 純產生器模組 `js/random_input.js`(新增,雙重匯出,可單元測試)
```
randomInputFor(methodId, difficulty, rng = Math.random) -> inputObject
```
- 內含每個 methodId × 4 難度的產生邏輯;回傳該 viz render 所需的輸入物件(見 §4 的形狀)。
- 純函式(只用 `rng`、不碰 DOM),`module.exports` 供 `node --test`,`window.RandomInput` 供瀏覽器。
- 未知 methodId 回傳 `null`(呼叫端略過)。

### 3.2 難度設定(per-category,放 Settings)
- 儲存:`localStorage['dsvisual.inputDifficulty.' + groupId]`(groupId 來自 `getMethodGroupForMode(currentMode).id`),預設 `'normal'`。
- helpers(加在 `js/app.js` closure):
  - `getInputDifficulty()` → 讀目前 currentMode 所屬群組的難度(預設 'normal')。
  - `setInputDifficulty(groupId, value)` → 寫入(try/catch 包覆)。
- **Settings drawer** 新增一列「Input difficulty / 輸入難度」`<select>`(normal/special/edge/large)+ 一行小字標示「適用類別:<目前群組標題>」。
  - 開啟 Settings 或切換 method 時,把 select 值設為「目前群組」的難度。
  - change 時 `setInputDifficulty(currentGroupId, value)`。
- i18n:`settings.difficulty` 標籤 + 四個選項文字(en/zh)。

### 3.3 各 viz 接線(每個 dynamic-host render)
- 在 Apply/Build 鈕**之前**插入 `<button class="rand-btn" title="Random">🎲</button>`(共用 class `rand-btn`,CSS 一處)。
- onclick:`const inp = RandomInput.randomInputFor(currentMode, getInputDifficulty()); if (inp) { /* 依 inp 設定該 viz 的 _state 欄位 */ <renderFn>(); }`。即「產生並立即套用」。
- tree-traversal 既有 `.tt-rand` 改為呼叫此邏輯(移除原本 inline 隨機)。

### 3.4 舊排序 / 搜尋整合
- 排序:`generateSortArray()` 內改用 `RandomInput.randomInputFor('sort', getInputDifficulty())`(回傳 `{data}`),其餘流程不變;`#btn-sort-random` 行為依難度。
- 搜尋(binary/linear):在 `#search-actions` 加一顆 🎲(或重用既有控制),產生 `{arr,target}`(arr 排序),更新 `arrBinary`/`arrLinear` 與目標欄並重繪。

## 4. 各 viz 輸入物件形狀(`randomInputFor` 回傳 → render 套用)

| methodId | 回傳形狀 | render 套用到 |
|---|---|---|
| tree-traversal / tree-threaded | `{ vals:number[] }` | `_state.values`/`_threadedState.vals` |
| huffman | `{ text:string }` | `_hfState.text` |
| expr-infix-postfix | `{ text:string }`(中序式) | `_exprState.text` |
| tree-expression | `{ text:string }`(後序式) | `_exprTreeState.text` |
| tree-obst | `{ keys:number[], freqs:number[] }` | `_obstState` |
| sort-external | `{ data:number[], M:number }` | `_extState` |
| matrix-sparse | `{ text:string }`(`r,c;…`) | `_sparseState.text` |
| poly-padd | `{ a:string, b:string }`(`c:e,…`) | `_polyState` |
| maze-stack | `{ text:string }`(迷宮) | `_mazeState.text` |
| list-doubly | `{ vals:number[], circular:boolean }` | `_doublyState` |
| search-fibonacci / search-interpolation | `{ arr:number[](sorted), target:number }` | `_fibState`/`_interpState` |
| tree-mway | `{ keys:number[], m:number }` | `_mwayState` |
| sort(舊) | `{ data:number[] }` | sortArrData |
| search-binary/linear(舊) | `{ arr:number[](sorted), target:number }` | arrBinary/arrLinear |

## 5. 逐 viz × 難度產生語意(摘要;實作以此為準)

- **值序列類**(tree-traversal/threaded、sort-external.data、list-doubly、sort 舊):
  - normal:6–9 個 10–99 隨機整數(去重視需要)。
  - special:已排序 *或* 逆序序列(→ 退化鏈 / 已序資料)。
  - edge:長度 0 或 1,或全相同值。
  - large:18–24 個。
- **搜尋(fib/interp、舊搜尋)** `{arr,target}`:arr 為排序去重;
  - normal:8–12 個,target 取 arr 中一個(命中)。
  - special:interp 用均勻等差;target 取存在值。
  - edge:target 不存在(< min 或 > max 或間隙),或 arr 長度 1。
  - large:30–40 個。
- **huffman `{text}`**:normal 隨機字母字(8–14)；special 全相同字母(同頻)或兩字母；edge 單一字元;large 30–40 字。
- **expr-infix-postfix `{text}`(中序)/ tree-expression `{text}`(後序)**:normal 隨機合法式(3–4 運算子);special 全同優先級或深巢狀括號;edge 單一運算元;large 6–8 運算子。(數字運算元以利求值)
- **tree-obst `{keys,freqs}`**:keys 排序去重;normal 4–6 鍵隨機 freq;special 頻率極不均(單鍵獨大);edge 1 鍵;large 8–10 鍵。
- **matrix-sparse `{text}`**:normal 4×4~5×5 稀疏(數個非零);special 對角/單列非零;edge 全零或 1×1;large 8×8 稀疏。
- **poly-padd `{a,b}`**:normal 各 2–3 項;special 指數完全重疊(逐項相加)或完全不重疊;edge 單項 / 抵消為零;large 各 5–6 項。
- **maze-stack `{text}`**:normal 隨機可解迷宮;special 只有單一蜿蜒解;edge 無解迷宮 *或* 直線無牆;large 8×8~10×10。
- **tree-mway `{keys,m}`**:keys 隨機去重;normal m=3、6–8 鍵;special 已排序鍵(偏一邊);edge 1–2 鍵;large m=3、14–18 鍵。

(產生器以 `rng` 取隨機;邊界/特殊以「保證具該性質」方式產生,使單元測試能以性質斷言。)

## 6. 檔案清單
- 新增:`js/random_input.js`、`tests/unit/random_input.test.js`、`tests/random_input.spec.js`(E2E)
- 修改:`js/app.js`(`getInputDifficulty`/`setInputDifficulty` + Settings select 接線 + 各 render 加 🎲 鈕 + sort/search 整合)、`index.html`(Settings drawer 加難度列 + 載入 `js/random_input.js`)、`js/i18n.js`(`settings.difficulty` + 選項)、`style.css`(`.rand-btn` 樣式)
- 不需動 build_db / slides / code_db。

## 7. 分批交付
- **R1(基礎 + 一半 viz)**:`js/random_input.js`(全部 method 的 4 難度產生器)+ 單元測試;Settings 難度下拉(per-category)+ `getInputDifficulty`/`setInputDifficulty` + i18n + `.rand-btn` CSS;接線 trees + arrays 群組的 viz 的 🎲 鈕;E2E(難度持久化 per-category + 一個 viz 的 🎲)。
- **R2(其餘 + 舊整合)**:接線 linear/searching/sorting 其餘 dynamic viz + 舊排序 `generateSortArray` + 舊搜尋 🎲;E2E;收尾。

## 8. 測試
- **單元**(`tests/unit/random_input.test.js`):對每個 method 跑各難度多次,以**性質**斷言(不靠固定種子):
  - edge:size ≤ 1 或全相同 / 不存在 target / 無解(maze)等。
  - large:size ≥ 該類門檻。
  - special:具結構性質(已排序或逆序、同頻、均勻、重疊指數…)。
  - normal:size 在合理範圍、型別正確、(搜尋類)target 存在於 arr。
  - 回傳形狀符合 §4(欄位齊全、型別正確)。
- **E2E**(`tests/random_input.spec.js`):Settings 設難度 → 切到某 viz → 按 🎲 → 視覺化更新(輸入欄/結果改變);難度 per-category 持久化(設 trees 難度、切到 sorting 仍各自記得、reload 後保留)。
- 全套 `npm run test:all` 綠,含計數測試更新(若有)。

## 9. 驗收標準
- 14 dynamic viz + 舊排序/搜尋皆有可用的 🎲,按下產生符合目前難度的新輸入並立即重繪。
- Settings 難度下拉反映「目前類別」的設定,change 即存,切類別/重整後各類別各自記得。
- `random_input.js` 單元測試與 E2E 通過;主線測試全綠。

## 10. 風險與緩解
- **產生無效輸入致 render 出錯**:產生器保證回傳合法形狀(如搜尋 arr 已排序、maze 為合法格);render 既有的解析/防呆仍在。
- **難度設定與既有 code-density 設定共存**:沿用相同 localStorage + Settings drawer 模式,互不干擾。
- **per-category select 與 method 切換同步**:切 method 時更新 select 值(掛在既有 switchMode/Settings 開啟流程)。
- **舊 sleep 機制整合**:只改 `generateSortArray` 取數來源與搜尋加一顆鈕,不改動畫機制,降低風險。
- **大型輸入效能**:large 門檻設在仍可流暢逐步動畫的範圍(各類 ≤ ~40)。
