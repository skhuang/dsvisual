---
marp: true
theme: default
paginate: true
math: katex
title: "Game Tree (Minimax / α-β)"
category: "Trees"
---

## Adversarial Search

In two-player zero-sum games (tic-tac-toe, chess), players alternate moves with opposing goals. A game tree enumerates all reachable positions, with levels alternating between the MAX and MIN players.

- MAX levels (root is MAX) pick the child with the largest score (shown as the up triangle).
- MIN levels pick the child with the smallest score (shown as the down triangle).
- Leaves carry terminal evaluation (utility) values.

---

## Minimax Recurrence

Each node's value is defined recursively from its children: MAX takes the maximum of its children, MIN the minimum; a leaf returns its evaluation directly.

If n is MAX, $V(n) = \max_{c} V(c)$; otherwise $V(n) = \min_{c} V(c)$.

```cpp
int minimax(Node* n, int alpha, int beta, bool useAB) {
    if (n->leaf) return n->value;
    int best = n->isMax ? INT_MIN : INT_MAX;
    for (Node* c : n->children) {
        int v = minimax(c, alpha, beta, useAB);
        if (n->isMax) { best = max(best, v); alpha = max(alpha, best); }
        else          { best = min(best, v); beta  = min(beta, best); }
        if (useAB && alpha >= beta) break;
    }
    return best;
}
```

---

## Alpha-Beta Pruning

Alpha is the best lower bound MAX can already guarantee along the path; beta is the best upper bound MIN can guarantee. When alpha >= beta, the remaining children of the current node can no longer affect the outcome and are pruned.

- Pruning never changes the minimax value; it only skips unnecessary exploration.
- With ideal ordering, complexity drops from $O(b^d)$ to $O(b^{d/2})$.

---

## Worked Example: [3,5,6,9,1,2,0,-1]

These 8 leaves form a depth-3 binary game tree (MAX root, then MIN, then MAX). After evaluating the left subtree, alpha rises; in the right subtree, as soon as a node's provisional value makes alpha >= beta, its remaining sibling branches are pruned.

- Greyed nodes are subtrees skipped by alpha-beta pruning and never evaluated.
- Toggle alpha-beta in the visualizer to compare the explored frontier with and without pruning.
