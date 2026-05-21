# Spec 2b — Deque + String Matching 設計文件

## 目標與背景

補齊 🔴 強烈建議項目中與 **Linear Structures** 與 **String Matching** 相關的方法,讓字串比對教學完整(KMP / Boyer-Moore / Rabin-Karp,並提供三者比較),並以雙向串列實作的 Deque 形成「單向串列 → 雙向串列」的自然教學進程。

**此為 4 份 spec 中的第 2b 份**,接續 Spec 2a(Graphs + Disjoint Set)。後續 Spec 3(🟡)、Spec 4(🟢)留待之後處理。Spec 2b 在既有的 9 分類架構上補內容,不動結構。

執行方法論:brainstorming → writing-plans → subagent-driven-development → finishing-a-development-branch。

## 方法清單

新增 **5 個方法**:

| id | 標題 | 分類(附加位置) | C++ 檔 | visualizer | controls |
|---|---|---|---|---|---|
| `deque` | Deque (Double-Ended Queue) | Linear Structures,接在 `list-linked` 後 | `deque.cpp` | `deque` | `deque` |
| `search-kmp` | KMP (Knuth-Morris-Pratt) | Searching & String Matching,接在 `search-binary` 後 | `search_kmp.cpp` | `string-search` | `string-search` |
| `search-bm` | Boyer-Moore | Searching & String Matching | `search_bm.cpp` | `string-search` | `string-search` |
| `search-rk` | Rabin-Karp | Searching & String Matching | `search_rk.cpp` | `string-search` | `string-search` |
| `search-strcompare` | String Matching Compared | Searching & String Matching,字串方法最後 | `search_strcompare.cpp` | `string-compare` | `string-compare` |

最終 Linear Structures 分類順序:stack-array → stack-list → queue → list-array → list-linked → **deque**。

最終 Searching & String Matching 分類順序:search-linear → search-binary → **search-kmp → search-bm → search-rk → search-strcompare**。

教學順序理由:字串方法先各別學 KMP → BM → RK,最後 `search-strcompare` 同步比較三者。`deque` 接在 `list-linked` 之後,延續單向串列的概念到雙向串列。

注意:METHOD_GROUPS 條目中的 `visualizer` 與 `controls` 欄位在現行程式碼中僅作為描述性 metadata(實際 dispatch 全部以 `currentMode` 進行),沿用既有慣例填寫即可。

## 架構決策

**程式碼組織採方案 B**:三個字串比對視覺化器各自獨立自足的 render 函式(`renderKMP` / `renderBM` / `renderRK`),但共用一個 `buildAlignmentRow()` 小工具繪製文字/樣式對齊列;比較方法 `renderStringCompare()` 自成一份。這與 Spec 2a 已驗證的模式一致(分支自足、函式內適度 DRY),避免過度抽象。

**所有新 render 函式都必須走 `acquireDynamicVizHost()`**(Spec 2a commit `07bf627` 引入的模式),把內容渲染進 `#dynamic-viz-host`,絕不直接對 `runtimeVisualizer`(即 `.stack-container-wrapper`)做 `innerHTML = ''`——後者會摧毀所有靜態容器並導致之後切換到靜態方法時崩潰。

**控制項內嵌**:所有新方法的互動控制項(deque 的 4 顆按鈕、字串方法的 Step/Run/Reset)由 render 函式動態建立並內嵌進視覺化區(`#dynamic-viz-host` 內),不修改 `index.html`。此為 Spec 2a 的 tree-dsu 已驗證的模式。

## Deque 設計

### C++(`deque.cpp`)

以雙向串列實作:`struct Node { int val; Node* prev; Node* next; };`,類別 `Deque` 持有 `head`、`tail` 指標與 `size`。四個 O(1) 操作:`pushFront`、`pushBack`、`popFront`、`popBack`,外加 `print()`。`main()` 示範一連串操作。空 deque 的 pop 操作須安全處理(回傳或印出提示,不解參考空指標)。

### 視覺化器(`renderDeque()`,新增)

水平的雙向串列:每個節點一個方框顯示整數值,節點間以 `⇄` 雙向箭頭連接,最左標 `head`、最右標 `tail`,兩端各畫一個 `null`。

