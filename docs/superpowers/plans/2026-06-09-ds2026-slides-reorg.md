# ds2026 講義整理與 dsvisual 對接 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `/Users/skhuang/course/ds2026` 的 31 份 Marp 講義整理為 25 份、命名統一為 `chapNN_<主題>_<track>.md`,並產生對接 dsvisual 互動網站的 `README.md` 目錄索引。

**Architecture:** 純檔案操作(刪除重複/子集檔、rename 統一命名、ch06 以 ext1 取代 base),再手寫一份 README。`ds2026` 非 git repo,操作以 `mv`/`rm` 為主,無建置流程;每個 task 後以 shell 指令驗證。對接 spec:`dsvisual/docs/superpowers/specs/2026-06-09-ds2026-slides-reorg-design.md`。

**Tech Stack:** macOS、zsh、coreutils(`mv`/`rm`/`md5`/`grep`/`comm`/`awk`)、Marp Markdown。

---

## 檔案結構(整理後 ds2026 應有的 25 份 `.md`)

```
chap01_introduction_core.md
chap01_5_foundations_modern_cpp.md
chap02_arrays_core.md
chap02_arrays_modern_cpp.md
chap03_stacks_queues_core.md
chap03_stacks_queues_core_en.md
chap03_stacks_queues_modern_cpp.md
chap04_linked_lists_core.md
chap04_linked_lists_modern_cpp.md
chap05_trees_core.md
chap05_trees_modern_cpp.md
chap06_graphs_core.md
chap06_graphs_modern_cpp.md
chap06_graphs_advanced_cpp.md
chap06_graphs_exercises.md
chap07_internal_sorting_core.md
chap07_internal_sorting_modern_cpp.md
chap07_internal_sorting_ai_agents.md
chap08_external_sorting_core.md
chap08_external_sorting_modern_cpp.md
chap08_external_sorting_ai_agents.md
chap09_symbol_tables_core.md
chap09_symbol_tables_modern_cpp.md
chap09_symbol_tables_ai_agents.md
chap10_files_core.md
README.md   ← 新增
```

刪除 6 檔:`chapter01_5_stl_oop_patterns.md`、`chap06_graphs_chapter6.md`、`graphs_chapter6.md`、`graphs_cpp_advanced.md`、`internal_sorting_r2.md`、`internal_sorting.md`。

---

## Task 1: 刪除 4 個 MD5 完全相同的重複檔

**Files:**
- Delete: `chapter01_5_stl_oop_patterns.md`(= `chap01_5_stl_oop_patterns.md`)
- Delete: `graphs_chapter6.md`(= `chap06_graphs_chapter6_ext1.md`)
- Delete: `graphs_cpp_advanced.md`(= `chap06_graphs_cpp_advanced.md`)
- Delete: `internal_sorting_r2.md`(= `chap07_internal_sorting_r3.md`)

- [ ] **Step 1: 刪除前再次確認 4 對 MD5 相等(防呆)**

Run:
```bash
cd /Users/skhuang/course/ds2026
for pair in \
  "chap01_5_stl_oop_patterns.md chapter01_5_stl_oop_patterns.md" \
  "chap06_graphs_chapter6_ext1.md graphs_chapter6.md" \
  "chap06_graphs_cpp_advanced.md graphs_cpp_advanced.md" \
  "chap07_internal_sorting_r3.md internal_sorting_r2.md"; do
  set -- $pair
  a=$(md5 -q "$1"); b=$(md5 -q "$2")
  [ "$a" = "$b" ] && echo "OK 相等: $2" || echo "DIFF! 不可刪: $2 ($a vs $b)"
done
```
Expected: 4 行都是 `OK 相等: ...`。若出現 `DIFF!` 立即停止,回報。

- [ ] **Step 2: 刪除 4 個重複檔**

Run:
```bash
cd /Users/skhuang/course/ds2026
rm chapter01_5_stl_oop_patterns.md graphs_chapter6.md graphs_cpp_advanced.md internal_sorting_r2.md
```

- [ ] **Step 3: 驗證已刪除、剩 27 份 `.md`**

