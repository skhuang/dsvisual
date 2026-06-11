---
marp: true
theme: default
paginate: true
math: katex
title: "賽局樹(Minimax / α-β 剪枝)"
category: "Trees"
---

## 對抗式搜尋

在雙人零和賽局(如井字遊戲、西洋棋)中,兩名玩家輪流行動且利益完全對立。我們以賽局樹表示所有可能的局面:每一層交替由 MAX 與 MIN 玩家做決策。

- MAX 層(根為 MAX)選擇能讓分數最大的子節點(以 ▲ 表示)。
- MIN 層選擇能讓分數最小的子節點(以 ▽ 表示)。
- 葉節點是終局評估值(效用值)。

---

## Minimax 遞迴式

每個節點的值由其子節點遞迴決定:MAX 取子節點最大值,MIN 取子節點最小值。葉節點直接回傳其評估值。

若 n 為 MAX,$V(n) = \max_{c} V(c)$;否則 $V(n) = \min_{c} V(c)$。

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

## α-β 剪枝

α 是 MAX 在路徑上已能保證的最佳下界;β 是 MIN 已能保證的最佳上界。當 α ≥ β 時,目前節點剩餘的子節點不可能影響最終結果,可直接剪除。

- 剪枝不改變 Minimax 的最終值,只省略不必要的探索。
- 在最佳排序下,複雜度從 $O(b^d)$ 降到 $O(b^{d/2})$。

---

## 範例:[3,5,6,9,1,2,0,-1]

這 8 個葉節點構成一棵深度為 3 的二元賽局樹(根 MAX、下層 MIN、再下層 MAX)。逐步評估左子樹後,α 被抬高;在右子樹中一旦某個節點的暫定值使 α ≥ β,其後續兄弟分支即被剪枝。

- 灰色節點代表被 α-β 剪枝跳過、從未求值的子樹。
- 用視覺化中的 α-β 開關可比較剪枝與否的探索範圍。
