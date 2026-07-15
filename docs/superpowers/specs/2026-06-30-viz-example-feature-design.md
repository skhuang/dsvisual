# 視覺化「範例(Example)」功能 — 通用化設計文件

- 日期:2026-06-30
- Repo:`/Users/skhuang/course/dsvisual`(main @ 2f01be5)
- 動機:`matrix-sparse`(array 版)有「Examples…」下拉——列出「預設 + 使用者存過的輸入」,按 Apply 時有效輸入自動存進 localStorage,下次可從下拉重新載入。將此功能**通用化為可重用 helper**,套到新做的 `matrix-sparse-list` 與 `list-equivalence`,並訂為往後所有「有可編輯輸入」視覺化的慣例。

## 1. 範圍

- 新增可重用的**範例儲存**機制:純模組 `js/examples_store.js` + `js/app.js` 內的通用 wrapper 與 `buildExamplesSelect()`。
- 接到 **`matrix-sparse-list`** 與 **`list-equivalence`**(Apply/Build 時自動存;下拉還原)。
- 新增**慣例文件** `docs/conventions/example-feature.md`,規定新 viz 有可編輯輸入即加此功能。
- **不動** `matrix-sparse`(保留其既有實作與既有 localStorage key,避免遺失已存範例)。**不回填**其他現有 viz。
- 不新增方法/群組 → **計數不變**(tiles 112 / categories 14 / nav 15)。

## 2. 現況(參考,已查證)
`matrix-sparse` 的實作(js/app.js ~5584+):`SPARSE_EXAMPLES_KEY = 'dsvisual:sparse:examples'`;`loadSparseExamples()` 讀 JSON 陣列 `[{text}]` 並過濾;`saveSparseExample(text)` 跳過預設、去重、`unshift`、`slice(0,8)`、寫入;控制列 `<select class="sm-examples">`(「範例…」+「預設」+ 已存,截斷標籤);Apply 有效輸入 → `saveSparseExample` + render;下拉 onchange → 載入該 text + render。本設計把此邏輯抽為通用、per-methodId 版本(不改動 matrix-sparse 本身)。

## 3. 架構

### 3.1 純模組 `js/examples_store.js`(雙重匯出,可單元測試)
- `key(methodId)` → `'dsvisual:examples:' + methodId`。
- `load(storage, methodId)` → `Array<{text:string}>`:讀 `storage.getItem(key)`,JSON.parse;僅保留 `{text:string}` 物件;錯誤/空 → `[]`;全程 try/catch。
- `save(storage, methodId, text, defaultText, cap)`:`cap` 預設 8;若 `text` 為空字串或 `=== defaultText` 則不存(return);否則 `arr = load(...).filter(e => e.text !== text)`;`arr.unshift({text})`;`arr = arr.slice(0, cap)`;`storage.setItem(key, JSON.stringify(arr))`;try/catch 忽略錯誤。
- `storage` 參數為具 `getItem`/`setItem` 的物件(app.js 傳 `localStorage`;測試傳 fake),便於單元測試。
- 純函式、不碰 DOM;`module.exports` 供 `node --test`,`window.ExamplesStore` 供瀏覽器。

### 3.2 `js/app.js` 通用 wrapper + UI helper(加在主 closure)
- `function loadExamples(methodId) { try { return ExamplesStore.load(localStorage, methodId); } catch (e) { return []; } }`
- `function saveExample(methodId, text, defaultText) { try { ExamplesStore.save(localStorage, methodId, text, defaultText); } catch (e) {} }`
- `function buildExamplesSelect(methodId, defaultText, currentText)` → 回傳 HTML 字串:
  ```
  <select class="ex-select" data-method="<methodId>">
    <option value="">範例… / Examples…</option>
    <option value="<esc(defaultText)>">預設 / Default</option>
    (loadExamples(methodId) 每筆) <option value="<esc(text)>"><trunc(text)></option>
  </select>
  ```
  用既有 `langOf`(雙語)、`esc`(屬性跳脫)、`trunc`(標籤截斷)helper(matrix-sparse 已用);與 `matrix-sparse` 的 `.sm-examples` 行為一致但類名為通用 `.ex-select`。
- `.ex-select` CSS 加到 style.css(可沿用/對齊 `.sm-examples` 樣式)。
- `index.html`:`<script src="js/examples_store.js" defer>` 於 app.js 之前。

### 3.3 接線 `matrix-sparse-list`(render `renderMatrixSparseList`)
- 控制列插入 `buildExamplesSelect('matrix-sparse-list', MatrixSparseListViz.DEFAULT, _mslState.text)`(放在輸入欄旁,Apply/🎲 附近)。
- `.msl-build` onclick(現有 try/catch 內):套用後 `saveExample('matrix-sparse-list', _mslState.text, MatrixSparseListViz.DEFAULT)`。
- `.ex-select` onchange:`const v = ev.target.value; if (!v) return; _mslState.text = v; renderMatrixSparseList();`(下拉值即矩陣文字)。

