# 設計文件:Graphs 全套補齊 + Disjoint Set(Spec 2a of 4)

- **日期**:2026-05-21
- **分支**:`feature/graphs-and-dsu`
- **狀態**:設計待用戶核可

## 1. 目標

補齊 🔴 強烈建議項目中與 Graphs / Disjoint Set 相關的 5 個 method,讓圖結構教學完整(表示法 → 走訪 → 應用)且 Kruskal 的 DSU 有獨立教學對應。**此為 4 份 spec 中的第 2a 份**,搭配先前 PR #58 的分類重組與 PR #59 的 UX 微調;後續 Spec 2b 處理 Linear + String Matching。

## 2. 範圍

**新增 5 個 method**,排序依教學脈絡(表示法 → 走訪 → 應用):

| # | id | title (en) | category | visualizer | controls | .cpp |
|---|------|------------|----------|------------|----------|------|
| – | (graph 既有) | Undirected Graph | Graphs | `graph` | `graph` | graph.cpp |
| 1 | `graph-adjlist` | Adjacency List | Graphs | `graph`(擴) | `graph` | graph_adjlist.cpp 新 |
| 2 | `graph-traversal` | BFS vs DFS (Dual-Pane) | Graphs | `graph-dual` 新 | `graph-traversal` 新 | graph_traversal.cpp 新 |
| 3 | `graph-bfs` | Breadth-First Search | Graphs | `graph`(擴) | `graph` | graph_bfs.cpp 新 |
| 4 | `graph-dfs` | Depth-First Search | Graphs | `graph`(擴) | `graph` | graph_dfs.cpp 新 |
| – | (kruskal/dijkstra/topo 既有) | … | Graphs | `graph` | `graph` | … |
| 5 | `tree-dsu` | Disjoint Set (Union-Find) | Trees | `dsu` 新 | `dsu` 新 | tree_dsu.cpp 新(從 graph_kruskal.cpp 抽 `struct DSU`)|

**最終分類規模**:Graphs 8 個 method、Trees 10 個 method。

## 3. 共用範例圖

`graph-adjlist`、`graph-traversal`、`graph-bfs`、`graph-dfs` **共用同一個 5-node 無向圖**(取自既有 `graph.cpp` 的 `main()` 範例),讓四份 deck 在「表示法 → 走訪」教學動線上互相對照。Kruskal / Dijkstra / Topo 仍用各自的加權 / 有向圖(現狀不動)。

## 4. Visualizer 擴充策略

### A. 擴 `renderGraph()`(`app.js:1733` 附近)

`graph-adjlist` / `graph-bfs` / `graph-dfs` 三者共用 `visualizer: 'graph'`,加進現有 dispatch:
```js
else if (currentMode === 'graph' || /*…既有 4 個…*/ ||
         currentMode === 'graph-adjlist' ||
         currentMode === 'graph-bfs' ||
         currentMode === 'graph-dfs') renderGraph();
```

`renderGraph()` 內部按 `currentMode` 分支:
- `graph` / kruskal / dijkstra / topo:**現狀不動**(節點圓圈 + 邊;矩陣方法的特殊渲染保留)。
- `graph-adjlist`:同範例圖,左側保留節點圓圈,**右側改畫鏈結串列風格**(每個節點一行:`[v] → next → next → null`)。
- `graph-bfs`:節點 + 邊;**新增 queue 區**(右側或下方),step 動畫:dequeue → visit → enqueue 所有未訪鄰居 → 染色 visited / frontier。
- `graph-dfs`:同 BFS 但 queue 換成 **stack**;邊在 DFS tree 上以 tree-edge / back-edge 著色區分。

### B. 新 visualizer:`graph-dual`(graph-traversal 專用)

`renderGraphDual()` 用 `display: grid; grid-template-columns: 1fr 1fr; gap: 12px;` 渲染左右兩個小 graph 面板:
- 左:BFS 版,自帶 queue 區
- 右:DFS 版,自帶 stack 區
- **一組共享的 step 控制**(Step / Run / Reset / Start node)同步驅動兩邊「visit 下一節點」。
- 第 N 步時兩邊 visited 節點集合相同,但 frontier 結構與 visit 順序不同,凸顯 BFS↔DFS 對比。
- 窄螢幕(< 800px)fallback 為上下排列。

