---
marp: true
theme: default
paginate: true
math: katex
title: "雜湊表(開放定址法)"
---

## 雜湊表(開放定址法)

開放定址法將所有元素儲存於陣列本身;碰撞時以線性探測(linear probing)依序尋找下一個空槽,load factor 不可超過 1.0。

---

## 核心概念

陣列每個槽僅存放一個元素(或哨兵值 -1 表示空)。碰撞時以 `(idx+1) % TABLE_SIZE` 線性遞增探索,直到找到空槽。

- insert:雜湊得初始索引;若槽已佔用則線性探測至空槽後寫入。
- 陣列已滿(`curr_size >= TABLE_SIZE`)時拒絕插入。
- 主叢集(Primary Clustering):連續佔用的槽使後續探測路徑更長。
- load factor 必須小於 1(本實作在 `curr_size >= TABLE_SIZE` 時拒絕)。

---

## 運作流程

1. 計算初始索引:`idx = key % TABLE_SIZE`。
2. 若 `table[idx] != -1`(碰撞),令 `idx = (idx+1) % TABLE_SIZE` 並重複。
3. 找到空槽後寫入 key,遞增 `curr_size`。
4. 若 `curr_size >= TABLE_SIZE` 則輸出「Hash Table Full!」並返回 false。

<svg id="my-svg" width="100%" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="flowchart" style="max-width: 827.688px; background-color: transparent;" viewBox="0 0 827.6875 398" role="graphics-document document" aria-roledescription="flowchart-v2"><style>#my-svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;fill:#333;}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#my-svg .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#my-svg .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#my-svg .error-icon{fill:#552222;}#my-svg .error-text{fill:#552222;stroke:#552222;}#my-svg .edge-thickness-normal{stroke-width:1px;}#my-svg .edge-thickness-thick{stroke-width:3.5px;}#my-svg .edge-pattern-solid{stroke-dasharray:0;}#my-svg .edge-thickness-invisible{stroke-width:0;fill:none;}#my-svg .edge-pattern-dashed{stroke-dasharray:3;}#my-svg .edge-pattern-dotted{stroke-dasharray:2;}#my-svg .marker{fill:#333333;stroke:#333333;}#my-svg .marker.cross{stroke:#333333;}#my-svg svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;}#my-svg p{margin:0;}#my-svg .label{font-family:"trebuchet ms",verdana,arial,sans-serif;color:#333;}#my-svg .cluster-label text{fill:#333;}#my-svg .cluster-label span{color:#333;}#my-svg .cluster-label span p{background-color:transparent;}#my-svg .label text,#my-svg span{fill:#333;color:#333;}#my-svg .node rect,#my-svg .node circle,#my-svg .node ellipse,#my-svg .node polygon,#my-svg .node path{fill:#ECECFF;stroke:#9370DB;stroke-width:1px;}#my-svg .rough-node .label text,#my-svg .node .label text,#my-svg .image-shape .label,#my-svg .icon-shape .label{text-anchor:middle;}#my-svg .node .katex path{fill:#000;stroke:#000;stroke-width:1px;}#my-svg .rough-node .label,#my-svg .node .label,#my-svg .image-shape .label,#my-svg .icon-shape .label{text-align:center;}#my-svg .node.clickable{cursor:pointer;}#my-svg .root .anchor path{fill:#333333!important;stroke-width:0;stroke:#333333;}#my-svg .arrowheadPath{fill:#333333;}#my-svg .edgePath .path{stroke:#333333;stroke-width:1px;}#my-svg .flowchart-link{stroke:#333333;fill:none;}#my-svg .edgeLabel{background-color:rgba(232,232,232, 0.8);text-align:center;}#my-svg .edgeLabel p{background-color:rgba(232,232,232, 0.8);}#my-svg .edgeLabel rect{opacity:0.5;background-color:rgba(232,232,232, 0.8);fill:rgba(232,232,232, 0.8);}#my-svg .labelBkg{background-color:rgba(232, 232, 232, 0.5);}#my-svg .cluster rect{fill:#ffffde;stroke:#aaaa33;stroke-width:1px;}#my-svg .cluster text{fill:#333;}#my-svg .cluster span{color:#333;}#my-svg div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:12px;background:hsl(80, 100%, 96.2745098039%);border:1px solid #aaaa33;border-radius:2px;pointer-events:none;z-index:100;}#my-svg .flowchartTitleText{text-anchor:middle;font-size:18px;fill:#333;}#my-svg rect.text{fill:none;stroke-width:0;}#my-svg .icon-shape,#my-svg .image-shape{background-color:rgba(232,232,232, 0.8);text-align:center;}#my-svg .icon-shape p,#my-svg .image-shape p{background-color:rgba(232,232,232, 0.8);padding:2px;}#my-svg .icon-shape .label rect,#my-svg .image-shape .label rect{opacity:0.5;background-color:rgba(232,232,232, 0.8);fill:rgba(232,232,232, 0.8);}#my-svg .label-icon{display:inline-block;height:1em;overflow:visible;vertical-align:-0.125em;}#my-svg .node .label-icon path{fill:currentColor;stroke:revert;stroke-width:revert;}#my-svg .node .neo-node{stroke:#9370DB;}#my-svg [data-look="neo"].node rect,#my-svg [data-look="neo"].cluster rect,#my-svg [data-look="neo"].node polygon{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node path{stroke:#9370DB;stroke-width:1px;}#my-svg [data-look="neo"].node .outer-path{filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node .neo-line path{stroke:#9370DB;filter:none;}#my-svg [data-look="neo"].node circle{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node circle .state-start{fill:#000000;}#my-svg [data-look="neo"].icon-shape .icon{fill:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].icon-shape .icon-neo path{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg :root{--mermaid-font-family:"trebuchet ms",verdana,arial,sans-serif;}</style><g><marker id="my-svg_flowchart-v2-pointEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="4.5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 5 L 10 10 L 10 0 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointEnd-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="11.5" refY="7" markerUnits="userSpaceOnUse" markerWidth="10.5" markerHeight="14" orient="auto"><path d="M 0 0 L 11.5 7 L 0 14 z" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointStart-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="1" refY="7" markerUnits="userSpaceOnUse" markerWidth="11.5" markerHeight="14" orient="auto"><polygon points="0,7 11.5,14 11.5,0" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="11" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-1" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleEnd-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refY="5" refX="12.25" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleStart-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-2" refY="5" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossEnd" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="12" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossStart" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="-1" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossEnd-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="17.7" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5;"/></marker><marker id="my-svg_flowchart-v2-crossStart-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="-3.5" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5; stroke-dasharray: 1, 0;"/></marker><g class="root"><g class="clusters"/><g class="edgePaths"><path d="M149.438,47L153.604,47C157.771,47,166.104,47,182.112,65.274C198.12,83.548,221.803,120.095,233.644,138.369L245.485,156.643" id="my-svg-L_K1_S2_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_K1_S2_0" data-points="W3sieCI6MTQ5LjQzNzUsInkiOjQ3fSx7IngiOjE3NC40Mzc1LCJ5Ijo0N30seyJ4IjoyNDcuNjYwNDkxMDcxNDI4NTcsInkiOjE2MH1d" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M149.438,187L153.604,187C157.771,187,166.104,187,173.771,187C181.438,187,188.438,187,191.938,187L195.438,187" id="my-svg-L_K2_S2_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_K2_S2_0" data-points="W3sieCI6MTQ5LjQzNzUsInkiOjE4N30seyJ4IjoxNzQuNDM3NSwieSI6MTg3fSx7IngiOjE5OS40Mzc1LCJ5IjoxODd9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M330.875,175.169L340.289,173.474C349.703,171.779,368.531,168.39,386.703,168.271C404.875,168.153,422.391,171.307,431.149,172.883L439.907,174.46" id="my-svg-L_S2_S3_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_S2_S3_0" data-points="W3sieCI6MzMwLjg3NSwieSI6MTc1LjE2ODc3NjM3MTMwOH0seyJ4IjozODcuMzU5Mzc1LCJ5IjoxNjV9LHsieCI6NDQzLjg0Mzc1LCJ5IjoxNzUuMTY4Nzc2MzcxMzA4fV0=" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M149.438,339L153.604,339C157.771,339,166.104,339,182.363,318.739C198.622,298.478,222.807,257.957,234.899,237.696L246.992,217.435" id="my-svg-L_K3_S2_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_K3_S2_0" data-points="W3sieCI6MTQ5LjQzNzUsInkiOjMzOX0seyJ4IjoxNzQuNDM3NSwieSI6MzM5fSx7IngiOjI0OS4wNDE3MzUxOTczNjg0LCJ5IjoyMTR9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M330.875,198.831L340.289,200.526C349.703,202.221,368.531,205.61,386.703,205.729C404.875,205.847,422.391,202.693,431.149,201.117L439.907,199.54" id="my-svg-L_S2_S3_2" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_S2_S3_2" data-points="W3sieCI6MzMwLjg3NSwieSI6MTk4LjgzMTIyMzYyODY5Mn0seyJ4IjozODcuMzU5Mzc1LCJ5IjoyMDl9LHsieCI6NDQzLjg0Mzc1LCJ5IjoxOTguODMxMjIzNjI4NjkyfV0=" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M575.281,187L584.695,187C594.109,187,612.938,187,631.099,187C649.26,187,666.755,187,675.503,187L684.25,187" id="my-svg-L_S3_S4_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_S3_S4_0" data-points="W3sieCI6NTc1LjI4MTI1LCJ5IjoxODd9LHsieCI6NjMxLjc2NTYyNSwieSI6MTg3fSx7IngiOjY4OC4yNSwieSI6MTg3fV0=" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/></g><g class="edgeLabels"><g class="edgeLabel"><g class="label" data-id="L_K1_S2_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_K2_S2_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(387.359375, 165)"><g class="label" data-id="L_S2_S3_0" transform="translate(-31.484375, -12)"><foreignObject width="62.96875" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>probe +1</p></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_K3_S2_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(387.359375, 209)"><g class="label" data-id="L_S2_S3_2" transform="translate(-31.484375, -12)"><foreignObject width="62.96875" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>probe +1</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(631.765625, 187)"><g class="label" data-id="L_S3_S4_0" transform="translate(-31.484375, -12)"><foreignObject width="62.96875" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>probe +1</p></span></div></foreignObject></g></g></g><g class="nodes"><g class="node default" id="my-svg-flowchart-K1-0" data-look="classic" transform="translate(78.71875, 47)"><rect class="basic label-container" style="" x="-70.71875" y="-39" width="141.4375" height="78"/><g class="label" style="" transform="translate(-40.71875, -24)"><rect/><foreignObject width="81.4375" height="48"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>insert 42<br />idx=42%5=2</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-S2-1" data-look="classic" transform="translate(265.15625, 187)"><rect class="basic label-container" style="" x="-65.71875" y="-27" width="131.4375" height="54"/><g class="label" style="" transform="translate(-35.71875, -12)"><rect/><foreignObject width="71.4375" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>slot[2]=42</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-K2-2" data-look="classic" transform="translate(78.71875, 187)"><rect class="basic label-container" style="" x="-70.71875" y="-51" width="141.4375" height="102"/><g class="label" style="" transform="translate(-40.71875, -36)"><rect/><foreignObject width="81.4375" height="72"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>insert 12<br />idx=12%5=2<br />collision!</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-S3-5" data-look="classic" transform="translate(509.5625, 187)"><rect class="basic label-container" style="" x="-65.71875" y="-27" width="131.4375" height="54"/><g class="label" style="" transform="translate(-35.71875, -12)"><rect/><foreignObject width="71.4375" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>slot[3]=12</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-K3-6" data-look="classic" transform="translate(78.71875, 339)"><rect class="basic label-container" style="" x="-70.71875" y="-51" width="141.4375" height="102"/><g class="label" style="" transform="translate(-40.71875, -36)"><rect/><foreignObject width="81.4375" height="72"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>insert 32<br />idx=32%5=2<br />collision!</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-S4-11" data-look="classic" transform="translate(753.96875, 187)"><rect class="basic label-container" style="" x="-65.71875" y="-27" width="131.4375" height="54"/><g class="label" style="" transform="translate(-35.71875, -12)"><rect/><foreignObject width="71.4375" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>slot[4]=32</p></span></div></foreignObject></g></g></g></g></g><defs><filter id="my-svg-drop-shadow" height="130%" width="130%"><feDropShadow dx="4" dy="4" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs><defs><filter id="my-svg-drop-shadow-small" height="150%" width="150%"><feDropShadow dx="2" dy="2" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs></svg>

