---
marp: true
theme: default
paginate: true
math: katex
title: "布隆過濾器"
category: "Hash & Probabilistic"
---

## 布隆過濾器

布隆過濾器是一種空間效率極高的機率型集合,用來測試「某元素是否屬於集合」。它可能回報誤判存在(false positive),但絕不會漏判(false negative)。

---

## 核心概念

結構是一個 $m$ 位元的位元陣列加上 $k$ 個獨立雜湊函式。插入元素時把 $k$ 個雜湊位置設為 1;查詢時檢查那 $k$ 個位置是否全為 1。

- $k$ 個位元全為 1 → 「可能存在」,也可能是其他元素恰好湊齊。
- 任一位元為 0 → 「絕對不存在」。
- 不支援刪除:清除位元會誤傷共用該位元的其他元素。

---

## 運作流程

1. 插入 $x$:計算 $h_1(x)$、$h_2(x)$、$h_3(x)$,把這 3 個位元設為 1。
2. 查詢 $y$:計算 $y$ 的 3 個雜湊位置。
3. 3 個位元全為 1 回報「可能存在」;任一為 0 回報「絕對不存在」。

<svg id="my-svg" width="100%" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="flowchart" style="max-width: 458.078px; background-color: transparent;" viewBox="0 0 458.078125 382" role="graphics-document document" aria-roledescription="flowchart-v2"><style>#my-svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;fill:#333;}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#my-svg .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#my-svg .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#my-svg .error-icon{fill:#552222;}#my-svg .error-text{fill:#552222;stroke:#552222;}#my-svg .edge-thickness-normal{stroke-width:1px;}#my-svg .edge-thickness-thick{stroke-width:3.5px;}#my-svg .edge-pattern-solid{stroke-dasharray:0;}#my-svg .edge-thickness-invisible{stroke-width:0;fill:none;}#my-svg .edge-pattern-dashed{stroke-dasharray:3;}#my-svg .edge-pattern-dotted{stroke-dasharray:2;}#my-svg .marker{fill:#333333;stroke:#333333;}#my-svg .marker.cross{stroke:#333333;}#my-svg svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;}#my-svg p{margin:0;}#my-svg .label{font-family:"trebuchet ms",verdana,arial,sans-serif;color:#333;}#my-svg .cluster-label text{fill:#333;}#my-svg .cluster-label span{color:#333;}#my-svg .cluster-label span p{background-color:transparent;}#my-svg .label text,#my-svg span{fill:#333;color:#333;}#my-svg .node rect,#my-svg .node circle,#my-svg .node ellipse,#my-svg .node polygon,#my-svg .node path{fill:#ECECFF;stroke:#9370DB;stroke-width:1px;}#my-svg .rough-node .label text,#my-svg .node .label text,#my-svg .image-shape .label,#my-svg .icon-shape .label{text-anchor:middle;}#my-svg .node .katex path{fill:#000;stroke:#000;stroke-width:1px;}#my-svg .rough-node .label,#my-svg .node .label,#my-svg .image-shape .label,#my-svg .icon-shape .label{text-align:center;}#my-svg .node.clickable{cursor:pointer;}#my-svg .root .anchor path{fill:#333333!important;stroke-width:0;stroke:#333333;}#my-svg .arrowheadPath{fill:#333333;}#my-svg .edgePath .path{stroke:#333333;stroke-width:1px;}#my-svg .flowchart-link{stroke:#333333;fill:none;}#my-svg .edgeLabel{background-color:rgba(232,232,232, 0.8);text-align:center;}#my-svg .edgeLabel p{background-color:rgba(232,232,232, 0.8);}#my-svg .edgeLabel rect{opacity:0.5;background-color:rgba(232,232,232, 0.8);fill:rgba(232,232,232, 0.8);}#my-svg .labelBkg{background-color:rgba(232, 232, 232, 0.5);}#my-svg .cluster rect{fill:#ffffde;stroke:#aaaa33;stroke-width:1px;}#my-svg .cluster text{fill:#333;}#my-svg .cluster span{color:#333;}#my-svg div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:12px;background:hsl(80, 100%, 96.2745098039%);border:1px solid #aaaa33;border-radius:2px;pointer-events:none;z-index:100;}#my-svg .flowchartTitleText{text-anchor:middle;font-size:18px;fill:#333;}#my-svg rect.text{fill:none;stroke-width:0;}#my-svg .icon-shape,#my-svg .image-shape{background-color:rgba(232,232,232, 0.8);text-align:center;}#my-svg .icon-shape p,#my-svg .image-shape p{background-color:rgba(232,232,232, 0.8);padding:2px;}#my-svg .icon-shape .label rect,#my-svg .image-shape .label rect{opacity:0.5;background-color:rgba(232,232,232, 0.8);fill:rgba(232,232,232, 0.8);}#my-svg .label-icon{display:inline-block;height:1em;overflow:visible;vertical-align:-0.125em;}#my-svg .node .label-icon path{fill:currentColor;stroke:revert;stroke-width:revert;}#my-svg .node .neo-node{stroke:#9370DB;}#my-svg [data-look="neo"].node rect,#my-svg [data-look="neo"].cluster rect,#my-svg [data-look="neo"].node polygon{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node path{stroke:#9370DB;stroke-width:1px;}#my-svg [data-look="neo"].node .outer-path{filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node .neo-line path{stroke:#9370DB;filter:none;}#my-svg [data-look="neo"].node circle{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node circle .state-start{fill:#000000;}#my-svg [data-look="neo"].icon-shape .icon{fill:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].icon-shape .icon-neo path{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg :root{--mermaid-font-family:"trebuchet ms",verdana,arial,sans-serif;}</style><g><marker id="my-svg_flowchart-v2-pointEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="4.5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 5 L 10 10 L 10 0 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointEnd-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="11.5" refY="7" markerUnits="userSpaceOnUse" markerWidth="10.5" markerHeight="14" orient="auto"><path d="M 0 0 L 11.5 7 L 0 14 z" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointStart-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="1" refY="7" markerUnits="userSpaceOnUse" markerWidth="11.5" markerHeight="14" orient="auto"><polygon points="0,7 11.5,14 11.5,0" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="11" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-1" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleEnd-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refY="5" refX="12.25" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleStart-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-2" refY="5" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossEnd" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="12" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossStart" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="-1" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossEnd-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="17.7" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5;"/></marker><marker id="my-svg_flowchart-v2-crossStart-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="-3.5" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5; stroke-dasharray: 1, 0;"/></marker><g class="root"><g class="clusters"/><g class="edgePaths"><path d="M218.777,62L218.777,66.167C218.777,70.333,218.777,78.667,218.777,86.333C218.777,94,218.777,101,218.777,104.5L218.777,108" id="my-svg-L_A_B_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_A_B_0" data-points="W3sieCI6MjE4Ljc3NzM0Mzc1LCJ5Ijo2Mn0seyJ4IjoyMTguNzc3MzQzNzUsInkiOjg3fSx7IngiOjIxOC43NzczNDM3NSwieSI6MTEyfV0=" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M218.777,166L218.777,170.167C218.777,174.333,218.777,182.667,218.777,190.333C218.777,198,218.777,205,218.777,208.5L218.777,212" id="my-svg-L_B_C_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_B_C_0" data-points="W3sieCI6MjE4Ljc3NzM0Mzc1LCJ5IjoxNjZ9LHsieCI6MjE4Ljc3NzM0Mzc1LCJ5IjoxOTF9LHsieCI6MjE4Ljc3NzM0Mzc1LCJ5IjoyMTZ9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M154.902,270L145.044,274.167C135.187,278.333,115.472,286.667,105.615,294.333C95.758,302,95.758,309,95.758,312.5L95.758,316" id="my-svg-L_C_D_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_C_D_0" data-points="W3sieCI6MTU0LjkwMTgxNzkwODY1Mzg0LCJ5IjoyNzB9LHsieCI6OTUuNzU3ODEyNSwieSI6Mjk1fSx7IngiOjk1Ljc1NzgxMjUsInkiOjMyMH1d" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M282.653,270L292.51,274.167C302.368,278.333,322.082,286.667,331.94,294.333C341.797,302,341.797,309,341.797,312.5L341.797,316" id="my-svg-L_C_E_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_C_E_0" data-points="W3sieCI6MjgyLjY1Mjg2OTU5MTM0NjEzLCJ5IjoyNzB9LHsieCI6MzQxLjc5Njg3NSwieSI6Mjk1fSx7IngiOjM0MS43OTY4NzUsInkiOjMyMH1d" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/></g><g class="edgeLabels"><g class="edgeLabel"><g class="label" data-id="L_A_B_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_B_C_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_C_D_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_C_E_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g></g><g class="nodes"><g class="node default" id="my-svg-flowchart-A-0" data-look="classic" transform="translate(218.77734375, 35)"><rect class="basic label-container" style="" x="-56.6015625" y="-27" width="113.203125" height="54"/><g class="label" style="" transform="translate(-26.6015625, -12)"><rect/><foreignObject width="53.203125" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>query y</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-B-1" data-look="classic" transform="translate(218.77734375, 139)"><rect class="basic label-container" style="" x="-94.1875" y="-27" width="188.375" height="54"/><g class="label" style="" transform="translate(-64.1875, -12)"><rect/><foreignObject width="128.375" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>compute h1 h2 h3</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-C-3" data-look="classic" transform="translate(218.77734375, 243)"><rect class="basic label-container" style="" x="-77.234375" y="-27" width="154.46875" height="54"/><g class="label" style="" transform="translate(-47.234375, -12)"><rect/><foreignObject width="94.46875" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>all 3 bits = 1?</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-D-5" data-look="classic" transform="translate(95.7578125, 347)"><rect class="basic label-container" style="" x="-87.7578125" y="-27" width="175.515625" height="54"/><g class="label" style="" transform="translate(-57.7578125, -12)"><rect/><foreignObject width="115.515625" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>possibly present</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-E-7" data-look="classic" transform="translate(341.796875, 347)"><rect class="basic label-container" style="" x="-108.28125" y="-27" width="216.5625" height="54"/><g class="label" style="" transform="translate(-78.28125, -12)"><rect/><foreignObject width="156.5625" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>definitely not present</p></span></div></foreignObject></g></g></g></g></g><defs><filter id="my-svg-drop-shadow" height="130%" width="130%"><feDropShadow dx="4" dy="4" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs><defs><filter id="my-svg-drop-shadow-small" height="150%" width="150%"><feDropShadow dx="2" dy="2" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs></svg>

