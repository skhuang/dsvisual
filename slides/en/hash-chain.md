---
marp: true
theme: default
paginate: true
math: katex
title: "Hash Table (Separate Chaining)"
---

## Hash Table (Separate Chaining)

Separate Chaining maps each key to a bucket index via a hash function; each bucket holds an independent linked list of colliding entries, allowing the load factor to exceed 1.0.

---

## Core Concept

Each array slot stores a pointer to the head of a linked list. When two keys hash to the same index, the new node is prepended to that list in $O(1)$ time.

- insert: compute `key % TABLE_SIZE` for the index, create a new node, and prepend it to the list.
- search: hash to the bucket, then linearly traverse the list to match the key.
- load factor $\alpha = n / m$ ($n$: elements, $m$: buckets); average chain length equals $\alpha$.
- Collisions are contained within a single bucket; the load factor may exceed 1.

---

## Operation Flow

1. Compute hash index: `idx = key % TABLE_SIZE`.
2. Create a new node; set its `next` to `table[idx]`.
3. Update `table[idx]` to point to the new node (head insertion).
4. To search, traverse the corresponding bucket's list until the key is found or null is reached.

<svg id="my-svg" width="100%" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="flowchart" style="max-width: 477.547px; background-color: transparent;" viewBox="0 0 477.546875 302" role="graphics-document document" aria-roledescription="flowchart-v2"><style>#my-svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;fill:#333;}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#my-svg .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#my-svg .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#my-svg .error-icon{fill:#552222;}#my-svg .error-text{fill:#552222;stroke:#552222;}#my-svg .edge-thickness-normal{stroke-width:1px;}#my-svg .edge-thickness-thick{stroke-width:3.5px;}#my-svg .edge-pattern-solid{stroke-dasharray:0;}#my-svg .edge-thickness-invisible{stroke-width:0;fill:none;}#my-svg .edge-pattern-dashed{stroke-dasharray:3;}#my-svg .edge-pattern-dotted{stroke-dasharray:2;}#my-svg .marker{fill:#333333;stroke:#333333;}#my-svg .marker.cross{stroke:#333333;}#my-svg svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;}#my-svg p{margin:0;}#my-svg .label{font-family:"trebuchet ms",verdana,arial,sans-serif;color:#333;}#my-svg .cluster-label text{fill:#333;}#my-svg .cluster-label span{color:#333;}#my-svg .cluster-label span p{background-color:transparent;}#my-svg .label text,#my-svg span{fill:#333;color:#333;}#my-svg .node rect,#my-svg .node circle,#my-svg .node ellipse,#my-svg .node polygon,#my-svg .node path{fill:#ECECFF;stroke:#9370DB;stroke-width:1px;}#my-svg .rough-node .label text,#my-svg .node .label text,#my-svg .image-shape .label,#my-svg .icon-shape .label{text-anchor:middle;}#my-svg .node .katex path{fill:#000;stroke:#000;stroke-width:1px;}#my-svg .rough-node .label,#my-svg .node .label,#my-svg .image-shape .label,#my-svg .icon-shape .label{text-align:center;}#my-svg .node.clickable{cursor:pointer;}#my-svg .root .anchor path{fill:#333333!important;stroke-width:0;stroke:#333333;}#my-svg .arrowheadPath{fill:#333333;}#my-svg .edgePath .path{stroke:#333333;stroke-width:1px;}#my-svg .flowchart-link{stroke:#333333;fill:none;}#my-svg .edgeLabel{background-color:rgba(232,232,232, 0.8);text-align:center;}#my-svg .edgeLabel p{background-color:rgba(232,232,232, 0.8);}#my-svg .edgeLabel rect{opacity:0.5;background-color:rgba(232,232,232, 0.8);fill:rgba(232,232,232, 0.8);}#my-svg .labelBkg{background-color:rgba(232, 232, 232, 0.5);}#my-svg .cluster rect{fill:#ffffde;stroke:#aaaa33;stroke-width:1px;}#my-svg .cluster text{fill:#333;}#my-svg .cluster span{color:#333;}#my-svg div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:12px;background:hsl(80, 100%, 96.2745098039%);border:1px solid #aaaa33;border-radius:2px;pointer-events:none;z-index:100;}#my-svg .flowchartTitleText{text-anchor:middle;font-size:18px;fill:#333;}#my-svg rect.text{fill:none;stroke-width:0;}#my-svg .icon-shape,#my-svg .image-shape{background-color:rgba(232,232,232, 0.8);text-align:center;}#my-svg .icon-shape p,#my-svg .image-shape p{background-color:rgba(232,232,232, 0.8);padding:2px;}#my-svg .icon-shape .label rect,#my-svg .image-shape .label rect{opacity:0.5;background-color:rgba(232,232,232, 0.8);fill:rgba(232,232,232, 0.8);}#my-svg .label-icon{display:inline-block;height:1em;overflow:visible;vertical-align:-0.125em;}#my-svg .node .label-icon path{fill:currentColor;stroke:revert;stroke-width:revert;}#my-svg .node .neo-node{stroke:#9370DB;}#my-svg [data-look="neo"].node rect,#my-svg [data-look="neo"].cluster rect,#my-svg [data-look="neo"].node polygon{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node path{stroke:#9370DB;stroke-width:1px;}#my-svg [data-look="neo"].node .outer-path{filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node .neo-line path{stroke:#9370DB;filter:none;}#my-svg [data-look="neo"].node circle{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node circle .state-start{fill:#000000;}#my-svg [data-look="neo"].icon-shape .icon{fill:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].icon-shape .icon-neo path{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg :root{--mermaid-font-family:"trebuchet ms",verdana,arial,sans-serif;}</style><g><marker id="my-svg_flowchart-v2-pointEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="4.5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 5 L 10 10 L 10 0 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointEnd-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="11.5" refY="7" markerUnits="userSpaceOnUse" markerWidth="10.5" markerHeight="14" orient="auto"><path d="M 0 0 L 11.5 7 L 0 14 z" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointStart-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="1" refY="7" markerUnits="userSpaceOnUse" markerWidth="11.5" markerHeight="14" orient="auto"><polygon points="0,7 11.5,14 11.5,0" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="11" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-1" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleEnd-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refY="5" refX="12.25" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleStart-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-2" refY="5" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossEnd" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="12" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossStart" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="-1" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossEnd-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="17.7" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5;"/></marker><marker id="my-svg_flowchart-v2-crossStart-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="-3.5" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5; stroke-dasharray: 1, 0;"/></marker><g class="root"><g class="clusters"/><g class="edgePaths"><path d="M107.113,86L107.113,90.167C107.113,94.333,107.113,102.667,115.471,110.719C123.829,118.771,140.545,126.542,148.903,130.428L157.261,134.314" id="my-svg-L_K_B3_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_K_B3_0" data-points="W3sieCI6MTA3LjExMzI4MTI1LCJ5Ijo4Nn0seyJ4IjoxMDcuMTEzMjgxMjUsInkiOjExMX0seyJ4IjoxNjAuODg4MDcwOTEzNDYxNTUsInkiOjEzNn1d" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M152.562,190L142.315,194.167C132.067,198.333,111.573,206.667,101.325,214.333C91.078,222,91.078,229,91.078,232.5L91.078,236" id="my-svg-L_B3_N43_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_B3_N43_0" data-points="W3sieCI6MTUyLjU2MjEyNDM5OTAzODQ1LCJ5IjoxOTB9LHsieCI6OTEuMDc4MTI1LCJ5IjoyMTV9LHsieCI6OTEuMDc4MTI1LCJ5IjoyNDB9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M330.816,86L330.816,90.167C330.816,94.333,330.816,102.667,322.458,110.719C314.101,118.771,297.385,126.542,289.027,130.428L280.669,134.314" id="my-svg-L_K2_B3_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_K2_B3_0" data-points="W3sieCI6MzMwLjgxNjQwNjI1LCJ5Ijo4Nn0seyJ4IjozMzAuODE2NDA2MjUsInkiOjExMX0seyJ4IjoyNzcuMDQxNjE2NTg2NTM4NDUsInkiOjEzNn1d" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M285.368,190L295.615,194.167C305.862,198.333,326.357,206.667,336.604,214.333C346.852,222,346.852,229,346.852,232.5L346.852,236" id="my-svg-L_B3_N33_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_B3_N33_0" data-points="W3sieCI6Mjg1LjM2NzU2MzEwMDk2MTU1LCJ5IjoxOTB9LHsieCI6MzQ2Ljg1MTU2MjUsInkiOjIxNX0seyJ4IjozNDYuODUxNTYyNSwieSI6MjQwfV0=" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/></g><g class="edgeLabels"><g class="edgeLabel"><g class="label" data-id="L_K_B3_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_B3_N43_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_K2_B3_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_B3_N33_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g></g><g class="nodes"><g class="node default" id="my-svg-flowchart-K-0" data-look="classic" transform="translate(107.11328125, 47)"><rect class="basic label-container" style="" x="-86.8515625" y="-39" width="173.703125" height="78"/><g class="label" style="" transform="translate(-56.8515625, -24)"><rect/><foreignObject width="113.703125" height="48"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>key=43<br />hashIdx=43%5=3</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-B3-1" data-look="classic" transform="translate(218.96484375, 163)"><rect class="basic label-container" style="" x="-84.3046875" y="-27" width="168.609375" height="54"/><g class="label" style="" transform="translate(-54.3046875, -12)"><rect/><foreignObject width="108.609375" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>Bucket[3] head</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-N43-3" data-look="classic" transform="translate(91.078125, 267)"><rect class="basic label-container" style="" x="-83.078125" y="-27" width="166.15625" height="54"/><g class="label" style="" transform="translate(-53.078125, -12)"><rect/><foreignObject width="106.15625" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>Node(43)-&gt;null</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-K2-4" data-look="classic" transform="translate(330.81640625, 47)"><rect class="basic label-container" style="" x="-86.8515625" y="-39" width="173.703125" height="78"/><g class="label" style="" transform="translate(-56.8515625, -24)"><rect/><foreignObject width="113.703125" height="48"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>key=33<br />hashIdx=33%5=3</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-N33-7" data-look="classic" transform="translate(346.8515625, 267)"><rect class="basic label-container" style="" x="-122.6953125" y="-27" width="245.390625" height="54"/><g class="label" style="" transform="translate(-92.6953125, -12)"><rect/><foreignObject width="185.390625" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>Node(33)-&gt;Node(43)-&gt;null</p></span></div></foreignObject></g></g></g></g></g><defs><filter id="my-svg-drop-shadow" height="130%" width="130%"><feDropShadow dx="4" dy="4" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs><defs><filter id="my-svg-drop-shadow-small" height="150%" width="150%"><feDropShadow dx="2" dy="2" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs></svg>

