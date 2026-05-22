# Spec 4 — Range-Query Trees + Advanced Graph Algorithms 設計文件

## 目標與背景

補齊 🟢「加分項」分級的演算法深度方法,為兩個既有分類加上課本必教的進階內容:

1. **Trees** 補上兩種區間查詢結構:Segment Tree(支援 lazy propagation 的區間更新)與 Fenwick Tree(Binary Indexed Tree)。
2. **Graphs** 補齊最小生成樹與最短路家族:Prim's MST(對應既有的 Kruskal)、Bellman-Ford(可處理負權邊的單源最短路)、Floyd-Warshall(全點對最短路)。

**此為 4 份 spec 的最後一份**,接續 Spec 2a(Graphs + DSU)、Spec 2b(Deque + String Matching)、Spec 3(Probabilistic + String Matching)。本 spec 落地後,原始 4 份 spec 路線圖的 🔴 / 🟡 / 🟢 三個分級全部完成。其餘長尾候選(HyperLogLog、Cuckoo hashing、Treap、K-D Tree、Suffix 結構、A*、Tarjan SCC、Max-Flow 等)留作未承諾的未來 backlog。

執行方法論:brainstorming → writing-plans → subagent-driven-development → finishing-a-development-branch。

## 方法清單

新增 **5 個方法**:

| id | 標題 | 分類(附加位置) | C++ 檔 | visualizer | controls |
|---|---|---|---|---|---|
| `tree-segment` | Segment Tree | Trees,接在 `tree-dsu` 後 | `tree_segment.cpp` | `segtree` | `segtree` |
| `tree-fenwick` | Fenwick Tree (BIT) | Trees | `tree_fenwick.cpp` | `fenwick` | `fenwick` |
| `graph-prim` | Prim's MST | Graphs,接在 `graph-topo` 後 | `graph_prim.cpp` | `graph-step` | `graph-step` |
| `graph-bellman-ford` | Bellman-Ford | Graphs | `graph_bellman_ford.cpp` | `graph-step` | `graph-step` |
| `graph-floyd-warshall` | Floyd-Warshall | Graphs | `graph_floyd_warshall.cpp` | `matrix` | `matrix` |

最終 **Trees** 分類順序:… → tree-btree → tree-bplus → tree-dsu → **tree-segment → tree-fenwick**。

最終 **Graphs** 分類順序:… → graph-kruskal → graph-dijkstra → graph-topo → **graph-prim → graph-bellman-ford → graph-floyd-warshall**。

注意:METHOD_GROUPS 條目的 `visualizer` 與 `controls` 欄位在現行程式碼中僅作為描述性 metadata(實際 dispatch 全部以 `currentMode` 進行),沿用既有慣例填寫即可。

## 架構決策

**程式碼組織沿用 Spec 3 已驗證的方案**:5 個視覺化器各自一份自足的 render 函式(`renderSegmentTree` / `renderFenwick` / `renderPrim` / `renderBellmanFord` / `renderFloydWarshall`)。五者皆為逐步型,全部重用既有的 `buildStepControls()` Step / Run / Reset 控制列輔助函式(Spec 3 引入)。

**唯一的新共用件**:`buildWeightedGraphSvg()` —— Prim 與 Bellman-Ford 都需繪製帶權圖(節點圓、邊線、權重標籤),共用此小工具;以參數區分無向(Prim)與有向(Bellman-Ford,加箭頭)。Segment Tree、Fenwick Tree、Floyd-Warshall 形狀各異(二元樹 / 索引陣列 / 距離矩陣),各自自足。

**所有新 render 函式都必須走 `acquireDynamicVizHost()`**(Spec 2a 引入的模式),把內容渲染進 `#dynamic-viz-host`,絕不直接對 `runtimeVisualizer` 做 `innerHTML = ''` —— 後者會摧毀靜態容器,導致之後切回靜態方法時崩潰。

**控制項內嵌**:所有新方法的 Step / Run / Reset 控制列由 render 函式經 `buildStepControls()` 動態建立並內嵌進 `#dynamic-viz-host`,不修改 `index.html`。

