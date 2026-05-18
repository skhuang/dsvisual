---
marp: true
theme: default
paginate: true
math: katex
title: "快速排序法"
---

## 快速排序法

快速排序法選取一個 pivot 元素,將陣列分割成「小於 pivot」與「大於 pivot」兩部分,再對兩部分遞迴排序。平均情況 $O(n \log n)$,為最常用的通用排序演算法。

---

## 核心概念

`partition` 函式以 Lomuto 方案選取 `arr[high]` 為 pivot;使用指標 `i`(慢指標)與 `j`(快指標)。`j` 掃描時,若 `arr[j] < pivot` 則 `i++` 後交換 `arr[i]` 與 `arr[j]`。最後將 pivot 放至 `arr[i+1]`。

- divide-and-conquer:partition 後 pivot 在最終位置,左右子問題獨立。
- NOT stable:partition 的交換可改變相等元素的相對順序。
- in-place:遞迴棧空間 $O(\log n)$ 平均,$O(n)$ 最壞。

---

## 運作流程

1. 選取 `pivot = arr[high]`。
2. `i = low - 1`;掃描 `j` 從 `low` 到 `high-1`。
3. 若 `arr[j] < pivot`:先 `i++` 再交換 `arr[i]` 與 `arr[j]`。
4. 掃描結束後交換 `arr[i+1]` 與 `arr[high]`(pivot 就位),回傳 `i+1`。

