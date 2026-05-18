---
marp: true
theme: default
paginate: true
math: katex
title: "雜湊表(桶定址法)"
---

## 雜湊表(桶定址法)

桶定址法將陣列劃分為若干固定容量的「桶」(bucket);每個桶可容納多個元素(本實作每桶 2 槽)。桶未滿時直接插入,桶滿則以線性探測溢位至相鄰桶。

---

## 核心概念

每個 `Bucket` 結構包含固定大小的槽陣列(`slots[2]`)與計數器 `count`。雜湊函數 `key % NUM_BUCKETS` 決定主桶索引;主桶已滿時依序探測下一桶。

- 每桶容量固定為 2(本實作),提供少量碰撞緩衝。
- 主桶未滿:直接插入至 `slots[count++]`,$O(1)$。
- 主桶已滿:線性探測(`idx = (idx+1) % NUM_BUCKETS`)直至找到有空槽的桶。
- 所有桶皆滿則插入失敗。

---

## 運作流程

1. 計算主桶索引:`idx = key % NUM_BUCKETS`。
2. 若 `table[idx].count < 2`,寫入 `slots[count++]` 並返回。
3. 否則令 `idx = (idx+1) % NUM_BUCKETS` 並重複步驟 2,直到找到有空間的桶。
4. 若繞回原始索引仍未找到,輸出「Catastrophic Failure」。