**不動既有靜態圖視覺化器**:既有 Graphs 方法(`graph` / `graph-kruskal` / `graph-dijkstra` 等)使用舊的靜態 `renderGraph` 與 `index.html` 內的圖控制項。本 spec 的 3 個新圖方法是獨立的動態視覺化器,完全不碰 `renderGraph`、`graphContainer` 或 `index.html` 的圖控制項。

**dispatch 注意事項**:新方法的 id(`tree-segment` / `tree-fenwick` / `graph-prim` / `graph-bellman-ford` / `graph-floyd-warshall`)各需獨立的 `updateLayout` 與 `renderAll` dispatch 分支,且須確保不被任何泛用比對(例如針對既有 tree / graph 家族的 `includes()` 或明確清單)吞掉 —— 新分支只設定 `codeTitle` / `codeDisplay`,不 un-hide 任何既有靜態容器。

**固定示範資料**:5 個方法皆為逐步型,使用固定示範資料(與 Spec 2b / 3 的逐步字串方法一致),不提供互動式自訂輸入。

## Segment Tree 設計

### C++(`tree_segment.cpp`)

對一個固定的 8 元素陣列建立線段樹,聚合為**區間和**,並支援 **lazy propagation 的區間更新**。函式:`build(node, lo, hi)`、`update(node, lo, hi, ql, qr, val)`(對 `[ql, qr]` 區間加值,以 lazy tag 暫存)、`query(node, lo, hi, ql, qr)`(區間和查詢,下降時 `pushDown` lazy tag)、`pushDown(node)`(把 lazy tag 傳給兩個子節點)。`main()` 示範:建樹、一次區間查詢、一次區間更新、再一次區間查詢以顯示變化。

### 視覺化器(`renderSegmentTree()`)

固定示範陣列 `[5, 8, 6, 3, 2, 7, 2, 6]`。線段樹為 15 節點的完滿二元樹(深度 3),以 SVG 繪製;每個節點顯示其 `[lo, hi]` 區間與區間和,持有 lazy tag 時加註(例如 `+3`)。底部呈現 8 元素陣列。

採**腳本化 3 階段**逐步示範,由單一 Step / Run / Reset 驅動(比照 Aho-Corasick 的多階段序列),並顯示階段標籤:

```
                 [0,7]=39
         [0,3]=22         [4,7]=17
     [0,1]=13  [2,3]=9  [4,5]=9  [6,7]=8
      5  8      6  3     2  7     2  6      ← 8 元素陣列
```

- **階段一「Range query sum[2,5]」**:從根下降 —— 節點完全落在查詢區間內 → 取其值(綠);與查詢區間不相交 → 跳過;部分相交 → 遞迴(琥珀)。累加區間和。
- **階段二「Range update [1,4] += 3」**:完全被覆蓋的節點掛上 lazy tag(節點上顯示,例如 `+3`);部分覆蓋的節點遞迴後上拉更新。
- **階段三「Range query sum[2,5]」**:再次查詢;下降時 `pushDown` 把 lazy tag 傳給子節點,結果反映階段二的更新。

此 Query → Update → Query 的端到端序列正是讓 lazy propagation 可見的設計。

## Fenwick Tree 設計

### C++(`tree_fenwick.cpp`)

對一個固定的 8 元素陣列建立 Fenwick Tree(Binary Indexed Tree,1-indexed)。函式:`update(i, delta)`(沿 `i += i & -i` 向上走)、`prefixSum(i)`(沿 `i -= i & -i` 向下走,回傳 `[1, i]` 的和)、`rangeSum(l, r)`(= `prefixSum(r) - prefixSum(l - 1)`)。`main()` 示範建表、一次前綴和查詢、一次點更新、再一次前綴和查詢。

### 視覺化器(`renderFenwick()`)

固定示範陣列(8 元素,1-indexed)。BIT 以 8 個索引格的陣列呈現,每格顯示其儲存值與「負責範圍」`(i - lowbit(i), i]`;lowbit 跳躍以弧線標示。

採**腳本化 3 階段**逐步示範,由單一 Step / Run / Reset 驅動:

