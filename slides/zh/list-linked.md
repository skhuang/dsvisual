---
marp: true
theme: default
paginate: true
math: katex
title: "單向鏈結串列"
category: "Linear Structures"
---

## 單向鏈結串列

單向鏈結串列由動態配置的 `Node` 物件組成,每個節點含 `data` 欄位與指向下一節點的 `next` 指標,`head` 指向串列的第一個節點。

---

## 核心概念

節點散落於堆積記憶體中,僅靠 `next` 指標鏈接;無需預先宣告容量。插入或刪除只需改動少數指標,但隨機存取必須從 `head` 逐步遍訪。

- 在頭部插入:新節點的 `next` 指向舊 `head`,再更新 `head`,$O(1)$。
- 在任意位置插入:先遍訪至前一節點,再調整兩個指標,$O(N)$。
- 刪除節點:遍訪至前一節點,繞過目標節點並 `delete`,$O(N)$。
- 不支援 $O(1)$ 隨機存取;需從 `head` 逐步走訪至目標索引。

---

## 運作流程

1. 頭部插入:配置新節點,令 `next = head`,再令 `head = newNode`。
2. 中間插入:從 `head` 遍訪至索引 `i-1` 的節點 `temp`。
3. 令 `newNode->next = temp->next`,再令 `temp->next = newNode`。
4. 刪除:遍訪至前一節點,令 `temp->next = delNode->next`,再 `delete delNode`。