<svg id="my-svg" width="100%" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="flowchart" style="max-width: 853.594px; background-color: transparent;" viewBox="0 0 853.59375 374" role="graphics-document document" aria-roledescription="flowchart-v2"><style>#my-svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;fill:#333;}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#my-svg .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#my-svg .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#my-svg .error-icon{fill:#552222;}#my-svg .error-text{fill:#552222;stroke:#552222;}#my-svg .edge-thickness-normal{stroke-width:1px;}#my-svg .edge-thickness-thick{stroke-width:3.5px;}#my-svg .edge-pattern-solid{stroke-dasharray:0;}#my-svg .edge-thickness-invisible{stroke-width:0;fill:none;}#my-svg .edge-pattern-dashed{stroke-dasharray:3;}#my-svg .edge-pattern-dotted{stroke-dasharray:2;}#my-svg .marker{fill:#333333;stroke:#333333;}#my-svg .marker.cross{stroke:#333333;}#my-svg svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;}#my-svg p{margin:0;}#my-svg .label{font-family:"trebuchet ms",verdana,arial,sans-serif;color:#333;}#my-svg .cluster-label text{fill:#333;}#my-svg .cluster-label span{color:#333;}#my-svg .cluster-label span p{background-color:transparent;}#my-svg .label text,#my-svg span{fill:#333;color:#333;}#my-svg .node rect,#my-svg .node circle,#my-svg .node ellipse,#my-svg .node polygon,#my-svg .node path{fill:#ECECFF;stroke:#9370DB;stroke-width:1px;}#my-svg .rough-node .label text,#my-svg .node .label text,#my-svg .image-shape .label,#my-svg .icon-shape .label{text-anchor:middle;}#my-svg .node .katex path{fill:#000;stroke:#000;stroke-width:1px;}#my-svg .rough-node .label,#my-svg .node .label,#my-svg .image-shape .label,#my-svg .icon-shape .label{text-align:center;}#my-svg .node.clickable{cursor:pointer;}#my-svg .root .anchor path{fill:#333333!important;stroke-width:0;stroke:#333333;}#my-svg .arrowheadPath{fill:#333333;}#my-svg .edgePath .path{stroke:#333333;stroke-width:1px;}#my-svg .flowchart-link{stroke:#333333;fill:none;}#my-svg .edgeLabel{background-color:rgba(232,232,232, 0.8);text-align:center;}#my-svg .edgeLabel p{background-color:rgba(232,232,232, 0.8);}#my-svg .edgeLabel rect{opacity:0.5;background-color:rgba(232,232,232, 0.8);fill:rgba(232,232,232, 0.8);}#my-svg .labelBkg{background-color:rgba(232, 232, 232, 0.5);}#my-svg .cluster rect{fill:#ffffde;stroke:#aaaa33;stroke-width:1px;}#my-svg .cluster text{fill:#333;}#my-svg .cluster span{color:#333;}#my-svg div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:12px;background:hsl(80, 100%, 96.2745098039%);border:1px solid #aaaa33;border-radius:2px;pointer-events:none;z-index:100;}#my-svg .flowchartTitleText{text-anchor:middle;font-size:18px;fill:#333;}#my-svg rect.text{fill:none;stroke-width:0;}#my-svg .icon-shape,#my-svg .image-shape{background-color:rgba(232,232,232, 0.8);text-align:center;}#my-svg .icon-shape p,#my-svg .image-shape p{background-color:rgba(232,232,232, 0.8);padding:2px;}#my-svg .icon-shape .label rect,#my-svg .image-shape .label rect{opacity:0.5;background-color:rgba(232,232,232, 0.8);fill:rgba(232,232,232, 0.8);}#my-svg .label-icon{display:inline-block;height:1em;overflow:visible;vertical-align:-0.125em;}#my-svg .node .label-icon path{fill:currentColor;stroke:revert;stroke-width:revert;}#my-svg .node .neo-node{stroke:#9370DB;}#my-svg [data-look="neo"].node rect,#my-svg [data-look="neo"].cluster rect,#my-svg [data-look="neo"].node polygon{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node path{stroke:#9370DB;stroke-width:1px;}#my-svg [data-look="neo"].node .outer-path{filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node .neo-line path{stroke:#9370DB;filter:none;}#my-svg [data-look="neo"].node circle{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node circle .state-start{fill:#000000;}#my-svg [data-look="neo"].icon-shape .icon{fill:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].icon-shape .icon-neo path{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg :root{--mermaid-font-family:"trebuchet ms",verdana,arial,sans-serif;}</style><g><marker id="my-svg_flowchart-v2-pointEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="4.5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 5 L 10 10 L 10 0 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointEnd-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="11.5" refY="7" markerUnits="userSpaceOnUse" markerWidth="10.5" markerHeight="14" orient="auto"><path d="M 0 0 L 11.5 7 L 0 14 z" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointStart-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="1" refY="7" markerUnits="userSpaceOnUse" markerWidth="11.5" markerHeight="14" orient="auto"><polygon points="0,7 11.5,14 11.5,0" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="11" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-1" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleEnd-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refY="5" refX="12.25" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleStart-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-2" refY="5" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossEnd" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="12" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossStart" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="-1" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossEnd-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="17.7" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5;"/></marker><marker id="my-svg_flowchart-v2-crossStart-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="-3.5" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5; stroke-dasharray: 1, 0;"/></marker><g class="root"><g class="clusters"/><g class="edgePaths"><path d="M138,110L138,114.167C138,118.333,138,126.667,138,134.333C138,142,138,149,138,152.5L138,156" id="my-svg-L_A_B_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_A_B_0" data-points="W3sieCI6MTM4LCJ5IjoxMTB9LHsieCI6MTM4LCJ5IjoxMzV9LHsieCI6MTM4LCJ5IjoxNjB9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M448,110L448,114.167C448,118.333,448,126.667,448,134.333C448,142,448,149,448,152.5L448,156" id="my-svg-L_C_B2_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_C_B2_0" data-points="W3sieCI6NDQ4LCJ5IjoxMTB9LHsieCI6NDQ4LCJ5IjoxMzV9LHsieCI6NDQ4LCJ5IjoxNjB9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M715.594,110L715.594,114.167C715.594,118.333,715.594,126.667,715.594,136.333C715.594,146,715.594,157,715.594,162.5L715.594,168" id="my-svg-L_D_E_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_D_E_0" data-points="W3sieCI6NzE1LjU5Mzc1LCJ5IjoxMTB9LHsieCI6NzE1LjU5Mzc1LCJ5IjoxMzV9LHsieCI6NzE1LjU5Mzc1LCJ5IjoxNzJ9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M715.594,226L715.594,232.167C715.594,238.333,715.594,250.667,715.594,260.333C715.594,270,715.594,277,715.594,280.5L715.594,284" id="my-svg-L_E_F_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_E_F_0" data-points="W3sieCI6NzE1LjU5Mzc1LCJ5IjoyMjZ9LHsieCI6NzE1LjU5Mzc1LCJ5IjoyNjN9LHsieCI6NzE1LjU5Mzc1LCJ5IjoyODh9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/></g><g class="edgeLabels"><g class="edgeLabel"><g class="label" data-id="L_A_B_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_C_B2_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_D_E_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_E_F_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g></g><g class="nodes"><g class="node default" id="my-svg-flowchart-A-0" data-look="classic" transform="translate(138, 59)"><rect class="basic label-container" style="" x="-89.4921875" y="-51" width="178.984375" height="102"/><g class="label" style="" transform="translate(-59.4921875, -36)"><rect/><foreignObject width="118.984375" height="72"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>insert 10<br />10%4=2<br />Bucket[2] empty</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-B-1" data-look="classic" transform="translate(138, 199)"><rect class="basic label-container" style="" x="-130" y="-39" width="260" height="78"/><g class="label" style="" transform="translate(-100, -24)"><rect/><foreignObject width="200" height="48"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table; white-space: break-spaces; line-height: 1.5; max-width: 200px; text-align: center; width: 200px;"><span class="nodeLabel"><p>Bucket[2]: slots=[10,-1] count=1</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-C-2" data-look="classic" transform="translate(448, 59)"><rect class="basic label-container" style="" x="-101.359375" y="-51" width="202.71875" height="102"/><g class="label" style="" transform="translate(-71.359375, -36)"><rect/><foreignObject width="142.71875" height="72"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>insert 14<br />14%4=2<br />Bucket[2] has space</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-B2-3" data-look="classic" transform="translate(448, 199)"><rect class="basic label-container" style="" x="-130" y="-39" width="260" height="78"/><g class="label" style="" transform="translate(-100, -24)"><rect/><foreignObject width="200" height="48"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table; white-space: break-spaces; line-height: 1.5; max-width: 200px; text-align: center; width: 200px;"><span class="nodeLabel"><p>Bucket[2]: slots=[10,14] count=2</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-D-4" data-look="classic" transform="translate(715.59375, 59)"><rect class="basic label-container" style="" x="-84.3984375" y="-51" width="168.796875" height="102"/><g class="label" style="" transform="translate(-54.3984375, -36)"><rect/><foreignObject width="108.796875" height="72"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>insert 22<br />22%4=2<br />Bucket[2] FULL</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-E-5" data-look="classic" transform="translate(715.59375, 199)"><rect class="basic label-container" style="" x="-87.59375" y="-27" width="175.1875" height="54"/><g class="label" style="" transform="translate(-57.59375, -12)"><rect/><foreignObject width="115.1875" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>probe Bucket[3]</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-F-7" data-look="classic" transform="translate(715.59375, 327)"><rect class="basic label-container" style="" x="-130" y="-39" width="260" height="78"/><g class="label" style="" transform="translate(-100, -24)"><rect/><foreignObject width="200" height="48"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table; white-space: break-spaces; line-height: 1.5; max-width: 200px; text-align: center; width: 200px;"><span class="nodeLabel"><p>Bucket[3]: slots=[22,-1] count=1</p></span></div></foreignObject></g></g></g></g></g><defs><filter id="my-svg-drop-shadow" height="130%" width="130%"><feDropShadow dx="4" dy="4" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs><defs><filter id="my-svg-drop-shadow-small" height="150%" width="150%"><feDropShadow dx="2" dy="2" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs></svg>

