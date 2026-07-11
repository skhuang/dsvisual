---
marp: true
theme: default
paginate: true
math: katex
title: "Magic Square — Latin-Square Decomposition"
category: "Arrays"
---

## Why Does Coxeter's Rule Work?

In a magic square built by the Siamese/Coxeter rule, every value decomposes as $v = n \cdot a + b + 1$, with $a, b \in \{0, ..., n-1\}$.

$$v = n \cdot a + b + 1,\quad a = \left\lfloor \frac{v-1}{n} \right\rfloor,\quad b = (v-1) \bmod n$$

$a$ is "how many groups of $n$", $b$ is the remainder — two base-$n$ digit places.

> The two "digit planes" $a$ and $b$ are each a Latin square: every row and every column is exactly a permutation of $0..n-1$.

---

## Two Latin Squares

1. Take the magic square of values $v$ (still produced by the Siamese/Coxeter rule from the previous topic).
2. For every cell compute $a = \lfloor (v-1)/n \rfloor$.
3. For every cell compute $b = (v-1) \bmod n$.
4. Verify: each of the $a$ and $b$ planes has every row and column equal to a permutation of $0..n-1$.

```cpp
a[r][c] = (v - 1) / n; b[r][c] = (v - 1) % n;    // digit planes
assert(v == n * a[r][c] + b[r][c] + 1);          // decomposition identity
```

---

## Why Every Line Sums to the Same Constant

The sum of any row (or column) is $\sum v = n \cdot (\sum a) + (\sum b) + n$. Because that row's $a$ and $b$ are each a permutation of $0..n-1$, both sums are the fixed constant $0+1+\cdots+(n-1) = \frac{n(n-1)}{2}$.

$$\sum v = n \cdot \frac{n(n-1)}{2} + \frac{n(n-1)}{2} + n = \frac{n(n^2+1)}{2} = M$$

This matches the magic constant $M$ exactly — the reason every row/column/diagonal has the same sum.

> Both diagonals satisfy the same property, so they land on the same sum too.

---

## Limits and Complexity

- This decomposition rides on the Siamese/Coxeter rule, so it only applies to odd order $n$.
- Splitting each cell is $O(1)$, over $n^2$ cells: time $O(n^2)$.
- Verifying each row/column is a permutation costs $O(n \log n)$ (sorting); over $n$ rows and $n$ columns that is $O(n^2 \log n)$.
- Storing the $a$ and $b$ planes takes $O(n^2)$ space.

---

## Summary

- The magic square's "magic" is really two independent Latin squares layered together: $v = n \cdot a + b + 1$.
- As long as each digit plane hits every value $0..n-1$ exactly once per row/column, the line sum is guaranteed constant.
- This view explains *why* the Coxeter/Siamese rule works, not just *how* to carry it out.
