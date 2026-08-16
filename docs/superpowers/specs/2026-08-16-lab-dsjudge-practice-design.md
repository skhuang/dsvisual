# dsvisual「Practice on dsjudge」登入後練習 設計文件(sub-project C)

- 日期:2026-08-16
- Repo:`dsvisual`(vanilla JS + GitHub Pages;branch `feat/lab-dsjudge-practice`)
- 動機:dsvisual↔dsjudge↔maccount 整合的 sub-project C。dsvisual Lab 已預留「Practice on dsjudge」按鈕(`js/lab.js`,目前僅以 `lab.dsjudgeUrl` 是否存在決定 enabled/disabled)。B2 完成後 dsvisual 已能以 maccount 登入取得身分。C 把該按鈕接上 dsjudge 公開題庫 `/bank/<slug>`,並**以 maccount 登入為前提**:未登入時提供「登入後練習」入口,登入後才給出開啟題庫的連結。

## 0. 範圍與決策(已與使用者確認)

- **交付「機制」為主**:C 實作 lab.js 的三態「Practice on dsjudge」控制 + i18n 文案 + 測試。這是可重用機制,未來所有 lab 與 08-19 dijkstra go-live 都用它。
- **dijkstra 資料時序(決策 1)**:dijkstra 是目前唯一的 lab,其題庫在 dsjudge 端 `bank.public:false`,held until **2026-08-19**。因此 **C 不設定 dijkstra 的 `dsjudgeUrl`(維持 null)**,以免登入使用者在 08-19 前點到尚未公開的題目。真正的資料上線(填 dijkstra `dsjudgeUrl` + 翻 `bank.public:true`)是 **08-19 協調 go-live**,不在 C build 內。C 以**測試 fixture**(帶 `dsjudgeUrl` 的假 lab)驗證三態。
- **未登入點擊行為(決策 2)**:未登入態的按鈕直接呼叫 `client.signIn()`(整頁導向 maccount,登入後 return 回同一 URL)。不依賴 sign-in drawer。
- **C 僅 dsvisual 端**;dsjudge `/bank` 已於 sub-project A 完成。
- **join key 已對齊**:lab `slug`(如 `dijkstra`)= dsjudge 題庫 `pid`(`problems/<pid>/`);題庫單題 URL = `https://ds2026summer.cs.nycu.edu.tw/bank/<slug>`。

## 1. 現況(已查證)

- `js/lab.js`:IIFE 匯出 `window.LabViewer = { open, close }`。`render()`(29-50)以 `body.innerHTML` **整段重建**;動作列(45-48)含主連結 `lab-open-repo`(→ `lab.repoUrl`)與預留的 `dsjudgeControl`(37-39,testid `lab-dsjudge`)。目前 `dsjudgeControl` 只有兩態:有 `dsjudgeUrl` → enabled `<a>`;無 → disabled `<button>`(文案 `lab.dsjudgeSoon`)。`open(methodId)`(52-61)取 `global.LAB_RENDERED[methodId][0]`(pilot 只開第一題),設 `state`,呼叫 `render()`,顯示 overlay。`close()`(63)隱藏並 `state=null`。**目前沒有任何 auth 訂閱**。
- i18n:`lab.dsjudgeSoon` en「Practice on dsjudge (coming soon)」(`js/i18n.js:188`)、zh「到 dsjudge 練習(即將推出)」(`:453`)。
- maccount client(`js/cloud-integration.js`,B2):`window.cloudClient()` → `{ isConfigured, getUser, subscribeAuthState, signIn, signOut, ... }`;`getUser()` → `{ student_id, providers } | null`;`subscribeAuthState(cb)` 立即以現況呼叫一次、之後變動時再呼叫,回 unsubscribe;未設定/`file://` → stub(`isConfigured:false`,`getUser→null`,`signIn` no-op)。
- 資料:`labs/labs.json`(源)→ `js/labs_rendered.js`(**生成檔**,`npm run build:labs`)。唯一 lab:method `graph-dijkstra` → `[{ slug:"dijkstra", repoUrl:".../ds2026-lab-dijkstra", dsjudgeUrl:null, ... }]`。
- dsjudge:`/bank/<pid>`(`app/bank.py`),公開需 `bank.public:true && status:ready`;目前僅 `arrays-warmup` 公開,`dijkstra` held false until 2026-08-19。

