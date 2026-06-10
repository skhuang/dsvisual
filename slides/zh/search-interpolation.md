---
marp: true
theme: default
paginate: true
math: katex
title: "內插搜尋"
category: "Searching & String Matching"
---

## 概念

假設資料均勻分佈,用線性內插「猜」目標的位置,而非每次取中點。

$$pos = lo + \frac{(target - a[lo])\,(hi - lo)}{a[hi] - a[lo]}$$

內插位置公式

---

## 複雜度

- 平均 O(log log N)(均勻分佈時);最壞 O(N)
- 需注意 a[hi]=a[lo] 的除以零情形。
