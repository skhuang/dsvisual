---
marp: true
theme: default
paginate: true
math: katex
title: "Sparse Matrix & Fast Transpose"
category: "Arrays"
---

## Triple Representation

Store only nonzero entries as (row, col, value) triples to save space.

> Triples are kept in row-major order.

---

## FAST_TRANSPOSE

1. rowSize[c]: nonzeros per column (row counts of the transpose).
2. startPos[c]: prefix sums give each column's start in the result.
3. Scan the triples and scatter each to its transposed slot.

```cpp
for (const auto& t : a) {
    int dst = startPos[t.c]++;
    b[dst] = { t.c, t.r, t.v };
}
```

---

## Complexity

- Transpose O(cols + terms), better than dense O(rows×cols)
- Space O(terms)