## 2. 設計

### 2.1 三態「Practice on dsjudge」控制(`js/lab.js` `render()`)

依 `lab.dsjudgeUrl` 與登入態決定(在 `render()` 內以 `global.cloudClient` 取得 client、`client.getUser()` 取得 user):

- **A. 無 `dsjudgeUrl`** → disabled `<button data-testid="lab-dsjudge" disabled aria-disabled="true">`,文案 `lab.dsjudgeSoon`(維持現況)。
- **B. 有 `dsjudgeUrl`,已設定 client 且未登入**(`client && client.isConfigured && !user`)→ `<button data-testid="lab-dsjudge-signin">`,文案 `lab.dsjudgeSignin`(「登入後到 dsjudge 練習 / Sign in to practice on dsjudge」);點擊呼叫 `client.signIn()`。
- **C. 有 `dsjudgeUrl` 且(已登入,或 client 未設定)**(`user` 存在,或 `!client || !client.isConfigured`)→ enabled `<a data-testid="lab-dsjudge" href="<dsjudgeUrl>" target="_blank" rel="noopener">`,文案 `lab.dsjudgePractice`(「到 dsjudge 練習 / Practice on dsjudge」)。
  - 說明:client 未設定(如本機 `file://`)時無法在 dsvisual 端 gate;dsjudge `/bank` 本身仍會強制登入,故 fallback 顯示連結是安全的。

點擊處理:每次 `render()` 重建 innerHTML 後,若存在 `[data-testid="lab-dsjudge-signin"]`,綁一次 `click` → `client.signIn()`。

### 2.2 登入態變動即時重繪(訂閱/退訂)

- `open()`:顯示後,以 `client.subscribeAuthState(function () { if (state) render(); })` 訂閱,unsubscribe 存於 `state.unsub`。(訂閱本身會立即以現況呼叫一次 → 觸發一次 render,無害。)只在有 client 時訂閱。
- `close()`:若 `state.unsub` 存在則呼叫並清除,再 `state=null`。避免關閉後殘留訂閱造成對已隱藏 overlay 的 render。
- 效果:使用者在 lab 抽屜開著時登入/登出(理論上 signIn 會整頁導向,但登出或跨分頁狀態變動仍可能發生),按鈕 B↔C 即時切換。

### 2.3 i18n(`js/i18n.js`)

en 與 zh 各新增兩鍵(保留 `lab.dsjudgeSoon`):
- `lab.dsjudgePractice`:en「Practice on dsjudge」/ zh「到 dsjudge 練習」。
- `lab.dsjudgeSignin`:en「Sign in to practice on dsjudge」/ zh「登入後到 dsjudge 練習」。

### 2.4 資料(`labs/labs.json`)

- **不改**:dijkstra `dsjudgeUrl` 維持 `null`(決策 1)。C 不動 `labs/labs.json`,故 `js/labs_rendered.js`(生成檔)不變、無需 rebuild。
- 08-19 go-live(不在 C build 內,見 §6)才填 `dsjudgeUrl` 並 rebuild。

## 3. 檔案清單(dsvisual)

- 修改:`js/lab.js`(三態控制 + signIn 綁定 + auth 訂閱/退訂)、`js/i18n.js`(兩鍵 × en/zh)。
- 測試:`tests/lab-dsjudge.spec.js`(Playwright)。
- 不動:`labs/labs.json`、`js/labs_rendered.js`(生成檔)、其他生成檔(`js/code_db.js`/`js/quiz_rendered.js`/`js/slides_rendered.js`)、cloud-* 模組、viz、slides/quiz 管線。無需新 CSS(重用 `.btn secondary`)。

## 4. 測試(`tests/lab-dsjudge.spec.js`,Playwright)

