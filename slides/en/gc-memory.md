---
marp: true
theme: default
paginate: true
math: katex
title: "Dynamic Storage / Garbage Collection"
category: "Memory / GC"
---

## Why Automatic Memory Management

Manual malloc/free easily causes leaks (forgetting to free) and dangling pointers (using freed memory). Automatic memory management lets the runtime track which objects are still in use and reclaim space that is no longer needed.

- Reachability: only objects traceable from roots (globals / stack variables) are considered alive.
- This section compares three classic strategies: mark-sweep, reference counting, and the buddy system.

---

## Mark-Sweep

1. Mark phase: traverse the object graph from every root and mark reachable objects as live.
2. Sweep phase: scan the whole heap; any object left unmarked is garbage and is freed.

```cpp
void markSweep(vector<Obj>& heap, const vector<int>& roots) {
    vector<int> stack = roots;
    while (!stack.empty()) {
        int id = stack.back(); stack.pop_back();
        if (heap[id].mark) continue;
        heap[id].mark = true;
        for (int r : heap[id].refs) stack.push_back(r);
    }
    for (auto& o : heap) if (!o.mark) o.freed = true;
}
```

> Pro: correctly reclaims cycles. Con: needs a stop-the-world pause and a full heap scan.

---

## Reference Counting & the Cycle Leak

Each object tracks how many references point to it. Adding a reference increments the count, removing one decrements it; when the count hits zero the object is freed immediately and its outgoing references are decremented in turn.

- Pro: prompt reclamation, no stop-the-world pause, easy to implement.
- Fatal flaw: a cycle (A→B→A) keeps its counts ≥ 1 even when unreachable, so it leaks.
- In this visualization: acyclic A and B get freed, while the mutually referencing D↔E pair survives even after losing its roots.

---

## Buddy System

The buddy system manages allocation in power-of-two sized blocks, balancing speed against external fragmentation.

1. Allocate: find the smallest power-of-two block ≥ the request; if too big, split it in half repeatedly until it fits.
2. Free: after returning a block, if its buddy (the adjacent, equal-sized free block) is also free, coalesce them into a larger block, repeating upward.

> A buddy's address is computed as start XOR size. Rounding up to a power of two causes internal fragmentation; coalescing fights external fragmentation.
