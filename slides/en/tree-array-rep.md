---
marp: true
theme: default
paginate: true
math: katex
title: "Sequential (Array) Representation"
category: "Trees"
---

## Storing a Binary Tree in an Array

Place a binary tree in a 1-indexed array; the position itself encodes the structure — no pointers needed.

- node $i$'s left child at $2i$
- right child at $2i+1$
- parent at $\lfloor i/2 \rfloor$

---

## Index Arithmetic

```cpp
int left(int i)  { return 2*i; }
int right(int i) { return 2*i + 1; }
int parent(int i){ return i/2; }
```

> Empty slots hold "-"; read level-order tokens, position k = index k.

---

## Waste in a Skewed Tree

A complete tree wastes nothing; a skewed tree is wasteful: a height-$h$ tree may need $2^{h+1}-1$ slots while holding as few as $h+1$ nodes.

---

## Complexity

| Aspect | Cost |
| --- | --- |
| Index ops | O(1) |
| Space (worst) | $O(2^h)$ |
