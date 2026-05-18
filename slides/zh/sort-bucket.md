---
marp: true
theme: default
paginate: true
math: katex
title: "桶排序法"
---

## 桶排序法

桶排序法將輸入元素依其值域分散至若干「桶」中,對各桶個別排序後再依序串接。當輸入均勻分佈時,平均時間複雜度達 $O(n+k)$,其中 $k$ 為桶數。

---

## 核心概念

建立 $n$ 個桶,將 $[0,1)$ 的浮點數以 `bucketIndex = floor(n * arr[i])` 分配。各桶以 Insertion Sort(或 `std::sort`)排序,最後按桶序串接回原陣列。

- 元素均勻分佈時,每桶平均含 $O(1)$ 個元素,各桶排序 $O(1)$,整體 $O(n)$。
- 最壞情況:所有元素落入同一桶,退化為 $O(n^2)$(取決於桶內排序)。
- NOT in-place:需 $O(n+k)$ 額外空間存放桶結構。

---

## 運作流程

1. 建立 $n$ 個空桶。
2. 遍歷陣列,計算 `bucketIndex = (int)(n * arr[i])`,將元素推入對應桶。
3. 對每個桶內的元素排序(如 Insertion Sort)。
4. 依桶序串接所有元素回原陣列。

<svg id="my-svg" width="100%" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="flowchart" style="max-width: 1071.48px; background-color: transparent;" viewBox="0 0 1071.484375 398" role="graphics-document document" aria-roledescription="flowchart-v2"><style>#my-svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;fill:#333;}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#my-svg .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#my-svg .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#my-svg .error-icon{fill:#552222;}#my-svg .error-text{fill:#552222;stroke:#552222;}#my-svg .edge-thickness-normal{stroke-width:1px;}#my-svg .edge-thickness-thick{stroke-width:3.5px;}#my-svg .edge-pattern-solid{stroke-dasharray:0;}#my-svg .edge-thickness-invisible{stroke-width:0;fill:none;}#my-svg .edge-pattern-dashed{stroke-dasharray:3;}#my-svg .edge-pattern-dotted{stroke-dasharray:2;}#my-svg .marker{fill:#333333;stroke:#333333;}#my-svg .marker.cross{stroke:#333333;}#my-svg svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;}#my-svg p{margin:0;}#my-svg .label{font-family:"trebuchet ms",verdana,arial,sans-serif;color:#333;}#my-svg .cluster-label text{fill:#333;}#my-svg .cluster-label span{color:#333;}#my-svg .cluster-label span p{background-color:transparent;}#my-svg .label text,#my-svg span{fill:#333;color:#333;}#my-svg .node rect,#my-svg .node circle,#my-svg .node ellipse,#my-svg .node polygon,#my-svg .node path{fill:#ECECFF;stroke:#9370DB;stroke-width:1px;}#my-svg .rough-node .label text,#my-svg .node .label text,#my-svg .image-shape .label,#my-svg .icon-shape .label{text-anchor:middle;}#my-svg .node .katex path{fill:#000;stroke:#000;stroke-width:1px;}#my-svg .rough-node .label,#my-svg .node .label,#my-svg .image-shape .label,#my-svg .icon-shape .label{text-align:center;}#my-svg .node.clickable{cursor:pointer;}#my-svg .root .anchor path{fill:#333333!important;stroke-width:0;stroke:#333333;}#my-svg .arrowheadPath{fill:#333333;}#my-svg .edgePath .path{stroke:#333333;stroke-width:1px;}#my-svg .flowchart-link{stroke:#333333;fill:none;}#my-svg .edgeLabel{background-color:rgba(232,232,232, 0.8);text-align:center;}#my-svg .edgeLabel p{background-color:rgba(232,232,232, 0.8);}#my-svg .edgeLabel rect{opacity:0.5;background-color:rgba(232,232,232, 0.8);fill:rgba(232,232,232, 0.8);}#my-svg .labelBkg{background-color:rgba(232, 232, 232, 0.5);}#my-svg .cluster rect{fill:#ffffde;stroke:#aaaa33;stroke-width:1px;}#my-svg .cluster text{fill:#333;}#my-svg .cluster span{color:#333;}#my-svg div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:12px;background:hsl(80, 100%, 96.2745098039%);border:1px solid #aaaa33;border-radius:2px;pointer-events:none;z-index:100;}#my-svg .flowchartTitleText{text-anchor:middle;font-size:18px;fill:#333;}#my-svg rect.text{fill:none;stroke-width:0;}#my-svg .icon-shape,#my-svg .image-shape{background-color:rgba(232,232,232, 0.8);text-align:center;}#my-svg .icon-shape p,#my-svg .image-shape p{background-color:rgba(232,232,232, 0.8);padding:2px;}#my-svg .icon-shape .label rect,#my-svg .image-shape .label rect{opacity:0.5;background-color:rgba(232,232,232, 0.8);fill:rgba(232,232,232, 0.8);}#my-svg .label-icon{display:inline-block;height:1em;overflow:visible;vertical-align:-0.125em;}#my-svg .node .label-icon path{fill:currentColor;stroke:revert;stroke-width:revert;}#my-svg .node .neo-node{stroke:#9370DB;}#my-svg [data-look="neo"].node rect,#my-svg [data-look="neo"].cluster rect,#my-svg [data-look="neo"].node polygon{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node path{stroke:#9370DB;stroke-width:1px;}#my-svg [data-look="neo"].node .outer-path{filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node .neo-line path{stroke:#9370DB;filter:none;}#my-svg [data-look="neo"].node circle{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node circle .state-start{fill:#000000;}#my-svg [data-look="neo"].icon-shape .icon{fill:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].icon-shape .icon-neo path{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg :root{--mermaid-font-family:"trebuchet ms",verdana,arial,sans-serif;}</style><g><marker id="my-svg_flowchart-v2-pointEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="4.5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 5 L 10 10 L 10 0 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointEnd-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="11.5" refY="7" markerUnits="userSpaceOnUse" markerWidth="10.5" markerHeight="14" orient="auto"><path d="M 0 0 L 11.5 7 L 0 14 z" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointStart-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="1" refY="7" markerUnits="userSpaceOnUse" markerWidth="11.5" markerHeight="14" orient="auto"><polygon points="0,7 11.5,14 11.5,0" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="11" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-1" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleEnd-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refY="5" refX="12.25" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleStart-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-2" refY="5" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossEnd" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="12" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossStart" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="-1" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossEnd-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="17.7" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5;"/></marker><marker id="my-svg_flowchart-v2-crossStart-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="-3.5" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5; stroke-dasharray: 1, 0;"/></marker><g class="root"><g class="clusters"/><g class="edgePaths"><path d="M171.791,160L190.407,141.167C209.022,122.333,246.253,84.667,268.369,65.833C290.484,47,297.484,47,300.984,47L304.484,47" id="my-svg-L_A_B_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_A_B_0" data-points="W3sieCI6MTcxLjc5MTE2OTgxOTA3ODk2LCJ5IjoxNjB9LHsieCI6MjgzLjQ4NDM3NSwieSI6NDd9LHsieCI6MzA4LjQ4NDM3NSwieSI6NDd9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M258.484,199L262.651,199C266.818,199,275.151,199,282.818,199C290.484,199,297.484,199,300.984,199L304.484,199" id="my-svg-L_A_C_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_A_C_0" data-points="W3sieCI6MjU4LjQ4NDM3NSwieSI6MTk5fSx7IngiOjI4My40ODQzNzUsInkiOjE5OX0seyJ4IjozMDguNDg0Mzc1LCJ5IjoxOTl9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M171.791,238L190.407,256.833C209.022,275.667,246.253,313.333,268.608,332.167C290.964,351,298.443,351,302.182,351L305.922,351" id="my-svg-L_A_D_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_A_D_0" data-points="W3sieCI6MTcxLjc5MTE2OTgxOTA3ODk2LCJ5IjoyMzh9LHsieCI6MjgzLjQ4NDM3NSwieSI6MzUxfSx7IngiOjMwOS45MjE4NzUsInkiOjM1MX1d" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M522.266,351L526.672,351C531.078,351,539.891,351,547.797,351C555.703,351,562.703,351,566.203,351L569.703,351" id="my-svg-L_D_E_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_D_E_0" data-points="W3sieCI6NTIyLjI2NTYyNSwieSI6MzUxfSx7IngiOjU0OC43MDMxMjUsInkiOjM1MX0seyJ4Ijo1NzMuNzAzMTI1LCJ5IjozNTF9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M753.484,351L757.651,351C761.818,351,770.151,351,777.818,351C785.484,351,792.484,351,795.984,351L799.484,351" id="my-svg-L_E_F_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_E_F_0" data-points="W3sieCI6NzUzLjQ4NDM3NSwieSI6MzUxfSx7IngiOjc3OC40ODQzNzUsInkiOjM1MX0seyJ4Ijo4MDMuNDg0Mzc1LCJ5IjozNTF9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/></g><g class="edgeLabels"><g class="edgeLabel"><g class="label" data-id="L_A_B_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_A_C_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_A_D_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_D_E_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_E_F_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g></g><g class="nodes"><g class="node default" id="my-svg-flowchart-A-0" data-look="classic" transform="translate(133.2421875, 199)"><rect class="basic label-container" style="" x="-125.2421875" y="-39" width="250.484375" height="78"/><g class="label" style="" transform="translate(-95.2421875, -24)"><rect/><foreignObject width="190.484375" height="48"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>[0.78,0.17,0.39,0.26,0.72]<br />n=5 buckets</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-B-1" data-look="classic" transform="translate(416.09375, 47)"><rect class="basic label-container" style="" x="-107.609375" y="-39" width="215.21875" height="78"/><g class="label" style="" transform="translate(-77.609375, -24)"><rect/><foreignObject width="155.21875" height="48"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>bucket 0: [0.17]<br />bucket 1: [0.17] done</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-C-3" data-look="classic" transform="translate(416.09375, 199)"><rect class="basic label-container" style="" x="-107.609375" y="-63" width="215.21875" height="126"/><g class="label" style="" transform="translate(-77.609375, -48)"><rect/><foreignObject width="155.21875" height="96"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>bucket 1: [0.17]<br />bucket 2: [0.26]<br />bucket 3: [0.39]<br />bucket 3: [0.39] done</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-D-5" data-look="classic" transform="translate(416.09375, 351)"><rect class="basic label-container" style="" x="-106.171875" y="-39" width="212.34375" height="78"/><g class="label" style="" transform="translate(-76.171875, -24)"><rect/><foreignObject width="152.34375" height="48"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>bucket 3: [0.39]<br />bucket 7: [0.72,0.78]</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-E-7" data-look="classic" transform="translate(663.59375, 351)"><rect class="basic label-container" style="" x="-89.890625" y="-27" width="179.78125" height="54"/><g class="label" style="" transform="translate(-59.890625, -12)"><rect/><foreignObject width="119.78125" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>sort each bucket</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-F-9" data-look="classic" transform="translate(933.484375, 351)"><rect class="basic label-container" style="" x="-130" y="-39" width="260" height="78"/><g class="label" style="" transform="translate(-100, -24)"><rect/><foreignObject width="200" height="48"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table; white-space: break-spaces; line-height: 1.5; max-width: 200px; text-align: center; width: 200px;"><span class="nodeLabel"><p>concat: [0.17,0.26,0.39,0.72,0.78]</p></span></div></foreignObject></g></g></g></g></g><defs><filter id="my-svg-drop-shadow" height="130%" width="130%"><feDropShadow dx="4" dy="4" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs><defs><filter id="my-svg-drop-shadow-small" height="150%" width="150%"><feDropShadow dx="2" dy="2" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs></svg>

