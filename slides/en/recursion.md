---
marp: true
theme: default
paginate: true
math: katex
title: "Recursion (Call Tree & Call Stack)"
category: "Recursion"
---

## Recursion (Call Tree & Call Stack)

Recursion is a function calling itself, directly or indirectly, to solve a problem: a large problem is broken into structurally identical smaller subproblems until reaching a smallest case that can be answered directly.

---

## Two Essentials: Base Case & Recursive Case

- Base case: the smallest, directly answerable situation where recursion stops — it prevents infinite calls.
- Recursive case: builds the answer from one or more smaller subcalls, and every step must make progress toward the base case.
- A missing base case, or subproblems that fail to shrink, causes infinite recursion and stack overflow.

---

## Call Stack (LIFO) & Call Tree

Each call pushes a stack frame onto the call stack, holding local variables and the return address; the frame is popped when the function returns. The stack is Last-In-First-Out (LIFO): the most recent call returns first.

- The call tree describes the parent-child relationship of all subcalls; at any instant the stack is just the root-to-current path through that tree.
- Recursion depth = height of the call tree = the maximum stack height during execution, which bounds memory usage.

---

## Five Examples, Five Different Call Shapes

- Fibonacci: $fib(k)=fib(k-1)+fib(k-2)$ branches into two, and subproblems repeat (overlapping subproblems), so the number of calls grows exponentially — memoization fixes this.
- Reverse string: exactly one subcall per level, so the call tree degenerates into a chain — depth is linear in length ($O(n)$).
- Permutations: each node branches by the number of remaining characters, forming a wide, shallow tree of exponential size whose leaves are all permutations.
- Binary search: each call recurses into only the left or right half, so the tree is a single path of length $O(\log n)$ — logarithmic depth.
- Quicksort: each call partitions the range around a pivot and recurses on the left and right segments, forming a partition tree; average height $O(\log n)$, worst case $O(n)$.

> In the visualization, the call tree grows step by step on the left with each node's return value, while the call stack pushes and pops in sync on the right — together they show that the stack is one path through the tree.
