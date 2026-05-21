---
marp: true
theme: default
paginate: true
math: katex
title: "管道與過濾器"
category: "Design Patterns"
---

## 管道與過濾器

資料透過一連串以管道（pipe）連接的獨立過濾器（filter）逐步流動；每個過濾器負責一種轉換，並將結果傳遞給下一個。

---

## 核心概念

每個過濾器只有單一職責，且具備統一的輸入／輸出介面，因此過濾器可以自由組合與重新排序。管道線（pipeline）就是一個有序的過濾器列表。

- 統一的「輸入 → 輸出」介面讓過濾器可以任意串接。
- 過濾器彼此獨立，可單獨重複使用。
- 管道線只是一個有序的過濾器列表，組合方式靈活。

---

## 運作流程

1. 建立管道線並依序加入所需的過濾器。
2. 將輸入資料送入管道線的第一個過濾器。
3. 每個過濾器轉換資料後傳遞給下一個，最終輸出結果。

<svg id="my-svg" width="100%" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="flowchart" style="max-width: 733.312px; background-color: transparent;" viewBox="0 0 733.3125 70" role="graphics-document document" aria-roledescription="flowchart-v2"><style>#my-svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;fill:#333;}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#my-svg .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#my-svg .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#my-svg .error-icon{fill:#552222;}#my-svg .error-text{fill:#552222;stroke:#552222;}#my-svg .edge-thickness-normal{stroke-width:1px;}#my-svg .edge-thickness-thick{stroke-width:3.5px;}#my-svg .edge-pattern-solid{stroke-dasharray:0;}#my-svg .edge-thickness-invisible{stroke-width:0;fill:none;}#my-svg .edge-pattern-dashed{stroke-dasharray:3;}#my-svg .edge-pattern-dotted{stroke-dasharray:2;}#my-svg .marker{fill:#333333;stroke:#333333;}#my-svg .marker.cross{stroke:#333333;}#my-svg svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;}#my-svg p{margin:0;}#my-svg .label{font-family:"trebuchet ms",verdana,arial,sans-serif;color:#333;}#my-svg .cluster-label text{fill:#333;}#my-svg .cluster-label span{color:#333;}#my-svg .cluster-label span p{background-color:transparent;}#my-svg .label text,#my-svg span{fill:#333;color:#333;}#my-svg .node rect,#my-svg .node circle,#my-svg .node ellipse,#my-svg .node polygon,#my-svg .node path{fill:#ECECFF;stroke:#9370DB;stroke-width:1px;}#my-svg .rough-node .label text,#my-svg .node .label text,#my-svg .image-shape .label,#my-svg .icon-shape .label{text-anchor:middle;}#my-svg .node .katex path{fill:#000;stroke:#000;stroke-width:1px;}#my-svg .rough-node .label,#my-svg .node .label,#my-svg .image-shape .label,#my-svg .icon-shape .label{text-align:center;}#my-svg .node.clickable{cursor:pointer;}#my-svg .root .anchor path{fill:#333333!important;stroke-width:0;stroke:#333333;}#my-svg .arrowheadPath{fill:#333333;}#my-svg .edgePath .path{stroke:#333333;stroke-width:1px;}#my-svg .flowchart-link{stroke:#333333;fill:none;}#my-svg .edgeLabel{background-color:rgba(232,232,232, 0.8);text-align:center;}#my-svg .edgeLabel p{background-color:rgba(232,232,232, 0.8);}#my-svg .edgeLabel rect{opacity:0.5;background-color:rgba(232,232,232, 0.8);fill:rgba(232,232,232, 0.8);}#my-svg .labelBkg{background-color:rgba(232, 232, 232, 0.5);}#my-svg .cluster rect{fill:#ffffde;stroke:#aaaa33;stroke-width:1px;}#my-svg .cluster text{fill:#333;}#my-svg .cluster span{color:#333;}#my-svg div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:12px;background:hsl(80, 100%, 96.2745098039%);border:1px solid #aaaa33;border-radius:2px;pointer-events:none;z-index:100;}#my-svg .flowchartTitleText{text-anchor:middle;font-size:18px;fill:#333;}#my-svg rect.text{fill:none;stroke-width:0;}#my-svg .icon-shape,#my-svg .image-shape{background-color:rgba(232,232,232, 0.8);text-align:center;}#my-svg .icon-shape p,#my-svg .image-shape p{background-color:rgba(232,232,232, 0.8);padding:2px;}#my-svg .icon-shape .label rect,#my-svg .image-shape .label rect{opacity:0.5;background-color:rgba(232,232,232, 0.8);fill:rgba(232,232,232, 0.8);}#my-svg .label-icon{display:inline-block;height:1em;overflow:visible;vertical-align:-0.125em;}#my-svg .node .label-icon path{fill:currentColor;stroke:revert;stroke-width:revert;}#my-svg .node .neo-node{stroke:#9370DB;}#my-svg [data-look="neo"].node rect,#my-svg [data-look="neo"].cluster rect,#my-svg [data-look="neo"].node polygon{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node path{stroke:#9370DB;stroke-width:1px;}#my-svg [data-look="neo"].node .outer-path{filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node .neo-line path{stroke:#9370DB;filter:none;}#my-svg [data-look="neo"].node circle{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node circle .state-start{fill:#000000;}#my-svg [data-look="neo"].icon-shape .icon{fill:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].icon-shape .icon-neo path{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg :root{--mermaid-font-family:"trebuchet ms",verdana,arial,sans-serif;}</style><g><marker id="my-svg_flowchart-v2-pointEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="4.5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 5 L 10 10 L 10 0 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointEnd-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="11.5" refY="7" markerUnits="userSpaceOnUse" markerWidth="10.5" markerHeight="14" orient="auto"><path d="M 0 0 L 11.5 7 L 0 14 z" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointStart-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="1" refY="7" markerUnits="userSpaceOnUse" markerWidth="11.5" markerHeight="14" orient="auto"><polygon points="0,7 11.5,14 11.5,0" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="11" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-1" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleEnd-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refY="5" refX="12.25" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleStart-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-2" refY="5" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossEnd" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="12" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossStart" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="-1" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossEnd-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="17.7" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5;"/></marker><marker id="my-svg_flowchart-v2-crossStart-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="-3.5" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5; stroke-dasharray: 1, 0;"/></marker><g class="root"><g class="clusters"/><g class="edgePaths"><path d="M105.203,35L109.37,35C113.536,35,121.87,35,129.536,35C137.203,35,144.203,35,147.703,35L151.203,35" id="my-svg-L_Input_Trim_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_Input_Trim_0" data-points="W3sieCI6MTA1LjIwMzEyNSwieSI6MzV9LHsieCI6MTMwLjIwMzEyNSwieSI6MzV9LHsieCI6MTU1LjIwMzEyNSwieSI6MzV9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M246.797,35L250.964,35C255.13,35,263.464,35,271.13,35C278.797,35,285.797,35,289.297,35L292.797,35" id="my-svg-L_Trim_Upper_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_Trim_Upper_0" data-points="W3sieCI6MjQ2Ljc5Njg3NSwieSI6MzV9LHsieCI6MjcxLjc5Njg3NSwieSI6MzV9LHsieCI6Mjk2Ljc5Njg3NSwieSI6MzV9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M399.953,35L404.12,35C408.286,35,416.62,35,424.286,35C431.953,35,438.953,35,442.453,35L445.953,35" id="my-svg-L_Upper_Exclaim_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_Upper_Exclaim_0" data-points="W3sieCI6Mzk5Ljk1MzEyNSwieSI6MzV9LHsieCI6NDI0Ljk1MzEyNSwieSI6MzV9LHsieCI6NDQ5Ljk1MzEyNSwieSI6MzV9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M565.438,35L569.604,35C573.771,35,582.104,35,589.771,35C597.438,35,604.438,35,607.938,35L611.438,35" id="my-svg-L_Exclaim_Output_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_Exclaim_Output_0" data-points="W3sieCI6NTY1LjQzNzUsInkiOjM1fSx7IngiOjU5MC40Mzc1LCJ5IjozNX0seyJ4Ijo2MTUuNDM3NSwieSI6MzV9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/></g><g class="edgeLabels"><g class="edgeLabel"><g class="label" data-id="L_Input_Trim_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_Trim_Upper_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_Upper_Exclaim_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_Exclaim_Output_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g></g><g class="nodes"><g class="node default" id="my-svg-flowchart-Input-0" data-look="classic" transform="translate(56.6015625, 35)"><rect class="basic label-container" style="" x="-48.6015625" y="-27" width="97.203125" height="54"/><g class="label" style="" transform="translate(-18.6015625, -12)"><rect/><foreignObject width="37.203125" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>Input</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-Trim-1" data-look="classic" transform="translate(201, 35)"><rect class="basic label-container" style="" x="-45.796875" y="-27" width="91.59375" height="54"/><g class="label" style="" transform="translate(-15.796875, -12)"><rect/><foreignObject width="31.59375" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>Trim</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-Upper-3" data-look="classic" transform="translate(348.375, 35)"><rect class="basic label-container" style="" x="-51.578125" y="-27" width="103.15625" height="54"/><g class="label" style="" transform="translate(-21.578125, -12)"><rect/><foreignObject width="43.15625" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>Upper</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-Exclaim-5" data-look="classic" transform="translate(507.6953125, 35)"><rect class="basic label-container" style="" x="-57.7421875" y="-27" width="115.484375" height="54"/><g class="label" style="" transform="translate(-27.7421875, -12)"><rect/><foreignObject width="55.484375" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>Exclaim</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-Output-7" data-look="classic" transform="translate(670.375, 35)"><rect class="basic label-container" style="" x="-54.9375" y="-27" width="109.875" height="54"/><g class="label" style="" transform="translate(-24.9375, -12)"><rect/><foreignObject width="49.875" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>Output</p></span></div></foreignObject></g></g></g></g></g><defs><filter id="my-svg-drop-shadow" height="130%" width="130%"><feDropShadow dx="4" dy="4" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs><defs><filter id="my-svg-drop-shadow-small" height="150%" width="150%"><feDropShadow dx="2" dy="2" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs></svg>