```
        head                       tail
          ↓                          ↓
 null ⇄ [ 10 ] ⇄ [ 20 ] ⇄ [ 30 ] ⇄ null
```

初始預載示範資料 `[10, 20, 30]`,避免空畫面。

### 控制項

由 `renderDeque()` 內嵌建立:一個數值輸入框 + 4 顆按鈕 `Push Front`、`Push Back`、`Pop Front`、`Pop Back`。屬即時操作型(像既有的 stack/queue),非逐步動畫——按下按鈕即更新串列並重繪。

### 錯誤處理

對空 deque 執行 `Pop Front` / `Pop Back` 時,以狀態訊息提示(沿用既有 `showStatus`),不崩潰、不產生負 size。

## 字串比對:共用基礎

### 固定示範資料

沿用 KMP 經典範例,所有字串方法(含比較方法)共用:

- **Text**:`ABABDABACDABABCABAB`(長度 19)
- **Pattern**:`ABABCABAB`(長度 9)
- 樣式在 text 的 index 10 命中。

### 共用小工具 `buildAlignmentRow(text, pattern, offset)`

回傳一段 DOM:把 `text` 畫成一列字元格,把 `pattern` 畫成對齊到 `offset` 位置的字元格列。呼叫端可額外標記「當前比對中的格」為 match(綠)或 mismatch(紅)。三個字串方法與比較方法共用此工具。

### 字串方法的控制項

每個字串方法(KMP/BM/RK)由 render 函式內嵌一條控制列:`Step`、`Run`、`Reset` 三顆按鈕。`Step` 推進一步比對/位移;`Run` 連續執行到結束;`Reset` 回到初始狀態。逐步互動是此類方法的核心教學價值,因此按鈕必須真正可運作(非 Spec 2a graph-bfs 那種休眠 handler)。

## 字串比對:各別方法

### search-kmp(`renderKMP()`)

- **對齊列** + **LPS(最長相等前後綴 / 失敗函數)陣列面板**:pattern 每個字元下方一格顯示其 LPS 值。
- Step 語意:比對 `text[i]` 與 `pattern[j]`。相等則 `i`、`j` 同時前進;不等則用 LPS 把 `j` 回退(`j = lps[j-1]`),`i` 不動。高亮當前使用中的 LPS 格。
- 顯示比對次數計數。命中時整段樣式格染綠。
- C++:`computeLPS()` + `kmpSearch()`。

### search-bm(`renderBM()`)

- **對齊列** + **壞字元表**(每個出現過的字元 → 其在 pattern 中最右的索引)+ **好後綴表**。
- Step 語意:pattern 由右往左掃描比對。mismatch 時,位移量取 `max(壞字元位移, 好後綴位移)`;在面板上標示是哪個啟發式決定了本次位移。
- 顯示比對次數。
- C++:`buildBadChar()` + `buildGoodSuffix()` + `boyerMooreSearch()`。完整 Boyer-Moore(含好後綴)。

### search-rk(`renderRK()`)

- **對齊列** + **滾動雜湊面板**:顯示 pattern 的雜湊值,以及當前視窗的雜湊值。
- Step 語意:視窗滑動一格,以滾動雜湊 O(1) 更新當前視窗雜湊;與 pattern 雜湊比對。雜湊相等時進入「逐字驗證」子步驟,在面板上明確區分「雜湊碰撞(假命中)」與「真命中」。
- 顯示雜湊比對次數與驗證次數。
- C++:`rabinKarpSearch()`,含 rolling hash 與碰撞後的逐字驗證。

## 字串比對:比較方法 search-strcompare

`renderStringCompare()`——鏡像 Spec 2a 的 `renderGraphDual()`:

- 3 個垂直堆疊的小窗格,依序為 **KMP / BM / RK**。
- 每個窗格:一條精簡的對齊列 + 一個比對次數計數。
- 單一 `Step` / `Run` / `Reset` 控制列,同步推進三個演算法各自一步。
- 某演算法跑完即在該窗格停住;凸顯「誰先完成」「誰比對次數最少」。
- C++(`search_strcompare.cpp`):包含三個搜尋函式的精簡版與一個 `main()`,對同一 text/pattern 跑三者並印出各自比對次數。教學檔案,跨檔重複實作可接受(本專案不採跨 `.cpp` 的 `#include`)。

