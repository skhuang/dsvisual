---
marp: true
theme: default
paginate: true
math: katex
title: "二元樹 COPY 與 EQUAL"
category: "Trees"
---

## 兩個配對操作

COPY 深拷貝一棵樹;EQUAL 判斷兩棵樹是否結構與內容皆相同。

---

## COPY(深拷貝)

先建新節點,再遞迴拷貝左右子樹;得到完全獨立的樹,且 equal(原, 副) 恆為真。

```cpp
TreeNode* copyTree(TreeNode* t) {
    if (!t) return nullptr;
    TreeNode* c = new TreeNode{ t->val };
    c->left  = copyTree(t->left);
    c->right = copyTree(t->right);
    return c;
}
```

---

## EQUAL(結構 + 內容)

1. 兩者皆空 → 相等。
2. 一空一非空 → 結構不同。
3. 值不同 → 值不同。
4. 否則遞迴比較左右子樹。

---

## 複雜度

| 操作 | 時間 | 空間 |
| --- | --- | --- |
| COPY | O(n) | O(h) |
| EQUAL | O(n) | O(h) |