---

## 桶分配示意

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 100" width="380" height="100"><g font-family="sans-serif" font-size="11"><rect x="10" y="20" width="50" height="60" fill="#f1f5f9" stroke="#94a3b8"/><rect x="70" y="20" width="50" height="60" fill="#f1f5f9" stroke="#94a3b8"/><rect x="130" y="20" width="50" height="60" fill="#dbeafe" stroke="#2563eb"/><rect x="190" y="20" width="50" height="60" fill="#f1f5f9" stroke="#94a3b8"/><rect x="250" y="20" width="50" height="60" fill="#fef9c3" stroke="#ca8a04"/><text x="35" y="14" text-anchor="middle" fill="#64748b">[0.0)</text><text x="95" y="14" text-anchor="middle" fill="#64748b">[0.2)</text><text x="155" y="14" text-anchor="middle" fill="#64748b">[0.4)</text><text x="215" y="14" text-anchor="middle" fill="#64748b">[0.6)</text><text x="275" y="14" text-anchor="middle" fill="#64748b">[0.8)</text><text x="35" y="55" text-anchor="middle">—</text><text x="95" y="48" text-anchor="middle">0.17</text><text x="95" y="64" text-anchor="middle">0.26</text><text x="155" y="55" text-anchor="middle">0.39</text><text x="215" y="55" text-anchor="middle">—</text><text x="275" y="48" text-anchor="middle">0.72</text><text x="275" y="64" text-anchor="middle">0.78</text><text x="320" y="55" fill="#64748b">→ sort →</text></g></svg>

