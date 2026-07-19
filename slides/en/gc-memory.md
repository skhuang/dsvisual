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

---

## Pointer-Reversal Mark (MARK2)

MARK2 is a stack-free marking technique (the Deutsch–Schorr–Waite trick): while descending, it temporarily reverses the link it just followed and uses that reversal as the path back; at a dead end it backs up along the reversed links, restoring each one on the way.

- Only two extra variables (P, Q) plus one bit per node (recording which link is reversed) — no auxiliary stack at all.
- Time complexity is still O(m), but with a larger constant factor — each node may be visited up to three times.

```cpp
void mark2(M2Node* root) {
    M2Node* p = root;
    M2Node* q = nullptr;         // q: reversed back-pointer, replaces the explicit stack
    while (true) {
        if (p && !p->mark) {                       // first visit: mark, descend, reverse
            p->mark = true;
            if (p->tag) { p->c = false; M2Node* t = p->dlink; p->dlink = q; q = p; p = t; }
            else        { p->c = true;  M2Node* t = p->rlink; p->rlink = q; q = p; p = t; }
        } else {                                    // dead end: back up, restoring links
            if (!q) return;
            if (!q->c) { q->c = true; M2Node* t = q->dlink; q->dlink = p; p = q->rlink; q->rlink = t; }
            else       {              M2Node* t = q->rlink; q->rlink = p; p = q; q = t; }
        }
    }
}
```

> Trade-off: it saves the explicit stack at the cost of more pointer churn and one extra bit per node.

---

## Compaction (COMPACT)

After marking, live and freed blocks are interleaved in memory. COMPACT slides every live block toward one end of memory in three passes, eliminating external fragmentation.

1. Pass 1 (assign new addresses): scan left to right, assigning each live block a new address and accumulating used space.
2. Pass 2 (rewrite links): rewrite every link field of each live block to its target's new address.
3. Pass 3 (relocate): physically move each live block to its new address.

```cpp
void compact(vector<CBlock>& mem) {                                     // mem is in address order
    int av = 1;                                                        // pass 1: assign new addresses
    for (auto& b : mem) if (b.live) { b.newAddr = av; av += b.size; }
    unordered_map<int, int> remap; remap[0] = 0;                       // pass 2: rewrite links old -> new
    for (auto& b : mem) if (b.live) remap[b.addr] = b.newAddr;
    for (auto& b : mem) if (b.live) b.link = remap[b.link];
    for (auto& b : mem) if (b.live) b.addr = b.newAddr;                // pass 3: relocate
}
```

> Time complexity O(n + s): n blocks are scanned in three linear passes, plus s words of data are actually relocated.