<svg id="my-svg" width="100%" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="flowchart" style="max-width: 403.219px; background-color: transparent;" viewBox="0 0 403.21875 502" role="graphics-document document" aria-roledescription="flowchart-v2"><style>#my-svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;fill:#333;}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#my-svg .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#my-svg .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#my-svg .error-icon{fill:#552222;}#my-svg .error-text{fill:#552222;stroke:#552222;}#my-svg .edge-thickness-normal{stroke-width:1px;}#my-svg .edge-thickness-thick{stroke-width:3.5px;}#my-svg .edge-pattern-solid{stroke-dasharray:0;}#my-svg .edge-thickness-invisible{stroke-width:0;fill:none;}#my-svg .edge-pattern-dashed{stroke-dasharray:3;}#my-svg .edge-pattern-dotted{stroke-dasharray:2;}#my-svg .marker{fill:#333333;stroke:#333333;}#my-svg .marker.cross{stroke:#333333;}#my-svg svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;}#my-svg p{margin:0;}#my-svg .label{font-family:"trebuchet ms",verdana,arial,sans-serif;color:#333;}#my-svg .cluster-label text{fill:#333;}#my-svg .cluster-label span{color:#333;}#my-svg .cluster-label span p{background-color:transparent;}#my-svg .label text,#my-svg span{fill:#333;color:#333;}#my-svg .node rect,#my-svg .node circle,#my-svg .node ellipse,#my-svg .node polygon,#my-svg .node path{fill:#ECECFF;stroke:#9370DB;stroke-width:1px;}#my-svg .rough-node .label text,#my-svg .node .label text,#my-svg .image-shape .label,#my-svg .icon-shape .label{text-anchor:middle;}#my-svg .node .katex path{fill:#000;stroke:#000;stroke-width:1px;}#my-svg .rough-node .label,#my-svg .node .label,#my-svg .image-shape .label,#my-svg .icon-shape .label{text-align:center;}#my-svg .node.clickable{cursor:pointer;}#my-svg .root .anchor path{fill:#333333!important;stroke-width:0;stroke:#333333;}#my-svg .arrowheadPath{fill:#333333;}#my-svg .edgePath .path{stroke:#333333;stroke-width:1px;}#my-svg .flowchart-link{stroke:#333333;fill:none;}#my-svg .edgeLabel{background-color:rgba(232,232,232, 0.8);text-align:center;}#my-svg .edgeLabel p{background-color:rgba(232,232,232, 0.8);}#my-svg .edgeLabel rect{opacity:0.5;background-color:rgba(232,232,232, 0.8);fill:rgba(232,232,232, 0.8);}#my-svg .labelBkg{background-color:rgba(232, 232, 232, 0.5);}#my-svg .cluster rect{fill:#ffffde;stroke:#aaaa33;stroke-width:1px;}#my-svg .cluster text{fill:#333;}#my-svg .cluster span{color:#333;}#my-svg div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:12px;background:hsl(80, 100%, 96.2745098039%);border:1px solid #aaaa33;border-radius:2px;pointer-events:none;z-index:100;}#my-svg .flowchartTitleText{text-anchor:middle;font-size:18px;fill:#333;}#my-svg rect.text{fill:none;stroke-width:0;}#my-svg .icon-shape,#my-svg .image-shape{background-color:rgba(232,232,232, 0.8);text-align:center;}#my-svg .icon-shape p,#my-svg .image-shape p{background-color:rgba(232,232,232, 0.8);padding:2px;}#my-svg .icon-shape .label rect,#my-svg .image-shape .label rect{opacity:0.5;background-color:rgba(232,232,232, 0.8);fill:rgba(232,232,232, 0.8);}#my-svg .label-icon{display:inline-block;height:1em;overflow:visible;vertical-align:-0.125em;}#my-svg .node .label-icon path{fill:currentColor;stroke:revert;stroke-width:revert;}#my-svg .node .neo-node{stroke:#9370DB;}#my-svg [data-look="neo"].node rect,#my-svg [data-look="neo"].cluster rect,#my-svg [data-look="neo"].node polygon{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node path{stroke:#9370DB;stroke-width:1px;}#my-svg [data-look="neo"].node .outer-path{filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node .neo-line path{stroke:#9370DB;filter:none;}#my-svg [data-look="neo"].node circle{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node circle .state-start{fill:#000000;}#my-svg [data-look="neo"].icon-shape .icon{fill:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].icon-shape .icon-neo path{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg :root{--mermaid-font-family:"trebuchet ms",verdana,arial,sans-serif;}</style><g><marker id="my-svg_flowchart-v2-pointEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="4.5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 5 L 10 10 L 10 0 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointEnd-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="11.5" refY="7" markerUnits="userSpaceOnUse" markerWidth="10.5" markerHeight="14" orient="auto"><path d="M 0 0 L 11.5 7 L 0 14 z" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointStart-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="1" refY="7" markerUnits="userSpaceOnUse" markerWidth="11.5" markerHeight="14" orient="auto"><polygon points="0,7 11.5,14 11.5,0" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="11" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-1" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleEnd-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refY="5" refX="12.25" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleStart-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-2" refY="5" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossEnd" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="12" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossStart" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="-1" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossEnd-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="17.7" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5;"/></marker><marker id="my-svg_flowchart-v2-crossStart-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="-3.5" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5; stroke-dasharray: 1, 0;"/></marker><g class="root"><g class="clusters"/><g class="edgePaths"><path d="M199.563,86L199.563,90.167C199.563,94.333,199.563,102.667,199.563,110.333C199.563,118,199.563,125,199.563,128.5L199.563,132" id="my-svg-L_A_B_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_A_B_0" data-points="W3sieCI6MTk5LjU2MjUsInkiOjg2fSx7IngiOjE5OS41NjI1LCJ5IjoxMTF9LHsieCI6MTk5LjU2MjUsInkiOjEzNn1d" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M126.213,238L120.221,242.167C114.228,246.333,102.243,254.667,96.25,262.333C90.258,270,90.258,277,90.258,280.5L90.258,284" id="my-svg-L_B_C_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_B_C_0" data-points="W3sieCI6MTI2LjIxMzMwMTgwOTIxMDUyLCJ5IjoyMzh9LHsieCI6OTAuMjU3ODEyNSwieSI6MjYzfSx7IngiOjkwLjI1NzgxMjUsInkiOjI4OH1d" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M272.912,238L278.904,242.167C284.897,246.333,296.882,254.667,302.875,262.333C308.867,270,308.867,277,308.867,280.5L308.867,284" id="my-svg-L_B_D_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_B_D_0" data-points="W3sieCI6MjcyLjkxMTY5ODE5MDc4OTUsInkiOjIzOH0seyJ4IjozMDguODY3MTg3NSwieSI6MjYzfSx7IngiOjMwOC44NjcxODc1LCJ5IjoyODh9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M90.258,366L90.258,370.167C90.258,374.333,90.258,382.667,96.799,390.663C103.34,398.66,116.421,406.319,122.962,410.149L129.503,413.979" id="my-svg-L_C_E_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_C_E_0" data-points="W3sieCI6OTAuMjU3ODEyNSwieSI6MzY2fSx7IngiOjkwLjI1NzgxMjUsInkiOjM5MX0seyJ4IjoxMzIuOTU0OTU2MDU0Njg3NSwieSI6NDE2fV0=" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M308.867,366L308.867,370.167C308.867,374.333,308.867,382.667,302.326,390.663C295.785,398.66,282.704,406.319,276.163,410.149L269.622,413.979" id="my-svg-L_D_E_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_D_E_0" data-points="W3sieCI6MzA4Ljg2NzE4NzUsInkiOjM2Nn0seyJ4IjozMDguODY3MTg3NSwieSI6MzkxfSx7IngiOjI2Ni4xNzAwNDM5NDUzMTI1LCJ5Ijo0MTZ9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/></g><g class="edgeLabels"><g class="edgeLabel"><g class="label" data-id="L_A_B_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_B_C_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_B_D_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_C_E_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_D_E_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g></g><g class="nodes"><g class="node default" id="my-svg-flowchart-A-0" data-look="classic" transform="translate(199.5625, 47)"><rect class="basic label-container" style="" x="-92.953125" y="-39" width="185.90625" height="78"/><g class="label" style="" transform="translate(-62.953125, -24)"><rect/><foreignObject width="125.90625" height="48"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>quickSort(arr,0,5)<br />pivot=arr[5]</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-B-1" data-look="classic" transform="translate(199.5625, 187)"><rect class="basic label-container" style="" x="-130" y="-51" width="260" height="102"/><g class="label" style="" transform="translate(-100, -36)"><rect/><foreignObject width="200" height="72"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table; white-space: break-spaces; line-height: 1.5; max-width: 200px; text-align: center; width: 200px;"><span class="nodeLabel"><p>partition:<br />elements &lt; pivot | pivot | elements &gt; pivot</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-C-3" data-look="classic" transform="translate(90.2578125, 327)"><rect class="basic label-container" style="" x="-82.2578125" y="-39" width="164.515625" height="78"/><g class="label" style="" transform="translate(-52.2578125, -24)"><rect/><foreignObject width="104.515625" height="48"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>quickSort(left)<br />recurse</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-D-5" data-look="classic" transform="translate(308.8671875, 327)"><rect class="basic label-container" style="" x="-86.3515625" y="-39" width="172.703125" height="78"/><g class="label" style="" transform="translate(-56.3515625, -24)"><rect/><foreignObject width="112.703125" height="48"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>quickSort(right)<br />recurse</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-E-7" data-look="classic" transform="translate(199.5625, 455)"><rect class="basic label-container" style="" x="-87.6484375" y="-39" width="175.296875" height="78"/><g class="label" style="" transform="translate(-57.6484375, -24)"><rect/><foreignObject width="115.296875" height="48"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>base: low&gt;=high<br />return</p></span></div></foreignObject></g></g></g></g></g><defs><filter id="my-svg-drop-shadow" height="130%" width="130%"><feDropShadow dx="4" dy="4" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs><defs><filter id="my-svg-drop-shadow-small" height="150%" width="150%"><feDropShadow dx="2" dy="2" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs></svg>

