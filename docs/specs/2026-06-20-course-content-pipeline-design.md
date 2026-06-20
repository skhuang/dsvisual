# 課程內容管線 整體規劃 (Course Content Pipeline)

**日期**: 2026-06-20
**狀態**: 設計已核可,待寫實作計畫
**範圍**: ds2026 (講義) · dsvisual (視覺化) · dsjudge (OJ) · maccount (成績) · seminar-moodle (Moodle quiz)

---

## 1. 目標

把「資料結構與物件導向程式設計」課程的內容,從散落在多個 repo、彼此手動同步的狀態,收斂成**以 ds2026 md 講義為單一權威來源、自動生成其他產出**的管線。三個原始方向 + 兩個衍生需求:

1. **ipynb C++ 轉換流程** — 把 md 講義轉成 xcpp17 可執行 notebook。
2. **OJ lab/exam 題目** — 在 dsjudge 新增題目,且**延後公開**(上課才開放),並支援**期中/期末考**。
3. **視覺化整合進 md** — 把 dsvisual 互動 viz 連結進 md 講義。
4. **(衍生) Moodle quiz 生成** — 從 md 生成 seminar-moodle 的 quiz 題目。
5. **(衍生) 跨產出一致性** — 自動護欄確保 binding 不失聯。

## 2. 架構決定 (Decisions)

這些是 brainstorming 階段定案、不再重議的前提:

| # | 決定 | 取捨 |
|---|---|---|
| D1 | **單一來源、自動生成** (非聯邦交叉連結) | 一致性優先 |
| D2 | **權威來源 = ds2026 md 講義** | 以課程為中心 |
| D3 | **方案 1**:md 為「文字+程式碼指認」權威;互動 viz 維持 dsvisual 手寫,用 binding 連結(不反向生成 `slides_db.js`) | 尊重既有 viz 資產,工程量最小 |
| D4 | **吸收方案 3**:可編譯 C++ 收斂為唯一 code library,四方 include 同一份 | 根除「程式碼四處不一致」 |
| D5 | **ipynb 為降級呈現**:可執行 C++ + 靜態 SVG 快照,互動留給瀏覽器 | 務實可行 |
| D6 | **建置順序**:Phase 0(地基)→ Phase 1(ipynb)→ Phase 2(OJ)→ Phase 3(viz binding)→ Phase 4(exam + Moodle quiz) | Phase 1 可獨立端到端驗證 |
| D7 | **Phase 1 目標章節 = chap03 Stacks & Queues**;code library 先只收斂該章所需 | 所有 binding 目標(viz/OJ)皆已存在,可立即驗證 |

## 3. 權威來源分層

不是所有東西都從 md 生成;按內容類型分層:

| 內容類型 | 權威來源 | 說明 |
|---|---|---|
| 講義文字、章節結構 | `ds2026/*.md` (marp) | 已存在、課程主體 |
| 可編譯 C++ | 共用 code library(`dsvisual/cpp/`,已有 100+ 檔) | md / ipynb / OJ 參考解皆 include 同一份 |
| 互動視覺化 | `dsvisual/js/*_viz.js` + `slides_db.js`(手寫) | 互動 JS 無法從 md 反推;md 只連結 |
| OJ 測資 / checker | `dsjudge/problems/<id>/`(人工撰寫) | 測資需人工設計 |
| Moodle quiz 概念題 | 由 md 經 seminar-moodle 既有 `claude -p` 流程生成草稿 → 人工審 | 已有管線 |

## 4. 資料流

```
                  ds2026/<chap>.md  (權威:文字 + 結構 + directive)
                         │
   ┌──────────┬──────────┼───────────────┬──────────────────┐
   │          │          │               │                  │
<!--code:-->  │     <!--runnable-->  <!--viz:deque-->   <!--oj:lab03-->
   │          │          │               │                  │
   ▼          ▼          ▼               ▼                  ▼
共用 cpp   生成 slides  生成 ipynb     連結/嵌入          生成 OJ 骨架
library   (連結 viz)  (cell+SVG快照) dsvisual 互動 viz  (meta + 參考解)
   │                                                        │
   └────────► 全部 include 同一份 .cpp ◄────────────────────┘
                                                     人工補測資 → dsjudge
                                                            │
                                          ┌─────────────────┴───────┐
                                          │                         │
                                  Moodle quiz (seminar-moodle)   maccount 成績
```

核心原則:**md 只「指認」程式碼 / viz / 題目,不重複它們的內容**。程式碼實體一份(code library),viz 實體一份(dsvisual),md 用 directive 縫合。

## 5. md Directive 慣例

全用 HTML 註解(Marp 渲染不可見,pipeline 可解析):

| Directive | 位置 | 作用 |
|---|---|---|
| `<!-- code: stack_array.cpp -->` | code fence 上方 | 該段程式碼來自 code library;ipynb/slides 從唯一來源取 |
| `<!-- code: stack_array.cpp#push -->` | 同上 | 只取以標記註解界定的某函式/區段 |
| `<!-- runnable -->` | cpp fence 上方 | 標記此 cell 在 ipynb 為 xcpp17 可執行 |
| `<!-- viz: deque -->` | slide 內任意處 | 對應 dsvisual 互動 viz id;生成連結/iframe |
| `<!-- oj: lab03-deque "Deque 實作" -->` | 練習段落 | 對應 OJ 題;生成 `problems/lab03-deque/` 骨架 |

