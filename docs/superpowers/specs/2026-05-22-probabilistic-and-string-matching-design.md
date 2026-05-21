# Spec 3 — Probabilistic Structures + String Matching 設計文件

## 目標與背景

補齊 🟡「值得補」分級中的兩塊缺口:

1. **Hash & Probabilistic** 分類目前只有 3 個雜湊表變體(chaining / open addressing / bucketing),分類名稱裡的「Probabilistic」一直是空的。本 spec 補上 3 個機率型結構:Bloom Filter、Skip List、Count-Min Sketch,讓分類名實相符。
2. **Searching & String Matching** 在 Spec 2b 已有 KMP / Boyer-Moore / Rabin-Karp 及三者比較。本 spec 再補兩個不同典範:Z-Algorithm(線性單模式比對)與 Aho-Corasick(多模式自動機比對)。

**此為 4 份 spec 中的第 3 份**,接續 Spec 2a(Graphs + DSU)、Spec 2b(Deque + String Matching)。Spec 4(🟢 加分項)留待之後處理。Spec 3 在既有的 9 分類架構上補內容,不動分類結構。

執行方法論:brainstorming → writing-plans → subagent-driven-development → finishing-a-development-branch。

## 方法清單

新增 **5 個方法**:

| id | 標題 | 分類(附加位置) | C++ 檔 | visualizer | controls |
|---|---|---|---|---|---|
| `bloom-filter` | Bloom Filter | Hash & Probabilistic,接在 `hash-bucket` 後 | `bloom_filter.cpp` | `bloom` | `bloom` |
| `skip-list` | Skip List | Hash & Probabilistic | `skip_list.cpp` | `skiplist` | `skiplist` |
| `count-min-sketch` | Count-Min Sketch | Hash & Probabilistic | `count_min_sketch.cpp` | `cms` | `cms` |
| `search-zalgo` | Z-Algorithm | Searching & String Matching,接在 `search-strcompare` 後 | `search_zalgo.cpp` | `string-search` | `string-search` |
| `search-aho` | Aho-Corasick | Searching & String Matching,字串方法最後 | `search_aho.cpp` | `aho-corasick` | `aho-corasick` |

最終 **Hash & Probabilistic** 分類順序:hash-chain → hash-open → hash-bucket → **bloom-filter → skip-list → count-min-sketch**。

最終 **Searching & String Matching** 分類順序:search-linear → search-binary → search-kmp → search-bm → search-rk → search-strcompare → **search-zalgo → search-aho**。

注意:METHOD_GROUPS 條目中的 `visualizer` 與 `controls` 欄位在現行程式碼中僅作為描述性 metadata(實際 dispatch 全部以 `currentMode` 進行),沿用既有慣例填寫即可。

## 架構決策

**程式碼組織沿用 Spec 2b 已驗證的方案**:5 個視覺化器各自一份自足的 render 函式(`renderBloomFilter` / `renderSkipList` / `renderCountMinSketch` / `renderZAlgo` / `renderAhoCorasick`),不強行抽取共用元件。五者形狀差異大(位元陣列 / 多層串列 / 二維計數矩陣 / Z 陣列 / 帶失敗連結的 trie),共用元件只會與內容打架。

**唯一的共用件**:三個逐步型方法(Skip List 搜尋、Z-Algorithm、Aho-Corasick)共用一個小型 Step / Run / Reset 控制列輔助函式 —— 它建立三顆按鈕並把它們接到一個步進 callback,確保三者控制列一致。若 Spec 2b 已留下可用的同類輔助函式,直接重用。

**所有新 render 函式都必須走 `acquireDynamicVizHost()`**(Spec 2a commit `07bf627` 引入的模式),把內容渲染進 `#dynamic-viz-host`,絕不直接對 `runtimeVisualizer`(`.stack-container-wrapper`)做 `innerHTML = ''` —— 後者會摧毀所有靜態容器,導致之後切回靜態方法時崩潰。

**控制項內嵌**:所有新方法的互動控制項由 render 函式動態建立並內嵌進 `#dynamic-viz-host`,不修改 `index.html`。此為 Spec 2a / 2b 已驗證的模式。

**dispatch 注意事項**:三個機率型方法的 id(`bloom-filter` / `skip-list` / `count-min-sketch`)**不帶 `hash-` 前綴**,因此不會落入既有的 `currentMode.includes('hash-')` 分支 —— 它們各需獨立的 `updateLayout` 與 `renderAll` dispatch 分支。兩個字串方法的 id 帶 `search-` 前綴,屬既有 `search-` 字串方法家族,沿用該家族的 dispatch 結構,各補自己的 `codeTitle` / `codeDisplay`。

