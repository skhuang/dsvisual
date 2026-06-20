# ipynb slide-structure-preserving parsing (Design)

**日期**: 2026-06-20
**狀態**: 設計已核可,待寫實作計畫
**所屬**: Phase 1 follow-up(ipynb 生成器)。見 `docs/specs/2026-06-20-course-content-pipeline-design.md` §6②、§7
**repo**: dsvisual(消費:ds2026 章節 md)

---

## 1. 問題

目前 `pipeline/parse-lecture.js` **只以 code fence 切 cell**,完全忽略 Marp 的 `---` slide 分隔與 YAML front-matter。結果(實測 chap03):

- chap03_core:md 有 53 個 `---` slide,notebook 只 41 cell,**17 個 markdown cell 各含 ≥1 個 `---`**(多張 slide 被合進一個 cell),最大 cell **143 行**。
- chap03_modern_cpp:41 slide,29 個 md cell 含 `---`,最大 120 行。

對應使用者回報:① 有些 cell 內容遠超一頁(多 slide 合併);② 一頁被 code fence 切割並與下一頁合併(fence 跨 slide 流動)。

## 2. 目標

讓轉換**保留 slide 結構**:每張 Marp slide 對應自己的 cell 區段,不跨 slide 合併;front-matter 不進 notebook。同時**保留 Phase 1 的可執行 cell**。

## 3. 前提(已核可)

| # | 決定 |
|---|---|
| Q1 | `---` 為硬邊界(不跨 slide 合併);但 slide **內**,可執行 cpp 仍拆成 code cell(md+code+md) |
| Q2 | **完全移除** leading YAML front-matter(不把 `title:` 另做成 cell) |
| Q3 | 一併重新生成 chap03 `_core` 與 `_modern_cpp` 兩個 notebook |

## 4. 變更範圍

僅 `pipeline/parse-lecture.js`。消費端不變:`build-notebook.js`(只 map cells)、`gen-ipynb.js`、`lint.js`(用 bindings)、`bind-viz.js`(用 expandVizLinks)皆不受影響。`Cell`/`Binding` 契約不變——只是 cell 邊界變正確。

## 5. 新 `parseLecture` 演算法

1. **移除 leading front-matter**:若文件以 `---` 開頭,丟棄到(含)下一個 `---` 為止的區塊(Marp `marp:true`/theme/header/style)。章節標題仍在第一張內容 slide 的 `#` heading,不損失資訊。
2. **以 `---`(整行)切 slide**:把其餘 body 切成多張 slide。
3. **每張 slide 內**:跑現有的 fence/directive 切法(散文→markdown cell;`<!-- runnable -->` cpp fence→code cell;directive 仍黏緊其下方的 fence)。
4. 空 slide 不產 cell;`---` 行本身永不進 cell。

**結果**:純散文 slide → 1 個 markdown cell;含可執行 fence 的 slide → md+code+md(且**限縮在該 slide 內**,尾段散文不與下一張合併)。

## 6. 測試(`tests/unit/parse-lecture.test.js`)

- front-matter 被移除:所有 cell 皆不含 `marp:`/`theme:` 等 front-matter 行。
- 兩張相鄰純散文 slide → **兩個獨立** md cell(不合併;且 cell source 不含 `---`)。
- 含 `<!-- runnable -->` cpp fence 的 slide → md+code+md,且該 slide 尾段散文**不**併入下一張 slide。
- 現有 directive-adjacency / fence / viz-oj-binding 測試仍通過。

## 7. 驗收(整合)

重新生成兩個 chap03 notebook 後:
- cell 數大致追隨 slide 數(不再是 53 slide→41 cell 的合併);**無**任何 md cell 內含 `---`;最大 md cell 行數大幅下降(不再有 143 行的合併巨 cell)。
- modern_cpp 仍保有可執行 code cell(數量與內容不因切法改變而消失)。
- `node --test tests/unit/*.test.js` 全綠。

## 8. 範圍界線(YAGNI)

- **不改**消費端(build-notebook/gen-ipynb/lint/bind-viz)。
- **不做** Marp 每頁指令(`<!-- _class: lead -->` 等)的特別處理——它們是 HTML 註解,markdown 渲染本就隱藏;非本次目標(可日後)。
- **不做** slide → Reveal/投影片式 notebook metadata(`slideshow` cell tags);本次只修 cell 邊界。
- **不改** runnable / viz / code directive 的語意。

## 9. 待 Phase 內細化

- front-matter 偵測:嚴格「檔案第一行為 `---`」才視為 front-matter,避免把第一張 slide 的 `---` 誤判(實作時定;chap03 皆以 front-matter 開頭)。
