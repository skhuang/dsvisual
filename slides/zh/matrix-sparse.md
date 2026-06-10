---
marp: true
theme: default
paginate: true
math: katex
title: "稀疏矩陣與快速轉置"
category: "Arrays"
---

## 三元組表示法

只儲存非零元素為 (列, 欄, 值) 三元組,節省大量空間。

> 三元組以列為主序排列。

---

## FAST_TRANSPOSE

1. rowSize[c]:每欄非零數(轉置後的每列數)。
2. startPos[c]:前綴和求每欄在結果中的起始位置。
3. 掃描原三元組,將每個放到轉置位置。

```cpp
for (const auto& t : a) {
    int dst = startPos[t.c]++;
    b[dst] = { t.c, t.r, t.v };
}
```

---

## 複雜度

- 轉置 O(cols + terms),優於密集 O(rows×cols)
- 空間 O(terms)