**雜湊函式各自獨立**:Bloom Filter、Count-Min Sketch、Skip List 的視覺化器在 JS 端自行計算雜湊函式 / 隨機層級,作為獨立教學模擬;C++ 檔是各自獨立的教學程式碼。兩端不需產生相同的雜湊值 —— 此為既有 hash 視覺化器(`hash-chain` 等以 `val % 5` 在 JS 端獨立模擬)已採用的慣例。

## Bloom Filter 設計

### C++(`bloom_filter.cpp`)

`class BloomFilter`:持有 32 位元的 `std::vector<bool> bits`、**3 個雜湊函式**(3 個不同種子的多項式字串雜湊)。方法:`insert(const std::string&)`(把 3 個雜湊位元設為 1)、`bool possiblyContains(const std::string&)`(3 個位元全為 1 才回傳 true)。`main()` 插入 `cat` / `dog` / `bird`,查詢已插入項與未插入項,並以註解說明「definitely not present」與「possibly present」的語意,以及為何不會有 false negative。

項目型別為**字串(單字)**——「這個字在集合裡嗎?」是 Bloom Filter 的經典教學框架。

### 視覺化器(`renderBloomFilter()`)

一列 32 個位元格(顯示 0 / 1,附索引標籤);文字輸入框 + `Insert` / `Query` 兩顆按鈕。

```
 hashes of "dog" → {4, 17, 29}
 [0][0][0][0][1][0]...[1]...[1]...   index 0..31
```

- **Insert**:計算單字的 3 個雜湊,把對應 3 個位元設為 1,高亮這 3 格;單字加入「已插入」清單。
- **Query**:計算 3 個雜湊,高亮被檢查的 3 格 —— 全為 1 → 「possibly present」(琥珀色);任一為 0 → 「definitely not」(紅色)。查詢一個從未插入、卻剛好命中全 1 位元的單字,可直接展示 false positive。
- 顯示目前單字算出的 3 個雜湊索引。
- 預載示範:插入 `cat` / `dog` / `bird`,避免空畫面。
- 狀態訊息沿用既有 `showStatus`。

## Skip List 設計

### C++(`skip_list.cpp`)

`struct Node { int key; std::vector<Node*> forward; };`、`class SkipList`:`MAX_LEVEL = 4`、`randomLevel()` 以擲硬幣決定層數、`head` 哨兵節點。方法:`insert(int)`、`bool search(int)`、`remove(int)`。`main()` 插入數個鍵、搜尋命中與未命中、刪除一個鍵並印出。

鍵為**整數**(有序結構需要可比較的鍵)。

### 視覺化器(`renderSkipList()`)

多層結構垂直堆疊:level 0(最底)含全部節點,上層為快車道。每個節點是一個顯示鍵值的方框,forward 指標以箭頭繪製,最左為 `head` 哨兵、最右為 `NIL`。

```
 L3  head ───────────────────────► NIL
 L2  head ──────────► [12] ───────► NIL
 L1  head ──► [7] ──► [12] ──────► NIL
 L0  head ──► [3] ──► [7] ──► [12] ──► [19] ──► [25] ──► NIL
```

- **互動操作**:數值輸入框 + `Insert` / `Delete` 按鈕,按下即重繪。Insert 以擲硬幣決定層數,並在狀態列顯示結果(例如 `level 2`)。
- **逐步搜尋**:另一個搜尋輸入框 + `Step` / `Run` / `Reset`。動畫呈現搜尋路徑 —— 當 `next.key < target` 往右移,否則往下降一層;高亮目前節點與正在跟隨的指標;結束時標示 found(綠)/ not found。
- 預載示範鍵 `[3, 7, 12, 19, 25]`。

## Count-Min Sketch 設計

### C++(`count_min_sketch.cpp`)

`class CountMinSketch`:**3 × 8 的計數矩陣**(3 列 = 3 個雜湊函式,8 行)。方法:`update(const std::string&)`(每列各加 1 個計數)、`int estimate(const std::string&)`(回傳 3 個對應格的**最小值**)。`main()` 對數個單字 update 數次、estimate 其頻率,並以註解說明估計值「永不低估、可能高估」的性質。

項目型別為**字串(單字)**——詞頻估計是 Count-Min Sketch 的經典教學框架。

