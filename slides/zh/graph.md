---
marp: true
theme: default
paginate: true
math: katex
title: "無向圖(鄰接矩陣)"
---

## 無向圖(鄰接矩陣)

無向圖以 $V \times V$ 的二維陣列(鄰接矩陣)表示頂點間的連接關係;`adjMatrix[u][v] = 1` 代表邊 (u, v) 存在,且矩陣對稱確保雙向可達。

---

## 核心概念

鄰接矩陣以整數 0/1 記錄每對頂點之間是否存在邊。無向圖中 `adjMatrix[u][v]` 與 `adjMatrix[v][u]` 始終同步更新。

- `addEdge(u,v)`:同時設定 `adjMatrix[u][v] = adjMatrix[v][u] = 1`,保持對稱性。
- 邊存在查詢:直接讀取 `adjMatrix[u][v]`,時間 $O(1)$。
- 空間代價:固定佔用 $O(V^2)$,稀疏圖會浪費大量空間。

---

## 運作流程

1. 初始化:建立 $V \times V$ 的矩陣,全部填 0。
2. addEdge(u,v):設定 `adjMatrix[u][v] = 1` 及 `adjMatrix[v][u] = 1`。
3. 邊查詢:讀取 `adjMatrix[u][v]`,若為 1 則邊存在。
4. 鄰居遍歷:掃描第 u 列所有欄位,收集值為 1 的索引。

