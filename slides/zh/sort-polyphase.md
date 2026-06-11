---
marp: true
theme: default
paginate: true
math: katex
title: "Polyphase 磁帶合併排序"
category: "Sorting"
---

## 外部排序回顧

外部排序先產生有序的 run,再反覆合併。傳統做法用偶數條磁帶平衡合併;Polyphase 只用 3 條磁帶(2 讀 1 寫)就能做到。

---

## 為何用不均勻(Fibonacci)分配

平衡合併每個 pass 後一半的磁帶閒置,需要倒帶重分配。Polyphase 把 run 數依連續 Fibonacci 數分到兩條輸入帶,使得每次只有一條帶被讀空,立即翻轉成下一個輸出帶,沒有重分配的浪費。

- 若 run 數正好是 Fibonacci 數,分配最完美。
- 如 13 個 run → 一帶 8 個、一帶 5 個。

---

## 3 條磁帶的合併階段

1. 分配:依 Fibonacci 數把 run 放到 Tape 1、Tape 2,Output 留空。
2. 合併:每步從兩條輸入帶各取一個 run 合併,寫到輸出帶。
3. 翻轉:當一條輸入帶讀空,它成為新的輸出帶,繼續下一階段。

---

## Dummy(虛擬)run

當 run 數不是恰好的 Fibonacci 數時,差額用 dummy(空)run 補足分配。Dummy run 在合併時被當成已耗盡,直接讓對方 run 通過,維持 Fibonacci 不變式。

---

## 計算範例

輸入 [5,3,8,1,9,2,7,4,6,0] 的自然 run 為 [5][3,8][1,9][2,7][4,6][0],共 6 個。最接近且 ≥6 的 Fibonacci 合是 5+3=8,故補 2 個 dummy,8 個位置分成 5+3。

```cpp
Run mergeTwo(const Run& a, const Run& b) {
    Run out; size_t i = 0, j = 0;
    while (i < a.size() && j < b.size())
        out.push_back(a[i] <= b[j] ? a[i++] : b[j++]);
    while (i < a.size()) out.push_back(a[i++]);
    while (j < b.size()) out.push_back(b[j++]);
    return out;
}
```