---

## Memory Layout Diagram

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 130" width="380" height="130"><g font-family="sans-serif" font-size="12"><rect x="10" y="10" width="60" height="22" fill="#e0f2fe" stroke="#0284c7"/><text x="40" y="26" text-anchor="middle">[0] null</text><rect x="10" y="35" width="60" height="22" fill="#e0f2fe" stroke="#0284c7"/><text x="40" y="51" text-anchor="middle">[1] null</text><rect x="10" y="60" width="60" height="22" fill="#e0f2fe" stroke="#0284c7"/><text x="40" y="76" text-anchor="middle">[2] null</text><rect x="10" y="85" width="60" height="22" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/><text x="40" y="101" text-anchor="middle" fill="#1d4ed8">[3] ──▶</text><rect x="10" y="110" width="60" height="22" fill="#e0f2fe" stroke="#0284c7"/><text x="40" y="126" text-anchor="middle">[4] null</text><rect x="90" y="85" width="60" height="22" fill="#dcfce7" stroke="#16a34a"/><text x="120" y="101" text-anchor="middle">33 ──▶</text><rect x="165" y="85" width="60" height="22" fill="#dcfce7" stroke="#16a34a"/><text x="195" y="101" text-anchor="middle">43 ──▶</text><text x="240" y="101" fill="#64748b">null</text><text x="40" y="8" text-anchor="middle" fill="#64748b">TABLE</text></g></svg>

