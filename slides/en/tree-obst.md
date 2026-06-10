---
marp: true
theme: default
paginate: true
math: katex
title: "Optimal Binary Search Tree"
category: "Trees"
---

## The Problem

Given each key's access frequency, find the BST with minimum weighted path length.

> Frequently accessed keys should sit near the root to reduce average comparisons.

---

## Dynamic Programming

$$cost[i][j] = \min_{i\le r\le j}\big(cost[i][r-1]+cost[r+1][j]\big) + W(i,j)$$

Try every possible root r for each subrange

- Fill the table by increasing subrange length
- W(i,j) = sum of frequencies in the range
- Record the best root to reconstruct the tree

---

## Complexity

- Time O(N³); O(N²) with Knuth's optimization
- Space O(N²)