Run:
```bash
cd /Users/skhuang/course/ds2026
ls chapter01_5_stl_oop_patterns.md graphs_chapter6.md graphs_cpp_advanced.md internal_sorting_r2.md 2>&1 | grep -c 'No such file'
ls *.md | wc -l
```
Expected: 第一行 `4`(四個都不存在);第二行 `27`(31 − 4)。

---

## Task 2: ch06 — ext1 取代 base(零內容移植)

**背景:** 已逐張比對確認 `chap06_graphs_chapter6_ext1.md`(3144 行)完整且更詳盡涵蓋 `chap06_graphs_chapter6.md`(1409 行 base):base 的 §6.4 Critical Path 那 7 個「獨有」標題只是用詞不同,ext1 有動畫版 forward/backward pass、逐步 $le$ 計算、Combined ee/le Table、C++ CPM 實作、`Managerial Insights from CPM`(ext1 行 2173)。故 base 無需移植,直接刪除。

**Files:**
- Rename: `chap06_graphs_chapter6_ext1.md` → `chap06_graphs_core.md`
- Delete: `chap06_graphs_chapter6.md`(base,內容已被 ext1 涵蓋)

- [ ] **Step 1: 確認 base 相對 ext1 的「獨有標題」僅為已知的 7 個用詞變體**

Run:
```bash
cd /Users/skhuang/course/ds2026
comm -23 \
  <(grep -E '^#{1,2} ' chap06_graphs_chapter6.md      | sed -E 's/<[^>]*>//g; s/^#+ //' | sort -u) \
  <(grep -E '^#{1,2} ' chap06_graphs_chapter6_ext1.md  | sed -E 's/<[^>]*>//g; s/^#+ //' | sort -u)
```
Expected: 僅這 7 行(順序為字典序):
```
Computing $ee$: Forward Pass
Computing $le$: Backward Pass
Critical Path Concepts
Forward Pass — Trace (Textbook Fig. 6.32)
Slack Table & Critical Activities
Software Testing Perspective (Bonus)
Supplementary Topics
```
若出現**其他**標題(代表 base 有 ext1 真正缺少的投影片),停止並改採 spec §5 的「保險步驟」:把該投影片連同前後 `---` 附加到 ext1 後再繼續。

- [ ] **Step 2: rename ext1 為 core,刪除 base**

Run:
```bash
cd /Users/skhuang/course/ds2026
mv chap06_graphs_chapter6_ext1.md chap06_graphs_core.md
rm chap06_graphs_chapter6.md
```

- [ ] **Step 3: 驗證 core 存在且為合法 Marp、base 已刪**

Run:
```bash
cd /Users/skhuang/course/ds2026
head -1 chap06_graphs_core.md            # 應為 ---
grep -c '^marp: true' chap06_graphs_core.md   # 應為 1
ls chap06_graphs_chapter6.md 2>&1 | grep -c 'No such file'  # 應為 1
ls *.md | wc -l                          # 應為 26 (27 − 1)
```
Expected:`---`、`1`、`1`、`26`。

---

## Task 3: ch07 — 刪除被 r3 涵蓋的子集檔

**背景:** `internal_sorting.md`(1196 行)的所有 `#`/`##` 標題已用 `comm` 確認全部被 `chap07_internal_sorting_r3.md`(2041 行)涵蓋(r3 另含 C++ 實作等),屬子集,可刪。(`internal_sorting_r2.md` 已於 Task 1 刪除。)

**Files:**
- Delete: `internal_sorting.md`(r3 子集)

- [ ] **Step 1: 刪除前再次確認 internal_sorting.md 標題全被 r3 涵蓋(防呆)**

Run:
```bash
cd /Users/skhuang/course/ds2026
comm -23 \
  <(grep -E '^#{1,2} ' internal_sorting.md            | sed -E 's/^#+ //' | sort -u) \
  <(grep -E '^#{1,2} ' chap07_internal_sorting_r3.md  | sed -E 's/^#+ //' | sort -u) \
  | wc -l
```
Expected: `0`(無 r3 缺少的標題)。若非 0,停止回報。

