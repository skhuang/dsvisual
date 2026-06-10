---
marp: true
theme: default
paginate: true
math: katex
title: "Fibonacci Search"
category: "Searching & String Matching"
---

## Idea

Search a sorted array by splitting the range at Fibonacci offsets — only additions/subtractions, no division.

- Start from the smallest Fibonacci number ≥ n.
- Probe = offset + fib2 (clamped to the array).
- Step the Fibonacci numbers down based on the comparison.

---

## Complexity

- Time O(log N); Space O(1)
- Avoids division — friendlier on some hardware.
