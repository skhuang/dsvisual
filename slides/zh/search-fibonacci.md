---
marp: true
theme: default
paginate: true
math: katex
title: "費氏搜尋"
category: "Searching & String Matching"
---

## 概念

在已排序陣列上,用費氏數來切分搜尋範圍,只需加減、不需除法。

- 取 ≥ n 的最小費氏數作為起點。
- 探測點 = offset + fib2(夾在陣列範圍內)。
- 依比較結果讓費氏數往下一階移動。

---

## 複雜度

- 時間 O(log N);空間 O(1)
- 避免除法,對某些硬體較友善。