**一致性 linter**(生成器 ⑤):CI 檢查 ① 每個 `viz:` id 在 dsvisual 存在;② 每個 `oj:` id 在 dsjudge 有目錄;③ 每個 `code:` 檔案存在且能編譯。任一 binding 失聯即 fail。

## 6. 生成器 (五個)

| # | 生成器 | 輸入 | 輸出 | 既有基礎 |
|---|---|---|---|---|
| ① | slides binding | md + `viz:` | md/slides 內嵌指向 dsvisual viz 的連結/iframe | dsvisual viz 模組已存在 |
| ② | ipynb 生成器 | md + `cpp`/`runnable`/`code:` | `.ipynb`(xcpp17 cell + 靜態 SVG)+ nbviewer 唯讀版 | 2 個前例 notebook |
| ③ | OJ 骨架生成 | md + `oj:` + code library 參考解 | `dsjudge/problems/<id>/`(meta.yaml + statement + 參考解) | dsjudge 完整 runner、`window.open_at`、`type:lab/exam` |
| ④ | Moodle quiz 生成 | md | 餵進 seminar-moodle 既有 `claude -p` quiz-draft 流程 | seminar-moodle `create_quiz.mjs` / `oj_quiz.mjs` 全套已存在 |
| ⑤ | 一致性 linter | md + 三 repo | pass/fail 報告 | 新寫 |

**真正要新寫的程式**只有:md directive 解析器、ipynb 生成器、SVG helper library、linter。其餘是「撰寫內容 + 接既有管線」。

## 7. ipynb 的四個現實限制 (D5 的細節)

1. **`sparks` 虛擬碼不可執行** — 只有 `cpp` fence 能變 code cell;`sparks` 與散文留 markdown cell。
2. **片段 vs 可執行** — xcpp17 是 cling REPL,逐 cell 累積、不需 `main()`,但同名型別重複定義會 redefinition 報錯。規則:**只有 `<!-- runnable -->` 的 cpp 區塊生成 code cell,且每 notebook 內同名型別只定義一次**;從 library 拉的完整程式(含 main)改寫成「呼叫 demo」。
3. **kernel 依賴** — 實際執行需 xeus-cpp(conda)。產兩版:可執行版 + nbviewer 唯讀版。
4. **viz ≠ 互動** — notebook 內用 C++ helper(`mime_bundle_repr`)吐 dsvisual 風格**靜態 SVG 快照**,每步呼叫一次;互動版只在瀏覽器。

## 8. 新需求對應既有基礎建設

| 需求 | 現成支援 | 還要做 |
|---|---|---|
| OJ 延後公開 | `assignments.py` 已有 `window:{open_at, due_at}`;題目存學生不可達 trusted dir | 生成時把 `open_at` 設為上課時間 |
| 期中/期末 | dsjudge 已有 `TYPES=("lab","exam")` + manifest 組題庫成考試 | 寫 exam manifest,標 `type: exam` |
| Moodle quiz | seminar-moodle 已有「講義 → `claude -p` → quiz.xml 草稿 → 人工匯入隱藏 quiz」全流程;`oj_quiz.mjs` 支援混合考試(概念題 Moodle + 程式題 dsjudge,每題對應一個 quiz slot);OJ↔Moodle↔maccount 成績回填已做 | 把 ds2026 md 當講義輸入餵入 |

## 9. 建置階段 (Phasing)

| Phase | 內容 | 產出 / 驗收 |
|---|---|---|
| **0 地基** | code library 收斂(僅 chap03 所需 .cpp)+ directive 規格文件 + 解析器 + linter | chap03 md 標上 directive;linter 對 chap03 全綠 |
| **1 ipynb** | ipynb 生成器 + SVG helper library;產出 chap03 notebook | chap03 ipynb 在 xcpp17 跑通;nbviewer 唯讀版可看 |
| **2 OJ** | OJ 骨架生成;對 chap03 產 `lab` 題(`open_at` 延後公開) | 生成題目能在 dsjudge runner 判題;open_at 前學生不可見 |
| **3 viz binding** | slides binding 生成;chap03 md/slides 連結 stack/queue viz | GitHub Pages 講義可跳轉互動 viz;linter 驗 binding |
| **4 exam + quiz** | exam manifest(期中/期末)+ 餵 md 進 seminar-moodle quiz 流程 | 產出隱藏 Moodle quiz 草稿 + 混合考試綁定 |

Phase 0→1 是第一個跑通的 vertical slice;之後逐章(chap01…chap10)複用同一管線水平展開。

## 10. 範圍界線 (YAGNI)

- **不做**反向生成 `slides_db.js`(方案 2)——既有 viz 維持手寫。
- **不做** ipynb 互動視覺化(D5)——靜態快照即可。
- **不做**自動生成 OJ 測資——測資人工撰寫(只生成骨架 + 參考解)。
- **不做**一次大搬遷 code library(D7)——逐章收斂。

## 11. 未決 / 待 Phase 內細化

- code library 落點沿用 `dsvisual/cpp/` vs 另開中立 `code/`(傾向沿用,Phase 0 定)。
- directive 解析器用獨立 script vs 併入既有 `build_*.js`(Phase 0 定)。
- ipynb 可執行版的 CI 是否在 GitHub Actions 跑 xeus-cpp(Phase 1 定)。