> 5 個桶各覆蓋 0.2 的值域;0.17 和 0.26 落入第 0–1 桶,各桶分別排序後串接即得有序陣列。

---

## 複雜度分析

| 情況 | 時間複雜度 | 空間複雜度 |
| --- | --- | --- |
| 最佳/平均(均勻分佈) | $O(n+k)$ | $O(n+k)$ |
| 最壞(全部落入一桶) | $O(n^2)$ | $O(n+k)$ |
| stable(取決於桶內排序) | — | 輔助空間 $O(n+k)$ |

$$T_{\text{avg}}(n,k) = O(n) + k \cdot O\!\left(\frac{n}{k}\right)^2 = O\!\left(n + \frac{n^2}{k}\right)$$

均勻分佈時每桶期望 $n/k$ 個元素,各桶 Insertion Sort 為 $O((n/k)^2)$;取 $k=n$ 使平均降至 $O(n)$。

---

## 程式碼

```cpp
void bucketSort(vector<float>& arr) {
    int n = arr.size();
    if (n <= 0) return;
    // Create n empty buckets
    vector<vector<float>> buckets(n);
    // Distribute elements into buckets
    for (int i = 0; i < n; i++) {
        int bi = (int)(n * arr[i]);
        if (bi >= n) bi = n - 1;
        buckets[bi].push_back(arr[i]);
    }
    // Sort individual buckets
    for (int i = 0; i < n; i++)
        sort(buckets[i].begin(), buckets[i].end());
    // Concatenate back
    int index = 0;
    for (int i = 0; i < n; i++)
        for (float x : buckets[i])
            arr[index++] = x;
}
```

---

## 優缺點與使用時機

- 優點:均勻分佈時達 $O(n+k)$,優於比較排序的 $O(n \log n)$ 下界。
- 優點:可平行化:各桶獨立排序。
- 缺點:效能高度依賴輸入分佈;非均勻時退化至 $O(n^2)$。
- 缺點:需要 $O(n+k)$ 額外空間。
- 適用:浮點數均勻分佈在 $[0,1)$ 的場景,如隨機數排序、分佈式系統。

---

## 小結

- 分散 + 桶內排序 + 串接;非比較排序。
- 均勻輸入平均 $O(n+k)$;最壞 $O(n^2)$。
- 最適合值域已知且近乎均勻分佈的浮點數排序。
