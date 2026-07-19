---
marp: true
theme: default
paginate: true
math: katex
title: "動態儲存管理 / 垃圾回收"
category: "Memory / GC"
---

## 為何需要自動記憶體管理

手動 malloc/free 容易造成記憶體洩漏(忘了釋放)與懸空指標(用了已釋放的記憶體)。自動記憶體管理由執行環境追蹤哪些物件還在使用,並回收不再需要的空間。

- 可達性(reachability):從 root(全域/堆疊變數)能追蹤到的物件才算存活。
- 本節比較三種經典策略:標記-清除、參考計數、夥伴系統。

---

## 標記-清除 (Mark-Sweep)

1. 標記階段:從所有 root 出發做圖走訪,把可達的物件標記為存活。
2. 清除階段:掃過整個堆積,沒被標記的物件即為垃圾,予以釋放。

```cpp
void markSweep(vector<Obj>& heap, const vector<int>& roots) {
    vector<int> stack = roots;
    while (!stack.empty()) {
        int id = stack.back(); stack.pop_back();
        if (heap[id].mark) continue;
        heap[id].mark = true;
        for (int r : heap[id].refs) stack.push_back(r);
    }
    for (auto& o : heap) if (!o.mark) o.freed = true;
}
```

> 優點:能正確回收環(cycle);缺點:需暫停程式(stop-the-world)並掃過整個堆積。

---

## 參考計數與環的洩漏

每個物件記錄被多少參考指向。新增參考時 +1,移除時 -1;計數歸零立即釋放,並遞迴地對它指向的物件遞減。

- 優點:回收即時、不需 stop-the-world,且易於實作。
- 致命缺點:互相參考的環(A→B→A)即使無人可達,計數也永遠 ≥1,造成洩漏。
- 本視覺化:無環的 A、B 會被釋放,而互指的 D↔E 即使脫離 root 仍殘留。

---

## 夥伴系統 (Buddy System)

夥伴系統把記憶體切成 2 的冪次大小的區塊來管理配置與釋放,平衡了速度與外部碎裂。

1. 配置:找到 ≥ 需求的最小 2 的冪區塊;若太大就對半切(split),直到剛好。
2. 釋放:歸還區塊後,若其『夥伴』(位址相鄰、同大小且空閒)也空閒,就合併(coalesce)成更大區塊,反覆向上。

> 夥伴位址用 start XOR size 計算。內部碎裂來自向上取整到 2 的冪;合併則對抗外部碎裂。

---

## 指標反轉標記 (Pointer-Reversal Mark, MARK2)

MARK2 是不需要輔助堆疊的標記法(Deutsch–Schorr–Waite 技巧):走訪時把剛經過的連結暫時反轉,當作回頭的路徑;走到死路後,再沿著反轉的連結往回走,並在路上把連結一一復原。

- 只需兩個額外變數(P、Q)加上每個節點一個位元(記錄哪個連結被反轉),完全不需要堆疊。
- 時間複雜度仍是 O(m),但常數較大:每個節點最多會被造訪三次。

```cpp
void mark2(M2Node* root) {
    M2Node* p = root;
    M2Node* q = nullptr;         // q: reversed back-pointer, replaces the explicit stack
    while (true) {
        if (p && !p->mark) {                       // first visit: mark, descend, reverse
            p->mark = true;
            if (p->tag) { p->c = false; M2Node* t = p->dlink; p->dlink = q; q = p; p = t; }
            else        { p->c = true;  M2Node* t = p->rlink; p->rlink = q; q = p; p = t; }
        } else {                                    // dead end: back up, restoring links
            if (!q) return;
            if (!q->c) { q->c = true; M2Node* t = q->dlink; q->dlink = p; p = q->rlink; q->rlink = t; }
            else       {              M2Node* t = q->rlink; q->rlink = p; p = q; q = t; }
        }
    }
}
```

> 權衡:省下顯式堆疊,換來更多指標搬動與每個節點一個額外位元。

---

## 記憶體壓縮 (Compaction, COMPACT)

標記完成後,存活與已回收的區塊會交錯散布在記憶體中。COMPACT 以三個回合(pass)把所有存活區塊滑向記憶體的一端,藉此消除外部碎裂。

1. 第一回合(assign new addresses):由左至右掃描,為每個存活區塊指定新位址,並累加已使用的空間。
2. 第二回合(rewrite links):把每個存活區塊裡的連結欄位,改寫成目標區塊的新位址。
3. 第三回合(relocate):把每個存活區塊實際搬移到它的新位址。

```cpp
void compact(vector<CBlock>& mem) {                                     // mem is in address order
    int av = 1;                                                        // pass 1: assign new addresses
    for (auto& b : mem) if (b.live) { b.newAddr = av; av += b.size; }
    unordered_map<int, int> remap; remap[0] = 0;                       // pass 2: rewrite links old -> new
    for (auto& b : mem) if (b.live) remap[b.addr] = b.newAddr;
    for (auto& b : mem) if (b.live) b.link = remap[b.link];
    for (auto& b : mem) if (b.live) b.addr = b.newAddr;                // pass 3: relocate
}
```

> 時間複雜度 O(n + s):n 為區塊數(三回合線性掃描),s 為實際搬動的資料量。
