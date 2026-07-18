---
marp: true
theme: default
paginate: true
math: katex
title: "循序(陣列)表示"
category: "Trees"
---

## 用陣列存二元樹

把二元樹放進 1-based 陣列,節點位置本身就編碼了結構,不需指標。

- 節點 $i$ 的左子在 $2i$
- 右子在 $2i+1$
- 父節點在 $\lfloor i/2 \rfloor$

---

## 索引運算

```cpp
int left(int i)  { return 2*i; }
int right(int i) { return 2*i + 1; }
int parent(int i){ return i/2; }
```

> 空位以 "-" 佔位;層序讀入 token,位置 k 即索引 k。

---

## 偏斜樹的浪費

完全樹沒有浪費;偏斜樹很浪費:高度 $h$ 的樹可能需要 $2^{h+1}-1$ 個槽,卻只有 $h+1$ 個節點。

---

## 複雜度

| 面向 | 成本 |
| --- | --- |
| 索引運算 | O(1) |
| 空間(最壞) | $O(2^h)$ |