### C. 新 visualizer:`dsu`(tree-dsu 專用)

`renderDSU()` 渲染 **forest-of-trees**:
- 預設 N = 8(元素 0..7),初始每個是自己的單節點樹。
- 控制器:`Union(a, b)` 兩個下拉 + 按鈕、`Find(x)` 一個下拉 + 按鈕、`Reset`、`Run scripted demo`。
- 動畫:
  - Union:依 rank 將較矮的樹 root 指向較高的樹 root(union by rank)。
  - Find:高亮從 x 到 root 的路徑;完成後 **path compression** — 路徑上所有節點以 fade transition 重指 root。
- 側邊顯示 `rank[]` 陣列做數值參考。

### Mode 註冊重點

`currentMode.includes('graph')` 這類較廣的條件式([app.js:1498](app.js#L1498))也要檢查,確保新 mode 走對分支。

## 5. C++ Sources

| 檔案 | 內容 |
|------|------|
| `graph_adjlist.cpp` | 新寫:`class AdjList`,內含 `addEdge`、`neighbors(v)`、`print()` |
| `graph_bfs.cpp` | 新寫:用 `queue<int>` 實作 BFS,輸入鄰接表 |
| `graph_dfs.cpp` | 新寫:遞迴 + 迭代(stack)兩版 |
| `graph_traversal.cpp` | 新寫:同檔內示範 BFS 與 DFS 對照(主要供 deck code 區塊使用) |
| `tree_dsu.cpp` | **抽取**自 `graph_kruskal.cpp` 的 `struct DSU`(已有 path compression + union by rank),擴成可獨立執行的 `main()` 示範 |

每個 `.cpp` 都要通過 `format_code.js` 的 `compileCheck` gate(g++ -fsyntax-only)。

`build_db.js` mappings 必須**先補 5 條**(PR #57 教訓):
```
'graph_adjlist.cpp':   'codeGraphAdjlist',
'graph_bfs.cpp':       'codeGraphBFS',
'graph_dfs.cpp':       'codeGraphDFS',
'graph_traversal.cpp': 'codeGraphTraversal',
'tree_dsu.cpp':        'codeTreeDSU',
```

## 6. Slide Decks(5 份雙語,8 頁)

套用既有 stack-array 模板:標題 → 核心概念 → 運作流程(steps + mermaid)→ 圖示(svg + note)→ 複雜度(table + math)→ 程式碼 → 優缺點 → 小結。

| id | 主題重點 |
|----|---------|
| `graph-adjlist` | List vs Matrix 取捨;空間 $O(V+E)$;遍歷鄰居 $O(\deg(v))$ |
| `graph-traversal` | BFS 用 queue、DFS 用 stack / 遞迴;同起點不同順序;BFS 找未加權最短;DFS 探深路徑 |
| `graph-bfs` | Queue-based、layer-by-layer、$O(V+E)$、unweighted 最短路徑 |
| `graph-dfs` | Stack 或遞迴、tree/back/forward/cross edges、$O(V+E)$、拓樸 / SCC 基礎 |
| `tree-dsu` | Forest 表示、path compression、union by rank、近似 $O(\alpha(N))$;在 Kruskal 中的角色 |

`graph-traversal` 第 3 頁的 mermaid 用兩個 subgraph 並列(BFS / DFS),呼應 visualizer 的雙小圖佈局。

**前後互引**:`graph-kruskal` 既有 deck 的小結加一行「DSU 詳見 `tree-dsu`」(一行修改、重新跑 `npm run build:slides` 重生)。

## 7. METHOD_GROUPS 變更

Graphs 群組順序變為:
```
graph, graph-adjlist, graph-traversal, graph-bfs, graph-dfs,
graph-kruskal, graph-dijkstra, graph-topo
```

Trees 群組末尾追加 `tree-dsu`,排在 `tree-bplus` 之後(放在最後,因為它與其他 BST 家族結構性不同)。

## 8. 檔案異動總覽

**新增**
- 5 個 `.cpp`:graph_adjlist.cpp、graph_bfs.cpp、graph_dfs.cpp、graph_traversal.cpp、tree_dsu.cpp
- 5 個 `slides/zh/<id>.md` + 5 個 `slides/en/<id>.md`(由 `build_slides.js` 生成)
- `code_db.js` 自動新增 5 個 `codeXxx` 常數
- `slides_rendered.js` 重生(新增 5 個 deck)

**修改**
- `app.js` —
  - `METHOD_GROUPS` Graphs 與 Trees 群組各插入新項
  - `renderGraph()` 加 3 個 mode 分支(adjlist / bfs / dfs)
  - 新增 `renderGraphDual()` 與 `renderDSU()`
  - 新增 BFS / DFS / Adjlist / Traversal / DSU 的 controls(在既有 controls dispatch 處)
  - `currentMode.includes('graph')` 之類的條件式視需要擴充
- `build_db.js` 加 5 條 mappings
- `slides_db.js` 加 5 份 deck(8 頁 × 雙語);`graph-kruskal` 小結加 cross-link 一行
- `style.css` —
  - `.graph-dual-pane`、`.graph-dual-grid` 雙小圖樣式
  - `.dsu-forest`、`.dsu-tree-node`、`.dsu-rank-table` DSU 樣式
  - `.adjlist-row` 鏈結串列風格樣式
  - `.bfs-queue`、`.dfs-stack` 容器樣式
- `tests/visualizer.spec.js` 新 5 個 method 渲染 case
- `tests/slides_viewer.spec.js`(若有)— 或在現有測試擴 5 個 slide deck 覆蓋

## 9. 測試

**Playwright(新增 ~10 case)**

對每個新 method 一個渲染 case + 一個 slide-viewer case:
- 從 Graphs / Trees nav 切到該 method → 確認 `[data-method-section="<id>"]` 出現且 `data-runtime-state="active"`
- 程式碼面板有 `language-cpp` token spans + 正確檔名
- Visualizer mode 標誌:
  - `graph-bfs`:`.bfs-queue` 元素可見
  - `graph-dfs`:`.dfs-stack` 元素可見
  - `graph-traversal`:`.graph-dual-pane` × 2 可見
  - `graph-adjlist`:`.adjlist-row` × N 可見
  - `tree-dsu`:`.dsu-tree-node` × 8 初始可見
- Slide-viewer:開 modal 確認 8 張 slide、能切語言

**單元測試**:不新增。`build_slides.js` / `format_code.js` 的單元測試覆蓋已足;`slides_db.js` 內容透過 `npm run build:slides` 跑通即為驗證。

**預期總測試數**:既有 100(44 unit + 56 Playwright)→ 約 **110**(44 unit + 66 Playwright)。

**冪等性**:`npm run format:code && git status --short`、`npm run build:slides && git status --short` 兩者跑完皆乾淨。

## 10. 不在此範圍

- **不重做** Kruskal / Dijkstra / Topo 的 visualizer(只加 cross-link 一行進 deck)。
- **不改** graph (matrix) 的既有顯示。
- **不加** 互動式 graph 編輯(add / remove edge 由 UI 操作)— 範例圖固定。
- **不加** DSU 的「path compression vs no compression」對比模式 — 永遠開最佳化(scope 控制)。
- **不修改** UX polish(密度滑桿 / zoom)— 那已 merge 在 main。
- **Spec 2b**(Deque + String matching)留給下一輪。

## 11. 風險與已知考量

- **共用 `renderGraph()` 不能 regress 既有 4 個 graph 方法**:Task 1 完成後立即跑完整測試確認。
- **graph-dual 視覺空間**:左右兩個小 graph 在窄寬度(< 800px)需 stack 排列;媒體查詢 fallback。
- **DSU path compression 動畫**:SVG 上 edge re-routing 用 highlight → 瞬時切換 + fade transition;不要太複雜。
- **`graph_kruskal.cpp` DSU 抽取**:抽出後 kruskal.cpp 本身可改為 `#include "tree_dsu.cpp"` 嗎?— 不,跨 .cpp include 不是慣例。**`graph_kruskal.cpp` 保留它自己的 DSU 副本**(slides 教學用 = tree_dsu.cpp),兩者結構相同但獨立存在,避免破壞既有 kruskal 編譯。
- **build_db.js 缺映射**:PR #57 教訓 — Task 1 第一步就補,後續才跑 `regenerateCodeDb()`。
- **工程量估計**:約等同 PR #57(code-display beautify):5 新 .cpp + 1 主要 visualizer 擴充 + 2 新 visualizer + 5 雙語 deck + 測試。實作計畫會拆 ~10-12 個 task。
