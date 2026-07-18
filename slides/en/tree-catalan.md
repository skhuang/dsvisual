---
marp: true
theme: default
paginate: true
math: katex
title: "Counting Binary Trees (Catalan)"
category: "Trees"
---

## How Many Shapes?

The number of distinct binary-tree shapes with $n$ nodes is the $n$th Catalan number $C_n$.

---

## The Recurrence

Split on the root: $i$ nodes left, $n-1-i$ right; any left shape pairs with any right shape.

$$C_n = \sum_{i=0}^{n-1} C_i \cdot C_{n-1-i}$$

convolution recurrence

---

## Closed Form & Sequence

$$C_n = \frac{1}{n+1}\binom{2n}{n}$$

closed form

Sequence: 1, 1, 2, 5, 14, 42, 132, 429, …

---

## Where Else Catalan Appears

- balanced parenthesis sequences
- triangulations of a convex polygon
- monotonic lattice paths under the diagonal
