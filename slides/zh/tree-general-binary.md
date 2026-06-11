---
marp: true
theme: default
paginate: true
math: katex
title: "一般樹 ↔ 二元樹"
category: "Trees"
---

## 為何要轉換

一般樹的節點可有任意多個子節點,難以用固定欄位的節點表示。透過「左子右兄」表示法,可以把任意分支度的樹編碼成每個節點只有兩個指標的二元樹。

- left 指向「第一個子節點」。
- right 指向「下一個兄弟節點」。

---

## 轉換規則

1. 把每個節點的第一個子節點接到該節點的 left。
2. 把同層的兄弟節點以 right 串成一條鏈。
3. 遞迴地對每個子節點重複以上步驟。

```cpp
BinNode* toBinary(const string& node) {
    BinNode* bn = new BinNode{node};
    BinNode* prev = nullptr;
    for (size_t i = 0; i < children[node].size(); ++i) {
        BinNode* c = toBinary(children[node][i]);
        if (i == 0) bn->left = c;
        else prev->right = c;
        prev = c;
    }
    return bn;
}
```

---

## 範例:A:B,C,D;B:E,F

A 的第一個子節點 B 成為 A.left;C、D 透過 B 的 right 串接(B.right=C、C.right=D)。同理 B 的第一個子節點 E 成為 B.left,F 為 E.right。

- 二元樹中所有 left 邊對應「父→第一子」關係。
- 所有 right 邊對應「兄→弟」關係。

---

## 走訪對應

對轉換後二元樹做前序走訪,順序與原一般樹的前序走訪完全一致;二元樹的中序走訪則對應原樹的後序走訪。轉換為可逆,故兩種表示等價。
