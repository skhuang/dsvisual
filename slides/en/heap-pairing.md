---
marp: true
theme: default
paginate: true
math: katex
title: "Pairing Heap"
category: "Heaps / Priority Queues"
---

## Pairing Heap

A multiway-tree heap where meld is the core primitive: insert and merge cost $O(1)$; extractTop performs two-pass pairing of children, amortized $O(\log N)$ — practical performance rivals Fibonacci Heap.

---

## Core Concept

Each node stores a pointer to its first child and its next sibling. meld compares two roots; the larger-key root becomes the first child of the smaller-key root. extractTop removes the root, then performs two-pass pairing on all its children: first pair left-to-right, then merge right-to-left.

- meld(a, b): let a be the smaller root; b.sibling = a.child; a.child = b; return a — $O(1)$.
- insert(x): create node, meld into main heap — $O(1)$.
- extractTop: remove root, call mergePairs on the child list — $O(\log N)$ amortized.

---

## Operation Flow

1. extractTop: after removing the root, obtain its child list (sibling chain).
2. mergePairs pass 1 (left-to-right): take the first two children, meld them into one tree, continue with the rest.
3. mergePairs pass 2 (right-to-left): meld the paired trees from right to left.
4. The result is a single heap-ordered tree; its root is the new minimum.

