---
marp: true
theme: default
paginate: true
math: katex
title: "外部合併排序"
category: "Sorting"
---

## 為何需要外部排序

資料量大於記憶體時,無法一次內排序,需分段處理並控制 I/O。

---

## 兩階段

1. Run generation:讀入 M 筆、內排序、寫出一個 run。
2. k-way merge:用選擇樹(winner tree)每步取 k 個 run head 的最小值。

```cpp
while (!pq.empty()) {
    auto [val, r, pos] = pq.top(); pq.pop();
    out.push_back(val);
    if (pos + 1 < (int)runs[r].size())
        pq.push({runs[r][pos + 1], r, pos + 1});
}
```

---

## 成本

- Pass 數 = 1 + ⌈log_k(run 數)⌉
- 選擇樹讓每次取最小僅需 O(log k)
