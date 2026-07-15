---
marp: true
theme: default
paginate: true
math: katex
title: "Sparse Matrix as an Orthogonal Linked List"
category: "Arrays"
---

## Why a Linked Representation?

The triple-array representation (matrix-sparse) is fixed-size: inserting or deleting one nonzero entry means shifting the whole array. When the set of nonzeros changes dynamically at run time — entries added or removed one at a time — a linked structure inserts or deletes a single node in O(1), with no shifting of the rest.

> The cost is two extra pointers (right, down) per nonzero entry.

---

## Orthogonal (Row + Column) Linked Lists

Every nonzero entry is a node (row, col, val) that belongs to two chains at once: the row chain it sits in (linked via right), and the column chain it sits in (linked via down). Each row and each column has its own header pointing to the first node of that chain.

```cpp
struct Node { int row, col, val; Node* right; Node* down; };
```

---

## Construction: Insert One at a Time

1. Scan the matrix in row-major order; create a node whenever a nonzero entry is found.
2. Append the new node to the tail of its row chain (rowTail[i]->right).
3. At the same time, append it to the tail of its column chain (colTail[j]->down).

```cpp
if (!rowHead[i]) rowHead[i] = n; else rowTail[i]->right = n; rowTail[i] = n;
if (!colHead[j]) colHead[j] = n; else colTail[j]->down = n;  colTail[j] = n;
```

---

## Transpose: Swap Rows and Columns

After transposing, what used to be a column becomes a new row. Since every node is already linked into both a row chain and a column chain, transposing needs no rescanning or data movement — simply read each column's chain (walking its down pointers) as the corresponding row chain of the transposed matrix.

```cpp
for (int j = 0; j < C; ++j) {
    cout << "  r" << j << ":";
    for (Node* p = colHead[j]; p; p = p->down)
        cout << " (" << p->row << "," << p->val << ")";
}
```

---

## Contrast with the Triple Array (matrix-sparse)

| Aspect | Triple array | Orthogonal linked list |
| --- | --- | --- |
| Size | Fixed; nonzero count must be known up front | Dynamic; grows/shrinks with insert/delete |
| Insert/delete one entry | O(terms) — array must shift | O(1) once the position is found |
| Transpose | O(cols + terms) via rowSize/startPos scatter | O(1) reinterpretation — no nodes are moved |
| Overhead | No pointers, but three parallel arrays | 2 pointers per node + row/col headers |
