---
marp: true
theme: default
paginate: true
math: katex
title: "Composite 模式"
category: "Design Patterns"
---

## Composite 模式

Composite 是一種 Structural 設計模式,將物件組合成樹狀結構以表示「部分-整體」的層級關係,使客戶端能夠以一致的方式處理個別物件(Leaf)與物件組合(Composite)。

---

## 核心概念

`Component` 是 Leaf 與 Composite 共用的抽象介面,宣告 `operation()`。`Leaf` 直接實作 `operation()` 執行實際工作,是遞迴的終止點;`Composite` 持有型別為 `vector<shared_ptr<Component>>` 的 `m_children`,其 `operation()` 會先處理自己,再逐一委派給每個子節點。

- Component(介面):宣告 `operation()`,是 Leaf 與 Composite 的共同型別。
- Leaf(`Leaf`):樹狀結構中的葉節點,沒有子節點,`operation()` 直接完成工作。
- Composite(`Composite`):可以有子節點,以 `add(child)` 加入,並透過 `m_children` 持有任意數量的 Component。
- 客戶端(Client)透過 `Component*` 呼叫 `operation()`,不需區分手上拿到的是 Leaf 還是 Composite。

---

## 運作流程

1. 客戶端建立根節點 `root`(一個 `Composite`),再建立子樹 `branchA`、`branchB`(皆為 `Composite`)。
2. 以 `add()` 將 `leaf1`、`leaf2` 加入 `branchA`;將 `leaf3` 加入 `branchB`;再將 `branchA`、`branchB` 與 `leaf4` 加入 `root`。
3. 呼叫 `root->operation()`;`Composite::operation()` 先印出自己,再對 `m_children` 中每個節點遞迴呼叫 `operation(depth+1)`。
4. 遞迴到 `Leaf` 時,`Leaf::operation()` 只印出自己並直接返回,是整個遞迴的終止條件。

