# Tier-3 進階缺口視覺化 — 設計文件

- 日期:2026-06-10
- Repo:`/Users/skhuang/course/dsvisual`(main;cpp/ + js/)
- 動機:補齊經典資料結構/演算法課程中 dsvisual 尚缺的進階主題,沿用既有「純 `*_viz.js` 模組 + app.js render + 統一 Step/Run/Reset 控制 + 雙語 slides deck + 單元/E2E 測試」模式。

## 1. 範圍(6 個新視覺化)

| methodId | 主題 | 群組 |
|---|---|---|
| `game-tree` | Minimax + α-β 剪枝 | trees(既有) |
| `tree-general-binary` | 一般樹 ↔ 二元樹(左孩子-右兄弟) | trees(既有) |
| `sort-polyphase` | Polyphase 磁帶合併排序 | sorting(既有) |
| `gc-memory` | 動態儲存管理 / GC(mode: mark-sweep / refcount / buddy) | **memory(新)** |
| `file-isam` | ISAM 索引查找 | **files(新)** |
| `file-inverted` | 倒排檔(inverted index) | **files(新)** |

新增 2 個群組(`files`、`memory`)、2 個 nav pill、2 個 overview 類別、6 個 method。

不在範圍:cascade merge(polyphase 的變體,polyphase 已涵蓋多磁帶合併概念)、generational GC、ISAM overflow 之外的 B-tree 索引(已有 tree-btree)。

## 2. 既有模式(實作依據)

- **純模組** `js/<name>_viz.js`:dual-export IIFE,與 `js/heap_models.js` 同形式 — `(function(global){ ... if (typeof module!=='undefined'&&module.exports) module.exports=api; global.<Name>Viz=api; })(typeof window!=='undefined'?window:globalThis)`。匯出純的 frame 產生器(回傳 `{frames, ...}`),不碰 DOM,供 `node --test`。
- **DOM render** `render<Name>()` 寫在 `js/app.js` 主 closure 內:用私有 helper `acquireDynamicVizHost()`(取動態容器)、`buildStepControls(onStep, onReset, intervalMs)`(統一 Run↔Pause↔Resume + Step + Reset + 速度滑桿,速度存 `localStorage['dsvisual.stepSpeed.'+currentMode]`)、`computeTreeLayout(node,x,y,dx,metaArray)`(樹佈局);語言用 `window.I18N.getCurrentLanguage()`。
- **Frame 模型**:render 保留 `idx`、`paint()`、`step()`(回傳 false 停止 Run)、`reset()`;`host.appendChild(buildStepControls(step, reset, intervalMs))`。
- **節點繪製規則**:`.tree-node { transform: translate(-50%,-50%) }`,設 left/top 即視覺中心;SVG edge 畫在 `(x,y)` 不加半節點偏移;含 transform 的 highlight class 要保留 `translate(-50%,-50%)`;樹 stage 加 `overflow:hidden`。
- **app.js 4 處接線**:`METHOD_GROUPS`(`{id,title,file,visualizer,controls}`)、`getCodeForMethod()` 的 `codeByMethod` map、`updateLayout()` 的 else-if(動態 host viz 只設 `codeTitle.textContent`/`codeDisplay.textContent`)、`renderAll()` dispatch(精確 id 比對,放在泛用 substring catch-all `includes('search'|'list-'|'stack'|'sort-')` 之前)。
- **build pipeline**:`cpp/<name>.cpp` + `build_db.js` mapping → `node build_db.js` 寫 `js/code_db.js`。slides:`slides_db.js`(repo 根,手寫,`module.exports = SLIDES_DB`)→ `npm run build:slides` 寫 `js/slides_rendered.js` + `slides/{zh,en}/<id>.md`。
- **i18n** `js/i18n.js` `TRANSLATIONS={en,zh}`:`method.<id>`、`group.<id>`(新群組需加)。
- **index.html**:`<script src="js/<name>_viz.js">` 載於 `js/app.js` 之前。
- **隨機輸入(R1/R2 既有)**:有可編輯整組輸入的新 viz,可在 `js/random_input.js` 的 `randomInputFor` 加對應 method 的難度產生器,並在 render 加 `.rand-btn`。Tier-3 viz 視情況納入(見各 viz)。

## 3. 各 viz 設計

