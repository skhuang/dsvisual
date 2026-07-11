---
marp: true
theme: default
paginate: true
math: katex
title: "魔方陣 — 環面拼貼"
category: "Arrays"
---

## 方陣其實是一個環面

Siamese/Coxeter 規則裡的 <code>(row&minus;1+n)%n</code>、<code>(col&minus;1+n)%n</code> 不是「邊界特例判斷」,而是在宣告:方陣的左右邊互相相連、上下邊也互相相連——這正是一個環面(torus)的鄰接關係。

> 和一維的環狀佇列(circular queue)用 <code>(i+1)%capacity</code> 把陣列頭尾接起來是同一個想法,只是這裡把它做成二維:每一個維度各自「首尾相接」一次。

---

## Step 與 Break 向量

1. 預設走「左上」一步:在環面座標上這是位移向量 $(-1,-1)$。
2. 若目標格已被填過,改成「往下」一步:位移向量 $(+1,0)$,稱為 break。
3. 兩個向量都先計算、再用 <code>%n</code> 包回環面,所以永遠落在方陣內。

```cpp
int up = (row - 1 + n) % n;    // step vector (-1, -1), wrapped mod n
int left = (col - 1 + n) % n;
if (sq[up][left] != 0) row = (row + 1) % n;   // break vector (+1, 0)
else { row = up; col = left; }                // run continues
```

---

## 拼貼環面:斷裂對角線變直線

把方陣的 9 份拷貝拼成 3n×3n 的平面(中央那份是真正的方陣,其餘 8 份是環面上的鄰接副本)。在原本的方陣上,一次連續的左上移動一旦碰到邊界就要「繞回」,形成一條斷裂對角線;但攤平在拼貼平面上,同一段移動只是單純地跨過拼貼邊界,變成一條真正筆直的斜線。

> 填數順序恰好走訪每個格子一次,是環面上的一條漢彌爾頓路徑(Hamiltonian path);每次 break 就是路徑上重新起頭、開始下一條斜線。

---

## 限制與複雜度

- 沿用 Siamese/Coxeter 規則,僅適用於奇數階 $n$。
- 建立方陣為 $O(n^2)$;拼貼渲染同樣是 $O(n^2)$(9 份拷貝,每份 $O(n^2/9)$格)。
- 恰有 $n$ 條直斜線(run)與 $n-1$ 次 break 跳躍。