> Bucket 3's linked list holds 33 and 43 (both satisfy `key % 5 == 3`). Other buckets remain null. New colliding elements are prepended, leaving other buckets unaffected.

---

## Complexity Analysis

| Operation | Avg Time | Worst Time | Space |
| --- | --- | --- | --- |
| insert | $O(1)$ | $O(N)$ | $O(1)$ |
| search | $O(1)$ | $O(N)$ | $O(1)$ |
| delete | $O(1)$ | $O(N)$ | $O(1)$ |
| Total Space | — | — | $O(N+M)$ |

$$E[\text{chain length}] = \alpha = \frac{n}{m}$$

Average chain length equals load factor $\alpha$; search is $O(1)$ average when $\alpha$ is bounded. Worst case: all $N$ keys hash to one bucket, degrading to $O(N)$.

---

## Source Code

```cpp
struct Node {
    int data;
    Node* next;
    Node(int val) : data(val), next(nullptr) {}
};

class HashChaining {
    int TABLE_SIZE;
    Node** table;
public:
    HashChaining(int size = 5) {
        TABLE_SIZE = size;
        table = new Node*[TABLE_SIZE];
        for (int i = 0; i < TABLE_SIZE; i++) table[i] = nullptr;
    }
    int hashFunction(int key) { return key % TABLE_SIZE; }
    void insert(int key) {
        int hashIdx = hashFunction(key);
        Node* newNode = new Node(key);
        newNode->next = table[hashIdx];   // prepend
        table[hashIdx] = newNode;
    }
    void display() {
        for (int i = 0; i < TABLE_SIZE; i++) {
            cout << "[" << i << "] --> ";
            for (Node* t = table[i]; t; t = t->next)
                cout << t->data << " -> ";
            cout << "NULL\n";
        }
    }
};
```

---

## Pros, Cons & When to Use

- Pro: load factor may exceed 1 — no need to over-provision capacity.
- Pro: collisions only affect the local bucket list; no table-wide displacement.
- Pro: deletion is straightforward — remove the node from the list.
- Con: each node carries a pointer overhead; non-contiguous memory reduces cache efficiency.
- Con: a poorly distributed hash function produces long chains and degrades to $O(N)$.
- Use when element count is unpredictable, simple deletion is needed, or a high load factor is expected.

---

## Summary

- Each bucket maintains a linked list; collisions are resolved locally within the bucket.
- Average $O(1)$ operations, worst-case $O(N)$; space $O(N+M)$.
- Load factor $\alpha = n/m$ determines average chain length; keeping $\alpha \le 1$ ensures efficiency.