<svg id="my-svg" width="100%" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="flowchart" style="max-width: 783.844px; background-color: transparent;" viewBox="0 0 783.84375 406" role="graphics-document document" aria-roledescription="flowchart-v2"><style>#my-svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;fill:#333;}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#my-svg .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#my-svg .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#my-svg .error-icon{fill:#552222;}#my-svg .error-text{fill:#552222;stroke:#552222;}#my-svg .edge-thickness-normal{stroke-width:1px;}#my-svg .edge-thickness-thick{stroke-width:3.5px;}#my-svg .edge-pattern-solid{stroke-dasharray:0;}#my-svg .edge-thickness-invisible{stroke-width:0;fill:none;}#my-svg .edge-pattern-dashed{stroke-dasharray:3;}#my-svg .edge-pattern-dotted{stroke-dasharray:2;}#my-svg .marker{fill:#333333;stroke:#333333;}#my-svg .marker.cross{stroke:#333333;}#my-svg svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;}#my-svg p{margin:0;}#my-svg .label{font-family:"trebuchet ms",verdana,arial,sans-serif;color:#333;}#my-svg .cluster-label text{fill:#333;}#my-svg .cluster-label span{color:#333;}#my-svg .cluster-label span p{background-color:transparent;}#my-svg .label text,#my-svg span{fill:#333;color:#333;}#my-svg .node rect,#my-svg .node circle,#my-svg .node ellipse,#my-svg .node polygon,#my-svg .node path{fill:#ECECFF;stroke:#9370DB;stroke-width:1px;}#my-svg .rough-node .label text,#my-svg .node .label text,#my-svg .image-shape .label,#my-svg .icon-shape .label{text-anchor:middle;}#my-svg .node .katex path{fill:#000;stroke:#000;stroke-width:1px;}#my-svg .rough-node .label,#my-svg .node .label,#my-svg .image-shape .label,#my-svg .icon-shape .label{text-align:center;}#my-svg .node.clickable{cursor:pointer;}#my-svg .root .anchor path{fill:#333333!important;stroke-width:0;stroke:#333333;}#my-svg .arrowheadPath{fill:#333333;}#my-svg .edgePath .path{stroke:#333333;stroke-width:1px;}#my-svg .flowchart-link{stroke:#333333;fill:none;}#my-svg .edgeLabel{background-color:rgba(232,232,232, 0.8);text-align:center;}#my-svg .edgeLabel p{background-color:rgba(232,232,232, 0.8);}#my-svg .edgeLabel rect{opacity:0.5;background-color:rgba(232,232,232, 0.8);fill:rgba(232,232,232, 0.8);}#my-svg .labelBkg{background-color:rgba(232, 232, 232, 0.5);}#my-svg .cluster rect{fill:#ffffde;stroke:#aaaa33;stroke-width:1px;}#my-svg .cluster text{fill:#333;}#my-svg .cluster span{color:#333;}#my-svg div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:12px;background:hsl(80, 100%, 96.2745098039%);border:1px solid #aaaa33;border-radius:2px;pointer-events:none;z-index:100;}#my-svg .flowchartTitleText{text-anchor:middle;font-size:18px;fill:#333;}#my-svg rect.text{fill:none;stroke-width:0;}#my-svg .icon-shape,#my-svg .image-shape{background-color:rgba(232,232,232, 0.8);text-align:center;}#my-svg .icon-shape p,#my-svg .image-shape p{background-color:rgba(232,232,232, 0.8);padding:2px;}#my-svg .icon-shape .label rect,#my-svg .image-shape .label rect{opacity:0.5;background-color:rgba(232,232,232, 0.8);fill:rgba(232,232,232, 0.8);}#my-svg .label-icon{display:inline-block;height:1em;overflow:visible;vertical-align:-0.125em;}#my-svg .node .label-icon path{fill:currentColor;stroke:revert;stroke-width:revert;}#my-svg .node .neo-node{stroke:#9370DB;}#my-svg [data-look="neo"].node rect,#my-svg [data-look="neo"].cluster rect,#my-svg [data-look="neo"].node polygon{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node path{stroke:#9370DB;stroke-width:1px;}#my-svg [data-look="neo"].node .outer-path{filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node .neo-line path{stroke:#9370DB;filter:none;}#my-svg [data-look="neo"].node circle{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node circle .state-start{fill:#000000;}#my-svg [data-look="neo"].icon-shape .icon{fill:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].icon-shape .icon-neo path{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg :root{--mermaid-font-family:"trebuchet ms",verdana,arial,sans-serif;}</style><g><marker id="my-svg_flowchart-v2-pointEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="4.5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 5 L 10 10 L 10 0 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointEnd-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="11.5" refY="7" markerUnits="userSpaceOnUse" markerWidth="10.5" markerHeight="14" orient="auto"><path d="M 0 0 L 11.5 7 L 0 14 z" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointStart-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="1" refY="7" markerUnits="userSpaceOnUse" markerWidth="11.5" markerHeight="14" orient="auto"><polygon points="0,7 11.5,14 11.5,0" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="11" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-1" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleEnd-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refY="5" refX="12.25" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleStart-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-2" refY="5" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossEnd" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="12" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossStart" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="-1" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossEnd-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="17.7" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5;"/></marker><marker id="my-svg_flowchart-v2-crossStart-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="-3.5" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5; stroke-dasharray: 1, 0;"/></marker><g class="root"><g class="clusters"/><g class="edgePaths"><path d="M485.969,62L485.969,68.167C485.969,74.333,485.969,86.667,485.969,98.333C485.969,110,485.969,121,485.969,126.5L485.969,132" id="my-svg-L_Client_Root_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_Client_Root_0" data-points="W3sieCI6NDg1Ljk2ODc1LCJ5Ijo2Mn0seyJ4Ijo0ODUuOTY4NzUsInkiOjk5fSx7IngiOjQ4NS45Njg3NSwieSI6MTM2fV0=" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M398.227,177.486L360.355,183.738C322.484,189.991,246.742,202.495,208.871,212.248C171,222,171,229,171,232.5L171,236" id="my-svg-L_Root_BranchA_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_Root_BranchA_0" data-points="W3sieCI6Mzk4LjIyNjU2MjUsInkiOjE3Ny40ODU4NjE2OTI2MjgyNX0seyJ4IjoxNzEsInkiOjIxNX0seyJ4IjoxNzEsInkiOjI0MH1d" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M485.969,190L485.969,194.167C485.969,198.333,485.969,206.667,485.969,214.333C485.969,222,485.969,229,485.969,232.5L485.969,236" id="my-svg-L_Root_BranchB_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_Root_BranchB_0" data-points="W3sieCI6NDg1Ljk2ODc1LCJ5IjoxOTB9LHsieCI6NDg1Ljk2ODc1LCJ5IjoyMTV9LHsieCI6NDg1Ljk2ODc1LCJ5IjoyNDB9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M573.711,183.657L595.9,188.881C618.089,194.105,662.466,204.552,684.655,213.276C706.844,222,706.844,229,706.844,232.5L706.844,236" id="my-svg-L_Root_Leaf4_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_Root_Leaf4_0" data-points="W3sieCI6NTczLjcxMDkzNzUsInkiOjE4My42NTY5MDQzNTc2NjgzN30seyJ4Ijo3MDYuODQzNzUsInkiOjIxNX0seyJ4Ijo3MDYuODQzNzUsInkiOjI0MH1d" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M122.192,294L114.66,298.167C107.128,302.333,92.064,310.667,84.532,318.333C77,326,77,333,77,336.5L77,340" id="my-svg-L_BranchA_Leaf1_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_BranchA_Leaf1_0" data-points="W3sieCI6MTIyLjE5MjMwNzY5MjMwNzcsInkiOjI5NH0seyJ4Ijo3NywieSI6MzE5fSx7IngiOjc3LCJ5IjozNDR9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M219.808,294L227.34,298.167C234.872,302.333,249.936,310.667,257.468,318.333C265,326,265,333,265,336.5L265,340" id="my-svg-L_BranchA_Leaf2_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_BranchA_Leaf2_0" data-points="W3sieCI6MjE5LjgwNzY5MjMwNzY5MjMyLCJ5IjoyOTR9LHsieCI6MjY1LCJ5IjozMTl9LHsieCI6MjY1LCJ5IjozNDR9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M485.969,294L485.969,298.167C485.969,302.333,485.969,310.667,485.969,318.333C485.969,326,485.969,333,485.969,336.5L485.969,340" id="my-svg-L_BranchB_Leaf3_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_BranchB_Leaf3_0" data-points="W3sieCI6NDg1Ljk2ODc1LCJ5IjoyOTR9LHsieCI6NDg1Ljk2ODc1LCJ5IjozMTl9LHsieCI6NDg1Ljk2ODc1LCJ5IjozNDR9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/></g><g class="edgeLabels"><g class="edgeLabel" transform="translate(485.96875, 99)"><g class="label" data-id="L_Client_Root_0" transform="translate(-62.421875, -12)"><foreignObject width="124.84375" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>root-&gt;operation()</p></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_Root_BranchA_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_Root_BranchB_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_Root_Leaf4_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_BranchA_Leaf1_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_BranchA_Leaf2_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_BranchB_Leaf3_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g></g><g class="nodes"><g class="node default" id="my-svg-flowchart-Client-0" data-look="classic" transform="translate(485.96875, 35)"><rect class="basic label-container" style="" x="-51.3359375" y="-27" width="102.671875" height="54"/><g class="label" style="" transform="translate(-21.3359375, -12)"><rect/><foreignObject width="42.671875" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>Client</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-Root-1" data-look="classic" transform="translate(485.96875, 163)"><rect class="basic label-container" style="" x="-87.7421875" y="-27" width="175.484375" height="54"/><g class="label" style="" transform="translate(-57.7421875, -12)"><rect/><foreignObject width="115.484375" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>Composite: root</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-BranchA-3" data-look="classic" transform="translate(171, 267)"><rect class="basic label-container" style="" x="-102.0625" y="-27" width="204.125" height="54"/><g class="label" style="" transform="translate(-72.0625, -12)"><rect/><foreignObject width="144.125" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>Composite: branchA</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-BranchB-5" data-look="classic" transform="translate(485.96875, 267)"><rect class="basic label-container" style="" x="-101.875" y="-27" width="203.75" height="54"/><g class="label" style="" transform="translate(-71.875, -12)"><rect/><foreignObject width="143.75" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>Composite: branchB</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-Leaf4-7" data-look="classic" transform="translate(706.84375, 267)"><rect class="basic label-container" style="" x="-69" y="-27" width="138" height="54"/><g class="label" style="" transform="translate(-39, -12)"><rect/><foreignObject width="78" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>Leaf: leaf4</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-Leaf1-9" data-look="classic" transform="translate(77, 371)"><rect class="basic label-container" style="" x="-69" y="-27" width="138" height="54"/><g class="label" style="" transform="translate(-39, -12)"><rect/><foreignObject width="78" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>Leaf: leaf1</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-Leaf2-11" data-look="classic" transform="translate(265, 371)"><rect class="basic label-container" style="" x="-69" y="-27" width="138" height="54"/><g class="label" style="" transform="translate(-39, -12)"><rect/><foreignObject width="78" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>Leaf: leaf2</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-Leaf3-13" data-look="classic" transform="translate(485.96875, 371)"><rect class="basic label-container" style="" x="-69" y="-27" width="138" height="54"/><g class="label" style="" transform="translate(-39, -12)"><rect/><foreignObject width="78" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>Leaf: leaf3</p></span></div></foreignObject></g></g></g></g></g><defs><filter id="my-svg-drop-shadow" height="130%" width="130%"><feDropShadow dx="4" dy="4" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs><defs><filter id="my-svg-drop-shadow-small" height="150%" width="150%"><feDropShadow dx="2" dy="2" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs></svg>

