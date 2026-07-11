---
marp: true
theme: default
paginate: true
math: katex
title: "Magic Square — Toroidal Tiling"
category: "Arrays"
---

## The Board Is Actually a Torus

The <code>(row&minus;1+n)%n</code> / <code>(col&minus;1+n)%n</code> wraps in the Siamese/Coxeter rule aren't a special-cased edge check — they declare that the board's left/right edges are glued together, and so are its top/bottom edges. That adjacency is exactly a torus.

> It's the same idea as a 1-D circular queue using <code>(i+1)%capacity</code> to glue the front and back of an array — just applied in two dimensions, one wrap per axis.

---

## Step and Break Vectors

1. The default move is one step up-left: on torus coordinates that's the displacement vector $(-1,-1)$.
2. If the target cell is already filled, take one step down instead: displacement vector $(+1,0)$ — a "break".
3. Both vectors are computed first and then wrapped with <code>%n</code> back onto the torus, so the result always lands back inside the board.

```cpp
int up = (row - 1 + n) % n;    // step vector (-1, -1), wrapped mod n
int left = (col - 1 + n) % n;
if (sq[up][left] != 0) row = (row + 1) % n;   // break vector (+1, 0)
else { row = up; col = left; }                // run continues
```

---

## Tiling the Torus: Broken Diagonals Become Straight

Tile 9 copies of the board into a 3n×3n plane (the center copy is the real board; the other 8 are its torus-adjacent neighbors). On the plain board, a run of up-left moves that hits an edge has to "wrap around", producing a broken diagonal. Flattened onto the tiled plane, the very same run just crosses a tile border — it becomes one genuinely straight diagonal line.

> The fill order visits every cell exactly once — a Hamiltonian path on the torus. Every break simply re-anchors the walk and starts the next straight diagonal.

---

## Limits and Complexity

- This rides on the Siamese/Coxeter construction, so it only applies to odd order $n$.
- Building the square is $O(n^2)$; rendering the 3×3 tiling is likewise $O(n^2)$ (9 copies, each $O(n^2/9)$ cells).
- There are exactly $n$ straight diagonals (runs) and $n-1$ break jumps.
