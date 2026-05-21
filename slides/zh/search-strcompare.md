---
marp: true
theme: default
paginate: true
math: katex
title: "字串比對演算法比較"
category: "Searching & String Matching"
---

## 字串比對演算法比較

KMP、Boyer-Moore 與 Rabin-Karp 三種演算法均解決精確字串比對問題，但在保證上界、實際速度與空間使用上各有取捨；本頁並排呈現三者差異。

---

## 核心概念

三種演算法各有一個核心預處理概念：KMP 的 failure function 確保線性；BM 的跳移啟發在實際文字中實現次線性；RK 的滾動雜湊以 $O(1)$ 空間達到平均線性。

- KMP：LPS（failure function）—— 保證線性時間，文字指標永不後退。
- BM：壞字元 + 好後綴啟發 —— 實際次線性，大型字母表最快。
- RK：滾動雜湊 —— 平均線性，空間 $O(1)$，天然支援多模式。

---

## 運作流程

1. **初始化**：visualizer 以相同文字 `ABABDABACDABABCABAB` 與模式 `ABABCABAB` 同步啟動三個比對窗格。
2. **逐步推進**：每按一次「下一步」，三個演算法各前進一個邏輯步驟，各自的比對計數器分別累計。
3. **完成比較**：某個演算法先找到所有匹配後停止；visualizer 顯示各自的比對次數供比較。

