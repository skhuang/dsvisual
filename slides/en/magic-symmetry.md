---
marp: true
theme: default
paginate: true
math: katex
title: "Magic Square — Symmetry (D₄ Group Operations)"
category: "Arrays"
---

## The 8 Symmetries of a Square

A square has exactly 8 shape-preserving symmetries: 4 rotations ($0°, 90°, 180°, 270°$) plus 4 reflections (horizontal, vertical, main diagonal, anti-diagonal). Under composition, these 8 operations form a group — the <strong>dihedral group $D_4$</strong>.

> This is a concrete instance of a group acting on a set from abstract algebra: the group is $D_4$, and the set it acts on is the $n^2$ cell coordinates of the board.

---

## Symmetries as Coordinate Remaps

On an $n \times n$ array, every symmetry is nothing more than a function sending an old coordinate $(r,c)$ to a new one — the value itself never changes, only where it is stored.

1. Rotate $90°$: $(r,c) \to (c,\ n-1-r)$
2. Rotate $180°$: $(r,c) \to (n-1-r,\ n-1-c)$
3. Horizontal flip: $(r,c) \to (r,\ n-1-c)$; transpose: $(r,c) \to (c,\ r)$

```cpp
case 1: tr = c;         tc = n - 1 - r; break;  // r90
case 2: tr = n - 1 - r; tc = n - 1 - c; break;  // r180
case 6: tr = c;         tc = r;         break;  // transpose
```

---

## The Magic Property Is Invariant Under the Group Action

Remap every cell of a magic square by any $D_4$ operation, and the result is still magic: every row, every column, and both diagonals still sum to the same magic constant $M$.

$$M = \frac{n(n^2+1)}{2}\ \text{is unchanged by any of the 8 remaps}$$

Because each operation only regroups which values sit on which line — it never changes the sum of any such set of values.

> This is exactly the notion of an invariant: a quantity that stays fixed under a family of transformations. Here the invariant is the magic constant $M$.

---

## The Orbit Has at Most 8 Distinct Squares

Applying each of the 8 $D_4$ operations to the same magic square produces its <strong>orbit</strong> under the group action — at most 8 distinct squares (fewer if the square happens to have extra self-symmetry). For the Siamese square at $n=3,5,7$, the orbit size is exactly 8.

1. The group's composition relations hold on the square too: applying $r90$ four times in a row equals doing nothing (the identity).
2. Applying $transpose$ twice equals the identity.
3. $flipH$ followed by $flipV$ equals $r180$.

---

## Limits and Complexity

- The underlying square still comes from the Siamese/Coxeter rule, so this applies to odd order $n$.
- Applying one coordinate remap takes $O(n^2)$ time (relocating every cell).
- Verifying the result is still magic is likewise $O(n^2)$ (checking every row, column, and diagonal).
- Each of the 8 operations needs $O(n^2)$ space to hold the remapped square.
