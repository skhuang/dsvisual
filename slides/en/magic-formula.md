---
marp: true
theme: default
paginate: true
math: katex
title: "Magic Square — O(1) getValue Formula"
category: "Arrays"
---

## From Array to Formula: A Computed Field

The previous two topics both build the whole $n \times n$ square first, then read a value out of it. This topic asks a different question: can we skip building the square entirely, and compute a cell's value directly from $(i,j)$?

> This is the classic "computed property replaces a stored table" trade-off — the same idea as a perfect hash replacing a lookup table, or a getter function replacing a cached column.

---

## The Two Digit Planes Are Linear

The previous topic showed that $a = \lfloor (v-1)/n \rfloor$ and $b = (v-1) \bmod n$ are each a Latin square. Expanding the Siamese/Coxeter fill rule shows that $a$ and $b$ are in fact linear functions of $(i,j)$, taken mod $n$.

$$a = \left(i - j + \frac{n-1}{2}\right) \bmod n, \qquad b = \big(i - 2j + (n-1)\big) \bmod n$$

The two constants $(n-1)/2$ and $n-1$ depend only on $n$ — they are the same for every cell.

> C++'s <code>%</code> can return a negative result for negative operands, so guard it with <code>((x % m) + m) % m</code> to keep the result in $0..n-1$.

---

## Recomposing the Value: The O(1) Formula

1. Compute $a = (i-j+(n-1)/2) \bmod n$.
2. Compute $b = (i-2j+(n-1)) \bmod n$.
3. Apply the decomposition identity $value = n \cdot a + b + 1$.
4. At no point is an $n \times n$ array read or written.

```cpp
int getValue(int n, int i, int j) {
    int a = mod(i - j + (n - 1) / 2, n);
    int b = mod(i - 2 * j + (n - 1), n);
    return n * a + b + 1;
}
```

---

## Formula vs. Stored Table

| Approach | Query one cell | Extra space | Fill all cells |
| --- | --- | --- | --- |
| Sequential build (Siamese) | Needs the whole table built first, $O(n^2)$ | $O(n^2)$ (the whole square + visited bookkeeping) | $O(n^2)$ |
| This formula | $O(1)$, any order, repeatable | $O(1)$ | $O(n^2)$ (each cell independently $O(1)$) |

> This mirrors a common space-optimization technique: when a value can be computed on the fly from a handful of parameters, there's no need to cache or store it in full.

---

## Summary: Tying Back to the Latin Decomposition

- The $a$ and $b$ here are exactly the two Latin-square planes from <code>magic-latin</code> — just computed straight from $(i,j)$ instead of read out of a pre-built square.
- Because $a$ and $b$ are linear and each forms a Latin square, the same fixed-line-sum property still holds.
- "Build the table, then look it up" and "compute on demand, never store it" are two answers to the same question — which one wins depends on whether you'll query many cells repeatedly (favoring the table) or just a few (favoring the formula).