<svg id="my-svg" width="100%" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="flowchart" style="max-width: 661.984px; background-color: transparent;" viewBox="0 0 661.984375 302" role="graphics-document document" aria-roledescription="flowchart-v2"><style>#my-svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;fill:#333;}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#my-svg .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#my-svg .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#my-svg .error-icon{fill:#552222;}#my-svg .error-text{fill:#552222;stroke:#552222;}#my-svg .edge-thickness-normal{stroke-width:1px;}#my-svg .edge-thickness-thick{stroke-width:3.5px;}#my-svg .edge-pattern-solid{stroke-dasharray:0;}#my-svg .edge-thickness-invisible{stroke-width:0;fill:none;}#my-svg .edge-pattern-dashed{stroke-dasharray:3;}#my-svg .edge-pattern-dotted{stroke-dasharray:2;}#my-svg .marker{fill:#333333;stroke:#333333;}#my-svg .marker.cross{stroke:#333333;}#my-svg svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;}#my-svg p{margin:0;}#my-svg .label{font-family:"trebuchet ms",verdana,arial,sans-serif;color:#333;}#my-svg .cluster-label text{fill:#333;}#my-svg .cluster-label span{color:#333;}#my-svg .cluster-label span p{background-color:transparent;}#my-svg .label text,#my-svg span{fill:#333;color:#333;}#my-svg .node rect,#my-svg .node circle,#my-svg .node ellipse,#my-svg .node polygon,#my-svg .node path{fill:#ECECFF;stroke:#9370DB;stroke-width:1px;}#my-svg .rough-node .label text,#my-svg .node .label text,#my-svg .image-shape .label,#my-svg .icon-shape .label{text-anchor:middle;}#my-svg .node .katex path{fill:#000;stroke:#000;stroke-width:1px;}#my-svg .rough-node .label,#my-svg .node .label,#my-svg .image-shape .label,#my-svg .icon-shape .label{text-align:center;}#my-svg .node.clickable{cursor:pointer;}#my-svg .root .anchor path{fill:#333333!important;stroke-width:0;stroke:#333333;}#my-svg .arrowheadPath{fill:#333333;}#my-svg .edgePath .path{stroke:#333333;stroke-width:1px;}#my-svg .flowchart-link{stroke:#333333;fill:none;}#my-svg .edgeLabel{background-color:rgba(232,232,232, 0.8);text-align:center;}#my-svg .edgeLabel p{background-color:rgba(232,232,232, 0.8);}#my-svg .edgeLabel rect{opacity:0.5;background-color:rgba(232,232,232, 0.8);fill:rgba(232,232,232, 0.8);}#my-svg .labelBkg{background-color:rgba(232, 232, 232, 0.5);}#my-svg .cluster rect{fill:#ffffde;stroke:#aaaa33;stroke-width:1px;}#my-svg .cluster text{fill:#333;}#my-svg .cluster span{color:#333;}#my-svg div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:12px;background:hsl(80, 100%, 96.2745098039%);border:1px solid #aaaa33;border-radius:2px;pointer-events:none;z-index:100;}#my-svg .flowchartTitleText{text-anchor:middle;font-size:18px;fill:#333;}#my-svg rect.text{fill:none;stroke-width:0;}#my-svg .icon-shape,#my-svg .image-shape{background-color:rgba(232,232,232, 0.8);text-align:center;}#my-svg .icon-shape p,#my-svg .image-shape p{background-color:rgba(232,232,232, 0.8);padding:2px;}#my-svg .icon-shape .label rect,#my-svg .image-shape .label rect{opacity:0.5;background-color:rgba(232,232,232, 0.8);fill:rgba(232,232,232, 0.8);}#my-svg .label-icon{display:inline-block;height:1em;overflow:visible;vertical-align:-0.125em;}#my-svg .node .label-icon path{fill:currentColor;stroke:revert;stroke-width:revert;}#my-svg .node .neo-node{stroke:#9370DB;}#my-svg [data-look="neo"].node rect,#my-svg [data-look="neo"].cluster rect,#my-svg [data-look="neo"].node polygon{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node path{stroke:#9370DB;stroke-width:1px;}#my-svg [data-look="neo"].node .outer-path{filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node .neo-line path{stroke:#9370DB;filter:none;}#my-svg [data-look="neo"].node circle{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node circle .state-start{fill:#000000;}#my-svg [data-look="neo"].icon-shape .icon{fill:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].icon-shape .icon-neo path{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg :root{--mermaid-font-family:"trebuchet ms",verdana,arial,sans-serif;}</style><g><marker id="my-svg_flowchart-v2-pointEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="4.5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 5 L 10 10 L 10 0 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointEnd-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="11.5" refY="7" markerUnits="userSpaceOnUse" markerWidth="10.5" markerHeight="14" orient="auto"><path d="M 0 0 L 11.5 7 L 0 14 z" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointStart-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="1" refY="7" markerUnits="userSpaceOnUse" markerWidth="11.5" markerHeight="14" orient="auto"><polygon points="0,7 11.5,14 11.5,0" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="11" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-1" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleEnd-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refY="5" refX="12.25" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleStart-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-2" refY="5" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossEnd" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="12" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossStart" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="-1" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossEnd-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="17.7" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5;"/></marker><marker id="my-svg_flowchart-v2-crossStart-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="-3.5" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5; stroke-dasharray: 1, 0;"/></marker><g class="root"><g class="clusters"/><g class="edgePaths"><path d="M113.287,136L126.802,121.167C140.316,106.333,167.346,76.667,184.36,61.833C201.375,47,208.375,47,211.875,47L215.375,47" id="my-svg-L_Input_KMP_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_Input_KMP_0" data-points="W3sieCI6MTEzLjI4NzE3NjcyNDEzNzk0LCJ5IjoxMzZ9LHsieCI6MTk0LjM3NSwieSI6NDd9LHsieCI6MjE5LjM3NSwieSI6NDd9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M169.375,163L173.542,163C177.708,163,186.042,163,194.44,163C202.839,163,211.302,163,215.534,163L219.766,163" id="my-svg-L_Input_BM_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_Input_BM_0" data-points="W3sieCI6MTY5LjM3NSwieSI6MTYzfSx7IngiOjE5NC4zNzUsInkiOjE2M30seyJ4IjoyMjMuNzY1NjI1LCJ5IjoxNjN9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M116.126,190L129.167,202.833C142.209,215.667,168.292,241.333,185.723,254.167C203.154,267,211.932,267,216.322,267L220.711,267" id="my-svg-L_Input_RK_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_Input_RK_0" data-points="W3sieCI6MTE2LjEyNTYwMDk2MTUzODQ1LCJ5IjoxOTB9LHsieCI6MTk0LjM3NSwieSI6MjY3fSx7IngiOjIyNC43MTA5Mzc1LCJ5IjoyNjd9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M343.984,47L348.151,47C352.318,47,360.651,47,368.318,47C375.984,47,382.984,47,386.484,47L389.984,47" id="my-svg-L_KMP_KMPOut_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_KMP_KMPOut_0" data-points="W3sieCI6MzQzLjk4NDM3NSwieSI6NDd9LHsieCI6MzY4Ljk4NDM3NSwieSI6NDd9LHsieCI6MzkzLjk4NDM3NSwieSI6NDd9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M339.594,163L344.492,163C349.391,163,359.188,163,368.171,163C377.154,163,385.323,163,389.408,163L393.492,163" id="my-svg-L_BM_BMOut_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_BM_BMOut_0" data-points="W3sieCI6MzM5LjU5Mzc1LCJ5IjoxNjN9LHsieCI6MzY4Ljk4NDM3NSwieSI6MTYzfSx7IngiOjM5Ny40OTIxODc1LCJ5IjoxNjN9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M338.648,267L343.704,267C348.76,267,358.872,267,368.829,267C378.786,267,388.589,267,393.49,267L398.391,267" id="my-svg-L_RK_RKOut_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_RK_RKOut_0" data-points="W3sieCI6MzM4LjY0ODQzNzUsInkiOjI2N30seyJ4IjozNjguOTg0Mzc1LCJ5IjoyNjd9LHsieCI6NDAyLjM5MDYyNSwieSI6MjY3fV0=" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/></g><g class="edgeLabels"><g class="edgeLabel"><g class="label" data-id="L_Input_KMP_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_Input_BM_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_Input_RK_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_KMP_KMPOut_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_BM_BMOut_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_RK_RKOut_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g></g><g class="nodes"><g class="node default" id="my-svg-flowchart-Input-0" data-look="classic" transform="translate(88.6875, 163)"><rect class="basic label-container" style="" x="-80.6875" y="-27" width="161.375" height="54"/><g class="label" style="" transform="translate(-50.6875, -12)"><rect/><foreignObject width="101.375" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>Text + Pattern</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-KMP-1" data-look="classic" transform="translate(281.6796875, 47)"><rect class="basic label-container" style="" x="-62.3046875" y="-27" width="124.609375" height="54"/><g class="label" style="" transform="translate(-32.3046875, -12)"><rect/><foreignObject width="64.609375" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>KMP lane</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-BM-3" data-look="classic" transform="translate(281.6796875, 163)"><rect class="basic label-container" style="" x="-57.9140625" y="-27" width="115.828125" height="54"/><g class="label" style="" transform="translate(-27.9140625, -12)"><rect/><foreignObject width="55.828125" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>BM lane</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-RK-5" data-look="classic" transform="translate(281.6796875, 267)"><rect class="basic label-container" style="" x="-56.96875" y="-27" width="113.9375" height="54"/><g class="label" style="" transform="translate(-26.96875, -12)"><rect/><foreignObject width="53.9375" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>RK lane</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-KMPOut-7" data-look="classic" transform="translate(523.984375, 47)"><rect class="basic label-container" style="" x="-130" y="-39" width="260" height="78"/><g class="label" style="" transform="translate(-100, -24)"><rect/><foreignObject width="200" height="48"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table; white-space: break-spaces; line-height: 1.5; max-width: 200px; text-align: center; width: 200px;"><span class="nodeLabel"><p>KMP: Match@10, cmp=N_kmp</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-BMOut-9" data-look="classic" transform="translate(523.984375, 163)"><rect class="basic label-container" style="" x="-126.4921875" y="-27" width="252.984375" height="54"/><g class="label" style="" transform="translate(-96.4921875, -12)"><rect/><foreignObject width="192.984375" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>BM:  Match@10, cmp=N_bm</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-RKOut-11" data-look="classic" transform="translate(523.984375, 267)"><rect class="basic label-container" style="" x="-121.59375" y="-27" width="243.1875" height="54"/><g class="label" style="" transform="translate(-91.59375, -12)"><rect/><foreignObject width="183.1875" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>RK:  Match@10, cmp=N_rk</p></span></div></foreignObject></g></g></g></g></g><defs><filter id="my-svg-drop-shadow" height="130%" width="130%"><feDropShadow dx="4" dy="4" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs><defs><filter id="my-svg-drop-shadow-small" height="150%" width="150%"><feDropShadow dx="2" dy="2" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs></svg>