<svg id="my-svg" width="100%" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="flowchart" style="max-width: 1003.58px; background-color: transparent;" viewBox="0 0 1003.578125 94" role="graphics-document document" aria-roledescription="flowchart-v2"><style>#my-svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;fill:#333;}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#my-svg .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#my-svg .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#my-svg .error-icon{fill:#552222;}#my-svg .error-text{fill:#552222;stroke:#552222;}#my-svg .edge-thickness-normal{stroke-width:1px;}#my-svg .edge-thickness-thick{stroke-width:3.5px;}#my-svg .edge-pattern-solid{stroke-dasharray:0;}#my-svg .edge-thickness-invisible{stroke-width:0;fill:none;}#my-svg .edge-pattern-dashed{stroke-dasharray:3;}#my-svg .edge-pattern-dotted{stroke-dasharray:2;}#my-svg .marker{fill:#333333;stroke:#333333;}#my-svg .marker.cross{stroke:#333333;}#my-svg svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;}#my-svg p{margin:0;}#my-svg .label{font-family:"trebuchet ms",verdana,arial,sans-serif;color:#333;}#my-svg .cluster-label text{fill:#333;}#my-svg .cluster-label span{color:#333;}#my-svg .cluster-label span p{background-color:transparent;}#my-svg .label text,#my-svg span{fill:#333;color:#333;}#my-svg .node rect,#my-svg .node circle,#my-svg .node ellipse,#my-svg .node polygon,#my-svg .node path{fill:#ECECFF;stroke:#9370DB;stroke-width:1px;}#my-svg .rough-node .label text,#my-svg .node .label text,#my-svg .image-shape .label,#my-svg .icon-shape .label{text-anchor:middle;}#my-svg .node .katex path{fill:#000;stroke:#000;stroke-width:1px;}#my-svg .rough-node .label,#my-svg .node .label,#my-svg .image-shape .label,#my-svg .icon-shape .label{text-align:center;}#my-svg .node.clickable{cursor:pointer;}#my-svg .root .anchor path{fill:#333333!important;stroke-width:0;stroke:#333333;}#my-svg .arrowheadPath{fill:#333333;}#my-svg .edgePath .path{stroke:#333333;stroke-width:1px;}#my-svg .flowchart-link{stroke:#333333;fill:none;}#my-svg .edgeLabel{background-color:rgba(232,232,232, 0.8);text-align:center;}#my-svg .edgeLabel p{background-color:rgba(232,232,232, 0.8);}#my-svg .edgeLabel rect{opacity:0.5;background-color:rgba(232,232,232, 0.8);fill:rgba(232,232,232, 0.8);}#my-svg .labelBkg{background-color:rgba(232, 232, 232, 0.5);}#my-svg .cluster rect{fill:#ffffde;stroke:#aaaa33;stroke-width:1px;}#my-svg .cluster text{fill:#333;}#my-svg .cluster span{color:#333;}#my-svg div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:12px;background:hsl(80, 100%, 96.2745098039%);border:1px solid #aaaa33;border-radius:2px;pointer-events:none;z-index:100;}#my-svg .flowchartTitleText{text-anchor:middle;font-size:18px;fill:#333;}#my-svg rect.text{fill:none;stroke-width:0;}#my-svg .icon-shape,#my-svg .image-shape{background-color:rgba(232,232,232, 0.8);text-align:center;}#my-svg .icon-shape p,#my-svg .image-shape p{background-color:rgba(232,232,232, 0.8);padding:2px;}#my-svg .icon-shape .label rect,#my-svg .image-shape .label rect{opacity:0.5;background-color:rgba(232,232,232, 0.8);fill:rgba(232,232,232, 0.8);}#my-svg .label-icon{display:inline-block;height:1em;overflow:visible;vertical-align:-0.125em;}#my-svg .node .label-icon path{fill:currentColor;stroke:revert;stroke-width:revert;}#my-svg .node .neo-node{stroke:#9370DB;}#my-svg [data-look="neo"].node rect,#my-svg [data-look="neo"].cluster rect,#my-svg [data-look="neo"].node polygon{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node path{stroke:#9370DB;stroke-width:1px;}#my-svg [data-look="neo"].node .outer-path{filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node .neo-line path{stroke:#9370DB;filter:none;}#my-svg [data-look="neo"].node circle{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node circle .state-start{fill:#000000;}#my-svg [data-look="neo"].icon-shape .icon{fill:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].icon-shape .icon-neo path{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg :root{--mermaid-font-family:"trebuchet ms",verdana,arial,sans-serif;}</style><g><marker id="my-svg_flowchart-v2-pointEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="4.5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 5 L 10 10 L 10 0 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointEnd-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="11.5" refY="7" markerUnits="userSpaceOnUse" markerWidth="10.5" markerHeight="14" orient="auto"><path d="M 0 0 L 11.5 7 L 0 14 z" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointStart-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="1" refY="7" markerUnits="userSpaceOnUse" markerWidth="11.5" markerHeight="14" orient="auto"><polygon points="0,7 11.5,14 11.5,0" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="11" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-1" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleEnd-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refY="5" refX="12.25" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleStart-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-2" refY="5" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossEnd" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="12" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossStart" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="-1" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossEnd-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="17.7" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5;"/></marker><marker id="my-svg_flowchart-v2-crossStart-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="-3.5" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5; stroke-dasharray: 1, 0;"/></marker><g class="root"><g class="clusters"/><g class="edgePaths"><path d="M138.109,47L150.799,47C163.49,47,188.87,47,213.583,47C238.297,47,262.344,47,274.367,47L286.391,47" id="my-svg-L_H_A_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_H_A_0" data-points="W3sieCI6MTM4LjEwOTM3NSwieSI6NDd9LHsieCI6MjE0LjI1LCJ5Ijo0N30seyJ4IjoyOTAuMzkwNjI1LCJ5Ijo0N31d" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M418,47L429.557,47C441.115,47,464.229,47,486.677,47C509.125,47,530.906,47,541.797,47L552.688,47" id="my-svg-L_A_B_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_A_B_0" data-points="W3sieCI6NDE4LCJ5Ijo0N30seyJ4Ijo0ODcuMzQzNzUsInkiOjQ3fSx7IngiOjU1Ni42ODc1LCJ5Ijo0N31d" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M724.984,47L736.9,47C748.815,47,772.646,47,795.81,47C818.974,47,841.471,47,852.72,47L863.969,47" id="my-svg-L_B_C_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_B_C_0" data-points="W3sieCI6NzI0Ljk4NDM3NSwieSI6NDd9LHsieCI6Nzk2LjQ3NjU2MjUsInkiOjQ3fSx7IngiOjg2Ny45Njg3NSwieSI6NDd9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/></g><g class="edgeLabels"><g class="edgeLabel" transform="translate(214.25, 47)"><g class="label" data-id="L_H_A_0" transform="translate(-51.140625, -12)"><foreignObject width="102.28125" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>insert head 10</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(487.34375, 47)"><g class="label" data-id="L_A_B_0" transform="translate(-44.34375, -12)"><foreignObject width="88.6875" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>insert(1, 20)</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(796.4765625, 47)"><g class="label" data-id="L_B_C_0" transform="translate(-46.4921875, -12)"><foreignObject width="92.984375" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>remove head</p></span></div></foreignObject></g></g></g><g class="nodes"><g class="node default" id="my-svg-flowchart-H-0" data-look="classic" transform="translate(73.0546875, 47)"><rect class="basic label-container" style="" x="-65.0546875" y="-39" width="130.109375" height="78"/><g class="label" style="" transform="translate(-35.0546875, -24)"><rect/><foreignObject width="70.109375" height="48"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>head=null<br />(empty)</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-A-1" data-look="classic" transform="translate(354.1953125, 47)"><rect class="basic label-container" style="" x="-63.8046875" y="-27" width="127.609375" height="54"/><g class="label" style="" transform="translate(-33.8046875, -12)"><rect/><foreignObject width="67.609375" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>10 -&gt; null</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-B-3" data-look="classic" transform="translate(640.8359375, 47)"><rect class="basic label-container" style="" x="-84.1484375" y="-27" width="168.296875" height="54"/><g class="label" style="" transform="translate(-54.1484375, -12)"><rect/><foreignObject width="108.296875" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>10 -&gt; 20 -&gt; null</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-C-5" data-look="classic" transform="translate(931.7734375, 47)"><rect class="basic label-container" style="" x="-63.8046875" y="-27" width="127.609375" height="54"/><g class="label" style="" transform="translate(-33.8046875, -12)"><rect/><foreignObject width="67.609375" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>20 -&gt; null</p></span></div></foreignObject></g></g></g></g></g><defs><filter id="my-svg-drop-shadow" height="130%" width="130%"><feDropShadow dx="4" dy="4" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs><defs><filter id="my-svg-drop-shadow-small" height="150%" width="150%"><feDropShadow dx="2" dy="2" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs></svg>

