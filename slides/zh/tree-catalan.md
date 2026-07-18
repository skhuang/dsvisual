---
marp: true
theme: default
paginate: true
math: katex
title: "計數二元樹(Catalan 數)"
category: "Trees"
---

## 有幾種形狀?

$n$ 個節點的相異二元樹形狀數,正是第 $n$ 個 Catalan 數 $C_n$。

---

## 遞迴

依根分割:左 $i$ 個、右 $n-1-i$ 個,任一左形狀配任一右形狀。

$$C_n = \sum_{i=0}^{n-1} C_i \cdot C_{n-1-i}$$

卷積遞迴

---

## 封閉形與數列

$$C_n = \frac{1}{n+1}\binom{2n}{n}$$

封閉形

數列:1, 1, 2, 5, 14, 42, 132, 429, …

---

## 還出現在哪裡

- 合法括號序列
- 凸多邊形的三角剖分
- 不越過對角線的格路徑