### 3.1 game-tree(trees)
- 模組 `game_tree_viz.js`:`buildGameTree(leafValues, branching)` 建固定深度賽局樹(葉為給定值,內部 MAX/MIN 交替);`minimaxFrames(root, alphaBeta)` 產生 DFS 逐步 frame:每步標示 current 節點、回傳值、α/β 區間、以及被 α-β 剪掉的子樹(frame 標 `pruned: [nodeIds]`)。`SAMPLE_LEAVES`。
- render `renderGameTree()`:`computeTreeLayout` 畫樹;MAX 層▲/MIN 層▽;節點顯示目前 minimax 值與 α/β;剪枝子樹變灰並標「剪枝」。控制:Step/Run/Reset + 「α-β 剪枝」勾選(切換重算 frames)+ 可編輯葉值輸入(逗號分隔,Build)。
- 輸入物件(供 random_input):`{ leaves:number[] }`,難度:normal 7–8 葉;special 全相同值(無剪枝)；edge 單葉;large 15–16 葉。

### 3.2 tree-general-binary(trees)
- 模組 `tree_general_binary_viz.js`:`parseGeneralTree(text)` 解析 `parent:child1,child2;...` 或階層字串為一般樹;`convertFrames(genRoot)` 逐步把每個節點的 children 轉成「第一個 child = 左、其餘 sibling 串成右鏈」的二元樹,frame 標示目前處理的邊(general→binary 對應)。
- render `renderTreeGeneralBinary()`:雙欄 — 左畫一般樹(多分支)、右畫轉換後二元樹(LC-RS);逐步高亮對應節點/邊。控制:Step/Run/Reset + 可編輯一般樹輸入(Build)。
- 輸入:`{ text }`(一般樹描述)。

### 3.3 sort-polyphase(sorting)
- 模組 `sort_polyphase_viz.js`:`polyphaseFrames(data, tapes)` — 產生:(1) 初始 run(每個視為長度 1 或自然 run)依 Fibonacci-like 配置分到 T−1 條輸入磁帶;(2) 多趟合併:每趟把各輸入磁帶最前的 run 合併寫到輸出磁帶,直到剩 1 個 run。frame 顯示各磁帶內容與目前合併動作。
- render `renderSortPolyphase()`:磁帶以橫列顯示(每列一條 tape 的 runs);高亮目前讀取/寫入。控制:Step/Run/Reset + 可編輯資料(逗號)+ 磁帶數(min 3)Apply。
- 輸入:`{ data:number[], tapes:number }`。

### 3.4 gc-memory(memory,新群組)
- 模組 `gc_memory_viz.js`:三個產生器,以 mode 切換:
  - `markSweepFrames(heap, roots)`:標記階段(從 roots DFS 標記可達)→ 清除階段(回收未標記)。
  - `refCountFrames(ops)`:依一串 assign/release 操作增減各物件引用計數,計數歸零即釋放(示範循環引用無法回收)。
  - `buddyFrames(ops, size)`:buddy system 配置(切半到合適 2^k 區塊)與釋放(與 buddy 合併)。
- render `renderGcMemory()`:heap 畫成區塊列(地址/大小/狀態:free/allocated/marked);refcount 模式另顯示物件節點 + 計數;控制:Step/Run/Reset + mode 選單(mark-sweep / refcount / buddy)。各 mode 用內建示範情境(不需自由輸入,降低複雜度)。
- 無自由整組輸入 → 不納入 random_input(同 graph-aoe)。

### 3.5 file-isam(files,新群組)
- 模組 `file_isam_viz.js`:`buildIsam(keys, blockSize)` 建兩層 ISAM(索引項指向資料區塊,區塊內排序,滿了走 overflow chain);`searchFrames(key)` 動畫:索引層二分/線性定位 → 目標資料區塊 → 區塊內找鍵(必要時走 overflow)。
- render `renderFileIsam()`:上方索引層、下方資料區塊網格、overflow 串接;高亮查找路徑。控制:Step/Run/Reset + 查找鍵輸入(Search)。
- 輸入:`{ key:number }`(查找鍵);可選 random_input(難度=命中/未命中/overflow/大型)。

### 3.6 file-inverted(files)
- 模組 `file_inverted_viz.js`:`buildInverted(docs)` 從文件集建 詞→postings(docId 清單,可含位置);`buildFrames(docs)` 逐文件掃描建表的動畫;`queryFrames(term)` 顯示查單詞的 postings(及 AND 兩詞交集)。
- render `renderFileInverted()`:左文件清單、右倒排表(詞→docIds);建表逐步高亮、查詢高亮命中 postings。控制:Step/Run/Reset + 查詢詞輸入(Query)。
- 輸入:`{ docs:string[] }` 或查詢詞;可選 random_input。

## 4. 新群組基礎建設(files、memory)