以 `page.addInitScript`(在 app 腳本前)注入:
- fixture `window.LAB_RENDERED`,含一個 method(如 `fixture-method`)→ 一個帶 `dsjudgeUrl:'https://ds2026summer.cs.nycu.edu.tw/bank/fixture'` 的 lab(含 `titleZh/titleEn/statementHtml/samples/repoUrl` 等必要欄位),以及一個 `dsjudgeUrl:null` 的 method 驗 A 態。
- 假 `window.cloudClient`:以 **locked getter/no-op setter** 定義(避免 `cloud-integration.js` 載入時 `window.cloudClient = ...` 覆蓋;比照 B2 Task 3 測試作法),可切換 logged-in/out,並實作 `subscribeAuthState`(存 cb,提供觸發)、`signIn`(記錄被呼叫)、`isConfigured:true`、`getUser`。

案例:
1. **A 態**:`dsjudgeUrl:null` 的 lab → `LabViewer.open('null-method')` → `[data-testid="lab-dsjudge"]` 是 disabled `<button>`。
2. **B 態(未登入)**:登出 client + 有 `dsjudgeUrl` → open → 出現 `[data-testid="lab-dsjudge-signin"]`,無 enabled 連結;點它 → `client.signIn()` 被呼叫一次。
3. **C 態(已登入)**:登入 client + 有 `dsjudgeUrl` → open → `[data-testid="lab-dsjudge"]` 是 `<a>` 且 `href` = fixture bank URL、`target="_blank"`;無 sign-in 按鈕。
4. **即時切換**:B 態開著 → 觸發 `subscribeAuthState` callback 使 `getUser()` 回身分 → 按鈕重繪為 C 態(`<a>` 連結出現、sign-in 按鈕消失)。
5. **client 未設定 fallback**:`isConfigured:false`(或無 `window.cloudClient`)+ 有 `dsjudgeUrl` → open → 顯示 enabled `<a>`(C 態 fallback),不顯示 sign-in 按鈕。
6. **退訂**:open 後 `close()` → 之後觸發 auth callback 不對已隱藏 overlay 重繪(斷言 `close()` 後 `state` 清除/overlay hidden 且不報錯;可用 spy 確認 unsubscribe 被呼叫或 render 不再更新 body)。

回歸:`npm run test:all` 綠;既有 `tests/*lab*`(如 lab open/statement/samples/repo)不退化;生成檔未動。

## 5. 驗收標準

- 有 `dsjudgeUrl` 的 lab:未登入顯示「登入後練習」按鈕(點擊觸發 maccount 登入);登入後顯示開啟 `/bank/<slug>` 的連結(新分頁)。無 `dsjudgeUrl` 維持「coming soon」disabled。
- 登入態變動時按鈕即時切換;關閉抽屜正確退訂。
- client 未設定時安全 fallback 顯示連結(dsjudge 端自行 gate)。
- 不動生成檔與其他管線;`npm run test:all` 綠。

## 6. 08-19 go-live(協調步驟,**不在 C build 內**,記錄備忘)

到 2026-08-19(dijkstra graded lab window 結束後):
1. dsjudge:`problems/dijkstra/meta.yaml` 的 `bank.public` 由 `false` 改 `true`(重新索引/部署題庫)。
2. dsvisual:`labs/labs.json` 的 dijkstra `dsjudgeUrl` 設為 `https://ds2026summer.cs.nycu.edu.tw/bank/dijkstra`,`npm run build:labs` 重生 `js/labs_rendered.js`,部署。
兩者需同批上線,確保連結點下去時題目已公開。

## 7. 風險與緩解

- **登入導向後不自動重開 lab 抽屜**:`signIn()` 整頁導向,return 後頁面重載、lab overlay 為關閉態,使用者需重開 lab。屬已知小 UX 限制(hash-preservation 後續 task 可改善回到方法 viz);非阻斷。
- **stub 覆蓋**:測試用 locked-getter stub 對抗 `cloud-integration.js` 的 `window.cloudClient` 重指派(B2 已知模式)。
- **訂閱洩漏**:`close()` 必退訂;`render()` 每次重綁 sign-in click(節點皆新)。
- **未公開題目**:決策 1 使 dijkstra `dsjudgeUrl` 於 08-19 前維持 null,避免死連結;go-live 兩端同批上線。
- **範圍**:僅 dsvisual lab.js/i18n + 測試;不動題庫、生成檔、其他管線。