<svg id="my-svg" width="100%" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="flowchart" style="max-width: 942.219px; background-color: transparent;" viewBox="0 0 942.21875 246" role="graphics-document document" aria-roledescription="flowchart-v2"><style>#my-svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;fill:#333;}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#my-svg .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#my-svg .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#my-svg .error-icon{fill:#552222;}#my-svg .error-text{fill:#552222;stroke:#552222;}#my-svg .edge-thickness-normal{stroke-width:1px;}#my-svg .edge-thickness-thick{stroke-width:3.5px;}#my-svg .edge-pattern-solid{stroke-dasharray:0;}#my-svg .edge-thickness-invisible{stroke-width:0;fill:none;}#my-svg .edge-pattern-dashed{stroke-dasharray:3;}#my-svg .edge-pattern-dotted{stroke-dasharray:2;}#my-svg .marker{fill:#333333;stroke:#333333;}#my-svg .marker.cross{stroke:#333333;}#my-svg svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;}#my-svg p{margin:0;}#my-svg .label{font-family:"trebuchet ms",verdana,arial,sans-serif;color:#333;}#my-svg .cluster-label text{fill:#333;}#my-svg .cluster-label span{color:#333;}#my-svg .cluster-label span p{background-color:transparent;}#my-svg .label text,#my-svg span{fill:#333;color:#333;}#my-svg .node rect,#my-svg .node circle,#my-svg .node ellipse,#my-svg .node polygon,#my-svg .node path{fill:#ECECFF;stroke:#9370DB;stroke-width:1px;}#my-svg .rough-node .label text,#my-svg .node .label text,#my-svg .image-shape .label,#my-svg .icon-shape .label{text-anchor:middle;}#my-svg .node .katex path{fill:#000;stroke:#000;stroke-width:1px;}#my-svg .rough-node .label,#my-svg .node .label,#my-svg .image-shape .label,#my-svg .icon-shape .label{text-align:center;}#my-svg .node.clickable{cursor:pointer;}#my-svg .root .anchor path{fill:#333333!important;stroke-width:0;stroke:#333333;}#my-svg .arrowheadPath{fill:#333333;}#my-svg .edgePath .path{stroke:#333333;stroke-width:1px;}#my-svg .flowchart-link{stroke:#333333;fill:none;}#my-svg .edgeLabel{background-color:rgba(232,232,232, 0.8);text-align:center;}#my-svg .edgeLabel p{background-color:rgba(232,232,232, 0.8);}#my-svg .edgeLabel rect{opacity:0.5;background-color:rgba(232,232,232, 0.8);fill:rgba(232,232,232, 0.8);}#my-svg .labelBkg{background-color:rgba(232, 232, 232, 0.5);}#my-svg .cluster rect{fill:#ffffde;stroke:#aaaa33;stroke-width:1px;}#my-svg .cluster text{fill:#333;}#my-svg .cluster span{color:#333;}#my-svg div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:12px;background:hsl(80, 100%, 96.2745098039%);border:1px solid #aaaa33;border-radius:2px;pointer-events:none;z-index:100;}#my-svg .flowchartTitleText{text-anchor:middle;font-size:18px;fill:#333;}#my-svg rect.text{fill:none;stroke-width:0;}#my-svg .icon-shape,#my-svg .image-shape{background-color:rgba(232,232,232, 0.8);text-align:center;}#my-svg .icon-shape p,#my-svg .image-shape p{background-color:rgba(232,232,232, 0.8);padding:2px;}#my-svg .icon-shape .label rect,#my-svg .image-shape .label rect{opacity:0.5;background-color:rgba(232,232,232, 0.8);fill:rgba(232,232,232, 0.8);}#my-svg .label-icon{display:inline-block;height:1em;overflow:visible;vertical-align:-0.125em;}#my-svg .node .label-icon path{fill:currentColor;stroke:revert;stroke-width:revert;}#my-svg .node .neo-node{stroke:#9370DB;}#my-svg [data-look="neo"].node rect,#my-svg [data-look="neo"].cluster rect,#my-svg [data-look="neo"].node polygon{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node path{stroke:#9370DB;stroke-width:1px;}#my-svg [data-look="neo"].node .outer-path{filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node .neo-line path{stroke:#9370DB;filter:none;}#my-svg [data-look="neo"].node circle{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node circle .state-start{fill:#000000;}#my-svg [data-look="neo"].icon-shape .icon{fill:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].icon-shape .icon-neo path{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg :root{--mermaid-font-family:"trebuchet ms",verdana,arial,sans-serif;}</style><g><marker id="my-svg_flowchart-v2-pointEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="4.5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 5 L 10 10 L 10 0 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointEnd-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="11.5" refY="7" markerUnits="userSpaceOnUse" markerWidth="10.5" markerHeight="14" orient="auto"><path d="M 0 0 L 11.5 7 L 0 14 z" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointStart-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="1" refY="7" markerUnits="userSpaceOnUse" markerWidth="11.5" markerHeight="14" orient="auto"><polygon points="0,7 11.5,14 11.5,0" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="11" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-1" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleEnd-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refY="5" refX="12.25" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleStart-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-2" refY="5" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossEnd" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="12" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossStart" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="-1" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossEnd-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="17.7" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5;"/></marker><marker id="my-svg_flowchart-v2-crossStart-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="-3.5" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5; stroke-dasharray: 1, 0;"/></marker><g class="root"><g class="clusters"/><g class="edgePaths"><path d="M174.578,59L178.745,59C182.911,59,191.245,59,200.033,59C208.82,59,218.063,59,222.684,59L227.305,59" id="my-svg-L_INSERT_ROOT_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_INSERT_ROOT_0" data-points="W3sieCI6MTc0LjU3ODEyNSwieSI6NTl9LHsieCI6MTk5LjU3ODEyNSwieSI6NTl9LHsieCI6MjMxLjMwNDY4NzUsInkiOjU5fV0=" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M165.258,199L170.978,199C176.698,199,188.138,199,197.358,199C206.578,199,213.578,199,217.078,199L220.578,199" id="my-svg-L_EXTRACT_P1_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_EXTRACT_P1_0" data-points="W3sieCI6MTY1LjI1NzgxMjUsInkiOjE5OX0seyJ4IjoxOTkuNTc4MTI1LCJ5IjoxOTl9LHsieCI6MjI0LjU3ODEyNSwieSI6MTk5fV0=" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M430.234,199L434.401,199C438.568,199,446.901,199,454.568,199C462.234,199,469.234,199,472.734,199L476.234,199" id="my-svg-L_P1_P2_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_P1_P2_0" data-points="W3sieCI6NDMwLjIzNDM3NSwieSI6MTk5fSx7IngiOjQ1NS4yMzQzNzUsInkiOjE5OX0seyJ4Ijo0ODAuMjM0Mzc1LCJ5IjoxOTl9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M669.453,199L673.62,199C677.786,199,686.12,199,693.786,199C701.453,199,708.453,199,711.953,199L715.453,199" id="my-svg-L_P2_NEWROOT_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_P2_NEWROOT_0" data-points="W3sieCI6NjY5LjQ1MzEyNSwieSI6MTk5fSx7IngiOjY5NC40NTMxMjUsInkiOjE5OX0seyJ4Ijo3MTkuNDUzMTI1LCJ5IjoxOTl9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/></g><g class="edgeLabels"><g class="edgeLabel"><g class="label" data-id="L_INSERT_ROOT_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_EXTRACT_P1_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_P1_P2_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_P2_NEWROOT_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g></g><g class="nodes"><g class="node default" id="my-svg-flowchart-INSERT-0" data-look="classic" transform="translate(91.2890625, 59)"><rect class="basic label-container" style="" x="-83.2890625" y="-51" width="166.578125" height="102"/><g class="label" style="" transform="translate(-53.2890625, -36)"><rect/><foreignObject width="106.578125" height="72"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>insert(x)<br />meld with root<br />O(1)</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-ROOT-1" data-look="classic" transform="translate(327.40625, 59)"><rect class="basic label-container" style="" x="-96.1015625" y="-39" width="192.203125" height="78"/><g class="label" style="" transform="translate(-66.1015625, -24)"><rect/><foreignObject width="132.203125" height="48"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>update root<br />if x.key &lt; root.key</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-EXTRACT-2" data-look="classic" transform="translate(91.2890625, 199)"><rect class="basic label-container" style="" x="-73.96875" y="-39" width="147.9375" height="78"/><g class="label" style="" transform="translate(-43.96875, -24)"><rect/><foreignObject width="87.9375" height="48"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>extractTop<br />remove root</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-P1-3" data-look="classic" transform="translate(327.40625, 199)"><rect class="basic label-container" style="" x="-102.828125" y="-39" width="205.65625" height="78"/><g class="label" style="" transform="translate(-72.828125, -24)"><rect/><foreignObject width="145.65625" height="48"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>pass 1: pair children<br />left-to-right</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-P2-5" data-look="classic" transform="translate(574.84375, 199)"><rect class="basic label-container" style="" x="-94.609375" y="-39" width="189.21875" height="78"/><g class="label" style="" transform="translate(-64.609375, -24)"><rect/><foreignObject width="129.21875" height="48"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>pass 2: meld pairs<br />right-to-left</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-NEWROOT-7" data-look="classic" transform="translate(826.8359375, 199)"><rect class="basic label-container" style="" x="-107.3828125" y="-27" width="214.765625" height="54"/><g class="label" style="" transform="translate(-77.3828125, -12)"><rect/><foreignObject width="154.765625" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>new root = final meld</p></span></div></foreignObject></g></g></g></g></g><defs><filter id="my-svg-drop-shadow" height="130%" width="130%"><feDropShadow dx="4" dy="4" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs><defs><filter id="my-svg-drop-shadow-small" height="150%" width="150%"><feDropShadow dx="2" dy="2" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs></svg>

