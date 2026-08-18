# 全類別 viz 隨機輸入產生 設計文件

- 日期:2026-08-16
- Repo:`dsvisual`(vanilla JS + GitHub Pages);branch `feat/random-input-all-categories`
- 動機:多數 viz 已可用 🎲 依難度隨機產生輸入(sort/search/graph/…),但約 30 個 visualizer(含 **heap**、deque、部分 tree/graph、hash 家族、magic squares、檔案/記憶體/遞迴等)尚無。使用者要求**所有有實際資料輸入的 category 都補上**隨機產生。(更正:heap 目前其實**沒有**隨機產生;先前印象來自 Sorting 類的 Heap Sort。)

## 0. 範圍與決策(已與使用者確認)

- **統一採 pattern A**:在 viz 控制列輸入旁加一顆 `🎲 <button class="rand-btn">`,點擊時 `RandomInput.randomInputFor(methodId, VizKit.getInputDifficulty())` 取得輸入、填入該 viz 的輸入欄並重繪。難度(normal/special/edge/large)沿用既有機制。
- **涵蓋**:所有有實際資料輸入的 visualizer(見 §2 清單)。
- **排除**(無資料輸入的純概念/靜態示範,加 🎲 無意義):設計模式 `patterns-*`、`oop`、nano-LLM(`bpeEncode`/`bpeTrain`/`computeGraph`/`ngramNext`)。
- **一個 PR**、分 category 批次以 subagent-driven 建置;完成 merge。

## 1. 現況機制(已查證,file:line)

- 難度:`DIFFICULTY_VALUES=['normal','special','edge','large']`(`js/app.js:960`);`getInputDifficulty()`(`974-976`);per-viz 下拉 `buildInlineDifficultySelect`(`1003-1022`)在每個 `.ex-select` 旁自動注入(`injectInlineDifficulty` `1024-1031`)。橋接 `window.VizKit.getInputDifficulty`(`app.js:1370-1374`)。
- 隨機產生器:`window.RandomInput.randomInputFor(methodId, difficulty, rng?)`(`js/random_input.js:263-347`,export 於 `344-346`,同時 `module.exports`)。內部 `switch(methodId)`;未涵蓋者回 `null`。可用 helper:`randInt`、`pick`、`uniqueInts(rng,n,lo,hi)`、`valSeq(rng,difficulty)`(int 序列,依難度給 6-9/18-24/邊界/排序序列)、`searchInput`、`graphEdgeList(rng,difficulty,weighted)`、`graphDagText(rng,difficulty,weighted)`、`mazeText`、`obstInput`、`polyInput`、`mwayInput`、`matrixText` 等。
- viz 端 wiring 參考:`js/domains/sort.js:51`(button)、`69-72`(handler)。graph:`js/domains/graph.js` 多處 `randomInputFor(methodId, K().getInputDifficulty())`。trie 自訂:`trie_viz.js:123`。
- viz 位置:`js/domains/*.js`(heap/linear/tree/graph/hash/sort/search/…,經 `window.VizCore`/`VizRegistry`),與 `js/viz/viz_*.js`(自足模組,`VizRegistry.attach`)。`js/app.js:272` 以 `VizRegistry.behavior(methodId)` 優先。
- heap:`js/domains/heap.js`;控制列 `index.html:92-107`(`#heap-actions`,輸入 `#heap-val`,無 `.ex-select`、無 🎲)。heap methodIds:`heap-binary/binomial/fibonacci/leftist/skew/dary/pairing`(`app.js:146-152`)。

## 2. 涵蓋清單(依批次;每個 = 一個 SDD task)

每批的做法相同(pattern A):(a) 在 `random_input.js` 為每個 methodId 加 `case` 回傳該 viz 消費的輸入形狀(儘量重用既有 helper);(b) 在該 viz 模組控制列加 `🎲 .rand-btn` 並 wire handler 填入輸入欄後重繪;(c) 加單元 + e2e 測試。**實作者需讀該 viz 模組**確認其輸入欄選擇器與插入方式。

