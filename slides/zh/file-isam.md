---
marp: true
theme: default
paginate: true
math: katex
title: "ISAM 索引循序存取"
category: "File Structures"
---

## 索引循序存取的概念

ISAM(Indexed Sequential Access Method)把排序好的資料分裝進固定大小的資料區塊,再額外維護一層索引,記下每個區塊的最小鍵值。如此既能像循序檔逐筆讀取,又能透過索引快速定位。

- 資料層:鍵值排序後依 blockSize 切成多個區塊,區塊內也是排序的。
- 索引層:每個區塊一筆 (minKey, blockIndex),索引本身也按 minKey 排序。

---

## 兩層結構:索引 → 資料區塊

索引層遠小於資料層(每區塊只佔一筆),通常可常駐記憶體;資料區塊則放在磁碟。一次查詢只需讀取索引加上一個資料區塊,大幅減少磁碟存取。

```cpp
vector<vector<int>> blocks;
for (size_t i = 0; i < keys.size(); i += blockSize)
    blocks.push_back(vector<int>(keys.begin() + i,
        keys.begin() + min(keys.size(), i + blockSize)));
```

---

## 查詢路徑:索引 → 區塊 → 掃描

1. 掃描索引:找出最後一個 minKey ≤ 目標鍵的索引項,鎖定對應的資料區塊。
2. 進入區塊:在該區塊內循序(或二分)掃描比對每個鍵。
3. 判定結果:找到即回報區塊與槽位;掃完仍無則回報 not-found。

> 本視覺化逐格呈現:先高亮索引項,再高亮選中的資料區塊,最後逐槽掃描,命中轉綠、落空整塊轉紅。

---

## 插入與溢位處理 (Overflow)

資料區塊容量固定,當某區塊已滿仍要插入新鍵時,多出的鍵會掛到該區塊的溢位鏈(overflow chain)上,而非重整整個檔案。

- 查詢時若主區塊找不到,會接著掃描溢位鏈。
- 缺點:溢位鏈變長會讓查詢退化;需定期重建(reorganize)索引以回復效能。

> ISAM 是靜態索引結構;若資料頻繁增刪,B-tree / B+-tree 的動態平衡通常更合適。
