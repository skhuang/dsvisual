---
marp: true
theme: default
paginate: true
math: katex
title: "稀疏矩陣的正交鏈結串列表示法"
category: "Arrays"
---

## 為什麼要用鏈結串列?

三元組陣列(matrix-sparse)是固定大小的表示法:插入或刪除一個非零元素,需要搬移整個陣列。若矩陣會隨程式執行動態增減非零項(例如逐步累加、逐步刪除),鏈結串列可以在 O(1) 完成單一節點的插入/刪除,不必搬移其他元素。

> 代價是每個非零元素多了兩個指標(right、down)的額外空間。

---

## 正交(列 + 欄)鏈結串列

每個非零元素是一個節點 (row, col, val),同時屬於兩條鏈:它所在列的「列鏈」(以 right 指標串接),以及它所在欄的「欄鏈」(以 down 指標串接)。每列、每欄各有一個表頭(header),指向該鏈的第一個節點。

```cpp
struct Node { int row, col, val; Node* right; Node* down; };
```

---

## 建構：逐一插入

1. 依列為主序掃描矩陣,遇到非零元素就建立一個節點。
2. 把新節點接到它所在列鏈的尾端(rowTail[i]->right)。
3. 同時把它接到它所在欄鏈的尾端(colTail[j]->down)。

```cpp
if (!rowHead[i]) rowHead[i] = n; else rowTail[i]->right = n; rowTail[i] = n;
if (!colHead[j]) colHead[j] = n; else colTail[j]->down = n;  colTail[j] = n;
```

---

## 轉置：列與欄互換

轉置後,原本的「欄」變成新的「列」。因為每個節點本來就同時掛在列鏈與欄鏈上,轉置不需要重新掃描或搬移資料——只要把每欄的鏈結串列,直接當成轉置矩陣的列鏈結串列來讀(沿著 down 指標走,把它解讀成 right 方向)。

```cpp
for (int j = 0; j < C; ++j) {
    cout << "  r" << j << ":";
    for (Node* p = colHead[j]; p; p = p->down)
        cout << " (" << p->row << "," << p->val << ")";
}
```

---

## 與三元組陣列（matrix-sparse）比較

| 面向 | 三元組陣列 | 正交鏈結串列 |
| --- | --- | --- |
| 儲存大小 | 固定,需先知道非零項數 | 動態,隨插入/刪除增減 |
| 插入/刪除一項 | O(terms),需搬移陣列 | O(1)(找到位置後) |
| 轉置 | O(cols + terms),用 rowSize/startPos 排序寫入 | O(1) 重新解讀,不搬移節點 |
| 額外空間 | 無指標,但需三個並列陣列 | 每節點 2 個指標 + 列/欄表頭 |
