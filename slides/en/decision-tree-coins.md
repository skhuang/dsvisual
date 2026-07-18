---
marp: true
theme: default
paginate: true
math: katex
title: "8-Coins Decision Tree"
category: "Trees"
---

## The Puzzle

Among 8 coins one is counterfeit (heavier or lighter); using an equal-arm balance, find it and its direction in 3 weighings.

---

## A Ternary Decision Tree

- each weighing has three outcomes: left down / balanced / right down
- internal nodes are weighings; the three edges are the outcomes
- leaves name the fake coin and heavy/light

---

## The EIGHTCOINS Procedure

1. Weigh {a,b,c} vs {d,e,f}.
2. Balanced → fake in {g,h}; else in the heavier/lighter group.
3. A second weighing narrows it; a third compares against a known-good coin (COMP).

---

## Information-Theoretic Optimality

> Three ternary weighings give $3^3 = 27$ leaves, enough to distinguish the 16 answers (8 coins × heavy/light).

$$3^3 = 27 \geq 16$$

why 3 weighings suffice
