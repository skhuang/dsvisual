---
marp: true
theme: default
paginate: true
math: katex
title: "Reconstruct a Tree from Two Traversals"
category: "Trees"
---

## The Problem

Given two traversal sequences of a tree with distinct keys, rebuild the tree.

- preorder+inorder: unique (any binary tree)
- postorder+inorder: unique (any binary tree)
- preorder+postorder: unique only for full binary trees

---

## Preorder + Inorder

1. The preorder head is the root.
2. Find the root in inorder; the left part is the left subtree, the right part the right subtree.
3. Recurse on both parts.

---

## Preorder + Postorder Ambiguity

> Preorder+postorder is unique only for full binary trees (every node 0 or 2 children); a single-child node can't be placed unambiguously.

---

## Complexity

- Time O(n) (hash-map to locate the root)
- Space O(n)