---

## 示意圖

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 80" width="440"><g font-family="monospace" font-size="12"><rect x="10" y="23" width="60" height="34" fill="none" stroke="#64748b"/><text x="40" y="44" text-anchor="middle" fill="#64748b">Input</text><line x1="70" y1="40" x2="90" y2="40" stroke="#64748b"/><rect x="90" y="23" width="70" height="34" fill="none" stroke="#60a5fa"/><text x="125" y="44" text-anchor="middle" fill="#60a5fa">Trim</text><line x1="160" y1="40" x2="180" y2="40" stroke="#64748b"/><rect x="180" y="23" width="70" height="34" fill="none" stroke="#34d399"/><text x="215" y="44" text-anchor="middle" fill="#34d399">Upper</text><line x1="250" y1="40" x2="270" y2="40" stroke="#64748b"/><rect x="270" y="23" width="80" height="34" fill="none" stroke="#f59e0b"/><text x="310" y="44" text-anchor="middle" fill="#f59e0b">Exclaim</text><line x1="350" y1="40" x2="370" y2="40" stroke="#64748b"/><rect x="370" y="23" width="60" height="34" fill="none" stroke="#64748b"/><text x="400" y="44" text-anchor="middle" fill="#64748b">Output</text></g></svg>

> visualizer 以水平鏈呈現過濾器：Input → Trim → Upper → Exclaim → Output，連線代表資料流向（管道）。

