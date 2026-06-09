---
marp: true
theme: default
paginate: true
math: katex
title: "Huffman Coding"
category: "Trees"
---

## The Problem

Given symbol frequencies, find a prefix-free code minimizing total encoded length.

> Prefix-free: no code is a prefix of another, so decoding is unambiguous.

---

## Greedy Construction

1. Each symbol becomes a single-node tree in a priority queue.
2. Remove the two lowest-frequency trees and merge them (frequencies add).
3. Repeat until a single tree remains.
4. Label left 0, right 1; the root-to-leaf path is each symbol's code.

```cpp
while (pq.size() > 1) {
    HNode* a = pq.top(); pq.pop();
    HNode* b = pq.top(); pq.pop();
    HNode* m = new HNode(a->freq + b->freq, '\0');
    m->l = a; m->r = b;
    pq.push(m);
}
```

---

## Optimality & Complexity

Greedily merging the two smallest provably minimizes weighted path length (optimal prefix code).

$$WPL = \sum_i f_i \cdot \text{depth}(i)$$

Objective: minimize weighted path length

- Build: O(N log N)
- Space: O(N)
