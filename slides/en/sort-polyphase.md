---
marp: true
theme: default
paginate: true
math: katex
title: "Polyphase Merge Sort (Tapes)"
category: "Sorting"
---

## External Sorting Recap

External sorting first builds sorted runs, then merges them repeatedly. The classic approach uses an even number of tapes for balanced merging; polyphase achieves it with just 3 tapes (2 input + 1 output).

---

## Why Uneven (Fibonacci) Distribution

Balanced merge leaves half the tapes idle after each pass and needs rewind/redistribution. Polyphase distributes runs by consecutive Fibonacci counts, so exactly one input tape empties each phase and immediately becomes the next output tape — no wasted redistribution pass.

- Distribution is perfect when the run count is a Fibonacci number.
- E.g. 13 runs → 8 on one tape, 5 on the other.

---

## The 3-Tape Merge Phases

1. Distribute: place runs onto Tape 1 and Tape 2 by Fibonacci counts; Output starts empty.
2. Merge: each step takes one run from each input tape, merges them, and appends to the output tape.
3. Rotate: when an input tape empties, it becomes the new output tape for the next phase.

---

## Dummy Runs

When the run count is not exactly a Fibonacci number, the shortfall is padded with dummy (empty) runs. During merging a dummy is treated as exhausted — the other run passes through — preserving the Fibonacci invariant.

---

## Worked Example

Input [5,3,8,1,9,2,7,4,6,0] has natural runs [5][3,8][1,9][2,7][4,6][0] — 6 of them. The nearest Fibonacci sum ≥ 6 is 5+3=8, so we pad 2 dummies and split the 8 slots as 5+3.

```cpp
Run mergeTwo(const Run& a, const Run& b) {
    Run out; size_t i = 0, j = 0;
    while (i < a.size() && j < b.size())
        out.push_back(a[i] <= b[j] ? a[i++] : b[j++]);
    while (i < a.size()) out.push_back(a[i++]);
    while (j < b.size()) out.push_back(b[j++]);
    return out;
}
```
