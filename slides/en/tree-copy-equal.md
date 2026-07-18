---
marp: true
theme: default
paginate: true
math: katex
title: "Tree COPY & EQUAL"
category: "Trees"
---

## Two Paired Operations

COPY makes a deep copy of a tree; EQUAL tests whether two trees are identical in structure and content.

---

## COPY (Deep Copy)

Create the node, then recursively copy the left and right subtrees; the result is fully independent and equal(original, copy) is always true.

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

## EQUAL (Structure + Content)

1. Both empty → equal.
2. One empty, one not → structural mismatch.
3. Different values → value mismatch.
4. Otherwise recurse on both subtrees.

---

## Complexity

| Operation | Time | Space |
| --- | --- | --- |
| COPY | O(n) | O(h) |
| EQUAL | O(n) | O(h) |