- **階段一「prefixSum(7)」**:沿 `7 → 6 → 4 → 0` 向下走並累加;每步顯示當前索引與其 `i & -i`(lowbit)值。
- **階段二「update(3, +5)」**:沿 `3 → 4 → 8` 向上走。
- **階段三「prefixSum(7)」**:再次查詢,顯示變更後的總和。

`i & -i` 的 lowbit 跳躍是此結構的核心教學重點,每步都明確標示。

## Prim's MST 設計

### C++(`graph_prim.cpp`)

對固定的**無向帶權圖**執行 Prim 演算法:從一個起點出發,反覆把連接「已在樹中的點集」與「樹外點」的最小權重邊加入。`main()` 對固定圖執行,印出 MST 的邊與總權重。

### 視覺化器(`renderPrim()`)

繪製一個固定的 **5 節點無向帶權圖**(透過共用的 `buildWeightedGraphSvg()` 繪製節點圓、邊線、權重標籤)。逐步:每步加入跨越「樹 / 非樹」割集的最小權重邊。高亮 —— 已在樹中的節點(綠)、每步選中的邊;顯示累計 MST 權重。Step / Run / Reset,固定圖。

## Bellman-Ford 設計

### C++(`graph_bellman_ford.cpp`)

對固定的**有向帶權圖**(含一條負權邊 —— 這是 Bellman-Ford 相對 Dijkstra 的招牌優勢;圖中無負環)執行單源最短路:做 V−1 趟、每趟鬆弛所有邊。`main()` 對固定圖執行,印出各點距離。

### 視覺化器(`renderBellmanFord()`)

繪製一個固定的 **5 節點有向帶權圖**(`buildWeightedGraphSvg()`,有向 → 加箭頭),外加一個逐點的**距離陣列**(起點為 0,其餘為 ∞)。逐步:每步鬆弛一條邊 —— `dist[v] = min(dist[v], dist[u] + w)` —— 高亮該邊與對應的距離格,並顯示趟數計數(第 k 趟,共 V−1 趟)。簡報說明第 V 趟用於負環偵測。Step / Run / Reset,固定圖。

## Floyd-Warshall 設計

### C++(`graph_floyd_warshall.cpp`)

對固定的有向帶權圖執行 Floyd-Warshall 全點對最短路:三層迴圈 `dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j])`。`main()` 對固定圖執行,印出距離矩陣。

### 視覺化器(`renderFloydWarshall()`)

對一個固定的 **4 節點有向帶權圖**(節點數刻意小,使 4×4 矩陣清晰)呈現一個 **V×V 距離矩陣**(格狀)。

```
        A   B   C   D
   A    0   3   ∞   7
   B    8   0   2   ∞      ← 矩陣隨 k 推進而演化
   C    ∞   ∞   0   1
   D    2   ∞   ∞   0
```

採逐**中介點 k** 步進(共 4 步):每步高亮第 k 列與第 k 行(樞紐),以 k 作為中介點重算整個矩陣,並標出本步變更的格子。Step / Run / Reset。

## 共用輔助函式

`buildWeightedGraphSvg(graph, { directed })` —— 回傳一段繪製帶權圖的 SVG 字串 / DOM:節點以圓呈現、邊以線呈現並標註權重;`directed` 為 true 時加箭頭。供 `renderPrim`(無向)與 `renderBellmanFord`(有向)共用。呼叫端可於回傳後額外對特定節點 / 邊加上高亮 class。

## 簡報

**5 份雙語(zh / en)8 頁簡報**,結構同 Spec 3:

1. 概述(paragraph)
2. 核心概念(paragraph + bullets)
3. 運作流程(steps + mermaid)
4. 示意圖(svg + note)
5. 複雜度分析(table + math)
6. 程式碼(code,`lang: cpp`)
7. 優缺點與使用時機(bullets)
8. 小結(bullets)

5 份:`tree-segment`、`tree-fenwick`、`graph-prim`、`graph-bellman-ford`、`graph-floyd-warshall`。各 deck 的 `category` 欄位對應其所屬 group 標題(`"Trees"` 或 `"Graphs"`)。