---

## Pairing Heap Structure Diagram

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 130" width="300" height="130"><g font-family="sans-serif" font-size="11" text-anchor="middle"><circle cx="150" cy="18" r="14" fill="#fef9c3" stroke="#ca8a04"/><text x="150" y="22">2</text><circle cx="60" cy="58" r="12" fill="#dbeafe" stroke="#2563eb"/><text x="60" y="62">5</text><circle cx="100" cy="58" r="12" fill="#dbeafe" stroke="#2563eb"/><text x="100" y="62">7</text><circle cx="150" cy="58" r="12" fill="#dbeafe" stroke="#2563eb"/><text x="150" y="62">12</text><circle cx="200" cy="58" r="12" fill="#dbeafe" stroke="#2563eb"/><text x="200" y="62">18</text><circle cx="50" cy="98" r="10" fill="#dcfce7" stroke="#16a34a"/><text x="50" y="102">30</text><circle cx="80" cy="98" r="10" fill="#dcfce7" stroke="#16a34a"/><text x="80" y="102">9</text><line x1="150" y1="32" x2="65" y2="47" stroke="#64748b"/><line x1="65" y1="47" x2="95" y2="47" stroke="#64748b" stroke-dasharray="4"/><line x1="95" y1="47" x2="145" y2="47" stroke="#64748b" stroke-dasharray="4"/><line x1="145" y1="47" x2="193" y2="47" stroke="#64748b" stroke-dasharray="4"/><line x1="60" y1="70" x2="52" y2="89" stroke="#64748b"/><line x1="52" y1="89" x2="75" y2="89" stroke="#64748b" stroke-dasharray="4"/><text x="150" y="120" font-size="9" fill="#64748b">solid: child link; dashed: sibling chain</text></g></svg>