---

## UML 結構示意

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 210" width="420" height="210"><g font-family="sans-serif" font-size="11"><rect x="140" y="10" width="150" height="60" rx="4" fill="#dbeafe" stroke="#2563eb" stroke-width="1.5"/><text x="215" y="28" text-anchor="middle" font-weight="bold" font-style="italic" fill="#1e3a8a">Component</text><line x1="140" y1="35" x2="290" y2="35" stroke="#2563eb" stroke-width="1"/><text x="150" y="50" font-size="10" fill="#374151">+ operation() = 0</text><rect x="15" y="130" width="130" height="45" rx="4" fill="#dcfce7" stroke="#16a34a" stroke-width="1.5"/><text x="80" y="150" text-anchor="middle" font-weight="bold" fill="#166534">Leaf</text><text x="80" y="165" text-anchor="middle" font-size="10" fill="#374151">+ operation()</text><rect x="255" y="120" width="150" height="75" rx="4" fill="#fef9c3" stroke="#ca8a04" stroke-width="1.5"/><text x="330" y="138" text-anchor="middle" font-weight="bold" fill="#92400e">Composite</text><text x="330" y="153" text-anchor="middle" font-size="9" fill="#374151">- m_children: Component[]</text><text x="330" y="168" text-anchor="middle" font-size="10" fill="#374151">+ add(child)</text><text x="330" y="183" text-anchor="middle" font-size="10" fill="#374151">+ operation()</text><line x1="80" y1="130" x2="175" y2="70" stroke="#64748b" stroke-width="1.5" stroke-dasharray="4,3"/><line x1="300" y1="120" x2="255" y2="70" stroke="#64748b" stroke-width="1.5" stroke-dasharray="4,3"/><line x1="370" y1="120" x2="295" y2="45" stroke="#ca8a04" stroke-width="1.5" marker-end="url(#arr)"/><text x="345" y="92" font-size="9" fill="#92400e">0..* children</text><defs><marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#ca8a04"/></marker></defs></g></svg>