---

## 示意圖

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 110" width="420"><g font-family="monospace" font-size="13"><text x="0" y="20">Algorithm   Time(worst)  Space     Practice</text><text x="0" y="40">KMP         O(n+m)       O(m)      linear</text><text x="0" y="60">BM          O(nm)        O(m+sig)  sublinear</text><text x="0" y="80">RK          O(nm)        O(1)      avg-linear</text><text x="0" y="100">Shared example match at index 10</text></g></svg>

> visualizer 三個窗格同步執行；每個窗格在其演算法完成後顯示總比對次數。

---

## 複雜度分析

| 演算法 | 時間（最差） | 時間（平均／最佳） | 空間 |
| --- | --- | --- | --- |
| KMP | $O(n+m)$ | $O(n+m)$ | $O(m)$ |
| Boyer-Moore | $O(nm)$ | $O(n/m)$（最佳） | $O(m + \sigma)$ |
| Rabin-Karp | $O(nm)$ | $O(n+m)$（平均） | $O(1)$ |

$$O(n + m) \text{ — shared baseline}$$

三者的共同基線為 $O(n+m)$；取捨在於：KMP 保證最差、BM 實際最快、RK 最省空間。

---

## 程式碼

```cpp
// Each function returns the number of comparisons performed.

int kmpCompares(const string& text, const string& pat) {
    int n = text.size(), m = pat.size(), cmp = 0;
    vector<int> lps(m, 0);
    for (int len = 0, i = 1; i < m;) {
        if (pat[i] == pat[len])
            lps[i++] = ++len;
        else if (len)
            len = lps[len - 1];
        else
            lps[i++] = 0;
    }
    int i = 0, j = 0;
    while (i < n) {
        cmp++;
        if (text[i] == pat[j]) {
            i++;
            j++;
            if (j == m)
                j = lps[j - 1];
        } else if (j)
            j = lps[j - 1];
        else
            i++;
    }
    return cmp;
}

// Trimmed Boyer-Moore (bad-character heuristic only).
int bmCompares(const string& text, const string& pat) {
    int n = text.size(), m = pat.size(), cmp = 0;
    vector<int> bad(256, -1);
    for (int i = 0; i < m; i++)
        bad[(unsigned char)pat[i]] = i;
    int s = 0;
    while (s <= n - m) {
        int j = m - 1;
        while (j >= 0) {
            cmp++;
            if (pat[j] != text[s + j])
                break;
            j--;
        }
        if (j < 0)
            s += 1;
        else
            s += max(1, j - bad[(unsigned char)text[s + j]]);
    }
    return cmp;
}

int rkCompares(const string& text, const string& pat) {
    const int BASE = 256, MOD = 101;
    int n = text.size(), m = pat.size(), cmp = 0;
    if (m > n)
        return 0;
    int ph = 0, wh = 0, h = 1;
    for (int i = 0; i < m - 1; i++)
        h = (h * BASE) % MOD;
    for (int i = 0; i < m; i++) {
        ph = (BASE * ph + pat[i]) % MOD;
        wh = (BASE * wh + text[i]) % MOD;
    }
    for (int s = 0; s <= n - m; s++) {
        cmp++; // one hash comparison per window
        if (ph == wh) {
            int j = 0;
            while (j < m && text[s + j] == pat[j]) {
                cmp++;
                j++;
            }
        }
        if (s < n - m) {
            wh = (BASE * (wh - text[s] * h) + text[s + m]) % MOD;
            if (wh < 0)
                wh += MOD;
        }
    }
    return cmp;
}
```

> 此處的 `bmCompares` 為比較計數用的精簡版（僅壞字元啟發式）；上方複雜度表描述的是標準完整 Boyer-Moore（含好後綴），其完整實作見 search-bm。

---

## 優缺點與使用時機

- 選 KMP：需要最壞情況線性保證，或字串重複性高（二進位 DNA 序列）。
- 選 BM：追求在大型字母表與長文字上的最快實際速度（自然語言、程式碼搜尋）。
- 選 RK：多模式搜尋、記憶體受限、抄襲偵測或文件指紋比對場景。

---

## 小結

- 同一問題，三種取捨：KMP 保證線性、BM 實際最快、RK 最省空間。
- KMP 適合重複性高的字串；BM 適合大型字母表；RK 適合多模式比對。
- 三者皆為精確比對演算法；$O(n+m)$ 只是比較的參考基線，三者的最差複雜度其實不同（見複雜度表）。
- 詳細說明見 search-kmp、search-bm、search-rk。
