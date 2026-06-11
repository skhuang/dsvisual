---
marp: true
theme: default
paginate: true
math: katex
title: "Expression Tree"
category: "Trees"
---

## Build from Postfix

Scan the postfix with a stack of subtrees: operands become leaves; an operator joins the top two subtrees under a new node.

1. Operand: create a leaf and push it.
2. Operator: pop two subtrees as children, push the combined tree.
3. At the end, the single remaining subtree is the expression tree.

---

## Evaluation & Complexity

Evaluate bottom-up: leaves are values; internal nodes apply their operator to the children's results.

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

- Build and evaluation are both O(N); space O(N).