---

## 示意圖

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 70" width="360"><g font-family="monospace" font-size="12"><text x="0" y="16">insert "dog" sets bits 4, 17, 29</text><rect x="0" y="28" width="352" height="24" fill="none" stroke="#cbd5e1"/><rect x="44" y="28" width="22" height="24" fill="#dbeafe" stroke="#3b82f6"/><rect x="187" y="28" width="22" height="24" fill="#dbeafe" stroke="#3b82f6"/><rect x="319" y="28" width="22" height="24" fill="#dbeafe" stroke="#3b82f6"/></g></svg>

> visualizer 以 32 格位元陣列呈現;Insert 把 3 個雜湊位元點亮,Query 高亮被檢查的 3 格並回報結果。

---

## 複雜度分析

| 項目 | 複雜度 |
| --- | --- |
| 插入 / 查詢時間 | $O(k)$ |
| 空間 | $O(m)$ 位元 |
| 漏判(false negative) | 不可能 |

$$P_{\text{fp}} \approx \left(1 - e^{-kn/m}\right)^k$$

誤判率隨已插入元素數 $n$ 上升;在固定 $m$ 下存在最佳的 $k$。

---

## 程式碼

```cpp
void insert(const std::string& key) {
    bits[hash1(key)] = true;
    bits[hash2(key)] = true;
    bits[hash3(key)] = true;
}

bool possiblyContains(const std::string& key) const {
    return bits[hash1(key)] && bits[hash2(key)] && bits[hash3(key)];
}
```

---

## 優缺點與使用時機

- 優點:空間遠小於儲存完整元素集合。
- 優點:插入與查詢皆為固定時間 $O(k)$。
- 缺點:有誤判,且無法刪除元素。
- 適用:快取前置過濾、去重、判斷「絕對沒看過」的場景。

---

## 小結

- 位元陣列加多個雜湊函式構成的機率型集合。
- 「絕對不存在」可信;「可能存在」需容忍誤判。
- 以準確度換取極小的空間佔用。