### 視覺化器(`renderCountMinSketch()`)

一個 3 × 8 的計數格矩陣,列標籤為雜湊函式編號,行附索引標籤。

```
        c0  c1  c2  c3  c4  c5  c6  c7
   h0 [  0   2   0   0   1   0   0   0 ]
   h1 [  0   0   1   0   0   2   0   0 ]
   h2 [  1   0   0   0   0   0   2   0 ]
```

- 文字輸入框 + `Add`(update +1)/ `Estimate` 兩顆按鈕。
- **Add**:每列各算一個雜湊 → 行索引,該格加 1,高亮被遞增的 3 格(每列一格)。
- **Estimate**:算出 3 格,高亮並顯示各格值與 `estimate = min(...)`。
- 顯示一個小型**「actual vs estimate」對照**(視覺化器另存一份真實計數 Map),讓「永不低估、可能因碰撞高估」的性質可見。
- 矩陣尺寸 d = 3、w = 8。

## Z-Algorithm 設計

### C++(`search_zalgo.cpp`)

`std::vector<int> computeZ(const std::string&)` 建立 Z 陣列。字串比對採標準串接法:`pattern + '$' + text`,對串接字串求 Z 陣列,凡 `Z[i] == pattern.length()` 之位置即為一次命中。`zSearch(text, pattern)` 回傳所有命中的 text 索引。`main()` 對固定示範資料執行並印出命中位置。

### 固定示範資料

沿用 Spec 2b 字串方法的範例以利跨方法比較:pattern `ABABCABAB`(長度 9)、text `ABABDABACDABABCABAB`(長度 19)。串接字串為 `ABABCABAB$ABABDABACDABABCABAB`(長度 29)。

### 視覺化器(`renderZAlgo()`)

```
 idx  0  1  2  3  4  5  6  ...
 chr  A  B  A  B  C  A  B  ...      ← 串接字串 P$T
 Z    -  0  ?  ?  ...               ← Z 值,逐步填入
       └──[ l , r ]──┘              ← 目前 Z-box 視窗
```

- 第一列為串接字串的字元格(附索引);第二列為各格下方的 Z 值,逐步計算填入。
- **Step**:計算下一個索引 `i` 的 `Z[i]` —— 顯示 `i` 是落在目前 `[l, r]` 框內(重用鏡射值)或框外(明確逐字比對),並更新 `[l, r]`;高亮正在比較的格。
- `Z[i] == pattern.length()` 時將該位置標為命中(綠),並換算回 text 索引。
- 計數器:比較次數。控制列:`Step` / `Run` / `Reset`。

## Aho-Corasick 設計

### C++(`search_aho.cpp`)

Aho-Corasick 自動機:`struct Node { std::map<char, Node*> children; Node* fail; std::vector<int> output; };`。`build()` 把所有 pattern 插入 trie,再以 BFS 計算 failure 連結與合併 output 連結。`search(const std::string& text)` 掃描文字,沿 goto / failure 連結前進並蒐集所有命中。`main()` 由固定 pattern 集建立自動機、掃描固定文字、印出所有命中(pattern + 位置)。

### 固定示範資料

採經典教科書範例:pattern 集 `{he, she, his, hers}`、text `ushers`。命中:`she`@1、`he`@2、`hers`@2。範例小巧且廣為人知,trie 僅約 11 個節點,可完整繪製。

### 視覺化器(`renderAhoCorasick()`)

**兩個逐步階段,由單一 `Step` / `Run` / `Reset` 驅動**,並顯示階段標籤:

- trie 繪成一棵小樹(≤ 11 個節點),每個節點標示其字元。
- **階段一「Building failure links」**:逐步執行 BFS —— 每步從佇列取出一個節點、計算其 failure 連結、以虛線箭頭繪出;同時顯示 BFS 佇列內容。
- **階段二「Scanning text」**:一列文字(`ushers`)配一個掃描指標;高亮目前所在的自動機節點。每步沿實線 `goto` 邊前進,或沿虛線 `fail` 連結回跳直到有 goto 可走;落在帶 output 的節點即回報命中。
- 計數器:命中數。階段標籤顯示目前處於建構或掃描階段。

實線 = goto 邊、虛線 = failure 連結,以顏色 / 線型區分。

## 簡報

**5 份雙語(zh / en)8 頁簡報**,結構同 Spec 2b 參考 deck:

