---
marp: true
theme: default
paginate: true
math: katex
title: "ISAM (Indexed Sequential Access)"
category: "File Structures"
---

## Indexed Sequential Access

ISAM (Indexed Sequential Access Method) packs sorted records into fixed-size data blocks and maintains a separate index recording the minimum key of each block. This supports both sequential reads and fast index-driven lookups.

- Data level: sorted keys are split into blocks of blockSize, and keys stay sorted within each block.
- Index level: one entry (minKey, blockIndex) per block, and the index itself is sorted by minKey.

---

## Two Levels: Index → Data Blocks

The index level is far smaller than the data level (one entry per block) and often fits in memory, while data blocks live on disk. A lookup reads the index plus a single data block, drastically cutting disk accesses.

```cpp
vector<vector<int>> blocks;
for (size_t i = 0; i < keys.size(); i += blockSize)
    blocks.push_back(vector<int>(keys.begin() + i,
        keys.begin() + min(keys.size(), i + blockSize)));
```

---

## Search Path: Index → Block → Scan

1. Scan the index: find the last entry whose minKey ≤ the target key, selecting its data block.
2. Enter the block: scan its keys sequentially (or binary search) comparing each one.
3. Decide: on a match report the block and slot; if the scan ends with no match, report not-found.

> The visualization steps through it: highlight the index entry, then the chosen block, then scan slot by slot — a hit turns green, a miss turns the whole block red.

---

## Insertion & Overflow Handling

Data blocks have fixed capacity. When a full block must accept a new key, the surplus key is appended to that block's overflow chain rather than reorganizing the whole file.

- On lookup, if the main block misses, the search continues along the overflow chain.
- Drawback: long overflow chains degrade lookups, so the index must be periodically reorganized to restore performance.

> ISAM is a static index structure; for frequently changing data, the dynamic balancing of B-trees / B+-trees is usually a better fit.