---

## 取捨與使用時機

| 面向 | 說明 |
| --- | --- |
| 可組合性與重用 | 過濾器可自由組合、重新排序並在不同管道線中重用 |
| 各階段可獨立測試 | 每個過濾器可單獨提供輸入並驗證輸出 |
| 成本 | 各階段的資料複製增加開銷；不適合需要緊密回饋迴圈的場景 |

---

## 程式碼

```cpp
// Filter — one transformation stage.
class Filter {
public:
    virtual string process(const string& input) const = 0;
    virtual ~Filter() {}
};

// Pipeline — chains filters; data flows through each pipe.
class Pipeline {
    vector<Filter*> filters;

public:
    void add(Filter* f) { filters.push_back(f); }
    string run(const string& input) const {
        string data = input;
        for (Filter* f : filters)
            data = f->process(data);
        return data;
    }
};
```

---

## 優缺點與使用時機

- 優點：過濾器可自由組合、重新排序，彈性極高。
- 優點：每個過濾器可獨立進行單元測試。
- 缺點：各階段的資料複製增加效能開銷。
- 缺點：對於非線性的資料流，此模式不易套用。
- 適用：串流與批次資料轉換（編譯器、資料管線、文字處理）。

---

## 小結

- 管道與過濾器將資料處理拆解為一連串單一職責的獨立過濾器。
- 統一的介面讓過濾器可以自由組合，實現高度可重用的管道線。
- 廣泛應用於編譯器前端、ETL 資料管線與文字處理等場景。