<svg id="my-svg" width="100%" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="flowchart" style="max-width: 1044.78px; background-color: transparent;" viewBox="0 0 1044.78125 94" role="graphics-document document" aria-roledescription="flowchart-v2"><style>#my-svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;fill:#333;}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#my-svg .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#my-svg .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#my-svg .error-icon{fill:#552222;}#my-svg .error-text{fill:#552222;stroke:#552222;}#my-svg .edge-thickness-normal{stroke-width:1px;}#my-svg .edge-thickness-thick{stroke-width:3.5px;}#my-svg .edge-pattern-solid{stroke-dasharray:0;}#my-svg .edge-thickness-invisible{stroke-width:0;fill:none;}#my-svg .edge-pattern-dashed{stroke-dasharray:3;}#my-svg .edge-pattern-dotted{stroke-dasharray:2;}#my-svg .marker{fill:#333333;stroke:#333333;}#my-svg .marker.cross{stroke:#333333;}#my-svg svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;}#my-svg p{margin:0;}#my-svg .label{font-family:"trebuchet ms",verdana,arial,sans-serif;color:#333;}#my-svg .cluster-label text{fill:#333;}#my-svg .cluster-label span{color:#333;}#my-svg .cluster-label span p{background-color:transparent;}#my-svg .label text,#my-svg span{fill:#333;color:#333;}#my-svg .node rect,#my-svg .node circle,#my-svg .node ellipse,#my-svg .node polygon,#my-svg .node path{fill:#ECECFF;stroke:#9370DB;stroke-width:1px;}#my-svg .rough-node .label text,#my-svg .node .label text,#my-svg .image-shape .label,#my-svg .icon-shape .label{text-anchor:middle;}#my-svg .node .katex path{fill:#000;stroke:#000;stroke-width:1px;}#my-svg .rough-node .label,#my-svg .node .label,#my-svg .image-shape .label,#my-svg .icon-shape .label{text-align:center;}#my-svg .node.clickable{cursor:pointer;}#my-svg .root .anchor path{fill:#333333!important;stroke-width:0;stroke:#333333;}#my-svg .arrowheadPath{fill:#333333;}#my-svg .edgePath .path{stroke:#333333;stroke-width:1px;}#my-svg .flowchart-link{stroke:#333333;fill:none;}#my-svg .edgeLabel{background-color:rgba(232,232,232, 0.8);text-align:center;}#my-svg .edgeLabel p{background-color:rgba(232,232,232, 0.8);}#my-svg .edgeLabel rect{opacity:0.5;background-color:rgba(232,232,232, 0.8);fill:rgba(232,232,232, 0.8);}#my-svg .labelBkg{background-color:rgba(232, 232, 232, 0.5);}#my-svg .cluster rect{fill:#ffffde;stroke:#aaaa33;stroke-width:1px;}#my-svg .cluster text{fill:#333;}#my-svg .cluster span{color:#333;}#my-svg div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:12px;background:hsl(80, 100%, 96.2745098039%);border:1px solid #aaaa33;border-radius:2px;pointer-events:none;z-index:100;}#my-svg .flowchartTitleText{text-anchor:middle;font-size:18px;fill:#333;}#my-svg rect.text{fill:none;stroke-width:0;}#my-svg .icon-shape,#my-svg .image-shape{background-color:rgba(232,232,232, 0.8);text-align:center;}#my-svg .icon-shape p,#my-svg .image-shape p{background-color:rgba(232,232,232, 0.8);padding:2px;}#my-svg .icon-shape .label rect,#my-svg .image-shape .label rect{opacity:0.5;background-color:rgba(232,232,232, 0.8);fill:rgba(232,232,232, 0.8);}#my-svg .label-icon{display:inline-block;height:1em;overflow:visible;vertical-align:-0.125em;}#my-svg .node .label-icon path{fill:currentColor;stroke:revert;stroke-width:revert;}#my-svg .node .neo-node{stroke:#9370DB;}#my-svg [data-look="neo"].node rect,#my-svg [data-look="neo"].cluster rect,#my-svg [data-look="neo"].node polygon{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node path{stroke:#9370DB;stroke-width:1px;}#my-svg [data-look="neo"].node .outer-path{filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node .neo-line path{stroke:#9370DB;filter:none;}#my-svg [data-look="neo"].node circle{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node circle .state-start{fill:#000000;}#my-svg [data-look="neo"].icon-shape .icon{fill:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].icon-shape .icon-neo path{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg :root{--mermaid-font-family:"trebuchet ms",verdana,arial,sans-serif;}</style><g><marker id="my-svg_flowchart-v2-pointEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="4.5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 5 L 10 10 L 10 0 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointEnd-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="11.5" refY="7" markerUnits="userSpaceOnUse" markerWidth="10.5" markerHeight="14" orient="auto"><path d="M 0 0 L 11.5 7 L 0 14 z" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointStart-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="1" refY="7" markerUnits="userSpaceOnUse" markerWidth="11.5" markerHeight="14" orient="auto"><polygon points="0,7 11.5,14 11.5,0" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="11" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-1" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleEnd-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refY="5" refX="12.25" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleStart-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-2" refY="5" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossEnd" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="12" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossStart" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="-1" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossEnd-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="17.7" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5;"/></marker><marker id="my-svg_flowchart-v2-crossStart-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="-3.5" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5; stroke-dasharray: 1, 0;"/></marker><g class="root"><g class="clusters"/><g class="edgePaths"><path d="M137.609,47L149.105,47C160.602,47,183.594,47,205.919,47C228.245,47,249.904,47,260.733,47L271.563,47" id="my-svg-L_A_B_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_A_B_0" data-points="W3sieCI6MTM3LjYwOTM3NSwieSI6NDd9LHsieCI6MjA2LjU4NTkzNzUsInkiOjQ3fSx7IngiOjI3NS41NjI1LCJ5Ijo0N31d" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M464,47L475.496,47C486.992,47,509.984,47,532.31,47C554.635,47,576.294,47,587.124,47L597.953,47" id="my-svg-L_B_C_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_B_C_0" data-points="W3sieCI6NDY0LCJ5Ijo0N30seyJ4Ijo1MzIuOTc2NTYyNSwieSI6NDd9LHsieCI6NjAxLjk1MzEyNSwieSI6NDd9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M790.391,47L800.221,47C810.052,47,829.714,47,848.708,47C867.703,47,886.031,47,895.195,47L904.359,47" id="my-svg-L_C_D_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_C_D_0" data-points="W3sieCI6NzkwLjM5MDYyNSwieSI6NDd9LHsieCI6ODQ5LjM3NSwieSI6NDd9LHsieCI6OTA4LjM1OTM3NSwieSI6NDd9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/></g><g class="edgeLabels"><g class="edgeLabel" transform="translate(206.5859375, 47)"><g class="label" data-id="L_A_B_0" transform="translate(-43.9765625, -12)"><foreignObject width="87.953125" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>addEdge 0-1</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(532.9765625, 47)"><g class="label" data-id="L_B_C_0" transform="translate(-43.9765625, -12)"><foreignObject width="87.953125" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>addEdge 1-2</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(849.375, 47)"><g class="label" data-id="L_C_D_0" transform="translate(-33.984375, -12)"><foreignObject width="67.96875" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>query 0-2</p></span></div></foreignObject></g></g></g><g class="nodes"><g class="node default" id="my-svg-flowchart-A-0" data-look="classic" transform="translate(72.8046875, 47)"><rect class="basic label-container" style="" x="-64.8046875" y="-39" width="129.609375" height="78"/><g class="label" style="" transform="translate(-34.8046875, -24)"><rect/><foreignObject width="69.609375" height="48"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>init<br />V×V zeros</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-B-1" data-look="classic" transform="translate(369.78125, 47)"><rect class="basic label-container" style="" x="-94.21875" y="-27" width="188.4375" height="54"/><g class="label" style="" transform="translate(-64.21875, -12)"><rect/><foreignObject width="128.4375" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>M[0][1]=M[1][0]=1</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-C-3" data-look="classic" transform="translate(696.171875, 47)"><rect class="basic label-container" style="" x="-94.21875" y="-27" width="188.4375" height="54"/><g class="label" style="" transform="translate(-64.21875, -12)"><rect/><foreignObject width="128.4375" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>M[1][2]=M[2][1]=1</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-D-5" data-look="classic" transform="translate(972.5703125, 47)"><rect class="basic label-container" style="" x="-64.2109375" y="-39" width="128.421875" height="78"/><g class="label" style="" transform="translate(-34.2109375, -24)"><rect/><foreignObject width="68.421875" height="48"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>M[0][2]=0<br />(no edge)</p></span></div></foreignObject></g></g></g></g></g><defs><filter id="my-svg-drop-shadow" height="130%" width="130%"><feDropShadow dx="4" dy="4" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs><defs><filter id="my-svg-drop-shadow-small" height="150%" width="150%"><feDropShadow dx="2" dy="2" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs></svg>

