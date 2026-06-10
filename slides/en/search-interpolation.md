---
marp: true
theme: default
paginate: true
math: katex
title: "Interpolation Search"
category: "Searching & String Matching"
---

## Idea

Assuming uniform data, guess the target's position by linear interpolation instead of always taking the midpoint.

$$pos = lo + \frac{(target - a[lo])\,(hi - lo)}{a[hi] - a[lo]}$$

Interpolation position formula

---

## Complexity

- Average O(log log N) (uniform data); worst O(N)
- Watch out for division by zero when a[hi] = a[lo].
