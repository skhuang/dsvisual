---
marp: true
theme: default
paginate: true
math: katex
title: "Binary Tree Traversal"
category: "Trees"
---

## What is Tree Traversal

Traversal visits every node exactly once in a systematic order.

- Preorder: node → left → right
- Inorder: left → node → right (sorted for a BST)
- Postorder: left → right → node
- Level-order: breadth-first using a queue

---

## Recursive vs Iterative

Recursion uses the implicit call stack; iteration replaces it with an explicit stack (DFS) or queue (level-order).

```cpp
void inorderIterative(Node* root) {
    std::stack<Node*> st; Node* cur = root;
    while (cur || !st.empty()) {
        while (cur) { st.push(cur); cur = cur->left; }
        cur = st.top(); st.pop();
        std::cout << cur->val << ' ';
        cur = cur->right;
    }
}
```

---

## Complexity

| Aspect | Cost |
| --- | --- |
| Time | O(N) |
| Space (DFS) | O(h) |
| Space (BFS) | O(w) |