- [ ] **Step 2: 刪除子集檔**

Run:
```bash
cd /Users/skhuang/course/ds2026
rm internal_sorting.md
```

- [ ] **Step 3: 驗證已刪、剩 25 份 `.md`**

Run:
```bash
cd /Users/skhuang/course/ds2026
ls internal_sorting.md 2>&1 | grep -c 'No such file'  # 應為 1
ls *.md | wc -l                                       # 應為 25
```
Expected:`1`、`25`。

---

## Task 4: 統一命名 — rename 其餘檔案

**Files:** 以下 17 個 rename(其餘 8 個檔名已正確,不動:`chap02_arrays_modern_cpp.md`、`chap05_trees_modern_cpp.md`、`chap06_graphs_core.md`、`chap08_external_sorting_ai_agents.md`,以及尚未改名的 core 來源)。

- [ ] **Step 1: 執行所有 rename**

Run:
```bash
cd /Users/skhuang/course/ds2026
mv chap01_introduction.md                  chap01_introduction_core.md
mv chap01_5_stl_oop_patterns.md            chap01_5_foundations_modern_cpp.md
mv chap02_arrays.md                        chap02_arrays_core.md
mv chap03_stacks_queues.md                 chap03_stacks_queues_core.md
mv chap03_stacks_queues_en.md              chap03_stacks_queues_core_en.md
mv chap03_stacks_queues_modern.md          chap03_stacks_queues_modern_cpp.md
mv chap04_linked_lists_marp.md             chap04_linked_lists_core.md
mv chap04_linked_lists_modern_cpp_marp.md  chap04_linked_lists_modern_cpp.md
mv chap05_trees_slides.md                  chap05_trees_core.md
mv chap06_graphs_cpp_design.md             chap06_graphs_modern_cpp.md
mv chap06_graphs_cpp_advanced.md           chap06_graphs_advanced_cpp.md
mv graphs_llm_exercises.md                 chap06_graphs_exercises.md
mv chap07_internal_sorting_r3.md           chap07_internal_sorting_core.md
mv chap07_sorting_stl_patterns_oop.md      chap07_internal_sorting_modern_cpp.md
mv chap07_sorting_with_ai_agents.md        chap07_internal_sorting_ai_agents.md
mv chap08_external_sorting.md              chap08_external_sorting_core.md
mv chap08_external_sorting_cpp_design.md   chap08_external_sorting_modern_cpp.md
mv chap09_symbol_tables.md                 chap09_symbol_tables_core.md
mv chap09_symbol_tables_oop.md             chap09_symbol_tables_modern_cpp.md
mv chap09_symbol_tables_ai.md              chap09_symbol_tables_ai_agents.md
mv chap10_files.md                         chap10_files_core.md
```

- [ ] **Step 2: 驗證所有 25 份檔名符合命名規範**

Run:
```bash
cd /Users/skhuang/course/ds2026
echo "不符規範的檔名(應為空):"
ls *.md | grep -vE '^chap[0-9]{2}(_[0-9])?_[a-z_]+_(core|modern_cpp|ai_agents|advanced_cpp|exercises)(_en)?\.md$'
echo "總數: $(ls *.md | wc -l)"
```
Expected:「不符規範」下方無任何行;`總數: 25`。

- [ ] **Step 3: 驗證無 MD5 重複**

Run:
```bash
cd /Users/skhuang/course/ds2026
md5 -r *.md | awk '{print $1}' | sort | uniq -d | wc -l
```
Expected: `0`(無重複雜湊)。

---

## Task 5: 撰寫 README.md 目錄索引

**Files:**
- Create: `/Users/skhuang/course/ds2026/README.md`

- [ ] **Step 1: 寫入 README.md(完整內容如下)**

把以下完整內容寫入 `/Users/skhuang/course/ds2026/README.md`:

````markdown
# 資料結構與物件導向程式設計 — 章節講義