---

## 記憶體結構

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 80" width="380" height="80"><g font-family="sans-serif" font-size="12"><rect x="10" y="25" width="70" height="30" fill="#dbeafe" stroke="#2563eb"/><text x="45" y="45" text-anchor="middle">data:10</text><rect x="80" y="25" width="60" height="30" fill="#dbeafe" stroke="#2563eb"/><text x="110" y="45" text-anchor="middle">next ──▶</text><rect x="160" y="25" width="70" height="30" fill="#dbeafe" stroke="#2563eb"/><text x="195" y="45" text-anchor="middle">data:20</text><rect x="230" y="25" width="60" height="30" fill="#dbeafe" stroke="#2563eb"/><text x="260" y="45" text-anchor="middle">next ──▶</text><rect x="310" y="25" width="55" height="30" fill="#f1f5f9" stroke="#94a3b8"/><text x="337" y="45" text-anchor="middle" fill="#64748b">null</text><text x="45" y="18" text-anchor="middle" fill="#2563eb">head</text></g></svg>

> 每個節點獨立散落於堆積記憶體,僅靠 `next` 指標串接;`head` 永遠指向第一個節點,尾端節點的 `next` 為 `nullptr`。

---

## 複雜度分析

| 操作 | 時間 | 空間 |
| --- | --- | --- |
| 頭部插入/刪除 | $O(1)$ | $O(1)$ |
| 任意位置插入/刪除 | $O(N)$ | $O(1)$ |
| 搜尋/隨機存取 | $O(N)$ | $O(1)$ |
| 空間合計 | — | $O(N)$ |

$$T_{\text{insert-head}} = O(1)$$

頭部插入只需更新兩個指標,與串列長度無關。

---

## 程式碼

```cpp
struct Node {
    int data;
    Node* next;
    Node(int val) : data(val), next(nullptr) {}
};

void insert(int index, int val) {
    Node* newNode = new Node(val);
    if (index == 0) {
        newNode->next = head;
        head = newNode;
        return;
    }
    Node* temp = head;
    for (int i = 0; temp != nullptr && i < index - 1; i++)
        temp = temp->next;
    if (!temp)
        return;
    newNode->next = temp->next;
    temp->next = newNode;
}

void remove(int index) {
    if (!head)
        return;
    if (index == 0) {
        Node* temp = head;
        head = head->next;
        delete temp;
        return;
    }
    Node* temp = head;
    for (int i = 0; temp != nullptr && i < index - 1; i++)
        temp = temp->next;
    if (!temp || !temp->next)
        return;
    Node* delNode = temp->next;
    temp->next = delNode->next;
    delete delNode;
}
```

---

## 優缺點與使用時機

- 優點:頭部插入/刪除為 $O(1)$,動態擴縮無容量上限。
- 優點:中間插入/刪除只需調整指標,無需移動其餘元素。
- 缺點:不支援隨機存取,$O(N)$ 走訪才能到達任意索引。
- 缺點:每個節點需額外一個 `next` 指標,記憶體不連續,快取效益低。
- 適用:頻繁在頭部或已知位置插入/刪除,如任務佇列、前向迭代器。

---

## 小結

- 以 `head` 指標管理串列,`next` 鏈接所有節點。
- 頭部操作 $O(1)$;中間或尾端操作需 $O(N)$ 遍訪。
- 與陣列串列相比:犧牲隨機存取換取高效的指標式插入/刪除。