---

## 探測序列示意

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 90" width="360" height="90"><g font-family="sans-serif" font-size="12"><rect x="10" y="30" width="60" height="28" fill="#e0f2fe" stroke="#0284c7"/><text x="40" y="49" text-anchor="middle">[0] -1</text><rect x="75" y="30" width="60" height="28" fill="#e0f2fe" stroke="#0284c7"/><text x="105" y="49" text-anchor="middle">[1] -1</text><rect x="140" y="30" width="60" height="28" fill="#fef3c7" stroke="#d97706" stroke-width="2"/><text x="170" y="49" text-anchor="middle" fill="#92400e">[2] 42</text><rect x="205" y="30" width="60" height="28" fill="#fef3c7" stroke="#d97706" stroke-width="2"/><text x="235" y="49" text-anchor="middle" fill="#92400e">[3] 12</text><rect x="270" y="30" width="60" height="28" fill="#fef3c7" stroke="#d97706" stroke-width="2"/><text x="300" y="49" text-anchor="middle" fill="#92400e">[4] 32</text><text x="170" y="22" text-anchor="middle" fill="#d97706">hash(42,12,32)=2</text><path d="M170 58 L235 58" stroke="#dc2626" stroke-width="1.5" marker-end="url(#arr)"/><path d="M235 58 L300 58" stroke="#dc2626" stroke-width="1.5" marker-end="url(#arr)"/><defs><marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#dc2626"/></marker></defs><text x="185" y="80" text-anchor="middle" fill="#dc2626">linear probe +1</text></g></svg>