### 3.4 接線 `list-equivalence`(render `renderListEquivalence`)
- 輸入為 n + pairs 兩欄 → 例子以單一字串序列化:`serialize({n, pairs}) = n + '|' + pairs.map(p => p[0]+'='+p[1]).join(',')`;`deserialize(str)`:split 第一個 `|` → n(int)、pairs 段(交給 `ListEquivalenceViz.parseInput(nStr, pairsStr)`)。
- 控制列插入 `buildExamplesSelect('list-equivalence', serialize(DEFAULT), serialize(current))`。
- `.eq-build` onclick(現有 try/catch 內):套用後 `saveExample('list-equivalence', serialize(_equivState), serialize(DEFAULT))`。
- `.ex-select` onchange:`deserialize(v)` → 設 `_equivState = { n, pairs }`(夾 n≤12、pairs≤20)→ 重繪。
- DEFAULT 的序列化字串以 `ListEquivalenceViz.DEFAULT`(`{n, pairs}`)產生。

### 3.5 慣例文件 `docs/conventions/example-feature.md`
簡短規範:凡新增有「可編輯整組輸入」的視覺化,一律加 Examples 功能——
1. 控制列以 `buildExamplesSelect(methodId, defaultText, currentText)` 放一個 `.ex-select`;
2. Apply/Build 有效輸入後呼叫 `saveExample(methodId, text, defaultText)`;
3. `.ex-select` onchange:載入選取值(必要時 deserialize)→ 設 state → 重繪。
含 matrix-sparse-list / list-equivalence 兩個參考範例(其中 list-equivalence 示範多欄輸入的序列化)。並在 `README.md`「開發/慣例」處(若有)加一行指向本文件。

## 4. 檔案清單
- 新增:`js/examples_store.js`、`tests/unit/examples_store.test.js`、`docs/conventions/example-feature.md`、E2E `tests/viz_examples.spec.js`
- 修改:`js/app.js`(通用 wrapper + `buildExamplesSelect` + 兩個 render 接線)、`index.html`、`style.css`、`README.md`(慣例連結,若適用)
- 不動:`js/cloud-config.js`、`matrix-sparse` 相關程式、其他 viz、計數測試

## 5. 測試
- **單元**(`tests/unit/examples_store.test.js`,用 fake storage `{data:{}, getItem, setItem}`):
  - `key(id)` == `'dsvisual:examples:' + id`。
  - `save` 後 `load` 取回該筆;`save` 同字串兩次 → 只留一筆(去重、最新在前)。
  - 存 > 8 筆 → `load` 長度為 8(上限)、最新在前。
  - `text === defaultText` 或空字串 → 不存(load 不含)。
  - `load` 過濾非物件/缺 text 的髒資料;storage 拋錯 → `load` 回 `[]`、`save` 不丟例外。
- **E2E**(`tests/viz_examples.spec.js`,用共用 `loadMethod`):
  - matrix-sparse-list:載入 → 於 `.msl-input` 輸入一個特殊矩陣 → Build → `.ex-select` 出現含該值的 option → 改輸入為別的 → 選回該 option → `.msl-input` 還原為特殊矩陣。
  - list-equivalence:載入 → 設 n + pairs 一組特殊值 → Build → `.ex-select` 多一個 option → 選回 → n/pairs 欄還原。
  - (Playwright 每個測試 context 獨立,localStorage 不互相污染。)
- 全套 `npm run test:all` 綠;計數不變。

## 6. 驗收標準
- `matrix-sparse-list` 與 `list-equivalence` 皆有「Examples…」下拉;Apply/Build 有效輸入後該輸入被存入 localStorage 並出現在下拉;選取下拉項可還原並套用該輸入。
- `matrix-sparse` 行為不變。
- 通用 helper(`ExamplesStore` + `buildExamplesSelect`/`saveExample`/`loadExamples`)可供未來 viz 重用;慣例文件已建立。
- 單元 + E2E 全綠;`js/cloud-config.js` 未動;計數不變。

## 7. 風險與緩解
- **list-equivalence 多欄序列化**:以 `n|pairs` 單字串序列化/反序列化(`|` 不會出現在 n 或 pairs `i=j,` 格式中),還原時重用 `parseInput` 驗證與夾限。
- **與既有 `.sm-examples` 混淆**:通用類名用 `.ex-select`,與 matrix-sparse 的 `.sm-examples` 並存不衝突;matrix-sparse 不動。
- **localStorage 不可用/隱私模式**:load/save 全 try/catch,失敗回空/靜默,不影響 viz 運作。
- **跳脫/XSS**:option value 與標籤以既有 `esc`/`trunc` 處理(同 matrix-sparse);輸入內容僅矩陣/等價對文字。
- **測試污染**:單元用 fake storage;E2E 靠 Playwright 每測試獨立 context。
