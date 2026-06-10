---
marp: true
theme: default
paginate: true
math: katex
title: "Polynomial Addition"
category: "Arrays"
---

## Representation

A polynomial is a list of (coefficient, exponent) terms in descending exponent order.

---

## Two-Pointer Merge

1. Compare the leading exponents of both lists.
2. Take the term with the larger exponent.
3. Equal exponents: add coefficients; drop the term if the sum is zero.

```cpp
else {
    int sum = A[i].coef + B[j].coef;
    if (sum != 0) C.push_back({ sum, A[i].exp });
    i++; j++;
}
```

---

## Complexity

- Time O(m + n) — each term processed once
- Space O(m + n)
