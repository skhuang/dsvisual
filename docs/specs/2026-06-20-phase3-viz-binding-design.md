# Phase 3 — dsvisual viz binding into lectures (Design)

**日期**: 2026-06-20
**狀態**: 設計已核可,待寫實作計畫
**所屬**: 課程內容管線 roadmap 的 Phase 3(見 `docs/specs/2026-06-20-course-content-pipeline-design.md` §6 生成器①、§9)
**主要 repo**: dsvisual。消費來源:ds2026 chap03 md(`viz:` directives 已於 Phase 0 植入)

---

## 1. 目標

把 ds2026 講義裡的 `<!-- viz: <id> -->` directive 變成可點連結,跳轉到 dsvisual GitHub Pages 上對應的**互動視覺化**。垂直切片 = chap03(`stack-array`, `stack-list`, `queue`, `deque`, `maze-stack`)。

## 2. 前提(已核可)

| # | 決定 |
|---|---|
| P1 | Binding 形式 = **連結**(另開分頁),非 iframe |
| P2 | 目標輸出 = **兩者**:Marp 講義 HTML + ipynb(同一 `viz:` directive、同一 deep-link URL) |
| P3 | 連結 label 格式:blockquote 行 `> ▶ [互動視覺化:<Title>](<url>)`(Title = directive 選用標題,否則 id) |
| P4 | 站上需新增 **`#m=<id>` hash 路由**(目前無 deep-link);含 bonus:`selectMethod` 同步更新 hash(可分享) |
| P5 | deep-link 的 `<id>` = `js/app.js` `METHOD_GROUPS` 的 method id(與 chap03 `viz:` ids、`slides/en/*.md` 檔名一致) |

## 3. 架構:兩個部分

### Part A — dsvisual 站台 deep-linking
- 載入時讀 `location.hash`;若為 `#m=<methodId>` 且該 id 存在於 `METHOD_GROUPS`,呼叫既有的 `selectMethod(id)`(`js/app.js:683`)而非顯示 overview。
- **Bonus**:`selectMethod` 內把 `location.hash` 設為 `#m=<id>`,使站內導覽產生可分享 URL。需避免 hash 變更又觸發路由造成迴圈(設 hash 不應再次呼叫 selectMethod)。
- 未知 / 空 hash → 維持原本預設行為(overview)。

### Part B — viz-link binding 生成器(`dsvisual/pipeline/`)
單一共用轉換,供兩個輸出使用(DRY):
- **`pipeline/viz-link.js`** — `expandVizLinks(md, {baseUrl}) -> string`:把每個獨立成行的 `<!-- viz: ID ["label"] -->` 註解,替換成可見 Markdown 連結行 `> ▶ [互動視覺化:<label|ID>](<baseUrl>#m=<ID>)`。其餘內容不動。`baseUrl` 預設 `https://skhuang.github.io/dsvisual/`,可由 env `DSVISUAL_BASE_URL` 覆寫。
- **Marp 輸出(B1)**:`pipeline/bind-viz.js <chapter.md>` → 讀 md、`expandVizLinks`、寫出衍生 `<chapter>.viz.md`(原始 md 保持註解、不被汙染)。marp-cli 渲染該衍生檔成含可點 viz 連結的講義 HTML。
- **ipynb 輸出(B2)**:`gen-ipynb.js` 在 `parseLecture` **之前**先跑 `expandVizLinks`,使 viz 註解變成可見 Markdown 行 → 落進 markdown cell,成為 notebook 內的可點連結。

## 4. 資料流

```
ds2026/<chap>.md  (viz: 註解保持不變,為權威來源)
      │
      ├─ pipeline/bind-viz.js ──► <chap>.viz.md ──(marp-cli)──► 講義 HTML(含 viz 連結)
      │        └─ uses expandVizLinks(md, baseUrl)
      │
      └─ pipeline/gen-ipynb.js ─ expandVizLinks(md) ─► parseLecture ─► <chap>.ipynb(含 viz 連結 cell)

  連結 URL = <baseUrl>#m=<id>  ──►  dsvisual 站台 (Part A) 讀 hash → selectMethod(id) → 開啟該 viz
```

核心:`viz:` 註解仍是權威來源裡的不可見標記;**兩個建置步驟**各自把它展開成可見連結,但共用同一個 `expandVizLinks`。

## 5. 元件

| 元件 | 落點 | 職責 |
|---|---|---|
| hash 路由 + bonus | `js/app.js`(改) | 載入讀 `#m=<id>` → `selectMethod`;`selectMethod` 同步寫 hash |
| `expandVizLinks` | `pipeline/viz-link.js`(新) | `viz:` 註解 → Markdown 連結;baseUrl 可設 |
| `bind-viz.js` | `pipeline/`(新) | CLI:chapter md → `<chapter>.viz.md`(Marp 用) |
| `gen-ipynb.js` | `pipeline/`(改) | 生成前先 `expandVizLinks`,使 viz 連結成為 notebook cell |

新寫:`viz-link.js` + `bind-viz.js`;改:`app.js`(hash)、`gen-ipynb.js`(前處理一行)。

## 6. 測試

- **單元**(`node --test`):`expandVizLinks` — 註解→連結、`baseUrl` 套用、label fallback 到 id、含 label 的解析、非 viz 內容不動、行內(非整行)的註解不誤觸。
- **站台**(Playwright):載入 `index.html#m=deque` → 斷言 deque 視覺化為 active;載入無 hash → overview;(bonus)選 method 後 hash 變為 `#m=<id>`。
- **整合**:chap03 經 `bind-viz.js` 產出的 `.viz.md` 含 5 條 viz 連結且 URL 為 `…#m=<id>`;重新生成的 chap03 notebook 含至少一個 viz 連結 cell。

## 7. 一致性

Phase 0 linter 已驗證每個 `viz: id` 存在(對 `slides/en/*.md`)。Part A 的 `#m=<id>` 用同一組 id。`expandVizLinks` 對未知 id 不需自行驗證(linter 先攔);但產出的 URL 一律是 `#m=<id>`,id 不存在時站台 fallback 到 overview(不報錯)。

## 8. 範圍界線(YAGNI)

- **不做** iframe 內嵌(P1:連結即可)。
- **不做** 在 dsvisual 站內 deck viewer 直接嵌入講義跳轉(更深整合,非本期)。
- **不做** 自動跑 marp-cli 產 HTML 進 CI(產 `.viz.md` 即可;HTML 渲染指令文件化)。
- **不做** 反向把 viz 縮圖貼進講義(靜態快照是 ipynb 的事,Phase 1 已涵蓋)。

## 9. 待 Phase 內細化

- `bind-viz.js` 輸出落點:與 `.md` 同目錄的 `<chapter>.viz.md` vs 一個 `build/` 目錄(實作時定)。
- bonus hash 同步是否需要 `replaceState`(不增歷史)而非直接設 `location.hash`(實作時定,以不破壞返回行為為準)。