---

## 桶結構示意

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 110" width="380" height="110"><g font-family="sans-serif" font-size="12"><rect x="10" y="15" width="80" height="40" fill="#e0f2fe" stroke="#0284c7"/><text x="50" y="32" text-anchor="middle" font-weight="bold">Bucket[0]</text><text x="50" y="50" text-anchor="middle">[-1][-1]</text><rect x="105" y="15" width="80" height="40" fill="#e0f2fe" stroke="#0284c7"/><text x="145" y="32" text-anchor="middle" font-weight="bold">Bucket[1]</text><text x="145" y="50" text-anchor="middle">[-1][-1]</text><rect x="200" y="15" width="80" height="40" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/><text x="240" y="32" text-anchor="middle" font-weight="bold" fill="#1d4ed8">Bucket[2]</text><text x="240" y="50" text-anchor="middle" fill="#1d4ed8">[10][14]</text><rect x="295" y="15" width="80" height="40" fill="#dcfce7" stroke="#16a34a" stroke-width="2"/><text x="335" y="32" text-anchor="middle" font-weight="bold" fill="#166534">Bucket[3]</text><text x="335" y="50" text-anchor="middle" fill="#166534">[22][-1]</text><text x="240" y="10" text-anchor="middle" fill="#2563eb">primary(10,14,22)</text><path d="M295 35 L295 65 L335 65 L335 55" stroke="#dc2626" stroke-width="1.5" marker-end="url(#a2)"/><defs><marker id="a2" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#dc2626"/></marker></defs><text x="280" y="78" text-anchor="middle" fill="#dc2626">overflow probe</text></g></svg>

