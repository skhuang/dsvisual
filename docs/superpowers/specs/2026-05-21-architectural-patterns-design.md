# Architectural Patterns — 設計文件

## 目標與背景

dsvisual 的 Design Patterns 分類在 PR #62 已分為 GoF 三大 sub-tab(Creational / Structural / Behavioral)。本 spec 新增第 4 個 sub-tab **Architectural**,放入 5 個架構模式:MVC、Layered Architecture、Publish-Subscribe、Pipe-and-Filter、Dependency Injection。

sub-tab 機制(PR #62)天生支援任意數量子 group;新增一個帶 `parent: 'patterns'` 的 `patterns-architectural` group,第 4 個 tab 即自動出現,不需再改 nav 程式碼。

架構模式屬系統層級概念,以「單一程式內、合作類別」的最小 C++ 示範呈現,沿用既有 pattern 方法的 cpp + 靜態 SVG 檢視 + 雙語簡報 + 測試的模式。

執行方法論:brainstorming → writing-plans → subagent-driven-development → finishing-a-development-branch。

## 方法清單

新增 **5 個方法**,放入新的 `patterns-architectural` 子 group:

| id | 標題 | C++ 檔 |
|---|---|---|
| `pattern-mvc` | MVC (Model-View-Controller) | `pattern_mvc.cpp` |
| `pattern-layered` | Layered Architecture | `pattern_layered.cpp` |
| `pattern-pubsub` | Publish-Subscribe | `pattern_pubsub.cpp` |
| `pattern-pipefilter` | Pipe-and-Filter | `pattern_pipefilter.cpp` |
| `pattern-di` | Dependency Injection | `pattern_di.cpp` |

`patternModeSelect` 的 option value 分別為 `mvc` / `layered` / `pubsub` / `pipefilter` / `di`(`renderPattern()` 以 `currentMode.replace('pattern-', '')` 取得 mode)。

## 架構決策

沿用既有 Design Patterns 分類機制(與 GoF 6 模式、OOP 擴充相同):靜態 `<div id="pattern-*-view" class="pattern-view hidden">` 檢視 + `<svg>`,`renderPattern()` 依 mode dispatch,`patternModeSelect` 切換,共用「Visualize Pattern」按鈕。SVG 元件圖重用 OOP 擴充已併入的 `drawOopBox` / `drawOopLine` / `drawOopLabel` / `oopSvgEl` 通用輔助函式。

新增 `METHOD_GROUPS` 子 group `patterns-architectural`(`title: 'Architectural'`、`parent: 'patterns'`、`parentTitle: 'Design Patterns'`),附加在 `patterns-behavioral` 之後。`renderCategoryNav` 與 `setActiveCategory`(PR #62)無需改動 —— 它們已遍歷所有帶 `parent` 的 group。

不改 `renderPattern` 與 `updateLayout` 的既有 pattern 邏輯結構,只在其中加入新方法的 dispatch / 分支。

## C++ 檔案

各為單一程式內、合作類別的最小教學示範,皆須通過 `g++ -std=c++17 -fsyntax-only`。

- **`pattern_mvc.cpp`** — `Model`(持有資料、提供 getter/setter)、`View`(讀 Model 並渲染)、`Controller`(接收輸入、更新 Model)。`main()` 串接三者,示範一次「輸入 → Controller 更新 Model → View 重新渲染」。
- **`pattern_layered.cpp`** — `DataLayer`(回傳資料)、`BusinessLayer`(呼叫 `DataLayer`、套用規則)、`PresentationLayer`(呼叫 `BusinessLayer`、格式化輸出)。每層只持有並呼叫下一層。`main()` 從 `PresentationLayer` 觸發。
- **`pattern_pubsub.cpp`** — `EventBus`(`subscribe(callback)` / `publish(event)`)、`Publisher`(透過 bus 發事件)、數個 `Subscriber`(註冊 callback)。`main()` 註冊 2 個訂閱者、publish 一個事件,兩者皆收到;發布端與訂閱端無直接引用。
- **`pattern_pipefilter.cpp`** — `Filter` 抽象介面(`process(input) -> output`)、數個具體 filter(如 trim / to-upper / 加前綴)、`Pipeline`(依序串接 filter)。`main()` 讓一筆資料流經整條 pipeline。
- **`pattern_di.cpp`** — `Service` 抽象介面、`ConsoleService` 具體實作、`Consumer`(建構子接收 `Service&` 或 `Service*`,不自行 `new`)。`main()` 作為 composition root 建構具體 Service 並注入 `Consumer`;以註解對比「在 Consumer 內 `new` 具體類別」的緊耦合寫法。

## 視覺化器

每個方法在 `index.html` 的 `#pattern-visualization` 內新增一個 `<div id="pattern-*-view" class="pattern-view hidden">`(含 `<h3>`、`<svg id="pattern-*-svg">`、legend),`renderPattern()` 新增 dispatch 分支呼叫對應 render 函式。render 函式以 `drawOopBox` 等輔助函式繪製 SVG。

- **`renderPatternMVC`** — Model / View / Controller 三方框成三角佈局;箭頭:Controller → Model(updates)、Model → View(notifies)、View → Controller(user input)。
- **`renderPatternLayered`** — Presentation / Business / Data 三層垂直堆疊;相鄰層之間向下箭頭,標註「每層只呼叫下一層」。
- **`renderPatternPubSub`** — 左側 Publisher 方框 → 中間 EventBus 方框 → 右側 3 個 Subscriber 方框;箭頭:Publisher → EventBus(publish)、EventBus → 各 Subscriber(notify);標註發布/訂閱端無直接引用。
- **`renderPatternPipeFilter`** — 水平鏈:Input → Filter A → Filter B → Filter C → Output,各方框以箭頭(pipe)相連。
- **`renderPatternDI`** — Injector / Composition Root 方框,箭頭指向它建構的具體 Service 方框,再以「inject」箭頭指向 Consumer 方框;Consumer 下方標註「依賴 Service 介面,不自行 new」。

新方法為靜態元件圖視覺化器:render 函式在方法載入時(經 `renderAll` → `renderPattern`)繪製完整圖。「Visualize Pattern」按鈕(`btn-pattern-demo`)的 handler 在開頭即呼叫 `renderAll`,因此對新方法等同重繪;預期不需改動該 handler(實作時驗證:若 handler 對既有 6 模式有 if/else 動畫分支,新方法落入無分支、僅重繪,與 OOP 擴充相同)。

## 整合檢查清單(每個方法)

1. `build_db.js` 加入 `.cpp → code 常數` mapping(`codePatternMVC` / `codePatternLayered` / `codePatternPubSub` / `codePatternPipeFilter` / `codePatternDI`)——須先於 `.cpp` 建立。
2. `METHOD_GROUPS` 新增 `patterns-architectural` 子 group(僅一次),含 5 個方法條目。
3. `getCodeForMethod` 加入 5 個 mapping。
4. `index.html` 的 `#pattern-visualization` 內新增 5 個 `pattern-*-view` 檢視。
5. `patternModeSelect`(`#pattern-mode-select`)新增 5 個 `<option>`。
6. `updateLayout` 的 `currentMode.includes('pattern-')` 分支新增 5 個 `else if`(設 `codeTitle` / `codeDisplay`、un-hide 對應檢視、設 `patternModeSelect.value`)。
7. `renderPattern()` 新增 5 個 dispatch 分支。
8. 在 `app.js` 實作 5 個 render 函式。
9. 新增 CSS(若需要,附加至 `style.css` 末端,沿用 `pattern-` 命名前綴)。

## 簡報

**5 份新雙語(zh/en)8 頁簡報**,`category: "Design Patterns"`,結構同既有參考 deck:

1. 概述(paragraph)
2. 核心概念(paragraph + bullets)
3. 運作流程(steps + mermaid)
4. 示意圖(svg + note)
5. 取捨與使用時機(table + 說明)
6. 程式碼(code,`lang: cpp`)
7. 優缺點與使用時機(bullets)
8. 小結(bullets)

架構模式無演算法式 big-O,第 5 頁框為「取捨與使用時機」(耦合度、可測試性、複雜度、適用情境)。

各 deck 重點:
- `pattern-mvc` — 關注點分離;Model / View / Controller 三角色與資料流;UI 架構的經典基礎。
- `pattern-layered` — 分層、相依方向只能向下、n-tier;易理解但可能逐層轉手。
- `pattern-pubsub` — 透過 broker / event bus 解耦;事件、一對多扇出;發布端不知訂閱端。
- `pattern-pipefilter` — 可組合的轉換階段、串流處理;每個 filter 單一職責、可重排。
- `pattern-di` — 控制反轉(IoC);建構子注入;大幅提升可測試性(可注入 mock);composition root 概念。

簡報的 mermaid 須用 `flowchart`、矩形 `[...]` 節點(不可用 `([...])` stadium 節點 —— 渲染不確定會破壞 `build:slides` 冪等性);LaTeX 反斜線在 JS 字串中寫 `\\`;中文用全形標點;視覺化圖表呈現完整資料。

## 測試

- 每個方法 1 個 Playwright render 測試(共 5 個),比照既有 pattern 測試:載入方法(`loadMethod` 在 PR #62 已支援 sub-tab,Architectural tab 自動可達)→ 斷言 card active + 檔名 + 對應 `pattern-*-svg` 有繪製內容(`rect` 數量)。
- 最終 `npm run test:all`:115 → **120**(44 unit + 76 Playwright)。
- 冪等性:`npm run format:code` 與 `npm run build:slides` 重跑後 `git status` 乾淨。
- 手動驗證:瀏覽器開啟,Design Patterns 出現第 4 個 sub-tab「Architectural」,5 個方法各自渲染對應元件圖。

## 不在範圍內

- 不適合單一程式示範的架構模式(Microservices、Client-Server 等跨行程/網路模式)。
- 其他 sub-tab 或分類的調整。
- GoF patterns 的後續 Batch(Builder、Abstract Factory 等)——獨立 spec。

## 預期產出

5 個新方法、5 個 `.cpp` 檔、新的 `patterns-architectural` 子 group(第 4 個 sub-tab)、5 個 render 函式、5 份雙語簡報、5 個新 Playwright 測試。
