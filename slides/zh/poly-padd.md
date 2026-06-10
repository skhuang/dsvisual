---
marp: true
theme: default
paginate: true
math: katex
title: "多項式相加"
category: "Arrays"
---

## 表示法

多項式以「係數,指數」項列表示,依指數遞減排列。

---

## 雙指標合併

1. 比較兩列開頭項的指數。
2. 指數較大者直接取用。
3. 指數相同則係數相加;和為 0 則捨去該項。

```cpp
else {
    int sum = A[i].coef + B[j].coef;
    if (sum != 0) C.push_back({ sum, A[i].exp });
    i++; j++;
}
```

---

## 複雜度

- 時間 O(m + n)(各項僅處理一次)
- 空間 O(m + n)