**複雜度(簡報內容須正確)**:

| 方法 | 關鍵複雜度 |
|---|---|
| Segment Tree | 建樹 $O(n)$;區間查詢 / lazy 區間更新 $O(\log n)$;空間 $O(n)$ |
| Fenwick Tree | 點更新 / 前綴和 $O(\log n)$;空間 $O(n)$ |
| Prim's MST | 配二元堆積 $O(E \log V)$;空間 $O(V + E)$ |
| Bellman-Ford | 時間 $O(V \cdot E)$;空間 $O(V)$ |
| Floyd-Warshall | 時間 $O(V^3)$;空間 $O(V^2)$ |

簡報的 mermaid 須用 `flowchart`、僅用矩形 `[...]` 節點(不可用 `([...])` stadium 節點 —— 渲染不確定會破壞 `build:slides` 冪等性);含括號的標籤要加引號;LaTeX 反斜線在 JS 字串中須寫成 `\\`;中文用全形標點;簡報內文不可出現裸的 `$` 字元(會被 KaTeX 誤判為數學分隔符)。

## 整合檢查清單(每個方法)

源自 PR #57(`build_db.js` 缺 mapping)與 Spec 2a 容器摧毀回歸的教訓。每個新方法須完成:

1. `build_db.js` 加入 `.cpp → code 常數` mapping(**必須先於 `.cpp` 建立**,否則 `code_db.js` 重生會掉常數)。
2. `METHOD_GROUPS` 加入條目。
3. `getCodeForMethod` 加入 mapping。
4. `updateLayout` 加入獨立分支:設定 `codeTitle` / `codeDisplay`;不 un-hide 既有靜態容器;確保不被既有 tree / graph 家族的比對吞掉。
5. `renderAll` 加入獨立 dispatch 分支。
6. render 函式經由 `acquireDynamicVizHost()` 渲染 —— 絕不直接 `runtimeVisualizer.innerHTML = ''`。

## 測試

- 每個方法 1 個 Playwright render 測試(共 5 個):驗證檔名與關鍵 DOM —— Segment Tree 的樹節點、Fenwick 的索引格、Prim / Bellman-Ford 的圖節點、Floyd-Warshall 的矩陣格;並驗證 Step 推進。
- 擴充既有的「動態 → 靜態」導覽回歸測試,加入一條樹路徑(`tree-segment → tree-bst`)與一條圖路徑(`graph-prim → graph`),確保新動態方法不會摧毀靜態容器。
- 冪等性:`npm run format:code` 與 `npm run build:slides` 重跑後 `git status` 乾淨。
- 全套件:`npm run test:all` 全綠。最終測試數 125 → **130**(44 unit + 86 Playwright)。

## CSS

新增的 CSS 規則一律附加在 `style.css` 末端,類別名稱以方法前綴命名空間:`segtree-`、`fenwick-`、`wgraph-`(共用帶權圖輔助函式)、`prim-`、`bellman-`、`floyd-`,避免與既有規則衝突。

## 不在範圍內

- 本 5 個方法以外的任何內容。
- 既有靜態圖視覺化器(`renderGraph`)、既有 tree 視覺化器、`index.html` 的既有控制項 —— 一律不修改。
- 逐步方法的互動式自訂輸入 —— 使用固定示範資料即可,與 Spec 2b / 3 的逐步方法一致。
- 原始路線圖之外的長尾候選(HyperLogLog、Cuckoo hashing、Treap、K-D Tree、Suffix 結構、A*、Tarjan SCC、Max-Flow 等)—— 留作未承諾的未來 backlog,不在本 spec。
- 分類 nav 結構調整(沿用既有 9 分類)。

## 預期產出

5 個新方法、5 個 `.cpp` 檔、新的 `buildWeightedGraphSvg()` 共用輔助函式、5 份雙語簡報、~5+ 個新 Playwright 測試。本 spec 落地後,Trees 分類涵蓋區間查詢結構,Graphs 分類的 MST 與最短路家族齊備,原始 4 份 spec 路線圖全部完成。