> 42、12、32 均雜湊至槽 2(均滿足 `key % 5 == 2`)。線性探測依序將 12 放入槽 3、32 放入槽 4。主叢集效應使後續插入探測距離更長。

---

## 複雜度分析

| 操作 | 平均時間 | 最壞時間 | 空間 |
| --- | --- | --- | --- |
| insert | $O(1)$ | $O(N)$ | $O(1)$ |
| search | $O(1)$ | $O(N)$ | $O(1)$ |
| 空間合計 | — | — | $O(M)$ |

$$E[\text{probes}] \approx \frac{1}{1-\alpha} \quad (\alpha < 1)$$

線性探測的期望探測次數約為 $1/(1-\alpha)$;$\alpha$ 趨近 1 時探測代價急劇上升。最壞情況所有 key 擠在同一叢集,需掃描 $O(N)$ 個槽。

---

## 程式碼

```cpp
class HashOpenAddressing {
    int TABLE_SIZE;
    int* table;
    int curr_size;
public:
    HashOpenAddressing(int size = 5) {
        TABLE_SIZE = size;
        table = new int[TABLE_SIZE];
        for (int i = 0; i < TABLE_SIZE; i++) table[i] = -1;
        curr_size = 0;
    }
    int hashFunction(int key) { return key % TABLE_SIZE; }
    bool insert(int key) {
        if (curr_size >= TABLE_SIZE) {
            cout << "Hash Table Full!" << endl;
            return false;
        }
        int idx = hashFunction(key);
        // Linear Probing
        while (table[idx] != -1) {
            idx = (idx + 1) % TABLE_SIZE;
        }
        table[idx] = key;
        curr_size++;
        return true;
    }
};
```

---

## 優缺點與使用時機

- 優點:所有資料存於連續陣列,快取效能佳(cache-friendly)。
- 優點:無需額外指標;記憶體利用率高。
- 缺點:主叢集(Primary Clustering)使高 load factor 下探測代價急增。
- 缺點:load factor 必須 < 1,表格最終會滿。
- 缺點:刪除需「墓碑」標記以維持探測鏈的完整性。
- 適用:元素數量已知、load factor 可控制在 0.7 以下的快取敏感場景。

---

## 小結

- 線性探測將碰撞解決於陣列內;load factor < 1 為必要條件。
- 平均 $O(1)$,最壞 $O(N)$;$\alpha$ 越高效能退化越快。
- 快取友善且無指標開銷,但主叢集為其主要弱點。
