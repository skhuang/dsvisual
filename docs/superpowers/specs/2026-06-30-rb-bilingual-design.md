# Red-Black Tree 視覺化雙語化 — 設計文件

- 日期:2026-06-30
- Repo:`/Users/skhuang/course/dsvisual`(main @ 4f5e6ba)
- 動機:`tree-rb`(紅黑樹旋轉觀測站)的介面文字與步驟紀錄目前**硬編繁體中文**,未走 app 的 `langOf`/I18N 雙語框架(#116 審查已記此缺)。將 UI 文字與逐步說明改為**隨語言切換(zh/en)**,英文須技術正確(CLRS 術語)。

## 1. 範圍

雙語化 `tree-rb` 的:
- **`js/tree_rb_viz.js`**:`_emit(type, title, detail, nodes)` 產生的所有 `title`/`detail`(insert/delete 各 case、左右旋、Case 1/2/3、Delete Case 1–4、根塗黑、不用修復…)改為 `{zh, en}` 物件;6 個預設情境的名稱/說明改 `{zh, en}`。
- **`renderTreeRB`(js/app.js)**:按鈕(插入/刪除)、輸入 `placeholder`(鍵值)、hint、狀態訊息、`runOp` 的操作標籤(插入 N / 刪除 N)、預設選單標籤、程式碼 drawer 切換鈕等,全部改 `langOf({zh,en})`;步驟紀錄顯示改 `langOf(step.title)` / `langOf(step.detail)`。
- **語言切換即時生效**:切換語言時 tree-rb 重繪為新語言。

不改:RB 演算法/核心邏輯、`step.type`、節點標籤 `_lbl`(語言中立)、slides(已雙語)、其他 viz、計數(不新增方法)。

## 2. 現況(已查證)
- `_emit` 於 `tree_rb_viz.js` 被大量呼叫,`title`/`detail` 為含 `_lbl(node)` 插值的繁中字串(例:`` `左旋 @ ${_lbl(x)}` ``、`` `Case 1：叔叔 ${_lbl(u)} 也是紅的 → 只變色` `` + 長 detail)。`_lbl(node)` 回傳語言中立節點標籤。
- `renderTreeRB`(app.js ~6079)硬編中文:`插入`/`刪除` 按鈕、`placeholder="鍵值"`、hint「點節點可…← → …空白鍵…」、狀態如「節點太多了(上限 63)…」「已經在樹裡了」;插入/刪除以 `_rbState.hist.runOp('插入 '+v, …)` 傳中文標籤。
- 6 個預設情境名為中文(如「刪除三連旋」)。
- `langOf = (msg) => (window.I18N && I18N.getCurrentLanguage()==='zh') ? msg.zh : msg.en` 為既有 pattern(目前是各 render 內區域函式;renderTreeRB 需自備一個)。
- 現有 `tests/tree_rb.spec.js` 以中文字面斷言(`步驟紀錄`、`已經在樹裡了`、預設 `刪除三連旋`)。

## 3. 架構

### 3.1 `js/tree_rb_viz.js` — 步驟文字與預設雙語化
- `_emit(type, title, detail, nodes)`:`title`、`detail` 由字串改為 `{ zh, en }` 物件。所有呼叫點改為傳 `{ zh: `<原中文>`, en: `<對應英文>` }`,插值的 `_lbl(node)` 在兩語言字串內各自使用。
- `step` 物件因此帶 `step.title = {zh,en}`、`step.detail = {zh,en}`;`step.type` 不變(insert/recolor/rotate/delete/note)。此為 `onStep`/步驟模型的**契約變更**:消費端(render)須以 `langOf(step.title)` 取字。
- 6 個預設:名稱與(若有)說明改 `{ zh, en }`;每個預設帶穩定 `id`(語言中立,供選單 value 與測試選取)。
- 英文須忠實對照中文語意 + 用 CLRS 標準術語(left/right rotation、recolor、Case 1 uncle is red、fix-up propagates up、black-height、successor、sibling/nephew 等)。
- 模組維持純函式/雙重匯出;不引入 DOM 或 I18N 依賴(只回傳 `{zh,en}` 資料,由 render 決定語言)。

### 3.2 `renderTreeRB`(js/app.js)
- 在函式內加 `const langOf = (msg) => (window.I18N && I18N.getCurrentLanguage() === 'zh') ? msg.zh : msg.en;`(同既有 pattern)。
- 所有硬編中文 UI 字串改 `langOf({ zh:'…', en:'…' })`:按鈕、placeholder(用變數設定 `.placeholder`)、hint、狀態訊息、drawer 切換鈕、任何面板標題(如「步驟紀錄」→ `{zh:'步驟紀錄', en:'Step Log'}`)。
- 插入/刪除:`runOp` 的操作標籤改為雙語(如 `langOf({ zh:'插入 '+v, en:'Insert '+v })`);若 runOp 標籤也顯示在步驟列,確保顯示端一致。
- 步驟紀錄列表渲染:每步顯示 `langOf(step.title)`(+ 展開 `langOf(step.detail)`)。
- 預設選單:option label 用 `langOf(preset.name)`,value 用 `preset.id`(穩定);選取時依 id 載入。

### 3.3 語言切換即時更新
- 確認切換語言(app 的 languagechange / switchMode 流程)會重繪目前作用中的 tree-rb。若既有流程未重繪動態 host viz,於語言切換處補呼叫目前 render(與其他 viz 一致)。驗證:切 en↔zh 後 RB UI 文字即時改變。

### 3.4 測試更新 `tests/tree_rb.spec.js`
- 使既有斷言語言穩定:於 `beforeEach` 以 `addInitScript` 固定 `localStorage['dsvisual-lang']='zh'`(或 app 實際使用的語言鍵),保留現有中文斷言在 zh 模式仍成立;預設改以穩定 value/id 選取(`.rbviz-preset` by `data-preset`/value,而非中文 hasText),避免雙語化後失效。
- 新增一項 en 驗證:切換語言為 en(設定語言鍵 + 重繪/reload)後,斷言按鈕/步驟出現英文(如按鈕 `Insert`、步驟含 `rotate`/`Case`),證明雙語生效。
- 單元 `tests/unit/tree_rb_viz.test.js`:以 `step.type` 與 RB invariant 為主,不受文字變更影響;若有斷言 title 字串,改為斷言 `step.title.zh`/`.en` 皆為非空字串(或加一條「title/detail 為含 zh+en 的物件」)。

## 4. 檔案清單
- 修改:`js/tree_rb_viz.js`(_emit title/detail → {zh,en};預設雙語 + id)、`js/app.js`(renderTreeRB langOf 化 + 步驟顯示 + 語言切換重繪)、`tests/tree_rb.spec.js`(語言穩定 + en 驗證)、必要時 `tests/unit/tree_rb_viz.test.js`(title 物件斷言)
- 不動:`js/cloud-config.js`、RB 演算法核心、slides、其他 viz、計數測試

## 5. 測試
- **單元**:`tree_rb_viz.test.js` 全綠;每個 `_emit` 步驟的 `title`/`detail` 皆為 `{zh:string(非空), en:string(非空)}`(加一條斷言掃描一次 insert+delete 序列的所有步驟)。
- **E2E**:`tree_rb.spec.js` zh 模式既有行為全過;新增 en 模式斷言(英文 UI/步驟)通過;預設以穩定 id 選取。
- 全套 `npm run test:all` 綠;計數不變。

## 6. 驗收標準
- tree-rb 的介面文字與步驟紀錄在 zh/en 兩語言均正確顯示,切換語言即時更新。
- 英文技術正確(CLRS 術語),與中文語意一致。
- 演算法行為、slides、其他 viz、計數不變;`js/cloud-config.js` 未動。
- 單元 + E2E 全綠。

## 7. 風險與緩解
- **契約變更**(step.title/detail 由 string → {zh,en}):唯一消費端是 renderTreeRB(同 PR 一起改);單元測試同批更新。全域搜尋確認無其他消費端。
- **翻譯量大且需技術正確**:逐 `_emit` 對照;審查者以「英文語意=中文 + CLRS 術語正確」查核。
- **E2E 中文字面失效**:改為語言穩定選取 + 明確設定語言鍵;新增 en 驗證。
- **語言切換未重繪**:明確驗證切語言後 RB 文字更新;必要時於語言切換流程補重繪。
- **節點插值**:`_lbl(node)` 語言中立,兩語言字串共用同一 `_lbl` 值,確保節點標示一致。