- **B1 Heap**(headline):`heap-binary/binomial/fibonacci/leftist/skew/dary/pairing` → `{ vals: valSeq(rng, difficulty) }`;`heap.js` 依序插入 vals(先清空)。控制列 `#heap-actions` 加 🎲(於 `#heap-val` 旁)。
- **B2 Trees—鍵/字**:`tree-radix`、`tree-ternary`(字串集)、`tree-btree`、`tree-bplus`(int 鍵序列 `valSeq`)。
- **B3 Trees—陣列/併集**:`tree-dsu`(union 對:由 uniqueInts 節點 + 隨機配對)、`tree-segment`、`tree-fenwick`(int 陣列 `valSeq`)。
- **B4 Trees—結構/整數**:`tree-general-binary`(tgb)、`tree-copy-equal`、`tree-catalan`(n)、`game-tree`(葉值)。
- **B5 Graphs—權重/DAG**:`graph-floyd`(matrix)、`graph-aoe`、`graph-matrix` → 重用 `graphEdgeList(...,true)` / `graphDagText`。
- **B6 Graphs—連通性**:`graph-components`、`graph-bipartite`、`graph-closure`、`graph-scc`、`graph-maxflow` → 重用 `graphEdgeList`(scc/closure/maxflow 為有向;components/bipartite 為無向)。
- **B7 Hash**:`hash`(chain/open/bucket)、`bloom`、`skiplist`、`cms` → `{ vals: uniqueInts(...) }` 鍵集(依難度給 n)。
- **B8 Misc**:`deque`(linear.js)、`sort-polyphase`(runs)、`isam`、`inverted`、`gcmem`、`recursion`。輸入形狀各自最合適(int 序列 / 文件詞 / n)。
- **B9 Magic squares**:`magic-square`、`magicLatin`、`magicTorus`、`magicFormula`、`magicSymmetry` → 隨機階數 n(合法範圍,如奇/雙偶依該 viz 約束)。

> methodId 以 `METHOD_GROUPS`(`js/app.js`)為準;實作者對照確認。若某 viz 用 visualizer-type 而非 methodId 分派,`case` 用其實際 methodId。

## 3. 檔案清單

- 修改(每批):`js/random_input.js`(新增 `case`;必要時加小 helper)、相關 `js/domains/*.js` 或 `js/viz/viz_*.js`(加 🎲 + handler)。必要時 `js/i18n.js`(🎲 title/aria,若沿用既有 `aria.viz-*`/`random` 文案則免)、`index.html`(僅 heap 控制列需加 🎲 節點;其餘 viz 的控制列由其模組字串產生)。
- 測試:`tests/unit/random_input.test.js`(每個新 methodId × 四難度的形狀/不變量)、`tests/random_input.spec.js`(每批挑代表性 viz:`.rand-btn` 點擊後輸入/渲染改變;必要時難度影響規模)。
- 不動:生成檔 `js/code_db.js`/`js/quiz_rendered.js`/`js/labs_rendered.js`/`js/slides_rendered.js`;被排除的 `patterns-*`/`oop`/nano-LLM viz。

## 4. 測試策略

- **單元**(`tests/unit/random_input.test.js`,`node:test`):對每個新增 methodId,四個難度各跑多次,斷言 `randomInputFor` 回非 null、形狀正確、難度不變量(如 `large` 數量 > `normal`;`edge` 為邊界;graph 為合法邊列表)。mirror 既有 `random_input.test.js` 既有 block。
- **e2e**(`tests/random_input.spec.js`,Playwright):每批至少一個代表 viz——`loadMethod` → 選 `#input-difficulty`(或 per-viz `.viz-difficulty`)→ 找 `[data-method-section="<id>"] .rand-btn` → 點擊 → 斷言輸入欄值或渲染節點集改變(用既有 `expectRandomizes` 重點擊避免同值 flake)。heap:斷言點 🎲 後 `.heap-node` 集改變。
- **回歸**:`npm run test:all` 綠;既有已具隨機的 viz 不受影響;生成檔未動。

## 5. 驗收標準

- §2 清單每個 methodId 皆可經 🎲(或該 viz 既有隨機入口)依當前難度產生隨機輸入並重繪;`randomInputFor` 對這些 id 回非 null。
- 難度切換影響隨機輸入規模/型態(至少 `normal` vs `large`)。
- 排除清單維持不變(無 🎲)。
- `npm run test:all` 綠。

## 6. 風險與緩解

- **異質輸入形狀**:各 viz 輸入不同(鍵/字/邊列表/階數);逐 viz 讀模組確認消費格式,儘量重用既有 helper,避免破壞既有渲染。
- **graph 合法性**:重用 `graphEdgeList`/`graphDagText`(已產合法圖);有向/無向/權重依演算法需求選參數。
- **magic square 合法階數**:各 magic viz 對 n 有約束(奇/雙偶/單偶);隨機 n 須落在該 viz 支援範圍,否則產生後無法建構——測試需驗證產生的 n 可被該 viz 接受。
- **flake**:e2e 用 `expectRandomizes` 重點擊;單元用固定 seed rng 驗形狀。
- **範圍**:僅加隨機入口 + 產生器 case + 測試;不改既有演算法/渲染邏輯;不動排除清單與生成檔。
- **批次獨立**:各批可獨立實作/審查/測試;`random_input.js` 為共同檔,批次間循序(避免衝突)。
