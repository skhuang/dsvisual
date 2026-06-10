---
marp: true
theme: default
paginate: true
math: katex
title: "External Merge Sort"
category: "Sorting"
---

## Why External Sorting

When data exceeds memory, we cannot sort it all at once — we process it in pieces and manage I/O.

---

## Two Phases

1. Run generation: read M records, sort in memory, write a run.
2. k-way merge: a selection (winner) tree picks the minimum of the k run heads each step.

```cpp
while (!pq.empty()) {
    auto [val, r, pos] = pq.top(); pq.pop();
    out.push_back(val);
    if (pos + 1 < (int)runs[r].size())
        pq.push({runs[r][pos + 1], r, pos + 1});
}
```

---

## Cost

- Number of passes = 1 + ⌈log_k(#runs)⌉
- The selection tree makes each minimum extraction O(log k)
