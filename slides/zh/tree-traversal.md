---
marp: true
theme: default
paginate: true
math: katex
title: "二元樹走訪"
category: "Trees"
---

## 什麼是樹走訪

走訪是以系統化順序恰好造訪每個節點一次。

- 前序:節點 → 左 → 右
- 中序:左 → 節點 → 右(BST 得遞增序)
- 後序:左 → 右 → 節點
- 層序:用佇列的廣度優先

---

## 遞迴 vs 迭代

遞迴隱含使用呼叫堆疊;迭代則以顯式 stack(DFS)或 queue(層序)取代。

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

## 複雜度

| 面向 | 成本 |
| --- | --- |
| 時間 | O(N) |
| 空間(DFS) | O(h) |
| 空間(層序) | O(w) |