> All children of a root are linked in a sibling chain; insert only modifies the head pointer. extractTop processes the entire sibling chain with two-pass pairing.

---

## Complexity Analysis

| Operation | Amortized Time | Space |
| --- | --- | --- |
| insert | $O(1)$ | $O(1)$ |
| peek | $O(1)$ | $O(1)$ |
| merge | $O(1)$ | $O(1)$ |
| extractTop | $O(\log N)$ | $O(1)$ |
| decrease-key (approx.) | $O(\log N)$ | $O(1)$ |
| Total Space | — | $O(N)$ |

$$T_{\text{extractTop}} = O(\log N)\text{ amortized}$$

The exact amortized bound for decrease-key in Pairing Heap has not been proven to match Fibonacci Heap's $O(1)$; extractTop is proven $O(\log N)$ amortized.

---

## Source Code

```cpp
PNode* meld(PNode* a, PNode* b) {
    if (!a)
        return b;
    if (!b)
        return a;
    if (!cmp(a->key, b->key))
        swap(a, b); // a has smaller key
    b->sibling = a->child;
    a->child = b;
    return a;
}

PNode* mergePairs(PNode* node) {
    if (!node || !node->sibling)
        return node;
    PNode* first = node;
    PNode* second = node->sibling;
    PNode* rest = second->sibling;
    first->sibling = nullptr;
    second->sibling = nullptr;
    return meld(meld(first, second), mergePairs(rest));
}

void insert(int value) { root = meld(root, new PNode(value)); }

int extractTop() {
    int top = root->key;
    PNode* oldRoot = root;
    root = mergePairs(root->child);
    oldRoot->child = nullptr;
    delete oldRoot;
    return top;
}
```

---

## Pros, Cons & When to Use

- Pro: far simpler to implement than Fibonacci Heap, with comparable or better practical performance.
- Pro: insert and merge are $O(1)$; extractTop is $O(\log N)$ amortized.
- Con: tight amortized bound for decrease-key is an open problem (currently known upper bound: $O(2^{2\sqrt{\log \log N}})$).
- Con: pointer-based; worse cache performance than array-based heaps.
- Use for practical applications needing efficient insert/merge — a simpler drop-in alternative to Fibonacci Heap.

---

## Summary

- Multiway tree represented by sibling chain; meld is the $O(1)$ core operation.
- insert/merge $O(1)$; extractTop $O(\log N)$ amortized; excellent practical performance.
- Simpler than Fibonacci Heap; one of the preferred high-performance priority queue implementations in practice.
