---
marp: true
theme: default
paginate: true
math: katex
title: "運算式樹"
category: "Trees"
---

## 從後序式建樹

用一個「子樹堆疊」掃描後序式:運算元成為葉節點,運算子把兩棵子樹接成新樹。

1. 遇運算元:建立葉節點並推入堆疊。
2. 遇運算子:彈出兩棵子樹當左右子,合併成新樹後推回。
3. 掃描完成,堆疊上剩下的唯一一棵即為運算式樹。

---

## 求值與複雜度

自底向上遞迴求值:葉為數值,內部節點對左右結果套用其運算子。

```cpp
while (in >> tok) {
    ENode* n = new ENode{ tok, nullptr, nullptr };
    if (isOp(tok)) {
        n->right = st.top(); st.pop();
        n->left = st.top(); st.pop();
    }
    st.push(n);
}
```

- 建樹與求值皆為 O(N);空間 O(N)。
