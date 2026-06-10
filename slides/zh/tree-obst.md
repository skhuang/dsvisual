---
marp: true
theme: default
paginate: true
math: katex
title: "最佳二元搜尋樹"
category: "Trees"
---

## 問題

已知各 key 的存取頻率,求加權路徑長最小的 BST。

> 常存取的 key 應靠近根,以降低平均比較次數。

---

## 動態規劃

$$cost[i][j] = \min_{i\le r\le j}\big(cost[i][r-1]+cost[r+1][j]\big) + W(i,j)$$

對每個子區間試所有可能的根 r

- 依子區間長度由小到大填表
- W(i,j) = 區間頻率總和
- 記錄最佳根以便重建樹

---

## 複雜度

- 時間 O(N³);Knuth 優化可達 O(N²)
- 空間 O(N²)
