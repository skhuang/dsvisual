---
marp: true
theme: default
paginate: true
math: katex
title: "魔方陣 — 拉丁方陣分解"
category: "Arrays"
---

## 為什麼 Coxeter 規則會成立?

沿用 Siamese/Coxeter 規則產生的魔方陣中,每個值都可以拆解成 $v = n \cdot a + b + 1$,其中 $a, b \in \{0, ..., n-1\}$。

$$v = n \cdot a + b + 1,\quad a = \left\lfloor \frac{v-1}{n} \right\rfloor,\quad b = (v-1) \bmod n$$

$a$ 是「幾組 n」,$b$ 是「餘數」——兩個 base-n 數字位。

> $a$、$b$ 這兩個「數字平面」各自都是一個拉丁方陣(Latin square):每列、每欄都恰好是 $0..n-1$ 的一個排列。

---

## 兩個拉丁方陣

1. 取得魔方陣 $v$(仍由 Siamese/Coxeter 規則產生,見上一節)。
2. 對每格計算 $a = \lfloor (v-1)/n \rfloor$。
3. 對每格計算 $b = (v-1) \bmod n$。
4. 驗證:$a$、$b$ 兩個平面各自的每一列、每一欄都是 $0..n-1$ 的排列。

```cpp
a[r][c] = (v - 1) / n; b[r][c] = (v - 1) % n;    // digit planes
assert(v == n * a[r][c] + b[r][c] + 1);          // decomposition identity
```

---

## 為什麼每條線的總和不變?

任一列(或欄)的總和是 $\sum v = n \cdot (\sum a) + (\sum b) + n$。由於該列的 $a$、$b$ 都是 $0..n-1$ 的排列,兩者的總和固定是 $0+1+\cdots+(n-1) = \frac{n(n-1)}{2}$。

$$\sum v = n \cdot \frac{n(n-1)}{2} + \frac{n(n-1)}{2} + n = \frac{n(n^2+1)}{2} = M$$

與魔方陣常數 $M$ 完全吻合——這正是每列/欄/對角線總和相同的原因。

> 兩條對角線同樣滿足這個性質,因此也得到相同的總和。

---

## 限制與複雜度

- 此分解沿用 Siamese/Coxeter 規則,因此僅適用於奇數階 $n$。
- 拆解每格為 $O(1)$,共 $n^2$ 格:時間 $O(n^2)$。
- 驗證每列/欄為排列各需 $O(n \log n)$(排序),$n$ 列 $n$ 欄共 $O(n^2 \log n)$。
- 儲存 $a$、$b$ 兩個平面需要 $O(n^2)$ 空間。

---

## 小結

- 魔方陣的「魔法」其實是兩個獨立拉丁方陣疊加的結果:$v = n \cdot a + b + 1$。
- 只要每個數字平面在每列/欄都恰好走遍 $0..n-1$,線總和就必然固定。
- 這個觀點解釋了 Coxeter/Siamese 規則背後「為什麼可行」,而不只是「如何操作」。