---

## 鄰接矩陣示意

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 140" width="320" height="140"><g font-family="sans-serif" font-size="12" text-anchor="middle"><circle cx="50" cy="70" r="18" fill="#dbeafe" stroke="#2563eb"/><text x="50" y="75">0</text><circle cx="140" cy="20" r="18" fill="#dbeafe" stroke="#2563eb"/><text x="140" y="25">1</text><circle cx="140" cy="120" r="18" fill="#dbeafe" stroke="#2563eb"/><text x="140" y="125">4</text><circle cx="230" cy="20" r="18" fill="#dbeafe" stroke="#2563eb"/><text x="230" y="25">2</text><circle cx="230" cy="120" r="18" fill="#dbeafe" stroke="#2563eb"/><text x="230" y="125">3</text><line x1="68" y1="60" x2="122" y2="28" stroke="#475569"/><line x1="68" y1="80" x2="122" y2="112" stroke="#475569"/><line x1="158" y1="20" x2="212" y2="20" stroke="#475569"/><line x1="158" y1="30" x2="212" y2="110" stroke="#475569"/><line x1="140" y1="38" x2="140" y2="102" stroke="#475569"/><line x1="230" y1="38" x2="230" y2="102" stroke="#475569"/><line x1="140" y1="102" x2="212" y2="112" stroke="#475569"/></g></svg>

> 鄰接矩陣沿對角線對稱;此圖共 5 個頂點,其鄰接矩陣為 5×5 的對稱方陣。查詢與新增邊均為 $O(1)$,但空間始終為 $O(V^2)$。

---

## 複雜度分析

| 操作 | 時間 | 空間 |
| --- | --- | --- |
| 新增邊 addEdge | $O(1)$ | $O(1)$ |
| 查詢邊 | $O(1)$ | $O(1)$ |
| 鄰居遍歷 | $O(V)$ | $O(1)$ |
| 空間合計 | — | $O(V^2)$ |

$$S = O(V^2)$$

無論邊數多少,鄰接矩陣固定佔用 $V^2$ 個整數空間,稠密圖最划算,稀疏圖則浪費嚴重。

---

## 程式碼

```cpp
class Graph {
    int V;
    vector<vector<int>> adjMatrix;

public:
    Graph(int vertices) {
        V = vertices;
        adjMatrix.resize(V, vector<int>(V, 0));
    }

    void addEdge(int u, int v) {
        if (u >= 0 && u < V && v >= 0 && v < V) {
            adjMatrix[u][v] = 1;
            adjMatrix[v][u] = 1; // undirected: symmetric
        }
    }

    void printGraph() {
        for (int i = 0; i < V; i++) {
            for (int j = 0; j < V; j++)
                cout << adjMatrix[i][j] << " ";
            cout << endl;
        }
    }
};
```

---

## 優缺點與使用時機

- 優點:邊存在查詢為 $O(1)$,實作簡單直觀。
- 優點:對稠密圖(邊數接近 $V^2$)空間利用率高。
- 缺點:空間固定 $O(V^2)$,稀疏圖浪費嚴重。
- 缺點:鄰居遍歷需掃描整列,代價 $O(V)$,不如鄰接串列的 $O(deg)$。
- 適用:稠密圖、需要 $O(1)$ 邊查詢的場景,或圖規模小且實作優先考量簡單性時。

---

## 小結

- 以 $V \times V$ 對稱矩陣表示無向圖;`adjMatrix[u][v] = adjMatrix[v][u]`。
- 邊查詢 $O(1)$;鄰居遍歷 $O(V)$;空間 $O(V^2)$。
- 稀疏圖建議改用鄰接串列以節省空間並加速遍歷。