> 虛線箭頭表示「實作(implements)」關係:Leaf 與 Composite 皆實作 Component 抽象介面。實心箭頭表示 Composite 以聚合(aggregation)方式持有 0 到多個 Component 作為 `m_children`——因為 Component 可能是 Leaf,也可能是另一個 Composite,樹狀結構因而能夠遞迴到任意深度。

---

## 模式屬性

| 屬性 | 說明 |
| --- | --- |
| GoF 分類 | Structural(結構型) |
| 參與者 | Component(介面)、Leaf、Composite |
| 意圖 | 將物件組合成樹狀結構,使客戶端能一致地處理個別物件與物件組合 |
| 結構 | 遞迴樹狀結構——Composite 的子節點可能是 Leaf,也可能是另一個 Composite |
| 一致性 | Leaf 與 Composite 皆實作 Component,客戶端呼叫 operation() 時無需判斷型別 |

$$\text{Composite.operation}(d) = \text{print(self)} \; + \sum_{c\,\in\,\text{children}} c.\text{operation}(d+1)$$

Composite 的 operation() 等於先處理自己,再對 m_children 中每個子節點遞迴呼叫 operation();遞迴到 Leaf 時總和項為空,直接終止。

---

## 程式碼

```cpp
// Component - common interface for leaves and composites
class Component {
protected:
    string m_name;
public:
    Component(const string& name) : m_name(name) {}
    virtual ~Component() {}
    virtual void operation(int depth = 0) const = 0;
};

// Leaf - has no children
class Leaf : public Component {
public:
    Leaf(const string& name) : Component(name) {}
    void operation(int depth = 0) const override {
        cout << string(depth * 2, ' ') << "Leaf: " << m_name << endl;
    }
};

// Composite - holds children and forwards operations recursively
class Composite : public Component {
private:
    vector<shared_ptr<Component>> m_children;
public:
    Composite(const string& name) : Component(name) {}
    void add(shared_ptr<Component> child) { m_children.push_back(child); }
    void operation(int depth = 0) const override {
        cout << string(depth * 2, ' ') << "Composite: " << m_name << endl;
        for (const auto& child : m_children) {
            child->operation(depth + 1);
        }
    }
};

int main() {
    auto root = make_shared<Composite>("root");

    auto branchA = make_shared<Composite>("branchA");
    branchA->add(make_shared<Leaf>("leaf1"));
    branchA->add(make_shared<Leaf>("leaf2"));

    auto branchB = make_shared<Composite>("branchB");
    branchB->add(make_shared<Leaf>("leaf3"));

    root->add(branchA);
    root->add(branchB);
    root->add(make_shared<Leaf>("leaf4"));

    root->operation(); // recurses through the whole tree
}
```

---

## 優缺點與使用時機

- 優點:客戶端可以用一致的方式處理 Leaf 與 Composite,不需要寫額外的型別判斷邏輯。
- 優點:新增新的 Component 型別(新的 Leaf 或 Composite 變體)不需修改既有程式碼,符合 Open/Closed Principle。
- 優點:天然適合表示遞迴的層級結構,例如檔案系統、GUI 元件樹、組織架構圖。
- 缺點:Component 介面必須對 Leaf 與 Composite 都有意義,有時會被迫加入對 Leaf 沒有意義的方法(例如 `add()`)。
- 適用:需要以遞迴樹狀結構表示部分-整體關係,且希望客戶端無差別地操作個別節點與整個子樹時。

---

## 小結

- Composite 是 Structural 模式:將物件組合成樹狀結構,表示部分-整體的層級關係。
- 參與者:Component(共用介面)、Leaf(葉節點,實際工作)、Composite(持有 m_children,遞迴委派)。
- `Composite::operation()` 遞迴呼叫每個子節點的 `operation()`,遞迴到 `Leaf` 便終止。
- 核心價值:客戶端透過 Component 介面統一操作,完全不需要區分現在拿到的是單一物件還是整個子樹。