- `METHOD_GROUPS` 加兩個群組物件:`{ id:'files', title:'File Structures', methods:[file-isam, file-inverted] }`、`{ id:'memory', title:'Memory / GC', methods:[gc-memory] }`(放在 searching 之後、oop 之前,或依現有順序合理位置)。
- `js/i18n.js`:加 `group.files`、`group.memory`(en/zh)+ 各 `method.<id>`(en/zh)。
- overview tiles / nav pill 由 `renderCategoryNav()` / overview 渲染依 METHOD_GROUPS 自動產生,無需額外硬編。
- 計數測試更新:`tests/i18n.spec.js`(overview-tile 93→99、overview-category 10→12)、`tests/visualizer.spec.js`(`.category-nav-btn` 11→13)。

## 5. 檔案清單

- 新增模組:`js/game_tree_viz.js`、`js/tree_general_binary_viz.js`、`js/sort_polyphase_viz.js`、`js/gc_memory_viz.js`、`js/file_isam_viz.js`、`js/file_inverted_viz.js`
- 新增 cpp:`cpp/game_tree.cpp`、`cpp/tree_general_binary.cpp`、`cpp/sort_polyphase.cpp`、`cpp/gc_memory.cpp`、`cpp/file_isam.cpp`、`cpp/file_inverted.cpp`(+ `build_db.js` mapping)
- 新增單元測試:`tests/unit/<name>.test.js`(6 支)
- 新增 E2E:`tests/tier3.spec.js`(各 viz 載入 + Step + 主功能)
- 修改:`js/app.js`(6× render + 4 處接線 + 2 新群組)、`index.html`(6× script + 載入)、`js/i18n.js`(group + method 鍵)、`slides_db.js`(6 deck)、`js/code_db.js`(由 build_db 產生)、`js/slides_rendered.js` + `slides/{zh,en}/*.md`(由 build:slides 產生)、`tests/i18n.spec.js`、`tests/visualizer.spec.js`、(選用)`js/random_input.js`、`style.css`

## 6. 分批交付

- **Batch A(擴充既有群組,3 viz)**:tree-general-binary、game-tree、sort-polyphase。各:模組+單元測試 → cpp+build_db → app.js render+接線 → slides → i18n method 鍵 → E2E。更新 trees/sorting 相關計數(overview-tile +3)。
- **Batch B(新群組 + 3 viz)**:新增 files、memory 群組基礎建設 + gc-memory、file-isam、file-inverted,同上各步;更新 overview-category(+2)與 nav-btn(+2)與 overview-tile(+3)。

每個 viz 子任務遵循 TDD:先寫模組單元測試 → 模組 → render 接線 → slides → E2E。

## 7. 測試

- **單元**:每個 `*_viz.js` 的 frame 產生器以性質/具體案例斷言(如 minimax 在已知葉值回傳正確根值;α-β 與不剪枝結果相同但 frame 含 pruned;polyphase 最終剩 1 run 且為已排序;mark-sweep 回收所有不可達;buddy 釋放後可合併;isam search 命中/未命中正確;inverted postings 正確)。
- **E2E**(`tests/tier3.spec.js`):用既有 `loadMethod(page, id)` 模式載入每個 viz,斷言 `[data-method-section][data-runtime-state="active"]`,按 Step 後畫面更新;主功能(如 game-tree 切 α-β、gc-memory 切 mode、file 查找)。
- **計數測試**:依 §4 更新。
- 全套 `npm run test:all` 綠。

## 8. 驗收標準

- 6 個新 viz 皆可從 nav 載入、Step/Run/Reset 正常、主功能正確(minimax 值/剪枝、樹轉換對照、polyphase 收斂、GC 三模式、ISAM 查找、倒排查詢)。
- 2 個新群組(files、memory)出現在 nav 與 overview。
- 每個 viz 有雙語 slides deck(`slides/{zh,en}/<id>.md`)。
- 單元 + E2E 全綠;計數測試更新;`js/cloud-config.js` 未動。

## 9. 風險與緩解

- **新群組基礎建設牽動計數測試**:Batch B 集中處理,明確列出 93→99、10→12、11→13。
- **α-β 剪枝 frame 正確性**:單元測試比對「剪枝結果 == 完整 minimax 結果」確保剪枝不改變最終值。
- **gc-memory 三模式複雜**:用內建固定示範情境(不開放自由輸入),各模式產生器獨立、單元可測。
- **slides build**:slides_db.js 為手寫;build:slides 產生衍生檔,務必 `npm run build:slides` 後一起 commit。
- **樹/磁帶佈局大型輸入溢出**:large 難度與磁帶數設上限,stage `overflow:hidden` + 既有縮放控制。
- **節點/邊對齊**:沿用 §2 既有節點繪製規則(translate -50%、edge 不加偏移)。