> 10 與 14 均雜湊至 Bucket[2](均為 `key%4==2`),填滿兩個槽。22 也雜湊至 Bucket[2] 但已滿,線性探測至 Bucket[3] 寫入。

---

## 複雜度分析

| 操作 | 平均時間 | 最壞時間 | 空間 |
| --- | --- | --- | --- |
| insert | $O(1)$ | $O(B)$ | $O(1)$ |
| search | $O(1)$ | $O(B)$ | $O(1)$ |
| 空間合計 | — | — | $O(B \cdot K)$ |

$$\text{Capacity} = B \times K$$

$B$ 為桶數,$K$ 為每桶槽數(本實作 $K=2$)。平均 $O(1)$;最壞需探測全部 $B$ 個桶。

---

## 程式碼

```cpp
struct Bucket {
    int slots[2];
    int count;
    Bucket() { slots[0] = -1; slots[1] = -1; count = 0; }
};

class HashBucketing {
    int NUM_BUCKETS;
    Bucket* table;
public:
    HashBucketing(int buckets = 4) {
        NUM_BUCKETS = buckets;
        table = new Bucket[NUM_BUCKETS];
    }
    int hashFunction(int key) { return key % NUM_BUCKETS; }
    bool insert(int key) {
        int idx = hashFunction(key);
        if (table[idx].count < 2) {
            table[idx].slots[table[idx].count++] = key;
            return true;
        }
        int startIdx = idx;
        idx = (idx + 1) % NUM_BUCKETS;
        while (idx != startIdx) {
            if (table[idx].count < 2) {
                table[idx].slots[table[idx].count++] = key;
                return true;
            }
            idx = (idx + 1) % NUM_BUCKETS;
        }
        return false;  // all buckets saturated
    }
};
```

---

## 優缺點與使用時機

- 優點:每桶多槽提供少量碰撞緩衝,減少探測次數。
- 優點:資料存於連續陣列結構,具快取親和性。
- 優點:固定容量設計使記憶體用量可精確預估。
- 缺點:每桶容量固定,超出後仍需探測相鄰桶,在高負載時退化。
- 缺點:桶容量固定可能浪費槽空間(桶內只存 1 個元素時另一槽閒置)。
- 適用:資料量有界、需要簡單可預測記憶體佔用的嵌入式或硬體映射場景。

---

## 小結

- 每桶固定 $K$ 槽;主桶未滿時 $O(1)$ 插入。
- 主桶滿則線性探測相鄰桶;最壞 $O(B)$。
- 兼具快取友善與碰撞緩衝;總容量 $B \times K$ 固定。
