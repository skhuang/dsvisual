---
marp: true
theme: default
paginate: true
math: katex
title: "Huffman 編碼"
category: "Trees"
---

## 問題

給定符號頻率,求最小總長度的前綴碼。

> 前綴碼:沒有任一碼是另一碼的前綴,故可無歧義解碼。

---

## 貪婪建樹

1. 每個符號各成一棵單節點樹,放入優先佇列。
2. 取出頻率最小的兩棵,合併成新節點(頻率相加)。
3. 重複直到只剩一棵樹。
4. 左邊記 0、右邊記 1,根到葉的路徑即為碼。

```cpp
while (pq.size() > 1) {
    HNode* a = pq.top(); pq.pop();
    HNode* b = pq.top(); pq.pop();
    HNode* m = new HNode(a->freq + b->freq, '\0');
    m->l = a; m->r = b;
    pq.push(m);
}
```

---

## 最優性與複雜度

貪婪每步取兩最小,可證得加權路徑長最小(最優前綴碼)。

$$WPL = \sum_i f_i \cdot \text{depth}(i)$$

目標:最小化加權路徑長

- 建樹:O(N log N)
- 空間:O(N)