1. 概述(paragraph)
2. 核心概念(paragraph + bullets)
3. 運作流程(steps + mermaid)
4. 示意圖(svg + note)
5. 複雜度分析(table + math)
6. 程式碼(code,`lang: cpp`)
7. 優缺點與使用時機(bullets)
8. 小結(bullets)

5 份:`bloom-filter`、`skip-list`、`count-min-sketch`、`search-zalgo`、`search-aho`。各 deck 的 `category` 欄位對應其所屬 group 標題(`"Hash & Probabilistic"` 或 `"Searching & String Matching"`)。

**複雜度(簡報內容須正確)**:

| 方法 | 關鍵複雜度 |
|---|---|
| Bloom Filter | insert / query $O(k)$;空間 $O(m)$ 位元;false positive 率 $\approx (1 - e^{-kn/m})^k$;無 false negative |
| Skip List | search / insert / delete 期望 $O(\log n)$、最差 $O(n)$;空間 $O(n)$ |
| Count-Min Sketch | update / estimate $O(d)$;空間 $O(d \cdot w)$;估計值永不低估 |
| Z-Algorithm | 時間與空間皆 $O(n + m)$ |
| Aho-Corasick | 建構 $O(\sum \lvert P_i \rvert)$;搜尋 $O(\lvert text \rvert + \#matches)$ |

($n$、$m$ 分別為主要輸入長度;$k$ = 雜湊函式數;$d$、$w$ = sketch 的列數與行數。)

簡報的 mermaid 須用 `flowchart`、僅用矩形 `[...]` 節點(不可用 `([...])` stadium 節點 —— 渲染不確定會破壞 `build:slides` 冪等性);含括號的標籤要加引號;LaTeX 反斜線在 JS 字串中須寫成 `\\`;中文用全形標點。視覺化圖表須呈現完整資料。本 spec 無比較方法,簡報之間不需交叉連結。

## 整合檢查清單(每個方法)

源自 PR #57(`build_db.js` 缺 mapping)與 Spec 2a 容器摧毀回歸的教訓。每個新方法須完成:

1. `build_db.js` 加入 `.cpp → code 常數` mapping(**必須先於 `.cpp` 建立**,否則 `code_db.js` 重生會掉常數)。
2. `METHOD_GROUPS` 加入條目。
3. `getCodeForMethod` 加入 mapping。
4. `updateLayout` 加入分支:設定 `codeTitle` / `codeDisplay`;預設的 hide-all 已處理面板隱藏。三個機率型方法不帶 `hash-` 前綴,需各自的分支;兩個字串方法屬既有 `search-` 家族。
5. `renderAll` 加入 dispatch。
6. render 函式經由 `acquireDynamicVizHost()` 渲染 —— 絕不直接 `runtimeVisualizer.innerHTML = ''`。

## 測試

- 每個方法 1 個 Playwright render 測試(共 5 個):驗證檔名與關鍵 DOM —— Bloom 位元格、Skip List 各層、CMS 計數矩陣、Z 陣列列、Aho-Corasick trie 節點。
- 擴充既有的「動態 → 靜態」導覽回歸測試,加入 `bloom-filter → hash-chain` 與 `search-zalgo → search-linear` 兩條路徑,確保新動態方法不會摧毀靜態容器。
- 冪等性:`npm run format:code` 與 `npm run build:slides` 重跑後 `git status` 乾淨。
- 全套件:`npm run test:all` 全綠。

## CSS

新增的 CSS 規則一律附加在 `style.css` 末端,類別名稱以方法前綴命名空間:`bloom-`、`skiplist-`、`cms-`、`zalgo-`、`aho-`,避免與既有規則衝突。

## 不在範圍內

- Spec 4(🟢 加分項)的方法。
- 既有靜態 hash 視覺化器(`hash-chain` / `hash-open` / `hash-bucket`)的改寫 —— 維持原樣,不轉成動態模式。
- 字串方法(`search-zalgo` / `search-aho`)的自訂輸入 —— 使用固定示範資料即可,與既有 KMP / BM / RK 一致。
- 兩個分類皆不新增比較方法。
- 分類 nav 結構調整(沿用既有 9 分類)。

## 預期產出

5 個新方法、5 個 `.cpp` 檔、5 份雙語簡報、~5+ 個新 Playwright 測試,以及 `acquireDynamicVizHost()` 模式在所有新動態視覺化器上的一致套用。Hash & Probabilistic 分類自此名實相符,Searching & String Matching 涵蓋單模式與多模式兩種典範。