本資料夾收錄《Fundamentals of Data Structures》(Horowitz & Sahni)對應的 Marp 章節講義,並與互動視覺化網站 **[dsvisual](https://skhuang.github.io/dsvisual)** 搭配教學。

- **講義(本資料夾)**:逐章 Marp 投影片,依教科書脈絡講解。
- **互動示範([dsvisual](https://skhuang.github.io/dsvisual))**:逐演算法的動畫 + C++ 原始碼,適合課堂即時演示與課後自學。

## 講義軸線(Track)

每章依切入角度分為數條平行 track:

| Track | 內容 |
|---|---|
| **core** | 教科書主線(Horowitz & Sahni、SPARKS 虛擬碼) |
| **modern_cpp** | STL · OOP · Design Patterns 現代 C++ 視角 |
| **ai_agents** | AI coding agents 視角 |
| **advanced_cpp** | (僅 Ch6)平行化、Sanitizers、Fuzzing |
| **exercises** | (僅 Ch6)LLM 系統圖論習題集 |
| `_en` | 英文版(僅 Ch3) |

## 如何使用

預覽 / 轉檔(需 Marp CLI;可借用 dsvisual 內的 `node_modules/.bin/marp`):

```bash
npx marp --pdf  --allow-local-files chap06_graphs_core.md
npx marp --html --allow-local-files chap06_graphs_core.md
npx marp --pptx --allow-local-files chap06_graphs_core.md
```

> dsvisual 的逐主題互動示範無 per-slide 網址;下表「互動示範」連到 dsvisual repo 內已渲染的逐主題投影片 markdown,實際動畫請至 [互動網站](https://skhuang.github.io/dsvisual) 選擇對應項目。

## 章節總表

| 章 | 主題 | core | modern_cpp | ai_agents | 其他 |
|---|---|---|---|---|---|
| 1 | Introduction | [講義](chap01_introduction_core.md) | — | — | — |
| 1.5 | Foundations: STL · OOP · Patterns | — | [講義](chap01_5_foundations_modern_cpp.md) | — | — |
| 2 | Arrays | [講義](chap02_arrays_core.md) | [講義](chap02_arrays_modern_cpp.md) | — | — |
| 3 | Stacks & Queues | [講義](chap03_stacks_queues_core.md) · [EN](chap03_stacks_queues_core_en.md) | [講義](chap03_stacks_queues_modern_cpp.md) | — | — |
| 4 | Linked Lists | [講義](chap04_linked_lists_core.md) | [講義](chap04_linked_lists_modern_cpp.md) | — | — |
| 5 | Trees | [講義](chap05_trees_core.md) | [講義](chap05_trees_modern_cpp.md) | — | — |
| 6 | Graphs | [講義](chap06_graphs_core.md) | [講義](chap06_graphs_modern_cpp.md) | — | [advanced_cpp](chap06_graphs_advanced_cpp.md) · [exercises](chap06_graphs_exercises.md) |
| 7 | Internal Sorting & Searching | [講義](chap07_internal_sorting_core.md) | [講義](chap07_internal_sorting_modern_cpp.md) | [講義](chap07_internal_sorting_ai_agents.md) | — |
| 8 | External Sorting | [講義](chap08_external_sorting_core.md) | [講義](chap08_external_sorting_modern_cpp.md) | [講義](chap08_external_sorting_ai_agents.md) | — |
| 9 | Symbol Tables | [講義](chap09_symbol_tables_core.md) | [講義](chap09_symbol_tables_modern_cpp.md) | [講義](chap09_symbol_tables_ai_agents.md) | — |
| 10 | Files | [講義](chap10_files_core.md) | — | — | — |

## 各章 × dsvisual 互動示範對應

dsvisual 連結格式:`https://github.com/skhuang/dsvisual/blob/main/slides/zh/<id>.md`

### Ch1.5 Foundations — OOP 與設計模式
- OOP:[oop-encapsulation](https://github.com/skhuang/dsvisual/blob/main/slides/zh/oop-encapsulation.md) · [oop-inheritance](https://github.com/skhuang/dsvisual/blob/main/slides/zh/oop-inheritance.md) · [oop-polymorphism](https://github.com/skhuang/dsvisual/blob/main/slides/zh/oop-polymorphism.md) · [oop-abstraction](https://github.com/skhuang/dsvisual/blob/main/slides/zh/oop-abstraction.md) · [oop-templates](https://github.com/skhuang/dsvisual/blob/main/slides/zh/oop-templates.md) · [oop-adhoc](https://github.com/skhuang/dsvisual/blob/main/slides/zh/oop-adhoc.md)
- Patterns:[strategy](https://github.com/skhuang/dsvisual/blob/main/slides/zh/pattern-strategy.md) · [factory](https://github.com/skhuang/dsvisual/blob/main/slides/zh/pattern-factory.md) · [observer](https://github.com/skhuang/dsvisual/blob/main/slides/zh/pattern-observer.md) · [adapter](https://github.com/skhuang/dsvisual/blob/main/slides/zh/pattern-adapter.md) · [decorator](https://github.com/skhuang/dsvisual/blob/main/slides/zh/pattern-decorator.md) · [singleton](https://github.com/skhuang/dsvisual/blob/main/slides/zh/pattern-singleton.md) · [mvc](https://github.com/skhuang/dsvisual/blob/main/slides/zh/pattern-mvc.md) · [di](https://github.com/skhuang/dsvisual/blob/main/slides/zh/pattern-di.md) · [layered](https://github.com/skhuang/dsvisual/blob/main/slides/zh/pattern-layered.md) · [pipefilter](https://github.com/skhuang/dsvisual/blob/main/slides/zh/pattern-pipefilter.md) · [pubsub](https://github.com/skhuang/dsvisual/blob/main/slides/zh/pattern-pubsub.md)

### Ch2 Arrays
- [list-array](https://github.com/skhuang/dsvisual/blob/main/slides/zh/list-array.md)

### Ch3 Stacks & Queues
- [stack-array](https://github.com/skhuang/dsvisual/blob/main/slides/zh/stack-array.md) · [stack-list](https://github.com/skhuang/dsvisual/blob/main/slides/zh/stack-list.md) · [queue](https://github.com/skhuang/dsvisual/blob/main/slides/zh/queue.md) · [deque](https://github.com/skhuang/dsvisual/blob/main/slides/zh/deque.md)

### Ch4 Linked Lists
- [list-linked](https://github.com/skhuang/dsvisual/blob/main/slides/zh/list-linked.md) · [list-array](https://github.com/skhuang/dsvisual/blob/main/slides/zh/list-array.md) · [skip-list](https://github.com/skhuang/dsvisual/blob/main/slides/zh/skip-list.md)

### Ch5 Trees
- [tree-bst](https://github.com/skhuang/dsvisual/blob/main/slides/zh/tree-bst.md) · [tree-avl](https://github.com/skhuang/dsvisual/blob/main/slides/zh/tree-avl.md) · [tree-rb](https://github.com/skhuang/dsvisual/blob/main/slides/zh/tree-rb.md) · [tree-splay](https://github.com/skhuang/dsvisual/blob/main/slides/zh/tree-splay.md) · [tree-trie](https://github.com/skhuang/dsvisual/blob/main/slides/zh/tree-trie.md) · [tree-radix](https://github.com/skhuang/dsvisual/blob/main/slides/zh/tree-radix.md) · [tree-ternary](https://github.com/skhuang/dsvisual/blob/main/slides/zh/tree-ternary.md) · [tree-btree](https://github.com/skhuang/dsvisual/blob/main/slides/zh/tree-btree.md) · [tree-bplus](https://github.com/skhuang/dsvisual/blob/main/slides/zh/tree-bplus.md) · [tree-dsu](https://github.com/skhuang/dsvisual/blob/main/slides/zh/tree-dsu.md) · [tree-segment](https://github.com/skhuang/dsvisual/blob/main/slides/zh/tree-segment.md) · [tree-fenwick](https://github.com/skhuang/dsvisual/blob/main/slides/zh/tree-fenwick.md)

### Ch6 Graphs
- [graph](https://github.com/skhuang/dsvisual/blob/main/slides/zh/graph.md) · [graph-adjlist](https://github.com/skhuang/dsvisual/blob/main/slides/zh/graph-adjlist.md) · [graph-traversal](https://github.com/skhuang/dsvisual/blob/main/slides/zh/graph-traversal.md) · [graph-bfs](https://github.com/skhuang/dsvisual/blob/main/slides/zh/graph-bfs.md) · [graph-dfs](https://github.com/skhuang/dsvisual/blob/main/slides/zh/graph-dfs.md) · [graph-dijkstra](https://github.com/skhuang/dsvisual/blob/main/slides/zh/graph-dijkstra.md) · [graph-bellman-ford](https://github.com/skhuang/dsvisual/blob/main/slides/zh/graph-bellman-ford.md) · [graph-floyd-warshall](https://github.com/skhuang/dsvisual/blob/main/slides/zh/graph-floyd-warshall.md) · [graph-kruskal](https://github.com/skhuang/dsvisual/blob/main/slides/zh/graph-kruskal.md) · [graph-prim](https://github.com/skhuang/dsvisual/blob/main/slides/zh/graph-prim.md) · [graph-topo](https://github.com/skhuang/dsvisual/blob/main/slides/zh/graph-topo.md)

### Ch7 Internal Sorting & Searching
- 搜尋:[search-linear](https://github.com/skhuang/dsvisual/blob/main/slides/zh/search-linear.md) · [search-binary](https://github.com/skhuang/dsvisual/blob/main/slides/zh/search-binary.md)
- 排序:[sort-bubble](https://github.com/skhuang/dsvisual/blob/main/slides/zh/sort-bubble.md) · [sort-select](https://github.com/skhuang/dsvisual/blob/main/slides/zh/sort-select.md) · [sort-insert](https://github.com/skhuang/dsvisual/blob/main/slides/zh/sort-insert.md) · [sort-quick](https://github.com/skhuang/dsvisual/blob/main/slides/zh/sort-quick.md) · [sort-merge](https://github.com/skhuang/dsvisual/blob/main/slides/zh/sort-merge.md) · [sort-heap](https://github.com/skhuang/dsvisual/blob/main/slides/zh/sort-heap.md) · [sort-shell](https://github.com/skhuang/dsvisual/blob/main/slides/zh/sort-shell.md) · [sort-shaker](https://github.com/skhuang/dsvisual/blob/main/slides/zh/sort-shaker.md) · [sort-bucket](https://github.com/skhuang/dsvisual/blob/main/slides/zh/sort-bucket.md) · [sort-count](https://github.com/skhuang/dsvisual/blob/main/slides/zh/sort-count.md) · [sort-radix](https://github.com/skhuang/dsvisual/blob/main/slides/zh/sort-radix.md)

### Ch8 External Sorting
- [sort-merge](https://github.com/skhuang/dsvisual/blob/main/slides/zh/sort-merge.md)(k-way merge 基礎) · [heap-binary](https://github.com/skhuang/dsvisual/blob/main/slides/zh/heap-binary.md)(loser/winner tree 概念)

### Ch9 Symbol Tables
- 雜湊:[hash-chain](https://github.com/skhuang/dsvisual/blob/main/slides/zh/hash-chain.md) · [hash-open](https://github.com/skhuang/dsvisual/blob/main/slides/zh/hash-open.md) · [hash-bucket](https://github.com/skhuang/dsvisual/blob/main/slides/zh/hash-bucket.md)
- 樹 / 機率結構:[tree-bst](https://github.com/skhuang/dsvisual/blob/main/slides/zh/tree-bst.md) · [skip-list](https://github.com/skhuang/dsvisual/blob/main/slides/zh/skip-list.md) · [bloom-filter](https://github.com/skhuang/dsvisual/blob/main/slides/zh/bloom-filter.md) · [count-min-sketch](https://github.com/skhuang/dsvisual/blob/main/slides/zh/count-min-sketch.md)
- 字串比對:[search-kmp](https://github.com/skhuang/dsvisual/blob/main/slides/zh/search-kmp.md) · [search-bm](https://github.com/skhuang/dsvisual/blob/main/slides/zh/search-bm.md) · [search-rk](https://github.com/skhuang/dsvisual/blob/main/slides/zh/search-rk.md) · [search-aho](https://github.com/skhuang/dsvisual/blob/main/slides/zh/search-aho.md) · [search-zalgo](https://github.com/skhuang/dsvisual/blob/main/slides/zh/search-zalgo.md) · [search-strcompare](https://github.com/skhuang/dsvisual/blob/main/slides/zh/search-strcompare.md)

### Ch10 Files
- [tree-btree](https://github.com/skhuang/dsvisual/blob/main/slides/zh/tree-btree.md) · [tree-bplus](https://github.com/skhuang/dsvisual/blob/main/slides/zh/tree-bplus.md)
````

- [ ] **Step 2: 驗證 README 內所有內部講義連結都指向存在的檔案**

Run:
```bash
cd /Users/skhuang/course/ds2026
echo "失效的內部連結(應為空):"
grep -oE '\]\(chap[^)]+\.md\)' README.md | sed -E 's/^\]\(//; s/\)$//' | sort -u | while read f; do
  [ -f "$f" ] || echo "MISSING: $f"
done
```
Expected:「失效的內部連結」下方無任何行。

- [ ] **Step 3: 驗證 README 引用的 dsvisual slide id 都實際存在**

Run:
```bash
cd /Users/skhuang/course/ds2026
echo "dsvisual 不存在的 slide id(應為空):"
grep -oE 'slides/zh/[a-z0-9-]+\.md' README.md | sort -u | while read p; do
  [ -f "/Users/skhuang/course/dsvisual/$p" ] || echo "MISSING: $p"
done
```
Expected:「dsvisual 不存在的 slide id」下方無任何行。

---

## Task 6: 最終整體驗證

- [ ] **Step 1: 全項驗證一次**

Run:
```bash
cd /Users/skhuang/course/ds2026
echo "1) .md 講義數 (應 25):"; ls chap*.md | wc -l
echo "2) 不符命名的檔 (應空):"; ls *.md | grep -v '^README.md$' | grep -vE '^chap[0-9]{2}(_[0-9])?_[a-z_]+_(core|modern_cpp|ai_agents|advanced_cpp|exercises)(_en)?\.md$'
echo "3) MD5 重複組數 (應 0):"; md5 -r chap*.md | awk '{print $1}' | sort | uniq -d | wc -l
echo "4) 每章皆有 core 或 (ch01.5) modern_cpp:"
for n in 01 01_5 02 03 04 05 06 07 08 09 10; do
  ls chap${n}_*.md >/dev/null 2>&1 && echo "  chap${n}: OK" || echo "  chap${n}: 缺檔!"
done
echo "5) README 存在:"; [ -f README.md ] && echo "  OK" || echo "  缺 README"
echo "6) 每份仍為合法 Marp (frontmatter 第一行 ---):"
for f in chap*.md; do [ "$(head -1 "$f")" = "---" ] || echo "  非 --- 開頭: $f"; done
echo "  (上方無輸出代表全部 OK)"
```
Expected:`1) 25`;`2)` 無輸出;`3) 0`;`4)` 11 行皆 `OK`;`5) OK`;`6)` 無「非 --- 開頭」行。

---

## Self-Review notes

- **Spec 覆蓋**:刪重複(Task 1)、ch06 整併(Task 2)、ch07 子集(Task 3)、統一命名(Task 4)、README + 交叉連結(Task 5)、驗證標準(Task 6)— spec 各節皆有對應 task。
- **ch06 偏離 spec 初稿**:spec §5 已更正為「ext1 取代 base、零移植」,Task 2 與之一致並保留防呆(Step 1 偵測非預期獨有標題時改走移植)。
- **命名一致性**:全程使用 `core` / `modern_cpp` / `ai_agents` / `advanced_cpp` / `exercises` / `_en`,與 Task 4 rename、Task 5 表格、驗證正則一致。
- **無 placeholder**:所有步驟皆為可直接執行的指令與完整 README 內容。