---

## partition 示意

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 90" width="380" height="90"><g font-family="sans-serif" font-size="12"><rect x="10" y="30" width="50" height="30" fill="#dcfce7" stroke="#16a34a"/><rect x="60" y="30" width="50" height="30" fill="#dcfce7" stroke="#16a34a"/><rect x="110" y="30" width="50" height="30" fill="#dcfce7" stroke="#16a34a"/><rect x="160" y="30" width="50" height="30" fill="#fef9c3" stroke="#ca8a04" stroke-width="2"/><rect x="210" y="30" width="50" height="30" fill="#fee2e2" stroke="#dc2626"/><rect x="260" y="30" width="50" height="30" fill="#fee2e2" stroke="#dc2626"/><text x="35" y="50" text-anchor="middle">1</text><text x="85" y="50" text-anchor="middle">5</text><text x="135" y="50" text-anchor="middle">7</text><text x="185" y="50" text-anchor="middle">10</text><text x="235" y="50" text-anchor="middle">11</text><text x="285" y="50" text-anchor="middle">12</text><text x="185" y="22" text-anchor="middle" fill="#ca8a04">pivot=10</text><text x="65" y="78" text-anchor="middle" fill="#16a34a">&lt; pivot</text><text x="245" y="78" text-anchor="middle" fill="#dc2626">&gt;= pivot</text></g></svg>

> partition 結束後 pivot=10 落在最終位置(index 3);綠色區域 [1,5,7] 均 < 10,紅色區域 [11,12] 均 > 10。兩區域再各自遞迴排序。

---

## 複雜度分析

| 情況 | 時間複雜度 | 空間複雜度(棧) |
| --- | --- | --- |
| 最佳(每次均分) | $O(n \log n)$ | $O(\log n)$ |
| 平均 | $O(n \log n)$ | $O(\log n)$ |
| 最壞(已排序/逆序) | $O(n^2)$ | $O(n)$ |
| NOT stable / in-place | — | 輔助 $O(\log n)$ 平均 |

$$T_{\text{avg}}(n) = 2T\!\left(\frac{n}{2}\right) + O(n) = O(n \log n)$$

每次 partition 均分時遞迴深度 $\log n$,每層線性掃描,總計 $O(n \log n)$。最壞情況(pivot 每次選到最大/最小值)退化為 $O(n^2)$。

---

## 程式碼

```cpp
int partition(int arr[], int low, int high) {
    int pivot = arr[high]; // Lomuto: last element as pivot
    int i = low - 1;
    for (int j = low; j < high; j++) {
        if (arr[j] < pivot) {
            i++;
            swap(arr[i], arr[j]);
        }
    }
    swap(arr[i + 1], arr[high]); // place pivot
    return i + 1;
}

void quickSort(int arr[], int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}
```

---

## 優缺點與使用時機

- 優點:平均 $O(n \log n)$,快取友善,實際最快的通用排序之一。
- 優點:in-place,記憶體開銷低於 Merge Sort。
- 缺點:最壞 $O(n^2)$(已排序輸入+固定選 pivot);需隨機化或三數中值選 pivot 改善。
- 缺點:NOT stable。
- 適用:通用陣列排序;C++ `std::sort` 通常採用 Introsort(Quick+Heap 混合)。

---

## 小結

- pivot 分割 + 遞迴排序;平均 $O(n \log n)$,最壞 $O(n^2)$。
- NOT stable;in-place(棧空間 $O(\log n)$ 平均)。
- 實際最快通用排序;隨機化選 pivot 可將最壞情況出現機率降至極低。
