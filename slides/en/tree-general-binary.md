---
marp: true
theme: default
paginate: true
math: katex
title: "General ↔ Binary Tree"
category: "Trees"
---

## Why Convert

A general tree's node may have any number of children, which is awkward for fixed-size node records. The left-child / right-sibling encoding stores any-degree tree as a binary tree whose nodes have exactly two pointers.

- left points to the first child.
- right points to the next sibling.

---

## Conversion Rule

1. Attach each node's first child as its left pointer.
2. Chain siblings together via right pointers.
3. Recurse on every child applying the same rule.

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

## Worked Example: A:B,C,D;B:E,F

A's first child B becomes A.left; C and D are chained via right (B.right=C, C.right=D). Likewise B's first child E becomes B.left, with F as E.right.

- Every left edge in the binary tree is a parent→first-child link.
- Every right edge is a sibling→sibling link.

---

## Traversal Correspondence

A preorder traversal of the converted binary tree matches the original general tree's preorder; the binary tree's inorder matches the general tree's postorder. The conversion is reversible, so the two representations are equivalent.
