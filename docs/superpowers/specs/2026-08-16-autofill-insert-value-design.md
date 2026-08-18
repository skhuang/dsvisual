# Insert-value 自動隨機填入(heap/hash/deque/bloom/skiplist/cms)設計文件

- 日期:2026-08-16
- Repo:`dsvisual`;branch `feat/autofill-insert-value`
- 動機:stack/queue/array-list/BST/AVL/RB 的「插入值」輸入欄在每次插入後會自動填入新的隨機值(pattern D:`randStdValue()`/`randKey()`),但 **heap、hash、deque、Bloom、skip-list、CMS** 沒有——使用者每次插入都得手動輸入。使用者要求把這六個補齊到相同體驗。

## 0. 範圍與決策(已與使用者確認)

- **六個結構**:heap(`#heap-val`)、hash(`#hash-val`)、deque(`data-deque-val`)、Bloom(`data-bloom-val`)、skip-list(`data-skiplist-val`)、CMS(`data-cms-val`)。
- **plain random**(與既有 pattern D 一致,不跟隨難度設定):數值欄 → `1..99` 隨機整數;文字欄(Bloom/CMS)→ 短隨機小寫單字。
- **時機**:控制列初次建立/掛載時預填一個隨機值;每次**成功插入後**refill 新隨機值;**clear/reset 後**(若該 viz 有)refill。
- **只動 insert 值欄**,不動 search / query / delete 欄(skip-list 有搜尋欄,不碰)。
- 不影響既有 🎲 批次隨機、演算法、渲染;不動被排除的其他結構。
- heap 需特別小心:tutorial 會主動把 `#heap-val` 設為指定步驟值(`heap.js:222`),auto-fill 只能作用在**一般使用者插入**與初次掛載,**不可覆蓋 tutorial 導引值**。

## 1. 現況(已查證,file:line)

- 既有 pattern D:`js/domains/linear.js:7` `randStdValue()`;插入後 `dom.stdVal.value = String(randStdValue())`(`:134,142`),array-list `dom.listValInput.value = Math.floor(Math.random()*100)`(`:155`)。tree:`dom.treeVal.value = Math.floor(Math.random()*100)`(`tree.js:446`);AVL/RB `input.value = randKey()`(`tree.js:255-259,379-381`)。
- 缺 auto-fill:
  - heap:`#heap-val`(`heap.js`,`heapValInput`),插入 handler `btn-heap-insert`;tutorial 於 `:222` 設值。
  - hash:`#hash-val`(`hash.js:123,126`),insert handler 於 `:126-128`(`runHashInsert`)。
  - deque:`data-deque-val` 硬編 `value="42"`(`linear.js:71`)。
  - Bloom:`data-bloom-val`(text,`viz_bloom.js:44`),insert `:64`;有 `savedVal` 記憶。
  - skip-list:`data-skiplist-val` 硬編 `value="15"`(`viz_skiplist.js:64`),insert `:163`;另有 `data-skiplist-search`(不碰)。
  - CMS:`data-cms-val` 硬編 `value="apple"`(`viz_cms.js:43`)。

## 2. 設計

各 viz 在其模組內加/重用一個隨機值 helper,並在三個時機設值:

### 2.1 helper

- 數值(heap/hash/deque/skip-list):`randInsertVal()` → `Math.floor(Math.random()*99)+1`(比照 `randStdValue`)。可各模組本地定義(與既有慣例一致)。
- 文字(Bloom/CMS):`randInsertWord()` → 從小型單字池隨機挑一個短小寫單字(可重用該模組既有的 word 產生器 / `randWord`)。CMS 目前預設 `apple`,Bloom 亦文字。

### 2.2 時機(每個 viz)

- **初次掛載/建立控制列**:把 insert 值欄設為 `randInsertVal()`/`randInsertWord()`(取代硬編的 42/15/apple 或空值)。
- **成功插入後**:於各自 insert handler 內、插入成功(且不為 tutorial 導引)之後,refill 新隨機值。
  - heap:在使用者按 `btn-heap-insert`(非 tutorial 路徑)成功插入後 refill;**不要**動 tutorial 於 `:222` 的設值邏輯。
  - hash:`runHashInsert` 成功後 refill `#hash-val`(注意 animation wrapper——在動畫序列開始前先讀值、序列結束後 refill,不要打斷動畫)。
  - deque/bloom/skiplist/cms:各自 insert `onclick` 成功後 refill。
- **clear/reset 後**(若 viz 有該按鈕):refill,體驗一致(比照 RB/AVL `clear` 後 `input.value = randKey()`)。

### 2.3 不動

- search/query/delete 欄;既有 🎲 批次隨機;演算法/渲染;其他已 auto-fill 的結構;生成檔。

## 3. 檔案清單

- 修改:`js/domains/heap.js`、`js/domains/hash.js`、`js/domains/linear.js`(deque 分支)、`js/viz/viz_bloom.js`、`js/viz/viz_skiplist.js`、`js/viz/viz_cms.js`。
- 測試:`tests/`(Playwright)——每個結構(或代表)驗:載入後 insert 欄有值;插入一次後欄位變成新的隨機值(且合法:數值 1-99 / 非空單字)。
- 不動:生成檔(`js/code_db.js`/`js/*_rendered.js`)、其他 viz、search 欄。

## 4. 測試

- 每個結構(六個,或至少 heap/hash/deque/bloom/skiplist/cms 各一)Playwright:
  - 載入 method → insert 值欄非空(數值在 1-99 / 文字非空)。
  - 讀目前值 → 觸發一次插入 → insert 值欄變成**不同**的新隨機值(用 `expectRandomizes`-style 重試避免同值巧合;或斷言值改變且合法)。
  - heap 特別:確認 tutorial 導引時 `#heap-val` 仍顯示步驟指定值(auto-fill 不破壞 tutorial)。
- 回歸:`npm run test:all` 綠;既有 heap/hash/deque/bloom/skiplist/cms 測試不退化;search 欄未受影響。

## 5. 驗收標準

- 六個結構的 insert 值欄:載入即有隨機值;每次成功插入後自動換新隨機值;clear/reset 後亦然——體驗與 stack/queue/tree 一致。
- heap tutorial 導引值不被 auto-fill 覆蓋。
- 只影響 insert 值欄;`npm run test:all` 綠。

## 6. 風險與緩解

- **heap tutorial 衝突**:auto-fill 僅在一般使用者插入 + 初次掛載;tutorial 的 `:222` 設值路徑不動;測試驗證 tutorial 值仍正確。
- **hash 動畫**:在動畫 wrapper 前讀值、之後 refill,避免打斷 `executeAnimWrapper` 序列。
- **文字欄**:Bloom 有 `savedVal` 記憶——refill 為隨機值即可(初次掛載用隨機取代 savedVal 的硬編預設;若 savedVal 是刻意記憶使用者上次輸入,保留其語意但初次為隨機)。
- **範圍**:純前端各 viz 的 insert 欄 auto-fill;不動演算法/渲染/搜尋欄/生成檔。