## 簡報

5 份雙語(zh/en)8 頁簡報,結構同 Spec 2a 參考 deck(`graph-adjlist`):

1. 概述(paragraph)
2. 核心概念(paragraph + bullets)
3. 運作流程(steps + mermaid)
4. 示意圖(svg + note)
5. 複雜度分析(table + math)
6. 程式碼(code)
7. 優缺點與使用時機(bullets)
8. 小結(bullets)

五份:`deque`、`search-kmp`、`search-bm`、`search-rk`、`search-strcompare`。

**複雜度(簡報內容須正確)**:

| 演算法 | 預處理 | 搜尋 | 空間 |
|---|---|---|---|
| KMP | $O(m)$ | $O(n)$ | $O(m)$ |
| Boyer-Moore | $O(m + \sigma)$ | 最佳 $O(n/m)$、最差 $O(nm)$ | $O(m + \sigma)$ |
| Rabin-Karp | $O(m)$ | 平均 $O(n + m)$、最差 $O(nm)$ | $O(1)$ |

($n$ = text 長度,$m$ = pattern 長度,$\sigma$ = 字母表大小。)

Deque 簡報:四端點操作皆 $O(1)$,空間 $O(n)$。

**交叉連結**:`search-strcompare` 的小結頁連結至 `search-kmp` / `search-bm` / `search-rk`;三個各別 deck 的小結頁連結至 `search-strcompare`。

簡報的 mermaid 須用 `flowchart`(非裸 `graph`)、含括號的標籤要加引號;LaTeX 反斜線在 JS 字串中須寫成 `\\`;中文用全形標點 `,` `;` `()`。視覺化圖表須呈現完整資料,不可只畫部分。

## 整合檢查清單(每個方法)

源自 PR #57(build_db.js 缺 mapping)與 Spec 2a 容器摧毀回歸的教訓。每個新方法須完成:

1. `build_db.js` 加入 `.cpp → code 常數` mapping(**必須先於 `.cpp` 建立**,否則 `code_db.js` 重生會掉常數)
2. `METHOD_GROUPS` 加入條目
3. `getCodeForMethod` 加入 mapping
4. `updateLayout` 加入分支:設定 `codeTitle` / `codeDisplay`;預設的 hide-all 已處理面板隱藏
5. `renderAll` 加入 dispatch
6. render 函式經由 `acquireDynamicVizHost()` 渲染——絕不直接 `runtimeVisualizer.innerHTML = ''`

## 測試

- 每個方法 1 個 Playwright render 測試(共 5 個):驗證檔名、關鍵 DOM(deque 節點、對齊列、LPS/壞字元/雜湊面板、3 窗格等)。
- 擴充既有的跨「動態→靜態」導覽回歸測試(Spec 2a `07bf627` 新增的那個),加入 `deque → queue` 與 `search-kmp → search-linear` 兩條路徑,確保新的動態方法不會摧毀靜態容器。
- 冪等性:`npm run format:code` 與 `npm run build:slides` 重跑後 `git status` 乾淨。
- 全套件:`npm run test:all` 全綠。

## CSS

新增的 CSS 規則一律附加在 `style.css` 末端,類別名稱以方法前綴命名空間(`deque-`、`strsearch-`、`strcompare-` 等),避免與既有規則衝突。

## 不在範圍內

- Spec 3(🟡)、Spec 4(🟢)的方法。
- 字串方法的自訂輸入(使用固定示範資料即可,與 Spec 2a 的固定 5 節點圖一致)。
- 分類 nav 結構調整(沿用既有 9 分類)。
- deque 的逐步動畫(屬即時操作型)。

## 預期產出

5 個新方法、5 個 `.cpp` 檔、5 份雙語簡報、~5 個新 Playwright 測試,以及 `acquireDynamicVizHost()` 模式在所有新動態視覺化器上的一致套用。
